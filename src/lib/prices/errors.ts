export class PriceDataError extends Error {
  userMessage: string;

  constructor(userMessage: string, message?: string) {
    super(message ?? userMessage);
    this.name = 'PriceDataError';
    this.userMessage = userMessage;
  }
}
