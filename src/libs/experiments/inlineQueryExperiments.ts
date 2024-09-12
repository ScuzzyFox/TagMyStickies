import TelegramBot, { InlineQueryResult } from "node-telegram-bot-api";

interface JSONPlaceholderPhoto {
  albumId: number;
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
}

function generate64ByteString() {
  const chars = "0123456789abcdef"; // Hexadecimal characters
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

export function setupInlineQueryExperiment(bot: TelegramBot) {
  bot.on("inline_query", (query) => {
    let userID = query.from.id; //can get the user ID
    let queryText = query.query; //can get the text the user typed in
    let queryID = query.id; //need the id to be able to respond to the query

    fetch("https://jsonplaceholder.typicode.com/photos?albumId=1")
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        let results: InlineQueryResult[] = [];

        json.forEach((result: JSONPlaceholderPhoto) => {
          results.push({
            type: "photo",
            photo_url: result.thumbnailUrl,
            thumb_url: result.thumbnailUrl,
            id: generate64ByteString(),
          });
        });

        bot.answerInlineQuery(queryID, results);
      });
  });
}
