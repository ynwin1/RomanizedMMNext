import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const SOURCE_DIRS = ["app", "modules", "integrations", "infrastructure", "shared"]
  .map((directory) => join(ROOT, directory));

const forbidden = [
  {
    pattern: /@\/app\/model\/(Song|Artist|SongRequest|TriviaScore|CountryStat)(?:["'])/,
    message: "Use the domain module service instead of a legacy app/model import.",
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

for (const directory of SOURCE_DIRS) {
  for (const file of await walk(directory)) {
    const source = await readFile(file, "utf8");
    const filePath = relative(ROOT, file);

    if (/@\/app\/lib\/mongodb(?:["'])/.test(source)) {
      violations.push({
        file: filePath,
        message: "Use infrastructure/database/mongodb directly; the legacy app/lib database shim is removed.",
      });
    }

    if (
      filePath.startsWith("modules/") &&
      /(?:["']@\/app\/|["'](?:\.\.\/)+app\/)/.test(source)
    ) {
      violations.push({
        file: filePath,
        message: "Domain modules must not depend on app code; move shared/domain ownership into the module.",
      });
    }

    if (
      /^modules\/[^/]+\/application\//.test(filePath) &&
      /from\s+["'](?:\.\.\/infrastructure\/|@\/modules\/[^"']+\/infrastructure\/)/.test(source)
    ) {
      violations.push({
        file: filePath,
        message: "Application code must depend on application/domain contracts, not infrastructure.",
      });
    }

    for (const match of source.matchAll(/@\/modules\/([^/"']+)\/infrastructure\//g)) {
      const importedModule = match[1];
      if (!filePath.startsWith(`modules/${importedModule}/infrastructure/`)) {
        violations.push({
          file: filePath,
          message: `Do not import ${importedModule} infrastructure outside that module; use its public/application contract.`,
        });
      }
    }

    if (
      filePath.startsWith("app/admin/") &&
      /^\s*["']use server["'];/m.test(source) &&
      !/(?:await\s+requireAdmin\s*\(|authorize\s*:\s*requireAdmin\b)/.test(source)
    ) {
      violations.push({
        file: filePath,
        message: "Admin server actions must explicitly authorize with requireAdmin; layout protection is not sufficient for callable actions.",
      });
    }

    if (
      /^app\/admin\/.*\/route\.(?:ts|js)$/.test(filePath) &&
      !/requireAdmin\s*\(/.test(source)
    ) {
      violations.push({
        file: filePath,
        message: "Admin route handlers must explicitly call requireAdmin.",
      });
    }

    if (filePath !== "infrastructure/logging/logger.ts" && /\bconsole\.(?:log|info|warn|error|debug)\s*\(/.test(source)) {
      violations.push({
        file: filePath,
        message: "Use infrastructure/logging/logger instead of console.*.",
      });
    }
  }
}

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
