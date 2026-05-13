// src/modules/dashboard/services/dashboardService.ts
import { api } from "../../../config/api";

export const exportDashboardPDF = async () => {
  try {
    const response = await api.get('/dashboard/export/pdf', {
      responseType: 'blob', // VITAL: Para manejar archivos binarios
    });
    
    // Crear un link invisible para descargar el archivo
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_RuTAB_${new Date().toLocaleDateString()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error: any) {
    // Si el backend mandó el BadRequestException, lo capturamos aquí
    if (error.response?.status === 400) {
      alert("Aviso de RuTAB: No hay actividad suficiente hoy para generar el PDF.");
    } else {
      console.error('Error inesperado:', error);
      alert("Ocurrió un error al intentar generar el reporte.");
    }
  }
};

export const exportDashboardCSV = (stats: any) => {
  if (!stats) return alert("⚠️ No hay datos para exportar.");

  const fileName = `Reporte_Operativo_RuTAB_${new Date().toISOString().split('T')[0]}`;
  
  // 1. Encabezado de Empresa
  let csvContent = "REPORTE OPERATIVO DIARIO - RuTAB\n";
  csvContent += `Empresa: TabsCorp\n`;
  csvContent += `Administrador: Jorge Gabriel Martinez\n`;
  csvContent += `Fecha de generacion: ${new Date().toLocaleString()}\n`;
  csvContent += "\n"; // Espacio en blanco

  // 2. Seccion: KPIs de Resumen
  csvContent += "--- RESUMEN DE OPERACION ---\n";
  csvContent += "Metrica,Valor\n";
  csvContent += `Rutas Activas,${stats.rutasActivas}\n`;
  csvContent += `Total Pedidos,${stats.pedidos.totales}\n`;
  csvContent += `Eficiencia de Entrega,${((stats.pedidos.entregados / stats.pedidos.totales) * 100).toFixed(2)}%\n`;
  csvContent += "\n";

  // 3. Seccion: Detalle de Pedidos
  csvContent += "--- DETALLE DE PEDIDOS ---\n";
  csvContent += "Estado,Cantidad\n";
  csvContent += `Entregados,${stats.pedidos.entregados}\n`;
  csvContent += `En Ruta,${stats.pedidos.enRuta}\n`;
  csvContent += `Fallidos/Cancelados,${stats.pedidos.fallidos + (stats.pedidos.cancelados || 0)}\n`;
  csvContent += "\n";

  // 4. Seccion: Monitor de Incidencias (Lo que corregimos con scroll)
  csvContent += "--- BITACORA DE INCIDENCIAS ---\n";
  csvContent += "Categoria,Descripcion,Unidad,Hora\n";
  
  const todasLasIncidencias = [
    ...(stats.monitorIncidencias?.camino || []),
    ...(stats.monitorIncidencias?.entrega || []),
    ...(stats.monitorIncidencias?.tiempo || [])
  ];

  if (todasLasIncidencias.length > 0) {
    todasLasIncidencias.forEach(inc => {
      csvContent += `${inc.categoria.toUpperCase()},"${inc.descripcion}",${inc.rutas?.vehiculos?.placas || 'N/A'},${new Date(inc.created_at).toLocaleTimeString()}\n`;
    });
  } else {
    csvContent += "N/A,Sin incidencias registradas hoy,N/A,N/A\n";
  }

  // Creación del archivo con BOM para que Excel reconozca los acentos (UTF-8)
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};