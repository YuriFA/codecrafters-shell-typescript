const ESCAPABLE_CHARS = ["\\", "$", "`", '"'];

const DELIMETERS = {
  QUOTES: "'",
  DOUBLE_QUOTES: '"',
  SPACE: " ",
};

export const splitArgs = (str: string) => {
  let result: [string, string][] = [];

  let word = "";
  let currentDelimeter = " ";
  let prevDelimeter;
  for (let i = 0; i < str.length; i++) {
    if (!word && Object.values(DELIMETERS).includes(str[i])) {
      prevDelimeter = currentDelimeter;
      currentDelimeter = str[i];
      continue;
    }

    let isEscaped = false;
    if (
      currentDelimeter === DELIMETERS.DOUBLE_QUOTES &&
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
      if (
        result.length === 0 ||
        currentDelimeter === DELIMETERS.SPACE ||
        currentDelimeter !== prevDelimeter
      ) {
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
    if (delimeter === DELIMETERS.SPACE) {
      return word.replaceAll(/\\/g, "");
    }

    return `${delimeter}${word}${delimeter}`;
  });
};
