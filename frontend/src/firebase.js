import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCGsQAfcUv5iAzjO7lVg5vtI2G_GKc4EwE",
  authDomain: "jobfusion-61604.firebaseapp.com",
  projectId: "jobfusion-61604",
  storageBucket: "jobfusion-61604.firebasestorage.app",
  messagingSenderId: "471673392631",
  appId: "1:471673392631:web:8510b71fc855412b3d32f2",
  measurementId: "G-ECHE9E7YPW"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
