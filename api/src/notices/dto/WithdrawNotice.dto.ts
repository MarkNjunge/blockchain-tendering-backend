import { ApiModelProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class WithdrawNoticeDto {
  @IsOptional()
  @ApiModelProperty({ required: false })
  reason: string;
}
