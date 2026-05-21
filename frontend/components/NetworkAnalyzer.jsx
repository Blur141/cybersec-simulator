import { useState, useEffect, useRef } from 'react';

const PROTO_COLORS = { HTTP: '#00aaff', HTTPS: '#00ff88', TCP: '#00f0ff', UDP: '#ffcc00', DNS: '#aa44ff', ICMP: '#ff8800', ARP: '#ff4466', SSH: '#44ffaa', SMTP: '#ff6644', FTP: '#88aaff', TLS: '#00ff88' };
const THREAT_COLORS = { normal: '#223344', suspicious: '#ff880033', malicious: '#ff224433', blocked: '#00ff8822' };
const THREAT_LABELS = { normal: '', suspicious: '⚠', malicious: '🔴', blocked: '✓' };

function PacketRow({ pkt, selected, onClick }) {
  const color = PROTO_COLORS[pkt.protocol] || '#445566';
  const bg = THREAT_COLORS[pkt.threat] || THREAT_COLORS.normal;
  return (
    <div onClick={() => onClick(pkt)}
      className="flex items-center gap-1 px-1 py-0.5 cursor-pointer hover:bg-white/5 border-b"
      style={{ borderColor: '#060e1c', background: selected ? `${color}15` : bg, borderLeft: selected ? `2px solid ${color}` : '2px solid transparent' }}>
      <span style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.58rem', minWidth: '60px' }}>{pkt.timestamp.slice(11, 22)}</span>
      <span style={{ color, fontFamily: 'monospace', fontSize: '0.6rem', minWidth: '48px', textAlign: 'center', border: `1px solid ${color}44`, padding: '0 3px', fontSize: '0.55rem' }}>{pkt.protocol}</span>
      <span style={{ color: pkt.threat === 'malicious' ? '#ff4455' : '#4488aa', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{pkt.src}</span>
      <span style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.6rem' }}>→</span>
      <span style={{ color: '#336688', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{pkt.dst}</span>
      <span style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.58rem', minWidth: '40px', textAlign: 'right' }}>{pkt.size}B</span>
      <span style={{ minWidth: '12px', textAlign: 'center', fontSize: '0.65rem' }}>{THREAT_LABELS[pkt.threat] || ''}</span>
    </div>
  );
}

function PacketDetail({ pkt }) {
  if (!pkt) return (
    <div className="flex-1 flex items-center justify-center" style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.65rem' }}>
      Select a packet to inspect
    </div>
  );
  const color = PROTO_COLORS[pkt.protocol] || '#445566';
  const layers = {
    'Ethernet': { 'Dst MAC': pkt.dstMac || '08:00:27:4e:66:a1', 'Src MAC': pkt.srcMac || '00:50:56:c0:00:01', 'Type': `0x0800 (${pkt.protocol === 'ARP' ? 'ARP' : 'IPv4'})` },
    'Internet Protocol': { 'Src': pkt.src?.split(':')[0] || '?', 'Dst': pkt.dst?.split(':')[0] || '?', 'TTL': pkt.ttl || 64, 'Length': pkt.size || 0, 'Protocol': pkt.protocol },
    [pkt.protocol]: { 'Src Port': pkt.src?.split(':')[1] || '-', 'Dst Port': pkt.dst?.split(':')[1] || '-', 'Flags': pkt.flags || 'N/A', 'Length': pkt.size, 'Info': pkt.info || '' },
  };
  if (pkt.threat === 'malicious') layers['⚠ Threat Analysis'] = { 'Classification': 'MALICIOUS', 'Rule Match': 'Suricata ET-MALWARE-C2-BEACON', 'Severity': 'HIGH', 'Action': 'ALERT', 'C2 Server': pkt.src?.includes('198.51') ? '198.51.100.10 (Known C2)' : 'Unknown' };
  if (pkt.threat === 'suspicious') layers['⚠ Anomaly Detection'] = { 'Classification': 'SUSPICIOUS', 'Reason': pkt.protocol === 'ARP' ? 'Gratuitous ARP from unexpected host' : 'High frequency from single source', 'Action': 'MONITOR' };

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <div className="flex items-center gap-2 mb-2">
        <div className="node-badge" style={{ color, borderColor: `${color}66`, fontSize: '0.6rem' }}>{pkt.protocol}</div>
        <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: '#5588aa' }}>{pkt.info}</span>
        {pkt.threat === 'malicious' && <span style={{ color: '#ff2244', fontFamily: 'monospace', fontSize: '0.6rem', marginLeft: 'auto' }}>🔴 MALICIOUS TRAFFIC</span>}
        {pkt.threat === 'suspicious' && <span style={{ color: '#ff8800', fontFamily: 'monospace', fontSize: '0.6rem', marginLeft: 'auto' }}>⚠ SUSPICIOUS</span>}
      </div>
      {Object.entries(layers).map(([layer, fields]) => (
        <div key={layer} className="mb-2 border" style={{ borderColor: '#0a2a4a' }}>
          <div className="px-2 py-1" style={{ background: '#0a1525', fontFamily: 'monospace', fontSize: '0.62rem', color: color, letterSpacing: '0.05em' }}>{layer}</div>
          <div className="p-1.5">
            {Object.entries(fields).map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#334455', minWidth: '80px' }}>{k}:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: k === 'Classification' ? '#ff4455' : '#5588aa' }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StatBar({ label, value, max = 100, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#334455', minWidth: '40px' }}>{label}</span>
      <div className="flex-1 h-1.5" style={{ background: '#0a1525' }}>
        <div className="h-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontFamily: 'monospace', fontSize: '0.58rem', color, minWidth: '28px', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function NetworkAnalyzer({ socket }) {
  const [packets, setPackets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('');
  const [capturing, setCapturing] = useState(true);
  const [stats, setStats] = useState({ total: 0, tcp: 0, udp: 0, icmp: 0, arp: 0, dns: 0, malicious: 0, blocked: 0 });
  const [tab, setTab] = useState('capture');
  const scrollRef = useRef(null);
  const capturingRef = useRef(true);
  capturingRef.current = capturing;

  const enrichPacket = (pkt, activeAttacks) => {
    const enriched = { ...pkt, threat: 'normal' };
    if (pkt.src?.includes('185.220.101.47') || pkt.src?.includes('198.51.100')) enriched.threat = 'malicious';
    else if (pkt.protocol === 'ARP') enriched.threat = 'suspicious';
    else if (activeAttacks?.length > 0 && Math.random() < 0.08) enriched.threat = 'suspicious';
    enriched.ttl = 64;
    enriched.srcMac = enriched.threat === 'malicious' ? 'de:ad:be:ef:00:01' : `${Math.floor(Math.random() * 255).toString(16).padStart(2, '0')}:${Math.floor(Math.random() * 255).toString(16).padStart(2, '0')}:00:00:01`;
    enriched.dstMac = '08:00:27:4e:66:a1';
    return enriched;
  };

  useEffect(() => {
    if (!socket) return;
    const handlePacket = (pkt) => {
      if (!capturingRef.current) return;
      const enriched = enrichPacket(pkt, []);
      setPackets(prev => [enriched, ...prev].slice(0, 300));
      setStats(prev => ({
        total: prev.total + 1,
        tcp: prev.tcp + (pkt.protocol === 'TCP' || pkt.protocol === 'HTTP' || pkt.protocol === 'HTTPS' ? 1 : 0),
        udp: prev.udp + (pkt.protocol === 'UDP' || pkt.protocol === 'DNS' ? 1 : 0),
        icmp: prev.icmp + (pkt.protocol === 'ICMP' ? 1 : 0),
        arp: prev.arp + (pkt.protocol === 'ARP' ? 1 : 0),
        dns: prev.dns + (pkt.protocol === 'DNS' ? 1 : 0),
        malicious: prev.malicious + (enriched.threat === 'malicious' ? 1 : 0),
        blocked: prev.blocked + (enriched.threat === 'blocked' ? 1 : 0),
      }));
    };
    socket.on('packet_captured', handlePacket);
    return () => socket.off('packet_captured', handlePacket);
  }, [socket]);

  useEffect(() => {
    if (capturing && scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [packets, capturing]);

  const filterLower = filter.toLowerCase();
  const filteredPkts = packets.filter(p =>
    !filterLower ||
    p.protocol?.toLowerCase().includes(filterLower) ||
    p.src?.toLowerCase().includes(filterLower) ||
    p.dst?.toLowerCase().includes(filterLower) ||
    p.info?.toLowerCase().includes(filterLower) ||
    (filterLower === 'malicious' && p.threat === 'malicious') ||
    (filterLower === 'suspicious' && p.threat === 'suspicious')
  );

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
      <div className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">NETWORK ANALYZER</span>
        <div className="flex gap-1">
          {['capture', 'stats', 'flows'].map(t => (
            <button key={t} onClick={() => setTab(t)} className="text-xs px-2 py-0.5 border"
              style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderColor: tab === t ? '#00f0ff' : '#0a2a4a', color: tab === t ? '#00f0ff' : '#334455', background: tab === t ? 'rgba(0,240,255,0.08)' : 'transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === 'capture' && (
        <div className="flex flex-col flex-1" style={{ minHeight: 0 }}>
          <div className="flex items-center gap-2 px-2 py-1.5 border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${capturing ? 'animate-pulse' : ''}`} style={{ background: capturing ? '#ff2244' : '#334455', boxShadow: capturing ? '0 0 6px #ff2244' : 'none' }} />
              <span style={{ color: capturing ? '#ff4455' : '#334455', fontFamily: 'monospace', fontSize: '0.6rem' }}>{capturing ? 'REC' : 'PAUSED'}</span>
            </div>
            <button onClick={() => setCapturing(c => !c)} className="cyber-btn" style={{ padding: '2px 8px', fontSize: '0.6rem' }}>{capturing ? '⏸' : '▶'}</button>
            <button onClick={() => { setPackets([]); setStats({ total: 0, tcp: 0, udp: 0, icmp: 0, arp: 0, dns: 0, malicious: 0, blocked: 0 }); }} className="cyber-btn" style={{ padding: '2px 8px', fontSize: '0.6rem' }}>⟳</button>
            <input value={filter} onChange={e => setFilter(e.target.value)} className="cyber-input flex-1" style={{ fontSize: '0.65rem', padding: '2px 6px' }} placeholder="filter: ip, proto, malicious..." />
            <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.58rem', flexShrink: 0 }}>{filteredPkts.length}/{stats.total}</span>
          </div>

          <div className="flex flex-col border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
            <div className="flex items-center gap-1 px-1 py-0.5" style={{ background: '#050d0d' }}>
              {['TIME', 'PROTO', 'SOURCE', '', 'DEST', 'SIZE', ''].map((h, i) => (
                <span key={i} style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#1a3344', letterSpacing: '0.08em', minWidth: i === 0 ? '60px' : i === 1 ? '48px' : i === 3 ? '12px' : i === 5 ? '40px' : i === 6 ? '12px' : undefined, flex: (i === 2 || i === 4) ? 1 : undefined, textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-1" style={{ minHeight: 0 }}>
            <div ref={scrollRef} className="overflow-y-auto" style={{ flex: selected ? '0 0 55%' : '1', minHeight: 0 }}>
              {filteredPkts.map((pkt, i) => (
                <PacketRow key={i} pkt={pkt} selected={selected === pkt} onClick={setSelected} />
              ))}
              {filteredPkts.length === 0 && <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.65rem', padding: '12px 8px' }}>Waiting for packets...</div>}
            </div>
            {selected && (
              <div className="flex flex-col border-l overflow-hidden" style={{ flex: '0 0 45%', borderColor: '#0a2a4a', minHeight: 0 }}>
                <div className="flex items-center justify-between px-2 py-1 border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
                  <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.08em' }}>PACKET DETAIL</span>
                  <button onClick={() => setSelected(null)} style={{ color: '#445566', fontSize: '0.7rem', cursor: 'pointer' }}>✕</button>
                </div>
                <PacketDetail pkt={selected} />
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'stats' && (
        <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-2">
          <div>
            <div className="cyber-title mb-1.5" style={{ fontSize: '0.58rem' }}>PACKET STATISTICS</div>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {[
                { l: 'TOTAL', v: stats.total, c: '#00f0ff' },
                { l: 'MALICIOUS', v: stats.malicious, c: '#ff2244' },
                { l: 'TCP', v: stats.tcp, c: '#00aaff' },
                { l: 'UDP/DNS', v: stats.udp, c: '#ffcc00' },
              ].map(({ l, v, c }) => (
                <div key={l} className="p-1.5 border" style={{ borderColor: '#0a2a4a' }}>
                  <div style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.55rem' }}>{l}</div>
                  <div style={{ color: c, fontFamily: 'monospace', fontSize: '0.9rem', textShadow: `0 0 8px ${c}` }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="cyber-title mb-1.5" style={{ fontSize: '0.58rem' }}>PROTOCOL DISTRIBUTION</div>
            <StatBar label="TCP" value={stats.tcp} max={Math.max(stats.total, 1)} color="#00aaff" />
            <StatBar label="UDP" value={stats.udp} max={Math.max(stats.total, 1)} color="#ffcc00" />
            <StatBar label="ICMP" value={stats.icmp} max={Math.max(stats.total, 1)} color="#ff8800" />
            <StatBar label="ARP" value={stats.arp} max={Math.max(stats.total, 1)} color="#ff4466" />
            <StatBar label="DNS" value={stats.dns} max={Math.max(stats.total, 1)} color="#aa44ff" />
          </div>
          {stats.malicious > 0 && (
            <div className="p-2 border attack-critical" style={{ borderColor: '#ff224433' }}>
              <div style={{ color: '#ff4455', fontFamily: 'monospace', fontSize: '0.65rem', marginBottom: '4px' }}>🔴 THREAT SUMMARY</div>
              <div style={{ color: '#992233', fontFamily: 'monospace', fontSize: '0.6rem' }}>{stats.malicious} malicious packets detected</div>
              <div style={{ color: '#661122', fontFamily: 'monospace', fontSize: '0.58rem' }}>Sources: 185.220.101.47, 198.51.100.10</div>
            </div>
          )}
        </div>
      )}

      {tab === 'flows' && (
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="cyber-title mb-2" style={{ fontSize: '0.58rem' }}>ACTIVE FLOWS</div>
          {[
            { src: '192.168.1.11', dst: '10.0.0.100', proto: 'HTTPS', pkts: 245, bytes: '1.2MB', state: 'ESTABLISHED', threat: 'normal' },
            { src: '185.220.101.47', dst: '192.168.1.11', proto: 'TCP', pkts: 8421, bytes: '12.1MB', state: 'SYN_RECV', threat: 'malicious' },
            { src: '192.168.1.11', dst: '8.8.8.8', proto: 'DNS', pkts: 12, bytes: '2.4KB', state: 'UDP', threat: 'normal' },
            { src: '198.51.100.10', dst: '192.168.1.11', proto: 'TCP', pkts: 34, bytes: '45KB', state: 'ESTABLISHED', threat: 'malicious' },
            { src: '10.0.0.254', dst: '192.168.1.11', proto: 'SSH', pkts: 892, bytes: '340KB', state: 'ESTABLISHED', threat: 'normal' },
          ].map((flow, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5 px-1 border-b hover:bg-white/5" style={{ borderColor: '#060e1c' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: flow.threat === 'malicious' ? '#ff2244' : '#00ff88', flexShrink: 0 }} />
              <span style={{ color: flow.threat === 'malicious' ? '#ff4455' : '#4488aa', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{flow.src}</span>
              <span style={{ color: '#223344', fontSize: '0.6rem' }}>→</span>
              <span style={{ color: '#336688', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{flow.dst}</span>
              <span style={{ color: PROTO_COLORS[flow.proto] || '#445566', fontFamily: 'monospace', fontSize: '0.58rem', minWidth: '36px' }}>{flow.proto}</span>
              <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.58rem', minWidth: '36px', textAlign: 'right' }}>{flow.bytes}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
