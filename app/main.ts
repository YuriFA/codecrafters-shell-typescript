import fs from "node:fs";
import { createInterface } from "readline";
import { splitArgs, splitRedirectArgs } from "./split-args";
import {
  builtinCommands,
  executeNonBuiltinCommand,
  findPossibleCommands,
} from "./commands";

const RING_BELL = "\u0007";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const tabCompleter = {
  previous: "",
  complete(line: string) {
    this.previous = line;
    let hits = findPossibleCommands().filter((cmd) => cmd.startsWith(line));

    if (hits.length < 2) {
      return { hits, line };
    }

    let i = line.length;
    let finded = false;
    let targetHit = hits[0];
    let largestOverallMatch = line;

    while (finded === false && targetHit.length > i) {
      if (
        hits.every((hit) => hit.startsWith(largestOverallMatch + targetHit[i]))
      ) {
        largestOverallMatch += targetHit[i];
        i += 1;
      } else {
        finded = true;
      }
    }

    return { hits, line: largestOverallMatch };
  },
};

const rlOutput = {
  prompt: "$ ",
  rewrite(data: string, { toStdout = false } = {}) {
    if (toStdout) {
      process.stdout.write("\r" + this.prompt + data);
      return;
    }

    rl.write(null, { ctrl: true, name: "u" });
    rl.write(data);
  },
  append(data: string, { toStdout = false } = {}) {
    if (toStdout) {
      process.stdout.write(data);
      return;
    }

    rl.write(data);
  },
};

process.stdin.on("keypress", (_, key) => {
  if (key.name === "tab") {
    const prevLine = tabCompleter.previous;
    const { hits, line } = tabCompleter.complete(rl.line.replaceAll("\t", ""));

    if (hits.length === 0) {
      rlOutput.rewrite(line)
      rlOutput.append(RING_BELL, { toStdout: true });
      return;
    }

    if (hits.length === 1) {
      rlOutput.rewrite(hits[0] + " ");
      return;
    }

    if (prevLine !== line) {
      rlOutput.rewrite(line);
      rlOutput.append(RING_BELL, { toStdout: true });
      return;
    }

    rlOutput.append("\n" + hits.sort().join("  ") + "\n", { toStdout: true });
    rlOutput.rewrite(line);
  }
});

function repl() {
  rl.question(rlOutput.prompt, (answer) => {
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
