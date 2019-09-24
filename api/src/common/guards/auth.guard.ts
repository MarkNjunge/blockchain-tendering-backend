import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { ComposerService } from "../../composer/composer.service";
import { SessionEntity } from "../../db/entities/session.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomLogger } from "../CustomLogger";

@Injectable()
export class AuthGuard implements CanActivate {
  logger: CustomLogger;

  constructor(
    private readonly composerService: ComposerService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {
    this.logger = new CustomLogger("AuthGuard");
  }
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: FastifyRequest<
      IncomingMessage
    > = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  async validateRequest(
    request: FastifyRequest<IncomingMessage>,
  ): Promise<boolean> {
    try {
      const sessionCookie = request.headers.cookie
        .split("session=")[1]
        .split(";")[0];

      if (!sessionCookie) {
        throw new UnauthorizedException("No 'session' cookie found");
      }

      const session = await this.sessionRepository.findOne({
        sessionId: sessionCookie,
      });
      if (!session) {
        throw new ForbiddenException("Invalid session id");
      }

      request.params.session = session;
    } catch (e) {
      throw new UnauthorizedException("No 'session' cookie found");
    }

    return true;
  }
}
