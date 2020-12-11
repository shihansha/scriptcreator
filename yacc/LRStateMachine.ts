import * as DT from "./DataStructure";

export class LRStateMachine {

    private canonicalLRCollections: DT.ProductionState[][] = [];

    constructor(private productions: DT.Production[], private terminalCount: number, private nonterminalCount: number) {
        productions.push(new DT.Production(DT.Production.START_PRODUCTION, [DT.Production.NON_TERMINAL_START], () => console.log("parse successful")));
        nonterminalCount++;
    }

    private genCanonicalLRCollections() {
        this.canonicalLRCollections = this.itemsLR0().map(a => this.getKernel(a));
    }

    private closureSharpLR1(i: DT.ProductionState[]) {
        i.forEach(a => a.lookFoward.push(-0x10));
        while (true) {
            i.forEach(a => {
                let next = a.production.rightHand[a.curState];
                let pros = this.productions.filter(a => a.leftHand === next);

            });
        }
    }
    private first(ins: number[]) {
        let result: number[] = [];
        ins.some(a => {
            let pros = this.productions.filter(b => b.leftHand === a);
            
        })
    }

    private closureLR0(i: DT.ProductionState[]) {
        let j = i.slice();
        do {
            let newJoined: typeof i = [];
            j.forEach(a => {
                let cur = a.production.rightHand[a.curState];
                if (cur !== undefined && cur >= DT.Production.NON_TERMINAL_START) {
                    let curProductions = this.productions.filter(a => a.leftHand === cur);
                    curProductions.forEach(a => {
                        let found = j.some(b => b.production === a && b.curState === 0);
                        if (!found) {
                            newJoined.push(new DT.ProductionState(a, 0));
                        }
                    });
                }
            });
            if (newJoined.length > 0) {
                j.push(...newJoined);
            }
            else {
                break;
            }
        } while (true);

        return j;
    }

    private gotoLR0(i: DT.ProductionState[], x: number) {
        let j: typeof i = [];
        i.forEach(a => {
            if (a.production.rightHand[a.curState] === x) {
                let newState = new DT.ProductionState(a.production, a.curState + 1);
                j.push(newState);
            }
        });
        return this.closureLR0(j);
    }

    private itemsLR0() {
        let c = [this.closureLR0([new DT.ProductionState(this.productions[this.productions.length - 1], 0)])];
        while (true) {
            let newItems: typeof c = [];
            c.forEach(i => {
                let nextX = this.getNextX(i);
                nextX.forEach(x => {
                    let goix = this.gotoLR0(i, x);
                    if (goix.length > 0 && c.every(ci => !this.isSame(goix, ci))) {
                        newItems.push(goix);
                    }
                });
            });
            if (newItems.length > 0) {
                c.push(...newItems);
            }
            else {
                break;
            }
        }
        return c;
    }

    private getKernel(i: DT.ProductionState[]) {
        return i.filter(a => a.curState !== 0 || a.production.leftHand !== DT.Production.START_PRODUCTION);
    }
    private isSame(a: DT.ProductionState[], b: typeof a) {
        let ai = this.getKernel(a);
        let bi = this.getKernel(b);
        if (ai.length === bi.length) {
            return ai.every(i => bi.find(j => j.curState === i.curState && i.production === j.production));
        }
        return false;
    }
    private getNextX(c: DT.ProductionState[]) {
        let result: number[] = [];
        c.forEach(a => {
            let next = a.production.rightHand[a.curState];
            if (next !== undefined) {
                result.push(next);
            }
        });
        return result;
    }
}
