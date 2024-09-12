/**
 * The bot should programmatically set its commands.
 * we'll configure dev-only ones here.
 */

import { BotCommand } from "node-telegram-bot-api";

//not setting a language code
export const experimentalCommands: BotCommand[] = [
  {
    command: "inlineExperiment",
    description: "Demonstrates inline keyboard functionality.",
  },
];
