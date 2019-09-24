import { Controller, Get, HttpStatus, Req, UseGuards } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { ProfileService } from "./profile.service";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { AuthGuard } from "src/common/guards/auth.guard";
import { ProfileDto } from "./dto/profile.dto";

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get("/")
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Returns the current user's information",
    type: ProfileDto,
  })
  async getProfile(
    @Req() req: FastifyRequest<IncomingMessage>,
  ): Promise<ProfileDto> {
    return this.profileService.getProfile(req.params.session);
  }
}