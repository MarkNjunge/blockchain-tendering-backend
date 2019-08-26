const participantNS = "com.marknjunge.tendering.participant";

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

  const participantId = tx.participantId || `TORG#${getRandomInt(9999)}`;
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

  const participantId = tx.participantId || `BIDDER#${getRandomInt(9999)}`;
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

  const participantId = tx.participantId || `REGAUTH#${getRandomInt(9999)}`;
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
 * Withdraw tender
 * @param {com.marknjunge.tendering.tender.WithdrawTender} tx Transaction
 * @transaction
 */
async function WithdrawTender(tx) {
  const NS = "com.marknjunge.tendering";

  tx.tender.withdrawn = true;
  tx.tender.withdrawalReason = tx.reason;

  const assetRegistry = await getAssetRegistry(`${NS}.tender.TenderDocument`);
  await assetRegistry.update(tx.tender);
}

/**
 * Place bid
 * @param {com.marknjunge.tendering.tender.PlaceBid} tx
 * @transaction
 */
async function PlaceBid(tx) {
  const NS = "com.marknjunge.tendering";

  // TODO Check if user has a non-withdrawn bid
  // TODO Check that the document is not withdrawn

  const tenderBidAssetRegistry = await getAssetRegistry(
    `${NS}.tender.TenderBid`
  );
  await tenderBidAssetRegistry.add(tx.bid);
}

/**
 * Withdraw Tender Bid
 * @param {com.marknjunge.tendering.tender.WithdrawTenderBid} tx
 * @transaction
 */
async function WithdrawTenderBid(tx) {
  const NS = "com.marknjunge.tendering";

  tx.bid.withdrawn = true;

  const assetRegistry = await getAssetRegistry(`${NS}.tender.TenderBid`);
  await assetRegistry.update(tx.bid);
}

/**
 * Dispute Tender
 * @param {com.marknjunge.tendering.tender.DisputeTender} tx
 * @transaction
 */
async function DisputeTender(tx) {
  const NS = "com.marknjunge.tendering";

  tx.tenderResult.disputed = true;

  const assetRegistry = await getAssetRegistry(`${NS}.tender.TenderResult`);
  await assetRegistry.update(tx.tenderResult);
}

/**
 * Nullify Tender
 * @param {com.marknjunge.tendering.tender.NullifyTender} tx
 * @transaction
 */
async function NullifyTender(tx) {
  const NS = "com.marknjunge.tendering";

  tx.tenderResult.nullified = true;
  tx.tenderResult.nullificationDocument = tx.nullificationDocument;

  const assetRegistry = await getAssetRegistry(`${NS}.TenderResult`);
  await assetRegistry.update(tx.tenderResult);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
