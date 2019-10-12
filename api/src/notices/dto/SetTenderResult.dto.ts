import { ApiModelProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class SetTenderResultDto {
  @IsNotEmpty()
  @ApiModelProperty()
  winningBid: string;
}
