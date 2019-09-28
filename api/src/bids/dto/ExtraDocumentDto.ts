import { ApiModelProperty } from "@nestjs/swagger";

export class ExtraDocumentDto {
  @ApiModelProperty()
  key: string;

  @ApiModelProperty()
  documentRef: string;

  @ApiModelProperty()
  documentHash: string;

  constructor(key: string, documentRef: string, documentHash: string) {
    this.key = key;
    this.documentRef = documentRef;
    this.documentHash = documentHash;
  }
}
