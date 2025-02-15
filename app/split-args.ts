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

  // let result: [string, string][] = [];
  // let word = "";
  // let currentDelimeter = " ";
  // let prevDelimeter;
  // for (let i = 0; i < str.length; i++) {
  //   if (!word && Object.values(DELIMETERS).includes(str[i])) {
  //     prevDelimeter = currentDelimeter;
  //     currentDelimeter = str[i];
  //     continue;
  //   }
  //
  //   let isEscaped = false;
  //   if (
  //     currentDelimeter === DELIMETERS.DOUBLE_QUOTES &&
  //     str[i] === "\\" &&
  //     ESCAPABLE_CHARS.includes(str[i + 1])
  //   ) {
  //     i += 1;
  //     isEscaped = true;
  //   }
  //
  //   const isDelimeter = str[i] === currentDelimeter;
  //   const isEndOfWord = i === str.length - 1 || (!isEscaped && isDelimeter);
  //
  //   if (!isDelimeter || isEscaped) {
  //     word += str[i];
  //   }
  //
  //   if (isEndOfWord) {
  //     console.log({ word, result, currentDelimeter, prevDelimeter });
  //     // if (
  //     //   result.length === 0 ||
  //     //   currentDelimeter === DELIMETERS.SPACE ||
  //     //   currentDelimeter !== prevDelimeter
  //     // ) {
  //     result.push([word, currentDelimeter]);
  //     // } else {
  //     //   result[result.length - 1] = [
  //     //     result[result.length - 1][0] + word,
  //     //     result[result.length - 1][1],
  //     //   ];
  //     // }
  //
  //     prevDelimeter = currentDelimeter;
  //     word = "";
  //   }
  // }
  //
  // console.log({ str, result });
  // // result = result.reduce((acc, [word, delimeter]) => {
  // //   return acc;
  // // }, []);
  //
  // return result.map(([word, delimeter]) => {
  //   if (delimeter === DELIMETERS.SPACE) {
  //     return word.replaceAll(/\\/g, "");
  //   }
  //
  //   return `${delimeter}${word}${delimeter}`;
  // });
};
