import { Entity, Column, PrimaryColumn, Generated } from "typeorm";

@Entity({ name: "sessions" })
export class SessionEntity {
  @PrimaryColumn({ select: false })
  @Generated("uuid")
  id: string;

  @Column({ name: "session_id" })
  sessionId: string;

  @Column({ name: "card_name" })
  cardName: string;

  @Column({ name: "participant_id" })
  participantId: string;

  @Column({ name: "participant_type" })
  participantType: string;

  constructor(
    sessionId: string,
    cardName: string,
    partitipantId: string,
    participantType: string,
  ) {
    this.sessionId = sessionId;
    this.cardName = cardName;
    this.participantId = partitipantId;
    this.participantType = participantType;
  }
}
