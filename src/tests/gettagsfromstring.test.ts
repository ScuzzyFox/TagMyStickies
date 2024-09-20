import { gettagsfromstring } from "../libs/commands/defaultMode";

test("test", () => {
  expect(
    gettagsfromstring('Hello, World, New\nLine, Space man, Comma,, Quote"').tags
  ).toStrictEqual(["Hello", "World", "New", "Line", "Space", "man", "Comma"]);
});
test("moretest", () => {
  expect(
    gettagsfromstring(
      "Hello, world,whatever, space     ,   word and stuff, tag"
    ).tags
  ).toStrictEqual([
    "Hello",
    "world",
    "whatever",
    "space",
    "word",
    "and",
    "stuff",
    "tag",
  ]);
});
