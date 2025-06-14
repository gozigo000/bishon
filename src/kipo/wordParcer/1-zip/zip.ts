import { toArrayBuffer } from "@/_utils/dataType";
import fs from "fs";
import JSZip from "jszip";

/**
 * 입력 형식에 따라 파일을 읽어오기.
 */
export async function openZip(input: Input): Promise<Zip> {
    if ("path" in input) {
        return await makeZip(await toArrayBuffer(fs.readFileSync(input.path)));
    }
    if ("buffer" in input) {
        return await makeZip(await toArrayBuffer(input.buffer));
    }
    if ("arrayBuffer" in input) {
        return await makeZip(input.arrayBuffer);
    }
    throw new Error("Could not find file in options");
}

async function makeZip(arrayBuffer: ArrayBuffer): Promise<Zip> {
    const zipFile = await JSZip.loadAsync(arrayBuffer);
    return {
        exists: (name: string): boolean => {
            return zipFile.file(name) !== null;
        },
        readFile: async (name: string, encoding?: string): Promise<Uint8Array | string> => {
            const file = zipFile.file(name);
            if (!file) throw new Error(`File not found: ${name}`);
            const array: Uint8Array = await file.async("uint8array");

            if (encoding === "base64") {
                return await file.async("base64");
            } else if (encoding) {
                return new TextDecoder(encoding).decode(array);
            } else {
                return array;
            }
        },
        write: (name: string, contents: string | Uint8Array | ArrayBuffer) => {
            zipFile.file(name, contents);
        },
        toArrayBuffer: async (): Promise<ArrayBuffer> => {
            return zipFile.generateAsync({ type: "arraybuffer" });
        }
    };
}

