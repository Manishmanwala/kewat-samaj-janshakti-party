// ==========================================
// केवट समाज जनशक्ति पार्टी (KSJP) - Firebase चाबी फ़ाइल
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyD-AzIA5g5X-ddUz1mKEDel3X83NMRZkco",
  authDomain: "ksjp-party-portal.firebaseapp.com",
  projectId: "ksjp-party-portal",
  storageBucket: "ksjp-party-portal.firebasestorage.app",
  messagingSenderId: "306712198819",
  appId: "1:306712198819:web:b49ede0398be2a834fc916",
  measurementId: "G-MD76KNGQ1D"
};

// Firebase चालू करें (अगर पहले से चालू न हो)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// मुख्य सेवाएँ तैयार रखें ताकि हर पेज पर सीधे काम करें
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
