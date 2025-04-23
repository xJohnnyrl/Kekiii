FROM oven/bun:latest AS base
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS prerelease
COPY --from=install /usr/src/app/node_modules ./node_modules
COPY . .

CMD ["bun", "run", "bot.ts"]
