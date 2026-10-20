// Правила панели: выбор владельца и просьбы плагинов (hub-sidebar). Запуск: node --test tests/state.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createSidebar, KEY } from "../state.js";

const mem = (init = {}) => {
  const m = { ...init };
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, m };
};

test("кнопка прячет и возвращает, выбор помнится", () => {
  const st = mem();
  const sb = createSidebar(st);
  assert.equal(sb.hidden(), false);
  assert.equal(sb.toggle(), true);
  assert.equal(st.m[KEY], "1");
  assert.equal(createSidebar(st).hidden(), true);   // после перезагрузки страницы
  assert.equal(sb.toggle(), false);
  assert.equal(st.m[KEY], "0");
});

test("плагин прячет на время вида и возвращает прежнее", () => {
  const st = mem();
  const sb = createSidebar(st);
  sb.request({ hide: true, by: "hub-design" });
  assert.equal(sb.hidden(), true);
  assert.equal(st.m[KEY], undefined);               // выбор владельца не тронут
  sb.request({ hide: false, by: "hub-design" });
  assert.equal(sb.hidden(), false);
});

test("владелец спрятал сам — плагин его не открывает", () => {
  const sb = createSidebar(mem({ [KEY]: "1" }));
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);
});

test("нажал кнопку во время просьбы — это его выбор, остаётся после ухода", () => {
  const st = mem();
  const sb = createSidebar(st);
  sb.request({ hide: true, by: "a" });
  assert.equal(sb.toggle(), false);                 // показал панель руками
  assert.equal(st.m[KEY], undefined);               // пока вид открыт — в браузер не пишем
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), false);
  sb.request({ hide: true, by: "a" });              // снова вошёл в вид — снова прячем
  assert.equal(sb.hidden(), true);
  sb.toggle();
  sb.toggle();                                      // передумал дважды: спрятано, как просили
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);                  // выбор владельца: спрятано
  assert.equal(st.m[KEY], "1");
});

test("двое просят — панель вернётся, когда отпустит последний", () => {
  const sb = createSidebar(mem());
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: true, by: "b" });
  sb.request({ hide: false, by: "a" });
  assert.equal(sb.hidden(), true);
  sb.request({ hide: false, by: "b" });
  assert.equal(sb.hidden(), false);
});

test("отпускает тот, кто не держал, и мусор в событии — ничего не меняют", () => {
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

test("onChange — только когда видимость поменялась", () => {
  const got = [];
  const sb = createSidebar(mem());
  sb.onChange((h) => got.push(h));
  sb.request({ hide: true, by: "a" });
  sb.request({ hide: true, by: "b" });
  sb.request({ hide: false, by: "a" });
  sb.request({ hide: false, by: "b" });
  assert.deepEqual(got, [true, false]);
});

test("хранилище недоступно — работает без памяти", () => {
  const broken = { getItem() { throw new Error("no"); }, setItem() { throw new Error("no"); } };
  const sb = createSidebar(broken);
  assert.equal(sb.toggle(), true);
});
