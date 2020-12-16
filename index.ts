import * as LEX from "./lex/Lex";
import * as yaccDT from "./yacc/DataStructure";
import { IYaccInputProvider, LRParser } from "./yacc/LRParser";
import { LRStateMachine } from "./yacc/LRStateMachine";

////////
// DEF

enum Terminal {
    NUM = 0,
    PLUS,
    MUL,
    LC,
    RC,
}

enum Nonterminal {
    E = 4096,
}

////////
// LEX

const delim = `[ \t\n\r]`;
const ws = `${delim}+`;
const digit = `\\d`;
const number = `${digit}+(.${digit}+)?(E[\\+\\-]?${digit}+)?`;

const lexTable: LEX.LexEntry[] = [
    [ws, undefined],
    [number, yy => { yy.yylval = installNum(yy); return Terminal.NUM }],
    ["\\+", () => Terminal.PLUS],
    ["\\*", () => Terminal.MUL],
    ["\\(", () => Terminal.LC],
    ["\\)", () => Terminal.RC],
]

function installNum(yy: LEX.YYEnv) {
    let str = yy.getCurrentVal();
    let num = parseFloat(str);
    return num;
}

const lexer = new LEX.Lex(lexTable);

const lexOutput: IYaccInputProvider = {
    getToken: lexer.getNextToken.bind(lexer),
    getLineInfo: lexer.getLineInfo.bind(lexer),
    yylvalContainer: lexer.yy,
};
////////
// YACC

yaccDT.setDbg(Nonterminal, Terminal);

let myProductions: yaccDT.Production[] = [
    new yaccDT.Production(Nonterminal.E, [Nonterminal.E, Terminal.PLUS, Nonterminal.E], s => s[s.length - 3].val + s[s.length - 1].val, { isLeftAssociative: true, precedence: 0 }),
    new yaccDT.Production(Nonterminal.E, [Nonterminal.E, Terminal.MUL, Nonterminal.E], s => s[s.length - 3].val * s[s.length - 1].val, { isLeftAssociative: true, precedence: 1 }),
    new yaccDT.Production(Nonterminal.E, [Terminal.LC, Nonterminal.E, Terminal.RC], s => s[s.length - 1].val),
    new yaccDT.Production(Nonterminal.E, [Terminal.NUM], s => s[s.length - 1].val),
];

const yacc = new LRStateMachine(myProductions);
const parser = new LRParser(yacc, lexOutput);

////////
// USE

lexer.setStringToParse("1+2*3+4");
console.log(parser.run());
