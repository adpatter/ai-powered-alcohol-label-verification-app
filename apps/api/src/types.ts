import * as fs from "node:fs";
import * as path from "node:path";

export interface ValidEnv extends NodeJS.ProcessEnv {
  KEY_PATH: string;
  CERT_PATH: string;
  WEB_ROOT: string;
  LOCATION_PATH: string;
  HOST_NAME: string;
  PORT: string;
  OPENAI_API_KEY: string;
  MAX_BODY_LENGTH: string;
}

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export const isValidEnv = (env: NodeJS.ProcessEnv): env is ValidEnv => {
  const issues: string[] = [];

  const mustExist = [
    "KEY_PATH",
    "CERT_PATH",
    "WEB_ROOT",
    "LOCATION_PATH",
    "HOST_NAME",
    "PORT",
    "OPENAI_API_KEY",
    "MAX_BODY_LENGTH",
  ] as const;

  for (const key of mustExist) {
    const value = env[key];
    if (!isNonEmptyString(value)) {
      issues.push(`${key} is missing.`);
      continue;
    }

    if (key === "PORT") {
      const port = Number.parseInt(value, 10);
      if (!Number.isInteger(port) || port <= 0 || port > 65535) {
        issues.push(`${key} is out of range: ${value}`);
      }
    }

    if (key === "MAX_BODY_LENGTH") {
      const max = Number.parseInt(Number(value).toString(), 10);
      if (!Number.isInteger(max) || max <= 0) {
        issues.push(`${key} must be a positive integer: ${value}`);
      }
    }

    if (key === "KEY_PATH" || key === "CERT_PATH") {
      try {
        const stats = fs.statSync(value);
        if (!stats.isFile()) {
          issues.push(`${key} is not a file: ${value}`);
        }
      } catch {
        issues.push(`${key} is inaccessible: ${value}`);
      }
    }

    if (key === "WEB_ROOT") {
      try {
        if (!path.isAbsolute(value)) {
          issues.push(`${key} must be an absolute path: ${value}`);
        } else {
          const stats = fs.statSync(value);
          if (!stats.isDirectory()) {
            issues.push(`${key} is not a directory: ${value}`);
          }
        }
      } catch {
        issues.push(`${key} is inaccessible: ${value}`);
      }
    }

    if (key === "LOCATION_PATH" && !path.isAbsolute(value)) {
      issues.push(`${key} must be an absolute path: ${value}`);
    }
  }

  if (issues.length) {
    console.error(`Fix your environment settings:\n  ${issues.join("\n  ")}`);
    return false;
  }

  return true;
};

export interface LabelData extends Record<string, unknown> {
  anatomy: "anatomy";
  field: {
    "brand-name-part": string;
    "class-part": string;
    "alcohol-content-part": string;
    "net-contents-part": string;
    "government-warning-part": string;
  };
  images: string[];
}

export const isLabelData = (data: Record<string, unknown> | null): data is LabelData => {
  if (typeof data !== "object" || data === null) return false;

  const anatomy = data.anatomy;
  const field = data.field;
  const images = data.images;

  if (anatomy !== "anatomy") return false;
  if (!Array.isArray(images) || !images.every((img) => typeof img === "string")) return false;
  if (typeof field !== "object" || field === null) return false;

  const f = field as Record<string, unknown>;
  return (
    typeof f["brand-name-part"] === "string" &&
    typeof f["class-part"] === "string" &&
    typeof f["alcohol-content-part"] === "string" &&
    typeof f["net-contents-part"] === "string" &&
    typeof f["government-warning-part"] === "string"
  );
};
