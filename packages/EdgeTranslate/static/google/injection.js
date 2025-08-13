// Restored minimal Google injection used by Chrome/Firefox builds.
(function () {
    let uid = "1E07F158C6FA4460B352973E9693B329";
    let teId = `TE_${uid}`;
    let cbId = `TECB_${uid}`;

    let injection_ele = document.getElementById("google-translate-injection");
    this.USER_LANG = injection_ele && injection_ele.getAttribute("user-lang");
    this.EDGE_TRANSLATE_URL = injection_ele && injection_ele.getAttribute("edge-translate-url");

    function show() {
        window.setTimeout(function () {
            window[teId].showBanner(true);
        }, 10);
    }

    function newElem() {
        // eslint-disable-next-line no-undef
        let elem = new google.translate.TranslateElement({
            autoDisplay: false,
            floatPosition: 0,
            multilanguagePage: true,
            pageLanguage: "auto",
        });
        return elem;
    }

    if (window[teId]) {
        show();
    } else if (!window.google || !window.google.translate || !window.google.translate.TranslateElement) {
        if (!window[cbId]) {
            window[cbId] = function () {
                window[teId] = newElem();
                show();
            };
        }

        let s = document.createElement("script");
        s.src = `${this.EDGE_TRANSLATE_URL}google/elms/elm_${this.USER_LANG}.js`;
        s.setAttribute("referrerpolicy", "no-referrer");
        s.integrity = "";
        document.getElementsByTagName("head")[0].appendChild(s);
    }
})();


