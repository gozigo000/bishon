import mammoth from "mammoth";

export async function toFile(input: FileOrBuffer): Promise<File> {
    if (input instanceof File) {
        return input;
    }
    if (input instanceof Buffer) {
        return new File([input], 'file.bin');
    }
    if (input instanceof ArrayBuffer) {
        return new File([input], 'file.bin');
    }
    throw new Error('지원하지 않는 타입입니다.');
}

export async function toBuffer(input: FileOrBuffer): Promise<Buffer> {
    if (input instanceof File) {
        return Buffer.from(await input.arrayBuffer());
    }
    if (input instanceof ArrayBuffer) {
        return Buffer.from(input);
    }
    return input;
}

export async function toArrayBuffer(input: FileOrBuffer): Promise<ArrayBuffer> {
    if (input instanceof File) {
        return await input.arrayBuffer();
    }
    if (input instanceof Buffer) {
        const output = input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
        if (output instanceof SharedArrayBuffer) {
            const ab = new ArrayBuffer(output.byteLength);
            new Uint8Array(ab).set(new Uint8Array(output));
            return ab;
        }
        return output;
    }
    if (input instanceof ArrayBuffer) {
        return input;
    }
    throw new Error('지원하지 않는 타입입니다.');
}


export async function getMammothHtml(input: FileOrBuffer): Promise<string> {
    try {
        const buffer = await toBuffer(input);
        var options = {
            ignoreEmptyParagraphs: false,
            convertImage: mammoth.images.imgElement(async (image) =>  { return { src: image.contentType } }),
        }
        const result = await mammoth.convertToHtml({ buffer: buffer }, options);
        let html = result.value;
        html = html.replace(/<h[0-9]+>([\s\S]*?)<\/h[0-9]+>/g, `<p>$1</p>`);
        html = html.replace(/<a id=".*?">/g, '');
        return html;

    } catch (error) {
        console.error("html 변환 실패:", error);
        throw error;
    }
}

// TODO: pageCounter에도 적용하기
export function toOneLine(ml: string): string {
    return ml.replace(/>\s+</g, '><').replace(/[\r\n]+/g, '');
}

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
    black: (text: string) => `${ANSI.black}${text}${ANSI.reset}`,
    red: (text: string) => `${ANSI.red}${text}${ANSI.reset}`,
    green: (text: string) => `${ANSI.green}${text}${ANSI.reset}`,
    yellow: (text: string) => `${ANSI.yellow}${text}${ANSI.reset}`,
    blue: (text: string) => `${ANSI.blue}${text}${ANSI.reset}`,
    magenta: (text: string) => `${ANSI.magenta}${text}${ANSI.reset}`,
    cyan: (text: string) => `${ANSI.cyan}${text}${ANSI.reset}`,
    white: (text: string) => `${ANSI.white}${text}${ANSI.reset}`,
    gray: (text: string) => `${ANSI.gray}${text}${ANSI.reset}`,
    brightRed: (text: string) => `${ANSI.brightRed}${text}${ANSI.reset}`,
    brightGreen: (text: string) => `${ANSI.brightGreen}${text}${ANSI.reset}`,
    brightYellow: (text: string) => `${ANSI.brightYellow}${text}${ANSI.reset}`,
    brightBlue: (text: string) => `${ANSI.brightBlue}${text}${ANSI.reset}`,
    brightMagenta: (text: string) => `${ANSI.brightMagenta}${text}${ANSI.reset}`,
    brightCyan: (text: string) => `${ANSI.brightCyan}${text}${ANSI.reset}`,
    brightWhite: (text: string) => `${ANSI.brightWhite}${text}${ANSI.reset}`,

    // 배경색 + 어울리는 글자색 + bold
    bgRed: (text: string) => `${ANSI.bgRed}${ANSI.white}${text}${ANSI.reset}`,
    bgGreen: (text: string) => `${ANSI.bold}${ANSI.bgGreen}${ANSI.black}${text}${ANSI.reset}`,
    bgYellow: (text: string) => `${ANSI.bold}${ANSI.bgYellow}${ANSI.black}${text}${ANSI.reset}`,
    bgBlue: (text: string) => `${ANSI.bold}${ANSI.bgBlue}${ANSI.white}${text}${ANSI.reset}`,
    bgMagenta: (text: string) => `${ANSI.bold}${ANSI.bgMagenta}${ANSI.white}${text}${ANSI.reset}`,
    bgCyan: (text: string) => `${ANSI.bold}${ANSI.bgCyan}${ANSI.black}${text}${ANSI.reset}`,
    bgWhite: (text: string) => `${ANSI.bold}${ANSI.bgWhite}${ANSI.black}${text}${ANSI.reset}`
};