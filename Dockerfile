FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src/ src/
COPY public/ public/
COPY server.js ./

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app .
ENV PORT=8080
EXPOSE 8080
USER node
CMD ["node", "server.js"]
