import { parseTagsFromString } from "libs/utilities/parseTagsUtils";

test("test", () => {
  expect(
    parseTagsFromString('Hello, World, New\nLine, Space man, Comma,, Quote"')
      .tags
  ).toStrictEqual(["Hello", "World", "New", "Line", "Space", "man", "Comma"]);
});
test("moretest", () => {
  expect(
    parseTagsFromString(
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
