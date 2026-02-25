export default function BotDashboard() {
  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>chatOS Bot</h1>
      <p>Multi-platform AI bot service.</p>
      <h2>Endpoints</h2>
      <ul>
        <li>
          <code>POST /api/slack</code> — Slack event webhook
        </li>
      </ul>
      <h2>Status</h2>
      <p>Service is running.</p>
    </div>
  );
}
