import * as DT from "./DataStructure";
import { Action, LRStateMachine } from "./LRStateMachine";

export interface IYaccInputProvider {
    getToken: () => number;
    getLineInfo?: () => [number, number];
    yylvalContainer: { yylval: any };
}

export class LRParser {
    private stack: DT.StackNodeType[] = [];

    constructor(private sm: LRStateMachine, private input: IYaccInputProvider) {

    }

    public run() {
        this.stack.push(new DT.Nonterminal(0, null));

        let a: number = this.input.getToken();
        while (true) {

            let s = this.stack[this.stack.length - 1];
            let action = this.sm.actionTable[s.index].find(b => b.at === a);
            if (action !== undefined) {
                if (action.action === Action.Shift) {
                    this.stack.push(new DT.Terminal(action.to, this.input.yylvalContainer.yylval));
                    a = this.input.getToken();
                    continue;
                }
                else if (action.action === Action.Reduce) {
                    let prod = this.sm.canonicalLRCollections[s.index][action.prodIdx].production;
                    let ret = prod.reducer(this.stack);
                    this.stack.length -= prod.rightHand.length;
                    let t = this.stack[this.stack.length - 1];
                    this.stack.push(new DT.Nonterminal(this.sm.nGotoTable[t.index].find(a => a.at === prod.leftHand)!.to, ret));
                    continue;
                }
                else if (action.action === Action.Accept) {
                    return this.stack[1].val;
                }
            }
            
            // error
            throw new Error(`unexpeced token (${this.input.getLineInfo?.().join() ?? "UNKNOWN"}): ${this.input.yylvalContainer.yylval}`);
        }
    }
}
