import * as http from "node:http";

export class HttpResponse extends Error {
  public status: number;
  public err: unknown;
  constructor(status: number, err?: unknown) {
    super(`${status.toString()} (${http.STATUS_CODES[status] ?? "Error"})`);
    this.status = status;
    this.err = err;
  }
}
