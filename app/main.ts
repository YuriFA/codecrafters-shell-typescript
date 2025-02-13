import fs from "node:fs";
import { createInterface } from "readline";
import { execSync } from "node:child_process";
import { chdir, cwd } from "node:process";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PATH_ENV = process.env.PATH;

const COMMANDS_LIST = ["echo", "exit", "pwd", "type"];

function repl() {
  rl.question("$ ", (answer) => {
    const [command, ...args] = answer.split(" ");
    switch (command) {
      case "exit": {
        return rl.close();
      }

      case "echo": {
        rl.write(`${args.join(" ")}\n`);
        break;
      }

      case "pwd": {
        rl.write(`${cwd()}\n`);
        break;
      }

      case "cd": {
        const path = args[0];
        if (fs.existsSync(path)) {
          chdir(path);
        } else {
          rl.write(`${command}: ${path}: No such file or directory\n`);
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

        let finded = paths.find((path) => {
          return fs.existsSync(`${path}/${command}`);
        });

        if (finded) {
          const result = execSync(`${command} ${args.join(" ")}`);
          rl.write(`${result.toString()}`);
          break;
        }

        rl.write(`${answer}: command not found\n`);
      }
    }

    repl();
  });
}

repl();
