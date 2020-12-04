export namespace RegExpParser {
    namespace AST {
        export type TYPE_OP = "CAT" | "OR" | "*" | "+" | "?";
        export class Leaf {
            value: string;
            constructor(value: string) {
                this.value = value;
            }

            clone(): Leaf {
                return new Leaf(this.value);
            }
        }
        export class Node {
            op: TYPE_OP;
            children: (Node | Leaf)[];
            constructor(op: TYPE_OP, ...children: (Node | Leaf)[]) {
                this.op = op;
                this.children = children;
            }

            clone(): Node {
                return new Node(this.op, ...(this.children.map(a => a.clone())));
            }
        }
    }

    namespace Records {
        export type RecordType = Terminal | Nonterminal | Action | Synthesize;
        export type ActionType = (stack: Records.RecordType[]) => void;
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
    }

    namespace OperationMap {

        function productE0(stack: Records.RecordType[]) {
            stack.pop();
            let t = new Records.Nonterminal(3);
            let ts = new Records.Synthesize(3, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = this.vals["val"];
            })
            let ep = new Records.Nonterminal(2);
            let eps = new Records.Synthesize(2, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["syn"];
            })
            stack.push(eps, ep, ts, t);
        }

        function productEp0(stack: Records.RecordType[]) {
            let par = stack.pop() as Records.Nonterminal;
            let lit0 = new Records.Terminal("|");
            let t = new Records.Nonterminal(3);
            let ts = new Records.Synthesize(3, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = new AST.Node("OR", par.inhs["inh"], this.vals["val"]);
            });
            let ep = new Records.Nonterminal(2);
            let eps = new Records.Synthesize(2, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["syn"] = this.vals["syn"];
            })
            stack.push(eps, ep, ts, t, lit0);
        }

        function productEp1(stack: Records.RecordType[]) {
            let par = stack.pop() as Records.Nonterminal;
            (stack[stack.length - 1] as Records.Synthesize).vals["syn"] = par.inhs["inh"];
        }

        function productT0(stack: Records.RecordType[]) {
            stack.pop();
            let u = new Records.Nonterminal(5);
            let us = new Records.Synthesize(5, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = this.vals["val"];
            });
            let tp = new Records.Nonterminal(4);
            let tps = new Records.Synthesize(4, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["syn"];
            })
            stack.push(tps, tp, us, u);
        }

        function productTp0(stack: Records.RecordType[]) {
            let par = stack.pop() as Records.Nonterminal;
            let u = new Records.Nonterminal(5);
            let us = new Records.Synthesize(5, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Nonterminal).inhs["inh"] = new AST.Node("CAT", par.inhs["inh"], this.vals["val"]);
            });
            let tp = new Records.Nonterminal(4);
            let tps = new Records.Synthesize(4, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["syn"] = this.vals["syn"];
            })
            stack.push(tps, tp, us, u);
        }

        function productTp1(stack: Records.RecordType[]) {
            let par = stack.pop() as Records.Nonterminal;
            (stack[stack.length - 1] as Records.Synthesize).vals["syn"] = par.inhs["inh"];
        }

        function productU0(stack: Records.RecordType[]) {
            stack.pop();
            let a = new Records.Nonterminal(7);
            let as = new Records.Synthesize(7, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 2] as Records.Synthesize).vals["val"] = this.vals["val"];
            });
            let up = new Records.Nonterminal(6);
            let ups = new Records.Synthesize(6, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                let type: AST.TYPE_OP;
                if (type = this.vals["type"]) {
                    if (type === "*") {
                        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = new AST.Node(this.vals["type"], this.vals["val"]);
                    }
                    else if (type === "+") {
                        let org = this.vals["val"];
                        let orgClone = org.clone();
                        let star = new AST.Node("*", orgClone);
                        let cat = new AST.Node("CAT", org, star);
                        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = cat;
                    }
                    else if (type === "?") {
                        let org = this.vals["val"];
                        let empty = new AST.Leaf("empty");
                        let or = new AST.Node("OR", org, empty);
                        (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = or;
                    }
                }
                else {
                    (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.vals["val"];
                }
            })
            stack.push(ups, up, as, a);
        }

        function productUp0(stack: Records.RecordType[]) {
            stack.pop();
            let lit0 = new Records.Terminal("*+?", function (this: Records.Terminal, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["type"] = this.value;
            });
            stack.push(lit0);
        }

        function productUp1(stack: Records.RecordType[]) {
            stack.pop();
            (stack[stack.length - 1] as Records.Synthesize).vals["type"] = undefined;
        }

        function productA0(stack: Records.RecordType[]) {
            stack.pop();
            let l = new Records.Nonterminal(8);
            let ls = new Records.Synthesize(8, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = new AST.Leaf(this.vals["val"]);
            });
            stack.push(ls, l);
        }

        function productA1(stack: Records.RecordType[]) {
            stack.pop();
            let lc = new Records.Terminal("(");
            let e = new Records.Nonterminal(1);
            let es = new Records.Synthesize(1, function (this: Records.Synthesize, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 2] as Records.Synthesize).vals["val"] = this.vals["val"];
            })
            let rc = new Records.Terminal(")");
            stack.push(rc, es, e, lc);
        }

        function productLit0(stack: Records.RecordType[]) {
            stack.pop();
            let lit0 = new Records.Terminal("literals", function (this: Records.Terminal, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.value;
            });
            stack.push(lit0);
        }

        function productLit1(stack: Records.RecordType[]) {
            stack.pop();
            let lit0 = new Records.Terminal("\\");
            let lit1 = new Records.Terminal("specials", function (this: Records.Terminal, stack: Records.RecordType[]) {
                (stack[stack.length - 1 - 1] as Records.Synthesize).vals["val"] = this.value;
            });
            stack.push(lit1, lit0);
        }

        type ProductionCallbackType = (stack: Records.RecordType[]) => void;
        export const M: { [key: string]: ProductionCallbackType | undefined }[] = [
            {},
            { "(": productE0, "literals": productE0, "\\": productE0 },
            { "|": productEp0, ")": productEp1, "eof": productEp1 },
            { "(": productT0, "literals": productT0, "\\": productT0 },
            { "|": productTp1, "(": productTp0, ")": productTp1, "literals": productTp0, "\\": productTp0, "eof": productTp1 },
            { "(": productU0, "literals": productU0, "\\": productU0 },
            { "|": productUp1, "*": productUp0, "+": productUp0, "?": productUp0, "(": productUp1, ")": productUp1, "literals": productUp1, "\\": productUp1, "eof": productUp1 },
            { "(": productA1, "literals": productA0, "\\": productA0 },
            { "literals": productLit0, "\\": productLit1 },
        ];
    }

    export class RegExpASTBuilder {

        private stack: Records.RecordType[] = [];
        private inputStr: string;

        constructor(str: string) {
            this.inputStr = str;
        }

        error(): never {
            throw "error";
        }

        run() {
            let ip = 0;
            let shift = false;

            const eof = new Records.Terminal("eof");
            const e = new Records.Nonterminal(1);
            const ep = new Records.Synthesize(1, function (this: Records.Synthesize) {
                console.log(JSON.stringify(this.vals["val"], undefined, 4));
            });
            this.stack.push(eof);
            this.stack.push(ep);
            this.stack.push(e);

            while (this.stack.length !== 0) {
                if (this.stack.length > 100) {
                    this.error();
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
                        this.error();
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
                            this.error();
                        }
                    }
                    else {
                        const lit = OperationMap.M[x.index][a];
                        if (lit) {
                            lit(this.stack);
                        }
                        else {
                            this.error();
                        }
                    }
                }
            }
        }

        private checkIsLiterals(str: string) {
            return ["|", "*", "+", "?", "(", ")", "\\", "eof"].indexOf(str) === -1;
        }

        private checkIsSpecials(str: string) {
            return ["|", "*", "+", "?", "(", ")", "\\", "w", "d"].indexOf(str) !== -1;
        }
    }
}

