import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATqyRBaoANzWo8zVuEWKWzcTmNRM5aQEs",
  authDomain: "clutch-pronos.firebaseapp.com",
  projectId: "clutch-pronos",
  storageBucket: "clutch-pronos.firebasestorage.app",
  messagingSenderId: "479511505441",
  appId: "1:479511505441:web:9d45bac6eabeb499479160",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
