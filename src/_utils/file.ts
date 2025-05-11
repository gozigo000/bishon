export function getBaseName(file: File): string {
    return file.name.split('.')[0];
}

export function getExtension(file: File): string {
    return file.name.split('.')[1] || '';
} 