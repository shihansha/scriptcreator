import { parseAST, testAST } from "./regularExp/Parser";

console.log("test 1");
let ast0 = parseAST("(a|b)*abb");
// test
if (ast0) {
    console.log(testAST(ast0, "abb"));        // t
    console.log(testAST(ast0, "abbc"));       // f
    console.log(testAST(ast0, "ab"));         // f
    console.log(testAST(ast0, "aaaaaaaabb")); // t
    console.log(testAST(ast0, "ab1234567b")); // f
    console.log(testAST(ast0, "abaaaaaaab")); // f
    console.log(testAST(ast0, "abbbbbbabb")); // t
    console.log(testAST(ast0, "aaaaaaaabb")); // t
}

console.log("test 2");
let ast1 = parseAST("(a|b)*\\dbb");
// test
if (ast1) {
    console.log(testAST(ast1, "1bb"));        // t
    console.log(testAST(ast1, "2bb"));        // t
    console.log(testAST(ast1, "abb"));        // f
    console.log(testAST(ast1, "aaaaaaaabb")); // f
    console.log(testAST(ast1, "ab123456bb")); // f
    console.log(testAST(ast1, "12345667ab")); // f
    console.log(testAST(ast1, "abbbbbb0bb")); // t
    console.log(testAST(ast1, "aaaaaaaabb")); // f
}
