# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG NEXT_PUBLIC_SERVER_HOST
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_DOMAIN
ARG NEXT_PUBLIC_VAPID_KEY
ARG LOCAL_STORAGE_FCM_KEY

ENV NEXT_PUBLIC_SERVER_HOST=$NEXT_PUBLIC_SERVER_HOST
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_DOMAIN=$NEXT_PUBLIC_DOMAIN
ENV NEXT_PUBLIC_VAPID_KEY=$NEXT_PUBLIC_VAPID_KEY
ENV LOCAL_STORAGE_FCM_KEY=$LOCAL_STORAGE_FCM_KEY

RUN npm run build   # produces .next/

# Stage 2: Run
FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/package*.json ./
RUN npm install --production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./next.config.mjs

ENV PORT=3000
EXPOSE ${PORT}
CMD ["npm", "start"]
