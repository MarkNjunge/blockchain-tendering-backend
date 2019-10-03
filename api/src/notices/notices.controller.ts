import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpStatus,
  Get,
  Param, Query, Body, HttpCode, Patch, Delete,
} from "@nestjs/common";
import { CreateTenderNoticeDto } from "./dto/CreateTenderNotice.dto";
import { NoticesService } from "./notices.service";
import { AuthGuard } from "src/common/guards/auth.guard";
import {
  ApiImplicitFile,
  ApiImplicitBody,
  ApiConsumes,
  ApiResponse, ApiImplicitQuery, ApiOperation,
} from "@nestjs/swagger";
import { Document } from "../common/document";
import * as crypto from "crypto";
import { SessionEntity } from "../db/entities/session.entity";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ResponseCodes } from "../common/ResponseCodes";
import { TenderNoticeDto } from "./dto/TenderNotice.dto";
import { getRandomInt } from "../common/utils";
import { SetTenderResultDto } from "./dto/SetTenderResult.dto";
import { TenderResultDto } from "./dto/TenderResult.dto";
import { WithdrawNoticeDto } from "./dto/WithdrawNotice.dto";

@Controller("notices")
@UseGuards(AuthGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Get()
  @ApiOperation({ title: "Get all TenderNotices" })
  @ApiResponse({ status: 200, type: TenderNoticeDto, isArray: true })
  @ApiImplicitQuery({ name: "organizationId", required: false })
  async findAll(@Param("session") session, @Query() query): Promise<TenderNoticeDto[]> {
    const organizationId = query.organizationId;

    if (organizationId) {
      return this.noticesService.findByOrganization(session, organizationId);
    } else {
      return this.noticesService.findAll(session);
    }
  }

  @Get(":id")
  @ApiOperation({ title: "Get a specific TenderNotice" })
  @ApiResponse({ status: 200, type: TenderNoticeDto })
  async findAllById(
    @Req() req,
    @Param("id") id: string,
  ): Promise<TenderNoticeDto> {
    return this.noticesService.findById(req.params.session, id);
  }

  @Post()
  @ApiOperation({ title: "Create a TenderNotice" })
  @ApiConsumes("multipart/form-data")
  @ApiImplicitFile({
    name: "document",
    required: true,
    description: "TenderNotice file",
  })
  @ApiImplicitBody({
    name: "body",
    description: "DOESNT'T WORK IN SWAGGER. USE POSTMAN.",
    type: CreateTenderNoticeDto,
  })
  async create(@Req() req) {
    const dto: CreateTenderNoticeDto = req.body;
    dto.closingDate = new Date(dto.closingDate);
    dto.openingDate = new Date(dto.openingDate);

    dto.requiredDocuments = JSON.parse(dto.requiredDocuments.toString());
    dto.requiredDocuments = dto.requiredDocuments.map(doc =>
      doc
        .trim()
        .replace(/ +/g, "_")
        .toUpperCase(),
    );

    const docHash = crypto
      .createHash("sha256")
      .update(req.raw.files.document.data)
      .digest("hex");
    const session: SessionEntity = req.params.session;
    const docRef = `NOTICE|${session.participantId}|${dto.id}|${getRandomInt()}|${req.raw.files.document.name}`;

    const noticeDoc = new Document(
      req.raw.files.document.name,
      docRef,
      docHash,
      req.raw.files.document.data,
    );

    await this.noticesService.create(req.params.session, dto, noticeDoc);

    return new ApiResponseDto(
      HttpStatus.CREATED,
      "TenderNotice created",
      ResponseCodes.NOTICE_CREATED,
    );
  }

  @Patch(":id")
  @ApiOperation({ title: "Ammend a TenderNotice" })
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  async amendNotice(@Param("session") session, @Param("id") id: string) {
    return new ApiResponseDto(HttpStatus.NOT_IMPLEMENTED, "Not implemented", "");
  }

  @Delete(":id")
  @ApiOperation({ title: "Withdraw a TenderNotice" })
  async withdrawNotice(@Param("session") session, @Param("id") id: string, @Body() dto: WithdrawNoticeDto) {
    await this.noticesService.withdrawNotice(session, id, dto);
    return new ApiResponseDto(HttpStatus.OK, "TenderNotice withdrawn", ResponseCodes.NOTICE_WITHDRAWN);
  }

  @Get("/:id/result")
  @ApiOperation({ title: "Get a TenderNotice's TenderResult" })
  @ApiResponse({ type: TenderResultDto, status: HttpStatus.OK })
  @ApiResponse({ type: ApiResponseDto, status: HttpStatus.NOT_FOUND })
  async getResultForNotice(@Param("session") session, @Param("id") id: string): Promise<TenderResultDto> {
    return this.noticesService.getNoticeResult(session, id);
  }

  @Post("/:id/result")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ title: "Set a TenderResult for a TenderNotice" })
  @ApiResponse({ type: ApiResponseDto, status: HttpStatus.OK })
  async setNoticeResult(@Param("session") session, @Param("id") id: string, @Body() dto: SetTenderResultDto): Promise<ApiResponseDto> {
    await this.noticesService.setNoticeResult(session, id, dto);

    return new ApiResponseDto(HttpStatus.OK, "TenderResult set", ResponseCodes.RESULT_SET);
  }

  @Patch("/:id/result/dispute")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ title: "Dispute a TenderResult" })
  @ApiResponse({ type: ApiResponseDto, status: HttpStatus.OK })
  async disputeNoticeResult(@Param("session") session, @Param("id") id: string): Promise<ApiResponseDto> {
    await this.noticesService.disputeTenderResult(session, id);

    return new ApiResponseDto(HttpStatus.OK, "TenderResult disputed", ResponseCodes.NOTICE_DISPUTED);
  }

  @Patch("/:id/result/nullify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ title: "Nullify a TenderResult" })
  @ApiResponse({ type: ApiResponseDto, status: HttpStatus.OK })
  async nullifyTenderResult(@Param("session") session, @Param("id") id: string): Promise<ApiResponseDto> {
    await this.noticesService.nullifyTenderResult(session, id);

    return new ApiResponseDto(HttpStatus.OK, "TenderResult nullified", ResponseCodes.NOTICE_NULLIFIED);
  }
}
