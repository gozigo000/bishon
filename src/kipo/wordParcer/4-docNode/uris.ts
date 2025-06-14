export function uriToZipEntryName(base: string, uri: string): string {
    if (uri.charAt(0) === "/") {
        return uri.substring(1);
    }
    // In general, we should check first and second for trailing and leading slashes,
    // but in our specific case this seems to be sufficient
    return base + "/" + uri;
}

export function replaceFragment(uri: string, fragment: string): string {
    const hashIndex = uri.indexOf("#");
    if (hashIndex !== -1) {
        uri = uri.substring(0, hashIndex);
    }
    return uri + "#" + fragment;
}
