import data from "./tokens.json";

export const designTokens = data;

export type RestaurantThemeId = keyof typeof designTokens.themes;
export type SemanticStatus =
  "info" | "success" | "warning" | "error" | "neutral";

export const semanticStatusTokens = {
  info: designTokens.semantic.statusInfo,
  success: designTokens.semantic.statusSuccess,
  warning: designTokens.semantic.statusWarning,
  error: designTokens.semantic.statusError,
  neutral: designTokens.semantic.statusNeutral,
} as const;

export function isRestaurantThemeId(value: string): value is RestaurantThemeId {
  return Object.hasOwn(designTokens.themes, value);
}
