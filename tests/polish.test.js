// v0.93 polish: counts that agree, no checkbox-like square in window titles, Recently added on Collection only,
// classical albums not repeated under Artists, no "0 tracks", neutral search label.
const { loadApp, album, emptyState, suite } = require("./harness");
const T = suite("Polish (v0.93)");

const state = Object.assign(emptyState(), {
  works: { "mbw:n1": { c: "Frédéric Chopin", t: "Nocturne Op. 9 No. 1" } },
  col: [
    album("c1", "Chopin; Maurizio Pollini", "Nocturnes", 2005, "Classical", { fmt: "CD", perf: "Maurizio Pollini", tr: [{ t: "Nocturne Op. 9 No. 1", w: "mbw:n1" }] }),
    album("r1", "Miles Davis", "Kind of Blue", 1959, "Jazz", { fmt: "CD", tr: ["So What", "Freddie Freeloader"] }),
    album("r2", "Nick Drake", "Bryter Layter", 1970, "Folk", { fmt: "CD", tr: ["Introduction"] }),
  ],
  wish: [album("w1", "Nick Drake", "Pink Moon", 1972, "Folk")],
});

(async () => {
  const app = await loadApp({ state });
  const { ev, d } = app;

  T.section("Counts agree with the collection");
  const n = ev('cmpList("gaps").length');
  T.ok(n === 3, "Complete my library counts owned albums only (wishlist left out): " + n);
  ev("cmpUi()");
  T.ok(/of 3 albums/.test(d.getElementById("cmpTxt").textContent), "Tools text: '" + d.getElementById("cmpTxt").textContent.slice(0, 50) + "'");
  T.ok(/^3 albums missing/.test(d.getElementById("todoTot").textContent), "home line: " + d.getElementById("todoTot").textContent);

  T.section("Lists");
  const txt = d.getElementById("list").textContent;
  T.ok(/2 tracks/.test(txt) && /1 track(?!s)/.test(txt), "track count with singular");
  d.getElementById("tabWish").click(); await app.sleep(80);
  T.ok(!/0 tracks/.test(d.getElementById("list").textContent), "no '0 tracks' on a wishlist entry without track list");
  T.ok(d.getElementById("recent").hidden, "Recently added hidden outside Collection");
  d.getElementById("tabCol").click(); await app.sleep(80);
  T.ok(!d.getElementById("recent").hidden, "Recently added shown on Collection");
  T.ok(d.querySelector('label[for="q"]').textContent === "Search", "search label is neutral");

  T.section("Browse › Artists");
  ev('tab="art";render()'); await app.sleep(80);
  const art = d.getElementById("list").textContent;
  T.ok(!/Chopin/.test(art.replace(/classical album.*$/, "")) && /Miles Davis/.test(art), "classical album not listed as an artist");
  T.ok(/1 classical album is listed under Composers and Performers/.test(art), "hint points to Composers and Performers");
  ev('tab="comp";render()'); await app.sleep(80);
  T.ok(/Chopin/.test(d.getElementById("list").textContent), "still found under Composers");

  T.section("Window titles");
  T.ok(!/\.wtitle::before/.test(d.documentElement.innerHTML), "no checkbox-like square before window titles");
  T.done(app);
})();
