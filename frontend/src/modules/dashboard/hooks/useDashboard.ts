import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { DashboardStats, ActiveOperation } from '../types';

export interface WeeklyStat { // Nueva interfaz para datos históricos
  fecha: string;
  nombreDia: string;
  entregados: number;
  fallidos: number;
}

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [operations, setOperations] = useState<ActiveOperation[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyStat[]>([]);
  const [topData, setTopData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Conexión al namespace específico
    const socket: Socket = io('http://localhost:3000/dashboard', {
        transports: ['websocket'],
        upgrade: false,
    });

    // PETICIÓN INICIAL: Pedimos los datos actuales apenas nos conectamos (no vemos vacío el dashboard)
    socket.emit('getInitialData'); 

    // EVENTOS: Escuchamos tanto el inicio como las actualizaciones
    socket.on('dashboard:initialData', (data: { stats: DashboardStats, operacion: ActiveOperation[], weekly: WeeklyStat[], topData: any }) => {
      setStats(data.stats);
      setOperations(data.operacion);
      setWeeklyData(data.weekly);
      setTopData(data.topData);
      setIsLoading(false);
    });

    socket.on('dashboard:update', (data: { stats: DashboardStats, operacion: ActiveOperation[], weekly: WeeklyStat[], topData: any }) => {
      setStats(data.stats);
      setOperations(data.operacion);
      setWeeklyData(data.weekly);
      setTopData(data.topData);
      // No necesitamos setear isLoading aquí porque ya cargó inicialmente
    });

    // Manejo de errores de conexión 
    socket.on('connect_error', (err) => {
      console.error('Error de conexión en Centro de Mando:', err.message);
      setIsLoading(false); 
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return { stats, operations, isLoading, weeklyData, topData };
};