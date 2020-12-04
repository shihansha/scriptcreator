
export type RecordType = Terminal | Nonterminal | Action | Synthesize;
export type ActionType = (stack: RecordType[]) => void;
export class Terminal {
    value: string;
    action?: ActionType;

    constructor(value: string, action?: ActionType) {
        this.value = value;
        this.action = action;
    }
}

export class Nonterminal {
    index: number;
    inhs: { [key: string]: any } = {};

    constructor(index: number) {
        this.index = index;
    }
}

export class Action {
    action: ActionType;
    constructor(action: ActionType) {
        this.action = action;
    }
}

export class Synthesize {
    index: number;
    vals: { [key: string]: any } = {};
    action: ActionType;

    constructor(index: number, action: ActionType) {
        this.index = index;
        this.action = action;
    }
}
