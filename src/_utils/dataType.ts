
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
