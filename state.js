// Sidebar state: what the owner chose and what plugins ask for. No page and no hub - checked in node.
//
// The owner hides and restores the sidebar with the button; the choice (manual) is stored in the browser. A plugin, for the
// time of its view, asks with the hub-sidebar event {hide, by}: hide: true - hide, hide: false - release (by - who asks,
// each has its own). While anyone holds it, the sidebar is hidden; when the last one releases - the owner's earlier choice.
// A button press during a request is the owner's choice: it stays after the plugin releases.
export const KEY = "hub.hideSidebar";

export function createSidebar(storage) {
  const read = () => { try { return storage.getItem(KEY) === "1"; } catch { return false; } };
  const write = (v) => { try { storage.setItem(KEY, v ? "1" : "0"); } catch { /* no storage */ } };
  let manual = read();          // the owner's choice
  let override = null;          // while a plugin holds (or the owner changed their mind during it) - what is visible now
  let touched = false;          // the owner pressed the button while a plugin held
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
    // the hub-sidebar event: detail {hide: boolean, by: string}
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
        if (!holders.delete(by)) return;   // did not hold - nothing to release
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
