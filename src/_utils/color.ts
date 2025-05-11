// 색상 코드
const ANSI = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",

    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",

    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",

    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m"
};

export const color = {
    // 글자색
    black: (text: string) => `${ANSI.black}${text}${ANSI.reset}`,
    red: (text: string) => `${ANSI.red}${text}${ANSI.reset}`,
    green: (text: string) => `${ANSI.green}${text}${ANSI.reset}`,
    yellow: (text: string) => `${ANSI.yellow}${text}${ANSI.reset}`,
    blue: (text: string) => `${ANSI.blue}${text}${ANSI.reset}`,
    magenta: (text: string) => `${ANSI.magenta}${text}${ANSI.reset}`,
    cyan: (text: string) => `${ANSI.cyan}${text}${ANSI.reset}`,
    white: (text: string) => `${ANSI.white}${text}${ANSI.reset}`,
    gray: (text: string) => `${ANSI.gray}${text}${ANSI.reset}`,
    brRed: (text: string) => `${ANSI.brightRed}${text}${ANSI.reset}`,
    brGreen: (text: string) => `${ANSI.brightGreen}${text}${ANSI.reset}`,
    brYellow: (text: string) => `${ANSI.brightYellow}${text}${ANSI.reset}`,
    brBlue: (text: string) => `${ANSI.brightBlue}${text}${ANSI.reset}`,
    brMagenta: (text: string) => `${ANSI.brightMagenta}${text}${ANSI.reset}`,
    brCyan: (text: string) => `${ANSI.brightCyan}${text}${ANSI.reset}`,
    brWhite: (text: string) => `${ANSI.brightWhite}${text}${ANSI.reset}`,

    // 배경색 + 어울리는 글자색 + bold
    bgRed: (text: string) => `${ANSI.bgRed}${ANSI.white}${text}${ANSI.reset}`,
    bgGreen: (text: string) => `${ANSI.bold}${ANSI.bgGreen}${ANSI.black}${text}${ANSI.reset}`,
    bgYellow: (text: string) => `${ANSI.bold}${ANSI.bgYellow}${ANSI.black}${text}${ANSI.reset}`,
    bgBlue: (text: string) => `${ANSI.bold}${ANSI.bgBlue}${ANSI.white}${text}${ANSI.reset}`,
    bgMagenta: (text: string) => `${ANSI.bold}${ANSI.bgMagenta}${ANSI.white}${text}${ANSI.reset}`,
    bgCyan: (text: string) => `${ANSI.bold}${ANSI.bgCyan}${ANSI.black}${text}${ANSI.reset}`,
    bgWhite: (text: string) => `${ANSI.bold}${ANSI.bgWhite}${ANSI.black}${text}${ANSI.reset}`
};
// 전역 스코프에 color 추가
declare global { var color: {
    black: (text: string) => string;
    red: (text: string) => string;
    green: (text: string) => string;
    yellow: (text: string) => string;
    blue: (text: string) => string;
    magenta: (text: string) => string;
    cyan: (text: string) => string;
    white: (text: string) => string;
    gray: (text: string) => string;
    brRed: (text: string) => string;
    brGreen: (text: string) => string;
    brYellow: (text: string) => string;
    brBlue: (text: string) => string;
    brMagenta: (text: string) => string;
    brCyan: (text: string) => string;
    brWhite: (text: string) => string;
    bgRed: (text: string) => string;
    bgGreen: (text: string) => string;
    bgYellow: (text: string) => string;
    bgBlue: (text: string) => string;
    bgMagenta: (text: string) => string;
    bgCyan: (text: string) => string;
    bgWhite: (text: string) => string;
} }
(globalThis as any).color = color;