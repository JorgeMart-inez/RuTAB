// src/database/prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Instancia independiente de PrismaClient para la ejecución de scripts fuera
 * del ciclo de vida estándar de la aplicación NestJS.
 */
const prisma = new PrismaClient();

/**
 * Función principal para la siembra (seeding) de datos maestros.
 * En este caso, asegura la existencia de un perfil administrativo inicial.
 */
async function main() {
  // Configuración de credenciales de prueba
  const nombre = 'RuTAB_Admin';
  const correo = 'admin@rutab.com';
  const passwordPlana = '1234';
  const rol = 'superAdmin';

  /**
   * Generación de hash seguro:
   * Se aplica un factor de costo de 10 rondas de sal para proteger la integridad
   * de la contraseña antes de persistirla.
   */
  const passwordHasheada = await bcrypt.hash(passwordPlana, 10);

  /**
   * Operación Upsert (Update or Insert):
   * Garantiza que el script sea idempotente.
   * Si el usuario con ese correo ya existe, no realiza cambios (update: {}).
   * Si no existe, lo crea con los datos proporcionados.
   */
  const superAdmin = await prisma.administradores.upsert({
    where: { correo: correo },
    update: {},
    create: {
      nombre: nombre,
      correo: correo,
      password: passwordHasheada,
      rol: rol,
      // Campos opcionales (nullables) se omiten para mantener el seed minimalista
    },
  });

  // Log de confirmación para el desarrollador en consola
  console.log('✅ Administrador de prueba creado con éxito:');
  console.log(`Correo: ${superAdmin.correo}`);
  console.log(`Password: ${passwordPlana}`);

  // Buscamos un cliente real 
  const cliente = await prisma.clientes.findFirst();

  if (!cliente) {
    console.log("⚠️ No hay clientes en la DB. Crea uno primero.");
    return;
  }

}


/**
 * Ejecución del flujo principal con manejo de errores y cierre seguro
 * de la conexión con el motor de base de datos.
 */
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Liberación imperativa de la conexión para evitar procesos colgados
    await prisma.$disconnect();
  });
