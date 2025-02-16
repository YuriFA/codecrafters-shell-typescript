const ESCAPABLE_CHARS = ["\\", "$", "`", '"'];

const DELIMETERS = {
  QUOTES: "'",
  DOUBLE_QUOTES: '"',
  SPACE: " ",
} as const;

type Delimeter = (typeof DELIMETERS)[keyof typeof DELIMETERS];

export const splitArgs = (str: string) => {
  let result: string[] = [];
  let state: Delimeter | "default" = "default";
  let token = "";

  const commitToken = () => {
    state = "default";

    if (token.length > 0) {
      result.push(token);
      token = "";
    }
  };

  const resetState = () => {
    state = "default";
  };

  const appendToken = (char: string) => {
    token += char;
  };

  for (let i = 0; i < str.length; i++) {
    switch (state) {
      case DELIMETERS.QUOTES: {
        if (str[i] === state) {
          resetState();
          break;
        }
        appendToken(str[i]);
        break;
      }

      case DELIMETERS.DOUBLE_QUOTES: {
        if (str[i] === state) {
          resetState();
          break;
        }

        if (str[i] === "\\" && ESCAPABLE_CHARS.includes(str[i + 1])) {
          i += 1;
        }

        appendToken(str[i]);
        break;
      }

      default: {
        if (str[i] === DELIMETERS.SPACE) {
          commitToken();
          break;
        }

        if (
          str[i] === DELIMETERS.QUOTES ||
          str[i] === DELIMETERS.DOUBLE_QUOTES
        ) {
          state = str[i] as Delimeter;
          break;
        }

        if (str[i] === "\\") {
          i += 1;
        }

        appendToken(str[i]);
      }
    }

    if (i === str.length - 1) {
      commitToken();
    }
  }

  return result;
};

export const splitRedirectArgs = (args: string[]) => {
  let commandArgs: string[] = [];
  let redirectOut: string | undefined;
  let redirectOutFlag: "w" | "a" = "w";
  let redirectError: string | undefined;
  let redirectErrorFlag: "w" | "a" = "w";

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith(">") || args[i].startsWith("1>")) {
      redirectOutFlag = args[i].includes(">>") ? "a" : "w";
      i += 1;
      redirectOut = args[i];
      continue;
    }

    if (args[i].startsWith("2>")) {
      redirectErrorFlag = args[i].includes(">>") ? "a" : "w";
      i += 1;
      redirectError = args[i];
      continue;
    }

    commandArgs.push(args[i]);
  }

  return {
    commandArgs,
    redirectOut,
    redirectOutFlag,
    redirectError,
    redirectErrorFlag,
  };
};
