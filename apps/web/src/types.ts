export interface ValidResponse extends Record<string, unknown> {
  data: string;
}

export const isValidResponse = (response: Record<string, unknown>): response is ValidResponse => {
  if (typeof response.data == "string") {
    return true;
  }
  return false;
};
