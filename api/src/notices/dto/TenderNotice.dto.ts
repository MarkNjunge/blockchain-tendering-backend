import { DocumentDto } from "../../common/dto/Document.dto";
import { ApiModelProperty } from "@nestjs/swagger";

export class TenderNoticeDto {
  @ApiModelProperty()
  tenderId: string;

  @ApiModelProperty()
  organization: string;

  @ApiModelProperty()
  title: string;

  @ApiModelProperty()
  tenderDocument: DocumentDto;

  @ApiModelProperty()
  requiredDocuments: string[];

  @ApiModelProperty()
  datePublished: Date;

  @ApiModelProperty()
  submissionClosingDate: Date;

  @ApiModelProperty()
  openingVenu: string;

  @ApiModelProperty()
  openingDate: string;

  @ApiModelProperty()
  status: string;

  @ApiModelProperty()
  withdrawn: boolean;
}
