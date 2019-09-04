#!/bin/sh
cd ..

VERSION=$(cat package.json | awk '/"version": "/ {print $2}' | sed -r "s/\"|,//g")
ARCHIVE_PATH="dist/tendering.bna"
NETWORK_NAME="tendering"
ADMIN_CARD="admin@tendering.card"

set -e # Stop script on error

echo "Creating archive..."
composer archive create -a $ARCHIVE_PATH --sourceType dir --sourceName .