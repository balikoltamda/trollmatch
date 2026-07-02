# DUEL Fetcher Report — HTML Snapshot Inspection

**Document:** DUEL_FETCHER_REPORT  
**Project (internal):** TrollMatch  
**Sprint:** S012  
**Date:** 2026-07-02  
**Snapshots inspected:** `research/manufacturers/duel/snapshots/2026-07-02T08-50-11-630Z/`  
**Authority:** Informs S013+ DUEL HTML parser design  
**Status:** Inspection only — no code changes

---

## 1. Snapshot inventory

| File | Source URL | Bytes | Role |
|------|------------|-------|------|
| `product-en.html` | `https://www.duel.co.jp/english/products/detail.html?pid=1332` | ~42 KB | Product detail — L-BLUE BUBBLE JET FLOATING |
| `category-en.html` | `https://www.duel.co.jp/english/products/list.html?category=448` | ~11 KB | Category listing — DUEL SALT WATER LURE (3 products) |

Both pages are **English global site** (`.html`, `/english/`). No Japanese (`detail.php`) snapshot exists in this run.

---

## 2. Field verification — product page (`product-en.html`)

Product under inspection: **L-BLUE BUBBLE JET FLOATING** (`pid=1332`).

| Field | Status | Evidence |
|-------|--------|----------|
| **Product title** | **FOUND** | `<title>`, `h2.l-hero_ttl`, `og:title`, `twitter:title` — all `L-BLUE BUBBLE JET FLOATING` |
| **Product code** | **PARTIAL** | SPEC table column `CAT.NO.` with prefixes `F1228-`, `F1229-` (incomplete — trailing dash, no color suffix). No separate “model code” field outside SPEC. |
| **Brand** | **PARTIAL** | Breadcrumb lists series **DUEL SALT WATER LURE**; top-level brand pillar (**DUEL PRODUCT** vs HARDCORE vs YO-ZURI) not present as a dedicated field. Site logo/footer imply corporate **DUEL**. |
| **Images** | **FOUND** | Hero gallery: `/storage/product/ajax-upload1703740031wtDL4gqU01VyRWz5.jpg`. COLORS section: 8 per-color PNGs under `/storage/product/ajax-upload…`. FEATURE section: 4 additional product/diagram JPGs. |
| **Sizes** | **FOUND** | SPEC rows: `90mm`, `120mm` in `table.p-spec-table` |
| **Colors** | **FOUND** | COLORS grid: 8 entries with code (`span._c`: HGR, HIW, HKVK, HLCL, HPI, HRH, HRI, TM), name (`span._t`), optional tags (`UV Glow`, `Luminous`), marketing blurb, thumbnail URL each |
| **JAN / SKU** | **NOT FOUND** | No JAN, UPC, EAN, or SKU column on English snapshot. `CAT.NO.` is manufacturer catalog prefix only, not barcode. |
| **Specifications** | **FOUND** | `#spec` section, `table.p-spec-table.spec` with columns: CAT.NO., TYPE, SIZE, WEIGHT, RING, HOOK, CASTING RANGE, RANGE. Two size rows (90 mm / 23.5 g floating; 120 mm / 45 g floating). |
| **Categories** | **PARTIAL** | Breadcrumb path only: `home → PRODUCTS → DUEL SALT WATER LURE → {product}`. No machine-readable category ID in body (448 only in referrer URL, not in saved HTML). |
| **Related products** | **NOT FOUND** | No `RELATED ITEMS` section on this page (other DUEL products may include it — not present for `pid=1332`). |
| **Breadcrumb** | **FOUND** | `ol.p-breadcrumns_list` with linked segments and `li.current` for product name |
| **Structured data (JSON-LD / Microdata)** | **NOT FOUND** | No `<script type="application/ld+json">`, no `itemscope` / `itemtype` attributes. Open Graph and Twitter Card meta tags only (**not** schema.org product markup). |

### Product page — supplementary content (not in checklist)

| Content | Status | Location |
|---------|--------|----------|
| Marketing summary | FOUND | `h3.p-product_ttl`, `ul.p-check-list` |
| Feature blocks | FOUND | `#feature` — `figure.p-product-feature`, `h2._ttl`, `p._text`, optional `._patent` |
| Product ID (`pid`) | PARTIAL | Not in HTML body; only recoverable from fetch URL (`pid=1332`) |
| Canonical / OG URL | PARTIAL | `<link rel="canonical" href="./">` — relative placeholder, not absolute product URL |

---

## 3. Field verification — category page (`category-en.html`)

Category under inspection: **DUEL SALT WATER LURE** (`category=448`).

| Field | Status | Evidence |
|-------|--------|----------|
| **Product title** (per card) | **FOUND** | `p.p-product-list_text` — e.g. `L-BLUE BUBBLE JET FLOATING` |
| **Product code** | **NOT FOUND** | Listing cards expose name only, no CAT.NO. |
| **Brand** | **PARTIAL** | `l-hero_text`: `DUEL SALT WATER LURE`; breadcrumb ends at category. Brand pillar not explicit. |
| **Images** | **FOUND** | Card thumbnails: `/storage/product/{filename}.png` |
| **Sizes** | **NOT FOUND** | Not on listing cards (detail-only) |
| **Colors** | **NOT FOUND** | Not on listing cards |
| **JAN / SKU** | **NOT FOUND** | Not on listing |
| **Specifications** | **NOT FOUND** | Not on listing |
| **Categories** | **FOUND** | Page title, hero, breadcrumb identify **DUEL SALT WATER LURE**; `category=448` only in fetch URL |
| **Related products** | **N/A** | Listing page — peer products listed as siblings |
| **Breadcrumb** | **FOUND** | `home → PRODUCTS → DUEL SALT WATER LURE` (current) |
| **Structured data (JSON-LD / Microdata)** | **NOT FOUND** | Same as product page — OG/Twitter only |

### Category page — discovery metadata

| Item | Status | Evidence |
|------|--------|----------|
| Product links | FOUND | `a.p-product-list_link[href="./detail.html?pid={id}"]` — pids: 1669, 1152, 1332 |
| Pagination | NOT FOUND | Single page; 3 products; no next-page link in snapshot |
| Search form | FOUND | `form[method=post][action=list.html]` with `mode=search` — not useful for static parse without POST |
| Category ID in HTML | NOT FOUND | Must be taken from fetch URL query string |

---

## 4. DOM patterns useful for parsing

Stable CSS hooks observed in both snapshots:

| Purpose | Selector |
|---------|----------|
| Breadcrumb | `.p-breadcrumns_list .p-breadcrumns_item`, `.p-breadcrumns_link`, `.current` |
| Product title | `.l-hero_ttl` |
| Hero image | `.p-slick-slide img`, `.p-slick-thumb img` |
| Summary | `.p-product_ttl`, `.p-check-list li` |
| Features | `#feature .p-product-feature ._ttl`, `._text`, `._patent` |
| Colors | `.p-product-list_colors_ttl span._c`, `span._t`, `.p-product-list_tag`, `.p-thumbnail.-colors img` |
| Spec table | `#spec table.p-spec-table`, `thead th`, `tbody tr td` |
| Category cards | `a.p-product-list_link`, `.p-thumbnail img`, `.p-product-list_text` |

**HTML quality notes:**

- Invalid nesting in places (e.g. `<p>` wrapping `<ul>`, `<h3>` wrapping `<p>`) — parser should use tolerant DOM library.
- Multiple `tbody` elements under one `table` (one row each) — iterate all `tbody tr`, not first tbody only.
- Image paths are root-relative (`/storage/product/…`) — resolve against `https://www.duel.co.jp`.
- Color codes and CAT.NO. prefixes are separate dimensions — cross join needed to build full SKU (not in EN HTML).

---

## 5. Parsing risks

| Risk | Severity | Detail |
|------|----------|--------|
| **English-only snapshots missing JAN/UPC** | High | Connector spec states JP `detail.php` has 注文番号 + JAN/UPC tables. EN `pid=1332` has no barcode data. Import identity incomplete without JP fetch. |
| **JP `detail.php?pid=1332` returns 404** | High | Same `pid` not valid on Japanese site for this product — locale-specific pid mapping may be required. |
| **No JSON-LD / Microdata** | Medium | Cannot use structured-data shortcuts; must parse presentational HTML. |
| **Incomplete CAT.NO.** | Medium | Values `F1228-` / `F1229-` lack color suffix present on JP pages — variant SKU assembly differs by locale. |
| **Markup fragility** | Medium | CMS-generated invalid HTML; class names are semantic enough but not guaranteed stable across redesigns. |
| **`pid` not in page body** | Medium | Must persist fetch URL or sidecar metadata alongside snapshot (fetcher already records URL in JSON output). |
| **Relative canonical / OG URLs** | Low | `./` canonical and generic OG image — poor SEO signals; do not use for identity. |
| **Empty `alt` on images** | Low | All product `img alt=""` — accessibility gap; use color name from adjacent heading. |
| **JS-enhanced gallery** | Low | Slick carousel present but hero HTML is server-rendered in snapshot — no JS execution required for parse. |
| **Category pagination absent** | Low | Small category fits one page; larger categories need `page=` or JP `more.php` handling (not in this snapshot set). |
| **Related products optional** | Low | Section appears on some products only — parser must not require it. |
| **Search via POST** | Low | Keyword search not suitable for crawler; use category listing links instead. |

---

## 6. Recommended parsing strategy

### Phase A — Snapshot metadata (no HTML parse)

1. Read fetch manifest from `fetchDuelSnapshots` result or filename convention (`product-en.html`, `category-en.html`).
2. Extract **`pid`** and **`category`** from recorded source URLs.
3. Store snapshot path, fetch timestamp, locale, HTTP status as provenance envelope.

### Phase B — DOM parse with Cheerio (or linkedom)

**Category page first** (discovery):

1. Parse `a.p-product-list_link[href*="detail.html?pid="]`.
2. Emit `{ pid, listingTitle, thumbnailUrl, categoryLabel }` per card.
3. Resolve thumbnail to absolute URL.

**Product page second** (detail):

1. **Breadcrumb** → `productLine` candidate (last linked segment before current).
2. **`h2.l-hero_ttl`** → model name.
3. **`.p-product_ttl` + `.p-check-list`** → short description + bullet features.
4. **`#feature`** → marketing feature blocks (optional tags).
5. **`#spec table.p-spec-table`** → size/weight rows (one object per `tbody tr`).
6. **`#spec` COLORS or COLORS section** → iterate color grid:
   - `code` ← `span._c`
   - `name` ← `span._t`
   - `imageUrl` ← `.p-thumbnail.-colors img[src]`
   - `tags` ← `.p-product-list_tag li`
7. **Hero images** ← `.p-slick-slide img` (model-level, not per-color).
8. Cross-product: attach colors to nearest size row by business rule (EN page does not link color ↔ CAT.NO. — **requires JP snapshot or heuristic**).

### Phase C — Dual-locale merge (required before import)

| Step | Action |
|------|--------|
| 1 | Fetch **JP `detail.php?pid=`** for each discovered pid (validate 200 — do not assume EN/JP pid parity). |
| 2 | Parse JP **スペック情報** tables for 注文番号, カラー, カラー番号, **JAN/UPCコード**. |
| 3 | Merge JP identifiers + EN marketing copy into intermediate JSON (not `CanonicalLureImport` yet). |
| 4 | Map breadcrumb brand segment to manufacturer slug (`duel` vs `yo-zuri` vs `hardcore` line grouping). |

### Phase D — Output artifact

Write parsed evidence to:

```
research/manufacturers/duel/parsed/{pid}.json
```

Do **not** wire to `ManufacturerImportProvider` until product owner confirms Yo-Zuri / HARDCORE manufacturer slug rules (per `DUEL_CONNECTOR.md` §2).

### Parser technology choice

| Option | Recommendation |
|--------|----------------|
| **Cheerio** in Node (matches `ui/` stack) | **Preferred** — tolerant HTML, CSS selectors, works offline on snapshots |
| Regex-only | **Avoid** — invalid nesting and multiple tbody break naive regex |
| Headless browser | **Not needed** for these snapshots — content is SSR |
| JSON-LD extraction | **Skip** — not present |

### Test approach

1. Golden-file tests against `product-en.html` and `category-en.html` in repo.
2. Assert: 3 category pids, 2 spec rows, 8 colors, breadcrumb depth 4.
3. Add JP fixture when fetcher extended (separate sprint).

---

## 7. Gap summary vs LureAtlas `CanonicalLureImport`

| Canonical field | EN snapshot alone | After JP merge (expected) |
|-----------------|-------------------|----------------------------|
| `model.name` | ✅ | ✅ |
| `model.description` | ✅ | ✅ |
| `productLine` | ⚠️ breadcrumb only | ✅ |
| `variants[].color.code` | ✅ | ✅ |
| `variants[].sizes/weights` | ✅ (model-level rows) | ✅ |
| `externalIdentifiers` (JAN/EAN) | ❌ | ✅ (JP table) |
| `manufacturer` slug | ⚠️ inferred | ⚠️ needs brand rule |
| `tags` (species/technique) | ❌ | ❌ (not on page — manual/taxonomy later) |

---

## 8. Conclusions

1. **Fetcher output is parse-ready** — SSR HTML contains title, images, colors, and spec tables with stable class names.
2. **English snapshots alone are insufficient** for canonical identity (no JAN/UPC; incomplete CAT.NO.; no guaranteed pid parity with Japanese site).
3. **No structured data** — parser must be HTML/DOM-based.
4. **Category snapshot is valid for pid discovery** — three products with thumbnails and detail links; pagination not exercised.
5. **Next sprint** should implement offline Cheerio parser + extend fetcher to save matching JP `detail.php` pages where HTTP 200.

---

## 9. Related documents

| Document | Role |
|----------|------|
| `docs/connectors/DUEL_CONNECTOR.md` | Connector specification |
| `ui/src/modules/import/providers/duel/duel-fetcher.ts` | Snapshot fetcher |
| `research/manufacturers/duel/snapshots/2026-07-02T08-50-11-630Z/` | Inspected HTML |

---

*Inspection report only. No code, registry, or PROJECT_STATE changes in this sprint deliverable.*
