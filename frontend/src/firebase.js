import { initializeApp } from 'firebase/app';
import { getAuth,signOut, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
    apiKey: "AIzaSyCFL6wEkojPogfUeTnV7tO8sOHm2YVRN0M",
    authDomain: "freelance-ffb69.firebaseapp.com",
    projectId: "freelance-ffb69",
    storageBucket: "freelance-ffb69.appspot.com",
    messagingSenderId: "7882012228",
    appId: "1:7882012228:web:bd9b87fbccbc0ec6f2ae11",  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
// Initialize Firebase Authentication and set up providers
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = () => {
    return signInWithPopup(auth, provider);
  };
  
  const logout = () => {
    return signOut(auth);
  };

export { app, auth,logout, googleProvider,db,storage,signOut, signInWithPopup, signInWithEmailAndPassword, onAuthStateChanged,signInWithGoogle };
