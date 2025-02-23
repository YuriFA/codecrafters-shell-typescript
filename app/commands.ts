import fs from "node:fs";
import path from "node:path";
import nodeProcess from "node:process";
import nodeChildProcess from "node:child_process";

const HOME_ENV = process.env.HOME;
const PATH_ENV = process.env.PATH;

const findCommandPath = (command: string) => {
  const paths = PATH_ENV?.split(":") || [];
  return paths.find((item) => fs.existsSync(path.resolve(item, command)));
};

export const builtinCommands = new Map<
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
    return [nodeProcess.cwd()];
  },
});

builtinCommands.set("cd", {
  execute: (args) => {
    const targetPath = args[0];
    let resultPath = targetPath;

    if (targetPath.startsWith("~")) {
      resultPath = path.resolve(
        HOME_ENV || "",
        targetPath.slice(1),
        ...args.slice(1),
      );
    }

    if (targetPath.startsWith(".")) {
      resultPath = path.resolve(nodeProcess.cwd(), ...args);
    }

    if (fs.existsSync(resultPath)) {
      nodeProcess.chdir(resultPath);
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

    const commandPath = findCommandPath(targetCommand);

    if (!commandPath) {
      return [, `${targetCommand}: not found`];
    }

    return [`${targetCommand} is ${commandPath}/${targetCommand}`];
  },
});

export const findPossibleCommands = () => {
  const paths = PATH_ENV?.split(":") || [];
  const builtin = Array.from(builtinCommands.keys());

  const nonBuiltin = paths.reduce((acc, curr) => {
    if (fs.existsSync(curr) && fs.lstatSync(curr).isDirectory()) {
      return [...acc, ...fs.readdirSync(curr)];
    }

    return acc;
  }, [] as string[]);

  return [...new Set([...builtin, ...nonBuiltin])];
};

export const executeNonBuiltinCommand = (
  command: string,
  args: string[],
  originalQuery: string,
) => {
  const commandPath = findCommandPath(command);

  if (!commandPath) {
    return [, `${originalQuery}: command not found`];
  }

  const result = nodeChildProcess.spawnSync(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
  });

  return [result.stdout.toString().trim(), result.stderr.toString().trim()];
};
