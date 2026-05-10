/**
 * Convierte una fecha UTC a la hora local del navegador
 * @param date String de fecha ISO o objeto Date
 * @returns String formateado (ej: 02:18 PM)
 */
export const formatToLocalTime = (date: string | Date): string => {
  if (!date) return "--:--";

  const dateObj = new Date(date);

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // Cambia a false si prefieres formato 24h
  }).format(dateObj);
};

/**
 * Opcional: Formateador completo (Fecha y Hora)
 */
export const formatToLocalDateTime = (date: string | Date): string => {
  if (!date) return "N/A";

  const dateObj = new Date(date);

  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(dateObj);
};
