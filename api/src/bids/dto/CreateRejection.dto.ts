import { ApiModelProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export enum RejectionReason {
  UNRESPONSIVE = "UNRESPONSIVE",
  OTHER = "OTHER",
}

export class CreateRejectionDto {
  @IsNotEmpty()
  @ApiModelProperty({ enum: ["UNRESPONSIVE", "OTHER"] })
  reason: RejectionReason;

  @IsNotEmpty()
  @ApiModelProperty()
  reasonNarrative: string;
}
