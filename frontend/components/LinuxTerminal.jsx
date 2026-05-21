import { useState, useEffect, useRef, useCallback } from 'react';
import { executeCommand, COMMAND_COMPLETIONS } from '../utils/terminalCommands';

const HOSTS = [
  { id: 'soc-lab-01', label: 'soc-lab-01', ip: '192.168.1.11', color: '#00f0ff' },
  { id: 'fw-main', label: 'fw-main', ip: '10.0.0.1', color: '#00ff88' },
  { id: 'router-core', label: 'router-core', ip: '10.0.0.254', color: '#aa44ff' },
  { id: 'db-server-1', label: 'db-server-1', ip: '192.168.2.11', color: '#ffcc00' },
];

function TerminalLine({ line }) {
  const isError = line.type === 'error';
  const isCommand = line.type === 'command';
  const isSystem = line.type === 'system';
  const isSuccess = line.type === 'success';
  const isWarning = line.type === 'warning';
  const isMission = line.type === 'mission';

  let color = '#88bbcc';
  if (isError) color = '#ff4466';
  if (isCommand) color = '#00f0ff';
  if (isSystem) color = '#445566';
  if (isSuccess) color = '#00ff88';
  if (isWarning) color = '#ff8800';
  if (isMission) color = '#aa44ff';

  const renderLine = (text) => {
    if (!text) return null;
    const highlight = (str) => {
      const keywords = ['CRITICAL', 'ERROR', 'WARNING', 'FAILED', 'ATTACK', 'BLOCKED', 'DROP', 'ACCEPT', 'ESTABLISHED'];
      const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
      const parts = str.split(ipPattern);
      const ips = str.match(ipPattern) || [];
      return parts.reduce((acc, part, i) => {
        const kwColor = keywords.find(k => part.includes(k));
        acc.push(<span key={`p${i}`}>{part}</span>);
        if (ips[i]) acc.push(<span key={`ip${i}`} style={{ color: '#ffaa00' }}>{ips[i]}</span>);
        return acc;
      }, []);
    };
    return (
      <span>
        {text.includes('CRITICAL') ? <span style={{ color: '#ff2244' }}>{text}</span>
          : text.includes('185.220.101.47') || text.includes('198.51.100') ? <span style={{ color: '#ff6644' }}>{text}</span>
          : text.includes('<<< ') || text.includes('SUSPICIOUS') ? <span style={{ color: '#ff8800' }}>{text}</span>
          : text.includes('Failed password') ? <span style={{ color: '#ff4455' }}>{text}</span>
          : text.includes('Accepted password') ? <span style={{ color: '#ff8800' }}>{text}</span>
          : text.includes('[  OK  ]') || text.includes('ACCEPT') ? <span style={{ color: '#00ff88' }}>{text}</span>
          : text.includes('DROP') || text.includes('[UFW BLOCK]') ? <span style={{ color: '#ff4466' }}>{text}</span>
          : highlight(text)}
      </span>
    );
  };

  return (
    <div className="terminal-line flex gap-0" style={{ lineHeight: '1.4' }}>
      {isCommand && <span style={{ color: '#00ff88', userSelect: 'none' }}>{'> '}</span>}
      {isMission && <span style={{ color: '#aa44ff', userSelect: 'none' }}>{'! '}</span>}
      <span style={{ color, fontFamily: 'Courier New, monospace', fontSize: '0.72rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {renderLine(line.text)}
      </span>
    </div>
  );
}

export default function LinuxTerminal({ socket, missionState, onSideEffect, activeHost: propHost }) {
  const [sessions, setSessions] = useState(() => HOSTS.map(h => ({ hostId: h.id, history: [], input: '', cwd: '/home/analyst', cmdHistory: [], histIdx: -1, state: {} })));
  const [activeSession, setActiveSession] = useState(0);
  const [showCompletion, setShowCompletion] = useState([]);
  const [maximized, setMaximized] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  const session = sessions[activeSession];
  const host = HOSTS[activeSession];

  const pushLines = useCallback((lines, type = 'output') => {
    setSessions(prev => {
      const updated = [...prev];
      const s = { ...updated[activeSession] };
      s.history = [...s.history, ...lines.map(text => ({ text, type }))].slice(-500);
      updated[activeSession] = s;
      return updated;
    });
  }, [activeSession]);

  const handleCommand = useCallback((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setSessions(prev => {
      const updated = [...prev];
      const s = { ...updated[activeSession] };
      const prompt = `root@${host.id}:${s.cwd}# ${trimmed}`;
      s.history = [...s.history, { text: prompt, type: 'command' }].slice(-500);
      s.cmdHistory = [trimmed, ...s.cmdHistory.filter(c => c !== trimmed)].slice(0, 100);
      s.input = '';
      s.histIdx = -1;
      updated[activeSession] = s;
      return updated;
    });

    const currentState = { ...session.state, cwd: session.cwd, history: session.cmdHistory, ...(missionState || {}) };
    const result = executeCommand(trimmed, currentState);

    if (result.output.length > 0) {
      const type = result.error ? 'error' : 'output';
      setSessions(prev => {
        const updated = [...prev];
        const s = { ...updated[activeSession] };
        s.history = [...s.history, ...result.output.map(text => ({ text, type }))].slice(-500);
        updated[activeSession] = s;
        return updated;
      });
    }

    result.sideEffects?.forEach(effect => {
      if (effect.type === 'cwd') {
        setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], cwd: effect.value }; return u; });
      } else if (effect.type === 'clear_terminal') {
        setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], history: [] }; return u; });
      } else if (effect.type === 'block_ip') {
        setSessions(prev => {
          const u = [...prev];
          const s = { ...u[activeSession] };
          s.state = { ...s.state, blockedIPs: [...(s.state.blockedIPs || []), effect.ip] };
          u[activeSession] = s;
          return u;
        });
        setSessions(prev => { const u = [...prev]; const s = { ...u[activeSession] }; s.history = [...s.history, { text: `[  FIREWALL  ] Rule applied: DROP all from ${effect.ip}`, type: 'success' }].slice(-500); u[activeSession] = s; return u; });
        if (socket) socket.emit('terminal_action', { type: 'block_ip', ip: effect.ip });
      } else if (effect.type === 'kill_process') {
        setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], state: { ...u[activeSession].state, malware: false } }; return u; });
        setSessions(prev => { const u = [...prev]; const s = { ...u[activeSession] }; s.history = [...s.history, { text: `[  PROCESS  ] svchost32 (PID ${effect.pid}) terminated`, type: 'success' }].slice(-500); u[activeSession] = s; return u; });
      } else if (effect.type === 'restart_service') {
        setSessions(prev => { const u = [...prev]; const s = { ...u[activeSession] }; s.history = [...s.history, { text: `[  SERVICE  ] ${effect.service} restarted successfully`, type: 'success' }].slice(-500); u[activeSession] = s; return u; });
        if (socket) socket.emit('terminal_action', { type: 'restart_service', service: effect.service });
      } else if (effect.type === 'rate_limit') {
        setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], state: { ...u[activeSession].state, rateLimit: true } }; return u; });
      }

      if (effect.type === 'mission_command' && onSideEffect) {
        onSideEffect(effect);
      }
      if (onSideEffect) onSideEffect(effect);
    });
  }, [activeSession, session, host, missionState, socket, onSideEffect]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleCommand(session.input);
      setShowCompletion([]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSessions(prev => {
        const u = [...prev];
        const s = { ...u[activeSession] };
        const newIdx = Math.min(s.histIdx + 1, s.cmdHistory.length - 1);
        s.histIdx = newIdx;
        s.input = s.cmdHistory[newIdx] || '';
        u[activeSession] = s;
        return u;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSessions(prev => {
        const u = [...prev];
        const s = { ...u[activeSession] };
        const newIdx = Math.max(s.histIdx - 1, -1);
        s.histIdx = newIdx;
        s.input = newIdx >= 0 ? s.cmdHistory[newIdx] : '';
        u[activeSession] = s;
        return u;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const input = session.input;
      if (!input) return;
      const parts = input.split(' ');
      if (parts.length === 1) {
        const completions = COMMAND_COMPLETIONS.filter(c => c.startsWith(input));
        if (completions.length === 1) {
          setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], input: completions[0] + ' ' }; return u; });
        } else if (completions.length > 1) {
          setShowCompletion(completions.slice(0, 12));
          setSessions(prev => { const u = [...prev]; const s = { ...u[activeSession] }; s.history = [...s.history, { text: completions.join('  '), type: 'system' }].slice(-500); u[activeSession] = s; return u; });
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], history: [] }; return u; });
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      setSessions(prev => { const u = [...prev]; const s = { ...u[activeSession] }; s.history = [...s.history, { text: '^C', type: 'error' }].slice(-500); s.input = ''; u[activeSession] = s; return u; });
    }
  }, [activeSession, session, handleCommand]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [sessions, activeSession]);

  useEffect(() => {
    if (!socket) return;
    const handleAttackStart = (attack) => {
      const alertText = `\n⚠  ALERT: ${attack.name} detected! Target: ${attack.targetId}\n    Investigate with: journalctl -u ssh -n 30 | netstat -an | ps aux\n`;
      setSessions(prev => { const u = [...prev]; u[0] = { ...u[0], history: [...u[0].history, { text: alertText, type: 'warning' }] }; return u; });
    };
    socket.on('attack_started', handleAttackStart);
    return () => socket.off('attack_started', handleAttackStart);
  }, [socket]);

  useEffect(() => {
    if (missionState?.mission) {
      setSessions(prev => {
        const u = [...prev];
        u[activeSession] = { ...u[activeSession], state: { ...u[activeSession].state, ...missionState } };
        return u;
      });
    }
  }, [missionState]);

  useEffect(() => {
    setSessions(prev => {
      const u = [...prev];
      u[0] = { ...u[0], history: [
        { text: `╔══════════════════════════════════════════════════════╗`, type: 'system' },
        { text: `║  SOC CYBER RANGE - LINUX TRAINING TERMINAL v2.4.7   ║`, type: 'system' },
        { text: `║  Host: soc-lab-01 | User: root | Zone: Internal     ║`, type: 'system' },
        { text: `╚══════════════════════════════════════════════════════╝`, type: 'system' },
        { text: `Last login: ${new Date().toString()} from 10.0.0.254`, type: 'system' },
        { text: `Type 'help' for available commands. Type 'missions' to see training scenarios.`, type: 'system' },
        { text: ``, type: 'system' },
      ]};
      return u;
    });
  }, []);

  return (
    <div className={`cyber-panel flex flex-col ${maximized ? 'fixed inset-0 z-50' : 'h-full'}`} style={{ background: '#000a0a', minHeight: 0 }} onClick={() => inputRef.current?.focus()}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />

      <div className="flex items-center gap-0 border-b overflow-x-auto flex-shrink-0" style={{ borderColor: '#0a2a4a', background: '#000d0d' }}>
        {HOSTS.map((h, i) => (
          <button key={h.id} onClick={() => setActiveSession(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 flex-shrink-0 transition-all"
            style={{ borderBottom: i === activeSession ? `2px solid ${h.color}` : '2px solid transparent', background: i === activeSession ? `${h.color}12` : 'transparent', fontFamily: 'monospace', fontSize: '0.65rem', color: i === activeSession ? h.color : '#334455' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: h.color, boxShadow: i === activeSession ? `0 0 6px ${h.color}` : 'none' }} />
            {h.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 px-3">
          <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.58rem' }}>{host.ip}</span>
          <button onClick={() => setMaximized(m => !m)} style={{ color: '#334455', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'monospace' }}>{maximized ? '⊟' : '⊞'}</button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0, background: 'rgba(0,8,8,0.95)' }}>
        {session.history.map((line, i) => <TerminalLine key={i} line={line} />)}
      </div>

      <div className="flex items-center gap-0 border-t px-2 py-1.5 flex-shrink-0" style={{ borderColor: '#0a2a1a', background: '#000d0d' }}>
        <span style={{ color: '#00ff88', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', flexShrink: 0 }}>root@{host.id}:</span>
        <span style={{ color: '#00aaff', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', flexShrink: 0 }}>{session.cwd}</span>
        <span style={{ color: '#00ff88', fontFamily: 'Courier New, monospace', fontSize: '0.72rem', flexShrink: 0 }}># </span>
        <input
          ref={inputRef}
          value={session.input}
          onChange={e => setSessions(prev => { const u = [...prev]; u[activeSession] = { ...u[activeSession], input: e.target.value }; return u; })}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none border-none"
          style={{ fontFamily: 'Courier New, monospace', fontSize: '0.72rem', color: '#00f0ff', caretColor: '#00f0ff' }}
          autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          placeholder=""
        />
        <span className="blink" style={{ color: '#00f0ff', fontFamily: 'monospace' }}>█</span>
      </div>
    </div>
  );
}
