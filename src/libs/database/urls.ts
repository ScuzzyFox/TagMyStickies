// Base URL
const baseUrl: string = "http://127.0.0.1";
const port: string = "8000";
const APIURL: string = port ? baseUrl + ":" + port : baseUrl;

// API Endpoints

/**
 * For listing user entry objects or making a new one (GET and POST).
 * Filters available: ?user=123&chat=456
 */
export const listUserEntriesURL: string = `${APIURL}/records/user-entries/`;

/**
 * For viewing, modifying, or deleting a specific user entry record (GET, PUT, PATCH, DELETE).
 * use by doing userEntryDetail(id)
 */
export const userEntryDetailURL = (id: number): string =>
  `${APIURL}/records/user-entries/${id}/`;

/**
 * For listing sticker tag entries or creating new ones (GET and POST).
 * Filters available: ?tag=funny&user=1&sticker=sticker1
 */
export const listStickerTagEntriesURL: string = `${APIURL}/records/ste/`;

/**
 * For viewing, modifying, or deleting a specific sticker tag entry (GET, PUT, PATCH, DELETE).
 * Replace `%d` with the sticker tag entry's ID.
 */
export const stickerTagEntryDetailURL = (id: number): string =>
  `${APIURL}/records/ste/${id}/`;

/**
 * For filtering a user's stickers by tags (POST).
 * Provide a JSON body with user ID and optional tags: {"user": 123, "tags": ["funny", "serious"]}
 */
export const filterStickersURL = (user: number): string =>
  `${APIURL}/records/filter-stickers/${user}/`;

/**
 * For viewing a user's complete list of stickers and tags (GET).
 * Replace `%d` with the user's ID.
 */
export const userStickerTagListURL = (userId: number): string =>
  `${APIURL}/records/user-sticker-tag-list/${userId}/`;

/**
 * For adding, deleting, or replacing tags on a user's specific sticker (POST, DELETE, PATCH).
 * Replace `%d` with the user's ID and `%s` with the sticker identifier.
 */
export const manipulateMultiStickerURL = (
  userId: number,
  sticker: string
): string => `${APIURL}/records/stickers/${userId}/${sticker}/`;

/**
 * For adding or removing tags across multiple stickers at once (POST or DELETE).
 * Replace `%d` with the user's ID.
 */
export const multiStickerURL = (userId: number): string =>
  `${APIURL}/records/stickers/${userId}/`;

/**
 * For deleting a set of tags from a specific sticker (DELETE).
 * Replace `%d` with the user's ID and `%s` with the sticker identifier.
 */
export const deleteTagSetURL = (userId: number, sticker: string): string =>
  `${APIURL}/records/stickers/tags/${userId}/${sticker}/`;

/**
 * For deleting a set of tags from multiple stickers at once (DELETE).
 * Replace `%d` with the user's ID.
 */
export const deleteMultiTagSetURL = (userId: number): string =>
  `${APIURL}/records/stickers/tags/multi/${userId}/`;

/**
 * For mass-replacing multiple tags across multiple stickers (PATCH).
 * Replace `%d` with the user's ID.
 */
export const massTagReplaceURL = (userId: number): string =>
  `${APIURL}/records/stickers/tags/mass-replace/${userId}/`;
