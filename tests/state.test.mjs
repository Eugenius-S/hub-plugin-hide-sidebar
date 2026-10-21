// Sidebar rules: the owner's choice and plugin requests (hub-sidebar). Run: node --test tests/state.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createSidebar, KEY } from "../state.js";

const mem = (init = {}) => {
  const m = { ...init };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m };
};

test("the button hides and restores, the choice is remembered", () => {
  const st = mem();
  const sb = createSidebar(st);
  assert.equal(sb.hidden(), false);
  assert.equal(sb.toggle(), true);
  assert.equal(st.m[KEY], "1");
  assert.equal(createSidebar(st).hidden(), true);   // after a page reload
  assert.equal(sb.toggle(), false);
  assert.equal(st.m[KEY], "0");
});

test("a plugin hides for the time of its view and restores the previous state", () => {
  const st = mem();
  const sb = createSidebar(st);
  sb.request({ hide: true, by: "hub-design" });
  assert.equal(sb.hidden(), true);
  assert.equal(st.m[KEY], undefined);               // the owner's choice is untouched
  sb.request({ hide: false, by: "hub-design" });
  assert.equal(sb.hidden(), false);
});

test("the owner hid it by hand - a plugin does not open it", () => {
  const sb = createSidebar(mem({ [KEY]: "1" }));
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);
});

test("a button press during a request is the owner's choice, it stays after leaving", () => {
  const st = mem();
  const sb = createSidebar(st);
  sb.request({ hide: true, by: "a" });
  assert.equal(sb.toggle(), false);                 // showed the sidebar by hand
  assert.equal(st.m[KEY], undefined);               // while the view is open - not written to the browser
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), false);
  sb.request({ hide: true, by: "a" });              // entered the view again - hide again
  assert.equal(sb.hidden(), true);
  sb.toggle();
  sb.toggle();                                      // changed their mind twice: hidden, as requested
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);                  // the owner's choice: hidden
  assert.equal(st.m[KEY], "1");
});

test("two plugins ask - the sidebar returns when the last one releases", () => {
  const sb = createSidebar(mem());
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: true, by: "b" });
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);
  sb.request({ hide: false, by: "b" });
  assert.equal(sb.hidden(), false);
});

test("releasing by one who did not hold, and garbage in the event, change nothing", () => {
  const sb = createSidebar(mem());
  let n = 0;
  sb.onChange(() => n++);
  sb.request({ hide: false, by: "x" });
  sb.request({ hide: "yes", by: "x" });
  sb.request(null);
  sb.request(undefined);
  assert.equal(sb.hidden(), false);
  assert.equal(n, 0);
});

test("onChange fires only when visibility changed", () => {
  const got = [];
  const sb = createSidebar(mem());
  sb.onChange((h) => got.push(h));
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: true, by: "b" });
  sb.request({ hide: false, by: "a" });
  sb.request({ hide: false, by: "b" });
  assert.deepEqual(got, [true, false]);
});

test("storage unavailable - works without memory", () => {
  const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };
  const sb = createSidebar(broken);
  assert.equal(sb.toggle(), true);
});
