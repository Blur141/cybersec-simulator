const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { NetworkTopology } = require('./networkTopology');
const { AttackEngine, ATTACK_CONFIGS } = require('./attackEngine');
const MetricsSimulator = require('./metricsSimulator');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const topology = new NetworkTopology();
const attackEngine = new AttackEngine(io, topology);
const metrics = new MetricsSimulator(io, topology);

const timeline = [];
const connectedAnalysts = new Map();

io.on('connection', (socket) => {
  const analystId = socket.id;
  const analystNum = connectedAnalysts.size + 1;
  connectedAnalysts.set(analystId, { id: analystId, name: `Analyst-${analystNum}`, joinTime: Date.now() });

  console.log(`[+] Analyst connected: ${analystId} (Total: ${connectedAnalysts.size})`);

  socket.emit('init', {
    topology: topology.getTopology(),
    attackTypes: ATTACK_CONFIGS,
    activeAttacks: attackEngine.getActiveAttacks(),
    analysts: Array.from(connectedAnalysts.values()),
    timestamp: Date.now()
  });

  socket.broadcast.emit('analyst_joined', {
    analyst: connectedAnalysts.get(analystId),
    totalAnalysts: connectedAnalysts.size
  });

  socket.on('launch_attack', (params) => {
    console.log(`[!] Attack launched: ${params.type} -> ${params.targetId} by ${analystId}`);
    const attack = attackEngine.launchAttack(params);
    if (attack) {
      io.emit('attack_started', attack);
      timeline.push({ type: 'attack_started', data: attack, timestamp: Date.now(), by: analystId });
    }
  });

  socket.on('stop_attack', (attackId) => {
    attackEngine.stopAttack(attackId);
    io.emit('attack_stopped', { id: attackId, timestamp: Date.now() });
    timeline.push({ type: 'attack_stopped', data: { id: attackId }, timestamp: Date.now() });
  });

  socket.on('stop_all_attacks', () => {
    attackEngine.getActiveAttacks().forEach(a => {
      attackEngine.stopAttack(a.id);
      io.emit('attack_stopped', { id: a.id, timestamp: Date.now() });
    });
  });

  socket.on('inspect_node', (nodeId) => {
    const node = topology.getNode(nodeId);
    if (node) socket.emit('node_details', node);
  });

  socket.on('request_replay', ({ startTime, endTime }) => {
    const events = timeline.filter(e => e.timestamp >= startTime && (!endTime || e.timestamp <= endTime));
    socket.emit('replay_events', { events, count: events.length });
  });

  socket.on('chat_message', (msg) => {
    io.emit('analyst_message', { analyst: connectedAnalysts.get(analystId), message: msg, timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`[-] Analyst disconnected: ${analystId}`);
    connectedAnalysts.delete(analystId);
    socket.broadcast.emit('analyst_left', { id: analystId, totalAnalysts: connectedAnalysts.size });
  });
});

app.get('/api/health', (req, res) => res.json({ status: 'operational', uptime: process.uptime(), analysts: connectedAnalysts.size }));
app.get('/api/topology', (req, res) => res.json(topology.getTopology()));
app.get('/api/attacks/types', (req, res) => res.json(ATTACK_CONFIGS));
app.get('/api/attacks/active', (req, res) => res.json(attackEngine.getActiveAttacks()));
app.get('/api/attacks/history', (req, res) => res.json(attackEngine.getAttackHistory()));
app.get('/api/timeline', (req, res) => res.json(timeline));
app.post('/api/attack', (req, res) => {
  const attack = attackEngine.launchAttack(req.body);
  if (attack) { io.emit('attack_started', attack); res.json(attack); }
  else res.status(400).json({ error: 'Invalid attack type' });
});

metrics.start();
topology.startTrafficSimulation(io);

let autoAttackInterval = null;
function startAutoAttacks() {
  const types = Object.keys(ATTACK_CONFIGS);
  autoAttackInterval = setInterval(() => {
    if (Math.random() < 0.4) {
      const type = types[Math.floor(Math.random() * types.length)];
      const attack = attackEngine.launchAttack({ type, intensity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] });
      if (attack) {
        io.emit('attack_started', attack);
        timeline.push({ type: 'attack_started', data: attack, timestamp: Date.now(), by: 'auto' });
      }
    }
  }, 12000);
}
startAutoAttacks();

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  CYBERSEC ATTACK SIMULATOR - BACKEND      ║`);
  console.log(`║  Port: ${PORT}  |  Status: OPERATIONAL       ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
