export const INVALID_CHARACTERS: string[] = [
  " ",
  "\n",
  "\r",
  ",",
  '"',
  "\\",
  "/",
  "*",
  "'",
  "`",
  "@",
  "#",
  "$",
  "%",
  "^",
  "&",
  "(",
  ")",
  "=",
  "+",
  "[",
  "]",
  "{",
  "}",
  "|",
  ";",
  ":",
  "<",
  ">",
  "?",
  "~",
  "`",
];
/**
 * This function takes a string and returns an array of tags and an array of tags to toss.
 * It also handles edge cases like empty strings and invalid characters.
 *
 * @param string the string containing a list of tags to parse
 * @returns { tags: string[], removedtags: string[] }
 */
export function parseTagsFromString(string: string): {
  tags: string[];
  removedtags: string[];
} {
  //split all tags by space/comma
  let alltags = string.split(/[\s,]+/).filter(Boolean);

  // filter tags by invalid characters
  let filteredtags = alltags.filter((element) => {
    return !INVALID_CHARACTERS.some((char) => element.includes(char));
  });

  // get a list of tags removed
  let removedtags = alltags.filter((element) => {
    return !filteredtags.some((char) => element.includes(char));
  });

  // return the resulting arrays
  return { tags: filteredtags, removedtags: removedtags };
}
