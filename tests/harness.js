// Test harness: loads the REAL index.html in jsdom with a throw-away localStorage / IndexedDB.
// No network: base/ files are read from disk, everything else goes to the test's own fetch mock (or fails).
const fs = require("fs");
const path = require("path");
const { JSDOM, VirtualConsole } = require("jsdom");
const { indexedDB, IDBKeyRange } = require("fake-indexeddb");

const ROOT = path.join(__dirname, "..");
const HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const KEY = "collezione-cd-v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const emptyState = () => ({ col: [], wish: [], codes: {}, works: {}, wl: {}, wsp: {}, demo: false });
const album = (id, a, t, y, g, more) => Object.assign({ id, a, t, y: String(y || ""), g: g || "", tr: [], at: 1 }, more || {});

// Titles made of letters, not numbers: titles differing only by a number would look like a box set to the app.
const word = (i) => { let s = ""; i += 26; while (i > 0) { s = String.fromCharCode(97 + (i % 26)) + s; i = Math.floor(i / 26); } return s; };
function libraryOf(n, wishN) {
  const GEN = ["Rock", "Jazz", "Classical", "Pop", "Chanson", "Electronic", "Soul / Funk", "Hip-hop"];
  const s = emptyState();
  for (let i = 0; i < n; i++) {
    s.col.push(album("a" + i, "Artist " + word(i % 140), "Record " + word(i * 7 + 3), 1955 + (i % 68), GEN[i % GEN.length],
      { fmt: i % 5 === 3 ? "Vinyl" : "CD", at: Date.now() - i * 864e5, tr: Array.from({ length: 12 }, (_, j) => "Track " + (j + 1)) }));
  }
  for (let i = 0; i < (wishN || 0); i++) s.wish.push(album("w" + i, "Wish artist " + word(i), "Wished " + word(i + 500), 1990, GEN[i % GEN.length]));
  return s;
}

async function loadApp({ state, storage = {}, fetch: mock, wait = 1500 } = {}) {
  const errors = [], calls = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(String(e.detail || e.message || e)));
  const dom = new JSDOM(HTML, {
    url: "http://localhost/", runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      w.indexedDB = indexedDB; w.IDBKeyRange = IDBKeyRange;
      w.localStorage.setItem(KEY, JSON.stringify(state || emptyState()));
      for (const [k, v] of Object.entries(storage)) w.localStorage.setItem(k, v);
      w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
      w.scrollTo = () => {}; w.Element.prototype.scrollIntoView = () => {};
      w.fetch = async (u, o) => {
        u = String(u); calls.push(u);
        if (/(^|\/)base\//.test(u) && !/^https?:\/\/(?!localhost)/.test(u)) {
          const f = path.join(ROOT, u.replace(/^https?:\/\/localhost\//, "").replace(/\?.*$/, ""));
          const txt = fs.readFileSync(f, "utf8");
          return { ok: true, status: 200, json: async () => JSON.parse(txt), text: async () => txt };
        }
        if (mock) { const r = await mock(u, o); if (r) return r; }
        throw new Error("network disabled in tests: " + u);
      };
    },
  });
  const w = dom.window, d = w.document;
  await sleep(wait);
  return {
    w, d, errors, calls, sleep,
    ev: (code) => w.eval(code),
    det: () => d.getElementById("detail"),
    saved: () => JSON.parse(w.localStorage.getItem(KEY)),
    close: () => w.close(),
  };
}

const json = (o, status = 200) => ({ ok: status < 400, status, json: async () => o, text: async () => JSON.stringify(o) });

// Minimal assertion reporter: one file = one process; exit code 1 if anything failed.
function suite(name) {
  let fails = 0, n = 0;
  console.log("\n# " + name);
  return {
    ok(cond, msg) { n++; if (cond) console.log("  ok    " + msg); else { fails++; console.log("  FAIL  " + msg); } },
    section(t) { console.log("\n  " + t); },
    done(app) {
      if (app && app.errors.length) { fails++; console.log("  FAIL  runtime errors:\n    " + app.errors.slice(0, 5).join("\n    ")); }
      console.log(`\n  ${n - fails}/${n} passed` + (fails ? "  ✗" : "  ✓"));
      if (app) app.close();
      process.exit(fails ? 1 : 0);
    },
  };
}

module.exports = { ROOT, KEY, loadApp, libraryOf, album, emptyState, json, suite, sleep, word };
