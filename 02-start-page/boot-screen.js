// 02-start-page/boot-screen.js
// सीधे मोबाइल से असली स्क्रीन माप (window.innerWidth / innerHeight) पूछकर 100% सटीक सेंटरिंग

export async function startPublicBoot() {
  const bootEl = document.getElementById("boot-screen");
  const portalEl = document.getElementById("portal-screen");
  if (!bootEl) return;

  if (portalEl) portalEl.style.setProperty("display", "none", "important");

  // मोबाइल से असली चौड़ाई और ऊँचाई पूछकर तुरंत लागू करने वाला फ़ंक्शन
  const syncDeviceScreenSize = () => {
    const w = window.innerWidth || document.documentElement.clientWidth;
    const h = window.innerHeight || document.documentElement.clientHeight;
    bootEl.style.cssText = `
      position: fixed !important;
      top: 0px !important;
      left: 0px !important;
      width: ${w}px !important;
      height: ${h}px !important;
      margin: 0px !important;
      padding: 20px !important;
      box-sizing: border-box !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
      background: linear-gradient(180deg, #fff7ed 0%, #ffffff 50%, #f0fdf4 100%) !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    `;
  };

  syncDeviceScreenSize();
  window.addEventListener("resize", syncDeviceScreenSize);

  const deviceW = window.innerWidth || 360;
  const logoSize = Math.round(Math.min(deviceW * 0.24, 96));
  const barWidth = Math.round(Math.min(deviceW * 0.62, 230));

  bootEl.innerHTML = `
    <div style="width:${logoSize}px;height:${logoSize}px;border-radius:50%;background:#ffffff;border:3.5px solid #ff6b00;box-shadow:0 0 0 3.5px #16a34a, 0 10px 25px rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:18px;flex-shrink:0;">
      <img id="boot-party-logo" src="" alt="KSJP" style="width:100%;height:100%;object-fit:cover;display:none;" />
      <span id="boot-logo-fallback" style="font-size:24px;font-weight:900;color:#ff6b00;">KSJP</span>
    </div>

    <div style="font-size:20px;font-weight:900;color:#0f172a;margin-bottom:4px;">
      केवट समाज जनशक्ति पार्टी
    </div>
    <div style="font-size:12.5px;font-weight:700;color:#16a34a;margin-bottom:24px;">
      एकजुट समाज, सशक्त नेतृत्व
    </div>

    <div style="width:${barWidth}px;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:12px;">
      <div id="boot-progress" style="width:0%;height:100%;background:linear-gradient(90deg,#ff6b00,#16a34a);transition:width 2.9s linear;"></div>
    </div>

    <div id="boot-status-text" style="font-size:12.5px;font-weight:700;color:#475569;">
      आधिकारिक मंच लोड हो रहा है... कृपया 3 सेकंड रुकें
    </div>

    <button id="boot-retry-btn" style="display:none;margin-top:16px;padding:10px 22px;background:#ff6b00;color:#fff;border:none;border-radius:999px;font-weight:800;font-size:13px;cursor:pointer;">
      पुनः प्रयास करें 🔄
    </button>
  `;

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

  setTimeout(() => {
    const bar = document.getElementById("boot-progress");
    if (bar) bar.style.width = "100%";
  }, 50);

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
      window.removeEventListener("resize", syncDeviceScreenSize);
      bootEl.style.setProperty("display", "none", "important");
      if (portalEl) portalEl.style.setProperty("display", "block", "important");
    }
  } catch (err) {
    statusEl.style.color = "#dc2626";
    statusEl.textContent = "⚠️ नेटवर्क धीमा है या अगला फ़ोल्डर अभी लोड नहीं हुआ है।";
    retryBtn.style.display = "inline-block";
  }
}
