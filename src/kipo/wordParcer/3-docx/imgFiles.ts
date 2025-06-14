import fs from "fs";
import os from "os";
import { resolve } from "path";

export class ImgFiles {
    private base: string | null;

    constructor(base: string | null) {
        this.base = base;
    }

    public async readImg(uri: string, encoding?: BufferEncoding): Promise<string> {
        try {
            const path = await this.resolveUri(uri);
            const result = fs.readFileSync(path, encoding);
            return typeof result === "string" ? result : result.toString();
        } catch (error: any) {
            throw new Error(`could not open external image: '${uri}' (document directory: '${this.base}')\n${(error as Error).message}`);
        }
    }

    private async resolveUri(uri: string): Promise<string> {
        const path = uriToPath(uri);
        if (isAbsolutePath(path)) {
            return path;
        } else if (this.base) {
            return resolve(this.base, path);
        } else {
            throw new Error(`could not find external image '${uri}', path of input document is unknown`);
        }
    }
}

function uriToPath(uriString: string, platform?: string): string {
    if (!platform) {
        platform = os.platform();
    }

    const uri = new URL(uriString, 'file://');
    if (isLocalFileUri(uri) || isRelativeUri(uri)) {
        let path = decodeURIComponent(uri.pathname);
        if (platform === "win32" && /^\/[a-z]:/i.test(path)) {
            return path.slice(1);
        } else {
            return path;
        }
    } else {
        throw new Error("Could not convert URI to path: " + uriString);
    }
}

function isLocalFileUri(uri: URL): boolean {
    return uri.protocol === "file:" && (!uri.host || uri.host === "localhost");
}

function isRelativeUri(uri: URL): boolean {
    return !uri.protocol && !uri.host;
}

function isAbsolutePath(path: string): boolean {
    function posix(path: string): boolean {
        return path.charAt(0) === '/';
    }

    function win32(path: string): boolean {
        const splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
        const result = splitDeviceRe.exec(path);
        if (!result) return false;
        const device = result[1] || '';
        const isUnc = Boolean(device && device.charAt(1) !== ':');
        return Boolean(result[2] || isUnc);
    }

    return process.platform === 'win32' ? win32(path) : posix(path);
}
