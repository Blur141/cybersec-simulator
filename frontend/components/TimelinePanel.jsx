import { useState, useEffect, useRef } from 'react';

const ATTACK_COLORS = { ddos: '#ff2200', bruteforce: '#ff8800', mitm: '#aa00ff', malware: '#ff0055', ransomware: '#ff0000', portscan: '#00ffff', phishing: '#ffff00', packetflood: '#ff6600' };

export default function TimelinePanel({ socket, activeAttacks = [] }) {
  const [events, setEvents] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [scrubPos, setScrubPos] = useState(100);
  const [analysts, setAnalysts] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chat, setChat] = useState([]);
  const [tab, setTab] = useState('timeline');
  const timelineRef = useRef([]);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!socket) return;
    const handleAttackStart = (attack) => {
      const event = { id: attack.id, type: 'attack_started', attackType: attack.type, target: attack.targetId, time: Date.now(), relTime: Date.now() - startTimeRef.current };
      timelineRef.current = [...timelineRef.current, event];
      setEvents([...timelineRef.current]);
    };
    const handleAttackEnd = ({ id }) => {
      const event = { id, type: 'attack_ended', time: Date.now(), relTime: Date.now() - startTimeRef.current };
      timelineRef.current = [...timelineRef.current, event];
      setEvents([...timelineRef.current]);
    };
    const handleAnalystJoin = ({ analyst }) => setAnalysts(prev => [...prev.filter(a => a.id !== analyst.id), analyst]);
    const handleAnalystLeave = ({ id }) => setAnalysts(prev => prev.filter(a => a.id !== id));
    const handleMsg = (msg) => setChat(prev => [...prev.slice(-50), msg]);
    socket.on('attack_started', handleAttackStart);
    socket.on('attack_ended', handleAttackEnd);
    socket.on('attack_stopped', ({ id }) => handleAttackEnd({ id }));
    socket.on('analyst_joined', handleAnalystJoin);
    socket.on('analyst_left', handleAnalystLeave);
    socket.on('analyst_message', handleMsg);
    return () => {
      socket.off('attack_started', handleAttackStart);
      socket.off('attack_ended', handleAttackEnd);
      socket.off('analyst_joined', handleAnalystJoin);
      socket.off('analyst_left', handleAnalystLeave);
      socket.off('analyst_message', handleMsg);
    };
  }, [socket]);

  const sendChat = (e) => {
    if (e.key !== 'Enter' || !chatInput.trim()) return;
    socket?.emit('chat_message', chatInput.trim());
    setChatInput('');
  };

  const totalDuration = Math.max(60000, Date.now() - startTimeRef.current);

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">TIMELINE // COLLAB</span>
        <div className="flex gap-1">
          {['timeline', 'replay', 'analysts'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="text-xs px-2 py-0.5 border"
              style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderColor: tab === t ? '#00f0ff' : '#0a2a4a', color: tab === t ? '#00f0ff' : '#334455', background: tab === t ? 'rgba(0,240,255,0.08)' : 'transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2" style={{ minHeight: 0 }}>
        {tab === 'timeline' && (
          <div>
            <div className="relative h-8 mb-2">
              <div className="absolute inset-0" style={{ background: '#0a1525', borderRadius: '1px' }}>
                {events.map((ev, i) => {
                  const pct = (ev.relTime / totalDuration) * 100;
                  const c = ev.type === 'attack_started' ? (ATTACK_COLORS[ev.attackType] || '#ff2244') : '#00ff88';
                  return (
                    <div key={i} className="absolute top-0 bottom-0" style={{ left: `${pct}%`, width: '2px', background: c, opacity: 0.8, boxShadow: `0 0 4px ${c}` }} title={`${ev.attackType || ev.type} @ ${new Date(ev.time).toTimeString().slice(0, 8)}`} />
                  );
                })}
                <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400" style={{ left: `${scrubPos}%`, boxShadow: '0 0 6px #00f0ff' }} />
              </div>
            </div>
            <input type="range" min={0} max={100} value={scrubPos} onChange={e => setScrubPos(Number(e.target.value))} className="cyber-slider w-full mb-2" />
            <div className="flex gap-2 mb-3">
              <button onClick={() => setPlaying(p => !p)} className="cyber-btn flex-1" style={{ padding: '5px', fontSize: '0.65rem' }}>
                {playing ? '⏸ PAUSE' : '▶ REPLAY'}
              </button>
              <button onClick={() => { setScrubPos(0); setPlaying(false); }} className="cyber-btn" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>⟪ RESET</button>
            </div>
            <div className="flex flex-col gap-1">
              {events.slice().reverse().map((ev, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 px-1 hover:bg-white/5">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ev.type === 'attack_started' ? (ATTACK_COLORS[ev.attackType] || '#ff2244') : '#00ff88' }} />
                  <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem', minWidth: '50px' }}>{new Date(ev.time).toTimeString().slice(0, 8)}</span>
                  <span style={{ color: ev.type === 'attack_started' ? '#cc3344' : '#00aa55', fontFamily: 'monospace', fontSize: '0.65rem', flex: 1 }}>
                    {ev.type === 'attack_started' ? `ATTACK: ${ev.attackType}` : 'ATTACK ENDED'}
                  </span>
                  {ev.target && <span style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.6rem' }}>{ev.target.slice(0, 12)}</span>}
                </div>
              ))}
              {events.length === 0 && <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.65rem', padding: '8px 4px' }}>No events recorded yet...</div>}
            </div>
          </div>
        )}

        {tab === 'replay' && (
          <div className="flex flex-col gap-2">
            <div className="p-2 border" style={{ borderColor: '#0a2a4a' }}>
              <div className="cyber-title mb-2" style={{ fontSize: '0.58rem' }}>SESSION STATISTICS</div>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { l: 'TOTAL ATTACKS', v: events.filter(e => e.type === 'attack_started').length },
                  { l: 'ACTIVE NOW', v: activeAttacks.length },
                  { l: 'SESSION TIME', v: `${Math.floor((Date.now() - startTimeRef.current) / 60000)}m` },
                  { l: 'ANALYSTS', v: analysts.length + 1 },
                ].map(({ l, v }) => (
                  <div key={l} className="p-1.5 border" style={{ borderColor: '#0a2a4a' }}>
                    <div style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.55rem' }}>{l}</div>
                    <div style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '0.85rem' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-2 border" style={{ borderColor: '#0a2a4a' }}>
              <div className="cyber-title mb-2" style={{ fontSize: '0.58rem' }}>ATTACK BREAKDOWN</div>
              {Object.entries(ATTACK_COLORS).map(([type, color]) => {
                const count = events.filter(e => e.attackType === type).length;
                if (count === 0) return null;
                return (
                  <div key={type} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 flex-shrink-0" style={{ background: color }} />
                    <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.65rem', color: '#5588aa', textTransform: 'uppercase' }}>{type}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color }}>×{count}</span>
                  </div>
                );
              })}
              {events.filter(e => e.type === 'attack_started').length === 0 && (
                <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.65rem' }}>No attacks recorded</div>
              )}
            </div>
          </div>
        )}

        {tab === 'analysts' && (
          <div className="flex flex-col h-full gap-2">
            <div>
              <div className="cyber-title mb-1.5" style={{ fontSize: '0.58rem' }}>CONNECTED ANALYSTS</div>
              <div className="flex items-center gap-2 p-1.5 border mb-1" style={{ borderColor: '#00ff8833', background: 'rgba(0,255,136,0.04)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
                <span style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '0.65rem' }}>You (local)</span>
                <span className="ml-auto node-badge" style={{ color: '#00aa44', borderColor: '#00aa44', fontSize: '0.55rem' }}>ACTIVE</span>
              </div>
              {analysts.map(a => (
                <div key={a.id} className="flex items-center gap-2 p-1.5 border mb-1" style={{ borderColor: '#0a2a4a' }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00aaff', boxShadow: '0 0 6px #00aaff' }} />
                  <span style={{ color: '#5588aa', fontFamily: 'monospace', fontSize: '0.65rem' }}>{a.name}</span>
                  <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem', marginLeft: 'auto' }}>{new Date(a.joinTime).toTimeString().slice(0, 8)}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
              <div className="cyber-title mb-1" style={{ fontSize: '0.58rem' }}>ANALYST CHAT</div>
              <div className="flex-1 overflow-y-auto border p-1 mb-1" style={{ borderColor: '#0a2a4a', minHeight: 0 }}>
                {chat.map((m, i) => (
                  <div key={i} className="py-0.5">
                    <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem' }}>{new Date(m.timestamp).toTimeString().slice(0, 8)}</span>
                    <span style={{ color: '#00aaff', fontFamily: 'monospace', fontSize: '0.65rem' }}> {m.analyst?.name}: </span>
                    <span style={{ color: '#5588aa', fontFamily: 'monospace', fontSize: '0.65rem' }}>{m.message}</span>
                  </div>
                ))}
                {chat.length === 0 && <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.65rem', padding: '4px' }}>No messages yet...</div>}
              </div>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={sendChat}
                className="cyber-input" style={{ fontSize: '0.7rem' }} placeholder="Type message + Enter" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
