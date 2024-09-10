/**
 * Typescript interfaces/type declarations should go here!
 */

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
