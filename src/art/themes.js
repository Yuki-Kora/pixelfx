import { hex } from "../core/index.js";

function colors(entries) {
  return Object.freeze(Object.fromEntries(Object.entries(entries).map(([name, value]) => [name, hex(value)])));
}

export const themes = Object.freeze({
  field: colors({
    ink: "#0c111a", panel: "#172633", inset: "#101b25", edge: "#426274", muted: "#7795a4",
    text: "#e2f5eb", accent: "#64dbbc", warn: "#ffa866", critical: "#ff6878",
    armorLight: "#c2d7d1", armor: "#8aa6aa", armorShade: "#516f7b", armorDark: "#2e495b",
  }),
  hazard: colors({
    ink: "#170f16", panel: "#35252b", inset: "#21171e", edge: "#79565b", muted: "#ad8581",
    text: "#fff2d7", accent: "#ffc163", warn: "#ffd5a2", critical: "#ff6868",
    armorLight: "#f1cf9a", armor: "#be8f62", armorShade: "#815449", armorDark: "#513741",
  }),
});

export function artTheme(name = "field") {
  if (!Object.hasOwn(themes, name)) throw new Error(`Unknown art theme: ${name}`);
  return themes[name];
}
