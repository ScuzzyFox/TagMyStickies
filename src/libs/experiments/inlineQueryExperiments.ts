import { devLog } from "libs/logging";
import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";

interface JSONPlaceholderPhoto {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

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
 * If the bot is setup for inline mode via botfather (might be able to do it programmatically),
 * then just `@username` the bot in any chat and start typing stuff and you should get a result of placeholder photos.
 *
 * This is meant to demonstrate that.
 *
 * YOU MUST DISABLE THIS EVENT LISTENER ONCE YOU HAVE THE PRODUCTION VERISION OF THIS AS YOU SHOULD ONLY HAVE ONE
 * "inline_query" LISTENER.
 *
 * @param bot The `TelegramBot` handle
 */
export function setupInlineQueryExperiment(bot: TelegramBot) {
  bot.on("inline_query", (query) => {
    let userID = query.from.id; //can get the user ID
    let queryText = query.query; //can get the text the user typed in
    let queryID = query.id; //need the id to be able to respond to the query
    let len: number = 0;
    if (queryText && queryText.length > 0) {
      len = queryText.length;
    }

    len = len > 50 ? 50 : len;
    let url: string = "https://jsonplaceholder.typicode.com/photos?albumId=1";

    // get placeholder photos from the url
    fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json: any[]) => {
        // needs an array of InlineQueryResult
        let results: InlineQueryResult[] = [];

        //just doing random stuff here to get different results depending on what people type.
        json
          .filter((item: JSONPlaceholderPhoto) => {
            return item.id <= len;
          })
          // appending results to the InlineQueryResult array. Needs a unique 64 byte string per result.
          .forEach((result: JSONPlaceholderPhoto) => {
            results.push({
              type: "photo",
              photo_url: result.thumbnailUrl,
              thumb_url: result.thumbnailUrl,
              id: generate64ByteString(),
            });
          });

        // respond to the query using the query id and the results array we just built.
        bot.answerInlineQuery(queryID, results);
      });
  });
}
