import { ASTBuilder } from "./regularExp/ASTBuilder";

let ll = new ASTBuilder("a?b|c+|(a*b|c\\d\\\\)");
let result = ll.run();

console.log(JSON.stringify(result, undefined, 2));

