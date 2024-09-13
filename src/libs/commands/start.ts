import TelegramBot, { Message } from "node-telegram-bot-api";
import { startResponses } from "libs/randomResponses";
import { devLog } from "libs/logging";

var startEventHandlerscv1 = {
  responses: {
    avalResp: Array.from({ length: startResponses.length }, (_, i) => i),
  },
};

/**
 * comment
 *
 * @param bot Telegram bot handle
 */
export function startEventHandlers(bot: TelegramBot): void {
  bot.onText(/\/start/, (msg: Message) => {
    //TODO: check if the user is already in the database
    //TODO: if they are, check if the current chatID is different from the one on the database.
    //TODO: if chatID is different, then update the chatID.
    //TODO: add user to the database
    //TODO: save chatID to the database
    //TODO: set the user interaction state to accepting a sticker

    //! I tried to use msg.user.id and got a polling error, suggesting that either the syntax is wrong or my key doesn't allow me to get the user ID.
    // msg.user.id (get the user ID)

    const chatId = msg.chat.id;

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
    devLog(randomID, startEventHandlerscv1.responses.avalResp);

    // sends the responses!
    startResponses[randomID].forEach((a, b) => {
      setTimeout(() => {
        bot.sendMessage(chatId, a.message);
      }, a.time);
    });
  });
}

function getUserState(userID: number) {
  //TODO: get user state from database from the user's ID
}
