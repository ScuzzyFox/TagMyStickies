/**
 * This is the code where we respond to an inline query with a list of stickers.
 * The first sticker in the list should always be a randomly chosen one.
 */

import { filterStickers } from "libs/database/databaseActions.js";
import { FilterStickersInput } from "libs/database/databaseModels.js";
import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";
import { devLog } from "libs/logging.js";
import { parseTagsFromString } from "libs/utilities/parseTagsUtils.js";

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
    let input: FilterStickersInput = { tags: [] }; //necessary for the filterStickers function because I set it up wierd.

    let tagsFromQuery = parseTagsFromString(queryText); //! stole this from defaultMode.ts
    input.tags = tagsFromQuery.tags;

    filterStickers(userID, input)
      .then((stickerList: string[]) => {
        if (stickerList.length === 0) {
          // Handle empty list case
          bot.answerInlineQuery(queryID, []);
          return;
        }
        //pick a random sticker to go to the front of the list
        let poppedStickerIndex: number = Math.floor(
          Math.random() * stickerList.length
        );
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
        bot.answerInlineQuery(queryID, results, {
          cache_time: 30,
          is_personal: true,
        });
      })
      .catch((error) => {
        //todo: catch what went wrong here.
        devLog("Error filtering stickers in inline query listener.", error);
      });
  });
}
