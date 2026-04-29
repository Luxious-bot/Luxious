#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";

const TOKEN = process.env.GITHUB_TOKEN;
const OWNER = process.env.GH_OWNER ?? "Luxious-bot";
const REPO = process.env.GH_REPO ?? "Luxious";
const BRANCH = process.env.GH_BRANCH ?? "main";
const COMMIT_MESSAGE =
  process.env.GH_MESSAGE ??
  "Initial commit: Luxious autonomous decision-maker Telegram bot";
const ROOT = process.cwd();

if (!TOKEN) {
  console.error("GITHUB_TOKEN env var is required");
  process.exit(1);
}

const API = "https://api.github.com";
const headers = {
  Authorization: `token ${TOKEN}`,
  Accept: "application/vnd.github+json",
  "User-Agent": "luxious-replit-pusher",
};

async function gh(method, p, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { ...headers, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${p} -> ${res.status} ${res.statusText}\n${text}`);
  }
  return text ? JSON.parse(text) : {};
}

console.log(`Checking repository state...`);
let repoIsEmpty = false;
try {
  await gh("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
} catch (err) {
  const msg = String(err);
  if (msg.includes("404") || msg.includes("Git Repository is empty")) {
    repoIsEmpty = true;
  } else {
    throw err;
  }
}

if (repoIsEmpty) {
  console.log(`Repository is empty. Creating initial commit on '${BRANCH}'...`);
  await gh("PUT", `/repos/${OWNER}/${REPO}/contents/.gitkeep`, {
    message: "chore: initialize repository",
    content: Buffer.from("").toString("base64"),
    branch: BRANCH,
  });
}

console.log(`Listing files via git ls-files (respects .gitignore)...`);
const filesRaw = execSync("git ls-files --cached --others --exclude-standard", {
  cwd: ROOT,
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
});
const files = filesRaw.split("\n").map((s) => s.trim()).filter(Boolean);
console.log(`Found ${files.length} files.`);

console.log(`Creating blobs...`);
const treeEntries = [];
let i = 0;
const concurrency = 8;
async function worker(queue) {
  while (queue.length) {
    const file = queue.shift();
    if (file === undefined) break;
    const abs = path.join(ROOT, file);
    let stat;
    try {
      stat = await fs.lstat(abs);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink() || !stat.isFile()) continue;
    const data = await fs.readFile(abs);
    const blob = await gh("POST", `/repos/${OWNER}/${REPO}/git/blobs`, {
      content: data.toString("base64"),
      encoding: "base64",
    });
    treeEntries.push({
      path: file,
      mode: stat.mode & 0o111 ? "100755" : "100644",
      type: "blob",
      sha: blob.sha,
    });
    i++;
    if (i % 25 === 0) console.log(`  ${i}/${files.length} blobs created`);
  }
}
const queue = [...files];
await Promise.all(
  Array.from({ length: concurrency }, () => worker(queue)),
);
console.log(`All ${treeEntries.length} blobs ready.`);

console.log(`Resolving branch state...`);
let parents = [];
let baseTree;
try {
  const ref = await gh("GET", `/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
  parents = [ref.object.sha];
  const parentCommit = await gh(
    "GET",
    `/repos/${OWNER}/${REPO}/git/commits/${ref.object.sha}`,
  );
  baseTree = parentCommit.tree.sha;
  console.log(`  Branch '${BRANCH}' exists at ${ref.object.sha}; using as parent.`);
} catch (err) {
  if (String(err).includes("404")) {
    console.log(`  Branch '${BRANCH}' does not exist; creating fresh.`);
  } else {
    throw err;
  }
}

console.log(`Creating tree...`);
const treePayload = { tree: treeEntries };
if (baseTree) treePayload.base_tree = baseTree;
const tree = await gh("POST", `/repos/${OWNER}/${REPO}/git/trees`, treePayload);

console.log(`Creating commit...`);
const commit = await gh("POST", `/repos/${OWNER}/${REPO}/git/commits`, {
  message: COMMIT_MESSAGE,
  tree: tree.sha,
  parents,
});

console.log(`Updating ref refs/heads/${BRANCH}...`);
try {
  await gh("PATCH", `/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    sha: commit.sha,
    force: false,
  });
} catch (err) {
  if (String(err).includes("Reference does not exist")) {
    await gh("POST", `/repos/${OWNER}/${REPO}/git/refs`, {
      ref: `refs/heads/${BRANCH}`,
      sha: commit.sha,
    });
  } else {
    throw err;
  }
}

console.log(`\n✔ Pushed ${treeEntries.length} files as commit ${commit.sha}`);
console.log(`  https://github.com/${OWNER}/${REPO}/tree/${BRANCH}`);
