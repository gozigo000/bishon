import { styleText as style, inspect } from "util";

// 기타 스타일 옵션
// "bold", "italic", "underline"
// "doubleunderline", "strikethrough"
// "dim", "reset", "blink", "framed"
// "hidden", "inverse", "overlined"

export function print(...input: any) {
    if (typeof input[0] === 'object') {
        console.debug(inspect(input[0], { depth: Infinity, colors: true }));
    } else {
        console.debug(style(['blue'], input.join(", ")));
    }
}
// 글자색
print.gray = (...text: any) => console.debug(style(['gray'], text.join(", ")));
print.grey = (...text: any) => console.debug(style(['gray'], text.join(", ")));
print.blue = (...text: any) => console.debug(style(['blue'], text.join(", ")));
print.blueBr = (...text: any) => console.debug(style(['blueBright'], text.join(", ")));
print.cyan = (...text: any) => console.debug(style(['cyan'], text.join(", ")));
print.cyanBr = (...text: any) => console.debug(style(['cyanBright'], text.join(", ")));
print.green = (...text: any) => console.debug(style(['green'], text.join(", ")));
print.greenBr = (...text: any) => console.debug(style(['greenBright'], text.join(", ")));
print.magenta = (...text: any) => console.debug(style(['magenta'], text.join(", ")));
print.magentaBr = (...text: any) => console.debug(style(['magentaBright'], text.join(", ")));
print.red = (...text: any) => console.debug(style(['red'], text.join(", ")));
print.redBr = (...text: any) => console.debug(style(['redBright'], text.join(", ")));
print.yellow = (...text: any) => console.debug(style(['yellow'], text.join(", ")));
print.yellowBr = (...text: any) => console.debug(style(['yellowBright'], text.join(", ")));
print.white = (...text: any) => console.debug(style(['white'], text.join(", ")));
print.whiteBr = (...text: any) => console.debug(style(['whiteBright'], text.join(", ")));
// 배경색 + 볼드체
print.bgGray = (...text: any) => console.debug(style(['white', 'bgGray', 'bold'], text.join(", ")));
print.bgGrey = (...text: any) => console.debug(style(['bgGray', 'bold'], text.join(", ")));
print.bgBlue = (...text: any) => console.debug(style(['white', 'bgBlue', 'bold'], text.join(", ")));
print.bgBlueBr = (...text: any) => console.debug(style(['white', 'bgBlueBright', 'bold'], text.join(", ")));
print.bgCyan = (...text: any) => console.debug(style(['black', 'bgCyan', 'bold'], text.join(", ")));
print.bgCyanBr = (...text: any) => console.debug(style(['black', 'bgCyanBright', 'bold'], text.join(", ")));
print.bgGreen = (...text: any) => console.debug(style(['black', 'bgGreen', 'bold'], text.join(", ")));
print.bgGreenBr = (...text: any) => console.debug(style(['black', 'bgGreenBright', 'bold'], text.join(", ")));
print.bgMagenta = (...text: any) => console.debug(style(['white', 'bgMagenta', 'bold'], text.join(", ")));
print.bgMagentaBr = (...text: any) => console.debug(style(['white', 'bgMagentaBright', 'bold'], text.join(", ")));
print.bgRed = (...text: any) => console.debug(style(['white', 'bgRed', 'bold'], text.join(", ")));
print.bgRedBr = (...text: any) => console.debug(style(['white', 'bgRedBright', 'bold'], text.join(", ")));
print.bgYellow = (...text: any) => console.debug(style(['black', 'bgYellow', 'bold'], text.join(", ")));
print.bgYellowBr = (...text: any) => console.debug(style(['black', 'bgYellowBright', 'bold'], text.join(", ")));
print.bgWhite = (...text: any) => console.debug(style(['black', 'bgWhite', 'bold'], text.join(", ")));
print.bgWhiteBr = (...text: any) => console.debug(style(['black', 'bgWhiteBright', 'bold'], text.join(", ")));
