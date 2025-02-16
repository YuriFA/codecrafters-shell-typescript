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

// [ "Maria file cannot be found", "2>", "/tmp/quz/foo.md" ]

const splitRedirectArgs = (args: string[]) => {
  let commandArgs: string[] = [];
  let redirectOut: string | undefined;
  let redirectError: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if ([">", "1>"].includes(args[i])) {
      i += 1;
      redirectOut = args[i];
      continue;
    }

    if (args[i] === "2>") {
      i += 1;
      redirectError = args[i];
      continue;
    }

    commandArgs.push(args[i]);
  }

  return { commandArgs, redirectOut, redirectError };
};

function repl() {
  rl.question("$ ", (answer) => {
    let [command, ...args] = splitArgs(answer);
    const { commandArgs, redirectOut, redirectError } = splitRedirectArgs(args);
    const commandBuiltin = builtinCommands.get(command);

    // console.log({ args, commandArgs, redirectOut, redirectError });

    let result: Array<string | undefined>;

    if (commandBuiltin) {
      result = commandBuiltin.execute(commandArgs);
    } else {
      result = executeNonBuiltinCommand(command, commandArgs, answer);
    }

    let [stdout, stderr, stdexit] = result;

    // console.log({ stdout, stderr, stdexit });
    if (stdexit === "close") {
      return rl.close();
    }

    if (redirectOut) {
      try {
        fs.writeFileSync(redirectOut, stdout || "");
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
        fs.writeFileSync(redirectError, stderr || "");
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
