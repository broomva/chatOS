import { $ } from "bun";

// Clean dist before building
const { rmSync } = await import("node:fs");
try {
  rmSync("dist", { recursive: true });
} catch {}

// Bundle everything into one file, targeting Bun runtime.
// Externalize packages with native bindings — they'll be installed at `bunx` time.
const result = await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "bun",
  minify: true,
  external: ["@mariozechner/pi-tui", "koffi"],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

// Rename output to cli.js and prepend shebang for CLI execution
const outputFile = result.outputs[0];
const bundle = await outputFile.text();
await Bun.write("dist/cli.js", `#!/usr/bin/env bun\n${bundle}`);

// Clean up the default output if it differs from cli.js
if (outputFile.path !== `${process.cwd()}/dist/cli.js`) {
  const { unlinkSync } = await import("node:fs");
  try {
    unlinkSync(outputFile.path);
  } catch {}
}

// Make executable
await $`chmod +x dist/cli.js`;

console.log("Built dist/cli.js");
