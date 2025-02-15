import { describe, it, expect } from "vitest";
import { splitArgs } from "../app/split-args";

describe("splitArgs", () => {
  it("should split arguments separated by spaces", () => {
    expect(splitArgs("arg1 arg2 arg3")).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should handle single quoted arguments", () => {
    expect(splitArgs("'arg1' 'arg2'")).toEqual(["arg1", "arg2"]);
  });

  it("should handle double quoted arguments", () => {
    expect(splitArgs('"arg1" "arg2"')).toEqual(["arg1", "arg2"]);
  });

  it("should handle mixed quoted and unquoted arguments", () => {
    expect(splitArgs('arg1 "arg2" arg3')).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should handle escaped characters within double quotes", () => {
    expect(splitArgs('"arg1 \\"escaped\\""')).toEqual(['arg1 "escaped"']);
  });

  it("should handle empty input", () => {
    expect(splitArgs("")).toEqual([]);
  });

  it("should handle complex strings from codecrafters", () => {
    expect(splitArgs("echo test     example")).toEqual([
      "echo",
      "test",
      "example",
    ]);

    expect(splitArgs("echo 'example     world' 'hello'\"shell\"")).toEqual([
      "echo",
      "example     world",
      "helloshell",
    ]);

    expect(splitArgs("echo 'example     world' 'hello''shell'")).toEqual([
      "echo",
      "example     world",
      "helloshell",
    ]);

    expect(splitArgs("my_exe is /tmp/quz/my_exe")).toEqual([
      "my_exe",
      "is",
      "/tmp/quz/my_exe",
    ]);

    expect(splitArgs(`"exe with \'single quotes\'" /tmp/foo/f3`)).toEqual([
      "exe with 'single quotes'",
      "/tmp/foo/f3",
    ]);

    expect(
      splitArgs(`cat '/tmp/foo/"f 40"' '/tmp/foo/"f\\29"' '/tmp/foo/f59'`),
    ).toEqual(["cat", '/tmp/foo/"f 40"', '/tmp/foo/"f\\29"', "/tmp/foo/f59"]);

    expect(
      splitArgs(`cat '/tmp/foo/f   93' '/tmp/foo/f   9' '/tmp/foo/f   46'`),
    ).toEqual(["cat", "/tmp/foo/f   93", "/tmp/foo/f   9", "/tmp/foo/f   46"]);

    expect(splitArgs(`echo test\\ \\ \\ \\ \\ \\ hello`)).toEqual([
      "echo",
      "test      hello",
    ]);

    expect(splitArgs(`echo \\'\\"example shell\\"\\'`)).toEqual([
      "echo",
      "'\"example",
      "shell\"'",
    ]);

    expect(splitArgs(`echo test\\nworld`)).toEqual(["echo", "testnworld"]);
  });
});
