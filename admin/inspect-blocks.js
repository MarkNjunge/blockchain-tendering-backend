const ora = require("ora");
const prompts = require("prompts");
const { BusinessNetworkConnection } = require("composer-client");
const fs = require("fs");
const asn = require("asn1.js");
const crypto = require("crypto");

if (!fs.existsSync("output")) {
  fs.mkdirSync("output", {});
}

async function run() {
  try {
    // Connect to network
    const spinner = ora("Connecting to business network").start();
    const connection = new BusinessNetworkConnection();
    await connection.connect("admin@tendering");
    spinner.succeed("Connected to network");

    const questions = [
      {
        type: "select",
        name: "mode",
        message: "Which mode?",
        choices: [
          { title: "All Blocks", value: "ALL" },
          { title: "By number", value: "NUM" }
        ]
      }
    ];

    const response = await prompts(questions);
    if (!response.mode) {
      process.exit(0);
    }

    // Create transaction to create new participant
    switch (response.mode) {
    case "ALL":
      await getBlocksProgressively(connection);
      break;
    case "NUM":
      await getBlockByNumber(connection);
      break;
    }
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
}

run();

async function getBlockByNumber(connection) {
  // Get blocknumber
  const response = await prompts({
    type: "number",
    name: "number",
    message: "Block number?"
  });

  // Skip block number
  if (!response.number) {
    process.exit(0);
  }

  const BLOCK_NUMBER = parseInt(response.number);
  console.log(`Querying block ${BLOCK_NUMBER}`);

  // Get output files
  const fullBlockFilename = `./output/block_${BLOCK_NUMBER}_full.json`;
  const decodedBlockFilename = `./output/block_${BLOCK_NUMBER}_decoded.json`;

  // Native API provided through the Fabric SDK, allows much more low-level operations than Composer.
  const nativeApi = connection.getNativeAPI();

  // Connect to the channel where the transactions are happening, the default is "composerchannel".
  const channel = nativeApi.getChannel("composerchannel");

  // Get a block by it's number
  const block = await channel.queryBlock(BLOCK_NUMBER);
  fs.writeFileSync(fullBlockFilename, JSON.stringify(block, null, " "));
  console.log(`Full block info written to ${fullBlockFilename}`);

  // Decode for usefull information
  const decoded = decodeBlock(block);
  fs.writeFileSync(decodedBlockFilename, JSON.stringify(decoded, null, " "));
  console.log(`Decoded block info written to ${decodedBlockFilename}`);

  console.log(
    `\nBlock data: ${JSON.stringify(decoded.data.payload.data.results)}\n`
  );

  await connection.disconnect();
}

async function getBlocksProgressively(connection) {
  // Native API provided through the Fabric SDK, allows much more low-level operations than Composer.
  const nativeApi = connection.getNativeAPI();

  // Connect to the channel where the transactions are happening, the default is "composerchannel".
  const channel = nativeApi.getChannel("composerchannel");

  const currentBlockInfo = await channel.queryInfo();
  const currentBlock = await channel.queryBlockByHash(
    currentBlockInfo.currentBlockHash
  );

  const fullBlockState = [];

  console.log("\n--------------------------------------------\n");
  fullBlockState.push("\n--------------------------------------------\n");

  // Get current block number
  console.log(`Current block number: ${currentBlock.header.number}`);
  fullBlockState.push(`Current block number:\n\t${currentBlock.header.number}`);

  // Get current block hash
  console.log(
    `Current block hash:${currentBlockInfo.currentBlockHash.toString("hex")}`
  );
  fullBlockState.push(
    `Current block hash:\n\t${currentBlockInfo.currentBlockHash.toString(
      "hex"
    )}`
  );

  // Get preceding block hash
  console.log(
    `Preceding block hash: ${currentBlockInfo.previousBlockHash.toString(
      "hex"
    )}`
  );
  fullBlockState.push(
    `Preceding block hash:\n\t${currentBlockInfo.previousBlockHash.toString(
      "hex"
    )}`
  );

  // Get preceding block data
  const currentBlockDecoded = decodeBlock(currentBlock);
  fullBlockState.push(
    `Block data:\n\t${JSON.stringify(
      currentBlockDecoded.data.payload.data.results
    )}`
  );

  var precedingBlockNumber = parseInt(currentBlock.header.number) - 1;
  while (precedingBlockNumber > 0) {
    console.log("\n--------------------------------------------\n");
    fullBlockState.push("\n--------------------------------------------\n");

    // Get current block number
    const block = await channel.queryBlock(precedingBlockNumber);
    console.log(`Current Block number: ${block.header.number}`);
    fullBlockState.push(`Current Block number:\n\t${block.header.number}`);

    // Get current block hash
    const blockHash = calculateBlockHash(block.header);
    console.log(`Current Block hash: ${blockHash}`);
    fullBlockState.push(`Current Block hash:\n\t${blockHash}`);

    // Get preceding block hash
    console.log(`Preceding block hash: ${block.header.previous_hash}`);
    fullBlockState.push(
      `Preceding block hash:\n\t${block.header.previous_hash}`
    );

    // Get block data
    const blockDecoded = decodeBlock(block);
    fullBlockState.push(
      `Block data:\n\t${JSON.stringify(blockDecoded.data.payload.data.results)}`
    );

    precedingBlockNumber -= 1;
  }

  fs.writeFileSync("./output/fullstate.txt", fullBlockState.join("\n"));
  console.log("\nWritten full blockchain state to ./output/fullstate.txt");

  process.exit(0);
}

function decodeBlock(block) {
  // https://fabric-sdk-node.github.io/global.html#Block
  return {
    blockNumber: block.header.number,
    blockHash: block.header.data_hash.toString("base64"),
    previousBlockHash: block.header.previous_hash.toString("base64"),
    data: {
      // signature: block.data.data[0].signature.toString("base64"),
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
            tx_id: block.data.data[0].payload.header.channel_header.tx_id
          },
          signatureHeader: {
            creator: {
              Mspid:
                block.data.data[0].payload.header.signature_header.creator
                  .Mspid,
              idBytes:
                block.data.data[0].payload.header.signature_header.creator
                  .IdBytes
            }
          }
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
                  value: write.value ? JSON.parse(write.value) : ""
                }))
              }))
          }
          // ...block.data.data[0].payload.data.actions[0].payload.action
          //   .proposal_response_payload.extension
        }
      }
    }
  };
}

function calculateBlockHash(header) {
  let headerAsn = asn.define("headerAsn", function() {
    this.seq().obj(
      this.key("Number").int(),
      this.key("PreviousHash").octstr(),
      this.key("DataHash").octstr()
    );
  });

  let output = headerAsn.encode(
    {
      Number: parseInt(header.number),
      PreviousHash: Buffer.from(header.previous_hash, "hex"),
      DataHash: Buffer.from(header.data_hash, "hex")
    },
    "der"
  );

  let hash = crypto
    .createHash("sha256")
    .update(output)
    .digest("hex");
  return hash;
}
