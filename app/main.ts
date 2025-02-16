import fs from "node:fs";
import { createInterface } from "readline";
import { splitArgs, splitRedirectArgs } from "./split-args";
import { builtinCommands, executeNonBuiltinCommand } from "./commands";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function repl() {
  rl.question("$ ", (answer) => {
    let [command, ...args] = splitArgs(answer);
    const {
      commandArgs,
      redirectOut,
      redirectOutFlag,
      redirectError,
      redirectErrorFlag,
    } = splitRedirectArgs(args);
    const commandBuiltin = builtinCommands.get(command);

    let result: Array<string | undefined>;

    if (commandBuiltin) {
      result = commandBuiltin.execute(commandArgs);
    } else {
      result = executeNonBuiltinCommand(command, commandArgs, answer);
    }

    let [stdout, stderr, stdexit] = result;

    if (stdexit === "close") {
      return rl.close();
    }

    if (redirectOut) {
      try {
        fs.writeFileSync(redirectOut, stdout ? `${stdout}\n` : "", {
          flag: redirectOutFlag,
        });
      } catch (error) {
        if (error instanceof Error) {
          stderr = error.toString();
        }
      }
    }

    if (!redirectOut && stdout) {
      rl.write(`${stdout}\n`);
    }

    if (redirectError) {
      try {
        fs.writeFileSync(redirectError, stderr ? `${stderr}\n` : "", {
          flag: redirectErrorFlag,
        });
      } catch (error) {
        if (error instanceof Error) {
          stderr = error.toString();
        }
      }
    }

    if (!redirectError && stderr) {
      rl.write(`${stderr}\n`);
    }

    repl();
  });
}

repl();
