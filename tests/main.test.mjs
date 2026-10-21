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
