import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDRRhniUXFF0HA3V69It0FtvTkLZK2pD1s",
  authDomain: "pomodoroapp-a8882.firebaseapp.com",
  projectId: "pomodoroapp-a8882",
  storageBucket: "pomodoroapp-a8882.firebasestorage.app",
  messagingSenderId: "833313253179",
  appId: "1:833313253179:web:6a13fe67657ed4049ff91e"
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Auth'u normal şekilde başlat (React Native'de otomatik olarak AsyncStorage kullanır)
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
