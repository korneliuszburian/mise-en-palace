const recipeDriftKind = "krn.recipeDrift.v1";
const recipeDriftAlgorithm = "noncrypto-fnv1a32x8:krn.recipe.v1";
const recipeChecksumRole = "non_security_drift_detector";

export type RecipeDrift = {
  kind: typeof recipeDriftKind;
  entries: Recipe[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
};

export type Recipe = {
  id: string;
  patternId: string;
  algorithm: typeof recipeDriftAlgorithm;
  checksumRole: typeof recipeChecksumRole;
  code: string[];
  docs: string[];
  sources: string[];
  checksum: string;
  observedAt: string;
  doesNotProve: string;
};

export type RecipeCheck = {
  ok: boolean;
  entries: Array<{
    id: string;
    ok: boolean;
    expectedChecksum: string;
    actualChecksum: string;
    files: string[];
  }>;
  proof: RecipeDrift["proof"];
};

export type ReadRecipeFile = (path: string) => string;

type ParsedRecipe = {
  [Key in keyof Recipe]: Recipe[Key] | undefined;
};

const recipeFields = [
  "id",
  "patternId",
  "algorithm",
  "checksumRole",
  "code",
  "docs",
  "sources",
  "checksum",
  "observedAt",
  "doesNotProve"
] as const satisfies readonly (keyof Recipe)[];

export function parseRecipeDrift(value: unknown): RecipeDrift | undefined {
  if (!isRecord(value) || value["kind"] !== recipeDriftKind) {
    return undefined;
  }

  const entries = parseEntries(value["entries"]);
  const proof = parseProof(value["proof"]);

  return entries && proof
    ? {
        kind: recipeDriftKind,
        entries,
        proof
      }
    : undefined;
}

export function checkRecipeDrift(
  manifest: RecipeDrift,
  read: ReadRecipeFile
): RecipeCheck {
  const entries = manifest.entries.map((entry) => {
    const actualChecksum = checksumRecipe(entry, read);

    return {
      id: entry.id,
      ok: entry.checksum === actualChecksum,
      expectedChecksum: entry.checksum,
      actualChecksum,
      files: [...entry.code, ...entry.docs]
    };
  });

  return {
    ok: entries.every((entry) => entry.ok),
    entries,
    proof: manifest.proof
  };
}

function checksumRecipe(entry: Recipe, read: ReadRecipeFile): string {
  const parts = [
    entry.algorithm,
    entry.id,
    entry.patternId,
    ...fileParts("code", entry.code, read),
    ...fileParts("docs", entry.docs, read)
  ];

  return digest(parts.join("\0"));
}

function fileParts(
  kind: "code" | "docs",
  files: string[],
  read: ReadRecipeFile
): string[] {
  return files.flatMap((file) => [
    kind,
    file,
    read(file).replace(/\r\n/g, "\n")
  ]);
}

function digest(value: string): string {
  return Array.from({ length: 8 }, (_, index) =>
    fnv1a(`${index}\0${value}`).toString(16).padStart(8, "0")
  ).join("");
}

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  return hash;
}

function parseEntries(value: unknown): Recipe[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const entries = value.map(parseEntry);

  return entries.every((entry) => entry !== undefined)
    ? entries as Recipe[]
    : undefined;
}

function parseEntry(value: unknown): Recipe | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const fields: ParsedRecipe = {
    id: str(value["id"]),
    patternId: str(value["patternId"]),
    algorithm: value["algorithm"] === recipeDriftAlgorithm
      ? recipeDriftAlgorithm
      : undefined,
    checksumRole: value["checksumRole"] === recipeChecksumRole
      ? recipeChecksumRole
      : undefined,
    code: paths(value["code"]),
    docs: paths(value["docs"]),
    sources: strings(value["sources"]),
    checksum: checksumHex64(value["checksum"]),
    observedAt: str(value["observedAt"]),
    doesNotProve: str(value["doesNotProve"])
  };

  return isRecipe(fields) ? fields : undefined;
}

function parseProof(value: unknown): RecipeDrift["proof"] | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const proves = strings(value["proves"]);
  const doesNotProve = strings(value["doesNotProve"]);

  return proves && doesNotProve
    ? {
        proves,
        doesNotProve
      }
    : undefined;
}

function isRecipe(value: ParsedRecipe): value is Recipe {
  return recipeFields.every((field) => value[field] !== undefined);
}

function paths(value: unknown): string[] | undefined {
  const items = strings(value);

  if (
    !items ||
    items.some((item) => item.startsWith("/") || item.includes("..")) ||
    new Set(items).size !== items.length
  ) {
    return undefined;
  }

  return items;
}

function strings(value: unknown): string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const items = value.map(str);

  return items.every((item) => item !== undefined)
    ? items as string[]
    : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function checksumHex64(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value)
    ? value
    : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
