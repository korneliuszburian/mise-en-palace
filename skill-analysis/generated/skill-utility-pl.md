# Uzytecznosc KRN Skills

Ten dokument opisuje po polsku, po co istnieje kazdy skill w naszym systemie.
Nie jest to katalog dla katalogu. Pytanie brzmi: czy skill realnie zmienia
zachowanie agenta w wielkim loopie?

## Najwazniejsze rozroznienie

`to-spec`, `to-tickets` i `wayfinder` zostaja trybami `beads`, bo ich
naturalnym artefaktem koncowym jest tracker: issue body, acceptance criteria,
dependency edges i frontier.

`grill` zostaje zachowaniem `domain-modeling`: pytamy operatora, gdy term,
owner albo decision jest niejasne, i nie odpowiadamy sami za operatora.
`research` zostaje `source-to-decision`, bo KRN potrzebuje decyzji,
consumerow i falsifierow, nie archiwum linkow. `prototype` jest opcjonalnym
brakiem, dopoki realny UX/state-model artifact nie bedzie mial consumerow.

## Skill Utility Table

| Skill | Rola | Po co istnieje | Realny zysk | Ryzyko | Decyzja |
|---|---|---|---|---|---|
| beads | router | Durable task graph dla dużego loopu: triage, to-spec, to-tickets, wayfinding, handoff, zależności i frontier. | Przejmuje Mattowe to-spec/to-tickets/wayfinder bez tworzenia drugiego planning surface poza trackerem. | Może stać się overloaded routerem, jeśli tryby nie kończą się konkretnymi Beads artifacts i bd ready frontier. | Active; keep planning modes inside Beads unless independent invocation pressure appears. |
| code-review | checker | Niezależny checker dla diffu: standardy, spec fit, roadmap drift, smell baseline, evidence review i proof gaps. | Zawiera Fowler-style smells, rozdziela Standards od Spec i przejmuje evidence-review jako reference. | Traci sens, jeśli ten sam agent ocenia własną zmianę bez świeżego kontekstu lub bez file:line evidence. | Active; pair explicitly after maker work. |
| diagnosing-bugs | maker | Diagnostyka nieznanych awarii: najpierw czerwony repro command, potem hipotezy i fix. | Blokuje theory-first debugging i oddziela diagnozę od TDD dla znanego zachowania. | Jeśli repro jest zbyt szerokie albo pominięte, skill zamienia się w zwykłe fix-by-inspection. | New active skill; keep because it enforces a distinct red-capable diagnosis loop. |
| domain-modeling | decision | Pilnuje słownika, nazw domenowych, context/ADR lane, grill behavior i codebase-design decisions. | Przejmuje grill-with-docs i codebase-design bez osobnych top-level skills; resolved terms trafiają do CONTEXT/CONVENTIONS/docs/adr. | Może stać się prose-only, jeśli nie kończy się właścicielem, consumerem, falsifierem albo targeted rg/typecheck proof. | Active; ask one narrow human question when ambiguous and never self-grill. |
| krn-implementation | maker | Maker entrypoint dla runtime work: activation, store schema, Codex adapter, TDD i TypeScript boundaries. | Redukuje skill zoo: pięć wyspecjalizowanych maker skills staje się progressive-disclosure references. | Może być za szeroki, jeśli agent nie wybierze konkretnej reference i proof command przed edycją. | New active skill; keep references short and load only the relevant branch. |
| source-to-decision | decision | Przerabia źródła na decyzje: source -> mechanism -> KRN implication -> decision/rejection. | Przejmuje research jako decision-grade source gate zamiast tworzyć research archive. | Może być za ciężki dla prostego linku; należy odrzucać źródła bez consumer/falsifier. | Active; no separate research skill until pure source legwork earns one. |
| target-repo-testing | checker | Checker/protocol dla pracy na target repo: dirty state, write authority, proof/non-proof, handoff. | Chroni przed fałszywym proofem i przypadkowym mutowaniem cudzego stanu. | Może być zbyt duży i mieszać setup, test, repair oraz handoff. | Active; watch for sequence split if agents rush through phases. |

## Kandydaci na nastepne zmiany

1. Sprawdzic `diagnosing-bugs` na prawdziwym failure i doprecyzowac repro gate.
2. Sprawdzic Beads `wayfinding` na duzej mglistej pracy i potwierdzic, ze
   frontier przez `bd ready` wystarcza.
3. Pilnowac, czy `krn-implementation` nie robi sie zbyt szeroki; jesli tak,
   split musi miec consumer/falsifier.
4. Dodac osobny `prototype` tylko po realnym UX/state-model consumerze.
