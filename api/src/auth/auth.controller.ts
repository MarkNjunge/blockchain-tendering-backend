import {
  Controller,
  Post,
  HttpStatus,
  HttpCode,
  Req,
  BadRequestException,
  Body,
  Res,
  Get,
  UseGuards,
  Param,
} from "@nestjs/common";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ApiResponse, ApiImplicitFile, ApiOperation } from "@nestjs/swagger";
import { CustomLogger } from "src/common/CustomLogger";
import { AuthService } from "./auth.service";
import { RegistrationDto, ParticipantType } from "./dto/Registration.dto";
import * as fs from "fs";
import { FastifyReply } from "fastify";
import { ServerResponse } from "http";
import { AuthGuard } from "../common/guards/auth.guard";
import { ResponseCodes } from "../common/ResponseCodes";

@Controller("auth")
export class AuthController {
  logger: CustomLogger;

  constructor(private readonly authService: AuthService) {
    this.logger = new CustomLogger("AuthController");
  }

  @Post("/register")
  @ApiOperation({ title: "Create a new participant" })
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
  @ApiOperation({ title: "Login" })
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
  async login(
    @Req() req,
    @Res() res: FastifyReply<ServerResponse>,
  ): Promise<any> {
    const cardFile = req.raw.files.card;
    if (!cardFile) {
      throw new BadRequestException("A business network card is required!");
    }

    const session = await this.authService.login(cardFile);
    const sessionExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365); // 1 year
    res.header(
      "Set-Cookie",
      `session=${session.sessionId}; Expires=${sessionExpiry}; HttpOnly; path=/`,
    );

    res.send(
      new ApiResponseDto(
        HttpStatus.OK,
        "Login successful",
        ResponseCodes.LOGIN_SUCCESS,
        { session },
      ),
    );
  }

  @Post("/logout")
  @ApiOperation({ title: "Logout" })
  @ApiResponse({ status: HttpStatus.OK, description: "Login was successful" })
  @UseGuards(AuthGuard)
  async logout(
    @Param("session") session,
    @Res() res: FastifyReply<ServerResponse>,
  ): Promise<any> {
    await this.authService.logout(session.sessionId);

    res.header("Set-Cookie", `session=`);

    res.send(
      new ApiResponseDto(
        HttpStatus.OK,
        "Logout successfull",
        ResponseCodes.LOGOUT_SUCCESS,
      ),
    );
  }

  @Get("/ping")
  @ApiOperation({ title: "Check that the network is accessible" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Authentication is valid",
  })
  @UseGuards(AuthGuard)
  async ping(@Req() req): Promise<any> {
    return await this.authService.ping(req.params.session);
  }
}
