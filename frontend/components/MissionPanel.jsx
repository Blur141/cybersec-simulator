import { useState, useEffect } from 'react';
import { MISSIONS, DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../utils/missions';

function MissionCard({ mission, onStart, active }) {
  return (
    <div className="border p-2 cursor-pointer transition-all hover:scale-[1.01]"
      style={{ borderColor: active ? mission.color : '#0a2a4a', background: active ? `${mission.color}10` : 'rgba(1,8,20,0.6)', boxShadow: active ? `0 0 12px ${mission.color}44` : 'none' }}
      onClick={() => onStart(mission)}>
      <div className="flex items-center gap-2">
        <span style={{ fontSize: '1.1rem' }}>{mission.icon}</span>
        <div className="flex-1">
          <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: active ? mission.color : '#5588aa', letterSpacing: '0.05em' }}>{mission.name}</div>
          <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: DIFFICULTY_COLORS[mission.difficulty], letterSpacing: '0.1em' }}>
            {'★'.repeat(mission.difficulty)}{'☆'.repeat(3 - mission.difficulty)} {DIFFICULTY_LABELS[mission.difficulty]}
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.55rem' }}>{mission.estimatedTime}</span>
          <span style={{ color: '#ffcc00', fontFamily: 'monospace', fontSize: '0.55rem' }}>+{mission.xp}XP</span>
        </div>
      </div>
      {active && (
        <div className="mt-1.5 h-0.5" style={{ background: '#0a1525' }}>
          <div className="h-full" style={{ width: '30%', background: mission.color, boxShadow: `0 0 4px ${mission.color}` }} />
        </div>
      )}
    </div>
  );
}

function ObjectiveRow({ obj, index, completed, current }) {
  return (
    <div className={`flex items-start gap-2 p-1.5 border transition-all ${current ? 'border-l-2' : ''}`}
      style={{ borderColor: completed ? '#00ff8833' : current ? '#00f0ff33' : '#0a2a4a', background: completed ? 'rgba(0,255,136,0.04)' : current ? 'rgba(0,240,255,0.04)' : 'transparent', borderLeftColor: current ? '#00f0ff' : 'transparent' }}>
      <div className="flex-shrink-0 mt-0.5">
        {completed
          ? <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#00ff88', fontSize: '0.6rem' }}>✓</div>
          : <div className="w-4 h-4 rounded-full border flex items-center justify-center" style={{ borderColor: current ? '#00f0ff' : '#223344', color: current ? '#00f0ff' : '#334455', fontSize: '0.6rem' }}>{index + 1}</div>}
      </div>
      <div className="flex-1">
        <div style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: completed ? '#00aa55' : current ? '#00f0ff' : '#445566' }}>{obj.text}</div>
        {current && !completed && (
          <div style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: '#334455', marginTop: '2px' }}>💡 {obj.hint}</div>
        )}
        {completed && obj.explanation && (
          <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: '#226644', marginTop: '2px', lineHeight: '1.4' }}>{obj.explanation.slice(0, 100)}...</div>
        )}
      </div>
    </div>
  );
}

export default function MissionPanel({ socket, onMissionStart, onMissionComplete, terminalSideEffects = [] }) {
  const [view, setView] = useState('list');
  const [activeMission, setActiveMission] = useState(null);
  const [objectives, setObjectives] = useState([]);
  const [completedObjectiveIds, setCompletedObjectiveIds] = useState(new Set());
  const [showBriefing, setShowBriefing] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [showEducation, setShowEducation] = useState(null);

  const currentObjectiveIdx = objectives.findIndex(o => !completedObjectiveIds.has(o.id));

  useEffect(() => {
    if (!terminalSideEffects.length || !activeMission) return;
    const latest = terminalSideEffects[terminalSideEffects.length - 1];
    if (!latest || latest.type !== 'mission_command') return;

    const currentObj = objectives[currentObjectiveIdx];
    if (!currentObj || completedObjectiveIds.has(currentObj.id)) return;

    const cmdMatchers = {
      check_logs: /check_ssh_logs|check_logs/,
      check_ssh_logs: /check_ssh_logs|check_logs/,
      identify_attacker_ip: /identify_attacker_ip/,
      block_ip: /block_ip/,
      check_connections: /check_connections/,
      check_processes: /check_processes/,
      kill_malware: /kill_malware/,
      check_crontab: /check_crontab/,
      find_malware: /find_malware/,
      tcpdump: /tcpdump/,
      nmap_scan: /nmap_scan/,
      check_sockets: /check_sockets/,
      detect_arp_spoofing: /detect_arp_spoofing/,
      restart_service: /restart_service/,
      remove_malware: /remove_malware/,
      grep_auth_log: /grep_auth_log|check_logs|check_ssh_logs/,
      rate_limit: /rate_limit/,
    };

    const pattern = currentObj.pattern;
    let matched = false;

    if (pattern && latest.cmd) {
      const cmdPattern = cmdMatchers[latest.cmd];
      if (cmdPattern && cmdPattern.test(latest.cmd)) matched = true;
    }

    if (!matched && pattern && latest.originalCmd) {
      matched = pattern.test(latest.originalCmd);
    }

    if (latest.cmd && currentObj.id.includes(latest.cmd.replace(/_/g, '-'))) matched = true;

    const objMappings = {
      'check-logs': ['check_logs', 'check_ssh_logs', 'grep_auth_log'],
      'identify-ip': ['identify_attacker_ip', 'grep_auth_log'],
      'block-ip': ['block_ip'],
      'verify-block': ['block_ip'],
      'analyze-traffic': ['check_connections'],
      'check-bandwidth': ['check_logs'],
      'apply-rate-limit': ['rate_limit'],
      'block-top-sources': ['block_ip'],
      'verify-service': ['restart_service'],
      'find-process': ['check_processes'],
      'check-connections': ['check_sockets', 'check_connections'],
      'kill-malware': ['kill_malware'],
      'check-persistence': ['check_crontab'],
      'remove-malware': ['remove_malware', 'find_malware'],
      'detect-arp': ['detect_arp_spoofing'],
      'capture-traffic': ['tcpdump'],
      'identify-attacker': ['detect_arp_spoofing'],
      'block-attacker': ['block_ip'],
      'restore-arp': ['check_connections'],
      'detect-encryption': ['check_processes'],
      'stop-spread': ['block_ip'],
      'kill-process': ['kill_malware'],
      'check-shadows': ['check_logs'],
      'isolate-network': ['block_ip', 'rate_limit'],
      'check-mail-logs': ['check_logs'],
      'analyze-headers': ['grep_auth_log'],
      'block-domain': ['block_ip'],
      'check-compromised': ['check_logs'],
      'force-resets': ['restart_service'],
    };

    if (objMappings[currentObj.id]?.includes(latest.cmd)) matched = true;

    if (matched) {
      setCompletedObjectiveIds(prev => new Set([...prev, currentObj.id]));
      if (socket) socket.emit('mission_objective_complete', { missionId: activeMission.id, objectiveId: currentObj.id });

      const nextIdx = objectives.findIndex((o, i) => i > currentObjectiveIdx && !completedObjectiveIds.has(o.id));
      if (nextIdx === -1 || completedObjectiveIds.size + 1 >= objectives.length) {
        setMissionComplete(true);
        const xp = activeMission.xp;
        setTotalXP(prev => prev + xp);
        if (onMissionComplete) onMissionComplete(activeMission);
      }
    }
  }, [terminalSideEffects]);

  const startMission = (mission) => {
    setActiveMission(mission);
    setObjectives(mission.objectives.map(o => ({ ...o, completed: false })));
    setCompletedObjectiveIds(new Set());
    setMissionComplete(false);
    setShowBriefing(true);
    setView('active');
    if (socket) socket.emit('launch_attack', { type: mission.attackConfig.type, targetId: mission.attackConfig.targetId, intensity: mission.difficulty >= 3 ? 'critical' : 'high' });
    if (onMissionStart) onMissionStart(mission);
  };

  const resetMission = () => {
    if (socket && activeMission) socket.emit('stop_all_attacks');
    setActiveMission(null);
    setObjectives([]);
    setCompletedObjectiveIds(new Set());
    setMissionComplete(false);
    setView('list');
  };

  const completedCount = completedObjectiveIds.size;
  const progress = objectives.length > 0 ? (completedCount / objectives.length) * 100 : 0;

  return (
    <div className="cyber-panel h-full flex flex-col" style={{ minHeight: 0 }}>
      <div className="corner-tl" /><div className="corner-tr" /><div className="corner-bl" /><div className="corner-br" />

      <div className="flex items-center justify-between px-3 py-1.5 border-b flex-shrink-0" style={{ borderColor: '#0a2a4a' }}>
        <span className="cyber-title">CYBER RANGE</span>
        <div className="flex items-center gap-2">
          {totalXP > 0 && <span style={{ color: '#ffcc00', fontFamily: 'monospace', fontSize: '0.6rem' }}>⭐ {totalXP}XP</span>}
          {activeMission && (
            <button onClick={resetMission} style={{ color: '#445566', fontFamily: 'monospace', fontSize: '0.6rem', cursor: 'pointer' }}>✕ END</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {view === 'list' && (
          <div className="p-2 flex flex-col gap-1.5">
            <div style={{ color: '#1a3344', fontFamily: 'monospace', fontSize: '0.6rem', letterSpacing: '0.1em', marginBottom: '4px' }}>SELECT TRAINING SCENARIO</div>
            {MISSIONS.map(m => <MissionCard key={m.id} mission={m} onStart={startMission} active={activeMission?.id === m.id} />)}
          </div>
        )}

        {view === 'active' && activeMission && (
          <div className="flex flex-col gap-0" style={{ minHeight: 0 }}>
            {showBriefing && (
              <div className="p-2 border-b" style={{ borderColor: '#0a2a4a', background: `${activeMission.color}08` }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span style={{ fontSize: '1.2rem' }}>{activeMission.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: activeMission.color, fontWeight: 'bold', textShadow: `0 0 8px ${activeMission.color}` }}>{activeMission.name}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.58rem', color: DIFFICULTY_COLORS[activeMission.difficulty] }}>
                      {'★'.repeat(activeMission.difficulty)}{'☆'.repeat(3 - activeMission.difficulty)} {DIFFICULTY_LABELS[activeMission.difficulty]} · {activeMission.category}
                    </div>
                  </div>
                  <button onClick={() => setShowBriefing(false)} style={{ marginLeft: 'auto', color: '#445566', fontSize: '0.7rem', cursor: 'pointer' }}>▲</button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.62rem', color: '#4488aa', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{activeMission.briefing}</div>
              </div>
            )}
            {!showBriefing && (
              <button onClick={() => setShowBriefing(true)} className="flex items-center gap-2 px-3 py-1.5 border-b text-left w-full" style={{ borderColor: '#0a2a4a', fontFamily: 'monospace', fontSize: '0.65rem', color: activeMission.color }}>
                {activeMission.icon} {activeMission.name} <span style={{ marginLeft: 'auto', color: '#334455' }}>▼ BRIEFING</span>
              </button>
            )}

            <div className="px-2 pt-2">
              <div className="flex justify-between mb-1">
                <span className="cyber-title" style={{ fontSize: '0.55rem' }}>OBJECTIVES</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.6rem', color: activeMission.color }}>{completedCount}/{objectives.length}</span>
              </div>
              <div className="h-1 mb-2" style={{ background: '#0a1525' }}>
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${activeMission.color}88, ${activeMission.color})`, boxShadow: `0 0 6px ${activeMission.color}` }} />
              </div>
              <div className="flex flex-col gap-1">
                {objectives.map((obj, i) => (
                  <ObjectiveRow key={obj.id} obj={obj} index={i} completed={completedObjectiveIds.has(obj.id)} current={i === currentObjectiveIdx && !completedObjectiveIds.has(obj.id)} />
                ))}
              </div>
            </div>

            {missionComplete && (
              <div className="m-2 p-2 border" style={{ borderColor: '#00ff8866', background: 'rgba(0,255,136,0.08)' }}>
                <div style={{ color: '#00ff88', fontFamily: 'monospace', fontSize: '0.72rem', marginBottom: '6px', textShadow: '0 0 10px #00ff88' }}>✅ MISSION COMPLETE</div>
                <div style={{ color: '#00aa55', fontFamily: 'monospace', fontSize: '0.62rem', lineHeight: '1.5', marginBottom: '8px' }}>{activeMission.completionMessage}</div>
                <div style={{ color: '#334455', fontFamily: 'monospace', fontSize: '0.58rem', marginBottom: '6px', letterSpacing: '0.08em' }}>KEY LEARNINGS:</div>
                {activeMission.learningPoints.map((lp, i) => (
                  <div key={i} style={{ color: '#446655', fontFamily: 'monospace', fontSize: '0.6rem', paddingLeft: '8px' }}>• {lp}</div>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={resetMission} className="flex-1 cyber-btn success" style={{ padding: '5px', fontSize: '0.65rem' }}>▶ NEXT MISSION</button>
                  <div style={{ color: '#ffcc00', fontFamily: 'monospace', fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>+{activeMission.xp}XP</div>
                </div>
              </div>
            )}

            <div className="p-2 mt-1 border-t" style={{ borderColor: '#0a2a4a' }}>
              <div style={{ color: '#223344', fontFamily: 'monospace', fontSize: '0.58rem', marginBottom: '4px', letterSpacing: '0.08em' }}>CONCEPTS:</div>
              <div className="flex flex-wrap gap-1">
                {(activeMission.learningPoints || []).slice(0, 3).map((lp, i) => (
                  <span key={i} className="node-badge" style={{ color: '#334455', borderColor: '#0a2a4a', fontSize: '0.52rem', padding: '1px 5px' }}>{lp.split(' ').slice(0, 3).join(' ')}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
