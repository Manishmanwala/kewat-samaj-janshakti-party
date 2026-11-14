// 07-member-freedom/leave-and-sync.js
// आम सदस्यों को खुद सदस्यता छोड़ने की आज़ादी देना और एडमिन द्वारा हटाए जाने पर तुरंत लॉगआउट करना

export async function initMemberFreedom() {
  let projectId = "";
  let apiKey = "";
  try {
    const keyMod = await import("../01-config/firebase-key.js");
    projectId = keyMod?.firebaseConfig?.projectId || "";
    apiKey = keyMod?.firebaseConfig?.apiKey || "";
  } catch (e) {}

  const firestoreBase = projectId
    ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    : "";

  const PUBLIC_USER_KEY = "KSJP_PUBLIC_MEMBER_USER";
  const getPubUser = () => {
    try { return JSON.parse(localStorage.getItem(PUBLIC_USER_KEY)) || null; } catch (e) { return null; }
  };

  // प्रोफ़ाइल कार्ड में 'सदस्यता छोड़ें' बटन लगाना और हटाए जाने की स्थिति जांचना
  async function checkAndRenderLeaveButton() {
    const me = getPubUser();
    const card = document.getElementById("pub-profile-card");
    if (!me) return;

    // 1. जांचना कि कहीं एडमिन ने इस सदस्य को हटा (Remove/Kick) तो नहीं दिया
    if (firestoreBase) {
      try {
        const res = await fetch(`${firestoreBase}/ksjp_users/${me.phone}?key=${apiKey}`);
        if (res.status === 404) {
          localStorage.removeItem(PUBLIC_USER_KEY);
          alert("⚠️ एडमिन द्वारा आपकी सदस्यता समाप्त कर दी गई है।");
          location.reload();
          return;
        }
      } catch (e) {}
    }

    // 2. प्रोफ़ाइल के नीचे 'सदस्यता छोड़ें' बटन जोड़ना
    if (card && !document.getElementById("btn-member-leave-group")) {
      const leaveBtn = document.createElement("button");
      leaveBtn.id = "btn-member-leave-group";
      leaveBtn.type = "button";
      leaveBtn.style.cssText = "width:100%;margin-top:10px;padding:9px;background:#fee2e2;color:#dc2626;border:1.5px solid #ef4444;border-radius:999px;font-size:12.5px;font-weight:800;cursor:pointer;";
      leaveBtn.textContent = "🚪 अपनी सदस्यता समाप्त करें (Leave Group)";

      leaveBtn.onclick = async () => {
        const ok = confirm("क्या आप वाकई पार्टी की इस सदस्यता से हटना चाहते हैं? आपका प्रोफ़ाइल डेटा हटा दिया जाएगा।");
        if (!ok) return;

        leaveBtn.disabled = true;
        leaveBtn.textContent = "हटाया जा रहा है...";

        if (firestoreBase) {
          try {
            await fetch(`${firestoreBase}/ksjp_public_members/${me.phone}?key=${apiKey}`, { method: "DELETE" });
            await fetch(`${firestoreBase}/ksjp_users/${me.phone}?key=${apiKey}`, { method: "DELETE" });
            await fetch(`${firestoreBase}/ksjp_membership_requests/${me.phone}?key=${apiKey}`, { method: "DELETE" });
          } catch (e) {}
        }

        localStorage.removeItem(PUBLIC_USER_KEY);
        alert("✅ आपने अपनी सदस्यता सफलतापूर्वक समाप्त कर दी है।");
        location.reload();
      };

      card.appendChild(leaveBtn);
    }
  }

  await checkAndRenderLeaveButton();
  setInterval(checkAndRenderLeaveButton, 4000);
}
