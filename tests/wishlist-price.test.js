// Wishlist: current Discogs price with a direct link to the offers (Discogs mocked), eBay new/used links.
const { loadApp, album, emptyState, json, suite } = require("./harness");
const T = suite("Wishlist prices");

const state = Object.assign(emptyState(), {
  col: [album("o1", "Nina Simone", "I Put a Spell on You", 1965, "Jazz", { dgid: 333, fmt: "CD", est: { p: 7.5, k: "low", n: 9, dg: 333, q: "likely", v: 2, at: Date.now() } })],
  wish: [album("w1", "Miles Davis", "Kind of Blue", 1959, "Jazz", { src: "suggestion" }), album("w2", "Nonexistent Band", "Nowhere Album", 1970, "Rock")],
});
const discogs = async (u) => {
  if (!u.includes("api.discogs.com")) return null;
  if (u.includes("oauth/identity")) return json({ username: "tester" });
  if (u.includes("database/search")) return json({ results: u.includes("Nonexistent") ? [] : [
    { id: 222, title: "Miles Davis - Kind Of Blue", format: ["Vinyl", "LP"] },
    { id: 111, title: "Miles Davis - Kind Of Blue", format: ["CD", "Album"] }] });
  if (/releases\/111/.test(u)) return json({ id: 111, lowest_price: 9.9, num_for_sale: 14, formats: [{ name: "CD" }], identifiers: [] });
  if (/releases\/333/.test(u)) return json({ id: 333, lowest_price: 7.5, num_for_sale: 9, formats: [{ name: "CD" }], identifiers: [] });
  return json({}, 404);
};

(async () => {
  const app = await loadApp({ state, storage: { "discogs-token": "TEST" }, fetch: discogs });
  const { d, ev } = app;
  const open = async (id) => { ev("closeSheet()"); ev(`openDetail("${id}")`); await app.sleep(250); };
  const txt = () => app.det().textContent;

  await open("w1");
  T.ok(/Find the price on Discogs/.test(txt()), "no edition yet: 'Find the price on Discogs'");
  const a = [...app.det().querySelectorAll("a")];
  T.ok(a.some((x) => x.textContent === "eBay new" && /LH_ItemCondition=1000/.test(x.href)) && a.some((x) => x.textContent === "eBay used" && /LH_ItemCondition=3000/.test(x.href)), "eBay new / used links");
  d.getElementById("refEst").click(); await app.sleep(3600);
  T.ok(/Cheapest on Discogs: 9[.,]90/.test(txt()) && /14 for sale, any condition, shipping not included/.test(txt()), "price and what it means");
  T.ok(/edition guessed/.test(txt()), "guessed edition flagged");
  T.ok([...app.det().querySelectorAll("a")].some((x) => /discogs\.com\/sell\/release\/111$/.test(x.href)), "direct link to the CD offers (not the vinyl)");
  const w1 = app.saved().wish.find((x) => x.id === "w1");
  T.ok(w1.dgid === undefined && w1.est.dg === 111, "the entry's own edition is left untouched");

  ev(`S.wish.find(x=>x.id==="w1").est.at=Date.now()-7*36e5;purgeEst();save();`);
  await open("w1");
  T.ok(!/Cheapest on Discogs/.test(txt()) && /Get the current Discogs price/.test(txt()), "after 6 h the price is dropped (Discogs rule)");

  await open("w2");
  d.getElementById("refEst").click(); await app.sleep(2400);
  T.ok(/no matching edition found/.test(txt()) && d.getElementById("refEst"), "nothing found: said clearly, 'Try again' offered");

  await open("o1");
  T.ok(/Discogs estimate: 7[.,]50/.test(txt()) && /Use as my value/.test(txt()), "owned albums unchanged");

  app.w.localStorage.removeItem("discogs-token");
  await open("w1");
  T.ok(/add your Discogs token/.test(txt()), "no token: tells where to add it");

  T.done(app);
})();
