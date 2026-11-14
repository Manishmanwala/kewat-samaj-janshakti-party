// 02-start-page/boot-screen.js
// बिना किसी ग्लिच के पहले मिलीसेकंड से ही 100% सेंटर में लोडिंग स्क्रीन

export async function startPublicBoot() {
  const bootEl = document.getElementById("boot-screen");
  if (!bootEl) return;

  // पुरानी किसी भी CSS को रोकने के लिए सख्त स्टाइल लॉक
  if (!document.getElementById("ksjp-boot-lock-style")) {
    const st = document.createElement("style");
    st.id = "ksjp-boot-lock-style";
    st.textContent = `
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        overflow: hidden !important;
        background: #ffffff !important;
      }
      #boot-screen, #boot-screen * {
        box-sizing: border-box !important;
      }
      #boot-screen {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100dvh !important;
        margin: 0 !important;
        padding: 24px !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        text-align: center !important;
        background: linear-gradient(180deg, #fff7ed 0%, #ffffff 50%, #f0fdf4 100%) !important;
        z-index: 99999 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      }
    `;
    document.head.appendChild(st);
  }

  bootEl.innerHTML = `
    <div style="width:92px;height:92px;border-radius:50%;background:#ffffff;border:3.5px solid #ff6b00;box-shadow:0 0 0 3.5px #16a34a, 0 10px 25px rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;overflow:hidden;margin:0 auto 18px auto;flex-shrink:0;">
      <img id="boot-party-logo" src="" alt="KSJP" style="width:100%;height:100%;object-fit:cover;display:none;" />
      <span id="boot-logo-fallback" style="font-size:24px;font-weight:900;color:#ff6b00;">KSJP</span>
    </div>

    <div style="font-size:20px;font-weight:900;color:#0f172a;text-align:center;margin:0 0 4px 0;width:100%;">
      केवट समाज जनशक्ति पार्टी
    </div>
    <div style="font-size:12.5px;font-weight:700;color:#16a34a;text-align:center;margin:0 0 26px 0;width:100%;">
      एकजुट समाज, सशक्त नेतृत्व
    </div>

    <!-- लोडिंग बार -->
    <div style="width:220px;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin:0 auto 12px auto;">
      <div id="boot-progress" style="width:0%;height:100%;background:linear-gradient(90deg,#ff6b00,#16a34a);transition:width 2.8s ease-out;"></div>
    </div>

    <div id="boot-status-text" style="font-size:12.5px;font-weight:700;color:#475569;text-align:center;width:100%;">
      आधिकारिक मंच लोड हो रहा है... कृपया 3 सेकंड रुकें
    </div>

    <button id="boot-retry-btn" style="display:none;margin:16px auto 0 auto;padding:10px 22px;background:#ff6b00;color:#fff;border:none;border-radius:999px;font-weight:800;font-size:13px;cursor:pointer;">
      पुनः प्रयास करें 🔄
    </button>
  `;

  // लोगो लोड करना
  try {
    const res = await fetch("https://api.github.com/repos/Manishmanwala/ksjp-control-room/contents/");
    if (res.ok) {
      const files = await res.json();
      const logo = files.find(f => f.type === "file" && (f.name.startsWith("Screenshot_") || /\.(jpg|jpeg|png|webp)$/i.test(f.name)));
      if (logo?.download_url) {
        const img = document.getElementById("boot-party-logo");
        const fb = document.getElementById("boot-logo-fallback");
        img.src = logo.download_url;
        img.style.display = "block";
        fb.style.display = "none";
      }
    }
  } catch (e) {}

  requestAnimationFrame(() => {
    const bar = document.getElementById("boot-progress");
    if (bar) bar.style.width = "100%";
  });

  const statusEl = document.getElementById("boot-status-text");
  const retryBtn = document.getElementById("boot-retry-btn");
  retryBtn.onclick = () => location.reload();

  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!navigator.onLine) {
    statusEl.style.color = "#dc2626";
    statusEl.textContent = "⚠️ इंटरनेट कनेक्शन बंद है! कृपया अपना डेटा चालू करें।";
    retryBtn.style.display = "inline-block";
    return;
  }

  try {
    const portalMod = await import("../03-ui-layout/public-portal.js");
    if (portalMod && portalMod.mountPublicPortal) {
      await portalMod.mountPublicPortal();
      bootEl.style.display = "none";
    }
  } catch (err) {
    statusEl.style.color = "#dc2626";
    statusEl.textContent = "⚠️ नेटवर्क धीमा है या अगला फ़ोल्डर अभी लोड नहीं हुआ है।";
    retryBtn.style.display = "inline-block";
  }
}
