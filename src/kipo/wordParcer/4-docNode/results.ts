import { DocNode } from "./docNodes.js";

export class Result {
    value: DocNode[];
    extra: DocNode[];
    _result: { value: DocNode[], extra: DocNode[] };

    constructor(elem?: DocNode | DocNode[], extra?: DocNode | DocNode[]) {
        this.value = elem ? Array.isArray(elem) ? elem : [elem] : [];
        this.extra = extra ? Array.isArray(extra) ? extra : [extra] : [];
        this._result = { value: this.value, extra: this.extra };
    }

    static combineResults(results: Result[]): Result {
        const result = results.map(r => r._result);
        return new Result(
            result.map(r => r.value).flat(),
            result.map(r => r.extra).flat().filter(Boolean)
        );
    }
}
