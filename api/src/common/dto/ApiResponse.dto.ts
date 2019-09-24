import { ApiModelProperty } from "@nestjs/swagger";

export class ApiResponseDto {
  @ApiModelProperty()
  httpStatus: number;

  @ApiModelProperty()
  message: string;

  @ApiModelProperty()
  responseCode: string;

  @ApiModelProperty()
  meta: any;

  constructor(
    httpStatus: number,
    message: string,
    responseCode: string,
    meta?: any,
  ) {
    this.httpStatus = httpStatus;
    this.message = message;
    this.responseCode = responseCode;
    this.meta = meta;
  }
}
