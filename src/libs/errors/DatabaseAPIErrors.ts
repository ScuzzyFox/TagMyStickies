export class DatabaseAPIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseAPIError";
  }
}

export class NotFoundError extends DatabaseAPIError {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends DatabaseAPIError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ServerError extends DatabaseAPIError {
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}

export class UnknownError extends DatabaseAPIError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownError";
  }
}
