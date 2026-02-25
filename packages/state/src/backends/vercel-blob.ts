import * as blob from "@vercel/blob";
import type { ListOptions, StorageBackend } from "../backend";

/** Vercel Blob storage backend for production deployments. */
export class VercelBlobBackend implements StorageBackend {
  private prefix: string;

  constructor(prefix = ".agent/") {
    this.prefix = prefix;
  }

  private key(path: string): string {
    return `${this.prefix}${path}`;
  }

  async read(path: string): Promise<string | null> {
    try {
      const response = await fetch(this.key(path));
      if (!response.ok) return null;
      return await response.text();
    } catch {
      return null;
    }
  }

  async write(path: string, content: string): Promise<void> {
    await blob.put(this.key(path), content, { access: "public", addRandomSuffix: false });
  }

  async delete(path: string): Promise<void> {
    try {
      await blob.del(this.key(path));
    } catch {
      // already gone — no-op
    }
  }

  async list(opts: ListOptions): Promise<string[]> {
    const fullPrefix = `${this.prefix}${opts.prefix}`;
    const result = await blob.list({ prefix: fullPrefix, limit: opts.limit ?? 1000 });
    return result.blobs.map((b) => b.pathname.slice(this.prefix.length));
  }

  async exists(path: string): Promise<boolean> {
    const content = await this.read(path);
    return content !== null;
  }
}
