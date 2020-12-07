
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

    constructor(from?: string, to?: string) {
        if (from === undefined) return;
        if (to === undefined) to = from;
        this.ranges.push([from, to]);
    }

    merge(cr: CharRange | undefined) {
        if (cr === undefined) return this;
        let result: [string, string][] = [];
        result = [...this.ranges, ...cr.ranges];
        result.sort((a, b) => {
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
        // try to seam up
        let curr: [string, string] = result[0];
        let res: [string, string][] = [result[0]];
        result.forEach(a => {
            if (a[0] <= curr[1]) { // can seam
                if (a[1] <= curr[1]) return; // omit
                else {
                    curr[1] = a[1];
                }
            }
            else {
                res.push(a);
                curr = a;
            }
        });
        this.ranges = res;
        return this;
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

export function splitRanges(crs: (string | CharRange)[]) {
    let indexes = crs.map(() => 0);

    const ranges = crs.map(a => {
        if (typeof a === "string") {
            let cCode = a.charCodeAt(0);
            return [cCode, cCode + 1];
        }
        else {
            return a.ranges.reduce((r: number[], b) => {
                r.push(b[0].charCodeAt(0), b[1].charCodeAt(0) + 1);
                return r;
            }, [])
        }
    });

    const splitted = getSplittedRange();

    let result: (string | CharRange)[][] = crs.map(() => []);
    splitted.forEach(a => {
        let cr: string | CharRange;
        if (a.range.length === 2 && a.range[0] === a.range[1] - 1) {
            cr = String.fromCharCode(a.range[0]);
        }
        else {
            cr = new CharRange();
            let handled: [string, string][] = [];
            for (let i = 0; i < a.range.length; i += 2) {
                handled.push([String.fromCharCode(a.range[i]), String.fromCharCode(a.range[i + 1] - 1)]);
            }
            cr.ranges = handled;
        }
        a.whos.forEach(w => {
            result[w].push(cr);
        });
    });

    return result;

    function getSplittedRange() {
        let c = 0;
        let opened: number[] = [];
        let curMin: number = Number.MIN_SAFE_INTEGER;
        let results: { range: number[]; whos: number[]; }[] = [];
        const all = ranges.reduce((t, a) => t + a.length, 0);
        do {
            const mins = getMins();
            c += mins.minIndexes.length;
            if (mins.isLeft) {
                if (opened.length > 0 && mins.minVal > curMin) {
                    let range: [number, number] = [curMin, mins.minVal];
                    let whos = opened.slice(0);
                    joinResults(results, range, whos);
                }
                opened.push(...mins.minIndexes);
                curMin = mins.minVal;
            }
            else {
                if (mins.minVal > curMin) {
                    let range: [number, number] = [curMin, mins.minVal];
                    let whos = opened.slice(0);
                    joinResults(results, range, whos);
                }
                opened = opened.filter(a => mins.minIndexes.indexOf(a) === -1);
                curMin = mins.minVal;
            }
        } while (c < all);

        return results;
    }

    function joinResults(results: { range: number[]; whos: number[]; }[], range: [number, number], whos: number[]) {
        let found = results.find(a => {
            if (a.whos.length === whos.length) {
                return a.whos.every(b => whos.indexOf(b) !== -1);
            }
            return false;
        })
        if (found) {
            found.range.push(...range);
        }
        else {
            results.push({ range: range, whos: whos });
        }
    }

    function getMins() {
        let curs = ranges.map((a, i) => a[indexes[i]] ?? Number.MAX_SAFE_INTEGER);

        let isLeft: boolean = true;
        let minVal: number = Number.MAX_SAFE_INTEGER;
        let minIndexes: number[] = [];

        for (let i = 0; i < curs.length; i++) {
            if (curs[i] < minVal) {
                minVal = curs[i];
                minIndexes = [i];
                isLeft = indexes[i] % 2 === 0;
            }
            else if (curs[i] === minVal) {
                if (isLeft) {
                    if (indexes[i] % 2 === 0) {
                        minIndexes.push(i);
                    }
                    else {
                        // ignore
                    }
                }
                else {
                    if (indexes[i] % 2 === 0) {
                        minVal = curs[i];
                        minIndexes = [i];
                        isLeft = true;
                    }
                    else {
                        minIndexes.push(i);
                    }
                }
            }
            else {
                // ignore
            }
        }

        minIndexes.forEach(a => {
            indexes[a] = indexes[a] + 1;
        });

        return { minVal: minVal, minIndexes: minIndexes, isLeft: isLeft };
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

