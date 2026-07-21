import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = await mkdtemp(path.join(os.tmpdir(), "sterling-consumer-"));

function command(command, args, cwd) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: false,
  });
}

function npmCommand(args, cwd) {
  // npm exposes its CLI path while running package scripts. Calling it through
  // Node avoids Windows shell quoting and works on POSIX too.
  if (process.env.npm_execpath) {
    return command(process.execPath, [process.env.npm_execpath, ...args], cwd);
  }
  if (process.platform === "win32") {
    throw new Error("Run the smoke test through npm so npm_execpath is available on Windows.");
  }
  return command("npm", args, cwd);
}

try {
  const packDir = path.join(work, "pack");
  const consumerDir = path.join(work, "consumer");
  await mkdir(packDir);
  await mkdir(consumerDir);

  const packOutput = npmCommand(["pack", "--json", "--pack-destination", packDir], root);
  // Lifecycle scripts may write build output before npm's JSON payload.
  const jsonStart = packOutput.lastIndexOf("\n[");
  const packed = JSON.parse(packOutput.slice(jsonStart + 1));
  const tarball = path.join(packDir, packed[0].filename);

  await writeFile(path.join(consumerDir, "package.json"), JSON.stringify({
    private: true,
    type: "module",
    dependencies: {
      "@lamatemaga/sterling": `file:${tarball.replaceAll("\\", "/")}`,
      react: `file:${path.join(root, "node_modules", "react").replaceAll("\\", "/")}`,
      "react-dom": `file:${path.join(root, "node_modules", "react-dom").replaceAll("\\", "/")}`,
    },
  }, null, 2));

  // This consumer intentionally resolves Sterling's runtime dependencies as a
  // fresh install would. Do not force --offline: GitHub's restored npm cache
  // may contain package tarballs without every registry metadata response.
  npmCommand(["install", "--ignore-scripts", "--package-lock=false", "--no-audit", "--no-fund"], consumerDir);

  const installed = path.join(consumerDir, "node_modules", "@lamatemaga", "sterling");
  assert.ok(existsSync(path.join(installed, "dist", "index.mjs")), "missing client ESM entry");
  assert.ok(existsSync(path.join(installed, "dist", "server.mjs")), "missing server ESM entry");
  assert.ok(existsSync(path.join(installed, "dist", "editorial.css")), "missing optional editorial stylesheet");
  assert.ok(existsSync(path.join(installed, "assets", "fonts", "Fraunces-SemiBold.ttf")), "missing bundled editorial font");

  const clientEntry = await readFile(path.join(installed, "dist", "index.mjs"), "utf8");
  assert.match(clientEntry, /^"use client";/, "client boundary was not preserved in the public entry");

  const check = [
    'import * as client from "@lamatemaga/sterling";',
    'import * as server from "@lamatemaga/sterling/server";',
    'if (typeof client.SterlingFigure !== "function") throw new Error("client export missing");',
    'if (typeof server.defineSterlingPalette !== "function") throw new Error("server export missing");',
  ].join("\n");
  command(process.execPath, ["--input-type=module", "--eval", check], consumerDir);

  console.log("Sterling packed-consumer smoke test passed.");
} finally {
  await rm(work, { recursive: true, force: true });
}
