# blockchain-tendering

A blockchain based tendering system.

Submitted as a 4th year project to [Strathmore University](https://www.strathmore.edu/).

Built using [Hyperledger](https://www.hyperledger.org/)([Composer](https://www.hyperledger.org/projects/composer)).

## Installation

1. Ensure you have installed the [pre-requisites](https://hyperledger.github.io/composer/latest/installing/installing-prereqs.html) and [development environment](https://hyperledger.github.io/composer/latest/installing/development-tools.html) for Hyperledger composer.

2. Clone this repository

```
git clone https://github.com/MarkNjunge/blockchain-tendering-backedn.git
```

3. Generate and install the business network archive.

```
yarn composer:deploy
```

4. Start default rest server

```
yarn composer:start:rest
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

### api

#### api:start:dev

Start a REST server in dev mode.

### composer

#### composer:deploy

Creates and deploys an **initial** archive onto Fabric.

Don't use this is you already have a network deployed.

#### composer:upgrade:patch

Bumps the patch level npm version, creates a new archive and installs it on Fabric.

#### composer:start:rest

Starts the default `composer-rest-server` using the admin card.
