import { ButtonActionTooLongError } from "../errors/ButtonActionErrors.js";

export interface ButtonAction {
  mode: number;
  action: string;
}

export function serializeButtonAction(input: ButtonAction): string {
  //check if resulting string is 64 char or less.
  let serialized = JSON.stringify(input).toLowerCase();
  if (serialized.length > 64) {
    throw new ButtonActionTooLongError("Serialized button action is too long.");
  }
  return serialized;
}

export function parseButtonAction(input: string): ButtonAction {
  return JSON.parse(input);
}
