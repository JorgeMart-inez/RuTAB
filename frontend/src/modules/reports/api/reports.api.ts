import { api } from '../../../config/api';
import { ReportPeriod } from '../types/report';

const API_URL = '/auditoria/reports';

export const reportsApi = {
  // Generar nuevo PDF y descargarlo
  generate: async (period: ReportPeriod, title: string, range?: { start: string, end: string }) => {
    const response = await api.post(`${API_URL}/generate`, {
      period,
      title,
      startDate: range?.start,
      endDate: range?.end,
      chartImage: "" // Opcional: capturar canvas aquí
    }, { responseType: 'blob' });
    
    return response.data;
  },

  // Obtener historial para la tabla de auditoría
  getHistory: async () => {
    const response = await api.get(`${API_URL}/history`);
    return response.data;
  },

  // Descargar un reporte ya existente en el server
  downloadExisting: (fileUrl: string) => {
    const normalizedFileUrl = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    window.open(`${window.location.origin}/${normalizedFileUrl}`, '_blank');
  }
};