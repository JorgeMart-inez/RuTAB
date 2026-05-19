BEGIN;

-- =========================
-- ADMIN - Utiliza el archivo backend/src/database/prisma/seed.ts
-- =========================


-- =========================
-- CHOFERES 
-- =========================
INSERT INTO choferes (id, nombre, correo, password)
VALUES 
(gen_random_uuid(), 'Chofer 1', 'chofer1@test.com', crypt('123456', gen_salt('bf'))),
(gen_random_uuid(), 'Chofer 2', 'chofer2@test.com', crypt('123456', gen_salt('bf')));

-- =========================
-- VEHICULOS
-- =========================
INSERT INTO vehiculos (id, placas, marca, modelo)
VALUES 
(gen_random_uuid(), 'ABC-123', 'Nissan', 'NP300'),
(gen_random_uuid(), 'XYZ-789', 'Toyota', 'Hilux');

-- =========================
-- CLIENTES (60)
-- =========================
INSERT INTO clientes (id, nombre, direccion, coordenadas, correo)
SELECT 
    gen_random_uuid(),
    'Cliente ' || i,
    'Dirección ' || i || ', Villahermosa',
    ST_SetSRID(ST_MakePoint(
        -92.9475 + (random() * 0.1 - 0.05), 
        17.9895 + (random() * 0.1 - 0.05)   
    ), 4326)::geography,
    'cliente' || i || '@email.com'  -- Correo aleatorio
FROM generate_series(1, 60) AS i;

-- =========================
-- RUTAS
-- =========================
INSERT INTO rutas (id, vehiculo_id, chofer_id, creado_por, codigo_rastreo, fecha_programada, estatus_ruta)
VALUES
(gen_random_uuid(), 
 (SELECT id FROM vehiculos LIMIT 1 OFFSET 0),
 (SELECT id FROM choferes LIMIT 1 OFFSET 0),
 (SELECT id FROM administradores LIMIT 1),
  'RUTA-001',
 CURRENT_DATE, 'borrador'),

(gen_random_uuid(),
 (SELECT id FROM vehiculos LIMIT 1 OFFSET 1),
 (SELECT id FROM choferes LIMIT 1 OFFSET 1),
 (SELECT id FROM administradores LIMIT 1),
  'RUTA-002',
 CURRENT_DATE, 'borrador');

-- =========================
-- PEDIDOS (60)
-- =========================
INSERT INTO pedidos (id, cliente_id, descripcion_carga, codigo_rastreo)
SELECT 
    gen_random_uuid(), -- id único
    id,                -- id del cliente
    'Carga de cliente ' || row_number() OVER (), -- descripción
    'TRACK' || lpad(row_number() OVER ()::text, 4, '0') -- código de rastreo único
FROM clientes
LIMIT 60;

-- =========================
-- RUTA 1 (Primeros 30 pedidos)
-- =========================
INSERT INTO detalles_ruta (ruta_id, pedido_id, orden_entrega)
SELECT 
    (SELECT id FROM rutas LIMIT 1 OFFSET 0),
    p.id,
    ROW_NUMBER() OVER (ORDER BY p.id)
FROM pedidos p
ORDER BY p.id
LIMIT 30;

-- =========================
-- RUTA 2 (Siguientes 30 pedidos)
-- =========================
INSERT INTO detalles_ruta (ruta_id, pedido_id, orden_entrega)
SELECT 
    (SELECT id FROM rutas LIMIT 1 OFFSET 1),
    p.id,
    ROW_NUMBER() OVER (ORDER BY p.id)
FROM pedidos p
ORDER BY p.id
OFFSET 30 LIMIT 30;

COMMIT;

-- QUERY MAESTRA
WITH nueva_ruta AS (
    -- 1. Creamos la ruta y recuperamos su ID
    INSERT INTO rutas (vehiculo_id, chofer_id, creado_por, fecha_programada, distancia_total_estimada, estatus_ruta)
    VALUES (
        'ffc4277e-a23b-4647-b9b5-6964fc2a776d', -- vehiculo
        '8953817d-eb6e-4bf3-85b8-c6a48cf67072', -- chofer
        '9fab2137-130f-4b1c-adf2-09651727a60c', -- admin
        CURRENT_DATE + INTERVAL '1 day', 
        0, 
        'borrador'
    )
    RETURNING id
),
clientes_seleccionados AS (
    -- 2. Buscamos los UUIDs de dos clientes existentes (puedes ajustar el LIMIT o los nombres)
    SELECT id FROM clientes LIMIT 2
),
nuevos_pedidos AS (
    -- 3. Creamos 2 pedidos por cada cliente encontrado (4 en total)
    -- Usamos CROSS JOIN para emparejar los clientes con datos estáticos
    INSERT INTO pedidos (cliente_id, descripcion_carga, codigo_rastreo, estado_pedido)
    SELECT 
        c.id, 
        p.descrip, 
        'RT-' || floor(random() * 10000)::text, 
        'pendiente'
    FROM clientes_seleccionados c
    CROSS JOIN (
        VALUES ('Carga General A'), ('Carga General B')
    ) AS p(descrip)
    RETURNING id
)
-- 4. Finalmente, insertamos en detalles_ruta uniendo la ruta y los pedidos generados
INSERT INTO detalles_ruta (ruta_id, pedido_id, orden_entrega)
SELECT 
    (SELECT id FROM nueva_ruta), 
    np.id, 
    row_number() OVER () -- Genera el orden 1, 2, 3, 4 automáticamente
FROM nuevos_pedidos np;


-- ============= QUERYS PARA LA PRESENTACIÓN =============
WITH diez_clientes_agro AS (
    -- 1. Insertamos 10 clientes usando ST_GeographyFromText para el tipo 'geography'
    INSERT INTO clientes (nombre, telefono, direccion, correo, coordenadas, codigo, contacto, estatus)
    VALUES 
        ('Agroinsumos del Sureste S.A.', '9933152431', 'Carr. Circuito del Golfo Km 15, Villahermosa', 'compras@agrosureste.com', ST_GeographyFromText('POINT(-93.0012 17.9845)'), 'CLI-AG01', 'Ing. Carlos Mendoza', 'Activo'),
        ('Cooperativa Ganadera de Tabasco', '9341028492', 'Av. Altiplano 402, Tenosique', 'logistica@coopgatab.org', ST_GeographyFromText('POINT(-91.4234 17.4756)'), 'CLI-AG02', 'Lic. Sofía Leyva', 'Activo'),
        ('Distribuidora FertiMax', '9143341205', 'Calle Melchor Ocampo 112, Cárdenas', 'proveedores@fertimax.mx', ST_GeographyFromText('POINT(-93.3667 17.9833)'), 'CLI-AG03', 'Roberto Gómez', 'Activo'),
        ('Nutrición Animal El Ganadero', '9171059382', 'Periférico Carlos Pellicer 240, Macuspana', 'ventas@nutriganadero.com', ST_GeographyFromText('POINT(-92.5921 17.7612)'), 'CLI-AG04', 'MVZ. Jaime Peralta', 'Activo'),
        ('Finca El Eden Agropecuaria', '9321048291', 'Rancho El Eden S/N, Teapa', 'administracion@eleden.com', ST_GeographyFromText('POINT(-92.9514 17.5489)'), 'CLI-AG05', 'Don Arturo Silva', 'Activo'),
        ('Sistemas de Riego Tecnificados', '9931023948', 'Zona Industrial Manzana 4, Villahermosa', 'proyectos@riegotec.mx', ST_GeographyFromText('POINT(-92.9167 17.9889)'), 'CLI-AG06', 'Ing. Miguel Ángel Ruiz', 'Activo'),
        ('Agroquímicos y Semillas del Centro', '9333241590', 'Blvd. Francisco I. Madero, Comalcalco', 'contacto@agrosecent.com', ST_GeographyFromText('POINT(-93.2264 18.2653)'), 'CLI-AG07', 'Patricia Juárez', 'Activo'),
        ('Productora de Cacao OrganiK', '9331120495', 'Carr. Federal Cunduacán-Comalcalco Km 5, Cunduacán', 'almacen@organikcacao.com', ST_GeographyFromText('POINT(-93.1678 18.0645)'), 'CLI-AG08', 'Francisco Hernández', 'Activo'),
        ('Silos y Granos Grijalva', '9933556677', 'Km 8 Carr. a Frontera, Centro', 'bascula@silosgrijalva.com', ST_GeographyFromText('POINT(-92.8521 18.0412)'), 'CLI-AG09', 'Ing. Fernando Ortiz', 'Activo'),
        ('Suministros Agrícolas de Los Ríos', '9341142233', 'Calle Pochutla S/N, Balancán', 'compras@sumisrios.com', ST_GeographyFromText('POINT(-91.5312 17.7945)'), 'CLI-AG10', 'Ramón Valenzuela', 'Activo')
    RETURNING id, nombre
),
pares_de_pedidos AS (
    -- 2. Mapeamos cada cliente con sus 2 tipos de carga
    SELECT 
        c.id AS cliente_id,
        p.descrip,
        p.indice_pedido
    FROM diez_clientes_agro c
    CROSS JOIN LATERAL (
        VALUES 
            ('Tarimas de Fertilizante NPK (Nitrógeno, Fósforo, Potasio) - 50 bultos de 25kg', 1),
            ('Contenedores de Alimento Balanceado para Ganado Bovino (Etapa Engorda)', 2)
    ) AS p(descrip, indice_pedido)
),
veinte_pedidos_agro AS (
    -- 3. Insertamos los 20 pedidos
    INSERT INTO pedidos (cliente_id, descripcion_carga, codigo_rastreo, estado_pedido)
    SELECT 
        p.cliente_id,
        p.descrip,
        'PED-AGRO-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6)) || '-' || p.indice_pedido,
        'pendiente'
    FROM pares_de_pedidos p
    RETURNING id
),
nueva_ruta_distribucion AS (
    -- 4. Creamos la ruta maestra
    INSERT INTO rutas (
        vehiculo_id, 
        chofer_id, 
        creado_por, 
        codigo_rastreo, 
        fecha_programada, 
        distancia_total_estimada, 
        estatus_ruta
    )
    VALUES (
        '1477ef3d-176e-4cd8-b3b6-8fd14c23e576', -- Vehiculo
        'bec40ffe-3442-4599-80af-630096938689', -- Chofer
        '9fab2137-130f-4b1c-adf2-09651727a60c', -- Administrador
        'RUTA-AGRO-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)), 
        CURRENT_DATE, 
        0, 
        'borrador'
    )
    RETURNING id
)
-- 5. Vinculamos de manera secuencial los 20 pedidos en detalles_ruta
INSERT INTO detalles_ruta (ruta_id, pedido_id, orden_entrega)
SELECT 
    (SELECT id FROM nueva_ruta_distribucion), 
    vpa.id, 
    ROW_NUMBER() OVER ()
FROM veinte_pedidos_agro vpa;