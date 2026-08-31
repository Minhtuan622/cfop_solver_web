import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [environment, command, ...args] = process.argv.slice(2);

if (!environment || !command) {
  throw new Error("Usage: run-with-env.mjs <environment> <command> [...args]");
}

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const usesTsx = command === "tsx";
const executable = usesTsx || command === "node" ? process.execPath : command;
const commandArgs = usesTsx
  ? [path.join(projectRoot, "node_modules", "tsx", "dist", "cli.mjs"), ...args]
  : args;

const child = spawn(executable, commandArgs, {
  env: { ...process.env, NODE_ENV: environment },
  stdio: "inherit",
});

child.on("error", error => {
  console.error(error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
