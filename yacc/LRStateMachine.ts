import * as DT from "./DataStructure";

enum Action {
    Error = 0,
    Reduce,
    Shift,
    Accept
}

export class LRStateMachine {

    private canonicalLRCollections: DT.ProductionState[][] = [];
    private gotoTable: number[][] = [];

    constructor(private productions: DT.Production[], private terminalCount: number, private nonterminalCount: number) {
        productions.push(new DT.Production(DT.Production.START_PRODUCTION, [DT.Production.NON_TERMINAL_START], () => console.log("parse successful")));
        nonterminalCount++;
    }

    private genLALR() {
        this.canonicalLRCollections = this.itemsLR0().map(a => this.getKernel(a));
        let spreadTable: Map<[number, number], [number, number]> = new Map();
        
        // gen look-forward seed
        this.canonicalLRCollections.forEach((iKernel, kernelIndex) => {
            iKernel.forEach((prod, prodIndex) => {
                let state = new DT.ProductionState(prod.production, prod.curState);
                state.lookFoward.push(DT.Production.SHARP_PRODUCTION);
                let j = this.getKernel(this.gotoLR1(this.closureLR1([state]), DT.Production.SHARP_PRODUCTION));
                j.forEach(s => {
                    if (s.currentInput === undefined) return; // no more input means no goto

                    if (s.lookFoward.indexOf(DT.Production.SHARP_PRODUCTION) !== -1) {
                        // canonicalLRCollections[gotoTable [kernelIndex] [s.currentInput]] [getIndex(s.production)] products: s.lookFoward.excludes("#")
                        let id = this.gotoTable[kernelIndex][s.currentInput];
                        let found = this.canonicalLRCollections[id].find(a => a.production === s.production)!;
                        let filtered = s.lookFoward.filter(a => a !== DT.Production.SHARP_PRODUCTION);
                        found.lookFoward = filtered;
                    }
                    else {
                        // includes sharp
                        let id = this.gotoTable[kernelIndex][s.currentInput];
                        let foundIndex = this.canonicalLRCollections[id].findIndex(a => a.production === s.production);
                        spreadTable.set([kernelIndex, prodIndex], [id, foundIndex]);
                    }
                });
            });
        });

        this.canonicalLRCollections[0][0].lookFoward.push(DT.Production.EOF);

        // calc look-forward
        let changedFlag = true;
        while (changedFlag) {
            changedFlag = false;
            spreadTable.forEach((v, k) => {
                let src = this.canonicalLRCollections[k[0]][k[1]];
                let dest = this.canonicalLRCollections[v[0]][v[1]];
                let orgLength = dest.lookFoward.length;
                // dest = dest union src
                dest.lookFoward = [...new Set([...src.lookFoward, ...dest.lookFoward])];
                if (dest.lookFoward.length > orgLength) changedFlag = true;
            });
        }

        // gen lang table
        let actionTable: { at: number, action: Action, to: number }[][] = this.canonicalLRCollections.map(() => []);
        
        this.canonicalLRCollections.forEach((i, iIndex) => {
            i.forEach(p => {
                let gotoTar = p.currentInput ? this.gotoTable[iIndex]?.[p.currentInput] : undefined;
                if (gotoTar !== undefined && gotoTar < DT.Production.NON_TERMINAL_START) {
                    
                }
            });
        });
    }

    private gotoLR1(i: DT.ProductionState[], x: number) {
        let j: typeof i = [];
        i.forEach(a => {
            if (a.currentInput === x) {
                let ps = new DT.ProductionState(a.production, a.curState + 1);
                ps.lookFoward.concat(a.lookFoward);
            }
        });
        return this.closureLR1(j);
    }
    private closureLR1(i: DT.ProductionState[]) {
        const productions = this.productions;
        let firstMap = calFirst();
        let ret = i.slice();
        while (true) {
            let toAdd: typeof i = [];
            i.forEach(a => {
                let next = a.currentInput;
                if (next === undefined) return;
                let pros = this.productions.filter(a => a.leftHand === next);
                pros.forEach(b => {
                    let l = a.production.rightHand.slice(a.curState + 1);
                    l.push(DT.Production.DUMMY_PRODUCTION);
                    let firsts = firstList(l);
                    let idx: number;
                    if ((idx = firsts.indexOf(DT.Production.DUMMY_PRODUCTION)) !== -1) {
                        firsts.splice(idx, 1, ...a.lookFoward);
                    }

                    firsts.forEach(f => {
                        let org = [...ret, ...toAdd];
                        let found: DT.ProductionState | undefined;
                        if (!(found = org.find(a => a.curState !== 0 && a.production !== b))) {
                            found = new DT.ProductionState(b, 0);
                            toAdd.push(found);
                        }
                        if (found.lookFoward.indexOf(f) !== -1) found.lookFoward.push(f);
                    });
                });
                
            });
            if (toAdd.length === 0) break;
            ret.concat(toAdd);
        }
        return ret;


        function calFirst() {
            let firstMap = new Map<number, (number | undefined)[]>();
            let nonTerminals: Set<number> = new Set();
            productions.forEach(a => nonTerminals.add(a.leftHand));
            [...nonTerminals].forEach(a => first(a));
            return firstMap;

            function first(x: number): (number | undefined)[] {
                if (firstMap.has(x)) return firstMap.get(x)!;
                let firstArr: (number | undefined)[] = [];
                firstMap.set(x, firstArr);
                let prod: (number | undefined)[] = productions.filter(a => a.leftHand === x).map(a => a.rightHand[0]);
                let toAdd = prod.map(a => {
                    if (a === undefined) {
                        return [];
                    }
                    if (a < DT.Production.NON_TERMINAL_START) {
                        return [a];
                    }
                    else {
                        return first(a);
                    }
                });
                firstArr.concat(...toAdd);
                return firstArr;
            }


        }

        function firstList(l: number[]): number[] {
            let result: number[] = [];
            l.some(x => { // if not breaked: FIRST(last expr) includes 'eps'
                let firstObj = firstMap.get(x)!;
                if (firstObj.indexOf(undefined) !== -1) { // has 'eps'
                    firstObj.splice(firstObj.indexOf(undefined), 1);
                    result.concat(firstObj as number[]);
                    return false; // includes FIRST(next letter)
                }
                return true; // end search
            });
            return [...new Set(result)];
        }
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
        let idx = 0;
        let gt: [number, number, number][] = [];
        while (true) {
            let newItems: typeof c = [];
            c.forEach((i, fromIndex) => {
                let nextX = this.getNextX(i);
                nextX.forEach(x => {
                    let goix = this.gotoLR0(i, x);
                    let toIndex: number;
                    if (goix.length > 0) {
                        if ((toIndex = [...c, ...newItems].findIndex(ci => !this.isSame(goix, ci))) === -1) {
                            newItems.push(goix);
                            toIndex = ++idx;
                        }
                        // goto[iIndex, x] = found
                        gt.push([fromIndex, x, toIndex]);
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

        this.gotoTable = c.map(() => []);

        gt.forEach(v => {
            this.gotoTable[v[0]][v[1]] = v[2];
        })

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
