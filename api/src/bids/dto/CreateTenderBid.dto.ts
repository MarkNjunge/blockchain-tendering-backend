import { ApiModelProperty } from "@nestjs/swagger";

export class CreateTenderBidDto {
  @ApiModelProperty()
  tenderId: string;

  @ApiModelProperty()
  bidSummary: string;
}
