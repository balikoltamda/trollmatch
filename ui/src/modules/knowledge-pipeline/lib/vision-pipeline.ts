/**
 * Vision pipeline interfaces — Sprint 7.4 preparation only.
 * No implementation. Future: fish/lure/colour recognition, catch estimation.
 */

export type VisionConfidenceBand = "low" | "medium" | "high" | "insufficient";

export type SpeciesRecognitionResult = {
  speciesId: string | null;
  scientificName: string | null;
  commonNameEn: string | null;
  commonNameTr: string | null;
  confidence: VisionConfidenceBand;
  modelVersion: string;
};

export type LureRecognitionResult = {
  lureModelId: string | null;
  manufacturerSlug: string | null;
  modelSlug: string | null;
  confidence: VisionConfidenceBand;
  modelVersion: string;
};

export type LureColourRecognitionResult = {
  lureVariantId: string | null;
  colorSlug: string | null;
  labelEn: string | null;
  labelTr: string | null;
  confidence: VisionConfidenceBand;
  modelVersion: string;
};

export type CatchEstimationResult = {
  estimatedCount: number | null;
  estimatedLengthCm: number | null;
  estimatedWeightG: number | null;
  confidence: VisionConfidenceBand;
  modelVersion: string;
};

export type VisionAnalysisInput = {
  imageUrl: string;
  locale: "en" | "tr";
  regionScope?: string;
  countryCode?: string;
};

export type VisionAnalysisOutput = {
  species: SpeciesRecognitionResult | null;
  lure: LureRecognitionResult | null;
  colour: LureColourRecognitionResult | null;
  catch: CatchEstimationResult | null;
  analyzedAt: string;
};

/** Future vision service contract — not implemented in Sprint 7.4. */
export interface VisionPipelineService {
  analyzeImage(input: VisionAnalysisInput): Promise<VisionAnalysisOutput>;
  recognizeSpecies(input: VisionAnalysisInput): Promise<SpeciesRecognitionResult>;
  recognizeLure(input: VisionAnalysisInput): Promise<LureRecognitionResult>;
  recognizeLureColour(input: VisionAnalysisInput): Promise<LureColourRecognitionResult>;
  estimateCatch(input: VisionAnalysisInput): Promise<CatchEstimationResult>;
}

/** Stub thrown until vision agents ship. */
export class VisionPipelineNotImplementedError extends Error {
  constructor() {
    super("Vision pipeline is not implemented — interfaces only (Sprint 7.4)");
    this.name = "VisionPipelineNotImplementedError";
  }
}

export const visionPipelineStub: VisionPipelineService = {
  async analyzeImage() {
    throw new VisionPipelineNotImplementedError();
  },
  async recognizeSpecies() {
    throw new VisionPipelineNotImplementedError();
  },
  async recognizeLure() {
    throw new VisionPipelineNotImplementedError();
  },
  async recognizeLureColour() {
    throw new VisionPipelineNotImplementedError();
  },
  async estimateCatch() {
    throw new VisionPipelineNotImplementedError();
  },
};
