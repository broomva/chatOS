import * as fs from "node:fs";
import * as path from "node:path";
import type { ListOptions, StorageBackend } from "../backend";

/** Filesystem-backed storage rooted at a configurable directory. */
export class LocalStorageBackend implements StorageBackend {
  private rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolve(p: string): string {
    return path.join(this.rootDir, p);
  }

  async read(p: string): Promise<string | null> {
    const full = this.resolve(p);
    try {
      return await fs.promises.readFile(full, "utf-8");
    } catch {
      return null;
    }
  }

  async write(p: string, content: string): Promise<void> {
    const full = this.resolve(p);
    await fs.promises.mkdir(path.dirname(full), { recursive: true });
    await fs.promises.writeFile(full, content, "utf-8");
  }

  async delete(p: string): Promise<void> {
    const full = this.resolve(p);
    try {
      await fs.promises.unlink(full);
    } catch {
      // already gone — no-op
    }
  }

  async list(opts: ListOptions): Promise<string[]> {
    const dir = this.resolve(opts.prefix);
    try {
      const entries = await fs.promises.readdir(dir, { recursive: true });
      const results: string[] = [];
      for (const entry of entries) {
        const rel = `${opts.prefix}${entry}`;
        // Only include files (skip directories)
        const full = this.resolve(rel);
        const stat = await fs.promises.stat(full);
        if (stat.isFile()) {
          results.push(rel);
          if (opts.limit && results.length >= opts.limit) break;
        }
      }
      return results.sort();
    } catch {
      return [];
    }
  }

  async exists(p: string): Promise<boolean> {
    const full = this.resolve(p);
    try {
      await fs.promises.access(full);
      return true;
    } catch {
      return false;
    }
  }
}
