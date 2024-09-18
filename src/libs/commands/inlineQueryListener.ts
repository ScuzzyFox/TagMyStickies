/**
 * This is the code where we respond to an inline query with a list of stickers.
 * The first sticker in the list should always be a randomly chosen one.
 */

import { filterStickers } from "libs/database/databaseActions";
import { FilterStickersInput } from "libs/database/databaseModels";
import { isDev } from "libs/envUtils";
import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";

/**
 * This is just a utility funciton to feed into the results id of the query answer.
 *
 * @returns random String of characters
 */
function generate64ByteString() {
  const chars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function parseQueryText(queryText: string): string[] {
  let tagList: string[] = [];
  //todo: parse query text. Needs to be able to accept comma delimmited and space delimmited (or the combination).
  //todo: invalid tags need to be thrown out. No notice to the user.
  return tagList;
}

/**
 * Sets up the listener to respond to inline queries when a user is trying to retrieve their stickers filtered by a tag list.
 *
 * must make sure this is the only inline query listener in the app to avoid conflicts.
 *
 * @param bot telegram bot object handle
 */
export function setupInlineQueryListener(bot: TelegramBot) {
  bot.on("inline_query", (query) => {
    let userID = query.from.id; //can get the user ID
    let queryText = query.query; //can get the text the user typed in
    let queryID = query.id; //need the id to be able to respond to the query
    let results: InlineQueryResult[] = []; //the results object that we'll answer the query with
    let input: FilterStickersInput; //necessary for the filterStickers function because I set it up wierd.

    try {
      input.tags = parseQueryText(queryText);
    } catch (error) {}

    filterStickers(userID, input)
      .then((stickerList: string[]) => {
        //pick a random sticker to go to the front of the list
        let poppedStickerIndex: number = Math.random() * stickerList.length;
        let poppedSticker = stickerList[poppedStickerIndex];
        let filteredStickerList = stickerList.filter((sticker, index) => {
          return index != poppedStickerIndex;
        });
        filteredStickerList = [poppedSticker, ...filteredStickerList];

        //construct the query results object
        for (let i = 0; i < filteredStickerList.length; i++) {
          let sticker_file_id = filteredStickerList[i];
          results.push({
            type: "sticker",
            sticker_file_id: sticker_file_id,
            id: generate64ByteString(),
          });
        }

        // send the results to the user
        bot.answerInlineQuery(queryID, results);
      })
      .catch(() => {
        //todo: catch what went wrong here.
      });
  });
}
