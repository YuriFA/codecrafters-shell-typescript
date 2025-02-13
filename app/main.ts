import { createInterface } from "readline";
import fs from "node:fs";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PATH_ENV = process.env.PATH;

const COMMANDS_LIST = ["echo", "exit", "type"];

function repl() {
  rl.question("$ ", (answer) => {
    const [command, ...args] = answer.split(" ");
    switch (command) {
      case "exit":
        return rl.close();

      case "echo":
        rl.write(`${args.join(" ")}\n`);
        break;

      case "type":
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

      default:
        rl.write(`${answer}: command not found\n`);
    }

    repl();
  });
}

repl();
