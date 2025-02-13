import fs from "node:fs";
import { createInterface } from "readline";
import { execSync } from "node:child_process";
import { chdir, cwd } from "node:process";
import { resolve } from "node:path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const PATH_ENV = process.env.PATH;
const HOME_ENV = process.env.HOME;

const COMMANDS_LIST = ["echo", "exit", "pwd", "type"];

const ESCAPABLE_CHARS = ["\\", "$", "`", '"'];

const splitArgs = (str: string) => {
  let result: [string, string][] = [];

  let word = "";
  let currentDelimeter = " ";
  let prevDelimeter = currentDelimeter;
  for (let i = 0; i < str.length; i++) {
    if (!word && ["'", '"', " "].includes(str[i])) {
      prevDelimeter = currentDelimeter;
      currentDelimeter = str[i];
      continue;
    }

    let isEscaped = false;
    if (
      currentDelimeter === '"' &&
      str[i] === "\\" &&
      ESCAPABLE_CHARS.includes(str[i + 1])
    ) {
      i += 1;
      isEscaped = true;
    }

    const isDelimeter = str[i] === currentDelimeter;
    const isEndOfWord = i === str.length - 1 || (!isEscaped && isDelimeter);

    if (!isDelimeter || isEscaped) {
      word += str[i];
    }

    if (word && isEndOfWord) {
      if (prevDelimeter === " ") {
        result.push([word, currentDelimeter]);
      } else {
        result[result.length - 1] = [
          result[result.length - 1][0] + word,
          result[result.length - 1][1],
        ];
      }

      prevDelimeter = currentDelimeter;
      word = "";
    }
  }

  return result.map(([word, delimeter]) => {
    if (delimeter === " ") {
      return word.replaceAll(/\\/g, "");
    }

    return `${delimeter}${word}${delimeter}`;
  });
};

function repl() {
  rl.question("$ ", (answer) => {
    let [command, ...args] = splitArgs(answer);

    switch (command) {
      case "exit": {
        return rl.close();
      }

      case "echo": {
        rl.write(
          `${args.map((item) => item.replace(/^['"](.*)['"]$/, "$1")).join(" ")}\n`,
        );
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
          resultPath = resolve(HOME_ENV || "", path.slice(1), ...args.slice(1));
        }

        if (path.startsWith(".")) {
          resultPath = resolve(cwd(), ...args);
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
