/**
 * This is all the code related to making the "default" mode of the bot work
 * e.g. bot is idle waiting for a sticker to be sent. user then sends sticker and then tags.
 */

import {
  addTagsToSticker,
  patchUserEntry,
  retrieveUserEntry,
} from "libs/database/databaseActions";
import {
  DEFAULT_STATE_CODE,
  DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS,
  UserEntry,
  UserState,
} from "libs/database/databaseModels";
import TelegramBot, { Message, Metadata } from "node-telegram-bot-api";

/**
 * Default function of the bot, that adds tags to a single sticker without needing a /command.
 * 
 * @param bot telegram bot handle uwu
 */
export function setupDefaultMode(bot: TelegramBot) {
  bot.on("sticker", async (message: Message, metadata: Metadata) => {
    const user = message.from.id;
    const chat = message.chat.id;
    const userEntry: UserEntry = await retrieveUserEntry(user);
    const userStatus: UserState = JSON.parse(userEntry.status);

    //if we're not in default mode, then this listener doesn't apply
    if (userStatus.stateCode != DEFAULT_STATE_CODE) {
      return;
    }

    const sickerReceived: string = message.sticker.file_id;
    userStatus.singleSticker = sickerReceived;
    userStatus.stateCode = DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS;
    const updatedStatus: string = JSON.stringify(userStatus);
    //todo: Try/catch?
    await patchUserEntry(user, { status: updatedStatus });

    const text: string =
      "Thanks for the sticker! Now send me a bunch of tags for it in a single message.\n\nRemember, tags cannot contain spaces.";
    bot.sendMessage(chat, text, {
      reply_markup: {
        //todo: need to standardize callback data shape and update that here.
        inline_keyboard: [[{ text: "Cancel.", callback_data: "" }]],
      },
    });
  });

  bot.on("message", async (message: Message, metadata: Metadata) => {
    const user = message.from.id;
    const chat = message.chat.id;
    const messageContents = message.text;
    const userEntry: UserEntry = await retrieveUserEntry(user);
    const userStatus: UserState = JSON.parse(userEntry.status);
    let tags: string[] = [];
    let tags_to_toss: string[] = [];
    let text: string = "Default respoonse";

    if (userStatus.stateCode != DEFAULT_STICKER_RECEIVED_READY_FOR_TAGS) {
      return;
    }
    if (!messageContents) {
      return;
    }
    if ((/\/\w+/).test(messageContents)) {
      return;
    }
    console.log("wooo");
    let cleaneduptags = gettagsfromstring(messageContents);
    if ((cleaneduptags.tags.length <= 0) && (cleaneduptags.removedtags.length <= 0)) {
      text = "You evil boyo! Those aren't tags! XD";
      bot.sendMessage(chat, text);
      return;
    }
    tags = cleaneduptags.tags;
    tags_to_toss = cleaneduptags.removedtags;

    if (tags_to_toss.length > 0) {
      text =
        "Some tags were added to your sticker successfully. However, some had invalid characters so they weren't aded:\n\n";
      tags_to_toss.forEach((tag, index) => {
        text += (((index + 1) < tags_to_toss.length) ? (tag + ", ") : tag);
      });
    } else {
      text = "I added your tags to the sticker! Ready for more if you are.";
    }

    addTagsToSticker(user, userStatus.singleSticker, tags)
      .then(() => {
        bot.sendMessage(chat, text);
        //go back to default state
        userStatus.stateCode = DEFAULT_STATE_CODE;
        userStatus.singleSticker = null;
        const updatedStatus = JSON.stringify(userStatus);
        patchUserEntry(user, { status: updatedStatus });
      })
      .catch(() => {
        //todo: do better here?
        text = "Couldn't update your sticker + tags due to some error.";
        bot.sendMessage(chat, text);
      });
  });
}

export function gettagsfromstring(string) {
  var alltags = string.split(/[\s,]+/).filter(Boolean)
  var filteredtags = alltags.filter(element => {
    return !([' ', '\n', '\r', ',', '"']).some(char => element.includes(char));
  });
  var removedtags = alltags.filter(element => {
    return !filteredtags.some(char => element.includes(char));
  });
  return { tags: filteredtags, removedtags: removedtags };
}