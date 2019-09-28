import { ApiModelProperty } from "@nestjs/swagger";

export class DocumentDto {
  @ApiModelProperty()
  documentRef: string;

  @ApiModelProperty()
  documentHash: string;

  @ApiModelProperty()
  datePosted: string;
}
