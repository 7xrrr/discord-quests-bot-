import _ms from 'ms';
/**
 * transform humanize time to ms
 */
export function ms(t:any):any {
    const r = _ms(t)
    if (r === undefined) {
        const err = new TypeError(`'humanize-ms(${JSON.stringify(t)}) result undefined`);
        console.warn(err.stack);
    }
    return r;
}