/**
 * Push Notifications Generator
 * 
 * Generate push notification integration for web, iOS,
 * Android using Firebase, OneSignal, and Expo.
 */

import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationProvider = 'firebase' | 'onesignal' | 'expo' | 'web-push';

// ============================================================================
// PUSH NOTIFICATIONS GENERATOR
// ============================================================================

export class PushNotificationsGenerator extends EventEmitter {
    private static instance: PushNotificationsGenerator;

    private constructor() {
        super();
    }

    static getInstance(): PushNotificationsGenerator {
        if (!PushNotificationsGenerator.instance) {
            PushNotificationsGenerator.instance = new PushNotificationsGenerator();
        }
        return PushNotificationsGenerator.instance;
    }

    // ========================================================================
    // FIREBASE CLOUD MESSAGING
    // ========================================================================

    generateFirebaseFCM(): string {
        return `// Server-side FCM
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, '\\n'),
    }),
  });
}

export const fcm = {
  // Send to single device
  async sendToDevice(token: string, notification: {
    title: string;
    body: string;
    image?: string;
    data?: Record<string, string>;
  }) {
    return admin.messaging().send({
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.image,
      },
      data: notification.data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    });
  },

  // Send to multiple devices
  async sendToDevices(tokens: string[], notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    return admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    });
  },

  // Send to topic
  async sendToTopic(topic: string, notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    return admin.messaging().send({
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    });
  },

  // Subscribe to topic
  async subscribeToTopic(tokens: string[], topic: string) {
    return admin.messaging().subscribeToTopic(tokens, topic);
  },

  // Unsubscribe from topic
  async unsubscribeFromTopic(tokens: string[], topic: string) {
    return admin.messaging().unsubscribeFromTopic(tokens, topic);
  },
};

// Client-side (React/Next.js)
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (error) {
    console.error('Notification permission error:', error);
    return null;
  }
}

export function onNotificationReceived(callback: (payload: any) => void) {
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}

// React hook
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [token, setToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    const newToken = await requestNotificationPermission();
    setToken(newToken);
    setPermission(Notification.permission);
    return newToken;
  };

  return { token, permission, requestPermission };
}
`;
    }

    // ========================================================================
    // ONESIGNAL
    // ========================================================================

    generateOneSignal(): string {
        return `// Server-side OneSignal
import OneSignal from '@onesignal/node-onesignal';

const configuration = OneSignal.createConfiguration({
  userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
});

const client = new OneSignal.DefaultApi(configuration);
const appId = process.env.ONESIGNAL_APP_ID!;

export const oneSignal = {
  // Send to specific users
  async sendToUsers(userIds: string[], notification: {
    title: string;
    message: string;
    url?: string;
    data?: Record<string, any>;
  }) {
    const notificationBody = new OneSignal.Notification();
    notificationBody.app_id = appId;
    notificationBody.include_external_user_ids = userIds;
    notificationBody.headings = { en: notification.title };
    notificationBody.contents = { en: notification.message };
    if (notification.url) notificationBody.url = notification.url;
    if (notification.data) notificationBody.data = notification.data;

    return client.createNotification(notificationBody);
  },

  // Send to all
  async sendToAll(notification: {
    title: string;
    message: string;
    url?: string;
  }) {
    const notificationBody = new OneSignal.Notification();
    notificationBody.app_id = appId;
    notificationBody.included_segments = ['All'];
    notificationBody.headings = { en: notification.title };
    notificationBody.contents = { en: notification.message };
    if (notification.url) notificationBody.url = notification.url;

    return client.createNotification(notificationBody);
  },

  // Send to segment
  async sendToSegment(segments: string[], notification: {
    title: string;
    message: string;
  }) {
    const notificationBody = new OneSignal.Notification();
    notificationBody.app_id = appId;
    notificationBody.included_segments = segments;
    notificationBody.headings = { en: notification.title };
    notificationBody.contents = { en: notification.message };

    return client.createNotification(notificationBody);
  },
};

// Client-side React
// Add to index.html:
// <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>

declare global {
  interface Window {
    OneSignalDeferred: any[];
  }
}

export function initOneSignal() {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
    });
  });
}

export async function setExternalUserId(userId: string) {
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.login(userId);
  });
}
`;
    }

    // ========================================================================
    // EXPO NOTIFICATIONS
    // ========================================================================

    generateExpoNotifications(): string {
        return `// Server-side Expo Push
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export const expoPush = {
  // Send notifications
  async send(pushTokens: string[], notification: {
    title: string;
    body: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: 'default' | null;
  }) {
    const messages: ExpoPushMessage[] = pushTokens
      .filter(token => Expo.isExpoPushToken(token))
      .map(token => ({
        to: token,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge,
        sound: notification.sound || 'default',
      }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Expo push error:', error);
      }
    }

    return tickets;
  },

  // Check receipts
  async checkReceipts(ticketIds: string[]) {
    const receiptIdChunks = expo.chunkPushNotificationReceiptIds(ticketIds);
    const receipts = [];

    for (const chunk of receiptIdChunks) {
      try {
        const receiptChunk = await expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);
      } catch (error) {
        console.error('Receipt check error:', error);
      }
    }

    return receipts;
  },
};

// React Native / Expo client
/*
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id',
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token.data;
}

export function useNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string>();
  const [notification, setNotification] = useState<Notifications.Notification>();

  useEffect(() => {
    registerForPushNotifications().then(token => {
      if (token) setExpoPushToken(token);
    });

    const notificationListener = Notifications.addNotificationReceivedListener(
      notification => setNotification(notification)
    );

    const responseListener = Notifications.addNotificationResponseReceivedListener(
      response => console.log(response)
    );

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return { expoPushToken, notification };
}
*/
`;
    }

    // ========================================================================
    // WEB PUSH
    // ========================================================================

    generateWebPush(): string {
        return `import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const webPushService = {
  // Send notification
  async send(subscription: PushSubscription, notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: Record<string, any>;
  }) {
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/badge.png',
      data: {
        url: notification.url || '/',
        ...notification.data,
      },
    });

    return webpush.sendNotification(subscription, payload);
  },

  // Send to multiple
  async sendToMultiple(subscriptions: PushSubscription[], notification: {
    title: string;
    body: string;
  }) {
    return Promise.allSettled(
      subscriptions.map(sub => this.send(sub, notification))
    );
  },
};

// Generate VAPID keys (run once)
// const vapidKeys = webpush.generateVAPIDKeys();
// console.log('Public:', vapidKeys.publicKey);
// console.log('Private:', vapidKeys.privateKey);

// Service Worker (public/sw.js)
/*
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
*/

// Client-side subscription
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });

  return subscription.toJSON() as PushSubscription;
}
`;
    }

    generateEnvTemplate(provider: NotificationProvider): string {
        switch (provider) {
            case 'firebase':
                return `FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=`;
            case 'onesignal':
                return `ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=
ONESIGNAL_USER_AUTH_KEY=`;
            case 'web-push':
                return `VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=`;
            default:
                return '';
        }
    }
}

export const pushNotificationsGenerator = PushNotificationsGenerator.getInstance();
