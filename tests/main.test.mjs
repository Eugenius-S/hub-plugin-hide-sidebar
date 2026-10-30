// Page strings: English by default, Russian when hub.lang is "ru". Run: node --test tests/main.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { STR, makeT } from "../main.js";

test("English is the default, Russian when the hub language is Russian", () => {
  const hub = {};
  const t = makeT(hub);
  assert.equal(t("hide"), "Hide sidebar");
  hub.lang = "ru";                                  // the language is read at use time, not at load
  assert.equal(t("hide"), "Спрятать боковую панель");
  assert.equal(t("show"), "Показать боковую панель");
  hub.lang = "en";
  assert.equal(t("show"), "Show sidebar");
});

test("any other language falls back to English", () => {
  for (const lang of ["uk", "de", "xx", "", null, undefined]) assert.equal(makeT({ lang })("hide"), "Hide sidebar");
});

test("Russian has every key English has", () => {
  assert.deepEqual(Object.keys(STR.ru).sort(), Object.keys(STR.en).sort());
});

// ---- the theme's own sidebar button ----
import { NATIVE, hasNative, hiddenNow } from "../main.js";
import { createSidebar } from "../state.js";

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
// a page as a list of {selector-parts it matches}: the stub answers querySelector for the NATIVE selector only
const page = (...nodes) => ({ querySelector: (sel) => (sel === NATIVE ? nodes.find((n) => n.native) ?? null : null) });

test("a page with a theme button is native, without one it is not", () => {
  assert.equal(hasNative(page()), false);
  assert.equal(hasNative(page({ native: false })), false);
  assert.equal(hasNative(page({ native: true })), true);
});

test("the selector finds the marked button and the fold buttons of a theme, never our own", () => {
  for (const part of ["[data-sidebar-toggle]", '.search-row button[class*="fold"]', '#app > button[class*="fold"]']) assert.ok(NATIVE.includes(part), part);
  assert.ok(!/hs-/.test(NATIVE));
});

test("with a theme button the saved choice is not applied; without one it is", () => {
  const s = createSidebar(memory());
  s.toggle();                                   // the owner hid it with our button before the theme
  assert.equal(hiddenNow(s, false), true);
  assert.equal(hiddenNow(s, true), false);      // the theme is on: the list comes back, its own button rules it
});

test("a plugin's request still hides the sidebar under a theme button, and releasing returns it", () => {
  const s = createSidebar(memory());
  s.request({ hide: true, by: "view" });
  assert.equal(hiddenNow(s, true), true);
  s.request({ hide: false, by: "view" });
  assert.equal(hiddenNow(s, true), false);
});
