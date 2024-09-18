import TelegramBot from "node-telegram-bot-api";

export function setupHelpCommandListener(bot: TelegramBot) {
  //todo: double check the regex functionality
  bot.onText(/\/help/, (msg, match) => {
    const chat = msg.chat.id;
    const text: string = "";
    //todo: respond with the following:
    //what the bot does
    //how to search for stickers in inline mode
    //detail on how to use every command available.
    //the rules for tags (case insensitive, no spaces, certain special characters not allowed.)

    //! Make sure to use markdownv2 to make the message nicely formatted.
    bot.sendMessage(chat, text, { parse_mode: "MarkdownV2" });
  });
}
