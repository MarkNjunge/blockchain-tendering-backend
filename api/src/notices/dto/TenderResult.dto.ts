import { ApiModelProperty } from "@nestjs/swagger";

export class TenderResultDto {
  @ApiModelProperty()
  resultId: string;

  @ApiModelProperty()
  tender: string;

  @ApiModelProperty()
  winningBid: string;

  @ApiModelProperty()
  datePosted: string;

  @ApiModelProperty()
  disputed: boolean;

  @ApiModelProperty()
  nullified: boolean;
}
