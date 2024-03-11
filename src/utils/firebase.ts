import {initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";
import {getStorage} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCNDH_My6IOZ22h_avuWB__xCm_3uYdZdE",
  authDomain: "broadcast-2791a.firebaseapp.com",
  projectId: "broadcast-2791a",
  storageBucket: "broadcast-2791a.appspot.com",
  messagingSenderId: "543696596627",
  appId: "1:543696596627:web:e7503cf21052669998a766",
};

const app = initializeApp(firebaseConfig);
const authService = getAuth(app);
const dbService = getFirestore(app);
const storageService = getStorage(app);
export {app, authService, dbService, storageService};
