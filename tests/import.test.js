// Import a collection (CSV): columns recognised, duplicates detected, backups refused with a clear message.
const fs = require("fs");
const path = require("path");
const { ROOT, loadApp, album, emptyState, suite } = require("./harness");
const T = suite("Collection import");

const base = JSON.parse(fs.readFileSync(path.join(ROOT, "base", "pilot_100.json"), "utf8")).albums;
const q = (v) => '"' + String(v).replace(/"/g, '""') + '"';
const csv = ["artist,title,year,label,genre,format"].concat(base.map((b) => [b.artist, b.title, b.year, b.label, b.app_genre, "CD"].map(q).join(","))).join("\n");

(async () => {
  const app = await loadApp({ state: Object.assign(emptyState(), { col: [album("k", "Miles Davis", "Kind of Blue", 1959, "Jazz")] }) });
  const { ev } = app;
  app.w.__csv = csv;
  ev(`impSheets(impText(window.__csv,"list.csv"),"list.csv")`);
  const sh = ev("IMP.sheets[0]");
  const mapped = Object.keys(sh.map).sort().join(",");
  T.ok(["a", "f", "g", "l", "t", "y"].every((k) => sh.map[k] !== undefined), "columns recognised: " + mapped);
  const drafts = ev("impAllDrafts()");
  const by = {}; drafts.forEach((x) => (by[x.status] = (by[x.status] || 0) + 1));
  T.ok(drafts.length === 100, "100 rows read");
  T.ok(by.dup === 1 && drafts.find((x) => x.status === "dup").t === "Kind of Blue", "album already in the library detected: " + JSON.stringify(by));
  T.ok(drafts.filter((x) => x.fmt === "CD").length === 100, "format column understood");
  let err = "";
  try { ev(`impText('{"col":[],"wish":[]}',"backup.json")`); } catch (e) { err = e.message; }
  T.ok(/Restore a file/.test(err), "a backup file is refused with a hint: " + err);

  T.done(app);
})();
