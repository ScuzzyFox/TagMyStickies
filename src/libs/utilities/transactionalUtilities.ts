import TelegramBot from "node-telegram-bot-api";
import {
  DEFAULT_STATE_CODE,
  UserEntry,
  UserState,
} from "../database/databaseModels.js";
import { NotFoundError } from "../errors/DatabaseAPIErrors.js";
import {
  patchUserEntry,
  retrieveUserEntry,
} from "../database/databaseActions.js";

/**
 * Helper function to retrieve a user's entry from the database.
 *
 * @param bot Telegram bot instance
 * @param chat Chat ID for sending error messages
 * @param user User ID
 * @returns UserEntry or undefined if an error occurs
 */
export async function fetchUserEntry(
  bot: TelegramBot,
  chat: number,
  user: number
): Promise<UserEntry | undefined> {
  try {
    return await retrieveUserEntry(user);
  } catch (error) {
    if (error instanceof NotFoundError) {
      bot.sendMessage(
        chat,
        "Hey sorry, I don't recognize you. Did you delete your data, or perhaps you're new? Try sending /start and then try again!"
      );
    } else {
      bot.sendMessage(
        chat,
        "Sorry, there was a fetch error retrieving your database entry. If this persists, please reach out to @scuzzyfox."
      );
    }
    return undefined; // Return undefined to signify an error occurred
  }
}

/**
 * Helper function to patch a user's entry in the database.
 *
 * @param bot Telegram bot instance
 * @param chat Chat ID for sending error messages
 * @param user User ID
 * @param updatedStatus New status to patch
 * @returns true if successful, false otherwise
 */
export async function updateUserEntry(
  bot: TelegramBot,
  chat: number,
  user: number,
  updatedStatus: string
): Promise<boolean> {
  try {
    await patchUserEntry(user, { status: updatedStatus });
    return true;
  } catch {
    bot.sendMessage(
      chat,
      "Sorry, there was a database error updating your entry. If this persists, please reach out to @scuzzyfox."
    );
    return false;
  }
}

/**
 * Handles the cancel action by resetting the user state and sending a cancel message.
 *
 * @param bot Telegram bot instance
 * @param user User ID
 * @param chat Chat ID
 * @param message Optional custom message to send after canceling
 */
export async function handleCancel(
  bot: TelegramBot,
  user: number,
  chat: number,
  message: string = "Ok, cancelled tagging that sticker! Though that sticker was pretty cool."
) {
  let userEntry: UserEntry | undefined;

  userEntry = await fetchUserEntry(bot, chat, user);
  if (!userEntry) return;

  let userStatus: UserState = JSON.parse(userEntry.status);
  if (
    userStatus.messages_to_delete &&
    userStatus.messages_to_delete.length > 0
  ) {
    userStatus.messages_to_delete.forEach((messageId) => {
      bot.deleteMessage(chat, messageId);
    });
  }
  userStatus.stateCode = DEFAULT_STATE_CODE;
  userStatus.singleSticker = null;
  userStatus.messages_to_delete = [];
  const updatedStatus = JSON.stringify(userStatus);

  const updateSuccess = await updateUserEntry(bot, chat, user, updatedStatus);
  if (!updateSuccess) return; // Exit early if there was an error

  const msgsent = await bot.sendMessage(chat, message);
  userStatus.messages_to_delete = [msgsent.message_id];
  const updatedStatus2 = JSON.stringify(userStatus);
  await updateUserEntry(bot, chat, user, updatedStatus2);
}
