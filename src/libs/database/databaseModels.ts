/**
 * Typescript interfaces/type declarations should go here!
 */

// The different modes we can be in.
//todo: add as many as you need.
export const DEFAULT_STATE_CODE = 0x0000;
export const DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS = 0x0008;
export const TAG_MULTI = 0x0006;
export const TAG_MULTI_AWAITING_TAGS = 0x0009;
export const DELETE_STICKER = 0x0004;
export const DELETE_MULTIPLE_STICKERS = 0x0007;
export const REMOVE_TAG_SET = 0x0001;
export const REMOVE_MULTI_TAG_SET = 0x0002;
export const REPLACE_TAGS = 0x0005;
export const MASS_TAG_REPLACE = 0x0003;
export const MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS = 0x000a;
export const MASS_TAG_REPLACE_AWAITING_ADD_TAGS = 0x00b;

export interface StickerTagEntry {
  id?: number;
  sticker: string;
  user?: number;
  tag?: string;
  tags?: string[];
}

export interface UserEntry {
  user: number;
  chat?: number;
  stickerEntries?: StickerTagEntry[];
  status?: string;
}

export interface FilterStickersInput {
  tags?: string[];
  exclude_tags?: string[];
  page?: number;
  user: number;
}

export interface StickerWithTags {
  sticker: string;
  tags: string[];
}

export interface FullUserData {
  user: number;
  chat: number;
  status?: string;
  stickers?: StickerWithTags[];
}

export interface TagsToRemove {
  tags_to_remove: string[];
}

export interface Stkr {
  sticker: string; // unique id, what a sticker should be looked up by
  file_id: string; // reusable file_id, not unique
  set_name: string; // the set that the sticker belongs to
}

export interface UserState {
  stateCode: number;
  singleSticker?: Stkr;
  stickers?: Stkr[];
  tags_to_add?: string[];
  tags_to_remove?: string[];
  messages_to_delete?: number[];
}
