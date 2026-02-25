export default function DocsHome() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: "48rem", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold" }}>chatOS Documentation</h1>
      <p style={{ fontSize: "1.125rem", color: "#666", marginTop: "1rem" }}>
        Welcome to the chatOS documentation. Learn how to build, customize, and deploy your AI chat
        platform.
      </p>

      <div style={{ marginTop: "2rem", display: "grid", gap: "1rem" }}>
        <Section
          title="Getting Started"
          description="Set up your development environment and run chatOS locally."
        />
        <Section
          title="Architecture"
          description="Understand the monorepo structure, package boundaries, and data flow."
        />
        <Section
          title="Packages"
          description="API reference for @chatos/ai, @chatos/db, @chatos/ui, and more."
        />
        <Section
          title="Deployment"
          description="Deploy to Vercel, configure environments, and manage databases."
        />
        <Section
          title="Bot Integration"
          description="Set up Slack, Teams, and Discord bots with Chat SDK."
        />
        <Section
          title="Agent Development"
          description="Use skills, control metalayer, and harness engineering for AI-assisted development."
        />
      </div>
    </div>
  );
}

function Section({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>{title}</h2>
      <p style={{ color: "#666", marginTop: "0.5rem" }}>{description}</p>
    </div>
  );
}
