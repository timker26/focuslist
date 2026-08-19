#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("../app.config.ts", import.meta.url),
  "utf8",
);
const match = source.match(/version:\s*["']([^"']+)["']/);

if (!match) {
  throw new Error("Unable to find the Expo version in app.config.ts");
}

process.stdout.write(match[1]);
