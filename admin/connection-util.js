// const cardStore = require("composer-common").FileSystemCardStore;
const BusinessNetworkConnection = require("composer-client")
  .BusinessNetworkConnection;
const AdminConnection = require("composer-admin").AdminConnection;

const cardType = { type: "composer-wallet-filesystem" };

const cardName = "admin@tendering";

async function connect() {
  const connection = new BusinessNetworkConnection(cardType);

  await connection.connect(cardName);

  return connection;
}

async function connectAsAdmin() {
  const adminConnection = new AdminConnection(cardType);

  await adminConnection.connect(cardName);

  return adminConnection;
}

async function ping(connection) {
  return await connection.ping();
}

async function disconnect(connection) {
  await connection.disconnect();
}

module.exports = {
  connect,
  connectAsAdmin,
  ping,
  disconnect
};
