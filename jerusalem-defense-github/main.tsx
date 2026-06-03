@import "tailwindcss";

@theme {
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;
}

@layer base {
  body {
    background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
    color: #e2e8f0;
    overflow: hidden;
  }
}

.glass-panel {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 242, 255, 0.1);
}

.radar-sweep {
  background: conic-gradient(from 0deg, transparent 0%, rgba(0, 242, 255, 0.1) 20%, transparent 40%);
  animation: sweep 4s linear infinite;
}

@keyframes sweep {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cyan-text {
  color: #00f2ff;
}

.cyan-border {
  border-color: #00f2ff;
}

.tab-active {
  color: #00f2ff;
  border-bottom: 2px solid #00f2ff;
}

.tactical-border {
  border: 1px solid rgba(0, 242, 255, 0.2);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.05), inset 0 0 20px rgba(0, 242, 255, 0.05);
  position: relative;
}

.tactical-border::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 20px;
  height: 20px;
  border-top: 2px solid #00f2ff;
  border-left: 2px solid #00f2ff;
}

.tactical-border::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 20px;
  height: 20px;
  border-bottom: 2px solid #00f2ff;
  border-right: 2px solid #00f2ff;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 2px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 242, 255, 0.3);
}

/* New layout and UI for Expert Mode */
.app-grid {
  display: grid;
  grid-template-rows: 50px 1fr auto;
  grid-template-columns: 1fr 280px;
  height: 100vh;
  width: 100vw;
}

.expert-header {
  grid-column: 1 / 3;
  grid-row: 1 / 2;
  background: #020610;
  border-bottom: 1px solid #1a3a4a;
}

.expert-viewport {
  grid-column: 1 / 2;
  grid-row: 2 / 3;
  position: relative;
}

.expert-sidebar {
  grid-column: 2 / 3;
  grid-row: 2 / 3;
  background: #030814;
  border-left: 1px solid #1a3a4a;
}

.expert-footer {
  grid-column: 1 / 3;
  grid-row: 3 / 4;
  background: #030814;
  border-top: 1px solid #1a3a4a;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th, .data-table td {
  border: 1px solid #1a3a4a;
  text-align: center;
}

.data-table th {
  background: rgba(26, 58, 74, 0.4);
  font-weight: normal;
  color: #8da4b8;
}

.editable-input {
  background: transparent;
  color: inherit;
  border: none;
  width: 50px;
  text-align: center;
  font-family: inherit;
}
.editable-input:focus {
  outline: 1px solid #00f2ff;
  background: rgba(0, 242, 255, 0.1);
}

.html-label {
  background: rgba(2, 6, 16, 0.85);
  border: 1px solid #1a3a4a;
  padding: 8px 12px;
  font-family: var(--font-sans);
  color: #e2e8f0;
  pointer-events: none;
  white-space: nowrap;
}

