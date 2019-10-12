import { BadRequestException, Controller, Get, HttpStatus, Req, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { AuthGuard } from "src/common/guards/auth.guard";
import { ProfileDto } from "./dto/profile.dto";
import { SessionEntity } from "../db/entities/session.entity";

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({ title: "Get the current signed in participant details" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns the current user's information",
    type: ProfileDto,
  })
  async getProfile(
    @Req() req: FastifyRequest<IncomingMessage>,
  ): Promise<ProfileDto> {
    const session: SessionEntity = req.params.session;
    if (session.participantType === "NetworkAdmin") {
      throw new BadRequestException("NetworkAdmins do not have profiles");
    }
    return this.profileService.getProfile(req.params.session);
  }
}
