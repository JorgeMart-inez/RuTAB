import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../jwt.strategy';
import { CustomersService } from "./customers.service";
import { CustomersController } from "./customers.controller";

@Module({
    imports:[
        PassportModule,
        JwtModule.register({
             secret: process.env.JWT_SECRET || 'secreto_temporal', // ¡Recuerda cambiar esto en producción!
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [CustomersController],
      // 2. Agregamos JwtStrategy a los providers para que NestJS lo inicialice
      providers: [CustomersService, JwtStrategy], 
      // 3. (Opcional pero recomendado) Exportamos PassportModule y JwtStrategy
      // para que otros módulos puedan usar el decorador @UseGuards(AuthGuard('jwt'))
      exports: [PassportModule, JwtStrategy], 
})
export class CustomersModule {}