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
  page?: number;
  tags_to_exclude?: string[];
} {
  // Split all tags by space/comma and convert to lowercase
  let alltags = string
    .toLowerCase() // Convert all input to lowercase
    .split(/[\s,]+/)
    .filter(Boolean);

  // A page looks like 'p:1' or 'P:1' or 'page:1' or 'Page:1' etc.
  const pageregex = /p(:|:)(\d+)/i;
  const page = Number(alltags.find((tag) => pageregex.test(tag)));

  // Tags to exclude start with "-"
  const tags_to_exclude = alltags
    .filter((tag) => tag.startsWith("-"))
    .map((tag) => tag.slice(1)); // Remove leading "-"

  // Filter out invalid characters and tags starting with "-"
  let filteredtags = alltags.filter((element) => {
    // Check if the element contains any invalid characters
    const hasInvalidCharacters = INVALID_CHARACTERS.some((char) =>
      element.includes(char)
    );
    return !hasInvalidCharacters && !element.startsWith("-");
  });

  // Get a list of tags removed (invalid characters or excluded by "-")
  let removedtags = alltags.filter((element) => {
    const hasInvalidCharacters = INVALID_CHARACTERS.some((char) =>
      element.includes(char)
    );
    return hasInvalidCharacters || element.startsWith("-");
  });

  // Return the resulting arrays
  return {
    tags: filteredtags,
    removedtags: removedtags,
    page: page,
    tags_to_exclude: tags_to_exclude,
  };
}
