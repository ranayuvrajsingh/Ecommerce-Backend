class ErrorHandler extends Error {
  [x: string]: any;
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
export default ErrorHandler;
