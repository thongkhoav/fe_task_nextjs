### Task manament FE using NextJS

### Backend source code: https://github.com/thongkhoav/be_task_nestjs

- To run dev: npm run dev
- File to add before run the app:
  - Complete .env including firebase messenging
  - public/firebase-messaging-sw.js
  - Install packages
- To test notifications, please Allow Notification feature on the browser
- File src/swEnvBuild.js to create file swEnv.js with env to public folder
- Docker run: docker run -d --env-file /home/ec2-user/frontend/.env -p 80:3000 --network mynetwork --name frontend thongkhoav/fe-task-amd64:v1
- Copy source to server: scp -i keypem.pem -r ~/project-path ec2-user@4{IP}:/home/ec2-user/frontend

## 🚀 Features

### ✅ Core Features

- **User Authentication** (login/signup)
- **Room Creation**: A user can create a room and becomes the owner
- **Room Management**:
  - Owners can invite members using a **room invite code**
  - Owners can add, assign, and update tasks
- **Task Assignment**:
  - Owners assign tasks to members
  - Members can only update tasks assigned to them
- **Real-time Updates**:

  - Tasks update instantly for everyone in the room via **WebSockets**
