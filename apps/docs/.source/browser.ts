// @ts-nocheck
import { browser } from "fumadocs-mdx/runtime/browser";
import type * as Config from "../source.config";

const create = browser<
  typeof Config,
  import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
    DocData: {};
  }
>();
const browserCollections = {
  docs: create.doc("docs", {
    "architecture.mdx": () => import("../content/docs/architecture.mdx?collection=docs"),
    "index.mdx": () => import("../content/docs/index.mdx?collection=docs"),
    "quickstart.mdx": () => import("../content/docs/quickstart.mdx?collection=docs"),
    "bot/configuration.mdx": () => import("../content/docs/bot/configuration.mdx?collection=docs"),
    "bot/index.mdx": () => import("../content/docs/bot/index.mdx?collection=docs"),
    "bot/platforms.mdx": () => import("../content/docs/bot/platforms.mdx?collection=docs"),
    "deployment/environment.mdx": () =>
      import("../content/docs/deployment/environment.mdx?collection=docs"),
    "deployment/index.mdx": () => import("../content/docs/deployment/index.mdx?collection=docs"),
    "packages/ai.mdx": () => import("../content/docs/packages/ai.mdx?collection=docs"),
    "packages/auth.mdx": () => import("../content/docs/packages/auth.mdx?collection=docs"),
    "packages/db.mdx": () => import("../content/docs/packages/db.mdx?collection=docs"),
    "packages/index.mdx": () => import("../content/docs/packages/index.mdx?collection=docs"),
    "packages/types.mdx": () => import("../content/docs/packages/types.mdx?collection=docs"),
    "packages/ui.mdx": () => import("../content/docs/packages/ui.mdx?collection=docs"),
    "web/chat-api.mdx": () => import("../content/docs/web/chat-api.mdx?collection=docs"),
    "web/index.mdx": () => import("../content/docs/web/index.mdx?collection=docs"),
    "web/models.mdx": () => import("../content/docs/web/models.mdx?collection=docs"),
    "web/streaming.mdx": () => import("../content/docs/web/streaming.mdx?collection=docs"),
    "web/tools.mdx": () => import("../content/docs/web/tools.mdx?collection=docs"),
  }),
};
export default browserCollections;
