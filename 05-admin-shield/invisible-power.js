// 05-admin-shield/invisible-power.js
// केवल Site Manager और 5 एडमिन के लिए अदृश्य जादुई पावर (डिफ़ॉल्ट सक्रिय)
// 1. हर पोस्ट/मैसेज पर अदृश्य हटाने (🗑️) का बटन
// 2. किसी भी शरारती सदस्य पर Long-Press (2 सेकंड दबाकर रखने) से ब्लॉक व डिलीट पावर

export async function initInvisibleAdminPower() {
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

  // जाँचें कि क्या यह मोबाइल Site Manager या 5 में से किसी एडमिन का है
  let isSeniorAdmin = false;
  try {
    const seniorLocal = JSON.parse(localStorage.getItem("KSJP_CURRENT_SEAT_USER") || "null");
    const pubLocal = JSON.parse(localStorage.getItem("KSJP_PUBLIC_MEMBER_USER") || "null");

    if (seniorLocal && (seniorLocal.seatId === "site-manager" || seniorLocal.seatId.startsWith("admin-"))) {
      isSeniorAdmin = true;
    } else if (pubLocal && firestoreBase) {
      const res = await fetch(`${firestoreBase}/ksjp_members?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const adminPhones = (data.documents || []).map(d => d.fields?.phone?.stringValue).filter(Boolean);
        if (adminPhones.includes(pubLocal.phone)) isSeniorAdmin = true;
      }
    }
  } catch (e) {}

  // यदि आम नागरिक है, तो अदृश्य पावर पूरी तरह छिपी रहेगी
  if (!isSeniorAdmin) return;

  // 1. हर संदेश और पोस्ट के कोने में गुप्त हटाने (🗑️) का बटन जोड़ना
  const injectDeleteButtons = () => {
    document.querySelectorAll(".ksjp-deletable-item").forEach(item => {
      if (item.dataset.adminHooked === "1") return;
      item.dataset.adminHooked = "1";
      const path = item.getAttribute("data-del-path");
      if (!path || !firestoreBase) return;

      item.style.position = "relative";
      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑️";
      delBtn.title = "एडमिन पावर: तुरंत हटाएँ";
      delBtn.style.cssText = `
        position: absolute; top: 8px; right: 8px;
        background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5;
        border-radius: 8px; padding: 2px 7px; font-size: 12px; cursor: pointer;
      `;
      delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm("⚡ एडमिन पावर: क्या आप इस कंटेंट को हमेशा के लिए हटाना चाहते हैं?")) return;
        await fetch(`${firestoreBase}/${path}?key=${apiKey}`, { method: "DELETE" });
        item.remove();
      };
      item.appendChild(delBtn);
    });
  };

  // 2. किसी भी शरारती व्यक्ति पर 2 सेकंड Long-Press करने से ब्लॉक व डिलीट मेनू
  let pressTimer = null;
  const attachLongPress = () => {
    document.querySelectorAll(".member-row").forEach(row => {
      if (row.dataset.lpHooked === "1") return;
      row.dataset.lpHooked = "1";

      const startPress = () => {
        pressTimer = setTimeout(() => {
          const phone = row.getAttribute("data-member-phone");
          const name = row.getAttribute("data-member-name");
          openInvisibleActionMenu(phone, name, row);
        }, 1200);
      };
      const cancelPress = () => clearTimeout(pressTimer);

      row.addEventListener("touchstart", startPress, { passive: true });
      row.addEventListener("touchend", cancelPress);
      row.addEventListener("touchmove", cancelPress);
      row.addEventListener("mousedown", startPress);
      row.addEventListener("mouseup", cancelPress);
    });
  };

  const openInvisibleActionMenu = (phone, name, rowEl) => {
    document.getElementById("ksjp-secret-menu")?.remove();
    const menu = document.createElement("div");
    menu.id = "ksjp-secret-menu";
    menu.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.75);display:flex;align-items:center;justify-content:center;padding:20px;z-index:99999;";
    menu.innerHTML = `
      <div style="width:100%;max-width:320px;background:#fff;border-radius:18px;border:2px solid #dc2626;padding:18px;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#dc2626;margin-bottom:4px;">⚡ अदृश्य एडमिन नियंत्रण</div>
        <div style="font-size:16px;font-weight:800;margin-bottom:14px;">${name} (${phone})</div>
        <button id="sec-del-only" style="width:100%;padding:10px;background:#f97316;color:#fff;border:none;border-radius:999px;font-weight:800;margin-bottom:8px;">🗑️ सदस्य को हटाएँ (Delete)</button>
        <button id="sec-del-block" style="width:100%;padding:10px;background:#dc2626;color:#fff;border:none;border-radius:999px;font-weight:800;margin-bottom:8px;">🚫 हटाएँ और ब्लॉक करें (Delete + Block)</button>
        <button id="sec-close" style="width:100%;padding:9px;background:#e2e8f0;border:none;border-radius:999px;font-weight:700;">रद्द करें</button>
      </div>
    `;
    document.body.appendChild(menu);

    document.getElementById("sec-close").onclick = () => menu.remove();
    document.getElementById("sec-del-only").onclick = async () => {
      await fetch(`${firestoreBase}/ksjp_public_members/${phone}?key=${apiKey}`, { method: "DELETE" });
      rowEl?.remove();
      menu.remove();
      alert(`✅ ${name} को सूची से हटा दिया गया है।`);
    };
    document.getElementById("sec-del-block").onclick = async () => {
      await fetch(`${firestoreBase}/ksjp_public_members/${phone}?key=${apiKey}`, { method: "DELETE" });
      await fetch(`${firestoreBase}/ksjp_blocked/${phone}?key=${apiKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { name: { stringValue: name }, blockedAt: { integerValue: String(Date.now()) } } })
      });
      rowEl?.remove();
      menu.remove();
      alert(`🚫 ${name} को हटाकर स्थायी रूप से ब्लॉक कर दिया गया है!`);
    };
  };

  setInterval(() => {
    injectDeleteButtons();
    attachLongPress();
  }, 1500);
}
