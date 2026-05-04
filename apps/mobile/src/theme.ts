import { Appearance } from "react-native";

export type MobileThemeMode = "light" | "dark" | "system";

type ThemePalette = {
  paper: string;
  ink: string;
  muted: string;
  nar: string;
  sea: string;
  sage: string;
  night: string;
  line: string;
  surface: string;
  surfaceSoft: string;
  coloredText: string;
  coloredMuted: string;
  overlay: string;
  shadow: string;
};

const lightTheme: ThemePalette = {
  paper: "#f8f3ec",
  ink: "#171412",
  muted: "#6f6760",
  nar: "#c63f2e",
  sea: "#276b73",
  sage: "#6c7a61",
  night: "#11151b",
  line: "rgba(23, 20, 18, 0.12)",
  surface: "#fffaf4",
  surfaceSoft: "#fffaf3",
  coloredText: "#fffaf3",
  coloredMuted: "rgba(255, 250, 243, 0.82)",
  overlay: "rgba(18, 17, 15, 0.28)",
  shadow: "#171412"
};

const darkTheme: ThemePalette = {
  paper: "#11151b",
  ink: "#f7f1ea",
  muted: "#b6aea5",
  nar: "#e05f4e",
  sea: "#4e96a0",
  sage: "#869474",
  night: "#f8f3ec",
  line: "rgba(247, 241, 234, 0.12)",
  surface: "#181d25",
  surfaceSoft: "#202733",
  coloredText: "#f7f1ea",
  coloredMuted: "rgba(247, 241, 234, 0.84)",
  overlay: "rgba(10, 12, 16, 0.34)",
  shadow: "#000000"
};

let activeTheme: ThemePalette = { ...lightTheme };
let themeVersion = 0;
let activeMode: MobileThemeMode = "system";
const themeListeners = new Set<() => void>();

export const theme: ThemePalette = { ...lightTheme };

export function setMobileThemeMode(mode: MobileThemeMode) {
  activeMode = mode;
  activeTheme = { ...resolveThemePalette(mode) };
  Object.assign(theme, activeTheme);
  applyThemeToDocument(mode, activeTheme);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      applyThemeToDocument(activeMode, activeTheme);
    }, 80);
  }
  themeVersion += 1;
  themeListeners.forEach((listener) => listener());
}

export function getMobileThemeVersion() {
  return themeVersion;
}

export function getMobileThemePalette() {
  return activeTheme;
}

export function getMobileThemeMode() {
  return activeMode;
}

export function subscribeMobileTheme(listener: () => void) {
  themeListeners.add(listener);
  return () => {
    themeListeners.delete(listener);
  };
}

function resolveThemePalette(mode: MobileThemeMode) {
  if (mode === "dark") return darkTheme;
  if (mode === "light") return lightTheme;
  return Appearance.getColorScheme() === "dark" ? darkTheme : lightTheme;
}

export function reapplyMobileTheme() {
  activeTheme = { ...resolveThemePalette(activeMode) };
  Object.assign(theme, activeTheme);
  applyThemeToDocument(activeMode, activeTheme);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      applyThemeToDocument(activeMode, activeTheme);
    }, 80);
  }
}

function resolveSystemScheme() {
  if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return Appearance.getColorScheme() === "dark" ? "dark" : "light";
}

function applyThemeToDocument(mode: MobileThemeMode, palette: ThemePalette) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  const resolvedScheme = mode === "system" ? resolveSystemScheme() : mode;
  root.classList.add(resolvedScheme === "dark" ? "dark" : "light");
  root.setAttribute("data-theme", resolvedScheme);
  root.style.colorScheme = resolvedScheme;

  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (!metaThemeColor) {
    metaThemeColor = document.createElement("meta");
    metaThemeColor.setAttribute("name", "theme-color");
    document.head.appendChild(metaThemeColor);
  }
  metaThemeColor.setAttribute("content", palette.paper);

  let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatusBar) {
    appleStatusBar = document.createElement("meta");
    appleStatusBar.setAttribute("name", "apple-mobile-web-app-status-bar-style");
    document.head.appendChild(appleStatusBar);
  }
  appleStatusBar.setAttribute("content", resolvedScheme === "dark" ? "black-translucent" : "default");
}

function refreshSystemTheme() {
  if (activeMode !== "system") return;
  activeTheme = { ...resolveThemePalette("system") };
  Object.assign(theme, activeTheme);
  applyThemeToDocument("system", activeTheme);
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      if (activeMode === "system") applyThemeToDocument("system", activeTheme);
    }, 80);
  }
  themeVersion += 1;
  themeListeners.forEach((listener) => listener());
}

const appearanceSubscription = Appearance.addChangeListener(() => {
  refreshSystemTheme();
});

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => refreshSystemTheme();
  if (typeof media.addEventListener === "function") {
    media.addEventListener("change", onChange);
  } else if (typeof media.addListener === "function") {
    media.addListener(onChange);
  }
}

applyThemeToDocument(activeMode, activeTheme);
