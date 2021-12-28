#!/bin/bash

__dirname=$(dirname "$0")
rootDir="${__dirname}/.."
bin="${rootDir}/node_modules/.bin"

PS4='\033[0;32m > \033[0m'
set -o xtrace -e

"$bin/prisma" generate
"${rootDir}/scripts/fix-prisma"

"$bin/tsc" --project "$rootDir" --outDir "${rootDir}/build/lib" --incremental false --tsBuildInfoFile null

cp -rv \
    "${rootDir}/package.json" \
    "${rootDir}/index.js" \
    "${rootDir}/.env.gpg" \
    "${rootDir}/pnpm-lock.yaml" \
    "${rootDir}/static" \
    "${rootDir}/build"

if [ -f "${rootDir}/.env" ]; then
    cp -v "${rootDir}/.env" "${rootDir}/build"
fi

cp -rf "${rootDir}/.prisma" "${rootDir}/build/.prisma"

cp -v "${rootDir}/.prisma/runtime/index.js" "${rootDir}/build/.prisma/runtime"
