import type { LexiconTerm } from "@/modules/terminology/types";

/**
 * Leader — full conceptual documentation preserved in notes.
 * Do NOT simplify. See docs/fishing/TERMINOLOGY.md § Leader.
 */
export const LEADER_TERM: LexiconTerm = {
  id: "leader",
  domain: "leader",
  preferred: {
    en: "Leader",
    tr: "Leader",
  },
  aliases: [
    { label: "leader line", locale: "en", kind: "synonym" },
    { label: "shock leader", locale: "en", kind: "synonym", notes: "Context-specific — shock absorption emphasis" },
    { label: "fore", locale: "tr", kind: "search_term" },
    { label: "ön misina", locale: "tr", kind: "search_term", notes: "Descriptive — not preferred UI label" },
  ],
  deprecatedTerms: [
    {
      label: "Beden",
      locale: "tr",
      reason:
        "Literal translation of English 'leader' as a generic Turkish word. Not angler-natural in Türkiye or Northern Cyprus. 'Beden' does not convey the rigging concept of a short mono/fluoro section tied to braided main line.",
    },
    {
      label: "Lider",
      locale: "tr",
      reason: "Phonetic loan misused as direct translation — not established angler terminology.",
    },
  ],
  regionalTerms: [
    {
      label: "Fore",
      locale: "tr",
      regionScope: "TR",
      notes: "Dominant sport-fishing term in Türkiye tackle shops and forums.",
    },
    {
      label: "Fore",
      locale: "tr",
      regionScope: "CY",
      notes: "Same angler vocabulary in Northern Cyprus sport-fishing context.",
    },
  ],
  scientificTerms: [],
  internationalTerms: ["leader", "leader line", "shock leader", "tippet"],
  notes: {
    en: `Leader is NOT a generic translation problem — it is a specific rigging component.

Leader is a short section of monofilament or fluorocarbon attached to braided line (or, in some setups, attached between main line and terminal tackle).

It provides one or more of:
- abrasion resistance
- reduced visibility
- controlled stretch
- knot transition (between braid and terminal tackle)

The exact benefit depends on leader material.

Monofilament leader:
- more stretch
- better shock absorption

Fluorocarbon leader:
- higher abrasion resistance
- lower visibility

Wire leader is a separate lexicon entry (wire-leader) for toothy species — not a subtype label for mono/fluoro leaders.

Do not collapse Leader into "main line" or "fishing line". Do not translate as "Beden".`,
    tr: `Leader, kelime çevirisi değil — belirli bir takım bileşenidir.

Leader, örgü misinaya (veya bazı kurulumlarda ana misina ile uç takım arasına) bağlanan kısa monofilament veya florokarbon bölümdür.

Şunlardan birini veya birkaçını sağlar:
- aşınma direnci
- düşük görünürlük
- kontrollü esneme
- düğüm geçişi (örgü ile uç takım arasında)

Kazanım leader malzemesine bağlıdır.

Monofilament leader:
- daha fazla esneme
- daha iyi şok emilimi

Florokarbon leader:
- daha yüksek aşınma direnci
- daha düşük görünürlük

Tel leader dişli türler için ayrı lexicon girdisidir (wire-leader) — mono/floro leader alt türü değildir.

Leader'ı "ana misina" veya genel "misina" ile birleştirme. "Beden" olarak çevirme.`,
  },
};

export const MONOFILAMENT_LEADER_TERM: LexiconTerm = {
  id: "monofilament-leader",
  domain: "leader",
  parentId: "leader",
  preferred: {
    en: "Monofilament Leader",
    tr: "Monofilament Leader",
  },
  aliases: [
    { label: "mono leader", locale: "en", kind: "search_term" },
    { label: "mono fore", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: [],
  internationalTerms: ["mono leader"],
  notes: {
    en: "Leader section made from monofilament — prioritizes stretch and shock absorption over fluoro leaders.",
    tr: "Monofilament malzemeden leader — floro leader'a göre esneme ve şok emilimini önceler.",
  },
};

export const FLUOROCARBON_LEADER_TERM: LexiconTerm = {
  id: "fluorocarbon-leader",
  domain: "leader",
  parentId: "leader",
  preferred: {
    en: "Fluorocarbon Leader",
    tr: "Florokarbon Leader",
  },
  aliases: [
    { label: "fluoro leader", locale: "en", kind: "search_term" },
    { label: "FC leader", locale: "en", kind: "search_term" },
    { label: "floro fore", locale: "tr", kind: "search_term" },
    { label: "FC fore", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: [],
  internationalTerms: ["fluorocarbon leader", "FC leader"],
  notes: {
    en: "Leader section made from fluorocarbon — prioritizes abrasion resistance and low visibility.",
    tr: "Florokarbon malzemeden leader — aşınma direnci ve düşük görünürlüğü önceler.",
  },
};

export const LEADER_FAMILY: LexiconTerm[] = [
  LEADER_TERM,
  MONOFILAMENT_LEADER_TERM,
  FLUOROCARBON_LEADER_TERM,
];
