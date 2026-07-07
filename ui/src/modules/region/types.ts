export type RegionRecord = {
  id: string;
  slug: string;
  code: string;
  nameEn: string;
  nameTr: string;
  descriptionEn: string | null;
  descriptionTr: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RegionListItem = Pick<
  RegionRecord,
  | "id"
  | "slug"
  | "code"
  | "nameEn"
  | "nameTr"
  | "displayOrder"
  | "isActive"
>;

export type RegionEditForm = {
  nameEn: string;
  nameTr: string;
  descriptionEn: string;
  descriptionTr: string;
  displayOrder: number;
  isActive: boolean;
};

export type SaveRegionInput = RegionEditForm;

export type RegionSearchParams = {
  q?: string;
  includeInactive?: boolean;
};
