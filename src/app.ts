/**
 * This is the entry point to the app.
 */

/**
 * Place Imports here
 */
import "dotenv/config";
import { isDev } from "libs/envUtils.js";
import { devLog } from "libs/logging.js";
devLog("Telegram TagMyStickies bot starting up...");
import { startEventHandlers } from "libs/commands/start.js";
import TelegramBot from "node-telegram-bot-api";
import { setupInlineExperiment } from "libs/experiments/inlineKeyboardExperiments.js";
import { setupInlineQueryExperiment } from "libs/experiments/inlineQueryExperiments";
import { initializeMetadata } from "libs/botMetaData.js";
import { initializeBotCommands } from "libs/commands/commandsList.js";
import { setupInlineQueryListener } from "libs/commands/inlineQueryListener.js";
import { setupDefaultMode } from "libs/commands/defaultMode.js";
//end import

/**
 * Place Constants here
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
devLog("Bot and token loaded.");
//end constants

try {
  initializeMetadata(bot);
} catch (error) {
  // exit the app, error to console.
  // if we couldn't initialize metadata, then something is wrong with the bot.
  console.error(error);
  process.exitCode = 1;
  process.exit(1);
}

initializeBotCommands(bot);

devLog("Setting up listeners.");
startEventHandlers(bot);
setupInlineQueryListener(bot);
setupDefaultMode(bot);
bot.on("polling_error", (error) => {
  console.log("Polling error:", error);
});
devLog("Listeners set up.");

//todo: since the bot will need a sticker and then a bunch of tags, the bot needs to know some sort of "status"
//todo: or what "step" in the process it's on. no "/command" needed, just send a sticker rawdog
//todo: e.g. user sends sticker, then bot shows list of tags (if any) along with an "add" button. upon choosing add,
//todo: the user can send all the tags they want in a single message, which causes the bot to store the tag-user-sticker info
//! Scuzzy needs to make a flow doc of the different paths? (USER STORY)
//! need to make sure the logic works if user A forwards a sticker from user B. we want the tags to be applied to user A's records.

//todo: inline command handling. invoiking the bot via @bot_username tag1 tag2 etc. should result in a list of stickers the user can scroll through.
//todo: the first option in the list should be a "random" button/icon. this is so that if the user is sending a lot of "hug" stickers,
//todo: they can keep the stickers they send varied. the results of the query should include the tags they typed in.
//! should a nonexistent tag be ignored or should it make the query return nothing??
//! my vote is for it should be ignored, in case the user is in the middle of typing it, they still get results.--scuzzy

//todo: setup bot "/help" command.

//todo: setup bot "/*", "unrecognized command response."

//todo setup bot "/stop" command.
//!if the user wants to stop using the bot with /stop, inline queries should not work when stop is called. /start needs to be called again to restart.

//todo setup bot "/delete_data" command. this should wipe the users data and needs to be confirmed.

//todo setup bot response for any non-command + non-sticker + non-tag responses.

//todo: setup bot /multitag, /modifymultitag and /done command. described above.

// * experiments here *
if (isDev()) {
  devLog("Setting up experiments.");
  // setupInlineExperiment(bot);

  //! Disable the inline query experiment if you have the production one enabled and vice versa.
  //! because there should probably only ever be one "inline_query" event listener active at a time.
  //setupInlineQueryExperiment(bot);
}

devLog("Bot is launched and running.");
