import { styleText as style, inspect } from "util";
import { isObject } from "../kipo/0-utils/typeCheck";

// 기타 스타일 옵션
// "bold", "italic", "underline"
// "doubleunderline", "strikethrough"
// "dim", "reset", "blink", "framed"
// "hidden", "inverse", "overlined"

export function print(...input: any) {
    if (isObject(input[0])) {
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


// 색상 코드
// const ANSI = {
//     reset: "\x1b[0m",
//     bold: "\x1b[1m",

//     black: "\x1b[30m",
//     red: "\x1b[31m",
//     green: "\x1b[32m",
//     yellow: "\x1b[33m",
//     blue: "\x1b[34m",
//     magenta: "\x1b[35m",
//     cyan: "\x1b[36m",
//     white: "\x1b[37m",
//     gray: "\x1b[90m",

//     brightRed: "\x1b[91m",
//     brightGreen: "\x1b[92m",
//     brightYellow: "\x1b[93m",
//     brightBlue: "\x1b[94m",
//     brightMagenta: "\x1b[95m",
//     brightCyan: "\x1b[96m",
//     brightWhite: "\x1b[97m",

//     bgRed: "\x1b[41m",
//     bgGreen: "\x1b[42m",
//     bgYellow: "\x1b[43m",
//     bgBlue: "\x1b[44m",
//     bgMagenta: "\x1b[45m",
//     bgCyan: "\x1b[46m",
//     bgWhite: "\x1b[47m"
// };

// export const color = {
//     // 글자색
//     black: (text: string) => `${ANSI.black}${text}${ANSI.reset}`,
//     red: (text: string) => `${ANSI.red}${text}${ANSI.reset}`,
//     green: (text: string) => `${ANSI.green}${text}${ANSI.reset}`,
//     yellow: (text: string) => `${ANSI.yellow}${text}${ANSI.reset}`,
//     blue: (text: string) => `${ANSI.blue}${text}${ANSI.reset}`,
//     magenta: (text: string) => `${ANSI.magenta}${text}${ANSI.reset}`,
//     cyan: (text: string) => `${ANSI.cyan}${text}${ANSI.reset}`,
//     white: (text: string) => `${ANSI.white}${text}${ANSI.reset}`,
//     gray: (text: string) => `${ANSI.gray}${text}${ANSI.reset}`,
//     brRed: (text: string) => `${ANSI.brightRed}${text}${ANSI.reset}`,
//     brGreen: (text: string) => `${ANSI.brightGreen}${text}${ANSI.reset}`,
//     brYellow: (text: string) => `${ANSI.brightYellow}${text}${ANSI.reset}`,
//     brBlue: (text: string) => `${ANSI.brightBlue}${text}${ANSI.reset}`,
//     brMagenta: (text: string) => `${ANSI.brightMagenta}${text}${ANSI.reset}`,
//     brCyan: (text: string) => `${ANSI.brightCyan}${text}${ANSI.reset}`,
//     brWhite: (text: string) => `${ANSI.brightWhite}${text}${ANSI.reset}`,

//     // 배경색 + 어울리는 글자색 + bold
//     bgRed: (text: string) => `${ANSI.bgRed}${ANSI.white}${text}${ANSI.reset}`,
//     bgGreen: (text: string) => `${ANSI.bold}${ANSI.bgGreen}${ANSI.black}${text}${ANSI.reset}`,
//     bgYellow: (text: string) => `${ANSI.bold}${ANSI.bgYellow}${ANSI.black}${text}${ANSI.reset}`,
//     bgBlue: (text: string) => `${ANSI.bold}${ANSI.bgBlue}${ANSI.white}${text}${ANSI.reset}`,
//     bgMagenta: (text: string) => `${ANSI.bold}${ANSI.bgMagenta}${ANSI.white}${text}${ANSI.reset}`,
//     bgCyan: (text: string) => `${ANSI.bold}${ANSI.bgCyan}${ANSI.black}${text}${ANSI.reset}`,
//     bgWhite: (text: string) => `${ANSI.bold}${ANSI.bgWhite}${ANSI.black}${text}${ANSI.reset}`
// };
