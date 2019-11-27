# blockchain-tendering

A blockchain based tendering system.

Submitted as a 4th year project to [Strathmore University](https://www.strathmore.edu/).

Built using [Hyperledger](https://www.hyperledger.org/)([Composer](https://www.hyperledger.org/projects/composer)).

## Installation

1. Ensure you have installed the [pre-requisites](https://hyperledger.github.io/composer/latest/installing/installing-prereqs.html) and [development environment](https://hyperledger.github.io/composer/latest/installing/development-tools.html) for Hyperledger composer.

2. Clone this repository

```
git clone https://github.com/MarkNjunge/blockchain-tendering-backend.git && cd blockchain-tendering-backend
```

3. Generate and install the business network archive.

```
yarn composer:deploy
```

4. Create a PostgeSQL database (used for sessions)

5. Create a copy of the config file

```
cp ./api/config/default.json cp ./api/config/local.json
```

**Note:** change the `dbUrl` value to your connection.

6. Start the rest server

```
yarn api:start
```

## Scripts

The following scripts are run at the top level folder.

### admin

#### admin:clean-docker

Removes docker containers and images for the project.

Use `yarn admin:clean-docker all` to remove all, omit to remove all non-latest.

#### admin:create-participant

Creates a participant, as well as an identity and a card to be used for authentication.

#### admin:inspect-blocks

Logs the details of the blocks on the blockchain.

#### admin:clean-cards

Delete all card for the `tendering` network.

### api

#### api:start

Start a REST server.

#### api:start:dev

Start a REST server in dev mode.
**Doesn't work because of Composer**

### composer

#### composer:deploy

Creates and deploys an **initial** archive onto Fabric.

Don't use this is you already have a network deployed.

#### composer:upgrade:patch

Bumps the patch level npm version, creates a new archive and installs it on Fabric.

#### composer:start:rest

Starts the default `composer-rest-server` using the admin card.

#### composer:start

Start the network when it's stopped.
