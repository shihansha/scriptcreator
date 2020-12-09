import * as AST from "./AST"
import { ASTBuilder } from "./ASTBuilder"



function splitRanges(n: AST.Node) {
    let leaves = searchLeaves(n);
    let mapped = AST.splitRanges(leaves);
    pushBackLeaves(n, mapped);

    function searchLeaves(n: AST.Node, buffer: (string | AST.CharRange)[] = []) {
        n.children.forEach(a => {
            if (a instanceof AST.Node) {
                searchLeaves(a, buffer);
            }
            else if (a.value !== "eof" && a.value !== "empty") {
                buffer.push(a.value);
            }
        });
        return buffer;
    }

    function pushBackLeaves(n: AST.Node, toPush: typeof mapped, buffer = { index: 0 }) {
        for (let i = 0; i < n.children.length; i++) {
            let c = n.children[i];
            if (c instanceof AST.Node) {
                pushBackLeaves(c, toPush, buffer);
            }
            else if (c.value !== "eof" && c.value !== "empty") {
                let map = mapped[buffer.index];
                buffer.index = buffer.index + 1;
                let res: AST.Node | AST.Leaf | undefined = undefined;
                for (const m of map) {
                    if (res === undefined) res = new AST.Leaf(m);
                    else {
                        res = new AST.Node("OR", res, new AST.Leaf(m));
                    }
                }
                n.children[i] = res!;
            }
        }
    }
}

function getInputCharset(n: AST.Node | AST.Leaf, charset: Map<string | AST.CharRange, number[]> = new Map()) {
    if (n instanceof AST.Node) {
        n.children.forEach(a => getInputCharset(a, charset));
    }
    else {
        let nValue = n.value;
        if (typeof nValue !== 'string' || (nValue !== "empty" && nValue !== "eof")) {
            if (!charset.has(nValue)) {
                charset.set(nValue, []);
            }
            charset.get(nValue)!.push(n.index);
        }
    }

    return charset;
}

function markOrder(n: AST.Node | AST.Leaf, indexArr: AST.Leaf[] = [], accArr: number[] = []) {
    if (n instanceof AST.Leaf) {
        if (n.value !== "empty") {
            n.index = indexArr.length;
            indexArr.push(n);
            if (n.value === "eof") {
                accArr.push(indexArr.length - 1);
            }
        }
    }
    else {
        n.children.forEach(a => markOrder(a, indexArr, accArr));
    }

    return [indexArr, accArr] as [AST.Leaf[], number[]];
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

function genDFA(ast: AST.Node, indexArr: AST.Leaf[], charset: Map<string | AST.CharRange, number[]>, accArr: number[]) {
    const dstates = [{ arr: [...ast.firstpos], flag: false }];
    let from: number;
    let dtrans: { from: number, onChar: string | AST.CharRange, to: number }[] = [];
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
    let accept: Map<number, number[]> = new Map();
    dstates.forEach((a, i) => {
        a.arr.forEach(n => {
            let id = accArr.indexOf(n);
            if (id !== -1) {
                if (!accept.has(i)) accept.set(i, []);
                accept.get(i)!.push(id);
            }
        });
    });

    let newMap: Map<string | AST.CharRange, number>[] = dstates.map(() => new Map());
    dtrans.forEach(a => newMap[a.from].set(a.onChar, a.to));

    let firstAcc: Map<number, number> = new Map();
    accept.forEach((v, k) => {
        firstAcc.set(k, v.sort()[0]);
    })

    return { map: newMap, acc: firstAcc };

    function indexOfDstate(arr: number[]) {
        return dstates.findIndex(a => {
            if (arr.length !== a.arr.length) return false;
            return arr.every(b => a.arr.indexOf(b) !== -1);
        });
    }
}

export function parseASTs(strArr: string[]) {
    let ast = strArr.map(s => new ASTBuilder(s).run());
    if (ast.some(a => a === null)) return;
    let extended = ast.map(a => new AST.Node("CAT", a!, new AST.Leaf("eof")));
    let merged = extended.reduce((r, a) => new AST.Node("OR", r, a));
    return innerParseAST(merged);
}

export function parseAST(str: string) {
    const astBuilder = new ASTBuilder(str);
    const ast = astBuilder.run();
    if (ast === null) {
        return;
    }

    const extended = new AST.Node("CAT", ast, new AST.Leaf("eof"));
    return innerParseAST(extended);
}

function innerParseAST(ast: AST.Node) {
    // split all ranges:
    splitRanges(ast);

    // step 1
    const [indexArr, accArr] = markOrder(ast);

    // step 2
    calcNullable(ast);

    // step 3
    calcFirstpos(ast);
    calcLastpos(ast);

    // step 4
    calcFollowpos(ast, indexArr);

    // step 5
    const charset = getInputCharset(ast);

    // step 6
    return genDFA(ast, indexArr, charset, accArr);
}

export function searchAST(dfa: ReturnType<typeof genDFA>, str: string, startpos: number = 0) {
    let cur = 0;
    let accept: { regExpIdx: number, consumedLetterNum: number }[] = [];
    for (let idx = startpos; idx < str.length; idx++) {
        const c = str[idx];
        let entry = dfa.map[cur];
        if (entry.has(c)) {
            cur = entry.get(c)!;
            if (dfa.acc.has(cur)) {
                accept.push({ regExpIdx: dfa.acc.get(cur)!, consumedLetterNum: idx - startpos + 1 });
            }
            continue;
        }
        else { // astrange
            let ranges = [...entry.keys()].filter(a => a instanceof AST.CharRange) as AST.CharRange[];
            let matched = ranges.find(a => a.inRange(c));
            if (matched) {
                cur = entry.get(matched)!;
                if (dfa.acc.has(cur)) {
                    accept.push({ regExpIdx: dfa.acc.get(cur)!, consumedLetterNum: idx - startpos + 1 });
                }    
                continue;
            }
        }
        
        break;
    }

    if (accept.length === 0) {
        return null;
    }
    else {
        return accept[accept.length - 1];
    }
}