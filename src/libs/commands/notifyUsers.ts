import TelegramBot from "node-telegram-bot-api";
import { listUserEntries } from "../database/databaseActions.js";

//regex to detect the command and then everything after
const commandRegex = /\/notify (.+)/;

export function setupNotifyUsers(bot: TelegramBot) {
  bot.onText(commandRegex, async (msg, match) => {
    const usr = msg.from.username;
    if (usr.toLowerCase() != "scuzzyfox") {
      return;
    }
    const userEntries = await listUserEntries();
    const message = match[1];
    userEntries.forEach((entry) => {
      bot.sendMessage(entry.chat, message);
    });
  });
}
