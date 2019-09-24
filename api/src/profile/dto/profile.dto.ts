import { ApiModelProperty } from "@nestjs/swagger";
import { ContactDto } from "./contact.dto";

export class ProfileDto {
  @ApiModelProperty()
  participantId: string;

  @ApiModelProperty()
  name: string;

  @ApiModelProperty()
  contact: ContactDto;
}
