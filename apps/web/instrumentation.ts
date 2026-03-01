export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTelemetry } = await import("@chatos/ai/telemetry");
    await initTelemetry("chatos-web");
  }
}
