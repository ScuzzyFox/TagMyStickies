/**
 * CRUD operations for all the database objects
 */
import { StickerEntry, UserEntry } from "./databaseModels";

export async function newUserEntry(userID: number, chatID: number) {
  const userEntry: UserEntry = {
    user: userID,
    chat: chatID,
  };
}

export async function deleteUserEntry(userID: number) {}

export async function newStickerTagEntry(
  userEntry: UserEntry,
  stickerEntry: StickerEntry
) {}

export async function newMultiStickerTagEntry(
  userEntry: UserEntry,
  stickerEntries: StickerEntry[]
) {}
