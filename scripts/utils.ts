import assert from "node:assert";

export function parseArgvFlag(...flags: string[]) {
    let flag;
    let idx = -1;
    for (flag of flags) {
        idx = process.argv.indexOf(flag);
        if (idx !== -1) break;
    }
    if (idx === -1) return [];
    assert(flag);

    const args: string[] = [flag];
    let currIdx = idx + 1;
    while (!(process.argv[currIdx] === undefined || process.argv[currIdx].startsWith("-"))) {
        args.push(process.argv[currIdx]);
        ++currIdx;
    }

    return args;
}

export class Logger {
    constructor(public enabled = false) {}
    log(msg: string) {
        if (this.enabled) console.log(msg);
    }
    err(msg: string) {
        if (this.enabled) console.error(msg);
    }
}
