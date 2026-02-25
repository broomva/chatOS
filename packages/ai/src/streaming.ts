export { createResumableStreamContext } from "resumable-stream";

export function isReasoningModel(modelId: string): boolean {
  return modelId.includes("reasoning") || modelId.includes("thinking");
}
