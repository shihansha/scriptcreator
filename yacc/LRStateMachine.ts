import * as DT from "./DataStructure";

const DEBUG = 0;

export enum Action {
    Error = 0,
    Reduce,
    Shift,
    Accept
}

export class LRStateMachine {

    public canonicalLRCollections: DT.ProductionState[][] = [];
    private gotoTable: number[][] = [];
    public actionTable: { at: number, action: Action, to: number, prodIdx: number }[][];
    public nGotoTable: { at: number, to: number }[][];

    constructor(private productions: DT.Production[]) {
        productions.push(new DT.Production(DT.Production.START_PRODUCTION, [DT.Production.NON_TERMINAL_START], s => s[s.length - 1].val));

        this.actionTable = this.genLALR();

        this.nGotoTable = this.canonicalLRCollections.map(() => []);
        this.gotoTable.forEach((a, i) => {
            a.forEach((p, j) => {
                if (j >= DT.Production.NON_TERMINAL_START) {
                    this.nGotoTable[i].push({ at: j, to: p });
                }
            });
        });

        this.printGotoTable();
    }

    private printGotoTable() {
        if (DEBUG) {
            console.log("\nGOTO TABLE:");
            this.nGotoTable.forEach((a, i) => {
                console.log("Group " + i);
                a.forEach(p => {
                    console.log(`\t${DT.transToName(p.at)} -> Goto group: ${p.to}`);
                });
            });
        }
    }

    private printLALR1Core() {
        if (DEBUG) {
            console.log("LALR(1) CORE: ")
            this.canonicalLRCollections.forEach((a, i) => {
                console.log("Group " + i + "(" + a.length + ")");
                a.forEach(b => {
                    console.log("\t" + b.toString());
                });
            });
        }
    }

    private printActionTable(actionTable: { at: number; action: Action; to: number; prodIdx: number; }[][]) {
        if (DEBUG) {
            console.log("\nACTION TABLE: ");
            actionTable.forEach((a, i) => {
                console.log("Group " + i);
                a.forEach(b => {
                    if (b.action === Action.Accept) {
                        console.log(`\t${DT.transToName(b.at)} -> Accept`);
                    }
                    else if (b.action === Action.Error) {
                    }
                    else if (b.action === Action.Reduce) {
                        console.log(`\t${DT.transToName(b.at)} -> Reduce by: ${this.canonicalLRCollections[i][b.prodIdx].toString()}`);
                    }
                    else if (b.action === Action.Shift) {
                        console.log(`\t${DT.transToName(b.at)} -> Shift to group: ${b.to}`);
                    }
                });
            });
        }
    }

    private genLALR() {
        this.canonicalLRCollections = this.itemsLR0().map(a => this.getKernel(a));
        // this.printDebug();
        let spreadTable: Map<[number, number], [number, number]> = new Map();

        // gen look-forward seed
        this.canonicalLRCollections.forEach((iKernel, kernelIndex) => {
            iKernel.forEach((prod, prodIndex) => {
                let state = new DT.ProductionState(prod.production, prod.curState);
                state.lookFoward.push(DT.Production.SHARP);

                let c = this.closureLR1([state]);
                let gs = [...new Set(c.filter(a => a.currentInput !== undefined).map(a => a.currentInput))] as number[];
                gs.forEach(x => {
                    let g = this.gotoLR1(c, x);
                    let j = this.getKernel(g);

                    j.forEach(s => {
                        // if (s.currentInput === undefined) return; // no more input means no goto
    
                        if (s.lookFoward.find(a => a !== DT.Production.SHARP) !== undefined) {
                            // canonicalLRCollections[gotoTable [kernelIndex] [x]] [getIndex(s.production)] products: s.lookFoward.excludes("#")
                            let id = this.gotoTable[kernelIndex][x];
                            let found = this.canonicalLRCollections[id].find(a => a.production === s.production)!;
                            let filtered = s.lookFoward.filter(a => a !== DT.Production.SHARP);
                            found.lookFoward = filtered;
                        }
                        if (s.lookFoward.indexOf(DT.Production.SHARP) !== -1) {
                            // includes sharp
                            let id = this.gotoTable[kernelIndex][x];
                            let foundIndex = this.canonicalLRCollections[id].findIndex(a => a.production === s.production);
                            spreadTable.set([kernelIndex, prodIndex], [id, foundIndex]);
                        }
                    });
    
                })
            });
        });

        this.canonicalLRCollections[0][0].lookFoward.push(DT.Production.EOF);

        // this.printDebug();

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

        this.printLALR1Core();

        // gen lang table
        let actionTable: { at: number, action: Action, to: number, prodIdx: number }[][] = this.canonicalLRCollections.map(() => []);

        this.canonicalLRCollections = this.canonicalLRCollections.map(a => this.closureLR1(a));

        this.canonicalLRCollections.forEach((i, iIndex) => {
            i.forEach((p, pIndex) => {
                let gotoTar = p.currentInput !== undefined ? this.gotoTable[iIndex][p.currentInput] : undefined;
                if (gotoTar !== undefined && p.currentInput! < DT.Production.NON_TERMINAL_START) {
                    let exist = actionTable[iIndex].find(a => a.at === p.currentInput);
                    if (exist === undefined) {
                        actionTable[iIndex].push({ at: p.currentInput!, action: Action.Shift, to: gotoTar, prodIdx: pIndex });
                    }
                    else if (exist.action === Action.Reduce) {
                        let existInfo = this.canonicalLRCollections[iIndex][exist.prodIdx].production.addtionalInfo;
                        let nowInfo = p.production.addtionalInfo;
                        if (existInfo === undefined || nowInfo === undefined) {
                            console.warn("Conflict found between: " + this.canonicalLRCollections[iIndex][exist.prodIdx].production.toString() + " (REDUCE) and " + p.production.toString() + " (SHIFT).");
                            // default: reduce
                        }
                        else {
                            if (existInfo.precedence >= nowInfo.precedence) {
                                // reduce
                            }
                            else if (!existInfo.isLeftAssociative) {
                                // reduce
                            }
                            else {
                                // shift
                                actionTable[iIndex].splice(actionTable[iIndex].indexOf(exist), 1, { at: p.currentInput!, action: Action.Shift, to: gotoTar, prodIdx: pIndex });
                            }
                        }
                    }
                }
                else if (p.currentInput === undefined && !(p.production.leftHand === DT.Production.START_PRODUCTION && p.curState === 1)) {
                    p.lookFoward.forEach(l => {
                        let exist = actionTable[iIndex].find(a => a.at === l);
                        if (exist === undefined) {
                            actionTable[iIndex].push({ at: l, action: Action.Reduce, to: 0, prodIdx: pIndex });
                        }
                        else {
                            if (exist.action === Action.Reduce) {
                                // reduce / reduce conflict
                                let existProdIdx = this.productions.indexOf(this.canonicalLRCollections[iIndex][exist.prodIdx].production);
                                let nowProdIdx = this.productions.indexOf(p.production);
                                console.warn("Conflict found between: " + this.canonicalLRCollections[iIndex][exist.prodIdx].production.toString() + " (REDUCE " + existProdIdx + ") and " + p.production.toString() + " (REDUCE " + nowProdIdx + ").");

                                if (existProdIdx <= nowProdIdx) {
                                    // accept older
                                }
                                else {
                                    // gen new
                                    actionTable[iIndex].splice(actionTable[iIndex].indexOf(exist), 1, { at: l, action: Action.Reduce, to: 0, prodIdx: pIndex });
                                }
                            }
                            else if (exist.action === Action.Shift) {
                                // shift / reduce conflict
                                let existInfo = this.canonicalLRCollections[iIndex][exist.prodIdx].production.addtionalInfo;
                                let nowInfo = p.production.addtionalInfo;
                                if (existInfo === undefined || nowInfo === undefined) {
                                    console.warn("Conflict found between: " + p.production.toString() + " (REDUCE) and " + this.canonicalLRCollections[iIndex][exist.prodIdx].production.toString() + " (SHIFT).");
                                    // default: reduce
                                    actionTable[iIndex].splice(actionTable[iIndex].indexOf(exist), 1, { at: l, action: Action.Reduce, to: 0, prodIdx: pIndex });
                                }
                                else {
                                    if (nowInfo.precedence >= existInfo.precedence) {
                                        // reduce
                                        actionTable[iIndex].splice(actionTable[iIndex].indexOf(exist), 1, { at: l, action: Action.Reduce, to: 0, prodIdx: pIndex });
                                    }
                                    else if (nowInfo.isLeftAssociative) {
                                        // reduce
                                        actionTable[iIndex].splice(actionTable[iIndex].indexOf(exist), 1, { at: l, action: Action.Reduce, to: 0, prodIdx: pIndex });
                                    }
                                    else {
                                        // shift
                                    }
                                }
                            }
                        }
                    });
                }
                else if (p.production.leftHand === DT.Production.START_PRODUCTION && p.curState === 1) {
                    actionTable[iIndex].push({ at: DT.Production.EOF, action: Action.Accept, to: 0, prodIdx: pIndex });
                }
                else if (gotoTar !== undefined && p.currentInput! >= DT.Production.NON_TERMINAL_START) { // empty productions: reduce to p
                    let emp = this.productions.find(a => a.leftHand === p.currentInput && a.rightHand.length === 0);
                    if (emp !== undefined) {
                    }
                }
            });
        });

        this.printActionTable(actionTable);

        this.canonicalLRCollections = this.canonicalLRCollections.map(a => this.getKernel(a));

        return actionTable;
    }

    private gotoLR1(i: DT.ProductionState[], x: number) {
        let j: typeof i = [];
        i.forEach(a => {
            if (a.currentInput === x) {
                let ps = new DT.ProductionState(a.production, a.curState + 1);
                ps.lookFoward = a.lookFoward.slice();
                j.push(ps);
            }
        });
        return this.closureLR1(j);
    }
    private closureLR1(i: DT.ProductionState[]) {
        const productions = this.productions;
        let firstMap = calFirst();
        let ret = i.slice();
        while (true) {
            let toAdd: typeof ret = [];
            ret.forEach(a => {
                let next = a.currentInput;
                if (next === undefined) return;
                let pros = this.productions.filter(a => a.leftHand === next);
                pros.forEach(b => {
                    let l = a.production.rightHand.slice(a.curState + 1);
                    l.push(DT.Production.DUMMY);
                    let firsts = firstList(l);
                    let idx: number;
                    if ((idx = firsts.indexOf(DT.Production.DUMMY)) !== -1) {
                        firsts.splice(idx, 1, ...a.lookFoward);
                    }

                    firsts.forEach(f => {
                        let org = [...ret, ...toAdd];
                        let found = org.find(a => a.curState === 0 && a.production === b);
                        if (found === undefined) {
                            found = new DT.ProductionState(b, 0);
                            toAdd.push(found);
                        }
                        if (found.lookFoward.indexOf(f) === -1) found.lookFoward.push(f);
                    });
                });

            });
            if (toAdd.length === 0) break;
            ret = ret.concat(toAdd);
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
                firstArr = [...new Set(firstArr.concat(...toAdd))];
                firstMap.set(x, firstArr);
                return firstArr;
            }


        }

        function firstList(l: number[]): number[] {
            let result: number[] = [];
            l.some(x => { // if not breaked: FIRST(last expr) includes 'eps'
                let firstObj = firstMap.get(x) ?? [x];
                if (firstObj.indexOf(undefined) !== -1) { // has 'eps'
                    firstObj.splice(firstObj.indexOf(undefined), 1);
                    result = result.concat(firstObj as number[]);
                    return false; // includes FIRST(next letter)
                }
                result = result.concat(firstObj as number[]);
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
                let nextX = [...new Set(this.getNextX(i))];
                nextX.forEach(x => {
                    let goix = this.gotoLR0(i, x);
                    let toIndex: number;
                    if (goix.length > 0) {
                        if ((toIndex = [...c, ...newItems].findIndex(ci => this.isSame(goix, ci))) === -1) {
                            newItems.push(goix);
                            toIndex = ++idx;
                        }
                        // goto[iIndex, x] = found
                        if (gt.find(a => a[0] === fromIndex && a[1] === x) === undefined) {
                            gt.push([fromIndex, x, toIndex]);
                        }
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
        return i.filter(a => a.curState !== 0 || a.production.leftHand === DT.Production.START_PRODUCTION || a.production.rightHand.length === 0);
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
