/**
 * This is all the code related to making the "default" mode of the bot work
 * e.g. bot is idle waiting for a sticker to be sent. user then sends sticker and then tags.
 */

import {
  addTagsToSticker,
  patchUserEntry,
  retrieveUserEntry,
} from "libs/database/databaseActions.js";
import {
  DEFAULT_STATE_CODE,
  DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS,
  UserEntry,
  UserState,
} from "libs/database/databaseModels.js";
import {
  NotFoundError,
  ServerError,
  ValidationError,
} from "libs/errors/DatabaseAPIErrors.js";
import { devLog } from "libs/logging.js";
import {
  ButtonAction,
  parseButtonAction,
  serializeButtonAction,
} from "libs/utilities/IKBCallbackUtils.js";
import { parseTagsFromString } from "libs/utilities/parseTagsUtils.js";
import TelegramBot, { Message, Metadata } from "node-telegram-bot-api";
import {
  fetchUserEntry,
  handleCancel,
  updateUserEntry,
} from "../utilities/transactionalUtilities.js";

const cancelButtonCallbackData: ButtonAction = {
  mode: DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS,
  action: "cancel",
};

/**
 * Default function of the bot, that adds tags to a single sticker without needing a /command.
 *
 * @param bot telegram bot handle uwu
 */
export function setupDefaultMode(bot: TelegramBot) {
  /**
   * Receiving a sticker while in default mode starts the process.
   */
  bot.on("sticker", async (message: Message, metadata: Metadata) => {
    const user = message.from.id;
    const chat = message.chat.id;

    // Use the helper function to retrieve the user entry
    const userEntry: UserEntry | undefined = await fetchUserEntry(
      bot,
      chat,
      user
    );
    if (!userEntry) return; // Exit early if there was an error

    const userStatus: UserState = JSON.parse(userEntry.status);

    //if we're not in default mode, then this listener doesn't apply
    if (userStatus.stateCode != DEFAULT_STATE_CODE) {
      return;
    }

    // Set the sticker received and update the state
    userStatus.singleSticker = {
      file_id: message.sticker.file_id,
      sticker: message.sticker.file_unique_id,
      set_name: message.sticker.set_name,
    };

    userStatus.stateCode = DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS;
    if (!userStatus.messages_to_delete) {
      userStatus.messages_to_delete = [];
    }
    userStatus.messages_to_delete.push(message.message_id);
    if (!userStatus.singleSticker.set_name) {
      const text: string =
        "Sorry, somehow this sticker doesn't belong to a sticker set. Please send a sticker from a set.";
      const x = await bot.sendMessage(chat, text);
      userStatus.messages_to_delete.push(x.message_id);
      return;
    }

    const updatedStatus: string = JSON.stringify(userStatus);

    // try to patch the database entry with updated status.
    const updateSuccess = await updateUserEntry(bot, chat, user, updatedStatus);
    if (!updateSuccess) return; // Exit early if there was an error

    const text: string =
      "Thanks for the sticker! Now send me a bunch of tags for it in a single message, separated by spaces or commas.\n\nRemember, tags are one word and can have underscores and dashes. No other special characters are allowed!\n\nSend /cancel if you changed your mind.";
    const sentMessage = await bot.sendMessage(chat, text, {
      reply_markup: {
        //todo: need to standardize callback data shape and update that here.
        inline_keyboard: [
          [
            {
              text: "Cancel",
              callback_data: serializeButtonAction(cancelButtonCallbackData),
            },
          ],
        ],
      },
    });

    // add the sent message to messages to delete and update the database
    userStatus.messages_to_delete.push(sentMessage.message_id);
    const updatedStatus2: string = JSON.stringify(userStatus);
    await updateUserEntry(bot, chat, user, updatedStatus2);
  });

  /**
   * After a user sends a sticker, we're in this mode. (add multiple tags to single sticker)
   */
  bot.on("message", async (message: Message, metadata: Metadata) => {
    const user = message.from.id;
    const chat = message.chat.id;
    const messageContents = message.text;
    let userEntry: UserEntry | undefined;

    // try to retrieve the user entry from the database. return if we fail.
    // if we succeed, set userEntry
    userEntry = await fetchUserEntry(bot, chat, user);
    if (!userEntry || !userEntry.status) {
      return;
    }

    const userStatus: UserState = JSON.parse(userEntry.status);
    let tags: string[] = [];
    let tags_to_toss: string[] = [];
    let text: string = "Default respoonse";

    //if we're in the wrong mode, then this listener doesn't apply
    if (userStatus.stateCode != DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS) {
      return;
    }

    // if somehow message contents are blank, then return.
    if (!messageContents) {
      return;
    }

    // if we get "/cancel" (using regex) then reset the user status to default, remove data from singleSticker, and send the user a message.
    if (/\/cancel/.test(messageContents)) {
      await handleCancel(bot, user, chat);
      return;
    }

    // If the message starts with a slash (except for /cancel), return as this listener doesn't apply.
    if (
      messageContents.startsWith("/") &&
      !messageContents.startsWith("/cancel")
    ) {
      return;
    }

    let cleaneduptags = parseTagsFromString(messageContents);
    if (
      cleaneduptags.tags.length <= 0 &&
      cleaneduptags.removedtags.length <= 0
    ) {
      //todo random message for completely unparseable message
      text =
        "You evil boyo! Those aren't tags! XD Try again, or send /cancel !\n\nRemember, tags must be separated by commas or spaces and can only be one word. Dashes and underscores are the only special characters allowed.";
      bot.sendMessage(chat, text);
      return;
    }

    tags = cleaneduptags.tags;
    tags_to_toss = cleaneduptags.removedtags;

    if (tags_to_toss.length > 0) {
      text =
        "Some tags were added to your sticker successfully. However, some had invalid characters so they weren't added:\n\n";
      tags_to_toss.forEach((tag, index) => {
        text += index + 1 < tags_to_toss.length ? tag + ", " : tag;
      });
    } else {
      text =
        "I added your tags to the sticker! Ready for another sticker if you are~";
    }

    //todo: EDIT addTagsToSticker
    addTagsToSticker(user, userStatus.singleSticker, tags)
      .then(async () => {
        userStatus.messages_to_delete.push(message.message_id);
        if (
          userStatus.messages_to_delete &&
          userStatus.messages_to_delete.length > 0
        ) {
          userStatus.messages_to_delete.forEach((messageId) => {
            bot.deleteMessage(chat, messageId);
          });
        }
        const sentMessage = await bot.sendMessage(chat, text);
        //go back to default state
        userStatus.stateCode = DEFAULT_STATE_CODE;
        userStatus.singleSticker = null;
        userStatus.messages_to_delete = [sentMessage.message_id];
        const updatedStatus = JSON.stringify(userStatus);
        patchUserEntry(user, { status: updatedStatus });
      })
      .catch((error) => {
        if (error instanceof NotFoundError) {
          bot.sendMessage(
            chat,
            "Hey sorry, I don't recognize you. Did you delete your data, or perhaps you're new? Try sending /start and then try again!"
          );
        } else if (error instanceof ValidationError) {
          bot.sendMessage(
            chat,
            "Sorry, there was a validation error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
          );
        } else if (error instanceof ServerError) {
          bot.sendMessage(
            chat,
            "Sorry, there was a critical server error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
          );
        }
      });
  });

  // this is the "cancel" button callback query listener.
  bot.on("callback_query", async (query) => {
    const user = query.from.id;
    const chat = query.message.chat.id;
    const callbackData = parseButtonAction(query.data);

    if (
      callbackData.mode === DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS &&
      callbackData.action === "cancel"
    ) {
      bot.answerCallbackQuery(query.id);

      await handleCancel(bot, user, chat);
      // bot.deleteMessage(chat, query.message.message_id); // Remove the inline buttons
    }
  });
}
