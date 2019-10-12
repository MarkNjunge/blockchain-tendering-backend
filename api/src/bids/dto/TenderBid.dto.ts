import { ApiModelProperty } from "@nestjs/swagger";
import { DocumentDto } from "../../common/dto/Document.dto";
import { ExtraDocumentDto } from "./ExtraDocumentDto";
import { ProfileDto } from "../../profile/dto/profile.dto";

export class TenderBidDto {
  @ApiModelProperty()
  bidId: string;

  @ApiModelProperty()
  tenderNotice: string;

  @ApiModelProperty()
  bidder: string | ProfileDto;

  @ApiModelProperty()
  summary: string;

  @ApiModelProperty()
  datePosted: string;

  @ApiModelProperty()
  bidDocument: DocumentDto;

  @ApiModelProperty({ type: ExtraDocumentDto, isArray: true })
  requiredDocuments: ExtraDocumentDto[];

  @ApiModelProperty()
  withdrawn: boolean;
}
