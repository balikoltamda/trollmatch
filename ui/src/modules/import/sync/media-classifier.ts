import { ImageRole } from "@/generated/prisma/client";

/** Map canonical/manufacturer image role to persisted ImageRole enum. */
export function classifyMediaRole(role?: string): ImageRole {
  switch (role?.toLowerCase()) {
    case "hero":
      return ImageRole.HERO;
    case "gallery":
      return ImageRole.GALLERY;
    case "packaging":
    case "package":
      return ImageRole.PACKAGING;
    case "technology":
    case "tech":
      return ImageRole.TECHNOLOGY;
    case "hook":
    case "hook_detail":
      return ImageRole.HOOK_DETAIL;
    case "split_ring":
    case "split_ring_detail":
      return ImageRole.SPLIT_RING_DETAIL;
    case "color_card":
    case "colorcard":
      return ImageRole.COLOR_CARD;
    case "action_diagram":
    case "action":
      return ImageRole.ACTION_DIAGRAM;
    case "rigging_diagram":
      return ImageRole.RIGGING_DIAGRAM;
    case "technical_diagram":
      return ImageRole.TECHNICAL_DIAGRAM;
    case "product":
      return ImageRole.PRODUCT;
    default:
      return ImageRole.UNKNOWN;
  }
}

/** Parse sync diff field key suffix for image role hint. */
export function imageRoleFromDiffLabel(fieldLabel: string): ImageRole {
  const lower = fieldLabel.toLowerCase();
  if (lower.includes("hero")) return ImageRole.HERO;
  if (lower.includes("packaging") || lower.includes("package")) {
    return ImageRole.PACKAGING;
  }
  if (lower.includes("technology") || lower.includes("tech")) {
    return ImageRole.TECHNOLOGY;
  }
  if (lower.includes("hook")) return ImageRole.HOOK_DETAIL;
  if (lower.includes("split ring")) return ImageRole.SPLIT_RING_DETAIL;
  if (lower.includes("color")) return ImageRole.COLOR_CARD;
  if (lower.includes("action")) return ImageRole.ACTION_DIAGRAM;
  if (lower.includes("gallery")) return ImageRole.GALLERY;
  return ImageRole.PRODUCT;
}
