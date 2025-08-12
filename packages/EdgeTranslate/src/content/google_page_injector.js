import Channel from "common/scripts/channel.js";

const channel = new Channel();

async function injectGooglePageTranslator() {
    try {
        // Ask background for user UI language
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
        document.head.appendChild(s);

        // Notify UI layer to start banner handling just like background would
        channel.emit("start_page_translate", { translator: "google" });
    } catch (error) {
        // No-op; rely on background fallback if needed
    }
}

// Listen for explicit inject request from background
channel.on("inject_page_translate", () => {
    injectGooglePageTranslator();
});
