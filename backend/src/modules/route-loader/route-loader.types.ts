export interface NewRouteCSVRow {
  placas_vehiculo: string;
  correo_chofer: string;
  fecha: string;
  codigo_ruta: string;
  // Datos Cliente
  nombre_cliente: string;
  correo_cliente: string;
  telefono_cliente: string;
  direccion_cliente: string;
  latitud_cliente: string;
  longitud_cliente: string;
  codigo_cliente: string;
  contacto_cliente: string;
  // Datos Pedido
  codigo_pedido: string;
  descripcion_pedido: string;
}

export interface UpdateFailedCSVRow {
  codigo_pedido: string;
  codigo_ruta: string;
}
