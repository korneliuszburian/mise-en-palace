import path from "node:path";

import type {
  BrainKnowledgeReadModel,
  BrainKnowledgeSearchFilter,
  BrainKnowledgeUsefulnessFeedback
} from "@krn/harness";
import {
  brainKnowledgeCardFromRetainedPatternDecision,
  cardsWithBrainKnowledgeUsefulnessFeedback,
  parseBrainKnowledgeReadModel,
  parseBrainKnowledgeUsefulnessFeedbackList,
  parseRetainedPatternDecision,
  searchBrainKnowledgeCards
} from "@krn/harness";
import {
  readJsonObject,
  readJsonObjectResult,
  resolveRepoInputFile
} from "./cli-file-boundary.js";

export type KnowledgeCardsOutputFormat = "text" | "json" | "html";

export interface KnowledgeCardsCommandRuntime {
  cwd?: string;
  cardFiles: readonly string[];
  patternFiles: readonly string[];
  catalogFiles: readonly string[];
  filter: BrainKnowledgeSearchFilter;
  format: KnowledgeCardsOutputFormat;
  limit?: number;
  /**
   * Optional store-backed usefulness source (9xc1). When provided, the command
   * awaits it and merges the result into the usefulness feedback, so the
   * readback can show usefulness without a static corpus JSON ledger. The CLI
   * layer wires this to a feedback_delta store read (mapped via
   * brainKnowledgeUsefulnessFromPatternOutcomes). Seed-only corpus
   * usefulnessFeedbackFiles may still be supplied and are merged alongside.
   */
  usefulnessProvider?: () => Promise<BrainKnowledgeUsefulnessFeedback[]>;
}

export interface KnowledgeCardsCommandResult {
  stdout: string;
}

interface LoadedKnowledgeCards {
  cards: BrainKnowledgeReadModel[];
  feedback: BrainKnowledgeUsefulnessFeedback[];
  cardFiles: string[];
  patternFiles: string[];
  usefulnessFeedbackFiles: string[];
  catalogFiles: string[];
}

interface KnowledgeCardsPreviewResource {
  kind: "krn.brainKnowledge.cards.preview.v1";
  access: "read_only";
  mutation: "none";
  source: "explicit_files";
  usefulnessSource: "explicit_files" | "store_backed";
  filter: BrainKnowledgeSearchFilter;
  cardFiles: string[];
  patternFiles: string[];
  usefulnessFeedbackFiles: string[];
  catalogFiles: string[];
  totalCards: number;
  returnedCards: number;
  limit?: number;
  noMatchGuidance?: string[];
  cards: BrainKnowledgeReadModel[];
  proof: {
    proves: string[];
    doesNotProve: string[];
  };
}

const proof = {
  proves: [
    "supplied files parse as BrainKnowledgeReadModel or retained pattern decisions",
    "supplied usefulness feedback files parse with proof boundaries",
    "local readback filters were applied deterministically"
  ],
  doesNotProve: [
    "brain knowledge readback was produced from live DB state",
    "search ranking quality is good",
    "retained patterns are complete",
    "Memory Core, SourceDecision, candidates, or evidence were mutated",
    "KRN is product-ready"
  ]
} as const;

const buildProof = (
  usefulnessSource: "explicit_files" | "store_backed"
): { proves: string[]; doesNotProve: string[] } =>
  usefulnessSource === "store_backed"
    ? {
        proves: [
          "supplied files parse as BrainKnowledgeReadModel or retained pattern decisions",
          "usefulness feedback was read from store-backed feedback_delta records",
          "local readback filters were applied deterministically"
        ],
        doesNotProve: proof.doesNotProve.filter(
          (item) => item !== "brain knowledge readback was produced from live DB state"
        )
      }
    : { proves: [...proof.proves], doesNotProve: [...proof.doesNotProve] };

const createLoadedKnowledgeCards = (): LoadedKnowledgeCards => ({
  cards: [],
  feedback: [],
  cardFiles: [],
  patternFiles: [],
  usefulnessFeedbackFiles: [],
  catalogFiles: []
});

const loadExplicitKnowledgeFiles = async (
  runtime: KnowledgeCardsCommandRuntime,
  cwd: string,
  loaded: LoadedKnowledgeCards
): Promise<void> => {
  for (const cardFile of runtime.cardFiles) {
    await loadCardFile(cardFile, await resolveRepoInputFile(cwd, cardFile), loaded.cards);
    loaded.cardFiles.push(cardFile);
  }

  for (const patternFile of runtime.patternFiles) {
    await loadPatternFile(patternFile, await resolveRepoInputFile(cwd, patternFile), loaded.cards);
    loaded.patternFiles.push(patternFile);
  }
};

const loadCatalogCardFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeCards
): Promise<void> => {
  for (const cardFile of catalog.cardFiles) {
    const resolvedCardFile = path.resolve(catalogDirectory, cardFile);
    await loadCardFile(`${catalogFile}:${cardFile}`, resolvedCardFile, loaded.cards);
    loaded.cardFiles.push(`${catalogFile}:${cardFile}`);
  }
};

const loadCatalogPatternFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeCards
): Promise<void> => {
  for (const patternFile of catalog.patternFiles) {
    const resolvedPatternFile = path.resolve(catalogDirectory, patternFile);
    await loadPatternFile(`${catalogFile}:${patternFile}`, resolvedPatternFile, loaded.cards);
    loaded.patternFiles.push(`${catalogFile}:${patternFile}`);
  }
};

const loadCatalogUsefulnessFeedbackFiles = async (
  catalogFile: string,
  catalogDirectory: string,
  catalog: KnowledgeCatalogInput,
  loaded: LoadedKnowledgeCards
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
  loaded: LoadedKnowledgeCards
): Promise<void> => {
  const resolvedCatalogFile = await resolveRepoInputFile(cwd, catalogFile);
  const result = await readJsonObjectResult(resolvedCatalogFile);
  const catalog = result.status === "ok"
    ? parseKnowledgeCatalog(result.value)
    : undefined;

  if (catalog === undefined) {
    const reason = result.status === "ok"
      ? "catalog must include non-empty cardFiles, patternFiles, or usefulnessFeedbackFiles arrays"
      : result.reason;

    throw new Error(`Invalid brain knowledge catalog file: ${catalogFile} (${reason})`);
  }

  const catalogDirectory = path.dirname(resolvedCatalogFile);

  await loadCatalogCardFiles(catalogFile, catalogDirectory, catalog, loaded);
  await loadCatalogPatternFiles(catalogFile, catalogDirectory, catalog, loaded);
  await loadCatalogUsefulnessFeedbackFiles(catalogFile, catalogDirectory, catalog, loaded);
  loaded.catalogFiles.push(catalogFile);
};

const loadKnowledgeCards = async (
  runtime: KnowledgeCardsCommandRuntime,
  cwd: string
): Promise<LoadedKnowledgeCards> => {
  const loaded = createLoadedKnowledgeCards();

  await loadExplicitKnowledgeFiles(runtime, cwd, loaded);

  for (const catalogFile of runtime.catalogFiles) {
    await loadKnowledgeCatalogFile(cwd, catalogFile, loaded);
  }

  return loaded;
};

export const runKnowledgeCardsCommand = async (
  runtime: KnowledgeCardsCommandRuntime
): Promise<KnowledgeCardsCommandResult> => {
  const cwd = runtime.cwd ?? process.cwd();
  const loaded = await loadKnowledgeCards(runtime, cwd);
  const storeUsefulness = runtime.usefulnessProvider === undefined
    ? []
    : await runtime.usefulnessProvider();
  const usefulnessSource: "explicit_files" | "store_backed" =
    storeUsefulness.length > 0 ? "store_backed" : "explicit_files";
  const cardsWithFeedback = cardsWithBrainKnowledgeUsefulnessFeedback(
    loaded.cards,
    [...loaded.feedback, ...storeUsefulness]
  );
  const matchingCards = searchBrainKnowledgeCards(cardsWithFeedback, runtime.filter);
  const cards = runtime.limit === undefined
    ? matchingCards
    : matchingCards.slice(0, runtime.limit);
  const noMatchGuidance = matchingCards.length === 0
    ? buildNoMatchGuidance(runtime.filter)
    : undefined;

  const resource: KnowledgeCardsPreviewResource = {
    kind: "krn.brainKnowledge.cards.preview.v1",
    access: "read_only",
    mutation: "none",
    source: "explicit_files",
    usefulnessSource,
    filter: runtime.filter,
    cardFiles: loaded.cardFiles,
    patternFiles: loaded.patternFiles,
    usefulnessFeedbackFiles: loaded.usefulnessFeedbackFiles,
    catalogFiles: loaded.catalogFiles,
    totalCards: matchingCards.length,
    returnedCards: cards.length,
    ...(runtime.limit === undefined ? {} : { limit: runtime.limit }),
    ...(noMatchGuidance === undefined ? {} : { noMatchGuidance }),
    cards,
    proof: buildProof(usefulnessSource)
  };

  return {
    stdout: formatKnowledgeCardsOutput(resource, runtime.format)
  };
};

const formatKnowledgeCardsOutput = (
  resource: KnowledgeCardsPreviewResource,
  format: KnowledgeCardsOutputFormat
): string => {
  if (format === "json") {
    return `${JSON.stringify(resource, null, 2)}\n`;
  }

  if (format === "html") {
    return formatKnowledgeCardsHtmlPreview(resource);
  }

  return formatKnowledgeCardsTextPreview(resource);
};

const formatKnowledgeCardsTextPreview = (resource: KnowledgeCardsPreviewResource): string =>
  [
    "KRN Brain Knowledge Readback",
    "Access: read-only",
    "Mutation: none",
    "Source: explicit files",
    `Usefulness source: ${resource.usefulnessSource}`,
    `Catalog files: ${formatList(resource.catalogFiles)}`,
    `Brain knowledge files: ${formatList(resource.cardFiles)}`,
    `Pattern files: ${formatList(resource.patternFiles)}`,
    `Usefulness feedback files: ${formatList(resource.usefulnessFeedbackFiles)}`,
    `Results: ${resource.cards.length}`,
    `Total filtered results: ${resource.totalCards}`,
    ...(resource.limit === undefined ? [] : [
      `Limit: ${resource.limit}`
    ]),
    ...formatNoMatchGuidanceText(resource),
    "",
    ...resource.cards.flatMap(formatCard),
    "Proof:",
    ...resource.proof.proves.map((item) => `- proves: ${item}`),
    ...resource.proof.doesNotProve.map((item) => `- does not prove: ${item}`)
  ].join("\n") + "\n";

const formatKnowledgeCardsHtmlPreview = (resource: KnowledgeCardsPreviewResource): string => {
  const serializedResource = JSON.stringify(resource).replace(/</gu, "\\u003c");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>KRN Brain Knowledge Readback</title>
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
    .cards {
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
      <h1>KRN Brain Knowledge Readback</h1>
      <div class="meta">Access: read-only | Mutation: none | Source: explicit files</div>
      <div class="meta">Catalog files: ${escapeHtml(formatList(resource.catalogFiles))}</div>
      <div class="meta">Usefulness feedback files: ${escapeHtml(formatList(resource.usefulnessFeedbackFiles))}</div>
    </header>
    <section class="toolbar" aria-label="Knowledge search">
      <input id="search" type="search" placeholder="Search brain knowledge" autocomplete="off">
      ${formatSelect("kindFilter", "Kind", uniqueValues(resource.cards.map((card) => card.kind)))}
      ${formatSelect("statusFilter", "Status", uniqueValues(resource.cards.map((card) => card.status)))}
      ${formatSelect("reviewabilityFilter", "Reviewability", uniqueValues(resource.cards.map((card) => card.reviewability)))}
      ${formatSelect("usefulnessOutcomeFilter", "Usefulness", uniqueValues(resource.cards.map((card) => card.usefulnessFeedback?.outcome ?? "none")))}
      ${formatSelect("nextActionFilter", "Next action", uniqueValues(resource.cards.map((card) => card.nextAction)))}
      <div id="count" class="count">Results: ${resource.cards.length}</div>
    </section>
    <section id="empty" class="empty">${formatNoMatchGuidanceHtml(resource)}</section>
    <section id="cards" class="cards">
      ${resource.cards.map(formatCardHtml).join("\n")}
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
    const cards = Array.from(document.querySelectorAll("[data-card]"));
    const search = document.getElementById("search");
    const kindFilter = document.getElementById("kindFilter");
    const statusFilter = document.getElementById("statusFilter");
    const reviewabilityFilter = document.getElementById("reviewabilityFilter");
    const usefulnessOutcomeFilter = document.getElementById("usefulnessOutcomeFilter");
    const nextActionFilter = document.getElementById("nextActionFilter");
    const count = document.getElementById("count");
    const empty = document.getElementById("empty");
    const matchesFilter = (card, key, value) => value === "" || card.dataset[key] === value;
    const render = () => {
      const query = search.value.trim().toLowerCase();
      let visible = 0;
      for (const card of cards) {
        const textMatch = query.length === 0 || card.dataset.search.includes(query);
        const match = textMatch
          && matchesFilter(card, "kind", kindFilter.value)
          && matchesFilter(card, "status", statusFilter.value)
          && matchesFilter(card, "reviewability", reviewabilityFilter.value)
          && matchesFilter(card, "usefulnessOutcome", usefulnessOutcomeFilter.value)
          && matchesFilter(card, "nextAction", nextActionFilter.value);
        card.hidden = !match;
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

const buildNoMatchGuidance = (filter: BrainKnowledgeSearchFilter): string[] => [
  "No brain knowledge entries matched the current filters.",
  ...(filter.text === undefined ? [] : [
    "Try a shorter --text query or split the query into one mechanism term.",
    "If this is a Pattern Application Gate pre-coding query, run one broader query before concluding no retained pattern applies."
  ]),
  ...(hasStructuredFilter(filter) ? [
    "Remove one structured filter such as --kind, --status, --reviewability, or --usefulness-outcome and retry."
  ] : []),
  "If no retained pattern applies after retry, record an explicit rejected_or_deferred_patterns reason before coding.",
  "Zero results do not prove that no relevant pattern exists or that search ranking is good."
];

const hasStructuredFilter = (filter: BrainKnowledgeSearchFilter): boolean =>
  filter.kind !== undefined ||
  filter.status !== undefined ||
  filter.reviewability !== undefined ||
  filter.usefulnessOutcome !== undefined;

const formatNoMatchGuidanceText = (resource: KnowledgeCardsPreviewResource): string[] =>
  resource.noMatchGuidance === undefined ? [] : [
    "",
    "No-match guidance:",
    ...resource.noMatchGuidance.map((item) => `- ${item}`)
  ];

const formatNoMatchGuidanceHtml = (resource: KnowledgeCardsPreviewResource): string =>
  resource.noMatchGuidance === undefined
    ? "No brain knowledge entries match the current search."
    : `<strong>No brain knowledge entries match the current filters.</strong><ul>${resource.noMatchGuidance.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;

const formatCard = (card: BrainKnowledgeReadModel): string[] => [
  `- ${card.id}`,
  `  title: ${card.title}`,
  `  kind: ${card.kind}`,
  `  status: ${card.status}`,
  `  confidence: ${card.confidence}`,
  `  reviewability: ${card.reviewability}`,
  `  nextAction: ${card.nextAction}`,
  `  summary: ${card.summary}`,
  `  sourceRefs: ${card.sourceRefs.join(", ")}`,
  `  evidenceRefs: ${card.evidenceRefs.join(", ")}`,
  `  consumers: ${card.consumers.join(", ")}`,
  ...(card.usefulnessFeedback === undefined ? [
    "  usefulnessOutcome: none"
  ] : [
    `  usefulnessOutcome: ${card.usefulnessFeedback.outcome}`,
    `  usefulnessSummary: ${card.usefulnessFeedback.summary}`,
    `  usefulnessEvidenceRefs: ${card.usefulnessFeedback.evidenceRefs.join(", ")}`,
    `  usefulnessDoesNotProve: ${card.usefulnessFeedback.doesNotProve}`
  ]),
  `  falsifier: ${card.falsifier}`,
  `  doesNotProve: ${card.doesNotProve}`,
  ""
];

const cardSearchText = (card: BrainKnowledgeReadModel): string =>
  [
    card.id,
    card.kind,
    card.status,
    card.title,
    card.summary,
    card.confidence,
    card.reviewability,
    card.nextAction,
    ...card.sourceRefs,
    ...card.evidenceRefs,
    ...card.consumers,
    card.falsifier,
    card.doesNotProve,
    card.usefulnessFeedback?.outcome ?? "",
    card.usefulnessFeedback?.summary ?? "",
    card.usefulnessFeedback?.doesNotProve ?? "",
    ...(card.usefulnessFeedback?.evidenceRefs ?? [])
  ].join(" ").toLowerCase();

const formatUsefulnessFeedbackHtml = (card: BrainKnowledgeReadModel): string =>
  card.usefulnessFeedback === undefined
    ? ""
    : `<dt>Usefulness</dt><dd><strong>${escapeHtml(card.usefulnessFeedback.outcome)}</strong><br>${escapeHtml(card.usefulnessFeedback.summary)}<br>${formatHtmlList(card.usefulnessFeedback.evidenceRefs)}<br><span class="refs">does not prove: ${escapeHtml(card.usefulnessFeedback.doesNotProve)}</span></dd>`;

const formatCardDataAttributes = (card: BrainKnowledgeReadModel): string =>
  [
    { name: "data-card-id", value: card.id },
    { name: "data-kind", value: card.kind },
    { name: "data-status", value: card.status },
    { name: "data-reviewability", value: card.reviewability },
    { name: "data-usefulness-outcome", value: card.usefulnessFeedback?.outcome ?? "none" },
    { name: "data-next-action", value: card.nextAction },
    { name: "data-search", value: cardSearchText(card) }
  ].map((attribute) => `${attribute.name}="${escapeHtml(attribute.value)}"`).join(" ");

const formatCardHtml = (card: BrainKnowledgeReadModel): string => {
  return `<article data-card ${formatCardDataAttributes(card)}>
  <h2>${escapeHtml(card.title)}</h2>
  <div class="refs"><code>${escapeHtml(card.id)}</code></div>
  <div class="chips">
    <span class="chip strong">${escapeHtml(card.kind)}</span>
    <span class="chip">${escapeHtml(card.status)}</span>
    <span class="chip">confidence: ${escapeHtml(card.confidence)}</span>
    <span class="chip">reviewability: ${escapeHtml(card.reviewability)}</span>
    <span class="chip">next: ${escapeHtml(card.nextAction)}</span>
  </div>
  <p>${escapeHtml(card.summary)}</p>
  <dl>
    <dt>Source refs</dt><dd>${formatHtmlList(card.sourceRefs)}</dd>
    <dt>Evidence refs</dt><dd>${formatHtmlList(card.evidenceRefs)}</dd>
    <dt>Consumers</dt><dd>${formatHtmlList(card.consumers)}</dd>
    ${formatUsefulnessFeedbackHtml(card)}
    <dt>Falsifier</dt><dd>${escapeHtml(card.falsifier)}</dd>
    <dt>Does not prove</dt><dd>${escapeHtml(card.doesNotProve)}</dd>
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
  cardFiles: string[];
  patternFiles: string[];
  usefulnessFeedbackFiles: string[];
};

const parseKnowledgeCatalog = (value: unknown): KnowledgeCatalogInput | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const cardFiles = parseStringArray(value["cardFiles"]);
  const patternFiles = parseStringArray(value["patternFiles"]);
  const usefulnessFeedbackFiles = parseStringArray(value["usefulnessFeedbackFiles"] ?? []);

  if (
    cardFiles === undefined ||
    patternFiles === undefined ||
    usefulnessFeedbackFiles === undefined ||
    (cardFiles.length === 0 && patternFiles.length === 0 && usefulnessFeedbackFiles.length === 0)
  ) {
    return undefined;
  }

  return {
    cardFiles,
    patternFiles,
    usefulnessFeedbackFiles
  };
};

const loadCardFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const card = parseBrainKnowledgeReadModel(parsed);

  if (card === undefined) {
    throw new Error(`Invalid BrainKnowledgeReadModel card file: ${label}`);
  }

  cards.push(card);
};

const loadPatternFile = async (
  label: string,
  resolvedFile: string,
  cards: BrainKnowledgeReadModel[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const pattern = parseRetainedPatternDecision(parsed);

  if (pattern === undefined) {
    throw new Error(`Invalid retained pattern decision file: ${label}`);
  }

  cards.push(brainKnowledgeCardFromRetainedPatternDecision(pattern));
};

const loadUsefulnessFeedbackFile = async (
  label: string,
  resolvedFile: string,
  feedback: BrainKnowledgeUsefulnessFeedback[]
): Promise<void> => {
  const parsed = await readJsonObject(resolvedFile);
  const parsedFeedback = parseBrainKnowledgeUsefulnessFeedbackList(parsed);

  if (parsedFeedback === undefined) {
    throw new Error(`Invalid brain knowledge usefulness feedback file: ${label}`);
  }

  feedback.push(...parsedFeedback);
};

const parseStringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every((item) => typeof item === "string" && item.trim().length > 0)
    ? value
    : undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
