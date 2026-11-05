// Album titles from Discogs: bilingual duplicates reduced to one language, other titles untouched.
const { loadApp, emptyState, suite } = require("./harness");
const T = suite("Titles");
(async () => {
  const app = await loadApp({ state: emptyState() });
  const t = (x) => app.ev(`tidyTitle(${JSON.stringify(x)})`);
  T.ok(t('"Sheherazade" Suite Symphonique Op. 35 Des "Mille Et Une Nuits" - Sheherazade Symphonic Suite Op.35 From "Thousand And One More Night"') === '"Sheherazade" Suite Symphonique Op. 35 Des "Mille Et Une Nuits"', "bilingual title reduced to the first language");
  T.ok(t("Pictures At An Exhibition / Night On Bald Mountain") === "Pictures At An Exhibition / Night On Bald Mountain", "two different works kept");
  T.ok(t("Live - Vol. 2") === "Live - Vol. 2", "short titles untouched");
  T.ok(t("Kind of Blue") === "Kind of Blue", "plain title untouched");
  T.done(app);
})();
