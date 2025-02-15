import { describe, it, expect } from "vitest";
import { splitArgs } from "../app/split-args";

describe("splitArgs", () => {
  it("should split arguments separated by spaces", () => {
    expect(splitArgs("arg1 arg2 arg3")).toEqual(["arg1", "arg2", "arg3"]);
  });

  it("should handle single quoted arguments", () => {
    expect(splitArgs("'arg1' 'arg2'")).toEqual(["'arg1'", "'arg2'"]);
  });

  it("should handle double quoted arguments", () => {
    expect(splitArgs('"arg1" "arg2"')).toEqual(['"arg1"', '"arg2"']);
  });

  it("should handle mixed quoted and unquoted arguments", () => {
    expect(splitArgs('arg1 "arg2" arg3')).toEqual(["arg1", '"arg2"', "arg3"]);
  });

  it("should handle escaped characters within double quotes", () => {
    expect(splitArgs('"arg1 \\"escaped\\""')).toEqual(['"arg1 "escaped""']);
  });

  it("should handle empty input", () => {
    expect(splitArgs("")).toEqual([]);
  });

  it("should handle complex strings with mixed quotes and spaces", () => {
    expect(splitArgs("echo 'example     world' 'hello''shell'")).toEqual([
      "echo",
      "'example     world'",
      "'helloshell'",
    ]);
  });


  it("should handle my_exe is /tmp/quz/my_exe", () => {
    expect(splitArgs("my_exe is /tmp/quz/my_exe")).toEqual([
      "my_exe",
      "is",
      "/tmp/quz/my_exe",
    ]);
  });
  

});
