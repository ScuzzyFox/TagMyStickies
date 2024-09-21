export class ButtonActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ButtonActionError";
  }
}

export class ButtonActionTooLongError extends ButtonActionError {
  constructor(message: string) {
    super(message);
    this.name = "ButtonActionTooLongError";
  }
}
