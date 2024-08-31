const startResponses = [ // Feel free to think up some more responses! :D (or even edit mine uwu)
  [{message:"Send me a sticker to tag!",time:0}],
  [{message:"OwO, thanks for talking to me!\n\nSend me a sicker and we can get started!",time:0}],
  [{message:"o3o, sup! I was just uhh... nvm. Send me a sticker to get started!",time:0}],
  [
    {message:"Gah! Heck.... One second buddy!...",time:0},
    {message:"...",time:2000},
    {message:"Ok! I'm here! You wanna send me a sticker?",time:4000}
  ]
];
var startEventHandlerscv1 = {
  responses:{
    avalResp: Array.from({ length: startResponses.length }, (_, i) => i)
  }
};
export function startEventHandlers(bot) {
    bot.onText(/\/start/, (msg) => {
      
        //TODO: add user to the database
        //TODO: save chatID to the database
        //TODO: set the user interaction state to accepting a sticker

        //! I tried to user msg.user.id and get a polling error, suggesting that either the syntax is wrong or my key doesn't allow me to get the user ID.
        // msg.user.id (get the user ID)


        const chatId = msg.chat.id;
        
        // gets the id of a random response!
        if (startEventHandlerscv1.responses.avalResp.length<1) {
          startEventHandlerscv1.responses.avalResp=Array.from({ length: startResponses.length }, (_, i) => i);
        }
        var randomaval = Math.round(Math.random()*(startEventHandlerscv1.responses.avalResp.length-1));
        var randomID = startEventHandlerscv1.responses.avalResp[randomaval];
        startEventHandlerscv1.responses.avalResp.splice(randomaval, 1);
        console.log(randomID, startEventHandlerscv1.responses.avalResp)
        /*while(startEventHandlerscv1.lastStartResp==randomID) {
          var randomID = Math.round(Math.random()*(startResponses.length-1));
        }
        startEventHandlerscv1.lastStartResp = randomID;*/
        
        // sends the responses!
        startResponses[randomID].forEach((a, b) => {
          setTimeout(() => {
            bot.sendMessage(chatId, a.message);
          }, a.time);
        });

      });
}

function getUserState(userID) {
    //TODO: get user state from database from the user's ID
}