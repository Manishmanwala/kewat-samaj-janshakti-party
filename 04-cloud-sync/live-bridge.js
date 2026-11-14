// 04-cloud-sync/live-bridge.js
// सीनियर पैनल (ksjp-party-portal) से लाइव सिंक, घंटी सूचनाएं, कॉन्फ्रेंस रूम व 1-to-1 चैट
// तथा 2-स्टेप वेरिफिकेशन (Google Sign-In / Email Verification + पंजीकरण फॉर्म)

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export async function initLivePublicBridge() {
  let projectId = "";
  let apiKey = "";
  let firebaseAuth = null;

  try {
    const keyMod = await import("../01-config/firebase-key.js");
    if (keyMod && keyMod.firebaseConfig) {
      projectId = keyMod.firebaseConfig.projectId || "";
      apiKey = keyMod.firebaseConfig.apiKey || "";
      const app = getApps().length ? getApps()[0] : initializeApp(keyMod.firebaseConfig);
      firebaseAuth = getAuth(app);
    }
  } catch (e) {}

  const firestoreBase = projectId
    ? `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
    : "";

  const PUBLIC_USER_KEY = "KSJP_PUBLIC_MEMBER_USER";
  const getPubUser = () => { try { return JSON.parse(localStorage.getItem(PUBLIC_USER_KEY)) || null; } catch (e) { return null; } };
  const setPubUser = (u) => { try { localStorage.setItem(PUBLIC_USER_KEY, JSON.stringify(u)); } catch (e) {} };
  const getFollows = () => { try { return JSON.parse(localStorage.getItem("KSJP_FOLLOWED_IDS")) || []; } catch (e) { return []; } };
  const toggleFollow = (id) => {
    const list = getFollows();
    const idx = list.indexOf(id);
    if (idx === -1) list.push(id); else list.splice(idx, 1);
    localStorage.setItem("KSJP_FOLLOWED_IDS", JSON.stringify(list));
  };

  let seniorLeaders = {};
  let publicMembers = [];
  let blockedPhones = new Set();

  // वैध भारतीय मोबाइल नंबर जांच (नकली नंबरों को रोकना)
  function isValidIndianMobile(phone) {
    if (!/^[6-9]\d{9}$/.test(phone)) return false;
    if (/^(\d)\1{9}$/.test(phone)) return false; // जैसे 9999999999, 8888888888
    const fakeList = ["1234567890", "9876543210", "6789012345", "7890123456", "8901234567"];
    if (fakeList.includes(phone)) return false;
    return true;
  }

  // फ़ोटो कंप्रेस करने का फ़ंक्शन (140px / 75% quality)
  const compressImg = (fileInput) => new Promise((resolve) => {
    const file = fileInput?.files?.[0];
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 140;
        const scale = Math.min(max / img.width, max / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 1. सीनियर एडमिन पैनल (6 पदों) व आम सदस्यों का डेटा लाना
  async function syncAllPeople() {
    if (!firestoreBase) return;
    try {
      // ब्लॉक किए गए लोगों की सूची
      const bRes = await fetch(`${firestoreBase}/ksjp_blocked?key=${apiKey}`);
      if (bRes.ok) {
        const bData = await bRes.json();
        blockedPhones = new Set((bData.documents || []).map(d => d.name.split("/").pop()));
      }

      // सीनियर 6 पद
      const sRes = await fetch(`${firestoreBase}/ksjp_members?key=${apiKey}`);
      if (sRes.ok) {
        const sData = await sRes.json();
        seniorLeaders = {};
        (sData.documents || []).forEach(doc => {
          const seat = doc.name.split("/").pop();
          const f = doc.fields || {};
          seniorLeaders[seat] = {
            seat,
            name: f.name?.stringValue || seat.toUpperCase(),
            phone: f.phone?.stringValue || "",
            photo: f.photo?.stringValue || "",
            locked: Boolean(f.locked?.booleanValue)
          };
        });

        document.querySelectorAll("#pub-leaders-row .leader-node").forEach(node => {
          const seat = node.getAttribute("data-seat");
          const data = seniorLeaders[seat];
          if (data && data.locked) {
            node.querySelector(".leader-tag").textContent = data.name;
            const av = node.querySelector(".avatar-s, .avatar-adm");
            if (av && data.photo) {
              av.innerHTML = `<img src="${data.photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`;
            }
          }
        });
      }

      // आम जुड़े हुए सदस्य
      const pRes = await fetch(`${firestoreBase}/ksjp_public_members?key=${apiKey}`);
      if (pRes.ok) {
        const pData = await pRes.json();
        publicMembers = (pData.documents || []).map(doc => {
          const id = doc.name.split("/").pop();
          const f = doc.fields || {};
          return {
            id,
            name: f.name?.stringValue || "सदस्य",
            village: f.address?.stringValue || f.village?.stringValue || "KSJP कार्यकर्ता",
            phone: f.phone?.stringValue || id,
            photo: f.photo?.stringValue || ""
          };
        }).filter(m => !blockedPhones.has(m.phone));

        renderFollowAndMembers();
      }
    } catch (e) {}
  }

  // फॉलो पट्टी और नीचे वाले सदस्यों की सूची रेंडर करना
  function renderFollowAndMembers() {
    const follows = getFollows();
    const followBox = document.getElementById("follow-scroll");
    const listBox = document.getElementById("members-vertical-list");
    const me = getPubUser();

    if (followBox) {
      const followedPeople = publicMembers.filter(m => follows.includes(m.id));
      followBox.innerHTML = followedPeople.length === 0
        ? `<div style="font-size:11.5px;color:#64748b;padding:6px 0;">नीचे किसी भी सदस्य को 'फॉलो' करें, वे यहाँ तुरंत दिखेंगे।</div>`
        : followedPeople.map(m => `
            <div class="follow-item" data-uid="${m.id}" data-uname="${m.name}">
              <div class="follow-avatar">${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;" />` : m.name.charAt(0)}</div>
              <div class="follow-name">${m.name}</div>
            </div>
          `).join("");

      followBox.querySelectorAll(".follow-item").forEach(el => {
        el.onclick = () => openDirectChat(el.getAttribute("data-uid"), el.getAttribute("data-uname"));
      });
    }

    if (listBox) {
      const others = publicMembers.filter(m => !me || m.phone !== me.phone);
      listBox.innerHTML = others.length === 0
        ? `<div style="text-align:center;color:#64748b;padding:24px;font-size:13px;">अभी कोई अन्य सदस्य सूचीबद्ध नहीं है। नीचे 'प्रोफ़ाइल' से जुड़ें!</div>`
        : others.map(m => {
            const isF = follows.includes(m.id);
            return `
              <div class="member-row" data-member-id="${m.id}" data-member-phone="${m.phone}" data-member-name="${m.name}">
                <div class="member-circle">${m.photo ? `<img src="${m.photo}" style="width:100%;height:100%;object-fit:cover;" />` : m.name.charAt(0)}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:14px;font-weight:800;color:#0f172a;">${m.name}</div>
                  <div style="font-size:11.5px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.village}</div>
                </div>
                <button class="follow-toggle-btn" data-fid="${m.id}" style="padding:5px 10px;border-radius:999px;font-size:11px;font-weight:800;border:1.5px solid #ff6b00;background:${isF ? "#ff6b00" : "#fff"};color:${isF ? "#fff" : "#ff6b00"};cursor:pointer;">
                  ${isF ? "✓ फ़ॉलोइंग" : "+ फ़ॉलो"}
                </button>
              </div>
            `;
          }).join("");

      listBox.querySelectorAll(".follow-toggle-btn").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          toggleFollow(btn.getAttribute("data-fid"));
          renderFollowAndMembers();
        };
      });

      listBox.querySelectorAll(".member-row").forEach(row => {
        row.onclick = () => openDirectChat(row.getAttribute("data-member-id"), row.getAttribute("data-member-name"));
      });
    }
  }

  // 2. सीनियर पैनल की घंटी (notices) और समाचार सिंक करना
  async function syncNoticesAndMedia() {
    if (!firestoreBase) return;
    try {
      const res = await fetch(`${firestoreBase}/ksjp_rooms/notices/messages?pageSize=50&key=${apiKey}`);
      if (!res.ok) return;
      const data = await res.json();
      const posts = (data.documents || []).map(doc => {
        const id = doc.name.split("/").pop();
        const f = doc.fields || {};
        return {
          id,
          name: f.name?.stringValue || "एडमिन",
          text: f.text?.stringValue || "",
          time: f.time?.stringValue || "",
          ts: Number(f.ts?.integerValue || 0)
        };
      }).sort((a, b) => b.ts - a.ts);

      const dot = document.getElementById("pub-bell-dot");
      const seen = Number(localStorage.getItem("KSJP_PUB_SEEN_NOTICES") || 0);
      if (dot) dot.style.display = posts.length > seen ? "block" : "none";

      // समाचार टैब के दूसरे हिस्से में यही आधिकारिक सूचनाएं दिखाना
      const newsPane = document.getElementById("news-txt-pane");
      if (newsPane) {
        newsPane.innerHTML = posts.length === 0
          ? `<div style="text-align:center;color:#64748b;margin-top:30px;">अभी कोई आधिकारिक सूचना जारी नहीं हुई है।</div>`
          : posts.map(p => `
              <div class="ksjp-deletable-item" data-del-path="ksjp_rooms/notices/messages/${p.id}" style="background:#fff;padding:12px;border-radius:12px;border-left:4px solid #ff6b00;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
                <div style="font-size:11px;color:#ff6b00;font-weight:800;">📢 ${p.name} • ${p.time}</div>
                <div style="font-size:14px;color:#0f172a;margin-top:4px;white-space:pre-wrap;">${p.text}</div>
              </div>
            `).join("");
      }

      document.getElementById("pub-bell-btn").onclick = () => {
        if (dot) dot.style.display = "none";
        localStorage.setItem("KSJP_PUB_SEEN_NOTICES", String(posts.length));
        openOverlayRoom("🔔 पार्टी सूचना केंद्र (मुख्यालय)", null, posts.map(p => ({
          id: p.id,
          delPath: `ksjp_rooms/notices/messages/${p.id}`,
          sender: p.name,
          text: p.text,
          time: p.time
        })));
      };
    } catch (e) {}
  }

  // 3. चैट और कॉन्फ्रेंस रूम खोलना
  let activeChatInterval = null;
  async function openOverlayRoom(title, collectionPath, staticList = null) {
    if (activeChatInterval) clearInterval(activeChatInterval);
    const box = document.getElementById("overlay-box");
    const body = document.getElementById("ov-body");
    const footer = document.getElementById("ov-footer");
    document.getElementById("ov-title").textContent = title;
    box.style.display = "flex";
    footer.style.display = collectionPath ? "flex" : "none";

    const renderList = (items) => {
      body.innerHTML = items.length === 0
        ? `<div style="text-align:center;color:#64748b;margin-top:40px;font-size:13px;">अभी कोई संदेश नहीं है। नीचे से बातचीत शुरू करें!</div>`
        : items.map(m => `
            <div class="ksjp-deletable-item" data-del-path="${m.delPath || ""}" style="background:#fff;padding:10px 12px;border-radius:12px;border:1px solid #cbd5e1;">
              <div style="font-size:12px;font-weight:800;color:#16a34a;">${m.sender} <span style="font-weight:500;color:#64748b;font-size:10px;">${m.time || ""}</span></div>
              <div style="font-size:14px;color:#0f172a;margin-top:3px;white-space:pre-wrap;">${m.text}</div>
            </div>
          `).join("");
      body.scrollTop = body.scrollHeight;
    };

    if (staticList) {
      renderList(staticList);
      return;
    }

    const fetchMsgs = async () => {
      if (!firestoreBase) return;
      try {
        const res = await fetch(`${firestoreBase}/${collectionPath}?pageSize=100&key=${apiKey}`);
        if (!res.ok) return;
        const data = await res.json();
        const items = (data.documents || []).map(doc => {
          const id = doc.name.split("/").pop();
          const f = doc.fields || {};
          return {
            id,
            delPath: `${collectionPath}/${id}`,
            sender: f.name?.stringValue || "सदस्य",
            text: f.text?.stringValue || "",
            time: f.time?.stringValue || "",
            ts: Number(f.ts?.integerValue || 0)
          };
        }).sort((a, b) => a.ts - b.ts);
        renderList(items);
      } catch (e) {}
    };

    await fetchMsgs();
    activeChatInterval = setInterval(fetchMsgs, 3500);

    document.getElementById("ov-send-btn").onclick = async () => {
      const me = getPubUser();
      if (!me) {
        box.style.display = "none";
        document.querySelector('[data-tab="profile"]').click();
        return alert("संदेश भेजने के लिए कृपया पहले अपनी प्रोफ़ाइल जोड़ें!");
      }
      if (blockedPhones.has(me.phone)) {
        return alert("🚫 एडमिन द्वारा आपको प्रतिबंधित (Block) किया गया है।");
      }
      const inp = document.getElementById("ov-inp");
      const txt = inp.value.trim();
      if (!txt) return;
      inp.value = "";
      await fetch(`${firestoreBase}/${collectionPath}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            name: { stringValue: me.name },
            text: { stringValue: txt },
            time: { stringValue: new Date().toLocaleString("hi-IN") },
            ts: { integerValue: String(Date.now()) }
          }
        })
      });
      await fetchMsgs();
    };
  }

  function openDirectChat(targetId, targetName) {
    const me = getPubUser();
    if (!me) {
      document.querySelector('[data-tab="profile"]').click();
      return alert("निजी बातचीत के लिए कृपया पहले अपनी प्रोफ़ाइल जोड़ें!");
    }
    const pairRoom = [me.phone, targetId].sort().join("__");
    openOverlayRoom(`🔒 ${targetName} (निजी चैट)`, `ksjp_public_dms/${pairRoom}/messages`);
  }

  // कॉन्फ्रेंस रूम बटन
  document.getElementById("pub-conf-btn").onclick = () => {
    openOverlayRoom("🎙️ कॉन्फ्रेंस रूम (साझा समूह)", "ksjp_rooms/conference_public/messages");
  };

  // शीर्ष 6 नेतृत्व गोलों पर क्लिक (एडमिन जानकारी + सीधी बात)
  document.querySelectorAll("#pub-leaders-row .leader-node").forEach(node => {
    node.onclick = () => {
      const seat = node.getAttribute("data-seat");
      const info = seniorLeaders[seat] || { name: seat.toUpperCase(), locked: false };
      openDirectChat(seat, info.name);
    };
  });

  // 4. प्रोफ़ाइल टैब रेंडर व 2-स्टेप सत्यापित सदस्य पंजीकरण
  function renderProfileTab() {
    const card = document.getElementById("pub-profile-card");
    const bigAv = document.getElementById("nav-big-avatar");
    const me = getPubUser();

    if (me) {
      if (bigAv) {
        bigAv.innerHTML = me.photo ? `<img src="${me.photo}" style="width:100%;height:100%;object-fit:cover;" />` : me.name.charAt(0);
      }
      card.innerHTML = `
        <div style="width:72px;height:72px;border-radius:50%;background:#ff6b00;color:#fff;font-size:26px;font-weight:900;overflow:hidden;display:flex;align-items:center;justify-content:center;margin:0 auto 8px auto;border:3px solid #16a34a;">
          ${me.photo ? `<img src="${me.photo}" style="width:100%;height:100%;object-fit:cover;" />` : me.name.charAt(0)}
        </div>
        <div style="font-size:17px;font-weight:800;">${me.name}</div>
        <div style="font-size:12px;color:#16a34a;font-weight:700;">📞 मो. ${me.phone} • ✅ वेरीफाइड</div>
        ${me.email ? `<div style="font-size:11.5px;color:#0057ff;font-weight:700;margin-top:2px;">📧 ${me.email}</div>` : ""}
        <div style="font-size:11.5px;color:#475569;margin-top:4px;">📍 ${me.address || me.village || "KSJP सदस्य"}</div>
        <div style="margin-top:8px;background:#fef9c3;border:1px solid #eab308;color:#854d0e;padding:6px 10px;border-radius:10px;font-size:11px;font-weight:700;">
          🔒 आपकी सत्यापित सदस्यता पार्टी डेटाबेस में सुरक्षित है।
        </div>
      `;
      return;
    }

    // नया सदस्य: चरण 1 (Google / Email वेरिफिकेशन) + चरण 2 (पूरा पंजीकरण फॉर्म)
    card.innerHTML = `
      <h3 style="font-size:16.5px;font-weight:800;color:#ff6b00;margin-bottom:4px;">KSJP सत्यापित सदस्यता पंजीकरण</h3>
      <p style="font-size:12px;color:#475569;margin-bottom:10px;">चरण 1: पहले Google या Email लिंक से अपनी असली पहचान प्रमाणित करें।</p>

      <!-- चरण 1: Google / Email Verification -->
      <div id="pub-auth-box" style="background:#f8fafc;border:1.5px solid #cbd5e1;border-radius:12px;padding:11px;margin-bottom:10px;text-align:left;">
        <button id="pub-google-btn" type="button" style="width:100%;padding:10px;background:#ffffff;color:#0f172a;border:1.5px solid #16a34a;border-radius:999px;font-weight:800;font-size:13.5px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;">
          <span>🔵</span> <span>Continue with Google (तुरंत वेरीफाई)</span>
        </button>

        <div style="text-align:center;font-size:11px;color:#64748b;margin:8px 0;font-weight:700;">— या Gmail / Email से वेरीफाई करें —</div>

        <input id="pub-auth-email" type="email" placeholder="अपना असली Gmail / Email लिखें" style="width:100%;padding:8.5px;border:1.5px solid #cbd5e1;border-radius:10px;margin-bottom:6px;font-size:13.5px;" />
        <input id="pub-auth-pass" type="password" placeholder="नया पासवर्ड बनाएं (8-10 अक्षर)" style="width:100%;padding:8.5px;border:1.5px solid #cbd5e1;border-radius:10px;margin-bottom:8px;font-size:13.5px;" />

        <div style="display:flex;gap:6px;">
          <button id="pub-send-link-btn" type="button" style="flex:1;padding:8.5px;background:#0057ff;color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;">वेरिफिकेशन लिंक भेजें</button>
          <button id="pub-check-link-btn" type="button" style="flex:1;padding:8.5px;background:#16a34a;color:#fff;border:none;border-radius:999px;font-size:12px;font-weight:700;cursor:pointer;">लिंक क्लिक कर दिया ✓</button>
        </div>
        <div id="pub-auth-status" style="font-size:11.5px;color:#b45309;font-weight:700;margin-top:6px;"></div>
      </div>

      <!-- चरण 2: पूरा पंजीकरण फॉर्म -->
      <div id="pub-reg-form" style="display:none;flex-direction:column;gap:8px;text-align:left;">
        <div id="pub-verified-badge" style="background:#dcfce7;border:1px solid #22c55e;color:#15803d;padding:7px 10px;border-radius:10px;font-size:12px;font-weight:800;"></div>

        <input id="reg-p-name" type="text" placeholder="आपका पूरा नाम लिखें (अनिवार्य)" style="width:100%;padding:9px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13.5px;" />
        <input id="reg-p-phone" type="tel" maxlength="10" placeholder="10 अंकों का असली मोबाइल नंबर (अनिवार्य)" style="width:100%;padding:9px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13.5px;" />
        <textarea id="reg-p-address" rows="2" placeholder="पूरा पता: ग्राम/मोहल्ला, पोस्ट, तहसील, जिला, राज्य (अनिवार्य)" style="width:100%;padding:9px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13.5px;"></textarea>
        <textarea id="reg-p-reason" rows="2" placeholder="मैं केवट समाज जनशक्ति पार्टी से क्यों जुड़ना चाहता हूँ? (अनिवार्य)" style="width:100%;padding:9px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13.5px;"></textarea>
        <textarea id="reg-p-note" rows="2" placeholder="अतिरिक्त जानकारी / पर्ची / बायोडाटा / राधे-राधे (वैकल्पिक - कोई सीमा नहीं)" style="width:100%;padding:9px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13.5px;"></textarea>

        <div style="font-size:11.5px;font-weight:700;color:#334155;">अपनी स्पष्ट फ़ोटो चुनें (स्वतः कंप्रेस होगी):</div>
        <input id="reg-p-photo" type="file" accept="image/*" style="width:100%;font-size:12px;" />

        <button id="reg-p-btn" type="button" style="width:100%;padding:11px;background:#16a34a;color:#fff;border:none;border-radius:999px;font-weight:800;font-size:14px;margin-top:4px;cursor:pointer;">पंजीकरण पूरा करें और सुरक्षित करें 🔒</button>
      </div>
    `;

    let verifiedEmail = "";
    const statusBox = document.getElementById("pub-auth-status");
    const authBox = document.getElementById("pub-auth-box");
    const regForm = document.getElementById("pub-reg-form");
    const badge = document.getElementById("pub-verified-badge");

    const openStepTwo = (email) => {
      verifiedEmail = email;
      authBox.style.display = "none";
      regForm.style.display = "flex";
      badge.textContent = `✅ वेरीफाइड ईमेल: ${email} (लॉक)`;
    };

    // विकल्प A: Google Sign-In
    document.getElementById("pub-google-btn").onclick = async () => {
      if (!firebaseAuth) return alert("Firebase कुंजी लोड नहीं हुई है।");
      statusBox.textContent = "Google से जोड़ा जा रहा है...";
      try {
        const provider = new GoogleAuthProvider();
        const res = await signInWithPopup(firebaseAuth, provider);
        if (res.user && res.user.email) {
          openStepTwo(res.user.email);
        }
      } catch (err) {
        statusBox.textContent = "Google साइन-इन पूरा नहीं हुआ: " + (err.message || "");
      }
    };

    // विकल्प B1: Email वेरिफिकेशन लिंक भेजना
    document.getElementById("pub-send-link-btn").onclick = async () => {
      if (!firebaseAuth) return alert("Firebase कुंजी लोड नहीं हुई है।");
      const em = document.getElementById("pub-auth-email").value.trim();
      const pw = document.getElementById("pub-auth-pass").value;
      if (!em || !em.includes("@")) return alert("कृपया सही ईमेल पता लिखें।");
      if (pw.length < 8 || pw.length > 10) return alert("कृपया 8 से 10 अक्षरों का पासवर्ड बनाएं।");

      statusBox.textContent = "वेरिफिकेशन लिंक भेजा जा रहा है...";
      try {
        let cred;
        try {
          cred = await createUserWithEmailAndPassword(firebaseAuth, em, pw);
        } catch (e) {
          cred = await signInWithEmailAndPassword(firebaseAuth, em, pw);
        }
        if (cred.user.emailVerified) {
          openStepTwo(cred.user.email);
        } else {
          await sendEmailVerification(cred.user);
          statusBox.textContent = "📩 आपके Gmail इनबॉक्स (या Spam फ़ोल्डर) में लिंक भेज दिया गया है। लिंक पर क्लिक करने के बाद हरे बटन 'लिंक क्लिक कर दिया ✓' पर क्लिक करें।";
        }
      } catch (err) {
        statusBox.textContent = "त्रुटि: " + (err.message || "ईमेल भेजने में समस्या हुई।");
      }
    };

    // विकल्प B2: ईमेल लिंक वेरिफिकेशन जांचना
    document.getElementById("pub-check-link-btn").onclick = async () => {
      if (!firebaseAuth || !firebaseAuth.currentUser) {
        return alert("पहले ऊपर अपना ईमेल व पासवर्ड डालकर लिंक भेजें।");
      }
      statusBox.textContent = "सत्यापन जांचा जा रहा है...";
      await firebaseAuth.currentUser.reload();
      if (firebaseAuth.currentUser.emailVerified) {
        openStepTwo(firebaseAuth.currentUser.email);
      } else {
        statusBox.textContent = "⚠️ अभी ईमेल वेरीफाई नहीं हुआ है। कृपया अपने Gmail में आए लिंक पर क्लिक करें और फिर यह बटन दबाएं।";
      }
    };

    // चरण 2: फॉर्म सबमिट करके दोनों जगह (ksjp_public_members व ksjp_users) सेव करना
    document.getElementById("reg-p-btn").onclick = async () => {
      if (!verifiedEmail) return alert("पहले Google या Email से अपनी पहचान वेरीफाई करें।");
      const name = document.getElementById("reg-p-name").value.trim();
      const phone = document.getElementById("reg-p-phone").value.replace(/\D/g, "");
      const address = document.getElementById("reg-p-address").value.trim();
      const reason = document.getElementById("reg-p-reason").value.trim();
      const note = document.getElementById("reg-p-note").value.trim();
      const photo = await compressImg(document.getElementById("reg-p-photo"));

      if (name.length < 2) return alert("कृपया अपना पूरा नाम लिखें।");
      if (!isValidIndianMobile(phone)) return alert("कृपया 10 अंकों का असली भारतीय मोबाइल नंबर डालें (नकली नंबर मान्य नहीं हैं)।");
      if (blockedPhones.has(phone)) return alert("🚫 यह नंबर प्रतिबंधित है।");
      if (address.length < 5) return alert("कृपया अपना पूरा पता लिखें।");
      if (reason.length < 3) return alert("कृपया जुड़ने का कारण लिखें।");

      const nowStr = new Date().toLocaleString("hi-IN");
      const rec = {
        id: phone,
        name,
        village: address,
        address,
        phone,
        email: verifiedEmail,
        reason,
        note,
        photo,
        joinedAt: nowStr
      };

      if (firestoreBase) {
        const fieldsPayload = {
          fields: {
            name: { stringValue: name },
            village: { stringValue: address },
            address: { stringValue: address },
            phone: { stringValue: phone },
            email: { stringValue: verifiedEmail },
            emailVerified: { booleanValue: true },
            reason: { stringValue: reason },
            note: { stringValue: note },
            photo: { stringValue: photo },
            joinedAt: { stringValue: nowStr }
          }
        };

        // 1. मुख्य वेबसाइट की सदस्य सूची में सेव करना
        await fetch(`${firestoreBase}/ksjp_public_members/${phone}?key=${apiKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsPayload)
        });

        // 2. एडमिन पैनल के 👥 रिकॉर्ड व्यूअर (ksjp_users) में स्थायी दस्तावेज़ के रूप में सेव करना
        await fetch(`${firestoreBase}/ksjp_users/${phone}?key=${apiKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fieldsPayload)
        });
      }

      try { await signOut(firebaseAuth); } catch (e) {}
      setPubUser(rec);
      renderProfileTab();
      syncAllPeople();
      alert("✅ आपका सत्यापित पंजीकरण सफलतापूर्वक सुरक्षित हो गया है!");
    };
  }

  // सोशल मीडिया प्लेटफ़ॉर्म बटन
  document.querySelectorAll(".soc-platform-btn").forEach(btn => {
    btn.onclick = () => {
      const plat = btn.getAttribute("data-plat");
      document.getElementById("social-channel-details").innerHTML = `
        <div style="font-size:14px;font-weight:800;color:#ff6b00;margin-bottom:8px;">${plat} पर जुड़े आधिकारिक अकाउंट:</div>
        <div style="padding:10px;background:#f8fafc;border-radius:10px;border:1px solid #cbd5e1;">
          <strong>केवट समाज जनशक्ति पार्टी (${plat})</strong><br/>
          <span style="font-size:11.5px;color:#64748b;">मुख्यालय द्वारा सत्यापित आधिकारिक चैनल</span>
        </div>
      `;
    };
  });

  // वीडियो कार्ड व नई पोस्ट सबमिट
  document.getElementById("yt-important-videos").innerHTML = `
    <div class="vid-card"><div style="font-size:11px;color:#fca5a5;">YouTube मुख्य प्रसारण</div><div style="font-size:13.5px;font-weight:800;">KSJP पार्टी की आगामी रणनीति एवं जनसंवाद</div><div style="font-size:11px;background:#dc2626;padding:4px 10px;border-radius:999px;width:fit-content;">▶ देखें</div></div>
  `;
  document.getElementById("ig-important-videos").innerHTML = `
    <div class="vid-card" style="border-color:#d946ef;"><div style="font-size:11px;color:#f5d0fe;">Instagram रील</div><div style="font-size:13.5px;font-weight:800;">युवा संगठन एवं क्षेत्रीय कार्यक्रम झलकियाँ</div><div style="font-size:11px;background:#c026d3;padding:4px 10px;border-radius:999px;width:fit-content;">▶ देखें</div></div>
  `;

  document.getElementById("pub-submit-post").onclick = async () => {
    const me = getPubUser();
    if (!me) return alert("कृपया पहले अपनी प्रोफ़ाइल जोड़ें!");
    const txt = document.getElementById("pub-post-text").value.trim();
    const lnk = document.getElementById("pub-post-link").value.trim();
    if (!txt) return alert("कृपया कुछ संदेश लिखें।");
    const fullText = lnk ? `${txt}\n🔗 ${lnk}` : txt;
    if (firestoreBase) {
      await fetch(`${firestoreBase}/ksjp_rooms/conference_public/messages?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: {
            name: { stringValue: me.name },
            text: { stringValue: fullText },
            time: { stringValue: new Date().toLocaleString("hi-IN") },
            ts: { integerValue: String(Date.now()) }
          }
        })
      });
    }
    document.getElementById("pub-post-text").value = "";
    document.getElementById("pub-post-link").value = "";
    alert("✅ आपका विचार कॉन्फ्रेंस रूम में प्रकाशित हो गया है!");
  };

  renderProfileTab();
  await syncAllPeople();
  await syncNoticesAndMedia();
  setInterval(syncAllPeople, 6000);
  setInterval(syncNoticesAndMedia, 6000);
}
