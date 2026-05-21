import { useState } from 'react';

const ATTACK_META = {
  ddos:        { icon: '💥', label: 'DDoS', color: '#ff2200', desc: 'Volumetric traffic flood', intensity: 'critical' },
  bruteforce:  { icon: '🔨', label: 'Brute Force', color: '#ff8800', desc: 'SSH/RDP credential attack', intensity: 'high' },
  mitm:        { icon: '👁', label: 'MITM', color: '#aa00ff', desc: 'ARP spoofing intercept', intensity: 'critical' },
  malware:     { icon: '🦠', label: 'Malware', color: '#ff0055', desc: 'APT lateral movement', intensity: 'critical' },
  ransomware:  { icon: '🔒', label: 'Ransomware', color: '#ff0000', desc: 'File encryption spread', intensity: 'critical' },
  portscan:    { icon: '🔍', label: 'Port Scan', color: '#00ffff', desc: 'Nmap stealth discovery', intensity: 'medium' },
  phishing:    { icon: '🎣', label: 'Phishing', color: '#ffff00', desc: 'Spear-phishing campaign', intensity: 'high' },
  packetflood: { icon: '🌊', label: 'Pkt Flood', color: '#ff6600', desc: 'UDP amplification flood', intensity: 'high' },
};

const TARGETS = [
  { id: 'fw-main', label: 'Main Firewall' },
  { id: 'router-core', label: 'Core Router' },
  { id: 'web-server-1', label: 'Web Server 1' },
  { id: 'web-server-2', label: 'Web Server 2' },
  { id: 'web-server-3', label: 'Web Server 3' },
  { id: 'db-server-1', label: 'Database 1' },
  { id: 'db-server-2', label: 'Database 2' },
  { id: 'workstation-1', label: 'Workstation 1' },
  { id: 'workstation-3', label: 'Workstation 3' },
  { id: 'cloud-gw', label: 'Cloud Gateway' },
  { id: 'dmz-fw', label: 'DMZ Firewall' },
  { id: 'web-proxy', label: 'Reverse Proxy' },
  { id: 'mail-server', label: 'Mail Server' },
  { id: 'iot-device-1', label: 'IoT Sensor 1' },
];

const INTENSITY_LEVELS = ['low', 'medium', 'high', 'critical'];
const INTENSITY_COLORS = { low: '#00ff88', medium: '#ffcc00', high: '#ff8800', critical: '#ff2244' };

export default function AttackPanel({ socket, activeAttacks = [], onAttackLaunch }) {
  const [selectedType, setSelectedType] = useState('ddos');
  const [selectedTarget, setSelectedTarget] = useState('');
  const [intensity, setIntensity] = useState(2);
  const [launching, setLaunching] = useState(false);
  const [confirmMode, setConfirmMode] = useState(false);
  const [educationMode, setEducationMode] = useState(false);

  const meta = ATTACK_META[selectedType];
  const intensityLabel = INTENSITY_LEVELS[intensity];
  const intensityColor = INTENSITY_COLORS[intensityLabel];

  const handleLaunch = () => {
    if (!socket) return;
    if (!confirmMode) { setConfirmMode(true); return; }
    setConfirmMode(false);
    setLaunching(true);
    socket.emit('launch_attack', { type: selectedType, targetId: selectedTarget || undefined, intensity: intensityLabel });
    if (onAttackLaunch) onAttackLaunch({ type: selectedType, targetId: selectedTarget, intensity: intensityLabel });
    setTimeout(() => setLaunching(false), 1200);
  };

  const handleStopAll = () => {
    if (!socket) return;
    socket.emit('stop_all_attacks');
    setConfirmMode(false);
  };

  const EDUCATION = {
    ddos: 'DDoS exploits multiple compromised hosts to overwhelm network bandwidth or application resources. Prevention: rate limiting, traffic scrubbing, Anycast diffusion.',
    bruteforce: 'Automated credential guessing using leaked databases or dictionary lists. Prevention: account lockout, MFA, fail2ban, SSH key auth.',
    mitm: 'ARP cache poisoning reroutes LAN traffic through attacker for interception. Prevention: Dynamic ARP Inspection, 802.1X, encrypted protocols.',
    malware: 'Malicious code achieving persistence, lateral movement via SMB/WMI, and C2 communication. Prevention: EDR, network segmentation, least privilege.',
    ransomware: 'Encrypts files using hybrid encryption; spreads via SMB shares. Prevention: offline backups, network segmentation, email filtering.',
    portscan: 'Reconnaissance using TCP SYN/ACK probes to map open services. Prevention: firewall egress filtering, IDS signatures, port knocking.',
    phishing: 'Social engineering via email spoofing to steal credentials. Prevention: DMARC/SPF/DKIM, user awareness, email sandboxing.',
    packetflood: 'ICMP/UDP packet storm causing interface saturation. Prevention: BPF filters, null-routing, ISP-level rate limiting.'
  };

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />

      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">ATTACK SIMULATOR</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setEducationMode(e => !e)} className="text-xs px-2 py-0.5 border"
            style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em', borderColor: educationMode ? '#00ff88' : '#0a2a4a', color: educationMode ? '#00ff88' : '#445566' }}>
            EDU
          </button>
          {activeAttacks.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 6px #ff2244' }} />
              <span style={{ color: '#ff4455', fontSize: '0.65rem', fontFamily: 'monospace' }}>{activeAttacks.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1">
          {Object.entries(ATTACK_META).map(([type, m]) => (
            <button key={type} onClick={() => { setSelectedType(type); setConfirmMode(false); }}
              className="flex flex-col items-center gap-0.5 p-1.5 border transition-all"
              style={{ borderColor: selectedType === type ? m.color : '#0a2a4a', background: selectedType === type ? `${m.color}15` : 'transparent', boxShadow: selectedType === type ? `0 0 12px ${m.color}44` : 'none' }}>
              <span style={{ fontSize: '1rem' }}>{m.icon}</span>
              <span style={{ fontSize: '0.55rem', letterSpacing: '0.05em', fontFamily: 'monospace', color: selectedType === type ? m.color : '#446677', textTransform: 'uppercase' }}>{m.label}</span>
            </button>
          ))}
        </div>

        {educationMode && (
          <div className="p-2 border" style={{ borderColor: '#00ff8833', background: 'rgba(0,255,136,0.04)', fontSize: '0.68rem', fontFamily: 'monospace', color: '#66ffaa', lineHeight: '1.5' }}>
            <div style={{ color: '#00ff88', marginBottom: '4px', fontWeight: 'bold' }}>EDUCATIONAL MODE: {meta.label.toUpperCase()}</div>
            {EDUCATION[selectedType]}
          </div>
        )}

        <div className="border p-2" style={{ borderColor: `${meta.color}33`, background: `${meta.color}08` }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
            <div>
              <div style={{ color: meta.color, fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 'bold', textShadow: `0 0 8px ${meta.color}` }}>{meta.label}</div>
              <div style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.62rem' }}>{meta.desc}</div>
            </div>
            <div className="ml-auto">
              <span className="node-badge" style={{ color: INTENSITY_COLORS[meta.intensity], borderColor: INTENSITY_COLORS[meta.intensity], fontSize: '0.55rem' }}>{meta.intensity}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="cyber-title block mb-1" style={{ fontSize: '0.58rem' }}>TARGET NODE</label>
          <select value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)} className="cyber-select w-full">
            <option value="">AUTO-SELECT</option>
            {TARGETS.map(t => <option key={t.id} value={t.id}>{t.id} — {t.label}</option>)}
          </select>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <label className="cyber-title" style={{ fontSize: '0.58rem' }}>INTENSITY</label>
            <span style={{ color: intensityColor, fontFamily: 'monospace', fontSize: '0.65rem', textShadow: `0 0 8px ${intensityColor}` }}>{intensityLabel.toUpperCase()}</span>
          </div>
          <input type="range" min={0} max={3} value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="cyber-slider w-full" />
          <div className="flex justify-between mt-1">
            {INTENSITY_LEVELS.map((lvl, i) => (
              <span key={lvl} style={{ color: intensity === i ? INTENSITY_COLORS[lvl] : '#223344', fontSize: '0.55rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{lvl.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {activeAttacks.length > 0 && (
          <div>
            <label className="cyber-title block mb-1" style={{ fontSize: '0.58rem' }}>ACTIVE ATTACKS</label>
            <div className="flex flex-col gap-1">
              {activeAttacks.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-1.5 border" style={{ borderColor: '#ff224433', background: 'rgba(255,34,68,0.05)' }}>
                  <div className="w-1 h-1 rounded-full flex-shrink-0 animate-pulse" style={{ background: ATTACK_META[a.type]?.color || '#ff2244' }} />
                  <span style={{ color: '#cc3344', fontFamily: 'monospace', fontSize: '0.65rem', flex: 1 }}>{a.type?.toUpperCase()}</span>
                  <span style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.6rem' }}>{a.targetId?.slice(0, 12)}</span>
                  <div className="h-1 flex-1 max-w-16" style={{ background: '#0a1525' }}>
                    <div className="h-full" style={{ width: `${a.progress || 0}%`, background: '#ff2244', transition: 'width 0.3s' }} />
                  </div>
                  <button onClick={() => socket?.emit('stop_attack', a.id)} style={{ color: '#ff4455', fontFamily: 'monospace', fontSize: '0.6rem', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-auto pt-2">
          <button onClick={handleLaunch} disabled={launching}
            className="flex-1 cyber-btn"
            style={{
              borderColor: confirmMode ? '#ff8800' : meta.color,
              color: confirmMode ? '#ff8800' : meta.color,
              background: launching ? `${meta.color}22` : confirmMode ? 'rgba(255,136,0,0.12)' : `${meta.color}0f`,
              boxShadow: confirmMode ? '0 0 20px rgba(255,136,0,0.4)' : `0 0 12px ${meta.color}33`,
              fontSize: '0.72rem', letterSpacing: '0.2em', padding: '8px'
            }}>
            {launching ? '⟳ LAUNCHING...' : confirmMode ? '⚠ CONFIRM LAUNCH' : `▶ LAUNCH ${meta.label.toUpperCase()}`}
          </button>
          {activeAttacks.length > 0 && (
            <button onClick={handleStopAll} className="cyber-btn danger" style={{ padding: '8px 12px' }}>◼ STOP ALL</button>
          )}
        </div>
      </div>
    </div>
  );
}
