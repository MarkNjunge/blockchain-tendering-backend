import {
  Controller,
  Param,
  Get,
  Res,
  HttpException,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import * as fs from "fs";
import { FastifyReply } from "fastify";
import { ServerResponse } from "http";

@Controller("files")
export class FilesController {
  @Get("/documents")
  @ApiOperation({ title: "Download a document" })
  async download(
    @Query("ref") ref: string,
    @Res() res: FastifyReply<ServerResponse>,
  ) {
    if (!fs.existsSync(`./files/documents/${ref}`)) {
      throw new HttpException("File not found", HttpStatus.NOT_FOUND);
    }

    const file = fs.createReadStream(`./files/documents/${ref}`);

    const fullFilename = new Buffer(ref, "base64").toString();
    const filename = fullFilename.split("|").pop();

    res.header("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(file);
  }
}
