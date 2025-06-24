importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);
importScripts("swEnv.js");
console.log(swEnv);

firebase.initializeApp({
  apiKey: swEnv.NEXT_PUBLIC_apiKey,
  projectId: swEnv.NEXT_PUBLIC_projectId,
  messagingSenderId: swEnv.NEXT_PUBLIC_messagingSenderId,
  storageBucket: swEnv.NEXT_PUBLIC_storageBucket,
  appId: swEnv.NEXT_PUBLIC_appId,
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  if (Notification.permission === "granted") {
    if (navigator.serviceWorker)
      navigator.serviceWorker.getRegistration().then(async function (reg) {
        if (reg)
          await reg.showNotification(payload.notification.title, {
            body: payload.notification.body,
          });
      });
  }
});
