import { DocumentDto } from "../../common/dto/Document.dto";
import { ApiModelProperty } from "@nestjs/swagger";
import { ProfileDto } from "../../profile/dto/profile.dto";

export class TenderNoticeDto {
  @ApiModelProperty()
  tenderId: string;

  @ApiModelProperty()
  organization: string | ProfileDto;

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
