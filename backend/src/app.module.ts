import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PersonModule } from './person/person.module';
import { PrismaService } from './prisma/prisma.service';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UserModule,
    PersonModule,
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
