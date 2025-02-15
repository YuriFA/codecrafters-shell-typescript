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
