import * as DT from "./DataStructure";
import { Action, LRStateMachine } from "./LRStateMachine";

export interface IYaccInputProvider {
    getToken: () => number;
    yylvalContainer: { yylval: any, lexUnit: string, lineCharacter: [number, number] };
}

export class LRParser {
    private stack: DT.StackNodeType[] = [];
    private poisonFlag = 0;
    private errStack: { lexUnit: string, line: number, character: number }[] = [];

    constructor(private sm: LRStateMachine, private input: IYaccInputProvider) {

    }

    public yyerror(msg: string) {
        console.error(`${msg} (${this.errStack[this.errStack.length - 1].line},${this.errStack[this.errStack.length - 1].character}): ${this.errStack[this.errStack.length - 1].lexUnit}`);
    }

    public yyerrok() {
        this.poisonFlag--;
        this.errStack.pop();
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
                    let pastPosionFlag = this.poisonFlag;
                    let ret = prod.reducer(this.stack, this);
                    if (prod.rightHand.find(a => a === DT.Production.ERROR) && pastPosionFlag === this.poisonFlag) {
                        throw new Error(`Error cannot be resolved, exit parsing. (${this.errStack[this.errStack.length - 1].line},${this.errStack[this.errStack.length - 1].character}): ${this.errStack[this.errStack.length - 1].lexUnit}`);
                    }
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
            let handled = false;
            this.poisonFlag++;
            this.errStack.push({ lexUnit: this.input.yylvalContainer.lexUnit, line: this.input.yylvalContainer.lineCharacter[0], character: this.input.yylvalContainer.lineCharacter[1] });
            while (this.stack.length > 0) {
                let cur = this.stack[this.stack.length - 1];
                let act = this.sm.actionTable[cur.index].find(b => b.at === DT.Production.ERROR);
                if (act !== undefined) {
                    // catched
                    // push [err]
                    this.stack.push(new DT.Terminal(act.to, null));
                    handled = true;
                    // if is empty error handler
                    if (this.sm.actionTable[act.to].find(b => b.action === Action.Shift) === undefined) {
                        // go on
                    }
                    else {
                        // ignore input until reducable:
                        while (this.sm.actionTable[act.to].find(b => b.at === a) === undefined && a !== -1) {
                            a = this.input.getToken();
                        }
                    }
                    break;
                }
                this.stack.pop();
            }

            if (!handled) {
                throw new Error(`Unexpected token (${this.errStack[this.errStack.length - 1].line},${this.errStack[this.errStack.length - 1].character}): ${this.errStack[this.errStack.length - 1].lexUnit}`);
            }
        }
    }
}
