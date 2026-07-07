-- Sprint 7.6B — Region system foundation (fishing knowledge geography, not GIS)

CREATE TABLE "regions" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(128) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name_en" VARCHAR(256) NOT NULL,
    "name_tr" VARCHAR(256) NOT NULL,
    "description_en" TEXT,
    "description_tr" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "regions_slug_key" ON "regions"("slug");
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");
CREATE INDEX "regions_is_active_display_order_idx" ON "regions"("is_active", "display_order");

INSERT INTO "regions" (
    "id", "slug", "code", "name_en", "name_tr",
    "description_en", "description_tr", "display_order", "is_active", "created_at", "updated_at"
) VALUES
(
    'f1000001-0000-4000-8000-000000000001',
    'black-sea',
    'BLACK_SEA',
    'Black Sea',
    'Karadeniz',
    'Turkish and northern Anatolian Black Sea coast — pelagics, bonito runs, and shore fishing.',
    'Türkiye ve kuzey Anadolu Karadeniz kıyıları — palamut avları, kıyı ve tekne balıkçılığı.',
    1,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'f1000002-0000-4000-8000-000000000002',
    'sea-of-marmara',
    'SEA_OF_MARMARA',
    'Sea of Marmara',
    'Marmara Denizi',
    'Istanbul Strait, Marmara, and Dardanelles approaches — mixed salinity and strong tidal fishing.',
    'İstanbul Boğazı, Marmara ve Çanakkale geçişleri — karışık tuzluluk ve gelgitli av alanları.',
    2,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'f1000003-0000-4000-8000-000000000003',
    'aegean-sea',
    'AEGEAN_SEA',
    'Aegean Sea',
    'Ege Denizi',
    'Western and southern Turkish Aegean — islands, reefs, and seasonal pelagic runs.',
    'Türkiye''nin batı ve güney Ege kıyıları — adalar, kayalıklar ve mevsimlik palagik avlar.',
    3,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'f1000004-0000-4000-8000-000000000004',
    'turkish-mediterranean-coast',
    'TR_MEDITERRANEAN',
    'Turkish Mediterranean Coast',
    'Türkiye Akdeniz kıyıları',
    'Antalya to Hatay Mediterranean coast — offshore trolling, reef species, and winter leerfish.',
    'Antalya''dan Hatay''a Akdeniz kıyıları — açık deniz trolling, kaya balıkçılığı ve kış sarıkanat avları.',
    4,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'f1000005-0000-4000-8000-000000000005',
    'northern-cyprus-waters',
    'NORTHERN_CYPRUS',
    'Northern Cyprus Waters',
    'Kuzey Kıbrıs suları',
    'Northern Cyprus coast and offshore — seasonal pelagics and shore fishing around the island.',
    'Kuzey Kıbrıs kıyı ve açık deniz avları — adanın çevresinde mevsimlik palagik ve kıyı balıkçılığı.',
    5,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
