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

