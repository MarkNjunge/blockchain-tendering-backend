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

@Injectable()
export class ComposerService {
  private cardStore: BusinessNetworkCardStore = NetworkCardStoreManager.getCardStore();
  private logger: CustomLogger;

  constructor() {
    this.cardStore = NetworkCardStoreManager.getCardStore();
  }

  async verifyCard(card): Promise<string> {
    try {
      // Verify that the file is a card
      const idCardData = await IdCard.fromArchive(card);

      // Obtain the name of the card
      const idCardName = await BusinessNetworkCardStore.getDefaultCardName(
        idCardData,
      );

      // Verify that the card exists
      await this.cardStore.get(idCardName);

      return idCardName;
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
    const cardType = { type: "composer-wallet-filesystem" };
    const connection = new BusinessNetworkConnection(cardType);
    await connection.connect(cardName);
    return connection;
  }

  async ping(connection: BusinessNetworkConnection) {
    return connection.ping();
  }

  async disconnect(connection: BusinessNetworkConnection) {
    await connection.disconnect();
  }
}
