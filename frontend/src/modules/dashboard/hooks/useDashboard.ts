import { useState, useEffect } from 'react';
import { useSocket } from '../../../context/SocketContext';
import { DashboardStats, ActiveOperation } from '../types';

export interface WeeklyStat { // Nueva interfaz para datos históricos
  fecha: string;
  nombreDia: string;
  entregados: number;
  fallidos: number;
}

export const useDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [operations, setOperations] = useState<ActiveOperation[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyStat[]>([]);
  const [topData, setTopData] = useState<any>(null);
  const [rawIncidencias, setRawIncidencias] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const handleInitial = (data: { stats: DashboardStats; operacion: ActiveOperation[]; weekly: WeeklyStat[]; topData: any; rawIncidencias?: any[] }) => {
      setStats(data.stats);
      setOperations(data.operacion);
      setWeeklyData(data.weekly);
      setTopData(data.topData);
      if (data.rawIncidencias) setRawIncidencias(data.rawIncidencias);
      setIsLoading(false);
    };

    const handleUpdate = (data: { stats: DashboardStats; operacion: ActiveOperation[]; weekly: WeeklyStat[]; topData: any; rawIncidencias?: any[] }) => {
      setStats(data.stats);
      setOperations(data.operacion);
      setWeeklyData(data.weekly);
      setTopData(data.topData);
      if (data.rawIncidencias) setRawIncidencias(data.rawIncidencias);
    };

    socket.on('dashboard:initialData', handleInitial);
    socket.on('dashboard:update', handleUpdate);

    if (socket.connected) {
      socket.emit('getInitialData');
    }

    socket.on('connect', () => {
      socket.emit('getInitialData');
    });

    socket.on('connect_error', (err) => {
      console.error('Error de conexión en Centro de Mando:', err.message);
      setIsLoading(false);
    });

    return () => {
      socket.off('dashboard:initialData', handleInitial);
      socket.off('dashboard:update', handleUpdate);
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [socket]);

  return { stats, operations, isLoading, weeklyData, topData, rawIncidencias };
};