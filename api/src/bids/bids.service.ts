import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SessionEntity } from "../db/entities/session.entity";
import { CustomLogger } from "../common/CustomLogger";
import { ComposerService } from "../composer/composer.service";
import { AssetRegistry } from "composer-client";
import { CreateTenderBidDto } from "./dto/CreateTenderBid.dto";
import {
  BusinessNetworkDefinition,
  Factory,
  Serializer,
} from "composer-common";
import { Document } from "../common/document";
import { ExtraDocumentDto } from "./dto/ExtraDocumentDto";
import { ResponseCodes } from "../common/ResponseCodes";
import { TenderBidDto } from "./dto/TenderBid.dto";
import { CreateRejectionDto } from "./dto/CreateRejection.dto";

@Injectable()
export class BidsService {
  private logger: CustomLogger;

  constructor(private readonly composerService: ComposerService) {
    this.logger = new CustomLogger("BidsService");
  }

  async getAllBids(session: SessionEntity): Promise<TenderBidDto[]> {
    const connection = await this.composerService.connect(session.cardName);
    const tenderNoticeRegistry: AssetRegistry = await connection.getAssetRegistry(
      `${ComposerService.tenderNS}.TenderBid`,
    );

    return tenderNoticeRegistry.getAll();
  }

  async getAllForNotice(
    session: SessionEntity,
    noticeId: string,
  ): Promise<TenderBidDto[]> {
    this.logger.debug(`Fetching bids for TenderNotice ${noticeId}`);
    const connection = await this.composerService.connect(session.cardName);
    const bidderRegistry = await this.composerService.getParticipantRegistry(
      connection,
      "TenderBidder",
    );
    const network = await this.composerService.getNetworkDefinition(connection);
    const serializer: Serializer = network.getSerializer();

    const notice = `resource:com.marknjunge.tendering.tender.TenderNotice#${noticeId}`;
    const statement =
      "SELECT com.marknjunge.tendering.tender.TenderBid WHERE (tenderNotice == _$notice)";
    const query = await connection.buildQuery(statement);
    const bidsRes = await connection.query(query, { notice });

    return await Promise.all(
      bidsRes.map(async bid => {
        const bidder = await bidderRegistry.get(bid.bidder.$identifier);

        bid = serializer.toJSON(bid);
        bid.bidder = bidder;
        return bid;
      }),
    );
  }

  async getAllForBidder(
    session: SessionEntity,
    bidderId: string,
  ): Promise<TenderBidDto[]> {
    this.logger.debug(`Fetching bids for TenderBidder ${bidderId}`);
    const connection = await this.composerService.connect(session.cardName);
    const bidder = `resource:com.marknjunge.tendering.participant.TenderBidder#${bidderId}`;
    const noticeRegistry = await this.composerService.getAssetRegistry(
      connection,
      "TenderNotice",
    );
    const network = await this.composerService.getNetworkDefinition(connection);
    const serializer: Serializer = network.getSerializer();

    const statement =
      "SELECT com.marknjunge.tendering.tender.TenderBid WHERE (bidder == _$bidder)";
    const query = await connection.buildQuery(statement);
    const bidsRes = await connection.query(query, { bidder });

    return await Promise.all(
      bidsRes.map(async bid => {
        const notice = await noticeRegistry.get(bid.tenderNotice.$identifier);

        bid = serializer.toJSON(bid);
        bid.tenderNotice = notice;
        return bid;
      }),
    );
  }

  async getForBidderOnNotice(
    session: SessionEntity,
    bidderId: string,
    noticeId: string,
  ): Promise<TenderBidDto> {
    this.logger.debug(`Fetching bids for TenderBidder ${bidderId}`);
    const connection = await this.composerService.connect(session.cardName);
    const bidder = `resource:com.marknjunge.tendering.participant.TenderBidder#${bidderId}`;
    const notice = `resource:com.marknjunge.tendering.tender.TenderNotice#${noticeId}`;

    const statement =
      "SELECT com.marknjunge.tendering.tender.TenderBid WHERE (bidder == _$bidder AND tenderNotice == _$notice)";
    const query = await connection.buildQuery(statement);
    const bids = await connection.query(query, { bidder, notice });
    return bids[0];
  }

  async create(
    session: SessionEntity,
    dto: CreateTenderBidDto,
    bid: Document,
    extraDocuments?: ExtraDocumentDto[],
  ) {
    this.logger.debug(`Creating TenderBid for TenderNotice ${dto.tenderId}`);

    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "CreateTenderBid",
    );
    txn.setPropertyValue("tenderNoticeId", dto.tenderId);
    txn.setPropertyValue("bidderParticipantId", session.participantId);
    txn.setPropertyValue("bidSummary", dto.bidSummary);
    txn.setPropertyValue("documentRef", bid.ref);
    txn.setPropertyValue("documentHash", bid.hash);

    extraDocuments.forEach(doc => {
      const document = factory.newConcept(
        ComposerService.tenderNS,
        "ExtraDocumentCreate",
      );

      document.key = doc.key;
      document.documentRef = doc.documentRef;
      document.documentHash = doc.documentHash;
      txn.addArrayValue("requiredDocuments", document);
    });

    this.logger.debug(`Submitting TenderBid transaction..`);
    try {
      await connection.submitTransaction(txn);
      this.logger.debug(`TenderBid created!`);
      await this.composerService.disconnect(connection);
    } catch (e) {
      await this.composerService.disconnect(connection);

      const msg = e.message.split(
        "transaction returned with failure: Error: ",
      )[1];
      if (e.message.includes("has not been provided")) {
        throw new HttpException(
          {
            message: msg,
            responseCode: ResponseCodes.REQUIRED_DOCUMENT_MISSING,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async reject(session: SessionEntity, bidId: string, dto: CreateRejectionDto) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    this.logger.debug(`Rejecting TenderBid ${bidId} with reason ${dto.reason}`);
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "CreateTenderRejection",
    );
    txn.setPropertyValue("bidId", bidId);
    txn.setPropertyValue("reason", dto.reason);
    txn.setPropertyValue("reasonNarrative", dto.reasonNarrative);

    try {
      await connection.submitTransaction(txn);
      this.logger.debug("TenderRejection completed");

      await connection.disconnect();
    } catch (e) {
      const msg = e.message.split(
        "transaction returned with failure: Error: ",
      )[1];
      if (e.message.includes("does not exist")) {
        throw new HttpException(
          { message: msg, responseCode: ResponseCodes.TENDER_BID_NOT_FOUND },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(msg, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async withdrawTenderNotice(session: SessionEntity, bidId: string) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    this.logger.debug(`Withdrawing TenderBid ${bidId}`);
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "WithdrawTenderBid",
    );
    txn.setPropertyValue("bidId", bidId);

    await connection.submitTransaction(txn);

    await connection.disconnect();
  }
}
