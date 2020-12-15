import * as LEX from "../lex/Lex"
import { parseAST, searchAST } from "../regularExp/Parser";

console.log("test 1");

enum Manifest {
    LT, LE, EQ, NE, GT, GE,
    IF, THEN, ELSE, ID, NUMBER, RELOP
}

const delim = `[ \t\n\r]`;
const ws = `${delim}+`;
const letter = `[a-zA-Z]`;
const digit = `\\d`;
const id = `${letter}(${letter}|${digit})*`;
const number = `${digit}+(.${digit}+)?(E[\\+\\-]?${digit}+)?`;

const lexTable: LEX.LexEntry[] = [
    [ws, undefined],
    ["if", () => Manifest.IF],
    ["then", () => Manifest.THEN],
    ["else", () => Manifest.ELSE],
    [id, yy => { yy.yylval = installID(yy); return Manifest.ID }],
    [number, yy => { yy.yylval = installNum(yy); return Manifest.NUMBER }],
    ["<", yy => { yy.yylval = Manifest.LT; return Manifest.RELOP; }],
    ["<=", yy => { yy.yylval = Manifest.LE; return Manifest.RELOP; }],
    ["=", yy => { yy.yylval = Manifest.EQ; return Manifest.RELOP; }],
    ["<>", yy => { yy.yylval = Manifest.NE; return Manifest.RELOP; }],
    [">", yy => { yy.yylval = Manifest.GT; return Manifest.RELOP; }],
    [">=", yy => { yy.yylval = Manifest.GE; return Manifest.RELOP; }],
]

const testProgram = `if a < b then
        b
    else
        c
    
    b <= 20.0
    c <> 0.5E-10
`
const idArr: string[] = [];
function installID(yy: LEX.YYEnv) {
    let str = testProgram.substring(yy.yytext, yy.yyleng + yy.yytext);
    let id = idArr.indexOf(str);
    if (id === -1) {
        idArr.push(str);
        return idArr.length - 1;
    }
    return id;
}

const numArr: number[] = [];
function installNum(yy: LEX.YYEnv) {
    let str = testProgram.substring(yy.yytext, yy.yyleng + yy.yytext);
    let num = parseFloat(str);
    let id = numArr.indexOf(num);
    if (id === -1) {
        numArr.push(num);
        return numArr.length - 1;
    }
    return id;
}


const lexer = new LEX.Lex(lexTable);
lexer.setStringToParse(testProgram);
let token: number;
console.log("lex 输出:");
while ((token = lexer.getNextToken()) !== -1) {
    console.log(`${Manifest[token]}\t${lexer.yy.yylval}`);
}

console.log("符号表:");
idArr.forEach(a => console.log(a));

console.log("常量表:");
numArr.forEach(a => console.log(a));

