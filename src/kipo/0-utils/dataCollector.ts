import fs from 'fs';
import path from 'path';
import { isProd } from '../../_utils/env';
import { OnDevTest } from './decorators/devHandler';
import { toBuffer } from '@/_utils/dataType';
import { isObject, isString } from '../../_utils/typeCheck';

/**
 * 전역 데이터 수집기 클래스
 * @note 싱글톤 패턴
 */
export class DataCollector {
    private static instance: DataCollector;
    private savePath: string | null | undefined = undefined;
    private lines: Line[] = [];
    private pages: Page[] = [];
    private latexes: Latex[] = [];
    private refs: Record<string, string> = {};
    private files: Record<string, Buffer> = {};
    private constructor() { }

    /** DataCollector의 인스턴스 반환 */
    public static get $(): DataCollector {
        if (!DataCollector.instance) {
            DataCollector.instance = new DataCollector();
        }
        return DataCollector.instance;
    }

    public clearAll(): void {
        this.savePath = undefined;
        this.lines = [];
        this.pages = [];
        this.latexes = [];
        this.files = {};
        this.refs = {};
    }

    public saveAll(fileName: string, otherPath?: string): void {
        this.savePages(fileName, otherPath);
        this.saveLatex(fileName, otherPath);
        this.saveFiles(fileName, otherPath);
        this.saveRefs(fileName, otherPath);
    }

    @OnDevTest
    private getSavePath(fileName: string): string | null {
        if (this.savePath !== undefined) return this.savePath;

        const memo = path.join(process.cwd(), 'public/test-dir-path.txt');
        const ROOT_PATH = fs.readFileSync(memo, 'utf8');
        const dirName = fileName.replace(/[ _가-힣]/g, '');
        const dirPath = path.join(ROOT_PATH, dirName);

        if (!fs.existsSync(dirPath)) {
            console.debug(`폴더가 존재하지 않습니다: ${dirPath}`);
            this.savePath = null;
            return null;
        }

        const savePath = path.join(dirPath, '/TEST');
        if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
        }

        this.savePath = savePath;
        return savePath;
    }

    @OnDevTest
    public addLine(line: Line): void { this.lines.push(line); }
    public clearLinesPages(): void { this.lines = []; this.pages = []; }
    @OnDevTest
    public savePages(fileName: string, otherPath?: string): void {
        const savePath = otherPath || this.getSavePath(fileName);
        if (!savePath) return;

        fs.writeFileSync(path.join(savePath, `${fileName}_PageCount.txt`), this.formatPages());
        this.clearLinesPages();
    }

    public formatPages(): string {
        this.fillPages();
        return this.pages.map(page => {
            return page.lines.map(ln => {
                const w = ln.W.toFixed(1).padStart(5, ' ');
                const h = ln.H.toFixed(1).padStart(5, ' ');
                return `p.${ln.pageNum}: w: ${w}, h: ${h} -- ${ln.lineText}`
            }).join('\n');
        }).join('\n\n');
    }

    private fillPages(): Page[] {
        if (this.pages.length > 0) {
            return this.pages;
        }

        let page: Page = { pageNum: 1, lines: [] };
        let currPageNum = 1;
        for (const line of this.lines) {
            const pageNum = line.pageNum || 0;
            if (pageNum !== currPageNum) {
                this.pages.push(page);
                page = { pageNum, lines: [] };
                currPageNum = pageNum;
            }
            page.lines.push(line);
        }
        this.pages.push(page);

        return this.pages;
    }

    @OnDevTest
    public addLatex(latex: Latex): void { this.latexes.push(latex); }
    public getLatex(): Latex[] { return this.latexes; }
    public clearLatex(): void { this.latexes = []; }
    @OnDevTest
    public saveLatex(fileName: string, otherPath?: string): void {
        const savePath = otherPath || this.getSavePath(fileName);
        if (!savePath) return;

        if (this.latexes.length === 0) {
            const noLatexSavePath = path.join(savePath, '/no-latex');
            if (!fs.existsSync(noLatexSavePath)) {
                fs.mkdirSync(noLatexSavePath);
            }
            return;
        }

        const texXmlSavePath = path.join(savePath, '/latexes_tex_xml');
        if (!fs.existsSync(texXmlSavePath)) {
            fs.mkdirSync(texXmlSavePath);
        }
        for (const latex of this.latexes) {
            fs.writeFileSync(path.join(texXmlSavePath, `${fileName}_${latex.name}.tex`), latex.latex);
            if (!latex.omml) continue;
            fs.writeFileSync(path.join(texXmlSavePath, `${fileName}_${latex.name}.xml`), latex.omml);
        }

        const svgSavePath = path.join(savePath, '/latexes_svg');
        if (!fs.existsSync(svgSavePath)) {
            fs.mkdirSync(svgSavePath);
        }
        for (const latex of this.latexes) {
            if (!latex.svg) continue;
            fs.writeFileSync(path.join(svgSavePath, `${fileName}_${latex.name}.svg`), latex.svg);
        }

        this.clearLatex();
    }

    @OnDevTest
    public addFile(name: string, file: Buffer): void { this.files[name] = file; }
    public clearFiles(): void { this.files = {}; }
    @OnDevTest
    public saveFiles(fileName: string, otherPath?: string): void {
        const savePath = otherPath || this.getSavePath(fileName);
        if (!savePath) return;

        for (const [name, file] of Object.entries(this.files)) {
            fs.writeFileSync(path.join(savePath, name), file);
        }
        this.clearFiles();
    }

    @OnDevTest
    public addRef(name: string, file: string): void { this.refs[name] = file; }
    public clearRefs(): void { this.refs = {}; }
    @OnDevTest
    public saveRefs(fileName: string, otherPath?: string): void {
        const savePath = otherPath || this.getSavePath(fileName);
        if (!savePath) return;

        for (const [name, file] of Object.entries(this.refs)) {
            if (file === '' || file === '[]' || file === '{}') {
                fs.writeFileSync(path.join(savePath, `${fileName}_${name} - EMPTY`), file);
                continue;
            }
            fs.writeFileSync(path.join(savePath, `${fileName}_${name}`), file);
        }
        this.clearRefs();
    }
}

export function collectLine(data: Line | Line[], id?: string): void {
    if (isProd()) return;
    if (Array.isArray(data)) {
        data.forEach(line => DataCollector.$.addLine(line));
    } else {
        DataCollector.$.addLine(data);
    }
}

export function collectLatex(data: Latex, id?: string): void {
    if (isProd()) return;
    const collectedLatex = DataCollector.$.getLatex();
    const cl = collectedLatex.find(l => l.latex === data.latex);
    if (!cl) {
        data.name = `${collectedLatex.length + 1}`;
        DataCollector.$.addLatex(data);
    }
    else if (data.svg) {
        cl.svg = data.svg;
    }
}


export async function collectFile(data: Record<string, File>, id?: string): Promise<void> {
    if (isProd()) return;
    for (const [name, file] of Object.entries(data)) {
        const buffer = await toBuffer(file);
        DataCollector.$.addFile(name, buffer);
    }
}

export function collectRefs(data: Record<string, string | object>, id?: string): void {
    if (isProd()) return;
    for (const [name, file] of Object.entries(data)) {
        const contents = isObject(file) ? stringify(name, file) : file;
        DataCollector.$.addRef(name, contents);
    }
}

export function stringify(name: string, file: object): string {
    const TAPSIZE = 2;

    if (name.includes('countingReport')) {
        return JSON.stringify(file, (_: string, value: any) => {
            if (Array.isArray(value)) {
                if (value.every(item => isString(item))) {
                    return `${value.map(v => `${v}`).join(', ')}`;
                }
                // 저장 시 "cnt": 0인 항목은 제외함.
                return value.filter(item => item.cnt !== 0);
            }
            return value;
        }, TAPSIZE);
    }

    if (name.includes('diffReport') || name.includes('diffAfterInspection')) {
        return JSON.stringify(file, (key: string, value: any) => {
            if (Array.isArray(value)) {
                if (key === 'diffs') {
                    const diffs: { [key: string]: string } = {};
                    value.forEach(([type, content]) => {
                        if (type === 1) diffs['+'] = content;
                        if (type === -1) diffs['-'] = content;
                        if (type === 0) diffs['o'] = content;
                    });
                    return diffs;
                }
                // 저장 시 `type: 동일`인 항목은 제외함.
                return value.filter(item => item.type !== "동일");
            }
            return value;
        }, TAPSIZE);
    }

    return JSON.stringify(file, null, TAPSIZE);
}