
import { RegExpParser } from "./regularExp/regExpParserFrontEnd";

let ll = new RegExpParser.RegExpASTBuilder("a?b|c+|(a*b|c\\d\\\\)");
ll.run();

