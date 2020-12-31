import * as yaccDT from "../yacc/DataStructure"
import * as lexDef from "./lexDef"

export enum Nonterminal {
    program = 4096,
    stmts,
    stmt,
    vardecl,
    typedecl,
    kvpairdecls,
    kvparidecl,
    funcdecl,
    pardecls,
    pardecl,
    funcdef,
    funccall,
    explist,
    kvpairs,
    kvpair,
    exp,
    mathf,
    unary,
    rval,
    lval,
    factor,
}
const n = Nonterminal;
const t = lexDef.Terminal;

yaccDT.setDbg(Nonterminal, lexDef.Terminal);
let myProductions: yaccDT.Production[] = [
    new yaccDT.Production(n.program, [n.stmts], _s => { }),
    new yaccDT.Production(n.stmts, [n.stmts, n.stmt], s => {
        s[s.length - 1].val.gen();
    }),
    new yaccDT.Production(n.stmts, [], () => { }),
    new yaccDT.Production(n.stmt, [n.exp, t.SEMICOMMA], s => {
        s[s.length - 1].val.gen();
    }),
    new yaccDT.Production(n.stmt, [t.IF, t.LP, n.exp, t.RP, n.stmt], s => {
        
    })
];


