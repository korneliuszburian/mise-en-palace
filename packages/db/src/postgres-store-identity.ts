export const secretFreePostgresStoreIdentity = (
  databaseUrl: string,
  invalidUrlFallback: string
): string => {
  try {
    const parsed = new URL(databaseUrl);
    const port = parsed.port.length > 0 ? parsed.port : "5432";
    const database = parsed.pathname.replace(/^\//u, "") || "default";

    return `${parsed.protocol}//${parsed.hostname}:${port}/${database}`;
  } catch {
    return invalidUrlFallback;
  }
};
