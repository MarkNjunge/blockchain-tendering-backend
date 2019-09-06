import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Req,
  BadRequestException,
  Body,
  Res,
} from "@nestjs/common";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ApiResponse, ApiImplicitFile } from "@nestjs/swagger";
import { CustomLogger } from "src/common/CustomLogger";
import { AuthService } from "./auth.service";
import { RegistrationDto, ParticipantType } from "./dto/Registration.dto";
import * as fs from "fs";
import { FastifyReply } from "fastify";
import { ServerResponse } from "http";

@Controller("auth")
export class AuthController {
  logger: CustomLogger;

  constructor(private readonly authService: AuthService) {
    this.logger = new CustomLogger("AuthController");
  }

  @Post("/register")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Registration was successful",
  })
  @HttpCode(200)
  async register(
    @Body() dto: RegistrationDto,
    @Res() res: FastifyReply<ServerResponse>,
  ): Promise<any> {
    if (
      dto.participantType === ParticipantType.TENDER_BIDDER &&
      dto.companyRegNo === undefined
    ) {
      throw new BadRequestException(
        "companyRegNo is required for tender bidders",
      );
    }

    const cardFilename = await this.authService.register(dto);

    const file = fs.createReadStream(`./${cardFilename}`);
    res.header("Content-Disposition", `attachment; filename="${cardFilename}"`);
    res.send(file);

    fs.copyFileSync(`./${cardFilename}`, `./files/cards/${cardFilename}`);
    fs.unlinkSync(`./${cardFilename}`); // Delete
  }

  @Post("/login")
  @ApiImplicitFile({
    name: "card",
    required: true,
    description: "A card file used for authentication",
  })
  @HttpCode(200)
  @ApiResponse({ status: HttpStatus.OK, description: "Login was successful" })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "The file was missing or is not a valid card.",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "The card is not in the network.",
  })
  async login(@Req() req): Promise<ApiResponseDto> {
    const cardFile = req.raw.files.card;
    if (!cardFile) {
      throw new BadRequestException("A business network card is required!");
    }

    return this.authService.login(cardFile);
  }

  @Post("/logout")
  @ApiResponse({ status: HttpStatus.OK, description: "Login was successful" })
  @HttpCode(501)
  async logout(): Promise<ApiResponseDto> {
    return this.authService.logout();
  }
}
