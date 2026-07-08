import path from "node:path";

import type {
  KnowledgeReadModel,
  KnowledgeSearchFilter,
  KnowledgeUsefulnessFeedback
} from "@krn/harness";
import {
  knowledgeReadModelFromDecision,
  knowledgeReadModelsWithUsefulnessFeedback,
  parseKnowledgeReadModel,
  parseKnowledgeUsefulnessFeedbackList,
  parseKnowledgeDecision,
  searchKnowledgeReadModels
} from "@krn/harness";
import {
  readJsonObject,
  readJsonObjectResult,
  resolveRepoInputFile
} from "./cli-file-boundary.js";

export type KnowledgeOutputFormat = "text" | "json" | "html";

export interface BrainRecallCommandRuntime {
  cwd?: string;
  readModelFiles: readonly string[];
  decisionFiles: readonly string[];
  catalogFiles: readonly string[];
  filter: KnowledgeSearchFilter;
  format: KnowledgeOutputFormat;
  limit?: number;
  readModelProvider?: () => Promise<KnowledgeReadModel[]>;
  /**
   * Optional store-backed usefulness source (9xc1). When provided, the command
   * awaits it and merges the result into the usefulness feedback, so the
   * readback can show usefulness without a static corpus JSON ledger. The CLI
   * layer wires this to a feedback_delta store read (mapped via
   * knowledgeUsefulnessFromKnowledgeOutcomes). Seed-only corpus
   * usefulnessFeedbackFiles may still be supplied and are merged alongside.
   */
  usefulnessProvider?: () => Promise<KnowledgeUsefulnessFeedback[]>;
}

export interface BrainRecallCommandResult {
  stdout: string;
}

interface LoadedKnowledgeReadModels {
  readModels: KnowledgeReadModel[];
  feedback: KnowledgeUsefulnessFeedback[];
  readModelFiles: string[];
  decisionFiles: string[];
  usefulnessFeedbackFiles: string[];
  catalogFiles: string[];
}

interface BrainRecallReadbackResource {
  kind: "krn.brain.recall.readback.v1";
  access: "read_only";
  mutation: "none";
  source: "explicit_files" | "memory_store";
  sourceBoundary: string;
  usefulnessSource: "explicit_files" | "store_backed";
  filter: KnowledgeSearchFilter;
  readModelFiles: string[];
  decisionFiles: string[];
  usefulnessFeedbackFiles: string[];
  catalogFiles: string[];
  totalReadModels: number;
  returnedReadModels: number;
  limit?: number;
  noMatchGuidance?: string[];
  readModels: KnowledgeReadModel[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

const proof = {
  proves: [
    "supplied files parse as KnowledgeReadModel or knowledge decisions",
    "supplied usefulness feedback files parse with proof boundaries",
    "local readback filters were applied deterministically"
  ],
  doesNotProve: [
    "brain recall readback was produced from live DB state",
    "search ranking quality is good",
    "knowledge decisions are complete",
    "Memory Core, SourceDecision, candidates, or evidence were mutated",
    "KRN is product-ready"
  ]
} as const;

const buildProof = (
  source: "explicit_files" | "memory_store",
  usefulnessSource: "explicit_files" | "store_backed"
): { proves: string[]; doesNotProve: string[] } =>
  {
    const proves = source === "memory_store"
      ? [
          "brain recall entries were read from DB-backed MemoryRecord rows",
          "MemoryRecords were converted into KnowledgeReadModel rows",
          "local readback filters were applied deterministically"
        ]
      : [
          "supplied files parse as KnowledgeReadModel or knowledge decisions",
          "local readback filters were applied deterministically"
        ];
    const usefulnessProves = usefulnessSource === "store_backed"
      ? ["usefulness feedback was read from store-backed feedback_delta records"]
      : source === "memory_store"
        ? []
        : ["supplied usefulness feedback files parse with proof boundaries"];
    const doesNotProve = source === "memory_store" || usefulnessSource === "store_backed"
      ? proof.doesNotProve.filter(
          (item) => item !== "brain recall readback was produced from live DB state"
        )
      : [
          ...proof.doesNotProve,
          "explicit file or catalog-backed knowledge is runtime memory"
        ];

    return {
      proves: [...proves, ...usefulnessProves],
      doesNotProve
    };
  };

const sourceBoundaryFor = (source: BrainRecallReadbackResource["source"]): string =>
  source === "memory_store"
    ? "store-backed runtime readback"
    : "bootstrap/fixture/migration input only; not runtime memory";

const createLoadedKnowledgeReadModels = (): LoadedKnowledgeReadModels => ({
  readModels: [],
  feedback: [],
  readModelFiles: [],
  decisionFiles: [],
  usefulnessFeedbackFiles: [],
  catalogFiles: []
});

const loadExplicitKnowledgeFiles = async (
  runtime: BrainRecallCommandRuntime,
  cwd: string,
  loaded: LoadedKnowledgeReadModels
): Promise<void> => {
  for (const readModelFile of runtime.readModelFiles) {
    await loadReadModelFile(readModelFile, await resolveRepoInputFile(cwd, readModelFile), loaded.readModels);
    loaded.readModelFiles.push(readModelFile);
  }

  for (const decisionFile of runtime.decisionFiles) {
    await loadDecisionFile(decisionFile, await resolveRepoInputFile(cwd, decisionFile), loaded.readModels);
    loaded.decisionFiles.push(decisionFile);
  }
};

const loadCatalogReadModelFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeReadModels
): Promise<void> => {
  for (const readModelFile of catalog.readModelFiles) {
    const resolvedReadModelFile = path.resolve(catalogDirectory, readModelFile);
    await loadReadModelFile(`${catalogFile}:${readModelFile}`, resolvedReadModelFile, loaded.readModels);
    loaded.readModelFiles.push(`${catalogFile}:${readModelFile}`);
  }
};

const loadCatalogDecisionFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeReadModels
): Promise<void> => {
  for (const knowledgeFile of catalog.knowledgeFiles) {
    const resolvedKnowledgeFile = path.resolve(catalogDirectory, knowledgeFile);
    await loadDecisionFile(`${catalogFile}:${knowledgeFile}`, resolvedKnowledgeFile, loaded.readModels);
    loaded.decisionFiles.push(`${catalogFile}:${knowledgeFile}`);
  }
};

const loadCatalogUsefulnessFeedbackFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeReadModels
): Promise<void> => {
  for (const usefulnessFeedbackFile of catalog.usefulnessFeedbackFiles) {
    const resolvedUsefulnessFeedbackFile = path.resolve(catalogDirectory, usefulnessFeedbackFile);
    await loadUsefulnessFeedbackFile(
      `${catalogFile}:${usefulnessFeedbackFile}`,
      resolvedUsefulnessFeedbackFile,
      loaded.feedback
    );
    loaded.usefulnessFeedbackFiles.push(`${catalogFile}:${usefulnessFeedbackFile}`);
  }
};

const loadKnowledgeCatalogFile = async (
  cwd: string,
  catalogFile: string,
  loaded: LoadedKnowledgeReadModels
): Promise<void> => {
  const resolvedCatalogFile = await resolveRepoInputFile(cwd, catalogFile);
  const result = await readJsonObjectResult(resolvedCatalogFile);
  const catalog = result.status === "ok"
    ? parseKnowledgeCatalog(result.value)
    : undefined;

  if (catalog === undefined) {
    const reason = result.status === "ok"
      ? "catalog must include non-empty readModelFiles, knowledgeFiles, or usefulnessFeedbackFiles arrays"
      : result.reason;

    throw new Error(`Invalid brain recall catalog file: ${catalogFile} (${reason})`);
  }

  const catalogDirectory = path.dirname(resolvedCatalogFile);

  await loadCatalogReadModelFiles(catalogFile, catalogDirectory, catalog, loaded);
  await loadCatalogDecisionFiles(catalogFile, catalogDirectory, catalog, loaded);
  await loadCatalogUsefulnessFeedbackFiles(catalogFile, catalogDirectory, catalog, loaded);
  loaded.catalogFiles.push(catalogFile);
};

const loadKnowledgeReadModels = async (
  runtime: BrainRecallCommandRuntime,
  cwd: string
): Promise<LoadedKnowledgeReadModels> => {
  const loaded = createLoadedKnowledgeReadModels();

  await loadExplicitKnowledgeFiles(runtime, cwd, loaded);

  for (const catalogFile of runtime.catalogFiles) {
    await loadKnowledgeCatalogFile(cwd, catalogFile, loaded);
  }

  if (runtime.readModelProvider !== undefined) {
    loaded.readModels.push(...await runtime.readModelProvider());
  }

  return loaded;
};

export const runBrainRecallCommand = async (
  runtime: BrainRecallCommandRuntime
): Promise<BrainRecallCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const loaded = await loadKnowledgeReadModels(runtime, cwd);
  const storeUsefulness = runtime.usefulnessProvider === undefined
    ? []
    : await runtime.usefulnessProvider();
  const source: "explicit_files" | "memory_store" =
    runtime.readModelProvider === undefined ? "explicit_files" : "memory_store";
  const usefulnessSource: "explicit_files" | "store_backed" =
    runtime.usefulnessProvider === undefined ? "explicit_files" : "store_backed";
  const cardsWithFeedback = knowledgeReadModelsWithUsefulnessFeedback(
    loaded.readModels,
    [...loaded.feedback, ...storeUsefulness]
  );
  const matchingReadModels = searchKnowledgeReadModels(cardsWithFeedback, runtime.filter);
  const readModels = runtime.limit === undefined
    ? matchingReadModels
    : matchingReadModels.slice(0, runtime.limit);
  const noMatchGuidance = matchingReadModels.length === 0
    ? buildNoMatchGuidance(runtime.filter)
    : undefined;

  const resource: BrainRecallReadbackResource = {
    kind: "krn.brain.recall.readback.v1",
    access: "read_only",
    mutation: "none",
    source,
    sourceBoundary: sourceBoundaryFor(source),
    usefulnessSource,
    filter: runtime.filter,
    readModelFiles: loaded.readModelFiles,
    decisionFiles: loaded.decisionFiles,
    usefulnessFeedbackFiles: loaded.usefulnessFeedbackFiles,
    catalogFiles: loaded.catalogFiles,
    totalReadModels: matchingReadModels.length,
    returnedReadModels: readModels.length,
    ...(runtime.limit === undefined ? {} : { limit: runtime.limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
    readModels,
    proof: buildProof(source, usefulnessSource)
  };

  return {
    stdout: formatKnowledgeOutput(resource, runtime.format)
  };
};

const formatKnowledgeOutput = (
  resource: BrainRecallReadbackResource,
  format: KnowledgeOutputFormat
): string => {
  if (format === "json") {
    return `${JSON.stringify(resource, null, 2)}\n`;
  }

  if (format === "html") {
    return formatKnowledgeHtmlPreview(resource);
  }

  return formatKnowledgeTextPreview(resource);
};

const formatKnowledgeTextPreview = (resource: BrainRecallReadbackResource): string =>
  [
    "KRN Brain Recall",
    "Access: read-only",
    "Mutation: none",
    `Source: ${resource.source}`,
    `Source boundary: ${resource.sourceBoundary}`,
    `Usefulness source: ${resource.usefulnessSource}`,
    `Catalog files: ${formatList(resource.catalogFiles)}`,
    `Knowledge read model files: ${formatList(resource.readModelFiles)}`,
    `Decision files: ${formatList(resource.decisionFiles)}`,
    `Usefulness feedback files: ${formatList(resource.usefulnessFeedbackFiles)}`,
    `Results: ${resource.readModels.length}`,
    `Total filtered results: ${resource.totalReadModels}`,
    ...(resource.limit === undefined ? [] : [
      `Limit: ${resource.limit}`
    ]),
    ...formatNoMatchGuidanceText(resource),
    "",
    ...resource.readModels.flatMap(formatReadModel),
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n") + "\n";

const formatKnowledgeHtmlPreview = (resource: BrainRecallReadbackResource): string => {
  const serializedResource = JSON.stringify(resource).replace(/</gu, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KRN Brain Recall</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #171a1f;
      --muted: #616b7a;
      --line: #dfe3ea;
      --accent: #0f766e;
      --warn: #9a3412;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    main {
      width: min(1120px, calc(100% - 32px));
      margin: 32px auto;
    }
    header {
      display: grid;
      gap: 8px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    .meta, .proof, .refs {
      color: var(--muted);
      font-size: 14px;
    }
    .toolbar {
      display: grid;
      grid-template-columns: minmax(220px, 1fr) repeat(4, minmax(120px, auto)) auto;
      gap: 12px;
      align-items: center;
      margin: 18px 0;
    }
    input[type="search"], select {
      width: 100%;
      min-height: 42px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 10px 12px;
      font: inherit;
      background: #fff;
      color: var(--text);
    }
    .count {
      color: var(--muted);
      font-size: 14px;
      white-space: nowrap;
    }
    .readModels {
      display: grid;
      gap: 12px;
    }
    article {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 18px;
    }
    h2 {
      margin: 0 0 8px;
      font-size: 19px;
      letter-spacing: 0;
    }
    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 10px 0;
    }
    .chip {
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 3px 8px;
      font-size: 12px;
      color: var(--muted);
      background: #fbfcfd;
    }
    .chip.strong {
      color: #fff;
      border-color: var(--accent);
      background: var(--accent);
    }
    dl {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 7px 14px;
      margin: 14px 0 0;
    }
    dt {
      color: var(--muted);
      font-weight: 600;
    }
    dd { margin: 0; }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.92em;
    }
    .proof-panel {
      margin-top: 20px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    .proof-panel h2 {
      font-size: 17px;
    }
    .proof-panel li + li {
      margin-top: 4px;
    }
    .empty {
      display: none;
      padding: 18px;
      color: var(--warn);
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
    }
    @media (max-width: 720px) {
      main { width: min(100% - 20px, 1120px); margin: 18px auto; }
      .toolbar { grid-template-columns: 1fr; }
      dl { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>KRN Brain Recall</h1>
      <div class="meta">Access: read-only | Mutation: none | Source: ${escapeHtml(resource.source)}</div>
      <div class="meta">Source boundary: ${escapeHtml(resource.sourceBoundary)}</div>
      <div class="meta">Catalog files: ${escapeHtml(formatList(resource.catalogFiles))}</div>
      <div class="meta">Usefulness feedback files: ${escapeHtml(formatList(resource.usefulnessFeedbackFiles))}</div>
    </header>
    <section class="toolbar" aria-label="Knowledge search">
      <input id="search" type="search" placeholder="Search knowledge" autocomplete="off">
      ${formatSelect("kindFilter", "Kind", uniqueValues(resource.readModels.map((readModel) => readModel.kind)))}
      ${formatSelect("statusFilter", "Status", uniqueValues(resource.readModels.map((readModel) => readModel.status)))}
      ${formatSelect("reviewabilityFilter", "Reviewability", uniqueValues(resource.readModels.map((readModel) => readModel.reviewability)))}
      ${formatSelect("usefulnessOutcomeFilter", "Usefulness", uniqueValues(resource.readModels.map((readModel) => readModel.usefulnessFeedback?.outcome ?? "none")))}
      ${formatSelect("nextActionFilter", "Next action", uniqueValues(resource.readModels.map((readModel) => readModel.nextAction)))}
      <div id="count" class="count">Results: ${resource.readModels.length}</div>
    </section>
    <section id="empty" class="empty">${formatNoMatchGuidanceHtml(resource)}</section>
    <section id="readModels" class="readModels">
      ${resource.readModels.map(formatReadModelHtml).join("\n")}
    </section>
    <section class="proof-panel">
      <h2>Proof Boundaries</h2>
      <ul>
        ${resource.proof.proves.map((item) => `<li><strong>proves:</strong> ${escapeHtml(item)}</li>`).join("\n        ")}
        ${resource.proof.doesNotProve.map((item) => `<li><strong>does not prove:</strong> ${escapeHtml(item)}</li>`).join("\n        ")}
      </ul>
    </section>
  </main>
  <script id="krn-data" type="application/json">${serializedResource}</script>
  <script>
    const readModels = Array.from(document.querySelectorAll("[data-read-model]"));
    const search = document.getElementById("search");
    const kindFilter = document.getElementById("kindFilter");
    const statusFilter = document.getElementById("statusFilter");
    const reviewabilityFilter = document.getElementById("reviewabilityFilter");
    const usefulnessOutcomeFilter = document.getElementById("usefulnessOutcomeFilter");
    const nextActionFilter = document.getElementById("nextActionFilter");
    const count = document.getElementById("count");
    const empty = document.getElementById("empty");
    const matchesFilter = (readModel, key, value) => value === "" || readModel.dataset[key] === value;
    const render = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const readModel of readModels) {
        const textMatch = query.length === 0 || readModel.dataset.search.includes(query);
        const match = textMatch
          && matchesFilter(readModel, "kind", kindFilter.value)
          && matchesFilter(readModel, "status", statusFilter.value)
          && matchesFilter(readModel, "reviewability", reviewabilityFilter.value)
          && matchesFilter(readModel, "usefulnessOutcome", usefulnessOutcomeFilter.value)
          && matchesFilter(readModel, "nextAction", nextActionFilter.value);
        readModel.hidden = !match;
        if (match) visible += 1;
      }
      count.textContent = "Results: " + visible;
      empty.style.display = visible === 0 ? "block" : "none";
    };
    search.addEventListener("input", render);
    kindFilter.addEventListener("change", render);
    statusFilter.addEventListener("change", render);
    reviewabilityFilter.addEventListener("change", render);
    usefulnessOutcomeFilter.addEventListener("change", render);
    nextActionFilter.addEventListener("change", render);
    render();
  </script>
</body>
</html>
`;
};

const buildNoMatchGuidance = (filter: KnowledgeSearchFilter): string[] => [
  "No brain recall entries matched the current filters.",
  ...(filter.text === undefined ? [] : [
    "Try a shorter --text query or split the query into one mechanism term.",
    "If this is a pre-coding recall query, run one broader query before concluding no selected memory applies."
  ]),
  ...(hasStructuredFilter(filter) ? [
    "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
  ] : []),
  "If no recalled memory applies after retry, record an explicit rejected_or_deferred_memory reason before coding.",
  "Zero results do not prove that no relevant pattern exists or that search ranking is good."
];

const hasStructuredFilter = (filter: KnowledgeSearchFilter): boolean =>
  filter.kind !== undefined ||
  filter.status !== undefined ||
  filter.reviewability !== undefined ||
  filter.usefulnessOutcome !== undefined;

const formatNoMatchGuidanceText = (resource: BrainRecallReadbackResource): string[] =>
  resource.noMatchGuidance === undefined ? [] : [
    "",
    "No-match guidance:",
    ...resource.noMatchGuidance.map((item) => `- ${item}`)
  ];

const formatNoMatchGuidanceHtml = (resource: BrainRecallReadbackResource): string =>
  resource.noMatchGuidance === undefined
    ? "No brain recall entries match the current search."
    : `<strong>No brain recall entries match the current filters.</strong><ul>${resource.noMatchGuidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const formatReadModel = (readModel: KnowledgeReadModel): string[] => [
  `- ${readModel.id}`,
  `  title: ${readModel.title}`,
  `  kind: ${readModel.kind}`,
  `  status: ${readModel.status}`,
  `  confidence: ${readModel.confidence}`,
  `  reviewability: ${readModel.reviewability}`,
  `  nextAction: ${readModel.nextAction}`,
  `  summary: ${readModel.summary}`,
  ...(readModel.mechanism === undefined ? [] : [`  mechanism: ${readModel.mechanism}`]),
  ...(readModel.krnImplication === undefined ? [] : [`  krnImplication: ${readModel.krnImplication}`]),
  `  sourceRefs: ${readModel.sourceRefs.join(", ")}`,
  `  evidenceRefs: ${readModel.evidenceRefs.join(", ")}`,
  `  consumers: ${readModel.consumers.join(", ")}`,
  ...(readModel.usefulnessFeedback === undefined ? [
    "  usefulnessOutcome: none"
  ] : [
    `  usefulnessOutcome: ${readModel.usefulnessFeedback.outcome}`,
    `  usefulnessSummary: ${readModel.usefulnessFeedback.summary}`,
    `  usefulnessEvidenceRefs: ${readModel.usefulnessFeedback.evidenceRefs.join(", ")}`,
    `  usefulnessDoesNotProve: ${readModel.usefulnessFeedback.doesNotProve}`
  ]),
  `  falsifier: ${readModel.falsifier}`,
  `  doesNotProve: ${readModel.doesNotProve}`,
  ""
];

const readModelSearchText = (readModel: KnowledgeReadModel): string =>
  [
    readModel.id,
    readModel.kind,
    readModel.status,
    readModel.title,
    readModel.summary,
    readModel.mechanism ?? "",
    readModel.krnImplication ?? "",
    readModel.confidence,
    readModel.reviewability,
    readModel.nextAction,
    ...readModel.sourceRefs,
    ...readModel.evidenceRefs,
    ...readModel.consumers,
    readModel.falsifier,
    readModel.doesNotProve,
    ...readModelUsefulnessSearchText(readModel)
  ].join(" ").toLowerCase();

const readModelUsefulnessSearchText = (readModel: KnowledgeReadModel): string[] => {
  if (readModel.usefulnessFeedback === undefined) {
    return [];
  }

  return [
    readModel.usefulnessFeedback.outcome,
    readModel.usefulnessFeedback.summary,
    readModel.usefulnessFeedback.doesNotProve,
    ...readModel.usefulnessFeedback.evidenceRefs
  ];
};

const formatUsefulnessFeedbackHtml = (readModel: KnowledgeReadModel): string =>
  readModel.usefulnessFeedback === undefined
    ? ""
    : `<dt>Usefulness</dt><dd><strong>${escapeHtml(readModel.usefulnessFeedback.outcome)}</strong><br>${escapeHtml(readModel.usefulnessFeedback.summary)}<br>${formatHtmlList(readModel.usefulnessFeedback.evidenceRefs)}<br><span class="refs">does not prove: ${escapeHtml(readModel.usefulnessFeedback.doesNotProve)}</span></dd>`;

const formatReadModelDataAttributes = (readModel: KnowledgeReadModel): string =>
  [
    { name: "data-read-model-id", value: readModel.id },
    { name: "data-kind", value: readModel.kind },
    { name: "data-status", value: readModel.status },
    { name: "data-reviewability", value: readModel.reviewability },
    { name: "data-usefulness-outcome", value: readModel.usefulnessFeedback?.outcome ?? "none" },
    { name: "data-next-action", value: readModel.nextAction },
    { name: "data-search", value: readModelSearchText(readModel) }
  ].map((attribute) => `${attribute.name}="${escapeHtml(attribute.value)}"`).join(" ");

const formatReadModelHtml = (readModel: KnowledgeReadModel): string => {
  return `<article data-read-model ${formatReadModelDataAttributes(readModel)}>
  <h2>${escapeHtml(readModel.title)}</h2>
  <div class="refs"><code>${escapeHtml(readModel.id)}</code></div>
  <div class="chips">
    <span class="chip strong">${escapeHtml(readModel.kind)}</span>
    <span class="chip">${escapeHtml(readModel.status)}</span>
    <span class="chip">confidence: ${escapeHtml(readModel.confidence)}</span>
    <span class="chip">reviewability: ${escapeHtml(readModel.reviewability)}</span>
    <span class="chip">next: ${escapeHtml(readModel.nextAction)}</span>
  </div>
  <p>${escapeHtml(readModel.summary)}</p>
  <dl>
    ${readModel.mechanism === undefined ? "" : `<dt>Mechanism</dt><dd>${escapeHtml(readModel.mechanism)}</dd>`}
    ${readModel.krnImplication === undefined ? "" : `<dt>KRN implication</dt><dd>${escapeHtml(readModel.krnImplication)}</dd>`}
    <dt>Source refs</dt><dd>${formatHtmlList(readModel.sourceRefs)}</dd>
    <dt>Evidence refs</dt><dd>${formatHtmlList(readModel.evidenceRefs)}</dd>
    <dt>Consumers</dt><dd>${formatHtmlList(readModel.consumers)}</dd>
    ${formatUsefulnessFeedbackHtml(readModel)}
    <dt>Falsifier</dt><dd>${escapeHtml(readModel.falsifier)}</dd>
    <dt>Does not prove</dt><dd>${escapeHtml(readModel.doesNotProve)}</dd>
  </dl>
</article>`;
};

const formatSelect = (
  id: string,
  label: string,
  options: readonly string[]
): string =>
  `<select id="${escapeHtml(id)}" aria-label="${escapeHtml(label)}">
        <option value="">${escapeHtml(label)}: all</option>
        ${options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(label)}: ${escapeHtml(option)}</option>`).join("\n        ")}
      </select>`;

const uniqueValues = (values: readonly string[]): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const formatHtmlList = (items: readonly string[]): string =>
  items.length === 0
    ? "none"
    : items.map((item) => `<code>${escapeHtml(item)}</code>`).join("<br>");

const formatList = (items: readonly string[]): string =>
  items.length === 0 ? "none" : items.join(", ");

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");

type KnowledgeCatalogInput = {
  readModelFiles: string[];
  knowledgeFiles: string[];
  usefulnessFeedbackFiles: string[];
};

const parseKnowledgeCatalog = (value: unknown): KnowledgeCatalogInput | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const readModelFiles = parseStringArray(value["readModelFiles"]);
  const knowledgeFiles = parseStringArray(value["knowledgeFiles"]);
  const usefulnessFeedbackFiles = parseStringArray(value["usefulnessFeedbackFiles"] ?? []);

  if (
    readModelFiles === undefined ||
    knowledgeFiles === undefined ||
    usefulnessFeedbackFiles === undefined ||
    (readModelFiles.length === 0 && knowledgeFiles.length === 0 && usefulnessFeedbackFiles.length === 0)
  ) {
    return undefined;
  }

  return {
    readModelFiles,
    knowledgeFiles,
    usefulnessFeedbackFiles
  };
};

const loadReadModelFile = async (
  label: string,
  resolvedFile: string,
  readModels: KnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const readModel = parseKnowledgeReadModel(parsed);

  if (readModel === undefined) {
    throw new Error(`Invalid KnowledgeReadModel file: ${label}`);
  }

  readModels.push(readModel);
};

const loadDecisionFile = async (
  label: string,
  resolvedFile: string,
  readModels: KnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const decision = parseKnowledgeDecision(parsed);

  if (decision === undefined) {
    throw new Error(`Invalid decision file: ${label}`);
  }

  readModels.push(knowledgeReadModelFromDecision(decision));
};

const loadUsefulnessFeedbackFile = async (
  label: string,
  resolvedFile: string,
  feedback: KnowledgeUsefulnessFeedback[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const parsedFeedback = parseKnowledgeUsefulnessFeedbackList(parsed);

  if (parsedFeedback === undefined) {
    throw new Error(`Invalid knowledge usefulness feedback file: ${label}`);
  }

  feedback.push(...parsedFeedback);
};

const parseStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0)
    ? value
    : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
