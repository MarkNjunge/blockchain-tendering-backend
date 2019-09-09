export class CardMetdata {
  cardName: string;
  username: string;
  participantType: string;
  businessNetwork: string;

  constructor(
    cardName: string,
    username: string,
    participantType: string,
    businessNetwork: string,
  ) {
    this.cardName = cardName;
    this.username = username;
    this.participantType = participantType;
    this.businessNetwork = businessNetwork;
  }
}
