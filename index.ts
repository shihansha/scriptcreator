import { parseAST, searchAST } from "./regularExp/Parser";

console.log("test 1");
let ast0 = parseAST("[a-z1-4]*abb");

// 测试从开始起最多能够捕获多少个字符。
if (ast0) {
    console.log(searchAST(ast0, "abb"));        // 3
    console.log(searchAST(ast0, "abbc"));       // 3
    console.log(searchAST(ast0, "ab"));         // 0
    console.log(searchAST(ast0, "aaaaaaaabb")); // 10
    console.log(searchAST(ast0, "ab1234567b")); // 0
    console.log(searchAST(ast0, "abaaaaaaab")); // 0
    console.log(searchAST(ast0, "12345bbabb")); // 0
    console.log(searchAST(ast0, "asdfabb111")); // 7
}
