import Channel from "common/scripts/channel.js";

const channel = new Channel();

function getTextNodes(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            if (!node) return NodeFilter.FILTER_REJECT;
            const text = node.nodeValue || "";
            if (!text.trim()) return NodeFilter.FILTER_REJECT;
            if (
                node.parentElement &&
                (node.parentElement.tagName === "SCRIPT" || node.parentElement.tagName === "STYLE")
            ) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
}

async function getLanguageSetting() {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.get("languageSetting", (res) => {
                const ls = (res && res.languageSetting) || { sl: "auto", tl: "en" };
                resolve(ls);
            });
        } catch {
            resolve({ sl: "auto", tl: "en" });
        }
    });
}

async function translatePageDom() {
    try {
        const { sl, tl } = await getLanguageSetting();
        const nodes = getTextNodes(document);
        const unique = new Map();
        for (const node of nodes) {
            const text = (node.nodeValue || "").trim();
            if (!unique.has(text)) unique.set(text, []);
            unique.get(text).push(node);
        }
        // 배치 처리로 API 부하와 깜빡임 완화
        const entries = Array.from(unique.entries());
        for (let i = 0; i < entries.length; i += 40) {
            const batch = entries.slice(i, i + 40);
            await Promise.all(
                batch.map(async ([text, nodeList]) => {
                    let translated = text;
                    try {
                        const res = await channel.request("translate_text_quiet", { text, sl, tl });
                        translated =
                            (res && (res.translatedText || res.text || res.mainMeaning || "")) ||
                            text;
                    } catch {}
                    if (translated && translated !== text) {
                        for (const node of nodeList) node.nodeValue = translated;
                    }
                })
            );
        }
    } catch {}
}

// Listen channel trigger explicitly
channel.on("start_dom_page_translate", () => translatePageDom());
// 사파리에선 항상 DOM 번역 우선
try {
    const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua) && !/Edg\//.test(ua);
    if (isSafari) setTimeout(() => translatePageDom(), 0);
} catch {}

// Opportunistic fallback when classic Google injection cannot run
channel.on("start_page_translate", () => {
    try {
        const ok = !!(
            window.google &&
            window.google.translate &&
            window.google.translate.TranslateElement
        );
        if (!ok) translatePageDom();
    } catch {
        translatePageDom();
    }
});

// --- 동적 컨텐츠 대응: MutationObserver/Shadow DOM/속성 텍스트 번역 ---
function translateAttributes(element, tlPair) {
    const { sl, tl } = tlPair;
    const attrNames = ["alt", "title", "placeholder", "aria-label"];    
    for (const name of attrNames) {
        try {
            const val = element.getAttribute(name);
            if (val && val.trim()) {
                channel.request("translate_text_quiet", { text: val, sl, tl }).then((res) => {
                    const translated = (res && (res.translatedText || res.text)) || val;
                    if (translated && translated !== val) element.setAttribute(name, translated);
                }).catch(() => {});
            }
        } catch {}
    }
}

async function startDynamicObservers() {
    const lang = await getLanguageSetting();

    // 라우팅 감지(SPA)
    try {
        let lastHref = location.href;
        const push = history.pushState;
        const replace = history.replaceState;
        history.pushState = function() { push.apply(this, arguments); setTimeout(checkUrlChange, 0); };
        history.replaceState = function() { replace.apply(this, arguments); setTimeout(checkUrlChange, 0); };
        window.addEventListener("popstate", checkUrlChange, { passive: true });
        function checkUrlChange() {
            if (lastHref !== location.href) {
                lastHref = location.href;
                translatePageDom();
            }
        }
    } catch {}

    // MutationObserver로 텍스트/속성 변경 추적
    try {
        const observer = new MutationObserver((mutations) => {
            let needRerun = false;
            for (const m of mutations) {
                if (m.type === "characterData") {
                    needRerun = true; break;
                }
                if (m.type === "childList" && (m.addedNodes && m.addedNodes.length)) {
                    needRerun = true; break;
                }
                if (m.type === "attributes") {
                    translateAttributes(m.target, lang);
                }
            }
            if (needRerun) {
                // 과도한 호출 방지 디바운스
                clearTimeout(startDynamicObservers._t);
                startDynamicObservers._t = setTimeout(() => translatePageDom(), 220);
            }
        });
        observer.observe(document.documentElement || document.body, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ["alt", "title", "placeholder", "aria-label"],
        });
    } catch {}

    // 열려있는 ShadowRoots 순회 번역(열린 shadow만)
    try {
        const visited = new WeakSet();
        function traverse(node) {
            if (!node || visited.has(node)) return;
            visited.add(node);
            if (node.shadowRoot) {
                translatePageDom();
                traverse(node.shadowRoot);
            }
            const children = node.children || [];
            for (const c of children) traverse(c);
        }
        traverse(document.documentElement);
    } catch {}
}

// 자동 시작: 문서가 준비된 뒤 관찰자 가동
try {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => startDynamicObservers(), { once: true });
    } else {
        setTimeout(() => startDynamicObservers(), 0);
    }
} catch {}
