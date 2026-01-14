export interface FontConfig {
  family: string;
  weights?: number[];
  styles?: ("normal" | "italic")[];
  display?: "auto" | "block" | "swap" | "fallback" | "optional";
}

const POPULAR_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Merriweather",
  "Source Sans Pro",
  "Ubuntu",
  "Oswald",
  "Rubik",
  "Work Sans",
];

export function buildGoogleFontsURL(fonts: FontConfig[]): string {
  if (fonts.length === 0) return "";

  const families = fonts.map((font) => {
    const weights = font.weights || [400, 500, 600, 700];
    const styles = font.styles || ["normal"];

    // Build axis string for variable fonts
    const axes: string[] = [];

    if (styles.includes("italic")) {
      axes.push(`ital,wght@${weights.map((w) => `0,${w};1,${w}`).join(";")}`);
    } else {
      axes.push(`wght@${weights.join(";")}`);
    }

    return `family=${encodeURIComponent(font.family)}:${axes.join("&")}`;
  });

  const display = fonts[0]?.display || "swap";

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=${display}`;
}

export function getPopularFonts(): string[] {
  return POPULAR_FONTS;
}

export function getFontFamilyCSS(fontName: string, fallback = "sans-serif"): string {
  return `"${fontName}", ${fallback}`;
}

// Preload critical fonts
export function generateFontPreloadLinks(fonts: FontConfig[]): string {
  if (fonts.length === 0) return "";

  return `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${buildGoogleFontsURL(fonts)}" rel="stylesheet">
  `.trim();
}
