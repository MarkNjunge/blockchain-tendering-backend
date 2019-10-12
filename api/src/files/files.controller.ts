import { Controller, Param, Get, Res } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import * as fs from "fs";
import { FastifyReply } from "fastify";
import { ServerResponse } from "http";

@Controller("files")
export class FilesController {
  @Get("/documents/:ref")
  @ApiOperation({ title: "Get a specific TenderNotice" })
  async download(
    @Param("ref") ref: string,
    @Res() res: FastifyReply<ServerResponse>,
  ) {
    const file = fs.createReadStream(`./files/documents/${ref}`);

    const fullFilename = new Buffer(ref, "base64").toString();
    const filename = fullFilename.split("|").pop();

    res.header("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(file);
  }
}
