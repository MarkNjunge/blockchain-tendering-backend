import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpStatus,
  Get,
  Param, Query,
} from "@nestjs/common";
import { CreateTenderNoticeDto } from "./dto/CreateTenderNotice.dto";
import { NoticesService } from "./notices.service";
import { AuthGuard } from "src/common/guards/auth.guard";
import {
  ApiImplicitFile,
  ApiImplicitBody,
  ApiConsumes,
  ApiResponse, ApiImplicitQuery,
} from "@nestjs/swagger";
import { Document } from "../common/document";
import * as crypto from "crypto";
import { SessionEntity } from "../db/entities/session.entity";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ResponseCodes } from "../common/ResponseCodes";
import { TenderNoticeDto } from "./dto/TenderNotice.dto";
import { getRandomInt } from "../common/utils";

@Controller("notices")
@UseGuards(AuthGuard)
export class NoticesController {
  constructor(private readonly noticesSerivce: NoticesService) {}

  @Get()
  @ApiResponse({ status: 200, type: TenderNoticeDto, isArray: true })
  @ApiImplicitQuery({ name: "organizationId", required: false })
  async findAll(@Param("session") session, @Query() query): Promise<TenderNoticeDto[]> {
    const organizationId = query.organizationId;

    if (organizationId) {
      return this.noticesSerivce.findByOrganization(session, organizationId);
    } else {
      return this.noticesSerivce.findAll(session);
    }
  }

  @Get(":id")
  @ApiResponse({ status: 200, type: TenderNoticeDto })
  async findAllById(
    @Req() req,
    @Param("id") id: string,
  ): Promise<TenderNoticeDto> {
    return this.noticesSerivce.findById(req.params.session, id);
  }

  @Post("/create")
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

    await this.noticesSerivce.create(req.params.session, dto, noticeDoc);

    return new ApiResponseDto(
      HttpStatus.CREATED,
      "TenderNotice created",
      ResponseCodes.NOTICE_CREATED,
    );
  }
}
