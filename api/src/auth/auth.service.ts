import {
  Injectable,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ComposerService } from "../composer/composer.service";

@Injectable()
export class AuthService {
  logger: CustomLogger;

  constructor(private readonly composerService: ComposerService) {
    this.logger = new CustomLogger("AuthController");
  }

  async register(): Promise<ApiResponseDto> {
    return new ApiResponseDto("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }

  async login(cardFile): Promise<ApiResponseDto> {
    const cardName = await this.composerService.verifyCard(cardFile.data);
    const connection = await this.composerService.connect(cardName);
    const pingResult = await this.composerService.ping(connection);
    return new ApiResponseDto("OK", HttpStatus.OK, pingResult);
  }

  async logout(): Promise<ApiResponseDto> {
    return new ApiResponseDto("Not implemented", HttpStatus.NOT_IMPLEMENTED);
  }
}
