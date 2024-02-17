import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBA_B63KxclkGmnMprI2PDL2SwYITyI4bA",
  authDomain: "chat-r-2cb3a.firebaseapp.com",
  projectId: "chat-r-2cb3a",
  storageBucket: "chat-r-2cb3a.appspot.com",
  messagingSenderId: "1060208724430",
  appId: "1:1060208724430:web:c54e1e219ec875c6a7839f",
};

const app = initializeApp(firebaseConfig);
const authService = getAuth(app);
const dbService = getFirestore(app);
const storageService = getStorage(app);
export {app, authService, dbService, storageService};
