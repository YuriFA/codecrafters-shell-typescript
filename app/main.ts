import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function repl() {
  rl.question("$ ", (answer) => {
    rl.write(`${answer}: command not found\n`);
    repl();
    // rl.close()
  });
}

repl();
