import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { CreateTenderNoticeDto } from "./dto/CreateTenderNotice.dto";
import { ComposerService } from "../composer/composer.service";
import { SessionEntity } from "../db/entities/session.entity";
import {
  BusinessNetworkDefinition,
  Factory,
  Serializer,
} from "composer-common";
import { Document } from "../common/document";
import { AssetRegistry } from "composer-client";
import { TenderNoticeDto } from "./dto/TenderNotice.dto";
import { ResponseCodes } from "src/common/ResponseCodes";
import { SetTenderResultDto } from "./dto/SetTenderResult.dto";
import { TenderResultDto } from "./dto/TenderResult.dto";
import { WithdrawNoticeDto } from "./dto/WithdrawNotice.dto";

@Injectable()
export class NoticesService {
  private logger: CustomLogger;

  constructor(private readonly composerService: ComposerService) {
    this.logger = new CustomLogger("NoticesService");
  }

  async create(
    session: SessionEntity,
    dto: CreateTenderNoticeDto,
    document: Document,
  ) {
    this.logger.debug(`Creating TenderNotice ${dto.id}`);
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "CreateTenderNotice",
    );
    txn.setPropertyValue("tenderId", dto.id);
    txn.setPropertyValue("organizationId", session.participantId);
    txn.setPropertyValue("title", dto.title);
    txn.setPropertyValue("documentRef", document.ref);
    txn.setPropertyValue("documentHash", document.hash);
    txn.setPropertyValue("requiredDocuments", dto.requiredDocuments);
    txn.setPropertyValue("submissionClosingDate", dto.closingDate);
    txn.setPropertyValue("openingVenue", dto.openingVenue);
    txn.setPropertyValue("openingDate", dto.openingDate);

    await connection.submitTransaction(txn);
    this.logger.debug(`TenderNotice ${dto.id} created!`);

    this.composerService.disconnect(connection);
  }

  async findAll(session: SessionEntity): Promise<TenderNoticeDto[]> {
    const connection = await this.composerService.connect(session.cardName);
    const tenderNoticeRegistry: AssetRegistry = await connection.getAssetRegistry(
      `${ComposerService.tenderNS}.TenderNotice`,
    );
    const orgRegistry = await this.composerService.getParticipantRegistry(
      connection,
      "TenderingOrganization",
    );
    const network = await this.composerService.getNetworkDefinition(connection);
    const serializer: Serializer = network.getSerializer();

    const noticesRes = await tenderNoticeRegistry.getAll();

    return await Promise.all(
      noticesRes.map(async notice => {
        const org = await orgRegistry.get(notice.organization.$identifier);

        notice = serializer.toJSON(notice);
        notice.organization = org;
        return notice;
      }),
    );
  }

  async findByOrganization(
    session: SessionEntity,
    organizationId: string,
  ): Promise<TenderNoticeDto[]> {
    this.logger.debug(
      `Fetching notices for TenderingOrganization ${organizationId}`,
    );
    const connection = await this.composerService.connect(session.cardName);
    const organization = `resource:com.marknjunge.tendering.participant.TenderingOrganization#${organizationId}`;

    const statement =
      "SELECT com.marknjunge.tendering.tender.TenderNotice WHERE (organization == _$organization)";
    const query = await connection.buildQuery(statement);
    return connection.query(query, { organization });
  }

  async findById(session: SessionEntity, id: string): Promise<TenderNoticeDto> {
    const connection = await this.composerService.connect(session.cardName);
    const tenderNoticeRegistry: AssetRegistry = await connection.getAssetRegistry(
      `${ComposerService.tenderNS}.TenderNotice`,
    );
    const orgRegistry = await this.composerService.getParticipantRegistry(
      connection,
      "TenderingOrganization",
    );
    const network = await this.composerService.getNetworkDefinition(connection);
    const serializer: Serializer = network.getSerializer();

    try {
      let notice = await tenderNoticeRegistry.get(id);
      const org = await orgRegistry.get(notice.organization.$identifier);

      notice = serializer.toJSON(notice);
      notice.organization = org;

      return notice;
    } catch (e) {
      if (e.message.includes("does not exist")) {
        throw new HttpException(
          {
            message: `TenderNotice ${id} does not exist`,
            responseCode: ResponseCodes.NOTICE_NOT_FOUND,
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(e.message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  async getNoticeResult(
    session: SessionEntity,
    tenderId: string,
  ): Promise<TenderResultDto> {
    this.logger.debug(`Fetching result for TenderingNotice ${tenderId}`);
    const connection = await this.composerService.connect(session.cardName);
    const tender = `resource:com.marknjunge.tendering.tender.TenderNotice#${tenderId}`;

    const statement =
      "SELECT com.marknjunge.tendering.tender.TenderResult WHERE (tender == _$tender)";
    const query = await connection.buildQuery(statement);
    const results = await connection.query(query, { tender });

    if (results[0]) {
      return results[0];
    } else {
      throw new HttpException(
        {
          message: "No result for tender",
          responseCode: ResponseCodes.NO_RESULT_FOR_NOTICE,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  async setNoticeResult(
    session: SessionEntity,
    tenderId: string,
    dto: SetTenderResultDto,
  ) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    this.logger.debug(
      `Setting TenderBid ${dto.winningBid} as winning bid for TenderNotice ${tenderId}`,
    );
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "CreateTenderResult",
    );
    txn.setPropertyValue("tenderId", tenderId);
    txn.setPropertyValue("winningBidId", dto.winningBid);

    await connection.submitTransaction(txn);
    this.logger.debug("TenderResult set");

    await connection.disconnect();
  }

  async disputeTenderResult(session: SessionEntity, tenderId: string) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    const result = await this.getNoticeResult(session, tenderId);

    this.logger.debug(`Disputing TenderResult ${result.resultId}`);
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "SetTenderResultDisputed",
    );
    txn.setPropertyValue("resultId", result.resultId);

    await connection.submitTransaction(txn);
    this.logger.debug("TenderResult disputed");

    await connection.disconnect();
  }

  async nullifyTenderResult(session: SessionEntity, tenderId: string) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    const result = await this.getNoticeResult(session, tenderId);

    this.logger.debug(`Nullifying TenderResult ${result.resultId}`);
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "SetTenderResultNullified",
    );
    txn.setPropertyValue("resultId", result.resultId);

    await connection.submitTransaction(txn);
    this.logger.debug("TenderResult nullified");

    await connection.disconnect();
  }

  async withdrawNotice(
    session: SessionEntity,
    tenderId: string,
    dto: WithdrawNoticeDto,
  ) {
    const connection = await this.composerService.connect(session.cardName);
    const network: BusinessNetworkDefinition = connection.getBusinessNetwork();
    const factory: Factory = network.getFactory();

    this.logger.debug(`Withdrawing TenderNotice ${tenderId}`);
    const txn = factory.newTransaction(
      ComposerService.tenderNS,
      "WithdrawTender",
    );
    txn.setPropertyValue("tenderId", tenderId);
    if (dto.reason) {
      txn.setPropertyValue("withdrawalReason", dto.reason);
    }

    await connection.submitTransaction(txn);
    this.logger.debug(`TenderNotice ${tenderId} nullified`);

    await connection.disconnect();
  }
}
