export function relativeLuminance(hexColor: string): number {
  const normalized = hexColor.trim();
  if (!/^#[\da-f]{6}$/i.test(normalized)) {
    throw new TypeError("Expected a six-digit sRGB hex color.");
  }

  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

export function contrastRatio(foreground: string, background: string): number {
  const luminances = [
    relativeLuminance(foreground),
    relativeLuminance(background),
  ].sort((left, right) => right - left);

  return (luminances[0]! + 0.05) / (luminances[1]! + 0.05);
}

export function meetsNormalTextContrast(
  foreground: string,
  background: string,
): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}
