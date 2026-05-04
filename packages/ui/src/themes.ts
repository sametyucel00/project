import { colors } from "./index";

export const themes = {
  light: {
    background: colors.paper,
    surface: "#fffaf4",
    text: colors.ink,
    muted: "#6f6760",
    accent: colors.nar,
    line: "rgba(23, 20, 18, 0.12)"
  },
  dark: {
    background: colors.night,
    surface: "#181d24",
    text: "#fffaf3",
    muted: "rgba(255, 250, 243, 0.68)",
    accent: "#e0634f",
    line: "rgba(255, 250, 243, 0.14)"
  }
};

export type ThemeName = keyof typeof themes;
