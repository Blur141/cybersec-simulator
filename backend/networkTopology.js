const { v4: uuidv4 } = require('uuid');

const NODE_TYPES = {
  FIREWALL: 'firewall',
  ROUTER: 'router',
  SERVER: 'server',
  DATABASE: 'database',
  ENDPOINT: 'endpoint',
  DMZ: 'dmz',
  CLOUD: 'cloud',
  IOT: 'iot',
  ATTACKER: 'attacker'
};

class NetworkTopology {
  constructor() {
    this.nodes = new Map();
    this.connections = new Map();
    this.initialize();
  }

  initialize() {
    this.createCorporateNetwork();
    this.createDMZ();
    this.createCloudInfrastructure();
    this.createIoTZone();
    this.createExternalThreat();
    this.createConnections();
  }

  createCorporateNetwork() {
    this.addNode({ id: 'fw-main', type: 'firewall', name: 'Main Firewall', ip: '10.0.0.1',
      pos3d: { x: 0, y: 0, z: 0 }, health: 100, status: 'active',
      services: ['HTTP', 'HTTPS', 'SSH', 'IPTABLES'], os: 'FortiOS 7.4',
      metrics: { cpu: 15, memory: 40, connections: 234, bandwidth: 850 }, zone: 'perimeter' });

    this.addNode({ id: 'router-core', type: 'router', name: 'Core Router', ip: '10.0.0.254',
      pos3d: { x: -15, y: 0, z: 0 }, health: 100, status: 'active',
      services: ['BGP', 'OSPF', 'VLAN'], os: 'Cisco IOS-XE 17.0',
      metrics: { cpu: 8, memory: 25, connections: 89, bandwidth: 960 }, zone: 'internal' });

    this.addNode({ id: 'ids-main', type: 'server', name: 'IDS/IPS System', ip: '10.0.1.1',
      pos3d: { x: 0, y: 0, z: -15 }, health: 100, status: 'active',
      services: ['Snort', 'Suricata'], os: 'Security Onion',
      metrics: { cpu: 45, memory: 60, connections: 0, bandwidth: 200 }, zone: 'security' });

    for (let i = 1; i <= 3; i++) {
      this.addNode({ id: `web-server-${i}`, type: 'server', name: `Web Server ${i}`,
        ip: `192.168.1.${10 + i}`, pos3d: { x: -30 + (i - 1) * 15, y: 0, z: 20 },
        health: 100, status: 'active', services: ['nginx', 'PHP-FPM', 'SSL'],
        os: 'Ubuntu 22.04 LTS', metrics: { cpu: 30 + Math.random() * 20,
        memory: 50 + Math.random() * 20, connections: 150 + Math.floor(Math.random() * 100), bandwidth: 400 }, zone: 'web' });
    }

    for (let i = 1; i <= 2; i++) {
      this.addNode({ id: `db-server-${i}`, type: 'database', name: `Database ${i}`,
        ip: `192.168.2.${10 + i}`, pos3d: { x: -10 + (i - 1) * 20, y: 0, z: 35 },
        health: 100, status: 'active', services: ['PostgreSQL', 'Redis', 'pgBouncer'],
        os: 'RHEL 9', metrics: { cpu: 20, memory: 75, connections: 45, bandwidth: 120 }, zone: 'data' });
    }

    for (let i = 1; i <= 6; i++) {
      this.addNode({ id: `workstation-${i}`, type: 'endpoint', name: `Workstation ${i}`,
        ip: `192.168.3.${100 + i}`, pos3d: { x: -40 + (i - 1) * 16, y: 0, z: 50 },
        health: 100, status: 'active', services: ['SMB', 'RDP', 'Browser'],
        os: 'Windows 11 Pro', metrics: { cpu: 15, memory: 40, connections: 8, bandwidth: 50 }, zone: 'user' });
    }
  }

  createDMZ() {
    this.addNode({ id: 'dmz-fw', type: 'firewall', name: 'DMZ Firewall', ip: '172.16.0.1',
      pos3d: { x: 25, y: 0, z: 0 }, health: 100, status: 'active',
      services: ['HTTP', 'HTTPS', 'ACL'], os: 'pfSense 2.7',
      metrics: { cpu: 10, memory: 30, connections: 123, bandwidth: 600 }, zone: 'dmz' });

    this.addNode({ id: 'web-proxy', type: 'server', name: 'Reverse Proxy', ip: '172.16.1.1',
      pos3d: { x: 40, y: 0, z: 15 }, health: 100, status: 'active',
      services: ['HAProxy', 'Nginx', 'Certbot'], os: 'Debian 12',
      metrics: { cpu: 25, memory: 35, connections: 456, bandwidth: 750 }, zone: 'dmz' });

    this.addNode({ id: 'mail-server', type: 'server', name: 'Mail Server', ip: '172.16.1.2',
      pos3d: { x: 40, y: 0, z: -15 }, health: 100, status: 'active',
      services: ['Postfix', 'Dovecot', 'SpamAssassin'], os: 'CentOS 8',
      metrics: { cpu: 18, memory: 55, connections: 78, bandwidth: 180 }, zone: 'dmz' });
  }

  createCloudInfrastructure() {
    this.addNode({ id: 'cloud-gw', type: 'cloud', name: 'Cloud Gateway', ip: '34.102.0.1',
      pos3d: { x: 0, y: 0, z: -35 }, health: 100, status: 'active',
      services: ['VPN', 'SD-WAN', 'TLS'], os: 'AWS Transit Gateway',
      metrics: { cpu: 5, memory: 20, connections: 89, bandwidth: 2000 }, zone: 'cloud' });

    for (let i = 1; i <= 4; i++) {
      this.addNode({ id: `cloud-server-${i}`, type: 'cloud', name: `Cloud Node ${i}`,
        ip: `34.102.1.${i}`, pos3d: { x: -25 + (i - 1) * 16, y: 0, z: -55 },
        health: 100, status: 'active', services: ['Docker', 'Kubernetes', 'Helm'],
        os: 'Amazon Linux 2023', metrics: { cpu: 40, memory: 60, connections: 34, bandwidth: 900 }, zone: 'cloud' });
    }
  }

  createIoTZone() {
    for (let i = 1; i <= 5; i++) {
      this.addNode({ id: `iot-device-${i}`, type: 'iot', name: `IoT Sensor ${i}`,
        ip: `10.10.0.${i}`, pos3d: { x: -50 + (i - 1) * 25, y: 0, z: 65 },
        health: 100, status: 'active', services: ['MQTT', 'CoAP'],
        os: 'Embedded Linux 5.10', metrics: { cpu: 5, memory: 10, connections: 2, bandwidth: 5 }, zone: 'iot' });
    }
  }

  createExternalThreat() {
    this.addNode({ id: 'external-attacker', type: 'attacker', name: 'Threat Actor',
      ip: '185.220.101.47', pos3d: { x: 0, y: 0, z: -90 }, health: 100, status: 'threat',
      services: ['TOR', 'VPN', 'C2'], os: 'Unknown',
      metrics: { cpu: 80, memory: 60, connections: 1, bandwidth: 100 }, zone: 'external' });

    this.addNode({ id: 'c2-server', type: 'attacker', name: 'C2 Server', ip: '198.51.100.10',
      pos3d: { x: -30, y: 0, z: -90 }, health: 100, status: 'threat',
      services: ['Cobalt Strike', 'Metasploit'], os: 'Unknown',
      metrics: { cpu: 70, memory: 50, connections: 5, bandwidth: 200 }, zone: 'external' });
  }

  createConnections() {
    this.addConnection('fw-main', 'router-core', 1000, 'MPLS');
    this.addConnection('fw-main', 'dmz-fw', 1000, 'Transit');
    this.addConnection('fw-main', 'cloud-gw', 500, 'IPSec-VPN');
    this.addConnection('fw-main', 'ids-main', 1000, 'SPAN');

    for (let i = 1; i <= 3; i++) {
      this.addConnection('router-core', `web-server-${i}`, 1000, 'Ethernet');
    }
    for (let i = 1; i <= 2; i++) {
      for (let j = 1; j <= 3; j++) {
        this.addConnection(`web-server-${j}`, `db-server-${i}`, 100, 'PostgreSQL');
      }
    }
    for (let i = 1; i <= 6; i++) {
      this.addConnection('router-core', `workstation-${i}`, 100, 'Ethernet');
    }

    this.addConnection('dmz-fw', 'web-proxy', 500, 'Reverse-Proxy');
    this.addConnection('dmz-fw', 'mail-server', 100, 'SMTP');

    this.addConnection('cloud-gw', 'cloud-server-1', 10000, 'Internal');
    this.addConnection('cloud-gw', 'cloud-server-2', 10000, 'Internal');
    this.addConnection('cloud-gw', 'cloud-server-3', 10000, 'Internal');
    this.addConnection('cloud-gw', 'cloud-server-4', 10000, 'Internal');

    for (let i = 1; i <= 5; i++) {
      this.addConnection('router-core', `iot-device-${i}`, 10, 'MQTT');
    }

    this.addConnection('external-attacker', 'fw-main', 0, 'ATTACK');
    this.addConnection('external-attacker', 'c2-server', 0, 'C2-Channel');
  }

  addNode(data) {
    this.nodes.set(data.id, { ...data, attackHistory: [], packets: [], timestamp: Date.now() });
  }

  addConnection(fromId, toId, bandwidth, protocol) {
    const id = `${fromId}--${toId}`;
    this.connections.set(id, { id, from: fromId, to: toId, bandwidth, protocol, traffic: 0, status: 'active', packets: [] });
  }

  getTopology() {
    return { nodes: Array.from(this.nodes.values()), connections: Array.from(this.connections.values()) };
  }

  getNode(id) { return this.nodes.get(id); }

  updateNode(id, updates) {
    const node = this.nodes.get(id);
    if (node) Object.assign(node, updates);
  }

  startTrafficSimulation(io) {
    setInterval(() => {
      const nodeUpdates = [];
      this.nodes.forEach(node => {
        if (node.type === 'attacker') return;
        const delta = (Math.random() - 0.48) * 8;
        node.metrics.cpu = Math.max(5, Math.min(98, node.metrics.cpu + delta));
        node.metrics.memory = Math.max(10, Math.min(98, node.metrics.memory + (Math.random() - 0.49) * 4));
        node.metrics.bandwidth = Math.max(0, node.metrics.bandwidth + (Math.random() - 0.5) * 50);
        nodeUpdates.push({ id: node.id, metrics: node.metrics, health: node.health, status: node.status });
      });

      const connUpdates = [];
      this.connections.forEach(conn => {
        conn.traffic = Math.random() * 100;
        connUpdates.push({ id: conn.id, traffic: conn.traffic });
      });

      io.emit('traffic_update', { nodes: nodeUpdates, connections: connUpdates, timestamp: Date.now() });
    }, 800);
  }
}

module.exports = { NetworkTopology, NODE_TYPES };
