declare type ConversionReport = {
    fileName?: string;
    status: 'success' | 'error';
    convertedFiles: string[];
    message?: string;
}; 