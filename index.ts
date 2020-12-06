import { parseAST, searchAST } from "./regularExp/Parser";

console.log("test 1");
let ast0 = parseAST("(a|b)*abb");
// test
if (ast0) {
    console.log(searchAST(ast0, "abb"));        // t
    console.log(searchAST(ast0, "abbc"));       // f
    console.log(searchAST(ast0, "ab"));         // f
    console.log(searchAST(ast0, "aaaaaaaabb")); // t
    console.log(searchAST(ast0, "ab1234567b")); // f
    console.log(searchAST(ast0, "abaaaaaaab")); // f
    console.log(searchAST(ast0, "abbbbbbabb")); // t
    console.log(searchAST(ast0, "aaaaaaaabb")); // t
}

console.log("test 2");
let ast1 = parseAST("(a|b)*\\dbb");
// test
if (ast1) {
    console.log(searchAST(ast1, "1bb"));        // t
    console.log(searchAST(ast1, "2bb"));        // t
    console.log(searchAST(ast1, "abb"));        // f
    console.log(searchAST(ast1, "aaaaaaaabb")); // f
    console.log(searchAST(ast1, "ab123456bb")); // f
    console.log(searchAST(ast1, "12345667ab")); // f
    console.log(searchAST(ast1, "abbbbbb0bb")); // t
    console.log(searchAST(ast1, "aaaaaaaabb")); // f
}
