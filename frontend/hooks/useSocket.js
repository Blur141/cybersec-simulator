import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default function useSocket() {
  const [connected, setConnected] = useState(false);
  const [topology, setTopology] = useState({ nodes: [], connections: [] });
  const [activeAttacks, setActiveAttacks] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 10, reconnectionDelay: 1000 });
    socketRef.current = socket;

    socket.on('connect', () => { setConnected(true); setError(null); });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => { setError(err.message); setConnected(false); });

    socket.on('init', (data) => {
      if (data.topology) setTopology(data.topology);
      if (data.activeAttacks) setActiveAttacks(data.activeAttacks);
    });

    socket.on('attack_started', (attack) => {
      setActiveAttacks(prev => [...prev.filter(a => a.id !== attack.id), attack]);
    });

    socket.on('attack_ended', ({ id }) => {
      setActiveAttacks(prev => prev.filter(a => a.id !== id));
    });

    socket.on('attack_stopped', ({ id }) => {
      setActiveAttacks(prev => prev.filter(a => a.id !== id));
    });

    socket.on('attack_progress', ({ id, progress }) => {
      setActiveAttacks(prev => prev.map(a => a.id === id ? { ...a, progress } : a));
    });

    socket.on('traffic_update', ({ nodes: nodeUpdates }) => {
      if (!nodeUpdates) return;
      setTopology(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => {
          const update = nodeUpdates.find(u => u.id === n.id);
          return update ? { ...n, metrics: update.metrics, health: update.health, status: update.status } : n;
        })
      }));
    });

    socket.on('node_health_update', ({ id, health, status }) => {
      setTopology(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === id ? { ...n, health, status } : n)
      }));
    });

    return () => { socket.disconnect(); };
  }, []);

  return { socket: socketRef.current, connected, topology, activeAttacks, error };
}
