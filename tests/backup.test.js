// Backup: API keys are left out unless the user ticks the box; plain settings are kept; storage line in Settings.
const { loadApp, libraryOf, suite } = require("./harness");
const T = suite("Backup and storage");

(async () => {
  const app = await loadApp({ state: libraryOf(20, 3), storage: { "discogs-token": "SECRET-DG", "anthropic-key": "SECRET-AI", "auto-codes": "1" } });
  const { w, d } = app;
  const blobs = [];
  w.URL.createObjectURL = (b) => { blobs.push(b); return "blob:test"; };
  w.HTMLAnchorElement.prototype.click = function () {};
  const readLast = () => new Promise((res) => { const r = new w.FileReader(); r.onload = () => res(JSON.parse(r.result)); r.readAsText(blobs[blobs.length - 1]); });

  T.ok(d.getElementById("bkKeys").checked === false, "'Include API keys' is off by default");

  d.getElementById("dlB").click(); await app.sleep(600);
  let o = await readLast();
  T.ok(Array.isArray(o.col) && o.col.length === 20 && o.wish.length === 3, "backup holds the collection and the wishlist");
  T.ok(!JSON.stringify(o).includes("SECRET"), "no API key or token in the file");
  T.ok(o.settings && o.settings["auto-codes"] === "1", "ordinary settings are still saved");
  T.ok(/Settings only \(no API keys\)/.test(d.getElementById("rpt").textContent), "the report says no keys were included");

  d.getElementById("bkKeys").checked = true;
  d.getElementById("dlB").click(); await app.sleep(600);
  o = await readLast();
  T.ok(o.settings && o.settings["discogs-token"] === "SECRET-DG", "keys included only when the box is ticked");

  app.ev("openSettings()"); await app.sleep(300);
  const sto = d.getElementById("stoInfo").textContent;
  T.ok(/^Library on this device: \d+ KB/.test(sto), "storage line in Settings: " + sto);

  T.done(app);
})();
