class MetricsSimulator {
  constructor(io, topology) {
    this.io = io;
    this.topology = topology;
    this.processPool = this.generateProcessPool();
    this.firewallLog = [];
    this.packetLog = [];
  }

  generateProcessPool() {
    return [
      { name: 'nginx', pid: 1234, cpu: 2.1, mem: 45, user: 'www-data', state: 'S' },
      { name: 'postgres', pid: 1456, cpu: 5.3, mem: 320, user: 'postgres', state: 'S' },
      { name: 'sshd', pid: 892, cpu: 0.1, mem: 8, user: 'root', state: 'S' },
      { name: 'dockerd', pid: 2001, cpu: 1.2, mem: 210, user: 'root', state: 'S' },
      { name: 'containerd', pid: 2002, cpu: 0.8, mem: 95, user: 'root', state: 'S' },
      { name: 'prometheus', pid: 3100, cpu: 3.4, mem: 180, user: 'prometheus', state: 'S' },
      { name: 'grafana', pid: 3000, cpu: 1.5, mem: 150, user: 'grafana', state: 'S' },
      { name: 'snort', pid: 4500, cpu: 8.2, mem: 256, user: 'snort', state: 'R' },
      { name: 'auditd', pid: 567, cpu: 0.3, mem: 12, user: 'root', state: 'S' },
      { name: 'fail2ban', pid: 678, cpu: 0.2, mem: 30, user: 'root', state: 'S' },
      { name: 'rsyslog', pid: 789, cpu: 0.1, mem: 15, user: 'root', state: 'S' },
      { name: 'cron', pid: 890, cpu: 0.0, mem: 6, user: 'root', state: 'S' },
    ];
  }

  generateFirewallEvent() {
    const actions = ['ACCEPT', 'ACCEPT', 'ACCEPT', 'DROP', 'DROP', 'REJECT'];
    const protocols = ['TCP', 'UDP', 'ICMP'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];
    const srcIP = `${Math.floor(Math.random() * 220 + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
    const dstIP = `192.168.${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 50) + 10}`;
    const dstPort = [22, 80, 443, 3306, 5432, 8080, 25, 53][Math.floor(Math.random() * 8)];
    const srcPort = Math.floor(Math.random() * 60000) + 1024;

    return {
      timestamp: new Date().toISOString(),
      action,
      protocol: proto,
      srcIP,
      srcPort,
      dstIP,
      dstPort,
      bytes: Math.floor(Math.random() * 2048 + 64),
      rule: action === 'ACCEPT' ? `RULE-${Math.floor(Math.random() * 20) + 1}` : `BLOCK-${Math.floor(Math.random() * 5) + 1}`
    };
  }

  generatePacket() {
    const protocols = ['HTTP', 'HTTPS', 'SSH', 'DNS', 'SMTP', 'FTP', 'ICMP', 'TCP'];
    const proto = protocols[Math.floor(Math.random() * protocols.length)];
    const srcIP = `10.0.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 254) + 1}`;
    const dstIP = `10.0.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 254) + 1}`;
    return {
      timestamp: new Date().toISOString(),
      protocol: proto,
      src: `${srcIP}:${Math.floor(Math.random() * 60000) + 1024}`,
      dst: `${dstIP}:${[22, 80, 443, 3306, 53, 25][Math.floor(Math.random() * 6)]}`,
      size: Math.floor(Math.random() * 1500) + 40,
      flags: proto === 'TCP' ? ['SYN', 'ACK', 'SYN-ACK', 'FIN', 'RST'][Math.floor(Math.random() * 5)] : null,
      info: `${proto} request`
    };
  }

  generateSSHConnections() {
    const users = ['root', 'admin', 'deploy', 'ubuntu', 'ec2-user'];
    const count = Math.floor(Math.random() * 5) + 1;
    return Array.from({ length: count }, () => ({
      user: users[Math.floor(Math.random() * users.length)],
      srcIP: `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      duration: `${Math.floor(Math.random() * 120)}m${Math.floor(Math.random() * 60)}s`,
      port: 22,
      status: Math.random() > 0.8 ? 'suspicious' : 'normal'
    }));
  }

  start() {
    setInterval(() => {
      const processes = this.processPool.map(p => ({
        ...p,
        cpu: Math.max(0, p.cpu + (Math.random() - 0.5) * 2),
        mem: Math.max(1, p.mem + Math.floor((Math.random() - 0.5) * 10))
      }));

      const systemMetrics = {
        cpu: { total: 35 + Math.random() * 30, cores: Array.from({ length: 8 }, () => Math.random() * 100) },
        memory: { used: 4200 + Math.random() * 2000, total: 16384, cached: 1200, buffers: 300 },
        disk: { read: Math.random() * 200, write: Math.random() * 150, util: Math.random() * 60 },
        network: { rxBytes: Math.random() * 125000000, txBytes: Math.random() * 80000000, packets: Math.floor(Math.random() * 10000) },
        load: [1.2 + Math.random(), 1.0 + Math.random() * 0.5, 0.8 + Math.random() * 0.4],
        uptime: 864000 + Date.now() / 1000,
        processes,
        ssh: this.generateSSHConnections(),
        containers: [
          { name: 'nginx-proxy', status: 'running', cpu: '2.1%', mem: '45MB', uptime: '5d' },
          { name: 'postgres-db', status: 'running', cpu: '8.3%', mem: '320MB', uptime: '5d' },
          { name: 'redis-cache', status: 'running', cpu: '0.5%', mem: '28MB', uptime: '5d' },
          { name: 'app-server', status: 'running', cpu: '15.2%', mem: '512MB', uptime: '2d' },
          { name: 'monitoring', status: 'running', cpu: '3.1%', mem: '180MB', uptime: '5d' }
        ]
      };

      this.io.emit('system_metrics', systemMetrics);
    }, 1000);

    setInterval(() => {
      const fwEvent = this.generateFirewallEvent();
      this.firewallLog.unshift(fwEvent);
      if (this.firewallLog.length > 500) this.firewallLog.pop();
      this.io.emit('firewall_event', fwEvent);
    }, 300);

    setInterval(() => {
      const packet = this.generatePacket();
      this.packetLog.unshift(packet);
      if (this.packetLog.length > 200) this.packetLog.pop();
      this.io.emit('packet_captured', packet);
    }, 150);
  }
}

module.exports = MetricsSimulator;
