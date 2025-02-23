import fs from "node:fs";
import { createInterface } from "readline";
import { splitArgs, splitRedirectArgs } from "./split-args";
import {
  builtinCommands,
  executeNonBuiltinCommand,
  findPossibleCommands,
} from "./commands";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  completer: (line: string) => {
    const completions = findPossibleCommands().map((item) => item + " ");
    const hits = completions.filter((item) => item.startsWith(line));

    if (hits.length) {
      return [hits, line];
    } else {
      rl.write("\u0007");
      return [completions, "echo"];
    }
  },
});

// process.stdin.on("keypress", (_, key) => {
//   if (key.name === "tab") {
//     const search = rl.line.slice(0, -1);
//     const finded = [...builtinCommands.keys()].find((cmd) => {
//       return cmd.startsWith(search);
//     });
//     if (finded) {
//       readline.cursorTo(process.stdout, rl.getCursorPos().cols - 3);
//       readline.clearLine(process.stdout, 1);
//       process.stdout.write(finded.slice(search.length) + " ");
//     }
//   }
// });

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
