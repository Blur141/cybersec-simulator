# CyberRange — Interactive Cybersecurity Simulator

<div align="center">

```
 ██████╗██╗   ██╗██████╗ ███████╗██████╗ ██████╗  █████╗ ███╗   ██╗ ██████╗ ███████╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔══██╗████╗  ██║██╔════╝ ██╔════╝
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝██████╔╝███████║██╔██╗ ██║██║  ███╗█████╗
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗██╔══██╗██╔══██║██║╚██╗██║██║   ██║██╔══╝
╚██████╗   ██║   ██████╔╝███████╗██║  ██║██║  ██║██║  ██║██║ ╚████║╚██████╔╝███████╗
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
```

**Learn cybersecurity by doing — not just reading.**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-white?style=flat-square&logo=socket.io)
![Python](https://img.shields.io/badge/Python-3.11-yellow?style=flat-square&logo=python)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Educational](https://img.shields.io/badge/Purpose-Educational-purple?style=flat-square)

</div>

---

## What is this?

CyberRange is a **browser-based cybersecurity training platform** that runs entirely on your own computer. It shows you a live 3D network map of a fake company — servers, firewalls, workstations — and lets you launch simulated attacks against it, then defend against them using real Linux commands.

Think of it like a video game where the "levels" are real incident-response scenarios and the "weapons" are the same terminal commands used by actual security professionals.

> **Nothing here connects to the internet or touches real systems.** Every attack, every IP address, every log entry is simulated and contained inside your machine.

---

## What will I learn?

By the time you finish all 6 missions you will be able to:

- Read and understand Linux system logs (`auth.log`, `journalctl`)
- Detect active attacks using `netstat`, `ss`, `tcpdump`, and `ps`
- Block attackers with `iptables` and `ufw` firewall rules
- Identify malware processes and remove them
- Understand how DDoS, brute force, MITM, and ransomware attacks actually work
- Navigate a Linux terminal with confidence

These are real skills used in SOC (Security Operations Center) roles and tested in certifications like CompTIA Security+ and CySA+.

---

## New here? Start here.

1. **[Install the prerequisites](#-prerequisites)** — Node.js and npm (5 minutes)
2. **[Run the app](#-running-the-app)** — two terminal commands
3. **Open `http://localhost:3000`** in your browser
4. **Click "Missions"** in the top bar and start Mission 1 (SSH Brute Force Defense)
5. **Type the commands it shows you** in the terminal panel on screen

That's it. The platform explains everything as you go.

---

## Prerequisites

You need two things installed before you can run this project.

### 1. Node.js (required)

Node.js is a JavaScript runtime — it's what runs the backend server.

- Download from: https://nodejs.org/ — choose the **LTS** version
- After installing, verify it worked by opening a terminal and typing:

```bash
node --version   # should print v20.x.x or higher
npm --version    # should print 9.x.x or higher
```

### 2. Git (required to clone this repo)

- Download from: https://git-scm.com/
- After installing: `git --version`

### 3. Python 3.11+ (optional)

Only needed if you want the extra simulation API. The app works fine without it.

- Download from: https://python.org/

### 4. Docker (optional)

Only needed if you want to run everything in containers. Skip this for your first time.

- Download from: https://docker.com/

---

## Running the App

You need **two terminals open at the same time** — one for the backend, one for the frontend.

### Step 1 — Clone the project

```bash
git clone https://github.com/yourusername/cyberrange.git
cd cyberrange
```

### Step 2 — Start the backend (Terminal 1)

```bash
cd backend
npm install
node server.js
```

You should see:
```
╔══════════════════════════════════════════╗
║  CYBERSEC ATTACK SIMULATOR - BACKEND      ║
║  Port: 3001  |  Status: OPERATIONAL       ║
╚══════════════════════════════════════════╝
```

Leave this terminal running.

### Step 3 — Start the frontend (Terminal 2)

Open a **new** terminal window, then:

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

### Step 4 — Open the app

Open your browser and go to: **http://localhost:3000**

> **Tip:** Use Chrome or Firefox for the best experience. The 3D city uses WebGL and may be slow on older hardware.

---

## Common Problems

**`npm install` fails with permission errors**
Run your terminal as Administrator (Windows) or use `sudo` (Mac/Linux).

**Port 3000 or 3001 already in use**
Something else is using that port. Either close the other program, or change the port in [backend/.env](backend/.env) and [frontend/.env.local](frontend/.env.local).

**The 3D city is black or blank**
Your browser may not support WebGL. Try a different browser. Also check that your graphics drivers are up to date.

**Backend connects but frontend shows "Disconnected"**
Make sure the backend is still running (check Terminal 1). Then refresh the browser.

---

## Running with Docker (Alternative)

If you have Docker installed, you can start everything with a single command:

```bash
docker-compose up --build
```

Then open http://localhost:3000. To stop everything: `Ctrl+C`, then `docker-compose down`.

---

## Features

### 3D Cyber City

The main view is a procedurally generated cyberpunk city. Each building represents a real network node — web servers, database servers, firewalls, workstations. You can click any node to inspect it, and when an attack hits it, you'll see a visual effect (red particles, spreading corruption, etc.).

### Interactive Linux Terminal

The panel at the bottom is a simulated Linux terminal. Type real commands and they affect the simulation. For example:

```bash
# See who's attacking via SSH
grep "Failed password" /var/log/auth.log

# Block their IP — a firewall shield appears in the 3D view
iptables -A INPUT -s 185.220.101.47 -j DROP

# Find a suspicious process
ps aux | sort -rk 3

# Scan a node
nmap 192.168.1.11
```

The terminal supports 30+ commands: `ls`, `cd`, `cat`, `grep`, `tail`, `find`, `ping`, `ssh`, `nmap`, `tcpdump`, `netstat`, `ss`, `ip`, `iptables`, `ufw`, `fail2ban-client`, `systemctl`, `journalctl`, `ps`, `kill`, `docker`, `curl`, and more.

### Training Missions

| # | Mission | Difficulty | What you'll do |
|---|---------|------------|----------------|
| 1 | SSH Brute Force Defense | Beginner | Read auth logs, identify attacker IP, block with iptables |
| 2 | DDoS Attack Mitigation | Intermediate | Detect SYN flood, apply rate limiting |
| 3 | Malware Investigation | Intermediate | Find malicious process, trace persistence |
| 4 | Network Forensics (MITM) | Advanced | Spot ARP spoofing, trace packet interception |
| 5 | Ransomware Incident Response | Advanced | Isolate infected node, stop encryption spread |
| 6 | Phishing Email Investigation | Intermediate | Trace fake domains, analyze mail logs |

Each mission gives you:
- A realistic incident briefing ("At 03:14 UTC, the web server started logging...")
- Step-by-step objectives with command hints
- Explanations of what each command does and why it matters

### Packet Analyzer

A Wireshark-style panel that shows live network traffic. You can filter by IP, protocol, or threat level (normal / suspicious / malicious). Good for understanding what traffic looks like during an attack.

### SOC Assistant

An in-app chatbot with a knowledge base covering iptables, SSH, DDoS, ARP spoofing, malware, and more. Ask it questions while you work through missions. Great if you get stuck or want a plain-English explanation.

### Multiplayer Mode

Open the app in two browser tabs (or on two machines on the same network). Both connect to the same cyber world — attacks are visible to everyone, and there's a shared chat panel.

---

## Project Structure

```
cyberrange/
├── backend/
│   ├── server.js           ← Main server, handles WebSocket connections
│   ├── attackEngine.js     ← Simulates 8 types of attacks
│   ├── networkTopology.js  ← Defines the 29-node network map
│   ├── metricsSimulator.js ← Generates fake CPU/RAM/process data
│   └── package.json
│
├── frontend/
│   ├── components/
│   │   ├── CyberWorld.jsx  ← The 3D city (Three.js)
│   │   ├── Terminal.jsx    ← Event log feed
│   │   ├── AttackPanel.jsx ← Attack launcher UI
│   │   ├── SystemMonitor.jsx ← CPU/RAM graphs
│   │   ├── NodeInspector.jsx ← Click-to-inspect nodes
│   │   └── TimelinePanel.jsx ← Attack history replay
│   ├── pages/
│   │   └── index.js        ← Main app layout
│   └── package.json
│
├── simulation/
│   ├── attack_simulator.py ← Optional Python API for extra scenarios
│   └── requirements.txt
│
├── docker-compose.yml      ← Run everything with one command
└── README.md
```

---

## Configuration

### Environment variables

Create these files if they don't exist — they let you change settings without editing code.

**`frontend/.env.local`**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

**`backend/.env`**
```env
PORT=3001
NODE_ENV=development
AUTO_ATTACK_INTERVAL=12000
```

`AUTO_ATTACK_INTERVAL` controls how often the server automatically launches random attacks (in milliseconds). Set it higher to slow them down, or `0` to disable.

---

## Tech Stack (for the curious)

| What | Technology | Why |
|------|-----------|-----|
| Frontend framework | Next.js 14 + React 18 | Handles the UI and page routing |
| 3D rendering | Three.js | Draws the city, particles, and attack effects |
| Real-time updates | Socket.IO | Keeps the browser in sync with the server instantly |
| Charts | Recharts | CPU/network monitoring graphs |
| Styling | Tailwind CSS | The cyberpunk dark theme |
| Backend | Node.js + Express | Runs the server and REST API |
| Simulation engine | Python + Flask | Optional — generates extra attack patterns |
| Deployment | Docker + docker-compose | Run everything with one command |

The entire 3D world is built from code — no downloaded 3D models, textures, or sprite sheets. Every building, particle, and shader is generated programmatically.

---

## Learning Paths

### Complete beginner (new to Linux and security)
1. Explore the 3D city — click on nodes to learn what each one does
2. Start Mission 1 and follow the hints
3. Ask the SOC Assistant to explain any command you don't understand
4. Read the "Educational Content" section below when you finish

### Some Linux experience
1. Complete all 6 missions without hints
2. Launch attacks manually from the Attack Panel, then investigate them yourself
3. Use the packet analyzer to understand traffic patterns during each attack type

### Preparing for a certification (Security+, CySA+, CEH)
1. Complete all 6 missions, noting which exam objectives each covers
2. Launch multiple simultaneous attacks and practice triage
3. Write a complete iptables ruleset that blocks all attack vectors
4. Replay attacks on the timeline and practice writing incident reports

---

## Educational Content

### What each attack does (plain English)

| Attack | What actually happens | How defenders detect it |
|--------|----------------------|------------------------|
| SSH Brute Force | Attacker tries thousands of passwords per minute | Hundreds of "Failed password" lines in `/var/log/auth.log` |
| DDoS (SYN Flood) | Attacker floods target with connection requests it can't process | `netstat` shows thousands of connections stuck in `SYN_RECV` state |
| Malware / RAT | A hidden program runs on the victim machine, sending data out | `ps aux` shows a process using high CPU with a suspicious name |
| MITM (ARP Spoof) | Attacker tricks the network into routing traffic through their machine | `arp -n` shows two devices with the same MAC address |
| Ransomware | Attacker encrypts all files and demands payment | Sudden high disk I/O, files renamed with unknown extensions |
| Phishing | Fake login page tricks users into entering credentials | Mail logs show external links, domain looks similar to real one |

### Useful Linux commands (quick reference)

```bash
# Read logs
journalctl -u ssh -n 50          # last 50 lines of SSH service log
grep "Failed" /var/log/auth.log  # search for failed login attempts
tail -f /var/log/nginx/access.log # watch web server log in real time

# Investigate the network
netstat -an | grep SYN_RECV      # find half-open TCP connections
ss -tuln                         # show all open ports
tcpdump -i eth0 port 22          # capture SSH traffic
arp -n                           # show ARP table (spot duplicates)

# Manage firewall
iptables -L -n -v                # list all current rules
iptables -A INPUT -s 1.2.3.4 -j DROP  # block an IP
ufw deny from 1.2.3.4            # same thing with UFW

# Find suspicious processes
ps aux --sort=-%cpu | head -20   # top CPU-using processes
kill -9 1234                     # force-stop a process by PID
find /tmp -type f                # check for files in temp directories
crontab -l                       # check scheduled tasks (persistence)
```

---

## Security & Disclaimer

> **This tool is for education only.**

- All attack simulations are synthetic — no real network traffic leaves your machine
- All IP addresses are from documentation ranges (RFC 5737) or localhost
- There is no real exploitation code or CVE payload in this project
- It cannot be used to attack real systems

Suitable for: university courses, corporate security training, CTF preparation, SOC analyst onboarding, self-study, certification prep.

---

## Contributing

Contributions are welcome. Here's how to add something:

```bash
# Fork, then clone your fork
git clone https://github.com/yourusername/cyberrange.git
cd cyberrange
git checkout -b feature/your-feature-name
```

Good places to start:
- **New missions** → [frontend/utils/missions.js](frontend/utils/missions.js)
- **New terminal commands** → `frontend/utils/terminalCommands.js`
- **New attack types** → [backend/attackEngine.js](backend/attackEngine.js)
- **New 3D effects** → [frontend/components/CyberWorld.jsx](frontend/components/CyberWorld.jsx)

### Adding a new mission (example)

```javascript
// In frontend/utils/missions.js
{
  id: 'sql-injection',
  name: 'SQL Injection Detection',
  category: 'Web Security',
  difficulty: 2,
  xp: 220,
  icon: '💉',
  briefing: 'Suspicious queries detected in the database logs...',
  attackConfig: { type: 'malware', targetId: 'db-server-1' },
  objectives: [
    {
      id: 'check-db-logs',
      text: 'Check the database query logs for unusual input',
      hint: 'cat /var/log/postgresql/postgresql.log | grep -i "union select"',
      pattern: /grep.*union|cat.*postgres/i,
      explanation: 'SQL injection attacks leave traces like UNION SELECT in db logs.',
    },
  ],
}
```

---

## Roadmap

- [ ] Real Ubuntu containers for fully isolated labs
- [ ] PCAP file import for offline traffic analysis
- [ ] CTF mode with a scoring system
- [ ] CVE-based scenario library
- [ ] Mobile-responsive layout for classroom tablets

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE) for the full text.

---

<div align="center">

**Built for the cybersecurity community**

*"The best way to understand an attack is to defend against one."*

[Report a Bug](https://github.com/yourusername/cyberrange/issues) · [Request a Feature](https://github.com/yourusername/cyberrange/issues)

```
root@cyberrange:~# █
```

</div>
