import * as yaccDT from "./yacc/DataStructure"
import { LRStateMachine } from "./yacc/LRStateMachine"

enum t {
    ID = 0,
    PLUS,
    MUL,
    LC,
    RC,
}

enum n {
    E = 4096,
}

yaccDT.setDbg(n, t);

let dum = () => { };

let myProductions: yaccDT.Production[] = [
    new yaccDT.Production(n.E, [n.E, t.PLUS, n.E], dum),
    new yaccDT.Production(n.E, [n.E, t.MUL, n.E], dum),
    new yaccDT.Production(n.E, [t.LC, n.E, t.RC], dum),
    new yaccDT.Production(n.E, [t.ID], dum),
];

let yacc = new LRStateMachine(myProductions);

