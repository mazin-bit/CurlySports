import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyB5J6Bf69DhTxEf24Uig56flzlar1jPGmo",
    authDomain: "mazinshub.firebaseapp.com",
    projectId: "mazinshub",
    storageBucket: "mazinshub.firebasestorage.app",
    messagingSenderId: "106744881892",
    appId: "1:106744881892:web:c7aaf209ae8a56db1642f1",
    measurementId: "G-5MB2PZXBLM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
    const snap = await getDoc(doc(db, "config", "app"));
    if (snap.exists()) {
        console.log("enabledSports:", snap.data().enabledSports);
    } else {
        console.log("No config doc");
    }
    process.exit(0);
}
check();
