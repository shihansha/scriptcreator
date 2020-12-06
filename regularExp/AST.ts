
export type TYPE_OP = "CAT" | "OR" | "*" | "+" | "?";
export class ASTBase {
    flag: boolean = false;
    nullable: boolean = false;
    firstpos: Set<number> = new Set();
    lastpos: Set<number> = new Set();
    followpos: Set<number> = new Set();
}

export class CharRange {

    ranges: [string, string][] = [];

    constructor(from: string, to?: string) {
        if (to === undefined) to = from;
        this.ranges.push([from, to]);
    }

    merge(cr: CharRange | undefined) {
        if (cr === undefined) return;
        this.ranges = [...this.ranges, ...cr.ranges];
        this.ranges.sort((a, b) => {
            if (a < b) {
                return -1;
            }
            else if (a > b) {
                return 1;
            }
            else {
                return 0;
            }
        });
    }

    inRange(c: string) {
        return this.ranges.some(a => c >= a[0] && c <= a[1]);
    }

    toString() {
        return this.ranges.reduce((l, a) => {
            if (a[0] === a[1]) {
                return l + a[0];
            }
            else {
                return l + a[0] + "-" + a[1];
            }
        }, "");
    }

    static fromString(str: string) {
        // assert: 'str' is correctly formatted
        let save: string | undefined;
        let cr: CharRange | undefined;
        let hi: boolean = false;
        for (const c of str) {
            if (save !== undefined) {
                if (c !== "-") {
                    if (hi) {
                        if (cr === undefined) cr = new CharRange(save, c);
                        else cr.merge(new CharRange(save, c));
                        hi = false;
                    }
                    else {
                        if (cr === undefined) cr = new CharRange(save);
                        else cr.merge(new CharRange(save));
                        save = c;
                    }
                }
                else {
                    hi = true;
                }
            }
            else {
                save = c;
            }
        }
        if (save !== undefined) {
            if (cr === undefined) cr = new CharRange(save);
            else cr.merge(new CharRange(save));
        }
        return cr;
    }
}

export class Leaf extends ASTBase {
    value: string | CharRange;
    index = -1;
    constructor(value: string | CharRange) {
        super();
        this.value = value;
    }

    clone(): Leaf {
        return new Leaf(this.value);
    }
}
export class Node extends ASTBase {
    op: TYPE_OP;
    children: (Node | Leaf)[];
    constructor(op: TYPE_OP, ...children: (Node | Leaf)[]) {
        super();
        this.op = op;
        this.children = children;
    }

    clone(): Node {
        return new Node(this.op, ...(this.children.map(a => a.clone())));
    }
}

