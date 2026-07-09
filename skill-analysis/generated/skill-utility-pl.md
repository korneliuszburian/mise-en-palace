# Uzytecznosc KRN Skills

Ten dokument opisuje po polsku, po co istnieje kazdy skill w naszym systemie.
Nie jest to katalog dla katalogu. Pytanie brzmi: czy skill realnie zmienia
zachowanie agenta w wielkim loopie?

## Najwazniejsze rozroznienie

`to-spec` i `to-tickets` prawdopodobnie powinny zaczac jako tryby `beads`,
bo ich naturalnym artefaktem koncowym jest tracker: issue body, acceptance
criteria, dependency edges i frontier.

`wayfinder` jest innym typem mechanizmu. Nie sluzy tylko do rozbicia planu na
zadania. Sluzy wtedy, gdy planu jeszcze nie da sie uczciwie napisac: istnieje
destination, fog of war, decyzje do odkrycia, blocker graph i frontier. Dlatego
Wayfinder moze byc osobnym protokolem wewnatrz Beads albo osobnym skillem, jesli
sam tryb Beads robi sie zbyt ciezki.

## Skill Utility Table

| Skill | Rola | Po co istnieje | Realny zysk | Ryzyko | Decyzja |
|---|---|---|---|---|---|
| activation-engine | maker | Steruje wyborem kontekstu dla KRN: co aktywować, co odrzucić i kiedy jawnie abstainować. | Chroni loop przed prompt bloatem i losowym dociąganiem dokumentów, bo każda inkluzja musi mieć powód użycia. | Może stać się polityką opisaną w markdownu, jeśli nie jest podparta testami selekcji i exclusion records. | Keep as maker skill. |
| beads | router | Durable task graph dla dużego loopu: stan pracy, zależności, frontier, claim, close, follow-up. | Może zastąpić większość `to-tickets` i część `to-spec`, bo końcowym artefaktem i tak jest tracker. | Jeśli wrzucimy tu wszystko, stanie się overloaded routerem; potrzebuje jawnych trybów: triage, to-spec, to-tickets, wayfinding. | Keep, but split internally into explicit modes before adding separate planning skills. |
| brain-store-schema | maker | Pilnuje granic storage/migration dla temporal Memory Core. | Wymusza TypeScript/store discipline i rollback thinking przy zmianach, które trudno odkręcić. | Bez rzeczywistych migration/evidence gates może udawać safety zamiast go dowodzić. | Keep as maker skill. |
| code-review | checker | Niezależny checker dla diffu: standardy, spec fit, roadmap drift, smell baseline i proof gaps. | To jest nasz najmocniej pokryty Mattowy element; zawiera Fowler-style smells i rozdziela Standards od Spec. | Traci sens, jeśli ten sam agent ocenia własną zmianę bez świeżego kontekstu lub bez file:line evidence. | Keep; pair explicitly after maker work. |
| codebase-design | decision | Decyzje architektoniczne: gdzie jest granica modułu, czy interface jest deep, czy nazwa oddaje ownership. | Daje język do odrzucania speculative seams i adapter-chainów zanim wejdą do kodu. | Może być advice-only, jeśli nie kończy się konkretną decyzją, zmianą granicy albo follow-up Beadem. | Keep as decision skill; tie outputs to context/ADR/source decision. |
| codex-adapter-plan | maker | Przekłada KRN DecisionPacket/harness output na bounded Codex execution brief. | Chroni przed tym, żeby adapter zaczął być ukrytą pamięcią/runtime policy zamiast rendererem decyzji. | Nisza; jeśli nie ma aktywnych adapter zmian, będzie rzadko używany. | Keep as specialized maker skill. |
| domain-modeling | decision | Pilnuje słownika, nazw domenowych i tego, żeby pojęcia miały jednego właściciela. | To naturalne miejsce na Mattową logikę `CONTEXT.md`: rozwiąż termin raz i zapisz decyzję poza czatem. | Obecnie bardziej hamuje złe nazwy niż prowadzi do widocznego context artifactu. | Keep; extend with grill/context capture behavior. |
| evidence-review-loop | checker | Checker dowodów po wykonaniu pracy: co jest proof, co non-proof, jakie ryzyko i feedback delta. | Buduje feedback loop i memory/source/skill candidates bez polegania na opowieści agenta. | Jeśli używany jako końcowa checklista przez maker agent, osłabia maker/checker separation. | Keep as checker; invoke deliberately after implementation. |
| handoff-compact | router | Zapisuje stan pracy po długiej sesji: objective, issue, commit/push/CI, decyzje, blokery, next action. | Zmniejsza utratę stanu w wielkim loopie, gdzie model zapomina, a repo/tracker pamięta. | Może dublować Beads, jeśli zamiast compact handoff zacznie być osobnym task ledgerem. | Keep as router/state skill. |
| source-to-decision | decision | Przerabia źródła na decyzje: source -> mechanism -> KRN implication -> decision/rejection. | Najlepsza obrona przed research summary bez konsekwencji w systemie. | Może być za szeroki: research legwork, decyzja, falsifier i knowledge promotion w jednym miejscu. | Keep for now; audit whether pure research should split out. |
| target-repo-testing | checker | Checker/protocol dla pracy na target repo: dirty state, write authority, proof/non-proof, handoff. | Chroni przed fałszywym proofem i przypadkowym mutowaniem cudzego stanu. | Może być zbyt duży i mieszać setup, test, repair oraz handoff. | Keep, but watch for sequence split if agents rush through phases. |
| tdd | maker | Maker loop dla zamierzonego zachowania: red -> green -> refactor przy właściwym public seam. | Najkrótszy feedback loop dla implementacji; typowo Mattowy rdzeń pracy. | Nie zastępuje `diagnosing-bugs`, bo TDD nie wymusza najpierw red-capable repro dla nieznanej usterki. | Keep; add separate diagnosing-bugs. |
| typescript-type-safety | maker | Pilnuje TypeScript-first granic: unknown narrowing, public types, validators, any/cast discipline. | Skraca feedback loop przez typy i zapobiega oszukiwaniu kompilatora dla szybkiego green. | Może być policy reminderem, jeśli nie kończy się typecheckiem albo konkretnym boundary fixem. | Keep as maker skill. |

## Kandydaci na nastepne zmiany

1. `diagnosing-bugs`: osobny skill, bo brakuje czerwonej petli diagnostycznej.
2. `beads`: dodac tryby `to-spec`, `to-tickets`, `wayfinding`, zamiast
   mnozyc nowe skillsy bez potrzeby.
3. `domain-modeling`: dodac grill/context capture, bo to jest najblizszy
   odpowiednik Mattowego `CONTEXT.md`.
4. `source-to-decision`: sprawdzic, czy nie trzeba oddzielic research legwork
   od decision capture.
