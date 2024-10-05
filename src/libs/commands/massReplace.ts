/**
 * Code related to doing a mass tag replacement!
 */

import TelegramBot, { InlineKeyboardButton } from "node-telegram-bot-api";
import {
  DEFAULT_STATE_CODE,
  MASS_TAG_REPLACE,
  MASS_TAG_REPLACE_AWAITING_ADD_TAGS,
  MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS,
  Stkr,
  UserEntry,
  UserState,
} from "../database/databaseModels.js";
import {
  fetchUserEntry,
  updateUserEntry,
} from "../utilities/transactionalUtilities.js";
import {
  ButtonAction,
  parseButtonAction,
  serializeButtonAction,
} from "../utilities/IKBCallbackUtils.js";
import {
  getAStickersTags,
  massTagReplace,
} from "../database/databaseActions.js";
import {
  NotFoundError,
  ServerError,
  ValidationError,
} from "../errors/DatabaseAPIErrors.js";
import { parseTagsFromString } from "../utilities/parseTagsUtils.js";
import { md } from "@vlad-yakovlev/telegram-md";
import { sendRandomHint } from "./hints.js";

const cancelButtonCallbackData: ButtonAction = {
  mode: MASS_TAG_REPLACE,
  action: "cancel",
};

const nextButtonCallbackData: ButtonAction = {
  mode: MASS_TAG_REPLACE,
  action: "next",
};

const doneButtonCallbackData: ButtonAction = {
  mode: MASS_TAG_REPLACE_AWAITING_ADD_TAGS,
  action: "done",
};

const kbEntry: InlineKeyboardButton[][] = [
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

const kbDone: InlineKeyboardButton[][] = [
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

/**
 * Handle the entry into the mass tag replace mode. This will send a message to the user asking for stickers to affect and then set the user state to MASS_TAG_REPLACE
 *
 * @param bot The telegram bot instance
 * @param userEntry The user entry to update
 * @param messagesToDelete Add to the list of message id's that will be deleted after the process is complete.
 */
async function handleEntry(
  bot: TelegramBot,
  userEntry: UserEntry,
  messagesToDelete: number[]
) {
  // set mode to mass tag replace
  const userState: UserState = JSON.parse(userEntry.status);
  userState.stateCode = MASS_TAG_REPLACE;
  userState.stickers = [];
  userState.tags_to_add = [];
  userState.tags_to_remove = [];

  const msgSent = await bot.sendMessage(
    userEntry.chat,
    md.build(
      "Alright, this mode allows you to do a lot at once! You can send me a bunch of stickers, then remove "
    ) +
      md.bold("and") +
      md.build(
        " add tags from all those stickers :3\n\nTo start, send me the stickers you want to work with. Along the way, I'll send you the tags your stickers currently have (if any).\n\nSend /next or hit the Next button when you're ready. You can also /cancel the process if you need.\n\n(BTW, it doesn't matter if a particular sticker doesn't exist or if you remove a tag that doesn't exist or if you try to add a tag that already exists, I'll handle it!)"
      ),
    {
      reply_markup: { inline_keyboard: kbEntry },
      parse_mode: "MarkdownV2",
    }
  );

  userState.messages_to_delete.push(msgSent.message_id);
  if (messagesToDelete.length > 0)
    userState.messages_to_delete.push(...messagesToDelete);

  updateUserEntry(
    bot,
    userEntry.chat,
    userEntry.user,
    JSON.stringify(userState)
  );
}

/**
 * Handle the sticker received event. This will add the sticker to the list of stickers to affect and update the user state accordingly.
 *
 * @param bot The telegram bot instance
 * @param userEntry The user entry to update
 * @param sticker the sticker file id that was received
 * @param messagesToDelete Add to the list of message id's that will be deleted after the process is complete.
 *
 */
async function handleStickerReceived(
  bot: TelegramBot,
  userEntry: UserEntry,
  sticker: Stkr,
  messagesToDelete: number[]
) {
  const userState: UserState = JSON.parse(userEntry.status);
  userState.stickers.push(sticker);
  userState.messages_to_delete.push(...messagesToDelete);
  updateUserEntry(
    bot,
    userEntry.chat,
    userEntry.user,
    JSON.stringify(userState)
  );
}

/**
 * Handle the next event. This will update the user state accordingly and send a message to the user asking for the tags to remove or add.
 *
 * @param bot The telegram bot instance
 * @param userEntry The user entry to update
 * @param messagesToDelete Add to the list of message id's that will be deleted after the process is complete.
 */
async function handleNext(
  bot: TelegramBot,
  userEntry: UserEntry,
  messagesToDelete: number[]
) {
  const userState: UserState = JSON.parse(userEntry.status);
  if (userState.stateCode === MASS_TAG_REPLACE) {
    if (userState.stickers.length == 0) {
      const sentmsg = await bot.sendMessage(
        userEntry.chat,
        "You need to send me at least one sticker to continue!",
        {
          reply_markup: { inline_keyboard: kbEntry },
        }
      );
      userState.messages_to_delete.push(sentmsg.message_id);
    } else {
      userState.stateCode = MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS;
      const sentmsg = await bot.sendMessage(
        userEntry.chat,
        "Okay, now send me the tags you want to remove from those stickers. Hit Next or send /next when you're ready for the next step (or /cancel if you need to).\n\nFYI, you can send your tags in one or more messages; remember the tag rules :) Don't send anything if you don't want to remove any tags!",
        {
          reply_markup: { inline_keyboard: kbEntry },
        }
      );
      userState.messages_to_delete.push(sentmsg.message_id);
    }
  } else if (userState.stateCode === MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS) {
    let text =
      "Woo! Now send me the tags you want to add to those stickers. Hit Done or send /done when you're finished (or /cancel if you need to).\n\nFYI, you can send your tags in one or more messages; remember the tag rules :) Don't send anything if you don't want to add any tags!";

    if (userState.tags_to_remove.length == 0) {
      text =
        "I see you're not removing any tags from these stickers. Now send me the tags you want to add to those stickers. Hit Done or send /done when you're finished (or /cancel if you need to).\n\nFYI, you can send your tags in one or more messages; remember the tag rules :) Don't send anything if you don't want to add any tags!";
    }
    userState.stateCode = MASS_TAG_REPLACE_AWAITING_ADD_TAGS;
    const sentmsg = await bot.sendMessage(userEntry.chat, text, {
      reply_markup: { inline_keyboard: kbDone },
    });
    userState.messages_to_delete.push(sentmsg.message_id);
  }

  userState.messages_to_delete.push(...messagesToDelete);

  updateUserEntry(
    bot,
    userEntry.chat,
    userEntry.user,
    JSON.stringify(userState)
  );
}

async function handleDone(
  bot: TelegramBot,
  userEntry: UserEntry,
  messagesToDelete: number[]
) {
  const userState: UserState = JSON.parse(userEntry.status);
  userState.stateCode = DEFAULT_STATE_CODE;
  userState.messages_to_delete.push(...messagesToDelete);

  try {
    massTagReplace(
      userEntry.user,
      userState.stickers,
      userState.tags_to_remove,
      userState.tags_to_add
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      bot.sendMessage(
        userEntry.chat,
        "Hey sorry, I don't recognize you. Did you delete your data, or perhaps you're new? Try sending /start and then try again!"
      );
    } else if (error instanceof ValidationError) {
      bot.sendMessage(
        userEntry.chat,
        "Sorry, there was an issue with your input. Are all your tags valid?"
      );
    } else if (error instanceof ServerError) {
      bot.sendMessage(
        userEntry.chat,
        "I ran into a server error when trying to push your update. You may need to /cancel. Contact @scuzzyfox if this issue persists."
      );
    } else {
      bot.sendMessage(
        userEntry.chat,
        "Some unknown error occurred. You may need to send /cancel. Contact @scuzzyfox if this issue persists."
      );
    }
    return;
  }

  const messageList = [...userState.messages_to_delete];

  messageList.forEach((msg) => {
    bot.deleteMessage(userEntry.chat, msg);
  });

  let text =
    "Sweeeeet, your stickers are updated! Ready for more work if you are!";
  if (userState.tags_to_add.length == 0) {
    text =
      "You've chosen not to add any tags, but I updated the rest of your stickers' changes!";
  }
  const msgsent = await bot.sendMessage(userEntry.chat, text);
  userState.messages_to_delete = [];
  userState.messages_to_delete.push(msgsent.message_id);
  userState.singleSticker = null;
  userState.stickers = [];
  userState.tags_to_add = [];
  userState.tags_to_remove = [];

  userState.messages_to_delete.push(
    (await sendRandomHint(bot, userEntry.chat)).message_id
  );

  updateUserEntry(
    bot,
    userEntry.chat,
    userEntry.user,
    JSON.stringify(userState)
  );
}

async function handleCancel(
  bot: TelegramBot,
  userEntry: UserEntry,
  message: string,
  messagesToDelete: number[]
) {
  let userState: UserState = JSON.parse(userEntry.status);
  if (userState.messages_to_delete && userState.messages_to_delete.length > 0) {
    userState.messages_to_delete.forEach((messageId) => {
      bot.deleteMessage(userEntry.chat, messageId);
    });
  }

  userState.stateCode = DEFAULT_STATE_CODE;
  userState.messages_to_delete.push(...messagesToDelete);
  const messageList = [...userState.messages_to_delete];
  userState.messages_to_delete = [];
  userState.singleSticker = null;
  userState.stickers = [];
  userState.tags_to_add = [];
  userState.tags_to_remove = [];

  const sentmsg = await bot.sendMessage(userEntry.chat, message);
  userState.messages_to_delete.push(sentmsg.message_id);
  updateUserEntry(
    bot,
    userEntry.chat,
    userEntry.user,
    JSON.stringify(userState)
  );
}

export function setupMassReplace(bot: TelegramBot) {
  bot.onText(/\/massreplace/, async (msg) => {
    const userEntry = await fetchUserEntry(bot, msg.chat.id, msg.from.id);
    const userState: UserState = JSON.parse(userEntry.status);
    if (userState.stateCode != DEFAULT_STATE_CODE) {
      return;
    }
    handleEntry(bot, userEntry, [msg.message_id]);
  });

  bot.on("sticker", async (message, metadata) => {
    const messageDeleteList = [message.message_id];
    const userEntry = await fetchUserEntry(
      bot,
      message.chat.id,
      message.from.id
    );
    const userState: UserState = JSON.parse(userEntry.status);
    if (
      userState.stateCode != MASS_TAG_REPLACE &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_ADD_TAGS &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS
    ) {
      return;
    }
    try {
      const stickersTags = await getAStickersTags(userEntry.user, {
        file_id: message.sticker.file_id,
        sticker: message.sticker.file_unique_id,
        set_name: message.sticker.set_name,
      });
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
    if (
      userState.stateCode === MASS_TAG_REPLACE_AWAITING_ADD_TAGS ||
      userState.stateCode === MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS
    ) {
      const msgsent = await bot.sendMessage(
        userEntry.chat,
        "Oop, I was expecting some tags but I can go ahead and add that sticker to the list, you rebel!"
      );
      messageDeleteList.push(msgsent.message_id);
    }

    handleStickerReceived(
      bot,
      userEntry,
      {
        file_id: message.sticker.file_id,
        sticker: message.sticker.file_unique_id,
        set_name: message.sticker.set_name,
      },
      messageDeleteList
    );
  });

  bot.on("message", async (message, metadata) => {
    if (!message.text) {
      return;
    }
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
      userState.stateCode != MASS_TAG_REPLACE &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_ADD_TAGS
    ) {
      return;
    }

    if (message.text.startsWith("/")) {
      if (message.text.toLowerCase().includes("next")) {
        handleNext(bot, userEntry, [message.message_id]);
      } else if (message.text.toLowerCase().includes("done")) {
        handleDone(bot, userEntry, [message.message_id]);
      } else if (message.text.toLowerCase().includes("cancel")) {
        handleCancel(bot, userEntry, "Mass tag replace cancelled.", [
          message.message_id,
        ]);
      }
    } else {
      //we probably got a tag list at this point
      if (userState.stateCode === MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS) {
        userState.tags_to_remove = parseTagsFromString(message.text).tags;
      } else {
        userState.tags_to_add = parseTagsFromString(message.text).tags;
      }
      userState.messages_to_delete.push(message.message_id);
      updateUserEntry(
        bot,
        userEntry.chat,
        userEntry.user,
        JSON.stringify(userState)
      );
    }
  });

  bot.on("callback_query", async (query) => {
    const userEntry = await fetchUserEntry(
      bot,
      query.message.chat.id,
      query.from.id
    );
    const userState: UserState = JSON.parse(userEntry.status);
    if (
      userState.stateCode != MASS_TAG_REPLACE &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS &&
      userState.stateCode != MASS_TAG_REPLACE_AWAITING_ADD_TAGS
    ) {
      return;
    }
    bot.answerCallbackQuery(query.id);
    const parsedQueryData = parseButtonAction(query.data);

    if (
      parsedQueryData.mode != MASS_TAG_REPLACE &&
      parsedQueryData.mode != MASS_TAG_REPLACE_AWAITING_ADD_TAGS &&
      parsedQueryData.mode != MASS_TAG_REPLACE_AWAITING_REMOVE_TAGS
    ) {
      return;
    }

    if (
      parsedQueryData.action == "cancel" &&
      parsedQueryData.mode == MASS_TAG_REPLACE
    ) {
      handleCancel(bot, userEntry, "OK, canceling mass tag replace.", []);
    }
    if (
      parsedQueryData.action == "next" &&
      parsedQueryData.mode == MASS_TAG_REPLACE
    ) {
      handleNext(bot, userEntry, []);
    }
    if (
      parsedQueryData.action == "done" &&
      parsedQueryData.mode == MASS_TAG_REPLACE_AWAITING_ADD_TAGS
    ) {
      handleDone(bot, userEntry, []);
    }
  });
}
