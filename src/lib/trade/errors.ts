export class TradeDataError extends Error {
  userMessage: string;

  constructor(userMessage: string, message?: string) {
    super(message ?? userMessage);
    this.name = 'TradeDataError';
    this.userMessage = userMessage;
  }
}
