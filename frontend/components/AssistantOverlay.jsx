import { useState, useEffect, useRef } from 'react';

const KNOWLEDGE_BASE = {
  iptables: { title: 'iptables — Linux Firewall', color: '#00ff88', content: `iptables is the traditional Linux firewall tool using Netfilter.\n\nKey chains:\n• INPUT — incoming packets to local system\n• OUTPUT — outgoing packets from local system\n• FORWARD — packets routed through system\n\nCommon commands:\n  iptables -L -n -v           # List all rules\n  iptables -A INPUT -s IP -j DROP  # Block source IP\n  iptables -A INPUT -p tcp --dport 22 -j ACCEPT  # Allow SSH\n  iptables -F                  # Flush all rules\n  iptables -P INPUT DROP       # Default drop policy\n\nTargets: ACCEPT, DROP, REJECT, LOG, MASQUERADE`, },
  ssh: { title: 'SSH — Secure Shell', color: '#00aaff', content: `SSH (Secure Shell) provides encrypted remote access.\n\nPort: 22 (TCP)\nConfig: /etc/ssh/sshd_config\n\nSecurity hardening:\n  PasswordAuthentication no   # Disable passwords\n  PermitRootLogin no          # Disable root login\n  MaxAuthTries 3              # Limit retry attempts\n  AllowUsers analyst deploy   # Whitelist users\n\nBrute force defense:\n• fail2ban monitors /var/log/auth.log\n• Blocks IPs after N failed attempts\n• Rate limiting with iptables -m limit\n\nMonitor: journalctl -u ssh -f\nLogs: /var/log/auth.log` },
  ddos: { title: 'DDoS — Denial of Service', color: '#ff2244', content: `DDoS floods target with traffic to exhaust resources.\n\nTypes:\n• Volumetric — bandwidth exhaustion (UDP flood)\n• Protocol — state exhaustion (SYN flood)\n• Application — resource exhaustion (HTTP flood)\n\nDetection:\n  netstat -an | grep SYN_RECV | wc -l  # Count half-open\n  ss -s   # Socket statistics\n  dmesg | grep conntrack  # Kernel connection tracking\n\nMitigation:\n  iptables -m limit --limit 25/min  # Rate limiting\n  iptables -m hashlimit --hashlimit-upto 100/sec  # Per-IP limit\n  null-route <attackerIP>  # BGP blackhole\n  Cloudflare/AWS Shield  # Upstream protection` },
  malware: { title: 'Malware Investigation', color: '#ff0055', content: `Systematic approach to malware analysis on Linux.\n\nInitial triage:\n  ps aux | sort -rk 3  # High CPU processes\n  ss -tuln | grep -v LISTEN  # Unusual connections\n  find /tmp /dev/shm -type f  # Staged files\n  crontab -l  # Persistence via cron\n\nProcess investigation:\n  ls -la /proc/<PID>/exe  # Process executable\n  lsof -p <PID>  # Open files and connections\n  strings /proc/<PID>/mem  # Memory strings\n\nNetwork indicators:\n  ss -tuln  # Check for unusual listeners\n  netstat -an | grep ESTABLISHED  # Active connections\n\nPersistence mechanisms:\n  /etc/crontab, /etc/rc.local\n  ~/.bashrc, ~/.profile\n  /etc/systemd/system/*.service` },
  tcp: { title: 'TCP — Transmission Control Protocol', color: '#00f0ff', content: `TCP provides reliable, ordered, error-checked delivery.\n\nConnection states:\n  LISTEN     — Waiting for connections\n  SYN_SENT   — SYN sent, waiting for SYN-ACK\n  SYN_RECV   — SYN received, SYN-ACK sent\n  ESTABLISHED — Full duplex connection open\n  FIN_WAIT1  — Closing connection\n  TIME_WAIT  — Waiting for delayed packets\n  CLOSE_WAIT — Remote end closed\n\nHandshake: SYN → SYN-ACK → ACK\nSYN Flood: Attacker sends many SYNs, never completes\n\nView connections:\n  ss -t state established\n  netstat -an | grep ESTABLISHED\n  watch -n1 'ss -s'  # Live statistics` },
  arp: { title: 'ARP — Address Resolution Protocol', color: '#aa44ff', content: `ARP maps IP addresses to MAC addresses on Layer 2.\n\nARP Spoofing/Poisoning:\n• Attacker sends fake ARP replies\n• Victim's cache associates attacker MAC with gateway IP\n• All traffic goes through attacker (MITM)\n\nDetection:\n  arp -n  # Show ARP cache\n  ip neigh show  # Neighbor table\n  tcpdump -i eth0 arp  # Capture ARP traffic\n  arpwatch  # Monitor ARP changes\n\nPrevention:\n  Static ARP entries: arp -s IP MAC\n  Dynamic ARP Inspection (DAI) on managed switches\n  802.1X port authentication\n  Encrypted protocols (HTTPS, VPN)\n\n/proc/net/arp  # Kernel ARP table` },
  systemctl: { title: 'systemctl — Service Manager', color: '#ffcc00', content: `systemctl controls systemd services, the Linux init system.\n\nCommon operations:\n  systemctl status nginx      # Check service status\n  systemctl start nginx       # Start service\n  systemctl stop nginx        # Stop service\n  systemctl restart nginx     # Restart service\n  systemctl reload nginx      # Reload config (no restart)\n  systemctl enable nginx      # Start on boot\n  systemctl disable nginx     # Don't start on boot\n\nLogging:\n  journalctl -u nginx         # Service logs\n  journalctl -u nginx -f      # Follow logs\n  journalctl -u nginx -n 100  # Last 100 lines\n  journalctl --since "1 hour ago"  # Time range\n\nUnit file location: /etc/systemd/system/\nSystem logs: journalctl -xe` },
  ufw: { title: 'UFW — Uncomplicated Firewall', color: '#00ff88', content: `UFW simplifies iptables management for Ubuntu/Debian.\n\nBasic commands:\n  ufw status           # Show status and rules\n  ufw enable/disable   # Enable/disable firewall\n  ufw allow 22/tcp     # Allow SSH\n  ufw deny from IP     # Block IP address\n  ufw deny 4444        # Block port\n  ufw allow proto tcp from IP to any port 22  # Specific rule\n  ufw delete deny from IP  # Remove rule\n  ufw reset            # Reset all rules\n\nApplication profiles:\n  ufw allow 'Nginx Full'  # Allow HTTP+HTTPS\n  ufw app list            # Show available profiles\n\nConfig files:\n  /etc/ufw/ufw.conf\n  /etc/ufw/user.rules\n  /var/log/ufw.log  # UFW logs` },
};

const QUICK_TIPS = [
  { trigger: /iptables|firewall|ufw|block/, topic: 'iptables', text: 'Need iptables help?' },
  { trigger: /ssh|brute|auth\.log/, topic: 'ssh', text: 'SSH security tip?' },
  { trigger: /ddos|syn.flood|traffic|netstat/, topic: 'ddos', text: 'DDoS mitigation guide?' },
  { trigger: /malware|process|svchost|virus/, topic: 'malware', text: 'Malware hunting guide?' },
  { trigger: /arp|mitm|poison/, topic: 'arp', text: 'ARP/MITM explanation?' },
  { trigger: /tcp|connection|state/, topic: 'tcp', text: 'TCP states explained?' },
  { trigger: /systemctl|service|restart/, topic: 'systemctl', text: 'systemctl reference?' },
];

const CHAT_RESPONSES = {
  'what is ddos': 'A DDoS (Distributed Denial of Service) attack floods your system with traffic from multiple sources to exhaust resources. Detect with: `netstat -an | grep SYN_RECV | wc -l`. Mitigate with iptables rate limiting.',
  'how to block ip': 'Block an IP with: `iptables -A INPUT -s 185.220.101.47 -j DROP` or `ufw deny from 185.220.101.47`. Verify with `iptables -L -n`.',
  'find malware': 'Check for malware: 1) `ps aux | sort -rk 3` (high CPU) 2) `ss -tuln` (unusual listeners) 3) `find /tmp -type f -name "*.sh"` (staged files) 4) `crontab -l` (persistence).',
  'what is arp spoofing': 'ARP Spoofing sends fake ARP replies to poison victim\'s cache, routing traffic through the attacker (MITM). Detect with `arp -n` — look for duplicate MAC addresses.',
  'ssh brute force': 'To stop SSH brute force: `fail2ban-client set sshd banip 185.220.101.47` or `iptables -A INPUT -s <IP> -j DROP`. Then disable password auth in /etc/ssh/sshd_config.',
  'default': 'I can explain: ddos, malware, arp spoofing, ssh brute force, iptables, firewalls, and more. Ask me anything about the current incident or Linux security!',
};

export default function AssistantOverlay({ visible, onClose, activeCommand, activeMission }) {
  const [topic, setTopic] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: '👋 SOC Assistant online. I can explain attacks, commands, and concepts. Ask me anything or click a topic below.' }
  ]);
  const [tab, setTab] = useState('assistant');
  const chatRef = useRef(null);

  useEffect(() => {
    if (!activeCommand) return;
    const tip = QUICK_TIPS.find(t => t.trigger.test(activeCommand));
    if (tip && !topic) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, { role: 'assistant', text: `💡 I see you're working with "${activeCommand}" — ${KNOWLEDGE_BASE[tip.topic]?.title} might be helpful. Click "${tip.text}" below!`, suggested: tip }]);
      }, 500);
    }
  }, [activeCommand]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatHistory]);

  const handleChat = (input) => {
    const msg = input.trim().toLowerCase();
    if (!msg) return;
    setChatHistory(prev => [...prev, { role: 'user', text: input }]);
    setChatInput('');
    setTimeout(() => {
      const resp = Object.entries(CHAT_RESPONSES).find(([k]) => msg.includes(k));
      const response = resp ? resp[1] : CHAT_RESPONSES.default;
      setChatHistory(prev => [...prev, { role: 'assistant', text: response }]);
    }, 400);
  };

  if (!visible) return null;
  const kb = topic ? KNOWLEDGE_BASE[topic] : null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '320px', zIndex: 1000 }}>
      <div className="cyber-panel flex flex-col" style={{ maxHeight: '500px', border: '1px solid #0a2a4a' }}>
        <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
        <div className="flex items-center justify-between px-3 py-2 border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
            <span className="cyber-title text-xs">SOC ASSISTANT</span>
          </div>
          <div className="flex gap-1">
            {['assistant', 'reference'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: tab === t ? '#00f0ff' : '#334455', borderBottom: tab === t ? '1px solid #00f0ff' : '1px solid transparent', background: 'none', cursor: 'pointer', padding: '2px 6px' }}>{t}</button>
            ))}
            <button onClick={onClose} style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer', marginLeft: '4px' }}>✕</button>
          </div>
        </div>

        {tab === 'assistant' && (
          <>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-2 flex flex-col gap-2" style={{ maxHeight: '340px' }}>
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-xs p-2 border"
                    style={{ borderColor: msg.role === 'user' ? '#00f0ff44' : '#0a2a4a', background: msg.role === 'user' ? 'rgba(0,240,255,0.08)' : 'rgba(1,8,20,0.8)', fontFamily: 'monospace', fontSize: '0.65rem', color: msg.role === 'user' ? '#00f0ff' : '#5588aa', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    {msg.text}
                    {msg.suggested && (
                      <button onClick={() => setTopic(msg.suggested.topic)} className="block mt-1 text-xs" style={{ color: KNOWLEDGE_BASE[msg.suggested.topic]?.color || '#00f0ff', fontFamily: 'monospace', fontSize: '0.6rem', cursor: 'pointer', textDecoration: 'underline' }}>
                        📚 {msg.suggested.text}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1 px-2 py-1 border-t" style={{ borderColor: '#0a2a4a' }}>
              {['ddos', 'iptables', 'malware', 'arp'].map(t => (
                <button key={t} onClick={() => handleChat(`what is ${t}`)} className="node-badge" style={{ color: '#334455', borderColor: '#0a2a4a', fontSize: '0.55rem', cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 border-t" style={{ borderColor: '#0a2a4a' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat(chatInput)}
                className="cyber-input flex-1" style={{ fontSize: '0.65rem', padding: '3px 6px' }} placeholder="Ask anything..." />
              <button onClick={() => handleChat(chatInput)} className="cyber-btn" style={{ padding: '3px 8px', fontSize: '0.65rem' }}>ASK</button>
            </div>
          </>
        )}

        {tab === 'reference' && (
          <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
            {!kb ? (
              <div className="p-2 flex flex-col gap-1">
                <div style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.6rem', marginBottom: '6px', letterSpacing: '0.1em' }}>KNOWLEDGE BASE</div>
                {Object.entries(KNOWLEDGE_BASE).map(([key, val]) => (
                  <button key={key} onClick={() => setTopic(key)}
                    className="flex items-center gap-2 p-2 border text-left w-full hover:bg-white/5 transition-all"
                    style={{ borderColor: '#0a2a4a', fontFamily: 'monospace', fontSize: '0.65rem', color: val.color }}>
                    <span style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>{val.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2">
                <button onClick={() => setTopic(null)} style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem', cursor: 'pointer', marginBottom: '8px' }}>← Back</button>
                <div style={{ color: kb.color, fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 'bold', textShadow: `0 0 8px ${kb.color}`, marginBottom: '8px' }}>{kb.title}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#4488aa', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{kb.content}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
