export class TradeDataError extends Error {
  constructor(public userMessage: string, message?: string) {
    super(message ?? userMessage);
    this.name = 'TradeDataError';
  }
}
