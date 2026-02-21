import * as https from "node:https";
import * as http from "node:http";
import * as fsp from "node:fs/promises";
import * as fs from "node:fs";
import * as path from "node:path";
import { isLabelData, isValidEnv } from "./types.js";
import { contentTypeByExtension } from "./commons.js";
import { anatomyPrompt } from "./prompts/anatomy.js";
import { OpenAI } from "openai";
import { HttpResponse } from "./http_response.js";

const openai = new OpenAI();

if (!isValidEnv(process.env)) {
  process.exit(1);
}

export const { KEY_PATH, CERT_PATH, WEB_ROOT, LOCATION_PATH, HOST_NAME, PORT, MAX_BODY_LENGTH } = process.env;

const resolvedWebRoot = path.resolve(WEB_ROOT);
const resolvedLocationPath = path.resolve(LOCATION_PATH);
const apiPath = path.resolve(resolvedLocationPath, "api");
const maxBodyLength = parseInt(Number(MAX_BODY_LENGTH).toString(), 10);

const server = https.createServer({
  key: fs.readFileSync(KEY_PATH),
  cert: fs.readFileSync(CERT_PATH),
});

server.listen(Number.parseInt(PORT, 10), HOST_NAME);

server.on(
  "request",
  (
    req: http.IncomingMessage,
    res: http.ServerResponse & {
      req: http.IncomingMessage;
    }
  ) => {
    try {
      const requestHandler = new RequestHandler(req, res);
      requestHandler.processRequest().catch(requestHandler.processError);
    } catch (err: unknown) {
      res.writeHead(500);
      res.end(http.STATUS_CODES[500]);
      console.error(err);
    }
  }
);

export class RequestHandler {
  private req: http.IncomingMessage;
  private res: http.ServerResponse & {
    req: http.IncomingMessage;
  };
  private resolvedPath: string;
  private url: URL;

  constructor(
    req: http.IncomingMessage,
    res: http.ServerResponse & {
      req: http.IncomingMessage;
    }
  ) {
    this.req = req;
    this.res = res;
    this.url = new URL(this.req.url ?? "/", `http://${HOST_NAME}`); // Check this.
    // `path.resolve` removes trailing slashes.
    // url.pathname is guranteed to have a leading slash.
    this.resolvedPath = path.resolve(resolvedWebRoot, `.${this.url.pathname}`);
    console.log(this.resolvedPath);
  }

  public async processRequest() {
    try {
      if (!this.resolvedPath.startsWith(resolvedWebRoot + path.sep)) {
        throw new HttpResponse(403);
      }

      if (this.resolvedPath.endsWith(resolvedLocationPath)) {
        this.res.writeHead(301, {
          Location: `${this.url.pathname.replace(/\/+$/, "")}/index.html`,
        });
        this.res.end();
        return;
      }

      if (this.req.method == "GET") {
        await this.processGet();
        return;
      }
      if (this.req.method == "POST") {
        await this.processPost();
        return;
      } else {
        throw new HttpResponse(405);
      }
    } catch (err) {
      this.processError(err);
    }
  }

  protected async processGet() {
    let buffer: Buffer;
    try {
      buffer = await fsp.readFile(this.resolvedPath);
    } catch (err: unknown) {
      throw new HttpResponse(404, err);
    }
    const contentType = contentTypeByExtension.get(path.extname(this.resolvedPath)) ?? "application/octet-stream";
    this.res.writeHead(200, { "Content-Type": contentType });
    this.res.end(buffer);
    return;
  }

  protected async processPost() {
    if (!this.resolvedPath.endsWith(apiPath)) {
      throw new HttpResponse(404);
    }

    let body = "";

    for await (const chunk of this.req as AsyncIterable<Buffer>) {
      body += chunk.toString();
      if (body.length > maxBodyLength) {
        throw new HttpResponse(413);
      }
    }

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(body) as Record<string, unknown>;
    } catch (err) {
      throw new HttpResponse(400, err);
    }

    let response: string;
    if (isLabelData(data)) {
      const prompt = anatomyPrompt({
        brandNamePart: data.field["brand-name-part"],
        classPart: data.field["class-part"],
        alcoholContentPart: data.field["alcohol-content-part"],
        netContentsPart: data.field["net-contents-part"],
        governmentWarningPart: data.field["government-warning-part"],
      });

      const images = data.images;

      response = await this.callLLM(prompt, images);
    } else {
      throw new HttpResponse(400);
    }

    if (response) {
      this.res.writeHead(200, { "Content-Type": "application/json" });
      this.res.end(JSON.stringify({ data: response }));
      return;
    } else {
      throw new HttpResponse(500);
    }
  }

  protected async callLLM(prompt: string, images: string[]): Promise<string> {
    const items = images.map<{ type: "input_image"; image_url: string; detail: "auto" }>((value) => {
      return { type: "input_image", image_url: value, detail: "auto" };
    });
    const response = await openai.responses.create({
      model: "gpt-5.2",
      temperature: 0,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: prompt }, ...items],
        },
      ],
    });

    return response.output_text;
  }

  public processError = (err: unknown) => {
    if (err instanceof HttpResponse) {
      this.res.writeHead(err.status, { "Content-Type": "text/plain; charset=utf-8" });
      this.res.end(err.message);
    } else {
      this.res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      this.res.end(http.STATUS_CODES[500]);
    }
    console.error(this.url, err);
  };
}
