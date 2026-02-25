/** Options for listing keys under a prefix. */
export type ListOptions = {
  prefix: string;
  /** Maximum number of keys to return. */
  limit?: number;
};

/**
 * Abstract storage backend for the agent filesystem.
 *
 * Every implementation stores JSON-serializable strings keyed by
 * forward-slash–delimited paths (e.g. `sessions/abc/meta.json`).
 */
export interface StorageBackend {
  /** Read the contents at `path`, or `null` if it doesn't exist. */
  read(path: string): Promise<string | null>;

  /** Write `content` at `path`, creating intermediate "directories" as needed. */
  write(path: string, content: string): Promise<void>;

  /** Delete the entry at `path`. No-op if it doesn't exist. */
  delete(path: string): Promise<void>;

  /** List keys matching the given prefix. */
  list(opts: ListOptions): Promise<string[]>;

  /** Return `true` if an entry exists at `path`. */
  exists(path: string): Promise<boolean>;
}
