
// in stack data
type StackNodeType = Terminal | Nonterminal;
type ReduceCallback = (stack: StackNodeType[]) => void;

export class Terminal {
    readonly index: number;
    readonly yylval: any;

    precedence: number = 0;
    isLeftAssociative: boolean = true;

    constructor(index: number, yylval: any) {
        this.index = index;
        this.yylval = yylval;
    }

}

export class Nonterminal {
    readonly index: number;
    readonly vals: any[];
    constructor(index: number) {
        this.index = index;
        this.vals = [];
    }
}

export class Production {
    /**
     * 0-0x1000: terminal
     * 0x1000-0x2000: nonterminal
     * \>0x2000: resolved
     */
    static readonly NON_TERMINAL_START = 0x1000;
    static readonly START_PRODUCTION = 0x2000;
    static readonly ERROR_PRODUCTION = 0x2001;
    static readonly SHARP_PRODUCTION = 0x2002;
    readonly leftHand: number;
    readonly rightHand: number[];
    readonly reducer: ReduceCallback;
    constructor(leftHand: number, rightHand: number[], reducer: ReduceCallback) {
        this.leftHand = leftHand;
        this.rightHand = rightHand;
        this.reducer = reducer;
    }
}

export class ProductionState {
    readonly production: Production;
    curState: number;
    readonly lookFoward: number[] = [];
    constructor(production: Production, curState: number) {
        this.production = production;
        this.curState = curState;
    }
}

