// v0.94: discreet edition marker, compact search bar, currency chosen in Settings.
const { loadApp, album, emptyState, suite, KEY } = require("./harness");
const T = suite("Compact home, edition marker, currency (v0.94)");
const state = Object.assign(emptyState(), {
  col: [album("a1", "Miles Davis", "Kind of Blue", 1959, "Jazz", { fmt: "CD", paid: 8 }), album("a2", "Barbara", "Le Soleil noir", 1968, "Chanson", { fmt: "Vinyl" })],
  codes: { "5099750442227": "a1" },
  wish: [album("w1", "Nick Drake", "Pink Moon", 1972, "Folk")],
});
(async () => {
  const app = await loadApp({ state });
  const { ev, d, w } = app;
  T.section("Edition marker");
  const dots = [...d.querySelectorAll("#list .cert")];
  T.ok(dots.length === 2, "one marker per owned album");
  const q = d.querySelector('#list [data-open="a2"] .cert');
  T.ok(q && q.classList.contains("c0") && q.classList.contains("quiet"), "'not sure' shown as a quiet ring, not a red dot");
  T.ok(!d.querySelector('#list [data-open="a1"] .cert').classList.contains("quiet"), "other levels keep their colour");
  d.getElementById("tabWish").click(); await app.sleep(80);
  T.ok(!d.querySelector("#list .cert"), "no edition marker on the wishlist");
  d.getElementById("tabCol").click(); await app.sleep(80);

  T.section("Search bar");
  T.ok(d.getElementById("sortCount").hidden, "no count line without a filter (the header already gives it)");
  T.ok(d.getElementById("sortSel").options[0].text === "Newest first", "short sort labels");
  d.getElementById("genreSel").value = "Jazz"; d.getElementById("genreSel").dispatchEvent(new w.Event("change")); await app.sleep(80);
  T.ok(!d.getElementById("sortCount").hidden && /1 album/.test(d.getElementById("sortCount").textContent), "count shown when filtered: " + d.getElementById("sortCount").textContent);
  d.getElementById("q").value = "barbara"; d.getElementById("q").dispatchEvent(new w.Event("input")); await app.sleep(400);
  T.ok(/1 result/.test(d.getElementById("sortCount").textContent) && !d.getElementById("sortCount").hidden, "results counted while searching");
  d.getElementById("genreSel").value = ""; d.getElementById("genreSel").dispatchEvent(new w.Event("change"));
  d.getElementById("q").value = ""; d.getElementById("q").dispatchEvent(new w.Event("input")); await app.sleep(400);

  T.section("Currency");
  const sel = d.getElementById("curSel");
  T.ok(sel && /^Automatic/.test(sel.options[0].text) && sel.value === "", "automatic by default");
  sel.value = "€"; sel.dispatchEvent(new w.Event("change")); await app.sleep(80);
  T.ok(w.localStorage.getItem("currency") === "€", "choice saved");
  T.ok(/8 €/.test(d.getElementById("stats").textContent), "header uses the chosen currency: " + d.getElementById("stats").textContent);
  T.ok(ev("curCode()") === "EUR", "Discogs prices requested in EUR");
  sel.value = "£"; sel.dispatchEvent(new w.Event("change")); await app.sleep(80);
  T.ok(/8 £/.test(d.getElementById("stats").textContent) && ev("S.col[0].paid") === 8, "symbol changes, amount not converted");
  T.ok(ev("BK_KEYS").includes("currency"), "kept in backups");
  T.done(app);
})();
