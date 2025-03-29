export function convertURLs(url: string) {
    const url_split = url.split("\\");
    const url_join = url_split.join("/");
    const url_final = `file:///${url_join}`;
    return url_final;
}