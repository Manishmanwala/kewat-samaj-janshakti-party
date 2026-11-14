// 02-start-page/boot-screen.js
// 3 सेकंड की एंट्री व लोडिंग स्क्रीन + इंटरनेट व क्लाउड कनेक्शन जाँच

export async function startPublicBoot() {
  const bootEl = document.getElementById("boot-screen");
  if (!bootEl) return;

  bootEl.style.cssText = `
    position: fixed; inset: 0; width: 100vw; height: 100dvh;
    background: linear-gradient(180deg, #fff7ed 0%, #ffffff 50%, #f0fdf4 100%);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 24px; z-index: 99999; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  `;

  bootEl.innerHTML = `
    <div style="width:92px;height:92px;border-radius:50%;background:#ffffff;border:3.5px solid #ff6b00;box-shadow:0 0 0 3.5px #16a34a, 0 10px 25px rgba(0,0,0,0.12);display:flex;align-items:center;justify-content:center;overflow:hidden;margin-bottom:18px;">
      <img id="boot-party-logo" src="" alt="KSJP" style="width:100%;height:100%;object-fit:cover;display:none;" />
      <span id="boot-logo-fallback" style="font-size:24px;font-weight:900;color:#ff6b00;">KSJP</span>
    </div>

    <div style="font-size:20px;font-weight:900;color:#0f172a;text-align:center;margin-bottom:4px;">
      केवट समाज जनशक्ति पार्टी
    </div>
    <div style="font-size:12.5px;font-weight:700;color:#16a34a;margin-bottom:26px;">
      एकजुट समाज, सशक्त नेतृत्व
    </div>

    <!-- लोडिंग बार -->
    <div style="width:220px;height:6px;background:#e2e8f0;border-radius:999px;overflow:hidden;margin-bottom:12px;">
      <div id="boot-progress" style="width:0%;height:100%;background:linear-gradient(90deg,#ff6b00,#16a34a);transition:width 2.8s ease-out;"></div>
    </div>

    <div id="boot-status-text" style="font-size:12.5px;font-weight:700;color:#475569;text-align:center;">
      आधिकारिक मंच लोड हो रहा है... कृपया 3 सेकंड रुकें
    </div>

    <button id="boot-retry-btn" style="display:none;margin-top:16px;padding:10px 22px;background:#ff6b00;color:#fff;border:none;border-radius:999px;font-weight:800;font-size:13px;cursor:pointer;">
      पुनः प्रयास करें 🔄
    </button>
  `;

  // लोगो लोड करने का प्रयास (यदि रिपॉज़िटरी में लोगो फ़ाइल मौजूद हो)
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

  // प्रोग्रेस बार एनिमेशन शुरू करना
  requestAnimationFrame(() => {
    const bar = document.getElementById("boot-progress");
    if (bar) bar.style.width = "100%";
  });

  const statusEl = document.getElementById("boot-status-text");
  const retryBtn = document.getElementById("boot-retry-btn");
  retryBtn.onclick = () => location.reload();

  // ठीक 3 सेकंड इंतज़ार + इंटरनेट व क्लाउड जाँच
  await new Promise((resolve) => setTimeout(resolve, 3000));

  if (!navigator.onLine) {
    statusEl.style.color = "#dc2626";
    statusEl.textContent = "⚠️ इंटरनेट कनेक्शन बंद है! कृपया अपना डेटा चालू करें।";
    retryBtn.style.display = "inline-block";
    return;
  }

  try {
    // 03-ui-layout/public-portal.js को लोड करके स्क्रीन खोलना
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
