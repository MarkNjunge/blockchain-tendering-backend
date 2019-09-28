import { ApiModelProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsDateString, IsArray } from "class-validator";

export class CreateTenderNoticeDto {
  @IsNotEmpty()
  @ApiModelProperty()
  id: string;

  @IsNotEmpty()
  @ApiModelProperty()
  title: string;

  @IsNotEmpty()
  @IsArray()
  @ApiModelProperty({ type: String, isArray: true })
  requiredDocuments: string[];

  @IsNotEmpty()
  @ApiModelProperty({ type: String })
  @IsDateString()
  closingDate: Date;

  @IsNotEmpty()
  @ApiModelProperty()
  openingVenue: string;

  @IsNotEmpty()
  @ApiModelProperty({ type: String })
  @IsDateString()
  openingDate: Date;
}
