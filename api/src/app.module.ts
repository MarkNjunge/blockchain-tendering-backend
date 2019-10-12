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
import { NoticesController } from "./notices/notices.controller";
import { NoticesService } from "./notices/notices.service";
import { BidsController } from "./bids/bids.controller";
import { BidsService } from "./bids/bids.service";
import { FilesController } from './files/files.controller';

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
  controllers: [AppController, AuthController, ProfileController, NoticesController, BidsController, FilesController],
  providers: [AppService, AuthService, ComposerService, ProfileService, NoticesService, BidsService],
})
export class AppModule {}
