/**
 * Code involved with the /menu command
 */

import { retrieveUserEntry } from "libs/database/databaseActions.js";
import { UserEntry, UserState } from "libs/database/databaseModels.js";
import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";

// should have the entry point to the main commands
// todo: fill out the menu items.
//todo: Need to standardize the shape of the callback data in a menu button
const mainMenuInlineKeyboard: InlineKeyboardButton[][] = [[]];

export function setupMenuCommandListener(bot: TelegramBot) {
  //todo: double-check this regex.
  bot.onText(/\/menu(.+)/, async (msg, match) => {
    const user = msg.from.id;
    const chat = msg.chat.id;
    const userEntry: UserEntry = await retrieveUserEntry(user);
    const userStatus: UserState = JSON.parse(userEntry.status);
    //todo: user entry vs message chat id conflict check.

    const text: string =
      "Choose a menu item. Tap 'help' or send '/help' for detail on the options.";
    bot.sendMessage(chat, text, {
      reply_markup: { inline_keyboard: mainMenuInlineKeyboard },
    });
  });
}
