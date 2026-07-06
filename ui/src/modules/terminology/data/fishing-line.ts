import type { LexiconTerm } from "@/modules/terminology/types";

export const FISHING_LINE_TERM: LexiconTerm = {
  id: "fishing-line",
  domain: "line",
  preferred: {
    en: "Fishing Line",
    tr: "Misina",
  },
  aliases: [
    { label: "line", locale: "en", kind: "search_term" },
    { label: "main line", locale: "en", kind: "synonym" },
    { label: "misina", locale: "tr", kind: "search_term" },
    { label: "ana misina", locale: "tr", kind: "synonym" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: [],
  internationalTerms: ["fishing line", "anglers line"],
  notes: {
    en: "General category for cordage used in sport fishing — main line, running line, and line systems. Subtypes (monofilament, fluorocarbon, braided, hybrid) are separate lexicon entries under this parent.",
    tr: "Sportif balıkçılıkta kullanılan iplik/misina için genel kategori — ana misina ve misina sistemleri. Alt türler (monofilament, florokarbon, örgü, hibrit) bu üst terimin altında ayrı lexicon girdileridir.",
  },
};

export const MONOFILAMENT_LINE_TERM: LexiconTerm = {
  id: "monofilament-line",
  domain: "line",
  parentId: "fishing-line",
  preferred: {
    en: "Monofilament Line",
    tr: "Monofilament Misina",
  },
  aliases: [
    { label: "mono", locale: "en", kind: "search_term" },
    { label: "nylon line", locale: "en", kind: "synonym" },
    { label: "mono misina", locale: "tr", kind: "search_term" },
    { label: "naylon misina", locale: "tr", kind: "synonym" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: ["polyamide monofilament"],
  internationalTerms: ["monofilament", "mono"],
  notes: {
    en: "Single-strand nylon or copolymer line. Common for main line and leader material.",
    tr: "Tek iplik naylon veya kopolimer misina. Ana misina ve fore malzemesi olarak yaygın.",
  },
};

export const FLUOROCARBON_LINE_TERM: LexiconTerm = {
  id: "fluorocarbon-line",
  domain: "line",
  parentId: "fishing-line",
  preferred: {
    en: "Fluorocarbon Line",
    tr: "Florokarbon Misina",
  },
  aliases: [
    { label: "fluoro", locale: "en", kind: "search_term" },
    { label: "FC line", locale: "en", kind: "search_term" },
    { label: "floro", locale: "tr", kind: "search_term" },
    { label: "FC misina", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: ["polyvinylidene fluoride"],
  internationalTerms: ["fluorocarbon", "FC"],
  notes: {
    en: "Low-visibility, abrasion-resistant line. Often used as leader material or as main line in clear water.",
    tr: "Düşük görünürlük, aşınmaya dayanıklı misina. Sıklıkla fore malzemesi veya berrak sularda ana misina olarak kullanılır.",
  },
};

export const BRAIDED_LINE_TERM: LexiconTerm = {
  id: "braided-line",
  domain: "line",
  parentId: "fishing-line",
  preferred: {
    en: "Braided Line",
    tr: "Örgü Misina",
  },
  aliases: [
    { label: "braid", locale: "en", kind: "search_term" },
    { label: "PE line", locale: "en", kind: "international" },
    { label: "örgü", locale: "tr", kind: "search_term" },
    { label: "PE misina", locale: "tr", kind: "international" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: ["polyethylene braided multifilament"],
  internationalTerms: ["braided line", "PE braid", "superline"],
  notes: {
    en: "Multifilament braided main line with high strength-to-diameter ratio. Typically paired with a mono or fluoro leader.",
    tr: "Yüksek mukavemet/çap oranına sahip çok iplikli örgü ana misina. Genelde mono veya floro fore ile eşleştirilir.",
  },
};

export const HYBRID_LINE_TERM: LexiconTerm = {
  id: "hybrid-line",
  domain: "line",
  parentId: "fishing-line",
  preferred: {
    en: "Hybrid Line",
    tr: "Hibrit Misina",
  },
  aliases: [
    { label: "fused line", locale: "en", kind: "synonym" },
    { label: "co-extruded line", locale: "en", kind: "international" },
    { label: "hibrit", locale: "tr", kind: "search_term" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: [],
  internationalTerms: ["hybrid line"],
  notes: {
    en: "Line construction combining properties of multiple materials (e.g. braid core with polymer coating).",
    tr: "Birden fazla malzemenin özelliklerini birleştiren misina yapısı (ör. örgü göbek + polimer kaplama).",
  },
};

export const WIRE_LEADER_TERM: LexiconTerm = {
  id: "wire-leader",
  domain: "leader",
  parentId: "fishing-line",
  preferred: {
    en: "Wire Leader",
    tr: "Tel Fore",
  },
  aliases: [
    { label: "wire trace", locale: "en", kind: "international" },
    { label: "titanium leader", locale: "en", kind: "synonym" },
    { label: "çelik fore", locale: "tr", kind: "search_term" },
    { label: "titan fore", locale: "tr", kind: "synonym" },
  ],
  deprecatedTerms: [],
  regionalTerms: [],
  scientificTerms: [],
  internationalTerms: ["wire leader", "wire trace"],
  notes: {
    en: "Metal leader section for toothy species. Distinct from mono/fluoro leader — abrasion against teeth, not knot transition to braid.",
    tr: "Dişli türler için metal fore bölümü. Mono/floro fore'dan farklıdır — örgüye düğüm geçişinden çok diş aşınmasına karşı.",
  },
};

export const FISHING_LINE_FAMILY: LexiconTerm[] = [
  FISHING_LINE_TERM,
  MONOFILAMENT_LINE_TERM,
  FLUOROCARBON_LINE_TERM,
  BRAIDED_LINE_TERM,
  HYBRID_LINE_TERM,
  WIRE_LEADER_TERM,
];
