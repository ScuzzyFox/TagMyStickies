/**
 * The bot should programmatically set its commands.
 * Configure them here.
 */

import TelegramBot, { BotCommand } from "node-telegram-bot-api";
import { experimentalCommands } from "libs/experiments/experimentalCommands";
import { isDev } from "libs/envUtils";

const prodCommands: BotCommand[] = [
  {
    command: "start",
    description: "Starts or updates a session",
  },
];

export function initializeBotCommands(bot: TelegramBot) {
  let commands: BotCommand[] = isDev()
    ? [...prodCommands, ...experimentalCommands]
    : [...prodCommands];
  bot.setMyCommands(commands, { scope: { type: "all_private_chats" } });
}
