import { ApplicationError } from "./application-error";

export class NotFoundError extends ApplicationError {
  constructor(message: string, code: string = "NOT_FOUND") {
    super(message, code);
  }
}
