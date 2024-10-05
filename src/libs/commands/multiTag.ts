/**
 * This is code related to the command where a user can tag a whole bunch of stickers with the same tags all at once.
 *
 * it will use the /next and /done commands to move between steps
 *
 * first, the user sends the /command
 *
 * the bot responds with a request for stickers
 *
 * the user can then /cancel or hit the cancel button. Or they can send as many stickers as they want
 *
 * when the user is done sending their stickers, they can send /next or hit the next button.
 *
 * The bot will then prompt the user for a list of tags, which can be sent over many messages. the user can still cancel.
 *
 * when done, the bot will notify the user, delete the relevant messages, and put the user back into default mode.
 */

import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";
import {
  ButtonAction,
  parseButtonAction,
  serializeButtonAction,
} from "../utilities/IKBCallbackUtils.js";
import {
  TAG_MULTI_AWAITING_TAGS,
  TAG_MULTI,
  UserState,
  DEFAULT_STATE_CODE,
} from "../database/databaseModels.js";
import {
  fetchUserEntry,
  handleCancel,
  updateUserEntry,
} from "../utilities/transactionalUtilities.js";
import { parseTagsFromString } from "../utilities/parseTagsUtils.js";
import {
  getAStickersTags,
  tagMultipleStickers,
} from "../database/databaseActions.js";
import {
  NotFoundError,
  ServerError,
  ValidationError,
} from "../errors/DatabaseAPIErrors.js";
import { sendRandomHint } from "./hints.js";

const cancelButtonCallbackData: ButtonAction = {
  mode: TAG_MULTI,
  action: "cancel",
};

const nextButtonCallbackData: ButtonAction = {
  mode: TAG_MULTI,
  action: "next",
};

const doneButtonCallbackData: ButtonAction = {
  mode: TAG_MULTI_AWAITING_TAGS,
  action: "done",
};

const kb1: InlineKeyboardButton[][] = [
  [
    {
      text: "Cancel",
      callback_data: serializeButtonAction(cancelButtonCallbackData),
    },
    {
      text: "Next",
      callback_data: serializeButtonAction(nextButtonCallbackData),
    },
  ],
];

const kb2: InlineKeyboardButton[][] = [
  [
    {
      text: "Cancel",
      callback_data: serializeButtonAction(cancelButtonCallbackData),
    },
    {
      text: "Done",
      callback_data: serializeButtonAction(doneButtonCallbackData),
    },
  ],
];

export function setupMultiTag(bot: TelegramBot) {
  bot.onText(/\/multitag/, async (msg, match) => {
    const userEntry = await fetchUserEntry(bot, msg.chat.id, msg.from.id);
    if (!userEntry) {
      return;
    }

    if (JSON.parse(userEntry.status).stateCode != DEFAULT_STATE_CODE) {
      return;
    }

    const text =
      "Hey! This mode allows you to tag a whole bunch of stickers with the same tags all at once.\n\nSend me a bunch of stickers and then hit me with a /next when you're ready to tag them. You can also /cancel if you need to.";
    const sentMessage = await bot.sendMessage(msg.chat.id, text, {
      reply_markup: { inline_keyboard: kb1 },
    });

    const userState: UserState = JSON.parse(userEntry.status);
    userState.stateCode = TAG_MULTI;
    userState.messages_to_delete.push(msg.message_id);
    userState.messages_to_delete.push(sentMessage.message_id);
    userState.stickers = [];
    userState.tags_to_add = [];

    const isSuccess = await updateUserEntry(
      bot,
      userEntry.chat,
      userEntry.user,
      JSON.stringify(userState)
    );

    if (!isSuccess) return;
  });

  bot.on("sticker", async (message, metadata) => {
    const userEntry = await fetchUserEntry(
      bot,
      message.chat.id,
      message.from.id
    );
    if (!userEntry) {
      return;
    }

    if (JSON.parse(userEntry.status).stateCode === TAG_MULTI_AWAITING_TAGS) {
      //put user back into TAG_MULTI mode. send them a message with inline kb1 updating them.
      const userState: UserState = JSON.parse(userEntry.status);
      userState.stateCode = TAG_MULTI;
      userState.stickers.push({
        sticker: message.sticker.file_unique_id,
        file_id: message.sticker.file_id,
        set_name: message.sticker.set_name,
      });
      userState.messages_to_delete.push(message.message_id);

      const msgsnt = await bot.sendMessage(
        userEntry.user,
        "Oop, switching you back to sticker-sending mode! You know the deal with next and cancel.",
        { reply_markup: { inline_keyboard: kb1 } }
      );
      userState.messages_to_delete.push(msgsnt.message_id);
      const isSuccess = await updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
      return;
    }

    if (JSON.parse(userEntry.status).stateCode != TAG_MULTI) {
      return;
    }
    const userState: UserState = JSON.parse(userEntry.status);
    userState.stickers.push({
      set_name: message.sticker.set_name,
      sticker: message.sticker.file_unique_id,
      file_id: message.sticker.file_id,
    });
    userState.messages_to_delete.push(message.message_id);
    const messageDeleteList: number[] = [];
    try {
      const stickersTags = await getAStickersTags(userEntry.user, {
        sticker: message.sticker.file_unique_id,
        set_name: message.sticker.set_name,
        file_id: message.sticker.file_id,
      });
      console.log("stikcers tags", stickersTags);
      const tagListSent = await bot.sendMessage(
        userEntry.chat,
        stickersTags.length > 0
          ? "This Sticker's Tags:\n\n" + stickersTags.join(", ")
          : "This sticker currently has no tags."
      );
      messageDeleteList.push(tagListSent.message_id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        const tagListSent = await bot.sendMessage(
          userEntry.chat,
          "This Sticker's Tags:\n\nNone/Error retrieving"
        );
        messageDeleteList.push(tagListSent.message_id);
      } else {
        return;
      }
    }
    userState.messages_to_delete.push(...messageDeleteList);

    const isSuccess = await updateUserEntry(
      bot,
      userEntry.chat,
      userEntry.user,
      JSON.stringify(userState)
    );

    if (!isSuccess) return;
  });

  bot.on("message", async (message, metadata) => {
    if (!message.text) return;

    const userEntry = await fetchUserEntry(
      bot,
      message.chat.id,
      message.from.id
    );
    if (!userEntry || !userEntry.status) {
      return;
    }
    const userState: UserState = JSON.parse(userEntry.status);
    if (
      userState.stateCode != TAG_MULTI &&
      userState.stateCode != TAG_MULTI_AWAITING_TAGS
    )
      return;
    if (message.text.startsWith("/")) {
      //decipher whether we got /cancel, /next/ or /done
      let myCase: string;
      if (message.text.toLowerCase().includes("cancel")) {
        myCase = "cancel";
      } else if (message.text.toLowerCase().includes("next")) {
        myCase = "next";
      } else if (message.text.toLowerCase().includes("done")) {
        myCase = "done";
      } else {
        return;
      }

      switch (myCase) {
        case "cancel":
          userState.stateCode = DEFAULT_STATE_CODE;
          userState.messages_to_delete.push(message.message_id);
          const isSuccess = await updateUserEntry(
            bot,
            userEntry.chat,
            userEntry.user,
            JSON.stringify(userState)
          );
          if (!isSuccess) return;
          handleCancel(
            bot,
            message.chat.id,
            message.from.id,
            "Okay, canceling what we've done so far!"
          );
          break;
        case "next":
          if (userState.stateCode == TAG_MULTI_AWAITING_TAGS) return;
          if (userState.stickers.length == 0) {
            const anothermsg = await bot.sendMessage(
              message.chat.id,
              "You need to send me at least one sticker before you can continue!"
            );
            userState.messages_to_delete.push(anothermsg.message_id);
            userState.messages_to_delete.push(message.message_id);
            const isSuccess = await updateUserEntry(
              bot,
              userEntry.chat,
              userEntry.user,
              JSON.stringify(userState)
            );
            return;
          }
          userState.stateCode = TAG_MULTI_AWAITING_TAGS;
          userState.messages_to_delete.push(message.message_id);
          const nextMessageSent = await bot.sendMessage(
            message.chat.id,
            "Great! Now send me a list of tags, space or comma-separated, within a single or multiple messages. When you're done, send /done or hit Done. You can also /cancel if you need to.",
            { reply_markup: { inline_keyboard: kb2 } }
          );
          userState.messages_to_delete.push(nextMessageSent.message_id);
          const isSuccess2 = await updateUserEntry(
            bot,
            userEntry.chat,
            userEntry.user,
            JSON.stringify(userState)
          );
          if (!isSuccess2) return;
          break;
        case "done":
          if (userState.stateCode != TAG_MULTI_AWAITING_TAGS) return;
          if (userState.tags_to_add.length == 0) {
            const anothermsg = await bot.sendMessage(
              message.chat.id,
              "You need to send me at least one tag before you can continue!"
            );
            userState.messages_to_delete.push(anothermsg.message_id);
            userState.messages_to_delete.push(message.message_id);
            const isSuccess = await updateUserEntry(
              bot,
              userEntry.chat,
              userEntry.user,
              JSON.stringify(userState)
            );
            return;
          }
          try {
            await tagMultipleStickers(
              userEntry.user,
              userState.stickers,
              userState.tags_to_add
            );
          } catch (e) {
            if (e instanceof NotFoundError) {
              bot.sendMessage(message.chat.id, e.message);
            } else if (e instanceof ServerError) {
              bot.sendMessage(
                message.chat.id,
                "Sorry, there was a critical server error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
              );
            } else if (e instanceof ValidationError) {
              bot.sendMessage(
                message.chat.id,
                "Sorry, there was a validation error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
              );
            }
            return;
          }

          userState.stateCode = DEFAULT_STATE_CODE;
          userState.messages_to_delete.push(message.message_id);
          const messageList = [...userState.messages_to_delete];
          userState.messages_to_delete = [];
          const isSuccess3 = await updateUserEntry(
            bot,
            userEntry.chat,
            userEntry.user,
            JSON.stringify(userState)
          );
          if (!isSuccess3) return;
          messageList.forEach((id) => {
            bot.deleteMessage(message.chat.id, id);
          });

          const messageSent = await bot.sendMessage(
            message.chat.id,
            "Awesome, all those stickers have now been tagged! send /multitag to tag more, or any other command!"
          );
          sendRandomHint(bot, message.chat.id);
          userState.messages_to_delete.push(messageSent.message_id);
          const isSuccess4 = await updateUserEntry(
            bot,
            userEntry.chat,
            userEntry.user,
            JSON.stringify(userState)
          );
          break;
      }
    } else {
      //probably a set of tags. let's make sure we're in the right mode.
      if (userState.stateCode != TAG_MULTI_AWAITING_TAGS) {
        const nmsg = await bot.sendMessage(
          message.chat.id,
          "Woah, I'm not ready for tags yet (if that's what you're trying to do, I can't tell).\n\nSend /next or hit Next when you're done sending stickers and ready to send some tags.",
          { reply_markup: { inline_keyboard: kb1 } }
        );
        userState.messages_to_delete.push(nmsg.message_id);
        userState.messages_to_delete.push(message.message_id);
        const isSuccess = await updateUserEntry(
          bot,
          userEntry.chat,
          userEntry.user,
          JSON.stringify(userState)
        );
        return;
      }
      let tags = parseTagsFromString(message.text).tags;
      userState.tags_to_add.push(...tags);
      userState.messages_to_delete.push(message.message_id);
      const isSuccess = await updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
      if (!isSuccess) return;
    }
  });

  bot.on("callback_query", async (query) => {
    //todo: delete message and/or inline keyboard after responding.
    //todo separate next, cancel, and done into helper functions.
    const user = query.from.id;
    const chat = query.message.chat.id;
    const callbackData = parseButtonAction(query.data);
    const userEntry = await fetchUserEntry(bot, chat, user);
    if (!userEntry) return;
    const userState: UserState = JSON.parse(userEntry.status);

    if (
      callbackData.mode === TAG_MULTI &&
      callbackData.action === "cancel" &&
      (userState.stateCode === TAG_MULTI ||
        userState.stateCode === TAG_MULTI_AWAITING_TAGS)
    ) {
      bot.answerCallbackQuery(query.id);
      await handleCancel(
        bot,
        user,
        chat,
        "Okay, canceling what we've done so far!"
      );
    } else if (
      callbackData.mode === TAG_MULTI &&
      callbackData.action === "next" &&
      userState.stateCode === TAG_MULTI
    ) {
      bot.answerCallbackQuery(query.id);
      if (userState.stickers.length == 0) {
        const anothermsg = await bot.sendMessage(
          userEntry.chat,
          "You need to send me at least one sticker before you can continue!"
        );
        userState.messages_to_delete.push(anothermsg.message_id);
        const isSuccess = await updateUserEntry(
          bot,
          userEntry.chat,
          userEntry.user,
          JSON.stringify(userState)
        );
        return;
      }
      userState.stateCode = TAG_MULTI_AWAITING_TAGS;
      const nextMessageSent = await bot.sendMessage(
        userEntry.chat,
        "Great! Now send me a list of tags, space or comma-separated, within a single or multiple messages. When you're done, send /done or hit Done. You can also /cancel if you need to.",
        { reply_markup: { inline_keyboard: kb2 } }
      );
      userState.messages_to_delete.push(nextMessageSent.message_id);
      const isSuccess2 = await updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
      if (!isSuccess2) return;
    } else if (
      callbackData.mode == TAG_MULTI_AWAITING_TAGS &&
      callbackData.action === "done" &&
      userState.stateCode === TAG_MULTI_AWAITING_TAGS
    ) {
      bot.answerCallbackQuery(query.id);
      if (userState.tags_to_add.length == 0) {
        const anothermsg = await bot.sendMessage(
          userEntry.chat,
          "You need to send me at least one tag before you can continue!"
        );
        userState.messages_to_delete.push(anothermsg.message_id);
        const isSuccess = await updateUserEntry(
          bot,
          userEntry.chat,
          userEntry.user,
          JSON.stringify(userState)
        );
        return;
      }
      try {
        await tagMultipleStickers(
          userEntry.user,
          userState.stickers,
          userState.tags_to_add
        );
      } catch (e) {
        if (e instanceof NotFoundError) {
          bot.sendMessage(userEntry.chat, e.message);
        } else if (e instanceof ServerError) {
          bot.sendMessage(
            userEntry.chat,
            "Sorry, there was a critical server error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
          );
        } else if (e instanceof ValidationError) {
          bot.sendMessage(
            userEntry.chat,
            "Sorry, there was a validation error when I tried to save your tags. If this persists, please reach out to @scuzzyfox. You might have to send /cancel"
          );
        }
        return;
      }

      userState.stateCode = DEFAULT_STATE_CODE;
      const messageList = [...userState.messages_to_delete];
      userState.messages_to_delete = [];
      const isSuccess3 = await updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
      if (!isSuccess3) return;
      messageList.forEach((id) => {
        bot.deleteMessage(userEntry.chat, id);
      });

      const messageSent = await bot.sendMessage(
        userEntry.chat,
        "Awesome, all those stickers have now been tagged! send /multitag to tag more, or any other command!"
      );
      sendRandomHint(bot, userEntry.chat);
      userState.messages_to_delete.push(messageSent.message_id);
      const isSuccess4 = await updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
    }
  });
}
