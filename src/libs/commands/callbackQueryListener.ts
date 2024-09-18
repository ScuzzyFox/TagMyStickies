import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";

/**
 * This is going to be a huge function, split out functionality using a switch statement and into functions if possible.
 * I was thinking this should be one giant listener to handle all callback queries, but maybe that's a bit silly.
 * So this may be obsolete.
 *
 * @param bot Telegram Bot object handle
 */
export function setupCallbackQueryListener(bot: TelegramBot) {
  bot.on("callback_query", (query: CallbackQuery) => {
    let data = query.data ? query.data : ""; // the callback_data from the button that was pressed
    let chat = query.message.chat.id; // the chat id where the button was pressed
    let user = query.from.id; // the user id of whoever pressed the botton
    let messageId = query.message.message_id; //the message id that the buttons are attached to!

    //todo: not sure how to handle this still. One giant listener with switch cases, or multiple listeners?
  });
}
