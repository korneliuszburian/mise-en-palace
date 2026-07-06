const secretKeyPattern = /token|secret|password/iu;

export const redactConfigReadback = (
  env: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> =>
  Object.fromEntries(Object.entries(env).map(([key, value]) => [
    key,
    secretKeyPattern.test(key) ? "[redacted]" : value
  ]));
