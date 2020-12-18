
// in stack data
export type StackNodeType = Terminal | Nonterminal;
type ReduceCallback = (stack: StackNodeType[], handler: { yyerror: (msg: string) => void, yyerrok: () => void }) => any;

// debug purpose
export let NENUM: any;
export let TENUM: any;

export function setDbg(n: any, t: any) {
    NENUM = n;
    TENUM = t;
}

export function transToName(a: number) {
    if (a < 0) {
        if (a === Production.EOF) {
            return "[EOF]";
        }
        else if (a === Production.SHARP) {
            return "[#]";
        }
        else if (a === Production.DUMMY) {
            return "[DUMMY]";
        }
        else if (a === Production.ERROR) {
            return "[ERR]";
        }
    }
    else if (a < Production.NON_TERMINAL_START) {
        return TENUM[a];
    }
    else if (a < Production.START_PRODUCTION) {
        return NENUM[a];
    }
    else {
        switch (a) {
            case Production.START_PRODUCTION: return "[S]";
            default: return "[UNKNOWN]";
        }
            
    }

}

export class Terminal {
    readonly index: number;
    readonly val: any;

    constructor(index: number, yylval: any) {
        this.index = index;
        this.val = yylval;
    }

}

export class Nonterminal {
    readonly index: number;
    readonly val: any;
    constructor(index: number, vals: any) {
        this.index = index;
        this.val = vals;
    }
}

export class Production {
    /**
     * 0-0x1000: terminal
     * 0x1000-0x2000: nonterminal
     * \>0x2000: reserved
     */
    static readonly NON_TERMINAL_START = 0x1000;
    static readonly START_PRODUCTION = 0x2000;
    static readonly ERROR = -4;
    static readonly SHARP = -2;
    static readonly DUMMY = -3;
    static readonly EOF = -1;
    readonly leftHand: number;
    readonly rightHand: number[];
    readonly reducer: ReduceCallback;
    constructor(leftHand: number, rightHand: number[], reducer: ReduceCallback, public addtionalInfo?: { isLeftAssociative: boolean, precedence: number }) {
        this.leftHand = leftHand;
        this.rightHand = rightHand;
        this.reducer = reducer;
    }

    toString() {
        let left: string = NENUM[this.leftHand] ?? ["[S]"];
        let right: string = this.rightHand.map(a => transToName(a)).join(" ");
        return left + " -> " + right;
    }
}

export class ProductionState {
    readonly production: Production;
    curState: number;
    lookFoward: number[] = [];
    constructor(production: Production, curState: number) {
        this.production = production;
        this.curState = curState;
    }

    get restInput(): (number | undefined)[] {
        return this.production.rightHand.slice(this.curState);
    }
    get currentInput(): number | undefined {
        return this.production.rightHand[this.curState];
    }

    toString() {
        let left: string = NENUM[this.production.leftHand] ?? ["[S]"];
        let rights: string[] = this.production.rightHand.map(a => transToName(a));
        rights[this.curState] = "* " + (rights[this.curState] ?? "");
        let right = rights.join(" ");
        let look = this.lookFoward.map(a => transToName(a)).join(",")
        return left + " -> " + right + " (" + look + ")";
    }
}

