# Project Rules

Before every task:
1. Read docs/000_DISCOVERY.md
2. Read docs/001_PROJECT_CHARTER.md
3. Read docs/002_ENGINEERING_PRINCIPLES.md
4. Read docs/003_MASTER_CONTEXT.md
5. Read docs/004_DECISIONS.md

**Feature gate (angler-facing work):** Will this make TrollMatch more valuable than ChatGPT for anglers? If no, redesign. Advantage = verified knowledge + structured relationships + editorial trust — not AI.

**Lexicon gate (terminology & taxonomy):** No fishing terminology or taxonomy may be introduced without being added to the Fishing Lexicon first (`docs/fishing/TERMINOLOGY.md`, `ui/src/modules/terminology/data/`). Species names also require `TAXONOMY_POLICY.md` alignment. Lexicon entry → docs → integration. Never the reverse.

**Compatibility gate (species–lure):** Every species–lure relationship for recommendations or effectiveness must be qualified by fishing technique — **Species → Technique → Lure**, never Species → Lure alone. See `docs/fishing/SPECIES_TECHNIQUE_LURE_POLICY.md`.

Then execute the task.
