// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDk26Xlvmst2C4JyZeY0S1DrLzpKXTnJFo",
  authDomain: "nyaayavaani.firebaseapp.com",
  projectId: "nyaayavaani",
  storageBucket: "nyaayavaani.firebasestorage.app",
  messagingSenderId: "279837026348",
  appId: "1:279837026348:web:41e1e17fada70b10fe4989",
  measurementId: "G-0VSJ2RBSJF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// const analytics = getAnalytics(app);