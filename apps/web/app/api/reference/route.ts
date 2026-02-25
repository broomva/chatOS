import { ApiReference } from "@scalar/nextjs-api-reference";

const config = {
  spec: {
    url: "/openapi.json",
  },
  metaData: {
    title: "chatOS Web API Reference",
  },
  theme: "kepler" as const,
};

export const GET = ApiReference(config);
