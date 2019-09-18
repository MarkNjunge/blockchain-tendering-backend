const participantNS = "com.marknjunge.tendering.participant";
const assetNS = "com.marknjunge.tendering.tender";

/**
 * Create tendering organization
 * @param {com.marknjunge.tendering.participant.CreateTenderingOrganization} tx Transaction
 * @transaction
 */
async function CreateTenderingOrganization(tx) {
  const registry = await getParticipantRegistry(
    `${participantNS}.TenderingOrganization`
  );
  const factory = getFactory();

  const contact = factory.newConcept(participantNS, "Contact");
  contact.email = tx.email;
  contact.phone = tx.phone;
  contact.streetAddress = tx.streetAddress;

  const participantId =
    tx.participantId ||
    `${tx.name.replace(/ +/g, "").toLowerCase()}#${getRandomInt(9999)}`;
  const organization = factory.newResource(
    participantNS,
    "TenderingOrganization",
    participantId
  );
  organization.name = tx.name;
  organization.contact = contact;

  const event = factory.newEvent(participantNS, "ParticipantCreated");
  event.participantId = participantId;
  emit(event);

  await registry.add(organization);
}

/**
 * Create tender bidder
 * @param {com.marknjunge.tendering.participant.CreateTenderBidder} tx Transaction
 * @transaction
 */
async function CreateTenderBidder(tx) {
  const registry = await getParticipantRegistry(
    `${participantNS}.TenderBidder`
  );
  const factory = getFactory();

  const contact = factory.newConcept(participantNS, "Contact");
  contact.email = tx.email;
  contact.phone = tx.phone;
  contact.streetAddress = tx.streetAddress;

  const participantId =
    tx.participantId ||
    `${tx.name.replace(/ +/g, "").toLowerCase()}#${getRandomInt(9999)}`;
  const bidder = factory.newResource(
    participantNS,
    "TenderBidder",
    participantId
  );
  bidder.name = tx.name;
  bidder.companyRegNo = tx.companyRegNo;
  bidder.contact = contact;

  const event = factory.newEvent(participantNS, "ParticipantCreated");
  event.participantId = participantId;
  emit(event);

  await registry.add(bidder);
}

/**
 * Create regulatory authority
 * @param {com.marknjunge.tendering.participant.CreateRegulatoryAuthority} tx Transaction
 * @transaction
 */
async function CreateRegulatoryAuthority(tx) {
  const registry = await getParticipantRegistry(
    `${participantNS}.RegulatoryAuthority`
  );
  const factory = getFactory();

  const contact = factory.newConcept(participantNS, "Contact");
  contact.email = tx.email;
  contact.phone = tx.phone;
  contact.streetAddress = tx.streetAddress;

  const participantId =
    tx.participantId ||
    `${tx.name.replace(/ +/g, "").toLowerCase()}#${getRandomInt(9999)}`;
  const authority = factory.newResource(
    participantNS,
    "RegulatoryAuthority",
    participantId
  );
  authority.name = tx.name;
  authority.contact = contact;

  const event = factory.newEvent(participantNS, "ParticipantCreated");
  event.participantId = participantId;
  emit(event);

  await registry.add(authority);
}

/**
 * Create a tender notice
 * @param {com.marknjunge.tendering.tender.CreateTenderNotice} tx Transaction
 * @transaction
 */
async function CreateTenderNotice(tx) {
  const participantRegistry = await getParticipantRegistry(
    `${participantNS}.TenderingOrganization`
  );
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );
  const factory = getFactory();

  const document = factory.newConcept(assetNS, "Document");
  document.documentRef = tx.documentRef;
  document.documentHash = tx.documentHash;
  document.datePosted = new Date();

  const notice = factory.newResource(assetNS, "TenderNotice", tx.tenderId);
  notice.organization = await participantRegistry.get(tx.organizationId);
  notice.title = tx.title;
  notice.tenderDocument = document;
  notice.datePublished = new Date();
  notice.submissionClosingDate = tx.submissionClosingDate;
  notice.openingVenue = tx.openingVenue;
  notice.openingDate = tx.openingDate;

  const event = factory.newEvent(assetNS, "TenderNoticeCreated");
  event.tenderId = tx.tenderId;
  emit(event);

  await tenderNoticeRegistry.add(notice);
}

/**
 * Withdraw a tender notice
 * @param {com.marknjunge.tendering.tender.WithdrawTender} tx Transaction
 * @transaction
 */
async function WithdrawTender(tx) {
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );

  const tender = await tenderNoticeRegistry.get(tx.tenderId);

  tender.withdrawn = true;
  tender.status = "WITHDRAWN";
  tender.withdrawalReason = tx.withdrawalReason;

  await tenderNoticeRegistry.update(tender);
}

/**
 * Add an amendment to a tender
 * @param {com.marknjunge.tendering.tender.AmendTender} tx Transaction
 * @transaction
 */
async function AmendTender(tx) {
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );
  const factory = getFactory();

  const amendment = factory.newConcept(assetNS, "Document");
  amendment.documentRef = tx.documentRef;
  amendment.documentHash = tx.documentHash;
  amendment.datePosted = new Date();

  const tender = await tenderNoticeRegistry.get(tx.tenderId);

  if (!tender.amendments) {
    tender.amendments = [];
  }

  tender.amendments.push(amendment);

  await tenderNoticeRegistry.update(tender);
}

/**
 * Create a person
 * @param {com.marknjunge.tendering.participant.CreatePerson} tx
 * @transaction
 */
async function CreatePerson(tx) {
  const registry = await getParticipantRegistry(`${participantNS}.Person`);
  const factory = getFactory();

  const person = factory.newResource(participantNS, "Person", tx.idNumber);
  person.fullName = tx.name;
  person.idNumber = tx.idNumber;
  person.mobileNumber = tx.mobileNumber;

  await registry.add(person);
}

/**
 * Create a tender bid
 * @param {com.marknjunge.tendering.tender.CreateTenderBid} tx
 * @transaction
 */
async function CreateTenderBid(tx) {
  const tenderBidRegistry = await getAssetRegistry(`${assetNS}.TenderBid`);
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );
  const bidderRegistry = await getParticipantRegistry(
    `${participantNS}.TenderBidder`
  );
  const factory = getFactory();

  const document = factory.newConcept(assetNS, "Document");
  document.documentRef = tx.documentRef;
  document.documentHash = tx.documentHash;
  document.datePosted = new Date();

  const bidId = `BID#${getRandomInt(999)}`;
  const bid = factory.newResource(assetNS, "TenderBid", bidId);
  bid.tenderNotice = await tenderNoticeRegistry.get(tx.tenderNoticeId);
  bid.bidder = await bidderRegistry.get(tx.bidderParticipantId);
  bid.summary = tx.bidSummary;
  bid.datePosted = new Date();
  bid.bidDocument = document;

  await tenderBidRegistry.add(bid);
}

/**
 * Withdraw a tender bid
 * @param {com.marknjunge.tendering.tender.WithdrawTenderBid} tx
 * @transaction
 */
async function WithdrawTenderBid(tx) {
  const tenderBidRegistry = await getAssetRegistry(`${assetNS}.TenderBid`);

  const bid = await tenderBidRegistry.get(tx.bidId);

  bid.withdrawn = true;

  await tenderBidRegistry.update(bid);
}

/**
 * Create a tender opening register
 * @param {com.marknjunge.tendering.tender.CreateTenderOpeningRegister} tx
 * @transaction
 */
async function CreateTenderOpeningRegister(tx) {
  const tenderOpeningRegisterRegistry = await getAssetRegistry(
    `${assetNS}.TenderOpeningRegister`
  );
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );
  const personRegistry = await getParticipantRegistry(
    `${participantNS}.Person`
  );
  const factory = getFactory();

  const registerId = `REGISTER#${getRandomInt(999)}`;
  const register = factory.newResource(
    assetNS,
    "TenderOpeningRegister",
    registerId
  );
  const tender = await tenderNoticeRegistry.get(tx.tenderNoticeId);
  register.tender = tender;
  const persons = [];
  await asyncForEach(tx.committeeMemberIds, async id => {
    const person = await personRegistry.get(id);
    persons.push(person);
  });
  register.committeeMembers = persons;
  register.date = new Date();

  // Set tender to closed
  tender.status = "CLOSED";
  await tenderNoticeRegistry.update(tender);

  await tenderOpeningRegisterRegistry.add(register);
}

/**
 * Create a tender result
 * @param {com.marknjunge.tendering.tender.CreateTenderResult} tx
 * @transaction
 */
async function CreateTenderResult(tx) {
  const tenderNoticeRegistry = await getAssetRegistry(
    `${assetNS}.TenderNotice`
  );
  const tenderBidRegistry = await getAssetRegistry(`${assetNS}.TenderBid`);
  const tenderResultRegistry = await getAssetRegistry(
    `${assetNS}.TenderResult`
  );
  const factory = getFactory();

  const resultId = `RESULT#${getRandomInt(999)}`;
  const result = factory.newResource(assetNS, "TenderResult", resultId);
  const tender = await tenderNoticeRegistry.get(tx.tenderId);
  result.tender = tender;
  const bid = await tenderBidRegistry.get(tx.winningBidId);

  // Ensure "winning" bid is not withdrawn
  if (bid.withdrawn) {
    throw new Error("Selected bid is withdrawn.");
  }

  // Ensure bid was placed on this tender
  const tenderOfBid = await tenderNoticeRegistry.get(
    bid.tenderNotice.$identifier
  );
  if (tenderOfBid.tenderId != tx.tenderId) {
    throw new Error("Selected bid was not placed on this tender.");
  }

  result.winningBid = bid;
  result.datePosted = new Date();

  // Set tender to closed
  tender.status = "AWARDED";
  await tenderNoticeRegistry.update(tender);

  await tenderResultRegistry.add(result);
}

/**
 * Set a tender to be disputed
 * @param {com.marknjunge.tendering.tender.SetTenderResultDisputed} tx
 * @transaction
 */
async function SetTenderResultDisputed(tx) {
  const tenderResultRegistry = await getAssetRegistry(
    `${assetNS}.TenderResult`
  );

  const result = await tenderResultRegistry.get(tx.resultId);
  result.disputed = true;

  await tenderResultRegistry.update(result);
}

/**
 * Set a tender result to be nullified
 * @param {com.marknjunge.tendering.tender.SetTenderResultNullified} tx
 * @transaction
 */
async function SetTenderResultNullified(tx) {
  const tenderResultRegistry = await getAssetRegistry(
    `${assetNS}.TenderResult`
  );
  const factory = getFactory();

  const result = await tenderResultRegistry.get(tx.resultId);
  result.nullified = true;

  if (tx.documentRef) {
    const document = factory.newConcept(assetNS, "Document");
    document.documentRef = tx.documentRef;
    document.documentHash = tx.documentHash;
    document.datePosted = new Date();

    result.nullificationDocument = document;
  }

  await tenderResultRegistry.update(result);
}

/**
 * Create a tender rejection
 * @param {com.marknjunge.tendering.tender.CreateTenderRejection} tx
 * @transaction
 */
async function CreateTenderRejection(tx) {
  const tenderBidRegistry = await getAssetRegistry(`${assetNS}.TenderBid`);
  const tenderRejectionRegistry = await getAssetRegistry(
    `${assetNS}.TenderRejection`
  );
  const factory = getFactory();

  const rejetionId = `REJECTION#${getRandomInt(999)}`;
  const rejection = factory.newResource(assetNS, "TenderRejection", rejetionId);
  const bid = await tenderBidRegistry.get(tx.bidId);
  // Ensure bid was not withdrawn
  if (bid.withdrawn) {
    throw new Error("Selected bid is withdrawn.");
  }
  rejection.bid = bid;
  rejection.reason = tx.reason;
  rejection.reasonNarrative = tx.reasonNarrative;

  await tenderRejectionRegistry.add(rejection);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
