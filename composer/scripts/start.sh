#!/bin/sh
cd ..

VERSION=$(cat package.json | awk '/"version": "/ {print $2}' | sed -r "s/\"|,//g")
NETWORK_NAME="tendering"
ADMIN_CARD="admin@tendering.card"

set -e # Stop script on error

echo "Starting business network..."
composer network start --networkName $NETWORK_NAME --networkVersion $VERSION --networkAdmin admin --networkAdminEnrollSecret adminpw --card PeerAdmin@hlfv1 --file $ADMIN_CARD

echo "Pinging..."
composer network ping --card admin@$NETWORK_NAME
