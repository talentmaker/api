#!/bin/sh

__dirname=$(dirname "$0")
rootDir="${__dirname}/.."
bin="${rootDir}/node_modules/.bin"
prismaEngine="rhel-openssl-1.0.x"

PS4='\033[0;32m > \033[0m'
set -o xtrace -e

"$bin/tsc" --project "$rootDir" --outDir "${rootDir}/build/lib" --incremental false --tsBuildInfoFile null

"$bin/prisma" generate

cp -rv \
    "${rootDir}/package.json" \
    "${rootDir}/serverless.yml" \
    "${rootDir}/index.js" \
    "${rootDir}/.env.gpg" \
    "${rootDir}/yarn.lock" \
    "${rootDir}/static" \
    "${rootDir}/build"

if [ -f "${rootDir}/.env" ]; then
    cp -v "${rootDir}/.env" "${rootDir}/build"
fi

mkdir -pv "${rootDir}/build/.prisma/runtime"

cp -v \
    "${rootDir}/.prisma/libquery_engine-${prismaEngine}.so.node" \
    "${rootDir}/.prisma/index.js" \
    "${rootDir}/.prisma/schema.prisma" \
    "${rootDir}/build/.prisma"

cp -v "${rootDir}/.prisma/runtime/index.js" "${rootDir}/build/.prisma/runtime"
