// 03-ui-layout/public-portal.js
// केसरिया-सफेद-हरा मुख्य लेआउट (चेकपॉइंट फ़ोल्डर)

export async function mountPublicPortal() {
  const portalEl = document.getElementById("portal-screen");
  if (!portalEl) return;

  if (!document.getElementById("ksjp-public-styles")) {
    const style = document.createElement("style");
    style.id = "ksjp-public-styles";
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }
      html, body { background: #f8fafc; color: #0f172a; height: 100dvh; width: 100vw; overflow: hidden; }
      .portal-shell { position: fixed; inset: 0; width: 100vw; height: 100dvh; display: flex; flex-direction: column; background: #f8fafc; overflow: hidden; }

      /* स्थायी टॉप हेडर */
      .top-header {
        height: 60px; width: 100%; padding: 0 14px;
        background: linear-gradient(90deg, #ff6b00 0%, #ff8533 100%);
        color: #ffffff; display: flex; align-items: center; justify-content: space-between;
        border-bottom: 3px solid #16a34a; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 50;
      }
      .brand-left { display: flex; align-items: center; gap: 10px; overflow: hidden; }
      .party-logo {
        width: 44px; height: 44px; border-radius: 50%; background: #ffffff; color: #16a34a;
        border: 2.5px solid #16a34a; font-weight: 900; font-size: 13px; overflow: hidden;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .party-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .party-name-box { display: flex; flex-direction: column; overflow: hidden; }
      .party-title { font-size: 15.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .party-sub { font-size: 10.5px; opacity: 0.94; font-weight: 600; }
      .bell-btn {
        width: 38px; height: 38px; border-radius: 50%; background: #ffffff; color: #ff6b00;
        border: 2px solid #16a34a; display: flex; align-items: center; justify-content: center;
        font-size: 18px; cursor: pointer; position: relative; flex-shrink: 0;
      }
      .bell-dot {
        position: absolute; top: -2px; right: -2px; width: 11px; height: 11px;
        background: #ef4444; border: 2px solid #fff; border-radius: 50%; display: none;
      }

      /* मुख्य बदलते हुए टैब पेज */
      .main-viewport { flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative; }
      .tab-page { display: none; flex: 1; flex-direction: column; overflow: hidden; }
      .tab-page.active { display: flex; }

      /* पार्टीशन 1: फॉलो (दाएं से बाएं स्क्रोल) */
      .section-box { background: #ffffff; padding: 9px 12px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; }
      .sec-label { font-size: 11.5px; font-weight: 800; color: #ff6b00; margin-bottom: 7px; display: flex; justify-content: space-between; }
      .horizontal-scroll { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
      .horizontal-scroll::-webkit-scrollbar { display: none; }
      .follow-item { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; width: 56px; cursor: pointer; }
      .follow-avatar {
        width: 46px; height: 46px; border-radius: 50%; background: #fff7ed; color: #ea580c;
        border: 2px solid #ff6b00; font-weight: 800; font-size: 15px; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .follow-name { font-size: 10.5px; font-weight: 600; color: #334155; width: 100%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* पार्टीशन 2: कॉन्फ्रेंस रूम */
      .conf-banner {
        margin: 8px 12px; padding: 10px 14px; border-radius: 14px;
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border: 1.5px solid #16a34a; display: flex; align-items: center; gap: 12px;
        cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 6px rgba(22, 163, 74, 0.12);
      }
      .conf-icon {
        width: 42px; height: 42px; border-radius: 50%; background: #16a34a; color: #fff;
        font-size: 19px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }

      /* पार्टीशन 3: शीर्ष नेतृत्व पैनल (1 Site Manager 'S' + 5 Fixed Admins) */
      .leaders-strip { background: #fff7ed; padding: 9px 10px; border-top: 1px solid #fed7aa; border-bottom: 1px solid #fed7aa; flex-shrink: 0; }
      .leaders-row { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
      .leader-node { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; flex: 1; min-width: 0; }
      .avatar-s {
        width: 46px; height: 46px; border-radius: 50%; background: linear-gradient(135deg, #ff6b00, #c2410c);
        color: #fff; border: 2.5px solid #16a34a; font-weight: 900; font-size: 17px; overflow: hidden;
        display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(255,107,0,0.3);
      }
      .avatar-adm {
        width: 38px; height: 38px; border-radius: 50%; background: #ffffff; color: #16a34a;
        border: 2px solid #16a34a; font-weight: 800; font-size: 12.5px; overflow: hidden;
        display: flex; align-items: center; justify-content: center;
      }
      .leader-tag { font-size: 10px; font-weight: 700; color: #1e293b; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      /* पार्टीशन 4: अन्य सदस्य (ऊपर से नीचे अनलिमिटेड स्क्रोल) */
      .members-list { flex: 1; overflow-y: auto; padding: 8px 12px 24px 12px; display: flex; flex-direction: column; gap: 8px; }
      .member-row {
        background: #ffffff; padding: 10px 12px; border-radius: 12px; border: 1px solid #e2e8f0;
        display: flex; align-items: center; gap: 12px; cursor: pointer; user-select: none;
      }
      .member-circle {
        width: 42px; height: 42px; border-radius: 50%; background: #e2e8f0; color: #0f172a;
        font-weight: 800; font-size: 15px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }

      /* टैब 4: सूचना एवं समाचार */
      .sub-tabs { display: flex; background: #fff; border-bottom: 1px solid #cbd5e1; flex-shrink: 0; }
      .sub-tab-btn { flex: 1; padding: 10px; text-align: center; font-size: 13px; font-weight: 800; color: #64748b; border-bottom: 3px solid transparent; cursor: pointer; }
      .sub-tab-btn.active { color: #ff6b00; border-bottom-color: #ff6b00; background: #fff7ed; }
      .split-video-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      .video-half { flex: 1; padding: 10px 12px; display: flex; flex-direction: column; border-bottom: 2px solid #cbd5e1; overflow: hidden; }
      .video-cards-row { flex: 1; display: flex; gap: 12px; overflow-x: auto; align-items: stretch; padding-top: 6px; }
      .vid-card {
        min-width: 240px; background: #0f172a; color: #fff; border-radius: 14px; padding: 12px;
        display: flex; flex-direction: column; justify-content: space-between; border: 2px solid #ff6b00;
      }

      /* नीचे का 5-बटन नेविगेशन बार */
      .bottom-nav {
        height: 66px; width: 100%; background: #ffffff; border-top: 2px solid #e2e8f0;
        display: flex; align-items: center; justify-content: space-around; padding: 0 4px;
        flex-shrink: 0; position: relative; z-index: 60;
      }
      .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; color: #64748b; }
      .nav-item.active { color: #ff6b00; }
      .nav-circle-sm {
        width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9;
        display: flex; align-items: center; justify-content: center; font-size: 15px; border: 1.5px solid #cbd5e1;
      }
      .nav-item.active .nav-circle-sm { background: #fff7ed; border-color: #ff6b00; }
      .nav-label { font-size: 9.5px; font-weight: 800; text-align: center; line-height: 1.1; }
      .nav-profile-center { display: flex; flex-direction: column; align-items: center; justify-content: center; margin-top: -22px; cursor: pointer; padding: 0 6px; }
      .profile-big-circle {
        width: 56px; height: 56px; border-radius: 50%;
        background: linear-gradient(135deg, #ff6b00, #16a34a); color: #ffffff;
        border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.25); overflow: hidden;
        display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px;
      }
      .overlay-screen { position: fixed; inset: 0; background: #f8fafc; z-index: 200; display: none; flex-direction: column; }
    `;
    document.head.appendChild(style);
  }

  portalEl.style.display = "block";
  portalEl.innerHTML = `
    <div class="portal-shell">
      <header class="top-header">
        <div class="brand-left">
          <div class="party-logo" id="pub-party-logo">KSJP</div>
          <div class="party-name-box">
            <div class="party-title">केवट समाज जनशक्ति पार्टी</div>
            <div class="party-sub">एकजुट समाज, सशक्त नेतृत्व</div>
          </div>
        </div>
        <button class="bell-btn" id="pub-bell-btn" title="सूचना केंद्र">
          🔔<span class="bell-dot" id="pub-bell-dot"></span>
        </button>
      </header>

      <main class="main-viewport">
        <!-- टैब 1: बातचीत करें -->
        <section id="tab-chat" class="tab-page active">
          <div class="section-box">
            <div class="sec-label">
              <span>★ फॉलो किए गए सदस्य</span>
              <span style="color:#64748b;font-weight:600;">दाएं-बाएं स्क्रोल करें →</span>
            </div>
            <div class="horizontal-scroll" id="follow-scroll"></div>
          </div>

          <div class="conf-banner" id="pub-conf-btn">
            <div class="conf-icon">🎙️</div>
            <div style="flex:1;">
              <div style="font-size:14.5px;font-weight:800;color:#14532d;">कॉन्फ्रेंस रूम</div>
              <div style="font-size:11.5px;color:#166534;font-weight:600;">सार्वजनिक समूह चर्चा कक्ष • जुड़ने के लिए टच करें</div>
            </div>
            <span style="background:#16a34a;color:#fff;font-size:10.5px;font-weight:800;padding:4px 10px;border-radius:999px;">समूह</span>
          </div>

          <div class="leaders-strip">
            <div class="sec-label" style="margin-bottom:6px;">
              <span>🛡️ शीर्ष नेतृत्व एवं एडमिन पैनल (6 स्थायी पद)</span>
            </div>
            <div class="leaders-row" id="pub-leaders-row">
              <div class="leader-node" data-seat="site-manager">
                <div class="avatar-s">S</div>
                <span class="leader-tag">मनीष (S)</span>
              </div>
              ${[1, 2, 3, 4, 5].map(n => `
                <div class="leader-node" data-seat="admin-${n}">
                  <div class="avatar-adm">A${n}</div>
                  <span class="leader-tag">एडमिन ${n}</span>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="members-list" id="members-vertical-list"></div>
        </section>

        <!-- टैब 2: सोशल मीडिया -->
        <section id="tab-social" class="tab-page" style="padding:14px;overflow-y:auto;">
          <h3 style="font-size:16px;font-weight:800;color:#ff6b00;margin-bottom:10px;">📱 आधिकारिक सोशल मीडिया हब</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
            <div class="soc-platform-btn" data-plat="YouTube" style="background:#fff;border:2px solid #ef4444;border-radius:14px;padding:16px;text-align:center;cursor:pointer;">
              <div style="font-size:28px;margin-bottom:4px;">▶️</div>
              <div style="font-weight:800;font-size:14px;">YouTube चैनल</div>
              <div style="font-size:11px;color:#64748b;">जुड़े हुए अकाउंट देखें</div>
            </div>
            <div class="soc-platform-btn" data-plat="Instagram" style="background:#fff;border:2px solid #d946ef;border-radius:14px;padding:16px;text-align:center;cursor:pointer;">
              <div style="font-size:28px;margin-bottom:4px;">📸</div>
              <div style="font-weight:800;font-size:14px;">Instagram पेज</div>
              <div style="font-size:11px;color:#64748b;">रील्स एवं लाइव पेज</div>
            </div>
          </div>
          <div id="social-channel-details" style="background:#fff;border-radius:14px;padding:14px;border:1px solid #cbd5e1;">
            <div style="font-size:13px;font-weight:700;color:#334155;">ऊपर किसी भी प्लेटफॉर्म पर टच करके एडमिन द्वारा जोड़े गए आधिकारिक अकाउंट देखें।</div>
          </div>
        </section>

        <!-- टैब 3: प्रोफ़ाइल -->
        <section id="tab-profile" class="tab-page" style="padding:14px;overflow-y:auto;">
          <div id="pub-profile-card" style="background:#fff;border-radius:16px;padding:16px;border:1.5px solid #ff6b00;text-align:center;margin-bottom:12px;"></div>
          <div style="font-size:13px;font-weight:800;margin-bottom:8px;">मेरी पोस्ट और गतिविधियाँ:</div>
          <div id="pub-my-posts" style="display:flex;flex-direction:column;gap:8px;"></div>
        </section>

        <!-- टैब 4: सूचना एवं समाचार -->
        <section id="tab-news" class="tab-page">
          <div class="sub-tabs">
            <div id="sub-btn-vid" class="sub-tab-btn active">🎬 ज़रूरी वीडियो (YT / Insta)</div>
            <div id="sub-btn-txt" class="sub-tab-btn">📰 टेक्स्ट, फ़ोटो एवं लिंक</div>
          </div>

          <div id="news-vid-pane" class="split-video-container">
            <div class="video-half" style="background:#fff5f5;">
              <div style="font-size:12px;font-weight:800;color:#dc2626;">▶️ YouTube ज़रूरी वीडियो (दाएं-बाएं स्क्रोल करें →)</div>
              <div class="video-cards-row" id="yt-important-videos"></div>
            </div>
            <div class="video-half" style="background:#fdf4ff;border-bottom:none;">
              <div style="font-size:12px;font-weight:800;color:#c026d3;">📸 Instagram ज़रूरी रील्स (दाएं-बाएं स्क्रोल करें →)</div>
              <div class="video-cards-row" id="ig-important-videos"></div>
            </div>
          </div>

          <div id="news-txt-pane" style="display:none;flex:1;padding:12px;overflow-y:auto;flex-direction:column;gap:10px;"></div>
        </section>

        <!-- टैब 5: डालें -->
        <section id="tab-post" class="tab-page" style="padding:14px;overflow-y:auto;">
          <div style="background:#fff;padding:16px;border-radius:16px;border:1.5px solid #16a34a;">
            <h3 style="font-size:16px;font-weight:800;color:#16a34a;margin-bottom:10px;">✍️ नया विचार / लिंक / फ़ोटो डालें</h3>
            <textarea id="pub-post-text" rows="4" placeholder="अपना संदेश, विचार या जानकारी यहाँ लिखें..." style="width:100%;padding:10px;border:1.5px solid #cbd5e1;border-radius:12px;font-size:14px;margin-bottom:8px;"></textarea>
            <input id="pub-post-link" type="url" placeholder="कोई लिंक जोड़ें (वैकल्पिक)" style="width:100%;padding:9px 12px;border:1.5px solid #cbd5e1;border-radius:10px;font-size:13px;margin-bottom:8px;" />
            <input id="pub-post-photo" type="file" accept="image/*" style="width:100%;font-size:12px;margin-bottom:12px;" />
            <button id="pub-submit-post" style="width:100%;padding:12px;background:linear-gradient(90deg,#ff6b00,#16a34a);color:#fff;border:none;border-radius:999px;font-weight:800;font-size:14px;cursor:pointer;">प्रकाशित करें</button>
          </div>
        </section>
      </main>

      <!-- नीचे का 5-बटन नेविगेशन बार -->
      <nav class="bottom-nav">
        <div class="nav-item active" data-tab="chat">
          <div class="nav-circle-sm">💬</div>
          <span class="nav-label">बातचीत करें</span>
        </div>
        <div class="nav-item" data-tab="social">
          <div class="nav-circle-sm">📱</div>
          <span class="nav-label">सोशल मीडिया</span>
        </div>
        <div class="nav-profile-center" data-tab="profile">
          <div class="profile-big-circle" id="nav-big-avatar">P</div>
          <span class="nav-label" style="color:#0f172a;margin-top:2px;">प्रोफ़ाइल</span>
        </div>
        <div class="nav-item" data-tab="news">
          <div class="nav-circle-sm">📰</div>
          <span class="nav-label">सूचना एवं<br/>समाचार</span>
        </div>
        <div class="nav-item" data-tab="post">
          <div class="nav-circle-sm">➕</div>
          <span class="nav-label">डालें</span>
        </div>
      </nav>

      <!-- ओवरले स्क्रीन -->
      <div id="overlay-box" class="overlay-screen">
        <header class="top-header">
          <div style="display:flex;align-items:center;gap:10px;">
            <button id="ov-back-btn" style="background:rgba(255,255,255,0.25);border:none;color:#fff;padding:6px 12px;border-radius:999px;font-weight:800;cursor:pointer;">← वापस</button>
            <div id="ov-title" style="font-size:15px;font-weight:800;">कक्ष</div>
          </div>
        </header>
        <div id="ov-body" style="flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
        <div id="ov-footer" style="padding:8px 10px;background:#fff;border-top:1px solid #cbd5e1;display:flex;gap:8px;">
          <input id="ov-inp" type="text" placeholder="यहाँ संदेश लिखें..." style="flex:1;padding:10px 14px;border:1.5px solid #cbd5e1;border-radius:999px;font-size:14px;" />
          <button id="ov-send-btn" style="padding:10px 18px;background:#16a34a;color:#fff;border:none;border-radius:999px;font-weight:800;cursor:pointer;">भेजें</button>
        </div>
      </div>
    </div>
  `;

  // वही साझा लोगो (Screenshot_...) ऊपर बाईं तरफ गोल आइकॉन में लगाना
  try {
    const res = await fetch("https://api.github.com/repos/Manishmanwala/ksjp-control-room/contents/");
    if (res.ok) {
      const files = await res.json();
      const logo = files.find(f => f.type === "file" && (f.name.startsWith("Screenshot_") || /\.(jpg|jpeg|png|webp)$/i.test(f.name)));
      if (logo?.download_url) {
        document.getElementById("pub-party-logo").innerHTML = `<img src="${logo.download_url}" alt="KSJP Logo" />`;
      }
    }
  } catch (e) {}

  // टैब बदलने का नियंत्रण
  document.querySelectorAll("[data-tab]").forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-page").forEach(p => p.classList.remove("active"));
      document.getElementById("tab-" + target)?.classList.add("active");
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      if (btn.classList.contains("nav-item")) btn.classList.add("active");
    };
  });

  // सूचना सब-टैब नियंत्रण
  document.getElementById("sub-btn-vid").onclick = () => {
    document.getElementById("sub-btn-vid").classList.add("active");
    document.getElementById("sub-btn-txt").classList.remove("active");
    document.getElementById("news-vid-pane").style.display = "flex";
    document.getElementById("news-txt-pane").style.display = "none";
  };
  document.getElementById("sub-btn-txt").onclick = () => {
    document.getElementById("sub-btn-txt").classList.add("active");
    document.getElementById("sub-btn-vid").classList.remove("active");
    document.getElementById("news-vid-pane").style.display = "none";
    document.getElementById("news-txt-pane").style.display = "flex";
  };

  document.getElementById("ov-back-btn").onclick = () => {
    document.getElementById("overlay-box").style.display = "none";
  };

  // चौथे व पाँचवें फ़ोल्डर (क्लाउड सिंक व अदृश्य एडमिन पावर) को सक्रिय करना
  try {
    const syncMod = await import("../04-cloud-sync/live-bridge.js");
    if (syncMod && syncMod.initLivePublicBridge) {
      await syncMod.initLivePublicBridge();
    }
  } catch (e) {}

  try {
    const shieldMod = await import("../05-admin-shield/invisible-power.js");
    if (shieldMod && shieldMod.initInvisibleAdminPower) {
      await shieldMod.initInvisibleAdminPower();
    }
  } catch (e) {}
}
