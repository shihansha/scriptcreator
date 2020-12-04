import * as Records from "./Records"
import * as AST from "./AST"
import * as OperationMap from "./OperationMap"

export class ASTBuilder {

    private stack: Records.RecordType[] = [];
    private inputStr: string;

    constructor(str: string) {
        this.inputStr = str;
    }

    error(msg: string) {
        console.error(msg);
    }

    run(): AST.Node | null {
        let ip = 0;
        let shift = false;
        let result: AST.Node | null = null;

        const eof = new Records.Terminal("eof");
        const e = new Records.Nonterminal(1);
        const ep = new Records.Synthesize(1, function (this: Records.Synthesize) {
            result = this.vals["val"];
        });
        this.stack.push(eof);
        this.stack.push(ep);
        this.stack.push(e);

        while (this.stack.length !== 0) {
            if (this.stack.length > 65535) {
                // stack overflow
                this.error("stack overflow");
                break;
            }

            const x = this.stack[this.stack.length - 1];

            const a = ip >= this.inputStr.length ? "eof" : this.inputStr[ip];

            if (x instanceof Records.Terminal) {
                if (x.value === a) {
                    if (x.action) x.action(this.stack);

                    if (a === "\\") {
                        shift = true;
                    }
                    else {
                        shift = false;
                    }
                }
                else if (x.value === "*+?") {
                    x.value = a;
                    if (x.action) x.action(this.stack);
                }
                else if (!shift && x.value === "literals" && this.checkIsLiterals(a)) {
                    x.value = a;
                    if (x.action) x.action(this.stack);
                }
                else if (shift && x.value === "specials" && this.checkIsSpecials(a)) {
                    if (a !== "w" && a !== "d") {
                        x.value = a;
                        shift = false;
                    }
                    else {
                        x.value = "\\" + a;
                    }
                    if (x.action) x.action(this.stack);
                }
                else {
                    this.error(`Unexpected token: '${a}', '${x.value}' expected.`);
                }

                this.stack.pop();
                ip++;
            }
            else if (x instanceof Records.Action) {
                x.action(this.stack);
                this.stack.pop();
            }
            else if (x instanceof Records.Synthesize) {
                x.action(this.stack);
                this.stack.pop();
            }
            else { // Nonterminal
                if (this.checkIsLiterals(a)) {
                    const lit = OperationMap.M[x.index]["literals"];
                    if (lit) {
                        lit(this.stack);
                    }
                    else {
                        this.error(`Unexpected token: '${a}', '${Object.getOwnPropertyNames(OperationMap.M[x.index]).join()}' expected`);
                        break;
                    }
                }
                else {
                    const lit = OperationMap.M[x.index][a];
                    if (lit) {
                        lit(this.stack);
                    }
                    else {
                        this.error(`Unexpected token: '${a}', '${Object.getOwnPropertyNames(OperationMap.M[x.index]).join()}' expected`);
                        break;
                    }
                }
            }
        }

        return result;
    }

    private checkIsLiterals(str: string) {
        return ["|", "*", "+", "?", "(", ")", "\\", "eof"].indexOf(str) === -1;
    }

    private checkIsSpecials(str: string) {
        return ["|", "*", "+", "?", "(", ")", "\\", "w", "d"].indexOf(str) !== -1;
    }
}
