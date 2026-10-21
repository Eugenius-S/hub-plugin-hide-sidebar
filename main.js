// "Hide sidebar": a button with a panel icon hides and restores the hub sidebar.
// The button sits in the sidebar header (slot sidebar.header, before the menu); while the sidebar is hidden it sits at the
// left edge of the page, in the same place. The choice is remembered in this browser. On a narrow screen (phone) the list is
// a separate view, there is nothing to hide: no button.
//
// For other plugins - an event on window: dispatchEvent(new CustomEvent("hub-sidebar", {detail: {hide: true, by: "<plugin>"}})).
// hide: true - hide for the time of a view, hide: false - release (when leaving the view); the sidebar returns to what the
// owner chose by hand. Without this plugin the event does nothing. The rules are in state.js.
import { createSidebar } from "./state.js";

// UI strings: English by default, Russian when the hub language is Russian (hub.lang).
export const STR = {
  en: { hide: "Hide sidebar", show: "Show sidebar" },
  ru: { hide: "Спрятать боковую панель", show: "Показать боковую панель" },
};
// the language is read at the moment of use, not at module load
export const makeT = (hub) => (k, v) => {
  let s = (STR[hub.lang] ?? STR.en)[k] ?? STR.en[k] ?? k;
  for (const [name, val] of Object.entries(v ?? {})) s = s.replaceAll(`{${name}}`, String(val));
  return s;
};
const NS = "http://www.w3.org/2000/svg";

// the panel: a frame and a vertical line at the left edge
function panelIcon() {
  const s = document.createElementNS(NS, "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "hs-icon");
  s.setAttribute("aria-hidden", "true");
  for (const [tag, attrs] of [["rect", { x: 3, y: 4.5, width: 18, height: 15, rx: 3.5 }], ["path", { d: "M9.5 4.5v15" }]]) {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    s.append(n);
  }
  return s;
}

export default function register(hub) {
  const state = createSidebar(localStorage);
  const t = makeT(hub);
  const buttons = [];   // in the sidebar header and at the page edge - one state

  const button = (cls) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `hs-btn ${cls}`;
    b.append(panelIcon());
    b.addEventListener("click", () => state.toggle());
    buttons.push(b);
    return b;
  };
  const apply = () => {
    const hidden = state.hidden();
    document.documentElement.classList.toggle("hs-hidden", hidden);
    for (const b of buttons) {
      const label = t(hidden ? "show" : "hide");
      b.title = label;
      b.setAttribute("aria-label", label);
      b.setAttribute("aria-pressed", String(hidden));
    }
  };

  hub.addStyle("style.css");
  const edge = button("hs-edge");
  document.body.append(edge);
  hub.addSlot("sidebar.header", {
    id: "hide-sidebar",
    order: -1,
    render(root) { if (!root.firstChild) root.append(button("hs-head")); },
  });
  // slide out and in: we do not compute the page layout frame by frame - View Transitions: the browser snapshots the old
  // and new view, the sidebar slides away with transform + opacity, the session window takes its place like a mounted layer
  // (style.css, hs-vt). No API, or the first second after load (the hub-design view sends "hide" on entry) - no animation;
  // "reduce motion" - only an opacity crossfade.
  const loadedAt = performance.now();
  const root = document.documentElement;
  state.onChange(() => {
    if (!document.startViewTransition || performance.now() - loadedAt < 1000) return apply();
    root.classList.add("hs-vt");
    const vt = document.startViewTransition(apply);
    vt.finished.finally(() => root.classList.remove("hs-vt"));
  });
  addEventListener("hub-sidebar", (e) => state.request(e.detail));
  apply();
}
