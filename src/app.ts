/**
 * This is the entry point to the app.
 */
import { my_function } from "libs/mylib";
import { startEventHandlers } from "libs/eventHandlers/handlers"

//TODO: Set up the database (sqlite), including its tables?
//TODO: Or maybe we make this more complicated + robust and use django + DRF to handle the database nonsense?
//TODO: it will be way easier to update the database structure with django, but way more complicated to setup.

//todo: setup bot
import TelegramBot from "node-telegram-bot-api";
require("dotenv").config();

// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.TELEGRAM_BOT_TOKEN;

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});

//todo: setup bot "/start" event handler. It should add the user to the users database and then tell the
//todo: user to send a sticker to tag
startEventHandlers(bot)

//todo: since the bot will need a sticker and then a bunch of tags, the bot needs to know some sort of "status"
//todo: or what "step" in the process it's on. no "/command" needed, just send a sticker rawdog
//todo: e.g. user sends sticker, then bot shows list of tags (if any) along with an "add" button. upon choosing add,
//todo: the user can send all the tags they want in a single message, which causes the bot to store the tag-user-sticker info
//! Scuzzy needs to make a flow doc of the different paths?
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

//! the normal mode is to send a sticker, and tag it with a bunch of tags. resulting in user tagging stickers 1 by 1.
//! should there also be a way to send some tags and some stickers to group tag them?
//! e.g. "send me a list of tags", "now send me a bunch of stickers that you want to have these tags. hit /done when you're done."
//! I think the anwer is yes -scuzzy

//todo: setup bot /multitag, /modifymultitag and /done command. described above.

my_function();
