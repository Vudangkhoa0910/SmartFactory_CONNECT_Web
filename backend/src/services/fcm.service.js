/**
 * FCM Push Notification Service
 * Handles sending push notifications via Firebase Cloud Messaging
 */

let admin = null;
let initialized = false;

/**
 * Initialize Firebase Admin SDK
 * Requires firebase-service-account.json in backend root
 */
const initializeFirebaseAdmin = () => {
    if (initialized) return true;

    try {
        admin = require('firebase-admin');
        const path = require('path');
        const fs = require('fs');

        const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

        if (!fs.existsSync(serviceAccountPath)) {
            console.warn('FCM: firebase-service-account.json not found. Push notifications disabled.');
            console.warn('FCM: Download from Firebase Console > Project Settings > Service accounts');
            return false;
        }

        const serviceAccount = require(serviceAccountPath);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }

        initialized = true;
        console.log('FCM: Firebase Admin initialized successfully');
        return true;
    } catch (error) {
        console.error('FCM: Failed to initialize Firebase Admin -', error.message);
        return false;
    }
};

// Try to initialize on module load
initializeFirebaseAdmin();

/**
 * Send push notification to a single device
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendToDevice = async (token, title, body, data = {}) => {
    if (!initialized || !admin) {
        console.warn('FCM: Firebase Admin not initialized. Skipping push.');
        return { success: false, error: 'Firebase Admin not initialized' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            token,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'high_importance_channel',
                    clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                },
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                        badge: 1,
                        contentAvailable: true,
                    },
                },
            },
        };

        const response = await admin.messaging().send(message);
        console.log('FCM: Notification sent successfully -', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('FCM: Error sending notification -', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} tokens - Array of FCM device tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendToMultipleDevices = async (tokens, title, body, data = {}) => {
    if (!initialized || !admin) {
        console.warn('FCM: Firebase Admin not initialized. Skipping push.');
        return { success: false, error: 'Firebase Admin not initialized' };
    }

    if (!tokens || tokens.length === 0) {
        return { success: false, error: 'No tokens provided' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            tokens,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'high_importance_channel',
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
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`FCM: Sent to ${response.successCount}/${tokens.length} devices`);

        return {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses,
        };
    } catch (error) {
        console.error('FCM: Error sending to multiple devices -', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to a topic
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
const sendToTopic = async (topic, title, body, data = {}) => {
    if (!initialized || !admin) {
        console.warn('FCM: Firebase Admin not initialized. Skipping push.');
        return { success: false, error: 'Firebase Admin not initialized' };
    }

    try {
        const message = {
            notification: {
                title,
                body,
            },
            data: Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
            ),
            topic,
            android: {
                priority: 'high',
                notification: {
                    sound: 'default',
                    channelId: 'high_importance_channel',
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
        };

        const response = await admin.messaging().send(message);
        console.log('FCM: Topic notification sent -', response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error('FCM: Error sending to topic -', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Check if FCM is available
 */
const isAvailable = () => initialized;

module.exports = {
    sendToDevice,
    sendToMultipleDevices,
    sendToTopic,
    isAvailable,
    initializeFirebaseAdmin,
};
