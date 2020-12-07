
import * as Records from "./Records"
import * as AST from "./AST"

function productE0(stack: Records.RecordType[]) {
    stack.pop();
    let t = new Records.Nonterminal(3);
    let ts = new Records.Synthesize(3, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = this.vals["val"];
    })
    let ep = new Records.Nonterminal(2);
    let eps = new Records.Synthesize(2, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["syn"];
    })
    stack.push(eps, ep, ts, t);
}

function productEp0(stack: Records.RecordType[]) {
    let par = stack.pop() as Records.Nonterminal;
    let lit0 = new Records.Terminal("|");
    let t = new Records.Nonterminal(3);
    let ts = new Records.Synthesize(3, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = new AST.Node("OR", par.inhs["inh"], this.vals["val"]);
    });
    let ep = new Records.Nonterminal(2);
    let eps = new Records.Synthesize(2, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["syn"] = this.vals["syn"];
    })
    stack.push(eps, ep, ts, t, lit0);
}

function productEp1(stack: Records.RecordType[]) {
    let par = stack.pop() as Records.Nonterminal;
    (stack[stack.length - 1] as Records.Synthesize).vals["syn"] = par.inhs["inh"];
}

function productT0(stack: Records.RecordType[]) {
    stack.pop();
    let u = new Records.Nonterminal(5);
    let us = new Records.Synthesize(5, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = this.vals["val"];
    });
    let tp = new Records.Nonterminal(4);
    let tps = new Records.Synthesize(4, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["syn"];
    })
    stack.push(tps, tp, us, u);
}

function productTp0(stack: Records.RecordType[]) {
    let par = stack.pop() as Records.Nonterminal;
    let u = new Records.Nonterminal(5);
    let us = new Records.Synthesize(5, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = new AST.Node("CAT", par.inhs["inh"], this.vals["val"]);
    });
    let tp = new Records.Nonterminal(4);
    let tps = new Records.Synthesize(4, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["syn"] = this.vals["syn"];
    })
    stack.push(tps, tp, us, u);
}

function productTp1(stack: Records.RecordType[]) {
    let par = stack.pop() as Records.Nonterminal;
    (stack[stack.length - 1] as Records.Synthesize).vals["syn"] = par.inhs["inh"];
}

function productU0(stack: Records.RecordType[]) {
    stack.pop();
    let a = new Records.Nonterminal(7);
    let as = new Records.Synthesize(7, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 2] as Records.Synthesize).vals["val"] = this.vals["val"];
    });
    let up = new Records.Nonterminal(6);
    let ups = new Records.Synthesize(6, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        let type: AST.TYPE_OP;
        if (type = this.vals["type"]) {
            if (type === "*") {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = new AST.Node(this.vals["type"], this.vals["val"]);
            }
            else if (type === "+") {
                let org = this.vals["val"];
                let orgClone = org.clone();
                let star = new AST.Node("*", orgClone);
                let cat = new AST.Node("CAT", org, star);
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = cat;
            }
            else if (type === "?") {
                let org = this.vals["val"];
                let empty = new AST.Leaf("empty");
                let or = new AST.Node("OR", org, empty);
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = or;
            }
        }
        else {
            (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["val"];
        }
    })
    stack.push(ups, up, as, a);
}

function productUp0(stack: Records.RecordType[]) {
    stack.pop();
    let lit0 = new Records.Terminal("*+?", function (this: Records.Terminal, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["type"] = this.value;
    });
    stack.push(lit0);
}

function productUp1(stack: Records.RecordType[]) {
    stack.pop();
    (stack[stack.length - 1] as Records.Synthesize).vals["type"] = undefined;
}

function productA0(stack: Records.RecordType[]) {
    stack.pop();
    let l = new Records.Nonterminal(8);
    let ls = new Records.Synthesize(8, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = new AST.Leaf(this.vals["val"]);
    });
    stack.push(ls, l);
}

function productA1(stack: Records.RecordType[]) {
    stack.pop();
    let lc = new Records.Terminal("(");
    let e = new Records.Nonterminal(1);
    let es = new Records.Synthesize(1, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 2] as Records.Synthesize).vals["val"] = this.vals["val"];
    })
    let rc = new Records.Terminal(")");
    stack.push(rc, es, e, lc);
}

function productA2(stack: Records.RecordType[]) {
    stack.pop();
    let s = new Records.Nonterminal(9);
    let sp = new Records.Synthesize(9, function (this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = new AST.Leaf(this.vals["limit"]);
    });
    stack.push(sp, s);
}

function productLit0(stack: Records.RecordType[]) {
    stack.pop();
    let lit0 = new Records.Terminal("literals", function (this: Records.Terminal, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.value;
    });
    stack.push(lit0);
}

function productLit1(stack: Records.RecordType[]) {
    stack.pop();
    let lit0 = new Records.Terminal("\\");
    let lit1 = new Records.Terminal("specials", function (this: Records.Terminal, stack: Records.RecordType[]) {
        let val: string | AST.CharRange = this.value;
        if (this.value === "\\d") {
            val = new AST.CharRange("a", "z")
                .merge(new AST.CharRange("A", "Z"))
                .merge(new AST.CharRange("0", "9"))
                .merge(new AST.CharRange("_"));
        }
        else if (this.value === "\\w") {
            val = new AST.CharRange("0", "9");
        }
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = val;
    });
    stack.push(lit1, lit0);
}

function productS0(stack: Records.RecordType[]) {
    stack.pop();
    let lit0 = new Records.Terminal("[");
    let b = new Records.Nonterminal(10);
    let bs = new Records.Synthesize(10, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 2] as Records.Synthesize).vals["limit"] = this.vals["limit"];
    });
    let lit1 = new Records.Terminal("]");
    stack.push(lit1, bs, b, lit0);
}

function productB0(stack: Records.RecordType[]) {
    stack.pop();
    let c = new Records.Nonterminal(12);
    let cs = new Records.Synthesize(12, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 3] as Records.Synthesize).vals["limit"] = this.vals["limit"];
    });
    let bp = new Records.Nonterminal(11);
    let bps = new Records.Synthesize(11, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        ((stack[stack.length - 1 - 1] as Records.Synthesize).vals["limit"] as AST.CharRange).merge(this.vals["limit"]);
    });
    stack.push(bps, bp, cs, c);
}

function productBp0(stack: Records.RecordType[]) {
    stack.pop();
    let c = new Records.Nonterminal(12);
    let cs = new Records.Synthesize(12, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 3] as Records.Synthesize).vals["limit"] = this.vals["limit"];
    });
    let bp = new Records.Nonterminal(11);
    let bps = new Records.Synthesize(11, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        ((stack[stack.length - 1 - 1] as Records.Synthesize).vals["limit"] as AST.CharRange).merge(this.vals["limit"]);
    });
    stack.push(bps, bp, cs, c);
}

function productBp1(stack: Records.RecordType[]) {
    stack.pop();
}

function productC0(stack: Records.RecordType[]) {
    stack.pop();
    let lit = new Records.Nonterminal(8);
    let lits = new Records.Synthesize(8, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = this.vals["val"];
    });
    let cp = new Records.Nonterminal(13);
    let cps = new Records.Synthesize(13, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["limit"] = this.vals["limit"];
    });
    stack.push(cps, cp, lits, lit);
}

function productCp0(stack: Records.RecordType[]) {
    let org = stack.pop() as Records.Nonterminal;
    let ter = new Records.Terminal("-");
    let lit = new Records.Nonterminal(8);
    let lits = new Records.Synthesize(8, function(this: Records.Synthesize, stack: Records.RecordType[]) {
        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["limit"] = new AST.CharRange(org.inhs["inh"], this.vals["val"]);
    });
    stack.push(lits, lit, ter);
}

function productCp1(stack: Records.RecordType[]) {
    let org = stack.pop() as Records.Nonterminal;
    (stack[stack.length - 1] as Records.Synthesize).vals["limit"] = new AST.CharRange(org.inhs["inh"]);
}

type ProductionCallbackType = (stack: Records.RecordType[]) => void;
export const M: { [key: string]: ProductionCallbackType | undefined }[] = [
    {},
    { "(": productE0, "literals": productE0, "\\": productE0, '[': productE0 },
    { "|": productEp0, ")": productEp1, "eof": productEp1 },
    { "(": productT0, "literals": productT0, "\\": productT0, '[': productT0 },
    { "|": productTp1, "(": productTp0, ")": productTp1, "literals": productTp0, "\\": productTp0, "eof": productTp1, '[': productTp0 },
    { "(": productU0, "literals": productU0, "\\": productU0, '[': productU0 },
    { "|": productUp1, "*": productUp0, "+": productUp0, "?": productUp0, "(": productUp1, ")": productUp1, "literals": productUp1, "\\": productUp1, "eof": productUp1, '[': productUp1 },
    { "(": productA1, "literals": productA0, "\\": productA0, '[': productA2 },
    { "literals": productLit0, "\\": productLit1 },
    { '[': productS0 },
    { 'literals': productB0, '\\': productB0 },
    { 'literals': productBp0, '\\': productBp0, ']': productBp1 },
    { 'literals': productC0, '\\': productC0 },
    { '-': productCp0, 'literals': productCp1, '\\': productCp1, ']': productCp1 },
];

// TODO: add support for [a-zA-Z].
// grammar: 
// s ::= '[' b ']'
// b ::= b c | c
// c ::= literal '-' literal | literal
// =====>
// s ::= '[' b ']' {s.limits = b.limits}
// b ::= c bp {b.limits = bp.limits.push(c.limit)}
// bp ::= c bp {bp.limits = bp1.limits.push(c.limit)} | eps {bp.limits = []}
// c ::= literal {cp.inh = literal.val} cp {c.limit = cp.limit} 
// cp ::= '-' literal {cp.limit = new range(cp.inh, literal.val)} | eps {cp.limit = new range(literal.val, literal.val)}

// a ::= literal | '(' e ')' | s {a.val = s.limits}

// s.first = {'['} s.follow = a.follow = { '*', '+', '?' }
// b.first = c.first = literal.first {非关,'\\'} b.follow={']'}
// bp.first = {非关,'\\',eps} bp.follow={']'}
// c.first = {非关,'\\'} c.follow={非关,'\\',']'}
// cp.first = {'-',eps} cp.follow={非关,'\\',']'}
// ++a.first = {非关,'\','(','['}

