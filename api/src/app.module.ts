import { Module } from "@nestjs/common";
import { AppController } from "./app/app.controller";
import { AppService } from "./app/app.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { ComposerService } from "./composer/composer.service";

@Module({
  imports: [],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, ComposerService],
})
export class AppModule {}
