import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
  HttpException,
} from "@nestjs/common";
import { BidsService } from "./bids.service";
import { IncomingMessage } from "http";
import { FastifyRequest } from "fastify";
import { SessionEntity } from "../db/entities/session.entity";
import {
  ApiConsumes,
  ApiImplicitBody,
  ApiImplicitFile,
  ApiImplicitQuery,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { CreateTenderBidDto } from "./dto/CreateTenderBid.dto";
import { Document } from "../common/document";
import * as crypto from "crypto";
import { AuthGuard } from "../common/guards/auth.guard";
import { ExtraDocumentDto } from "./dto/ExtraDocumentDto";
import { ApiResponseDto } from "../common/dto/ApiResponse.dto";
import { ResponseCodes } from "../common/ResponseCodes";
import { TenderBidDto } from "./dto/TenderBid.dto";
import { getRandomInt } from "../common/utils";
import { CreateRejectionDto } from "./dto/CreateRejection.dto";
import * as fs from "fs";

@Controller("bids")
@UseGuards(AuthGuard)
export class BidsController {
  constructor(private readonly bidService: BidsService) {}

  @Get()
  @ApiOperation({ title: "Get all TenderBids" })
  @ApiImplicitQuery({ name: "bidderId", required: false })
  @ApiImplicitQuery({
    name: "noticeId",
    required: false,
    description: "Will be ignored if bidderId is provided",
  })
  @ApiResponse({ status: 200, type: TenderBidDto, isArray: true })
  async getAllBids(
    @Req() req: FastifyRequest<IncomingMessage>,
  ): Promise<TenderBidDto[]> {
    const session: SessionEntity = req.params.session;
    const bidderId = req.query.bidderId;
    const noticeId = req.query.noticeId;

    if (bidderId) {
      return this.bidService.getAllForBidder(session, bidderId);
    } else if (noticeId) {
      return this.bidService.getAllForNotice(session, noticeId);
    } else {
      return this.bidService.getAllBids(session);
    }
  }

  @Get("/forCurrent")
  @ApiOperation({ title: "Get all TenderBids for current bidder" })
  @ApiResponse({ status: 200, type: TenderBidDto, isArray: true })
  async getAllBidsForCurrent(
    @Param("session") session,
  ): Promise<TenderBidDto[]> {
    const bidderId = session.participantId;

    return this.bidService.getAllForBidder(session, bidderId);
  }

  @Get("/forCurrent/:noticeId")
  @ApiOperation({ title: "Get the bid for the current user on the notice" })
  @ApiResponse({ status: 200, type: TenderBidDto, isArray: true })
  async getBidsForUserOnNotice(
    @Param("session") session,
    @Param("noticeId") noticeId: string,
  ): Promise<TenderBidDto> {
    const bidderId = session.participantId;

    const bids = await this.bidService.getForBidderOnNotice(
      session,
      bidderId,
      noticeId,
    );

    if (bids) {
      return bids;
    } else {
      throw new HttpException("No bid placed on tender", HttpStatus.NOT_FOUND);
    }
  }

  @Post()
  @ApiOperation({ title: "Create a TenderBid" })
  @ApiConsumes("multipart/form-data")
  @ApiImplicitFile({
    name: "bid",
    required: true,
    description: "TenderBid file",
  })
  @ApiImplicitBody({
    name: "body",
    description: "DOESNT'T WORK IN SWAGGER. USE POSTMAN.",
    type: CreateTenderBidDto,
  })
  async create(@Req() req) {
    const session: SessionEntity = req.params.session;

    const dto: CreateTenderBidDto = req.body;

    const bidDocHash = crypto
      .createHash("sha256")
      .update(req.raw.files.bid.data)
      .digest("hex");
    let bidDocRef = `BID|${dto.tenderId}|${
      session.participantId
    }|${getRandomInt()}|${req.raw.files.bid.name}`;
    bidDocRef = Buffer.from(bidDocRef).toString("base64");
    const bidDocument = new Document(
      req.raw.files.bid.name,
      bidDocRef,
      bidDocHash,
      req.raw.files.bid.data,
    );

    const extraDocuments: ExtraDocumentDto[] = [];
    Object.keys(req.raw.files).forEach(k => {
      if (k === "bid") {
        return;
      }
      const file = req.raw.files[k];
      let docRef = `BID_EXTRA|${dto.tenderId}|${
        session.participantId
      }|${k}|${getRandomInt()}|${req.raw.files.bid.name}`;
      docRef = Buffer.from(docRef).toString("base64");
      const docHash = crypto
        .createHash("sha256")
        .update(file.data)
        .digest("hex");
      extraDocuments.push(new ExtraDocumentDto(k, docRef, docHash));
      fs.writeFileSync(`./files/documents/${docRef}`, req.raw.files[k].data);
    });

    await this.bidService.create(session, dto, bidDocument, extraDocuments);

    fs.writeFileSync(`./files/documents/${bidDocRef}`, req.raw.files.bid.data);

    return new ApiResponseDto(
      HttpStatus.CREATED,
      "TenderBid created",
      ResponseCodes.BID_CREATED,
    );
  }

  @Delete(":id")
  @ApiOperation({ title: "Withdraw a TenderBid" })
  async withdrawBid(@Param("session") session, @Param("id") id: string) {
    await this.bidService.withdrawTenderNotice(session, id);

    return new ApiResponseDto(
      HttpStatus.OK,
      "TenderBid withdrawn",
      ResponseCodes.BID_WITHDRAWN,
    );
  }

  @Post("/:id/reject")
  @ApiOperation({ title: "Reject a TenderBid" })
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param("session") session,
    @Param("id") id: string,
    @Body() dto: CreateRejectionDto,
  ) {
    await this.bidService.reject(session, id, dto);

    return new ApiResponseDto(
      HttpStatus.OK,
      "TenderBid rejected",
      ResponseCodes.TENDER_BID_REJECTED,
    );
  }
}
