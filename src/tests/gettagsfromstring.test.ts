import { parseTagsFromString } from "../libs/utilities/parseTagsUtils.js";

test("test", () => {
  expect(
    parseTagsFromString(
      'Hello, World, New\nLine, Space man, Comma,, Quote", -exclude'
    ).tags
  ).toStrictEqual(["hello", "world", "new", "line", "space", "man", "comma"]);
});

test("testExcludedTags", () => {
  expect(
    parseTagsFromString("-exclUde1, -excluDe2").tags_to_exclude
  ).toStrictEqual(["exclude1", "exclude2"]);
});

test("moretest", () => {
  expect(
    parseTagsFromString(
      "Hello, world,whatever, space     ,   word and stuff, tag"
    ).tags
  ).toStrictEqual([
    "hello",
    "world",
    "whatever",
    "space",
    "word",
    "and",
    "stuff",
    "tag",
  ]);
});
