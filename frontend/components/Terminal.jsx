import { useEffect, useRef, useState } from 'react';

const SEVERITY_COLORS = { CRITICAL: '#ff2244', HIGH: '#ff8800', MEDIUM: '#ffcc00', LOW: '#00ff88', INFO: '#00f0ff' };
const TYPE_ICONS = { firewall: '🔥', ddos: '💥', bruteforce: '🔨', malware: '🦠', mitm: '👁', portscan: '🔍', phishing: '🎣', ransomware: '🔒', default: '⚡' };

function TerminalLine({ entry, index }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 30); return () => clearTimeout(t); }, [index]);
  if (!visible) return null;

  const isAttack = entry.type === 'attack';
  const isFw = entry.type === 'firewall';
  const isPacket = entry.type === 'packet';
  const isSystem = entry.type === 'system';

  let color = '#00f0ff';
  if (isAttack) color = SEVERITY_COLORS[entry.severity] || '#ff8800';
  if (isFw) color = entry.action === 'ACCEPT' ? '#00ff88' : entry.action === 'DROP' ? '#ff2244' : '#ff8800';
  if (isSystem) color = '#aaaacc';

  return (
    <div className="terminal-line flex gap-2 text-xs py-0.5 hover:bg-white/5 px-1" style={{ fontFamily: 'Courier New, monospace' }}>
      <span style={{ color: '#445566', minWidth: '76px', fontSize: '0.65rem' }}>{entry.time}</span>
      {isAttack && (
        <>
          <span style={{ color: SEVERITY_COLORS[entry.severity] || '#ff8800', minWidth: '60px', fontSize: '0.65rem' }}>[{entry.severity}]</span>
          <span style={{ color: '#aa4466' }}>{entry.attackType?.toUpperCase()}</span>
          <span style={{ color: '#445577' }}>›</span>
          <span style={{ color }}>{entry.message}</span>
          {entry.target && <span style={{ color: '#334455', fontSize: '0.65rem' }}>target:{entry.target}</span>}
        </>
      )}
      {isFw && (
        <>
          <span style={{ color: entry.action === 'ACCEPT' ? '#00aa44' : '#aa2233', minWidth: '52px', fontSize: '0.65rem' }}>[FW-{entry.action}]</span>
          <span style={{ color: '#334466' }}>{entry.protocol}</span>
          <span style={{ color: '#556688' }}>{entry.srcIP}:{entry.srcPort}</span>
          <span style={{ color: '#334455' }}>→</span>
          <span style={{ color: '#668899' }}>{entry.dstIP}:{entry.dstPort}</span>
          <span style={{ color: '#334455', fontSize: '0.6rem' }}>{entry.bytes}B</span>
        </>
      )}
      {isPacket && (
        <>
          <span style={{ color: '#004466', minWidth: '52px', fontSize: '0.65rem' }}>[PCAP]</span>
          <span style={{ color: '#007799' }}>{entry.protocol}</span>
          <span style={{ color: '#445566' }}>{entry.src}</span>
          <span style={{ color: '#334455' }}>→</span>
          <span style={{ color: '#556677' }}>{entry.dst}</span>
          <span style={{ color: '#334455', fontSize: '0.6rem' }}>{entry.size}B</span>
        </>
      )}
      {isSystem && <span style={{ color: '#5566aa' }}>{entry.message}</span>}
      {!isAttack && !isFw && !isPacket && !isSystem && <span style={{ color }}>{entry.message || JSON.stringify(entry)}</span>}
    </div>
  );
}

export default function Terminal({ socket, activeAttacks = [] }) {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [paused, setPaused] = useState(false);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const pausedRef = useRef(false);
  const logsRef = useRef([]);

  pausedRef.current = paused;

  const addLog = (entry) => {
    if (pausedRef.current) return;
    logsRef.current = [entry, ...logsRef.current].slice(0, 500);
    setLogs([...logsRef.current]);
  };

  useEffect(() => {
    addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: '▶ CYBERSEC SIMULATOR v2.4.7 — TERMINAL INTERFACE ONLINE' });
    addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: '▶ Monitoring: eth0 eth1 | IDS: Suricata 6.0 | Mode: REALTIME' });
    addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: '▶ Connected to network topology — 28 nodes active' });
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleAttackLog = (entry) => addLog({ ...entry, type: 'attack', time: new Date().toTimeString().slice(0, 8) });
    const handleFwEvent = (entry) => addLog({ ...entry, type: 'firewall', time: new Date().toTimeString().slice(0, 8) });
    const handlePacket = (entry) => addLog({ ...entry, type: 'packet', time: new Date().toTimeString().slice(0, 8) });
    const handleAttackStart = (attack) => addLog({ type: 'attack', time: new Date().toTimeString().slice(0, 8), severity: 'CRITICAL', attackType: attack.type, message: `ATTACK INITIATED: ${attack.name} targeting ${attack.targetId}`, target: attack.targetId });
    const handleAttackEnd = ({ id }) => addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: `◼ Attack simulation ended: ${id.slice(0, 8)}` });
    socket.on('attack_log', handleAttackLog);
    socket.on('firewall_event', handleFwEvent);
    socket.on('packet_captured', handlePacket);
    socket.on('attack_started', handleAttackStart);
    socket.on('attack_ended', handleAttackEnd);
    return () => {
      socket.off('attack_log', handleAttackLog);
      socket.off('firewall_event', handleFwEvent);
      socket.off('packet_captured', handlePacket);
      socket.off('attack_started', handleAttackStart);
      socket.off('attack_ended', handleAttackEnd);
    };
  }, [socket]);

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.type === filter || (filter === 'attack' && l.severity));

  const handleCommand = (e) => {
    if (e.key !== 'Enter' || !input.trim()) return;
    const cmd = input.trim().toLowerCase();
    let response = '';
    if (cmd === 'help') response = 'Commands: help | clear | status | nodes | attacks | netstat';
    else if (cmd === 'clear') { logsRef.current = []; setLogs([]); setInput(''); return; }
    else if (cmd === 'status') response = `System: OPERATIONAL | Attacks: ${activeAttacks.length} active | Uptime: ${Math.floor(performance.now() / 1000)}s`;
    else if (cmd === 'netstat') response = 'Active connections: 234 ESTABLISHED | 12 SYN_WAIT | 5 TIME_WAIT';
    else if (cmd === 'nodes') response = 'Nodes: 28 active | 0 down | 0 compromised';
    else if (cmd === 'attacks') response = activeAttacks.length ? activeAttacks.map(a => `  ${a.type}: ${a.targetId}`).join('\n') : 'No active attacks';
    else response = `bash: ${cmd}: command not found`;
    addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: `root@soc:~$ ${input}` });
    if (response) addLog({ type: 'system', time: new Date().toTimeString().slice(0, 8), message: response });
    setInput('');
  };

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#0a2a4a' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #00ff88' }} />
          <span className="cyber-title text-xs">TERMINAL // LIVE FEED</span>
        </div>
        <div className="flex items-center gap-1">
          {['all', 'attack', 'firewall', 'packet'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="text-xs px-2 py-0.5 border transition-all"
              style={{ fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderColor: filter === f ? '#00f0ff' : '#0a2a4a', color: filter === f ? '#00f0ff' : '#334455', background: filter === f ? 'rgba(0,240,255,0.08)' : 'transparent' }}>
              {f}
            </button>
          ))}
          <button onClick={() => setPaused(p => !p)} className="text-xs px-2 py-0.5 border ml-1"
            style={{ fontFamily: 'monospace', fontSize: '0.6rem', borderColor: paused ? '#ff8800' : '#0a2a4a', color: paused ? '#ff8800' : '#445566' }}>
            {paused ? '▶ RESUME' : '⏸ PAUSE'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
        {activeAttacks.length > 0 && (
          <div className="mb-2 p-1.5 border attack-critical" style={{ borderColor: '#ff2244', background: 'rgba(255,34,68,0.05)' }}>
            {activeAttacks.map(a => (
              <div key={a.id} className="flex items-center gap-2 text-xs" style={{ fontFamily: 'monospace' }}>
                <span className="blink" style={{ color: '#ff2244' }}>●</span>
                <span style={{ color: '#ff4466' }}>ACTIVE: {a.name}</span>
                <span style={{ color: '#aa2233' }}>→ {a.targetId}</span>
                <span style={{ color: '#551122', marginLeft: 'auto', fontSize: '0.6rem' }}>{Math.round(a.progress || 0)}%</span>
              </div>
            ))}
          </div>
        )}
        {filteredLogs.map((log, i) => <TerminalLine key={i} entry={log} index={i % 20} />)}
      </div>

      <div className="border-t px-2 py-1.5 flex items-center gap-2" style={{ borderColor: '#0a2a4a' }}>
        <span style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '0.72rem' }}>root@soc:~$</span>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleCommand}
          className="cyber-input flex-1 bg-transparent border-none outline-none"
          style={{ fontSize: '0.72rem', padding: '0' }}
          placeholder="help | clear | status | nodes | attacks" spellCheck={false} />
        <span className="blink" style={{ color: '#00f0ff' }}>█</span>
      </div>
    </div>
  );
}
