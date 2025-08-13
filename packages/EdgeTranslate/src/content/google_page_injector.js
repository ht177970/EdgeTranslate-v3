import Channel from "common/scripts/channel.js";

const channel = new Channel();

async function injectGooglePageTranslator() {
    try {
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                JSON.stringify({ type: "service", service: "get_lang" }),
                (res) => resolve(res)
            );
        });

        let s = document.getElementById("google-translate-injection");
        if (s) s.remove();

        const userLang = (response && response.lang) || "zh-CN";

        s = document.createElement("script");
        s.id = "google-translate-injection";
        s.src = `${chrome.runtime.getURL("")}google/injection.js`;
        s.setAttribute("user-lang", userLang);
        s.setAttribute("edge-translate-url", chrome.runtime.getURL(""));
        s.setAttribute("referrerpolicy", "no-referrer");
        s.integrity = "";
        document.head.appendChild(s);

        channel.emit("start_page_translate", { translator: "google" });
    } catch {}
}

channel.on("inject_page_translate", () => {
    injectGooglePageTranslator();
});

try {
    // 사파리에선 manifest에서 이 파일이 로드되지 않음
    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", () => injectGooglePageTranslator(), {
            once: true,
        });
    } else {
        setTimeout(() => injectGooglePageTranslator(), 0);
    }
} catch {}


