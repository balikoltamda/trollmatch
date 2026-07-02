# DUEL Manufacturer Connector Specification

**Document:** DUEL_CONNECTOR  
**Project (internal):** TrollMatch  
**Platform (public):** Balık Oltamda Guide  
**Status:** Specification only — no implementation  
**Sprint:** S010  
**Last updated:** 2026-07-02  
**Authority:** Informs future `ManufacturerImportProvider` for DUEL Co., Inc.

---

## 1. Purpose

This document specifies how a future **DUEL connector** should discover, crawl (or ingest), parse, and map DUEL Co., Inc. product catalog data into `CanonicalLureImport` records for LureAtlas.

**Scope for LureAtlas Phase 1:** hard-bait and metal lures (minnows, poppers, jigs marketed as lures, trolling lures). Squid jigs (エギ), fishing lines, terminal tackle, apparel, and accessories are catalog-adjacent but should be **excluded or deferred** unless product owner expands scope.

**Out of scope for this document:** scraper code, persistence, scheduling infrastructure, or registry YAML changes.

---

## 2. Manufacturer Hierarchy

```
DUEL Co., Inc. (デュエル株式会社)
├── Corporate site: duel.co.jp
├── HQ: Fukuoka, Japan
├── Overseas contact: overseas@duel.co.jp
└── Product publishing: single corporate CMS (Japanese primary; English mirror)
```

| Layer | LureAtlas mapping | Notes |
|-------|-------------------|-------|
| **Legal entity** | `Manufacturer` | One record: slug `duel`, country `JP`. DUEL Co., Inc. is the manufacturer of record for all products on `duel.co.jp`. |
| **Commercial brand** | `ProductLine` or brand facet | Three top-level brand pillars on the website (see §3). |
| **Series** | `ProductLine` | e.g. *Laser Pro* (Halco analog), *3DB SERIES*, *SONICBOOM SERIES*, *AILE MAGNET SERIES*. |
| **Model** | `LureModel` | Product detail page (`pid`) — one page may represent multiple sizes/weights in SPEC table. |
| **Size / weight row** | Model-level attribute or sub-model | Many pages list multiple rows under one `pid` (e.g. 90 mm / 120 mm on one page). |
| **Color / SKU** | `LureVariant` + `Color` | Japanese detail pages expose per-color JAN/UPC rows; English pages expose COLORS section with codes (e.g. `HGR`, `HIW`). |

### Relationship to existing registry

`manufacturer-registry/yozuri.yaml` registers **Yo-Zuri** as a separate manufacturer entry. On `duel.co.jp`, **YO-ZURI PRODUCT** is a brand pillar alongside **DUEL PRODUCT** and **HARDCORE PRODUCT**. Connector design must decide:

| Strategy | Pros | Cons |
|----------|------|------|
| **A — Single DUEL connector, split by brand at map time** | One crawl source; matches corporate site structure | Yo-Zuri registry entry may duplicate manufacturer identity |
| **B — DUEL connector excludes YO-ZURI pillar** | Aligns with separate `yozuri` registry | Incomplete picture of corporate site |
| **C — Two connectors, shared `pid` namespace** | Clean manufacturer records | Requires dedupe rules; same `pid` must not collide |

**Recommendation:** Strategy **A** for research ingestion; map **HARDCORE**, **DUEL**, and **YO-ZURI** pillars to distinct `ProductLine` groupings under the correct LureAtlas `Manufacturer` (DUEL vs Yo-Zuri) using brand metadata on the product page breadcrumb — not URL alone.

---

## 3. Brand Hierarchy

The corporate website organizes products under **three brand pillars**. Each pillar contains **series** and **category listings**.

```
duel.co.jp (products)
│
├── HARDCORE PRODUCT
│   ├── HARDCORE R SERIES
│   ├── La Tour SERIES
│   ├── HARDCORE BASS SERIES
│   ├── HARDCORE TROUT SERIES
│   ├── SONICBOOM SERIES
│   ├── HARDCORE SALT WATER LURE
│   ├── HARDCORE LIGHT GAME SERIES
│   └── HARDCORE FISHING LINES          ← exclude (lines)
│
├── DUEL PRODUCT
│   ├── AILE MAGNET SERIES
│   ├── DUEL SALT WATER LURE            ← in scope
│   ├── DUEL SQUID JIG                  ← defer (egi)
│   ├── H.D.CARBON EX SERIES            ← exclude (lines)
│   ├── Pink Fluorocarbon …             ← exclude (lines)
│   └── DUEL FISHING LINES              ← exclude (lines)
│
└── YO-ZURI PRODUCT
    ├── PRO SERIES
    ├── 3DR-X / 3DB / 3DS SERIES
    ├── L-MINNOW, PINS MINNOW SERIES
    ├── YO-ZURI LURE SERIES
    ├── 3D INSHORE / CRYSTAL / MAG / HYDRO / 3D SERIES
    ├── BIG GAME SERIES                   ← high priority for trolling
    ├── SQUID JIG / SQUID-OCTOPUS JIG     ← defer
    └── YO-ZURI FISHING LINES             ← exclude (lines)
```

### Japanese site — orthogonal taxonomy

The Japanese product hub (`/products/`) adds **functional** categories independent of brand pillar:

| Top category (JP) | LureAtlas relevance |
|-------------------|---------------------|
| ルアー (Lures) | **Primary in-scope** |
| イカ釣り (Squid fishing) | Defer |
| ライン (Lines) | Exclude |
| 磯・波止 (Rock/shore float) | Exclude |
| タコ釣り (Octopus) | Exclude |
| その他用品 / ウェア・グッズ | Exclude |
| ブランド・シリーズ | Cross-cutting filter (HARDCORE / DUEL / YO-ZURI) |

Faceted filters also include **スタイル** (style), **魚種** (target species), **ソルト/フレッシュ**, and **新発売** (new releases).

---

## 4. Website Structure

DUEL operates a **dual-locale corporate product site** on one domain.

| Locale | Base URL | Product hub | Detail extension |
|--------|----------|-------------|------------------|
| Japanese (canonical) | `https://www.duel.co.jp/` | `/products/` | `.php` |
| English (global) | `https://www.duel.co.jp/english/` | `/english/products/` | `.html` |

### Site map (product-relevant)

```
/  or  /english/
├── news, about, contact
└── products/
    ├── index (category browser — JP: /products/, EN: /english/products/)
    ├── list (EN series listing — list.html?category={id})
    ├── more (JP paginated listing — more.php?category={id}&p={n})
    └── detail (product page — ?pid={numeric_id})
```

### Product detail page sections (observed)

Both locales follow a similar DOM intent:

| Section | EN label | JP label | Import value |
|---------|----------|----------|--------------|
| Breadcrumb | home → PRODUCTS → series → model | 製品情報 → … | Brand, series, category path |
| Title | H1 product name | H1 + English subtitle | `model.name` |
| Summary | Lead paragraph | 製品概要 | `model.description` |
| Features | FEATURE (+ subheads) | 特徴 | Tags / marketing claims |
| Colors | COLORS (+ code headings) | カラー blocks + spec tables | Variants, color codes |
| Spec table | SPEC | スペック情報 | Size, weight, type, hooks, range, CAT.NO. |
| Color/SKU table | (often EN only in table) | 注文番号 / JAN/UPC | External identifiers |
| Media | Embedded video | ムービー | Reference only |
| Related | RELATED ITEMS | 関連商品 | Cross-links (do not auto-import) |

---

## 5. Product Listing URLs

### English — series listing

```
https://www.duel.co.jp/english/products/list.html?category={category_id}
```

Optional pagination parameter (observed):

```
https://www.duel.co.jp/english/products/list.html?category={category_id}&page={n}
```

**Example (in-scope lures):**

| Series | category_id | URL |
|--------|-------------|-----|
| DUEL SALT WATER LURE | 448 | `…/list.html?category=448` |
| HARDCORE SALT WATER LURE | 445 | `…/list.html?category=445` |
| BIG GAME SERIES | 464 | `…/list.html?category=464` |
| 3DB SERIES | 452 | `…/list.html?category=452` |

Listing cards link to `./detail.html?pid={id}` with thumbnail from `/storage/product/`.

### Japanese — category / facet listing

Primary category filter:

```
https://www.duel.co.jp/products/?category={category_id}
```

**Examples:**

| Facet | category_id | Notes |
|-------|-------------|-------|
| ルアー全て (all lures) | 392 | 41+ products; primary lure crawl entry |
| 新商品 (new products) | (index default) | 265+ hits on main products page |
| スタイル一覧 | 292 | Style-based browse |
| ブランド HARDCORE | (via filters) | Use facet chips on page |

Paginated “load more” / page 2+:

```
https://www.duel.co.jp/products/more.php?category={category_id}&p={page_number}
```

`p=2`, `p=3`, … increment until empty result set or duplicate products.

### Category ID discovery

Category IDs are **opaque numeric identifiers** assigned by the CMS. They are visible only in URL query strings and internal links — there is **no public JSON category tree API** observed.

**Connector must:**

1. Seed from known lure category IDs (maintained in connector config).
2. Periodically diff the English `/english/products/` index for new `category=` links.
3. Store discovered IDs in connector metadata (not in this spec).

---

## 6. Product Detail URL Pattern

Product identity is a **numeric product ID (`pid`)** shared across locales.

| Locale | Pattern | Example |
|--------|---------|---------|
| English | `https://www.duel.co.jp/english/products/detail.html?pid={pid}` | `pid=1332` → L-BLUE BUBBLE JET FLOATING |
| Japanese | `https://www.duel.co.jp/products/detail.php?pid={pid}` | `pid=1616` → イージースリム® 布巻/オーロラ |

**Canonical source URL for provenance:** prefer **Japanese** detail page (richer SKU/JAN tables). Use English for bilingual text when Japanese lacks translation.

**Stable external key:** `duel:pid:{pid}` (maps to future External Identifier Registry).

Query parameters observed: **`pid` only** — no slug-based routing.

---

## 7. Image URL Pattern

Assets are served from `/storage/` on the same host.

| Asset type | Pattern | Example |
|------------|---------|---------|
| Product thumbnail (listing) | `https://www.duel.co.jp/storage/product/{filename}.png` | `…/F1083-item.png` |
| Product hero (detail) | Same path; filename may be timestamp-prefixed | `…/177241864661cZJ8KW9GUHeSqh.png` |
| Category banner | `https://www.duel.co.jp/storage/category/{timestamp}{hash}.png` | Used on series index only |
| English relative paths | `/storage/product/…` | Resolve against `https://www.duel.co.jp` |

**Notes:**

- Format is predominantly **PNG**; SVG not observed on product images.
- Color variants may share one pack-shot; per-color images are not always present.
- Filename stability: timestamp-prefixed names may change on CMS re-upload — **hash content or bind to `pid`**, not filename alone.
- No CDN domain separation; hotlinking from manufacturer URL is acceptable for import evidence; production should **mirror to object storage** per ADR-015.

---

## 8. Category Structure

### English — two-level mental model

1. **Brand pillar** (HARDCORE / DUEL / YO-ZURI) — marketing grouping on `/english/products/`
2. **Series or product class** — links to `list.html?category={id}`

### Japanese — multi-axis faceted model

Products are indexed under **several simultaneous facets**:

| Axis | Examples | Use in connector |
|------|----------|------------------|
| Product class | ルアー, ライン, イカ釣り | Hard filter: ルアー only |
| Brand | HARDCORE, DUEL, YO-ZURI | Map to manufacturer / product line |
| Water type | ソルトウォーター, フレッシュウォーター | Tags / technique hints |
| Style | ミノー, トップウォーター, クランクベイト, メタルジグ | `formFactorTerm` |
| Target species | シーバス, 青物, マダイ, タチウオ | `tags` kind `species` |
| New release | 新発売 | Incremental update feed |

**Hit counts** are displayed on listing pages (e.g. `ヒット件数 : 41件`) — useful for crawl completeness checks.

### LureAtlas mapping hints

| Website signal | CanonicalLureImport field |
|----------------|---------------------------|
| Breadcrumb series name | `productLine.name` |
| H1 model name | `model.name` |
| SPEC size row | `model.size` / `variants[].sizes` |
| SPEC weight row | `model.weight` / `variants[].weights` |
| TYPE (FLOATING/SINKING) | `model.buoyancy` |
| RANGE / 潜行深度 | `model.divingDepth` |
| COLORS / カラー code | `variants[].color.code` |
| CAT.NO. prefix + color | `externalIdentifiers` (`manufacturer_sku`, `upc`/`ean`) |
| JAN code (JP table) | `externalIdentifiers` scheme `ean` |

---

## 9. Pagination

### English listings

| Mechanism | URL pattern | Termination |
|-----------|-------------|-------------|
| Query param | `list.html?category={id}&page={n}` | Empty product grid or no “next” link |

Small categories (e.g. category 448) fit on **one page** (3 products). Large series (YO-ZURI lure families) may span multiple pages — verify per category during implementation.

### Japanese listings

| Mechanism | URL pattern | Termination |
|-----------|-------------|-------------|
| Initial page | `/products/?category={id}` | — |
| Subsequent pages | `/products/more.php?category={id}&p={n}` | HTTP 200 with zero new `pid` links, or repeated product set |

**Page index:** `p` starts at **2** for `more.php` (page 1 is the main `?category=` URL).

### Rate limiting

No public API rate-limit documentation. Treat as **HTML scrape with conservative concurrency** (see §11).

---

## 10. Language Support

| Locale | Code | Coverage | Quality |
|--------|------|----------|---------|
| Japanese | `ja` | Full catalog; all SKU/JAN rows | Canonical |
| English | `en` | Large lure subset; global site | Marketing copy often present; spec tables may be abbreviated |

**URL routing:** locale is path-prefix based (`/english/`), not cookie or `Accept-Language` driven.

**Bilingual mapping for LureAtlas (tr/en launch):**

| Source | Field |
|--------|-------|
| Japanese H1 + body | `*.tr` or primary via `resolveLocalized` |
| English H1 + body | `*.en` |
| Color names (often English codes) | `color.code` + localized `color.name` where available |

Turkish (`tr`) content is **not published by DUEL** — platform translation is a downstream moderation/AI job, not connector responsibility.

**Connector should fetch both locales per `pid`** when building `CanonicalLocalizedText`, with Japanese winning on conflicts for numeric/spec fields.

---

## 11. Possible Parser Strategy

Specification only — proposed **phased** approach aligned with `ManufacturerImportProvider` (parse → validate → map):

### Phase 1 — Static harvest (recommended first implementation)

1. **Discover** `pid` values from English lure category listings (deterministic, smaller surface).
2. **Fetch** Japanese `detail.php?pid=` for authoritative SKU/JAN tables.
3. **Fetch** English `detail.html?pid=` for bilingual marketing text.
4. **Normalize** HTML to structured JSON stored under `research/manufacturers/duel/` (evidence layer — not deployed).
5. **Parse** saved HTML with a DOM parser (Cheerio / linkedom) — **not** live scrape in CI.
6. **Map** to `CanonicalLureImport` with brand-aware manufacturer slug rules.
7. **Validate** required fields: `pid`, model name, at least one size row, at least one color or default SKU.

### Phase 2 — Incremental live connector

1. Poll **新商品** listing and English PRODUCTS index monthly/quarterly.
2. Compare `pid` set to last ingestion batch (when batch table exists).
3. Re-fetch changed `pid` pages only (ETag/Last-Modified if available; otherwise content hash).
4. Queue through `ImportPipeline` / `ImportJobRunner` when implemented.

### Parsing rules (detail page)

| Extract | Selector strategy |
|---------|-------------------|
| `pid` | Query string |
| Breadcrumb path | Nav ol/li or site-specific breadcrumb container |
| Model name | `h1` |
| Description | First summary block after H1 |
| Feature bullets | `FEATURE` section headings + paragraphs |
| Spec rows | `table` under SPEC / スペック情報 — parse `<tr>` cells |
| Colors | `COLORS` section `h3`/`h4` headings; JP color matrix tables |
| SKU / JAN | JP tables: columns 注文番号, カラー, JAN/UPCコード |
| Images | `og:image` meta + `/storage/product/` img src in gallery |

### Multi-row SPEC handling

When one `pid` lists multiple sizes (e.g. 90 mm / 120 mm):

- Emit **one `CanonicalLureImport` per size row** with shared marketing copy, **or**
- One model with multiple `variants[]` — prefer **single model + multiple variants** when color matrix is shared; split models when CAT.NO. prefix differs materially (product owner rule).

### Product type filter

Include if breadcrumb or JP category path contains lure signifiers (`ルアー`, `LURE`, `MINNOW`, `CRANK`, `POP`, `METAL`, `BIG GAME`, etc.).

Exclude if path contains `FISHING LINES`, `ライン`, `SQUID JIG`, `エギ`, `ウキ`, `ウェア`.

---

## 12. Possible Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Terms of use / robots** | High | Review `duel.co.jp` terms and `robots.txt` before live crawl; prefer offline harvest + manual approval for Phase 1. |
| **No public API** | Medium | HTML structure changes break parsers; pin golden HTML fixtures in tests when implemented. |
| **CMS markup changes** | Medium | Version parser per observed layout; monitor diff on `/english/products/` index. |
| **Shared `pid` across brands** | Medium | Always read breadcrumb brand; never infer from category id alone. |
| **Yo-Zuri dual registry** | Medium | Align with `yozuri.yaml` — document manufacturer slug assignment rules to avoid duplicate models. |
| **Image filename rotation** | Low | Store images by `pid` + color code; verify hash on update. |
| **Incomplete English catalog** | Low | Never rely on English-only crawl; Japanese is superset for SKUs. |
| **Trademark / registered names** | Low | Preserve `®`, `™` in aliases; normalize for search separately. |
| **Open pricing (オープン価格)** | Low | Price not required for LureAtlas Phase 1; ignore or store as metadata only. |
| **Rate limiting / IP block** | Medium | Throttle requests; use If-Modified-Since; run from worker, not serverless burst. |
| **Imitation product notices** | Info | DUEL publishes warnings on counterfeit products — do not ingest third-party retailer data as manufacturer truth. |

---

## 13. Update Strategy

| Aspect | Recommendation |
|--------|----------------|
| **Frequency** | Quarterly full reconcile; monthly `新商品` / new-release diff (aligns with `manufacturer-registry` pattern `update_frequency: quarterly`). |
| **Discovery** | Diff `pid` sets from JP lure category 392 + EN lure category listings; flag unknown `pid`. |
| **Change detection** | Hash of SPEC + color tables; title/description changes logged as minor vs major. |
| **Lifecycle** | Imported models default `DRAFT` until moderator publish (existing Prisma behavior). |
| **Deprecation** | If `pid` returns 404, mark model `DEPRECATED` — do not hard-delete (soft-delete pattern). |
| **Evidence retention** | Keep raw HTML snapshot + fetch timestamp under `research/manufacturers/duel/raw/{pid}/` for provenance (G4). |
| **Ingestion batch** | When platform kernel lands (007 §15.1), each run records: connector version, category seeds, pid count, created/updated/skipped. |
| **Priority categories** | 1) BIG GAME / saltwater trolling 2) DUEL SALT WATER LURE 3) HARDCORE SONICBOOM / salt lures 4) YO-ZURI minnow families — matches Balık Oltamda trolling focus. |
| **Trust score** | Proposed `trust_score: 82` (manufacturer primary source, structured specs, JAN codes on JP pages) — subject to product owner approval when registry entry is added. |

---

## 14. Related Documents

| Document | Role |
|----------|------|
| `docs/PROJECT_STATE.md` | Sprint progress |
| `manufacturer-registry/yozuri.yaml` | Sister brand registry entry |
| `ui/src/modules/import/core/canonical-lure.ts` | Import target DTO |
| `ui/src/modules/import/core/import-provider.ts` | Provider contract |
| `docs/domain/LURE_DOMAIN_MODEL.md` | Domain mapping |
| `docs/007_DATABASE_VISION.md` | Provenance and external identifiers |

---

## 15. Open Questions (for product owner)

1. Should **YO-ZURI** products on `duel.co.jp` be ingested by this connector or deferred to a separate Yo-Zuri connector?
2. Are **squid jigs (エギ)** in scope for LureAtlas Phase 1 or Phase 2?
3. Confirm **manufacturer slug** for HARDCORE-branded lures: `duel` vs `hardcore` as separate manufacturer records?
4. Approve **Phase 1 offline harvest** before any automated live crawling.

---

*This is a specification document only. No connector code, registry YAML, or import jobs are created by this sprint.*
