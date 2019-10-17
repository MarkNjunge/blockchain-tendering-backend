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
import { config } from "../common/Config";
import { decode, verify } from "jsonwebtoken";

@Controller("files")
export class FilesController {
  @Get("/documents")
  @ApiOperation({ title: "Download a document by ref" })
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

  @Get("/download")
  @ApiOperation({ title: "Download a document using a token" })
  async downloadFromToken(
    @Query("token") token: string,
    @Res() res: FastifyReply<ServerResponse>,
  ) {
    const decoded: any = verify(token, config.jwtSecret);

    if (decoded.type == "card") {
      if (!fs.existsSync(`./files/cards/${decoded.filename}`)) {
        throw new HttpException("File not found", HttpStatus.NOT_FOUND);
      }

      const file = fs.createReadStream(`./files/cards/${decoded.filename}`);

      res.header(
        "Content-Disposition",
        `attachment; filename="${decoded.filename}"`,
      );
      res.send(file);
    } else {
      throw new HttpException("Unsupported file type", HttpStatus.BAD_REQUEST);
    }
  }
}
