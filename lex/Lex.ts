import * as RegExp from "../regularExp/Parser";

type Undefinable<T> = T extends undefined ? T : (T | undefined);

type YYEnvInternal = { yylval: any, yytext: number, yyleng: number, program: string };
export type YYEnv = { yylval: any, readonly yytext: number, readonly yyleng: number, readonly program: string, getCurrentVal: (this: YYEnv) => string };
export type LexMatchCallback = ((yy: YYEnv) => number);
export type LexEntry = [string, Undefinable<LexMatchCallback>];

export class Lex {
    public readonly yy: YYEnv = {
        yylval: null,
        yytext: 0,
        yyleng: 0,
        program: "",
        getCurrentVal: function (this: YYEnv) {
            return this.program.substring(this.yytext, this.yyleng + this.yytext);
        }
    };

    private readonly callbacks: Undefinable<LexMatchCallback>[];
    private readonly regExpAST: NonNullable<ReturnType<typeof RegExp.parseAST>>;
    private currentIndex: number = 0;
    private strLength: number = 0;
    private str: string = "";

    private line: number = 1;
    private character: number = 1;

    constructor(lexEntries: LexEntry[]) {
        const exprs = lexEntries.map(a => a[0]);
        this.callbacks = lexEntries.map(a => a[1]);
        const regExpAST = RegExp.parseASTs(exprs);
        if (regExpAST === undefined) throw new Error("Lexer: RegExp compile failed.");
        this.regExpAST = regExpAST;
    }

    public setStringToParse(str: string) {
        this.currentIndex = 0;
        this.str = str;
        this.strLength = str.length;
        this.line = 1;
        this.character = 1;
        (this.yy as YYEnvInternal).program = str;
    }

    public getNextToken() {
        let continueFlag = true;
        while (this.currentIndex < this.strLength && continueFlag) {
            continueFlag = false;
            let res = RegExp.searchAST(this.regExpAST, this.str, this.currentIndex);
            if (res === null) {
                throw new Error(`Lexer: Parsing failed at line: ${this.line}, character: ${this.character}.`);
            }
            else {
                let consumed = this.str.substring(this.currentIndex, this.currentIndex + res.consumedLetterNum).replace("\r", "").split("\n");
                if (consumed.length > 1) {
                    this.line += consumed.length - 1;
                    this.character = consumed[consumed.length - 1].length + 1;
                }
                else {
                    this.character += res.consumedLetterNum;
                }
            }

            (this.yy as YYEnvInternal).yytext = this.currentIndex;
            (this.yy as YYEnvInternal).yyleng = res.consumedLetterNum;
            this.yy.yylval = null;

            this.currentIndex += res.consumedLetterNum;

            let callback = this.callbacks[res.regExpIdx];
            if (callback === undefined) {
                continueFlag = true;
            }
            else {
                return callback(this.yy);
            }
        }

        return -1;
    }

    public getLineInfo(): [number, number] {
        return [this.line, this.character];
    }
}