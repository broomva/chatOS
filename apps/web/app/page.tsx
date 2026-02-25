import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight">chatOS</h1>
        <p className="max-w-md text-lg text-muted-foreground">
          AI-powered chat platform with streaming, multi-model support, and multi-platform bots.
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/chat"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90"
        >
          Start Chatting
        </Link>
      </div>
    </div>
  );
}
