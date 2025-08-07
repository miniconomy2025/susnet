// Generic utility types

export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type HTTPMethodLower = "get" | "post" | "put" | "patch" | "delete";

export type Unit = { [K in never]: never };

export type Result<
  S extends object,
  E extends { [key: string]: object } = Unit,
  Es extends string = keyof E extends string ? keyof E : never,
> =
  | ({ success: true } & S)
  | ({ [K in keyof E]: { success: false; error: K } & E[K] }[Es]);

export type SimpleResult<S extends object, Es extends string> = Result<
  S,
  { [K in Es]: Unit }
>;
