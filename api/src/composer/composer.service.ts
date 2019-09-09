import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { BusinessNetworkConnection } from "composer-client";
import {
  BusinessNetworkCardStore,
  IdCard,
  NetworkCardStoreManager,
} from "composer-common";
import { CustomLogger } from "../common/CustomLogger";
import { AdminConnection } from "composer-admin";
import { CardMetdata } from "./model/CardMetadata";

@Injectable()
export class ComposerService {
  private logger: CustomLogger;
  public cardStore: BusinessNetworkCardStore = NetworkCardStoreManager.getCardStore();
  private cardType = { type: "composer-wallet-filesystem" };
  public static adminCardName = "admin@tendering";
  public static participantNS = "com.marknjunge.tendering.participant";

  constructor() {
    this.cardStore = NetworkCardStoreManager.getCardStore();
    this.logger = new CustomLogger("ComposerService");
  }

  async verifyCard(card): Promise<CardMetdata> {
    try {
      // Verify that the file is a card
      const idCardData = await IdCard.fromArchive(card);

      // Obtain the name of the card
      const idCardName = await BusinessNetworkCardStore.getDefaultCardName(
        idCardData,
      );

      // Verify that the card exists
      const c = await this.cardStore.get(idCardName);
      this.logger.debug(JSON.stringify(c));

      return new CardMetdata(
        idCardName,
        c.metadata.userName,
        c.metadata.participantType,
        c.metadata.businessNetwork,
      );
    } catch (error) {
      this.logger.error(error.message, "verifyCard");

      if (error.message.includes("is this a zip file")) {
        throw new BadRequestException(
          "The file uploaded is not a valid business network card.",
        );
      } else if (error.message.includes("Card not found")) {
        throw new UnauthorizedException("The card is not in the network.");
      } else {
        throw new InternalServerErrorException({
          message: "Unable to login",
          meta: { message: error.message },
        });
      }
    }
  }

  async connect(cardName): Promise<BusinessNetworkConnection> {
    const connection = new BusinessNetworkConnection(this.cardType);
    await connection.connect(cardName);
    return connection;
  }

  async connectAsAdmin(): Promise<AdminConnection> {
    const connection = new AdminConnection(this.cardType);
    await connection.connect(ComposerService.adminCardName);
    return connection;
  }

  async ping(connection: BusinessNetworkConnection) {
    return connection.ping();
  }

  async disconnect(connection: BusinessNetworkConnection) {
    await connection.disconnect();
  }
}
