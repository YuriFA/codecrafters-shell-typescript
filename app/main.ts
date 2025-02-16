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
  { execute: (args: string[]) => void }
>();
builtinCommands.set("exit", {
  execute: () => rl.close(),
});
builtinCommands.set("echo", {
  execute: (args) => rl.write(`${args.join(" ")}\n`),
});
builtinCommands.set("pwd", {
  execute: () => rl.write(`${cwd()}\n`),
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
    } else {
      rl.write(`cd: ${resultPath}: No such file or directory\n`);
    }
  },
});

builtinCommands.set("type", {
  execute: (args) => {
    const targetCommand = args[0];
    if (builtinCommands.has(targetCommand)) {
      rl.write(`${targetCommand} is a shell builtin\n`);
      return;
    }

    const paths = PATH_ENV?.split(":") || [];

    let finded = paths.find((path) => {
      return fs.existsSync(nodePath.resolve(path, targetCommand));
    });

    if (!finded) {
      rl.write(`${targetCommand}: not found\n`);
      return;
    }
    rl.write(`${targetCommand} is ${finded}/${targetCommand}\n`);
  },
});

const ensureDirectoriesExist = (filePath: string) => {
  const dirPath = nodePath.dirname(filePath);

  // Split the directory path into its components
  const pathSegments = dirPath.split(nodePath.sep);

  // Reconstruct the path step by step and check each segment
  let currentPath = pathSegments[0] === "" ? nodePath.sep : pathSegments[0];
  for (let i = 1; i < pathSegments.length; i++) {
    currentPath = nodePath.join(currentPath, pathSegments[i]);

    // Check if the current path exists
    if (!fs.existsSync(currentPath)) {
      throw new Error(`Directory does not exist: ${currentPath}`);
    }
  }
};

const executeNonBuiltinCommand = (
  command: string,
  args: string[],
  originalQuery: string,
) => {
  const paths = PATH_ENV?.split(":") || [];

  const finded = paths.find((path) => {
    return fs.existsSync(nodePath.resolve(path, command));
  });
  // console.log({ command, args, finded });

  if (!finded) {
    rl.write(`${originalQuery}: command not found\n`);
    return;
  }

  const redirectArgIndex = args.findIndex((arg) => ["1>", ">"].includes(arg));

  if (redirectArgIndex && args.length > redirectArgIndex) {
    const outputFileName = args[redirectArgIndex + 1];

    // try {
    //   ensureDirectoriesExist(outputFileName);
    // } catch (error) {
    //   console.log({ error });
    // }
    try {
      const outputFile = fs.openSync(outputFileName, "w");
      console.log({ redirectArgIndex, outputFileName });
      const result = spawnSync(command, args.slice(0, redirectArgIndex), {
        stdio: ["inherit", outputFile, "inherit"], // Redirect stdout to the file
      });
      fs.closeSync(outputFile);
    } catch (error) {
      rl.write(`no such file or directory: ${outputFileName}\n`);
    }
  } else {
    const result = spawnSync(command, args, {
      stdio: "inherit",
    });
  }

  // if (result.error) {
  //   console.error(`Error: ${result.error.message}`);
  // } else {
  //   console.log(`Output:\n${result.stdout}`);
  //   if (result.stderr) console.error(`stderr: ${result.stderr}`);
  // }

  // rl.write(`${result.toString()}`);
};

function repl() {
  rl.question("$ ", (answer) => {
    let [command, ...args] = splitArgs(answer);

    const commandBuiltin = builtinCommands.get(command);

    if (commandBuiltin) {
      commandBuiltin.execute(args);
    } else {
      executeNonBuiltinCommand(command, args, answer);
    }

    repl();
  });
}

repl();
