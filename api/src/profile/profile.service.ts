import { Injectable } from "@nestjs/common";
import { ComposerService } from "../composer/composer.service";
import { CustomLogger } from "../common/CustomLogger";
import { SessionEntity } from "src/db/entities/session.entity";
import { ProfileDto } from "./dto/profile.dto";

@Injectable()
export class ProfileService {
  private logger: CustomLogger;

  constructor(private readonly composerService: ComposerService) {
    this.logger = new CustomLogger("ProfileService");
  }

  async getProfile(session: SessionEntity): Promise<ProfileDto> {
    const connection = await this.composerService.connect(session.cardName);
    const registry = await this.composerService.getParticipantRegistry(
      connection,
      session.participantType,
    );

    return await registry.get(session.participantId);
  }
}
