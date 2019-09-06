#!/bin/sh
cd ..

VERSION=$(cat package.json | awk '/"version": "/ {print $2}' | sed -r "s/\"|,//g")
ARCHIVE_PATH="dist/tendering.bna"
NETWORK_NAME="tendering"
ADMIN_CARD="admin@tendering.card"

set -e # Stop script on error

echo "Creating archive..."
composer archive create -a $ARCHIVE_PATH --sourceType dir --sourceName .

echo "Installing archive on Fabric..."
composer network install --card PeerAdmin@hlfv1 --archiveFile $ARCHIVE_PATH

echo "Starting business network..."
composer network start --networkName $NETWORK_NAME --networkVersion $VERSION --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file $ADMIN_CARD

echo "Importing card..."
composer card import --file $ADMIN_CARD

echo "Pinging..."
composer network ping --card admin@$NETWORK_NAME

echo "Moving admin card to 'cards' directory..."
mv ./admin@tendering.card ../cards/admin@tendering.card
