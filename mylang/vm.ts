class VMBlock {
    name: string;
    code: string;
    isJumped: boolean = false;

    constructor(name: string, private func: VMFunction) {
        this.name = name;
        this.code = name + ":";
    }

    private addCode(code: string) {
        code + "\n" + code;
    }

    joinStmt(stmt: VMStmt) {
        if (this.isJumped) throw new Error("Block has been closed.");
        this.addCode(stmt.gen());
        if (stmt.isJumpStmt) this.isJumped = true;
    }

    joinExpAndJump(exp: VMExp, t: VMBlock, f: VMBlock) {
        if (this.isJumped) throw new Error("Block has been closed.");
        let [resc, res] = exp.reduce();
        this.addCode(resc);
        // i1 out = (i1)res;
        let tmp = this.func.newTemp(VMTypeInfo.Bool);
        this.addCode(tmp.toString() + " = cast " + VMTypeInfo.Bool.name + " " + res.toString());

        // print: if out then goto t else goto f
        this.addCode("if " + tmp.toString() + " goto label " + t.name + " else goto label " + f.name);

        this.isJumped = true;
    }

    jump(t: VMBlock) {
        if (this.isJumped) throw new Error("Block has been closed.");
        this.addCode("jump label " + t.name);

        this.isJumped = true;
    }

    retDefault(t: VMTypeInfo) {
        if (this.isJumped) throw new Error("Block has been closed.");
        this.addCode("ret " + t.defaultValString);

        this.isJumped = true;
    }

    gen() {
        if (!this.isJumped) throw new Error("Block should be closed before code generation.");
        return this.code;
    }
}

class VMTypeInfo {
    name: string;
    defaultVal: string;
    constructor(name: string, defaultVal: string) {
        this.name = name;
        this.defaultVal = defaultVal;
    }
    get defaultValString() {
        return this.name + " " + this.defaultVal;
    }
    static Bool: VMTypeInfo = new VMTypeInfo("bool", "false");
    static Void: VMTypeInfo = new VMTypeInfo("void", "");
    static Any: VMTypeInfo = new VMTypeInfo("any", "0")
}

class VMExp {

    reduce(): [string, VMExp] {
        return ["", this];
    }

    gen(): [string, VMExp] {
        return ["", this];
    }

    toString(): string {
        return "";
    }
}

class VMStmt {
    isJumpStmt: boolean = false;

    gen() {
        return "";
    }
}

class VMVar extends VMExp {
    name: string;
    type: VMTypeInfo;
    constructor(name: string, type: VMTypeInfo) {
        super();
        this.name = name;
        this.type = type;
    }

    toString() {
        return this.type.name + " " + this.name;
    }
}

class VMIf {
    condBlock: VMBlock;
    yesBlock: VMBlock | undefined;
    noBlock: VMBlock | undefined;
    nextBlock: VMBlock | undefined;

    constructor(private func: VMFunction) {
        this.condBlock = func.newBlock();

        func.currentBlock.jump(this.condBlock);
        func.currentBlock.gen();

        func.blocks.push(this.condBlock);
    }

    afterCond(exp: VMExp) {
        this.yesBlock = this.func.newBlock();
        this.noBlock = this.func.newBlock();
        this.condBlock.joinExpAndJump(exp, this.yesBlock, this.noBlock);
        this.condBlock.gen();

        this.func.blocks.push(this.yesBlock);
    }

    endIfWithoutElse() {
        if (!this.yesBlock!.isJumped) this.yesBlock!.jump(this.noBlock!);
        this.yesBlock!.gen();

        this.func.blocks.push(this.noBlock!);
    }

    beforeElse() {
        this.nextBlock = this.func.newBlock();
        if (!this.yesBlock!.isJumped) this.yesBlock!.jump(this.nextBlock);
        this.yesBlock!.gen();

        this.func.blocks.push(this.noBlock!);
    }

    endIfWithElse() {
        if (!this.noBlock!.isJumped) this.noBlock!.jump(this.nextBlock!);
        this.noBlock!.gen();

        this.func.blocks.push(this.nextBlock!);
    }
}

class VMWhile {
    condBlock: VMBlock;
    loopBlock: VMBlock;
    nextBlock: VMBlock;
    constructor(private func: VMFunction) {
        this.condBlock = func.newBlock();
        this.loopBlock = func.newBlock();
        this.nextBlock = func.newBlock();

        func.currentBlock.jump(this.condBlock);
        func.currentBlock.gen();

        func.blocks.push(this.condBlock);
    }

    afterCond(exp: VMExp) {
        this.condBlock.joinExpAndJump(exp, this.loopBlock, this.nextBlock);
        this.condBlock.gen();

        this.func.blocks.push(this.loopBlock);
    }

    afterWhile() {
        this.loopBlock.jump(this.condBlock);
        this.loopBlock.gen();

        this.func.blocks.push(this.nextBlock);
    }
}

class VMFunction {
    vars: VMVar[];
    retType: VMTypeInfo;
    line: number;
    blocks: VMBlock[] = [];
    parent: VMFunction | null;
    tmpsCount: number = 0;
    blockCount = 0;
    thisType: VMTypeInfo;

    ifStack: VMIf[] = [];
    whileStack: VMWhile[] = [];

    capturedFuncName: Set<string> = new Set();
    

    constructor(public name: string, public readonly params: VMVar[], retType: VMTypeInfo, line: number, parent: VMFunction | null, thisType: VMTypeInfo | null) {
        this.vars = params.slice();
        this.thisType ??= VMTypeInfo.Any; 
        this.vars.push(new VMVar("this", this.thisType));

        this.line = line;
        this.parent = parent;
        this.retType = retType;

        this.blocks.push(this.newBlock());
    }

    findVar(name: string) {
        let current: VMFunction | null = this;
        while (current !== null) {
            let found = current.vars.find(a => a.name === name);
            if (found) {
                if (current !== this) {
                    this.capturedFuncName.add(name);
                }
                return [found, current.name];
            }
            else {
                current = current.parent;
            }
        }
        throw new Error(`Name: '${name}' not defined.`);
    }

    pushStmt(stmt: VMStmt) {
        this.currentBlock.joinStmt(stmt);
    }

    get currentBlock() {
        return this.blocks[this.blocks.length - 1];
    }

    newTemp(t: VMTypeInfo): VMVar {
        return new VMVar("temp." + this.tmpsCount++, t);
    }

    newBlock() {
        return new VMBlock("block." + this.blockCount++, this);
    }

    enterIf() {
        this.ifStack.push(new VMIf(this));
    }

    exitIf() {
        this.ifStack.pop();
    }

    get currentIf() {
        return this.ifStack[this.ifStack.length - 1];
    }

    enterWhile() {
        this.whileStack.push(new VMWhile(this));
    }

    exitWhile() {
        this.whileStack.pop();
    }

    get currentWhile() {
        return this.whileStack[this.whileStack.length - 1];
    }

    genFuncDef() {
        let start = `def ${this.retType.name} ${this.name}(${this.params.map(a => a.toString()).join(", ")}, ${this.thisType.name} %this, %Function* %.func) {\n`;
        let end = "\n}\n";
        if (!this.currentBlock.isJumped && this.retType === VMTypeInfo.Void) {
            this.currentBlock.retDefault(VMTypeInfo.Void);
            this.currentBlock.gen();
        }
        return start + this.blocks.reduce((s, c) => s + c.code, "") + end;
    }

    genFuncObj() {

    }
}

class VMEnv {
    functionStack: VMFunction[] = [];
    functions: Map<string, VMFunction> = new Map();

    constructor() {
        let main = new VMFunction(".main", [], VMTypeInfo.Void, 0, null, null);
        this.functionStack.push(main);
    }

    get currentFunc() {
        return this.functionStack[this.functionStack.length - 1];
    }
}

export function genFunc() {

}

export function genBlock() {
    
}