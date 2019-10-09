import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { ComposerService } from "../composer/composer.service";
import { RegistrationDto } from "./dto/Registration.dto";
import { createParticipant } from "../composer/create-participant";
import { generateSessionId } from "../common/session";
import { InjectRepository } from "@nestjs/typeorm";
import { SessionEntity } from "../db/entities/session.entity";
import { Repository } from "typeorm";

@Injectable()
export class AuthService {
  logger: CustomLogger;

  constructor(
    private readonly composerService: ComposerService,
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
  ) {
    this.logger = new CustomLogger("AuthController");
  }

  async register(dto: RegistrationDto): Promise<string> {
    const connection = await this.composerService.connect(
      ComposerService.adminCardName,
    );
    const adminConnection = await this.composerService.connectAsAdmin();
    return await createParticipant(connection, adminConnection, dto);
  }

  async login(cardFile): Promise<SessionEntity> {
    const cardMetadata = await this.composerService.verifyCard(cardFile.data);
    const connection = await this.composerService.connect(
      cardMetadata.cardName,
    );
    const pingResult = await this.composerService.ping(connection);

    let participantType;
    if (
      pingResult.participant.startsWith(
        "org.hyperledger.composer.system.NetworkAdmin",
      )
    ) {
      participantType = "NetworkAdmin";
    } else {
      participantType = pingResult.participant
        .split("com.marknjunge.tendering.participant.")[1]
        .split("#")[0];
    }
    const participantId = pingResult.participant.split(
      `${participantType}#`,
    )[1];

    // Save session card in db
    const sessionId = generateSessionId();
    const session = new SessionEntity(
      sessionId,
      cardMetadata.cardName,
      participantId,
      participantType,
    );
    await this.sessionRepository.save(session);

    return session;
  }

  async logout(sessionId: string) {
    await this.sessionRepository.delete({ sessionId });
  }

  async ping(session: SessionEntity): Promise<any> {
    this.logger.debug(`Connecting using card: ${session.cardName}`);
    const connection = await this.composerService.connect(session.cardName);
    const pingResult = await this.composerService.ping(connection);

    return pingResult;
  }
}
