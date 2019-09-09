import { BusinessNetworkConnection } from "composer-client";
import { AdminConnection } from "composer-admin";
import { IdCard, NetworkCardStoreManager } from "composer-common";
import { RegistrationDto } from "../auth/dto/Registration.dto";
import { ComposerService } from "../composer/composer.service";
import { Card } from "composer-cli";
import { CustomLogger } from "../common/CustomLogger";
import {
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";

const cardStore = NetworkCardStoreManager.getCardStore();

export async function createParticipant(
  connection: BusinessNetworkConnection,
  adminConnection: AdminConnection,
  dto: RegistrationDto,
): Promise<string> {
  const logger = new CustomLogger("createParticipant");

  // Create transaction to create new participant
  let txn;
  switch (dto.participantType) {
    case "TenderingOrganization":
      txn = createTenderingOrgTransaction(connection, dto);
      break;
    case "TenderBidder":
      txn = createTenderBidderTransaction(connection, dto);
      break;
    case "RegulatoryAuthority":
      txn = createRegulatoryAuthorityTransaction(connection, dto);
      break;
  }
  logger.debug(`Crearing participant ${dto.participantType}: ${dto.name}`);

  try {
    // Make transaction to create participant
    await connection.submitTransaction(txn);
    logger.debug(`Created ${txn.name} sucessfully!`);

    // Issue an identity to the new participant
    const result = await connection.issueIdentity(
      `${ComposerService.participantNS}.${dto.participantType}#${txn.participantId}`,
      txn.name.replace(/ +/g, ""),
    );
    logger.debug("Identity issued!");

    // Get issuing card (admin card)
    const adminCard = await cardStore.get(ComposerService.adminCardName);

    // Create a card for the new particpant
    const metadata = {
      userName: txn.name.replace(/ +/g, ""),
      participantType: dto.participantType,
      version: 1,
      enrollmentSecret: result.userSecret,
      businessNetwork: "tendering",
    };
    const idCard = new IdCard(metadata, adminCard.getConnectionProfile());
    logger.debug("Created card");

    // Import the card
    await adminConnection.importCard(
      `${txn.name.replace(/ +/g, "")}@tendering`,
      idCard,
    );
    logger.debug("Imported IdCard");

    // Create a file for the card
    const cardFileName = `${txn.name.replace(/ +/g, "")}@tendering.card`;
    const options = {
      file: cardFileName,
      card: `${txn.name.replace(/ +/g, "")}@tendering`,
    };

    await Card.Export.handler(options);
    logger.debug(`Created card: ${cardFileName}`);

    return cardFileName;
  } catch (e) {
    const errorLines = e.message.split("Error");
    const actuallErrorMessage = errorLines[errorLines.length - 1];
    if (e.message.includes("Validator error")) {
      throw new BadRequestException(actuallErrorMessage);
    } else {
      throw new InternalServerErrorException(actuallErrorMessage);
    }
  }
}

function createTenderingOrgTransaction(
  connection: BusinessNetworkConnection,
  dto: RegistrationDto,
) {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  const txn = factory.newTransaction(
    ComposerService.participantNS,
    "CreateTenderingOrganization",
  );
  txn.setPropertyValue("participantId", `TORG#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", dto.name);
  txn.setPropertyValue("email", dto.email);
  txn.setPropertyValue("phone", dto.phone);
  txn.setPropertyValue("streetAddress", dto.streetAddress);

  return txn;
}

function createTenderBidderTransaction(
  connection: BusinessNetworkConnection,
  dto: RegistrationDto,
) {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  const txn = factory.newTransaction(
    ComposerService.participantNS,
    "CreateTenderBidder",
  );
  txn.setPropertyValue("participantId", `BIDDER#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", dto.name);
  txn.setPropertyValue("companyRegNo", dto.companyRegNo);
  txn.setPropertyValue("email", dto.email);
  txn.setPropertyValue("phone", dto.phone);
  txn.setPropertyValue("streetAddress", dto.streetAddress);

  return txn;
}

function createRegulatoryAuthorityTransaction(
  connection: BusinessNetworkConnection,
  dto: RegistrationDto,
) {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  const txn = factory.newTransaction(
    ComposerService.participantNS,
    "CreateRegulatoryAuthority",
  );
  txn.setPropertyValue("participantId", `REGAUTH#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", dto.name);
  txn.setPropertyValue("email", dto.email);
  txn.setPropertyValue("phone", dto.phone);
  txn.setPropertyValue("streetAddress", dto.streetAddress);

  return txn;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
