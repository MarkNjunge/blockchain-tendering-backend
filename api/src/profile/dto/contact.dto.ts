import { ApiModelProperty } from "@nestjs/swagger";

export class ContactDto {
  @ApiModelProperty()
  email: string;

  @ApiModelProperty()
  phone: string;

  @ApiModelProperty()
  streetAddress: string;
}
