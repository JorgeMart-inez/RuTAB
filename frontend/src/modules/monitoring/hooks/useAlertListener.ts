// monitoring/src/hooks/useAlertListener.ts
import { useEffect, useState } from 'react';
import { useSocket } from '../../../context/SocketContext';

export const useAlertListener = () => {
    const { socket } = useSocket();
    const [incidencias, setIncidencias] = useState<any[]>([]);

    useEffect(() => {
        if (!socket) return;

        const handleUpdate = (data: any) => {
            if (data.rawIncidencias) setIncidencias(data.rawIncidencias);
        };

        socket.on('dashboard:update', handleUpdate);
        socket.on('dashboard:initialData', handleUpdate);

        if (socket.connected) { // Si ya estamos conectados, solicitamos la data inicial
            socket.emit('getInitialData');
        }

        socket.on('connect', () => { // Cuando nos conectamos, pedimos la data inicial
            socket.emit('getInitialData');
        });

        return () => { // Limpiamos los listeners al desmontar
            socket.off('dashboard:update', handleUpdate);
            socket.off('dashboard:initialData', handleUpdate);
            socket.off('connect');
        };

    }, [socket]);

    return { incidencias }; // Devolvemos el array para el componente
};