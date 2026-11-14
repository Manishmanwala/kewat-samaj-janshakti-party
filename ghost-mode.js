// 06-ghost-guard/ghost-mode.js
// नए जुड़े हुए सदस्यों को 'भूत मोड (Read-Only)' में रखना और सदस्यता अनुरोध भेजना

export async function initGhostModeGuard() {
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

  let isApprovedMember = false;
  let requestStatus = "none"; // none | pending | approved

  // डेटाबेस से वर्तमान सदस्य की स्वीकृति स्थिति जांचना
  async function checkApprovalStatus() {
    const me = getPubUser();
    if (!me || !firestoreBase) {
      isApprovedMember = false;
      return;
    }

    try {
      const res = await fetch(`${firestoreBase}/ksjp_users/${me.phone}?key=${apiKey}`);
      if (res.ok) {
        const doc = await res.json();
        const f = doc.fields || {};
        const status = f.membershipStatus?.stringValue || "ghost";
        isApprovedMember = (status === "approved" || f.approved?.booleanValue === true);
        requestStatus = isApprovedMember ? "approved" : (f.membershipStatus?.stringValue || "ghost");
      } else {
        isApprovedMember = false;
        requestStatus = "ghost";
      }
    } catch (e) {}

    applyGhostRestrictions();
    renderRequestButton();
  }

  // भूत मोड (Ghost Mode) लागू करना या हटाना
  function applyGhostRestrictions() {
    const me = getPubUser();
    if (!me) return;

    // 1. कॉन्फ्रेंस रूम / मीटिंग बटन पर रोक
    const confBtn = document.getElementById("pub-conf-btn");
    if (confBtn) {
      if (!isApprovedMember) {
        confBtn.style.opacity = "0.55";
        confBtn.onclick = (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          alert("👻 आप अभी 'अस्थायी दर्शक (Ghost Mode)' में हैं। मीटिंग में शामिल होने के लिए पहले अपनी प्रोफ़ाइल से 'सदस्यता प्राप्त करने के लिए अनुरोध करें' पर क्लिक करें और एडमिन की स्वीकृति की प्रतीक्षा करें।");
        };
      }
    }

    // 2. पोस्ट/मैसेज डालने वाले फॉर्म और ओवरले चैट पर रोक
    const submitPostBtn = document.getElementById("pub-submit-post");
    if (submitPostBtn && !isApprovedMember) {
      submitPostBtn.onclick = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert("👻 भूत मोड सक्रिय: आप अभी केवल कंटेंट देख और सुन सकते हैं। पोस्ट या लिंक डालने के लिए एडमिन से सदस्यता स्वीकृत करवाएं।");
      };
    }

    const ovSendBtn = document.getElementById("ov-send-btn");
    if (ovSendBtn && !isApprovedMember) {
      ovSendBtn.onclick = (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        alert("👻 भूत मोड सक्रिय: जब तक एडमिन आपकी सदस्यता स्वीकार नहीं करते, आप किसी को मैसेज नहीं भेज सकते।");
      };
    }

    // 3. सदस्यों की लिस्ट और लीडर गोलों पर 1-to-1 चैट रोकना (ताकि न मैसेज भेज सके, न कोई इसे भेज सके)
    if (!isApprovedMember) {
      document.querySelectorAll(".member-row, .follow-item, #pub-leaders-row .leader-node").forEach((el) => {
        el.onclick = (e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
          alert("👻 भूत मोड: स्थायी सदस्यता मिलने तक निजी बातचीत (1-to-1 चैट) बंद है।");
        };
      });
    }
  }

  // प्रोफ़ाइल कार्ड में "सदस्यता प्राप्त करने के लिए अनुरोध करें" बटन दिखाना
  function renderRequestButton() {
    const me = getPubUser();
    const card = document.getElementById("pub-profile-card");
    if (!me || !card) return;

    let box = document.getElementById("ksjp-ghost-req-box");
    if (!box) {
      box = document.createElement("div");
      box.id = "ksjp-ghost-req-box";
      box.style.marginTop = "12px";
      card.appendChild(box);
    }

    if (isApprovedMember) {
      box.innerHTML = `
        <div style="background:#dcfce7;border:1.5px solid #16a34a;color:#15803d;padding:8px 12px;border-radius:12px;font-size:12px;font-weight:800;">
          ✅ स्थायी सामान्य सदस्यता स्वीकृत (सभी संवाद सुविधाएं चालू हैं)
        </div>
      `;
    } else if (requestStatus === "pending") {
      box.innerHTML = `
        <div style="background:#fef3c7;border:1.5px solid #f59e0b;color:#92400e;padding:9px 12px;border-radius:12px;font-size:12px;font-weight:800;">
          ⏳ आपका सदस्यता अनुरोध एडमिन पैनल को भेज दिया गया है। स्वीकृति मिलते ही आपका भूत मोड हट जाएगा।
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="background:#f1f5f9;border:1px solid #cbd5e1;color:#334155;padding:8px 10px;border-radius:10px;font-size:11.5px;margin-bottom:8px;">
          👻 <b>भूत मोड सक्रिय:</b> आप अभी केवल देख और सुन सकते हैं। मैसेज या मीटिंग के लिए नीचे अनुरोध भेजें:
        </div>
        <button id="btn-request-membership" style="width:100%;padding:11px;background:#ff6b00;color:#ffffff;border:none;border-radius:999px;font-size:13.5px;font-weight:800;cursor:pointer;box-shadow:0 3px 10px rgba(255,107,0,0.3);">
          सदस्यता प्राप्त करने के लिए अनुरोध करें 📩
        </button>
      `;

      document.getElementById("btn-request-membership").onclick = async () => {
        if (!firestoreBase) return;
        const btn = document.getElementById("btn-request-membership");
        btn.disabled = true;
        btn.textContent = "अनुरोध भेजा जा रहा है...";

        // ksjp_users और ksjp_membership_requests दोनों में रिक्वेस्ट अपडेट करना
        await fetch(`${firestoreBase}/ksjp_users/${me.phone}?updateMask.fieldPaths=membershipStatus&updateMask.fieldPaths=requestedAt&key=${apiKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              membershipStatus: { stringValue: "pending" },
              requestedAt: { stringValue: new Date().toLocaleString("hi-IN") }
            }
          })
        });

        await fetch(`${firestoreBase}/ksjp_membership_requests/${me.phone}?key=${apiKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              name: { stringValue: me.name || "" },
              phone: { stringValue: me.phone || "" },
              email: { stringValue: me.email || "" },
              address: { stringValue: me.address || me.village || "" },
              reason: { stringValue: me.reason || "" },
              note: { stringValue: me.note || "" },
              photo: { stringValue: me.photo || "" },
              status: { stringValue: "pending" },
              requestedAt: { stringValue: new Date().toLocaleString("hi-IN") }
            }
          })
        });

        requestStatus = "pending";
        renderRequestButton();
        alert("✅ आपका अनुरोध एडमिन पैनल को भेज दिया गया है!");
      };
    }
  }

  // लाइव निगरानी (हर 3 सेकंड में स्थिति जांचना)
  await checkApprovalStatus();
  setInterval(checkApprovalStatus, 3000);
}
