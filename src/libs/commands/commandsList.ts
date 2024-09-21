/**
 * The bot should programmatically set its commands.
 * Configure them here.
 */

import TelegramBot, { BotCommand } from "node-telegram-bot-api";
import { experimentalCommands } from "libs/experiments/experimentalCommands.js";
import { isDev } from "libs/envUtils.js";

//Commands can only be lower-case.
const prodCommands: BotCommand[] = [
  {
    command: "start",
    description: "Starts or updates a session.",
  },
  {
    command: "next",
    description: "Move on to the next step.",
  },
  {
    command: "done",
    description: "Tell me you're finished.",
  },
  {
    command: "cancel",
    description: "Cancel what we're doing right now.",
  },
  {
    command: "menu",
    description: "Show the menu of options!",
  },
  { command: "help", description: "Get help on how to use me!" },
  {
    command: "multitag",
    description: "Tag multiple stickers with the same tags at once!",
  },
];

/**
 * Sets up the development (if any) and production commands for the bot.
 *
 * @param bot Telegram bot handle
 */
export function initializeBotCommands(bot: TelegramBot) {
  let commands: BotCommand[] = isDev()
    ? [...prodCommands, ...experimentalCommands]
    : [...prodCommands];
  bot.setMyCommands(commands, { scope: { type: "all_private_chats" } });
}
