const firebaseConfig = {
    apiKey: "AIzaSyB3C1itU57Kzd_dJcD8cYMnXe4wmQu1WqI",
    authDomain: "red-social-87777.firebaseapp.com",
    projectId: "red-social-87777",
    storageBucket: "red-social-87777.firebasestorage.app",
    messagingSenderId: "867305218275",
    appId: "1:867305218275:web:cc527201c045fd2fbea5d6"
};

// Inicialización de Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Referencias a autenticación y firestore
const auth = firebaseApp.auth();
const db = firebaseApp.firestore();

console.log("Auth:", auth);
console.log("DB:", db);
