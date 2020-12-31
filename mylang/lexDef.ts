import * as LEX from "../lex/Lex"

export enum Terminal {
    LP, // (
    RP, // }
    LBRACKET, // [
    RBRACKET, // ]
    LBRACES, // {
    RBRACES, // }
    COLON, // :
    COMMA, // ,
    SEMICOMMA, // ;
    DOUBLE_QUATION, // "
    DOT, // .

    ASSIGN, // =

    // math
    PLUS, // +
    MINUS, // -
    MUL, // *
    DIV, // /
    NOT, // !
    LT, // <
    LE, // <=
    EQ, // ==
    NE, // !=
    GE, // >=
    GT, // >

    ID, // id

    INT, // int
    FLOAT, // float
    BOOL, // boolean

    BOOL_LITERAL, // true | false
    INT_LITERAL, // 123
    FLOAT_LITERAL, // 12.3

    FUNCTION, // function
    IF, // if
    ELSE, // else
    WHILE, // while
    BREAK, // break
    CONTINUE, // continue
    VAR, // var
    RETURN, // return
}

const t = Terminal;

const delim = `[ \t\n\r]`;
const ws = `${delim}+`;
const letter = `[a-zA-Z]`;
const digit = `\\d`;
const id = `${letter}(${letter}|${digit})*`;
const _intLit = `${digit}+`;
const _floatLit = `${digit}+(.${digit}+)?(E[\\+\\-]?${digit}+)?`;

interface lexCallback {
    installID?: ((yy: LEX.YYEnv) => any),
}

export const LEX_CALLBACK: lexCallback = {
    
}

export const lexTable: LEX.LexEntry[] = [
    [ws, undefined],
    ["(", () => t.LP],
    [")", () => t.RP],
    ["[", () => t.LBRACKET],
    ["]", () => t.RBRACKET],
    ["{", () => t.LBRACES],
    ["}", () => t.RBRACES],
    [":", () => t.COLON],
    [",", () => t.COMMA],
    [";", () => t.SEMICOMMA],
    ["\"", () => t.DOUBLE_QUATION],
    [".", () => t.DOT],

    ["=", () => t.ASSIGN],
    ["+", () => t.PLUS],
    ["-", () => t.MINUS],
    ["*", () => t.MUL],
    ["/", () => t.DIV],
    ["!", () => t.NOT],
    ["<", () => t.LT],
    ["<=", () => t.LE],
    ["==", () => t.EQ],
    ["!=", () => t.NE],
    [">=", () => t.GE],
    [">", () => t.GT],


    ["int", () => t.INT],
    ["float", () => t.FLOAT],
    ["bool", () => t.BOOL],
    
    ["true", yy => { yy.yylval = true; return t.BOOL_LITERAL }],
    ["false", yy => { yy.yylval = false; return t.BOOL_LITERAL }],
    [_intLit, yy => { yy.yylval = parseInt(yy.lexUnit); return t.INT_LITERAL }],
    [_floatLit, yy => { yy.yylval = parseFloat(yy.lexUnit); return t.FLOAT_LITERAL }],

    ["function", () => t.FUNCTION],
    ["if", () => t.IF],
    ["while", () => t.WHILE],
    ["break", () => t.BREAK],
    ["continue", () => t.CONTINUE],
    ["var", () => t.VAR],
    ["return", () => t.RETURN],

    [id, yy => { yy.yylval = LEX_CALLBACK.installID?.(yy); return t.ID }],
];
