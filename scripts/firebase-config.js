
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

// Configuração do novo projeto Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD2CyvOitmjEeWDMyBFQdoXQlxmPVqgF64",
  authDomain: "basquete-home.firebaseapp.com",
  projectId: "basquete-home",
  storageBucket: "basquete-home.firebasestorage.app",
  messagingSenderId: "498774634344",
  appId: "1:498774634344:web:a6b2b6eb130a1135e170dd",
  measurementId: "G-VZGTF0VM5J"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Serviços que serão usados pelo portal
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
