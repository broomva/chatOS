export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
