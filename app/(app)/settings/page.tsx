export default function SettingsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">⚙️ Settings</h1>
        <p className="page-subtitle">Customize your FluentMind experience</p>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 className="heading-5" style={{ marginBottom: "var(--space-4)" }}>Practice Preferences</h3>
        <div className="input-wrapper" style={{ marginBottom: "var(--space-4)" }}>
          <label className="input-label">Daily Goal (minutes)</label>
          <input type="number" className="input" defaultValue={5} min={1} max={60} />
        </div>
        <div className="input-wrapper" style={{ marginBottom: "var(--space-4)" }}>
          <label className="input-label">Default Recording Duration</label>
          <select className="input" defaultValue="120">
            <option value="60">1 minute</option>
            <option value="120">2 minutes</option>
            <option value="180">3 minutes</option>
            <option value="300">5 minutes</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)" }}>
        <h3 className="heading-5" style={{ marginBottom: "var(--space-4)" }}>AI Configuration</h3>
        <div className="input-wrapper" style={{ marginBottom: "var(--space-4)" }}>
          <label className="input-label">AI Personality</label>
          <select className="input" defaultValue="encouraging">
            <option value="encouraging">Encouraging Coach</option>
            <option value="strict">Strict Teacher</option>
            <option value="casual">Casual Friend</option>
            <option value="professional">Professional Mentor</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h3 className="heading-5" style={{ marginBottom: "var(--space-4)" }}>Account</h3>
        <div className="input-wrapper" style={{ marginBottom: "var(--space-4)" }}>
          <label className="input-label">Your Goal</label>
          <select className="input" defaultValue="casual">
            <option value="ielts">IELTS Preparation</option>
            <option value="professional">Professional Growth</option>
            <option value="casual">Casual Conversation</option>
            <option value="academic">Academic English</option>
          </select>
        </div>
        <div className="input-wrapper">
          <label className="input-label">Native Language</label>
          <input type="text" className="input" defaultValue="Urdu" />
        </div>
      </div>
    </div>
  );
}
