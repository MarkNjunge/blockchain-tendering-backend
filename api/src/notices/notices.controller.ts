import {
  Controller,
  Post,
  Req,
  UseGuards,
  HttpStatus,
  Get,
  Param,
} from "@nestjs/common";
import { CreateTenderNoticeDto } from "./dto/CreateTenderNotice.dto";
import { NoticesService } from "./notices.service";
import { AuthGuard } from "src/common/guards/auth.guard";
import {
  ApiImplicitFile,
  ApiImplicitBody,
  ApiConsumes,
  ApiResponse,
} from "@nestjs/swagger";
import { Document } from "../common/document";
import * as crypto from "crypto";
import { SessionEntity } from "../db/entities/session.entity";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ResponseCodes } from "../common/ResponseCodes";
import { TenderNoticeDto } from "./dto/TenderNotice.dto";

@Controller("notices")
@UseGuards(AuthGuard)
export class NoticesController {
  constructor(private readonly noticesSerivce: NoticesService) {}

  @Get()
  @ApiResponse({ status: 200, type: TenderNoticeDto, isArray: true })
  async findAll(@Req() req): Promise<TenderNoticeDto[]> {
    return this.noticesSerivce.findAll(req.params.session);
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
        .replace(/ |-/, "_")
        .toUpperCase(),
    );

    const docHash = crypto
      .createHash("sha256")
      .update(req.raw.files.document.data)
      .digest("hex");
    const session: SessionEntity = req.params.session;
    const docRef = `${session.participantId}#${dto.title.replace(/ +/g, "_")}#${
      req.raw.files.document.name
    }`;

    const doc = new Document(
      req.raw.files.document.name,
      docRef,
      docHash,
      req.raw.files.document.data,
    );

    await this.noticesSerivce.create(req.params.session, dto, doc);

    return new ApiResponseDto(
      HttpStatus.CREATED,
      "TenderNotice created",
      ResponseCodes.NOTICE_CREATED,
    );
  }
}
