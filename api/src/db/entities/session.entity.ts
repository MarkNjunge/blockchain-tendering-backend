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

  constructor(sessionId: string, cardName: string) {
    this.sessionId = sessionId;
    this.cardName = cardName;
  }
}
