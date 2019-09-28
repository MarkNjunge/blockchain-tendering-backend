import { ApiModelProperty } from "@nestjs/swagger";
import { DocumentDto } from "../../common/dto/Document.dto";
import { ExtraDocumentDto } from "./ExtraDocumentDto";

export class TenderBidDto {
  @ApiModelProperty()
  bidId: string;
  @ApiModelProperty()
  tenderNotice: string;

  @ApiModelProperty()
  bidder: string;

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
