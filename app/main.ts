import fs from "node:fs";
import { createInterface } from "readline";
import { spawnSync } from "node:child_process";
import { chdir, cwd } from "node:process";
import nodePath from "node:path";
import { splitArgs } from "./split-args";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PATH_ENV = process.env.PATH;
const HOME_ENV = process.env.HOME;

const builtinCommands = new Map<
  string,
  { execute: (args: string[]) => Array<string | undefined> }
>();
builtinCommands.set("exit", {
  execute: () => {
    return [, , "close"];
  },
});
builtinCommands.set("echo", {
  execute: (args) => {
    return [args.join(" ")];
  },
});
builtinCommands.set("pwd", {
  execute: () => {
    return [cwd()];
  },
});

builtinCommands.set("cd", {
  execute: (args) => {
    const path = args[0];
    let resultPath = path;

    if (path.startsWith("~")) {
      resultPath = nodePath.resolve(
        HOME_ENV || "",
        path.slice(1),
        ...args.slice(1),
      );
    }

    if (path.startsWith(".")) {
      resultPath = nodePath.resolve(cwd(), ...args);
    }

    if (fs.existsSync(resultPath)) {
      chdir(resultPath);
      return [];
    }

    return [, `cd: ${resultPath}: No such file or directory`];
  },
});

builtinCommands.set("type", {
  execute: (args) => {
    const targetCommand = args[0];
    if (builtinCommands.has(targetCommand)) {
      return [`${targetCommand} is a shell builtin`];
    }

    const paths = PATH_ENV?.split(":") || [];

    let finded = paths.find((path) => {
      return fs.existsSync(nodePath.resolve(path, targetCommand));
    });

    if (!finded) {
      return [, `${targetCommand}: not found`];
    }

    return [`${targetCommand} is ${finded}/${targetCommand}`];
  },
});

const executeNonBuiltinCommand = (
  command: string,
  args: string[],
  originalQuery: string,
) => {
  const paths = PATH_ENV?.split(":") || [];

  const finded = paths.find((path) =>
    fs.existsSync(nodePath.resolve(path, command)),
  );

  if (!finded) {
    return [, `${originalQuery}: command not found`];
  }

  const result = spawnSync(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
  });

  return [result.stdout.toString().trim(), result.stderr.toString().trim()];
};

const splitRedirectArgs = (args: string[]) => {
  let commandArgs: string[] = [];
  let redirectOut: string | undefined;
  let redirectOutFlag: "w" | "a" = "w";
  let redirectError: string | undefined;
  let redirectErrorFlag: "w" | "a" = "w";

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(">") || args[i].startsWith("1>")) {
      redirectOutFlag = args[i].includes(">>") ? "a" : "w";
      i += 1;
      redirectOut = args[i];
      continue;
    }

    if (args[i].startsWith("2>")) {
      redirectErrorFlag = args[i].includes(">>") ? "a" : "w";
      i += 1;
      redirectError = args[i];
      continue;
    }

    commandArgs.push(args[i]);
  }

  return {
    commandArgs,
    redirectOut,
    redirectOutFlag,
    redirectError,
    redirectErrorFlag,
  };
};

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
