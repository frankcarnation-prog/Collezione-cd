// Statistics: counts by format and genre, composers and performers kept apart, periods, money, milestone.
const { loadApp, album, emptyState, suite } = require("./harness");
const T = suite("Statistics");

const state = Object.assign(emptyState(), {
  works: {
    "mbw:ch1": { c: "Frédéric Chopin", t: "Ballade No. 1 in G minor, Op. 23" },
    "mbw:rk1": { c: "Nikolai Rimsky-Korsakov", t: "Scheherazade, Op. 35" },
    "mbw:gl1": { c: "Mikhail Glinka", t: "Ruslan and Ludmila: Overture" },
  },
  col: [
    album("c1", "Chopin; Emil Gilels", "Chopin: Ballade", 1992, "Classical", { fmt: "CD", perf: "Emil Gilels", paid: 8, val: 12, tr: [{ t: "Ballade No. 1", w: "mbw:ch1" }] }),
    album("c2", "Rimsky-Korsakov, Glinka", "Scheherazade", 1992, "Classical", { fmt: "CD", perf: "Ernest Ansermet", paid: 5, tr: [{ t: "Scheherazade", w: "mbw:rk1" }, { t: "Overture", w: "mbw:gl1" }] }),
    album("r1", "Miles Davis", "Kind of Blue", 1959, "Jazz", { fmt: "Vinyl", vt: "LP" }),
    album("r2", "Miles Davis & Gil Evans", "Sketches of Spain", 1960, "Jazz", { fmt: "CD" }),
  ],
});

(async () => {
  const app = await loadApp({ state });
  const { ev, d } = app;
  const s = ev("statsData()");
  T.ok(s.n === 4, "4 albums");
  T.ok(JSON.stringify(s.fmts) === JSON.stringify([["CD", 3], ["Vinyl LP", 1]]), "formats: " + JSON.stringify(s.fmts));
  T.ok(s.composers.length === 3 && s.composers.every(([, n]) => n === 1), "composers counted separately (not one 'Rimsky-Korsakov, Glinka' artist): " + JSON.stringify(s.composers));
  T.ok(s.performers.some(([p]) => /Gilels/.test(p)) && !s.composers.some(([c]) => /Gilels/.test(c)), "performer kept apart from composers");
  T.ok(s.artists.length === 1 && s.artists[0][0] === "Miles Davis" && s.artists[0][1] === 2, "non-classical artists by main artist: " + JSON.stringify(s.artists));
  T.ok(s.eras.length === 1 && s.eras[0][0] === "Romantic" && s.eras[0][1] === 2, "musical period from the composers: " + JSON.stringify(s.eras));
  T.ok(s.paid === 13 && s.nPaid === 2 && s.val === 12 && s.both === 1 && s.diff === 4, "money: paid, value, difference");
  T.ok(s.next === 10 && s.prev === 0, "next milestone 10");
  d.getElementById("stOpen").click();
  await app.sleep(100);
  const det = app.det().textContent;
  T.ok(/My collection in figures/.test(det) && /Top composers/.test(det) && /Musical periods/.test(det) && /Total paid/.test(det), "screen opens from the header link");
  T.ok(!!d.getElementById("stGo"), "also reachable from Tools");
  T.done(app);
})();
