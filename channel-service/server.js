const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const CRM_CALLBACK_URL = process.env.CRM_CALLBACK_URL || 'http://localhost:3000/api/callback';

app.use(cors());
app.use(express.json());

// Simulation settings
let settings = {
  simulateFailures: false,
  deliveryRate: 90,
  openRate: 70,
  clickRate: 30
};

// In-Memory Statistics & Logs
const stats = {
  totalDispatched: 0,
  sent: 0,
  delivered: 0,
  opened: 0,
  clicked: 0,
  failed: 0
};
let eventLogs = [];

function addLog(message) {
  const time = new Date().toLocaleTimeString();
  console.log(`[Channel Service] [${time}] ${message}`);
  eventLogs.unshift({ time, message });
  if (eventLogs.length > 50) {
    eventLogs.pop();
  }
}

// Log incoming request
app.use((req, res, next) => {
  if (req.method === 'POST') {
    addLog(`Incoming POST ${req.url} - ${JSON.stringify(req.body)}`);
  }
  next();
});

// API endpoint to retrieve active logs & statistics
app.get('/api/logs', (req, res) => {
  res.json({ stats, logs: eventLogs });
});

// API endpoints for Simulation settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  const { simulateFailures, deliveryRate, openRate, clickRate } = req.body;
  if (simulateFailures !== undefined) settings.simulateFailures = !!simulateFailures;
  if (deliveryRate !== undefined) settings.deliveryRate = Number(deliveryRate);
  if (openRate !== undefined) settings.openRate = Number(openRate);
  if (clickRate !== undefined) settings.clickRate = Number(clickRate);
  addLog(`⚙️ Simulation settings updated: ${JSON.stringify(settings)}`);
  res.json(settings);
});

app.post('/send', (req, res) => {
  const { channel, user: communicationId, message, recipient } = req.body;

  if (!communicationId) {
    return res.status(400).json({ error: 'Missing communicationId' });
  }

  stats.totalDispatched += 1;
  addLog(`🆕 Dispatch request received via ${channel.toUpperCase()} for ID: ${communicationId} -> Recipient: ${recipient}`);

  // Immediate success response to the CRM
  res.status(202).json({ status: 'queued', communicationId });

  // Start lifecycle simulation
  simulateLifecycle(communicationId, channel, recipient || 'shopper');
});

// Helper function to send status receipts back to Next.js CRM
async function sendReceipt(communicationId, status) {
  try {
    const payload = { communicationId, status };
    addLog(`📡 Sending receipt: ID=${communicationId}, Status=${status.toUpperCase()} -> CRM Callback`);
    
    const response = await fetch(CRM_CALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      addLog(`❌ CRM callback rejected receipt with status: ${response.status}`);
    } else {
      const lower = status.toLowerCase();
      if (['failed', 'email_bounced', 'invalid_number', 'rate_limited'].includes(lower)) {
        stats.failed += 1;
      } else if (stats[lower] !== undefined) {
        stats[lower] += 1;
      }
    }
  } catch (error) {
    addLog(`❌ CRM callback network error: ${error.message}`);
  }
}

// Simulated delivery funnel
function simulateLifecycle(communicationId, channel, recipient) {
  // Step 1: Mark as SENT after 500ms
  setTimeout(async () => {
    await sendReceipt(communicationId, 'sent');

    if (settings.simulateFailures) {
      const deliveryRoll = (Math.random() * 100) < settings.deliveryRate;
      if (!deliveryRoll) {
        const errors = ['EMAIL_BOUNCED', 'INVALID_NUMBER', 'RATE_LIMITED'];
        const errorCode = errors[Math.floor(Math.random() * errors.length)];
        setTimeout(async () => {
          await sendReceipt(communicationId, errorCode);
        }, 1500);
        return;
      }
    } else {
      // Default fallback simulation (10% chance)
      const isFailed = Math.random() < 0.10;
      if (isFailed) {
        setTimeout(async () => {
          await sendReceipt(communicationId, 'failed');
        }, 1500);
        return;
      }
    }

    // Step 2: Mark as DELIVERED after 2000ms
    setTimeout(async () => {
      await sendReceipt(communicationId, 'delivered');

      let openChance = settings.simulateFailures ? settings.openRate : 50;
      if (!settings.simulateFailures) {
        if (channel.toLowerCase() === 'whatsapp') openChance = 85;
        else if (channel.toLowerCase() === 'email') openChance = 45;
        else if (channel.toLowerCase() === 'sms') openChance = 70;
      }

      const isOpened = (Math.random() * 100) < openChance;
      if (!isOpened) return;

      // Step 3: Mark as OPENED after 2500ms
      setTimeout(async () => {
        await sendReceipt(communicationId, 'opened');

        const clickChance = settings.simulateFailures ? settings.clickRate : 30;
        const isClicked = (Math.random() * 100) < clickChance;
        if (!isClicked) return;

        // Step 4: Mark as CLICKED after 2000ms
        setTimeout(async () => {
          await sendReceipt(communicationId, 'clicked');
        }, 2000);

      }, 2500);

    }, 2000);

  }, 500);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Channel Service Simulation' });
});

// HTML dashboard for port 3001 home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔌 Xeno CRM - Channel Service Console</title>
      <style>
        :root {
          --background: #090d16;
          --foreground: #e2e8f0;
          --header-text: #f8fafc;
          --border: #1e293b;
          --card-bg: rgba(15, 23, 42, 0.6);
          --card-text-muted: #94a3b8;
          --panel-bg: #0b0f19;
          --log-bg: #020617;
          --log-border: #0f172a;
          --log-text: #cbd5e1;
          --log-line-border: #0f172a;
          --log-time: #64748b;
          --card-val-default: #38bdf8;
          --card-val-emerald: #34d399;
          --card-val-purple: #c084fc;
          --card-val-rose: #f43f5e;
          --border-glow: #10b981;
        }

        @media (prefers-color-scheme: light) {
          :root {
            --background: #f8fafc;
            --foreground: #0f172a;
            --header-text: #0f172a;
            --border: #cbd5e1;
            --card-bg: rgba(255, 255, 255, 0.85);
            --card-text-muted: #475569;
            --panel-bg: #ffffff;
            --log-bg: #f1f5f9;
            --log-border: #cbd5e1;
            --log-text: #334155;
            --log-line-border: #e2e8f0;
            --log-time: #64748b;
            --card-val-default: #0284c7;
            --card-val-emerald: #059669;
            --card-val-purple: #7c3aed;
            --card-val-rose: #dc2626;
            --border-glow: #059669;
          }
        }

        body {
          background-color: var(--background);
          color: var(--foreground);
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 24px;
          transition: background-color 0.3s ease, color 0.3s ease;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
        }
        header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        h1 {
          font-size: 24px;
          margin: 0;
          color: var(--header-text);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #10b981;
          box-shadow: 0 0 10px var(--border-glow);
          display: inline-block;
        }
        .grid {
          display: grid;
          grid-template-cols: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        .card h3 {
          margin: 0 0 8px 0;
          font-size: 11px;
          color: var(--card-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .card p {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: var(--card-val-default);
          transition: color 0.3s ease;
        }
        .card.emerald p { color: var(--card-val-emerald); }
        .card.purple p { color: var(--card-val-purple); }
        .card.rose p { color: var(--card-val-rose); }
        
        .layout-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media(max-width: 768px) {
          .layout-sections {
            grid-template-columns: 1fr;
          }
        }
        .panel {
          background-color: var(--panel-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
        .panel h2 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: var(--header-text);
        }
        .log-box {
          background-color: var(--log-bg);
          border: 1px solid var(--log-border);
          border-radius: 8px;
          padding: 12px;
          height: 350px;
          overflow-y: auto;
          font-family: monospace;
          font-size: 12px;
          color: var(--log-text);
          transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
        }
        .log-line {
          padding: 4px 0;
          border-bottom: 1px solid var(--log-line-border);
          display: flex;
          gap: 8px;
        }
        .log-time {
          color: var(--log-time);
          flex-shrink: 0;
        }
        .log-msg {
          white-space: pre-wrap;
          word-break: break-all;
        }
        .text-zinc-500 {
          color: var(--card-text-muted);
        }
        
        /* Control form styling */
        .config-row {
          margin-bottom: 16px;
        }
        .config-row label {
          display: block;
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 6px;
          color: var(--header-text);
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .checkbox-container input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .slider-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .slider-container input[type=range] {
          flex-grow: 1;
          height: 6px;
          background: var(--border);
          border-radius: 3px;
          outline: none;
          cursor: pointer;
        }
        .slider-val {
          font-family: monospace;
          font-size: 13px;
          font-weight: bold;
          min-width: 40px;
          text-align: right;
          color: var(--card-val-default);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>🔌 Channel Service Control Center</h1>
          <div>
            <span class="status-dot"></span>
            <span style="color: #10b981; font-weight: bold; font-size: 14px; margin-left: 5px;">Online</span>
          </div>
        </header>

        <div class="grid">
          <div class="card">
            <h3>Dispatched</h3>
            <p id="stat-dispatched">${stats.totalDispatched}</p>
          </div>
          <div class="card emerald">
            <h3>Delivered</h3>
            <p id="stat-delivered">${stats.delivered}</p>
          </div>
          <div class="card purple">
            <h3>Opened</h3>
            <p id="stat-opened">${stats.opened}</p>
          </div>
          <div class="card emerald">
            <h3>Clicked</h3>
            <p id="stat-clicked">${stats.clicked}</p>
          </div>
          <div class="card rose">
            <h3>Failed</h3>
            <p id="stat-failed">${stats.failed}</p>
          </div>
        </div>

        <div class="layout-sections">
          <!-- Simulation settings Panel -->
          <div class="panel">
            <h2>⚙️ Pipeline Failure Simulator Configuration</h2>
            
            <label class="checkbox-container">
              <input type="checkbox" id="simulateFailures" onchange="updateSettings()">
              <span>Simulate Pipeline Delivery Failures</span>
            </label>

            <div class="config-row">
              <label>Target Delivery Rate</label>
              <div class="slider-container">
                <input type="range" id="deliveryRate" min="0" max="100" value="90" oninput="showVal('deliveryRate', this.value)" onchange="updateSettings()">
                <span class="slider-val" id="deliveryRate-val">90%</span>
              </div>
            </div>

            <div class="config-row">
              <label>Target Open Rate</label>
              <div class="slider-container">
                <input type="range" id="openRate" min="0" max="100" value="70" oninput="showVal('openRate', this.value)" onchange="updateSettings()">
                <span class="slider-val" id="openRate-val">70%</span>
              </div>
            </div>

            <div class="config-row">
              <label>Target Click Rate</label>
              <div class="slider-container">
                <input type="range" id="clickRate" min="0" max="100" value="30" oninput="showVal('clickRate', this.value)" onchange="updateSettings()">
                <span class="slider-val" id="clickRate-val">30%</span>
              </div>
            </div>
            
            <p style="font-size: 11px; color: var(--card-text-muted); line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border);">
              💡 <strong>How it works:</strong> When "Simulate Pipeline Delivery Failures" is active, messages fail delivery based on the set rate. Deliveries that fail will roll a random error response: <code>EMAIL_BOUNCED</code>, <code>INVALID_NUMBER</code>, or <code>RATE_LIMITED</code>. Successful deliveries are simulated for opens/clicks using their respective rates.
            </p>
          </div>

          <!-- Live Activity Panel -->
          <div class="panel">
            <h2>📡 Live Communication Activity Feed</h2>
            <div class="log-box" id="log-container">
              ${eventLogs.length > 0 ? eventLogs.map(log => `
                <div class="log-line">
                  <span class="log-time">[${log.time}]</span>
                  <span class="log-msg">${log.message}</span>
                </div>
              `).join('') : '<div class="log-line text-zinc-500">Waiting for campaign dispatches...</div>'}
            </div>
          </div>
        </div>
      </div>

      <script>
        // Synchronize settings from server on load
        async function fetchSettings() {
          try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            document.getElementById('simulateFailures').checked = data.simulateFailures;
            
            document.getElementById('deliveryRate').value = data.deliveryRate;
            document.getElementById('deliveryRate-val').innerText = data.deliveryRate + '%';
            
            document.getElementById('openRate').value = data.openRate;
            document.getElementById('openRate-val').innerText = data.openRate + '%';
            
            document.getElementById('clickRate').value = data.clickRate;
            document.getElementById('clickRate-val').innerText = data.clickRate + '%';
          } catch (e) {
            console.error('Error fetching settings:', e);
          }
        }

        function showVal(id, val) {
          document.getElementById(id + '-val').innerText = val + '%';
        }

        async function updateSettings() {
          const body = {
            simulateFailures: document.getElementById('simulateFailures').checked,
            deliveryRate: Number(document.getElementById('deliveryRate').value),
            openRate: Number(document.getElementById('openRate').value),
            clickRate: Number(document.getElementById('clickRate').value),
          };

          try {
            await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
          } catch (e) {
            console.error('Error updating settings:', e);
          }
        }

        // Poll for log updates and metrics
        async function pollLogs() {
          try {
            const res = await fetch('/api/logs');
            const data = await res.json();
            
            // Update Stats
            document.getElementById('stat-dispatched').innerText = data.stats.totalDispatched;
            document.getElementById('stat-delivered').innerText = data.stats.delivered;
            document.getElementById('stat-opened').innerText = data.stats.opened;
            document.getElementById('stat-clicked').innerText = data.stats.clicked;
            document.getElementById('stat-failed').innerText = data.stats.failed;

            // Update Logs
            const container = document.getElementById('log-container');
            if (data.logs.length > 0) {
              container.innerHTML = data.logs.map(log => \`
                <div class="log-line">
                  <span class="log-time">[\${log.time}]</span>
                  <span class="log-msg">\${log.message}</span>
                </div>
              \`).join('');
            } else {
              container.innerHTML = '<div class="log-line">Waiting for campaign dispatches...</div>';
            }
          } catch (e) {
            console.error('Error polling logs:', e);
          }
        }
        
        fetchSettings();
        setInterval(pollLogs, 1500);
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  addLog(`🔌 Channel Service running on http://localhost:${PORT}`);
  addLog(` CRM Webhook Target: ${CRM_CALLBACK_URL}`);
});
