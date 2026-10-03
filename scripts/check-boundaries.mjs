import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");

const forbidden = [
  {
    pattern: /@\/app\/model\/(Song|Artist|SongRequest|TriviaScore)(?:["'])/,
    message: "Use the domain module service instead of a legacy app/model import.",
  },
  {
    pattern: /@\/modules\/(songs|artists|requests|trivia)\/infrastructure\//,
    message: "App code must not import module infrastructure directly; use the module public API.",
  },
];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(path));
    } else if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

const violations = [];

for (const file of await walk(APP_DIR)) {
  const source = await readFile(file, "utf8");

  for (const rule of forbidden) {
    if (rule.pattern.test(source)) {
      violations.push({
        file: relative(ROOT, file),
        message: rule.message,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("Module boundary violations found:\n");

  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.message}`);
  }

  process.exit(1);
}

console.log("Module boundaries OK.");
