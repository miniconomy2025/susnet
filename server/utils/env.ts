export function env(varName: string): string {
    const v = Deno.env.get(varName);
    if (v == null) { throw new Error(`${varName} not set`); }

    return v;
}