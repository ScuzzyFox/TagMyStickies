import { md } from "@vlad-yakovlev/telegram-md";
import { BOT_USERNAME } from "libs/botMetaData";
import TelegramBot from "node-telegram-bot-api";

export const HINTS: string[] = [
  md.build(
    md.bold("Did you know?") +
      " the first result in your sticker list when retrieving stickers in inline mode is randomly chosen? This choice refreshes every 30 seconds!"
  ),
  md.build(
    md.bold("Did you know?") +
      " you can use " +
      md.inlineCode("@" + BOT_USERNAME) +
      ` in ${md.bold(
        "any"
      )} chat to retrieve your stickers, filtered by the tags you gave them!`
  ),
];

export function getRandomHint() {
  return HINTS[Math.floor(Math.random() * HINTS.length)];
}

export function sendRandomHint(bot: TelegramBot, chatid: number) {
  bot.sendMessage(chatid, getRandomHint(), { parse_mode: "MarkdownV2" });
}
