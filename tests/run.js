// Runs every *.test.js in its own process and prints a summary. Exit code 1 if any file fails.
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith(".test.js")).sort();
const failed = [];
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f)], { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", timeout: 120000 });
  process.stdout.write((r.stdout || "").split("\n").filter((l) => !/csstree-match/.test(l)).join("\n"));
  if (r.status !== 0) { failed.push(f); if (r.stderr) process.stdout.write("\n" + r.stderr.split("\n").filter((l) => !/csstree-match/.test(l)).join("\n")); }
}
console.log("\n" + "=".repeat(48));
console.log(failed.length ? `${failed.length} of ${files.length} test files FAILED: ${failed.join(", ")}` : `All ${files.length} test files passed`);
process.exit(failed.length ? 1 : 0);
