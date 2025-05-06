declare type FileOrBuffer = File | Buffer | ArrayBuffer;
declare type Html = string;
declare type KXml = string;
declare type OXml = string;

declare type ConversionReport = {
    fileName?: string;
    status: 'success' | 'error';
    convertedFiles: string[];
    message?: string;
}; 

declare type Paragraph = {
    content: string;
    img?: string;
    table?: string;
    math?: string;
}

declare type DiffLine = { 
        type: '동일' | '삭제' | '추가'; 
        content: string 
    } | { 
        type: '수정'; 
        content: string 
        diffs: Diff[] 
    };

declare type Diff = [DiffOp, string];
declare enum DiffOp {
    Delete = -1,
    Equal = 0,
    Insert = 1
}