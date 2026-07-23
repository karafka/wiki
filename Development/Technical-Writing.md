# Technical Writing

Karafka documentation follows a controlled writing style we call Karafka Simplified Technical English (STE). It is inspired by the [ASD-STE100 standard](https://www.asd-ste100.org/) used across aerospace and technical documentation, adapted for developer docs. The goal is consistency and clarity: pages that are easy to scan, hard to misread, and friendly to non-native English readers and to LLM-assisted editing.

Treat this as a clarity floor, not a straitjacket. Apply the rules hardest to procedures, reference, and instructions. Keep conceptual and overview pages readable, and prefer clarity over a rigid rule when the two ever conflict. Promotional and marketing passages (for example the Pro upsell blocks) sit outside what STE was designed for - apply it loosely there, or exclude those blocks from enforcement.

!!! info "Scope"

    This style applies to hand-authored prose only. Do **not** edit the auto-generated files - component changelogs, the generated `Librdkafka` references (`Changelog`, `Errors`, `Statistics`, `Configuration`), instrumentation events, and the integration tests catalog - they regenerate from upstream. Everything else, including the hand-authored `Librdkafka/Threads-and-Pipe-Patterns.md`, is in scope.

## Documents structure and sources

- H1 and H2 headers in the Wiki TOC are rendered from the `Home.md` file. Edit them directly in `Home.md`. Renaming the titles in the VS Code navigation pane does nothing.

## Words

- Use one approved word per meaning, and prefer the short, common word.
- Use the same term for the same thing every time. Do **not** swap between synonyms for one concept.
- Karafka domain terms and technical names are always allowed (`topic`, `partition`, `offset`, `consumer group`, `rebalance`, `DLQ`, and similar). Follow the [Naming Conventions](https://karafka.io/docs/Development-Naming-Conventions).
- Do **not** use contractions. Write `do not`, not the shortened form.
- Remove `please`. Documentation gives direct instructions.
- Avoid marketing and hedge words such as `robust`, `powerful`, `seamless`, `simply`, and `easily`.

The linter rewrites or flags a controlled vocabulary. A representative sample of the safe substitutions:

```text
utilize        ->  use
leverage       ->  use
prior to       ->  before
in order to    ->  to
commence       ->  start
initiate       ->  start
obtain         ->  get
approximately  ->  about
sufficient     ->  enough
numerous       ->  many
```

The full, authoritative list lives in `.rules/ste-terms.json`. Extend the vocabulary by editing that file, not the rule code.

Some words are flagged rather than auto-substituted, because a blind swap changes meaning or grammar. Rewrite these per sentence. Do **not** find-and-replace them:

- `ensure` is semantically overloaded. It often means *guarantee* (a mechanism `ensures` a property), where `make sure` is weaker and wrong. Keep `ensure` (or use `guarantees`) for a guarantee; rewrite to `make sure that <clause>` only for an instruction to the reader.
- `regarding` and `concerning` are collocation-dependent. `about` fits informational nouns (`information regarding` becomes `information about`), but capability, policy, and compatibility nouns take `for`, `on`, `in`, or `with` (`capabilities regarding` is **not** `capabilities about`).
- `obtained` has an irregular participle. `obtained` to `got` breaks passive and attributive use (`was obtained` becomes `was got`). Keep `obtained`, or restructure to active voice with `get`.

The rule of thumb: auto-substitute a word only when it is a plain synonym that keeps the same grammar in every position (`utilize` to `use`). When the swap depends on the surrounding words, or on which sense is meant, flag it instead.

## Sentences

- Keep descriptive sentences to 25 words or fewer.
- Keep numbered procedure steps to 20 words or fewer.
- Write one instruction per sentence in a procedure.
- Prefer the active voice, and name the actor. Write "Karafka commits the offset", not "the offset is committed".
- Prefer the present tense. Avoid `will` where the present tense carries the meaning.
- Minimize `-ing` forms where a plain verb reads more clearly.

## Structure

- Start each page with a short overview directly under the title. Do **not** add an `## Overview` header.
- Use numbered steps for procedures. Add a `**Result:**` label where the outcome matters.
- Break long prose into lists, tables, and titled admonitions.
- Write all tables as HTML `<table>` elements, and give every admonition a title.

## Before and after

Long, passive, synonym-heavy prose:

```text
By leveraging this flexibility, you can effectively manage message flow in
multi-cluster environments, ensuring data reaches the right place based on your
application's unique requirements.
```

The same content in Karafka STE:

```text
Use this flexibility to route messages across clusters. Karafka sends each
message to the cluster you configure.
```

## What we do not adopt

We take the high-value, enforceable parts of ASD-STE100 and skip the rest:

- The full ASD-STE100 approved-word dictionary of about 900 words. It is too restrictive for conceptual developer prose.
- A hard ban on every `-ing` form.
- Rigid paragraph-length and article-usage rules.

We build our own term list and do **not** redistribute the ASD dictionary.

## Tooling and rollout

- The controlled vocabulary and sentence-length checks live in `.rules/no-unapproved-terms.js` and `.rules/max-sentence-length.js`. The word list lives in `.rules/ste-terms.json`.
- Run `npm run lint` to check a change. Run `npm run lint:fix` to auto-apply the safe substitutions.
- Auto-fix never touches code fences, inline code, or link targets, so config keys and examples stay intact.
- The rules roll out in phases. They are registered but disabled while the existing docs are normalized, then enabled in CI so new content stays compliant.

## Reference

- ASD-STE100, Simplified Technical English, is the international specification for controlled English, maintained by the AeroSpace and Defence Industries Association of Europe (ASD). See the [official ASD-STE100 site](https://www.asd-ste100.org/).
- Karafka STE adapts the standard's high-value rules for developer documentation. It is not affiliated with, or endorsed by, ASD, and it does not reproduce the ASD dictionary.
