import fs from "node:fs/promises";
import path from "node:path";
import { promptModules } from "../content/effects/prompt-modules";
import {
  defaultParams,
  STACKS,
  VARIANTS,
  type PromptLang,
} from "../content/effects/types";

const LANGS: PromptLang[] = ["zh", "en"];

type ExportRecord = {
  effect: string;
  stack: string;
  variant: string;
  lang: string;
  file: string;
  chars: number;
  tokens: number;
  params: Record<string, number | boolean>;
  /** update this by hand after running the prompt in a real tool */
  status: "pending" | "passed" | "failed";
  tool: string | null;
  model: string | null;
  date: string | null;
};

/**
 * Writes every effect × stack × variant × language prompt to
 * `exports/<slug>/<stack>.<variant>.<lang>.md` plus `exports/index.json`.
 *
 * The markdown file contains the prompt only, so you can open it and copy
 * the whole file into Cursor / Claude Code without editing.
 */
async function main() {
  const root = process.cwd();
  const outDir = path.join(root, "exports");

  await fs.rm(outDir, { recursive: true, force: true });
  await fs.mkdir(outDir, { recursive: true });

  const records: ExportRecord[] = [];

  for (const { spec, buildPrompt } of promptModules) {
    const effectDir = path.join(outDir, spec.slug);
    await fs.mkdir(effectDir, { recursive: true });
    const params = defaultParams(spec);

    for (const stack of STACKS) {
      for (const variant of VARIANTS) {
        for (const lang of LANGS) {
          const prompt = buildPrompt({ params, stack, variant, lang });
          const file = `${stack}.${variant}.${lang}.md`;
          await fs.writeFile(path.join(effectDir, file), prompt + "\n", "utf8");

          records.push({
            effect: spec.slug,
            stack,
            variant,
            lang,
            file: path.posix.join("exports", spec.slug, file),
            chars: prompt.length,
            tokens: Math.round(prompt.length / 3.6),
            params,
            status: "pending",
            tool: null,
            model: null,
            date: null,
          });
        }
      }
    }
  }

  await fs.writeFile(
    path.join(outDir, "index.json"),
    JSON.stringify(records, null, 2) + "\n",
    "utf8",
  );

  const perEffect = promptModules
    .map(({ spec }) => {
      const count = records.filter((record) => record.effect === spec.slug).length;
      return `${spec.slug}: ${count}`;
    })
    .join(" · ");

  console.log(`exported ${records.length} prompts (${perEffect})`);
  console.log(`index: exports/index.json`);
  console.log(
    "next: run each file in Cursor / Claude Code, then flip its status in exports/index.json",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
