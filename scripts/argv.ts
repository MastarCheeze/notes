function parseArgv(...flags: string[]) {
    if (flags.length === 0) throw "Please provide at least 1 flag"

    let flag;
    let idx = -1;
    for (flag of flags) {
        idx = process.argv.indexOf(flag);
        if (idx !== -1) break;
    }
    if (idx === -1) return [];

    const args: string[] = [flag!];
    let currIdx = idx + 1;
    while (!(process.argv[currIdx] === undefined || process.argv[currIdx].startsWith("-"))) {
        args.push(process.argv[currIdx]);
        ++currIdx;
    }

    return args;
}

export { parseArgv };
