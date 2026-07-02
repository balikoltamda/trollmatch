# DUEL Import Report

**Started:** 2026-07-02T10:29:15.787Z
**Completed:** 2026-07-02T10:30:14.197Z

## Summary

```
Imported: 20
Updated: 0
Skipped: 0
Failed: 7
```

| Metric | Count |
|--------|------:|
| Imported | 20 |
| Updated | 0 |
| Skipped | 0 |
| Failed | 7 |
| Discovered PIDs | 60 |
| Processed | 27 |
| Dry run | yes (validation only) |

## Execution

This run validated products only (no database client). Run `npm run import:duel:run` with Postgres up to persist.

## Products

| PID | Model | Status | Notes |
|-----|-------|--------|-------|
| 1669 | salty-bait-wave-60-80-100g | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1152 | salty-rubber-slide-60-80-100g | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present |
| 1332 | l-blue-bubble-jet-floating | imported | Validated (dry run — no database client) |
| 1202 | hardcore-bullet-bull-floating | imported | Validated (dry run — no database client) |
| 1463 | hardcore-bullet-fast-sinking | imported | Validated (dry run — no database client) |
| 1328 | hardcore-bullet-dive-floating | imported | Validated (dry run — no database client) |
| 1186 | hardcore-monster-shot-sinking | imported | Validated (dry run — no database client) |
| 1377 | hardcore-waterdrive-sinking | imported | Validated (dry run — no database client) |
| 1182 | hardcore-shallow-runner-floating | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1189 | hardcore-mid-diver-floating | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1196 | hardcore-heavy-minnow-sinking | imported | Validated (dry run — no database client) |
| 1195 | hardcore-heavy-shot-sinking | imported | Validated (dry run — no database client) |
| 1180 | hardcore-solid-vibe-sinking | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1181 | hardcore-solid-spin-sinking | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented |
| 1108 | high-speed-vibe-sinking | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1242 | bull-pop-floating | imported | Validated (dry run — no database client); warnings: CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1093 | surface-cruiser-floating | imported | Validated (dry run — no database client); warnings: CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1243 | bonita-sinking | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1097 | split-shot-set | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_COLORS: One or more variants lack manufacturer color codes, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1282 | hp-split-shot | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_COLORS: One or more variants lack manufacturer color codes, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1320 | diving-board-k-type | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_COLORS: One or more variants lack manufacturer color codes, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1230 | diving-board-k-type-w-thread | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_COLORS: One or more variants lack manufacturer color codes, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1098 | splashing-float-hokuriku-type-left-right | failed | Validation failed; warnings: CANONICAL_DIVING_DEPTH: Diving depth is not specified, CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_COLORS: One or more variants lack manufacturer color codes, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1348 | 3db-twitchbait-slow-sinking | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1133 | 3db-jerkbait-90-suspending | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1135 | 3db-jerkbait-110-suspending | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |
| 1134 | 3db-jerkbait-110-deep-suspending | imported | Validated (dry run — no database client); warnings: CANONICAL_TECHNIQUE: No technique tags are present, CANONICAL_UV: UV-reactive finish is not documented, CANONICAL_GLOW: Glow or luminous finish is not documented |

## Failures

### PID 1669

Validation failed

Validation errors:
- CANONICAL_BUOYANCY: Buoyancy is required on the model or on every variant
- CANONICAL_LENGTH: Variant "aori-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "g-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "gr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "o-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "r-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "s-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "aori-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "g-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "gr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "o-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "r-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "s-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "aori-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "g-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "gr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "o-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "r-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "s-std" is missing length (lengthMm, lengthCm, or lengthIn)

### PID 1152

Validation failed

Validation errors:
- CANONICAL_BUOYANCY: Buoyancy is required on the model or on every variant
- CANONICAL_LENGTH: Variant "ogr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgm-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgo-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whbs-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whkv-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "ogr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgm-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgo-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whbs-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whkv-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "ogr-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgm-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "shgo-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whbs-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "whkv-std" is missing length (lengthMm, lengthCm, or lengthIn)

### PID 1097

Validation failed

Validation errors:
- CANONICAL_BUOYANCY: Buoyancy is required on the model or on every variant
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-std" is missing weight (weightG or weightOz)

### PID 1282

Validation failed

Validation errors:
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_LENGTH: Variant "default-std" is missing length (lengthMm, lengthCm, or lengthIn)

### PID 1320

Validation failed

Validation errors:
- CANONICAL_BUOYANCY: Buoyancy is required on the model or on every variant
- CANONICAL_LENGTH: Variant "default-6-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-6-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-7-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-7-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-8-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-8-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-9-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-9-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-10-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-10-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-11-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-11-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-12-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-12-0" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-13-0" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-13-0" is missing weight (weightG or weightOz)

### PID 1230

Validation failed

Validation errors:
- CANONICAL_BUOYANCY: Buoyancy is required on the model or on every variant
- CANONICAL_LENGTH: Variant "default-6" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-6" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-7" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-7" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-8" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-8" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-9" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-9" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-10" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-10" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-11" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-11" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-12" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-12" is missing weight (weightG or weightOz)
- CANONICAL_LENGTH: Variant "default-13" is missing length (lengthMm, lengthCm, or lengthIn)
- CANONICAL_WEIGHT: Variant "default-13" is missing weight (weightG or weightOz)

### PID 1098

Validation failed

Validation errors:
- CANONICAL_WEIGHT: Variant "default-240" is missing weight (weightG or weightOz)
- CANONICAL_WEIGHT: Variant "default-240" is missing weight (weightG or weightOz)


## Policy

- UPSERT only — no catalog rows deleted
- Manufacturer lifecycle: `ACTIVE`, `lastSeenAt`, `lastImportedAt` updated on success
- Validation errors are non-blocking for the batch; failed products are skipped
