// Album suggestions: matching against the library, ranking, reasons, and the screen itself.
const { loadApp, album, emptyState, suite } = require("./harness");
const T = suite("Album suggestions");

const lib = (col, wish = [], noSugg = []) => Object.assign(emptyState(), { col, wish, noSugg });
const jazz = [
  album("j1", "Miles Davis", "Kind of Blue", 1959, "Jazz"),
  album("j2", "John Coltrane", "A Love Supreme", 1965, "Jazz"),
  album("j3", "Herbie Hancock", "Maiden Voyage", 1965, "Jazz"),
  album("j4", "Bill Evans", "Portrait in Jazz", 1960, "Jazz"),
  album("j5", "Dave Brubeck Quartet", "Time Out", 1959, "Jazz"),
  album("j6", "Pink Floyd", "Dark Side of the Moon", 1973, "Rock"),
];

(async () => {
  const app = await loadApp({ state: lib(jazz) });
  const { d, ev } = app;
  await ev("loadBase()");
  const R = (state) => { ev("S=" + JSON.stringify(state)); return ev("sugCompute(BASE)"); };
  const has = (r, title) => r.items.some((i) => i.b.title === title);

  T.section("Matching with the library");
  let r = R(lib([]));
  T.ok(r.items.length === r.total && r.items.slice(0, 10).every((i) => i.b.tier === "A"), "empty library: essential albums first");
  r = R(lib(jazz, [album("w1", "The Beatles", "Revolver", 1966, "Rock")]));
  T.ok(!has(r, "Kind of Blue") && !has(r, "Time Out"), "owned albums left out ('Dave Brubeck Quartet' = 'The Dave Brubeck Quartet')");
  T.ok(!has(r, "The Dark Side of the Moon"), "title variant recognised");
  T.ok(!has(r, "Revolver") && r.hid.wish === 1, "wishlist albums left out");
  T.ok(!has(R(lib([album("x", "Stan Getz", "Getz/Gilberto", 1964, "Jazz")])), "Getz/Gilberto"), "duo album listed under one artist recognised");
  T.ok(!has(R(lib([album("x", "Prince & The Revolution", "Purple Rain", 1984, "Pop")])), "Purple Rain"), "'Prince & The Revolution' = 'Prince'");
  T.ok(has(R(lib([album("x", "Air Supply", "Moon Safari", 1980, "Pop")])), "Moon Safari"), "'Air Supply' is not 'Air'");
  T.ok(has(R(lib([album("x", "Queen Latifah", "A Night at the Opera", 1995, "Hip-hop")])), "A Night at the Opera"), "'Queen Latifah' is not 'Queen'");

  T.section("Ranking and reasons");
  r = R(lib(jazz));
  T.ok(r.items.slice(0, 4).every((i) => i.aff) && !r.items[4].aff, "4 close to your taste, then 1 discovery");
  const hh = r.items.find((i) => i.b.title === "Head Hunters");
  T.ok(hh && hh.why.some((w) => /already own 1 album by Herbie Hancock/.test(w)), "reason names the artist you own");
  T.ok(R(lib(Array.from({ length: 8 }, (_, i) => album("c" + i, "Bach", "Suite " + i, 1990, "Classical")))).gap === "Classical", "says when the base does not cover your main genre");

  T.section("Screen");
  ev("S=" + JSON.stringify(lib(jazz)) + ";save();render();");
  ev("openSuggestions()"); await app.sleep(500);
  const rows = () => [...app.det().querySelectorAll("li.gsug")].filter((li) => li.querySelector("[data-sa]"));
  T.ok(rows().length === 10, "10 suggestions shown");
  const first = rows()[0].querySelector("b").textContent;
  rows()[0].querySelector("[data-sa]").click(); await app.sleep(300);
  const w = app.saved().wish.find((x) => x.t === first);
  T.ok(w && w.g && w.y && w.src === "suggestion", "'Add to wishlist' adds '" + first + "' with year and genre");
  const second = rows()[0].querySelector("b").textContent;
  rows()[0].querySelector("[data-si]").click(); await app.sleep(300);
  T.ok(app.saved().noSugg.length === 1 && /Not interested \(1\)/.test(app.det().textContent), "'Not interested' hides it, listed apart");
  app.det().querySelector("[data-sr]").click(); await app.sleep(300);
  T.ok(rows().some((li) => li.querySelector("b").textContent === second), "restored");

  T.done(app);
})();
