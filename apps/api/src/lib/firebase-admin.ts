import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

let app: App | null = null;

export function getFirebaseAdminApp(): App {
    if (!app) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Firebase Admin credentials are not configured.");
        }

        if (getApps().length === 0) {
            app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } else {
            app = getApps()[0]!;
        }
    }

    return app;
}

export function tryGetFirebaseAdminApp(): App | null {
    try {
        return getFirebaseAdminApp();
    } catch (error) {
        console.warn("[FIREBASE_ADMIN_UNAVAILABLE]", error);
        return null;
    }
}

export function tryGetFirebaseMessaging() {
    const firebaseApp = tryGetFirebaseAdminApp();
    if (!firebaseApp) return null;
    return getMessaging(firebaseApp);
}
