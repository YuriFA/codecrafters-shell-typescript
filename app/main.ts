import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

const COMMANDS = {
  exit: {
    command: "exit",
    description: "is a shell builtin",
  },
  echo: {
    command: "echo",
    description: "is a shell builtin",
  },
  type: {
    command: "type",
    description: "is a shell builtin",
  },
} as const;

const COMMANDS_LIST = Object.values(COMMANDS).map((command) => command.command);

function repl() {
  rl.question("$ ", (answer) => {
    const [command, ...args] = answer.split(" ");
    switch (command) {
      case COMMANDS.exit.command:
        return rl.close();

      case COMMANDS.echo.command:
        rl.write(`${args.join(" ")}\n`);
        break;

      case COMMANDS.type.command:
        let targetCommand = args[0];
        if (
          COMMANDS_LIST.includes(
            targetCommand as (typeof COMMANDS_LIST)[number],
          )
        ) {
          rl.write(
            `${args[0]} ${COMMANDS[targetCommand as keyof typeof COMMANDS].description}\n`,
          );
        } else {
          rl.write(`${args[0]}: not found\n`);
        }
        break;

      default:
        rl.write(`${answer}: command not found\n`);
    }

    repl();
  });
}

repl();
