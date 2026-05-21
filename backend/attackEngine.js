const { v4: uuidv4 } = require('uuid');

const ATTACK_CONFIGS = {
  ddos: {
    name: 'DDoS Attack', color: '#ff2200', particleColor: '#ff4400',
    duration: 15000, intensity: 'critical', phases: ['syn_flood', 'ack_flood', 'volumetric'],
    description: 'Distributed Denial of Service - overwhelming target with traffic',
    targets: ['fw-main', 'web-server-1', 'web-server-2', 'web-proxy'],
    logMessages: [
      'SYN flood detected from multiple sources',
      'Bandwidth saturation at 98.7%',
      'Connection table overflow: 65535/65535',
      'Rate limiting triggered on eth0',
      'BGP blackhole routing activated',
      'Scrubbing center traffic diversion initiated'
    ]
  },
  bruteforce: {
    name: 'Brute Force', color: '#ff8800', particleColor: '#ffaa00',
    duration: 20000, intensity: 'high', phases: ['recon', 'dictionary', 'credential_spray'],
    description: 'SSH/RDP credential stuffing with leaked credential database',
    targets: ['web-server-1', 'db-server-1', 'workstation-1', 'workstation-2'],
    logMessages: [
      'Failed auth attempt: root@192.168.1.11 (attempt 1/10000)',
      'Password spray: admin:password123 FAILED',
      'SSH connection flood from 185.220.101.47',
      'Account lockout triggered: sysadmin (5 failures)',
      'Geo-blocking rule triggered for RU/CN/KP',
      'Honeypot SSH triggered - logging attacker'
    ]
  },
  mitm: {
    name: 'MITM Attack', color: '#aa00ff', particleColor: '#cc44ff',
    duration: 25000, intensity: 'critical', phases: ['arp_spoof', 'intercept', 'inject'],
    description: 'ARP spoofing enabling man-in-the-middle traffic interception',
    targets: ['router-core', 'workstation-3', 'workstation-4'],
    logMessages: [
      'ARP cache poisoning detected on VLAN 10',
      'Duplicate MAC address: 00:1A:2B:3C:4D:5E',
      'SSL/TLS downgrade attack attempted',
      'Certificate pinning violation detected',
      'Suspicious rerouting via 192.168.1.99',
      'Encrypted tunnel hijack in progress'
    ]
  },
  malware: {
    name: 'Malware Spread', color: '#ff0055', particleColor: '#ff3377',
    duration: 30000, intensity: 'critical', phases: ['initial_access', 'lateral_move', 'persistence', 'exfil'],
    description: 'Advanced persistent threat propagating through internal network',
    targets: ['workstation-1', 'workstation-2', 'workstation-3', 'db-server-1'],
    logMessages: [
      'Malicious process spawned: svchost32.exe (PID 4829)',
      'Lateral movement via SMB: \\\\192.168.3.102\\admin$',
      'LSASS memory dump detected - credential theft',
      'Registry persistence key created: HKLM\\Software\\Run',
      'Beaconing to C2: 198.51.100.10:443',
      'Data exfiltration: 2.3GB transferred to external host'
    ]
  },
  ransomware: {
    name: 'Ransomware', color: '#ff0000', particleColor: '#ff2200',
    duration: 20000, intensity: 'critical', phases: ['encrypt', 'spread', 'ransom'],
    description: 'Ransomware encrypting files and spreading across shares',
    targets: ['workstation-1', 'workstation-4', 'db-server-1'],
    logMessages: [
      'Mass file encryption detected: .docx → .locked',
      'Shadow copy deletion: vssadmin.exe delete shadows',
      'Ransom note dropped: HOW_TO_DECRYPT.txt (1247 locations)',
      'SMB share enumeration: mapping network drives',
      'Backup deletion: wbadmin delete catalog -quiet',
      'Bitcoin wallet address broadcast: 1A2b3c...'
    ]
  },
  portscan: {
    name: 'Port Scan', color: '#00ffff', particleColor: '#44ffff',
    duration: 12000, intensity: 'medium', phases: ['discovery', 'scan', 'version_detect'],
    description: 'Nmap stealth scan enumerating services and versions',
    targets: ['fw-main', 'web-server-1', 'web-server-2', 'db-server-1'],
    logMessages: [
      'Nmap scan detected: -sS -sV -O --script=vuln',
      'Port 22 (SSH): OpenSSH 8.9p1 OPEN',
      'Port 80 (HTTP): nginx/1.24.0 OPEN',
      'Port 443 (HTTPS): TLS 1.3 OPEN',
      'Port 3306 (MySQL): 8.0.35-FILTERED',
      'OS fingerprint: Linux 5.15 kernel detected'
    ]
  },
  phishing: {
    name: 'Phishing', color: '#ffff00', particleColor: '#ffff44',
    duration: 18000, intensity: 'high', phases: ['lure', 'credential_harvest', 'session_hijack'],
    description: 'Spear-phishing campaign targeting administrator credentials',
    targets: ['workstation-2', 'workstation-5', 'mail-server'],
    logMessages: [
      'Phishing email delivered: "IT Security Alert" from spoofed domain',
      'User clicked malicious link: http://l0gin-corp[.]com/verify',
      'Credential form submission intercepted',
      'Session token hijacked from HTTP response',
      'MFA bypass via session cookie replay',
      'Admin panel access from unauthorized location: 45.33.32.156'
    ]
  },
  packetflood: {
    name: 'Packet Flood', color: '#ff6600', particleColor: '#ff8800',
    duration: 10000, intensity: 'high', phases: ['flood'],
    description: 'UDP/ICMP packet flood overwhelming network interface',
    targets: ['fw-main', 'router-core'],
    logMessages: [
      'ICMP flood: 1,247,892 packets/sec from spoofed IPs',
      'UDP amplification via DNS: 42x traffic amplification',
      'NIC buffer overflow: packets dropped',
      'Rate limiter: 99.8% traffic dropped',
      'Network interface saturation: eth0 @ 10Gbps',
      'Emergency ACL deployed: null-routing 185.220.0.0/16'
    ]
  }
};

class AttackEngine {
  constructor(io, topology) {
    this.io = io;
    this.topology = topology;
    this.activeAttacks = new Map();
    this.attackHistory = [];
  }

  launchAttack(params) {
    const config = ATTACK_CONFIGS[params.type];
    if (!config) return null;

    const attackId = uuidv4();
    const targetNode = params.targetId || config.targets[Math.floor(Math.random() * config.targets.length)];
    const sourceId = params.sourceId || 'external-attacker';

    const attack = {
      id: attackId,
      type: params.type,
      name: config.name,
      sourceId,
      targetId: targetNode,
      color: config.color,
      particleColor: config.particleColor,
      intensity: params.intensity || config.intensity,
      phase: 0,
      phases: config.phases,
      startTime: Date.now(),
      duration: config.duration,
      description: config.description,
      affectedNodes: [targetNode],
      logMessages: [],
      progress: 0
    };

    this.activeAttacks.set(attackId, attack);

    const targetNodeData = this.topology.getNode(targetNode);
    if (targetNodeData) {
      targetNodeData.status = 'under_attack';
      targetNodeData.attackHistory.push({ type: params.type, time: Date.now() });
    }

    this.simulateAttackProgression(attack, config);
    return attack;
  }

  simulateAttackProgression(attack, config) {
    let logIndex = 0;
    let phaseIndex = 0;

    const logInterval = setInterval(() => {
      if (!this.activeAttacks.has(attack.id)) {
        clearInterval(logInterval);
        return;
      }

      const message = config.logMessages[logIndex % config.logMessages.length];
      const logEntry = {
        time: new Date().toISOString(),
        attack: attack.id,
        attackType: attack.type,
        message,
        severity: attack.intensity === 'critical' ? 'CRITICAL' : attack.intensity === 'high' ? 'HIGH' : 'MEDIUM',
        source: attack.sourceId,
        target: attack.targetId
      };

      attack.logMessages.push(logEntry);
      attack.progress = Math.min(100, (Date.now() - attack.startTime) / attack.duration * 100);

      this.io.emit('attack_log', logEntry);
      this.io.emit('attack_progress', { id: attack.id, progress: attack.progress, phase: config.phases[phaseIndex] });

      if (attack.intensity === 'critical' || attack.intensity === 'high') {
        const targetNode = this.topology.getNode(attack.targetId);
        if (targetNode) {
          targetNode.health = Math.max(0, targetNode.health - (3 + Math.random() * 5));
          targetNode.metrics.cpu = Math.min(100, targetNode.metrics.cpu + 15);
          this.io.emit('node_health_update', { id: attack.targetId, health: targetNode.health, status: 'under_attack' });
        }
      }

      if (attack.type === 'malware' && logIndex === 2 && attack.affectedNodes.length < 4) {
        const spreadTargets = ['workstation-2', 'workstation-3', 'db-server-1'];
        const newTarget = spreadTargets[Math.floor(Math.random() * spreadTargets.length)];
        if (!attack.affectedNodes.includes(newTarget)) {
          attack.affectedNodes.push(newTarget);
          this.io.emit('malware_spread', { attackId: attack.id, newTarget, fromNode: attack.targetId });
        }
      }

      logIndex++;
      if (logIndex % 2 === 0 && phaseIndex < config.phases.length - 1) phaseIndex++;
    }, 2500);

    setTimeout(() => {
      this.stopAttack(attack.id);
      clearInterval(logInterval);
    }, config.duration);
  }

  stopAttack(attackId) {
    const attack = this.activeAttacks.get(attackId);
    if (!attack) return;

    const targetNode = this.topology.getNode(attack.targetId);
    if (targetNode) {
      setTimeout(() => {
        targetNode.status = targetNode.health < 20 ? 'compromised' : 'recovering';
        this.io.emit('node_health_update', { id: attack.targetId, health: targetNode.health, status: targetNode.status });
        setTimeout(() => {
          if (targetNode.status === 'recovering') {
            targetNode.status = 'active';
            targetNode.health = Math.min(100, targetNode.health + 20);
            this.io.emit('node_health_update', { id: attack.targetId, health: targetNode.health, status: 'active' });
          }
        }, 5000);
      }, 2000);
    }

    this.attackHistory.push({ ...attack, endTime: Date.now() });
    this.activeAttacks.delete(attackId);
    this.io.emit('attack_ended', { id: attackId, timestamp: Date.now() });
  }

  getActiveAttacks() { return Array.from(this.activeAttacks.values()); }
  getAttackHistory() { return this.attackHistory; }
  getAttackTypes() { return ATTACK_CONFIGS; }
}

module.exports = { AttackEngine, ATTACK_CONFIGS };
