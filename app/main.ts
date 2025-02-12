import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function repl() {
  rl.question("$ ", (answer) => {
    if (answer === 'exit 0') {
      return rl.close();
    }

    rl.write(`${answer}: command not found\n`);
    repl();
  });
}

repl();
