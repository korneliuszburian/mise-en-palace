Tak. To, co Adam pokazuje na tym demo, jest dużo bliższe **żywemu memory brainowi społeczności** niż klasycznemu RAG-owi. Z wideo widać kilka klas zachowania: odpowiedź techniczna typu “czy HEQ5 uniesie 200/1000”, potem proceduralna odpowiedź o belt-modzie i kosztach, potem rozpoznanie insiderskiego pojęcia “dwucalica”, dalej słownik żargonu Astropolis, historia konfliktów społecznościowych i pytanie o najczęściej fotografowane obiekty, gdzie system nie zmyśla rankingu, tylko sygnalizuje lukę w danych. To ostatnie jest cholernie ważne: dobry brain nie tylko odpowiada, ale też wie, kiedy **nie ma prawa udawać pewności**.

Moja diagnoza: **to nie jest problem wyszukiwania. To jest problem obserwacji, destylacji, temporalnego uziemienia i aktywacji właściwego wzorca poznawczego.** I właśnie to powinniśmy dołożyć do KRN jako osobną warstwę: **KRN Observational Memory Layer**.

## 1. Co dokładnie widać w działaniu Adama

Najmocniejsze nie jest to, że system znajduje posty. Najmocniejsze jest to, że odpowiada jak ktoś, kto rozumie **lokalną epistemologię społeczności**.

Przykład z HEQ5 i 200/1000 pokazuje odpowiedź nie jako “w forum ktoś napisał X”, tylko jako syntezę reguły praktycznej: nominalny udźwig montażu to jedno, astrofotograficzny udźwig roboczy to drugie, a długość ogniskowej i guiding podbijają ryzyko. To jest wiedza proceduralna i techniczna.

Przykład z belt-modem pokazuje już “repair/procedure memory”: co daje modyfikacja, ile może kosztować, kiedy warto, jakie są ryzyka i warianty.

Przykład z “dwucalicą” jest najlepszy. System rozpoznaje jednocześnie trzy warstwy:

```txt
literalna warstwa techniczna:
  standard 2 cale / 50,8 mm

warstwa praktyczna:
  okulary, wyciągi, filtry, adaptery, Barlowy

warstwa społecznościowa:
  żart / slang / “choroba” upgrade’owania sprzętu
```

Zwykły RAG mógłby złapać ostatni post albo najbliższy embeddingowo fragment. Dobry brain musi rozpoznać, że “dwucalica” to nie tylko rzecz, ale też **pojęcie kulturowe z historią użycia**. To dokładnie odpowiada kierunkowi KRN: memory nie może być markdownową notatką ani listą źródeł, tylko ma być store-backed, temporalne, source-linked, confidence-aware, invalidatable i retrievable jako małe pakiety.

Przykład z konfliktami Astropolis pokazuje jeszcze jedną rzecz: system potrafi operować na **społecznej historii i sporach**. Tam nie ma jednej prawdy w stylu “ostatni post wygrał”. Jest chronologia, role uczestników, claimy, kontrclaimy, reputacja źródeł, ton dyskusji i późniejsza adopcja narracji.

A przykład z M42 pokazuje właściwy model odpowiedzi: “prawdopodobnie / bardzo możliwe / klasyk / ale nie mam twardego rankingu bez kompletnej metryki zdjęć”. To jest **gap-aware answering**. W KRN powinniśmy traktować to jako first-class behavior, nie jako miły dodatek.

## 2. Co wnosi Observational Memory z Mastra

Mastra opisuje Observational Memory jako alternatywę dla dynamicznego per-turn retrievalu. Ich główna idea: zamiast za każdym razem szukać wspomnień, system w tle tworzy **gęsty dziennik obserwacji** z rozmowy, narzędzi i historii, a potem okresowo robi refleksję/kondensację. W ich architekturze są trzy warstwy: raw messages, observations i reflections; Observer kondensuje nowe wiadomości do obserwacji, a Reflector kondensuje obserwacje do bardziej stabilnych struktur. ([Mastra][1])

To nie jest zwykła kompakcja. Mastra mocno rozróżnia bulk summarization od event-based observation log: obserwacje mają zapisywać, co się wydarzyło, co ustalono, co się zmieniło, jakie są aktualne zadania i co agent powinien dalej zrobić. To jest bliższe “logowi zdarzeń poznawczych” niż streszczeniu rozmowy. ([Mastra][1])

Bardzo ważny detal: Mastra kładzie nacisk na **temporal anchoring** — observation date, referenced date i relative date. To jest krytyczne dla pytań typu “ostatnio”, “wtedy”, “poprzednio”, “po zmianie decyzji”. ([Mastra][1]) To świetnie pasuje do KRN, bo aktualny kierunek już mówi, że memory ma być temporalne, governed i feedback-aware, a write path ma iść przez EvidenceBundle → ReviewAssessment → FeedbackDelta → MemoryCandidate → review gate, bez automatycznego “agent powiedział, więc memory updated”.

Mastra raportuje też mocny wynik na LongMemEval i podkreśla stabilne okno kontekstu oraz cacheowalność promptu, bo observation log jest bardziej stabilny niż ciągłe dynamiczne retrieval. ([Mastra][1]) Sam LongMemEval jest dobrym benchmarkiem odniesienia, bo mierzy nie tylko recall, ale information extraction, multi-session reasoning, temporal reasoning, knowledge updates i abstention. ([arXiv][2])

Ale: **nie powinniśmy klonować Mastra 1:1.** Ich text-only observation log jest świetny jako mechanizm ekonomii kontekstu, ale KRN ma mocniejszy fundament: Postgres + pgvector + full-text search + relational graph edges + event ledger + source graph + anti-memory. W naszym setupie observation log powinien być nie tylko tekstem, ale tekstem powiązanym z eventami, source ranges, claimami, encjami, memory candidates i anti-memory. Aktualny plan KRN już zakłada Postgres/pgvector jako canonical brain store, Drizzle, Zod, Postgres FTS, edge tables, run/event ledger i Memory Core w Postgresie, nie w markdownie.

## 3. Najważniejsza decyzja architektoniczna

Nie robimy:

```txt
Mastra clone
ani
RAG + summarizer
ani
kolejny memory store
```

Robimy:

```txt
KRN Observational Memory Layer
  = event-sourced observation log
  + temporal reflection
  + source-ranged recall
  + claim/entity graph
  + memory candidates
  + anti-memory candidates
  + activation prefix
```

Czyli Mastra daje nam mechanizm:

```txt
Observer + Reflector + stable observation context
```

A KRN dodaje:

```txt
lineage
confidence
TTL
valid time
invalidation
source-to-decision edges
anti-memory
review gates
ActivationEngine
CapabilityCompiler
dogfood evals
```

To jest dużo bardziej “dopierdolone”, bo nie kończy się na ładnym logu obserwacji. Robi z obserwacji **materiał dowodowy dla brainu**.

## 4. Gdzie to siedzi w naszym systemie

Aktualny KRN flow to:

```txt
OperatorIntent
  -> TaskContract
  -> HarnessPlan
  -> ContextAssembly
  -> CapabilityPlan
  -> CodexAdapterPlan
  -> ExecutionRun
  -> EvidenceBundle
  -> ReviewAssessment
  -> FeedbackDelta
  -> Memory / Source / Skill / Policy / Eval updates
```

Ten flow jest już zapisany jako kierunek docelowy repo.  Observational Memory powinna wejść jako warstwa pomiędzy event ledgerem, evidence capture i Memory Core:

```txt
ExecutionRun / ToolTrace / SourceChunk / UserMessage / ReviewFeedback
  -> ObservationBuffer
  -> ObserverWorker
  -> ObservationGroup
  -> ReflectionWorker
  -> ReflectionRecord
  -> SourceClaim / MemoryCandidate / AntiMemoryCandidate
  -> ActivationEngine
  -> ContextAssembly / CodexAdapterPlan
```

W praktyce:

```txt
raw eventy zostają w ledgerze
obserwacje są stabilnym skrótem poznawczym
refleksje są kompresją wzorców
claimy są epistemiczną warstwą prawdy
memory records są zatwierdzonym belief state
anti-memory blokuje stare bzdury
activation decyduje, co wejść ma do kontekstu
```

To jest zgodne z obecnym KRN: jeden operacyjny mózg, nie agent zoo; funkcje mózgu to context selection, memory application, source grounding, policy, review intelligence, feedback distillation i pattern selection.

## 5. Minimalny model danych dla Observational Memory

Dodałbym nowy slice po obecnym schema/retrieval slice, ale przed pełnym “dreamingiem”. Nie jako osobną bazę. Normalnie w Postgresie.

```sql
observation_groups
  id
  project_id
  scope_type              -- run | thread | source_artifact | user | repo | topic
  scope_id
  observed_from_event_id
  observed_to_event_id
  observed_at
  reference_time
  relative_time_base
  raw_token_estimate
  observation_token_estimate
  compression_ratio
  observer_model
  status                  -- active | reflected | superseded | invalidated

observation_items
  id
  group_id
  priority                -- critical | high | medium | low
  kind                    -- fact | decision | correction | task | gap | risk | preference | procedure | slang | conflict
  title
  body
  confidence              -- low | medium | high
  valid_from
  valid_until
  invalidation_rule
  source_range_required
  supersedes_observation_id
  created_at

observation_source_ranges
  id
  observation_item_id
  source_type             -- run_event | tool_trace | source_chunk | post | review_feedback | diff
  source_id
  start_ref
  end_ref
  quote_hash
  exact_recall_available

observation_entity_edges
  observation_item_id
  entity_id
  relation_type
  confidence

observation_claim_edges
  observation_item_id
  source_claim_id
  relation_type           -- supports | contradicts | updates | contextualizes

reflection_records
  id
  project_id
  scope_type
  scope_id
  input_observation_group_ids
  title
  body
  produced_memory_candidate_ids
  produced_source_claim_ids
  produced_anti_memory_candidate_ids
  produced_eval_candidate_ids
  created_at
```

To dokłada się do tabel, które już planujecie: `source_artifacts`, `source_chunks`, `source_claims`, `source_decision_edges`, `memory_records`, `memory_record_versions`, `memory_candidates`, `memory_feedback_events`, `anti_memory_records`, `retrieval_runs`, `activation_decisions`, `context_items`, `context_exclusions`.

Najważniejsze: obserwacja **nie jest memory recordem**. Obserwacja jest “widzeniem świata przez system”. Memory record jest dopiero zatwierdzonym, wersjonowanym belief state.

## 6. Observer: co dokładnie ma robić

Observer nie ma streszczać. Ma zapisywać **obserwacje operacyjne**.

Dla KRN/Codex:

```txt
- jakie było zadanie;
- jakie pliki zostały dotknięte;
- jakie decyzje padły;
- jakie testy przeszły/nie przeszły;
- co user poprawił;
- jakie założenie okazało się fałszywe;
- co następnym razem trzeba zrobić inaczej;
- jakie źródło było użyte;
- czego nie wolno automatycznie zapisać jako memory.
```

Dla Astropolis-like corpus:

```txt
- jakie pojęcie pojawia się w wątku;
- czy jest techniczne, żartobliwe, slangowe, sporne;
- kto używa pojęcia i kiedy;
- czy znaczenie ewoluuje;
- jakie są sprzeczne użycia;
- które posty są źródłowe;
- czy ostatni post naprawdę zmienia konsensus;
- czy brakuje danych.
```

Prompt dla Observera powinien być brutalnie konkretny:

```txt
You are KRN Observer.

Do not summarize broadly.
Write dated, prioritized observations.

Capture:
- what happened;
- what changed;
- what was decided;
- what was corrected;
- what evidence supports it;
- what is uncertain;
- what must not be inferred;
- what exact source range supports the observation;
- temporal scope;
- confidence.

Do not store chain-of-thought.
Do not create final memory.
Do not resolve contradictions by hiding them.
Do not promote observations automatically.
```

Mastra ma podobny mechanizm z obserwacjami, które są datowane, priorytetyzowane i zawierają current task oraz suggested response. ([Mastra][1]) My dokładamy do tego source ranges, claim edges i review gates.

## 7. Reflector: gdzie zaczyna się “dreaming”

Reflector powinien działać offline. Nie w runtime answer path.

Jego praca:

```txt
observation groups
  -> merge duplicates
  -> detect contradictions
  -> detect stale observations
  -> produce topic dossier
  -> produce source claims
  -> produce memory candidates
  -> produce anti-memory candidates
  -> produce eval candidates
```

Przykład dla “dwucalica”:

```txt
Observation A:
  2005-2007: “dwucalica” używana literalnie jako standard 2"

Observation B:
  późniejsze posty: używana żartobliwie jako “choroba” upgrade’u

Observation C:
  w niektórych kontekstach oznacza konkretny adapter/okular/focuser

Reflection:
  “dwucalica” has at least two accepted meanings:
    1. technical 2-inch optical standard;
    2. local humorous slang for upgrade desire / equipment disease.
  Do not answer as only one meaning.
  Always ask/resolve context if query ambiguous.
  Confidence high for technical meaning, medium/high for slang depending on source cluster.
```

I dopiero z tego powstają:

```txt
SourceClaim
MemoryCandidate
AntiMemoryCandidate:
  “Do not treat latest post as authoritative definition without consensus check.”
EvalCandidate:
  “dwucalica must return technical + slang meaning + caveat.”
```

To jest zgodne z Waszą zasadą, że reflection/dreaming ma być explicit offline synthesis, a feedback ma przechodzić w reviewed memory/evals, nie w automatyczną mutację prawdy.

## 8. Jak to wygląda w runtime odpowiedzi

W runtime nie chcemy robić gigantycznego retrievalu. Chcemy:

```txt
1. stable observation prefix
2. mały dynamiczny context packet
3. raw recall tylko gdy trzeba cytować lub sprawdzić szczegół
```

Czyli:

```txt
TaskContract
  -> ObservationPrefixSelector
  -> ActivationEngine
  -> ContextAssembly
  -> RawEvidenceRecall if needed
  -> Answer / CodexAdapterPlan
```

Observation prefix powinien być stabilny, mały i cacheowalny:

```txt
Project/Topic Observation Prefix:
- current active decisions
- relevant corrections
- known gaps
- recent high-priority observations
- active anti-memory warnings
- temporal caveats
```

Dynamiczny retrieval zostaje, ale jako **recall layer**, nie główny mózg:

```txt
Use retrieval when:
- exact source quote needed;
- observation confidence is low;
- contradiction detected;
- user asks for source;
- task touches risky code;
- answer requires current raw evidence.
```

To też rozwiązuje problem “więcej kontekstu = gorzej”. KRN już rozpoznaje ten paradoks: więcej kontekstu może oznaczać noise, contradiction, attention dilution i context clash, więc ma wybierać mały, task-specific packet.

## 9. Jak to wdrożyć w aktualnym setupie repo

Nie mam tutaj live checkoutu repo, więc mówię na podstawie dostarczonego stanu architektonicznego, nie inspekcji kodu. Z dokumentów wynika, że najbliższy realny stan to Postgres-backed Harness OS z paczkami typu `core`, `schema`, `db`, `harness`, `codex-adapter`, `cli`, plus późniejsze workers/dashboard.

Wdrożyłbym to tak:

```txt
packages/core/src/observations/
  Observation.ts
  ObservationGroup.ts
  ReflectionRecord.ts
  ObservationSourceRange.ts

packages/schema/src/observations/
  observationInputSchemas.ts

packages/db/src/schema/
  observations.ts

packages/db/src/repositories/
  ObservationRepository.ts
  ReflectionRepository.ts

packages/harness/src/observations/
  buildObservationInput.ts
  selectObservationPrefix.ts
  observationActivation.ts

packages/workers/src/jobs/
  observeRunEvents.ts
  observeSourceThread.ts
  reflectObservationGroups.ts

packages/cli/src/commands/
  observe.ts
  reflect.ts
```

Nie robiłbym tego jako “nowy produkt obok KRN”. To ma być część finalnego brain store’u.

### Kolejność implementacji

**Slice OM-00 — ADR**

```txt
ADR: Observational Memory is an event-derived layer, not Memory Core.
```

Decyzja:

```txt
- observations are derived from run_events/source_chunks/tool_traces/review_feedback;
- observations require source ranges;
- observations can produce memory candidates;
- observations cannot mutate Memory Core directly;
- reflections are offline synthesis;
- raw evidence remains canonical for exact claims.
```

**Slice OM-01 — schema**

Dodaj tabele:

```txt
observation_groups
observation_items
observation_source_ranges
observation_entity_edges
observation_claim_edges
reflection_records
observation_feedback_events
```

**Slice OM-02 — Observer input builder**

Zbuduj deterministic input z:

```txt
run_events
tool_traces
evidence_bundles
review_assessments
source_chunks
user corrections
```

Uwaga: wejście musi być `unknown -> Zod -> domain type`, bo KRN ma TypeScript boundary discipline jako kernel boundary.

**Slice OM-03 — Observer worker**

Najpierw prosto:

```txt
threshold by event count / token estimate
no streaming
no background daemon magic
manual command: krn observe --run <id>
```

Potem dopiero:

```txt
worker_jobs: observe_run_events
worker_jobs: observe_source_thread
```

**Slice OM-04 — Reflection worker**

```txt
krn reflect --scope project:<id>
krn reflect --scope topic:dwucalica
krn reflect --scope run:<id>
```

Outputem nie jest memory, tylko:

```txt
reflection_record
memory_candidates
source_claims
anti_memory_candidates
eval_candidates
```

**Slice OM-05 — Activation integration**

Dodać do ActivationEngine:

```txt
selectObservationPrefix(taskContract)
rankObservationItems()
applyObservationFreshness()
applyObservationConfidence()
applyAntiMemoryWarnings()
```

I do `ContextAssembly`:

```txt
observationPrefix
observationInclusions
observationExclusions
rawEvidenceNeeded
```

**Slice OM-06 — raw recall**

Każda obserwacja musi umieć wrócić do źródła:

```txt
observation -> source_range -> source_chunk / event / post / diff / review
```

Bez tego zrobimy “ładną halucynację z pamięci”.

**Slice OM-07 — golden tasks**

Dla Astropolis-like:

```txt
- co to jest dwucalica?
- czy HEQ5 uniesie 200/1000?
- ile realnie daje belt mod HEQ5?
- wypisz żargon Astropolis z caveatami
- opisz największy konflikt z chronologią i niepewnością
- czy M42 jest najczęściej fotografowanym obiektem? nie zmyślaj rankingu
```

Dla KRN repo:

```txt
- powtórzona decyzja architektoniczna nie może zostać zapomniana po kompakcji
- stara decyzja z anti-memory nie może wejść do planu
- review feedback musi stworzyć candidate, nie automatyczną memory
- context assembly ma mieć inclusions i exclusions
```

To pasuje do Waszej filozofii evali: eval tylko dla realnego kontraktu, znanej porażki, memory behavior, context behavior, source behavior, review burden albo diff risk — nie jako benchmark theater.

## 10. Co odróżni naszą wersję od Mastra

Mastra Observational Memory:

```txt
raw messages
  -> observations
  -> reflections
  -> stable prompt context
```

Nasza wersja:

```txt
run/source/tool/review events
  -> observations with source ranges
  -> temporal reflections
  -> claim/entity graph
  -> memory candidates
  -> anti-memory candidates
  -> activation prefix
  -> raw evidence recall
  -> reviewed Memory Core
```

Czyli Mastra optymalizuje pamięć rozmowy. KRN ma optymalizować **operacyjny brain pracy i wiedzy**.

To jest różnica między:

```txt
agent remembers conversation
```

a:

```txt
agent maintains an auditable, temporal belief system
```

## 11. Jak stworzyć “dopierdolone” rzeczy praktycznie

Najbardziej wartościowe primitives:

### 1. Topic dossiers

Dla każdego ważnego tematu:

```txt
topic: dwucalica
meanings:
  - technical 2" standard
  - community slang / joke
timeline:
  - earliest observed usage
  - meaning drift
confidence:
  - high technical
  - medium/high slang
contradictions:
  - ambiguous uses
raw recall:
  - source ranges
anti-memory:
  - do not answer only as technical adapter
```

### 2. Consensus ledger

Niech claim ma status:

```txt
observed
candidate
accepted
contested
deprecated
invalidated
superseded
joke_or_slang
preference
procedure
```

To jest krytyczne dla forów, firm i repo. W firmie “prawdą” nie jest ostatni Slack. W repo “prawdą” nie jest ostatni komentarz Codexa. W społeczności “prawdą” nie jest najnowszy post.

### 3. Gap detector

Każda odpowiedź powinna umieć powiedzieć:

```txt
I can answer conceptually.
I cannot prove exact ranking.
I need raw metric.
Known missing data:
  - no complete attachment metadata
  - no normalized object tags
  - no like/view aggregation
```

To właśnie widać przy M42 w demo Adama: system nie powinien wymyślić rankingu, jeśli nie ma kompletnej metryki.

### 4. Anti-memory

Anti-memory jest równie ważne jak memory:

```txt
- nie używaj ostatniego posta jako definicji
- nie traktuj forumowego żartu jako faktu technicznego
- nie promuj reflection do memory bez review
- nie odpowiadaj “HEQ5 da radę”, jeśli user pyta o astrofoto 200/1000
- nie twórz rankingu zdjęć bez indeksu metadanych
```

KRN już zakłada anti-memory jako first-class część Memory Core.

### 5. Observation-first Codex runs

Każdy run Codexa powinien kończyć się observation bundle:

```txt
What changed?
What decision was made?
What failed?
What did reviewer correct?
What memory candidate emerged?
What anti-memory candidate emerged?
What eval should be created?
```

To podpina się pod `krn evidence capture`, które w obecnym planie ma zbierać changed files, commands, typecheck/test results, diff risk, review burden, rollback path, feedback candidates i run event, bez auto-apply memory.

## 12. Najważniejsze ryzyka

Największe ryzyko: Observer zacznie pisać ładne streszczenia. To zabije system.

Falsyfikatory:

```txt
Jeśli observation item nie ma source range, fail.

Jeśli reflection usuwa sprzeczności, fail.

Jeśli observation prefix rośnie bez limitu, fail.

Jeśli observation automatycznie staje się memory recordem, fail.

Jeśli nie da się wrócić do raw evidence, fail.

Jeśli “ostatnie wydarzenie” nadpisuje silniejszy consensus bez powodu, fail.

Jeśli agent musi dynamicznie retrieve’ować wszystko co turę, fail.

Jeśli gap/abstain nie jest osobnym typem obserwacji, fail.

Jeśli observation log miesza scope’y, np. user preference z project decision, fail.
```

## 13. Prompt do Codexa na realne wdrożenie

Wkleiłbym taki prompt do repo po aktualnych schema/harness slice’ach:

```md
# Goal: Add KRN Observational Memory Layer

Context:
KRN is a Postgres-backed AI Engineering Harness OS for Codex.
Memory Core is Postgres-backed, temporal, source-linked, confidence-aware,
invalidatable and feedback-aware. Markdown and `.krn` are not runtime memory.

Task:
Add the first Observational Memory vertical slice.

Decision:
Observational Memory is not Memory Core.
It is an event-derived layer that converts run/source/tool/review history into
dated, source-ranged observations and offline reflections. Reflections may create
MemoryCandidate, SourceClaim, AntiMemoryCandidate and EvalCandidate records, but
must not auto-promote memory.

Required:
- core types:
  - ObservationGroup
  - ObservationItem
  - ObservationSourceRange
  - ReflectionRecord
- Zod input schemas for observer/reflector jobs
- Drizzle schema:
  - observation_groups
  - observation_items
  - observation_source_ranges
  - observation_entity_edges
  - observation_claim_edges
  - reflection_records
  - observation_feedback_events
- repository interfaces/adapters:
  - ObservationRepository
  - ReflectionRepository
- harness functions:
  - buildObservationInput
  - selectObservationPrefix
  - rankObservationItems
- worker job types:
  - observe_run_events
  - observe_source_thread
  - reflect_observation_groups
- CLI commands:
  - krn observe --run <id>
  - krn reflect --scope <scope>

Rules:
- observations require source ranges unless explicitly marked as user preference
- observations cannot mutate Memory Core
- reflections cannot hide contradictions
- no chain-of-thought storage
- no dashboard
- no separate vector DB
- no separate graph DB
- no broad subagent system
- no runtime markdown memory

Verification:
- typecheck passes
- tests prove observation without source range is rejected for factual claims
- tests prove reflection creates candidates, not memory records
- activation can include a small observation prefix
- raw evidence can be recalled from an observation source range
```

## 14. Finalnie: co myślę

Tak — **to jest dokładnie kierunek, który powinniśmy dowalić do KRN**.

Ale nie jako “feature memory”. To musi być jeden z głównych organów brainu:

```txt
Event Ledger
  -> Observational Memory
  -> Reflection/Dreaming
  -> Claim Graph
  -> Memory Candidates
  -> Anti-Memory
  -> Activation Engine
  -> ContextAssembly
```

Najlepsza wersja KRN nie będzie miała “lepszego RAG-a”. Będzie miała **obserwujący, temporalny, audytowalny układ nerwowy**, który zamienia pracę, rozmowy, kod, review, źródła i błędy w żywą pamięć — ale tylko przez bramki, lineage, confidence, invalidation i feedback.

Czyli dokładnie:

```txt
Mastra-style observational log
+ KRN Postgres brain store
+ source ranges
+ temporal claim graph
+ anti-memory
+ review gates
+ activation policy
+ dogfood evals
= naprawdę mocny memory brain
```

I to jest realne w naszym setupie, bo aktualna architektura już idzie w stronę Postgres-backed brain store, Memory Core, Source Graph, ActivationEngine, HarnessCompiler i evidence/review feedback loop.

[1]: https://mastra.ai/research/observational-memory "https://mastra.ai/research/observational-memory"
[2]: https://arxiv.org/abs/2410.10813 "https://arxiv.org/abs/2410.10813"
