# Task Rooms (Next.js)

Frontend for a real-time team task board: create a room, invite teammates with a code, drag tasks
across columns, chat, and receive push notifications.

Backend: [be_task_nestjs](https://github.com/thongkhoav/be_task_nestjs) (NestJS, PostgreSQL, Redis).

## Features

- **Auth**: sign up, log in, forgot/reset password; JWT kept in cookies.
- **Rooms**: the creator becomes the owner and invites members with a room invite code.
- **Task board**: drag-and-drop columns (react-dnd); owners create and assign tasks, members update
  only their own.
- **Real time**: task changes and room chat arrive instantly over Socket.io.
- **Push notifications**: Firebase Cloud Messaging through a service worker, plus an in-app
  notifications page.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui (Radix) + HeroUI ·
React Hook Form + Zod · Axios · Socket.io client · Firebase · Docker

## Run locally

Start the [backend](https://github.com/thongkhoav/be_task_nestjs) first, then:

```bash
cp .env.example .env    # API URL and Firebase web config
npm install
npm run dev             # http://localhost:3000 (set PORT to change)
```

`src/swEnvBuild.js` writes the Firebase config to `public/swEnv.js` for the messaging service
worker. Allow notifications in the browser to test push.

## Deployment

The app ships as a Docker image and ran on EC2 next to the backend:

```bash
docker run -d --env-file .env -p 80:3000 --network mynetwork --name frontend <image>
```
