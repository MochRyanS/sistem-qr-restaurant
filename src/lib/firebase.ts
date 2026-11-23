import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
    if (getApps().length > 0) return getApps()[0];

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
        throw new Error(
            "Firebase credentials tidak lengkap. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, " +
            "dan FIREBASE_PRIVATE_KEY di environment variables.",
        );
    }

    return initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
    });
}

export const firestore = getFirestore(initFirebase());