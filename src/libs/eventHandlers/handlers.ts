export function startEventHandlers(bot) {
    bot.onText(/\/start/, (msg) => {
      
        //TODO: add user to the database
        //TODO: save chatID to the database
        // msg.user.id (get the user ID)


        const chatId = msg.chat.id;
        
        const resp = "Semd me a sticker to tag!";
      
        bot.sendMessage(chatId, resp);

      });
}