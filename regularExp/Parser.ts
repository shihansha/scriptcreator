import * as AST from "./AST"
import { ASTBuilder } from "./ASTBuilder"

function getInputCharset(n: AST.Node | AST.Leaf, charset: Map<string, number[]> = new Map()) {
    if (n instanceof AST.Node) {
        n.children.forEach(a => getInputCharset(a, charset));
    }
    else {
        if (n.value !== "empty" && n.value !== "eof") {
            if (!charset.has(n.value)) {
                charset.set(n.value, []);
            }
            charset.get(n.value)!.push(n.index);
        }
    }

    return charset;
}

function markOrder(n: AST.Node | AST.Leaf, indexArr: AST.Leaf[] = []) {
    if (n instanceof AST.Leaf) {
        if (n.value !== "empty") {
            n.index = indexArr.length;
            indexArr.push(n);
        }
    }
    else {
        n.children.forEach(a => markOrder(a, indexArr));
    }

    return indexArr;
}

function calcNullable(n: AST.Node | AST.Leaf) {

    // post order
    if (n instanceof AST.Leaf) {
        n.nullable = isNullable(n);
        return;
    }
    else { // AST.Node
        n.children.forEach(a => calcNullable(a));
        n.nullable = isNullable(n);
    }

    function isNullable(n: AST.Leaf | AST.Node) {
        if (n instanceof AST.Leaf) {
            if (n.index === -1) { // empty
                return true;
            }
            else {
                return false;
            }
        }
        else { // AST.Node
            if (n.op === "OR") {
                return n.children[0].nullable || n.children[1].nullable;
            }
            else if (n.op === "CAT") {
                return n.children[0].nullable && n.children[1].nullable;
            }
            else { // STAR
                return true;
            }
        }
    }
}

function calcFirstpos(n: AST.Leaf | AST.Node) {
    if (n instanceof AST.Leaf) {
        n.firstpos = getFirstpos(n);
    }
    else {
        n.children.forEach(a => calcFirstpos(a));
        n.firstpos = getFirstpos(n);
    }

    function getFirstpos(n: AST.Leaf | AST.Node): Set<number> {
        if (n instanceof AST.Leaf) {
            if (n.index === -1) {
                return new Set();
            }
            else {
                return new Set([n.index]);
            }
        }
        else {
            if (n.op === "OR") {
                return new Set([...n.children[0].firstpos, ...n.children[1].firstpos]);
            }
            else if (n.op === "CAT") {
                if (n.children[0].nullable) {
                    return new Set([...n.children[0].firstpos, ...n.children[1].firstpos]);
                }
                else {
                    return n.children[0].firstpos;
                }
            }
            else { // STAR
                return n.children[0].firstpos;
            }
        }

    }
}

function calcLastpos(n: AST.Leaf | AST.Node) {
    if (n instanceof AST.Leaf) {
        n.lastpos = getLastpos(n);
    }
    else {
        n.children.forEach(a => calcLastpos(a));
        n.lastpos = getLastpos(n);
    }

    function getLastpos(n: AST.Leaf | AST.Node): Set<number> {
        if (n instanceof AST.Leaf) {
            if (n.index === -1) {
                return new Set();
            }
            else {
                return new Set([n.index]);
            }
        }
        else {
            if (n.op === "OR") {
                return new Set([...n.children[0].lastpos, ...n.children[1].lastpos]);
            }
            else if (n.op === "CAT") {
                if (n.children[1].nullable) {
                    return new Set([...n.children[0].lastpos, ...n.children[1].lastpos]);
                }
                else {
                    return n.children[1].lastpos;
                }
            }
            else { // STAR
                return n.children[0].lastpos;
            }
        }

    }
}

function calcFollowpos(n: AST.Leaf | AST.Node, indexArr: AST.Leaf[]) {
    if (n instanceof AST.Leaf) return;

    if (n.op === "CAT") {
        n.children[0].lastpos.forEach(i => indexArr[i].followpos = new Set([...indexArr[i].followpos, ...n.children[1].firstpos]));
    }
    else if (n.op === "*") {
        n.lastpos.forEach(i => indexArr[i].followpos = new Set([...indexArr[i].followpos, ...n.firstpos]));
    }

    n.children.forEach(a => calcFollowpos(a, indexArr));
}

function genDFA(ast: AST.Node, indexArr: AST.Leaf[], charset: Map<string, number[]>) {
    const dstates = [{ arr: [...ast.firstpos], flag: false }];
    let from: number;
    let dtrans: { from: number, onChar: string, to: number }[] = [];
    while ((from = dstates.findIndex(a => !a.flag)) !== -1) {
        let s = dstates[from];
        s.flag = true;
        charset.forEach((v, k) => {
            let u = [...v.filter(a => s!.arr.indexOf(a) !== -1)
                .reduce((arr, a) => new Set([...indexArr[a].followpos, ...arr]), new Set<number>())];
            let id = indexOfDstate(u);
            if (id === -1) {
                dstates.push({ arr: u, flag: false });
                id = dstates.length - 1;
            }
            dtrans.push({ from: from, onChar: k, to: id });
        });
    }

    let accept: number[] = [];
    dstates.forEach((a, i) => {
        if (a.arr.indexOf(indexArr.length - 1) !== -1) {
            accept.push(i);
        }
    })

    let newMap: Map<string, number>[] = dstates.map(() => new Map());
    dtrans.forEach(a => newMap[a.from].set(a.onChar, a.to));
    return { map: newMap, acc: accept };

    function indexOfDstate(arr: number[]) {
        return dstates.findIndex(a => {
            if (arr.length !== a.arr.length) return false;
            return arr.every(b => a.arr.indexOf(b) !== -1);
        });
    }
}

export function parseAST(str: string) {
    const astBuilder = new ASTBuilder(str);
    const ast = astBuilder.run();
    if (ast === null) {
        return;
    }

    const extended = new AST.Node("CAT", ast, new AST.Leaf("eof"));

    // step 1
    const indexArr = markOrder(extended);

    // step 2
    calcNullable(extended);

    // step 3
    calcFirstpos(extended);
    calcLastpos(extended);

    // step 4
    calcFollowpos(extended, indexArr);

    // step 5
    const charset = getInputCharset(extended);

    // step 6
    return genDFA(extended, indexArr, charset);
}

export function testAST(dfa: ReturnType<typeof genDFA>, str: string) {
    let cur = 0;
    for (const c of str) {
        let entry = dfa.map[cur];
        if (entry.has(c)) {
            cur = entry.get(c)!;
            continue;
        }
        else if (entry.has("\\w")) {
            if (isCharacter(c) || isNumber(c) || c === "_") {
                cur = entry.get("\\w")!;
                continue;
            }
        }
        else if (entry.has("\\d")) {
            if (isNumber(c)) {
                cur = entry.get("\\d")!;
                continue;
            }
        }
        
        return false;
    }

    if (dfa.acc.indexOf(cur) !== -1) {
        return true;
    }
    else {
        return false;
    }

    function isNumber(c: string) {
        return c >= "0" && c <= "9";
    }

    function isCharacter(c: string) {
        return (c >= "A" && c <= "Z") || (c >= "a" && c <= "z");
    }
}