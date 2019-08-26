#!/bin/sh
set -e # Stop script on error

cd ..

# Getting archive version
VERSION=$(cat package.json | awk '/"version": "/ {print $2}' | sed -r "s/\"|,//g")
ARCHIVE_PATH="dist/tendering.bna"
NETWORK_NAME="tendering"
ADMIN_CARD="admin@tendering.card"

echo "Creating archive..."
composer archive create -a $ARCHIVE_PATH --sourceType dir --sourceName .

echo "Installing archive on Fabric..."
composer network install --card PeerAdmin@hlfv1 --archiveFile $ARCHIVE_PATH

echo "Upgrade network..."
composer network upgrade -c PeerAdmin@hlfv1 -n $NETWORK_NAME -V $VERSION
