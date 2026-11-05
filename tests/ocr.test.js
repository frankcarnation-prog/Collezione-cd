// Reading the cover on the device (no AI key): text found on the photos → barcode, catalog number or words → search.
const { loadApp, emptyState, json, suite } = require("./harness");
const T = suite("Cover reading on the device");

(async () => {
  const app = await loadApp({
    state: emptyState(),
    fetch: async (u) => {
      if (/musicbrainz\.org\/ws\/2\/release\/\?query=catno/.test(u)) return json({ releases: [{ id: "m1", title: "Piano Works", "artist-credit": [{ name: "Pavel Gintov" }], media: [{ format: "CD" }] }] });
      if (/musicbrainz|deezer/.test(u)) return json({ releases: [], data: [] });
      return null;
    },
  });
  const { ev, d } = app;
  const q = (f, b) => ev(`ocrQuery(${JSON.stringify(f)},${JSON.stringify(b)})`);

  let r = q("BORTKIEWICZ\nPIANO WORKS\nPAVEL GINTOV", "Esquisses de Crimée op. 8 15:56\nPCL0120 DDD\n5 029365 101525\nTotal time: 64:35\nBWV 988 Recorded 2016");
  T.ok(r.code === "", "invalid check digit is not taken for a barcode");
  T.ok(r.catno === "PCL0120", "catalog number found on the back: " + r.catno);
  T.ok(/BORTKIEWICZ PIANO WORKS PAVEL GINTOV/.test(r.words), "words of the front: " + r.words);
  r = q("RIMSKI KORSAKOV", "Classica Licorne 735 558 3 254567 355586");
  T.ok(r.code === "3254567355586", "barcode with spaces recognised: " + r.code);
  r = q("", "Track 1 4:52\nOp. 35 (1888)\nBWV 1007");
  T.ok(!r.catno && !r.code, "durations, years and work numbers are not catalog numbers: " + JSON.stringify(r));

  // whole flow with a fake reading tool
  ev(`window.Tesseract={recognize:async(img)=>({data:{text:img==="F"?"PIANO WORKS":"PCL0120"}})}`);
  ev(`openReader();shots.recto="F";shots.verso="B"`);
  d.getElementById("ocrGo").click();
  for (let i = 0; i < 40 && !d.querySelector("#eanResult .pick"); i++) await app.sleep(250);
  T.ok(d.getElementById("catno").value === "PCL0120" && !!d.querySelector("#eanResult .pick"), "reading leads to the catalog number search with results");
  T.done(app);
})();
