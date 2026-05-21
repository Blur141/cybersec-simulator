const NODE_TYPE_ICONS = { firewall: '🔥', router: '🔀', server: '🖥', database: '🗄', endpoint: '💻', cloud: '☁', iot: '📡', attacker: '☠' };
const STATUS_COLORS = { active: '#00ff88', under_attack: '#ff2244', compromised: '#ff0000', recovering: '#ff8800', threat: '#aa44ff' };

function MetricGauge({ label, value, color = '#00f0ff' }) {
  const pct = Math.min(100, Math.max(0, value));
  const c = pct > 85 ? '#ff2244' : pct > 65 ? '#ff8800' : color;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between">
        <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.58rem', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ color: c, fontFamily: 'monospace', fontSize: '0.65rem' }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: '3px', background: '#0a1525', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}

export default function NodeInspector({ nodeId, nodes = [], activeAttacks = [], socket, onClose }) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) {
    return (
      <div className="cyber-panel h-full flex flex-col items-center justify-center p-4" style={{ minHeight: 0 }}>
        <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
        <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.7rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
          <div>CLICK A NODE IN THE</div>
          <div>3D WORLD TO INSPECT</div>
        </div>
      </div>
    );
  }

  const nodeAttacks = activeAttacks.filter(a => a.targetId === nodeId || a.sourceId === nodeId);
  const statusColor = STATUS_COLORS[node.status] || '#00f0ff';
  const icon = NODE_TYPE_ICONS[node.type] || '🖥';

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">NODE INSPECTOR</span>
        {onClose && <button onClick={onClose} style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer' }}>✕</button>}
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2" style={{ minHeight: 0 }}>
        <div className="flex items-start gap-3 p-2 border" style={{ borderColor: `${statusColor}33`, background: `${statusColor}08` }}>
          <div style={{ fontSize: '1.8rem' }}>{icon}</div>
          <div className="flex-1">
            <div style={{ color: '#00f0ff', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold' }}>{node.name}</div>
            <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.62rem', letterSpacing: '0.05em' }}>{node.type.toUpperCase()} // {node.zone?.toUpperCase()}</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                <span style={{ color: statusColor, fontFamily: 'monospace', fontSize: '0.65rem', textShadow: `0 0 8px ${statusColor}` }}>{node.status?.toUpperCase()}</span>
              </div>
              {nodeAttacks.length > 0 && <span className="blink" style={{ color: '#ff2244', fontSize: '0.6rem', fontFamily: 'monospace' }}>⚠ UNDER ATTACK</span>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {[
            { l: 'IP ADDRESS', v: node.ip },
            { l: 'OS', v: node.os?.slice(0, 18) },
            { l: 'HEALTH', v: `${(node.health || 100).toFixed(0)}%`, c: node.health < 30 ? '#ff2244' : node.health < 60 ? '#ff8800' : '#00ff88' },
            { l: 'BANDWIDTH', v: `${node.metrics?.bandwidth?.toFixed(0) || 0}Mbps` },
          ].map(({ l, v, c }) => (
            <div key={l} className="p-1.5 border" style={{ borderColor: '#0a2a4a' }}>
              <div style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.55rem', letterSpacing: '0.08em' }}>{l}</div>
              <div style={{ color: c || '#5588aa', fontFamily: 'monospace', fontSize: '0.68rem', marginTop: '2px' }}>{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 p-2 border" style={{ borderColor: '#0a2a4a' }}>
          <span className="cyber-title block" style={{ fontSize: '0.58rem', marginBottom: '4px' }}>RESOURCE USAGE</span>
          <MetricGauge label="CPU" value={node.metrics?.cpu || 0} color="#00f0ff" />
          <MetricGauge label="MEM" value={node.metrics?.memory || 0} color="#aa44ff" />
          <MetricGauge label="CONNECTIONS" value={(node.metrics?.connections || 0) / 5} color="#ffcc00" />
        </div>

        <div>
          <span className="cyber-title block mb-1" style={{ fontSize: '0.58rem' }}>SERVICES</span>
          <div className="flex flex-wrap gap-1">
            {(node.services || []).map(svc => (
              <span key={svc} className="node-badge" style={{ color: '#00aacc', borderColor: '#0a2a4a', fontSize: '0.58rem' }}>{svc}</span>
            ))}
          </div>
        </div>

        {nodeAttacks.length > 0 && (
          <div className="border p-2" style={{ borderColor: '#ff224433', background: 'rgba(255,34,68,0.05)' }}>
            <span className="cyber-title block mb-1.5" style={{ fontSize: '0.58rem', color: '#ff4455' }}>ACTIVE THREATS</span>
            {nodeAttacks.map(a => (
              <div key={a.id} className="flex items-center gap-2 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse" style={{ background: '#ff2244', boxShadow: '0 0 6px #ff2244' }} />
                <span style={{ color: '#cc3344', fontFamily: 'monospace', fontSize: '0.65rem' }}>{a.name}</span>
                <div className="flex-1 h-1" style={{ background: '#0a1525' }}>
                  <div className="h-full" style={{ width: `${a.progress || 0}%`, background: '#ff2244' }} />
                </div>
                <span style={{ color: '#551122', fontFamily: 'monospace', fontSize: '0.6rem' }}>{Math.round(a.progress || 0)}%</span>
              </div>
            ))}
          </div>
        )}

        {node.attackHistory?.length > 0 && (
          <div>
            <span className="cyber-title block mb-1" style={{ fontSize: '0.58rem' }}>ATTACK HISTORY</span>
            <div className="flex flex-col gap-0.5">
              {node.attackHistory.slice(-5).reverse().map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                  <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.6rem' }}>{new Date(h.time).toTimeString().slice(0, 8)}</span>
                  <span style={{ color: '#cc3344', fontFamily: 'monospace', fontSize: '0.65rem' }}>{h.type?.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
