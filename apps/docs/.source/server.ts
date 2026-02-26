// @ts-nocheck
import * as __fd_glob_23 from "../content/docs/web/tools.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/web/streaming.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/web/models.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/web/index.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/web/chat-api.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/packages/ui.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/packages/types.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/packages/index.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/packages/db.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/packages/auth.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/packages/ai.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/deployment/index.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/deployment/environment.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/bot/platforms.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/bot/index.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/bot/configuration.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/quickstart.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/index.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/architecture.mdx?collection=docs"
import { default as __fd_glob_4 } from "../content/docs/web/meta.json?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/packages/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/deployment/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/bot/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "bot/meta.json": __fd_glob_1, "deployment/meta.json": __fd_glob_2, "packages/meta.json": __fd_glob_3, "web/meta.json": __fd_glob_4, }, {"architecture.mdx": __fd_glob_5, "index.mdx": __fd_glob_6, "quickstart.mdx": __fd_glob_7, "bot/configuration.mdx": __fd_glob_8, "bot/index.mdx": __fd_glob_9, "bot/platforms.mdx": __fd_glob_10, "deployment/environment.mdx": __fd_glob_11, "deployment/index.mdx": __fd_glob_12, "packages/ai.mdx": __fd_glob_13, "packages/auth.mdx": __fd_glob_14, "packages/db.mdx": __fd_glob_15, "packages/index.mdx": __fd_glob_16, "packages/types.mdx": __fd_glob_17, "packages/ui.mdx": __fd_glob_18, "web/chat-api.mdx": __fd_glob_19, "web/index.mdx": __fd_glob_20, "web/models.mdx": __fd_glob_21, "web/streaming.mdx": __fd_glob_22, "web/tools.mdx": __fd_glob_23, });