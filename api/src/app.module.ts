import { Module } from "@nestjs/common";
import { AppController } from "./app/app.controller";
import { AppService } from "./app/app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { ComposerService } from "./composer/composer.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { config } from "./common/Config";
import { SessionEntity } from "./db/entities/session.entity";
import { ProfileController } from "./profile/profile.controller";
import { ProfileService } from "./profile/profile.service";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      url: config.dbUrl,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
      extra: {
        ssl: config.dbSSL === "true",
      },
    }),
    TypeOrmModule.forFeature([SessionEntity]),
  ],
  controllers: [AppController, AuthController, ProfileController],
  providers: [AppService, AuthService, ComposerService, ProfileService],
})
export class AppModule {}
