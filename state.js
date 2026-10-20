// Состояние боковой панели: что выбрал владелец и что просят плагины. Без страницы и хаба — проверяется в node.
//
// Владелец прячет и возвращает панель кнопкой; выбор (manual) хранится в браузере. Плагин на время своего вида просит
// событием hub-sidebar {hide, by}: hide: true — спрятать, hide: false — отпустить (by — кто просит, у каждого свой).
// Пока кто-то держит, панель спрятана; когда отпустили последнего — прежний выбор владельца. Нажал кнопку во время
// просьбы — это его выбор: он остаётся и после того, как плагин отпустил.
export const KEY = "hub.hideSidebar";

export function createSidebar(storage) {
  const read = () => { try { return storage.getItem(KEY) === "1"; } catch { return false; } };
  const write = (v) => { try { storage.setItem(KEY, v ? "1" : "0"); } catch { /* нет хранилища */ } };
  let manual = read();          // выбор владельца
  let override = null;          // пока держит плагин (или владелец передумал при нём) — что видно сейчас
  let touched = false;          // владелец нажал кнопку, пока плагин держал
  const holders = new Set();
  const listeners = [];
  const hidden = () => (override === null ? manual : override);
  const emit = () => listeners.forEach((fn) => fn(hidden()));

  return {
    hidden,
    onChange: (fn) => listeners.push(fn),
    held: () => holders.size > 0,
    toggle() {
      if (override === null) { manual = !manual; write(manual); }
      else { override = !override; touched = true; }
      emit();
      return hidden();
    },
    // событие hub-sidebar: detail {hide: boolean, by: string}
    request(detail) {
      const d = detail && typeof detail === "object" ? detail : {};
      if (typeof d.hide !== "boolean") return;
      const by = String(d.by || "?");
      const before = hidden();
      if (d.hide) {
        holders.add(by);
        override = true;
        touched = false;
      } else {
        if (!holders.delete(by)) return;   // не держал — отпускать нечего
        if (!holders.size) {
          if (touched) { manual = override; write(manual); }
          override = null;
          touched = false;
        }
      }
      if (hidden() !== before) emit();
    },
  };
}
