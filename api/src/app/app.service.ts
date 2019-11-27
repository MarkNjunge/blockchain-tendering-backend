import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../common/CustomLogger";
import { ComposerService } from "../composer/composer.service";
import * as crypto from "crypto";
import * as asn from "asn1.js";

@Injectable()
export class AppService {
  logger: CustomLogger = new CustomLogger("AppService");

  constructor(private readonly composerService: ComposerService) {}

  getHello(): string {
    this.logger.debug("Hello!", "AppService.getHello");
    return "Blockchain-Tendering API. Sees /docs.";
  }

  async getNetworkState() {
    const connection = await this.composerService.connect("admin@tendering");

    return this.getBlocksProgressively(connection);
  }

  async getBlocksProgressively(connection) {
    const nativeApi = connection.getNativeAPI();
    const channel = nativeApi.getChannel("composerchannel");

    const currentBlockInfo = await channel.queryInfo();
    const currentBlock = await channel.queryBlockByHash(
      currentBlockInfo.currentBlockHash,
    );

    const fullBlockState = [];

    // Get preceding block data
    const currentBlockDecoded = await this.decodeBlock(currentBlock);
    // Add first block to array
    fullBlockState.push({
      number: currentBlock.header.number,
      hash: currentBlockInfo.currentBlockHash.toString("hex"),
      previousHash: currentBlockInfo.previousBlockHash.toString("hex"),
      data: currentBlockDecoded.data.payload.data.results,
    });

    var precedingBlockNumber = parseInt(currentBlock.header.number) - 1;
    while (precedingBlockNumber > 0) {
      const block = await channel.queryBlock(precedingBlockNumber);
      const blockHash = await this.calculateBlockHash(block.header);
      const blockDecoded = await this.decodeBlock(block);

      fullBlockState.push({
        number: block.header.number,
        hash: blockHash,
        previousHash: block.header.previous_hash,
        data: blockDecoded.data.payload.data.results,
      });

      precedingBlockNumber -= 1;
    }

    return fullBlockState;
  }

  async decodeBlock(block) {
    // https://fabric-sdk-node.github.io/global.html#Block
    return {
      blockNumber: block.header.number,
      blockHash: block.header.data_hash.toString("base64"),
      previousBlockHash: block.header.previous_hash.toString("base64"),
      data: {
        payload: {
          header: {
            channelHeader: {
              type: block.data.data[0].payload.header.channel_header.type,
              typeString:
                block.data.data[0].payload.header.channel_header.typeString,
              channelId:
                block.data.data[0].payload.header.channel_header.channel_id,
              timestamp:
                block.data.data[0].payload.header.channel_header.timestamp,
              tx_id: block.data.data[0].payload.header.channel_header.tx_id,
            },
            signatureHeader: {
              creator: {
                Mspid:
                  block.data.data[0].payload.header.signature_header.creator
                    .Mspid,
                idBytes:
                  block.data.data[0].payload.header.signature_header.creator
                    .IdBytes,
              },
            },
          },
          data: {
            results: {
              ...block.data.data[0].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset
                .filter(set => set.namespace == "tendering")
                .map(set => ({
                  namespace: set.namespace,
                  writes: set.rwset.writes.map(write => ({
                    key: write.key,
                    isDelete: write.isDelete,
                    value: write.value ? JSON.parse(write.value) : "",
                  })),
                })),
            },
          },
        },
      },
    };
  }

  private async calculateBlockHash(header): Promise<string> {
    let headerAsn = asn.define("headerAsn", function() {
      this.seq().obj(
        this.key("Number").int(),
        this.key("PreviousHash").octstr(),
        this.key("DataHash").octstr(),
      );
    });

    let output = headerAsn.encode(
      {
        Number: parseInt(header.number),
        PreviousHash: Buffer.from(header.previous_hash, "hex"),
        DataHash: Buffer.from(header.data_hash, "hex"),
      },
      "der",
    );

    return crypto
      .createHash("sha256")
      .update(output)
      .digest("hex");
  }
}
