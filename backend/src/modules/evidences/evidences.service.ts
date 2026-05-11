// /backend/src/modules/evidences/evidences.service.ts

import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { EvidenceQueryDto } from './dto/evidence-query.dto';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class EvidencesService {
  private supabase;

  constructor(private prisma: PrismaService) {

    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  /**
   * Genera URLs firmadas para una lista de evidencias.
   * Supabase permite generar varias URLs en una sola petición.
   */
  private async signUrls(evidencias: any[]) {
    // Extraemos todos los paths únicos de fotos y firmas
    const paths = evidencias
      .flatMap((e) => [e.fotoUrl, e.firmaUrl])
      .filter(Boolean);

    if (paths.length === 0) return evidencias;

    // Solicitamos URLs firmadas (validez de 60 minutos)
    const { data, error } = await this.supabase.storage
      .from('evidencias')
      .createSignedUrls(paths, 3600);

    if (error) {
      throw new InternalServerErrorException(
        `Error al firmar URLs: ${error.message}`,
      );
    }

    // Mapeamos las URLs de vuelta a cada objeto de evidencia
    return evidencias.map((e) => {
      const fotoSigned = data.find((d) => d.path === e.fotoUrl);
      const firmaSigned = data.find((d) => d.path === e.firmaUrl);

      return {
        ...e,
        fotoUrl: fotoSigned?.signedUrl || null,
        firmaUrl: firmaSigned?.signedUrl || null,
      };
    });
  }

  async findAll(query: EvidenceQueryDto) {
    const estado = query.estado || null;
    const pedidoId = query.pedidoId || null;
    const choferCorreo = query.choferCorreo ? `%${query.choferCorreo}%` : null;
    const fecha = query.fecha || null;

    const results: any[] = await this.prisma.$queryRaw`
    SELECT 
    e.id,
    e.pedido_id as "pedidoId",
    e.foto_url as "fotoUrl",
    e.firma_url as "firmaUrl",
    e.estado_evidencia as "estado",
    e.fecha_hora as "fechaHora",
    p.codigo_rastreo as "codigoRastreo",
    c.nombre as "clienteNombre",
    ch.id as "choferId",
    ch.nombre as "choferNombre",
    ch.correo as "choferCorreo",
    ST_Distance(e.coordenadas_entrega, c.coordenadas) as "distanciaMetros"
    FROM public.evidencias e  -- Añadimos public por si acaso
    INNER JOIN public.pedidos p ON e.pedido_id = p.id
    INNER JOIN public.clientes c ON p.cliente_id = c.id
    LEFT JOIN public.detalles_ruta dr ON p.id = dr.pedido_id
    LEFT JOIN public.rutas r ON dr.ruta_id = r.id
    LEFT JOIN public.choferes ch ON r.chofer_id = ch.id
    WHERE 
    (${estado}::text IS NULL OR e.estado_evidencia = ${estado})
    -- Cambiamos el casteo para evitar que Postgres se confunda con UUIDs
    AND (${pedidoId}::text IS NULL OR e.pedido_id = ${pedidoId}::uuid)
    AND (${choferCorreo}::text IS NULL OR ch.correo ILIKE ${choferCorreo})
    AND (${fecha}::text IS NULL OR DATE(e.fecha_hora) = ${fecha}::date)
    ORDER BY e.fecha_hora DESC
`;

    return this.signUrls(results);
  }

  async approve(id: string) {
    const evidencia = await this.prisma.evidencias.findUnique({
      where: { id },
    });
    if (!evidencia) throw new NotFoundException('Evidencia no encontrada');

    return this.prisma.evidencias.update({
      where: { id },
      data: { estado_evidencia: 'aprobada' },
    });
  }
}
