import { md } from "@vlad-yakovlev/telegram-md";
import { BOT_USERNAME } from "libs/botMetaData.js";
import TelegramBot from "node-telegram-bot-api";
import { devLog } from "../logging.js";

export const HINTS: string[] = [
  md.bold("Did you know?") +
    md.build(
      "\nthe first result in your sticker list when retrieving stickers in inline mode is randomly chosen! This choice refreshes every 30 seconds."
    ),
  md.bold("Did you know?") +
    md.build("\nyou can use ") +
    md.inlineCode("@" + BOT_USERNAME + " your tags") +
    md.build(` in `) +
    md.bold("any") +
    md.build(
      ` chat to retrieve your stickers, filtered by the tags you gave them!`
    ),
  md.bold("Remember!") +
    md.build(
      "\nTags can't have any spaces, So you have to do something like "
    ) +
    md.inlineCode("multiple_words") +
    md.build(" for multiple words."),
];

export function getRandomHint() {
  return HINTS[Math.floor(Math.random() * HINTS.length)];
}

export function sendRandomHint(bot: TelegramBot, chatid: number) {
  const hint2Send = getRandomHint();
  devLog("Sending random hint: ", hint2Send);
  bot.sendMessage(chatid, hint2Send, { parse_mode: "MarkdownV2" });
}
