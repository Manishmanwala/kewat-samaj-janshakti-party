// केवट समाज जनशक्ति पार्टी - मुख्य कंट्रोल इंजन (Firebase + PWA)
// नोट: इसकी चाबी अलग सुरक्षित फ़ोल्डर '01-config/firebase-key.js' से जुड़ रही है।

console.log("KSJP Portal & Firebase Connected - Coded by Manish");

// ==========================================
// 1. PWA ऐप इंस्टॉल एवं शॉर्टकट कंट्रोलर
// ==========================================
let deferredPrompt;
const installBtn = document.getElementById("installAppBtn");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.style.display = "inline-block";
  }
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        installBtn.style.display = "none";
      }
      deferredPrompt = null;
    } else {
      alert("ऐप इंस्टॉल करने के लिए ब्राउज़र के ऊपर 3 बिंदुओं (⋮) पर टैप करें और 'Add to Home screen' या 'Install app' चुनें।");
    }
  });
}

window.addEventListener("appinstalled", () => {
  if (installBtn) installBtn.style.display = "none";
  alert("🎉 KSJP पोर्टल आपके फ़ोन में ऐप के रूप में इंस्टॉल हो गया है!");
});

// ==========================================
// 2. "+ सदस्य बनें" पॉपअप फॉर्म (Firestore से जुड़ा)
// ==========================================
function createModals() {
  const modalHTML = `
    <div id="joinModal" class="ksjp-modal" style="display:none;">
      <div class="ksjp-modal-content">
        <div class="modal-header">
          <h3>🚩 सदस्यता आवेदन फॉर्म</h3>
          <span id="closeJoinModal" class="close-btn">&times;</span>
        </div>
        <form id="memberForm">
          <input type="text" id="mName" placeholder="पूरा नाम लिखें *" required>
          <input type="tel" id="mPhone" placeholder="मोबाइल नंबर (WhatsApp) *" required>
          <input type="text" id="mDistrict" placeholder="ज़िला एवं राज्य *" required>
          <select id="mRole">
            <option value="कार्यकर्ता">सक्रिय कार्यकर्ता</option>
            <option value="पदाधिकारी आवेदन">पदाधिकारी पद हेतु आवेदन</option>
            <option value="समर्थक">पार्टी समर्थक</option>
          </select>
          <textarea id="mBio" rows="2" placeholder="पार्टी के लिए आपका संदेश या अनुभव..."></textarea>
          <button type="submit" class="submit-btn" id="submitMemberBtn">आवेदन जमा करें</button>
        </form>
      </div>
    </div>

    <div id="postModal" class="ksjp-modal" style="display:none;">
      <div class="ksjp-modal-content">
        <div class="modal-header">
          <h3>📢 जनसंवाद में विचार / पोस्ट डालें</h3>
          <span id="closePostModal" class="close-btn">&times;</span>
        </div>
        <form id="postForm">
          <input type="text" id="pAuthor" placeholder="आपका नाम / पद *" required>
          <select id="pTag">
            <option value="कार्यकर्ता विचार">कार्यकर्ता विचार</option>
            <option value="आधिकारिक सूचना">आधिकारिक सूचना</option>
            <option value="कार्यक्रम अपडेट">कार्यक्रम अपडेट</option>
          </select>
          <textarea id="pText" rows="3" placeholder="अपना संदेश लिखें... *" required></textarea>
          <input type="url" id="pYoutube" placeholder="YouTube वीडियो लिंक (वैकल्पिक)">
          <label style="font-size:12px; color:#94a3b8; display:block; margin-top:6px;">फ़ोटो चुनें (वैकल्पिक):</label>
          <input type="file" id="pPhoto" accept="image/*">
          <button type="submit" class="submit-btn" id="submitPostBtn">पोस्ट प्रकाशित करें</button>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);
}
createModals();

const joinModal = document.getElementById("joinModal");
const openJoinBtn = document.getElementById("openJoinBtn");
const closeJoinModal = document.getElementById("closeJoinModal");

if (openJoinBtn) openJoinBtn.onclick = () => (joinModal.style.display = "flex");
if (closeJoinModal) closeJoinModal.onclick = () => (joinModal.style.display = "none");

// सदस्यता फॉर्म सबमिट करें -> Firestore 'members' कलेक्शन
document.getElementById("memberForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitMemberBtn");
  btn.disabled = true;
  btn.textContent = "सेव हो रहा है...";

  try {
    await db.collection("members").add({
      name: document.getElementById("mName").value.trim(),
      phone: document.getElementById("mPhone").value.trim(),
      district: document.getElementById("mDistrict").value.trim(),
      role: document.getElementById("mRole").value,
      bio: document.getElementById("mBio").value.trim(),
      status: "pending",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("✅ आपका सदस्यता आवेदन सफलतापूर्वक दर्ज हो गया है! शीघ्र ही एडमिन पैनल आपसे संपर्क करेगा।");
    document.getElementById("memberForm").reset();
    joinModal.style.display = "none";
  } catch (err) {
    console.error("Error saving member:", err);
    alert("⚠️ डेटा सेव करने में त्रुटि हुई। कृपया सुनिश्चित करें कि Firestore चालू है।");
  } finally {
    btn.disabled = false;
    btn.textContent = "आवेदन जमा करें";
  }
});

// ==========================================
// 3. फ़ोटो कंप्रेसर (बिना Storage कार्ड के मुफ़्त में Firestore में सेव करने हेतु)
// ==========================================
function compressImage(file) {
  return new Promise((resolve) => {
    if (!file) return resolve("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxWidth = 650;
        const scale = maxWidth / img.width;
        canvas.width = img.width > maxWidth ? maxWidth : img.width;
        canvas.height = img.width > maxWidth ? img.height * scale : img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.65));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// YouTube URL से Embed ID निकालें
function getYouTubeEmbed(url) {
  if (!url) return "";
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

// ==========================================
// 4. जनसंवाद पोस्ट बनाना और लाइव दिखाना
// ==========================================
const feedContainer = document.getElementById("feedContainer");
if (feedContainer) {
  const newPostBtn = document.createElement("button");
  newPostBtn.className = "join-btn";
  newPostBtn.style.cssText = "width:100%; margin-bottom:12px; padding:10px; font-size:14px;";
  newPostBtn.innerHTML = "✍️ नया विचार / वीडियो / फ़ोटो पोस्ट करें";
  newPostBtn.onclick = () => (document.getElementById("postModal").style.display = "flex");
  feedContainer.parentNode.insertBefore(newPostBtn, feedContainer);
}

document.getElementById("closePostModal").onclick = () => {
  document.getElementById("postModal").style.display = "none";
};

document.getElementById("postForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("submitPostBtn");
  btn.disabled = true;
  btn.textContent = "प्रकाशित हो रहा है...";

  try {
    const photoFile = document.getElementById("pPhoto").files[0];
    const photoBase64 = await compressImage(photoFile);
    const ytLink = document.getElementById("pYoutube").value.trim();

    await db.collection("posts").add({
      author: document.getElementById("pAuthor").value.trim(),
      tag: document.getElementById("pTag").value,
      text: document.getElementById("pText").value.trim(),
      youtubeUrl: ytLink,
      photoData: photoBase64,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("🎉 आपकी पोस्ट जनसंवाद मंच पर लाइव हो गई है!");
    document.getElementById("postForm").reset();
    document.getElementById("postModal").style.display = "none";
  } catch (err) {
    console.error("Post Error:", err);
    alert("⚠️ पोस्ट सेव करने में समस्या आई। कृपया इंटरनेट और Firestore जांचें।");
  } finally {
    btn.disabled = false;
    btn.textContent = "पोस्ट प्रकाशित करें";
  }
});

// Firestore से लाइव पोस्ट लोड करें
db.collection("posts").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
  if (!feedContainer) return;
  let postsHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    const embedUrl = getYouTubeEmbed(data.youtubeUrl);

    postsHTML += `
      <div class="feed-card">
        <div class="feed-header">
          <span class="feed-user">${data.author || "कार्यकर्ता"}</span>
          <span class="feed-tag">${data.tag || "विचार"}</span>
        </div>
        <p class="feed-text">${data.text}</p>
        ${data.photoData ? `<img src="${data.photoData}" style="width:100%; border-radius:10px; margin-top:8px;" alt="Post Photo">` : ""}
        ${embedUrl ? `<div class="media-preview" style="padding:0; overflow:hidden;"><iframe width="100%" height="200" src="${embedUrl}" frameborder="0" allowfullscreen></iframe></div>` : ""}
      </div>
    `;
  });

  if (postsHTML !== "") {
    feedContainer.innerHTML = postsHTML;
  }
});

// ==========================================
// 5. बॉटम नेविगेशन और एडमिन कार्ड क्लिक
// ==========================================
document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
    const tab = item.getAttribute("data-tab");

    if (tab === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (tab === "admin") {
      document.getElementById("adminList")?.scrollIntoView({ behavior: "smooth" });
    } else if (tab === "profile") {
      joinModal.style.display = "flex";
    } else if (tab === "settings") {
      alert("⚙️ KSJP आधिकारिक ऐप v1.0\n• सर्वर: Firebase Cloud (ksjp-party-portal)\n• स्थिति: ऑनलाइन एवं सुरक्षित");
    }
  });
});

document.querySelectorAll(".admin-card").forEach((card) => {
  card.addEventListener("click", () => {
    if (card.classList.contains("vacant")) {
      joinModal.style.display = "flex";
    } else {
      alert("🛡️ मुख्य एडमिन: मनीष कश्यप\nपद: संस्थापक एवं राष्ट्रीय अध्यक्ष\nकेवट समाज जनशक्ति पार्टी");
    }
  });
});
