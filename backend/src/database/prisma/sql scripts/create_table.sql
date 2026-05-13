CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER DATABASE rutab SET timezone TO 'UTC';
/*
Cierra tu conexion con el cliente que estes usando, vuelve a conectarte y verifica que haya funcionado:
  SHOW TIMEZONE;
Es probable que veas algo distinto a UTC si es asi busca como cambiar la zona horaria de tu cliente porque la bd ya esta en UTC
*/

BEGIN;
-- =========================
-- ADMINISTRADORES
-- =========================
CREATE TABLE public.administradores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  correo text NOT NULL UNIQUE,
  password text NOT NULL,
  rol text CHECK (rol = ANY (ARRAY['superAdmin', 'logístico', 'auditor'])),
  foto_perfil_url text,
  CONSTRAINT administradores_pkey PRIMARY KEY (id)
);

-- =========================
-- CHOFERES
-- =========================
CREATE TABLE public.choferes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  licencia text,
  correo text NOT NULL UNIQUE,
  password text NOT NULL,
  telefono text,
  foto_perfil_url text,
  CONSTRAINT choferes_pkey PRIMARY KEY (id)
);

-- =========================
-- CLIENTES
-- =========================
CREATE TABLE public.clientes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  direccion text NOT NULL,
  correo text NOT NULL UNIQUE,
  coordenadas GEOGRAPHY(Point, 4326) NOT NULL,
  codigo text,
  contacto text,
  estatus text DEFAULT 'Activo',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clientes_pkey PRIMARY KEY (id)
);

-- =========================
-- VEHICULOS
-- =========================
CREATE TABLE public.vehiculos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  placas text NOT NULL UNIQUE,
  marca text,
  modelo text,
  rendimiento_combustible numeric,
  estatus text DEFAULT 'disponible',
  foto_unidad_url text,
  CONSTRAINT vehiculos_pkey PRIMARY KEY (id)
);

-- =========================
-- RUTAS
-- =========================
CREATE TABLE public.rutas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vehiculo_id uuid,
  chofer_id uuid,
  creado_por uuid,
  codigo_rastreo text NOT NULL UNIQUE,
  fecha_programada date,
  distancia_total_estimada numeric,
  tiempo_estimado_entrega timestamptz,
  estatus_ruta text DEFAULT 'borrador',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT rutas_pkey PRIMARY KEY (id),
  CONSTRAINT rutas_chofer_id_fkey FOREIGN KEY (chofer_id) REFERENCES public.choferes(id),
  CONSTRAINT rutas_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.administradores(id),
  CONSTRAINT rutas_vehiculo_id_fkey FOREIGN KEY (vehiculo_id) REFERENCES public.vehiculos(id)
);

-- =========================
-- PEDIDOS
-- =========================
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cliente_id uuid,
  descripcion_carga text,
  codigo_rastreo text NOT NULL UNIQUE,
  estado_pedido text DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pedidos_pkey PRIMARY KEY (id),
  CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);

-- =========================
-- DETALLES RUTA
-- =========================
CREATE TABLE public.detalles_ruta (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ruta_id uuid,
  pedido_id uuid,
  orden_entrega integer,
  comentarios text,
  estado_intento text DEFAULT 'pendiente',
  CONSTRAINT detalles_ruta_pkey PRIMARY KEY (id),
  CONSTRAINT detalles_ruta_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id),
  CONSTRAINT detalles_ruta_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id)
);

-- =========================
-- EVIDENCIAS
-- =========================
CREATE TABLE public.evidencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  pedido_id uuid,
  foto_url text,
  firma_url text,
  coordenadas_entrega GEOGRAPHY(Point, 4326),
  fecha_hora timestamptz DEFAULT CURRENT_TIMESTAMP,
  estado_evidencia text DEFAULT 'alerta',
  CONSTRAINT evidencias_pkey PRIMARY KEY (id),
  CONSTRAINT evidencias_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);

-- =========================
-- UBICACIÓN ACTUAL
-- =========================
CREATE TABLE public.ubicacion_actual (
    ruta_id UUID PRIMARY KEY,
    ultima_coordenada GEOGRAPHY(Point, 4326) NOT NULL,
    fecha_actualizacion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    velocidad_kmh FLOAT, -- Opcional: útil para saber si está atorado en tráfico
    nivel_bateria INTEGER, -- Opcional: útil para soporte técnico si la app se apaga
    CONSTRAINT fk_ruta_actual FOREIGN KEY (ruta_id) REFERENCES public.rutas(id) ON DELETE CASCADE
);
CREATE INDEX idx_ubicacion_actual_geog ON public.ubicacion_actual USING GIST (ultima_coordenada);

-- =========================
-- TRAYECTOS FINALIZADOS
-- =========================
CREATE TABLE public.trayectos_finalizados (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ruta_id UUID UNIQUE NOT NULL,
    geometria_ruta GEOGRAPHY(LineString, 4326) NOT NULL,
    distancia_total_km FLOAT, -- Calculada al cerrar la ruta
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ruta_finalizada FOREIGN KEY (ruta_id) REFERENCES public.rutas(id) ON DELETE CASCADE
);
CREATE INDEX idx_trayectos_geog ON public.trayectos_finalizados USING GIST (geometria_ruta);

-- =========================
-- INCIDENCIAS
-- =========================
CREATE TABLE public.incidencias (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ruta_id uuid,
  pedido_id uuid,
  tipo text,
  descripcion text,
  foto_url text,
  coordenadas_incidente GEOGRAPHY(Point, 4326),
  estado_incidencia text DEFAULT 'pendiente',
  categoria text NOT NULL DEFAULT 'camino',
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT incidencias_pkey PRIMARY KEY (id),
  CONSTRAINT incidencias_ruta_id_fkey FOREIGN KEY (ruta_id) REFERENCES public.rutas(id),
  CONSTRAINT incidencias_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id)
);
CREATE INDEX idx_incidencias_coordenadas ON public.incidencias USING GIST (coordenadas_incidente);

-- =========================
-- REPORTES
-- =========================
CREATE TABLE IF NOT EXISTS public.reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    types VARCHAR(50) NOT NULL, -- 'WEEKLY', 'MONTHLY', etc.
    startDate TIMESTAMP NOT NULL,
    endDate TIMESTAMP NOT NULL,
    fileUrl TEXT NOT NULL,
    createdById TEXT NOT NULL, -- ID del usuario que lo generó
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Comentario de auditoría para la tabla
COMMENT ON TABLE public.reportes IS 'Tabla para el seguimiento y auditoría de reportes generados en el sistema RuTAB';


-- Función que revisa si todos los pedidos de una ruta están "entregados"
-- CREATE OR REPLACE FUNCTION actualizar_estatus_ruta()
-- RETURNS TRIGGER AS $$
-- DECLARE
--     total_pedidos INT;
--     pedidos_entregados INT;
--     v_ruta_id uuid;
-- BEGIN
--     -- Obtener el ruta_id asociado al pedido actualizado
--     SELECT dr.ruta_id
--     INTO v_ruta_id
--     FROM detalles_ruta dr
--     WHERE dr.pedido_id = NEW.id
--     LIMIT 1;

--     -- Si el pedido no pertenece a ninguna ruta, salir
--     IF v_ruta_id IS NULL THEN
--         RETURN NEW;
--     END IF;

--     -- Contar total de pedidos en la ruta
--     SELECT COUNT(*)
--     INTO total_pedidos
--     FROM detalles_ruta
--     WHERE ruta_id = v_ruta_id;

--     -- Contar pedidos entregados
--     SELECT COUNT(*)
--     INTO pedidos_entregados
--     FROM detalles_ruta dr
--     JOIN pedidos p ON dr.pedido_id = p.id
--     WHERE dr.ruta_id = v_ruta_id
--       AND p.estado_pedido = 'entregado';

--     -- Si todos están entregados → completar ruta
--     IF total_pedidos > 0 AND total_pedidos = pedidos_entregados THEN
--         UPDATE rutas
--         SET estatus_ruta = 'completada',
--             updated_at = CURRENT_TIMESTAMP
--         WHERE id = v_ruta_id;
--     END IF;

--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_actualizar_ruta
-- AFTER UPDATE OF estado_pedido ON pedidos
-- FOR EACH ROW
-- WHEN (OLD.estado_pedido IS DISTINCT FROM NEW.estado_pedido)
-- EXECUTE FUNCTION actualizar_estatus_ruta();

COMMIT;