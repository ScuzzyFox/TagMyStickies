const startResponses = [ // Feel free to think up some more responses! :D (or even edit mine uwu)
  [{message:"Send me a sticker to tag!",time:0}],
  [{message:"OwO, thanks for talking to me!\n\nSend me a sticker and we can get started!",time:0}],
  [{message:"o3o, sup! I was just uhh... nvm. Send me a sticker to get started!",time:0}],
  [
    {message:"Gah! Heck.... One second buddy!...",time:0},
    {message:"...",time:2000},
    {message:"Ok! I'm here! You wanna send me a sticker?",time:4000}
  ],
  [{message:"Oh, you need my assistance? You've got a sticker to show me, right? *wags tail*",time:0}],
  [{message:"You have my undivided attention! I can't wait to see which sticker you'll send me!",time:0}],
  [
    {message:"Hm? You say you have something you'd like to show me~?",time:0},
    {message:"A-ah... r-right, a sticker! Send it here, please, and we'll see what we can do! ;3",time:2000}
  ],
  [{message:"UwU, hewwos! You wanna tag stickers, huh?~ Just send one here!",time:0}],
  [{message:"Need my help? Just send me a sticker, and I'll do my best to assist!",time:0}],
  [
    {message:"I just can't stand being without new stickers... >n<",time:0},
    {message:"Hurry up and show me one of your stickers already! I'm begging you! >~<",time:3000}
  ],
  [{message:"Doesn't a day like today make you want to tag stickers (with the help of your favorite sticker-loving companion)?~ Send me a sticker!",time:0}],
  [{message:"H-hurry up and put it in me already... ~.~",time:0}],
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

        //! I tried to use msg.user.id and got a polling error, suggesting that either the syntax is wrong or my key doesn't allow me to get the user ID.
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