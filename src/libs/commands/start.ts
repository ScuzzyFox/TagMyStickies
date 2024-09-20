import TelegramBot, { Message } from "node-telegram-bot-api";
import { startResponses } from "libs/randomResponses";
import { devLog } from "libs/logging";
import {
  DEFAULT_STATE_CODE,
  UserEntry,
  UserState,
} from "libs/database/databaseModels";
import {
  CreateUserEntry,
  patchUserEntry,
  retrieveUserEntry,
} from "libs/database/databaseActions";
import { NotFoundError } from "libs/errors/DatabaseAPIErrors";

var startEventHandlerscv1 = {
  responses: {
    avalResp: Array.from({ length: startResponses.length }, (_, i) => i),
  },
};

/**
 * comment
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
        };
        userEntry = await CreateUserEntry(
          userEntry.user,
          userEntry.chat,
          JSON.stringify(state)
        );

        //todo: Give the user a spiel about the bot and what the user can do next and that /help is available if they need it.
        //todo: markdownV2 formatting preferred.
        bot.sendMessage(
          userEntry.chat,
          "Welcome! You've been added to the database." //!this is just a temporary placeholder
        );

        return;
      } else {
        //todo: do better here.
        bot.sendMessage(
          msg.chat.id,
          "Sorry, something went wrong." +
            error.toString() +
            error.message +
            "\n\n" +
            error.lineNumber
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
