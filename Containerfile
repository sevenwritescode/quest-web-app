# Production image. Stage 1 builds the client and server; stage 2 keeps only what runs.
FROM docker.io/library/node:22 AS build
WORKDIR /app
COPY client/package.json client/package-lock.json client/
COPY server/package.json server/package-lock.json server/
RUN cd client && npm ci --no-audit --no-fund \
 && cd ../server && npm ci --no-audit --no-fund
COPY client client
COPY server server
RUN cd client && npm run build \
 && cd ../server && npm run build \
 && npm prune --omit=dev

FROM docker.io/library/node:22-slim
ENV NODE_ENV=production PORT=4000 GAME_RECORDS_PATH=/data/game-records.json
WORKDIR /app/server
COPY --from=build /app/client/dist /app/client/dist
COPY --from=build /app/server/package.json ./
COPY --from=build /app/server/node_modules node_modules
COPY --from=build /app/server/dist dist
# game records live in the /data volume; a fresh volume takes this directory's owner
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 4000
CMD ["node", "--enable-source-maps", "dist/index.js"]
