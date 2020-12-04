
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

