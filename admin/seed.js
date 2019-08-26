const ora = require("ora");
const casual = require("casual");
const prompts = require("prompts");
const connectionUtil = require("./connection-util");

const participantNS = "com.marknjunge.tendering.participant";
let connection = {};

(async () => {
  try {
    const spinner = ora("Connecting to business network").start();
    connection = await connectionUtil.connect();
    await connection.ping(connection);
    spinner.succeed("Connected to network");

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
      },
      {
        type: "number",
        name: "count",
        initial: 1,
        message: "How many?"
      }
    ];

    const response = await prompts(questions);
    await seedParticipant(response.participant, response.count);

    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();

async function seedParticipant(participant, count) {
  let txns = [];

  switch (participant) {
  case "TenderingOrganization":
    txns = createTenderingOrgTransactions(count);
    break;
  case "TenderBidder":
    txns = createTenderBidderTransactions(count);
    break;
  case "RegulatoryAuthority":
    txns = createRegulatoryAuthorityTransactions(count);
    break;
  }

  await asyncForEach(txns, async txn => {
    await connection.submitTransaction(txn);
    console.log(`Added organization: ${txn.name}`);
  });
}

function createTenderingOrgTransactions(count) {
  const orgs = [];

  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  for (let i = 0; i < count; i++) {
    let txn = factory.newTransaction(
      participantNS,
      "CreateTenderingOrganization"
    );
    const name = casual.company_name;
    txn.setPropertyValue("name", name);
    txn.setPropertyValue(
      "email",
      `contact@${name.replace(/ +/g, "").toLowerCase()}.com`
    );
    txn.setPropertyValue("phone", `${casual.numerify("2547########")}`);
    txn.setPropertyValue("streetAddress", casual.address1);
    orgs.push(txn);
  }

  return orgs;
}

function createTenderBidderTransactions(count) {
  const orgs = [];

  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();
  for (let i = 0; i < count; i++) {
    let txn = factory.newTransaction(participantNS, "CreateTenderBidder");
    const name = casual.company_name;
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
    orgs.push(txn);
  }

  return orgs;
}

function createRegulatoryAuthorityTransactions(count) {
  const orgs = [];

  const bnDef = connection.getBusinessNetwork();
  const factory = bnDef.getFactory();

  for (let i = 0; i < count; i++) {
    let txn = factory.newTransaction(
      participantNS,
      "CreateRegulatoryAuthority"
    );
    const name = casual.company_name;
    txn.setPropertyValue("name", name);
    txn.setPropertyValue(
      "email",
      `contact@${name.replace(/ +/g, "").toLowerCase()}.com`
    );
    txn.setPropertyValue("phone", `${casual.numerify("2547########")}`);
    txn.setPropertyValue("streetAddress", casual.address1);
    orgs.push(txn);
  }

  return orgs;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
