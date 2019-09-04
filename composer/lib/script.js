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
  document.documentUrl = tx.documentUrl;
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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
