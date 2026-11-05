// First steps: welcome screen on an empty library, one-line "To complete" on the home screen,
// format filter and "None of these" in the edition search results.
const { loadApp, album, emptyState, json, suite } = require("./harness");
const T = suite("Welcome and search results");

(async () => {
  T.section("Empty library");
  let app = await loadApp({ state: emptyState() });
  let d = app.d;
  const wl = d.querySelector(".welcome");
  T.ok(!!wl, "welcome screen shown");
  T.ok(d.getElementById("stick").hidden, "search and sort bar hidden while empty");
  T.ok(["scan", "imp", "sync"].every((k) => wl.querySelector(`[data-wl="${k}"]`)), "three ways to start: scan, import, sign in");
  wl.querySelector('[data-wl="scan"]').click();
  T.ok(!d.getElementById("scanOv").hidden, "Scan opens the scan window");
  app.ev("closeScan&&closeScan()");
  app.ev(`S.col.push(${JSON.stringify(album("a1", "Miles Davis", "Kind of Blue", 1959, "Jazz", { fmt: "CD" }))});save();render()`);
  T.ok(!d.querySelector(".welcome") && !d.getElementById("stick").hidden, "first album added: normal list again");
  app.close();

  T.section("Home: one line to complete");
  app = await loadApp({ state: Object.assign(emptyState(), { col: [album("b1", "Some Band", "Some Record", 1990, "")] }) });
  d = app.d;
  const c = d.getElementById("todoCard");
  T.ok(!c.hidden && /missing information/.test(d.getElementById("todoTot").textContent), "line shows albums missing information: " + d.getElementById("todoTot").textContent);
  T.ok(d.getElementById("todoList").children.length === 0, "no duplicate per-kind list on the home screen");
  c.querySelector("summary").click();
  await app.sleep(200);
  T.ok(app.ev("tab") === "tools" && !c.open, "tapping it opens Tools → Complete my library");
  app.close();

  T.section("Search results: format filter");
  const rel = (id, fmt) => ({ id, title: "Chopin " + id, "artist-credit": [{ name: "Gilels" }], media: [{ format: fmt }], date: "1990" });
  app = await loadApp({
    state: Object.assign(emptyState(), { col: [album("c1", "Someone", "Something", 1990, "Rock")] }),
    fetch: async (u) => {
      if (/musicbrainz\.org\/ws\/2\/release\/\?query=/.test(u)) return json({ releases: [rel("r1", "CD"), rel("r2", '12" Vinyl'), rel("r3", "CD"), rel("r4", "Cassette")] });
      if (/deezer/.test(u)) return json({ data: [] });
      return null;
    },
  });
  d = app.d;
  app.ev("openScan()");
  d.getElementById("catno").value = "Chopin Gilels";
  d.getElementById("catGo").click();
  for (let i = 0; i < 40 && !d.querySelector("#eanResult .pick"); i++) await app.sleep(250);
  const out = d.getElementById("eanResult");
  const picks = () => out.querySelectorAll(".pick").length;
  T.ok(picks() === 4 && out.querySelector("[data-rf]"), "4 results with format chips");
  out.querySelector('[data-rf="CD"]').click();
  T.ok(picks() === 2, "CD filter keeps the 2 CD editions");
  out.querySelector('[data-rf="Vinyl"]').click();
  T.ok(picks() === 1, "Vinyl filter keeps the vinyl edition");
  out.querySelector('[data-rf=""]').click();
  T.ok(picks() === 4, "All shows everything again");
  d.getElementById("resNone").click();
  await app.sleep(50);
  T.ok(out.innerHTML === "" && !d.getElementById("scanIn").hidden && d.getElementById("scanMore").open, "None of these: back to the search field");

  T.done(app);
})();
