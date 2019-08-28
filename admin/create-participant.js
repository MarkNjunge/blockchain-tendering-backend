const ora = require("ora");
const casual = require("casual");
const prompts = require("prompts");
const connectionUtil = require("./connection-util");
const IdCard = require("composer-common").IdCard;
const NetworkCardStoreManager = require("composer-common")
  .NetworkCardStoreManager;
const CardExport = require("composer-cli").Card.Export;

const participantNS = "com.marknjunge.tendering.participant";
let connection = {};

const cardName = "admin@tendering";
const cardType = { type: "composer-wallet-filesystem" };
const cardStore = NetworkCardStoreManager.getCardStore(cardType);

(async () => {
  try {
    // Connect to network
    const spinner = ora("Connecting to business network").start();
    connection = await connectionUtil.connect();
    await connection.ping(connection);
    spinner.succeed("Connected to network");

    // Get issuing card (admin card)
    const adminCard = await cardStore.get(cardName);

    // Get desired participant
    const questions = [
      {
        type: "select",
        name: "participant",
        message: "Which participant?",
        choices: [
          { title: "TenderingOrganization", value: "TenderingOrganization" },
          { title: "TenderBidder", value: "TenderBidder" },
          { title: "RegulatoryAuthority", value: "RegulatoryAuthority" }
        ]
      }
    ];

    const response = await prompts(questions);

    // Create transaction to create new participant
    let txn;
    switch (response.participant) {
    case "TenderingOrganization":
      txn = createTenderingOrgTransaction();
      break;
    case "TenderBidder":
      txn = createTenderBidderTransaction();
      break;
    case "RegulatoryAuthority":
      txn = createRegulatoryAuthorityTransaction();
      break;
    }
    console.log(`Creating ${response.participant}: ${txn.name}`);

    // Make transaction to create participant
    await connection.submitTransaction(txn);
    console.log(`Created ${txn.name} sucessfully!`);

    // Issue an identity to the new participant
    const result = await connection.issueIdentity(
      `${participantNS}.${response.participant}#${txn.participantId}`,
      txn.name.replace(/ +/g, "")
    );
    console.log("Identity issued!");

    // Create a card for the new particpant
    let metadata = {
      userName: txn.name.replace(/ +/g, ""),
      version: 1,
      enrollmentSecret: result.userSecret,
      businessNetwork: "tendering"
    };
    const idCard = new IdCard(metadata, adminCard.getConnectionProfile());
    console.log("Created card");

    const adminConnection = await connectionUtil.connectAsAdmin();
    console.log("Connected as admin");

    // Import the card
    await adminConnection.importCard(
      `${txn.name.replace(/ +/g, "")}@tendering`,
      idCard
    );
    console.log("Imported IdCard");

    // Create a file for the card
    const cardFileName = `${txn.name.replace(/ +/g, "")}@tendering.card`;
    let options = {
      file: cardFileName,
      card: `${txn.name.replace(/ +/g, "")}@tendering`
    };

    await CardExport.handler(options);
    console.log(`Created card: ${cardFileName}`);

    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();

function createTenderingOrgTransaction() {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  let txn = factory.newTransaction(
    participantNS,
    "CreateTenderingOrganization"
  );
  const name = casual.company_name;
  txn.setPropertyValue("participantId", `TORG#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", name);
  txn.setPropertyValue(
    "email",
    `contact@${name.replace(/ +/g, "").toLowerCase()}.com`
  );
  txn.setPropertyValue("phone", `${casual.numerify("2547########")}`);
  txn.setPropertyValue("streetAddress", casual.address1);

  return txn;
}

function createTenderBidderTransaction() {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();
  let txn = factory.newTransaction(participantNS, "CreateTenderBidder");
  const name = casual.company_name;
  txn.setPropertyValue("participantId", `BIDDER#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", name);
  txn.setPropertyValue(
    "companyRegNo",
    casual.integer(100000, 999999).toString()
  );
  txn.setPropertyValue(
    "email",
    `cotnact@${name.replace(/ +/g, "").toLowerCase()}.com`
  );
  txn.setPropertyValue("phone", `${casual.numerify("2547########")}`);
  txn.setPropertyValue("streetAddress", casual.address1);

  return txn;
}

function createRegulatoryAuthorityTransaction() {
  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  let txn = factory.newTransaction(participantNS, "CreateRegulatoryAuthority");
  const name = casual.company_name;
  txn.setPropertyValue("participantId", `REGAUTH#${getRandomInt(9999)}`);
  txn.setPropertyValue("name", name);
  txn.setPropertyValue(
    "email",
    `contact@${name.replace(/ +/g, "").toLowerCase()}.com`
  );
  txn.setPropertyValue("phone", `${casual.numerify("2547########")}`);
  txn.setPropertyValue("streetAddress", casual.address1);

  return txn;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
