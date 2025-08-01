export function env(varName: string): string {
    const v = Deno.env.get(varName);
    if (v == null) {
        console.log(`${varName} not set`)
        return ''
    }
    return v;
}