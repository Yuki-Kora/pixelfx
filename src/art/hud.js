import { clamp } from "../core/index.js";
import { artTheme } from "./themes.js";

export const HUD_SIZE = [174, 42];
export const BUTTON_SIZE = [66, 20];
export const BUTTON_STATES = ["normal", "hover", "pressed", "disabled"];

/** A beveled panel. The outer five pixels on each side form its nine-slice border. */
export function drawPanel(p, x, y, w, h, theme, { border = theme.edge, fill = theme.panel } = {}) {
  if (![x, y, w, h].every(Number.isInteger) || w < 12 || h < 12) {
    throw new RangeError("Panel coordinates must be whole pixels and its dimensions at least 12×12");
  }
  for (const [inset, corner, color] of [[0, 4, theme.ink], [1, 3, border], [2, 2, fill]]) {
    const l = x + inset, r = x + w - inset, t = y + inset, b = y + h - inset;
    p.poly([[l + corner, t], [r - corner, t], [r, t + corner], [r, b - corner],
      [r - corner, b], [l + corner, b], [l, b - corner], [l, t + corner]], color);
  }
}

export function drawVitalIcon(p, x, y, color) {
  p.rect(x + 3, y, 2, 8, color);
  p.rect(x, y + 3, 8, 2, color);
}

export function drawAmmoIcon(p, x, y, color) {
  p.rect(x + 1, y, 2, 2, color);
  p.rect(x, y + 2, 4, 4, color);
  p.rect(x, y + 7, 4, 1, color);
}

export function drawButton(p, state, { theme, label = "DEPLOY" } = {}) {
  if (!BUTTON_STATES.includes(state)) throw new Error(`Unknown button state: ${state}`);
  const C = artTheme(theme), [w, h] = BUTTON_SIZE;
  const disabled = state === "disabled", pressed = state === "pressed";
  const border = state === "hover" ? C.accent : C.edge;
  const y = pressed ? 1 : 0;
  if (p.measure(label)[0] > w - 16) throw new RangeError("Button label is wider than the button");
  drawPanel(p, 0, y, w, h - y, C, { border, fill: pressed ? C.inset : C.panel });
  if (!disabled) p.rect(6, 5 + y, 2, 10 - y, state === "hover" ? C.text : C.accent);
  p.text(label, w / 2, 7 + y, disabled ? C.muted : C.text, { align: "center" });
}

function count(value, limit, name) {
  if (!Number.isInteger(value) || value < 0 || value > limit) throw new RangeError(`${name} must be an integer from 0 to ${limit}`);
  return value;
}

/** HUD mockup. Standalone panel and icon exports let a game render its own live text and meters. */
export function drawHud(p, { theme, health = 72, ammo = 19, capacity = 30 } = {}) {
  count(health, 100, "health");
  count(capacity, 999, "capacity");
  if (capacity === 0) throw new RangeError("capacity must be at least 1");
  count(ammo, capacity, "ammo");
  const C = artTheme(theme);
  const vital = health <= 25 ? C.critical : C.accent;
  const rounds = ammo <= Math.ceil(capacity * 0.2) ? C.warn : C.text;
  drawPanel(p, 0, 0, ...HUD_SIZE, C);
  p.rect(7, 3, 25, 1, vital);
  p.rect(103, 7, 1, 29, C.edge);
  drawVitalIcon(p, 8, 9, vital);
  drawAmmoIcon(p, 111, 9, rounds);
  p.text("VITALS", 20, 10, C.muted);
  p.text("MAGAZINE", 120, 10, C.muted);
  p.text(`${health}%`, 8, 20, C.text, { font: "big" });
  p.text(String(ammo).padStart(2, "0"), 111, 20, rounds, { font: "big" });
  p.text(`/${capacity}`, 165, 21, C.muted, { align: "right" });
  for (let i = 0; i < 8; i++) {
    const x = 8 + i * 11;
    const fill = Math.round(9 * clamp(health * 0.08 - i));
    p.rect(x, 31, 9, 4, C.inset);
    if (fill > 0) p.rect(x, 31, fill, 4, vital);
    drawAmmoIcon(p, 111 + i * 7, 29, i < Math.ceil(ammo / capacity * 8) ? rounds : C.edge);
  }
}
