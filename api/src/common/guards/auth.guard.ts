import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { SessionEntity } from "../../db/entities/session.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomLogger } from "../CustomLogger";
import { ResponseCodes } from "../ResponseCodes";

@Injectable()
export class AuthGuard implements CanActivate {
  logger: CustomLogger;

  constructor(
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
    const sessionCookiePart1 = request.headers.cookie.split("session=")[1];
    if (!sessionCookiePart1) {
      throw new HttpException(
        {
          message: "No 'session' cookie found",
          responseCode: ResponseCodes.NO_SESSION_PROVIDED,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const sessionCookie = sessionCookiePart1.split(";")[0];
    const session = await this.sessionRepository.findOne({
      sessionId: sessionCookie,
    });

    if (!session) {
      throw new HttpException(
        {
          message: "Invalid session id",
          responseCode: ResponseCodes.INVALID_SESSION,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    request.params.session = session;

    return true;
  }
}
