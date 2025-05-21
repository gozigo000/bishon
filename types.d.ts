declare type FileOrBuffer = File | Buffer | ArrayBuffer;
declare type Html = string;
declare type KXml = string;
declare type OXml = string;

declare type deliveryBox = {
    userDownloadFile: string | null;
    report: FinalReport;
    images?: Record<string, string>;
}; 

declare type FinalReport = {
    status: 'success' | 'fail' | 'error';
    generatedFiles: string[];
    countingReport: string;
    inspectionReport: string;
    diffReport: string;
    jpgImgs?: string;
    errorMsg?: string;
}; 

declare type CountingReport = CountInfo[];
declare type CountInfo = {
    kind: '수학식' | '표' | '청구항' | '도면' | '문단';
    cnt: number, 
    nums: string[]
};

declare type InspectionReport = InspectionMsg[];
declare type InspectionMsg = {
    kind: '개발' | '에러' | '경고';
    process: 'GO' | 'STOP';
    pos?: string;
    msg: string;
    from?: string;
}

declare type DiffReport = DiffLine[];
declare type DiffLine = { 
        type: '동일' | '삭제' | '추가'; 
        content: string 
    } | { 
        type: '수정'; 
        content: string 
        diffs: Diff[] 
    };

declare type Diff = [DiffOp, string];
declare enum DiffOp { Delete = -1, Equal = 0, Insert = 1 }

declare interface Img {
    name: string;
    buffer: ArrayBuffer;
    W?: number;
    H?: number;
}

declare interface Latex {
    name?: string;
    latex: string;
    omml?: string;
    svg?: string;
}

declare interface Page {
    pageNum: number;
    firstLine?: Line;
    lines: Line[];
}

declare interface Paragraph {
    content: string;
    paraHtml?: string;
    lines?: Line[];
}

declare interface Line {
    lineText: string;
    W: number;
    H: number;
    pageNum?: number;
}