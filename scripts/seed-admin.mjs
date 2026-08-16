import { spawnSync } from "node:child_process";

const identifier = process.argv[2] ?? "admin@allroads.om";
const name = process.argv[3] ?? "All Roads Admin";

const result = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  [
    "convex",
    "run",
    "seed:seedFirstAdmin",
    JSON.stringify({ identifier, name }),
  ],
  { encoding: "utf8", shell: false },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
