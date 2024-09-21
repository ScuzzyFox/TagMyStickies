import TelegramBot, { Message } from "node-telegram-bot-api";
import { startResponses } from "libs/randomResponses.js";
import { devLog } from "libs/logging.js";
import {
  DEFAULT_STATE_CODE,
  UserEntry,
  UserState,
} from "libs/database/databaseModels.js";
import {
  CreateUserEntry,
  patchUserEntry,
  retrieveUserEntry,
} from "libs/database/databaseActions.js";
import { NotFoundError } from "libs/errors/DatabaseAPIErrors.js";
import { md } from "@vlad-yakovlev/telegram-md";
import { BOT_USERNAME } from "libs/botMetaData.js";
import { sendRandomHint } from "./hints.js";

const welcomeNewUserMessage: string = md.build(
  "🎉" +
    md.bold("Welcome!") +
    "🎉\n\nI can help you tag yor favorite stickers with text-based tags so you can easily retrieve them in inline mode.\nYour tags are just one-word, case-inssensitive strings that describe your sticker's contents, just the way that " +
    md.link("boorus", "https://www.yourdictionary.com/booru") +
    " work.\n\nWanna give it a try? Just send me a sticker you want to tag, and then send me a message with all the tags you want to give it!\n\nRemember that tags are just one word, so they can't contain any spaces. Use underscores and dashes. No other special characters are allowed.\n\nYou can then go to any chat and type " +
    md.inlineCode(`@${BOT_USERNAME} tag1 tag2 tag3 etc.`) +
    " to retrieve your stickers, filtered by the tags you gave them!\n\nTake a look at my other commands and checkout /help for more functionality."
);

var startEventHandlerscv1 = {
  responses: {
    avalResp: Array.from({ length: startResponses.length }, (_, i) => i),
  },
};

/**
 * Sets up the /start command functionality.
 *
 * on `/start`, checks if the user is new or returning. If the user is new,
 * they are added to the database and given an introductory speil into the app.
 *
 * If the user is returning, we check for any changes in the chat id and patch the database entry.
 *
 *
 * @param bot Telegram bot object handle
 */
export function startEventHandlers(bot: TelegramBot): void {
  bot.onText(/\/start/, async (msg: Message) => {
    let userEntry: UserEntry = { user: msg.from.id, chat: msg.chat.id };
    try {
      // check if user is in the database. Throw error if they aren't
      userEntry = await retrieveUserEntry(userEntry.user);
    } catch (error) {
      // if user isn't in the database, add them.
      if (error instanceof NotFoundError) {
        devLog("Not found error! going to make a new user.");
        const state: UserState = {
          stateCode: DEFAULT_STATE_CODE,
          messages_to_delete: [],
        };
        userEntry = await CreateUserEntry(
          userEntry.user,
          userEntry.chat,
          JSON.stringify(state)
        );

        bot.sendMessage(userEntry.chat, welcomeNewUserMessage, {
          parse_mode: "MarkdownV2",
        });

        sendRandomHint(bot, userEntry.chat);

        return;
      } else {
        //todo: do better here.
        bot.sendMessage(
          msg.chat.id,
          "Sorry, something went wrong." + error.toString() + error.message
        );
      }
    }

    // if we're here, then this is a returning user.
    try {
      if (userEntry.chat != msg.chat.id) {
        userEntry.chat = msg.chat.id;
        userEntry = await patchUserEntry(userEntry.user, {
          chat: userEntry.chat,
        });

        //todo: maybe a better message here?
        bot.sendMessage(
          userEntry.chat,
          "Hey! I noticed our chat changed. I should still remember your stickers though!"
        );
      }
    } catch (error) {
      //todo: error handle the patch here
    }

    //! here, I think we should send a random message about how the user is already "started" and that /help is available for them if they need.

    // gets the id of a random response!
    if (startEventHandlerscv1.responses.avalResp.length < 1) {
      startEventHandlerscv1.responses.avalResp = Array.from(
        { length: startResponses.length },
        (_, i) => i
      );
    }
    var randomaval = Math.round(
      Math.random() * (startEventHandlerscv1.responses.avalResp.length - 1)
    );
    var randomID = startEventHandlerscv1.responses.avalResp[randomaval];
    startEventHandlerscv1.responses.avalResp.splice(randomaval, 1);
    //devLog(randomID, startEventHandlerscv1.responses.avalResp);

    // sends the responses!
    startResponses[randomID].forEach((a, b) => {
      setTimeout(() => {
        bot.sendMessage(userEntry.chat, a.message);
      }, a.time);
    });
  });
}
