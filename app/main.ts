import fs from "node:fs";
import { createInterface } from "readline";
import { execSync, spawnSync } from "node:child_process";
import { chdir, cwd } from "node:process";
import nodePath from "node:path";
import { splitArgs } from "./split-args";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PATH_ENV = process.env.PATH;
const HOME_ENV = process.env.HOME;

const COMMANDS_LIST = ["echo", "exit", "pwd", "type"];

const cleanQuotes = (str: string) => str.replace(/^['"](.*)['"]$/, "$1");

function repl() {
  rl.question("$ ", (answer) => {
    let [command, ...args] = splitArgs(answer);

    switch (command) {
      case "exit": {
        return rl.close();
      }

      case "echo": {
        rl.write(`${args.map((item) => cleanQuotes(item)).join(" ")}\n`);
        break;
      }

      case "pwd": {
        rl.write(`${cwd()}\n`);
        break;
      }

      case "cd": {
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
          rl.write(`${command}: ${resultPath}: No such file or directory\n`);
        }
        break;
      }

      case "type": {
        const targetCommand = args[0];
        if (COMMANDS_LIST.includes(targetCommand)) {
          rl.write(`${targetCommand} is a shell builtin\n`);
          break;
        }

        const paths = PATH_ENV?.split(":") || [];

        let finded = paths.find((path) => {
          return fs.existsSync(`${path}/${targetCommand}`);
        });

        if (finded) {
          rl.write(`${targetCommand} is ${finded}/${targetCommand}\n`);
          break;
        }

        rl.write(`${targetCommand}: not found\n`);
        break;
      }

      default: {
        const paths = PATH_ENV?.split(":") || [];

        const finded = paths.find((path) => {
          return fs.existsSync(nodePath.resolve(path, cleanQuotes(command)));
        });

        if (finded) {
          const result = spawnSync(command, args, {
            stdio: "inherit",
            shell: true,
          });

          // const result = spawnSync(`${finded}/${command}`, args);
          // if (result.error) {
          //   console.error(`Error: ${result.error.message}`);
          // } else {
          //   console.log(`Output:\n${result.stdout}`);
          //   if (result.stderr) console.error(`stderr: ${result.stderr}`);
          // }

          // rl.write(`${result.toString()}`);
          break;
        }

        rl.write(`${answer}: command not found\n`);
      }
    }

    repl();
  });
}

repl();
