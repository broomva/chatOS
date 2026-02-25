import type { ListOptions, StorageBackend } from "../backend";

/** In-memory storage backend for tests. */
export class MemoryBackend implements StorageBackend {
  private data = new Map<string, string>();

  async read(path: string): Promise<string | null> {
    return this.data.get(path) ?? null;
  }

  async write(path: string, content: string): Promise<void> {
    this.data.set(path, content);
  }

  async delete(path: string): Promise<void> {
    this.data.delete(path);
  }

  async list(opts: ListOptions): Promise<string[]> {
    const results: string[] = [];
    for (const key of this.data.keys()) {
      if (key.startsWith(opts.prefix)) {
        results.push(key);
        if (opts.limit && results.length >= opts.limit) break;
      }
    }
    return results.sort();
  }

  async exists(path: string): Promise<boolean> {
    return this.data.has(path);
  }

  /** Clear all data (useful between tests). */
  clear(): void {
    this.data.clear();
  }
}
