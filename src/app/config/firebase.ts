// Import the functions you need from the SDKs you need
import * as firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import {
  deleteToken,
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import { ToastInfo } from "../common/util/toast";
import { toast } from "react-toastify";
import { NotificationContent } from "./noti-toast-element";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_apiKey,
  authDomain: process.env.NEXT_PUBLIC_authDomain,
  projectId: process.env.NEXT_PUBLIC_projectId,
  storageBucket: process.env.NEXT_PUBLIC_storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_messagingSenderId,
  appId: process.env.NEXT_PUBLIC_appId,
};

const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;

// Initialize Firebase

const LocalStorageFcmKey =
  process.env.LOCAL_STORAGE_FCM_KEY || "task_app_fcm_token";

export const firebaseCloudMessaging = {
  tokenInlocalStorage: async () => {
    return localStorage.getItem(LocalStorageFcmKey);
  }, //initializing firebase app
  init: async function () {
    if (!firebase.getApps().length) {
      firebase.initializeApp(firebaseConfig);
    }

    try {
      const tokenInLocalStorage = await this.tokenInlocalStorage();
      //if FCM token is already there just return the token
      if (tokenInLocalStorage !== null) {
        return tokenInLocalStorage;
      }
      //requesting notification permission from browser
      const status = await Notification.requestPermission();
      if (status && status === "granted") {
        const messaging = getMessaging();
        //getting token from FCM
        const fcm_token = await getToken(messaging, {
          vapidKey: vapidKey,
        });
        if (fcm_token) {
          //setting FCM token in indexed db using localforage
          localStorage.setItem(LocalStorageFcmKey, fcm_token);
          //return the FCM token after saving it
          return fcm_token;
        } else {
          return null;
        }
      } else {
        console.error("Notification permission denied");
        return null;
      }
    } catch {
      console.error("Failed to initialize Firebase messaging");
      return null;
    }
  },

  deleteToken: async function () {
    try {
      const messaging = getMessaging();
      const currentToken = await this.tokenInlocalStorage();

      if (currentToken) {
        await deleteToken(messaging);
        localStorage.removeItem(LocalStorageFcmKey);
      }
    } catch {
      console.error("Failed to delete the Firebase messaging token");
    }
  },
};
