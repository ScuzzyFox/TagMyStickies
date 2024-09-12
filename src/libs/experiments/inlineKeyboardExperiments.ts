import { isDev } from "libs/envUtils";
import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";

/**
 * This tests and demonstrates how to set up inline keyboard buttons along with acting upon when those buttons are pressed.
 * Also shows how to modify those buttons and the message they're attached to afterwards.
 *
 * Usage: in the bot, type `/inlineExperiment` and then hit one of the buttons.
 *
 * @param bot The TelegramBot handle
 */
export function setupInlineExperiment(bot: TelegramBot) {
  if (isDev()) {
    // when a user presses any inline button in the bot, the "callback_query" event is emitted.
    bot.on("callback_query", (query) => {
      let data = query.data ? query.data : ""; // the callback_data from the button that was pressed
      let chat = query.message.chat.id; // the chat id where the button was pressed
      let user = query.from.id; // the user id of whoever pressed the botton
      let messageId = query.message.message_id; //the message id that the buttons are attached to!

      bot.sendMessage(chat, data); //send whatever was in the callback data to the user's chat.

      // edit the message.
      bot.editMessageText("YOU PRESSED THE BUTTON, WTF.", {
        message_id: messageId,
        chat_id: chat,
      });

      // get rid of the inline buttons
      bot.editMessageReplyMarkup(
        { inline_keyboard: [] }, // Empty the inline keyboard to remove the buttons
        { chat_id: chat, message_id: messageId } // Specify the message to edit
      );
    });

    bot.onText(/\/inlineExperiment/, (msg, match) => {
      /**
       * An inline keyboard consists of a 2D array of keyboard buttons.
       */
      let inlineKeyboard: InlineKeyboardButton[][] = [
        [
          { text: "buton1", callback_data: "WOAH, you hit button 1!" },
          { text: "buton2", callback_data: "Oh shit, you hit button 2!" },
        ],
      ];

      // when we get the /command, send a message with an inline keyboard attached to it.
      bot.sendMessage(
        msg.chat.id,
        "Ayo, this should have some inline buttons on it",
        {
          reply_markup: { inline_keyboard: inlineKeyboard },
        }
      );
    });
  }
}
