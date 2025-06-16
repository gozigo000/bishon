import { toArrayBuffer } from "@/_utils/dataType";
import fs from "fs";
import JSZip from "jszip";

/**
 * 파일 핸들러 생성
 */
export async function openFile(input: Input): Promise<FileHandler> {
    if ("path" in input) {
        return await loadZip(await toArrayBuffer(fs.readFileSync(input.path)));
    }
    if ("buffer" in input) {
        return await loadZip(await toArrayBuffer(input.buffer));
    }
    if ("file" in input) {
        return await loadZip(await toArrayBuffer(input.file));
    }
    if ("arrayBuffer" in input) {
        return await loadZip(input.arrayBuffer);
    }
    throw new Error("Could not find file in options");
}

type Encoding =
    | "text"
    | "utf-8"
    | "string"
    | "base64"
    | "binarystring"
    | "array"
    | "uint8array"
    | "arraybuffer"
    | "blob"
    | "nodebuffer"

// readFile 오버로딩 시그니처를 loadZip 바깥에 선언
export interface FileHandler {
    exists(name: string): boolean;
    readFile(name: string): Promise<Uint8Array>;
    readFile(name: string, encoding: "blob"): Promise<Blob>;
    readFile(name: string, encoding: "nodebuffer"): Promise<Buffer>;
    readFile(name: string, encoding: "arraybuffer"): Promise<ArrayBuffer>;
    readFile(name: string, encoding: "array" | "uint8array"): Promise<Uint8Array>;
    readFile(name: string, encoding: "text" | "utf-8" | "string" | "base64" | "binarystring"): Promise<string>;
    writeFile(name: string, contents: string | Uint8Array | ArrayBuffer): void;
    toArrayBuffer(): Promise<ArrayBuffer>;
}

async function loadZip(arrayBuffer: ArrayBuffer): Promise<FileHandler> {
    const zipFile = await JSZip.loadAsync(arrayBuffer);
    return {
        exists: (name: string): boolean => {
            return zipFile.file(name) !== null;
        },
        async readFile(name: string, encoding?: Encoding): Promise<any> {
            const file = zipFile.file(name);
            if (!file) throw new Error(`파일을 찾을 수 없습니다: ${name}`);
            const array: Uint8Array = await file.async("uint8array");
            switch (encoding) {
                case "text": return await file.async("text");
                case "utf-8": return new TextDecoder(encoding).decode(array);
                case "string": return await file.async("string");
                case "base64": return await file.async("base64");
                case "binarystring": return await file.async("binarystring");
                case "array": return await file.async("array");
                case "uint8array": return await file.async("uint8array");
                case "arraybuffer": return await file.async("arraybuffer");
                case "nodebuffer": return await file.async("nodebuffer");
                case "blob": return await file.async("blob");
                default: return array;
            }
        },
        writeFile: (name: string, contents: string | Uint8Array | ArrayBuffer) => {
            zipFile.file(name, contents);
        },
        toArrayBuffer: async (): Promise<ArrayBuffer> => {
            return zipFile.generateAsync({ type: "arraybuffer" });
        }
    };
}

