// Sign-in link: when the e-mail service refuses to send (hourly limit), the user is told why, in plain words.
const { loadApp, libraryOf, json, suite } = require("./harness");
const T = suite("Sync sign-in e-mail errors");

(async () => {
  let reply = () => json({ msg: "email rate limit exceeded", error_code: "over_email_send_rate_limit" }, 429);
  const app = await loadApp({ state: libraryOf(5), fetch: async (u) => (/supabase\.co\/auth\/v1\/otp/.test(u) ? reply() : null) });
  const { d } = app;

  d.getElementById("syEmail").value = "someone@example.com";
  d.getElementById("syCode").click(); await app.sleep(400);
  T.ok(/hourly sending limit/.test(d.getElementById("syMsg").textContent), "message under the button: " + d.getElementById("syMsg").textContent);
  T.ok(!d.getElementById("rpt").hidden && /Sign-in e-mail not sent/.test(d.getElementById("rpt").textContent), "result dialog explains what happened");
  T.ok(/Try again in about an hour/.test(d.getElementById("rpt").textContent), "and what to do");

  reply = () => json({});
  d.getElementById("syCode").click(); await app.sleep(400);
  T.ok(/Link sent to someone@example\.com/.test(d.getElementById("syMsg").textContent), "normal case unchanged: " + d.getElementById("syMsg").textContent);

  T.done(app);
})();
