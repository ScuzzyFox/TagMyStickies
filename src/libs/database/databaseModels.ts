/**
 * Typescript interfaces/type declarations should go here!
 */

export interface StickerEntry {
  sticker: string;
  user?: number;
  tag: string;
}

export interface UserEntry {
  user: number;
  chat?: number;
  stickerEntries?: StickerEntry[];
}
