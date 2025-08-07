export function env<T = string>(varName: string, def?: T): string | T {
    const v = Deno.env.get(varName) ?? def;
    if (v == null) { throw new Error(`${varName} not set`); }
    return v;
}