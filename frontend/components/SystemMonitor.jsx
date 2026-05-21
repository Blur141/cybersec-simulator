import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

function GaugeBar({ label, value, max = 100, color = '#00f0ff', unit = '%' }) {
  const pct = Math.min(100, (value / max) * 100);
  const c = pct > 85 ? '#ff2244' : pct > 65 ? '#ff8800' : color;
  return (
    <div className="mb-1.5">
      <div className="flex justify-between mb-0.5">
        <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#445566', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', color: c, textShadow: `0 0 8px ${c}` }}>{typeof value === 'number' ? value.toFixed(1) : value}{unit}</span>
      </div>
      <div className="health-bar"><div className="health-bar-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})` }} /></div>
    </div>
  );
}

function CoreGrid({ cores = [] }) {
  return (
    <div className="grid grid-cols-8 gap-0.5 mt-1">
      {cores.map((v, i) => {
        const c = v > 85 ? '#ff2244' : v > 60 ? '#ff8800' : v > 30 ? '#ffcc00' : '#00f0ff';
        return (
          <div key={i} title={`Core ${i}: ${v.toFixed(0)}%`}
            style={{ height: '14px', background: `${c}`, opacity: 0.5 + v / 200, borderRadius: '1px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${v}%`, background: c, opacity: 0.7 }} />
          </div>
        );
      })}
    </div>
  );
}

function ProcessRow({ proc }) {
  const cpuColor = proc.cpu > 20 ? '#ff8800' : proc.cpu > 10 ? '#ffcc00' : '#00ff88';
  return (
    <div className="flex items-center gap-2 py-0.5 hover:bg-white/5 px-1 text-xs" style={{ fontFamily: 'monospace' }}>
      <span style={{ color: '#334455', minWidth: '36px', fontSize: '0.6rem' }}>{proc.pid}</span>
      <span style={{ color: '#007788', minWidth: '14px', fontSize: '0.6rem' }}>{proc.state}</span>
      <span style={{ color: '#5588aa', flex: 1, fontSize: '0.65rem' }}>{proc.name}</span>
      <span style={{ color: cpuColor, minWidth: '36px', textAlign: 'right', fontSize: '0.65rem' }}>{proc.cpu?.toFixed(1)}%</span>
      <span style={{ color: '#445566', minWidth: '40px', textAlign: 'right', fontSize: '0.6rem' }}>{proc.mem}MB</span>
    </div>
  );
}

function ContainerRow({ c }) {
  const color = c.status === 'running' ? '#00ff88' : '#ff2244';
  return (
    <div className="flex items-center gap-2 py-0.5 hover:bg-white/5 px-1">
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
      <span style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.65rem', color: '#5588aa' }}>{c.name}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#445566' }}>{c.cpu}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#334455' }}>{c.mem}</span>
      <span style={{ fontFamily: 'monospace', fontSize: '0.55rem', color: '#334455' }}>{c.uptime}</span>
    </div>
  );
}

export default function SystemMonitor({ socket }) {
  const [metrics, setMetrics] = useState(null);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [netHistory, setNetHistory] = useState([]);
  const [tab, setTab] = useState('system');
  const [sshLog, setSshLog] = useState([]);

  useEffect(() => {
    if (!socket) return;
    const handleMetrics = (m) => {
      setMetrics(m);
      setCpuHistory(prev => [...prev.slice(-30), { v: m.cpu?.total || 0 }]);
      setNetHistory(prev => [...prev.slice(-30), { rx: (m.network?.rxBytes || 0) / 1e6, tx: (m.network?.txBytes || 0) / 1e6 }]);
      if (m.ssh) setSshLog(prev => [...m.ssh, ...prev].slice(0, 20));
    };
    socket.on('system_metrics', handleMetrics);
    return () => socket.off('system_metrics', handleMetrics);
  }, [socket]);

  const tabs = ['system', 'processes', 'containers', 'network', 'ssh'];

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">SYSTEM MONITOR</span>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="text-xs px-2 py-0.5 border"
              style={{ fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderColor: tab === t ? '#00f0ff' : '#0a2a4a', color: tab === t ? '#00f0ff' : '#334455', background: tab === t ? 'rgba(0,240,255,0.08)' : 'transparent' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2" style={{ minHeight: 0 }}>
        {tab === 'system' && metrics && (
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="cyber-title" style={{ fontSize: '0.58rem' }}>CPU CORES</span>
                <span style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '0.65rem' }}>{metrics.cpu?.total?.toFixed(1)}% avg</span>
              </div>
              <CoreGrid cores={metrics.cpu?.cores || []} />
            </div>
            <div style={{ height: '45px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuHistory} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs><linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00f0ff" stopOpacity={0.5} /><stop offset="100%" stopColor="#00f0ff" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#00f0ff" strokeWidth={1.5} fill="url(#cpuGrad)" dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <GaugeBar label="MEMORY" value={metrics.memory?.used ? metrics.memory.used / 10.24 : 0} color="#aa44ff" />
            <GaugeBar label="DISK I/O" value={metrics.disk?.util || 0} color="#ffcc00" />
            <div className="grid grid-cols-2 gap-1 mt-1">
              {[
                { l: 'LOAD 1m', v: metrics.load?.[0]?.toFixed(2), u: '' },
                { l: 'LOAD 5m', v: metrics.load?.[1]?.toFixed(2), u: '' },
                { l: 'DISK READ', v: metrics.disk?.read?.toFixed(0), u: 'MB/s' },
                { l: 'DISK WRITE', v: metrics.disk?.write?.toFixed(0), u: 'MB/s' },
              ].map(({ l, v, u }) => (
                <div key={l} className="p-1.5 border" style={{ borderColor: '#0a2a4a' }}>
                  <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
                  <div style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v}{u}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'processes' && metrics?.processes && (
          <div>
            <div className="flex gap-2 px-1 pb-1 border-b" style={{ borderColor: '#0a1525' }}>
              {['PID', 'S', 'NAME', 'CPU', 'MEM'].map((h, i) => (
                <span key={h} style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.08em', minWidth: i === 0 ? '36px' : i === 1 ? '14px' : i === 2 ? 'auto' : '36px', flex: i === 2 ? 1 : undefined }}>{h}</span>
              ))}
            </div>
            {metrics.processes.map((p, i) => <ProcessRow key={i} proc={p} />)}
          </div>
        )}

        {tab === 'containers' && metrics?.containers && (
          <div>
            <div className="flex gap-2 px-1 pb-1 border-b" style={{ borderColor: '#0a1525' }}>
              {['', 'CONTAINER', 'CPU', 'MEM', 'UP'].map(h => (
                <span key={h} style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.08em' }}>{h}</span>
              ))}
            </div>
            {metrics.containers.map((c, i) => <ContainerRow key={i} c={c} />)}
          </div>
        )}

        {tab === 'network' && (
          <div className="flex flex-col gap-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="cyber-title" style={{ fontSize: '0.58rem' }}>NETWORK I/O</span>
              </div>
              <div style={{ height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netHistory} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Line type="monotone" dataKey="rx" stroke="#00f0ff" strokeWidth={1.5} dot={false} isAnimationActive={false} name="RX" />
                    <Line type="monotone" dataKey="tx" stroke="#aa44ff" strokeWidth={1.5} dot={false} isAnimationActive={false} name="TX" />
                    <Tooltip contentStyle={{ background: '#010d1f', border: '1px solid #0a2a4a', fontFamily: 'monospace', fontSize: '0.65rem' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            {metrics && (
              <div className="grid grid-cols-2 gap-1">
                {[
                  { l: 'RX', v: ((metrics.network?.rxBytes || 0) / 1e6).toFixed(1), u: 'MB/s', c: '#00f0ff' },
                  { l: 'TX', v: ((metrics.network?.txBytes || 0) / 1e6).toFixed(1), u: 'MB/s', c: '#aa44ff' },
                  { l: 'PACKETS', v: metrics.network?.packets, u: '/s', c: '#00ff88' },
                  { l: 'CONNS', v: '234', u: '', c: '#ffcc00' },
                ].map(({ l, v, u, c }) => (
                  <div key={l} className="p-1.5 border" style={{ borderColor: '#0a2a4a' }}>
                    <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em' }}>{l}</div>
                    <div style={{ color: c, fontFamily: 'monospace', fontSize: '0.8rem', textShadow: `0 0 8px ${c}` }}>{v}{u}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'ssh' && (
          <div>
            <div className="flex gap-2 px-1 pb-1 border-b mb-1" style={{ borderColor: '#0a1525' }}>
              {['USER', 'SOURCE', 'DURATION', 'STATUS'].map(h => (
                <span key={h} style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.58rem', flex: 1 }}>{h}</span>
              ))}
            </div>
            {sshLog.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5 px-1 hover:bg-white/5">
                <span style={{ color: s.user === 'root' ? '#ff8800' : '#5588aa', fontFamily: 'monospace', fontSize: '0.65rem', flex: 1 }}>{s.user}</span>
                <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem', flex: 2 }}>{s.srcIP}</span>
                <span style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{s.duration}</span>
                <span style={{ color: s.status === 'suspicious' ? '#ff2244' : '#00ff88', fontFamily: 'monospace', fontSize: '0.6rem', flex: 1 }}>{s.status}</span>
              </div>
            ))}
            {sshLog.length === 0 && <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.65rem', padding: '8px 4px' }}>Waiting for SSH data...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
