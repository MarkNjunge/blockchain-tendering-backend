import { ApiModelProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional } from "class-validator";

export enum ParticipantType {
  TENDERING_ORG = "TenderingOrganization",
  TENDER_BIDDER = "TenderBidder",
  REGULATORY_AUTHORITY = "RegulatoryAuthority",
}

export class RegistrationDto {
  @ApiModelProperty({ enum: ParticipantType })
  @IsNotEmpty()
  participantType: ParticipantType;

  @ApiModelProperty()
  @IsNotEmpty()
  name: string;

  @ApiModelProperty({ required: false })
  @IsOptional()
  companyRegNo: string;

  @ApiModelProperty()
  @IsNotEmpty()
  email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  phone: string;

  @ApiModelProperty()
  @IsNotEmpty()
  streetAddress: string;
}
