class BotShortDescriptionLengthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "BotShortDescriptionLengthError";
  }

  speak() {
    return "The bot's short description is too long.";
  }
}

class BotDescriptionLengthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "BotDescriptionLengthError";
  }
  speak() {
    return "The bot's description is too long.";
  }
}

class BotNameLengthError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "BotNameLengthError";
  }
  speak() {
    return "The bot's name is too long.";
  }
}
