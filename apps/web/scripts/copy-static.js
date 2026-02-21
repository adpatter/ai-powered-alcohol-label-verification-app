import { mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";

const srcDir = resolve(import.meta.dirname, "../src");
const distDir = resolve(import.meta.dirname, "../dist/ai-powered-alcohol-label-verification-app");

const filesToCopy = ["index.html", "styles.css", "favicon.ico"];

await mkdir(distDir, { recursive: true });

await Promise.all(filesToCopy.map((file) => copyFile(resolve(srcDir, file), resolve(distDir, file))));
