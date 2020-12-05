
export type TYPE_OP = "CAT" | "OR" | "*" | "+" | "?";
export class ASTBase {
    flag: boolean = false;
    nullable: boolean = false;
    firstpos: Set<number> = new Set();
    lastpos: Set<number> = new Set();
    followpos: Set<number> = new Set();
}

export class Leaf extends ASTBase {
    value: string;
    index = -1;
    constructor(value: string) {
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

