import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import useSocket from '../hooks/useSocket';
import Terminal from '../components/Terminal';
import LinuxTerminal from '../components/LinuxTerminal';
import AttackPanel from '../components/AttackPanel';
import SystemMonitor from '../components/SystemMonitor';
import NodeInspector from '../components/NodeInspector';
import TimelinePanel from '../components/TimelinePanel';
import MissionPanel from '../components/MissionPanel';
import NetworkAnalyzer from '../components/NetworkAnalyzer';
import AssistantOverlay from '../components/AssistantOverlay';

const CyberWorld = dynamic(() => import('../components/CyberWorld'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#000510' }}>
      <div style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '0.8rem', letterSpacing: '0.2em' }}>INITIALIZING 3D ENGINE...</div>
    </div>
  )
});

function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const phases = ['BOOTING KERNEL MODULES...', 'LOADING NETWORK TOPOLOGY...', 'SPAWNING THREAT AGENTS...', 'CALIBRATING 3D RENDERER...', 'CONNECTING WEBSOCKET HUB...', 'INITIALIZING CYBER RANGE...', 'LAUNCHING SOC PLATFORM...'];
  useEffect(() => {
    const iv = setInterval(() => { setProgress(p => { if (p >= 100) { clearInterval(iv); setTimeout(onComplete, 300); return 100; } return p + 1.2; }); }, 25);
    const pv = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 450);
    return () => { clearInterval(iv); clearInterval(pv); };
  }, []);
  return (
    <div className="loading-screen grid-bg" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div className="flex flex-col items-center gap-6" style={{ maxWidth: '520px', width: '100%', padding: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="glitch-text" style={{ fontSize: '1.5rem', letterSpacing: '0.35em', fontFamily: 'monospace', color: '#00f0ff', textShadow: '0 0 20px #00f0ff, 0 0 40px rgba(0,240,255,0.4)', marginBottom: '4px' }}>CYBERRANGE v2.4.7</div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.25em', color: '#334455', fontFamily: 'monospace' }}>INTERACTIVE CYBERSECURITY LEARNING PLATFORM</div>
        </div>
        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
          <svg viewBox="0 0 130 130" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="65" cy="65" r="55" fill="none" stroke="#0a2a4a" strokeWidth="2" />
            <circle cx="65" cy="65" r="55" fill="none" stroke="#00f0ff" strokeWidth="2" strokeDasharray={`${progress * 3.456} 999`} transform="rotate(-90 65 65)" style={{ filter: 'drop-shadow(0 0 8px #00f0ff)', transition: 'stroke-dasharray 0.08s' }} />
            <circle cx="65" cy="65" r="40" fill="none" stroke="#001122" strokeWidth="1" strokeDasharray="3 6" />
            <circle cx="65" cy="65" r="25" fill="none" stroke="#003344" strokeWidth="1" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontFamily: 'monospace', color: '#00f0ff', textShadow: '0 0 12px #00f0ff', fontWeight: 'bold' }}>{Math.floor(progress)}%</div>
          </div>
        </div>
        <div style={{ width: '100%' }}>
          <div style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '0.65rem', marginBottom: '8px', letterSpacing: '0.1em', minHeight: '18px' }}>▶ {phases[phase]}</div>
          <div className="loading-bar"><div className="loading-bar-fill" style={{ width: `${progress}%` }} /></div>
        </div>
        <div style={{ width: '100%', border: '1px solid #0a2a4a', padding: '8px', fontFamily: 'monospace', fontSize: '0.6rem', maxHeight: '90px', overflow: 'hidden' }}>
          {phases.slice(0, phase + 1).map((p, i) => <div key={i} style={{ color: i < phase ? '#1a4455' : '#00ff88' }}>{i < phase ? '✓' : '▶'} {p}</div>)}
        </div>
      </div>
    </div>
  );
}

function StatusBar({ connected, activeAttacks, analystCount, onAssistantToggle, assistantVisible }) {
  const [time, setTime] = useState('');
  useEffect(() => { const t = setInterval(() => setTime(new Date().toTimeString().slice(0, 8)), 1000); setTime(new Date().toTimeString().slice(0, 8)); return () => clearInterval(t); }, []);
  return (
    <div className="flex items-center justify-between px-4 py-1" style={{ background: 'rgba(1,13,31,0.97)', borderBottom: '1px solid #0a2a4a', height: '28px', flexShrink: 0 }}>
      <div className="flex items-center gap-4">
        <div className="glitch-text" style={{ fontSize: '0.7rem', letterSpacing: '0.25em', color: '#00f0ff', fontFamily: 'monospace', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>CYBERRANGE</div>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? '#00ff88' : '#ff2244', boxShadow: `0 0 5px ${connected ? '#00ff88' : '#ff2244'}` }} />
          <span style={{ color: connected ? '#00aa55' : '#cc2233', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{connected ? 'CONNECTED' : 'OFFLINE'}</span>
        </div>
        {activeAttacks.length > 0 && (
          <>
            <span style={{ color: '#0a2a4a' }}>|</span>
            <div className="flex items-center gap-1 attack-critical px-1" style={{ borderColor: '#ff224444' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: '0 0 5px #ff2244' }} />
              <span style={{ color: '#ff4455', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{activeAttacks.length} ACTIVE ATTACK{activeAttacks.length > 1 ? 'S' : ''}</span>
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onAssistantToggle} className="flex items-center gap-1.5 px-2 py-0.5" style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: assistantVisible ? '#00ff88' : '#334455', border: `1px solid ${assistantVisible ? '#00ff8844' : '#0a2a4a'}`, background: assistantVisible ? 'rgba(0,255,136,0.06)' : 'transparent', cursor: 'pointer' }}>
          🤖 ASSISTANT
        </button>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.6rem' }}>ANALYSTS: {analystCount + 1}</span>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <span style={{ color: '#1a4455', fontFamily: 'monospace', fontSize: '0.65rem', letterSpacing: '0.1em' }}>{time}</span>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.6rem' }}>SOC-001</span>
      </div>
    </div>
  );
}

const BOTTOM_TABS = [
  { id: 'shell', label: '⌨ LINUX SHELL', color: '#00ff88' },
  { id: 'terminal', label: '📟 EVENT LOG', color: '#00f0ff' },
  { id: 'network', label: '🔬 PACKET ANALYZER', color: '#aa44ff' },
];

const RIGHT_TABS = [
  { id: 'monitor', label: 'SYSTEM' },
  { id: 'inspector', label: 'NODE' },
  { id: 'timeline', label: 'TIMELINE' },
];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [bottomTab, setBottomTab] = useState('shell');
  const [rightTab, setRightTab] = useState('monitor');
  const [leftTab, setLeftTab] = useState('missions');
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [analystCount, setAnalystCount] = useState(0);
  const [missionState, setMissionState] = useState({});
  const [terminalSideEffects, setTerminalSideEffects] = useState([]);
  const [activeMission, setActiveMission] = useState(null);
  const [lastCommand, setLastCommand] = useState('');
  const [showWorldOnly, setShowWorldOnly] = useState(false);

  const { socket, connected, topology, activeAttacks, error } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleJoin = ({ totalAnalysts }) => setAnalystCount(totalAnalysts);
    const handleLeave = ({ totalAnalysts }) => setAnalystCount(totalAnalysts);
    socket.on('analyst_joined', handleJoin);
    socket.on('analyst_left', handleLeave);
    return () => { socket.off('analyst_joined', handleJoin); socket.off('analyst_left', handleLeave); };
  }, [socket]);

  const handleTerminalSideEffect = useCallback((effect) => {
    setTerminalSideEffects(prev => [...prev.slice(-50), { ...effect, ts: Date.now() }]);
    if (effect.type === 'block_ip' && socket) {
      socket.emit('terminal_action', { type: 'block_ip', ip: effect.ip });
    }
    if (effect.type === 'restart_service' && socket) {
      socket.emit('terminal_action', { type: 'restart_service', service: effect.service });
      if (activeMission) {
        const targetNodeId = activeMission.attackConfig?.targetId;
        if (targetNodeId) setTimeout(() => socket.emit('stop_attack', 'all'), 2000);
      }
    }
  }, [socket, activeMission]);

  const handleMissionStart = useCallback((mission) => {
    setActiveMission(mission);
    setMissionState({ ...mission.systemState, mission: mission.id });
    setBottomTab('shell');
  }, []);

  const handleMissionComplete = useCallback((mission) => {
    setActiveMission(null);
    if (socket) socket.emit('stop_all_attacks');
  }, [socket]);

  if (!loaded) return <LoadingScreen onComplete={() => setLoaded(true)} />;

  return (
    <div className="flex flex-col" style={{ height: '100vh', width: '100vw', overflow: 'hidden', background: '#000510' }}>
      <StatusBar connected={connected} activeAttacks={activeAttacks} analystCount={analystCount} onAssistantToggle={() => setAssistantVisible(v => !v)} assistantVisible={assistantVisible} />

      <div className="flex items-center gap-3 px-3" style={{ background: 'rgba(1,8,20,0.95)', borderBottom: '1px solid #060e1c', height: '26px', flexShrink: 0 }}>
        <div className="flex gap-1">
          {[['missions', 'MISSIONS'], ['attacks', 'ATTACKS']].map(([key, label]) => (
            <button key={key} onClick={() => setLeftTab(key)} style={{ fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: leftTab === key ? '#00f0ff' : '#223344', borderBottom: leftTab === key ? '1px solid #00f0ff' : '1px solid transparent', background: 'none', cursor: 'pointer', padding: '0 6px', transition: 'all 0.2s' }}>{label}</button>
          ))}
        </div>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <div className="flex gap-2">
          {BOTTOM_TABS.map(t => (
            <button key={t.id} onClick={() => setBottomTab(t.id)} style={{ fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.1em', color: bottomTab === t.id ? t.color : '#223344', borderBottom: bottomTab === t.id ? `1px solid ${t.color}` : '1px solid transparent', background: 'none', cursor: 'pointer', padding: '0 4px', transition: 'all 0.2s' }}>{t.label}</button>
          ))}
        </div>
        <span style={{ color: '#0a2a4a' }}>|</span>
        <div className="flex gap-1">
          {RIGHT_TABS.map(t => (
            <button key={t.id} onClick={() => setRightTab(t.id)} style={{ fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.1em', color: rightTab === t.id ? '#00f0ff' : '#223344', borderBottom: rightTab === t.id ? '1px solid #00f0ff' : '1px solid transparent', background: 'none', cursor: 'pointer', padding: '0 4px', transition: 'all 0.2s' }}>{t.label}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          {activeMission && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 border" style={{ borderColor: `${activeMission.color}44`, background: `${activeMission.color}08` }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: activeMission.color }} />
              <span style={{ color: activeMission.color, fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em' }}>{activeMission.icon} {activeMission.name}</span>
            </div>
          )}
          {error && <span style={{ color: '#ff4444', fontFamily: 'monospace', fontSize: '0.6rem' }}>⚠ {error}</span>}
          <span style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.6rem' }}>v2.4.7</span>
        </div>
      </div>

      <div className="flex flex-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <div style={{ width: '230px', flexShrink: 0, borderRight: '1px solid #0a2a4a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {leftTab === 'missions'
            ? <MissionPanel socket={socket} onMissionStart={handleMissionStart} onMissionComplete={handleMissionComplete} terminalSideEffects={terminalSideEffects} />
            : <AttackPanel socket={socket} activeAttacks={activeAttacks} />}
        </div>

        <div className="flex flex-col flex-1" style={{ minWidth: 0, overflow: 'hidden' }}>
          <div className="flex-1" style={{ position: 'relative', minHeight: 0 }}>
            <CyberWorld nodes={topology.nodes} connections={topology.connections} activeAttacks={activeAttacks} onNodeClick={(id) => { setSelectedNode(id); setRightTab('inspector'); }} socket={socket} />
            <div style={{ position: 'absolute', top: '10px', left: '10px', fontFamily: 'monospace', fontSize: '0.58rem', color: '#0a2a4a', pointerEvents: 'none' }}>
              DRAG: ORBIT  |  SCROLL: ZOOM  |  CLICK: INSPECT
            </div>
            {activeAttacks.length > 0 && (
              <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', flexDirection: 'column', gap: '4px', pointerEvents: 'none' }}>
                {activeAttacks.slice(0, 3).map(a => (
                  <div key={a.id} className="attack-critical" style={{ padding: '4px 10px', border: '1px solid #ff224466', background: 'rgba(255,34,68,0.1)', fontFamily: 'monospace', fontSize: '0.6rem', color: '#ff4455', letterSpacing: '0.1em' }}>
                    ⚠ {a.name?.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            {activeMission && (
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '6px 12px', border: `1px solid ${activeMission.color}44`, background: `${activeMission.color}10`, fontFamily: 'monospace', fontSize: '0.62rem', color: activeMission.color, pointerEvents: 'none', letterSpacing: '0.1em' }}>
                {activeMission.icon} MISSION: {activeMission.name.toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ height: '240px', borderTop: '1px solid #0a2a4a', flexShrink: 0, overflow: 'hidden' }}>
            {bottomTab === 'shell' && <LinuxTerminal socket={socket} missionState={missionState} onSideEffect={handleTerminalSideEffect} />}
            {bottomTab === 'terminal' && <Terminal socket={socket} activeAttacks={activeAttacks} />}
            {bottomTab === 'network' && <NetworkAnalyzer socket={socket} />}
          </div>
        </div>

        <div style={{ width: '250px', flexShrink: 0, borderLeft: '1px solid #0a2a4a', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {rightTab === 'monitor' && <SystemMonitor socket={socket} />}
          {rightTab === 'inspector' && <NodeInspector nodeId={selectedNode} nodes={topology.nodes} activeAttacks={activeAttacks} socket={socket} onClose={() => setSelectedNode(null)} />}
          {rightTab === 'timeline' && <TimelinePanel socket={socket} activeAttacks={activeAttacks} />}
        </div>
      </div>

      <AssistantOverlay visible={assistantVisible} onClose={() => setAssistantVisible(false)} activeCommand={lastCommand} activeMission={activeMission} />
    </div>
  );
}
