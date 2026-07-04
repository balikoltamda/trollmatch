# Angler Product — Sprint 7+

**Document:** 010_ANGLER_PRODUCT  
**Status:** Active product direction  
**Supersedes:** Infrastructure-first Studio sprints as primary focus

---

## Philosophy

Stop building infrastructure. The foundation is strong enough.

From this point forward, every sprint must create **visible value for anglers**.

| Role | Responsibility |
|------|----------------|
| **Editor** | Validates |
| **Community** | Creates |
| **Platform** | Learns |

Every new feature should make anglers **return to the site**, not just improve the admin experience.

Studio work continues only when it unblocks an angler-facing loop.

---

## Priority stack

1. **Search** — find lures by model, brand, species, technique
2. **Fish pages** — species as the primary discovery axis
3. **Community reports** — anglers submit; editors verify
4. **Regional experience** — Aegean & Eastern Mediterranean lens on every page
5. **AI summaries** — at-a-glance reads with cited sources (after browse + contribute work)

---

## Sprint 7.1 — Discovery loop (shipped)

**Goal:** Anglers can find fish → find lures → open detail.

### Delivered

| Route | Purpose |
|-------|---------|
| `/search?q=` | Full-text search across catalog |
| `/lures` | Browse all visible lures |
| `/species` | Fish species index with lure counts |
| `/species/[slug]` | Species detail + linked lure grid |

### Wiring

- Header and hero search → `/search` (no more slug-guess 404s)
- Nav: Home · **Fish** · LureAtlas · Contribute
- Homepage species, latest lures, stats → live DB with static fallback
- Collection cards → species entry points
- Lure detail species rows → species pages
- Public lure visibility → `PUBLISHED` + `READY` only

### Module

`ui/src/modules/discovery/` — public catalog queries, visibility rules, shared search UI.

---

## Sprint 7.2 — Community reports (next)

**Goal:** Anglers submit catch/effectiveness reports; platform learns; editors validate in Studio.

- Public report form on lure detail
- `CatchReport` / assertion persistence (schema)
- Reports feed trust layer + community statistics (replace enrichment mock)
- Studio inbox receives community suggestions (existing pipeline)

---

## Sprint 7.3 — Regional experience

**Goal:** Every lure page answers “how does this work *here*?”

- Surface `LureEditorNote` regional fields on public lure detail
- Region selector or default Eastern Mediterranean lens
- Collections filter by region + species + technique

---

## Sprint 7.4 — AI summaries (angler-facing)

**Goal:** “At a glance” blocks with real cited sources — not empty shells.

- Promote verified editor notes into AI section when no generated summary
- Generate summaries from box specs + community reports + regional notes
- Always show citations and corpus date

---

## Deferred (admin / infra)

- Studio dashboard stat cards
- Import center polish
- Manufacturer hub (angler-facing brand pages are Sprint 8+)
- Meilisearch (after Prisma search proves UX)

---

## Success metric

Would an angler bookmark this page or share it with a fishing buddy?

If not, it does not ship.
