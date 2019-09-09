import { Injectable, HttpStatus } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ComposerService } from "../composer/composer.service";
import { RegistrationDto } from "./dto/Registration.dto";
import { createParticipant } from "../composer/create-participant";

@Injectable()
export class AuthService {
  logger: CustomLogger;

  constructor(private readonly composerService: ComposerService) {
    this.logger = new CustomLogger("AuthController");
  }

  async register(dto: RegistrationDto): Promise<string> {
    const connection = await this.composerService.connect(
      ComposerService.adminCardName,
    );
    const adminConnection = await this.composerService.connectAsAdmin();
    return await createParticipant(connection, adminConnection, dto);
  }

  async login(cardFile): Promise<ApiResponseDto> {
    const cardMetadata = await this.composerService.verifyCard(cardFile.data);
    const connection = await this.composerService.connect(
      cardMetadata.cardName,
    );
    const pingResult = await this.composerService.ping(connection);
    return new ApiResponseDto("OK", HttpStatus.OK, {
      ping: pingResult,
      cardMetadata,
    });
  }

  async logout(): Promise<ApiResponseDto> {
    return new ApiResponseDto("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }
}
