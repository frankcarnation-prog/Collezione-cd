// Long press on an album starts the selection; tapping adds more; long press on a selected album opens its actions; Back leaves the selection.
const { loadApp, libraryOf, suite } = require("./harness");
const T = suite("Long press: selection and actions from the collection list");

(async () => {
  const app = await loadApp({ state: libraryOf(30) });
  const { d, w, ev, sleep } = app;
  const rows = () => [...d.querySelectorAll("#list li.item[data-open]")];
  const press = async (li, ms = 600) => {
    const P = w.PointerEvent || w.MouseEvent;
    li.dispatchEvent(new P("pointerdown", { bubbles: true, clientX: 10, clientY: 10, pointerType: "touch" }));
    await sleep(ms);
    li.dispatchEvent(new P("pointerup", { bubbles: true, clientX: 10, clientY: 10, pointerType: "touch" }));
    li.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await sleep(50);
  };
  const tap = async (li) => {
    const P = w.PointerEvent || w.MouseEvent;
    li.dispatchEvent(new P("pointerdown", { bubbles: true, pointerType: "touch" }));
    li.dispatchEvent(new P("pointerup", { bubbles: true, pointerType: "touch" }));
    li.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
    await sleep(50);
  };
  const histLen0 = w.history.length;

  T.section("Start");
  const a = rows()[2].dataset.open;
  await press(rows()[2]);
  T.ok(JSON.stringify(ev("SEL")) === JSON.stringify([a]), "long press selects the pressed album (and the release does not unselect it)");
  T.ok(!d.getElementById("selBar").hidden, "selection bar with the options is shown");
  T.ok(/1 selected/.test(d.getElementById("selTxt").textContent), "bar says: " + d.getElementById("selTxt").textContent);
  T.ok(d.getElementById("detail").closest("#overlay") ? d.getElementById("overlay").hidden : true, "no sheet opened yet: other albums can be added first");
  T.ok(w.history.length === histLen0 + 1, "selection adds one Back step");

  T.section("Short press does nothing special");
  ev("selEnd();render();"); await sleep(300);
  await press(rows()[4], 100);
  T.ok(ev("SEL") === null, "a quick tap does not start the selection");
  ev("closeSheet();"); await sleep(300);

  T.section("Add, then group");
  await press(rows()[2]);
  await tap(rows()[5]);
  T.ok(ev("SEL.length") === 2, "tapping another album adds it");
  T.ok(!d.getElementById("selBox").disabled, "Group is available with 2 albums");

  T.section("Long press on a selected album opens the actions");
  await press(rows()[5]);
  T.ok(!d.getElementById("overlay").hidden && /Group into a box set/.test(d.getElementById("detail").textContent), "actions sheet offers grouping into a box set");
  T.ok(ev("SEL.length") === 2, "selection kept while choosing");
  d.getElementById("chNo").click(); await sleep(150);

  T.section("Back leaves the selection");
  w.history.back(); await sleep(250);
  if (!d.getElementById("overlay").hidden) { w.history.back(); await sleep(250); }
  T.ok(ev("SEL") === null && d.getElementById("selBar").hidden, "Back closes the selection mode");

  T.section("Right-click on a computer");
  await sleep(800);
  rows()[1].dispatchEvent(new w.MouseEvent("contextmenu", { bubbles: true, cancelable: true })); await sleep(50);
  T.ok(ev("SEL && SEL.length") === 1, "right-click starts the selection too");
  d.getElementById("selCancel").click(); await sleep(250);
  T.ok(ev("SEL") === null && ev("SELH") === false, "✕ closes it and removes its Back step");

  T.done(app);
})();
