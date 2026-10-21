// «Спрятать панель»: кнопка со значком панели прячет и возвращает боковую панель хаба.
// Кнопка стоит в шапке панели (место sidebar.header, перед ☰); панель спрятана — кнопка у левого края страницы, на её месте.
// Выбор помнится в этом браузере. На узком экране (телефон) список — отдельный вид, прятать нечего: кнопки нет.
//
// Для других плагинов — событие на window: dispatchEvent(new CustomEvent("hub-sidebar", {detail: {hide: true, by: "<плагин>"}})).
// hide: true — спрятать на время вида, hide: false — отпустить (при уходе с вида); панель вернётся такой, какой её выбрал
// владелец. Нет этого плагина — событие ничего не делает. Правила — state.js.
import { createSidebar } from "./state.js";

const TEXT = {
  ru: { hide: "Спрятать боковую панель", show: "Показать боковую панель" },
  en: { hide: "Hide sidebar", show: "Show sidebar" },
};
const NS = "http://www.w3.org/2000/svg";

// панель: рамка и вертикальная линия у левого края
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
  const words = TEXT[String(hub.lang || "ru").slice(0, 2)] || TEXT.en;
  const buttons = [];   // в шапке панели и у края страницы — одно состояние

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
      const label = hidden ? words.show : words.hide;
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
  // выезд и заезд: раскладку страницы по кадрам не считаем — View Transitions: браузер снимает старый
  // и новый вид, панель уезжает transform + opacity, окно сессии занимает место, как смонтированный слой (style.css, hs-vt).
  // Нет API или первая секунда после загрузки (вид hub-design шлёт «спрятать» на входе) — без анимации; «меньше движения» —
  // только перекрытие прозрачности.
  const loadedAt = performance.now();
  const root = document.documentElement;
  state.onChange(() => {
    if (!document.startViewTransition || performance.now() - loadedAt < 1000) return apply();
    root.classList.add("hs-vt");
    const t = document.startViewTransition(apply);
    t.finished.finally(() => root.classList.remove("hs-vt"));
  });
  addEventListener("hub-sidebar", (e) => state.request(e.detail));
  apply();
}
