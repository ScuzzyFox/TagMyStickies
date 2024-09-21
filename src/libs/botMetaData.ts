import TelegramBot from "node-telegram-bot-api";
import { isDev } from "./envUtils";
import {
  BotDescriptionLengthError,
  BotNameLengthError,
  BotShortDescriptionLengthError,
} from "./errors/botMetaDataErrors";

export let BOT_USERNAME = "TagMyStickies";

const botName: string = isDev()
  ? "EXPERIMENTAL: TagMyStickies"
  : "TagMyStickies (ALPHA)"; //up to 64 char
const botDescription = (botUsername: string): string =>
  `I can help you organize and retrieve stickers using text-based tags, making it easy to find the right sticker without having to remember what emoji belong to your favorite stickers.\n\nTo get started, send me a sticker and then send me a bunch of tags! To recall your stickers in any chat, just type "@${botUsername} tag1 tag2 tag3"`; //up to 512 char
const botShortDesc: string =
  "I can help you organize and retrieve stickers using text-based tags!"; // up to 120char

/**
 * Sets the bot's name and descriptions. Configure these in `libs/botMetaData`
 *
 * @param bot The TelegramBot handle
 */
export function initializeMetadata(bot: TelegramBot) {
  if (botShortDesc.length > 120) {
    throw new BotShortDescriptionLengthError(
      "The bot's short description is too long."
    );
  }
  if (botName.length > 64) {
    throw new BotNameLengthError("The bot's name is too long.");
  }
  let username: string = "TagMyStickies";
  bot
    .getMe()
    .then(async (user) => {
      username = user.username ? user.username : username;
      BOT_USERNAME = username;
      //@ts-ignore
      let currentBotName: string = (await bot.getMyName()).name;
      //@ts-ignore
      let currentDescription: string = (await bot.getMyDescription())
        .description;
      //@ts-ignore
      let currentShortDescription: string = (await bot.getMyShortDescription())
        .short_description;
      if (botDescription(username).length > 512) {
        throw new BotDescriptionLengthError(
          "The bot's description is too long."
        );
      }
      if (currentDescription != botDescription(username)) {
        //@ts-ignore
        bot.setMyDescription({ description: botDescription(username) }); //for some reason this method wasn't defined in the typescript definitions.
      }
      if (currentShortDescription != botShortDesc) {
        //@ts-ignore
        bot.setMyShortDescription({ short_description: botShortDesc }); //for some reason this method wasn't defined in the typescript definitions.
      }
      if (botName != currentBotName) {
        //@ts-ignore
        bot.setMyName({ name: botName }); //for some reason this method wasn't defined in the typescript definitions.
      }
    })
    .catch((error) => {
      throw error;
    });
}
