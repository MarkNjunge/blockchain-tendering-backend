import { ApiModelProperty } from "@nestjs/swagger";
import { HttpStatus } from "@nestjs/common";

export class ApiResponseDto {
  @ApiModelProperty()
  status: number;

  @ApiModelProperty()
  message: string;

  @ApiModelProperty()
  meta: any;

  constructor(message: string, status: number = HttpStatus.OK, meta = null) {
    this.message = message;
    this.status = status;
    this.meta = meta;
  }
}
