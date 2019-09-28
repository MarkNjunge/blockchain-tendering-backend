import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { CreateTenderNoticeDto } from "./dto/CreateTenderNotice.dto";
import { ComposerService } from "../composer/composer.service";
import { SessionEntity } from "../db/entities/session.entity";
import { BusinessNetworkDefinition, Factory } from "composer-common";
import { Document } from "../common/document";
import { AssetRegistry } from "composer-client";
import { TenderNoticeDto } from "./dto/TenderNotice.dto";
import { ResponseCodes } from "src/common/ResponseCodes";

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

    return tenderNoticeRegistry.getAll();
  }

  async findById(session: SessionEntity, id: string): Promise<TenderNoticeDto> {
    const connection = await this.composerService.connect(session.cardName);
    const tenderNoticeRegistry: AssetRegistry = await connection.getAssetRegistry(
      `${ComposerService.tenderNS}.TenderNotice`,
    );

    try {
      const notice = await tenderNoticeRegistry.get(id);
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
}
