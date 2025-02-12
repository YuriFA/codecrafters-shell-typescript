import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function repl() {
  rl.question("$ ", (answer) => {
    const [command, ...args] = answer.split(" ");
    switch (command) {
      case "exit": {
        return rl.close();
      }

      case "echo":
        rl.write(`${args.join(' ')}\n`);
        break;

      default:
        rl.write(`${answer}: command not found\n`);
    }

    repl();
  });
}

repl();
