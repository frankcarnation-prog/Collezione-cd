// The app starts with a realistic library, without errors; version numbers agree; home screen and Tools badge.
const fs = require("fs");
const path = require("path");
const { ROOT, loadApp, libraryOf, album, suite } = require("./harness");
const T = suite("Smoke test: start-up, version, home screen, Tools badge");

(async () => {
  const lib = libraryOf(320, 40);
  const app = await loadApp({ state: lib });
  const { d, ev } = app;

  T.section("Start-up");
  const appv = ev("APPV");
  T.ok(/^\d+\.\d+\.\d+$/.test(appv), "version " + appv);
  T.ok(d.getElementById("hVer").textContent === "v" + appv, "header shows the version next to the name");
  const sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  T.ok(sw.includes('"album-ledger-' + appv + '"'), "service-worker cache name matches the app version (otherwise phones keep the old version)");
  T.ok(d.querySelectorAll("#list li").length > 10, "collection list rendered");
  T.ok(/320 albums/.test(d.getElementById("stats").textContent), "stats: " + d.getElementById("stats").textContent.trim());

  T.section("Search");
  const q = d.getElementById("q");
  const target = lib.col[257].t;
  q.value = target; q.dispatchEvent(new app.w.Event("input", { bubbles: true }));
  await app.sleep(400);
  const items = [...d.querySelectorAll("#list li.item")].map((li) => li.textContent);
  T.ok(items.length >= 1 && items.every((t) => t.includes(target)), "search '" + target + "' narrows the list (" + items.length + " result)");
  q.value = ""; q.dispatchEvent(new app.w.Event("input", { bubbles: true })); await app.sleep(300);

  T.section("Tools badge: decisions only");
  T.ok(d.getElementById("todoN").hidden, "albums without covers do not light the badge (it used to show 99+ permanently)");
  ev(`S.col.push(${JSON.stringify(album("s1", "Some Band", "Live Vol. 1", 1990, "Rock"))},${JSON.stringify(album("s2", "Some Band", "Live Vol. 2", 1990, "Rock"))});save();render();todoUi();`);
  await app.sleep(200);
  const b = d.getElementById("todoN");
  T.ok(!b.hidden && b.textContent === "1", "a box-set suggestion to review shows on the badge: " + b.textContent);

  T.section("Recently added folds away");
  const rec = d.getElementById("recent");
  T.ok(rec.tagName === "DETAILS" && !rec.open, "closed by default, so the collection is visible sooner");
  rec.open = true; rec.dispatchEvent(new app.w.Event("toggle"));
  T.ok(app.w.localStorage.getItem("recent-open") === "1", "open/closed state remembered");

  T.done(app);
})();
