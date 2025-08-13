/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/background/library/analytics.js":
/*!*********************************************!*\
  !*** ./src/background/library/analytics.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "sendHitRequest": () => (/* binding */ sendHitRequest)
/* harmony export */ });
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");
/* harmony import */ var common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/logger.js */ "./src/common/scripts/logger.js");




// specification of this module is in: https://developers.google.com/analytics/devguides/collection/protocol/v1/parameters
const ANALYTICS_ACCOUNT = "UA-153659474-1";
const GA_URL = "https://www.google-analytics.com/collect";

/**
 * send hit data to google analytics API
 * "hit type" includes: "pageview", "event"
 * "event type" includes: "click", "open", "installation"
 * @param {string} page page name of the current document
 * @param {string} type type of hit.
 * @param {Object} extraHitData extra hit(request) data
 */
function sendHitRequest(page, type, extraHitData) {
  let documentLocation = typeof document !== "undefined" && document.location ? document.location.origin + document.location.pathname + document.location.search : "chrome-extension://service-worker";
  // 사용자 동의 시에만 전송
  withGoogleAnalytics(() => {
    getUUID(UUID => {
      // establish basic hit data(payload)
      let hitData = {
        v: 1,
        // analytics protocol version
        tid: ANALYTICS_ACCOUNT,
        // analytics protocol version
        cid: UUID,
        // unique user ID
        ul: navigator.language,
        //   user's language setting
        an: chrome.runtime.getManifest().name,
        // the name of this extension
        av: chrome.runtime.getManifest().version,
        // the version number of this extension
        t: type,
        // hit(request) type
        dl: documentLocation,
        // document location
        dp: `/${page}`,
        // document page
        dt: page // document title
      };
      // merge hitData and extraHitData
      Object.assign(hitData, extraHitData);

      // Service Worker 호환성을 위해 fetch API 사용
      if (typeof XMLHttpRequest === "undefined" || typeof window === "undefined") {
        // Service Worker 환경에서는 fetch 사용
        fetch(GA_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: generateURLRequest(hitData)
        }).catch(error => {
          (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)("Analytics 요청 실패 (Service Worker 환경):", error);
        });
      } else {
        // 일반 환경에서는 XMLHttpRequest 사용
        let request = new XMLHttpRequest();
        request.open("POST", GA_URL, true);
        request.send(generateURLRequest(hitData));
      }
    });
  });
}

/**
 * generate url according to the request object
 * @param {Object} requestData object contains request data
 * @returns {string} generated url
 */
function generateURLRequest(requestData) {
  if (!requestData) return "";
  const parts = [];
  for (let key in requestData) {
    if (!Object.prototype.hasOwnProperty.call(requestData, key)) continue;
    const k = encodeURIComponent(key);
    const v = encodeURIComponent(String(requestData[key]));
    parts.push(`${k}=${v}`);
  }
  return parts.join("&");
}

/**
 *
 * @param {function} callback the callback function executed when the result of settings is ready and value of UseGoogleAnalytics is true
 */
function withGoogleAnalytics(callback) {
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_0__.getOrSetDefaultSettings)("OtherSettings", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_0__.DEFAULT_SETTINGS).then(result => {
    if (result.OtherSettings.UseGoogleAnalytics) callback();
  });
}

/**
 * get UUID(unique user ID). If user is new, a new UUID will be generated or return the UUID stored in chrome storage
 * @param {function(UUID)} callback the callback function to be executed when the result is returned. If user is new, set a new UUID. UUID is a function parameter as result
 */
function getUUID(callback) {
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_0__.getOrSetDefaultSettings)("UUID", () => {
    return {
      UUID: generateUUID()
    };
  }).then(result => {
    callback(result.UUID);
  });
}
function generateUUID() {
  let d = new Date().getTime();
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    d += performance.now(); //use high-precision timer if available
  }
  let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : r & 0x3 | 0x8).toString(16);
  });
  return uuid;
}

/***/ }),

/***/ "./src/background/library/blacklist.js":
/*!*********************************************!*\
  !*** ./src/background/library/blacklist.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "addDomainBlacklist": () => (/* binding */ addDomainBlacklist),
/* harmony export */   "addUrlBlacklist": () => (/* binding */ addUrlBlacklist),
/* harmony export */   "removeDomainBlacklist": () => (/* binding */ removeDomainBlacklist),
/* harmony export */   "removeUrlBlacklist": () => (/* binding */ removeUrlBlacklist),
/* harmony export */   "updateBLackListMenu": () => (/* binding */ updateBLackListMenu)
/* harmony export */ });
/* harmony import */ var common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/common.js */ "./src/common/scripts/common.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");



const DISABLED_MARK = "X";

/**
 * 将当前页面的url添加到黑名单
 */
function addUrlBlacklist() {
  addBlacklist("urls", () => {
    disableItems(["add_url_blacklist", "add_domain_blacklist", "remove_domain_blacklist"]);
    enableItems(["remove_url_blacklist"]);
  });

  // change the badge text when add url to blacklist
  chrome.action.setBadgeText({
    text: DISABLED_MARK
  });
}

/**
 * 将当前页面的url移出黑名单
 */
function removeUrlBlacklist() {
  removeBlacklist("urls", () => {
    disableItems(["remove_url_blacklist", "remove_domain_blacklist"]);
    enableItems(["add_url_blacklist", "add_domain_blacklist"]);
  });

  // clear the badge text when remove url from blacklist
  chrome.action.setBadgeText({
    text: ""
  });
}

/**
 * 将当前页面的域名添加到黑名单
 */
function addDomainBlacklist() {
  addBlacklist("domains", () => {
    disableItems(["add_url_blacklist", "add_domain_blacklist", "remove_url_blacklist"]);
    enableItems(["remove_domain_blacklist"]);
  });

  // change the badge text when add domain to blacklist
  chrome.action.setBadgeText({
    text: DISABLED_MARK
  });
}

/**
 * 将当前页面的域名移出黑名单
 */
function removeDomainBlacklist() {
  removeBlacklist("domains", (blacklist, url) => {
    // 如果该url还在url黑名单中
    if (blacklist.urls[url]) {
      disableItems(["add_url_blacklist", "add_domain_blacklist", "remove_domain_blacklist"]);
      enableItems(["remove_url_blacklist"]);
    } else {
      disableItems(["remove_url_blacklist", "remove_domain_blacklist"]);
      enableItems(["add_url_blacklist", "add_domain_blacklist"]);

      // clear the badge text when remove domain from blacklist
      chrome.action.setBadgeText({
        text: ""
      });
    }
  });
}

/**
 * 执行添加黑名单的相关操作
 *
 * @param {String} field 决定将url拉黑还是将域名拉黑
 * @param {Function} callback 回调
 */
function addBlacklist(field, callback) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    if (tabs && tabs[0]) {
      (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.getOrSetDefaultSettings)("blacklist", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS).then(result => {
        let blacklist = result.blacklist;
        let value = field === "urls" ? tabs[0].url : (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.getDomain)(tabs[0].url);
        blacklist[field][value] = true;
        chrome.storage.sync.set({
          blacklist
        }, () => {
          callback(blacklist, tabs[0].url);
        });
      });
    }
  });
}

/**
 * 执行移出黑名单相关操作
 *
 * @param {String} field 决定从域名黑名单中移出还是从url黑名单中移出
 * @param {Function} callback 回调
 */
function removeBlacklist(field, callback) {
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, tabs => {
    if (tabs && tabs[0]) {
      (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.getOrSetDefaultSettings)("blacklist", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS).then(result => {
        let blacklist = result.blacklist;
        let value = field === "urls" ? tabs[0].url : (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.getDomain)(tabs[0].url);
        if (blacklist[field][value]) {
          delete blacklist[field][value];
        }
        chrome.storage.sync.set({
          blacklist
        }, () => {
          callback(blacklist, tabs[0].url);
        });
      });
    }
  });
}

/**
 * 当用户切换到一个页面时，根据该页面是否已经在黑名单中展示不同的context menu项
 *
 * @param {String} url 切换到的页面的url
 */
function updateBLackListMenu(url) {
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.getOrSetDefaultSettings)("blacklist", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS).then(result => {
    if (result.blacklist.domains[(0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.getDomain)(url)]) {
      disableItems(["add_url_blacklist", "remove_url_blacklist", "add_domain_blacklist"]);
      enableItems(["remove_domain_blacklist"]);

      // the domain is in the blacklist and update the badge text
      chrome.action.setBadgeText({
        text: DISABLED_MARK
      });
    } else if (result.blacklist.urls[url]) {
      disableItems(["add_url_blacklist", "add_domain_blacklist", "remove_domain_blacklist"]);
      enableItems(["remove_url_blacklist"]);

      // the url is in the blacklist and update the badge text
      chrome.action.setBadgeText({
        text: DISABLED_MARK
      });
    } else {
      disableItems(["remove_url_blacklist", "remove_domain_blacklist"]);
      enableItems(["add_url_blacklist", "add_domain_blacklist"]);

      // the url and domain is not in the blacklist and clear the badge text
      chrome.action.setBadgeText({
        text: ""
      });
    }
  });
}

/**
 * 启用指定的context menu项
 *
 * @param {String} items
 */
function enableItems(items) {
  items.forEach(item => {
    chrome.contextMenus.update(item, {
      enabled: true,
      visible: true
    }, () => {
      if (chrome.runtime.lastError) {
        (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.log)(`Chrome runtime error: ${chrome.runtime.lastError}`);
      }
    });
  });
}

/**
 * 禁用指定的context menu项
 *
 * @param {String} items
 */
function disableItems(items) {
  items.forEach(item => {
    chrome.contextMenus.update(item, {
      enabled: false,
      visible: false
    }, () => {
      if (chrome.runtime.lastError) {
        (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.log)(`Chrome runtime error: ${chrome.runtime.lastError}`);
      }
    });
  });
}

/***/ }),

/***/ "./src/background/library/translate.js":
/*!*********************************************!*\
  !*** ./src/background/library/translate.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "TranslatorManager": () => (/* binding */ TranslatorManager),
/* harmony export */   "executeGoogleScript": () => (/* binding */ executeGoogleScript),
/* harmony export */   "translatePage": () => (/* binding */ translatePage)
/* harmony export */ });
/* harmony import */ var _edge_translate_translators__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @edge_translate/translators */ "../translators/dist/translators.es.js");
/* harmony import */ var common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/logger.js */ "./src/common/scripts/logger.js");
/* harmony import */ var common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/scripts/promise.js */ "./src/common/scripts/promise.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// common.log는 현재 파일에서 직접 사용하지 않습니다.



class TranslatorManager {
  /**
   * @param {import("../../common/scripts/channel.js").default} channel Communication channel.
   */
  constructor(channel) {
    /**
     * @type {import("../../common/scripts/channel.js").default} Communication channel.
     */
    this.channel = channel;

    /**
     * @type {Promise<Void>} Initialize configurations.
     */
    this.config_loader = (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)(["HybridTranslatorConfig", "DefaultTranslator", "languageSetting", "OtherSettings"], common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(configs => {
      // Init hybrid translator.
      this.HYBRID_TRANSLATOR = new _edge_translate_translators__WEBPACK_IMPORTED_MODULE_0__.HybridTranslator(configs.HybridTranslatorConfig, channel);

      // Supported translators.
      this.TRANSLATORS = _objectSpread({
        HybridTranslate: this.HYBRID_TRANSLATOR
      }, this.HYBRID_TRANSLATOR.REAL_TRANSLATORS);

      // Mutual translating mode flag.
      this.IN_MUTUAL_MODE = configs.OtherSettings.MutualTranslate || false;

      // Translation language settings.
      this.LANGUAGE_SETTING = configs.languageSetting;

      // The default translator to use.
      this.DEFAULT_TRANSLATOR = configs.DefaultTranslator;
    });

    /**
     * Default TTS speed.
     */
    this.TTS_SPEED = "fast";

    // In-memory caches and options to avoid redundant network requests
    this.cacheOptions = {
      maxEntries: 300,
      detectTtlMs: 10 * 60 * 1000,
      // 10 minutes
      translateTtlMs: 30 * 60 * 1000,
      // 30 minutes
      maxKeyTextLength: 500,
      debounceWindowMs: 250
    };
    this.detectCache = new Map(); // key -> { value, expireAt }
    this.translationCache = new Map(); // key -> { value, expireAt }
    this.inflightDetect = new Map(); // key -> Promise
    this.inflightTranslate = new Map(); // key -> Promise
    this.lastTranslateKey = null;
    this.lastTranslateAt = 0;

    /**
     * Start to provide services and listen to event.
     */
    this.provideServices();
    this.listenToEvents();
  }

  /**
   * Clear caches when configuration or language settings change
   */
  clearCaches() {
    this.detectCache.clear();
    this.translationCache.clear();
  }

  /**
   * Normalize text for cache key usage: trim, collapse spaces, and length-limit
   */
  normalizeKeyText(text) {
    if (typeof text !== "string") return "";
    const collapsed = text.trim().replace(/\s+/g, " ");
    if (collapsed.length <= this.cacheOptions.maxKeyTextLength) return collapsed;
    return collapsed.slice(0, this.cacheOptions.maxKeyTextLength);
  }
  makeDetectKey(text) {
    return this.normalizeKeyText(text);
  }
  makeTranslateKey(text, sl, tl, translatorId) {
    const norm = this.normalizeKeyText(text);
    return `${translatorId}||${sl}||${tl}||${norm}`;
  }

  /** Get from cache with TTL check and LRU touch */
  getFromCache(map, key) {
    const entry = map.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (entry.expireAt && entry.expireAt <= now) {
      map.delete(key);
      return null;
    }
    // Touch for LRU behavior: re-insert to back
    map.delete(key);
    map.set(key, entry);
    return entry.value;
  }

  /** Set cache entry with TTL and simple LRU eviction */
  setCacheEntry(map, key, value, ttlMs) {
    try {
      const expireAt = ttlMs ? Date.now() + ttlMs : 0;
      if (map.has(key)) map.delete(key);
      map.set(key, {
        value,
        expireAt
      });
      const max = this.cacheOptions.maxEntries;
      if (map.size > max) {
        // delete oldest entry
        const oldestKey = map.keys().next().value;
        if (oldestKey !== undefined) map.delete(oldestKey);
      }
    } catch (_unused) {}
  }
  getDetectionFromCache(text) {
    const key = this.makeDetectKey(text);
    return this.getFromCache(this.detectCache, key);
  }
  rememberDetection(text, lang) {
    if (!text || !lang) return;
    const key = this.makeDetectKey(text);
    this.setCacheEntry(this.detectCache, key, lang, this.cacheOptions.detectTtlMs);
  }
  getTranslationFromCache(text, sl, tl, translatorId) {
    const key = this.makeTranslateKey(text, sl, tl, translatorId);
    return this.getFromCache(this.translationCache, key);
  }
  rememberTranslation(text, sl, tl, translatorId, result) {
    const key = this.makeTranslateKey(text, sl, tl, translatorId);
    this.setCacheEntry(this.translationCache, key, result, this.cacheOptions.translateTtlMs);
  }

  /**
   * Register service providers.
   *
   * This should be called for only once!
   */
  provideServices() {
    // Translate service.
    this.channel.provide("translate", params => this.translate(params.text, params.position));

    // Quiet single-text translate service for DOM page translation (no UI events)
    this.channel.provide("translate_text_quiet", async params => {
      await this.config_loader;
      const text = params && params.text ? params.text : "";
      if (!text) return Promise.resolve({
        originalText: "",
        translatedText: ""
      });
      let sl = params && params.sl || this.LANGUAGE_SETTING.sl || "auto";
      let tl = params && params.tl || this.LANGUAGE_SETTING.tl;
      try {
        const translatorId = this.DEFAULT_TRANSLATOR;
        // cache first
        let result = this.getTranslationFromCache(text, sl, tl, translatorId);
        if (!result) {
          result = await this.TRANSLATORS[translatorId].translate(text, sl, tl);
          if (result) this.rememberTranslation(text, sl, tl, translatorId, result);
        }
        return Promise.resolve(result || {
          originalText: text,
          translatedText: text
        });
      } catch (e) {
        return Promise.resolve({
          originalText: text,
          translatedText: text
        });
      }
    });

    // Pronounce service.
    this.channel.provide("pronounce", params => {
      let speed = params.speed;
      if (!speed) {
        speed = this.TTS_SPEED;
        this.TTS_SPEED = speed === "fast" ? "slow" : "fast";
      }
      return this.pronounce(params.pronouncing, params.text, params.language, speed);
    });

    // Get available translators service.
    this.channel.provide("get_available_translators", params => Promise.resolve(this.getAvailableTranslators(params)));

    // Update default translator service.
    this.channel.provide("update_default_translator", detail => this.updateDefaultTranslator(detail.translator));
    // TTS 완료 이벤트 중계 서비스
    this.channel.provide("tts_finished", async params => {
      const currentTabId = await this.getCurrentTabId();
      if (currentTabId !== -1) {
        this.channel.emitToTabs(currentTabId, "pronouncing_finished", params);
      }
      return Promise.resolve();
    });
    // TTS 오류 이벤트 중계 서비스
    this.channel.provide("tts_error", async params => {
      const currentTabId = await this.getCurrentTabId();
      if (currentTabId !== -1) {
        this.channel.emitToTabs(currentTabId, "pronouncing_error", params);
      }
      return Promise.resolve();
    });
  }

  /**
   * Register event listeners.
   *
   * This should be called for only once!
   */
  listenToEvents() {
    // Google page translate button clicked event.
    this.channel.on("translate_page_google", () => {
      // Safari/Firefox에서는 전체 페이지 번역 비활성화
      if (true) return;
      executeGoogleScript(this.channel);
    });

    // Language setting updated event.
    this.channel.on("language_setting_update", this.onLanguageSettingUpdated.bind(this));

    // Result frame closed event.
    this.channel.on("frame_closed", this.stopPronounce.bind(this));

    /**
     * Update config cache on config changed.
     */
    chrome.storage.onChanged.addListener((async (changes, area) => {
      if (area === "sync") {
        // Ensure that configurations have been initialized.
        await this.config_loader;
        if (changes["HybridTranslatorConfig"]) {
          this.HYBRID_TRANSLATOR.useConfig(changes["HybridTranslatorConfig"].newValue);
          this.clearCaches();
        }
        if (changes["OtherSettings"]) {
          this.IN_MUTUAL_MODE = changes["OtherSettings"].newValue.MutualTranslate;
        }
        if (changes["languageSetting"]) {
          this.LANGUAGE_SETTING = changes["languageSetting"].newValue;
          this.clearCaches();
        }
        if (changes["DefaultTranslator"]) {
          this.DEFAULT_TRANSLATOR = changes["DefaultTranslator"].newValue;
          this.clearCaches();
          // also clear inflight to avoid dangling promises keyed by old translator
          this.inflightDetect.clear();
          this.inflightTranslate.clear();
        }
      }
    }).bind(this));
  }

  /**
   * get the id of the current tab
   * if the current tab can't display the result panel
   * open a notice page to display the result and explain why the page shows
   * @returns the tab id. If tabId===-1, the user is setting the file URLs access permission and nothing should be done.
   */
  async getCurrentTabId() {
    let tabId = -1;
    const tabs = await common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.query({
      active: true,
      currentWindow: true
    });
    tabId = tabs[0].id;

    // to test whether the current tab can receive message(display results)
    await this.channel.requestToTab(tabId, "check_availability").catch(async () => {
      const shouldOpenNoticePage = await new Promise(resolve => {
        // The page is a local file page
        if (/^file:\/\.*/.test(tabs[0].url)) {
          // Note: chrome.extension.isAllowedFileSchemeAccess is not available in Manifest v3
          // For now, we'll assume file scheme access is not available and show the notice page
          if (confirm(chrome.i18n.getMessage("PermissionRemind"))) {
            chrome.tabs.create({
              url: `chrome://extensions/?id=${chrome.runtime.id}`
            });
            resolve(false);
          } else resolve(true);
        } else resolve(true);
      });
      if (!shouldOpenNoticePage) {
        tabId = -1;
        return;
      }
      /**
       * the current tab can't display the result panel
       * so we open a notice page to display the result and explain why this page shows
       */
      const noticePageUrl = chrome.runtime.getURL("content/notice/notice.html");
      // get the tab id of an existing notice page
      try {
        const tab = (await common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.query({
          url: noticePageUrl
        }))[0];
        // jump to the existed page
        chrome.tabs.highlight({
          tabs: tab.index
        });
        tabId = tab.id;
      } catch (error) {
        // create a new notice page
        const tab = await common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.create({
          url: noticePageUrl,
          active: true
        });
        // wait for browser to open a new page
        await (0,common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.delayPromise)(200);
        tabId = tab.id;
      }
    });
    return tabId;
  }

  /**
   *
   * 检测给定文本的语言。
   *
   * @param {string} text 需要检测的文本
   *
   * @returns {Promise<String>} detected language Promise
   */
  async detect(text) {
    // Ensure that configurations have been initialized.
    await this.config_loader;
    if (!text) return "";
    const cached = this.getDetectionFromCache(text);
    if (cached) return cached;
    const key = this.makeDetectKey(text);
    if (this.inflightDetect.has(key)) return this.inflightDetect.get(key);
    const promise = this.TRANSLATORS[this.DEFAULT_TRANSLATOR].detect(text).then(detected => {
      if (detected) this.rememberDetection(text, detected);
      return detected;
    }).finally(() => this.inflightDetect.delete(key));
    this.inflightDetect.set(key, promise);
    return promise;
  }

  /**
   *
   * This is a translation client function
   * 1. get language settings
   * 2. if source language is "auto", use normal translation mode
   * 3. else use mutual translation mode(auto translate from both sides)
   * 4. send request, get result
   *
   * @param {String} text original text to be translated
   * @param {Array<Number>} position position of the text
   *
   * @returns {Promise<void>} translate finished Promise
   */
  async translate(text, position) {
    // Ensure that configurations have been initialized.
    await this.config_loader;

    // get current tab id
    const currentTabId = await this.getCurrentTabId();
    if (currentTabId === -1) return;

    /**
     * Get current time as timestamp.
     *
     * Timestamp is used for preventing disordered translating message to disturb user.
     *
     * Every translating request has a unique timestamp and every message from that translating
     * request will be assigned with the timestamp. About usage of the timestamp, please refer
     * to display.js.
     */
    let timestamp = new Date().getTime();

    // Inform current tab translating started.
    this.channel.emitToTabs(currentTabId, "start_translating", {
      text,
      position,
      timestamp
    });
    let sl = this.LANGUAGE_SETTING.sl;
    let tl = this.LANGUAGE_SETTING.tl;
    try {
      if (sl !== "auto" && this.IN_MUTUAL_MODE) {
        // mutual translate mode, detect language first.
        // try cache first inside detect()
        sl = await this.detect(text);
        switch (sl) {
          case this.LANGUAGE_SETTING.sl:
            tl = this.LANGUAGE_SETTING.tl;
            break;
          case this.LANGUAGE_SETTING.tl:
            tl = this.LANGUAGE_SETTING.sl;
            break;
          default:
            sl = "auto";
            tl = this.LANGUAGE_SETTING.tl;
        }
      }

      // Debounce burst calls of same key within a window
      const translatorId = this.DEFAULT_TRANSLATOR;
      const key = this.makeTranslateKey(text, sl, tl, translatorId);
      const now = Date.now();
      if (this.lastTranslateKey === key && now - this.lastTranslateAt < this.cacheOptions.debounceWindowMs) {
        // Skip duplicate immediate calls; relying on cache/inflight
      }
      this.lastTranslateKey = key;
      this.lastTranslateAt = now;

      // Try translation cache first
      let result = this.getTranslationFromCache(text, sl, tl, translatorId);
      if (!result) {
        if (this.inflightTranslate.has(key)) {
          result = await this.inflightTranslate.get(key);
        } else {
          const promise = this.TRANSLATORS[translatorId].translate(text, sl, tl).then(res => {
            if (res) this.rememberTranslation(text, sl, tl, translatorId, res);
            return res;
          }).finally(() => this.inflightTranslate.delete(key));
          this.inflightTranslate.set(key, promise);
          result = await promise;
        }
      }
      result.sourceLanguage = sl;
      result.targetLanguage = tl;

      // Send translating result to current tab.
      this.channel.emitToTabs(currentTabId, "translating_finished", _objectSpread({
        timestamp
      }, result));
    } catch (error) {
      // Inform current tab translating failed.
      this.channel.emitToTabs(currentTabId, "translating_error", {
        error,
        timestamp
      });
    }
  }

  /**
   * Text to speech proxy.
   *
   * @param {String} pronouncing which text are we pronouncing? enum{source, target}
   * @param {String} text The text.
   * @param {String} language The language of the text.
   * @param {String} speed The speed of the speech.
   *
   * @returns {Promise<void>} pronounce finished Promise
   */
  async pronounce(pronouncing, text, language, speed) {
    // Ensure that configurations have been initialized.
    await this.config_loader;

    // get current tab id
    const currentTabId = await this.getCurrentTabId();
    if (currentTabId === -1) return;
    let lang = language;
    let timestamp = new Date().getTime();

    // Inform current tab pronouncing started.
    this.channel.emitToTabs(currentTabId, "start_pronouncing", {
      pronouncing,
      text,
      language,
      timestamp
    });
    try {
      if (language === "auto") {
        lang = await this.TRANSLATORS[this.DEFAULT_TRANSLATOR].detect(text);
      }

      // Service Worker에서는 TTS API를 사용할 수 없으므로
      // Content Script에 TTS 실행을 요청합니다
      this.channel.emitToTabs(currentTabId, "execute_tts", {
        pronouncing,
        text,
        language: lang,
        speed,
        timestamp,
        translator: this.DEFAULT_TRANSLATOR
      });
    } catch (error) {
      // Inform current tab pronouncing failed.
      this.channel.emitToTabs(currentTabId, "pronouncing_error", {
        pronouncing,
        error,
        timestamp
      });
    }
  }

  /**
   * Stop pronounce proxy.
   */
  async stopPronounce() {
    // Ensure that configurations have been initialized.
    await this.config_loader;

    // Content Script에서 TTS 중지하도록 요청
    const currentTabId = await this.getCurrentTabId();
    if (currentTabId !== -1) {
      this.channel.emitToTabs(currentTabId, "stop_tts", {
        timestamp: new Date().getTime()
      });
    }
    this.TRANSLATORS[this.DEFAULT_TRANSLATOR].stopPronounce();
  }

  /**
   * Get translators that support given source language and target language.
   *
   * @param {Object} detail current language setting, detail.from is source language, detail.to is target language
   *
   * @returns {Array<String>} available translators Promise.
   */
  getAvailableTranslators(detail) {
    if (!this.HYBRID_TRANSLATOR) {
      console.log("HYBRID_TRANSLATOR not initialized yet");
      return ["HybridTranslate"];
    }
    return ["HybridTranslate"].concat(this.HYBRID_TRANSLATOR.getAvailableTranslatorsFor(detail.from, detail.to));
  }

  /**
   * Language setting update event listener.
   *
   * @param {Object} detail updated language setting, detail.from is source language, detail.to is target language
   *
   * @returns {Promise<void>} finished Promise
   */
  async onLanguageSettingUpdated(detail) {
    let selectedTranslator = this.DEFAULT_TRANSLATOR;

    // Get translators supporting new language setting.
    let availableTranslators = this.getAvailableTranslators(detail);

    // Update hybrid translator config.
    const newConfig = this.HYBRID_TRANSLATOR.updateConfigFor(detail.from, detail.to);
    // Update config.
    chrome.storage.sync.set({
      HybridTranslatorConfig: newConfig
    });

    // Clear caches as language pairing changed
    this.clearCaches();

    // If current default translator does not support new language setting, update it.
    if (!new Set(availableTranslators).has(selectedTranslator)) {
      selectedTranslator = availableTranslators[1];
      chrome.storage.sync.set({
        DefaultTranslator: selectedTranslator
      });
    }

    // Inform options page to update options.
    this.channel.emit("hybrid_translator_config_updated", {
      config: newConfig,
      availableTranslators: availableTranslators.slice(1)
    });

    // Inform result frame to update options.
    common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.query({
      active: true,
      currentWindow: true
    }).then(tabs => this.channel.emitToTabs(tabs[0].id, "update_translator_options", {
      selectedTranslator,
      availableTranslators
    }));
  }

  /**
   * Update translator.
   *
   * @param {string} translator the new translator to use.
   *
   * @returns {Promise<void>} update finished promise.
   */
  updateDefaultTranslator(translator) {
    return new Promise(resolve => {
      chrome.storage.sync.set({
        DefaultTranslator: translator
      }, () => {
        resolve();
      });
    });
  }
}

/**
 * 使用用户选定的网页翻译引擎翻译当前网页。
 *
 * @param {import("../../common/scripts/channel.js").default} channel Communication channel.
 */
function translatePage(channel) {
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)(["DefaultPageTranslator", "languageSetting"], common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
    const translator = result.DefaultPageTranslator;
    // const targetLang = (result.languageSetting && result.languageSetting.tl) || "en";

    // Safari/Firefox에서는 전체 페이지 번역을 제공하지 않음
    if (true) return;
    switch (translator) {
      case "GooglePageTranslate":
        executeGoogleScript(channel);
        break;
      case "DomPageTranslate":
        // Safari 외 브라우저에서만 사용
        common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.query({
          active: true,
          currentWindow: true
        }).then(tabs => {
          if (tabs && tabs[0]) {
            channel.emitToTabs(tabs[0].id, "start_dom_page_translate", {});
          }
        });
        break;
      default:
        executeGoogleScript(channel);
        break;
    }
  });
}

/**
 * 执行谷歌网页翻译相关脚本。
 *
 * @param {import("../../common/scripts/channel.js").default} channel Communication channel.
 */
function executeGoogleScript(channel) {
  common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_2__.promiseTabs.query({
    active: true,
    currentWindow: true
  }).then(tabs => {
    if (tabs[0]) {
      // Prefer direct executeScript on Safari (content-script world bypasses page CSP)
      const isSafari = (() => {
        if (typeof navigator === "undefined" || !navigator.userAgent) return false;
        const ua = navigator.userAgent;
        return /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua) && !/Edg\//.test(ua);
      })();
      if (isSafari) {
        // Run init.js in ISOLATED world (default) so chrome.* is available; it will inject a page script (injection.js)
        if (chrome.scripting && chrome.scripting.executeScript) {
          chrome.scripting.executeScript({
            target: {
              tabId: tabs[0].id,
              allFrames: false
            },
            files: ["google/init.js"],
            injectImmediately: true
          }).then(() => {
            channel.emitToTabs(tabs[0].id, "start_page_translate", {
              translator: "google"
            });
            // 보조 경로: 배너 실패 대비 DOM 폴백도 병행 트리거
            setTimeout(() => {
              channel.emitToTabs(tabs[0].id, "start_dom_page_translate", {});
            }, 800);
          }).catch(() => {
            try {
              chrome.tabs.executeScript(tabs[0].id, {
                file: "google/init.js"
              }, () => {
                channel.emitToTabs(tabs[0].id, "start_page_translate", {
                  translator: "google"
                });
                setTimeout(() => {
                  channel.emitToTabs(tabs[0].id, "start_dom_page_translate", {});
                }, 800);
              });
            } catch (error) {
              channel.emitToTabs(tabs[0].id, "inject_page_translate", {});
              setTimeout(() => {
                channel.emitToTabs(tabs[0].id, "start_dom_page_translate", {});
              }, 800);
            }
          });
          return;
        }
      }
      const hasScripting = typeof chrome !== "undefined" && chrome.scripting && chrome.scripting.executeScript;
      if (hasScripting) {
        chrome.scripting.executeScript({
          target: {
            tabId: tabs[0].id
          },
          files: ["google/init.js"]
        }).then(() => {
          channel.emitToTabs(tabs[0].id, "start_page_translate", {
            translator: "google"
          });
        }).catch(error => {
          (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_1__.logWarn)(`Chrome scripting error: ${error}`);
          // final fallback: ask content script to inject
          channel.emitToTabs(tabs[0].id, "inject_page_translate", {});
        });
      } else {
        // MV2-compatible executeScript via tabs
        try {
          chrome.tabs.executeScript(tabs[0].id, {
            file: "google/init.js"
          }, () => {
            channel.emitToTabs(tabs[0].id, "start_page_translate", {
              translator: "google"
            });
          });
        } catch (error) {
          // delegate to content script
          channel.emitToTabs(tabs[0].id, "inject_page_translate", {});
        }
      }
    }
  });
}

/**
 * Open Google site translate proxy for current tab URL (Safari fallback).
 *
 * @param {string} targetLang target language like 'en', 'zh-CN'
 */
// function openGoogleSiteTranslate(targetLang) {
//     promiseTabs.query({ active: true, currentWindow: true }).then((tabs) => {
//         if (!tabs[0]) return;
//         const currentUrl = tabs[0].url || "";
//         if (!currentUrl) return;
//         const proxy = `https://translate.google.com/translate?sl=auto&tl=${encodeURIComponent(
//             targetLang
//         )}&u=${encodeURIComponent(currentUrl)}`;
//         try {
//             chrome.tabs.create({ url: proxy });
//         } catch (e) {
//             logWarn("Open Google site translate failed", e);
//         }
//     });
// }



/***/ }),

/***/ "./src/common/scripts/channel.js":
/*!***************************************!*\
  !*** ./src/common/scripts/channel.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _event_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./event.js */ "./src/common/scripts/event.js");


/**
 * Channel for inter-context communication.
 *
 * A chrome extension typically contains 4 types of context: background, popup,
 * options and content scripts. Communication between these contexts relies on
 * chrome.runtime.sendMessage and chrome.tabs.sendMessage.
 *
 * This module provides two communication model:
 *   * request/response
 *   * event trigger/listen
 *
 * based on chrome.runtime.sendMessage and chrome.tabs.sendMessage.
 */
class Channel {
  constructor() {
    /**
     * @type {Map<String, Function>} services
     */
    this._services = new Map();

    /**
     * @type {EventManager} Event manager.
     */
    this._eventManager = new _event_js__WEBPACK_IMPORTED_MODULE_0__["default"]();

    /**
     * Register massage listener.
     */
    chrome.runtime.onMessage.addListener(((message, sender, callback) => {
      let parsed = JSON.parse(message);
      if (!parsed || !parsed.type) {
        console.error(`Bad message: ${message}`);
        return;
      }
      switch (parsed.type) {
        case "event":
          this._eventManager.emit(parsed.event, parsed.detail, sender);
          callback && callback();
          break;
        case "service":
          {
            const server = this._services.get(parsed.service);
            if (!server) break;

            // We can call the callback only when we really provide the requested service.
            server(parsed.params, sender).then(result => callback && callback(result));
            return true;
          }
        default:
          console.error(`Unknown message type: ${message.type}`);
          break;
      }
      return;
    }).bind(this));
  }

  /**
   * Provide a service.
   *
   * @param {String} service service
   * @param {Function} server server, server function must return a Promise of the response
   */
  provide(service, server) {
    this._services.set(service, server);
  }

  /**
   * Send a request and get a response.
   *
   * @param {String} service service name
   * @param {Any} params service parameters
   * @returns {Promise<Any>} promise of the response
   */
  request(service, params) {
    const message = JSON.stringify({
      type: "service",
      service,
      params
    });
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, result => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Send a request to the specified tab and get a response.
   *
   * @param {Number} tabId tab id
   * @param {String} service service
   * @param {Any} params service parameters
   * @returns {Promise<Any>} promise of the response
   */
  requestToTab(tabId, service, params) {
    const send = this._getTabMessageSender();
    if (!send) {
      return Promise.reject("Can not send message to tabs in current context!");
    }
    const message = JSON.stringify({
      type: "service",
      service,
      params
    });
    return send(tabId, message);
  }

  /**
   * Add an event handler.
   *
   * @param {String} event event to handle
   * @param {Function} handler event handler, accepts two arguments:
   *                           detail: event detail
   *                           source: source of the event, chrome.runtime.MessageSender object
   * @returns {Function} a canceler that will remove the handler when called
   */
  on(event, handler) {
    return this._eventManager.on(event, handler);
  }

  /**
   * Emit an event.
   *
   * @param {String} event event
   * @param {Any} detail event detail
   */
  emit(event, detail) {
    let message = JSON.stringify({
      type: "event",
      event,
      detail
    });
    chrome.runtime.sendMessage(message, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      }
    });
  }

  /**
   * Emit an event to specified tabs.
   *
   * @param {Number | Array<Number>} tabIds tab ids
   * @param {String} event event
   * @param {Any} detail event detail
   */
  emitToTabs(tabIds, event, detail) {
    const send = this._getTabMessageSender();
    if (!send) {
      console.error("Can not send message to tabs in current context!");
      return;
    }

    // If tabIds is a number, wrap it up with an array.
    if (typeof tabIds === "number") {
      tabIds = [tabIds];
    }
    const message = JSON.stringify({
      type: "event",
      event,
      detail
    });
    for (let tabId of tabIds) {
      send(tabId, message).catch(error => console.error(error));
    }
  }

  /**
   * Internal method
   *
   * Get the message sending function for sending message to tabs.
   *
   * @returns {Function | null} message sender
   */
  _getTabMessageSender() {
    if (false) {}
    if (!chrome.tabs || !chrome.tabs.sendMessage) {
      return null;
    }

    // Chrome uses callback, wrap it up.
    return (tabId, message) => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, result => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(result);
          }
        });
      });
    };
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Channel);

/***/ }),

/***/ "./src/common/scripts/common.js":
/*!**************************************!*\
  !*** ./src/common/scripts/common.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getDomain": () => (/* binding */ getDomain),
/* harmony export */   "i18nHTML": () => (/* binding */ i18nHTML),
/* harmony export */   "log": () => (/* binding */ log)
/* harmony export */ });
/* harmony import */ var _logger_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./logger.js */ "./src/common/scripts/logger.js");



/**
 * 提取给定的url的域名
 *
 * @param {String} url
 */
function getDomain(url) {
  if (url) {
    let URL_PATTERN = /.+:\/+([\w.-]+).*/;
    let groups = url.match(URL_PATTERN);
    if (groups) {
      return groups[1];
    }
  }
  return "";
}

/**
 * console.log wrapper.
 *
 * @param {Any} message message to log.
 */
function log(message) {
  (0,_logger_js__WEBPACK_IMPORTED_MODULE_0__.logInfo)(message);
}

/**
 * set the content text of HTML tags, which have "i18n" class name, with i18n value
 */
function i18nHTML() {
  let i18nElements = document.getElementsByClassName("i18n");
  for (let i = 0; i < i18nElements.length; i++) {
    // Default "beforeEnd".
    let pos = "beforeEnd";
    if (i18nElements[i].hasAttribute("data-insert-pos")) {
      pos = i18nElements[i].getAttribute("data-insert-pos");
    }

    // 跟随浏览器的语言设置显示内容
    i18nElements[i].insertAdjacentText(pos, chrome.i18n.getMessage(i18nElements[i].getAttribute("data-i18n-name")));
  }
}

/***/ }),

/***/ "./src/common/scripts/event.js":
/*!*************************************!*\
  !*** ./src/common/scripts/event.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Event manager.
 */
class EventManager {
  constructor() {
    /**
     * @type {Number} next handler ID.
     */
    this._handlerID = 1;

    /**
     * @type {Map<String, Set<Number>>} event to handler IDs map
     */
    this._eventToHandlerIDs = new Map();

    /**
     * @type {Map<Number, Function>} handler ID to handler map
     */
    this._handlerIDToHandler = new Map();
  }

  /**
   * Add an event handler.
   *
   * @param {String} event event to handle
   * @param {Function} handler event handler, accepts two arguments:
   *                           detail: event detail
   *                           source: source of the event, chrome.runtime.MessageSender object
   * @returns {Function} a canceler that will remove the handler when called
   */
  on(event, handler) {
    const handlerID = this._allocHandlerID();
    this._handlerIDToHandler.set(handlerID, handler);
    if (this._eventToHandlerIDs.has(event)) {
      this._eventToHandlerIDs.get(event).add(handlerID);
    } else {
      this._eventToHandlerIDs.set(event, new Set([handlerID]));
    }

    // Each canceler should be called only once.
    let canceled = false;
    return (() => {
      if (!canceled) {
        canceled = true;
        this._off(event, handlerID);
      } else {
        console.warn("You shouldn't call the canceler more than once!");
      }
    }).bind(this);
  }

  /**
   * Handle an event.
   *
   * @param {String} event event
   * @param {Any} detail event detail
   * @param {Any} source event source
   */
  emit(event, detail, source) {
    const handlerIDs = this._eventToHandlerIDs.get(event);
    if (!handlerIDs) return;
    for (const handlerID of handlerIDs) {
      const handler = this._handlerIDToHandler.get(handlerID);
      handler && handler(detail, source);
    }
  }

  /**
   * Internal method
   *
   * Alloc a handler ID.
   *
   * @returns {Number} an unused handler ID
   */
  _allocHandlerID() {
    while (this._handlerIDToHandler.has(this._handlerID)) {
      this._handlerID = (this._handlerID + 1) % Number.MAX_SAFE_INTEGER;
    }
    return this._handlerID;
  }

  /**
   * Internal method
   *
   * Remove an event handler.
   *
   * @param {String} event event
   * @param {Number} handlerID handler ID
   */
  _off(event, handlerID) {
    const handlerIDs = this._eventToHandlerIDs.get(event);
    handlerIDs && handlerIDs.delete(handlerID);
    this._handlerIDToHandler.delete(handlerID);
  }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (EventManager);

/***/ }),

/***/ "./src/common/scripts/languages.js":
/*!*****************************************!*\
  !*** ./src/common/scripts/languages.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BROWSER_LANGUAGES_MAP": () => (/* binding */ BROWSER_LANGUAGES_MAP)
/* harmony export */ });
/**
 * a map from abbreviation of languages that supported by browsers to abbreviation of those supported by Edge Translate
 */
const BROWSER_LANGUAGES_MAP = {
  ach: "ach",
  ady: "en",
  af: "af",
  "af-NA": "af",
  "af-ZA": "af",
  ak: "aka",
  am: "am",
  ar: "ar",
  "ar-AR": "ar",
  "ar-MA": "ar",
  "ar-SA": "ar",
  "ay-BO": "aym",
  az: "az",
  "az-AZ": "az",
  "be-BY": "be",
  bg: "bg",
  "bg-BG": "bg",
  bn: "bn",
  "bn-IN": "bn",
  "bn-BD": "bn",
  "bs-BA": "bs",
  ca: "ca",
  "ca-ES": "ca",
  cak: "en",
  ceb: "ceb",
  "ck-US": "chr",
  co: "co",
  cs: "cs",
  "cs-CZ": "cs",
  cy: "cy",
  "cy-GB": "cy",
  da: "da",
  "da-DK": "da",
  de: "de",
  "de-AT": "de",
  "de-DE": "de",
  "de-CH": "de",
  dsb: "en",
  el: "el",
  "el-GR": "el",
  en: "en",
  "en-GB": "en",
  "en-AU": "en",
  "en-CA": "en",
  "en-IE": "en",
  "en-IN": "en",
  "en-PI": "en",
  "en-UD": "en",
  "en-US": "en",
  "en-ZA": "en",
  "en@pirate": "en",
  eo: "eo",
  "eo-EO": "eo",
  es: "es",
  "es-AR": "es",
  "es-419": "es",
  "es-CL": "es",
  "es-CO": "es",
  "es-EC": "es",
  "es-ES": "es",
  "es-LA": "es",
  "es-NI": "es",
  "es-MX": "es",
  "es-US": "es",
  "es-VE": "es",
  et: "et",
  "et-EE": "et",
  eu: "eu",
  "eu-ES": "eu",
  fa: "fa",
  "fa-IR": "fa",
  "fb-LT": "en",
  ff: "en",
  fi: "fi",
  "fi-FI": "fi",
  "fo-FO": "fao",
  fr: "fr",
  "fr-CA": "fr",
  "fr-FR": "fr",
  "fr-BE": "fr",
  "fr-CH": "fr",
  "fy-NL": "fy",
  ga: "ga",
  "ga-IE": "ga",
  gd: "gd",
  gl: "gl",
  "gl-ES": "gl",
  "gn-PY": "grn",
  "gu-IN": "gu",
  "gx-GR": "el",
  ha: "ha",
  haw: "haw",
  he: "he",
  "he-IL": "he",
  hi: "hi",
  "hi-IN": "hi",
  hmn: "hmn",
  hr: "hr",
  "hr-HR": "hr",
  hsb: "en",
  ht: "ht",
  hu: "hu",
  "hu-HU": "hu",
  "hy-AM": "hy",
  id: "id",
  "id-ID": "id",
  ig: "ig",
  is: "is",
  "is-IS": "is",
  it: "it",
  "it-IT": "it",
  iw: "he",
  ja: "ja",
  "ja-JP": "ja",
  "jv-ID": "jw",
  "ka-GE": "ka",
  "kk-KZ": "kk",
  km: "km",
  "km-KH": "km",
  kab: "kab",
  kn: "kn",
  "kn-IN": "kn",
  ko: "ko",
  "ko-KR": "ko",
  "ku-TR": "ku",
  ky: "ky",
  la: "la",
  "la-VA": "la",
  lb: "lb",
  "li-NL": "lim",
  lo: "lo",
  lt: "lt",
  "lt-LT": "lt",
  lv: "lv",
  "lv-LV": "lv",
  mai: "mai",
  "mg-MG": "mg",
  mi: "mi",
  mk: "mk",
  "mk-MK": "mk",
  ml: "ml",
  "ml-IN": "ml",
  "mn-MN": "mn",
  mr: "mr",
  "mr-IN": "mr",
  ms: "ms",
  "ms-MY": "ms",
  mt: "mt",
  "mt-MT": "mt",
  my: "my",
  no: "no",
  nb: "no",
  "nb-NO": "no",
  ne: "ne",
  "ne-NP": "ne",
  nl: "nl",
  "nl-BE": "nl",
  "nl-NL": "nl",
  "nn-NO": "no",
  ny: "ny",
  oc: "oci",
  "or-IN": "or",
  pa: "pa",
  "pa-IN": "pa",
  pl: "pl",
  "pl-PL": "pl",
  "ps-AF": "ps",
  pt: "pt",
  "pt-BR": "pt",
  "pt-PT": "pt",
  "qu-PE": "que",
  "rm-CH": "roh",
  ro: "ro",
  "ro-RO": "ro",
  ru: "ru",
  "ru-RU": "ru",
  "sa-IN": "san",
  sd: "sd",
  "se-NO": "sme",
  "si-LK": "si",
  sk: "sk",
  "sk-SK": "sk",
  sl: "sl",
  "sl-SI": "sl",
  sm: "sm",
  sn: "sn",
  "so-SO": "so",
  sq: "sq",
  "sq-AL": "sq",
  sr: "sr",
  "sr-RS": "sr",
  st: "st",
  su: "su",
  sv: "sv",
  "sv-SE": "sv",
  sw: "sw",
  "sw-KE": "sw",
  ta: "ta",
  "ta-IN": "ta",
  te: "te",
  "te-IN": "te",
  tg: "tg",
  "tg-TJ": "tg",
  th: "th",
  "th-TH": "th",
  tl: "fil",
  "tl-PH": "fil",
  tlh: "tlh",
  tr: "tr",
  "tr-TR": "tr",
  "tt-RU": "tat",
  uk: "uk",
  "uk-UA": "uk",
  ur: "ur",
  "ur-PK": "ur",
  uz: "uz",
  "uz-UZ": "uz",
  vi: "vi",
  "vi-VN": "vi",
  "xh-ZA": "xh",
  yi: "yi",
  "yi-DE": "yi",
  yo: "yo",
  zh: "zh-CN",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  "zh-CN": "zh-CN",
  "zh-HK": "zh-TW",
  "zh-SG": "zh-CN",
  "zh-TW": "zh-TW",
  "zu-ZA": "zu"
};

/**
 * Export languages and browser languages map.
 */


/***/ }),

/***/ "./src/common/scripts/logger.js":
/*!**************************************!*\
  !*** ./src/common/scripts/logger.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getLogLevel": () => (/* binding */ getLogLevel),
/* harmony export */   "logError": () => (/* binding */ logError),
/* harmony export */   "logInfo": () => (/* binding */ logInfo),
/* harmony export */   "logWarn": () => (/* binding */ logWarn),
/* harmony export */   "setLogLevel": () => (/* binding */ setLogLevel),
/* harmony export */   "shouldFilterError": () => (/* binding */ shouldFilterError),
/* harmony export */   "wrapConsoleForFiltering": () => (/* binding */ wrapConsoleForFiltering)
/* harmony export */ });


// Known noisy error patterns to suppress in logs
const FILTERED_ERROR_PATTERNS = ["Unable to download", "Unable to download all specified images", "Cannot access", "before initialization", "Extension context invalidated", "Canvas error", "Network error"];
function joinMessage(args) {
  try {
    return args.map(v => typeof v === "string" ? v : v && v.message || JSON.stringify(v)).join(" ");
  } catch (_) {
    return args.join(" ");
  }
}
function shouldFilterError(message) {
  if (!message) return false;
  try {
    return FILTERED_ERROR_PATTERNS.some(pattern => message.includes(pattern)) || /Cannot access '.*' before initialization/.test(message) || /ReferenceError.*before initialization/.test(message) || /Unable to download.*images/.test(message);
  } catch (_) {
    return false;
  }
}

// Log level: 'debug' | 'info' | 'warn' | 'error' | 'silent'
const LEVEL_ORDER = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 90
};
let currentLevel =  true ? "debug" : 0;
function setLogLevel(level) {
  if (LEVEL_ORDER[level] != null) currentLevel = level;
}
function getLogLevel() {
  return currentLevel;
}
function shouldEmit(level) {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[currentLevel];
}
function logInfo(...args) {
  if (!shouldEmit("info")) return;
  // eslint-disable-next-line no-console
  console.log("[EdgeTranslate]", ...args);
}
function logWarn(...args) {
  if (!shouldEmit("warn")) return;
  // eslint-disable-next-line no-console
  console.warn("[EdgeTranslate]", ...args);
}
function logError(...args) {
  if (!shouldEmit("error")) return;
  const message = joinMessage(args);
  if (shouldFilterError(message)) return;
  // eslint-disable-next-line no-console
  console.error("[EdgeTranslate]", ...args);
}

// Optional: globally wrap console.error to suppress noisy errors
function wrapConsoleForFiltering() {
  const originalConsoleError = console.error;
  // eslint-disable-next-line no-console
  console.error = function (...args) {
    const message = joinMessage(args);
    if (!shouldFilterError(message)) {
      originalConsoleError.apply(console, args);
    }
  };
}

/***/ }),

/***/ "./src/common/scripts/promise.js":
/*!***************************************!*\
  !*** ./src/common/scripts/promise.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "delayPromise": () => (/* binding */ delayPromise),
/* harmony export */   "promiseTabs": () => (/* binding */ promiseTabs)
/* harmony export */ });
/**
 * module: common
 * part: none
 * function: encapsulate some async functions in Promise style
 */



/**
 *
 * @param {number} time  the delay time. unit: ms
 * @returns {Promise<Object>} delay Promise
 */
function delayPromise(time) {
  return new Promise((resolve, reject) => {
    if (typeof time === "number" && time >= 0) {
      setTimeout(() => {
        resolve();
      }, time);
    } else {
      reject(`the type or value of variable time(${time}) is not supported`);
    }
  });
}

/**
 * wrap chrome.tabs functions to promise
 */
class promiseTabs {
  /**
   * equal to chrome.tabs.create
   */
  static create(createProperties) {
    return new Promise((resolve, reject) => {
      chrome.tabs.create(createProperties, tab => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError.message);
        }
        resolve(tab);
      });
    });
  }

  /**
   * equal to chrome.tabs.query
   */
  static query(queryInfo) {
    return new Promise((resolve, reject) => {
      chrome.tabs.query(queryInfo, tabs => {
        if (chrome.runtime.lastError || !tabs[0] || tabs[0].id < 0) {
          return reject({
            error: chrome.runtime.lastError || "The query has no results"
          });
        }
        return resolve(tabs);
      });
    });
  }
}

/***/ }),

/***/ "./src/common/scripts/settings.js":
/*!****************************************!*\
  !*** ./src/common/scripts/settings.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEFAULT_SETTINGS": () => (/* binding */ DEFAULT_SETTINGS),
/* harmony export */   "getOrSetDefaultSettings": () => (/* binding */ getOrSetDefaultSettings),
/* harmony export */   "setDefaultSettings": () => (/* binding */ setDefaultSettings)
/* harmony export */ });
/* harmony import */ var common_scripts_languages_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/languages.js */ "./src/common/scripts/languages.js");


/**
 * default settings for this extension
 */
const DEFAULT_SETTINGS = {
  blacklist: {
    urls: {},
    domains: {
      "chrome.google.com": true,
      extensions: true
    }
  },
  // Resize: determine whether the web page will resize when showing translation result
  // RTL: determine whether the text in translation block should display from right to left
  // FoldLongContent: determine whether to fold long translation content
  // SelectTranslatePosition: the position of select translate button.
  LayoutSettings: {
    Resize: false,
    RTL: false,
    FoldLongContent: true,
    SelectTranslatePosition: "TopRight"
  },
  // Default settings of source language and target language
  languageSetting: {
    sl: "auto",
    tl: common_scripts_languages_js__WEBPACK_IMPORTED_MODULE_0__.BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()]
  },
  OtherSettings: {
    MutualTranslate: false,
    SelectTranslate: true,
    TranslateAfterDblClick: false,
    TranslateAfterSelect: false,
    CancelTextSelection: false,
    UseGoogleAnalytics: true
  },
  DefaultTranslator: "GoogleTranslate",
  DefaultPageTranslator: "GooglePageTranslate",
  HybridTranslatorConfig: {
    // The translators used in current hybrid translate.
    translators: ["BingTranslate", "GoogleTranslate"],
    // The translators for each item.
    selections: {
      // ATTENTION: The following four items MUST HAVE THE SAME TRANSLATOR!
      originalText: "GoogleTranslate",
      mainMeaning: "GoogleTranslate",
      tPronunciation: "GoogleTranslate",
      sPronunciation: "GoogleTranslate",
      // For the following three items, any translator combination is OK.
      detailedMeanings: "BingTranslate",
      definitions: "GoogleTranslate",
      examples: "GoogleTranslate"
    }
  },
  // Defines which contents in the translating result should be displayed.
  TranslateResultFilter: {
    mainMeaning: true,
    originalText: true,
    tPronunciation: true,
    sPronunciation: true,
    tPronunciationIcon: true,
    sPronunciationIcon: true,
    detailedMeanings: true,
    definitions: true,
    examples: true
  },
  // Defines the order of displaying contents.
  ContentDisplayOrder: ["mainMeaning", "originalText", "detailedMeanings", "definitions", "examples"],
  HidePageTranslatorBanner: false
};

/**
 * assign default value to settings which are undefined in recursive way
 * @param {*} result setting result stored in chrome.storage
 * @param {*} settings default settings
 */
function setDefaultSettings(result, settings) {
  for (let i in settings) {
    // settings[i] contains key-value settings
    if (typeof settings[i] === "object" && !(settings[i] instanceof Array) && Object.keys(settings[i]).length > 0) {
      if (result[i]) {
        setDefaultSettings(result[i], settings[i]);
      } else {
        // settings[i] contains several setting items but these have not been set before
        result[i] = settings[i];
      }
    } else if (result[i] === undefined) {
      // settings[i] is a single setting item and it has not been set before
      result[i] = settings[i];
    }
  }
}

/**
 * Get settings from storage. If some of the settings have not been initialized,
 * initialize them with the given default values.
 *
 * @param {String | Array<String>} settings setting name to get
 * @param {Object | Function} defaults default values or function to generate default values
 * @returns {Promise<Any>} settings
 */
function getOrSetDefaultSettings(settings, defaults) {
  return new Promise(resolve => {
    // If there is only one setting to get, warp it up.
    if (typeof settings === "string") {
      settings = [settings];
    } else if (settings === undefined) {
      // If settings is undefined, collect all setting keys in defaults.
      settings = [];
      for (let key in defaults) {
        settings.push(key);
      }
    }
    chrome.storage.sync.get(settings, result => {
      let updated = false;
      for (let setting of settings) {
        if (!result[setting]) {
          if (typeof defaults === "function") {
            defaults = defaults(settings);
          }
          result[setting] = defaults[setting];
          updated = true;
        }
      }
      if (updated) {
        chrome.storage.sync.set(result, () => resolve(result));
      } else {
        resolve(result);
      }
    });
  });
}


/***/ }),

/***/ "../translators/dist/translators.es.js":
/*!*********************************************!*\
  !*** ../translators/dist/translators.es.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BingTranslator": () => (/* binding */ O),
/* harmony export */   "DeeplTranslator": () => (/* binding */ I),
/* harmony export */   "GoogleTranslator": () => (/* binding */ w),
/* harmony export */   "HybridTranslator": () => (/* binding */ P),
/* harmony export */   "LANGUAGES": () => (/* binding */ $),
/* harmony export */   "axios": () => (/* binding */ p)
/* harmony export */ });
var U = Object.defineProperty;
var M = (h, e, t) => e in h ? U(h, e, {
  enumerable: !0,
  configurable: !0,
  writable: !0,
  value: t
}) : h[e] = t;
var i = (h, e, t) => (M(h, typeof e != "symbol" ? e + "" : e, t), t);
const L = () => {
    const h = function (e) {
      typeof e == "string" && (e = {
        url: e,
        method: "GET"
      });
      const {
        url: t,
        method: s = "GET",
        data: a,
        headers: n = {},
        timeout: o = 0,
        params: r,
        responseType: l = "json",
        baseURL: u = "",
        validateStatus: T = c => c >= 200 && c < 300
      } = e;
      let R = u ? u + t : t;
      if (r) {
        const c = new URLSearchParams(r);
        R += (R.includes("?") ? "&" : "?") + c.toString();
      }
      const m = {
        method: s.toUpperCase(),
        headers: new Headers(n)
      };
      if (a && !["GET", "HEAD"].includes(m.method)) if (typeof a == "string") m.body = a;else if (a instanceof FormData) m.body = a;else if (a instanceof URLSearchParams) {
        m.body = a;
        const c = m.headers;
        c.get("content-type") || c.set("content-type", "application/x-www-form-urlencoded");
      } else if (a instanceof ArrayBuffer || a instanceof Uint8Array) m.body = a;else {
        m.body = JSON.stringify(a);
        const c = m.headers;
        c.get("content-type") || c.set("content-type", "application/json");
      }
      const y = new AbortController();
      m.signal = y.signal;
      let f = null;
      return o > 0 && (f = setTimeout(() => y.abort(), o)), fetch(R, m).then(c => {
        f && clearTimeout(f);
        let g;
        switch (l) {
          case "text":
            g = c.text();
            break;
          case "blob":
            g = c.blob();
            break;
          case "arraybuffer":
            g = c.arrayBuffer();
            break;
          case "json":
          default:
            g = c.text().then(A => {
              try {
                return A ? JSON.parse(A) : {};
              } catch {
                return A;
              }
            });
            break;
        }
        return g.then(A => {
          const k = {},
            S = c.headers;
          S && typeof S.forEach == "function" && S.forEach((d, N) => {
            k[N] = d;
          });
          const E = {
            data: A,
            status: c.status,
            statusText: c.statusText,
            headers: k,
            config: e,
            request: {}
          };
          if (!T(c.status)) {
            const d = new Error(`Request failed with status ${c.status}`);
            throw d.config = e, d.response = E, d.code = c.status >= 500 ? "ECONNABORTED" : "ERR_BAD_REQUEST", d;
          }
          return E;
        });
      }).catch(c => {
        if (f && clearTimeout(f), c.name === "AbortError") {
          const g = new Error(`Request timeout after ${o}ms`);
          throw g.config = e, g.code = "ECONNABORTED", {
            errorType: "NET_ERR",
            errorCode: 0,
            errorMsg: g.message
          };
        } else throw c.response ? {
          errorType: "NET_ERR",
          errorCode: c.response.status || 0,
          errorMsg: c.message || "Request failed"
        } : {
          errorType: "NET_ERR",
          errorCode: 0,
          errorMsg: c.message || "Network Error"
        };
      });
    };
    return h.get = (e, t = {}) => h({
      ...t,
      url: e,
      method: "GET"
    }), h.post = (e, t, s = {}) => h({
      ...s,
      url: e,
      data: t,
      method: "POST"
    }), h.put = (e, t, s = {}) => h({
      ...s,
      url: e,
      data: t,
      method: "PUT"
    }), h.patch = (e, t, s = {}) => h({
      ...s,
      url: e,
      data: t,
      method: "PATCH"
    }), h.delete = (e, t = {}) => h({
      ...t,
      url: e,
      method: "DELETE"
    }), h.head = (e, t = {}) => h({
      ...t,
      url: e,
      method: "HEAD"
    }), h.options = (e, t = {}) => h({
      ...t,
      url: e,
      method: "OPTIONS"
    }), h.defaults = {
      headers: {
        common: {},
        get: {},
        post: {
          "Content-Type": "application/json"
        },
        put: {
          "Content-Type": "application/json"
        },
        patch: {
          "Content-Type": "application/json"
        }
      },
      timeout: 0,
      responseType: "json",
      baseURL: "",
      validateStatus: e => e >= 200 && e < 300
    }, h.interceptors = {
      request: {
        use: () => {},
        eject: () => {}
      },
      response: {
        use: () => {},
        eject: () => {}
      }
    }, h.create = (e = {}) => {
      const t = L();
      return Object.assign(t.defaults, e), t;
    }, h.isAxiosError = e => e && (e.errorType === "NET_ERR" || e.config && e.code), h;
  },
  p = L(),
  b = [["auto", "auto-detect"], ["ar", "ar"], ["ga", "ga"], ["et", "et"], ["or", "or"], ["bg", "bg"], ["is", "is"], ["pl", "pl"], ["bs", "bs-Latn"], ["fa", "fa"], ["prs", "prs"], ["da", "da"], ["de", "de"], ["ru", "ru"], ["fr", "fr"], ["zh-TW", "zh-Hant"], ["fil", "fil"], ["fj", "fj"], ["fi", "fi"], ["gu", "gu"], ["kk", "kk"], ["ht", "ht"], ["ko", "ko"], ["nl", "nl"], ["ca", "ca"], ["zh-CN", "zh-Hans"], ["cs", "cs"], ["kn", "kn"], ["otq", "otq"], ["tlh", "tlh"], ["hr", "hr"], ["lv", "lv"], ["lt", "lt"], ["ro", "ro"], ["mg", "mg"], ["mt", "mt"], ["mr", "mr"], ["ml", "ml"], ["ms", "ms"], ["mi", "mi"], ["bn", "bn-BD"], ["hmn", "mww"], ["af", "af"], ["pa", "pa"], ["pt", "pt"], ["ps", "ps"], ["ja", "ja"], ["sv", "sv"], ["sm", "sm"], ["sr-Latn", "sr-Latn"], ["sr-Cyrl", "sr-Cyrl"], ["no", "nb"], ["sk", "sk"], ["sl", "sl"], ["sw", "sw"], ["ty", "ty"], ["te", "te"], ["ta", "ta"], ["th", "th"], ["to", "to"], ["tr", "tr"], ["cy", "cy"], ["ur", "ur"], ["uk", "uk"], ["es", "es"], ["he", "iw"], ["el", "el"], ["hu", "hu"], ["it", "it"], ["hi", "hi"], ["id", "id"], ["en", "en"], ["yua", "yua"], ["yue", "yua"], ["vi", "vi"], ["ku", "ku"], ["kmr", "kmr"]],
  D = {
    ar: ["ar-SA", "Male", "ar-SA-Naayf"],
    bg: ["bg-BG", "Male", "bg-BG-Ivan"],
    ca: ["ca-ES", "Female", "ca-ES-HerenaRUS"],
    cs: ["cs-CZ", "Male", "cs-CZ-Jakub"],
    da: ["da-DK", "Female", "da-DK-HelleRUS"],
    de: ["de-DE", "Female", "de-DE-Hedda"],
    el: ["el-GR", "Male", "el-GR-Stefanos"],
    en: ["en-US", "Female", "en-US-JessaRUS"],
    es: ["es-ES", "Female", "es-ES-Laura-Apollo"],
    fi: ["fi-FI", "Female", "fi-FI-HeidiRUS"],
    fr: ["fr-FR", "Female", "fr-FR-Julie-Apollo"],
    he: ["he-IL", "Male", "he-IL-Asaf"],
    hi: ["hi-IN", "Female", "hi-IN-Kalpana-Apollo"],
    hr: ["hr-HR", "Male", "hr-HR-Matej"],
    hu: ["hu-HU", "Male", "hu-HU-Szabolcs"],
    id: ["id-ID", "Male", "id-ID-Andika"],
    it: ["it-IT", "Male", "it-IT-Cosimo-Apollo"],
    ja: ["ja-JP", "Female", "ja-JP-Ayumi-Apollo"],
    ko: ["ko-KR", "Female", "ko-KR-HeamiRUS"],
    ms: ["ms-MY", "Male", "ms-MY-Rizwan"],
    nl: ["nl-NL", "Female", "nl-NL-HannaRUS"],
    nb: ["nb-NO", "Female", "nb-NO-HuldaRUS"],
    no: ["nb-NO", "Female", "nb-NO-HuldaRUS"],
    pl: ["pl-PL", "Female", "pl-PL-PaulinaRUS"],
    pt: ["pt-PT", "Female", "pt-PT-HeliaRUS"],
    ro: ["ro-RO", "Male", "ro-RO-Andrei"],
    ru: ["ru-RU", "Female", "ru-RU-Irina-Apollo"],
    sk: ["sk-SK", "Male", "sk-SK-Filip"],
    sl: ["sl-SL", "Male", "sl-SI-Lado"],
    sv: ["sv-SE", "Female", "sv-SE-HedvigRUS"],
    ta: ["ta-IN", "Female", "ta-IN-Valluvar"],
    te: ["te-IN", "Male", "te-IN-Chitra"],
    th: ["th-TH", "Male", "th-TH-Pattara"],
    tr: ["tr-TR", "Female", "tr-TR-SedaRUS"],
    vi: ["vi-VN", "Male", "vi-VN-An"],
    "zh-Hans": ["zh-CN", "Female", "zh-CN-HuihuiRUS"],
    "zh-Hant": ["zh-CN", "Female", "zh-CN-HuihuiRUS"],
    yue: ["zh-HK", "Female", "zh-HK-TracyRUS"]
  },
  H = {
    ar: "ar-EG",
    ca: "ca-ES",
    da: "da-DK",
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fi: "fi-FI",
    fr: "fr-FR",
    hi: "hi-IN",
    it: "it-IT",
    ja: "ja-JP",
    ko: "ko-KR",
    nb: "nb-NO",
    nl: "nl-NL",
    pl: "pl-PL",
    pt: "pt-PT",
    ru: "ru-RU",
    sv: "sv-SE",
    th: "th-TH",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-HK",
    yue: "zh-HK",
    gu: "gu-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    te: "te-IN",
    tr: "tr-TR"
  };
class O {
  constructor() {
    i(this, "IG", "");
    i(this, "IID", "");
    i(this, "token", "");
    i(this, "key", "");
    i(this, "tokensInitiated", !1);
    i(this, "TTS_AUTH", {
      region: "",
      token: ""
    });
    i(this, "count", 0);
    i(this, "lastRequestTime", 0);
    i(this, "REQUEST_DELAY", 1e3);
    i(this, "HTMLParser", new DOMParser());
    i(this, "MAX_RETRY", 1);
    i(this, "HOST", "https://www.bing.com/");
    i(this, "HOME_PAGE", "https://www.bing.com/translator");
    i(this, "HEADERS", {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,ko;q=0.8,zh-CN;q=0.7,zh;q=0.6",
      "content-type": "application/x-www-form-urlencoded",
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
      "accept-encoding": "gzip, deflate, br",
      "cache-control": "no-cache",
      origin: "https://www.bing.com",
      referer: "https://www.bing.com/translator",
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin"
    });
    i(this, "LAN_TO_CODE", new Map(b));
    i(this, "CODE_TO_LAN", new Map(b.map(([e, t]) => [t, e])));
    i(this, "AUDIO", new Audio());
  }
  async updateTokens() {
    const e = await p.get(this.HOME_PAGE),
      t = /(https:\/\/.*\.bing\.com\/).*/g.exec(e.request.responseURL);
    t && t[1] != this.HOST && (this.HOST = t[1], this.HOME_PAGE = `${this.HOST}translator`), this.IG = e.data.match(/IG:"([A-Za-z0-9]+)"/)[1], [, this.key, this.token] = e.data.match(/var params_AbusePreventionHelper\s*=\s*\[([0-9]+),\s*"([^"]+)",[^\]]*\];/);
    const s = this.HTMLParser.parseFromString(e.data, "text/html");
    this.IID = s.getElementById("rich_tta").getAttribute("data-iid") || "", this.count = 0;
  }
  parseTranslateResult(e, t) {
    const s = t || new Object();
    try {
      const a = e[0].translations;
      s.mainMeaning = a[0].text, s.tPronunciation = a[0].transliteration.text;
    } catch {}
    return s;
  }
  parseLookupResult(e, t) {
    const s = t || new Object();
    try {
      s.originalText = e[0].displaySource;
      const a = e[0].translations;
      s.mainMeaning = a[0].displayTarget, s.tPronunciation = a[0].transliteration;
      const n = [];
      for (const o in a) {
        const r = [];
        for (const l in a[o].backTranslations) r.push(a[o].backTranslations[l].displayText);
        n.push({
          pos: a[o].posTag,
          meaning: a[o].displayTarget,
          synonyms: r
        });
      }
      s.detailedMeanings = n;
    } catch {}
    return s;
  }
  parseExampleResult(e, t) {
    const s = t || new Object();
    try {
      s.examples = e[0].examples.map(a => ({
        source: `${a.sourcePrefix}<b>${a.sourceTerm}</b>${a.sourceSuffix}`,
        target: `${a.targetPrefix}<b>${a.targetTerm}</b>${a.targetSuffix}`
      }));
    } catch {}
    return s;
  }
  async updateTTSAuth() {
    const e = () => ({
        method: "POST",
        baseURL: this.HOST,
        url: `tfetspktok?isVertical=1&&IG=${this.IG}&IID=${this.IID}.${this.count.toString()}`,
        headers: this.HEADERS,
        data: `&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`
      }),
      t = await this.request(e, []);
    this.TTS_AUTH.region = t.region, this.TTS_AUTH.token = t.token;
  }
  generateTTSData(e, t, s) {
    const a = this.LAN_TO_CODE.get(t),
      n = D[a],
      o = H[a],
      r = s === "fast" ? "-10.00%" : "-30.00%";
    return `<speak version='1.0' xml:lang='${o}'><voice xml:lang='${o}' xml:gender='${n[1]}' name='${n[2]}'><prosody rate='${r}'>${e}</prosody></voice></speak>`;
  }
  arrayBufferToBase64(e) {
    let t = "",
      s = new Uint8Array(e);
    for (let a = 0; a < s.byteLength; a++) t += String.fromCharCode(s[a]);
    return btoa(t);
  }
  constructDetectParams(e) {
    const t = `ttranslatev3?isVertical=1&IG=${this.IG}&IID=${this.IID}.${this.count.toString()}`,
      s = `&fromLang=auto-detect&to=zh-Hans&text=${encodeURIComponent(e)}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;
    return {
      method: "POST",
      baseURL: this.HOST,
      url: t,
      headers: this.HEADERS,
      data: s
    };
  }
  constructTranslateParams(e, t, s) {
    const a = `ttranslatev3?isVertical=1&IG=${this.IG}&IID=${this.IID}.${this.count.toString()}`,
      n = `&fromLang=${this.LAN_TO_CODE.get(t)}&to=${this.LAN_TO_CODE.get(s)}&text=${encodeURIComponent(e)}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;
    return {
      method: "POST",
      baseURL: this.HOST,
      url: a,
      headers: this.HEADERS,
      data: n
    };
  }
  constructLookupParams(e, t, s) {
    const a = `tlookupv3?isVertical=1&IG=${this.IG}&IID=${this.IID}.${this.count.toString()}`,
      n = `&from=${t}&to=${this.LAN_TO_CODE.get(s)}&text=${encodeURIComponent(e)}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;
    return {
      method: "POST",
      baseURL: this.HOST,
      url: a,
      headers: this.HEADERS,
      data: n
    };
  }
  constructExampleParams(e, t, s, a) {
    const n = `texamplev3?isVertical=1&IG=${this.IG}&IID=${this.IID}.${this.count.toString()}`,
      o = `&from=${e}&to=${this.LAN_TO_CODE.get(t)}&text=${encodeURIComponent(s)}&translation=${encodeURIComponent(a)}&token=${encodeURIComponent(this.token)}&key=${encodeURIComponent(this.key)}`;
    return {
      method: "POST",
      baseURL: this.HOST,
      url: n,
      headers: this.HEADERS,
      data: o
    };
  }
  constructTTSParams(e, t, s) {
    const a = `https://${this.TTS_AUTH.region}.tts.speech.microsoft.com/cognitiveservices/v1?`,
      n = {
        "Content-Type": "application/ssml+xml",
        Authorization: `Bearer ${this.TTS_AUTH.token}`,
        "X-MICROSOFT-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        "cache-control": "no-cache"
      };
    return {
      method: "POST",
      baseURL: a,
      headers: n,
      data: this.generateTTSData(e, t, s),
      responseType: "arraybuffer"
    };
  }
  async request(e, t, s = !0) {
    const a = Date.now() - this.lastRequestTime;
    if (a < this.REQUEST_DELAY) {
      const r = this.REQUEST_DELAY - a;
      await new Promise(l => setTimeout(l, r));
    }
    this.lastRequestTime = Date.now();
    let n = 0;
    const o = async () => {
      this.count++;
      const r = await p(e.call(this, ...t));
      if (r.status === 401 || r.status === 429) throw {
        errorType: "API_ERR",
        errorCode: r.status,
        errorMsg: "Request too frequently!"
      };
      const l = /(https:\/\/.*\.bing\.com\/).*/g.exec(r.request.responseURL);
      if (l && l[1] !== this.HOST) return this.HOST = l[1], this.HOME_PAGE = `${this.HOST}translator`, await this.updateTokens().then(o);
      const u = r.data.StatusCode || r.data.statusCode || 200;
      switch (u) {
        case 200:
          return r.data;
        case 205:
          return await this.updateTokens().then(o);
      }
      if (s && n < this.MAX_RETRY) return n++, await this.updateTokens().then(o);
      throw {
        errorType: "API_ERR",
        errorCode: u,
        errorMsg: "Request failed."
      };
    };
    return this.tokensInitiated || (await this.updateTokens(), this.tokensInitiated = !0), o();
  }
  supportedLanguages() {
    return new Set(this.LAN_TO_CODE.keys());
  }
  async detect(e) {
    try {
      const t = (await this.request(this.constructDetectParams, [e]))[0].detectedLanguage.language;
      return this.CODE_TO_LAN.get(t);
    } catch (t) {
      throw t.errorMsg = t.errorMsg || t.message, t.errorAct = {
        api: "bing",
        action: "detect",
        text: e,
        from: null,
        to: null
      }, t;
    }
  }
  async translate(e, t, s) {
    let a;
    try {
      a = await this.request(this.constructTranslateParams, [e, t, s]);
    } catch (o) {
      throw o.errorAct = {
        api: "bing",
        action: "translate",
        text: e,
        from: t,
        to: s
      }, o;
    }
    const n = this.parseTranslateResult(a, {
      originalText: e,
      mainMeaning: ""
    });
    try {
      const o = await this.request(this.constructLookupParams, [e, a[0].detectedLanguage.language, s], !1),
        r = this.parseLookupResult(o, n),
        l = await this.request(this.constructExampleParams, [a[0].detectedLanguage.language, s, e, r.mainMeaning], !1);
      return this.parseExampleResult(l, r);
    } catch {
      return n;
    }
  }
  async pronounce(e, t, s) {
    this.stopPronounce();
    let a = 0;
    const n = async () => {
      try {
        const o = await this.request(this.constructTTSParams, [e, t, s], !1);
        this.AUDIO.src = `data:audio/mp3;base64,${this.arrayBufferToBase64(o)}`, await this.AUDIO.play();
      } catch (o) {
        if (a < this.MAX_RETRY) return a++, this.updateTTSAuth().then(n);
        const r = {
          api: "bing",
          action: "pronounce",
          text: e,
          from: t,
          to: null
        };
        throw o.errorType ? (o.errorAct = r, o) : {
          errorType: "NET_ERR",
          errorCode: 0,
          errorMsg: o.message,
          errorAct: r
        };
      }
    };
    return this.TTS_AUTH.region.length > 0 && this.TTS_AUTH.token.length > 0 || (await this.updateTTSAuth()), n();
  }
  stopPronounce() {
    this.AUDIO.paused || this.AUDIO.pause();
  }
}
const _ = [["auto", "auto"], ["zh-CN", "zh-CN"], ["zh-TW", "zh-TW"], ["en", "en"], ["af", "af"], ["am", "am"], ["ar", "ar"], ["az", "az"], ["be", "be"], ["bg", "bg"], ["bn", "bn"], ["bs", "bs"], ["ca", "ca"], ["ceb", "ceb"], ["co", "co"], ["cs", "cs"], ["cy", "cy"], ["da", "da"], ["de", "de"], ["el", "el"], ["eo", "eo"], ["es", "es"], ["et", "et"], ["eu", "eu"], ["fa", "fa"], ["fi", "fi"], ["fr", "fr"], ["fy", "fy"], ["ga", "ga"], ["gd", "gd"], ["gl", "gl"], ["gu", "gu"], ["ha", "ha"], ["haw", "haw"], ["he", "he"], ["hi", "hi"], ["hmn", "hmn"], ["hr", "hr"], ["ht", "ht"], ["hu", "hu"], ["hy", "hy"], ["id", "id"], ["ig", "ig"], ["is", "is"], ["it", "it"], ["ja", "ja"], ["jw", "jw"], ["ka", "ka"], ["kk", "kk"], ["km", "km"], ["kn", "kn"], ["ko", "ko"], ["ku", "ku"], ["ky", "ky"], ["la", "la"], ["lb", "lb"], ["lo", "lo"], ["lt", "lt"], ["lv", "lv"], ["mg", "mg"], ["mi", "mi"], ["mk", "mk"], ["ml", "ml"], ["mn", "mn"], ["mr", "mr"], ["ms", "ms"], ["mt", "mt"], ["my", "my"], ["ne", "ne"], ["nl", "nl"], ["no", "no"], ["ny", "ny"], ["pl", "pl"], ["ps", "ps"], ["pt", "pt"], ["ro", "ro"], ["ru", "ru"], ["sd", "sd"], ["si", "si"], ["sk", "sk"], ["sl", "sl"], ["sm", "sm"], ["sn", "sn"], ["so", "so"], ["sq", "sq"], ["sr", "sr"], ["st", "st"], ["su", "su"], ["sv", "sv"], ["sw", "sw"], ["ta", "ta"], ["te", "te"], ["tg", "tg"], ["th", "th"], ["fil", "tl"], ["tr", "tr"], ["ug", "ug"], ["uk", "uk"], ["ur", "ur"], ["uz", "uz"], ["vi", "vi"], ["xh", "xh"], ["yi", "yi"], ["yo", "yo"], ["zu", "zu"]];
class w {
  constructor() {
    i(this, "TKK", [434217, 1534559001]);
    i(this, "HOME_PAGE", "https://translate.google.com/");
    i(this, "HOST", "https://translate.googleapis.com/");
    i(this, "TRANSLATE_URL", `${this.HOST}translate_a/single?client=gtx&dj=1&dt=t&dt=at&dt=bd&dt=ex&dt=md&dt=rw&dt=ss&dt=rm`);
    i(this, "TTS_URL", `${this.HOST}translate_tts?client=gtx`);
    i(this, "FALLBACK_TRANSLATE_URL", `${this.HOST}translate_a/single?ie=UTF-8&client=webapp&otf=1&ssel=0&tsel=0&kc=5&dt=t&dt=at&dt=bd&dt=ex&dt=md&dt=rw&dt=ss&dt=rm`);
    i(this, "FALLBACK_TTS_URL", `${this.HOST}translate_tts?ie=UTF-8&client=webapp`);
    i(this, "fallBacking", !1);
    i(this, "LAN_TO_CODE", new Map(_));
    i(this, "CODE_TO_LAN", new Map(_.map(([e, t]) => [t, e])));
    i(this, "AUDIO", new Audio());
  }
  generateTK(e, t, s) {
    t = Number(t) || 0;
    let a = [],
      n = 0,
      o = 0;
    for (; o < e.length; o++) {
      let r = e.charCodeAt(o);
      128 > r ? a[n++] = r : (2048 > r ? a[n++] = r >> 6 | 192 : ((r & 64512) == 55296 && o + 1 < e.length && (e.charCodeAt(o + 1) & 64512) == 56320 ? (r = 65536 + ((r & 1023) << 10) + (e.charCodeAt(++o) & 1023), a[n++] = r >> 18 | 240, a[n++] = r >> 12 & 63 | 128) : a[n++] = r >> 12 | 224, a[n++] = r >> 6 & 63 | 128), a[n++] = r & 63 | 128);
    }
    for (e = t, n = 0; n < a.length; n++) e += a[n], e = this._magic(e, "+-a^+6");
    return e = this._magic(e, "+-3^+b+-f"), e ^= Number(s) || 0, 0 > e && (e = (e & 2147483647) + 2147483648), e %= 1e6, e.toString() + "." + (e ^ t);
  }
  _magic(e, t) {
    for (var s = 0; s < t.length - 2; s += 3) {
      var a = t.charAt(s + 2),
        a = "a" <= a ? a.charCodeAt(0) - 87 : Number(a),
        a = t.charAt(s + 1) == "+" ? e >>> a : e << a;
      e = t.charAt(s) == "+" ? e + a & 4294967295 : e ^ a;
    }
    return e;
  }
  async updateTKK() {
    let e = (await p.get(this.HOME_PAGE)).data,
      t = (e.match(/TKK=(.*?)\(\)\)'\);/i) || [""])[0].replace(/\\x([0-9A-Fa-f]{2})/g, "").match(/[+-]?\d+/g);
    t ? (this.TKK[0] = Number(t[2]), this.TKK[1] = Number(t[0]) + Number(t[1])) : (t = e.match(/TKK[=:]['"](\d+?)\.(\d+?)['"]/i), t && (this.TKK[0] = Number(t[1]), this.TKK[1] = Number(t[2])));
  }
  fallBack() {
    this.fallBacking = !0, setTimeout(() => {
      this.fallBacking = !1;
    }, 30 * 60 * 1e3);
  }
  generateDetectURL(e) {
    let t = "&sl=auto&tl=zh-cn";
    return t += `&tk=${this.generateTK(e, this.TKK[0], this.TKK[1])}&q=${encodeURIComponent(e)}`, this.fallBacking ? this.FALLBACK_TRANSLATE_URL + t : this.TRANSLATE_URL + t;
  }
  generateTranslateURL(e, t, s) {
    let a = `&sl=${this.LAN_TO_CODE.get(t)}&tl=${this.LAN_TO_CODE.get(s)}`;
    return a += `&tk=${this.generateTK(e, this.TKK[0], this.TKK[1])}&q=${encodeURIComponent(e)}`, this.fallBacking ? this.FALLBACK_TRANSLATE_URL + a : this.TRANSLATE_URL + a;
  }
  parseDetectResult(e) {
    return this.fallBacking ? this.CODE_TO_LAN.get(e[2]) || "" : e.ld_result.extended_srclangs ? this.CODE_TO_LAN.get(e.ld_result.extended_srclangs[0]) || "" : this.CODE_TO_LAN.get(e.ld_result.srclangs[0]) || "";
  }
  parseBetterResult(e) {
    const t = {
      originalText: "",
      mainMeaning: ""
    };
    if (e.sentences) {
      t.mainMeaning = "", t.originalText = "";
      let s = 0;
      for (; s < e.sentences.length && e.sentences[s].trans; s++) t.mainMeaning += e.sentences[s].trans, t.originalText += e.sentences[s].orig;
      s < e.sentences.length && (e.sentences[s].translit && (t.tPronunciation = e.sentences[s].translit), e.sentences[s].src_translit && (t.sPronunciation = e.sentences[s].src_translit));
    }
    if (e.dict) {
      t.detailedMeanings = [];
      for (let s of e.dict) for (let a of s.entry) t.detailedMeanings.push({
        pos: s.pos,
        meaning: a.word,
        synonyms: a.reverse_translation
      });
    }
    if (e.definitions) {
      t.definitions = [];
      for (let s of e.definitions) for (let a of s.entry) t.definitions.push({
        pos: s.pos,
        meaning: a.gloss,
        synonyms: [],
        example: a.example
      });
    }
    if (e.examples) {
      t.examples = [];
      for (let s of e.examples.example) t.examples.push({
        source: s.text,
        target: null
      });
      t.examples.sort((s, a) => s.source > a.source ? 1 : s.source === a.source ? 0 : -1);
    }
    return t;
  }
  parseFallbackResult(e) {
    const t = {
      originalText: "",
      mainMeaning: ""
    };
    for (let s = 0; s < e.length; s++) if (e[s]) {
      const a = e[s];
      switch (s) {
        case 0:
          {
            let n = [],
              o = [],
              r = a.length - 1;
            for (let l = 0; l <= r; l++) n.push(a[l][0]), o.push(a[l][1]);
            t.mainMeaning = n.join(""), t.originalText = o.join("");
            try {
              r > 0 && (a[r][2] && a[r][2].length > 0 && (t.tPronunciation = a[r][2]), a[r][3] && a[r][3].length > 0 && (t.sPronunciation = a[r][3]));
            } catch {}
            break;
          }
        case 1:
          t.detailedMeanings = new Array(), a.forEach(n => t.detailedMeanings.push({
            pos: n[0],
            meaning: n[1].join(", ")
          }));
          break;
        case 12:
          t.definitions = new Array(), a.forEach(n => {
            n[1].forEach(o => {
              t.definitions.push({
                pos: n[0],
                meaning: o[0],
                example: o[2]
              });
            });
          });
          break;
        case 13:
          t.examples = new Array(), a.forEach(n => n.forEach(o => t.examples.push({
            source: null,
            target: o[0]
          })));
          break;
      }
    }
    return t;
  }
  parseTranslateResult(e) {
    return this.fallBacking ? this.parseFallbackResult(e) : this.parseBetterResult(e);
  }
  supportedLanguages() {
    return new Set(this.LAN_TO_CODE.keys());
  }
  detect(e) {
    const t = async () => {
      const s = await p.get(this.generateDetectURL(e), {
        validateStatus: a => a < 500
      });
      if (s.status === 200) return this.parseDetectResult(s.data);
      if (s.status === 429 && !this.fallBacking) return this.fallBack(), await this.updateTKK().then(t);
      throw {
        errorType: "API_ERR",
        errorCode: s.status,
        errorMsg: "Detect failed.",
        errorAct: {
          api: "google",
          action: "detect",
          text: e,
          from: null,
          to: null
        }
      };
    };
    return t();
  }
  translate(e, t, s) {
    const a = async () => {
      const n = await p.get(this.generateTranslateURL(e, t, s), {
        validateStatus: o => o < 500
      });
      if (n.status === 200) return this.parseTranslateResult(n.data);
      if (n.status === 429 && !this.fallBacking) return this.fallBack(), await this.updateTKK().then(a);
      throw {
        errorType: "API_ERR",
        errorCode: n.status,
        errorMsg: "Translate failed.",
        errorAct: {
          api: "google",
          action: "translate",
          text: e,
          from: t,
          to: s
        }
      };
    };
    return a();
  }
  async pronounce(e, t, s) {
    this.stopPronounce();
    let a = s === "fast" ? "0.8" : "0.2";
    this.AUDIO.src = `${this.fallBacking ? this.FALLBACK_TTS_URL : this.TTS_URL}&q=${encodeURIComponent(e)}&tl=${this.LAN_TO_CODE.get(t)}&ttsspeed=${a}&tk=${this.generateTK(e, this.TKK[0], this.TKK[1])}`;
    try {
      await this.AUDIO.play();
    } catch (n) {
      throw {
        errorType: "NET_ERR",
        errorCode: 0,
        errorMsg: n.message,
        errorAct: {
          api: "google",
          action: "pronounce",
          text: e,
          from: t,
          to: null
        }
      };
    }
  }
  stopPronounce() {
    this.AUDIO.paused || this.AUDIO.pause();
  }
}
const C = [["auto", "auto"], ["bg", "bg"], ["et", "et"], ["pl", "pl"], ["da", "da"], ["de", "de"], ["ru", "ru"], ["fr", "fr"], ["fi", "fi"], ["nl", "nl"], ["zh-CN", "zh"], ["cs", "cs"], ["lv", "lv"], ["lt", "lt"], ["ro", "ro"], ["pt", "pt"], ["ja", "ja"], ["sv", "sv"], ["sk", "sk"], ["sl", "sl"], ["es", "es"], ["el", "el"], ["hu", "hu"], ["it", "it"], ["en", "en"]];
class I {
  constructor(e, t) {
    i(this, "HOME_PAGE", "https://www.deepl.com/translator");
    i(this, "LAN_TO_CODE", new Map(C));
    i(this, "CODE_TO_LAN", new Map(C.map(([e, t]) => [t, e])));
    i(this, "langDetector");
    i(this, "TTSEngine");
    i(this, "deepLIframe");
    this.langDetector = e, this.TTSEngine = t, this.createIframe();
  }
  createIframe() {
    this.deepLIframe = document.createElement("iframe"), document.body.appendChild(this.deepLIframe), this.deepLIframe.src = this.HOME_PAGE;
  }
  supportedLanguages() {
    return new Set(this.LAN_TO_CODE.keys());
  }
  async detect(e) {
    return await this.langDetector.detect(e);
  }
  async translate(e, t, s) {
    try {
      return {
        mainMeaning: await new Promise((a, n) => {
          const o = setTimeout(() => {
              n({
                status: 408,
                errorMsg: "Request timeout!"
              });
            }, 1e4),
            r = l => {
              !l.data.type || l.data.type !== "edge_translate_deepl_response" || (window.removeEventListener("message", r), clearTimeout(o), l.data.status === 200 ? a(l.data.result) : n(l.data));
            };
          window.addEventListener("message", r), this.deepLIframe.contentWindow.postMessage({
            type: "edge_translate_deepl_request",
            url: `${this.HOME_PAGE}#${this.LAN_TO_CODE.get(t)}/${this.LAN_TO_CODE.get(s)}/${encodeURIComponent(e.replaceAll("/", "\\/"))}`
          }, this.HOME_PAGE);
        }),
        originalText: e
      };
    } catch (a) {
      throw a.status === 408 && (document.body.removeChild(this.deepLIframe), this.createIframe()), a.errorCode = a.status || 0, a.errorMsg = a.errorMsg || a.message, a.errorAct = {
        api: "deepl",
        action: "translate",
        text: e,
        from: t,
        to: s
      }, a;
    }
  }
  async pronounce(e, t, s) {
    return await this.TTSEngine.pronounce(e, t, s);
  }
  stopPronounce() {
    this.TTSEngine.stopPronounce();
  }
}
class P {
  constructor(e, t) {
    i(this, "channel");
    i(this, "CONFIG", {
      selections: {},
      translators: []
    });
    i(this, "REAL_TRANSLATORS");
    i(this, "MAIN_TRANSLATOR", "GoogleTranslate");
    if (this.channel = t, this.REAL_TRANSLATORS = {
      BingTranslate: new O(),
      GoogleTranslate: new w(),
      DeepLTranslate: null
    }, !(() => {
      if (typeof navigator > "u" || !navigator.userAgent) return !1;
      const s = navigator.userAgent;
      return /Safari\//.test(s) && !/Chrome\//.test(s) && !/Chromium\//.test(s) && !/Edg\//.test(s);
    })()) this.REAL_TRANSLATORS.DeepLTranslate = new I(this.REAL_TRANSLATORS.BingTranslate, this.REAL_TRANSLATORS.BingTranslate);else {
      const s = this.REAL_TRANSLATORS.GoogleTranslate,
        a = this.REAL_TRANSLATORS.BingTranslate;
      this.REAL_TRANSLATORS.DeepLTranslate = {
        supportedLanguages: () => new Set(),
        detect: async n => s.detect(n),
        translate: async (n, o, r) => s.translate(n, o, r),
        pronounce: async (n, o, r) => a.pronounce(n, o, r),
        stopPronounce: () => a.stopPronounce()
      };
    }
    this.useConfig(e);
  }
  useConfig(e) {
    if (!e || !e.translators || !e.selections) {
      console.error("Invalid config for HybridTranslator!");
      return;
    }
    this.CONFIG = e, this.MAIN_TRANSLATOR = e.selections.mainMeaning;
  }
  getAvailableTranslatorsFor(e, t) {
    const s = [];
    for (const a of Object.keys(this.REAL_TRANSLATORS)) {
      const n = this.REAL_TRANSLATORS[a].supportedLanguages();
      n.has(e) && n.has(t) && s.push(a);
    }
    return s.sort((a, n) => a === "GoogleTranslate" ? -1 : n === "GoogleTranslate" ? 1 : a.localeCompare(n));
  }
  updateConfigFor(e, t) {
    const s = {
        translators: [],
        selections: {}
      },
      a = new Set(),
      n = this.getAvailableTranslatorsFor(e, t),
      o = n[0],
      r = new Set(n);
    let l;
    for (l in this.CONFIG.selections) {
      let u,
        T = this.CONFIG.selections[l];
      r.has(T) ? (s.selections[l] = T, u = T) : (s.selections[l] = o, u = o), a.add(u);
    }
    return s.translators = Array.from(a), s;
  }
  async detect(e) {
    return this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].detect(e);
  }
  async translate(e, t, s) {
    let a = [];
    for (let l of this.CONFIG.translators) a.push(this.REAL_TRANSLATORS[l].translate(e, t, s).then(u => [l, u]));
    const n = {
        originalText: "",
        mainMeaning: ""
      },
      o = new Map(await Promise.all(a));
    let r;
    for (r in this.CONFIG.selections) try {
      const l = this.CONFIG.selections[r];
      n[r] = o.get(l)[r];
    } catch (l) {
      console.log(`${r} ${this.CONFIG.selections[r]}`), console.log(l);
    }
    return n;
  }
  async pronounce(e, t, s) {
    return this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].pronounce(e, t, s);
  }
  async stopPronounce() {
    this.REAL_TRANSLATORS[this.MAIN_TRANSLATOR].stopPronounce();
  }
}
const $ = {
  en: "English",
  "zh-CN": "ChineseSimplified",
  "zh-TW": "ChineseTraditional",
  fr: "French",
  es: "Spanish",
  ru: "Russian",
  ar: "Arabic",
  de: "German",
  ja: "Japanese",
  pt: "Portuguese",
  hi: "Hindi",
  ur: "Urdu",
  ko: "Korean",
  ach: "Achinese",
  af: "Afrikaans",
  aka: "Akan",
  sq: "Albanian",
  am: "Amharic",
  arg: "Aragonese",
  hy: "Armenian",
  asm: "Assamese",
  ast: "Asturian",
  aym: "Aymara",
  az: "Azerbaijani",
  bal: "Baluchi",
  sun: "BasaSunda",
  bak: "Bashkir",
  eu: "Basque",
  be: "Belarusian",
  bem: "Bemba",
  bn: "Bengali",
  ber: "Berberlanguages",
  bho: "Bhojpuri",
  bis: "Bislama",
  bli: "Blin",
  nob: "Bokmal",
  bs: "Bosnian",
  bre: "Breton",
  bg: "Bulgarian",
  bur: "Burmese",
  yue: "Cantonese",
  ca: "Catalan",
  ceb: "Cebuano",
  chr: "Cherokee",
  ny: "Chichewa",
  chv: "Chuvash",
  wyw: "ClassicalChinese",
  cor: "Cornish",
  co: "Corsican",
  cre: "Creek",
  cri: "CrimeanTatar",
  hr: "Croatian",
  cs: "Czech",
  da: "Danish",
  prs: "Dari",
  div: "Divehi",
  nl: "Dutch",
  eo: "Esperanto",
  et: "Estonian",
  fao: "Faroese",
  fj: "Fiji",
  fil: "Filipino",
  fi: "Finnish",
  fy: "Frisian",
  fri: "Friulian",
  ful: "Fulani",
  gla: "Gaelic",
  gl: "Galician",
  ka: "Georgian",
  el: "Greek",
  grn: "Guarani",
  gu: "Gujarati",
  ht: "HaitianCreole",
  hak: "HakhaChin",
  ha: "Hausa",
  haw: "Hawaiian",
  he: "Hebrew",
  hil: "Hiligaynon",
  hmn: "Hmong",
  hu: "Hungarian",
  hup: "Hupa",
  is: "Icelandic",
  ido: "Ido",
  ig: "Igbo",
  id: "Indonesian",
  ing: "Ingush",
  ina: "interlingua",
  iku: "Inuktitut",
  ga: "Irish",
  it: "Italian",
  jw: "Javanese",
  kab: "Kabyle",
  kal: "Kalaallisut",
  kn: "Kannada",
  kau: "Kanuri",
  kas: "Kashmiri",
  kah: "Kashubian",
  kk: "Kazakh",
  km: "Khmer",
  kin: "Kinyarwanda",
  tlh: "Klingon",
  kon: "Kongo",
  kok: "Konkani",
  ku: "Kurdish",
  kmr: "KurdishNorthern",
  ky: "Kyrgyz",
  lo: "Lao",
  lag: "Latgalian",
  la: "Latin",
  lv: "Latvian",
  lim: "Limburgish",
  lin: "Lingala",
  lt: "Lithuanian",
  loj: "Lojban",
  lug: "Luganda",
  lb: "Luxembourgish",
  mk: "Macedonian",
  mai: "Maithili",
  mg: "Malagasy",
  ms: "Malay",
  ml: "Malayalam",
  mt: "Maltese",
  glv: "Manx",
  mi: "Maori",
  mr: "Marathi",
  mah: "Marshallese",
  mau: "MauritianCreole",
  frm: "MiddleFrench",
  mn: "Mongolian",
  mot: "Montenegrin",
  my: "Myanmar",
  nea: "Neapolitan",
  ne: "Nepali",
  sme: "NorthernSami",
  ped: "NorthernSotho",
  no: "Norwegian",
  nno: "Nynorsk",
  oci: "Occitan",
  oji: "Ojibwa",
  eno: "OldEnglish",
  or: "Oriya",
  orm: "Oromo",
  oss: "Ossetian",
  pam: "Pampanga",
  pap: "Papiamento",
  ps: "Pashto",
  fa: "Persian",
  pl: "Polish",
  pa: "Punjabi",
  que: "Quechua",
  otq: "QueretaroOttomi",
  ro: "Romanian",
  roh: "Romansh",
  rom: "Romany",
  ruy: "Rusyn",
  sm: "Samoan",
  san: "Sanskrit",
  srd: "Sardinian",
  sco: "Scots",
  gd: "ScotsGaelic",
  src: "SerbCyrillic",
  sr: "Serbian",
  "sr-Cyrl": "SerbianCyrillic",
  "sr-Latn": "SerbianLatin",
  sec: "SerboCroatian",
  st: "Sesotho",
  sha: "Shan",
  sn: "Shona",
  sil: "Silesian",
  sd: "Sindhi",
  si: "Sinhala",
  sk: "Slovak",
  sl: "Slovenian",
  so: "Somali",
  sol: "Songhailanguages",
  nbl: "SouthernNdebele",
  sot: "SouthernSotho",
  su: "Sundanese",
  sw: "Swahili",
  sv: "Swedish",
  syr: "Syriac",
  tgl: "Tagalog",
  ty: "Tahiti",
  tg: "Tajik",
  ta: "Tamil",
  tat: "Tatar",
  te: "Telugu",
  tet: "Tetum",
  th: "Thai",
  tir: "Tigrinya",
  to: "Tongan",
  tso: "Tsonga",
  tr: "Turkish",
  tuk: "Turkmen",
  twi: "Twi",
  ug: "Uyghur",
  uk: "Ukrainian",
  ups: "UpperSorbian",
  uz: "Uzbek",
  ven: "Venda",
  vi: "Vietnamese",
  wln: "Walloon",
  cy: "Welsh",
  fry: "WesternFrisian",
  wol: "Wolof",
  xh: "Xhosa",
  yi: "Yiddish",
  yo: "Yoruba",
  yua: "YukatanMayan",
  zaz: "Zaza",
  zu: "Zulu"
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./src/background/background.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _library_translate_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./library/translate.js */ "./src/background/library/translate.js");
/* harmony import */ var _library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./library/blacklist.js */ "./src/background/library/blacklist.js");
/* harmony import */ var _library_analytics_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./library/analytics.js */ "./src/background/library/analytics.js");
/* harmony import */ var common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/scripts/logger.js */ "./src/common/scripts/logger.js");
/* harmony import */ var common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! common/scripts/promise.js */ "./src/common/scripts/promise.js");
/* harmony import */ var common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! common/scripts/channel.js */ "./src/common/scripts/channel.js");
/* harmony import */ var common_scripts_languages_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! common/scripts/languages.js */ "./src/common/scripts/languages.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");
var _chrome$notifications;






// map language abbreviation from browser languages to translation languages



/**
 * Service Worker 오류 필터링 - 알려진 오류 패턴들을 차단
 */
const FILTERED_ERROR_PATTERNS = ["Unable to download", "Unable to download all specified images", "Image loading failed", "Cannot access", "before initialization", "Extension context invalidated", "Canvas error", "Network error"];
function shouldFilterError(message) {
  return FILTERED_ERROR_PATTERNS.some(pattern => message.includes(pattern) || /Cannot access '.*' before initialization/.test(message) || /ReferenceError.*before initialization/.test(message) || /Unable to download.*images/.test(message));
}
(0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.wrapConsoleForFiltering)();

/**
 * Chrome Runtime 오류 처리
 */
try {
  var _chrome$runtime$onSta, _chrome$runtime$onSta2;
  (_chrome$runtime$onSta = chrome.runtime.onStartup) === null || _chrome$runtime$onSta === void 0 ? void 0 : (_chrome$runtime$onSta2 = _chrome$runtime$onSta.addListener) === null || _chrome$runtime$onSta2 === void 0 ? void 0 : _chrome$runtime$onSta2.call(_chrome$runtime$onSta, () => {
    (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logInfo)("Extension startup");
  });
} catch (_unused) {}

// Note: onSuspend is not supported in Safari; intentionally not registering.

/**
 * PDF 내비게이션 가로채기: chrome 기본 PDF 뷰어 대신 내장 PDF.js 뷰어로 열기
 * - MV3 service worker에서 webNavigation.onCommitted 사용
 */
try {
  chrome.webNavigation.onCommitted.addListener(async details => {
    // main_frame 만 처리, chrome://, edge:// 등은 제외
    if (details.frameId !== 0 || !details.url) return;
    const url = details.url;
    if (!/^https?:|^file:|^ftp:/i.test(url)) return;

    // PDF 판별: 확장자 또는 MIME 힌트 파라미터
    const isPdf = /\.pdf($|[?#])/i.test(url);
    if (!isPdf) return;

    // 확장 뷰어 URL 구성: web/viewer.html?file=<encoded>
    // cross-origin 파일을 viewer가 fetch->blob으로 열 수 있게 file 파라미터만 전달
    // Pass original source as source param to allow blob rehydration on refresh
    const viewerUrl = chrome.runtime.getURL(`web/viewer.html?file=${encodeURIComponent(url)}&source=${encodeURIComponent(url)}`);

    // 탭 업데이트로 리디렉션 (드래그/로컬 파일 등 기타 경로는 지원하지 않음)
    try {
      await chrome.tabs.update(details.tabId, {
        url: viewerUrl
      });
    } catch (e) {
      (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)("PDF redirect failed", e);
    }
  });
} catch (e) {
  (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)("webNavigation unavailable", e);
}

/**
 * 전역 에러 및 Promise Rejection 핸들러
 */
if (typeof window !== "undefined") {
  window.addEventListener("error", event => {
    if (event.error && event.error.message && shouldFilterError(event.error.message)) {
      event.preventDefault();
      return false;
    }
  });
  window.addEventListener("unhandledrejection", event => {
    if (event.reason) {
      const message = typeof event.reason === "string" ? event.reason : event.reason.message || event.reason.toString() || "";
      if (shouldFilterError(message)) {
        (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)("필터링된 Promise rejection:", message);
        event.preventDefault();
        return false;
      }
    }
  });
}

/**
 * Service Worker DOM API Mocking - 포괄적 DOM 요소 모킹
 */

// Base MockElement class that all other mock classes can extend
class MockElement {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.nodeName = tagName.toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.childNodes = [];
    this.attributes = new Map();

    // Properties
    this.textContent = "";
    this.innerHTML = "";
    this.outerHTML = "";
    this.className = "";
    this.id = "";
    this.parentNode = null;
    this.style = {};
  }

  // Methods
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
  removeAttribute(name) {
    this.attributes.delete(name);
  }
  appendChild(child) {
    if (child && typeof child === "object") {
      this.children.push(child);
      this.childNodes.push(child);
      child.parentNode = this;
    }
    return child;
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {}
  click() {}
  focus() {}
  blur() {}
}

// Make MockElement available globally
self.MockElement = MockElement;

// Create comprehensive DOM element mock using the base class
function createMockElement(tagName = "div") {
  const element = new MockElement(tagName);

  // Add additional methods and properties
  element.querySelector = () => null;
  element.querySelectorAll = () => [];
  element.getElementsByTagName = () => [];
  element.getElementsByClassName = () => [];
  element.getElementById = () => null;

  // Style object with proxy
  element.style = new Proxy({}, {
    get: () => "",
    set: () => true
  });

  // Source property for images and iframes
  element._src = "";
  Object.defineProperty(element, "src", {
    get() {
      return this._src || "";
    },
    set(value) {
      this._src = value;
      // Simulate load event for images and iframes
      if (this.tagName === "IMG" || this.tagName === "IFRAME") {
        setTimeout(() => {
          if (this.onload) this.onload({
            type: "load",
            target: this
          });
        }, 10);
      }
    }
  });

  // Href property for links
  element._href = "";
  Object.defineProperty(element, "href", {
    get() {
      return this._href || "";
    },
    set(value) {
      this._href = value;
    }
  });

  // Add location property for special cases
  if (tagName.toLowerCase() === "document") {
    element.location = {
      origin: "chrome-extension://",
      pathname: "/background.js",
      search: "",
      href: "chrome-extension://background.js"
    };
  }
  return element;
}

// Mock Audio for Service Worker environment
if (typeof Audio === "undefined") {
  self.Audio = class MockAudio {
    constructor(src) {
      this.src = src || "";
      this.currentTime = 0;
      this.duration = 0;
      this.paused = true;
      this.ended = false;
      this.volume = 1;
      this.muted = false;
    }
    play() {
      this.paused = false;
      return Promise.resolve();
    }
    pause() {
      this.paused = true;
    }
    load() {}
    addEventListener() {}
    removeEventListener() {}
  };
}

// Mock Image for Service Worker environment with comprehensive error handling
if (typeof Image === "undefined") {
  self.Image = class MockImage extends EventTarget {
    constructor(width, height) {
      super();
      this.width = width || 0;
      this.height = height || 0;
      this.complete = true; // Always mark as complete
      this.naturalWidth = width || 100;
      this.naturalHeight = height || 100;
      this._src = "";
      this._onload = null;
      this._onerror = null;

      // Mock successful loading for all images
      this.crossOrigin = null;
      this.loading = "auto";
      this.referrerPolicy = "";
      this.decode = () => Promise.resolve();
    }
    set src(value) {
      this._src = value;
      this.complete = false;

      // Always simulate successful load for any image URL
      setTimeout(() => {
        this.complete = true;
        this.naturalWidth = this.width || 100;
        this.naturalHeight = this.height || 100;

        // Dispatch load event
        const loadEvent = new Event("load");
        this.dispatchEvent(loadEvent);
        if (this._onload) {
          this._onload(loadEvent);
        }
        if (this.onload) {
          this.onload(loadEvent);
        }
      }, 1); // Minimal delay to simulate async behavior
    }
    get src() {
      return this._src;
    }
    set onload(handler) {
      this._onload = handler;
    }
    get onload() {
      return this._onload;
    }
    set onerror(handler) {
      this._onerror = handler;
      // Never call error handler in Service Worker environment
    }
    get onerror() {
      return this._onerror;
    }
    addEventListener(type, listener) {
      super.addEventListener(type, listener);
    }
    removeEventListener(type, listener) {
      super.removeEventListener(type, listener);
    }
  };
}

// Mock DOMParser for Service Worker environment
if (typeof DOMParser === "undefined") {
  self.DOMParser = class MockDOMParser {
    parseFromString(str, mimeType = "text/html") {
      const doc = createMockElement("document");
      doc.documentElement = createMockElement("html");
      doc.head = createMockElement("head");
      doc.body = createMockElement("body");

      // Set up document tree
      doc.documentElement.appendChild(doc.head);
      doc.documentElement.appendChild(doc.body);
      doc.appendChild(doc.documentElement);

      // Basic HTML parsing for common patterns
      if (mimeType === "text/html" && str.includes("rich_tta")) {
        // Create mock element for Bing translator
        const richTtaElement = createMockElement("div");
        richTtaElement.id = "rich_tta";
        richTtaElement.setAttribute("data-iid", "mock-iid-value");
        doc.body.appendChild(richTtaElement);
      }

      // Add basic getElementById that works with parsed content
      doc.getElementById = function (id) {
        function findById(element, targetId) {
          if (element.id === targetId) return element;
          if (element.children) {
            for (let child of element.children) {
              const found = findById(child, targetId);
              if (found) return found;
            }
          }
          return null;
        }
        return findById(this, id);
      };

      // Copy other query methods
      doc.querySelector = self.document.querySelector;
      doc.querySelectorAll = self.document.querySelectorAll;
      doc.createElement = self.document.createElement;
      doc.createTextNode = self.document.createTextNode;
      return doc;
    }
  };
}

// Mock document for Service Worker environment
if (typeof document === "undefined") {
  self.document = createMockElement("document");

  // Initialize document structure properly
  self.document.documentElement = createMockElement("html");
  self.document.head = createMockElement("head");
  self.document.body = createMockElement("body");

  // Set up proper document tree
  self.document.documentElement.appendChild(self.document.head);
  self.document.documentElement.appendChild(self.document.body);
  self.document.appendChild(self.document.documentElement);

  // Add document-specific methods
  self.document.createElement = function (tagName) {
    return createMockElement(tagName);
  };
  self.document.createTextNode = function (text) {
    return {
      nodeType: 3,
      nodeName: "#text",
      textContent: text,
      data: text,
      parentNode: null
    };
  };

  // Enhanced query methods that actually work
  self.document.getElementById = function (id) {
    // Recursively search through all elements for the ID
    function findById(element, targetId) {
      if (element.id === targetId) return element;
      if (element.children) {
        for (let child of element.children) {
          const found = findById(child, targetId);
          if (found) return found;
        }
      }
      return null;
    }
    return findById(self.document, id);
  };
  self.document.querySelector = function (selector) {
    // Basic selector support for common cases
    if (selector.startsWith("#")) {
      return self.document.getElementById(selector.slice(1));
    }
    // For other selectors, return null (can be expanded as needed)
    return null;
  };
  self.document.querySelectorAll = function () {
    return [];
  };
}

// Mock location for Service Worker environment
if (typeof location === "undefined") {
  self.location = {
    origin: "chrome-extension://",
    pathname: "/background.js",
    search: "",
    href: "chrome-extension://background.js",
    protocol: "chrome-extension:",
    host: "",
    hostname: ""
  };
}

/**
 * Service Worker axios 완전 대체
 * ES6 모듈 호이스팅보다 먼저 실행되도록 최상단에 배치
 */
if (typeof importScripts === "function" && typeof window === "undefined") {
  // Service Worker 환경 감지 - axios 완전 대체

  // axios 모듈 차단 (패키지에서 임포트되기 전에)
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function (...args) {
    if (args[1] === "axios" && args[0] === self) {
      // axios 설정을 Service Worker 버전으로 대체
      return originalDefineProperty.call(this, ...args);
    }
    return originalDefineProperty.apply(this, args);
  };
  console.log("[EdgeTranslate] Service Worker 환경 설정 완료 - translators 패키지 호환성 확보");
}

// XMLHttpRequest is not available in Service Workers, so we need to mock it with fetch
if (typeof XMLHttpRequest === "undefined") {
  self.XMLHttpRequest = class MockXMLHttpRequest extends EventTarget {
    constructor() {
      super();
      this.readyState = 0; // UNSENT
      this.status = 0;
      this.statusText = "";
      this.responseText = "";
      this.response = "";
      this.responseType = "";
      this.timeout = 0;
      this.withCredentials = false;

      // Event handlers
      this.onreadystatechange = null;
      this.onload = null;
      this.onerror = null;
      this.onabort = null;
      this.ontimeout = null;

      // Internal state
      this._method = "";
      this._url = "";
      this._async = true;
      this._requestHeaders = {};
      this._aborted = false;
    }

    // Constants
    static get UNSENT() {
      return 0;
    }
    static get OPENED() {
      return 1;
    }
    static get HEADERS_RECEIVED() {
      return 2;
    }
    static get LOADING() {
      return 3;
    }
    static get DONE() {
      return 4;
    }
    get UNSENT() {
      return 0;
    }
    get OPENED() {
      return 1;
    }
    get HEADERS_RECEIVED() {
      return 2;
    }
    get LOADING() {
      return 3;
    }
    get DONE() {
      return 4;
    }
    open(method, url, async = true) {
      this._method = method.toUpperCase();
      this._url = url;
      this._async = async;
      this.readyState = 1; // OPENED
      this._fireReadyStateChange();
    }
    setRequestHeader(header, value) {
      if (this.readyState !== 1) {
        throw new Error("InvalidStateError");
      }
      this._requestHeaders[header] = value;
    }
    send(data = null) {
      if (this.readyState !== 1) {
        throw new Error("InvalidStateError");
      }
      if (this._aborted) return;
      const fetchOptions = {
        method: this._method,
        headers: this._requestHeaders
      };
      if (data && this._method !== "GET" && this._method !== "HEAD") {
        fetchOptions.body = data;
      }

      // Set timeout if specified
      const controller = new AbortController();
      fetchOptions.signal = controller.signal;
      if (this.timeout > 0) {
        setTimeout(() => {
          if (!this._aborted && this.readyState !== 4) {
            controller.abort();
            this._handleTimeout();
          }
        }, this.timeout);
      }
      this.readyState = 2; // HEADERS_RECEIVED
      this._fireReadyStateChange();
      fetch(this._url, fetchOptions).then(response => {
        if (this._aborted) return;
        this.status = response.status;
        this.statusText = response.statusText;
        this.readyState = 3; // LOADING
        this._fireReadyStateChange();
        return response.text();
      }).then(responseText => {
        if (this._aborted) return;
        this.responseText = responseText || "";
        this.response = this.responseType === "json" ? this._tryParseJSON(responseText) : responseText;
        this.readyState = 4; // DONE
        this._fireReadyStateChange();
        if (this.onload) {
          this.onload(new Event("load"));
        }
      }).catch(error => {
        if (this._aborted) return;
        if (error.name === "AbortError") {
          this._handleTimeout();
        } else {
          this.status = 0;
          this.statusText = "";
          this.readyState = 4; // DONE
          this._fireReadyStateChange();
          if (this.onerror) {
            this.onerror(new Event("error"));
          }
        }
      });
    }
    abort() {
      this._aborted = true;
      this.readyState = 4; // DONE
      this._fireReadyStateChange();
      if (this.onabort) {
        this.onabort(new Event("abort"));
      }
    }
    getResponseHeader() {
      // In a real implementation, we'd store response headers
      // For now, return null for simplicity
      return null;
    }
    getAllResponseHeaders() {
      return "";
    }
    _fireReadyStateChange() {
      if (this.onreadystatechange) {
        this.onreadystatechange(new Event("readystatechange"));
      }
      this.dispatchEvent(new Event("readystatechange"));
    }
    _handleTimeout() {
      this.status = 0;
      this.statusText = "";
      this.readyState = 4; // DONE
      this._fireReadyStateChange();
      if (this.ontimeout) {
        this.ontimeout(new Event("timeout"));
      }
    }
    _tryParseJSON(text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return text;
      }
    }
  };
}

// Ensure console is available (it should be in Service Workers, but let's be safe)
if (typeof console === "undefined") {
  self.console = {
    log: () => {},
    warn: () => {},
    error: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {}
  };
}

// Mock window-specific globals that might be referenced
if (typeof navigator === "undefined") {
  self.navigator = {
    language: "en-US",
    languages: ["en-US", "en"],
    userAgent: "Mozilla/5.0 (ServiceWorker)",
    platform: "chrome-extension"
  };
}

// Don't mock fetch at all - let all requests go through normally
// The "Unable to download all specified images" error was likely caused by DOM issues, not fetch issues
// which we've already fixed with the comprehensive DOM mocking above

// Mock URL.createObjectURL for blob handling
if (typeof URL !== "undefined" && !URL.createObjectURL) {
  URL.createObjectURL = function () {
    return `blob:chrome-extension://mock-${Math.random().toString(36).substr(2, 9)}`;
  };
  URL.revokeObjectURL = function () {
    // Mock revoke - do nothing
  };
}

/**
 * Setup context menus - moved inside onInstalled to work with service worker
 */
let contextMenusInitialized = false;
function setupContextMenus() {
  if (contextMenusInitialized) return;
  // Clear existing menus first to avoid duplicate id errors on SW restart/reload
  const createAll = () => {
    const isSafari = "safari" === "safari";
    chrome.contextMenus.create({
      id: "translate",
      title: `${chrome.i18n.getMessage("Translate")} '%s'`,
      contexts: ["selection"]
    });

    // Add an entry to options page for Firefox as it doesn't have one.
    if (false) {}
    chrome.contextMenus.create({
      id: "shortcut",
      title: chrome.i18n.getMessage("ShortcutSetting"),
      contexts: ["action"]
    });
    if (!isSafari && "safari" !== "firefox") {
      chrome.contextMenus.create({
        id: "translate_page",
        title: chrome.i18n.getMessage("TranslatePage"),
        contexts: ["page"]
      });
    }
    if (!isSafari && "safari" !== "firefox") {
      chrome.contextMenus.create({
        id: "translate_page_google",
        title: chrome.i18n.getMessage("TranslatePageGoogle"),
        contexts: ["action"]
      });
    }
    chrome.contextMenus.create({
      id: "add_url_blacklist",
      title: chrome.i18n.getMessage("AddUrlBlacklist"),
      contexts: ["action"],
      enabled: false,
      visible: false
    });
    chrome.contextMenus.create({
      id: "add_domain_blacklist",
      title: chrome.i18n.getMessage("AddDomainBlacklist"),
      contexts: ["action"],
      enabled: false,
      visible: false
    });
    chrome.contextMenus.create({
      id: "remove_url_blacklist",
      title: chrome.i18n.getMessage("RemoveUrlBlacklist"),
      contexts: ["action"],
      enabled: false,
      visible: false
    });
    chrome.contextMenus.create({
      id: "remove_domain_blacklist",
      title: chrome.i18n.getMessage("RemoveDomainBlacklist"),
      contexts: ["action"],
      enabled: false,
      visible: false
    });
    contextMenusInitialized = true;
  };
  try {
    chrome.contextMenus.removeAll(() => {
      // ensure lastError is consumed if present, then create
      void chrome.runtime.lastError;
      createAll();
    });
  } catch (_unused2) {
    createAll();
  }
}

/**
 * 初始化插件配置。
 */
chrome.runtime.onInstalled.addListener(async details => {
  // Setup context menus on installation/startup
  setupContextMenus();
  // 只有在生产环境下，才会展示说明页面
  if (false) {}
});

/**
 * Setup context menus on service worker startup
 */
chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

/**
 * Create communication channel.
 */
const channel = new common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_5__["default"]();

/**
 * Create translator manager and register event listeners and service providers.
 */
const TRANSLATOR_MANAGER = new _library_translate_js__WEBPACK_IMPORTED_MODULE_0__.TranslatorManager(channel);

/**
 * 监听用户点击通知事件
 */
if (chrome.notifications && typeof ((_chrome$notifications = chrome.notifications.onClicked) === null || _chrome$notifications === void 0 ? void 0 : _chrome$notifications.addListener) === "function") {
  chrome.notifications.onClicked.addListener(notificationId => {
    switch (notificationId) {
      case "update_notification":
        chrome.tabs.create({
          // 为releases页面创建一个新的标签页
          url: "https://github.com/EdgeTranslate/EdgeTranslate/releases"
        });
        break;
      case "data_collection_notification":
        chrome.tabs.create({
          // 为设置页面单独创建一个标签页
          url: chrome.runtime.getURL("options/options.html#google-analytics")
        });
        break;
      default:
        break;
    }
  });
}

/**
 * 添加点击菜单后的处理事件
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case "translate":
      channel.requestToTab(tab.id, "get_selection").then(({
        text,
        position
      }) => {
        if (text) {
          return TRANSLATOR_MANAGER.translate(text, position);
        }
        return Promise.reject();
      }).catch(error => {
        // If content scripts can not access the tab the selection, use info.selectionText instead.
        if (info.selectionText.trim()) {
          return TRANSLATOR_MANAGER.translate(info.selectionText, null);
        }
        return Promise.resolve(error);
      });
      break;
    case "translate_page":
      (0,_library_translate_js__WEBPACK_IMPORTED_MODULE_0__.translatePage)(channel);
      break;
    case "translate_page_google":
      (0,_library_translate_js__WEBPACK_IMPORTED_MODULE_0__.executeGoogleScript)(channel);
      break;
    case "settings":
      chrome.runtime.openOptionsPage();
      break;
    case "shortcut":
      chrome.tabs.create({
        url: "chrome://extensions/shortcuts"
      });
      break;
    case "add_url_blacklist":
      (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.addUrlBlacklist)();
      break;
    case "remove_url_blacklist":
      (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.removeUrlBlacklist)();
      break;
    case "add_domain_blacklist":
      (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.addDomainBlacklist)();
      break;
    case "remove_domain_blacklist":
      (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.removeDomainBlacklist)();
      break;
    default:
      break;
  }
});

/**
 * 添加tab切换事件监听，用于更新黑名单信息
 */
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, tab => {
    if (tab.url && tab.url.length > 0) {
      (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.updateBLackListMenu)(tab.url);
    }
  });
});

/**
 * 添加tab刷新事件监听，用于更新黑名单信息
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.active && tab.url && tab.url.length > 0) {
    (0,_library_blacklist_js__WEBPACK_IMPORTED_MODULE_1__.updateBLackListMenu)(tab.url);
  }
});

/**
 * Redirect tab when redirect event happens.
 */
channel.on("redirect", (detail, sender) => chrome.tabs.update(sender.tab.id, {
  url: detail.url
}));

/**
 * Open options page when open_options_page button clicked.
 */
channel.on("open_options_page", () => chrome.runtime.openOptionsPage());

/**
 * Forward page translate event back to pages.
 */
channel.on("page_translate_event", (detail, sender) => {
  channel.emitToTabs(sender.tab.id, "page_translate_event", detail);
});

/**
 * Provide UI language detecting service.
 */
channel.provide("get_lang", () => {
  return Promise.resolve({
    lang: common_scripts_languages_js__WEBPACK_IMPORTED_MODULE_6__.BROWSER_LANGUAGES_MAP[chrome.i18n.getUILanguage()]
  });
});

/**
 *  将快捷键消息转发给content_scripts
 */
chrome.commands.onCommand.addListener(command => {
  switch (command) {
    case "translate_page":
      (0,_library_translate_js__WEBPACK_IMPORTED_MODULE_0__.translatePage)(channel);
      break;
    default:
      common_scripts_promise_js__WEBPACK_IMPORTED_MODULE_4__.promiseTabs.query({
        active: true,
        currentWindow: true
      }).then(tabs => channel.emitToTabs(tabs[0].id, "command", {
        command
      })).catch(() => {});
      break;
  }
});

/**
 * Note: webRequest API has been removed in Manifest V3.
 * Header modifications for CSP and CORS are now handled differently:
 * 1. CSP modifications may need to be handled through content scripts injection
 * 2. CORS issues should be addressed through proper server-side configurations
 * 3. Some functionality may need to be reimplemented using declarativeNetRequest
 *
 * For now, these header modifications are commented out as they require
 * a different approach in Manifest V3. The translation functionality
 * may work without these modifications, or alternative solutions need to be implemented.
 */

// send basic hit data to google analytics
setTimeout(() => {
  (0,_library_analytics_js__WEBPACK_IMPORTED_MODULE_2__.sendHitRequest)("background", "pageview", null);
}, 60 * 1000);

/**
 * dynamic importing hot reload function only in development env
 */
if (false) {}

/**
 * 추가적인 Service Worker 전역 오류 핸들러
 */
if (typeof self !== "undefined" && self.addEventListener) {
  // Service Worker에서의 unhandledrejection 이벤트 처리
  self.addEventListener("unhandledrejection", event => {
    var _event$reason, _event$reason2;
    const message = ((_event$reason = event.reason) === null || _event$reason === void 0 ? void 0 : _event$reason.message) || ((_event$reason2 = event.reason) === null || _event$reason2 === void 0 ? void 0 : _event$reason2.toString()) || "";
    if (shouldFilterError(message)) {
      (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)("Service Worker에서 필터링된 Promise rejection:", message);
      event.preventDefault();
    }
  });

  // Service Worker에서의 일반 error 이벤트 처리
  self.addEventListener("error", event => {
    var _event$error;
    const message = ((_event$error = event.error) === null || _event$error === void 0 ? void 0 : _event$error.message) || event.message || "";
    if (shouldFilterError(message)) {
      (0,common_scripts_logger_js__WEBPACK_IMPORTED_MODULE_3__.logWarn)("Service Worker에서 필터링된 오류:", message);
      event.preventDefault();
    }
  });
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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STtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxJQUFJO0VBQ1RDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixXQUFXLEVBQUUsSUFBSTtFQUNqQkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsUUFBUSxFQUFFLElBQUk7RUFDZCxPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsSUFBSTtFQUNUQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYnJJLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYnNJLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsS0FBSztFQUNULE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsS0FBSztFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYmxPLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYm1PLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2I3TyxFQUFFLEVBQUUsS0FBSztFQUNULE9BQU8sRUFBRSxLQUFLO0VBQ2Q4TyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFF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QUMsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxPQUFPLEVBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxPQUFPLEVBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxLQUFLLEVBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxTQUFTLEVBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxTQUFTLEVBQUMsU0FBUyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUMsSUFBSSxDQUFDLEVB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QUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElB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Q0FBMEMsRUFBRTZRLE9BQU8sQ0FBQztNQUM1REssS0FBSyxDQUFDdWYsY0FBYyxDQUFDLENBQUM7SUFDMUI7RUFDSixDQUFDLENBQUM7O0VBRUY7RUFDQXdCLElBQUksQ0FBQ3RLLGdCQUFnQixDQUFDLE9BQU8sRUFBR3pXLEtBQUssSUFBSztJQUFBLElBQUEwb0IsWUFBQTtJQUN0QyxNQUFNL29CLE9BQU8sR0FBRyxFQUFBK29CLFlBQUEsR0FBQTFvQixLQUFLLENBQUN0TyxLQUFLLGNBQUFnM0IsWUFBQSx1QkFBWEEsWUFBQSxDQUFhL29CLE9BQU8sS0FBSUssS0FBSyxDQUFDTCxPQUFPLElBQUksRUFBRTtJQUMzRCxJQUFJMkksaUJBQWlCLENBQUMzSSxPQUFPLENBQUMsRUFBRTtNQUM1QjdRLGlFQUFPLENBQUMsMkJBQTJCLEVBQUU2USxPQUFPLENBQUM7TUFDN0NLLEtBQUssQ0FBQ3VmLGNBQWMsQ0FBQyxDQUFDO0lBQzFCO0VBQ0osQ0FBQyxDQUFDO0FBQ04sQyIsInNvdXJjZXMiOlsid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2JhY2tncm91bmQvbGlicmFyeS9hbmFseXRpY3MuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvYmFja2dyb3VuZC9saWJyYXJ5L2JsYWNrbGlzdC5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9iYWNrZ3JvdW5kL2xpYnJhcnkvdHJhbnNsYXRlLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2V2ZW50LmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2xhbmd1YWdlcy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9sb2dnZXIuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvcHJvbWlzZS5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9zZXR0aW5ncy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uLi90cmFuc2xhdG9ycy9kaXN0L3RyYW5zbGF0b3JzLmVzLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvYmFja2dyb3VuZC9iYWNrZ3JvdW5kLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL3NldHRpbmdzLmpzXCI7XG5pbXBvcnQgeyBsb2dXYXJuIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL2xvZ2dlci5qc1wiO1xuXG5leHBvcnQgeyBzZW5kSGl0UmVxdWVzdCB9O1xuXG4vLyBzcGVjaWZpY2F0aW9uIG9mIHRoaXMgbW9kdWxlIGlzIGluOiBodHRwczovL2RldmVsb3BlcnMuZ29vZ2xlLmNvbS9hbmFseXRpY3MvZGV2Z3VpZGVzL2NvbGxlY3Rpb24vcHJvdG9jb2wvdjEvcGFyYW1ldGVyc1xuY29uc3QgQU5BTFlUSUNTX0FDQ09VTlQgPSBcIlVBLTE1MzY1OTQ3NC0xXCI7XG5jb25zdCBHQV9VUkwgPSBcImh0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tL2NvbGxlY3RcIjtcblxuLyoqXG4gKiBzZW5kIGhpdCBkYXRhIHRvIGdvb2dsZSBhbmFseXRpY3MgQVBJXG4gKiBcImhpdCB0eXBlXCIgaW5jbHVkZXM6IFwicGFnZXZpZXdcIiwgXCJldmVudFwiXG4gKiBcImV2ZW50IHR5cGVcIiBpbmNsdWRlczogXCJjbGlja1wiLCBcIm9wZW5cIiwgXCJpbnN0YWxsYXRpb25cIlxuICogQHBhcmFtIHtzdHJpbmd9IHBhZ2UgcGFnZSBuYW1lIG9mIHRoZSBjdXJyZW50IGRvY3VtZW50XG4gKiBAcGFyYW0ge3N0cmluZ30gdHlwZSB0eXBlIG9mIGhpdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBleHRyYUhpdERhdGEgZXh0cmEgaGl0KHJlcXVlc3QpIGRhdGFcbiAqL1xuZnVuY3Rpb24gc2VuZEhpdFJlcXVlc3QocGFnZSwgdHlwZSwgZXh0cmFIaXREYXRhKSB7XG4gICAgbGV0IGRvY3VtZW50TG9jYXRpb24gPVxuICAgICAgICB0eXBlb2YgZG9jdW1lbnQgIT09IFwidW5kZWZpbmVkXCIgJiYgZG9jdW1lbnQubG9jYXRpb25cbiAgICAgICAgICAgID8gZG9jdW1lbnQubG9jYXRpb24ub3JpZ2luICsgZG9jdW1lbnQubG9jYXRpb24ucGF0aG5hbWUgKyBkb2N1bWVudC5sb2NhdGlvbi5zZWFyY2hcbiAgICAgICAgICAgIDogXCJjaHJvbWUtZXh0ZW5zaW9uOi8vc2VydmljZS13b3JrZXJcIjtcbiAgICAvLyDsgqzsmqnsnpAg64+Z7J2YIOyLnOyXkOunjCDsoITshqFcbiAgICB3aXRoR29vZ2xlQW5hbHl0aWNzKCgpID0+IHtcbiAgICAgICAgZ2V0VVVJRCgoVVVJRCkgPT4ge1xuICAgICAgICAgICAgLy8gZXN0YWJsaXNoIGJhc2ljIGhpdCBkYXRhKHBheWxvYWQpXG4gICAgICAgICAgICBsZXQgaGl0RGF0YSA9IHtcbiAgICAgICAgICAgICAgICB2OiAxLCAvLyBhbmFseXRpY3MgcHJvdG9jb2wgdmVyc2lvblxuICAgICAgICAgICAgICAgIHRpZDogQU5BTFlUSUNTX0FDQ09VTlQsIC8vIGFuYWx5dGljcyBwcm90b2NvbCB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgY2lkOiBVVUlELCAvLyB1bmlxdWUgdXNlciBJRFxuICAgICAgICAgICAgICAgIHVsOiBuYXZpZ2F0b3IubGFuZ3VhZ2UsIC8vICAgdXNlcidzIGxhbmd1YWdlIHNldHRpbmdcbiAgICAgICAgICAgICAgICBhbjogY2hyb21lLnJ1bnRpbWUuZ2V0TWFuaWZlc3QoKS5uYW1lLCAvLyB0aGUgbmFtZSBvZiB0aGlzIGV4dGVuc2lvblxuICAgICAgICAgICAgICAgIGF2OiBjaHJvbWUucnVudGltZS5nZXRNYW5pZmVzdCgpLnZlcnNpb24sIC8vIHRoZSB2ZXJzaW9uIG51bWJlciBvZiB0aGlzIGV4dGVuc2lvblxuICAgICAgICAgICAgICAgIHQ6IHR5cGUsIC8vIGhpdChyZXF1ZXN0KSB0eXBlXG4gICAgICAgICAgICAgICAgZGw6IGRvY3VtZW50TG9jYXRpb24sIC8vIGRvY3VtZW50IGxvY2F0aW9uXG4gICAgICAgICAgICAgICAgZHA6IGAvJHtwYWdlfWAsIC8vIGRvY3VtZW50IHBhZ2VcbiAgICAgICAgICAgICAgICBkdDogcGFnZSwgLy8gZG9jdW1lbnQgdGl0bGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBtZXJnZSBoaXREYXRhIGFuZCBleHRyYUhpdERhdGFcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oaGl0RGF0YSwgZXh0cmFIaXREYXRhKTtcblxuICAgICAgICAgICAgLy8gU2VydmljZSBXb3JrZXIg7Zi47ZmY7ISx7J2EIOychO2VtCBmZXRjaCBBUEkg7IKs7JqpXG4gICAgICAgICAgICBpZiAodHlwZW9mIFhNTEh0dHBSZXF1ZXN0ID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiB3aW5kb3cgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBTZXJ2aWNlIFdvcmtlciDtmZjqsr3sl5DshJzripQgZmV0Y2gg7IKs7JqpXG4gICAgICAgICAgICAgICAgZmV0Y2goR0FfVVJMLCB7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGJvZHk6IGdlbmVyYXRlVVJMUmVxdWVzdChoaXREYXRhKSxcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbG9nV2FybihcIkFuYWx5dGljcyDsmpTssq0g7Iuk7YyoIChTZXJ2aWNlIFdvcmtlciDtmZjqsr0pOlwiLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIOydvOuwmCDtmZjqsr3sl5DshJzripQgWE1MSHR0cFJlcXVlc3Qg7IKs7JqpXG4gICAgICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgICAgICByZXF1ZXN0Lm9wZW4oXCJQT1NUXCIsIEdBX1VSTCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgcmVxdWVzdC5zZW5kKGdlbmVyYXRlVVJMUmVxdWVzdChoaXREYXRhKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGdlbmVyYXRlIHVybCBhY2NvcmRpbmcgdG8gdGhlIHJlcXVlc3Qgb2JqZWN0XG4gKiBAcGFyYW0ge09iamVjdH0gcmVxdWVzdERhdGEgb2JqZWN0IGNvbnRhaW5zIHJlcXVlc3QgZGF0YVxuICogQHJldHVybnMge3N0cmluZ30gZ2VuZXJhdGVkIHVybFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVVSTFJlcXVlc3QocmVxdWVzdERhdGEpIHtcbiAgICBpZiAoIXJlcXVlc3REYXRhKSByZXR1cm4gXCJcIjtcbiAgICBjb25zdCBwYXJ0cyA9IFtdO1xuICAgIGZvciAobGV0IGtleSBpbiByZXF1ZXN0RGF0YSkge1xuICAgICAgICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChyZXF1ZXN0RGF0YSwga2V5KSkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGsgPSBlbmNvZGVVUklDb21wb25lbnQoa2V5KTtcbiAgICAgICAgY29uc3QgdiA9IGVuY29kZVVSSUNvbXBvbmVudChTdHJpbmcocmVxdWVzdERhdGFba2V5XSkpO1xuICAgICAgICBwYXJ0cy5wdXNoKGAke2t9PSR7dn1gKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcnRzLmpvaW4oXCImXCIpO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gZXhlY3V0ZWQgd2hlbiB0aGUgcmVzdWx0IG9mIHNldHRpbmdzIGlzIHJlYWR5IGFuZCB2YWx1ZSBvZiBVc2VHb29nbGVBbmFseXRpY3MgaXMgdHJ1ZVxuICovXG5mdW5jdGlvbiB3aXRoR29vZ2xlQW5hbHl0aWNzKGNhbGxiYWNrKSB7XG4gICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJPdGhlclNldHRpbmdzXCIsIERFRkFVTFRfU0VUVElOR1MpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBpZiAocmVzdWx0Lk90aGVyU2V0dGluZ3MuVXNlR29vZ2xlQW5hbHl0aWNzKSBjYWxsYmFjaygpO1xuICAgIH0pO1xufVxuXG4vKipcbiAqIGdldCBVVUlEKHVuaXF1ZSB1c2VyIElEKS4gSWYgdXNlciBpcyBuZXcsIGEgbmV3IFVVSUQgd2lsbCBiZSBnZW5lcmF0ZWQgb3IgcmV0dXJuIHRoZSBVVUlEIHN0b3JlZCBpbiBjaHJvbWUgc3RvcmFnZVxuICogQHBhcmFtIHtmdW5jdGlvbihVVUlEKX0gY2FsbGJhY2sgdGhlIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIHJlc3VsdCBpcyByZXR1cm5lZC4gSWYgdXNlciBpcyBuZXcsIHNldCBhIG5ldyBVVUlELiBVVUlEIGlzIGEgZnVuY3Rpb24gcGFyYW1ldGVyIGFzIHJlc3VsdFxuICovXG5mdW5jdGlvbiBnZXRVVUlEKGNhbGxiYWNrKSB7XG4gICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJVVUlEXCIsICgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIFVVSUQ6IGdlbmVyYXRlVVVJRCgpLFxuICAgICAgICB9O1xuICAgIH0pLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQuVVVJRCk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcbiAgICBsZXQgZCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgIGlmICh0eXBlb2YgcGVyZm9ybWFuY2UgIT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIHBlcmZvcm1hbmNlLm5vdyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGQgKz0gcGVyZm9ybWFuY2Uubm93KCk7IC8vdXNlIGhpZ2gtcHJlY2lzaW9uIHRpbWVyIGlmIGF2YWlsYWJsZVxuICAgIH1cbiAgICBsZXQgdXVpZCA9IFwieHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4XCIucmVwbGFjZSgvW3h5XS9nLCAoYykgPT4ge1xuICAgICAgICBsZXQgciA9IChkICsgTWF0aC5yYW5kb20oKSAqIDE2KSAlIDE2IHwgMDtcbiAgICAgICAgZCA9IE1hdGguZmxvb3IoZCAvIDE2KTtcbiAgICAgICAgcmV0dXJuIChjID09IFwieFwiID8gciA6IChyICYgMHgzKSB8IDB4OCkudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xuICAgIHJldHVybiB1dWlkO1xufVxuIiwiaW1wb3J0IHsgZ2V0RG9tYWluLCBsb2cgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCBnZXRPclNldERlZmF1bHRTZXR0aW5ncyB9IGZyb20gXCJjb21tb24vc2NyaXB0cy9zZXR0aW5ncy5qc1wiO1xuXG5leHBvcnQge1xuICAgIGFkZFVybEJsYWNrbGlzdCxcbiAgICBhZGREb21haW5CbGFja2xpc3QsXG4gICAgcmVtb3ZlVXJsQmxhY2tsaXN0LFxuICAgIHJlbW92ZURvbWFpbkJsYWNrbGlzdCxcbiAgICB1cGRhdGVCTGFja0xpc3RNZW51LFxufTtcblxuY29uc3QgRElTQUJMRURfTUFSSyA9IFwiWFwiO1xuXG4vKipcbiAqIOWwhuW9k+WJjemhtemdoueahHVybOa3u+WKoOWIsOm7keWQjeWNlVxuICovXG5mdW5jdGlvbiBhZGRVcmxCbGFja2xpc3QoKSB7XG4gICAgYWRkQmxhY2tsaXN0KFwidXJsc1wiLCAoKSA9PiB7XG4gICAgICAgIGRpc2FibGVJdGVtcyhbXCJhZGRfdXJsX2JsYWNrbGlzdFwiLCBcImFkZF9kb21haW5fYmxhY2tsaXN0XCIsIFwicmVtb3ZlX2RvbWFpbl9ibGFja2xpc3RcIl0pO1xuXG4gICAgICAgIGVuYWJsZUl0ZW1zKFtcInJlbW92ZV91cmxfYmxhY2tsaXN0XCJdKTtcbiAgICB9KTtcblxuICAgIC8vIGNoYW5nZSB0aGUgYmFkZ2UgdGV4dCB3aGVuIGFkZCB1cmwgdG8gYmxhY2tsaXN0XG4gICAgY2hyb21lLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiBESVNBQkxFRF9NQVJLIH0pO1xufVxuXG4vKipcbiAqIOWwhuW9k+WJjemhtemdoueahHVybOenu+WHuum7keWQjeWNlVxuICovXG5mdW5jdGlvbiByZW1vdmVVcmxCbGFja2xpc3QoKSB7XG4gICAgcmVtb3ZlQmxhY2tsaXN0KFwidXJsc1wiLCAoKSA9PiB7XG4gICAgICAgIGRpc2FibGVJdGVtcyhbXCJyZW1vdmVfdXJsX2JsYWNrbGlzdFwiLCBcInJlbW92ZV9kb21haW5fYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICBlbmFibGVJdGVtcyhbXCJhZGRfdXJsX2JsYWNrbGlzdFwiLCBcImFkZF9kb21haW5fYmxhY2tsaXN0XCJdKTtcbiAgICB9KTtcblxuICAgIC8vIGNsZWFyIHRoZSBiYWRnZSB0ZXh0IHdoZW4gcmVtb3ZlIHVybCBmcm9tIGJsYWNrbGlzdFxuICAgIGNocm9tZS5hY3Rpb24uc2V0QmFkZ2VUZXh0KHsgdGV4dDogXCJcIiB9KTtcbn1cblxuLyoqXG4gKiDlsIblvZPliY3pobXpnaLnmoTln5/lkI3mt7vliqDliLDpu5HlkI3ljZVcbiAqL1xuZnVuY3Rpb24gYWRkRG9tYWluQmxhY2tsaXN0KCkge1xuICAgIGFkZEJsYWNrbGlzdChcImRvbWFpbnNcIiwgKCkgPT4ge1xuICAgICAgICBkaXNhYmxlSXRlbXMoW1wiYWRkX3VybF9ibGFja2xpc3RcIiwgXCJhZGRfZG9tYWluX2JsYWNrbGlzdFwiLCBcInJlbW92ZV91cmxfYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICBlbmFibGVJdGVtcyhbXCJyZW1vdmVfZG9tYWluX2JsYWNrbGlzdFwiXSk7XG4gICAgfSk7XG5cbiAgICAvLyBjaGFuZ2UgdGhlIGJhZGdlIHRleHQgd2hlbiBhZGQgZG9tYWluIHRvIGJsYWNrbGlzdFxuICAgIGNocm9tZS5hY3Rpb24uc2V0QmFkZ2VUZXh0KHsgdGV4dDogRElTQUJMRURfTUFSSyB9KTtcbn1cblxuLyoqXG4gKiDlsIblvZPliY3pobXpnaLnmoTln5/lkI3np7vlh7rpu5HlkI3ljZVcbiAqL1xuZnVuY3Rpb24gcmVtb3ZlRG9tYWluQmxhY2tsaXN0KCkge1xuICAgIHJlbW92ZUJsYWNrbGlzdChcImRvbWFpbnNcIiwgKGJsYWNrbGlzdCwgdXJsKSA9PiB7XG4gICAgICAgIC8vIOWmguaenOivpXVybOi/mOWcqHVybOm7keWQjeWNleS4rVxuICAgICAgICBpZiAoYmxhY2tsaXN0LnVybHNbdXJsXSkge1xuICAgICAgICAgICAgZGlzYWJsZUl0ZW1zKFtcImFkZF91cmxfYmxhY2tsaXN0XCIsIFwiYWRkX2RvbWFpbl9ibGFja2xpc3RcIiwgXCJyZW1vdmVfZG9tYWluX2JsYWNrbGlzdFwiXSk7XG5cbiAgICAgICAgICAgIGVuYWJsZUl0ZW1zKFtcInJlbW92ZV91cmxfYmxhY2tsaXN0XCJdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRpc2FibGVJdGVtcyhbXCJyZW1vdmVfdXJsX2JsYWNrbGlzdFwiLCBcInJlbW92ZV9kb21haW5fYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICAgICAgZW5hYmxlSXRlbXMoW1wiYWRkX3VybF9ibGFja2xpc3RcIiwgXCJhZGRfZG9tYWluX2JsYWNrbGlzdFwiXSk7XG5cbiAgICAgICAgICAgIC8vIGNsZWFyIHRoZSBiYWRnZSB0ZXh0IHdoZW4gcmVtb3ZlIGRvbWFpbiBmcm9tIGJsYWNrbGlzdFxuICAgICAgICAgICAgY2hyb21lLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiBcIlwiIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICog5omn6KGM5re75Yqg6buR5ZCN5Y2V55qE55u45YWz5pON5L2cXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGZpZWxkIOWGs+WumuWwhnVybOaLiem7kei/mOaYr+WwhuWfn+WQjeaLiem7kVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sg5Zue6LCDXG4gKi9cbmZ1bmN0aW9uIGFkZEJsYWNrbGlzdChmaWVsZCwgY2FsbGJhY2spIHtcbiAgICBjaHJvbWUudGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9LCAodGFicykgPT4ge1xuICAgICAgICBpZiAodGFicyAmJiB0YWJzWzBdKSB7XG4gICAgICAgICAgICBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhcImJsYWNrbGlzdFwiLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgYmxhY2tsaXN0ID0gcmVzdWx0LmJsYWNrbGlzdDtcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBmaWVsZCA9PT0gXCJ1cmxzXCIgPyB0YWJzWzBdLnVybCA6IGdldERvbWFpbih0YWJzWzBdLnVybCk7XG4gICAgICAgICAgICAgICAgYmxhY2tsaXN0W2ZpZWxkXVt2YWx1ZV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgYmxhY2tsaXN0IH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soYmxhY2tsaXN0LCB0YWJzWzBdLnVybCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vKipcbiAqIOaJp+ihjOenu+WHuum7keWQjeWNleebuOWFs+aTjeS9nFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWVsZCDlhrPlrprku47ln5/lkI3pu5HlkI3ljZXkuK3np7vlh7rov5jmmK/ku451cmzpu5HlkI3ljZXkuK3np7vlh7pcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIOWbnuiwg1xuICovXG5mdW5jdGlvbiByZW1vdmVCbGFja2xpc3QoZmllbGQsIGNhbGxiYWNrKSB7XG4gICAgY2hyb21lLnRhYnMucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSwgKHRhYnMpID0+IHtcbiAgICAgICAgaWYgKHRhYnMgJiYgdGFic1swXSkge1xuICAgICAgICAgICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJibGFja2xpc3RcIiwgREVGQVVMVF9TRVRUSU5HUykudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGJsYWNrbGlzdCA9IHJlc3VsdC5ibGFja2xpc3Q7XG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gZmllbGQgPT09IFwidXJsc1wiID8gdGFic1swXS51cmwgOiBnZXREb21haW4odGFic1swXS51cmwpO1xuICAgICAgICAgICAgICAgIGlmIChibGFja2xpc3RbZmllbGRdW3ZhbHVlXSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgYmxhY2tsaXN0W2ZpZWxkXVt2YWx1ZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgYmxhY2tsaXN0IH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soYmxhY2tsaXN0LCB0YWJzWzBdLnVybCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG4vKipcbiAqIOW9k+eUqOaIt+WIh+aNouWIsOS4gOS4qumhtemdouaXtu+8jOagueaNruivpemhtemdouaYr+WQpuW3sue7j+WcqOm7keWQjeWNleS4reWxleekuuS4jeWQjOeahGNvbnRleHQgbWVudemhuVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwg5YiH5o2i5Yiw55qE6aG16Z2i55qEdXJsXG4gKi9cbmZ1bmN0aW9uIHVwZGF0ZUJMYWNrTGlzdE1lbnUodXJsKSB7XG4gICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJibGFja2xpc3RcIiwgREVGQVVMVF9TRVRUSU5HUykudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQuYmxhY2tsaXN0LmRvbWFpbnNbZ2V0RG9tYWluKHVybCldKSB7XG4gICAgICAgICAgICBkaXNhYmxlSXRlbXMoW1wiYWRkX3VybF9ibGFja2xpc3RcIiwgXCJyZW1vdmVfdXJsX2JsYWNrbGlzdFwiLCBcImFkZF9kb21haW5fYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICAgICAgZW5hYmxlSXRlbXMoW1wicmVtb3ZlX2RvbWFpbl9ibGFja2xpc3RcIl0pO1xuXG4gICAgICAgICAgICAvLyB0aGUgZG9tYWluIGlzIGluIHRoZSBibGFja2xpc3QgYW5kIHVwZGF0ZSB0aGUgYmFkZ2UgdGV4dFxuICAgICAgICAgICAgY2hyb21lLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiBESVNBQkxFRF9NQVJLIH0pO1xuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5ibGFja2xpc3QudXJsc1t1cmxdKSB7XG4gICAgICAgICAgICBkaXNhYmxlSXRlbXMoW1wiYWRkX3VybF9ibGFja2xpc3RcIiwgXCJhZGRfZG9tYWluX2JsYWNrbGlzdFwiLCBcInJlbW92ZV9kb21haW5fYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICAgICAgZW5hYmxlSXRlbXMoW1wicmVtb3ZlX3VybF9ibGFja2xpc3RcIl0pO1xuXG4gICAgICAgICAgICAvLyB0aGUgdXJsIGlzIGluIHRoZSBibGFja2xpc3QgYW5kIHVwZGF0ZSB0aGUgYmFkZ2UgdGV4dFxuICAgICAgICAgICAgY2hyb21lLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiBESVNBQkxFRF9NQVJLIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGlzYWJsZUl0ZW1zKFtcInJlbW92ZV91cmxfYmxhY2tsaXN0XCIsIFwicmVtb3ZlX2RvbWFpbl9ibGFja2xpc3RcIl0pO1xuXG4gICAgICAgICAgICBlbmFibGVJdGVtcyhbXCJhZGRfdXJsX2JsYWNrbGlzdFwiLCBcImFkZF9kb21haW5fYmxhY2tsaXN0XCJdKTtcblxuICAgICAgICAgICAgLy8gdGhlIHVybCBhbmQgZG9tYWluIGlzIG5vdCBpbiB0aGUgYmxhY2tsaXN0IGFuZCBjbGVhciB0aGUgYmFkZ2UgdGV4dFxuICAgICAgICAgICAgY2hyb21lLmFjdGlvbi5zZXRCYWRnZVRleHQoeyB0ZXh0OiBcIlwiIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICog5ZCv55So5oyH5a6a55qEY29udGV4dCBtZW516aG5XG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGl0ZW1zXG4gKi9cbmZ1bmN0aW9uIGVuYWJsZUl0ZW1zKGl0ZW1zKSB7XG4gICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZShcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvZyhgQ2hyb21lIHJ1bnRpbWUgZXJyb3I6ICR7Y2hyb21lLnJ1bnRpbWUubGFzdEVycm9yfWApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiDnpoHnlKjmjIflrprnmoRjb250ZXh0IG1lbnXpoblcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaXRlbXNcbiAqL1xuZnVuY3Rpb24gZGlzYWJsZUl0ZW1zKGl0ZW1zKSB7XG4gICAgaXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLnVwZGF0ZShcbiAgICAgICAgICAgIGl0ZW0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9nKGBDaHJvbWUgcnVudGltZSBlcnJvcjogJHtjaHJvbWUucnVudGltZS5sYXN0RXJyb3J9YCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH0pO1xufVxuIiwiaW1wb3J0IHsgSHlicmlkVHJhbnNsYXRvciB9IGZyb20gXCJAZWRnZV90cmFuc2xhdGUvdHJhbnNsYXRvcnNcIjtcbi8vIGNvbW1vbi5sb2fripQg7ZiE7J6sIO2MjOydvOyXkOyEnCDsp4HsoJEg7IKs7Jqp7ZWY7KeAIOyViuyKteuLiOuLpC5cbmltcG9ydCB7IGxvZ1dhcm4gfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvbG9nZ2VyLmpzXCI7XG5pbXBvcnQgeyBwcm9taXNlVGFicywgZGVsYXlQcm9taXNlIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL3Byb21pc2UuanNcIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL3NldHRpbmdzLmpzXCI7XG5cbmNsYXNzIFRyYW5zbGF0b3JNYW5hZ2VyIHtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge2ltcG9ydChcIi4uLy4uL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIikuZGVmYXVsdH0gY2hhbm5lbCBDb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY2hhbm5lbCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge2ltcG9ydChcIi4uLy4uL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIikuZGVmYXVsdH0gQ29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge1Byb21pc2U8Vm9pZD59IEluaXRpYWxpemUgY29uZmlndXJhdGlvbnMuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbmZpZ19sb2FkZXIgPSBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhcbiAgICAgICAgICAgIFtcIkh5YnJpZFRyYW5zbGF0b3JDb25maWdcIiwgXCJEZWZhdWx0VHJhbnNsYXRvclwiLCBcImxhbmd1YWdlU2V0dGluZ1wiLCBcIk90aGVyU2V0dGluZ3NcIl0sXG4gICAgICAgICAgICBERUZBVUxUX1NFVFRJTkdTXG4gICAgICAgICkudGhlbigoY29uZmlncykgPT4ge1xuICAgICAgICAgICAgLy8gSW5pdCBoeWJyaWQgdHJhbnNsYXRvci5cbiAgICAgICAgICAgIHRoaXMuSFlCUklEX1RSQU5TTEFUT1IgPSBuZXcgSHlicmlkVHJhbnNsYXRvcihjb25maWdzLkh5YnJpZFRyYW5zbGF0b3JDb25maWcsIGNoYW5uZWwpO1xuXG4gICAgICAgICAgICAvLyBTdXBwb3J0ZWQgdHJhbnNsYXRvcnMuXG4gICAgICAgICAgICB0aGlzLlRSQU5TTEFUT1JTID0ge1xuICAgICAgICAgICAgICAgIEh5YnJpZFRyYW5zbGF0ZTogdGhpcy5IWUJSSURfVFJBTlNMQVRPUixcbiAgICAgICAgICAgICAgICAuLi50aGlzLkhZQlJJRF9UUkFOU0xBVE9SLlJFQUxfVFJBTlNMQVRPUlMsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBNdXR1YWwgdHJhbnNsYXRpbmcgbW9kZSBmbGFnLlxuICAgICAgICAgICAgdGhpcy5JTl9NVVRVQUxfTU9ERSA9IGNvbmZpZ3MuT3RoZXJTZXR0aW5ncy5NdXR1YWxUcmFuc2xhdGUgfHwgZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIFRyYW5zbGF0aW9uIGxhbmd1YWdlIHNldHRpbmdzLlxuICAgICAgICAgICAgdGhpcy5MQU5HVUFHRV9TRVRUSU5HID0gY29uZmlncy5sYW5ndWFnZVNldHRpbmc7XG5cbiAgICAgICAgICAgIC8vIFRoZSBkZWZhdWx0IHRyYW5zbGF0b3IgdG8gdXNlLlxuICAgICAgICAgICAgdGhpcy5ERUZBVUxUX1RSQU5TTEFUT1IgPSBjb25maWdzLkRlZmF1bHRUcmFuc2xhdG9yO1xuICAgICAgICB9KTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGVmYXVsdCBUVFMgc3BlZWQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLlRUU19TUEVFRCA9IFwiZmFzdFwiO1xuXG4gICAgICAgIC8vIEluLW1lbW9yeSBjYWNoZXMgYW5kIG9wdGlvbnMgdG8gYXZvaWQgcmVkdW5kYW50IG5ldHdvcmsgcmVxdWVzdHNcbiAgICAgICAgdGhpcy5jYWNoZU9wdGlvbnMgPSB7XG4gICAgICAgICAgICBtYXhFbnRyaWVzOiAzMDAsXG4gICAgICAgICAgICBkZXRlY3RUdGxNczogMTAgKiA2MCAqIDEwMDAsIC8vIDEwIG1pbnV0ZXNcbiAgICAgICAgICAgIHRyYW5zbGF0ZVR0bE1zOiAzMCAqIDYwICogMTAwMCwgLy8gMzAgbWludXRlc1xuICAgICAgICAgICAgbWF4S2V5VGV4dExlbmd0aDogNTAwLFxuICAgICAgICAgICAgZGVib3VuY2VXaW5kb3dNczogMjUwLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmRldGVjdENhY2hlID0gbmV3IE1hcCgpOyAvLyBrZXkgLT4geyB2YWx1ZSwgZXhwaXJlQXQgfVxuICAgICAgICB0aGlzLnRyYW5zbGF0aW9uQ2FjaGUgPSBuZXcgTWFwKCk7IC8vIGtleSAtPiB7IHZhbHVlLCBleHBpcmVBdCB9XG4gICAgICAgIHRoaXMuaW5mbGlnaHREZXRlY3QgPSBuZXcgTWFwKCk7IC8vIGtleSAtPiBQcm9taXNlXG4gICAgICAgIHRoaXMuaW5mbGlnaHRUcmFuc2xhdGUgPSBuZXcgTWFwKCk7IC8vIGtleSAtPiBQcm9taXNlXG4gICAgICAgIHRoaXMubGFzdFRyYW5zbGF0ZUtleSA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdFRyYW5zbGF0ZUF0ID0gMDtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU3RhcnQgdG8gcHJvdmlkZSBzZXJ2aWNlcyBhbmQgbGlzdGVuIHRvIGV2ZW50LlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5wcm92aWRlU2VydmljZXMoKTtcbiAgICAgICAgdGhpcy5saXN0ZW5Ub0V2ZW50cygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENsZWFyIGNhY2hlcyB3aGVuIGNvbmZpZ3VyYXRpb24gb3IgbGFuZ3VhZ2Ugc2V0dGluZ3MgY2hhbmdlXG4gICAgICovXG4gICAgY2xlYXJDYWNoZXMoKSB7XG4gICAgICAgIHRoaXMuZGV0ZWN0Q2FjaGUuY2xlYXIoKTtcbiAgICAgICAgdGhpcy50cmFuc2xhdGlvbkNhY2hlLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTm9ybWFsaXplIHRleHQgZm9yIGNhY2hlIGtleSB1c2FnZTogdHJpbSwgY29sbGFwc2Ugc3BhY2VzLCBhbmQgbGVuZ3RoLWxpbWl0XG4gICAgICovXG4gICAgbm9ybWFsaXplS2V5VGV4dCh0ZXh0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGV4dCAhPT0gXCJzdHJpbmdcIikgcmV0dXJuIFwiXCI7XG4gICAgICAgIGNvbnN0IGNvbGxhcHNlZCA9IHRleHQudHJpbSgpLnJlcGxhY2UoL1xccysvZywgXCIgXCIpO1xuICAgICAgICBpZiAoY29sbGFwc2VkLmxlbmd0aCA8PSB0aGlzLmNhY2hlT3B0aW9ucy5tYXhLZXlUZXh0TGVuZ3RoKSByZXR1cm4gY29sbGFwc2VkO1xuICAgICAgICByZXR1cm4gY29sbGFwc2VkLnNsaWNlKDAsIHRoaXMuY2FjaGVPcHRpb25zLm1heEtleVRleHRMZW5ndGgpO1xuICAgIH1cblxuICAgIG1ha2VEZXRlY3RLZXkodGV4dCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub3JtYWxpemVLZXlUZXh0KHRleHQpO1xuICAgIH1cblxuICAgIG1ha2VUcmFuc2xhdGVLZXkodGV4dCwgc2wsIHRsLCB0cmFuc2xhdG9ySWQpIHtcbiAgICAgICAgY29uc3Qgbm9ybSA9IHRoaXMubm9ybWFsaXplS2V5VGV4dCh0ZXh0KTtcbiAgICAgICAgcmV0dXJuIGAke3RyYW5zbGF0b3JJZH18fCR7c2x9fHwke3RsfXx8JHtub3JtfWA7XG4gICAgfVxuXG4gICAgLyoqIEdldCBmcm9tIGNhY2hlIHdpdGggVFRMIGNoZWNrIGFuZCBMUlUgdG91Y2ggKi9cbiAgICBnZXRGcm9tQ2FjaGUobWFwLCBrZXkpIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBtYXAuZ2V0KGtleSk7XG4gICAgICAgIGlmICghZW50cnkpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICBpZiAoZW50cnkuZXhwaXJlQXQgJiYgZW50cnkuZXhwaXJlQXQgPD0gbm93KSB7XG4gICAgICAgICAgICBtYXAuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICAvLyBUb3VjaCBmb3IgTFJVIGJlaGF2aW9yOiByZS1pbnNlcnQgdG8gYmFja1xuICAgICAgICBtYXAuZGVsZXRlKGtleSk7XG4gICAgICAgIG1hcC5zZXQoa2V5LCBlbnRyeSk7XG4gICAgICAgIHJldHVybiBlbnRyeS52YWx1ZTtcbiAgICB9XG5cbiAgICAvKiogU2V0IGNhY2hlIGVudHJ5IHdpdGggVFRMIGFuZCBzaW1wbGUgTFJVIGV2aWN0aW9uICovXG4gICAgc2V0Q2FjaGVFbnRyeShtYXAsIGtleSwgdmFsdWUsIHR0bE1zKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBleHBpcmVBdCA9IHR0bE1zID8gRGF0ZS5ub3coKSArIHR0bE1zIDogMDtcbiAgICAgICAgICAgIGlmIChtYXAuaGFzKGtleSkpIG1hcC5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIG1hcC5zZXQoa2V5LCB7IHZhbHVlLCBleHBpcmVBdCB9KTtcbiAgICAgICAgICAgIGNvbnN0IG1heCA9IHRoaXMuY2FjaGVPcHRpb25zLm1heEVudHJpZXM7XG4gICAgICAgICAgICBpZiAobWFwLnNpemUgPiBtYXgpIHtcbiAgICAgICAgICAgICAgICAvLyBkZWxldGUgb2xkZXN0IGVudHJ5XG4gICAgICAgICAgICAgICAgY29uc3Qgb2xkZXN0S2V5ID0gbWFwLmtleXMoKS5uZXh0KCkudmFsdWU7XG4gICAgICAgICAgICAgICAgaWYgKG9sZGVzdEtleSAhPT0gdW5kZWZpbmVkKSBtYXAuZGVsZXRlKG9sZGVzdEtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2gge31cbiAgICB9XG5cbiAgICBnZXREZXRlY3Rpb25Gcm9tQ2FjaGUodGV4dCkge1xuICAgICAgICBjb25zdCBrZXkgPSB0aGlzLm1ha2VEZXRlY3RLZXkodGV4dCk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEZyb21DYWNoZSh0aGlzLmRldGVjdENhY2hlLCBrZXkpO1xuICAgIH1cblxuICAgIHJlbWVtYmVyRGV0ZWN0aW9uKHRleHQsIGxhbmcpIHtcbiAgICAgICAgaWYgKCF0ZXh0IHx8ICFsYW5nKSByZXR1cm47XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZURldGVjdEtleSh0ZXh0KTtcbiAgICAgICAgdGhpcy5zZXRDYWNoZUVudHJ5KHRoaXMuZGV0ZWN0Q2FjaGUsIGtleSwgbGFuZywgdGhpcy5jYWNoZU9wdGlvbnMuZGV0ZWN0VHRsTXMpO1xuICAgIH1cblxuICAgIGdldFRyYW5zbGF0aW9uRnJvbUNhY2hlKHRleHQsIHNsLCB0bCwgdHJhbnNsYXRvcklkKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZVRyYW5zbGF0ZUtleSh0ZXh0LCBzbCwgdGwsIHRyYW5zbGF0b3JJZCk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldEZyb21DYWNoZSh0aGlzLnRyYW5zbGF0aW9uQ2FjaGUsIGtleSk7XG4gICAgfVxuXG4gICAgcmVtZW1iZXJUcmFuc2xhdGlvbih0ZXh0LCBzbCwgdGwsIHRyYW5zbGF0b3JJZCwgcmVzdWx0KSB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZVRyYW5zbGF0ZUtleSh0ZXh0LCBzbCwgdGwsIHRyYW5zbGF0b3JJZCk7XG4gICAgICAgIHRoaXMuc2V0Q2FjaGVFbnRyeSh0aGlzLnRyYW5zbGF0aW9uQ2FjaGUsIGtleSwgcmVzdWx0LCB0aGlzLmNhY2hlT3B0aW9ucy50cmFuc2xhdGVUdGxNcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVnaXN0ZXIgc2VydmljZSBwcm92aWRlcnMuXG4gICAgICpcbiAgICAgKiBUaGlzIHNob3VsZCBiZSBjYWxsZWQgZm9yIG9ubHkgb25jZSFcbiAgICAgKi9cbiAgICBwcm92aWRlU2VydmljZXMoKSB7XG4gICAgICAgIC8vIFRyYW5zbGF0ZSBzZXJ2aWNlLlxuICAgICAgICB0aGlzLmNoYW5uZWwucHJvdmlkZShcInRyYW5zbGF0ZVwiLCAocGFyYW1zKSA9PiB0aGlzLnRyYW5zbGF0ZShwYXJhbXMudGV4dCwgcGFyYW1zLnBvc2l0aW9uKSk7XG5cbiAgICAgICAgLy8gUXVpZXQgc2luZ2xlLXRleHQgdHJhbnNsYXRlIHNlcnZpY2UgZm9yIERPTSBwYWdlIHRyYW5zbGF0aW9uIChubyBVSSBldmVudHMpXG4gICAgICAgIHRoaXMuY2hhbm5lbC5wcm92aWRlKFwidHJhbnNsYXRlX3RleHRfcXVpZXRcIiwgYXN5bmMgKHBhcmFtcykgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb25maWdfbG9hZGVyO1xuICAgICAgICAgICAgY29uc3QgdGV4dCA9IHBhcmFtcyAmJiBwYXJhbXMudGV4dCA/IHBhcmFtcy50ZXh0IDogXCJcIjtcbiAgICAgICAgICAgIGlmICghdGV4dCkgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IG9yaWdpbmFsVGV4dDogXCJcIiwgdHJhbnNsYXRlZFRleHQ6IFwiXCIgfSk7XG4gICAgICAgICAgICBsZXQgc2wgPSAocGFyYW1zICYmIHBhcmFtcy5zbCkgfHwgdGhpcy5MQU5HVUFHRV9TRVRUSU5HLnNsIHx8IFwiYXV0b1wiO1xuICAgICAgICAgICAgbGV0IHRsID0gKHBhcmFtcyAmJiBwYXJhbXMudGwpIHx8IHRoaXMuTEFOR1VBR0VfU0VUVElORy50bDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRvcklkID0gdGhpcy5ERUZBVUxUX1RSQU5TTEFUT1I7XG4gICAgICAgICAgICAgICAgLy8gY2FjaGUgZmlyc3RcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5nZXRUcmFuc2xhdGlvbkZyb21DYWNoZSh0ZXh0LCBzbCwgdGwsIHRyYW5zbGF0b3JJZCk7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5UUkFOU0xBVE9SU1t0cmFuc2xhdG9ySWRdLnRyYW5zbGF0ZSh0ZXh0LCBzbCwgdGwpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0KSB0aGlzLnJlbWVtYmVyVHJhbnNsYXRpb24odGV4dCwgc2wsIHRsLCB0cmFuc2xhdG9ySWQsIHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0IHx8IHsgb3JpZ2luYWxUZXh0OiB0ZXh0LCB0cmFuc2xhdGVkVGV4dDogdGV4dCB9KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgb3JpZ2luYWxUZXh0OiB0ZXh0LCB0cmFuc2xhdGVkVGV4dDogdGV4dCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUHJvbm91bmNlIHNlcnZpY2UuXG4gICAgICAgIHRoaXMuY2hhbm5lbC5wcm92aWRlKFwicHJvbm91bmNlXCIsIChwYXJhbXMpID0+IHtcbiAgICAgICAgICAgIGxldCBzcGVlZCA9IHBhcmFtcy5zcGVlZDtcbiAgICAgICAgICAgIGlmICghc3BlZWQpIHtcbiAgICAgICAgICAgICAgICBzcGVlZCA9IHRoaXMuVFRTX1NQRUVEO1xuICAgICAgICAgICAgICAgIHRoaXMuVFRTX1NQRUVEID0gc3BlZWQgPT09IFwiZmFzdFwiID8gXCJzbG93XCIgOiBcImZhc3RcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucHJvbm91bmNlKHBhcmFtcy5wcm9ub3VuY2luZywgcGFyYW1zLnRleHQsIHBhcmFtcy5sYW5ndWFnZSwgc3BlZWQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBHZXQgYXZhaWxhYmxlIHRyYW5zbGF0b3JzIHNlcnZpY2UuXG4gICAgICAgIHRoaXMuY2hhbm5lbC5wcm92aWRlKFwiZ2V0X2F2YWlsYWJsZV90cmFuc2xhdG9yc1wiLCAocGFyYW1zKSA9PlxuICAgICAgICAgICAgUHJvbWlzZS5yZXNvbHZlKHRoaXMuZ2V0QXZhaWxhYmxlVHJhbnNsYXRvcnMocGFyYW1zKSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLyBVcGRhdGUgZGVmYXVsdCB0cmFuc2xhdG9yIHNlcnZpY2UuXG4gICAgICAgIHRoaXMuY2hhbm5lbC5wcm92aWRlKFwidXBkYXRlX2RlZmF1bHRfdHJhbnNsYXRvclwiLCAoZGV0YWlsKSA9PlxuICAgICAgICAgICAgdGhpcy51cGRhdGVEZWZhdWx0VHJhbnNsYXRvcihkZXRhaWwudHJhbnNsYXRvcilcbiAgICAgICAgKTtcbiAgICAgICAgLy8gVFRTIOyZhOujjCDsnbTrsqTtirgg7KSR6rOEIOyEnOu5hOyKpFxuICAgICAgICB0aGlzLmNoYW5uZWwucHJvdmlkZShcInR0c19maW5pc2hlZFwiLCBhc3luYyAocGFyYW1zKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGFiSWQgPSBhd2FpdCB0aGlzLmdldEN1cnJlbnRUYWJJZCgpO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRUYWJJZCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoYW5uZWwuZW1pdFRvVGFicyhjdXJyZW50VGFiSWQsIFwicHJvbm91bmNpbmdfZmluaXNoZWRcIiwgcGFyYW1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFRUUyDsmKTrpZgg7J2067Kk7Yq4IOykkeqzhCDshJzruYTsiqRcbiAgICAgICAgdGhpcy5jaGFubmVsLnByb3ZpZGUoXCJ0dHNfZXJyb3JcIiwgYXN5bmMgKHBhcmFtcykgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudFRhYklkID0gYXdhaXQgdGhpcy5nZXRDdXJyZW50VGFiSWQoKTtcbiAgICAgICAgICAgIGlmIChjdXJyZW50VGFiSWQgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jaGFubmVsLmVtaXRUb1RhYnMoY3VycmVudFRhYklkLCBcInByb25vdW5jaW5nX2Vycm9yXCIsIHBhcmFtcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlZ2lzdGVyIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgKlxuICAgICAqIFRoaXMgc2hvdWxkIGJlIGNhbGxlZCBmb3Igb25seSBvbmNlIVxuICAgICAqL1xuICAgIGxpc3RlblRvRXZlbnRzKCkge1xuICAgICAgICAvLyBHb29nbGUgcGFnZSB0cmFuc2xhdGUgYnV0dG9uIGNsaWNrZWQgZXZlbnQuXG4gICAgICAgIHRoaXMuY2hhbm5lbC5vbihcInRyYW5zbGF0ZV9wYWdlX2dvb2dsZVwiLCAoKSA9PiB7XG4gICAgICAgICAgICAvLyBTYWZhcmkvRmlyZWZveOyXkOyEnOuKlCDsoITssrQg7Y6Y7J207KeAIOuyiOyXrSDruYTtmZzshLHtmZRcbiAgICAgICAgICAgIGlmICh0eXBlb2YgQlJPV1NFUl9FTlYgIT09IFwidW5kZWZpbmVkXCIgJiYgQlJPV1NFUl9FTlYgIT09IFwiY2hyb21lXCIpIHJldHVybjtcbiAgICAgICAgICAgIGV4ZWN1dGVHb29nbGVTY3JpcHQodGhpcy5jaGFubmVsKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gTGFuZ3VhZ2Ugc2V0dGluZyB1cGRhdGVkIGV2ZW50LlxuICAgICAgICB0aGlzLmNoYW5uZWwub24oXCJsYW5ndWFnZV9zZXR0aW5nX3VwZGF0ZVwiLCB0aGlzLm9uTGFuZ3VhZ2VTZXR0aW5nVXBkYXRlZC5iaW5kKHRoaXMpKTtcblxuICAgICAgICAvLyBSZXN1bHQgZnJhbWUgY2xvc2VkIGV2ZW50LlxuICAgICAgICB0aGlzLmNoYW5uZWwub24oXCJmcmFtZV9jbG9zZWRcIiwgdGhpcy5zdG9wUHJvbm91bmNlLmJpbmQodGhpcykpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBVcGRhdGUgY29uZmlnIGNhY2hlIG9uIGNvbmZpZyBjaGFuZ2VkLlxuICAgICAgICAgKi9cbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKFxuICAgICAgICAgICAgKGFzeW5jIChjaGFuZ2VzLCBhcmVhKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGFyZWEgPT09IFwic3luY1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEVuc3VyZSB0aGF0IGNvbmZpZ3VyYXRpb25zIGhhdmUgYmVlbiBpbml0aWFsaXplZC5cbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb25maWdfbG9hZGVyO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VzW1wiSHlicmlkVHJhbnNsYXRvckNvbmZpZ1wiXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5IWUJSSURfVFJBTlNMQVRPUi51c2VDb25maWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlc1tcIkh5YnJpZFRyYW5zbGF0b3JDb25maWdcIl0ubmV3VmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsZWFyQ2FjaGVzKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlc1tcIk90aGVyU2V0dGluZ3NcIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuSU5fTVVUVUFMX01PREUgPSBjaGFuZ2VzW1wiT3RoZXJTZXR0aW5nc1wiXS5uZXdWYWx1ZS5NdXR1YWxUcmFuc2xhdGU7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2hhbmdlc1tcImxhbmd1YWdlU2V0dGluZ1wiXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5MQU5HVUFHRV9TRVRUSU5HID0gY2hhbmdlc1tcImxhbmd1YWdlU2V0dGluZ1wiXS5uZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJDYWNoZXMoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGFuZ2VzW1wiRGVmYXVsdFRyYW5zbGF0b3JcIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuREVGQVVMVF9UUkFOU0xBVE9SID0gY2hhbmdlc1tcIkRlZmF1bHRUcmFuc2xhdG9yXCJdLm5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGVhckNhY2hlcygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBjbGVhciBpbmZsaWdodCB0byBhdm9pZCBkYW5nbGluZyBwcm9taXNlcyBrZXllZCBieSBvbGQgdHJhbnNsYXRvclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmZsaWdodERldGVjdC5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmZsaWdodFRyYW5zbGF0ZS5jbGVhcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuYmluZCh0aGlzKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIGdldCB0aGUgaWQgb2YgdGhlIGN1cnJlbnQgdGFiXG4gICAgICogaWYgdGhlIGN1cnJlbnQgdGFiIGNhbid0IGRpc3BsYXkgdGhlIHJlc3VsdCBwYW5lbFxuICAgICAqIG9wZW4gYSBub3RpY2UgcGFnZSB0byBkaXNwbGF5IHRoZSByZXN1bHQgYW5kIGV4cGxhaW4gd2h5IHRoZSBwYWdlIHNob3dzXG4gICAgICogQHJldHVybnMgdGhlIHRhYiBpZC4gSWYgdGFiSWQ9PT0tMSwgdGhlIHVzZXIgaXMgc2V0dGluZyB0aGUgZmlsZSBVUkxzIGFjY2VzcyBwZXJtaXNzaW9uIGFuZCBub3RoaW5nIHNob3VsZCBiZSBkb25lLlxuICAgICAqL1xuICAgIGFzeW5jIGdldEN1cnJlbnRUYWJJZCgpIHtcbiAgICAgICAgbGV0IHRhYklkID0gLTE7XG4gICAgICAgIGNvbnN0IHRhYnMgPSBhd2FpdCBwcm9taXNlVGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KTtcbiAgICAgICAgdGFiSWQgPSB0YWJzWzBdLmlkO1xuXG4gICAgICAgIC8vIHRvIHRlc3Qgd2hldGhlciB0aGUgY3VycmVudCB0YWIgY2FuIHJlY2VpdmUgbWVzc2FnZShkaXNwbGF5IHJlc3VsdHMpXG4gICAgICAgIGF3YWl0IHRoaXMuY2hhbm5lbC5yZXF1ZXN0VG9UYWIodGFiSWQsIFwiY2hlY2tfYXZhaWxhYmlsaXR5XCIpLmNhdGNoKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNob3VsZE9wZW5Ob3RpY2VQYWdlID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBUaGUgcGFnZSBpcyBhIGxvY2FsIGZpbGUgcGFnZVxuICAgICAgICAgICAgICAgIGlmICgvXmZpbGU6XFwvXFwuKi8udGVzdCh0YWJzWzBdLnVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTm90ZTogY2hyb21lLmV4dGVuc2lvbi5pc0FsbG93ZWRGaWxlU2NoZW1lQWNjZXNzIGlzIG5vdCBhdmFpbGFibGUgaW4gTWFuaWZlc3QgdjNcbiAgICAgICAgICAgICAgICAgICAgLy8gRm9yIG5vdywgd2UnbGwgYXNzdW1lIGZpbGUgc2NoZW1lIGFjY2VzcyBpcyBub3QgYXZhaWxhYmxlIGFuZCBzaG93IHRoZSBub3RpY2UgcGFnZVxuICAgICAgICAgICAgICAgICAgICBpZiAoY29uZmlybShjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiUGVybWlzc2lvblJlbWluZFwiKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBgY2hyb21lOi8vZXh0ZW5zaW9ucy8/aWQ9JHtjaHJvbWUucnVudGltZS5pZH1gLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHJlc29sdmUodHJ1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghc2hvdWxkT3Blbk5vdGljZVBhZ2UpIHtcbiAgICAgICAgICAgICAgICB0YWJJZCA9IC0xO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogdGhlIGN1cnJlbnQgdGFiIGNhbid0IGRpc3BsYXkgdGhlIHJlc3VsdCBwYW5lbFxuICAgICAgICAgICAgICogc28gd2Ugb3BlbiBhIG5vdGljZSBwYWdlIHRvIGRpc3BsYXkgdGhlIHJlc3VsdCBhbmQgZXhwbGFpbiB3aHkgdGhpcyBwYWdlIHNob3dzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGNvbnN0IG5vdGljZVBhZ2VVcmwgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoXCJjb250ZW50L25vdGljZS9ub3RpY2UuaHRtbFwiKTtcbiAgICAgICAgICAgIC8vIGdldCB0aGUgdGFiIGlkIG9mIGFuIGV4aXN0aW5nIG5vdGljZSBwYWdlXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhYiA9IChhd2FpdCBwcm9taXNlVGFicy5xdWVyeSh7IHVybDogbm90aWNlUGFnZVVybCB9KSlbMF07XG4gICAgICAgICAgICAgICAgLy8ganVtcCB0byB0aGUgZXhpc3RlZCBwYWdlXG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMuaGlnaGxpZ2h0KHtcbiAgICAgICAgICAgICAgICAgICAgdGFiczogdGFiLmluZGV4LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRhYklkID0gdGFiLmlkO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBjcmVhdGUgYSBuZXcgbm90aWNlIHBhZ2VcbiAgICAgICAgICAgICAgICBjb25zdCB0YWIgPSBhd2FpdCBwcm9taXNlVGFicy5jcmVhdGUoe1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG5vdGljZVBhZ2VVcmwsXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyB3YWl0IGZvciBicm93c2VyIHRvIG9wZW4gYSBuZXcgcGFnZVxuICAgICAgICAgICAgICAgIGF3YWl0IGRlbGF5UHJvbWlzZSgyMDApO1xuICAgICAgICAgICAgICAgIHRhYklkID0gdGFiLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHRhYklkO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqXG4gICAgICog5qOA5rWL57uZ5a6a5paH5pys55qE6K+t6KiA44CCXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdGV4dCDpnIDopoHmo4DmtYvnmoTmlofmnKxcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPFN0cmluZz59IGRldGVjdGVkIGxhbmd1YWdlIFByb21pc2VcbiAgICAgKi9cbiAgICBhc3luYyBkZXRlY3QodGV4dCkge1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCBjb25maWd1cmF0aW9ucyBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQuXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnX2xvYWRlcjtcbiAgICAgICAgaWYgKCF0ZXh0KSByZXR1cm4gXCJcIjtcbiAgICAgICAgY29uc3QgY2FjaGVkID0gdGhpcy5nZXREZXRlY3Rpb25Gcm9tQ2FjaGUodGV4dCk7XG4gICAgICAgIGlmIChjYWNoZWQpIHJldHVybiBjYWNoZWQ7XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZURldGVjdEtleSh0ZXh0KTtcbiAgICAgICAgaWYgKHRoaXMuaW5mbGlnaHREZXRlY3QuaGFzKGtleSkpIHJldHVybiB0aGlzLmluZmxpZ2h0RGV0ZWN0LmdldChrZXkpO1xuICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5UUkFOU0xBVE9SU1t0aGlzLkRFRkFVTFRfVFJBTlNMQVRPUl1cbiAgICAgICAgICAgIC5kZXRlY3QodGV4dClcbiAgICAgICAgICAgIC50aGVuKChkZXRlY3RlZCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkZXRlY3RlZCkgdGhpcy5yZW1lbWJlckRldGVjdGlvbih0ZXh0LCBkZXRlY3RlZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRldGVjdGVkO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KCgpID0+IHRoaXMuaW5mbGlnaHREZXRlY3QuZGVsZXRlKGtleSkpO1xuICAgICAgICB0aGlzLmluZmxpZ2h0RGV0ZWN0LnNldChrZXksIHByb21pc2UpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKlxuICAgICAqIFRoaXMgaXMgYSB0cmFuc2xhdGlvbiBjbGllbnQgZnVuY3Rpb25cbiAgICAgKiAxLiBnZXQgbGFuZ3VhZ2Ugc2V0dGluZ3NcbiAgICAgKiAyLiBpZiBzb3VyY2UgbGFuZ3VhZ2UgaXMgXCJhdXRvXCIsIHVzZSBub3JtYWwgdHJhbnNsYXRpb24gbW9kZVxuICAgICAqIDMuIGVsc2UgdXNlIG11dHVhbCB0cmFuc2xhdGlvbiBtb2RlKGF1dG8gdHJhbnNsYXRlIGZyb20gYm90aCBzaWRlcylcbiAgICAgKiA0LiBzZW5kIHJlcXVlc3QsIGdldCByZXN1bHRcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IG9yaWdpbmFsIHRleHQgdG8gYmUgdHJhbnNsYXRlZFxuICAgICAqIEBwYXJhbSB7QXJyYXk8TnVtYmVyPn0gcG9zaXRpb24gcG9zaXRpb24gb2YgdGhlIHRleHRcbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSB0cmFuc2xhdGUgZmluaXNoZWQgUHJvbWlzZVxuICAgICAqL1xuICAgIGFzeW5jIHRyYW5zbGF0ZSh0ZXh0LCBwb3NpdGlvbikge1xuICAgICAgICAvLyBFbnN1cmUgdGhhdCBjb25maWd1cmF0aW9ucyBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQuXG4gICAgICAgIGF3YWl0IHRoaXMuY29uZmlnX2xvYWRlcjtcblxuICAgICAgICAvLyBnZXQgY3VycmVudCB0YWIgaWRcbiAgICAgICAgY29uc3QgY3VycmVudFRhYklkID0gYXdhaXQgdGhpcy5nZXRDdXJyZW50VGFiSWQoKTtcbiAgICAgICAgaWYgKGN1cnJlbnRUYWJJZCA9PT0gLTEpIHJldHVybjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IGN1cnJlbnQgdGltZSBhcyB0aW1lc3RhbXAuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRpbWVzdGFtcCBpcyB1c2VkIGZvciBwcmV2ZW50aW5nIGRpc29yZGVyZWQgdHJhbnNsYXRpbmcgbWVzc2FnZSB0byBkaXN0dXJiIHVzZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEV2ZXJ5IHRyYW5zbGF0aW5nIHJlcXVlc3QgaGFzIGEgdW5pcXVlIHRpbWVzdGFtcCBhbmQgZXZlcnkgbWVzc2FnZSBmcm9tIHRoYXQgdHJhbnNsYXRpbmdcbiAgICAgICAgICogcmVxdWVzdCB3aWxsIGJlIGFzc2lnbmVkIHdpdGggdGhlIHRpbWVzdGFtcC4gQWJvdXQgdXNhZ2Ugb2YgdGhlIHRpbWVzdGFtcCwgcGxlYXNlIHJlZmVyXG4gICAgICAgICAqIHRvIGRpc3BsYXkuanMuXG4gICAgICAgICAqL1xuICAgICAgICBsZXQgdGltZXN0YW1wID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgLy8gSW5mb3JtIGN1cnJlbnQgdGFiIHRyYW5zbGF0aW5nIHN0YXJ0ZWQuXG4gICAgICAgIHRoaXMuY2hhbm5lbC5lbWl0VG9UYWJzKGN1cnJlbnRUYWJJZCwgXCJzdGFydF90cmFuc2xhdGluZ1wiLCB7XG4gICAgICAgICAgICB0ZXh0LFxuICAgICAgICAgICAgcG9zaXRpb24sXG4gICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBzbCA9IHRoaXMuTEFOR1VBR0VfU0VUVElORy5zbDtcbiAgICAgICAgbGV0IHRsID0gdGhpcy5MQU5HVUFHRV9TRVRUSU5HLnRsO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoc2wgIT09IFwiYXV0b1wiICYmIHRoaXMuSU5fTVVUVUFMX01PREUpIHtcbiAgICAgICAgICAgICAgICAvLyBtdXR1YWwgdHJhbnNsYXRlIG1vZGUsIGRldGVjdCBsYW5ndWFnZSBmaXJzdC5cbiAgICAgICAgICAgICAgICAvLyB0cnkgY2FjaGUgZmlyc3QgaW5zaWRlIGRldGVjdCgpXG4gICAgICAgICAgICAgICAgc2wgPSBhd2FpdCB0aGlzLmRldGVjdCh0ZXh0KTtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHNsKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgdGhpcy5MQU5HVUFHRV9TRVRUSU5HLnNsOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGwgPSB0aGlzLkxBTkdVQUdFX1NFVFRJTkcudGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSB0aGlzLkxBTkdVQUdFX1NFVFRJTkcudGw6XG4gICAgICAgICAgICAgICAgICAgICAgICB0bCA9IHRoaXMuTEFOR1VBR0VfU0VUVElORy5zbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgc2wgPSBcImF1dG9cIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRsID0gdGhpcy5MQU5HVUFHRV9TRVRUSU5HLnRsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRGVib3VuY2UgYnVyc3QgY2FsbHMgb2Ygc2FtZSBrZXkgd2l0aGluIGEgd2luZG93XG4gICAgICAgICAgICBjb25zdCB0cmFuc2xhdG9ySWQgPSB0aGlzLkRFRkFVTFRfVFJBTlNMQVRPUjtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRoaXMubWFrZVRyYW5zbGF0ZUtleSh0ZXh0LCBzbCwgdGwsIHRyYW5zbGF0b3JJZCk7XG4gICAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFRyYW5zbGF0ZUtleSA9PT0ga2V5ICYmXG4gICAgICAgICAgICAgICAgbm93IC0gdGhpcy5sYXN0VHJhbnNsYXRlQXQgPCB0aGlzLmNhY2hlT3B0aW9ucy5kZWJvdW5jZVdpbmRvd01zXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAvLyBTa2lwIGR1cGxpY2F0ZSBpbW1lZGlhdGUgY2FsbHM7IHJlbHlpbmcgb24gY2FjaGUvaW5mbGlnaHRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubGFzdFRyYW5zbGF0ZUtleSA9IGtleTtcbiAgICAgICAgICAgIHRoaXMubGFzdFRyYW5zbGF0ZUF0ID0gbm93O1xuXG4gICAgICAgICAgICAvLyBUcnkgdHJhbnNsYXRpb24gY2FjaGUgZmlyc3RcbiAgICAgICAgICAgIGxldCByZXN1bHQgPSB0aGlzLmdldFRyYW5zbGF0aW9uRnJvbUNhY2hlKHRleHQsIHNsLCB0bCwgdHJhbnNsYXRvcklkKTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5mbGlnaHRUcmFuc2xhdGUuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5pbmZsaWdodFRyYW5zbGF0ZS5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9taXNlID0gdGhpcy5UUkFOU0xBVE9SU1t0cmFuc2xhdG9ySWRdXG4gICAgICAgICAgICAgICAgICAgICAgICAudHJhbnNsYXRlKHRleHQsIHNsLCB0bClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzKSB0aGlzLnJlbWVtYmVyVHJhbnNsYXRpb24odGV4dCwgc2wsIHRsLCB0cmFuc2xhdG9ySWQsIHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmluYWxseSgoKSA9PiB0aGlzLmluZmxpZ2h0VHJhbnNsYXRlLmRlbGV0ZShrZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbmZsaWdodFRyYW5zbGF0ZS5zZXQoa2V5LCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgcHJvbWlzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXN1bHQuc291cmNlTGFuZ3VhZ2UgPSBzbDtcbiAgICAgICAgICAgIHJlc3VsdC50YXJnZXRMYW5ndWFnZSA9IHRsO1xuXG4gICAgICAgICAgICAvLyBTZW5kIHRyYW5zbGF0aW5nIHJlc3VsdCB0byBjdXJyZW50IHRhYi5cbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbC5lbWl0VG9UYWJzKGN1cnJlbnRUYWJJZCwgXCJ0cmFuc2xhdGluZ19maW5pc2hlZFwiLCB7XG4gICAgICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgICAgIC4uLnJlc3VsdCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgLy8gSW5mb3JtIGN1cnJlbnQgdGFiIHRyYW5zbGF0aW5nIGZhaWxlZC5cbiAgICAgICAgICAgIHRoaXMuY2hhbm5lbC5lbWl0VG9UYWJzKGN1cnJlbnRUYWJJZCwgXCJ0cmFuc2xhdGluZ19lcnJvclwiLCB7XG4gICAgICAgICAgICAgICAgZXJyb3IsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUZXh0IHRvIHNwZWVjaCBwcm94eS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9ub3VuY2luZyB3aGljaCB0ZXh0IGFyZSB3ZSBwcm9ub3VuY2luZz8gZW51bXtzb3VyY2UsIHRhcmdldH1cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dC5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbGFuZ3VhZ2UgVGhlIGxhbmd1YWdlIG9mIHRoZSB0ZXh0LlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzcGVlZCBUaGUgc3BlZWQgb2YgdGhlIHNwZWVjaC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSBwcm9ub3VuY2UgZmluaXNoZWQgUHJvbWlzZVxuICAgICAqL1xuICAgIGFzeW5jIHByb25vdW5jZShwcm9ub3VuY2luZywgdGV4dCwgbGFuZ3VhZ2UsIHNwZWVkKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IGNvbmZpZ3VyYXRpb25zIGhhdmUgYmVlbiBpbml0aWFsaXplZC5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWdfbG9hZGVyO1xuXG4gICAgICAgIC8vIGdldCBjdXJyZW50IHRhYiBpZFxuICAgICAgICBjb25zdCBjdXJyZW50VGFiSWQgPSBhd2FpdCB0aGlzLmdldEN1cnJlbnRUYWJJZCgpO1xuICAgICAgICBpZiAoY3VycmVudFRhYklkID09PSAtMSkgcmV0dXJuO1xuXG4gICAgICAgIGxldCBsYW5nID0gbGFuZ3VhZ2U7XG4gICAgICAgIGxldCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcblxuICAgICAgICAvLyBJbmZvcm0gY3VycmVudCB0YWIgcHJvbm91bmNpbmcgc3RhcnRlZC5cbiAgICAgICAgdGhpcy5jaGFubmVsLmVtaXRUb1RhYnMoY3VycmVudFRhYklkLCBcInN0YXJ0X3Byb25vdW5jaW5nXCIsIHtcbiAgICAgICAgICAgIHByb25vdW5jaW5nLFxuICAgICAgICAgICAgdGV4dCxcbiAgICAgICAgICAgIGxhbmd1YWdlLFxuICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICB9KTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGxhbmd1YWdlID09PSBcImF1dG9cIikge1xuICAgICAgICAgICAgICAgIGxhbmcgPSBhd2FpdCB0aGlzLlRSQU5TTEFUT1JTW3RoaXMuREVGQVVMVF9UUkFOU0xBVE9SXS5kZXRlY3QodGV4dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNlcnZpY2UgV29ya2Vy7JeQ7ISc64qUIFRUUyBBUEnrpbwg7IKs7Jqp7ZWgIOyImCDsl4bsnLzrr4DroZxcbiAgICAgICAgICAgIC8vIENvbnRlbnQgU2NyaXB07JeQIFRUUyDsi6TtlonsnYQg7JqU7LKt7ZWp64uI64ukXG4gICAgICAgICAgICB0aGlzLmNoYW5uZWwuZW1pdFRvVGFicyhjdXJyZW50VGFiSWQsIFwiZXhlY3V0ZV90dHNcIiwge1xuICAgICAgICAgICAgICAgIHByb25vdW5jaW5nLFxuICAgICAgICAgICAgICAgIHRleHQsXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IGxhbmcsXG4gICAgICAgICAgICAgICAgc3BlZWQsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wLFxuICAgICAgICAgICAgICAgIHRyYW5zbGF0b3I6IHRoaXMuREVGQVVMVF9UUkFOU0xBVE9SLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAvLyBJbmZvcm0gY3VycmVudCB0YWIgcHJvbm91bmNpbmcgZmFpbGVkLlxuICAgICAgICAgICAgdGhpcy5jaGFubmVsLmVtaXRUb1RhYnMoY3VycmVudFRhYklkLCBcInByb25vdW5jaW5nX2Vycm9yXCIsIHtcbiAgICAgICAgICAgICAgICBwcm9ub3VuY2luZyxcbiAgICAgICAgICAgICAgICBlcnJvcixcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFN0b3AgcHJvbm91bmNlIHByb3h5LlxuICAgICAqL1xuICAgIGFzeW5jIHN0b3BQcm9ub3VuY2UoKSB7XG4gICAgICAgIC8vIEVuc3VyZSB0aGF0IGNvbmZpZ3VyYXRpb25zIGhhdmUgYmVlbiBpbml0aWFsaXplZC5cbiAgICAgICAgYXdhaXQgdGhpcy5jb25maWdfbG9hZGVyO1xuXG4gICAgICAgIC8vIENvbnRlbnQgU2NyaXB07JeQ7IScIFRUUyDspJHsp4DtlZjrj4TroZ0g7JqU7LKtXG4gICAgICAgIGNvbnN0IGN1cnJlbnRUYWJJZCA9IGF3YWl0IHRoaXMuZ2V0Q3VycmVudFRhYklkKCk7XG4gICAgICAgIGlmIChjdXJyZW50VGFiSWQgIT09IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmNoYW5uZWwuZW1pdFRvVGFicyhjdXJyZW50VGFiSWQsIFwic3RvcF90dHNcIiwge1xuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS5nZXRUaW1lKCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuVFJBTlNMQVRPUlNbdGhpcy5ERUZBVUxUX1RSQU5TTEFUT1JdLnN0b3BQcm9ub3VuY2UoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdHJhbnNsYXRvcnMgdGhhdCBzdXBwb3J0IGdpdmVuIHNvdXJjZSBsYW5ndWFnZSBhbmQgdGFyZ2V0IGxhbmd1YWdlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IGRldGFpbCBjdXJyZW50IGxhbmd1YWdlIHNldHRpbmcsIGRldGFpbC5mcm9tIGlzIHNvdXJjZSBsYW5ndWFnZSwgZGV0YWlsLnRvIGlzIHRhcmdldCBsYW5ndWFnZVxuICAgICAqXG4gICAgICogQHJldHVybnMge0FycmF5PFN0cmluZz59IGF2YWlsYWJsZSB0cmFuc2xhdG9ycyBQcm9taXNlLlxuICAgICAqL1xuICAgIGdldEF2YWlsYWJsZVRyYW5zbGF0b3JzKGRldGFpbCkge1xuICAgICAgICBpZiAoIXRoaXMuSFlCUklEX1RSQU5TTEFUT1IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiSFlCUklEX1RSQU5TTEFUT1Igbm90IGluaXRpYWxpemVkIHlldFwiKTtcbiAgICAgICAgICAgIHJldHVybiBbXCJIeWJyaWRUcmFuc2xhdGVcIl07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFtcIkh5YnJpZFRyYW5zbGF0ZVwiXS5jb25jYXQoXG4gICAgICAgICAgICB0aGlzLkhZQlJJRF9UUkFOU0xBVE9SLmdldEF2YWlsYWJsZVRyYW5zbGF0b3JzRm9yKGRldGFpbC5mcm9tLCBkZXRhaWwudG8pXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogTGFuZ3VhZ2Ugc2V0dGluZyB1cGRhdGUgZXZlbnQgbGlzdGVuZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGV0YWlsIHVwZGF0ZWQgbGFuZ3VhZ2Ugc2V0dGluZywgZGV0YWlsLmZyb20gaXMgc291cmNlIGxhbmd1YWdlLCBkZXRhaWwudG8gaXMgdGFyZ2V0IGxhbmd1YWdlXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTx2b2lkPn0gZmluaXNoZWQgUHJvbWlzZVxuICAgICAqL1xuICAgIGFzeW5jIG9uTGFuZ3VhZ2VTZXR0aW5nVXBkYXRlZChkZXRhaWwpIHtcbiAgICAgICAgbGV0IHNlbGVjdGVkVHJhbnNsYXRvciA9IHRoaXMuREVGQVVMVF9UUkFOU0xBVE9SO1xuXG4gICAgICAgIC8vIEdldCB0cmFuc2xhdG9ycyBzdXBwb3J0aW5nIG5ldyBsYW5ndWFnZSBzZXR0aW5nLlxuICAgICAgICBsZXQgYXZhaWxhYmxlVHJhbnNsYXRvcnMgPSB0aGlzLmdldEF2YWlsYWJsZVRyYW5zbGF0b3JzKGRldGFpbCk7XG5cbiAgICAgICAgLy8gVXBkYXRlIGh5YnJpZCB0cmFuc2xhdG9yIGNvbmZpZy5cbiAgICAgICAgY29uc3QgbmV3Q29uZmlnID0gdGhpcy5IWUJSSURfVFJBTlNMQVRPUi51cGRhdGVDb25maWdGb3IoZGV0YWlsLmZyb20sIGRldGFpbC50byk7XG4gICAgICAgIC8vIFVwZGF0ZSBjb25maWcuXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHsgSHlicmlkVHJhbnNsYXRvckNvbmZpZzogbmV3Q29uZmlnIH0pO1xuXG4gICAgICAgIC8vIENsZWFyIGNhY2hlcyBhcyBsYW5ndWFnZSBwYWlyaW5nIGNoYW5nZWRcbiAgICAgICAgdGhpcy5jbGVhckNhY2hlcygpO1xuXG4gICAgICAgIC8vIElmIGN1cnJlbnQgZGVmYXVsdCB0cmFuc2xhdG9yIGRvZXMgbm90IHN1cHBvcnQgbmV3IGxhbmd1YWdlIHNldHRpbmcsIHVwZGF0ZSBpdC5cbiAgICAgICAgaWYgKCFuZXcgU2V0KGF2YWlsYWJsZVRyYW5zbGF0b3JzKS5oYXMoc2VsZWN0ZWRUcmFuc2xhdG9yKSkge1xuICAgICAgICAgICAgc2VsZWN0ZWRUcmFuc2xhdG9yID0gYXZhaWxhYmxlVHJhbnNsYXRvcnNbMV07XG4gICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldCh7IERlZmF1bHRUcmFuc2xhdG9yOiBzZWxlY3RlZFRyYW5zbGF0b3IgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbmZvcm0gb3B0aW9ucyBwYWdlIHRvIHVwZGF0ZSBvcHRpb25zLlxuICAgICAgICB0aGlzLmNoYW5uZWwuZW1pdChcImh5YnJpZF90cmFuc2xhdG9yX2NvbmZpZ191cGRhdGVkXCIsIHtcbiAgICAgICAgICAgIGNvbmZpZzogbmV3Q29uZmlnLFxuICAgICAgICAgICAgYXZhaWxhYmxlVHJhbnNsYXRvcnM6IGF2YWlsYWJsZVRyYW5zbGF0b3JzLnNsaWNlKDEpLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBJbmZvcm0gcmVzdWx0IGZyYW1lIHRvIHVwZGF0ZSBvcHRpb25zLlxuICAgICAgICBwcm9taXNlVGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KS50aGVuKCh0YWJzKSA9PlxuICAgICAgICAgICAgdGhpcy5jaGFubmVsLmVtaXRUb1RhYnModGFic1swXS5pZCwgXCJ1cGRhdGVfdHJhbnNsYXRvcl9vcHRpb25zXCIsIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RlZFRyYW5zbGF0b3IsXG4gICAgICAgICAgICAgICAgYXZhaWxhYmxlVHJhbnNsYXRvcnMsXG4gICAgICAgICAgICB9KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVwZGF0ZSB0cmFuc2xhdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHRyYW5zbGF0b3IgdGhlIG5ldyB0cmFuc2xhdG9yIHRvIHVzZS5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPHZvaWQ+fSB1cGRhdGUgZmluaXNoZWQgcHJvbWlzZS5cbiAgICAgKi9cbiAgICB1cGRhdGVEZWZhdWx0VHJhbnNsYXRvcih0cmFuc2xhdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBEZWZhdWx0VHJhbnNsYXRvcjogdHJhbnNsYXRvciB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiDkvb/nlKjnlKjmiLfpgInlrprnmoTnvZHpobXnv7vor5HlvJXmk47nv7vor5HlvZPliY3nvZHpobXjgIJcbiAqXG4gKiBAcGFyYW0ge2ltcG9ydChcIi4uLy4uL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIikuZGVmYXVsdH0gY2hhbm5lbCBDb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKi9cbmZ1bmN0aW9uIHRyYW5zbGF0ZVBhZ2UoY2hhbm5lbCkge1xuICAgIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzKFtcIkRlZmF1bHRQYWdlVHJhbnNsYXRvclwiLCBcImxhbmd1YWdlU2V0dGluZ1wiXSwgREVGQVVMVF9TRVRUSU5HUykudGhlbihcbiAgICAgICAgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdHJhbnNsYXRvciA9IHJlc3VsdC5EZWZhdWx0UGFnZVRyYW5zbGF0b3I7XG4gICAgICAgICAgICAvLyBjb25zdCB0YXJnZXRMYW5nID0gKHJlc3VsdC5sYW5ndWFnZVNldHRpbmcgJiYgcmVzdWx0Lmxhbmd1YWdlU2V0dGluZy50bCkgfHwgXCJlblwiO1xuXG4gICAgICAgICAgICAvLyBTYWZhcmkvRmlyZWZveOyXkOyEnOuKlCDsoITssrQg7Y6Y7J207KeAIOuyiOyXreydhCDsoJzqs7XtlZjsp4Ag7JWK7J2MXG4gICAgICAgICAgICBpZiAodHlwZW9mIEJST1dTRVJfRU5WICE9PSBcInVuZGVmaW5lZFwiICYmIEJST1dTRVJfRU5WICE9PSBcImNocm9tZVwiKSByZXR1cm47XG5cbiAgICAgICAgICAgIHN3aXRjaCAodHJhbnNsYXRvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJHb29nbGVQYWdlVHJhbnNsYXRlXCI6XG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVHb29nbGVTY3JpcHQoY2hhbm5lbCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJEb21QYWdlVHJhbnNsYXRlXCI6XG4gICAgICAgICAgICAgICAgICAgIC8vIFNhZmFyaSDsmbgg67iM65287Jqw7KCA7JeQ7ISc66eMIOyCrOyaqVxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlVGFicy5xdWVyeSh7IGFjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZSB9KS50aGVuKCh0YWJzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGFicyAmJiB0YWJzWzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwic3RhcnRfZG9tX3BhZ2VfdHJhbnNsYXRlXCIsIHt9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGV4ZWN1dGVHb29nbGVTY3JpcHQoY2hhbm5lbCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgKTtcbn1cblxuLyoqXG4gKiDmiafooYzosLfmrYznvZHpobXnv7vor5Hnm7jlhbPohJrmnKzjgIJcbiAqXG4gKiBAcGFyYW0ge2ltcG9ydChcIi4uLy4uL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIikuZGVmYXVsdH0gY2hhbm5lbCBDb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKi9cbmZ1bmN0aW9uIGV4ZWN1dGVHb29nbGVTY3JpcHQoY2hhbm5lbCkge1xuICAgIHByb21pc2VUYWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pLnRoZW4oKHRhYnMpID0+IHtcbiAgICAgICAgaWYgKHRhYnNbMF0pIHtcbiAgICAgICAgICAgIC8vIFByZWZlciBkaXJlY3QgZXhlY3V0ZVNjcmlwdCBvbiBTYWZhcmkgKGNvbnRlbnQtc2NyaXB0IHdvcmxkIGJ5cGFzc2VzIHBhZ2UgQ1NQKVxuICAgICAgICAgICAgY29uc3QgaXNTYWZhcmkgPSAoKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbmF2aWdhdG9yID09PSBcInVuZGVmaW5lZFwiIHx8ICFuYXZpZ2F0b3IudXNlckFnZW50KSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc3QgdWEgPSBuYXZpZ2F0b3IudXNlckFnZW50O1xuICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgIC9TYWZhcmlcXC8vLnRlc3QodWEpICYmXG4gICAgICAgICAgICAgICAgICAgICEvQ2hyb21lXFwvLy50ZXN0KHVhKSAmJlxuICAgICAgICAgICAgICAgICAgICAhL0Nocm9taXVtXFwvLy50ZXN0KHVhKSAmJlxuICAgICAgICAgICAgICAgICAgICAhL0VkZ1xcLy8udGVzdCh1YSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSkoKTtcbiAgICAgICAgICAgIGlmIChpc1NhZmFyaSkge1xuICAgICAgICAgICAgICAgIC8vIFJ1biBpbml0LmpzIGluIElTT0xBVEVEIHdvcmxkIChkZWZhdWx0KSBzbyBjaHJvbWUuKiBpcyBhdmFpbGFibGU7IGl0IHdpbGwgaW5qZWN0IGEgcGFnZSBzY3JpcHQgKGluamVjdGlvbi5qcylcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnNjcmlwdGluZyAmJiBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLmV4ZWN1dGVTY3JpcHQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFic1swXS5pZCwgYWxsRnJhbWVzOiBmYWxzZSB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCJnb29nbGUvaW5pdC5qc1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RJbW1lZGlhdGVseTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwic3RhcnRfcGFnZV90cmFuc2xhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdG9yOiBcImdvb2dsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIOuztOyhsCDqsr3roZw6IOuwsOuEiCDsi6TtjKgg64yA67mEIERPTSDtj7TrsLHrj4Qg67OR7ZaJIO2KuOumrOqxsFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLmVtaXRUb1RhYnModGFic1swXS5pZCwgXCJzdGFydF9kb21fcGFnZV90cmFuc2xhdGVcIiwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5leGVjdXRlU2NyaXB0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFic1swXS5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgZmlsZTogXCJnb29nbGUvaW5pdC5qc1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwic3RhcnRfcGFnZV90cmFuc2xhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdG9yOiBcImdvb2dsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLmVtaXRUb1RhYnMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJzWzBdLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJzdGFydF9kb21fcGFnZV90cmFuc2xhdGVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgODAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLmVtaXRUb1RhYnModGFic1swXS5pZCwgXCJpbmplY3RfcGFnZV90cmFuc2xhdGVcIiwge30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoYW5uZWwuZW1pdFRvVGFicyh0YWJzWzBdLmlkLCBcInN0YXJ0X2RvbV9wYWdlX3RyYW5zbGF0ZVwiLCB7fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDgwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBoYXNTY3JpcHRpbmcgPVxuICAgICAgICAgICAgICAgIHR5cGVvZiBjaHJvbWUgIT09IFwidW5kZWZpbmVkXCIgJiYgY2hyb21lLnNjcmlwdGluZyAmJiBjaHJvbWUuc2NyaXB0aW5nLmV4ZWN1dGVTY3JpcHQ7XG4gICAgICAgICAgICBpZiAoaGFzU2NyaXB0aW5nKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZ1xuICAgICAgICAgICAgICAgICAgICAuZXhlY3V0ZVNjcmlwdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQ6IHsgdGFiSWQ6IHRhYnNbMF0uaWQgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVzOiBbXCJnb29nbGUvaW5pdC5qc1wiXSxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwic3RhcnRfcGFnZV90cmFuc2xhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0b3I6IFwiZ29vZ2xlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nV2FybihgQ2hyb21lIHNjcmlwdGluZyBlcnJvcjogJHtlcnJvcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpbmFsIGZhbGxiYWNrOiBhc2sgY29udGVudCBzY3JpcHQgdG8gaW5qZWN0XG4gICAgICAgICAgICAgICAgICAgICAgICBjaGFubmVsLmVtaXRUb1RhYnModGFic1swXS5pZCwgXCJpbmplY3RfcGFnZV90cmFuc2xhdGVcIiwge30pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gTVYyLWNvbXBhdGlibGUgZXhlY3V0ZVNjcmlwdCB2aWEgdGFic1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLmV4ZWN1dGVTY3JpcHQodGFic1swXS5pZCwgeyBmaWxlOiBcImdvb2dsZS9pbml0LmpzXCIgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwic3RhcnRfcGFnZV90cmFuc2xhdGVcIiwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0b3I6IFwiZ29vZ2xlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZGVsZWdhdGUgdG8gY29udGVudCBzY3JpcHRcbiAgICAgICAgICAgICAgICAgICAgY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwiaW5qZWN0X3BhZ2VfdHJhbnNsYXRlXCIsIHt9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLyoqXG4gKiBPcGVuIEdvb2dsZSBzaXRlIHRyYW5zbGF0ZSBwcm94eSBmb3IgY3VycmVudCB0YWIgVVJMIChTYWZhcmkgZmFsbGJhY2spLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRMYW5nIHRhcmdldCBsYW5ndWFnZSBsaWtlICdlbicsICd6aC1DTidcbiAqL1xuLy8gZnVuY3Rpb24gb3Blbkdvb2dsZVNpdGVUcmFuc2xhdGUodGFyZ2V0TGFuZykge1xuLy8gICAgIHByb21pc2VUYWJzLnF1ZXJ5KHsgYWN0aXZlOiB0cnVlLCBjdXJyZW50V2luZG93OiB0cnVlIH0pLnRoZW4oKHRhYnMpID0+IHtcbi8vICAgICAgICAgaWYgKCF0YWJzWzBdKSByZXR1cm47XG4vLyAgICAgICAgIGNvbnN0IGN1cnJlbnRVcmwgPSB0YWJzWzBdLnVybCB8fCBcIlwiO1xuLy8gICAgICAgICBpZiAoIWN1cnJlbnRVcmwpIHJldHVybjtcbi8vICAgICAgICAgY29uc3QgcHJveHkgPSBgaHR0cHM6Ly90cmFuc2xhdGUuZ29vZ2xlLmNvbS90cmFuc2xhdGU/c2w9YXV0byZ0bD0ke2VuY29kZVVSSUNvbXBvbmVudChcbi8vICAgICAgICAgICAgIHRhcmdldExhbmdcbi8vICAgICAgICAgKX0mdT0ke2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50VXJsKX1gO1xuLy8gICAgICAgICB0cnkge1xuLy8gICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBwcm94eSB9KTtcbi8vICAgICAgICAgfSBjYXRjaCAoZSkge1xuLy8gICAgICAgICAgICAgbG9nV2FybihcIk9wZW4gR29vZ2xlIHNpdGUgdHJhbnNsYXRlIGZhaWxlZFwiLCBlKTtcbi8vICAgICAgICAgfVxuLy8gICAgIH0pO1xuLy8gfVxuXG5leHBvcnQgeyBUcmFuc2xhdG9yTWFuYWdlciwgdHJhbnNsYXRlUGFnZSwgZXhlY3V0ZUdvb2dsZVNjcmlwdCB9O1xuIiwiaW1wb3J0IEV2ZW50TWFuYWdlciBmcm9tIFwiLi9ldmVudC5qc1wiO1xuXG4vKipcbiAqIENoYW5uZWwgZm9yIGludGVyLWNvbnRleHQgY29tbXVuaWNhdGlvbi5cbiAqXG4gKiBBIGNocm9tZSBleHRlbnNpb24gdHlwaWNhbGx5IGNvbnRhaW5zIDQgdHlwZXMgb2YgY29udGV4dDogYmFja2dyb3VuZCwgcG9wdXAsXG4gKiBvcHRpb25zIGFuZCBjb250ZW50IHNjcmlwdHMuIENvbW11bmljYXRpb24gYmV0d2VlbiB0aGVzZSBjb250ZXh0cyByZWxpZXMgb25cbiAqIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlIGFuZCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyB0d28gY29tbXVuaWNhdGlvbiBtb2RlbDpcbiAqICAgKiByZXF1ZXN0L3Jlc3BvbnNlXG4gKiAgICogZXZlbnQgdHJpZ2dlci9saXN0ZW5cbiAqXG4gKiBiYXNlZCBvbiBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSBhbmQgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UuXG4gKi9cbmNsYXNzIENoYW5uZWwge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxTdHJpbmcsIEZ1bmN0aW9uPn0gc2VydmljZXNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3NlcnZpY2VzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7RXZlbnRNYW5hZ2VyfSBFdmVudCBtYW5hZ2VyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZXZlbnRNYW5hZ2VyID0gbmV3IEV2ZW50TWFuYWdlcigpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciBtYXNzYWdlIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuICAgICAgICAgICAgKChtZXNzYWdlLCBzZW5kZXIsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXBhcnNlZCB8fCAhcGFyc2VkLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFkIG1lc3NhZ2U6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGFyc2VkLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV2ZW50XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudE1hbmFnZXIuZW1pdChwYXJzZWQuZXZlbnQsIHBhcnNlZC5kZXRhaWwsIHNlbmRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXJ2aWNlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlciA9IHRoaXMuX3NlcnZpY2VzLmdldChwYXJzZWQuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlcnZlcikgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGNhbiBjYWxsIHRoZSBjYWxsYmFjayBvbmx5IHdoZW4gd2UgcmVhbGx5IHByb3ZpZGUgdGhlIHJlcXVlc3RlZCBzZXJ2aWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyKHBhcnNlZC5wYXJhbXMsIHNlbmRlcikudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0KSA9PiBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVua25vd24gbWVzc2FnZSB0eXBlOiAke21lc3NhZ2UudHlwZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvdmlkZSBhIHNlcnZpY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gc2VydmVyIHNlcnZlciwgc2VydmVyIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgUHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwcm92aWRlKHNlcnZpY2UsIHNlcnZlcikge1xuICAgICAgICB0aGlzLl9zZXJ2aWNlcy5zZXQoc2VydmljZSwgc2VydmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgcmVxdWVzdCBhbmQgZ2V0IGEgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlIG5hbWVcbiAgICAgKiBAcGFyYW0ge0FueX0gcGFyYW1zIHNlcnZpY2UgcGFyYW1ldGVyc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEFueT59IHByb21pc2Ugb2YgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcmVxdWVzdChzZXJ2aWNlLCBwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJzZXJ2aWNlXCIsIHNlcnZpY2UsIHBhcmFtcyB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgcmVxdWVzdCB0byB0aGUgc3BlY2lmaWVkIHRhYiBhbmQgZ2V0IGEgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGFiSWQgdGFiIGlkXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlcnZpY2Ugc2VydmljZVxuICAgICAqIEBwYXJhbSB7QW55fSBwYXJhbXMgc2VydmljZSBwYXJhbWV0ZXJzXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QW55Pn0gcHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICByZXF1ZXN0VG9UYWIodGFiSWQsIHNlcnZpY2UsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBzZW5kID0gdGhpcy5fZ2V0VGFiTWVzc2FnZVNlbmRlcigpO1xuICAgICAgICBpZiAoIXNlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIkNhbiBub3Qgc2VuZCBtZXNzYWdlIHRvIHRhYnMgaW4gY3VycmVudCBjb250ZXh0IVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwic2VydmljZVwiLCBzZXJ2aWNlLCBwYXJhbXMgfSk7XG4gICAgICAgIHJldHVybiBzZW5kKHRhYklkLCBtZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gZXZlbnQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0byBoYW5kbGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIGV2ZW50IGhhbmRsZXIsIGFjY2VwdHMgdHdvIGFyZ3VtZW50czpcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZXZlbnQgZGV0YWlsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSBvZiB0aGUgZXZlbnQsIGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXIgb2JqZWN0XG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBhIGNhbmNlbGVyIHRoYXQgd2lsbCByZW1vdmUgdGhlIGhhbmRsZXIgd2hlbiBjYWxsZWRcbiAgICAgKi9cbiAgICBvbihldmVudCwgaGFuZGxlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRNYW5hZ2VyLm9uKGV2ZW50LCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbWl0IGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtBbnl9IGRldGFpbCBldmVudCBkZXRhaWxcbiAgICAgKi9cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZXZlbnRcIiwgZXZlbnQsIGRldGFpbCB9KTtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW1pdCBhbiBldmVudCB0byBzcGVjaWZpZWQgdGFicy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgQXJyYXk8TnVtYmVyPn0gdGFiSWRzIHRhYiBpZHNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0FueX0gZGV0YWlsIGV2ZW50IGRldGFpbFxuICAgICAqL1xuICAgIGVtaXRUb1RhYnModGFiSWRzLCBldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IHNlbmQgPSB0aGlzLl9nZXRUYWJNZXNzYWdlU2VuZGVyKCk7XG4gICAgICAgIGlmICghc2VuZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNhbiBub3Qgc2VuZCBtZXNzYWdlIHRvIHRhYnMgaW4gY3VycmVudCBjb250ZXh0IVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRhYklkcyBpcyBhIG51bWJlciwgd3JhcCBpdCB1cCB3aXRoIGFuIGFycmF5LlxuICAgICAgICBpZiAodHlwZW9mIHRhYklkcyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdGFiSWRzID0gW3RhYklkc107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImV2ZW50XCIsIGV2ZW50LCBkZXRhaWwgfSk7XG4gICAgICAgIGZvciAobGV0IHRhYklkIG9mIHRhYklkcykge1xuICAgICAgICAgICAgc2VuZCh0YWJJZCwgbWVzc2FnZSkuY2F0Y2goKGVycm9yKSA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2RcbiAgICAgKlxuICAgICAqIEdldCB0aGUgbWVzc2FnZSBzZW5kaW5nIGZ1bmN0aW9uIGZvciBzZW5kaW5nIG1lc3NhZ2UgdG8gdGFicy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbiB8IG51bGx9IG1lc3NhZ2Ugc2VuZGVyXG4gICAgICovXG4gICAgX2dldFRhYk1lc3NhZ2VTZW5kZXIoKSB7XG4gICAgICAgIGlmIChCUk9XU0VSX0VOViA9PT0gXCJmaXJlZm94XCIpIHtcbiAgICAgICAgICAgIGlmICghYnJvd3Nlci50YWJzIHx8ICFicm93c2VyLnRhYnMuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmlyZWZveCB1c2VzIFByb21pc2UsIHJldHVybiBkaXJlY3RseS5cbiAgICAgICAgICAgIHJldHVybiBicm93c2VyLnRhYnMuc2VuZE1lc3NhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNocm9tZS50YWJzIHx8ICFjaHJvbWUudGFicy5zZW5kTWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaHJvbWUgdXNlcyBjYWxsYmFjaywgd3JhcCBpdCB1cC5cbiAgICAgICAgcmV0dXJuICh0YWJJZCwgbWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwgbWVzc2FnZSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDaGFubmVsO1xuIiwiZXhwb3J0IHsgZ2V0RG9tYWluLCBsb2cgfTtcbmltcG9ydCB7IGxvZ0luZm8gfSBmcm9tIFwiLi9sb2dnZXIuanNcIjtcblxuLyoqXG4gKiDmj5Dlj5bnu5nlrprnmoR1cmznmoTln5/lkI1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKi9cbmZ1bmN0aW9uIGdldERvbWFpbih1cmwpIHtcbiAgICBpZiAodXJsKSB7XG4gICAgICAgIGxldCBVUkxfUEFUVEVSTiA9IC8uKzpcXC8rKFtcXHcuLV0rKS4qLztcbiAgICAgICAgbGV0IGdyb3VwcyA9IHVybC5tYXRjaChVUkxfUEFUVEVSTik7XG4gICAgICAgIGlmIChncm91cHMpIHtcbiAgICAgICAgICAgIHJldHVybiBncm91cHNbMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFwiXCI7XG59XG5cbi8qKlxuICogY29uc29sZS5sb2cgd3JhcHBlci5cbiAqXG4gKiBAcGFyYW0ge0FueX0gbWVzc2FnZSBtZXNzYWdlIHRvIGxvZy5cbiAqL1xuZnVuY3Rpb24gbG9nKG1lc3NhZ2UpIHtcbiAgICBsb2dJbmZvKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIHNldCB0aGUgY29udGVudCB0ZXh0IG9mIEhUTUwgdGFncywgd2hpY2ggaGF2ZSBcImkxOG5cIiBjbGFzcyBuYW1lLCB3aXRoIGkxOG4gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5IVE1MKCkge1xuICAgIGxldCBpMThuRWxlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaTE4blwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGkxOG5FbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBEZWZhdWx0IFwiYmVmb3JlRW5kXCIuXG4gICAgICAgIGxldCBwb3MgPSBcImJlZm9yZUVuZFwiO1xuICAgICAgICBpZiAoaTE4bkVsZW1lbnRzW2ldLmhhc0F0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKSkge1xuICAgICAgICAgICAgcG9zID0gaTE4bkVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi3n+maj+a1j+iniOWZqOeahOivreiogOiuvue9ruaYvuekuuWGheWuuVxuICAgICAgICBpMThuRWxlbWVudHNbaV0uaW5zZXJ0QWRqYWNlbnRUZXh0KFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShpMThuRWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKFwiZGF0YS1pMThuLW5hbWVcIikpXG4gICAgICAgICk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBFdmVudCBtYW5hZ2VyLlxuICovXG5jbGFzcyBFdmVudE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn0gbmV4dCBoYW5kbGVyIElELlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faGFuZGxlcklEID0gMTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxTdHJpbmcsIFNldDxOdW1iZXI+Pn0gZXZlbnQgdG8gaGFuZGxlciBJRHMgbWFwXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudFRvSGFuZGxlcklEcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxOdW1iZXIsIEZ1bmN0aW9uPn0gaGFuZGxlciBJRCB0byBoYW5kbGVyIG1hcFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGhhbmRsZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgZXZlbnQgaGFuZGxlciwgYWNjZXB0cyB0d28gYXJndW1lbnRzOlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBldmVudCBkZXRhaWxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlIG9mIHRoZSBldmVudCwgY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlciBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IGEgY2FuY2VsZXIgdGhhdCB3aWxsIHJlbW92ZSB0aGUgaGFuZGxlciB3aGVuIGNhbGxlZFxuICAgICAqL1xuICAgIG9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRCA9IHRoaXMuX2FsbG9jSGFuZGxlcklEKCk7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5zZXQoaGFuZGxlcklELCBoYW5kbGVyKTtcblxuICAgICAgICBpZiAodGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KS5hZGQoaGFuZGxlcklEKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLnNldChldmVudCwgbmV3IFNldChbaGFuZGxlcklEXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWFjaCBjYW5jZWxlciBzaG91bGQgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAgICAgICAgbGV0IGNhbmNlbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjYW5jZWxlZCkge1xuICAgICAgICAgICAgICAgIGNhbmNlbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9vZmYoZXZlbnQsIGhhbmRsZXJJRCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIllvdSBzaG91bGRuJ3QgY2FsbCB0aGUgY2FuY2VsZXIgbW9yZSB0aGFuIG9uY2UhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhbiBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7QW55fSBkZXRhaWwgZXZlbnQgZGV0YWlsXG4gICAgICogQHBhcmFtIHtBbnl9IHNvdXJjZSBldmVudCBzb3VyY2VcbiAgICAgKi9cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwsIHNvdXJjZSkge1xuICAgICAgICBjb25zdCBoYW5kbGVySURzID0gdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KTtcblxuICAgICAgICBpZiAoIWhhbmRsZXJJRHMpIHJldHVybjtcblxuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJJRCBvZiBoYW5kbGVySURzKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLmdldChoYW5kbGVySUQpO1xuICAgICAgICAgICAgaGFuZGxlciAmJiBoYW5kbGVyKGRldGFpbCwgc291cmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZFxuICAgICAqXG4gICAgICogQWxsb2MgYSBoYW5kbGVyIElELlxuICAgICAqXG4gICAgICogQHJldHVybnMge051bWJlcn0gYW4gdW51c2VkIGhhbmRsZXIgSURcbiAgICAgKi9cbiAgICBfYWxsb2NIYW5kbGVySUQoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuaGFzKHRoaXMuX2hhbmRsZXJJRCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJJRCA9ICh0aGlzLl9oYW5kbGVySUQgKyAxKSAlIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVySUQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kXG4gICAgICpcbiAgICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBoYW5kbGVySUQgaGFuZGxlciBJRFxuICAgICAqL1xuICAgIF9vZmYoZXZlbnQsIGhhbmRsZXJJRCkge1xuICAgICAgICBjb25zdCBoYW5kbGVySURzID0gdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaGFuZGxlcklEcyAmJiBoYW5kbGVySURzLmRlbGV0ZShoYW5kbGVySUQpO1xuICAgICAgICB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuZGVsZXRlKGhhbmRsZXJJRCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudE1hbmFnZXI7XG4iLCIvKipcbiAqIGEgbWFwIGZyb20gYWJicmV2aWF0aW9uIG9mIGxhbmd1YWdlcyB0aGF0IHN1cHBvcnRlZCBieSBicm93c2VycyB0byBhYmJyZXZpYXRpb24gb2YgdGhvc2Ugc3VwcG9ydGVkIGJ5IEVkZ2UgVHJhbnNsYXRlXG4gKi9cbmNvbnN0IEJST1dTRVJfTEFOR1VBR0VTX01BUCA9IHtcbiAgICBhY2g6IFwiYWNoXCIsXG4gICAgYWR5OiBcImVuXCIsXG4gICAgYWY6IFwiYWZcIixcbiAgICBcImFmLU5BXCI6IFwiYWZcIixcbiAgICBcImFmLVpBXCI6IFwiYWZcIixcbiAgICBhazogXCJha2FcIixcbiAgICBhbTogXCJhbVwiLFxuICAgIGFyOiBcImFyXCIsXG4gICAgXCJhci1BUlwiOiBcImFyXCIsXG4gICAgXCJhci1NQVwiOiBcImFyXCIsXG4gICAgXCJhci1TQVwiOiBcImFyXCIsXG4gICAgXCJheS1CT1wiOiBcImF5bVwiLFxuICAgIGF6OiBcImF6XCIsXG4gICAgXCJhei1BWlwiOiBcImF6XCIsXG4gICAgXCJiZS1CWVwiOiBcImJlXCIsXG4gICAgYmc6IFwiYmdcIixcbiAgICBcImJnLUJHXCI6IFwiYmdcIixcbiAgICBibjogXCJiblwiLFxuICAgIFwiYm4tSU5cIjogXCJiblwiLFxuICAgIFwiYm4tQkRcIjogXCJiblwiLFxuICAgIFwiYnMtQkFcIjogXCJic1wiLFxuICAgIGNhOiBcImNhXCIsXG4gICAgXCJjYS1FU1wiOiBcImNhXCIsXG4gICAgY2FrOiBcImVuXCIsXG4gICAgY2ViOiBcImNlYlwiLFxuICAgIFwiY2stVVNcIjogXCJjaHJcIixcbiAgICBjbzogXCJjb1wiLFxuICAgIGNzOiBcImNzXCIsXG4gICAgXCJjcy1DWlwiOiBcImNzXCIsXG4gICAgY3k6IFwiY3lcIixcbiAgICBcImN5LUdCXCI6IFwiY3lcIixcbiAgICBkYTogXCJkYVwiLFxuICAgIFwiZGEtREtcIjogXCJkYVwiLFxuICAgIGRlOiBcImRlXCIsXG4gICAgXCJkZS1BVFwiOiBcImRlXCIsXG4gICAgXCJkZS1ERVwiOiBcImRlXCIsXG4gICAgXCJkZS1DSFwiOiBcImRlXCIsXG4gICAgZHNiOiBcImVuXCIsXG4gICAgZWw6IFwiZWxcIixcbiAgICBcImVsLUdSXCI6IFwiZWxcIixcbiAgICBlbjogXCJlblwiLFxuICAgIFwiZW4tR0JcIjogXCJlblwiLFxuICAgIFwiZW4tQVVcIjogXCJlblwiLFxuICAgIFwiZW4tQ0FcIjogXCJlblwiLFxuICAgIFwiZW4tSUVcIjogXCJlblwiLFxuICAgIFwiZW4tSU5cIjogXCJlblwiLFxuICAgIFwiZW4tUElcIjogXCJlblwiLFxuICAgIFwiZW4tVURcIjogXCJlblwiLFxuICAgIFwiZW4tVVNcIjogXCJlblwiLFxuICAgIFwiZW4tWkFcIjogXCJlblwiLFxuICAgIFwiZW5AcGlyYXRlXCI6IFwiZW5cIixcbiAgICBlbzogXCJlb1wiLFxuICAgIFwiZW8tRU9cIjogXCJlb1wiLFxuICAgIGVzOiBcImVzXCIsXG4gICAgXCJlcy1BUlwiOiBcImVzXCIsXG4gICAgXCJlcy00MTlcIjogXCJlc1wiLFxuICAgIFwiZXMtQ0xcIjogXCJlc1wiLFxuICAgIFwiZXMtQ09cIjogXCJlc1wiLFxuICAgIFwiZXMtRUNcIjogXCJlc1wiLFxuICAgIFwiZXMtRVNcIjogXCJlc1wiLFxuICAgIFwiZXMtTEFcIjogXCJlc1wiLFxuICAgIFwiZXMtTklcIjogXCJlc1wiLFxuICAgIFwiZXMtTVhcIjogXCJlc1wiLFxuICAgIFwiZXMtVVNcIjogXCJlc1wiLFxuICAgIFwiZXMtVkVcIjogXCJlc1wiLFxuICAgIGV0OiBcImV0XCIsXG4gICAgXCJldC1FRVwiOiBcImV0XCIsXG4gICAgZXU6IFwiZXVcIixcbiAgICBcImV1LUVTXCI6IFwiZXVcIixcbiAgICBmYTogXCJmYVwiLFxuICAgIFwiZmEtSVJcIjogXCJmYVwiLFxuICAgIFwiZmItTFRcIjogXCJlblwiLFxuICAgIGZmOiBcImVuXCIsXG4gICAgZmk6IFwiZmlcIixcbiAgICBcImZpLUZJXCI6IFwiZmlcIixcbiAgICBcImZvLUZPXCI6IFwiZmFvXCIsXG4gICAgZnI6IFwiZnJcIixcbiAgICBcImZyLUNBXCI6IFwiZnJcIixcbiAgICBcImZyLUZSXCI6IFwiZnJcIixcbiAgICBcImZyLUJFXCI6IFwiZnJcIixcbiAgICBcImZyLUNIXCI6IFwiZnJcIixcbiAgICBcImZ5LU5MXCI6IFwiZnlcIixcbiAgICBnYTogXCJnYVwiLFxuICAgIFwiZ2EtSUVcIjogXCJnYVwiLFxuICAgIGdkOiBcImdkXCIsXG4gICAgZ2w6IFwiZ2xcIixcbiAgICBcImdsLUVTXCI6IFwiZ2xcIixcbiAgICBcImduLVBZXCI6IFwiZ3JuXCIsXG4gICAgXCJndS1JTlwiOiBcImd1XCIsXG4gICAgXCJneC1HUlwiOiBcImVsXCIsXG4gICAgaGE6IFwiaGFcIixcbiAgICBoYXc6IFwiaGF3XCIsXG4gICAgaGU6IFwiaGVcIixcbiAgICBcImhlLUlMXCI6IFwiaGVcIixcbiAgICBoaTogXCJoaVwiLFxuICAgIFwiaGktSU5cIjogXCJoaVwiLFxuICAgIGhtbjogXCJobW5cIixcbiAgICBocjogXCJoclwiLFxuICAgIFwiaHItSFJcIjogXCJoclwiLFxuICAgIGhzYjogXCJlblwiLFxuICAgIGh0OiBcImh0XCIsXG4gICAgaHU6IFwiaHVcIixcbiAgICBcImh1LUhVXCI6IFwiaHVcIixcbiAgICBcImh5LUFNXCI6IFwiaHlcIixcbiAgICBpZDogXCJpZFwiLFxuICAgIFwiaWQtSURcIjogXCJpZFwiLFxuICAgIGlnOiBcImlnXCIsXG4gICAgaXM6IFwiaXNcIixcbiAgICBcImlzLUlTXCI6IFwiaXNcIixcbiAgICBpdDogXCJpdFwiLFxuICAgIFwiaXQtSVRcIjogXCJpdFwiLFxuICAgIGl3OiBcImhlXCIsXG4gICAgamE6IFwiamFcIixcbiAgICBcImphLUpQXCI6IFwiamFcIixcbiAgICBcImp2LUlEXCI6IFwiandcIixcbiAgICBcImthLUdFXCI6IFwia2FcIixcbiAgICBcImtrLUtaXCI6IFwia2tcIixcbiAgICBrbTogXCJrbVwiLFxuICAgIFwia20tS0hcIjogXCJrbVwiLFxuICAgIGthYjogXCJrYWJcIixcbiAgICBrbjogXCJrblwiLFxuICAgIFwia24tSU5cIjogXCJrblwiLFxuICAgIGtvOiBcImtvXCIsXG4gICAgXCJrby1LUlwiOiBcImtvXCIsXG4gICAgXCJrdS1UUlwiOiBcImt1XCIsXG4gICAga3k6IFwia3lcIixcbiAgICBsYTogXCJsYVwiLFxuICAgIFwibGEtVkFcIjogXCJsYVwiLFxuICAgIGxiOiBcImxiXCIsXG4gICAgXCJsaS1OTFwiOiBcImxpbVwiLFxuICAgIGxvOiBcImxvXCIsXG4gICAgbHQ6IFwibHRcIixcbiAgICBcImx0LUxUXCI6IFwibHRcIixcbiAgICBsdjogXCJsdlwiLFxuICAgIFwibHYtTFZcIjogXCJsdlwiLFxuICAgIG1haTogXCJtYWlcIixcbiAgICBcIm1nLU1HXCI6IFwibWdcIixcbiAgICBtaTogXCJtaVwiLFxuICAgIG1rOiBcIm1rXCIsXG4gICAgXCJtay1NS1wiOiBcIm1rXCIsXG4gICAgbWw6IFwibWxcIixcbiAgICBcIm1sLUlOXCI6IFwibWxcIixcbiAgICBcIm1uLU1OXCI6IFwibW5cIixcbiAgICBtcjogXCJtclwiLFxuICAgIFwibXItSU5cIjogXCJtclwiLFxuICAgIG1zOiBcIm1zXCIsXG4gICAgXCJtcy1NWVwiOiBcIm1zXCIsXG4gICAgbXQ6IFwibXRcIixcbiAgICBcIm10LU1UXCI6IFwibXRcIixcbiAgICBteTogXCJteVwiLFxuICAgIG5vOiBcIm5vXCIsXG4gICAgbmI6IFwibm9cIixcbiAgICBcIm5iLU5PXCI6IFwibm9cIixcbiAgICBuZTogXCJuZVwiLFxuICAgIFwibmUtTlBcIjogXCJuZVwiLFxuICAgIG5sOiBcIm5sXCIsXG4gICAgXCJubC1CRVwiOiBcIm5sXCIsXG4gICAgXCJubC1OTFwiOiBcIm5sXCIsXG4gICAgXCJubi1OT1wiOiBcIm5vXCIsXG4gICAgbnk6IFwibnlcIixcbiAgICBvYzogXCJvY2lcIixcbiAgICBcIm9yLUlOXCI6IFwib3JcIixcbiAgICBwYTogXCJwYVwiLFxuICAgIFwicGEtSU5cIjogXCJwYVwiLFxuICAgIHBsOiBcInBsXCIsXG4gICAgXCJwbC1QTFwiOiBcInBsXCIsXG4gICAgXCJwcy1BRlwiOiBcInBzXCIsXG4gICAgcHQ6IFwicHRcIixcbiAgICBcInB0LUJSXCI6IFwicHRcIixcbiAgICBcInB0LVBUXCI6IFwicHRcIixcbiAgICBcInF1LVBFXCI6IFwicXVlXCIsXG4gICAgXCJybS1DSFwiOiBcInJvaFwiLFxuICAgIHJvOiBcInJvXCIsXG4gICAgXCJyby1ST1wiOiBcInJvXCIsXG4gICAgcnU6IFwicnVcIixcbiAgICBcInJ1LVJVXCI6IFwicnVcIixcbiAgICBcInNhLUlOXCI6IFwic2FuXCIsXG4gICAgc2Q6IFwic2RcIixcbiAgICBcInNlLU5PXCI6IFwic21lXCIsXG4gICAgXCJzaS1MS1wiOiBcInNpXCIsXG4gICAgc2s6IFwic2tcIixcbiAgICBcInNrLVNLXCI6IFwic2tcIixcbiAgICBzbDogXCJzbFwiLFxuICAgIFwic2wtU0lcIjogXCJzbFwiLFxuICAgIHNtOiBcInNtXCIsXG4gICAgc246IFwic25cIixcbiAgICBcInNvLVNPXCI6IFwic29cIixcbiAgICBzcTogXCJzcVwiLFxuICAgIFwic3EtQUxcIjogXCJzcVwiLFxuICAgIHNyOiBcInNyXCIsXG4gICAgXCJzci1SU1wiOiBcInNyXCIsXG4gICAgc3Q6IFwic3RcIixcbiAgICBzdTogXCJzdVwiLFxuICAgIHN2OiBcInN2XCIsXG4gICAgXCJzdi1TRVwiOiBcInN2XCIsXG4gICAgc3c6IFwic3dcIixcbiAgICBcInN3LUtFXCI6IFwic3dcIixcbiAgICB0YTogXCJ0YVwiLFxuICAgIFwidGEtSU5cIjogXCJ0YVwiLFxuICAgIHRlOiBcInRlXCIsXG4gICAgXCJ0ZS1JTlwiOiBcInRlXCIsXG4gICAgdGc6IFwidGdcIixcbiAgICBcInRnLVRKXCI6IFwidGdcIixcbiAgICB0aDogXCJ0aFwiLFxuICAgIFwidGgtVEhcIjogXCJ0aFwiLFxuICAgIHRsOiBcImZpbFwiLFxuICAgIFwidGwtUEhcIjogXCJmaWxcIixcbiAgICB0bGg6IFwidGxoXCIsXG4gICAgdHI6IFwidHJcIixcbiAgICBcInRyLVRSXCI6IFwidHJcIixcbiAgICBcInR0LVJVXCI6IFwidGF0XCIsXG4gICAgdWs6IFwidWtcIixcbiAgICBcInVrLVVBXCI6IFwidWtcIixcbiAgICB1cjogXCJ1clwiLFxuICAgIFwidXItUEtcIjogXCJ1clwiLFxuICAgIHV6OiBcInV6XCIsXG4gICAgXCJ1ei1VWlwiOiBcInV6XCIsXG4gICAgdmk6IFwidmlcIixcbiAgICBcInZpLVZOXCI6IFwidmlcIixcbiAgICBcInhoLVpBXCI6IFwieGhcIixcbiAgICB5aTogXCJ5aVwiLFxuICAgIFwieWktREVcIjogXCJ5aVwiLFxuICAgIHlvOiBcInlvXCIsXG4gICAgemg6IFwiemgtQ05cIixcbiAgICBcInpoLUhhbnNcIjogXCJ6aC1DTlwiLFxuICAgIFwiemgtSGFudFwiOiBcInpoLVRXXCIsXG4gICAgXCJ6aC1DTlwiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1IS1wiOiBcInpoLVRXXCIsXG4gICAgXCJ6aC1TR1wiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1UV1wiOiBcInpoLVRXXCIsXG4gICAgXCJ6dS1aQVwiOiBcInp1XCIsXG59O1xuXG4vKipcbiAqIEV4cG9ydCBsYW5ndWFnZXMgYW5kIGJyb3dzZXIgbGFuZ3VhZ2VzIG1hcC5cbiAqL1xuZXhwb3J0IHsgQlJPV1NFUl9MQU5HVUFHRVNfTUFQIH07XG4iLCJleHBvcnQge1xuICAgIGxvZ0luZm8sXG4gICAgbG9nV2FybixcbiAgICBsb2dFcnJvcixcbiAgICBzaG91bGRGaWx0ZXJFcnJvcixcbiAgICB3cmFwQ29uc29sZUZvckZpbHRlcmluZyxcbiAgICBzZXRMb2dMZXZlbCxcbiAgICBnZXRMb2dMZXZlbCxcbn07XG5cbi8vIEtub3duIG5vaXN5IGVycm9yIHBhdHRlcm5zIHRvIHN1cHByZXNzIGluIGxvZ3NcbmNvbnN0IEZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TID0gW1xuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkXCIsXG4gICAgXCJVbmFibGUgdG8gZG93bmxvYWQgYWxsIHNwZWNpZmllZCBpbWFnZXNcIixcbiAgICBcIkNhbm5vdCBhY2Nlc3NcIixcbiAgICBcImJlZm9yZSBpbml0aWFsaXphdGlvblwiLFxuICAgIFwiRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWRcIixcbiAgICBcIkNhbnZhcyBlcnJvclwiLFxuICAgIFwiTmV0d29yayBlcnJvclwiLFxuXTtcblxuZnVuY3Rpb24gam9pbk1lc3NhZ2UoYXJncykge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhcmdzXG4gICAgICAgICAgICAubWFwKCh2KSA9PiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIgPyB2IDogKHYgJiYgdi5tZXNzYWdlKSB8fCBKU09OLnN0cmluZ2lmeSh2KSkpXG4gICAgICAgICAgICAuam9pbihcIiBcIik7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICByZXR1cm4gYXJncy5qb2luKFwiIFwiKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpIHtcbiAgICBpZiAoIW1lc3NhZ2UpIHJldHVybiBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgRklMVEVSRURfRVJST1JfUEFUVEVSTlMuc29tZSgocGF0dGVybikgPT4gbWVzc2FnZS5pbmNsdWRlcyhwYXR0ZXJuKSkgfHxcbiAgICAgICAgICAgIC9DYW5ub3QgYWNjZXNzICcuKicgYmVmb3JlIGluaXRpYWxpemF0aW9uLy50ZXN0KG1lc3NhZ2UpIHx8XG4gICAgICAgICAgICAvUmVmZXJlbmNlRXJyb3IuKmJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAgICAgL1VuYWJsZSB0byBkb3dubG9hZC4qaW1hZ2VzLy50ZXN0KG1lc3NhZ2UpXG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBMb2cgbGV2ZWw6ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InIHwgJ3NpbGVudCdcbmNvbnN0IExFVkVMX09SREVSID0geyBkZWJ1ZzogMTAsIGluZm86IDIwLCB3YXJuOiAzMCwgZXJyb3I6IDQwLCBzaWxlbnQ6IDkwIH07XG5sZXQgY3VycmVudExldmVsID1cbiAgICB0eXBlb2YgQlVJTERfRU5WICE9PSBcInVuZGVmaW5lZFwiICYmIEJVSUxEX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiID8gXCJkZWJ1Z1wiIDogXCJ3YXJuXCI7XG5cbmZ1bmN0aW9uIHNldExvZ0xldmVsKGxldmVsKSB7XG4gICAgaWYgKExFVkVMX09SREVSW2xldmVsXSAhPSBudWxsKSBjdXJyZW50TGV2ZWwgPSBsZXZlbDtcbn1cblxuZnVuY3Rpb24gZ2V0TG9nTGV2ZWwoKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRMZXZlbDtcbn1cblxuZnVuY3Rpb24gc2hvdWxkRW1pdChsZXZlbCkge1xuICAgIHJldHVybiBMRVZFTF9PUkRFUltsZXZlbF0gPj0gTEVWRUxfT1JERVJbY3VycmVudExldmVsXTtcbn1cblxuZnVuY3Rpb24gbG9nSW5mbyguLi5hcmdzKSB7XG4gICAgaWYgKCFzaG91bGRFbWl0KFwiaW5mb1wiKSkgcmV0dXJuO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbmZ1bmN0aW9uIGxvZ1dhcm4oLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcIndhcm5cIikpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUud2FybihcIltFZGdlVHJhbnNsYXRlXVwiLCAuLi5hcmdzKTtcbn1cblxuZnVuY3Rpb24gbG9nRXJyb3IoLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcImVycm9yXCIpKSByZXR1cm47XG4gICAgY29uc3QgbWVzc2FnZSA9IGpvaW5NZXNzYWdlKGFyZ3MpO1xuICAgIGlmIChzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSkgcmV0dXJuO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcihcIltFZGdlVHJhbnNsYXRlXVwiLCAuLi5hcmdzKTtcbn1cblxuLy8gT3B0aW9uYWw6IGdsb2JhbGx5IHdyYXAgY29uc29sZS5lcnJvciB0byBzdXBwcmVzcyBub2lzeSBlcnJvcnNcbmZ1bmN0aW9uIHdyYXBDb25zb2xlRm9yRmlsdGVyaW5nKCkge1xuICAgIGNvbnN0IG9yaWdpbmFsQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gam9pbk1lc3NhZ2UoYXJncyk7XG4gICAgICAgIGlmICghc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQ29uc29sZUVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbiIsIi8qKlxuICogbW9kdWxlOiBjb21tb25cbiAqIHBhcnQ6IG5vbmVcbiAqIGZ1bmN0aW9uOiBlbmNhcHN1bGF0ZSBzb21lIGFzeW5jIGZ1bmN0aW9ucyBpbiBQcm9taXNlIHN0eWxlXG4gKi9cblxuZXhwb3J0IHsgZGVsYXlQcm9taXNlIH07XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lICB0aGUgZGVsYXkgdGltZS4gdW5pdDogbXNcbiAqIEByZXR1cm5zIHtQcm9taXNlPE9iamVjdD59IGRlbGF5IFByb21pc2VcbiAqL1xuZnVuY3Rpb24gZGVsYXlQcm9taXNlKHRpbWUpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIHRpbWUgPT09IFwibnVtYmVyXCIgJiYgdGltZSA+PSAwKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9LCB0aW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlamVjdChgdGhlIHR5cGUgb3IgdmFsdWUgb2YgdmFyaWFibGUgdGltZSgke3RpbWV9KSBpcyBub3Qgc3VwcG9ydGVkYCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuLyoqXG4gKiB3cmFwIGNocm9tZS50YWJzIGZ1bmN0aW9ucyB0byBwcm9taXNlXG4gKi9cbmV4cG9ydCBjbGFzcyBwcm9taXNlVGFicyB7XG4gICAgLyoqXG4gICAgICogZXF1YWwgdG8gY2hyb21lLnRhYnMuY3JlYXRlXG4gICAgICovXG4gICAgc3RhdGljIGNyZWF0ZShjcmVhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjaHJvbWUudGFicy5jcmVhdGUoY3JlYXRlUHJvcGVydGllcywgKHRhYikgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlc29sdmUodGFiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBlcXVhbCB0byBjaHJvbWUudGFicy5xdWVyeVxuICAgICAqL1xuICAgIHN0YXRpYyBxdWVyeShxdWVyeUluZm8pIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNocm9tZS50YWJzLnF1ZXJ5KHF1ZXJ5SW5mbywgKHRhYnMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yIHx8ICF0YWJzWzBdIHx8IHRhYnNbMF0uaWQgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGNocm9tZS5ydW50aW1lLmxhc3RFcnJvciB8fCBcIlRoZSBxdWVyeSBoYXMgbm8gcmVzdWx0c1wiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmUodGFicyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQlJPV1NFUl9MQU5HVUFHRVNfTUFQIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL2xhbmd1YWdlcy5qc1wiO1xuXG4vKipcbiAqIGRlZmF1bHQgc2V0dGluZ3MgZm9yIHRoaXMgZXh0ZW5zaW9uXG4gKi9cbmNvbnN0IERFRkFVTFRfU0VUVElOR1MgPSB7XG4gICAgYmxhY2tsaXN0OiB7XG4gICAgICAgIHVybHM6IHt9LFxuICAgICAgICBkb21haW5zOiB7IFwiY2hyb21lLmdvb2dsZS5jb21cIjogdHJ1ZSwgZXh0ZW5zaW9uczogdHJ1ZSB9LFxuICAgIH0sXG4gICAgLy8gUmVzaXplOiBkZXRlcm1pbmUgd2hldGhlciB0aGUgd2ViIHBhZ2Ugd2lsbCByZXNpemUgd2hlbiBzaG93aW5nIHRyYW5zbGF0aW9uIHJlc3VsdFxuICAgIC8vIFJUTDogZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHRleHQgaW4gdHJhbnNsYXRpb24gYmxvY2sgc2hvdWxkIGRpc3BsYXkgZnJvbSByaWdodCB0byBsZWZ0XG4gICAgLy8gRm9sZExvbmdDb250ZW50OiBkZXRlcm1pbmUgd2hldGhlciB0byBmb2xkIGxvbmcgdHJhbnNsYXRpb24gY29udGVudFxuICAgIC8vIFNlbGVjdFRyYW5zbGF0ZVBvc2l0aW9uOiB0aGUgcG9zaXRpb24gb2Ygc2VsZWN0IHRyYW5zbGF0ZSBidXR0b24uXG4gICAgTGF5b3V0U2V0dGluZ3M6IHtcbiAgICAgICAgUmVzaXplOiBmYWxzZSxcbiAgICAgICAgUlRMOiBmYWxzZSxcbiAgICAgICAgRm9sZExvbmdDb250ZW50OiB0cnVlLFxuICAgICAgICBTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbjogXCJUb3BSaWdodFwiLFxuICAgIH0sXG4gICAgLy8gRGVmYXVsdCBzZXR0aW5ncyBvZiBzb3VyY2UgbGFuZ3VhZ2UgYW5kIHRhcmdldCBsYW5ndWFnZVxuICAgIGxhbmd1YWdlU2V0dGluZzogeyBzbDogXCJhdXRvXCIsIHRsOiBCUk9XU0VSX0xBTkdVQUdFU19NQVBbY2hyb21lLmkxOG4uZ2V0VUlMYW5ndWFnZSgpXSB9LFxuICAgIE90aGVyU2V0dGluZ3M6IHtcbiAgICAgICAgTXV0dWFsVHJhbnNsYXRlOiBmYWxzZSxcbiAgICAgICAgU2VsZWN0VHJhbnNsYXRlOiB0cnVlLFxuICAgICAgICBUcmFuc2xhdGVBZnRlckRibENsaWNrOiBmYWxzZSxcbiAgICAgICAgVHJhbnNsYXRlQWZ0ZXJTZWxlY3Q6IGZhbHNlLFxuICAgICAgICBDYW5jZWxUZXh0U2VsZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgVXNlR29vZ2xlQW5hbHl0aWNzOiB0cnVlLFxuICAgIH0sXG4gICAgRGVmYXVsdFRyYW5zbGF0b3I6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgRGVmYXVsdFBhZ2VUcmFuc2xhdG9yOiBcIkdvb2dsZVBhZ2VUcmFuc2xhdGVcIixcbiAgICBIeWJyaWRUcmFuc2xhdG9yQ29uZmlnOiB7XG4gICAgICAgIC8vIFRoZSB0cmFuc2xhdG9ycyB1c2VkIGluIGN1cnJlbnQgaHlicmlkIHRyYW5zbGF0ZS5cbiAgICAgICAgdHJhbnNsYXRvcnM6IFtcIkJpbmdUcmFuc2xhdGVcIiwgXCJHb29nbGVUcmFuc2xhdGVcIl0sXG5cbiAgICAgICAgLy8gVGhlIHRyYW5zbGF0b3JzIGZvciBlYWNoIGl0ZW0uXG4gICAgICAgIHNlbGVjdGlvbnM6IHtcbiAgICAgICAgICAgIC8vIEFUVEVOVElPTjogVGhlIGZvbGxvd2luZyBmb3VyIGl0ZW1zIE1VU1QgSEFWRSBUSEUgU0FNRSBUUkFOU0xBVE9SIVxuICAgICAgICAgICAgb3JpZ2luYWxUZXh0OiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgbWFpbk1lYW5pbmc6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICB0UHJvbnVuY2lhdGlvbjogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIHNQcm9udW5jaWF0aW9uOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuXG4gICAgICAgICAgICAvLyBGb3IgdGhlIGZvbGxvd2luZyB0aHJlZSBpdGVtcywgYW55IHRyYW5zbGF0b3IgY29tYmluYXRpb24gaXMgT0suXG4gICAgICAgICAgICBkZXRhaWxlZE1lYW5pbmdzOiBcIkJpbmdUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIGRlZmluaXRpb25zOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgZXhhbXBsZXM6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBEZWZpbmVzIHdoaWNoIGNvbnRlbnRzIGluIHRoZSB0cmFuc2xhdGluZyByZXN1bHQgc2hvdWxkIGJlIGRpc3BsYXllZC5cbiAgICBUcmFuc2xhdGVSZXN1bHRGaWx0ZXI6IHtcbiAgICAgICAgbWFpbk1lYW5pbmc6IHRydWUsXG4gICAgICAgIG9yaWdpbmFsVGV4dDogdHJ1ZSxcbiAgICAgICAgdFByb251bmNpYXRpb246IHRydWUsXG4gICAgICAgIHNQcm9udW5jaWF0aW9uOiB0cnVlLFxuICAgICAgICB0UHJvbnVuY2lhdGlvbkljb246IHRydWUsXG4gICAgICAgIHNQcm9udW5jaWF0aW9uSWNvbjogdHJ1ZSxcbiAgICAgICAgZGV0YWlsZWRNZWFuaW5nczogdHJ1ZSxcbiAgICAgICAgZGVmaW5pdGlvbnM6IHRydWUsXG4gICAgICAgIGV4YW1wbGVzOiB0cnVlLFxuICAgIH0sXG4gICAgLy8gRGVmaW5lcyB0aGUgb3JkZXIgb2YgZGlzcGxheWluZyBjb250ZW50cy5cbiAgICBDb250ZW50RGlzcGxheU9yZGVyOiBbXG4gICAgICAgIFwibWFpbk1lYW5pbmdcIixcbiAgICAgICAgXCJvcmlnaW5hbFRleHRcIixcbiAgICAgICAgXCJkZXRhaWxlZE1lYW5pbmdzXCIsXG4gICAgICAgIFwiZGVmaW5pdGlvbnNcIixcbiAgICAgICAgXCJleGFtcGxlc1wiLFxuICAgIF0sXG4gICAgSGlkZVBhZ2VUcmFuc2xhdG9yQmFubmVyOiBmYWxzZSxcbn07XG5cbi8qKlxuICogYXNzaWduIGRlZmF1bHQgdmFsdWUgdG8gc2V0dGluZ3Mgd2hpY2ggYXJlIHVuZGVmaW5lZCBpbiByZWN1cnNpdmUgd2F5XG4gKiBAcGFyYW0geyp9IHJlc3VsdCBzZXR0aW5nIHJlc3VsdCBzdG9yZWQgaW4gY2hyb21lLnN0b3JhZ2VcbiAqIEBwYXJhbSB7Kn0gc2V0dGluZ3MgZGVmYXVsdCBzZXR0aW5nc1xuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0U2V0dGluZ3MocmVzdWx0LCBzZXR0aW5ncykge1xuICAgIGZvciAobGV0IGkgaW4gc2V0dGluZ3MpIHtcbiAgICAgICAgLy8gc2V0dGluZ3NbaV0gY29udGFpbnMga2V5LXZhbHVlIHNldHRpbmdzXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBzZXR0aW5nc1tpXSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgIShzZXR0aW5nc1tpXSBpbnN0YW5jZW9mIEFycmF5KSAmJlxuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2V0dGluZ3NbaV0pLmxlbmd0aCA+IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W2ldKSB7XG4gICAgICAgICAgICAgICAgc2V0RGVmYXVsdFNldHRpbmdzKHJlc3VsdFtpXSwgc2V0dGluZ3NbaV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBzZXR0aW5nc1tpXSBjb250YWlucyBzZXZlcmFsIHNldHRpbmcgaXRlbXMgYnV0IHRoZXNlIGhhdmUgbm90IGJlZW4gc2V0IGJlZm9yZVxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IHNldHRpbmdzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdFtpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBzZXR0aW5nc1tpXSBpcyBhIHNpbmdsZSBzZXR0aW5nIGl0ZW0gYW5kIGl0IGhhcyBub3QgYmVlbiBzZXQgYmVmb3JlXG4gICAgICAgICAgICByZXN1bHRbaV0gPSBzZXR0aW5nc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgc2V0dGluZ3MgZnJvbSBzdG9yYWdlLiBJZiBzb21lIG9mIHRoZSBzZXR0aW5ncyBoYXZlIG5vdCBiZWVuIGluaXRpYWxpemVkLFxuICogaW5pdGlhbGl6ZSB0aGVtIHdpdGggdGhlIGdpdmVuIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nIHwgQXJyYXk8U3RyaW5nPn0gc2V0dGluZ3Mgc2V0dGluZyBuYW1lIHRvIGdldFxuICogQHBhcmFtIHtPYmplY3QgfCBGdW5jdGlvbn0gZGVmYXVsdHMgZGVmYXVsdCB2YWx1ZXMgb3IgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgZGVmYXVsdCB2YWx1ZXNcbiAqIEByZXR1cm5zIHtQcm9taXNlPEFueT59IHNldHRpbmdzXG4gKi9cbmZ1bmN0aW9uIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzKHNldHRpbmdzLCBkZWZhdWx0cykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBzZXR0aW5nIHRvIGdldCwgd2FycCBpdCB1cC5cbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc2V0dGluZ3MgPSBbc2V0dGluZ3NdO1xuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIElmIHNldHRpbmdzIGlzIHVuZGVmaW5lZCwgY29sbGVjdCBhbGwgc2V0dGluZyBrZXlzIGluIGRlZmF1bHRzLlxuICAgICAgICAgICAgc2V0dGluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBkZWZhdWx0cykge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KHNldHRpbmdzLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBzZXR0aW5nIG9mIHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHRbc2V0dGluZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0cyA9IGRlZmF1bHRzKHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbc2V0dGluZ10gPSBkZWZhdWx0c1tzZXR0aW5nXTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlZCkge1xuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHJlc3VsdCwgKCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgc2V0RGVmYXVsdFNldHRpbmdzLCBnZXRPclNldERlZmF1bHRTZXR0aW5ncyB9O1xuIiwidmFyIFU9T2JqZWN0LmRlZmluZVByb3BlcnR5O3ZhciBNPShoLGUsdCk9PmUgaW4gaD9VKGgsZSx7ZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITAsdmFsdWU6dH0pOmhbZV09dDt2YXIgaT0oaCxlLHQpPT4oTShoLHR5cGVvZiBlIT1cInN5bWJvbFwiP2UrXCJcIjplLHQpLHQpO2NvbnN0IEw9KCk9Pntjb25zdCBoPWZ1bmN0aW9uKGUpe3R5cGVvZiBlPT1cInN0cmluZ1wiJiYoZT17dXJsOmUsbWV0aG9kOlwiR0VUXCJ9KTtjb25zdHt1cmw6dCxtZXRob2Q6cz1cIkdFVFwiLGRhdGE6YSxoZWFkZXJzOm49e30sdGltZW91dDpvPTAscGFyYW1zOnIscmVzcG9uc2VUeXBlOmw9XCJqc29uXCIsYmFzZVVSTDp1PVwiXCIsdmFsaWRhdGVTdGF0dXM6VD1jPT5jPj0yMDAmJmM8MzAwfT1lO2xldCBSPXU/dSt0OnQ7aWYocil7Y29uc3QgYz1uZXcgVVJMU2VhcmNoUGFyYW1zKHIpO1IrPShSLmluY2x1ZGVzKFwiP1wiKT9cIiZcIjpcIj9cIikrYy50b1N0cmluZygpfWNvbnN0IG09e21ldGhvZDpzLnRvVXBwZXJDYXNlKCksaGVhZGVyczpuZXcgSGVhZGVycyhuKX07aWYoYSYmIVtcIkdFVFwiLFwiSEVBRFwiXS5pbmNsdWRlcyhtLm1ldGhvZCkpaWYodHlwZW9mIGE9PVwic3RyaW5nXCIpbS5ib2R5PWE7ZWxzZSBpZihhIGluc3RhbmNlb2YgRm9ybURhdGEpbS5ib2R5PWE7ZWxzZSBpZihhIGluc3RhbmNlb2YgVVJMU2VhcmNoUGFyYW1zKXttLmJvZHk9YTtjb25zdCBjPW0uaGVhZGVycztjLmdldChcImNvbnRlbnQtdHlwZVwiKXx8Yy5zZXQoXCJjb250ZW50LXR5cGVcIixcImFwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZFwiKX1lbHNlIGlmKGEgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcnx8YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpbS5ib2R5PWE7ZWxzZXttLmJvZHk9SlNPTi5zdHJpbmdpZnkoYSk7Y29uc3QgYz1tLmhlYWRlcnM7Yy5nZXQoXCJjb250ZW50LXR5cGVcIil8fGMuc2V0KFwiY29udGVudC10eXBlXCIsXCJhcHBsaWNhdGlvbi9qc29uXCIpfWNvbnN0IHk9bmV3IEFib3J0Q29udHJvbGxlcjttLnNpZ25hbD15LnNpZ25hbDtsZXQgZj1udWxsO3JldHVybiBvPjAmJihmPXNldFRpbWVvdXQoKCk9PnkuYWJvcnQoKSxvKSksZmV0Y2goUixtKS50aGVuKGM9PntmJiZjbGVhclRpbWVvdXQoZik7bGV0IGc7c3dpdGNoKGwpe2Nhc2VcInRleHRcIjpnPWMudGV4dCgpO2JyZWFrO2Nhc2VcImJsb2JcIjpnPWMuYmxvYigpO2JyZWFrO2Nhc2VcImFycmF5YnVmZmVyXCI6Zz1jLmFycmF5QnVmZmVyKCk7YnJlYWs7Y2FzZVwianNvblwiOmRlZmF1bHQ6Zz1jLnRleHQoKS50aGVuKEE9Pnt0cnl7cmV0dXJuIEE/SlNPTi5wYXJzZShBKTp7fX1jYXRjaHtyZXR1cm4gQX19KTticmVha31yZXR1cm4gZy50aGVuKEE9Pntjb25zdCBrPXt9LFM9Yy5oZWFkZXJzO1MmJnR5cGVvZiBTLmZvckVhY2g9PVwiZnVuY3Rpb25cIiYmUy5mb3JFYWNoKChkLE4pPT57a1tOXT1kfSk7Y29uc3QgRT17ZGF0YTpBLHN0YXR1czpjLnN0YXR1cyxzdGF0dXNUZXh0OmMuc3RhdHVzVGV4dCxoZWFkZXJzOmssY29uZmlnOmUscmVxdWVzdDp7fX07aWYoIVQoYy5zdGF0dXMpKXtjb25zdCBkPW5ldyBFcnJvcihgUmVxdWVzdCBmYWlsZWQgd2l0aCBzdGF0dXMgJHtjLnN0YXR1c31gKTt0aHJvdyBkLmNvbmZpZz1lLGQucmVzcG9uc2U9RSxkLmNvZGU9Yy5zdGF0dXM+PTUwMD9cIkVDT05OQUJPUlRFRFwiOlwiRVJSX0JBRF9SRVFVRVNUXCIsZH1yZXR1cm4gRX0pfSkuY2F0Y2goYz0+e2lmKGYmJmNsZWFyVGltZW91dChmKSxjLm5hbWU9PT1cIkFib3J0RXJyb3JcIil7Y29uc3QgZz1uZXcgRXJyb3IoYFJlcXVlc3QgdGltZW91dCBhZnRlciAke299bXNgKTt0aHJvdyBnLmNvbmZpZz1lLGcuY29kZT1cIkVDT05OQUJPUlRFRFwiLHtlcnJvclR5cGU6XCJORVRfRVJSXCIsZXJyb3JDb2RlOjAsZXJyb3JNc2c6Zy5tZXNzYWdlfX1lbHNlIHRocm93IGMucmVzcG9uc2U/e2Vycm9yVHlwZTpcIk5FVF9FUlJcIixlcnJvckNvZGU6Yy5yZXNwb25zZS5zdGF0dXN8fDAsZXJyb3JNc2c6Yy5tZXNzYWdlfHxcIlJlcXVlc3QgZmFpbGVkXCJ9OntlcnJvclR5cGU6XCJORVRfRVJSXCIsZXJyb3JDb2RlOjAsZXJyb3JNc2c6Yy5tZXNzYWdlfHxcIk5ldHdvcmsgRXJyb3JcIn19KX07cmV0dXJuIGguZ2V0PShlLHQ9e30pPT5oKHsuLi50LHVybDplLG1ldGhvZDpcIkdFVFwifSksaC5wb3N0PShlLHQscz17fSk9Pmgoey4uLnMsdXJsOmUsZGF0YTp0LG1ldGhvZDpcIlBPU1RcIn0pLGgucHV0PShlLHQscz17fSk9Pmgoey4uLnMsdXJsOmUsZGF0YTp0LG1ldGhvZDpcIlBVVFwifSksaC5wYXRjaD0oZSx0LHM9e30pPT5oKHsuLi5zLHVybDplLGRhdGE6dCxtZXRob2Q6XCJQQVRDSFwifSksaC5kZWxldGU9KGUsdD17fSk9Pmgoey4uLnQsdXJsOmUsbWV0aG9kOlwiREVMRVRFXCJ9KSxoLmhlYWQ9KGUsdD17fSk9Pmgoey4uLnQsdXJsOmUsbWV0aG9kOlwiSEVBRFwifSksaC5vcHRpb25zPShlLHQ9e30pPT5oKHsuLi50LHVybDplLG1ldGhvZDpcIk9QVElPTlNcIn0pLGguZGVmYXVsdHM9e2hlYWRlcnM6e2NvbW1vbjp7fSxnZXQ6e30scG9zdDp7XCJDb250ZW50LVR5cGVcIjpcImFwcGxpY2F0aW9uL2pzb25cIn0scHV0OntcIkNvbnRlbnQtVHlwZVwiOlwiYXBwbGljYXRpb24vanNvblwifSxwYXRjaDp7XCJDb250ZW50LVR5cGVcIjpcImFwcGxpY2F0aW9uL2pzb25cIn19LHRpbWVvdXQ6MCxyZXNwb25zZVR5cGU6XCJqc29uXCIsYmFzZVVSTDpcIlwiLHZhbGlkYXRlU3RhdHVzOmU9PmU+PTIwMCYmZTwzMDB9LGguaW50ZXJjZXB0b3JzPXtyZXF1ZXN0Ont1c2U6KCk9Pnt9LGVqZWN0OigpPT57fX0scmVzcG9uc2U6e3VzZTooKT0+e30sZWplY3Q6KCk9Pnt9fX0saC5jcmVhdGU9KGU9e30pPT57Y29uc3QgdD1MKCk7cmV0dXJuIE9iamVjdC5hc3NpZ24odC5kZWZhdWx0cyxlKSx0fSxoLmlzQXhpb3NFcnJvcj1lPT5lJiYoZS5lcnJvclR5cGU9PT1cIk5FVF9FUlJcInx8ZS5jb25maWcmJmUuY29kZSksaH0scD1MKCksYj1bW1wiYXV0b1wiLFwiYXV0by1kZXRlY3RcIl0sW1wiYXJcIixcImFyXCJdLFtcImdhXCIsXCJnYVwiXSxbXCJldFwiLFwiZXRcIl0sW1wib3JcIixcIm9yXCJdLFtcImJnXCIsXCJiZ1wiXSxbXCJpc1wiLFwiaXNcIl0sW1wicGxcIixcInBsXCJdLFtcImJzXCIsXCJicy1MYXRuXCJdLFtcImZhXCIsXCJmYVwiXSxbXCJwcnNcIixcInByc1wiXSxbXCJkYVwiLFwiZGFcIl0sW1wiZGVcIixcImRlXCJdLFtcInJ1XCIsXCJydVwiXSxbXCJmclwiLFwiZnJcIl0sW1wiemgtVFdcIixcInpoLUhhbnRcIl0sW1wiZmlsXCIsXCJmaWxcIl0sW1wiZmpcIixcImZqXCJdLFtcImZpXCIsXCJmaVwiXSxbXCJndVwiLFwiZ3VcIl0sW1wia2tcIixcImtrXCJdLFtcImh0XCIsXCJodFwiXSxbXCJrb1wiLFwia29cIl0sW1wibmxcIixcIm5sXCJdLFtcImNhXCIsXCJjYVwiXSxbXCJ6aC1DTlwiLFwiemgtSGFuc1wiXSxbXCJjc1wiLFwiY3NcIl0sW1wia25cIixcImtuXCJdLFtcIm90cVwiLFwib3RxXCJdLFtcInRsaFwiLFwidGxoXCJdLFtcImhyXCIsXCJoclwiXSxbXCJsdlwiLFwibHZcIl0sW1wibHRcIixcImx0XCJdLFtcInJvXCIsXCJyb1wiXSxbXCJtZ1wiLFwibWdcIl0sW1wibXRcIixcIm10XCJdLFtcIm1yXCIsXCJtclwiXSxbXCJtbFwiLFwibWxcIl0sW1wibXNcIixcIm1zXCJdLFtcIm1pXCIsXCJtaVwiXSxbXCJiblwiLFwiYm4tQkRcIl0sW1wiaG1uXCIsXCJtd3dcIl0sW1wiYWZcIixcImFmXCJdLFtcInBhXCIsXCJwYVwiXSxbXCJwdFwiLFwicHRcIl0sW1wicHNcIixcInBzXCJdLFtcImphXCIsXCJqYVwiXSxbXCJzdlwiLFwic3ZcIl0sW1wic21cIixcInNtXCJdLFtcInNyLUxhdG5cIixcInNyLUxhdG5cIl0sW1wic3ItQ3lybFwiLFwic3ItQ3lybFwiXSxbXCJub1wiLFwibmJcIl0sW1wic2tcIixcInNrXCJdLFtcInNsXCIsXCJzbFwiXSxbXCJzd1wiLFwic3dcIl0sW1widHlcIixcInR5XCJdLFtcInRlXCIsXCJ0ZVwiXSxbXCJ0YVwiLFwidGFcIl0sW1widGhcIixcInRoXCJdLFtcInRvXCIsXCJ0b1wiXSxbXCJ0clwiLFwidHJcIl0sW1wiY3lcIixcImN5XCJdLFtcInVyXCIsXCJ1clwiXSxbXCJ1a1wiLFwidWtcIl0sW1wiZXNcIixcImVzXCJdLFtcImhlXCIsXCJpd1wiXSxbXCJlbFwiLFwiZWxcIl0sW1wiaHVcIixcImh1XCJdLFtcIml0XCIsXCJpdFwiXSxbXCJoaVwiLFwiaGlcIl0sW1wiaWRcIixcImlkXCJdLFtcImVuXCIsXCJlblwiXSxbXCJ5dWFcIixcInl1YVwiXSxbXCJ5dWVcIixcInl1YVwiXSxbXCJ2aVwiLFwidmlcIl0sW1wia3VcIixcImt1XCJdLFtcImttclwiLFwia21yXCJdXSxEPXthcjpbXCJhci1TQVwiLFwiTWFsZVwiLFwiYXItU0EtTmFheWZcIl0sYmc6W1wiYmctQkdcIixcIk1hbGVcIixcImJnLUJHLUl2YW5cIl0sY2E6W1wiY2EtRVNcIixcIkZlbWFsZVwiLFwiY2EtRVMtSGVyZW5hUlVTXCJdLGNzOltcImNzLUNaXCIsXCJNYWxlXCIsXCJjcy1DWi1KYWt1YlwiXSxkYTpbXCJkYS1ES1wiLFwiRmVtYWxlXCIsXCJkYS1ESy1IZWxsZVJVU1wiXSxkZTpbXCJkZS1ERVwiLFwiRmVtYWxlXCIsXCJkZS1ERS1IZWRkYVwiXSxlbDpbXCJlbC1HUlwiLFwiTWFsZVwiLFwiZWwtR1ItU3RlZmFub3NcIl0sZW46W1wiZW4tVVNcIixcIkZlbWFsZVwiLFwiZW4tVVMtSmVzc2FSVVNcIl0sZXM6W1wiZXMtRVNcIixcIkZlbWFsZVwiLFwiZXMtRVMtTGF1cmEtQXBvbGxvXCJdLGZpOltcImZpLUZJXCIsXCJGZW1hbGVcIixcImZpLUZJLUhlaWRpUlVTXCJdLGZyOltcImZyLUZSXCIsXCJGZW1hbGVcIixcImZyLUZSLUp1bGllLUFwb2xsb1wiXSxoZTpbXCJoZS1JTFwiLFwiTWFsZVwiLFwiaGUtSUwtQXNhZlwiXSxoaTpbXCJoaS1JTlwiLFwiRmVtYWxlXCIsXCJoaS1JTi1LYWxwYW5hLUFwb2xsb1wiXSxocjpbXCJoci1IUlwiLFwiTWFsZVwiLFwiaHItSFItTWF0ZWpcIl0saHU6W1wiaHUtSFVcIixcIk1hbGVcIixcImh1LUhVLVN6YWJvbGNzXCJdLGlkOltcImlkLUlEXCIsXCJNYWxlXCIsXCJpZC1JRC1BbmRpa2FcIl0saXQ6W1wiaXQtSVRcIixcIk1hbGVcIixcIml0LUlULUNvc2ltby1BcG9sbG9cIl0samE6W1wiamEtSlBcIixcIkZlbWFsZVwiLFwiamEtSlAtQXl1bWktQXBvbGxvXCJdLGtvOltcImtvLUtSXCIsXCJGZW1hbGVcIixcImtvLUtSLUhlYW1pUlVTXCJdLG1zOltcIm1zLU1ZXCIsXCJNYWxlXCIsXCJtcy1NWS1SaXp3YW5cIl0sbmw6W1wibmwtTkxcIixcIkZlbWFsZVwiLFwibmwtTkwtSGFubmFSVVNcIl0sbmI6W1wibmItTk9cIixcIkZlbWFsZVwiLFwibmItTk8tSHVsZGFSVVNcIl0sbm86W1wibmItTk9cIixcIkZlbWFsZVwiLFwibmItTk8tSHVsZGFSVVNcIl0scGw6W1wicGwtUExcIixcIkZlbWFsZVwiLFwicGwtUEwtUGF1bGluYVJVU1wiXSxwdDpbXCJwdC1QVFwiLFwiRmVtYWxlXCIsXCJwdC1QVC1IZWxpYVJVU1wiXSxybzpbXCJyby1ST1wiLFwiTWFsZVwiLFwicm8tUk8tQW5kcmVpXCJdLHJ1OltcInJ1LVJVXCIsXCJGZW1hbGVcIixcInJ1LVJVLUlyaW5hLUFwb2xsb1wiXSxzazpbXCJzay1TS1wiLFwiTWFsZVwiLFwic2stU0stRmlsaXBcIl0sc2w6W1wic2wtU0xcIixcIk1hbGVcIixcInNsLVNJLUxhZG9cIl0sc3Y6W1wic3YtU0VcIixcIkZlbWFsZVwiLFwic3YtU0UtSGVkdmlnUlVTXCJdLHRhOltcInRhLUlOXCIsXCJGZW1hbGVcIixcInRhLUlOLVZhbGx1dmFyXCJdLHRlOltcInRlLUlOXCIsXCJNYWxlXCIsXCJ0ZS1JTi1DaGl0cmFcIl0sdGg6W1widGgtVEhcIixcIk1hbGVcIixcInRoLVRILVBhdHRhcmFcIl0sdHI6W1widHItVFJcIixcIkZlbWFsZVwiLFwidHItVFItU2VkYVJVU1wiXSx2aTpbXCJ2aS1WTlwiLFwiTWFsZVwiLFwidmktVk4tQW5cIl0sXCJ6aC1IYW5zXCI6W1wiemgtQ05cIixcIkZlbWFsZVwiLFwiemgtQ04tSHVpaHVpUlVTXCJdLFwiemgtSGFudFwiOltcInpoLUNOXCIsXCJGZW1hbGVcIixcInpoLUNOLUh1aWh1aVJVU1wiXSx5dWU6W1wiemgtSEtcIixcIkZlbWFsZVwiLFwiemgtSEstVHJhY3lSVVNcIl19LEg9e2FyOlwiYXItRUdcIixjYTpcImNhLUVTXCIsZGE6XCJkYS1ES1wiLGRlOlwiZGUtREVcIixlbjpcImVuLVVTXCIsZXM6XCJlcy1FU1wiLGZpOlwiZmktRklcIixmcjpcImZyLUZSXCIsaGk6XCJoaS1JTlwiLGl0OlwiaXQtSVRcIixqYTpcImphLUpQXCIsa286XCJrby1LUlwiLG5iOlwibmItTk9cIixubDpcIm5sLU5MXCIscGw6XCJwbC1QTFwiLHB0OlwicHQtUFRcIixydTpcInJ1LVJVXCIsc3Y6XCJzdi1TRVwiLHRoOlwidGgtVEhcIixcInpoLUhhbnNcIjpcInpoLUNOXCIsXCJ6aC1IYW50XCI6XCJ6aC1IS1wiLHl1ZTpcInpoLUhLXCIsZ3U6XCJndS1JTlwiLG1yOlwibXItSU5cIix0YTpcInRhLUlOXCIsdGU6XCJ0ZS1JTlwiLHRyOlwidHItVFJcIn07Y2xhc3MgT3tjb25zdHJ1Y3Rvcigpe2kodGhpcyxcIklHXCIsXCJcIik7aSh0aGlzLFwiSUlEXCIsXCJcIik7aSh0aGlzLFwidG9rZW5cIixcIlwiKTtpKHRoaXMsXCJrZXlcIixcIlwiKTtpKHRoaXMsXCJ0b2tlbnNJbml0aWF0ZWRcIiwhMSk7aSh0aGlzLFwiVFRTX0FVVEhcIix7cmVnaW9uOlwiXCIsdG9rZW46XCJcIn0pO2kodGhpcyxcImNvdW50XCIsMCk7aSh0aGlzLFwibGFzdFJlcXVlc3RUaW1lXCIsMCk7aSh0aGlzLFwiUkVRVUVTVF9ERUxBWVwiLDFlMyk7aSh0aGlzLFwiSFRNTFBhcnNlclwiLG5ldyBET01QYXJzZXIpO2kodGhpcyxcIk1BWF9SRVRSWVwiLDEpO2kodGhpcyxcIkhPU1RcIixcImh0dHBzOi8vd3d3LmJpbmcuY29tL1wiKTtpKHRoaXMsXCJIT01FX1BBR0VcIixcImh0dHBzOi8vd3d3LmJpbmcuY29tL3RyYW5zbGF0b3JcIik7aSh0aGlzLFwiSEVBREVSU1wiLHthY2NlcHQ6XCIqLypcIixcImFjY2VwdC1sYW5ndWFnZVwiOlwiZW4tVVMsZW47cT0wLjksa287cT0wLjgsemgtQ047cT0wLjcsemg7cT0wLjZcIixcImNvbnRlbnQtdHlwZVwiOlwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIsXCJ1c2VyLWFnZW50XCI6XCJNb3ppbGxhLzUuMCAoTWFjaW50b3NoOyBJbnRlbCBNYWMgT1MgWCAxMF8xNV83KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIwLjAuMC4wIFNhZmFyaS81MzcuMzYgRWRnLzEyMC4wLjAuMFwiLFwiYWNjZXB0LWVuY29kaW5nXCI6XCJnemlwLCBkZWZsYXRlLCBiclwiLFwiY2FjaGUtY29udHJvbFwiOlwibm8tY2FjaGVcIixvcmlnaW46XCJodHRwczovL3d3dy5iaW5nLmNvbVwiLHJlZmVyZXI6XCJodHRwczovL3d3dy5iaW5nLmNvbS90cmFuc2xhdG9yXCIsXCJzZWMtY2gtdWFcIjonXCJOb3RfQSBCcmFuZFwiO3Y9XCI4XCIsIFwiQ2hyb21pdW1cIjt2PVwiMTIwXCIsIFwiTWljcm9zb2Z0IEVkZ2VcIjt2PVwiMTIwXCInLFwic2VjLWNoLXVhLW1vYmlsZVwiOlwiPzBcIixcInNlYy1jaC11YS1wbGF0Zm9ybVwiOidcIm1hY09TXCInLFwic2VjLWZldGNoLWRlc3RcIjpcImVtcHR5XCIsXCJzZWMtZmV0Y2gtbW9kZVwiOlwiY29yc1wiLFwic2VjLWZldGNoLXNpdGVcIjpcInNhbWUtb3JpZ2luXCJ9KTtpKHRoaXMsXCJMQU5fVE9fQ09ERVwiLG5ldyBNYXAoYikpO2kodGhpcyxcIkNPREVfVE9fTEFOXCIsbmV3IE1hcChiLm1hcCgoW2UsdF0pPT5bdCxlXSkpKTtpKHRoaXMsXCJBVURJT1wiLG5ldyBBdWRpbyl9YXN5bmMgdXBkYXRlVG9rZW5zKCl7Y29uc3QgZT1hd2FpdCBwLmdldCh0aGlzLkhPTUVfUEFHRSksdD0vKGh0dHBzOlxcL1xcLy4qXFwuYmluZ1xcLmNvbVxcLykuKi9nLmV4ZWMoZS5yZXF1ZXN0LnJlc3BvbnNlVVJMKTt0JiZ0WzFdIT10aGlzLkhPU1QmJih0aGlzLkhPU1Q9dFsxXSx0aGlzLkhPTUVfUEFHRT1gJHt0aGlzLkhPU1R9dHJhbnNsYXRvcmApLHRoaXMuSUc9ZS5kYXRhLm1hdGNoKC9JRzpcIihbQS1aYS16MC05XSspXCIvKVsxXSxbLHRoaXMua2V5LHRoaXMudG9rZW5dPWUuZGF0YS5tYXRjaCgvdmFyIHBhcmFtc19BYnVzZVByZXZlbnRpb25IZWxwZXJcXHMqPVxccypcXFsoWzAtOV0rKSxcXHMqXCIoW15cIl0rKVwiLFteXFxdXSpcXF07Lyk7Y29uc3Qgcz10aGlzLkhUTUxQYXJzZXIucGFyc2VGcm9tU3RyaW5nKGUuZGF0YSxcInRleHQvaHRtbFwiKTt0aGlzLklJRD1zLmdldEVsZW1lbnRCeUlkKFwicmljaF90dGFcIikuZ2V0QXR0cmlidXRlKFwiZGF0YS1paWRcIil8fFwiXCIsdGhpcy5jb3VudD0wfXBhcnNlVHJhbnNsYXRlUmVzdWx0KGUsdCl7Y29uc3Qgcz10fHxuZXcgT2JqZWN0O3RyeXtjb25zdCBhPWVbMF0udHJhbnNsYXRpb25zO3MubWFpbk1lYW5pbmc9YVswXS50ZXh0LHMudFByb251bmNpYXRpb249YVswXS50cmFuc2xpdGVyYXRpb24udGV4dH1jYXRjaHt9cmV0dXJuIHN9cGFyc2VMb29rdXBSZXN1bHQoZSx0KXtjb25zdCBzPXR8fG5ldyBPYmplY3Q7dHJ5e3Mub3JpZ2luYWxUZXh0PWVbMF0uZGlzcGxheVNvdXJjZTtjb25zdCBhPWVbMF0udHJhbnNsYXRpb25zO3MubWFpbk1lYW5pbmc9YVswXS5kaXNwbGF5VGFyZ2V0LHMudFByb251bmNpYXRpb249YVswXS50cmFuc2xpdGVyYXRpb247Y29uc3Qgbj1bXTtmb3IoY29uc3QgbyBpbiBhKXtjb25zdCByPVtdO2Zvcihjb25zdCBsIGluIGFbb10uYmFja1RyYW5zbGF0aW9ucylyLnB1c2goYVtvXS5iYWNrVHJhbnNsYXRpb25zW2xdLmRpc3BsYXlUZXh0KTtuLnB1c2goe3BvczphW29dLnBvc1RhZyxtZWFuaW5nOmFbb10uZGlzcGxheVRhcmdldCxzeW5vbnltczpyfSl9cy5kZXRhaWxlZE1lYW5pbmdzPW59Y2F0Y2h7fXJldHVybiBzfXBhcnNlRXhhbXBsZVJlc3VsdChlLHQpe2NvbnN0IHM9dHx8bmV3IE9iamVjdDt0cnl7cy5leGFtcGxlcz1lWzBdLmV4YW1wbGVzLm1hcChhPT4oe3NvdXJjZTpgJHthLnNvdXJjZVByZWZpeH08Yj4ke2Euc291cmNlVGVybX08L2I+JHthLnNvdXJjZVN1ZmZpeH1gLHRhcmdldDpgJHthLnRhcmdldFByZWZpeH08Yj4ke2EudGFyZ2V0VGVybX08L2I+JHthLnRhcmdldFN1ZmZpeH1gfSkpfWNhdGNoe31yZXR1cm4gc31hc3luYyB1cGRhdGVUVFNBdXRoKCl7Y29uc3QgZT0oKT0+KHttZXRob2Q6XCJQT1NUXCIsYmFzZVVSTDp0aGlzLkhPU1QsdXJsOmB0ZmV0c3BrdG9rP2lzVmVydGljYWw9MSYmSUc9JHt0aGlzLklHfSZJSUQ9JHt0aGlzLklJRH0uJHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YCxoZWFkZXJzOnRoaXMuSEVBREVSUyxkYXRhOmAmdG9rZW49JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy50b2tlbil9JmtleT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmtleSl9YH0pLHQ9YXdhaXQgdGhpcy5yZXF1ZXN0KGUsW10pO3RoaXMuVFRTX0FVVEgucmVnaW9uPXQucmVnaW9uLHRoaXMuVFRTX0FVVEgudG9rZW49dC50b2tlbn1nZW5lcmF0ZVRUU0RhdGEoZSx0LHMpe2NvbnN0IGE9dGhpcy5MQU5fVE9fQ09ERS5nZXQodCksbj1EW2FdLG89SFthXSxyPXM9PT1cImZhc3RcIj9cIi0xMC4wMCVcIjpcIi0zMC4wMCVcIjtyZXR1cm5gPHNwZWFrIHZlcnNpb249JzEuMCcgeG1sOmxhbmc9JyR7b30nPjx2b2ljZSB4bWw6bGFuZz0nJHtvfScgeG1sOmdlbmRlcj0nJHtuWzFdfScgbmFtZT0nJHtuWzJdfSc+PHByb3NvZHkgcmF0ZT0nJHtyfSc+JHtlfTwvcHJvc29keT48L3ZvaWNlPjwvc3BlYWs+YH1hcnJheUJ1ZmZlclRvQmFzZTY0KGUpe2xldCB0PVwiXCIscz1uZXcgVWludDhBcnJheShlKTtmb3IobGV0IGE9MDthPHMuYnl0ZUxlbmd0aDthKyspdCs9U3RyaW5nLmZyb21DaGFyQ29kZShzW2FdKTtyZXR1cm4gYnRvYSh0KX1jb25zdHJ1Y3REZXRlY3RQYXJhbXMoZSl7Y29uc3QgdD1gdHRyYW5zbGF0ZXYzP2lzVmVydGljYWw9MSZJRz0ke3RoaXMuSUd9JklJRD0ke3RoaXMuSUlEfS4ke3RoaXMuY291bnQudG9TdHJpbmcoKX1gLHM9YCZmcm9tTGFuZz1hdXRvLWRldGVjdCZ0bz16aC1IYW5zJnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQoZSl9JnRva2VuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMudG9rZW4pfSZrZXk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5rZXkpfWA7cmV0dXJue21ldGhvZDpcIlBPU1RcIixiYXNlVVJMOnRoaXMuSE9TVCx1cmw6dCxoZWFkZXJzOnRoaXMuSEVBREVSUyxkYXRhOnN9fWNvbnN0cnVjdFRyYW5zbGF0ZVBhcmFtcyhlLHQscyl7Y29uc3QgYT1gdHRyYW5zbGF0ZXYzP2lzVmVydGljYWw9MSZJRz0ke3RoaXMuSUd9JklJRD0ke3RoaXMuSUlEfS4ke3RoaXMuY291bnQudG9TdHJpbmcoKX1gLG49YCZmcm9tTGFuZz0ke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHQpfSZ0bz0ke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHMpfSZ0ZXh0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KGUpfSZ0b2tlbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLnRva2VuKX0ma2V5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMua2V5KX1gO3JldHVybnttZXRob2Q6XCJQT1NUXCIsYmFzZVVSTDp0aGlzLkhPU1QsdXJsOmEsaGVhZGVyczp0aGlzLkhFQURFUlMsZGF0YTpufX1jb25zdHJ1Y3RMb29rdXBQYXJhbXMoZSx0LHMpe2NvbnN0IGE9YHRsb29rdXB2Mz9pc1ZlcnRpY2FsPTEmSUc9JHt0aGlzLklHfSZJSUQ9JHt0aGlzLklJRH0uJHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YCxuPWAmZnJvbT0ke3R9JnRvPSR7dGhpcy5MQU5fVE9fQ09ERS5nZXQocyl9JnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQoZSl9JnRva2VuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMudG9rZW4pfSZrZXk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5rZXkpfWA7cmV0dXJue21ldGhvZDpcIlBPU1RcIixiYXNlVVJMOnRoaXMuSE9TVCx1cmw6YSxoZWFkZXJzOnRoaXMuSEVBREVSUyxkYXRhOm59fWNvbnN0cnVjdEV4YW1wbGVQYXJhbXMoZSx0LHMsYSl7Y29uc3Qgbj1gdGV4YW1wbGV2Mz9pc1ZlcnRpY2FsPTEmSUc9JHt0aGlzLklHfSZJSUQ9JHt0aGlzLklJRH0uJHt0aGlzLmNvdW50LnRvU3RyaW5nKCl9YCxvPWAmZnJvbT0ke2V9JnRvPSR7dGhpcy5MQU5fVE9fQ09ERS5nZXQodCl9JnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQocyl9JnRyYW5zbGF0aW9uPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGEpfSZ0b2tlbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLnRva2VuKX0ma2V5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMua2V5KX1gO3JldHVybnttZXRob2Q6XCJQT1NUXCIsYmFzZVVSTDp0aGlzLkhPU1QsdXJsOm4saGVhZGVyczp0aGlzLkhFQURFUlMsZGF0YTpvfX1jb25zdHJ1Y3RUVFNQYXJhbXMoZSx0LHMpe2NvbnN0IGE9YGh0dHBzOi8vJHt0aGlzLlRUU19BVVRILnJlZ2lvbn0udHRzLnNwZWVjaC5taWNyb3NvZnQuY29tL2NvZ25pdGl2ZXNlcnZpY2VzL3YxP2Asbj17XCJDb250ZW50LVR5cGVcIjpcImFwcGxpY2F0aW9uL3NzbWwreG1sXCIsQXV0aG9yaXphdGlvbjpgQmVhcmVyICR7dGhpcy5UVFNfQVVUSC50b2tlbn1gLFwiWC1NSUNST1NPRlQtT3V0cHV0Rm9ybWF0XCI6XCJhdWRpby0xNmtoei0zMmtiaXRyYXRlLW1vbm8tbXAzXCIsXCJjYWNoZS1jb250cm9sXCI6XCJuby1jYWNoZVwifTtyZXR1cm57bWV0aG9kOlwiUE9TVFwiLGJhc2VVUkw6YSxoZWFkZXJzOm4sZGF0YTp0aGlzLmdlbmVyYXRlVFRTRGF0YShlLHQscykscmVzcG9uc2VUeXBlOlwiYXJyYXlidWZmZXJcIn19YXN5bmMgcmVxdWVzdChlLHQscz0hMCl7Y29uc3QgYT1EYXRlLm5vdygpLXRoaXMubGFzdFJlcXVlc3RUaW1lO2lmKGE8dGhpcy5SRVFVRVNUX0RFTEFZKXtjb25zdCByPXRoaXMuUkVRVUVTVF9ERUxBWS1hO2F3YWl0IG5ldyBQcm9taXNlKGw9PnNldFRpbWVvdXQobCxyKSl9dGhpcy5sYXN0UmVxdWVzdFRpbWU9RGF0ZS5ub3coKTtsZXQgbj0wO2NvbnN0IG89YXN5bmMoKT0+e3RoaXMuY291bnQrKztjb25zdCByPWF3YWl0IHAoZS5jYWxsKHRoaXMsLi4udCkpO2lmKHIuc3RhdHVzPT09NDAxfHxyLnN0YXR1cz09PTQyOSl0aHJvd3tlcnJvclR5cGU6XCJBUElfRVJSXCIsZXJyb3JDb2RlOnIuc3RhdHVzLGVycm9yTXNnOlwiUmVxdWVzdCB0b28gZnJlcXVlbnRseSFcIn07Y29uc3QgbD0vKGh0dHBzOlxcL1xcLy4qXFwuYmluZ1xcLmNvbVxcLykuKi9nLmV4ZWMoci5yZXF1ZXN0LnJlc3BvbnNlVVJMKTtpZihsJiZsWzFdIT09dGhpcy5IT1NUKXJldHVybiB0aGlzLkhPU1Q9bFsxXSx0aGlzLkhPTUVfUEFHRT1gJHt0aGlzLkhPU1R9dHJhbnNsYXRvcmAsYXdhaXQgdGhpcy51cGRhdGVUb2tlbnMoKS50aGVuKG8pO2NvbnN0IHU9ci5kYXRhLlN0YXR1c0NvZGV8fHIuZGF0YS5zdGF0dXNDb2RlfHwyMDA7c3dpdGNoKHUpe2Nhc2UgMjAwOnJldHVybiByLmRhdGE7Y2FzZSAyMDU6cmV0dXJuIGF3YWl0IHRoaXMudXBkYXRlVG9rZW5zKCkudGhlbihvKX1pZihzJiZuPHRoaXMuTUFYX1JFVFJZKXJldHVybiBuKyssYXdhaXQgdGhpcy51cGRhdGVUb2tlbnMoKS50aGVuKG8pO3Rocm93e2Vycm9yVHlwZTpcIkFQSV9FUlJcIixlcnJvckNvZGU6dSxlcnJvck1zZzpcIlJlcXVlc3QgZmFpbGVkLlwifX07cmV0dXJuIHRoaXMudG9rZW5zSW5pdGlhdGVkfHwoYXdhaXQgdGhpcy51cGRhdGVUb2tlbnMoKSx0aGlzLnRva2Vuc0luaXRpYXRlZD0hMCksbygpfXN1cHBvcnRlZExhbmd1YWdlcygpe3JldHVybiBuZXcgU2V0KHRoaXMuTEFOX1RPX0NPREUua2V5cygpKX1hc3luYyBkZXRlY3QoZSl7dHJ5e2NvbnN0IHQ9KGF3YWl0IHRoaXMucmVxdWVzdCh0aGlzLmNvbnN0cnVjdERldGVjdFBhcmFtcyxbZV0pKVswXS5kZXRlY3RlZExhbmd1YWdlLmxhbmd1YWdlO3JldHVybiB0aGlzLkNPREVfVE9fTEFOLmdldCh0KX1jYXRjaCh0KXt0aHJvdyB0LmVycm9yTXNnPXQuZXJyb3JNc2d8fHQubWVzc2FnZSx0LmVycm9yQWN0PXthcGk6XCJiaW5nXCIsYWN0aW9uOlwiZGV0ZWN0XCIsdGV4dDplLGZyb206bnVsbCx0bzpudWxsfSx0fX1hc3luYyB0cmFuc2xhdGUoZSx0LHMpe2xldCBhO3RyeXthPWF3YWl0IHRoaXMucmVxdWVzdCh0aGlzLmNvbnN0cnVjdFRyYW5zbGF0ZVBhcmFtcyxbZSx0LHNdKX1jYXRjaChvKXt0aHJvdyBvLmVycm9yQWN0PXthcGk6XCJiaW5nXCIsYWN0aW9uOlwidHJhbnNsYXRlXCIsdGV4dDplLGZyb206dCx0bzpzfSxvfWNvbnN0IG49dGhpcy5wYXJzZVRyYW5zbGF0ZVJlc3VsdChhLHtvcmlnaW5hbFRleHQ6ZSxtYWluTWVhbmluZzpcIlwifSk7dHJ5e2NvbnN0IG89YXdhaXQgdGhpcy5yZXF1ZXN0KHRoaXMuY29uc3RydWN0TG9va3VwUGFyYW1zLFtlLGFbMF0uZGV0ZWN0ZWRMYW5ndWFnZS5sYW5ndWFnZSxzXSwhMSkscj10aGlzLnBhcnNlTG9va3VwUmVzdWx0KG8sbiksbD1hd2FpdCB0aGlzLnJlcXVlc3QodGhpcy5jb25zdHJ1Y3RFeGFtcGxlUGFyYW1zLFthWzBdLmRldGVjdGVkTGFuZ3VhZ2UubGFuZ3VhZ2UscyxlLHIubWFpbk1lYW5pbmddLCExKTtyZXR1cm4gdGhpcy5wYXJzZUV4YW1wbGVSZXN1bHQobCxyKX1jYXRjaHtyZXR1cm4gbn19YXN5bmMgcHJvbm91bmNlKGUsdCxzKXt0aGlzLnN0b3BQcm9ub3VuY2UoKTtsZXQgYT0wO2NvbnN0IG49YXN5bmMoKT0+e3RyeXtjb25zdCBvPWF3YWl0IHRoaXMucmVxdWVzdCh0aGlzLmNvbnN0cnVjdFRUU1BhcmFtcyxbZSx0LHNdLCExKTt0aGlzLkFVRElPLnNyYz1gZGF0YTphdWRpby9tcDM7YmFzZTY0LCR7dGhpcy5hcnJheUJ1ZmZlclRvQmFzZTY0KG8pfWAsYXdhaXQgdGhpcy5BVURJTy5wbGF5KCl9Y2F0Y2gobyl7aWYoYTx0aGlzLk1BWF9SRVRSWSlyZXR1cm4gYSsrLHRoaXMudXBkYXRlVFRTQXV0aCgpLnRoZW4obik7Y29uc3Qgcj17YXBpOlwiYmluZ1wiLGFjdGlvbjpcInByb25vdW5jZVwiLHRleHQ6ZSxmcm9tOnQsdG86bnVsbH07dGhyb3cgby5lcnJvclR5cGU/KG8uZXJyb3JBY3Q9cixvKTp7ZXJyb3JUeXBlOlwiTkVUX0VSUlwiLGVycm9yQ29kZTowLGVycm9yTXNnOm8ubWVzc2FnZSxlcnJvckFjdDpyfX19O3JldHVybiB0aGlzLlRUU19BVVRILnJlZ2lvbi5sZW5ndGg+MCYmdGhpcy5UVFNfQVVUSC50b2tlbi5sZW5ndGg+MHx8YXdhaXQgdGhpcy51cGRhdGVUVFNBdXRoKCksbigpfXN0b3BQcm9ub3VuY2UoKXt0aGlzLkFVRElPLnBhdXNlZHx8dGhpcy5BVURJTy5wYXVzZSgpfX1jb25zdCBfPVtbXCJhdXRvXCIsXCJhdXRvXCJdLFtcInpoLUNOXCIsXCJ6aC1DTlwiXSxbXCJ6aC1UV1wiLFwiemgtVFdcIl0sW1wiZW5cIixcImVuXCJdLFtcImFmXCIsXCJhZlwiXSxbXCJhbVwiLFwiYW1cIl0sW1wiYXJcIixcImFyXCJdLFtcImF6XCIsXCJhelwiXSxbXCJiZVwiLFwiYmVcIl0sW1wiYmdcIixcImJnXCJdLFtcImJuXCIsXCJiblwiXSxbXCJic1wiLFwiYnNcIl0sW1wiY2FcIixcImNhXCJdLFtcImNlYlwiLFwiY2ViXCJdLFtcImNvXCIsXCJjb1wiXSxbXCJjc1wiLFwiY3NcIl0sW1wiY3lcIixcImN5XCJdLFtcImRhXCIsXCJkYVwiXSxbXCJkZVwiLFwiZGVcIl0sW1wiZWxcIixcImVsXCJdLFtcImVvXCIsXCJlb1wiXSxbXCJlc1wiLFwiZXNcIl0sW1wiZXRcIixcImV0XCJdLFtcImV1XCIsXCJldVwiXSxbXCJmYVwiLFwiZmFcIl0sW1wiZmlcIixcImZpXCJdLFtcImZyXCIsXCJmclwiXSxbXCJmeVwiLFwiZnlcIl0sW1wiZ2FcIixcImdhXCJdLFtcImdkXCIsXCJnZFwiXSxbXCJnbFwiLFwiZ2xcIl0sW1wiZ3VcIixcImd1XCJdLFtcImhhXCIsXCJoYVwiXSxbXCJoYXdcIixcImhhd1wiXSxbXCJoZVwiLFwiaGVcIl0sW1wiaGlcIixcImhpXCJdLFtcImhtblwiLFwiaG1uXCJdLFtcImhyXCIsXCJoclwiXSxbXCJodFwiLFwiaHRcIl0sW1wiaHVcIixcImh1XCJdLFtcImh5XCIsXCJoeVwiXSxbXCJpZFwiLFwiaWRcIl0sW1wiaWdcIixcImlnXCJdLFtcImlzXCIsXCJpc1wiXSxbXCJpdFwiLFwiaXRcIl0sW1wiamFcIixcImphXCJdLFtcImp3XCIsXCJqd1wiXSxbXCJrYVwiLFwia2FcIl0sW1wia2tcIixcImtrXCJdLFtcImttXCIsXCJrbVwiXSxbXCJrblwiLFwia25cIl0sW1wia29cIixcImtvXCJdLFtcImt1XCIsXCJrdVwiXSxbXCJreVwiLFwia3lcIl0sW1wibGFcIixcImxhXCJdLFtcImxiXCIsXCJsYlwiXSxbXCJsb1wiLFwibG9cIl0sW1wibHRcIixcImx0XCJdLFtcImx2XCIsXCJsdlwiXSxbXCJtZ1wiLFwibWdcIl0sW1wibWlcIixcIm1pXCJdLFtcIm1rXCIsXCJta1wiXSxbXCJtbFwiLFwibWxcIl0sW1wibW5cIixcIm1uXCJdLFtcIm1yXCIsXCJtclwiXSxbXCJtc1wiLFwibXNcIl0sW1wibXRcIixcIm10XCJdLFtcIm15XCIsXCJteVwiXSxbXCJuZVwiLFwibmVcIl0sW1wibmxcIixcIm5sXCJdLFtcIm5vXCIsXCJub1wiXSxbXCJueVwiLFwibnlcIl0sW1wicGxcIixcInBsXCJdLFtcInBzXCIsXCJwc1wiXSxbXCJwdFwiLFwicHRcIl0sW1wicm9cIixcInJvXCJdLFtcInJ1XCIsXCJydVwiXSxbXCJzZFwiLFwic2RcIl0sW1wic2lcIixcInNpXCJdLFtcInNrXCIsXCJza1wiXSxbXCJzbFwiLFwic2xcIl0sW1wic21cIixcInNtXCJdLFtcInNuXCIsXCJzblwiXSxbXCJzb1wiLFwic29cIl0sW1wic3FcIixcInNxXCJdLFtcInNyXCIsXCJzclwiXSxbXCJzdFwiLFwic3RcIl0sW1wic3VcIixcInN1XCJdLFtcInN2XCIsXCJzdlwiXSxbXCJzd1wiLFwic3dcIl0sW1widGFcIixcInRhXCJdLFtcInRlXCIsXCJ0ZVwiXSxbXCJ0Z1wiLFwidGdcIl0sW1widGhcIixcInRoXCJdLFtcImZpbFwiLFwidGxcIl0sW1widHJcIixcInRyXCJdLFtcInVnXCIsXCJ1Z1wiXSxbXCJ1a1wiLFwidWtcIl0sW1widXJcIixcInVyXCJdLFtcInV6XCIsXCJ1elwiXSxbXCJ2aVwiLFwidmlcIl0sW1wieGhcIixcInhoXCJdLFtcInlpXCIsXCJ5aVwiXSxbXCJ5b1wiLFwieW9cIl0sW1wienVcIixcInp1XCJdXTtjbGFzcyB3e2NvbnN0cnVjdG9yKCl7aSh0aGlzLFwiVEtLXCIsWzQzNDIxNywxNTM0NTU5MDAxXSk7aSh0aGlzLFwiSE9NRV9QQUdFXCIsXCJodHRwczovL3RyYW5zbGF0ZS5nb29nbGUuY29tL1wiKTtpKHRoaXMsXCJIT1NUXCIsXCJodHRwczovL3RyYW5zbGF0ZS5nb29nbGVhcGlzLmNvbS9cIik7aSh0aGlzLFwiVFJBTlNMQVRFX1VSTFwiLGAke3RoaXMuSE9TVH10cmFuc2xhdGVfYS9zaW5nbGU/Y2xpZW50PWd0eCZkaj0xJmR0PXQmZHQ9YXQmZHQ9YmQmZHQ9ZXgmZHQ9bWQmZHQ9cncmZHQ9c3MmZHQ9cm1gKTtpKHRoaXMsXCJUVFNfVVJMXCIsYCR7dGhpcy5IT1NUfXRyYW5zbGF0ZV90dHM/Y2xpZW50PWd0eGApO2kodGhpcyxcIkZBTExCQUNLX1RSQU5TTEFURV9VUkxcIixgJHt0aGlzLkhPU1R9dHJhbnNsYXRlX2Evc2luZ2xlP2llPVVURi04JmNsaWVudD13ZWJhcHAmb3RmPTEmc3NlbD0wJnRzZWw9MCZrYz01JmR0PXQmZHQ9YXQmZHQ9YmQmZHQ9ZXgmZHQ9bWQmZHQ9cncmZHQ9c3MmZHQ9cm1gKTtpKHRoaXMsXCJGQUxMQkFDS19UVFNfVVJMXCIsYCR7dGhpcy5IT1NUfXRyYW5zbGF0ZV90dHM/aWU9VVRGLTgmY2xpZW50PXdlYmFwcGApO2kodGhpcyxcImZhbGxCYWNraW5nXCIsITEpO2kodGhpcyxcIkxBTl9UT19DT0RFXCIsbmV3IE1hcChfKSk7aSh0aGlzLFwiQ09ERV9UT19MQU5cIixuZXcgTWFwKF8ubWFwKChbZSx0XSk9Plt0LGVdKSkpO2kodGhpcyxcIkFVRElPXCIsbmV3IEF1ZGlvKX1nZW5lcmF0ZVRLKGUsdCxzKXt0PU51bWJlcih0KXx8MDtsZXQgYT1bXSxuPTAsbz0wO2Zvcig7bzxlLmxlbmd0aDtvKyspe2xldCByPWUuY2hhckNvZGVBdChvKTsxMjg+cj9hW24rK109cjooMjA0OD5yP2FbbisrXT1yPj42fDE5MjooKHImNjQ1MTIpPT01NTI5NiYmbysxPGUubGVuZ3RoJiYoZS5jaGFyQ29kZUF0KG8rMSkmNjQ1MTIpPT01NjMyMD8ocj02NTUzNisoKHImMTAyMyk8PDEwKSsoZS5jaGFyQ29kZUF0KCsrbykmMTAyMyksYVtuKytdPXI+PjE4fDI0MCxhW24rK109cj4+MTImNjN8MTI4KTphW24rK109cj4+MTJ8MjI0LGFbbisrXT1yPj42JjYzfDEyOCksYVtuKytdPXImNjN8MTI4KX1mb3IoZT10LG49MDtuPGEubGVuZ3RoO24rKyllKz1hW25dLGU9dGhpcy5fbWFnaWMoZSxcIistYV4rNlwiKTtyZXR1cm4gZT10aGlzLl9tYWdpYyhlLFwiKy0zXitiKy1mXCIpLGVePU51bWJlcihzKXx8MCwwPmUmJihlPShlJjIxNDc0ODM2NDcpKzIxNDc0ODM2NDgpLGUlPTFlNixlLnRvU3RyaW5nKCkrXCIuXCIrKGVedCl9X21hZ2ljKGUsdCl7Zm9yKHZhciBzPTA7czx0Lmxlbmd0aC0yO3MrPTMpe3ZhciBhPXQuY2hhckF0KHMrMiksYT1cImFcIjw9YT9hLmNoYXJDb2RlQXQoMCktODc6TnVtYmVyKGEpLGE9dC5jaGFyQXQocysxKT09XCIrXCI/ZT4+PmE6ZTw8YTtlPXQuY2hhckF0KHMpPT1cIitcIj9lK2EmNDI5NDk2NzI5NTplXmF9cmV0dXJuIGV9YXN5bmMgdXBkYXRlVEtLKCl7bGV0IGU9KGF3YWl0IHAuZ2V0KHRoaXMuSE9NRV9QQUdFKSkuZGF0YSx0PShlLm1hdGNoKC9US0s9KC4qPylcXChcXClcXCknXFwpOy9pKXx8W1wiXCJdKVswXS5yZXBsYWNlKC9cXFxceChbMC05QS1GYS1mXXsyfSkvZyxcIlwiKS5tYXRjaCgvWystXT9cXGQrL2cpO3Q/KHRoaXMuVEtLWzBdPU51bWJlcih0WzJdKSx0aGlzLlRLS1sxXT1OdW1iZXIodFswXSkrTnVtYmVyKHRbMV0pKToodD1lLm1hdGNoKC9US0tbPTpdWydcIl0oXFxkKz8pXFwuKFxcZCs/KVsnXCJdL2kpLHQmJih0aGlzLlRLS1swXT1OdW1iZXIodFsxXSksdGhpcy5US0tbMV09TnVtYmVyKHRbMl0pKSl9ZmFsbEJhY2soKXt0aGlzLmZhbGxCYWNraW5nPSEwLHNldFRpbWVvdXQoKCk9Pnt0aGlzLmZhbGxCYWNraW5nPSExfSwzMCo2MCoxZTMpfWdlbmVyYXRlRGV0ZWN0VVJMKGUpe2xldCB0PVwiJnNsPWF1dG8mdGw9emgtY25cIjtyZXR1cm4gdCs9YCZ0az0ke3RoaXMuZ2VuZXJhdGVUSyhlLHRoaXMuVEtLWzBdLHRoaXMuVEtLWzFdKX0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChlKX1gLHRoaXMuZmFsbEJhY2tpbmc/dGhpcy5GQUxMQkFDS19UUkFOU0xBVEVfVVJMK3Q6dGhpcy5UUkFOU0xBVEVfVVJMK3R9Z2VuZXJhdGVUcmFuc2xhdGVVUkwoZSx0LHMpe2xldCBhPWAmc2w9JHt0aGlzLkxBTl9UT19DT0RFLmdldCh0KX0mdGw9JHt0aGlzLkxBTl9UT19DT0RFLmdldChzKX1gO3JldHVybiBhKz1gJnRrPSR7dGhpcy5nZW5lcmF0ZVRLKGUsdGhpcy5US0tbMF0sdGhpcy5US0tbMV0pfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGUpfWAsdGhpcy5mYWxsQmFja2luZz90aGlzLkZBTExCQUNLX1RSQU5TTEFURV9VUkwrYTp0aGlzLlRSQU5TTEFURV9VUkwrYX1wYXJzZURldGVjdFJlc3VsdChlKXtyZXR1cm4gdGhpcy5mYWxsQmFja2luZz90aGlzLkNPREVfVE9fTEFOLmdldChlWzJdKXx8XCJcIjplLmxkX3Jlc3VsdC5leHRlbmRlZF9zcmNsYW5ncz90aGlzLkNPREVfVE9fTEFOLmdldChlLmxkX3Jlc3VsdC5leHRlbmRlZF9zcmNsYW5nc1swXSl8fFwiXCI6dGhpcy5DT0RFX1RPX0xBTi5nZXQoZS5sZF9yZXN1bHQuc3JjbGFuZ3NbMF0pfHxcIlwifXBhcnNlQmV0dGVyUmVzdWx0KGUpe2NvbnN0IHQ9e29yaWdpbmFsVGV4dDpcIlwiLG1haW5NZWFuaW5nOlwiXCJ9O2lmKGUuc2VudGVuY2VzKXt0Lm1haW5NZWFuaW5nPVwiXCIsdC5vcmlnaW5hbFRleHQ9XCJcIjtsZXQgcz0wO2Zvcig7czxlLnNlbnRlbmNlcy5sZW5ndGgmJmUuc2VudGVuY2VzW3NdLnRyYW5zO3MrKyl0Lm1haW5NZWFuaW5nKz1lLnNlbnRlbmNlc1tzXS50cmFucyx0Lm9yaWdpbmFsVGV4dCs9ZS5zZW50ZW5jZXNbc10ub3JpZztzPGUuc2VudGVuY2VzLmxlbmd0aCYmKGUuc2VudGVuY2VzW3NdLnRyYW5zbGl0JiYodC50UHJvbnVuY2lhdGlvbj1lLnNlbnRlbmNlc1tzXS50cmFuc2xpdCksZS5zZW50ZW5jZXNbc10uc3JjX3RyYW5zbGl0JiYodC5zUHJvbnVuY2lhdGlvbj1lLnNlbnRlbmNlc1tzXS5zcmNfdHJhbnNsaXQpKX1pZihlLmRpY3Qpe3QuZGV0YWlsZWRNZWFuaW5ncz1bXTtmb3IobGV0IHMgb2YgZS5kaWN0KWZvcihsZXQgYSBvZiBzLmVudHJ5KXQuZGV0YWlsZWRNZWFuaW5ncy5wdXNoKHtwb3M6cy5wb3MsbWVhbmluZzphLndvcmQsc3lub255bXM6YS5yZXZlcnNlX3RyYW5zbGF0aW9ufSl9aWYoZS5kZWZpbml0aW9ucyl7dC5kZWZpbml0aW9ucz1bXTtmb3IobGV0IHMgb2YgZS5kZWZpbml0aW9ucylmb3IobGV0IGEgb2Ygcy5lbnRyeSl0LmRlZmluaXRpb25zLnB1c2goe3BvczpzLnBvcyxtZWFuaW5nOmEuZ2xvc3Msc3lub255bXM6W10sZXhhbXBsZTphLmV4YW1wbGV9KX1pZihlLmV4YW1wbGVzKXt0LmV4YW1wbGVzPVtdO2ZvcihsZXQgcyBvZiBlLmV4YW1wbGVzLmV4YW1wbGUpdC5leGFtcGxlcy5wdXNoKHtzb3VyY2U6cy50ZXh0LHRhcmdldDpudWxsfSk7dC5leGFtcGxlcy5zb3J0KChzLGEpPT5zLnNvdXJjZT5hLnNvdXJjZT8xOnMuc291cmNlPT09YS5zb3VyY2U/MDotMSl9cmV0dXJuIHR9cGFyc2VGYWxsYmFja1Jlc3VsdChlKXtjb25zdCB0PXtvcmlnaW5hbFRleHQ6XCJcIixtYWluTWVhbmluZzpcIlwifTtmb3IobGV0IHM9MDtzPGUubGVuZ3RoO3MrKylpZihlW3NdKXtjb25zdCBhPWVbc107c3dpdGNoKHMpe2Nhc2UgMDp7bGV0IG49W10sbz1bXSxyPWEubGVuZ3RoLTE7Zm9yKGxldCBsPTA7bDw9cjtsKyspbi5wdXNoKGFbbF1bMF0pLG8ucHVzaChhW2xdWzFdKTt0Lm1haW5NZWFuaW5nPW4uam9pbihcIlwiKSx0Lm9yaWdpbmFsVGV4dD1vLmpvaW4oXCJcIik7dHJ5e3I+MCYmKGFbcl1bMl0mJmFbcl1bMl0ubGVuZ3RoPjAmJih0LnRQcm9udW5jaWF0aW9uPWFbcl1bMl0pLGFbcl1bM10mJmFbcl1bM10ubGVuZ3RoPjAmJih0LnNQcm9udW5jaWF0aW9uPWFbcl1bM10pKX1jYXRjaHt9YnJlYWt9Y2FzZSAxOnQuZGV0YWlsZWRNZWFuaW5ncz1uZXcgQXJyYXksYS5mb3JFYWNoKG49PnQuZGV0YWlsZWRNZWFuaW5ncy5wdXNoKHtwb3M6blswXSxtZWFuaW5nOm5bMV0uam9pbihcIiwgXCIpfSkpO2JyZWFrO2Nhc2UgMTI6dC5kZWZpbml0aW9ucz1uZXcgQXJyYXksYS5mb3JFYWNoKG49PntuWzFdLmZvckVhY2gobz0+e3QuZGVmaW5pdGlvbnMucHVzaCh7cG9zOm5bMF0sbWVhbmluZzpvWzBdLGV4YW1wbGU6b1syXX0pfSl9KTticmVhaztjYXNlIDEzOnQuZXhhbXBsZXM9bmV3IEFycmF5LGEuZm9yRWFjaChuPT5uLmZvckVhY2gobz0+dC5leGFtcGxlcy5wdXNoKHtzb3VyY2U6bnVsbCx0YXJnZXQ6b1swXX0pKSk7YnJlYWt9fXJldHVybiB0fXBhcnNlVHJhbnNsYXRlUmVzdWx0KGUpe3JldHVybiB0aGlzLmZhbGxCYWNraW5nP3RoaXMucGFyc2VGYWxsYmFja1Jlc3VsdChlKTp0aGlzLnBhcnNlQmV0dGVyUmVzdWx0KGUpfXN1cHBvcnRlZExhbmd1YWdlcygpe3JldHVybiBuZXcgU2V0KHRoaXMuTEFOX1RPX0NPREUua2V5cygpKX1kZXRlY3QoZSl7Y29uc3QgdD1hc3luYygpPT57Y29uc3Qgcz1hd2FpdCBwLmdldCh0aGlzLmdlbmVyYXRlRGV0ZWN0VVJMKGUpLHt2YWxpZGF0ZVN0YXR1czphPT5hPDUwMH0pO2lmKHMuc3RhdHVzPT09MjAwKXJldHVybiB0aGlzLnBhcnNlRGV0ZWN0UmVzdWx0KHMuZGF0YSk7aWYocy5zdGF0dXM9PT00MjkmJiF0aGlzLmZhbGxCYWNraW5nKXJldHVybiB0aGlzLmZhbGxCYWNrKCksYXdhaXQgdGhpcy51cGRhdGVUS0soKS50aGVuKHQpO3Rocm93e2Vycm9yVHlwZTpcIkFQSV9FUlJcIixlcnJvckNvZGU6cy5zdGF0dXMsZXJyb3JNc2c6XCJEZXRlY3QgZmFpbGVkLlwiLGVycm9yQWN0OnthcGk6XCJnb29nbGVcIixhY3Rpb246XCJkZXRlY3RcIix0ZXh0OmUsZnJvbTpudWxsLHRvOm51bGx9fX07cmV0dXJuIHQoKX10cmFuc2xhdGUoZSx0LHMpe2NvbnN0IGE9YXN5bmMoKT0+e2NvbnN0IG49YXdhaXQgcC5nZXQodGhpcy5nZW5lcmF0ZVRyYW5zbGF0ZVVSTChlLHQscykse3ZhbGlkYXRlU3RhdHVzOm89Pm88NTAwfSk7aWYobi5zdGF0dXM9PT0yMDApcmV0dXJuIHRoaXMucGFyc2VUcmFuc2xhdGVSZXN1bHQobi5kYXRhKTtpZihuLnN0YXR1cz09PTQyOSYmIXRoaXMuZmFsbEJhY2tpbmcpcmV0dXJuIHRoaXMuZmFsbEJhY2soKSxhd2FpdCB0aGlzLnVwZGF0ZVRLSygpLnRoZW4oYSk7dGhyb3d7ZXJyb3JUeXBlOlwiQVBJX0VSUlwiLGVycm9yQ29kZTpuLnN0YXR1cyxlcnJvck1zZzpcIlRyYW5zbGF0ZSBmYWlsZWQuXCIsZXJyb3JBY3Q6e2FwaTpcImdvb2dsZVwiLGFjdGlvbjpcInRyYW5zbGF0ZVwiLHRleHQ6ZSxmcm9tOnQsdG86c319fTtyZXR1cm4gYSgpfWFzeW5jIHByb25vdW5jZShlLHQscyl7dGhpcy5zdG9wUHJvbm91bmNlKCk7bGV0IGE9cz09PVwiZmFzdFwiP1wiMC44XCI6XCIwLjJcIjt0aGlzLkFVRElPLnNyYz1gJHt0aGlzLmZhbGxCYWNraW5nP3RoaXMuRkFMTEJBQ0tfVFRTX1VSTDp0aGlzLlRUU19VUkx9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoZSl9JnRsPSR7dGhpcy5MQU5fVE9fQ09ERS5nZXQodCl9JnR0c3NwZWVkPSR7YX0mdGs9JHt0aGlzLmdlbmVyYXRlVEsoZSx0aGlzLlRLS1swXSx0aGlzLlRLS1sxXSl9YDt0cnl7YXdhaXQgdGhpcy5BVURJTy5wbGF5KCl9Y2F0Y2gobil7dGhyb3d7ZXJyb3JUeXBlOlwiTkVUX0VSUlwiLGVycm9yQ29kZTowLGVycm9yTXNnOm4ubWVzc2FnZSxlcnJvckFjdDp7YXBpOlwiZ29vZ2xlXCIsYWN0aW9uOlwicHJvbm91bmNlXCIsdGV4dDplLGZyb206dCx0bzpudWxsfX19fXN0b3BQcm9ub3VuY2UoKXt0aGlzLkFVRElPLnBhdXNlZHx8dGhpcy5BVURJTy5wYXVzZSgpfX1jb25zdCBDPVtbXCJhdXRvXCIsXCJhdXRvXCJdLFtcImJnXCIsXCJiZ1wiXSxbXCJldFwiLFwiZXRcIl0sW1wicGxcIixcInBsXCJdLFtcImRhXCIsXCJkYVwiXSxbXCJkZVwiLFwiZGVcIl0sW1wicnVcIixcInJ1XCJdLFtcImZyXCIsXCJmclwiXSxbXCJmaVwiLFwiZmlcIl0sW1wibmxcIixcIm5sXCJdLFtcInpoLUNOXCIsXCJ6aFwiXSxbXCJjc1wiLFwiY3NcIl0sW1wibHZcIixcImx2XCJdLFtcImx0XCIsXCJsdFwiXSxbXCJyb1wiLFwicm9cIl0sW1wicHRcIixcInB0XCJdLFtcImphXCIsXCJqYVwiXSxbXCJzdlwiLFwic3ZcIl0sW1wic2tcIixcInNrXCJdLFtcInNsXCIsXCJzbFwiXSxbXCJlc1wiLFwiZXNcIl0sW1wiZWxcIixcImVsXCJdLFtcImh1XCIsXCJodVwiXSxbXCJpdFwiLFwiaXRcIl0sW1wiZW5cIixcImVuXCJdXTtjbGFzcyBJe2NvbnN0cnVjdG9yKGUsdCl7aSh0aGlzLFwiSE9NRV9QQUdFXCIsXCJodHRwczovL3d3dy5kZWVwbC5jb20vdHJhbnNsYXRvclwiKTtpKHRoaXMsXCJMQU5fVE9fQ09ERVwiLG5ldyBNYXAoQykpO2kodGhpcyxcIkNPREVfVE9fTEFOXCIsbmV3IE1hcChDLm1hcCgoW2UsdF0pPT5bdCxlXSkpKTtpKHRoaXMsXCJsYW5nRGV0ZWN0b3JcIik7aSh0aGlzLFwiVFRTRW5naW5lXCIpO2kodGhpcyxcImRlZXBMSWZyYW1lXCIpO3RoaXMubGFuZ0RldGVjdG9yPWUsdGhpcy5UVFNFbmdpbmU9dCx0aGlzLmNyZWF0ZUlmcmFtZSgpfWNyZWF0ZUlmcmFtZSgpe3RoaXMuZGVlcExJZnJhbWU9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKSxkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuZGVlcExJZnJhbWUpLHRoaXMuZGVlcExJZnJhbWUuc3JjPXRoaXMuSE9NRV9QQUdFfXN1cHBvcnRlZExhbmd1YWdlcygpe3JldHVybiBuZXcgU2V0KHRoaXMuTEFOX1RPX0NPREUua2V5cygpKX1hc3luYyBkZXRlY3QoZSl7cmV0dXJuIGF3YWl0IHRoaXMubGFuZ0RldGVjdG9yLmRldGVjdChlKX1hc3luYyB0cmFuc2xhdGUoZSx0LHMpe3RyeXtyZXR1cm57bWFpbk1lYW5pbmc6YXdhaXQgbmV3IFByb21pc2UoKGEsbik9Pntjb25zdCBvPXNldFRpbWVvdXQoKCk9PntuKHtzdGF0dXM6NDA4LGVycm9yTXNnOlwiUmVxdWVzdCB0aW1lb3V0IVwifSl9LDFlNCkscj1sPT57IWwuZGF0YS50eXBlfHxsLmRhdGEudHlwZSE9PVwiZWRnZV90cmFuc2xhdGVfZGVlcGxfcmVzcG9uc2VcInx8KHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLHIpLGNsZWFyVGltZW91dChvKSxsLmRhdGEuc3RhdHVzPT09MjAwP2EobC5kYXRhLnJlc3VsdCk6bihsLmRhdGEpKX07d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsciksdGhpcy5kZWVwTElmcmFtZS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKHt0eXBlOlwiZWRnZV90cmFuc2xhdGVfZGVlcGxfcmVxdWVzdFwiLHVybDpgJHt0aGlzLkhPTUVfUEFHRX0jJHt0aGlzLkxBTl9UT19DT0RFLmdldCh0KX0vJHt0aGlzLkxBTl9UT19DT0RFLmdldChzKX0vJHtlbmNvZGVVUklDb21wb25lbnQoZS5yZXBsYWNlQWxsKFwiL1wiLFwiXFxcXC9cIikpfWB9LHRoaXMuSE9NRV9QQUdFKX0pLG9yaWdpbmFsVGV4dDplfX1jYXRjaChhKXt0aHJvdyBhLnN0YXR1cz09PTQwOCYmKGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGhpcy5kZWVwTElmcmFtZSksdGhpcy5jcmVhdGVJZnJhbWUoKSksYS5lcnJvckNvZGU9YS5zdGF0dXN8fDAsYS5lcnJvck1zZz1hLmVycm9yTXNnfHxhLm1lc3NhZ2UsYS5lcnJvckFjdD17YXBpOlwiZGVlcGxcIixhY3Rpb246XCJ0cmFuc2xhdGVcIix0ZXh0OmUsZnJvbTp0LHRvOnN9LGF9fWFzeW5jIHByb25vdW5jZShlLHQscyl7cmV0dXJuIGF3YWl0IHRoaXMuVFRTRW5naW5lLnByb25vdW5jZShlLHQscyl9c3RvcFByb25vdW5jZSgpe3RoaXMuVFRTRW5naW5lLnN0b3BQcm9ub3VuY2UoKX19Y2xhc3MgUHtjb25zdHJ1Y3RvcihlLHQpe2kodGhpcyxcImNoYW5uZWxcIik7aSh0aGlzLFwiQ09ORklHXCIse3NlbGVjdGlvbnM6e30sdHJhbnNsYXRvcnM6W119KTtpKHRoaXMsXCJSRUFMX1RSQU5TTEFUT1JTXCIpO2kodGhpcyxcIk1BSU5fVFJBTlNMQVRPUlwiLFwiR29vZ2xlVHJhbnNsYXRlXCIpO2lmKHRoaXMuY2hhbm5lbD10LHRoaXMuUkVBTF9UUkFOU0xBVE9SUz17QmluZ1RyYW5zbGF0ZTpuZXcgTyxHb29nbGVUcmFuc2xhdGU6bmV3IHcsRGVlcExUcmFuc2xhdGU6bnVsbH0sISgoKT0+e2lmKHR5cGVvZiBuYXZpZ2F0b3I+XCJ1XCJ8fCFuYXZpZ2F0b3IudXNlckFnZW50KXJldHVybiExO2NvbnN0IHM9bmF2aWdhdG9yLnVzZXJBZ2VudDtyZXR1cm4vU2FmYXJpXFwvLy50ZXN0KHMpJiYhL0Nocm9tZVxcLy8udGVzdChzKSYmIS9DaHJvbWl1bVxcLy8udGVzdChzKSYmIS9FZGdcXC8vLnRlc3Qocyl9KSgpKXRoaXMuUkVBTF9UUkFOU0xBVE9SUy5EZWVwTFRyYW5zbGF0ZT1uZXcgSSh0aGlzLlJFQUxfVFJBTlNMQVRPUlMuQmluZ1RyYW5zbGF0ZSx0aGlzLlJFQUxfVFJBTlNMQVRPUlMuQmluZ1RyYW5zbGF0ZSk7ZWxzZXtjb25zdCBzPXRoaXMuUkVBTF9UUkFOU0xBVE9SUy5Hb29nbGVUcmFuc2xhdGUsYT10aGlzLlJFQUxfVFJBTlNMQVRPUlMuQmluZ1RyYW5zbGF0ZTt0aGlzLlJFQUxfVFJBTlNMQVRPUlMuRGVlcExUcmFuc2xhdGU9e3N1cHBvcnRlZExhbmd1YWdlczooKT0+bmV3IFNldCxkZXRlY3Q6YXN5bmMgbj0+cy5kZXRlY3QobiksdHJhbnNsYXRlOmFzeW5jKG4sbyxyKT0+cy50cmFuc2xhdGUobixvLHIpLHByb25vdW5jZTphc3luYyhuLG8scik9PmEucHJvbm91bmNlKG4sbyxyKSxzdG9wUHJvbm91bmNlOigpPT5hLnN0b3BQcm9ub3VuY2UoKX19dGhpcy51c2VDb25maWcoZSl9dXNlQ29uZmlnKGUpe2lmKCFlfHwhZS50cmFuc2xhdG9yc3x8IWUuc2VsZWN0aW9ucyl7Y29uc29sZS5lcnJvcihcIkludmFsaWQgY29uZmlnIGZvciBIeWJyaWRUcmFuc2xhdG9yIVwiKTtyZXR1cm59dGhpcy5DT05GSUc9ZSx0aGlzLk1BSU5fVFJBTlNMQVRPUj1lLnNlbGVjdGlvbnMubWFpbk1lYW5pbmd9Z2V0QXZhaWxhYmxlVHJhbnNsYXRvcnNGb3IoZSx0KXtjb25zdCBzPVtdO2Zvcihjb25zdCBhIG9mIE9iamVjdC5rZXlzKHRoaXMuUkVBTF9UUkFOU0xBVE9SUykpe2NvbnN0IG49dGhpcy5SRUFMX1RSQU5TTEFUT1JTW2FdLnN1cHBvcnRlZExhbmd1YWdlcygpO24uaGFzKGUpJiZuLmhhcyh0KSYmcy5wdXNoKGEpfXJldHVybiBzLnNvcnQoKGEsbik9PmE9PT1cIkdvb2dsZVRyYW5zbGF0ZVwiPy0xOm49PT1cIkdvb2dsZVRyYW5zbGF0ZVwiPzE6YS5sb2NhbGVDb21wYXJlKG4pKX11cGRhdGVDb25maWdGb3IoZSx0KXtjb25zdCBzPXt0cmFuc2xhdG9yczpbXSxzZWxlY3Rpb25zOnt9fSxhPW5ldyBTZXQsbj10aGlzLmdldEF2YWlsYWJsZVRyYW5zbGF0b3JzRm9yKGUsdCksbz1uWzBdLHI9bmV3IFNldChuKTtsZXQgbDtmb3IobCBpbiB0aGlzLkNPTkZJRy5zZWxlY3Rpb25zKXtsZXQgdSxUPXRoaXMuQ09ORklHLnNlbGVjdGlvbnNbbF07ci5oYXMoVCk/KHMuc2VsZWN0aW9uc1tsXT1ULHU9VCk6KHMuc2VsZWN0aW9uc1tsXT1vLHU9byksYS5hZGQodSl9cmV0dXJuIHMudHJhbnNsYXRvcnM9QXJyYXkuZnJvbShhKSxzfWFzeW5jIGRldGVjdChlKXtyZXR1cm4gdGhpcy5SRUFMX1RSQU5TTEFUT1JTW3RoaXMuTUFJTl9UUkFOU0xBVE9SXS5kZXRlY3QoZSl9YXN5bmMgdHJhbnNsYXRlKGUsdCxzKXtsZXQgYT1bXTtmb3IobGV0IGwgb2YgdGhpcy5DT05GSUcudHJhbnNsYXRvcnMpYS5wdXNoKHRoaXMuUkVBTF9UUkFOU0xBVE9SU1tsXS50cmFuc2xhdGUoZSx0LHMpLnRoZW4odT0+W2wsdV0pKTtjb25zdCBuPXtvcmlnaW5hbFRleHQ6XCJcIixtYWluTWVhbmluZzpcIlwifSxvPW5ldyBNYXAoYXdhaXQgUHJvbWlzZS5hbGwoYSkpO2xldCByO2ZvcihyIGluIHRoaXMuQ09ORklHLnNlbGVjdGlvbnMpdHJ5e2NvbnN0IGw9dGhpcy5DT05GSUcuc2VsZWN0aW9uc1tyXTtuW3JdPW8uZ2V0KGwpW3JdfWNhdGNoKGwpe2NvbnNvbGUubG9nKGAke3J9ICR7dGhpcy5DT05GSUcuc2VsZWN0aW9uc1tyXX1gKSxjb25zb2xlLmxvZyhsKX1yZXR1cm4gbn1hc3luYyBwcm9ub3VuY2UoZSx0LHMpe3JldHVybiB0aGlzLlJFQUxfVFJBTlNMQVRPUlNbdGhpcy5NQUlOX1RSQU5TTEFUT1JdLnByb25vdW5jZShlLHQscyl9YXN5bmMgc3RvcFByb25vdW5jZSgpe3RoaXMuUkVBTF9UUkFOU0xBVE9SU1t0aGlzLk1BSU5fVFJBTlNMQVRPUl0uc3RvcFByb25vdW5jZSgpfX1jb25zdCAkPXtlbjpcIkVuZ2xpc2hcIixcInpoLUNOXCI6XCJDaGluZXNlU2ltcGxpZmllZFwiLFwiemgtVFdcIjpcIkNoaW5lc2VUcmFkaXRpb25hbFwiLGZyOlwiRnJlbmNoXCIsZXM6XCJTcGFuaXNoXCIscnU6XCJSdXNzaWFuXCIsYXI6XCJBcmFiaWNcIixkZTpcIkdlcm1hblwiLGphOlwiSmFwYW5lc2VcIixwdDpcIlBvcnR1Z3Vlc2VcIixoaTpcIkhpbmRpXCIsdXI6XCJVcmR1XCIsa286XCJLb3JlYW5cIixhY2g6XCJBY2hpbmVzZVwiLGFmOlwiQWZyaWthYW5zXCIsYWthOlwiQWthblwiLHNxOlwiQWxiYW5pYW5cIixhbTpcIkFtaGFyaWNcIixhcmc6XCJBcmFnb25lc2VcIixoeTpcIkFybWVuaWFuXCIsYXNtOlwiQXNzYW1lc2VcIixhc3Q6XCJBc3R1cmlhblwiLGF5bTpcIkF5bWFyYVwiLGF6OlwiQXplcmJhaWphbmlcIixiYWw6XCJCYWx1Y2hpXCIsc3VuOlwiQmFzYVN1bmRhXCIsYmFrOlwiQmFzaGtpclwiLGV1OlwiQmFzcXVlXCIsYmU6XCJCZWxhcnVzaWFuXCIsYmVtOlwiQmVtYmFcIixibjpcIkJlbmdhbGlcIixiZXI6XCJCZXJiZXJsYW5ndWFnZXNcIixiaG86XCJCaG9qcHVyaVwiLGJpczpcIkJpc2xhbWFcIixibGk6XCJCbGluXCIsbm9iOlwiQm9rbWFsXCIsYnM6XCJCb3NuaWFuXCIsYnJlOlwiQnJldG9uXCIsYmc6XCJCdWxnYXJpYW5cIixidXI6XCJCdXJtZXNlXCIseXVlOlwiQ2FudG9uZXNlXCIsY2E6XCJDYXRhbGFuXCIsY2ViOlwiQ2VidWFub1wiLGNocjpcIkNoZXJva2VlXCIsbnk6XCJDaGljaGV3YVwiLGNodjpcIkNodXZhc2hcIix3eXc6XCJDbGFzc2ljYWxDaGluZXNlXCIsY29yOlwiQ29ybmlzaFwiLGNvOlwiQ29yc2ljYW5cIixjcmU6XCJDcmVla1wiLGNyaTpcIkNyaW1lYW5UYXRhclwiLGhyOlwiQ3JvYXRpYW5cIixjczpcIkN6ZWNoXCIsZGE6XCJEYW5pc2hcIixwcnM6XCJEYXJpXCIsZGl2OlwiRGl2ZWhpXCIsbmw6XCJEdXRjaFwiLGVvOlwiRXNwZXJhbnRvXCIsZXQ6XCJFc3RvbmlhblwiLGZhbzpcIkZhcm9lc2VcIixmajpcIkZpamlcIixmaWw6XCJGaWxpcGlub1wiLGZpOlwiRmlubmlzaFwiLGZ5OlwiRnJpc2lhblwiLGZyaTpcIkZyaXVsaWFuXCIsZnVsOlwiRnVsYW5pXCIsZ2xhOlwiR2FlbGljXCIsZ2w6XCJHYWxpY2lhblwiLGthOlwiR2VvcmdpYW5cIixlbDpcIkdyZWVrXCIsZ3JuOlwiR3VhcmFuaVwiLGd1OlwiR3VqYXJhdGlcIixodDpcIkhhaXRpYW5DcmVvbGVcIixoYWs6XCJIYWtoYUNoaW5cIixoYTpcIkhhdXNhXCIsaGF3OlwiSGF3YWlpYW5cIixoZTpcIkhlYnJld1wiLGhpbDpcIkhpbGlnYXlub25cIixobW46XCJIbW9uZ1wiLGh1OlwiSHVuZ2FyaWFuXCIsaHVwOlwiSHVwYVwiLGlzOlwiSWNlbGFuZGljXCIsaWRvOlwiSWRvXCIsaWc6XCJJZ2JvXCIsaWQ6XCJJbmRvbmVzaWFuXCIsaW5nOlwiSW5ndXNoXCIsaW5hOlwiaW50ZXJsaW5ndWFcIixpa3U6XCJJbnVrdGl0dXRcIixnYTpcIklyaXNoXCIsaXQ6XCJJdGFsaWFuXCIsanc6XCJKYXZhbmVzZVwiLGthYjpcIkthYnlsZVwiLGthbDpcIkthbGFhbGxpc3V0XCIsa246XCJLYW5uYWRhXCIsa2F1OlwiS2FudXJpXCIsa2FzOlwiS2FzaG1pcmlcIixrYWg6XCJLYXNodWJpYW5cIixrazpcIkthemFraFwiLGttOlwiS2htZXJcIixraW46XCJLaW55YXJ3YW5kYVwiLHRsaDpcIktsaW5nb25cIixrb246XCJLb25nb1wiLGtvazpcIktvbmthbmlcIixrdTpcIkt1cmRpc2hcIixrbXI6XCJLdXJkaXNoTm9ydGhlcm5cIixreTpcIkt5cmd5elwiLGxvOlwiTGFvXCIsbGFnOlwiTGF0Z2FsaWFuXCIsbGE6XCJMYXRpblwiLGx2OlwiTGF0dmlhblwiLGxpbTpcIkxpbWJ1cmdpc2hcIixsaW46XCJMaW5nYWxhXCIsbHQ6XCJMaXRodWFuaWFuXCIsbG9qOlwiTG9qYmFuXCIsbHVnOlwiTHVnYW5kYVwiLGxiOlwiTHV4ZW1ib3VyZ2lzaFwiLG1rOlwiTWFjZWRvbmlhblwiLG1haTpcIk1haXRoaWxpXCIsbWc6XCJNYWxhZ2FzeVwiLG1zOlwiTWFsYXlcIixtbDpcIk1hbGF5YWxhbVwiLG10OlwiTWFsdGVzZVwiLGdsdjpcIk1hbnhcIixtaTpcIk1hb3JpXCIsbXI6XCJNYXJhdGhpXCIsbWFoOlwiTWFyc2hhbGxlc2VcIixtYXU6XCJNYXVyaXRpYW5DcmVvbGVcIixmcm06XCJNaWRkbGVGcmVuY2hcIixtbjpcIk1vbmdvbGlhblwiLG1vdDpcIk1vbnRlbmVncmluXCIsbXk6XCJNeWFubWFyXCIsbmVhOlwiTmVhcG9saXRhblwiLG5lOlwiTmVwYWxpXCIsc21lOlwiTm9ydGhlcm5TYW1pXCIscGVkOlwiTm9ydGhlcm5Tb3Rob1wiLG5vOlwiTm9yd2VnaWFuXCIsbm5vOlwiTnlub3Jza1wiLG9jaTpcIk9jY2l0YW5cIixvamk6XCJPamlid2FcIixlbm86XCJPbGRFbmdsaXNoXCIsb3I6XCJPcml5YVwiLG9ybTpcIk9yb21vXCIsb3NzOlwiT3NzZXRpYW5cIixwYW06XCJQYW1wYW5nYVwiLHBhcDpcIlBhcGlhbWVudG9cIixwczpcIlBhc2h0b1wiLGZhOlwiUGVyc2lhblwiLHBsOlwiUG9saXNoXCIscGE6XCJQdW5qYWJpXCIscXVlOlwiUXVlY2h1YVwiLG90cTpcIlF1ZXJldGFyb090dG9taVwiLHJvOlwiUm9tYW5pYW5cIixyb2g6XCJSb21hbnNoXCIscm9tOlwiUm9tYW55XCIscnV5OlwiUnVzeW5cIixzbTpcIlNhbW9hblwiLHNhbjpcIlNhbnNrcml0XCIsc3JkOlwiU2FyZGluaWFuXCIsc2NvOlwiU2NvdHNcIixnZDpcIlNjb3RzR2FlbGljXCIsc3JjOlwiU2VyYkN5cmlsbGljXCIsc3I6XCJTZXJiaWFuXCIsXCJzci1DeXJsXCI6XCJTZXJiaWFuQ3lyaWxsaWNcIixcInNyLUxhdG5cIjpcIlNlcmJpYW5MYXRpblwiLHNlYzpcIlNlcmJvQ3JvYXRpYW5cIixzdDpcIlNlc290aG9cIixzaGE6XCJTaGFuXCIsc246XCJTaG9uYVwiLHNpbDpcIlNpbGVzaWFuXCIsc2Q6XCJTaW5kaGlcIixzaTpcIlNpbmhhbGFcIixzazpcIlNsb3Zha1wiLHNsOlwiU2xvdmVuaWFuXCIsc286XCJTb21hbGlcIixzb2w6XCJTb25naGFpbGFuZ3VhZ2VzXCIsbmJsOlwiU291dGhlcm5OZGViZWxlXCIsc290OlwiU291dGhlcm5Tb3Rob1wiLHN1OlwiU3VuZGFuZXNlXCIsc3c6XCJTd2FoaWxpXCIsc3Y6XCJTd2VkaXNoXCIsc3lyOlwiU3lyaWFjXCIsdGdsOlwiVGFnYWxvZ1wiLHR5OlwiVGFoaXRpXCIsdGc6XCJUYWppa1wiLHRhOlwiVGFtaWxcIix0YXQ6XCJUYXRhclwiLHRlOlwiVGVsdWd1XCIsdGV0OlwiVGV0dW1cIix0aDpcIlRoYWlcIix0aXI6XCJUaWdyaW55YVwiLHRvOlwiVG9uZ2FuXCIsdHNvOlwiVHNvbmdhXCIsdHI6XCJUdXJraXNoXCIsdHVrOlwiVHVya21lblwiLHR3aTpcIlR3aVwiLHVnOlwiVXlnaHVyXCIsdWs6XCJVa3JhaW5pYW5cIix1cHM6XCJVcHBlclNvcmJpYW5cIix1ejpcIlV6YmVrXCIsdmVuOlwiVmVuZGFcIix2aTpcIlZpZXRuYW1lc2VcIix3bG46XCJXYWxsb29uXCIsY3k6XCJXZWxzaFwiLGZyeTpcIldlc3Rlcm5GcmlzaWFuXCIsd29sOlwiV29sb2ZcIix4aDpcIlhob3NhXCIseWk6XCJZaWRkaXNoXCIseW86XCJZb3J1YmFcIix5dWE6XCJZdWthdGFuTWF5YW5cIix6YXo6XCJaYXphXCIsenU6XCJadWx1XCJ9O2V4cG9ydHtPIGFzIEJpbmdUcmFuc2xhdG9yLEkgYXMgRGVlcGxUcmFuc2xhdG9yLHcgYXMgR29vZ2xlVHJhbnNsYXRvcixQIGFzIEh5YnJpZFRyYW5zbGF0b3IsJCBhcyBMQU5HVUFHRVMscCBhcyBheGlvc307XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IFRyYW5zbGF0b3JNYW5hZ2VyLCB0cmFuc2xhdGVQYWdlLCBleGVjdXRlR29vZ2xlU2NyaXB0IH0gZnJvbSBcIi4vbGlicmFyeS90cmFuc2xhdGUuanNcIjtcbmltcG9ydCB7XG4gICAgYWRkVXJsQmxhY2tsaXN0LFxuICAgIGFkZERvbWFpbkJsYWNrbGlzdCxcbiAgICByZW1vdmVVcmxCbGFja2xpc3QsXG4gICAgcmVtb3ZlRG9tYWluQmxhY2tsaXN0LFxuICAgIHVwZGF0ZUJMYWNrTGlzdE1lbnUsXG59IGZyb20gXCIuL2xpYnJhcnkvYmxhY2tsaXN0LmpzXCI7XG5pbXBvcnQgeyBzZW5kSGl0UmVxdWVzdCB9IGZyb20gXCIuL2xpYnJhcnkvYW5hbHl0aWNzLmpzXCI7XG5pbXBvcnQgeyB3cmFwQ29uc29sZUZvckZpbHRlcmluZywgbG9nV2FybiwgbG9nSW5mbyB9IGZyb20gXCJjb21tb24vc2NyaXB0cy9sb2dnZXIuanNcIjtcbmltcG9ydCB7IHByb21pc2VUYWJzIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL3Byb21pc2UuanNcIjtcbmltcG9ydCBDaGFubmVsIGZyb20gXCJjb21tb24vc2NyaXB0cy9jaGFubmVsLmpzXCI7XG4vLyBtYXAgbGFuZ3VhZ2UgYWJicmV2aWF0aW9uIGZyb20gYnJvd3NlciBsYW5ndWFnZXMgdG8gdHJhbnNsYXRpb24gbGFuZ3VhZ2VzXG5pbXBvcnQgeyBCUk9XU0VSX0xBTkdVQUdFU19NQVAgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvbGFuZ3VhZ2VzLmpzXCI7XG5pbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCBzZXREZWZhdWx0U2V0dGluZ3MgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanNcIjtcblxuLyoqXG4gKiBTZXJ2aWNlIFdvcmtlciDsmKTrpZgg7ZWE7YSw66eBIC0g7JWM66Ck7KeEIOyYpOulmCDtjKjthLTrk6TsnYQg7LCo64uoXG4gKi9cbmNvbnN0IEZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TID0gW1xuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkXCIsXG4gICAgXCJVbmFibGUgdG8gZG93bmxvYWQgYWxsIHNwZWNpZmllZCBpbWFnZXNcIixcbiAgICBcIkltYWdlIGxvYWRpbmcgZmFpbGVkXCIsXG4gICAgXCJDYW5ub3QgYWNjZXNzXCIsXG4gICAgXCJiZWZvcmUgaW5pdGlhbGl6YXRpb25cIixcbiAgICBcIkV4dGVuc2lvbiBjb250ZXh0IGludmFsaWRhdGVkXCIsXG4gICAgXCJDYW52YXMgZXJyb3JcIixcbiAgICBcIk5ldHdvcmsgZXJyb3JcIixcbl07XG5cbmZ1bmN0aW9uIHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gRklMVEVSRURfRVJST1JfUEFUVEVSTlMuc29tZShcbiAgICAgICAgKHBhdHRlcm4pID0+XG4gICAgICAgICAgICBtZXNzYWdlLmluY2x1ZGVzKHBhdHRlcm4pIHx8XG4gICAgICAgICAgICAvQ2Fubm90IGFjY2VzcyAnLionIGJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAgICAgL1JlZmVyZW5jZUVycm9yLipiZWZvcmUgaW5pdGlhbGl6YXRpb24vLnRlc3QobWVzc2FnZSkgfHxcbiAgICAgICAgICAgIC9VbmFibGUgdG8gZG93bmxvYWQuKmltYWdlcy8udGVzdChtZXNzYWdlKVxuICAgICk7XG59XG5cbndyYXBDb25zb2xlRm9yRmlsdGVyaW5nKCk7XG5cbi8qKlxuICogQ2hyb21lIFJ1bnRpbWUg7Jik66WYIOyymOumrFxuICovXG50cnkge1xuICAgIGNocm9tZS5ydW50aW1lLm9uU3RhcnR1cD8uYWRkTGlzdGVuZXI/LigoKSA9PiB7XG4gICAgICAgIGxvZ0luZm8oXCJFeHRlbnNpb24gc3RhcnR1cFwiKTtcbiAgICB9KTtcbn0gY2F0Y2gge31cblxuLy8gTm90ZTogb25TdXNwZW5kIGlzIG5vdCBzdXBwb3J0ZWQgaW4gU2FmYXJpOyBpbnRlbnRpb25hbGx5IG5vdCByZWdpc3RlcmluZy5cblxuLyoqXG4gKiBQREYg64K067mE6rKM7J207IWYIOqwgOuhnOyxhOq4sDogY2hyb21lIOq4sOuzuCBQREYg67ew7Ja0IOuMgOyLoCDrgrTsnqUgUERGLmpzIOu3sOyWtOuhnCDsl7TquLBcbiAqIC0gTVYzIHNlcnZpY2Ugd29ya2Vy7JeQ7IScIHdlYk5hdmlnYXRpb24ub25Db21taXR0ZWQg7IKs7JqpXG4gKi9cbnRyeSB7XG4gICAgY2hyb21lLndlYk5hdmlnYXRpb24ub25Db21taXR0ZWQuYWRkTGlzdGVuZXIoYXN5bmMgKGRldGFpbHMpID0+IHtcbiAgICAgICAgLy8gbWFpbl9mcmFtZSDrp4wg7LKY66asLCBjaHJvbWU6Ly8sIGVkZ2U6Ly8g65Ox7J2AIOygnOyZuFxuICAgICAgICBpZiAoZGV0YWlscy5mcmFtZUlkICE9PSAwIHx8ICFkZXRhaWxzLnVybCkgcmV0dXJuO1xuICAgICAgICBjb25zdCB1cmwgPSBkZXRhaWxzLnVybDtcbiAgICAgICAgaWYgKCEvXmh0dHBzPzp8XmZpbGU6fF5mdHA6L2kudGVzdCh1cmwpKSByZXR1cm47XG5cbiAgICAgICAgLy8gUERGIO2MkOuzhDog7ZmV7J6l7J6QIOuYkOuKlCBNSU1FIO2ejO2KuCDtjIzrnbzrr7jthLBcbiAgICAgICAgY29uc3QgaXNQZGYgPSAvXFwucGRmKCR8Wz8jXSkvaS50ZXN0KHVybCk7XG4gICAgICAgIGlmICghaXNQZGYpIHJldHVybjtcblxuICAgICAgICAvLyDtmZXsnqUg67ew7Ja0IFVSTCDqtazshLE6IHdlYi92aWV3ZXIuaHRtbD9maWxlPTxlbmNvZGVkPlxuICAgICAgICAvLyBjcm9zcy1vcmlnaW4g7YyM7J287J2EIHZpZXdlcuqwgCBmZXRjaC0+YmxvYuycvOuhnCDsl7Qg7IiYIOyeiOqyjCBmaWxlIO2MjOudvOuvuO2EsOunjCDsoITri6xcbiAgICAgICAgLy8gUGFzcyBvcmlnaW5hbCBzb3VyY2UgYXMgc291cmNlIHBhcmFtIHRvIGFsbG93IGJsb2IgcmVoeWRyYXRpb24gb24gcmVmcmVzaFxuICAgICAgICBjb25zdCB2aWV3ZXJVcmwgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoXG4gICAgICAgICAgICBgd2ViL3ZpZXdlci5odG1sP2ZpbGU9JHtlbmNvZGVVUklDb21wb25lbnQodXJsKX0mc291cmNlPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHVybCl9YFxuICAgICAgICApO1xuXG4gICAgICAgIC8vIO2DrSDsl4XrjbDsnbTtirjroZwg66as65SU66CJ7IWYICjrk5zrnpjqt7gv66Gc7LusIO2MjOydvCDrk7Eg6riw7YOAIOqyveuhnOuKlCDsp4Dsm5DtlZjsp4Ag7JWK7J2MKVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgY2hyb21lLnRhYnMudXBkYXRlKGRldGFpbHMudGFiSWQsIHsgdXJsOiB2aWV3ZXJVcmwgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGxvZ1dhcm4oXCJQREYgcmVkaXJlY3QgZmFpbGVkXCIsIGUpO1xuICAgICAgICB9XG4gICAgfSk7XG59IGNhdGNoIChlKSB7XG4gICAgbG9nV2FybihcIndlYk5hdmlnYXRpb24gdW5hdmFpbGFibGVcIiwgZSk7XG59XG5cbi8qKlxuICog7KCE7JetIOyXkOufrCDrsI8gUHJvbWlzZSBSZWplY3Rpb24g7ZW465Ok65+sXG4gKi9cbmlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJlcnJvclwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmVycm9yICYmIGV2ZW50LmVycm9yLm1lc3NhZ2UgJiYgc2hvdWxkRmlsdGVyRXJyb3IoZXZlbnQuZXJyb3IubWVzc2FnZSkpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5oYW5kbGVkcmVqZWN0aW9uXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQucmVhc29uKSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICAgICAgICB0eXBlb2YgZXZlbnQucmVhc29uID09PSBcInN0cmluZ1wiXG4gICAgICAgICAgICAgICAgICAgID8gZXZlbnQucmVhc29uXG4gICAgICAgICAgICAgICAgICAgIDogZXZlbnQucmVhc29uLm1lc3NhZ2UgfHwgZXZlbnQucmVhc29uLnRvU3RyaW5nKCkgfHwgXCJcIjtcbiAgICAgICAgICAgIGlmIChzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgICAgIGxvZ1dhcm4oXCLtlYTthLDrp4HrkJwgUHJvbWlzZSByZWplY3Rpb246XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICogU2VydmljZSBXb3JrZXIgRE9NIEFQSSBNb2NraW5nIC0g7Y+s6rSE7KCBIERPTSDsmpTshowg66qo7YK5XG4gKi9cblxuLy8gQmFzZSBNb2NrRWxlbWVudCBjbGFzcyB0aGF0IGFsbCBvdGhlciBtb2NrIGNsYXNzZXMgY2FuIGV4dGVuZFxuY2xhc3MgTW9ja0VsZW1lbnQge1xuICAgIGNvbnN0cnVjdG9yKHRhZ05hbWUgPSBcImRpdlwiKSB7XG4gICAgICAgIHRoaXMudGFnTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdGhpcy5ub2RlTmFtZSA9IHRhZ05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdGhpcy5ub2RlVHlwZSA9IDE7XG4gICAgICAgIHRoaXMuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGVzID0gW107XG4gICAgICAgIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvLyBQcm9wZXJ0aWVzXG4gICAgICAgIHRoaXMudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICB0aGlzLmlubmVySFRNTCA9IFwiXCI7XG4gICAgICAgIHRoaXMub3V0ZXJIVE1MID0gXCJcIjtcbiAgICAgICAgdGhpcy5jbGFzc05hbWUgPSBcIlwiO1xuICAgICAgICB0aGlzLmlkID0gXCJcIjtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlID0gbnVsbDtcbiAgICAgICAgdGhpcy5zdHlsZSA9IHt9O1xuICAgIH1cblxuICAgIC8vIE1ldGhvZHNcbiAgICBzZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5hdHRyaWJ1dGVzLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgZ2V0QXR0cmlidXRlKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5nZXQobmFtZSkgfHwgbnVsbDtcbiAgICB9XG5cbiAgICByZW1vdmVBdHRyaWJ1dGUobmFtZSkge1xuICAgICAgICB0aGlzLmF0dHJpYnV0ZXMuZGVsZXRlKG5hbWUpO1xuICAgIH1cblxuICAgIGFwcGVuZENoaWxkKGNoaWxkKSB7XG4gICAgICAgIGlmIChjaGlsZCAmJiB0eXBlb2YgY2hpbGQgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4ucHVzaChjaGlsZCk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkTm9kZXMucHVzaChjaGlsZCk7XG4gICAgICAgICAgICBjaGlsZC5wYXJlbnROb2RlID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfVxuXG4gICAgcmVtb3ZlQ2hpbGQoY2hpbGQpIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmNoaWxkcmVuLmluZGV4T2YoY2hpbGQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5jaGlsZE5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICBjaGlsZC5wYXJlbnROb2RlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hpbGQ7XG4gICAgfVxuXG4gICAgYWRkRXZlbnRMaXN0ZW5lcigpIHt9XG4gICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcigpIHt9XG4gICAgZGlzcGF0Y2hFdmVudCgpIHt9XG4gICAgY2xpY2soKSB7fVxuICAgIGZvY3VzKCkge31cbiAgICBibHVyKCkge31cbn1cblxuLy8gTWFrZSBNb2NrRWxlbWVudCBhdmFpbGFibGUgZ2xvYmFsbHlcbnNlbGYuTW9ja0VsZW1lbnQgPSBNb2NrRWxlbWVudDtcblxuLy8gQ3JlYXRlIGNvbXByZWhlbnNpdmUgRE9NIGVsZW1lbnQgbW9jayB1c2luZyB0aGUgYmFzZSBjbGFzc1xuZnVuY3Rpb24gY3JlYXRlTW9ja0VsZW1lbnQodGFnTmFtZSA9IFwiZGl2XCIpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gbmV3IE1vY2tFbGVtZW50KHRhZ05hbWUpO1xuXG4gICAgLy8gQWRkIGFkZGl0aW9uYWwgbWV0aG9kcyBhbmQgcHJvcGVydGllc1xuICAgIGVsZW1lbnQucXVlcnlTZWxlY3RvciA9ICgpID0+IG51bGw7XG4gICAgZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsID0gKCkgPT4gW107XG4gICAgZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSA9ICgpID0+IFtdO1xuICAgIGVsZW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSA9ICgpID0+IFtdO1xuICAgIGVsZW1lbnQuZ2V0RWxlbWVudEJ5SWQgPSAoKSA9PiBudWxsO1xuXG4gICAgLy8gU3R5bGUgb2JqZWN0IHdpdGggcHJveHlcbiAgICBlbGVtZW50LnN0eWxlID0gbmV3IFByb3h5KFxuICAgICAgICB7fSxcbiAgICAgICAge1xuICAgICAgICAgICAgZ2V0OiAoKSA9PiBcIlwiLFxuICAgICAgICAgICAgc2V0OiAoKSA9PiB0cnVlLFxuICAgICAgICB9XG4gICAgKTtcblxuICAgIC8vIFNvdXJjZSBwcm9wZXJ0eSBmb3IgaW1hZ2VzIGFuZCBpZnJhbWVzXG4gICAgZWxlbWVudC5fc3JjID0gXCJcIjtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZWxlbWVudCwgXCJzcmNcIiwge1xuICAgICAgICBnZXQoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fc3JjIHx8IFwiXCI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fc3JjID0gdmFsdWU7XG4gICAgICAgICAgICAvLyBTaW11bGF0ZSBsb2FkIGV2ZW50IGZvciBpbWFnZXMgYW5kIGlmcmFtZXNcbiAgICAgICAgICAgIGlmICh0aGlzLnRhZ05hbWUgPT09IFwiSU1HXCIgfHwgdGhpcy50YWdOYW1lID09PSBcIklGUkFNRVwiKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9ubG9hZCkgdGhpcy5vbmxvYWQoeyB0eXBlOiBcImxvYWRcIiwgdGFyZ2V0OiB0aGlzIH0pO1xuICAgICAgICAgICAgICAgIH0sIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEhyZWYgcHJvcGVydHkgZm9yIGxpbmtzXG4gICAgZWxlbWVudC5faHJlZiA9IFwiXCI7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGVsZW1lbnQsIFwiaHJlZlwiLCB7XG4gICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9ocmVmIHx8IFwiXCI7XG4gICAgICAgIH0sXG4gICAgICAgIHNldCh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5faHJlZiA9IHZhbHVlO1xuICAgICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGxvY2F0aW9uIHByb3BlcnR5IGZvciBzcGVjaWFsIGNhc2VzXG4gICAgaWYgKHRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJkb2N1bWVudFwiKSB7XG4gICAgICAgIGVsZW1lbnQubG9jYXRpb24gPSB7XG4gICAgICAgICAgICBvcmlnaW46IFwiY2hyb21lLWV4dGVuc2lvbjovL1wiLFxuICAgICAgICAgICAgcGF0aG5hbWU6IFwiL2JhY2tncm91bmQuanNcIixcbiAgICAgICAgICAgIHNlYXJjaDogXCJcIixcbiAgICAgICAgICAgIGhyZWY6IFwiY2hyb21lLWV4dGVuc2lvbjovL2JhY2tncm91bmQuanNcIixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gZWxlbWVudDtcbn1cblxuLy8gTW9jayBBdWRpbyBmb3IgU2VydmljZSBXb3JrZXIgZW52aXJvbm1lbnRcbmlmICh0eXBlb2YgQXVkaW8gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzZWxmLkF1ZGlvID0gY2xhc3MgTW9ja0F1ZGlvIHtcbiAgICAgICAgY29uc3RydWN0b3Ioc3JjKSB7XG4gICAgICAgICAgICB0aGlzLnNyYyA9IHNyYyB8fCBcIlwiO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50VGltZSA9IDA7XG4gICAgICAgICAgICB0aGlzLmR1cmF0aW9uID0gMDtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZW5kZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMudm9sdW1lID0gMTtcbiAgICAgICAgICAgIHRoaXMubXV0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBwbGF5KCkge1xuICAgICAgICAgICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBwYXVzZSgpIHtcbiAgICAgICAgICAgIHRoaXMucGF1c2VkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBsb2FkKCkge31cbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcigpIHt9XG4gICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoKSB7fVxuICAgIH07XG59XG5cbi8vIE1vY2sgSW1hZ2UgZm9yIFNlcnZpY2UgV29ya2VyIGVudmlyb25tZW50IHdpdGggY29tcHJlaGVuc2l2ZSBlcnJvciBoYW5kbGluZ1xuaWYgKHR5cGVvZiBJbWFnZSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHNlbGYuSW1hZ2UgPSBjbGFzcyBNb2NrSW1hZ2UgZXh0ZW5kcyBFdmVudFRhcmdldCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gd2lkdGggfHwgMDtcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0IHx8IDA7XG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRlID0gdHJ1ZTsgLy8gQWx3YXlzIG1hcmsgYXMgY29tcGxldGVcbiAgICAgICAgICAgIHRoaXMubmF0dXJhbFdpZHRoID0gd2lkdGggfHwgMTAwO1xuICAgICAgICAgICAgdGhpcy5uYXR1cmFsSGVpZ2h0ID0gaGVpZ2h0IHx8IDEwMDtcbiAgICAgICAgICAgIHRoaXMuX3NyYyA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl9vbmxvYWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5fb25lcnJvciA9IG51bGw7XG5cbiAgICAgICAgICAgIC8vIE1vY2sgc3VjY2Vzc2Z1bCBsb2FkaW5nIGZvciBhbGwgaW1hZ2VzXG4gICAgICAgICAgICB0aGlzLmNyb3NzT3JpZ2luID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMubG9hZGluZyA9IFwiYXV0b1wiO1xuICAgICAgICAgICAgdGhpcy5yZWZlcnJlclBvbGljeSA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLmRlY29kZSA9ICgpID0+IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0IHNyYyh2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy5fc3JjID0gdmFsdWU7XG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRlID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEFsd2F5cyBzaW11bGF0ZSBzdWNjZXNzZnVsIGxvYWQgZm9yIGFueSBpbWFnZSBVUkxcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcGxldGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMubmF0dXJhbFdpZHRoID0gdGhpcy53aWR0aCB8fCAxMDA7XG4gICAgICAgICAgICAgICAgdGhpcy5uYXR1cmFsSGVpZ2h0ID0gdGhpcy5oZWlnaHQgfHwgMTAwO1xuXG4gICAgICAgICAgICAgICAgLy8gRGlzcGF0Y2ggbG9hZCBldmVudFxuICAgICAgICAgICAgICAgIGNvbnN0IGxvYWRFdmVudCA9IG5ldyBFdmVudChcImxvYWRcIik7XG4gICAgICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KGxvYWRFdmVudCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fb25sb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29ubG9hZChsb2FkRXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vbmxvYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmxvYWQobG9hZEV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxKTsgLy8gTWluaW1hbCBkZWxheSB0byBzaW11bGF0ZSBhc3luYyBiZWhhdmlvclxuICAgICAgICB9XG5cbiAgICAgICAgZ2V0IHNyYygpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zcmM7XG4gICAgICAgIH1cblxuICAgICAgICBzZXQgb25sb2FkKGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX29ubG9hZCA9IGhhbmRsZXI7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb25sb2FkKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX29ubG9hZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldCBvbmVycm9yKGhhbmRsZXIpIHtcbiAgICAgICAgICAgIHRoaXMuX29uZXJyb3IgPSBoYW5kbGVyO1xuICAgICAgICAgICAgLy8gTmV2ZXIgY2FsbCBlcnJvciBoYW5kbGVyIGluIFNlcnZpY2UgV29ya2VyIGVudmlyb25tZW50XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgb25lcnJvcigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vbmVycm9yO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcikge1xuICAgICAgICAgICAgc3VwZXIuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgICAgIH1cblxuICAgICAgICByZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBzdXBlci5yZW1vdmVFdmVudExpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIE1vY2sgRE9NUGFyc2VyIGZvciBTZXJ2aWNlIFdvcmtlciBlbnZpcm9ubWVudFxuaWYgKHR5cGVvZiBET01QYXJzZXIgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzZWxmLkRPTVBhcnNlciA9IGNsYXNzIE1vY2tET01QYXJzZXIge1xuICAgICAgICBwYXJzZUZyb21TdHJpbmcoc3RyLCBtaW1lVHlwZSA9IFwidGV4dC9odG1sXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGRvYyA9IGNyZWF0ZU1vY2tFbGVtZW50KFwiZG9jdW1lbnRcIik7XG4gICAgICAgICAgICBkb2MuZG9jdW1lbnRFbGVtZW50ID0gY3JlYXRlTW9ja0VsZW1lbnQoXCJodG1sXCIpO1xuICAgICAgICAgICAgZG9jLmhlYWQgPSBjcmVhdGVNb2NrRWxlbWVudChcImhlYWRcIik7XG4gICAgICAgICAgICBkb2MuYm9keSA9IGNyZWF0ZU1vY2tFbGVtZW50KFwiYm9keVwiKTtcblxuICAgICAgICAgICAgLy8gU2V0IHVwIGRvY3VtZW50IHRyZWVcbiAgICAgICAgICAgIGRvYy5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoZG9jLmhlYWQpO1xuICAgICAgICAgICAgZG9jLmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChkb2MuYm9keSk7XG4gICAgICAgICAgICBkb2MuYXBwZW5kQ2hpbGQoZG9jLmRvY3VtZW50RWxlbWVudCk7XG5cbiAgICAgICAgICAgIC8vIEJhc2ljIEhUTUwgcGFyc2luZyBmb3IgY29tbW9uIHBhdHRlcm5zXG4gICAgICAgICAgICBpZiAobWltZVR5cGUgPT09IFwidGV4dC9odG1sXCIgJiYgc3RyLmluY2x1ZGVzKFwicmljaF90dGFcIikpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgbW9jayBlbGVtZW50IGZvciBCaW5nIHRyYW5zbGF0b3JcbiAgICAgICAgICAgICAgICBjb25zdCByaWNoVHRhRWxlbWVudCA9IGNyZWF0ZU1vY2tFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgICAgICAgICAgIHJpY2hUdGFFbGVtZW50LmlkID0gXCJyaWNoX3R0YVwiO1xuICAgICAgICAgICAgICAgIHJpY2hUdGFFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtaWlkXCIsIFwibW9jay1paWQtdmFsdWVcIik7XG4gICAgICAgICAgICAgICAgZG9jLmJvZHkuYXBwZW5kQ2hpbGQocmljaFR0YUVsZW1lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBZGQgYmFzaWMgZ2V0RWxlbWVudEJ5SWQgdGhhdCB3b3JrcyB3aXRoIHBhcnNlZCBjb250ZW50XG4gICAgICAgICAgICBkb2MuZ2V0RWxlbWVudEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiBmaW5kQnlJZChlbGVtZW50LCB0YXJnZXRJZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5pZCA9PT0gdGFyZ2V0SWQpIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY2hpbGQgb2YgZWxlbWVudC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGZvdW5kID0gZmluZEJ5SWQoY2hpbGQsIHRhcmdldElkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbmRCeUlkKHRoaXMsIGlkKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIENvcHkgb3RoZXIgcXVlcnkgbWV0aG9kc1xuICAgICAgICAgICAgZG9jLnF1ZXJ5U2VsZWN0b3IgPSBzZWxmLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3I7XG4gICAgICAgICAgICBkb2MucXVlcnlTZWxlY3RvckFsbCA9IHNlbGYuZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDtcbiAgICAgICAgICAgIGRvYy5jcmVhdGVFbGVtZW50ID0gc2VsZi5kb2N1bWVudC5jcmVhdGVFbGVtZW50O1xuICAgICAgICAgICAgZG9jLmNyZWF0ZVRleHROb2RlID0gc2VsZi5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZTtcblxuICAgICAgICAgICAgcmV0dXJuIGRvYztcbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIE1vY2sgZG9jdW1lbnQgZm9yIFNlcnZpY2UgV29ya2VyIGVudmlyb25tZW50XG5pZiAodHlwZW9mIGRvY3VtZW50ID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgc2VsZi5kb2N1bWVudCA9IGNyZWF0ZU1vY2tFbGVtZW50KFwiZG9jdW1lbnRcIik7XG5cbiAgICAvLyBJbml0aWFsaXplIGRvY3VtZW50IHN0cnVjdHVyZSBwcm9wZXJseVxuICAgIHNlbGYuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50ID0gY3JlYXRlTW9ja0VsZW1lbnQoXCJodG1sXCIpO1xuICAgIHNlbGYuZG9jdW1lbnQuaGVhZCA9IGNyZWF0ZU1vY2tFbGVtZW50KFwiaGVhZFwiKTtcbiAgICBzZWxmLmRvY3VtZW50LmJvZHkgPSBjcmVhdGVNb2NrRWxlbWVudChcImJvZHlcIik7XG5cbiAgICAvLyBTZXQgdXAgcHJvcGVyIGRvY3VtZW50IHRyZWVcbiAgICBzZWxmLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5hcHBlbmRDaGlsZChzZWxmLmRvY3VtZW50LmhlYWQpO1xuICAgIHNlbGYuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHNlbGYuZG9jdW1lbnQuYm9keSk7XG4gICAgc2VsZi5kb2N1bWVudC5hcHBlbmRDaGlsZChzZWxmLmRvY3VtZW50LmRvY3VtZW50RWxlbWVudCk7XG5cbiAgICAvLyBBZGQgZG9jdW1lbnQtc3BlY2lmaWMgbWV0aG9kc1xuICAgIHNlbGYuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uICh0YWdOYW1lKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVNb2NrRWxlbWVudCh0YWdOYW1lKTtcbiAgICB9O1xuXG4gICAgc2VsZi5kb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSA9IGZ1bmN0aW9uICh0ZXh0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBub2RlVHlwZTogMyxcbiAgICAgICAgICAgIG5vZGVOYW1lOiBcIiN0ZXh0XCIsXG4gICAgICAgICAgICB0ZXh0Q29udGVudDogdGV4dCxcbiAgICAgICAgICAgIGRhdGE6IHRleHQsXG4gICAgICAgICAgICBwYXJlbnROb2RlOiBudWxsLFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyBFbmhhbmNlZCBxdWVyeSBtZXRob2RzIHRoYXQgYWN0dWFsbHkgd29ya1xuICAgIHNlbGYuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VhcmNoIHRocm91Z2ggYWxsIGVsZW1lbnRzIGZvciB0aGUgSURcbiAgICAgICAgZnVuY3Rpb24gZmluZEJ5SWQoZWxlbWVudCwgdGFyZ2V0SWQpIHtcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmlkID09PSB0YXJnZXRJZCkgcmV0dXJuIGVsZW1lbnQ7XG4gICAgICAgICAgICBpZiAoZWxlbWVudC5jaGlsZHJlbikge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGNoaWxkIG9mIGVsZW1lbnQuY2hpbGRyZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZm91bmQgPSBmaW5kQnlJZChjaGlsZCwgdGFyZ2V0SWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZm91bmQpIHJldHVybiBmb3VuZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmluZEJ5SWQoc2VsZi5kb2N1bWVudCwgaWQpO1xuICAgIH07XG5cbiAgICBzZWxmLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgLy8gQmFzaWMgc2VsZWN0b3Igc3VwcG9ydCBmb3IgY29tbW9uIGNhc2VzXG4gICAgICAgIGlmIChzZWxlY3Rvci5zdGFydHNXaXRoKFwiI1wiKSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoc2VsZWN0b3Iuc2xpY2UoMSkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIEZvciBvdGhlciBzZWxlY3RvcnMsIHJldHVybiBudWxsIChjYW4gYmUgZXhwYW5kZWQgYXMgbmVlZGVkKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9O1xuXG4gICAgc2VsZi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfTtcbn1cblxuLy8gTW9jayBsb2NhdGlvbiBmb3IgU2VydmljZSBXb3JrZXIgZW52aXJvbm1lbnRcbmlmICh0eXBlb2YgbG9jYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzZWxmLmxvY2F0aW9uID0ge1xuICAgICAgICBvcmlnaW46IFwiY2hyb21lLWV4dGVuc2lvbjovL1wiLFxuICAgICAgICBwYXRobmFtZTogXCIvYmFja2dyb3VuZC5qc1wiLFxuICAgICAgICBzZWFyY2g6IFwiXCIsXG4gICAgICAgIGhyZWY6IFwiY2hyb21lLWV4dGVuc2lvbjovL2JhY2tncm91bmQuanNcIixcbiAgICAgICAgcHJvdG9jb2w6IFwiY2hyb21lLWV4dGVuc2lvbjpcIixcbiAgICAgICAgaG9zdDogXCJcIixcbiAgICAgICAgaG9zdG5hbWU6IFwiXCIsXG4gICAgfTtcbn1cblxuLyoqXG4gKiBTZXJ2aWNlIFdvcmtlciBheGlvcyDsmYTsoIQg64yA7LK0XG4gKiBFUzYg66qo65OIIO2YuOydtOyKpO2MheuztOuLpCDrqLzsoIAg7Iuk7ZaJ65CY64+E66GdIOy1nOyDgeuLqOyXkCDrsLDsuZhcbiAqL1xuaWYgKHR5cGVvZiBpbXBvcnRTY3JpcHRzID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIC8vIFNlcnZpY2UgV29ya2VyIO2ZmOqyvSDqsJDsp4AgLSBheGlvcyDsmYTsoIQg64yA7LK0XG5cbiAgICAvLyBheGlvcyDrqqjrk4gg7LCo64uoICjtjKjtgqTsp4Dsl5DshJwg7J6E7Y+s7Yq465CY6riwIOyghOyXkClcbiAgICBjb25zdCBvcmlnaW5hbERlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGlmIChhcmdzWzFdID09PSBcImF4aW9zXCIgJiYgYXJnc1swXSA9PT0gc2VsZikge1xuICAgICAgICAgICAgLy8gYXhpb3Mg7ISk7KCV7J2EIFNlcnZpY2UgV29ya2VyIOuyhOyghOycvOuhnCDrjIDssrRcbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbERlZmluZVByb3BlcnR5LmNhbGwodGhpcywgLi4uYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsRGVmaW5lUHJvcGVydHkuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcblxuICAgIGNvbnNvbGUubG9nKFwiW0VkZ2VUcmFuc2xhdGVdIFNlcnZpY2UgV29ya2VyIO2ZmOqyvSDshKTsoJUg7JmE66OMIC0gdHJhbnNsYXRvcnMg7Yyo7YKk7KeAIO2YuO2ZmOyEsSDtmZXrs7RcIik7XG59XG5cbi8vIFhNTEh0dHBSZXF1ZXN0IGlzIG5vdCBhdmFpbGFibGUgaW4gU2VydmljZSBXb3JrZXJzLCBzbyB3ZSBuZWVkIHRvIG1vY2sgaXQgd2l0aCBmZXRjaFxuaWYgKHR5cGVvZiBYTUxIdHRwUmVxdWVzdCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHNlbGYuWE1MSHR0cFJlcXVlc3QgPSBjbGFzcyBNb2NrWE1MSHR0cFJlcXVlc3QgZXh0ZW5kcyBFdmVudFRhcmdldCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IDA7IC8vIFVOU0VOVFxuICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSAwO1xuICAgICAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2VUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgIHRoaXMucmVzcG9uc2UgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy5yZXNwb25zZVR5cGUgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy50aW1lb3V0ID0gMDtcbiAgICAgICAgICAgIHRoaXMud2l0aENyZWRlbnRpYWxzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIC8vIEV2ZW50IGhhbmRsZXJzXG4gICAgICAgICAgICB0aGlzLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm9ubG9hZCA9IG51bGw7XG4gICAgICAgICAgICB0aGlzLm9uZXJyb3IgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5vbmFib3J0ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMub250aW1lb3V0ID0gbnVsbDtcblxuICAgICAgICAgICAgLy8gSW50ZXJuYWwgc3RhdGVcbiAgICAgICAgICAgIHRoaXMuX21ldGhvZCA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLl91cmwgPSBcIlwiO1xuICAgICAgICAgICAgdGhpcy5fYXN5bmMgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5fcmVxdWVzdEhlYWRlcnMgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX2Fib3J0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENvbnN0YW50c1xuICAgICAgICBzdGF0aWMgZ2V0IFVOU0VOVCgpIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgICAgIHN0YXRpYyBnZXQgT1BFTkVEKCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGdldCBIRUFERVJTX1JFQ0VJVkVEKCkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGdldCBMT0FESU5HKCkge1xuICAgICAgICAgICAgcmV0dXJuIDM7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGljIGdldCBET05FKCkge1xuICAgICAgICAgICAgcmV0dXJuIDQ7XG4gICAgICAgIH1cblxuICAgICAgICBnZXQgVU5TRU5UKCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IE9QRU5FRCgpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9XG4gICAgICAgIGdldCBIRUFERVJTX1JFQ0VJVkVEKCkge1xuICAgICAgICAgICAgcmV0dXJuIDI7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0IExPQURJTkcoKSB7XG4gICAgICAgICAgICByZXR1cm4gMztcbiAgICAgICAgfVxuICAgICAgICBnZXQgRE9ORSgpIHtcbiAgICAgICAgICAgIHJldHVybiA0O1xuICAgICAgICB9XG5cbiAgICAgICAgb3BlbihtZXRob2QsIHVybCwgYXN5bmMgPSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9tZXRob2QgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHRoaXMuX3VybCA9IHVybDtcbiAgICAgICAgICAgIHRoaXMuX2FzeW5jID0gYXN5bmM7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSAxOyAvLyBPUEVORURcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVSZWFkeVN0YXRlQ2hhbmdlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRSZXF1ZXN0SGVhZGVyKGhlYWRlciwgdmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkU3RhdGVFcnJvclwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3JlcXVlc3RIZWFkZXJzW2hlYWRlcl0gPSB2YWx1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbmQoZGF0YSA9IG51bGwpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgIT09IDEpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkU3RhdGVFcnJvclwiKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX2Fib3J0ZWQpIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3QgZmV0Y2hPcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIG1ldGhvZDogdGhpcy5fbWV0aG9kLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHRoaXMuX3JlcXVlc3RIZWFkZXJzLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKGRhdGEgJiYgdGhpcy5fbWV0aG9kICE9PSBcIkdFVFwiICYmIHRoaXMuX21ldGhvZCAhPT0gXCJIRUFEXCIpIHtcbiAgICAgICAgICAgICAgICBmZXRjaE9wdGlvbnMuYm9keSA9IGRhdGE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldCB0aW1lb3V0IGlmIHNwZWNpZmllZFxuICAgICAgICAgICAgY29uc3QgY29udHJvbGxlciA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgICAgICAgICAgIGZldGNoT3B0aW9ucy5zaWduYWwgPSBjb250cm9sbGVyLnNpZ25hbDtcblxuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dCA+IDApIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLl9hYm9ydGVkICYmIHRoaXMucmVhZHlTdGF0ZSAhPT0gNCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5hYm9ydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgdGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gMjsgLy8gSEVBREVSU19SRUNFSVZFRFxuICAgICAgICAgICAgdGhpcy5fZmlyZVJlYWR5U3RhdGVDaGFuZ2UoKTtcblxuICAgICAgICAgICAgZmV0Y2godGhpcy5fdXJsLCBmZXRjaE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLl9hYm9ydGVkKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSByZXNwb25zZS5zdGF0dXM7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzVGV4dCA9IHJlc3BvbnNlLnN0YXR1c1RleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IDM7IC8vIExPQURJTkdcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZmlyZVJlYWR5U3RhdGVDaGFuZ2UoKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UudGV4dCgpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oKHJlc3BvbnNlVGV4dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYWJvcnRlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2VUZXh0ID0gcmVzcG9uc2VUZXh0IHx8IFwiXCI7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVzcG9uc2UgPVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXNwb25zZVR5cGUgPT09IFwianNvblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyB0aGlzLl90cnlQYXJzZUpTT04ocmVzcG9uc2VUZXh0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogcmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSA0OyAvLyBET05FXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpcmVSZWFkeVN0YXRlQ2hhbmdlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25sb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9ubG9hZChuZXcgRXZlbnQoXCJsb2FkXCIpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fYWJvcnRlZCkgcmV0dXJuO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5uYW1lID09PSBcIkFib3J0RXJyb3JcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5faGFuZGxlVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJcIjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IDQ7IC8vIERPTkVcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2ZpcmVSZWFkeVN0YXRlQ2hhbmdlKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uZXJyb3IobmV3IEV2ZW50KFwiZXJyb3JcIikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBhYm9ydCgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Fib3J0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gNDsgLy8gRE9ORVxuICAgICAgICAgICAgdGhpcy5fZmlyZVJlYWR5U3RhdGVDaGFuZ2UoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMub25hYm9ydCkge1xuICAgICAgICAgICAgICAgIHRoaXMub25hYm9ydChuZXcgRXZlbnQoXCJhYm9ydFwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBnZXRSZXNwb25zZUhlYWRlcigpIHtcbiAgICAgICAgICAgIC8vIEluIGEgcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2UnZCBzdG9yZSByZXNwb25zZSBoZWFkZXJzXG4gICAgICAgICAgICAvLyBGb3Igbm93LCByZXR1cm4gbnVsbCBmb3Igc2ltcGxpY2l0eVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBnZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIF9maXJlUmVhZHlTdGF0ZUNoYW5nZSgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9ucmVhZHlzdGF0ZWNoYW5nZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub25yZWFkeXN0YXRlY2hhbmdlKG5ldyBFdmVudChcInJlYWR5c3RhdGVjaGFuZ2VcIikpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVhZHlzdGF0ZWNoYW5nZVwiKSk7XG4gICAgICAgIH1cblxuICAgICAgICBfaGFuZGxlVGltZW91dCgpIHtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzVGV4dCA9IFwiXCI7XG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSA0OyAvLyBET05FXG4gICAgICAgICAgICB0aGlzLl9maXJlUmVhZHlTdGF0ZUNoYW5nZSgpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5vbnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9udGltZW91dChuZXcgRXZlbnQoXCJ0aW1lb3V0XCIpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIF90cnlQYXJzZUpTT04odGV4dCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGV4dDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59XG5cbi8vIEVuc3VyZSBjb25zb2xlIGlzIGF2YWlsYWJsZSAoaXQgc2hvdWxkIGJlIGluIFNlcnZpY2UgV29ya2VycywgYnV0IGxldCdzIGJlIHNhZmUpXG5pZiAodHlwZW9mIGNvbnNvbGUgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzZWxmLmNvbnNvbGUgPSB7XG4gICAgICAgIGxvZzogKCkgPT4ge30sXG4gICAgICAgIHdhcm46ICgpID0+IHt9LFxuICAgICAgICBlcnJvcjogKCkgPT4ge30sXG4gICAgICAgIGluZm86ICgpID0+IHt9LFxuICAgICAgICBkZWJ1ZzogKCkgPT4ge30sXG4gICAgICAgIHRyYWNlOiAoKSA9PiB7fSxcbiAgICB9O1xufVxuXG4vLyBNb2NrIHdpbmRvdy1zcGVjaWZpYyBnbG9iYWxzIHRoYXQgbWlnaHQgYmUgcmVmZXJlbmNlZFxuaWYgKHR5cGVvZiBuYXZpZ2F0b3IgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBzZWxmLm5hdmlnYXRvciA9IHtcbiAgICAgICAgbGFuZ3VhZ2U6IFwiZW4tVVNcIixcbiAgICAgICAgbGFuZ3VhZ2VzOiBbXCJlbi1VU1wiLCBcImVuXCJdLFxuICAgICAgICB1c2VyQWdlbnQ6IFwiTW96aWxsYS81LjAgKFNlcnZpY2VXb3JrZXIpXCIsXG4gICAgICAgIHBsYXRmb3JtOiBcImNocm9tZS1leHRlbnNpb25cIixcbiAgICB9O1xufVxuXG4vLyBEb24ndCBtb2NrIGZldGNoIGF0IGFsbCAtIGxldCBhbGwgcmVxdWVzdHMgZ28gdGhyb3VnaCBub3JtYWxseVxuLy8gVGhlIFwiVW5hYmxlIHRvIGRvd25sb2FkIGFsbCBzcGVjaWZpZWQgaW1hZ2VzXCIgZXJyb3Igd2FzIGxpa2VseSBjYXVzZWQgYnkgRE9NIGlzc3Vlcywgbm90IGZldGNoIGlzc3Vlc1xuLy8gd2hpY2ggd2UndmUgYWxyZWFkeSBmaXhlZCB3aXRoIHRoZSBjb21wcmVoZW5zaXZlIERPTSBtb2NraW5nIGFib3ZlXG5cbi8vIE1vY2sgVVJMLmNyZWF0ZU9iamVjdFVSTCBmb3IgYmxvYiBoYW5kbGluZ1xuaWYgKHR5cGVvZiBVUkwgIT09IFwidW5kZWZpbmVkXCIgJiYgIVVSTC5jcmVhdGVPYmplY3RVUkwpIHtcbiAgICBVUkwuY3JlYXRlT2JqZWN0VVJMID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gYGJsb2I6Y2hyb21lLWV4dGVuc2lvbjovL21vY2stJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgOSl9YDtcbiAgICB9O1xuXG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gTW9jayByZXZva2UgLSBkbyBub3RoaW5nXG4gICAgfTtcbn1cblxuLyoqXG4gKiBTZXR1cCBjb250ZXh0IG1lbnVzIC0gbW92ZWQgaW5zaWRlIG9uSW5zdGFsbGVkIHRvIHdvcmsgd2l0aCBzZXJ2aWNlIHdvcmtlclxuICovXG5sZXQgY29udGV4dE1lbnVzSW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gc2V0dXBDb250ZXh0TWVudXMoKSB7XG4gICAgaWYgKGNvbnRleHRNZW51c0luaXRpYWxpemVkKSByZXR1cm47XG4gICAgLy8gQ2xlYXIgZXhpc3RpbmcgbWVudXMgZmlyc3QgdG8gYXZvaWQgZHVwbGljYXRlIGlkIGVycm9ycyBvbiBTVyByZXN0YXJ0L3JlbG9hZFxuICAgIGNvbnN0IGNyZWF0ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgY29uc3QgaXNTYWZhcmkgPSBCUk9XU0VSX0VOViA9PT0gXCJzYWZhcmlcIjtcbiAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgICAgICAgICAgaWQ6IFwidHJhbnNsYXRlXCIsXG4gICAgICAgICAgICB0aXRsZTogYCR7Y2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcIlRyYW5zbGF0ZVwiKX0gJyVzJ2AsXG4gICAgICAgICAgICBjb250ZXh0czogW1wic2VsZWN0aW9uXCJdLFxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBBZGQgYW4gZW50cnkgdG8gb3B0aW9ucyBwYWdlIGZvciBGaXJlZm94IGFzIGl0IGRvZXNuJ3QgaGF2ZSBvbmUuXG4gICAgICAgIGlmIChCUk9XU0VSX0VOViA9PT0gXCJmaXJlZm94XCIpIHtcbiAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICBpZDogXCJzZXR0aW5nc1wiLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiU2V0dGluZ3NcIiksXG4gICAgICAgICAgICAgICAgY29udGV4dHM6IFtcImFjdGlvblwiXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgICAgICAgICAgaWQ6IFwic2hvcnRjdXRcIixcbiAgICAgICAgICAgIHRpdGxlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiU2hvcnRjdXRTZXR0aW5nXCIpLFxuICAgICAgICAgICAgY29udGV4dHM6IFtcImFjdGlvblwiXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKCFpc1NhZmFyaSAmJiBCUk9XU0VSX0VOViAhPT0gXCJmaXJlZm94XCIpIHtcbiAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICBpZDogXCJ0cmFuc2xhdGVfcGFnZVwiLFxuICAgICAgICAgICAgICAgIHRpdGxlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiVHJhbnNsYXRlUGFnZVwiKSxcbiAgICAgICAgICAgICAgICBjb250ZXh0czogW1wicGFnZVwiXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFpc1NhZmFyaSAmJiBCUk9XU0VSX0VOViAhPT0gXCJmaXJlZm94XCIpIHtcbiAgICAgICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICBpZDogXCJ0cmFuc2xhdGVfcGFnZV9nb29nbGVcIixcbiAgICAgICAgICAgICAgICB0aXRsZTogY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcIlRyYW5zbGF0ZVBhZ2VHb29nbGVcIiksXG4gICAgICAgICAgICAgICAgY29udGV4dHM6IFtcImFjdGlvblwiXSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgICAgICAgICAgaWQ6IFwiYWRkX3VybF9ibGFja2xpc3RcIixcbiAgICAgICAgICAgIHRpdGxlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiQWRkVXJsQmxhY2tsaXN0XCIpLFxuICAgICAgICAgICAgY29udGV4dHM6IFtcImFjdGlvblwiXSxcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNocm9tZS5jb250ZXh0TWVudXMuY3JlYXRlKHtcbiAgICAgICAgICAgIGlkOiBcImFkZF9kb21haW5fYmxhY2tsaXN0XCIsXG4gICAgICAgICAgICB0aXRsZTogY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcIkFkZERvbWFpbkJsYWNrbGlzdFwiKSxcbiAgICAgICAgICAgIGNvbnRleHRzOiBbXCJhY3Rpb25cIl0sXG4gICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHZpc2libGU6IGZhbHNlLFxuICAgICAgICB9KTtcblxuICAgICAgICBjaHJvbWUuY29udGV4dE1lbnVzLmNyZWF0ZSh7XG4gICAgICAgICAgICBpZDogXCJyZW1vdmVfdXJsX2JsYWNrbGlzdFwiLFxuICAgICAgICAgICAgdGl0bGU6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJSZW1vdmVVcmxCbGFja2xpc3RcIiksXG4gICAgICAgICAgICBjb250ZXh0czogW1wiYWN0aW9uXCJdLFxuICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgICB2aXNpYmxlOiBmYWxzZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5jcmVhdGUoe1xuICAgICAgICAgICAgaWQ6IFwicmVtb3ZlX2RvbWFpbl9ibGFja2xpc3RcIixcbiAgICAgICAgICAgIHRpdGxlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiUmVtb3ZlRG9tYWluQmxhY2tsaXN0XCIpLFxuICAgICAgICAgICAgY29udGV4dHM6IFtcImFjdGlvblwiXSxcbiAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgICAgICAgdmlzaWJsZTogZmFsc2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnRleHRNZW51c0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgY2hyb21lLmNvbnRleHRNZW51cy5yZW1vdmVBbGwoKCkgPT4ge1xuICAgICAgICAgICAgLy8gZW5zdXJlIGxhc3RFcnJvciBpcyBjb25zdW1lZCBpZiBwcmVzZW50LCB0aGVuIGNyZWF0ZVxuICAgICAgICAgICAgdm9pZCBjaHJvbWUucnVudGltZS5sYXN0RXJyb3I7XG4gICAgICAgICAgICBjcmVhdGVBbGwoKTtcbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAgIGNyZWF0ZUFsbCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiDliJ3lp4vljJbmj5Lku7bphY3nva7jgIJcbiAqL1xuY2hyb21lLnJ1bnRpbWUub25JbnN0YWxsZWQuYWRkTGlzdGVuZXIoYXN5bmMgKGRldGFpbHMpID0+IHtcbiAgICAvLyBTZXR1cCBjb250ZXh0IG1lbnVzIG9uIGluc3RhbGxhdGlvbi9zdGFydHVwXG4gICAgc2V0dXBDb250ZXh0TWVudXMoKTtcbiAgICAvLyDlj6rmnInlnKjnlJ/kuqfnjq/looPkuIvvvIzmiY3kvJrlsZXnpLror7TmmI7pobXpnaJcbiAgICBpZiAocHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwicHJvZHVjdGlvblwiKSB7XG4gICAgICAgIGlmIChkZXRhaWxzLnJlYXNvbiA9PT0gXCJpbnN0YWxsXCIpIHtcbiAgICAgICAgICAgIC8vIOmmluasoeWuieijhe+8jOW8leWvvOeUqOaIt+afpeeci3dpa2lcbiAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgLy8g5Li6d2lraemhtemdouWIm+W7uuS4gOS4quaWsOeahOagh+etvumhtVxuICAgICAgICAgICAgICAgIHVybDogY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcIldpa2lMaW5rXCIpLFxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOWRiuefpeeUqOaIt+aVsOaNruaUtumbhuebuOWFs+S/oeaBr++8iOWcqCBTYWZhcmkg5LiL5Y+v6IO95LiN5pSv5oyBIG5vdGlmaWNhdGlvbnMg5p2D6ZmQ77yJXG4gICAgICAgICAgICBpZiAoY2hyb21lLm5vdGlmaWNhdGlvbnMgJiYgdHlwZW9mIGNocm9tZS5ub3RpZmljYXRpb25zLmNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLm5vdGlmaWNhdGlvbnMuY3JlYXRlKFwiZGF0YV9jb2xsZWN0aW9uX25vdGlmaWNhdGlvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYmFzaWNcIixcbiAgICAgICAgICAgICAgICAgICAgaWNvblVybDogY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKFwiaWNvbi9pY29uMTI4LnBuZ1wiKSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJBcHBOYW1lXCIpLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiRGF0YUNvbGxlY3Rpb25Ob3RpY2VcIiksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOWwneivleWPkemAgeWuieijheS6i+S7tlxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2VuZEhpdFJlcXVlc3QoXCJiYWNrZ3JvdW5kXCIsIFwiZXZlbnRcIiwge1xuICAgICAgICAgICAgICAgICAgICBlYzogXCJpbnN0YWxsYXRpb25cIiwgLy8gZXZlbnQgY2F0ZWdvcnlcbiAgICAgICAgICAgICAgICAgICAgZWE6IFwiaW5zdGFsbGF0aW9uXCIsIC8vIGV2ZW50IGxhYmVsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LCAxMCAqIDYwICogMTAwMCk7IC8vIDEwIG1pblxuICAgICAgICB9IGVsc2UgaWYgKGRldGFpbHMucmVhc29uID09PSBcInVwZGF0ZVwiKSB7XG4gICAgICAgICAgICBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJ1ZmZlciA9IHJlc3VsdDsgLy8gdXNlIHZhciBidWZmZXIgYXMgYSBwb2ludGVyXG4gICAgICAgICAgICAgICAgICAgIHNldERlZmF1bHRTZXR0aW5ncyhidWZmZXIsIERFRkFVTFRfU0VUVElOR1MpOyAvLyBhc3NpZ24gZGVmYXVsdCB2YWx1ZSB0byBidWZmZXJcbiAgICAgICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoYnVmZmVyLCByZXNvbHZlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBGaXggbGFuZ3VhZ2Ugc2V0dGluZyBjb21wYXRpYmlsaXR5IGJldHdlZW4gRWRnZSBUcmFuc2xhdGUgMi54IGFuZCAxLngueC5cbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KFwibGFuZ3VhZ2VTZXR0aW5nXCIsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdC5sYW5ndWFnZVNldHRpbmcpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQubGFuZ3VhZ2VTZXR0aW5nLnNsID09PSBcInpoLWNuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmxhbmd1YWdlU2V0dGluZy5zbCA9IFwiemgtQ05cIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5sYW5ndWFnZVNldHRpbmcuc2wgPT09IFwiemgtdHdcIikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQubGFuZ3VhZ2VTZXR0aW5nLnNsID0gXCJ6aC1UV1wiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQubGFuZ3VhZ2VTZXR0aW5nLnRsID09PSBcInpoLWNuXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0Lmxhbmd1YWdlU2V0dGluZy50bCA9IFwiemgtQ05cIjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdC5sYW5ndWFnZVNldHRpbmcudGwgPT09IFwiemgtdHdcIikge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQubGFuZ3VhZ2VTZXR0aW5nLnRsID0gXCJ6aC1UV1wiO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChyZXN1bHQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vIOS7juaXp+eJiOacrOabtOaWsO+8jOW8leWvvOeUqOaIt+afpeeci+abtOaWsOaXpeW/l++8iOWcqCBTYWZhcmkg5LiL5Y+v6IO95LiN5pSv5oyBIG5vdGlmaWNhdGlvbnMg5p2D6ZmQ77yJXG4gICAgICAgICAgICBpZiAoY2hyb21lLm5vdGlmaWNhdGlvbnMgJiYgdHlwZW9mIGNocm9tZS5ub3RpZmljYXRpb25zLmNyZWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLm5vdGlmaWNhdGlvbnMuY3JlYXRlKFwidXBkYXRlX25vdGlmaWNhdGlvblwiLCB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiYmFzaWNcIixcbiAgICAgICAgICAgICAgICAgICAgaWNvblVybDogY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKFwiaWNvbi9pY29uMTI4LnBuZ1wiKSxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJBcHBOYW1lXCIpLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiRXh0ZW5zaW9uVXBkYXRlZFwiKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWNuOi9veWOn+WboOiwg+afpVxuICAgICAgICBjaHJvbWUucnVudGltZS5zZXRVbmluc3RhbGxVUkwoXCJodHRwczovL3dqLnFxLmNvbS9zMi8zMjY1OTMwLzhmMDcvXCIpO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIFNldHVwIGNvbnRleHQgbWVudXMgb24gc2VydmljZSB3b3JrZXIgc3RhcnR1cFxuICovXG5jaHJvbWUucnVudGltZS5vblN0YXJ0dXAuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgIHNldHVwQ29udGV4dE1lbnVzKCk7XG59KTtcblxuLyoqXG4gKiBDcmVhdGUgY29tbXVuaWNhdGlvbiBjaGFubmVsLlxuICovXG5jb25zdCBjaGFubmVsID0gbmV3IENoYW5uZWwoKTtcblxuLyoqXG4gKiBDcmVhdGUgdHJhbnNsYXRvciBtYW5hZ2VyIGFuZCByZWdpc3RlciBldmVudCBsaXN0ZW5lcnMgYW5kIHNlcnZpY2UgcHJvdmlkZXJzLlxuICovXG5jb25zdCBUUkFOU0xBVE9SX01BTkFHRVIgPSBuZXcgVHJhbnNsYXRvck1hbmFnZXIoY2hhbm5lbCk7XG5cbi8qKlxuICog55uR5ZCs55So5oi354K55Ye76YCa55+l5LqL5Lu2XG4gKi9cbmlmIChjaHJvbWUubm90aWZpY2F0aW9ucyAmJiB0eXBlb2YgY2hyb21lLm5vdGlmaWNhdGlvbnMub25DbGlja2VkPy5hZGRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY2hyb21lLm5vdGlmaWNhdGlvbnMub25DbGlja2VkLmFkZExpc3RlbmVyKChub3RpZmljYXRpb25JZCkgPT4ge1xuICAgICAgICBzd2l0Y2ggKG5vdGlmaWNhdGlvbklkKSB7XG4gICAgICAgICAgICBjYXNlIFwidXBkYXRlX25vdGlmaWNhdGlvblwiOlxuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4unJlbGVhc2Vz6aG16Z2i5Yib5bu65LiA5Liq5paw55qE5qCH562+6aG1XG4gICAgICAgICAgICAgICAgICAgIHVybDogXCJodHRwczovL2dpdGh1Yi5jb20vRWRnZVRyYW5zbGF0ZS9FZGdlVHJhbnNsYXRlL3JlbGVhc2VzXCIsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZGF0YV9jb2xsZWN0aW9uX25vdGlmaWNhdGlvblwiOlxuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLmNyZWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS4uuiuvue9rumhtemdouWNleeLrOWIm+W7uuS4gOS4quagh+etvumhtVxuICAgICAgICAgICAgICAgICAgICB1cmw6IGNocm9tZS5ydW50aW1lLmdldFVSTChcIm9wdGlvbnMvb3B0aW9ucy5odG1sI2dvb2dsZS1hbmFseXRpY3NcIiksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cbi8qKlxuICog5re75Yqg54K55Ye76I+c5Y2V5ZCO55qE5aSE55CG5LqL5Lu2XG4gKi9cbmNocm9tZS5jb250ZXh0TWVudXMub25DbGlja2VkLmFkZExpc3RlbmVyKChpbmZvLCB0YWIpID0+IHtcbiAgICBzd2l0Y2ggKGluZm8ubWVudUl0ZW1JZCkge1xuICAgICAgICBjYXNlIFwidHJhbnNsYXRlXCI6XG4gICAgICAgICAgICBjaGFubmVsXG4gICAgICAgICAgICAgICAgLnJlcXVlc3RUb1RhYih0YWIuaWQsIFwiZ2V0X3NlbGVjdGlvblwiKVxuICAgICAgICAgICAgICAgIC50aGVuKCh7IHRleHQsIHBvc2l0aW9uIH0pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBUUkFOU0xBVE9SX01BTkFHRVIudHJhbnNsYXRlKHRleHQsIHBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSWYgY29udGVudCBzY3JpcHRzIGNhbiBub3QgYWNjZXNzIHRoZSB0YWIgdGhlIHNlbGVjdGlvbiwgdXNlIGluZm8uc2VsZWN0aW9uVGV4dCBpbnN0ZWFkLlxuICAgICAgICAgICAgICAgICAgICBpZiAoaW5mby5zZWxlY3Rpb25UZXh0LnRyaW0oKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFRSQU5TTEFUT1JfTUFOQUdFUi50cmFuc2xhdGUoaW5mby5zZWxlY3Rpb25UZXh0LCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidHJhbnNsYXRlX3BhZ2VcIjpcbiAgICAgICAgICAgIHRyYW5zbGF0ZVBhZ2UoY2hhbm5lbCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInRyYW5zbGF0ZV9wYWdlX2dvb2dsZVwiOlxuICAgICAgICAgICAgZXhlY3V0ZUdvb2dsZVNjcmlwdChjaGFubmVsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwic2V0dGluZ3NcIjpcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLm9wZW5PcHRpb25zUGFnZSgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJzaG9ydGN1dFwiOlxuICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICAgICAgICB1cmw6IFwiY2hyb21lOi8vZXh0ZW5zaW9ucy9zaG9ydGN1dHNcIixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJhZGRfdXJsX2JsYWNrbGlzdFwiOlxuICAgICAgICAgICAgYWRkVXJsQmxhY2tsaXN0KCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInJlbW92ZV91cmxfYmxhY2tsaXN0XCI6XG4gICAgICAgICAgICByZW1vdmVVcmxCbGFja2xpc3QoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiYWRkX2RvbWFpbl9ibGFja2xpc3RcIjpcbiAgICAgICAgICAgIGFkZERvbWFpbkJsYWNrbGlzdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJyZW1vdmVfZG9tYWluX2JsYWNrbGlzdFwiOlxuICAgICAgICAgICAgcmVtb3ZlRG9tYWluQmxhY2tsaXN0KCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIOa3u+WKoHRhYuWIh+aNouS6i+S7tuebkeWQrO+8jOeUqOS6juabtOaWsOm7keWQjeWNleS/oeaBr1xuICovXG5jaHJvbWUudGFicy5vbkFjdGl2YXRlZC5hZGRMaXN0ZW5lcigoYWN0aXZlSW5mbykgPT4ge1xuICAgIGNocm9tZS50YWJzLmdldChhY3RpdmVJbmZvLnRhYklkLCAodGFiKSA9PiB7XG4gICAgICAgIGlmICh0YWIudXJsICYmIHRhYi51cmwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdXBkYXRlQkxhY2tMaXN0TWVudSh0YWIudXJsKTtcbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cbi8qKlxuICog5re75YqgdGFi5Yi35paw5LqL5Lu255uR5ZCs77yM55So5LqO5pu05paw6buR5ZCN5Y2V5L+h5oGvXG4gKi9cbmNocm9tZS50YWJzLm9uVXBkYXRlZC5hZGRMaXN0ZW5lcigodGFiSWQsIGNoYW5nZUluZm8sIHRhYikgPT4ge1xuICAgIGlmICh0YWIuYWN0aXZlICYmIHRhYi51cmwgJiYgdGFiLnVybC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHVwZGF0ZUJMYWNrTGlzdE1lbnUodGFiLnVybCk7XG4gICAgfVxufSk7XG5cbi8qKlxuICogUmVkaXJlY3QgdGFiIHdoZW4gcmVkaXJlY3QgZXZlbnQgaGFwcGVucy5cbiAqL1xuY2hhbm5lbC5vbihcInJlZGlyZWN0XCIsIChkZXRhaWwsIHNlbmRlcikgPT4gY2hyb21lLnRhYnMudXBkYXRlKHNlbmRlci50YWIuaWQsIHsgdXJsOiBkZXRhaWwudXJsIH0pKTtcblxuLyoqXG4gKiBPcGVuIG9wdGlvbnMgcGFnZSB3aGVuIG9wZW5fb3B0aW9uc19wYWdlIGJ1dHRvbiBjbGlja2VkLlxuICovXG5jaGFubmVsLm9uKFwib3Blbl9vcHRpb25zX3BhZ2VcIiwgKCkgPT4gY2hyb21lLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCkpO1xuXG4vKipcbiAqIEZvcndhcmQgcGFnZSB0cmFuc2xhdGUgZXZlbnQgYmFjayB0byBwYWdlcy5cbiAqL1xuY2hhbm5lbC5vbihcInBhZ2VfdHJhbnNsYXRlX2V2ZW50XCIsIChkZXRhaWwsIHNlbmRlcikgPT4ge1xuICAgIGNoYW5uZWwuZW1pdFRvVGFicyhzZW5kZXIudGFiLmlkLCBcInBhZ2VfdHJhbnNsYXRlX2V2ZW50XCIsIGRldGFpbCk7XG59KTtcblxuLyoqXG4gKiBQcm92aWRlIFVJIGxhbmd1YWdlIGRldGVjdGluZyBzZXJ2aWNlLlxuICovXG5jaGFubmVsLnByb3ZpZGUoXCJnZXRfbGFuZ1wiLCAoKSA9PiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICAgIGxhbmc6IEJST1dTRVJfTEFOR1VBR0VTX01BUFtjaHJvbWUuaTE4bi5nZXRVSUxhbmd1YWdlKCldLFxuICAgIH0pO1xufSk7XG5cbi8qKlxuICogIOWwhuW/q+aNt+mUrua2iOaBr+i9rOWPkee7mWNvbnRlbnRfc2NyaXB0c1xuICovXG5jaHJvbWUuY29tbWFuZHMub25Db21tYW5kLmFkZExpc3RlbmVyKChjb21tYW5kKSA9PiB7XG4gICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgIGNhc2UgXCJ0cmFuc2xhdGVfcGFnZVwiOlxuICAgICAgICAgICAgdHJhbnNsYXRlUGFnZShjaGFubmVsKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcHJvbWlzZVRhYnNcbiAgICAgICAgICAgICAgICAucXVlcnkoeyBhY3RpdmU6IHRydWUsIGN1cnJlbnRXaW5kb3c6IHRydWUgfSlcbiAgICAgICAgICAgICAgICAudGhlbigodGFicykgPT4gY2hhbm5lbC5lbWl0VG9UYWJzKHRhYnNbMF0uaWQsIFwiY29tbWFuZFwiLCB7IGNvbW1hbmQgfSkpXG4gICAgICAgICAgICAgICAgLmNhdGNoKCgpID0+IHt9KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn0pO1xuXG4vKipcbiAqIE5vdGU6IHdlYlJlcXVlc3QgQVBJIGhhcyBiZWVuIHJlbW92ZWQgaW4gTWFuaWZlc3QgVjMuXG4gKiBIZWFkZXIgbW9kaWZpY2F0aW9ucyBmb3IgQ1NQIGFuZCBDT1JTIGFyZSBub3cgaGFuZGxlZCBkaWZmZXJlbnRseTpcbiAqIDEuIENTUCBtb2RpZmljYXRpb25zIG1heSBuZWVkIHRvIGJlIGhhbmRsZWQgdGhyb3VnaCBjb250ZW50IHNjcmlwdHMgaW5qZWN0aW9uXG4gKiAyLiBDT1JTIGlzc3VlcyBzaG91bGQgYmUgYWRkcmVzc2VkIHRocm91Z2ggcHJvcGVyIHNlcnZlci1zaWRlIGNvbmZpZ3VyYXRpb25zXG4gKiAzLiBTb21lIGZ1bmN0aW9uYWxpdHkgbWF5IG5lZWQgdG8gYmUgcmVpbXBsZW1lbnRlZCB1c2luZyBkZWNsYXJhdGl2ZU5ldFJlcXVlc3RcbiAqXG4gKiBGb3Igbm93LCB0aGVzZSBoZWFkZXIgbW9kaWZpY2F0aW9ucyBhcmUgY29tbWVudGVkIG91dCBhcyB0aGV5IHJlcXVpcmVcbiAqIGEgZGlmZmVyZW50IGFwcHJvYWNoIGluIE1hbmlmZXN0IFYzLiBUaGUgdHJhbnNsYXRpb24gZnVuY3Rpb25hbGl0eVxuICogbWF5IHdvcmsgd2l0aG91dCB0aGVzZSBtb2RpZmljYXRpb25zLCBvciBhbHRlcm5hdGl2ZSBzb2x1dGlvbnMgbmVlZCB0byBiZSBpbXBsZW1lbnRlZC5cbiAqL1xuXG4vLyBzZW5kIGJhc2ljIGhpdCBkYXRhIHRvIGdvb2dsZSBhbmFseXRpY3NcbnNldFRpbWVvdXQoKCkgPT4ge1xuICAgIHNlbmRIaXRSZXF1ZXN0KFwiYmFja2dyb3VuZFwiLCBcInBhZ2V2aWV3XCIsIG51bGwpO1xufSwgNjAgKiAxMDAwKTtcblxuLyoqXG4gKiBkeW5hbWljIGltcG9ydGluZyBob3QgcmVsb2FkIGZ1bmN0aW9uIG9ubHkgaW4gZGV2ZWxvcG1lbnQgZW52XG4gKi9cbmlmIChCVUlMRF9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBCUk9XU0VSX0VOViA9PT0gXCJjaHJvbWVcIikge1xuICAgIGltcG9ydChcIi4vbGlicmFyeS9ob3RfcmVsb2FkLmpzXCIpLnRoZW4oKG1vZHVsZSkgPT4ge1xuICAgICAgICBtb2R1bGUuaG90UmVsb2FkKCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICog7LaU6rCA7KCB7J24IFNlcnZpY2UgV29ya2VyIOyghOyXrSDsmKTrpZgg7ZW465Ok65+sXG4gKi9cbmlmICh0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBzZWxmLmFkZEV2ZW50TGlzdGVuZXIpIHtcbiAgICAvLyBTZXJ2aWNlIFdvcmtlcuyXkOyEnOydmCB1bmhhbmRsZWRyZWplY3Rpb24g7J2067Kk7Yq4IOyymOumrFxuICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcihcInVuaGFuZGxlZHJlamVjdGlvblwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGV2ZW50LnJlYXNvbj8ubWVzc2FnZSB8fCBldmVudC5yZWFzb24/LnRvU3RyaW5nKCkgfHwgXCJcIjtcbiAgICAgICAgaWYgKHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBsb2dXYXJuKFwiU2VydmljZSBXb3JrZXLsl5DshJwg7ZWE7YSw66eB65CcIFByb21pc2UgcmVqZWN0aW9uOlwiLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNlcnZpY2UgV29ya2Vy7JeQ7ISc7J2YIOydvOuwmCBlcnJvciDsnbTrsqTtirgg7LKY66asXG4gICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBldmVudC5lcnJvcj8ubWVzc2FnZSB8fCBldmVudC5tZXNzYWdlIHx8IFwiXCI7XG4gICAgICAgIGlmIChzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgbG9nV2FybihcIlNlcnZpY2UgV29ya2Vy7JeQ7IScIO2VhO2EsOungeuQnCDsmKTrpZg6XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuIl0sIm5hbWVzIjpbIkRFRkFVTFRfU0VUVElOR1MiLCJnZXRPclNldERlZmF1bHRTZXR0aW5ncyIsImxvZ1dhcm4iLCJzZW5kSGl0UmVxdWVzdCIsIkFOQUxZVElDU19BQ0NPVU5UIiwiR0FfVVJMIiwicGFnZSIsInR5cGUiLCJleHRyYUhpdERhdGEiLCJkb2N1bWVudExvY2F0aW9uIiwiZG9jdW1lbnQiLCJsb2NhdGlvbiIsIm9yaWdpbiIsInBhdGhuYW1lIiwic2VhcmNoIiwid2l0aEdvb2dsZUFuYWx5dGljcyIsImdldFVVSUQiLCJVVUlEIiwiaGl0RGF0YSIsInYiLCJ0aWQiLCJjaWQiLCJ1bCIsIm5hdmlnYXRvciIsImxhbmd1YWdlIiwiYW4iLCJjaHJvbWUiLCJydW50aW1lIiwiZ2V0TWFuaWZlc3QiLCJuYW1lIiwiYXYiLCJ2ZXJzaW9uIiwidCIsImRsIiwiZHAiLCJkdCIsIk9iamVjdCIsImFzc2lnbiIsIlhNTEh0dHBSZXF1ZXN0Iiwid2luZG93IiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiYm9keSIsImdlbmVyYXRlVVJMUmVxdWVzdCIsImNhdGNoIiwiZXJyb3IiLCJyZXF1ZXN0Iiwib3BlbiIsInNlbmQiLCJyZXF1ZXN0RGF0YSIsInBhcnRzIiwia2V5IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiayIsImVuY29kZVVSSUNvbXBvbmVudCIsIlN0cmluZyIsInB1c2giLCJqb2luIiwiY2FsbGJhY2siLCJ0aGVuIiwicmVzdWx0IiwiT3RoZXJTZXR0aW5ncyIsIlVzZUdvb2dsZUFuYWx5dGljcyIsImdlbmVyYXRlVVVJRCIsImQiLCJEYXRlIiwiZ2V0VGltZSIsInBlcmZvcm1hbmNlIiwibm93IiwidXVpZCIsInJlcGxhY2UiLCJjIiwiciIsIk1hdGgiLCJyYW5kb20iLCJmbG9vciIsInRvU3RyaW5nIiwiZ2V0RG9tYWluIiwibG9nIiwiYWRkVXJsQmxhY2tsaXN0IiwiYWRkRG9tYWluQmxhY2tsaXN0IiwicmVtb3ZlVXJsQmxhY2tsaXN0IiwicmVtb3ZlRG9tYWluQmxhY2tsaXN0IiwidXBkYXRlQkxhY2tMaXN0TWVudSIsIkRJU0FCTEVEX01BUksiLCJhZGRCbGFja2xpc3QiLCJkaXNhYmxlSXRlbXMiLCJlbmFibGVJdGVtcyIsImFjdGlvbiIsInNldEJhZGdlVGV4dCIsInRleHQiLCJyZW1vdmVCbGFja2xpc3QiLCJibGFja2xpc3QiLCJ1cmwiLCJ1cmxzIiwiZmllbGQiLCJ0YWJzIiwicXVlcnkiLCJhY3RpdmUiLCJjdXJyZW50V2luZG93IiwidmFsdWUiLCJzdG9yYWdlIiwic3luYyIsInNldCIsImRvbWFpbnMiLCJpdGVtcyIsImZvckVhY2giLCJpdGVtIiwiY29udGV4dE1lbnVzIiwidXBkYXRlIiwiZW5hYmxlZCIsInZpc2libGUiLCJsYXN0RXJyb3IiLCJIeWJyaWRUcmFuc2xhdG9yIiwicHJvbWlzZVRhYnMiLCJkZWxheVByb21pc2UiLCJUcmFuc2xhdG9yTWFuYWdlciIsImNvbnN0cnVjdG9yIiwiY2hhbm5lbCIsImNvbmZpZ19sb2FkZXIiLCJjb25maWdzIiwiSFlCUklEX1RSQU5TTEFUT1IiLCJIeWJyaWRUcmFuc2xhdG9yQ29uZmlnIiwiVFJBTlNMQVRPUlMiLCJfb2JqZWN0U3ByZWFkIiwiSHlicmlkVHJhbnNsYXRlIiwiUkVBTF9UUkFOU0xBVE9SUyIsIklOX01VVFVBTF9NT0RFIiwiTXV0dWFsVHJhbnNsYXRlIiwiTEFOR1VBR0VfU0VUVElORyIsImxhbmd1YWdlU2V0dGluZyIsIkRFRkFVTFRfVFJBTlNMQVRPUiIsIkRlZmF1bHRUcmFuc2xhdG9yIiwiVFRTX1NQRUVEIiwiY2FjaGVPcHRpb25zIiwibWF4RW50cmllcyIsImRldGVjdFR0bE1zIiwidHJhbnNsYXRlVHRsTXMiLCJtYXhLZXlUZXh0TGVuZ3RoIiwiZGVib3VuY2VXaW5kb3dNcyIsImRldGVjdENhY2hlIiwiTWFwIiwidHJhbnNsYXRpb25DYWNoZSIsImluZmxpZ2h0RGV0ZWN0IiwiaW5mbGlnaHRUcmFuc2xhdGUiLCJsYXN0VHJhbnNsYXRlS2V5IiwibGFzdFRyYW5zbGF0ZUF0IiwicHJvdmlkZVNlcnZpY2VzIiwibGlzdGVuVG9FdmVudHMiLCJjbGVhckNhY2hlcyIsImNsZWFyIiwibm9ybWFsaXplS2V5VGV4dCIsImNvbGxhcHNlZCIsInRyaW0iLCJsZW5ndGgiLCJzbGljZSIsIm1ha2VEZXRlY3RLZXkiLCJtYWtlVHJhbnNsYXRlS2V5Iiwic2wiLCJ0bCIsInRyYW5zbGF0b3JJZCIsIm5vcm0iLCJnZXRGcm9tQ2FjaGUiLCJtYXAiLCJlbnRyeSIsImdldCIsImV4cGlyZUF0IiwiZGVsZXRlIiwic2V0Q2FjaGVFbnRyeSIsInR0bE1zIiwiaGFzIiwibWF4Iiwic2l6ZSIsIm9sZGVzdEtleSIsImtleXMiLCJuZXh0IiwidW5kZWZpbmVkIiwiX3VudXNlZCIsImdldERldGVjdGlvbkZyb21DYWNoZSIsInJlbWVtYmVyRGV0ZWN0aW9uIiwibGFuZyIsImdldFRyYW5zbGF0aW9uRnJvbUNhY2hlIiwicmVtZW1iZXJUcmFuc2xhdGlvbiIsInByb3ZpZGUiLCJwYXJhbXMiLCJ0cmFuc2xhdGUiLCJwb3NpdGlvbiIsIlByb21pc2UiLCJyZXNvbHZlIiwib3JpZ2luYWxUZXh0IiwidHJhbnNsYXRlZFRleHQiLCJlIiwic3BlZWQiLCJwcm9ub3VuY2UiLCJwcm9ub3VuY2luZyIsImdldEF2YWlsYWJsZVRyYW5zbGF0b3JzIiwiZGV0YWlsIiwidXBkYXRlRGVmYXVsdFRyYW5zbGF0b3IiLCJ0cmFuc2xhdG9yIiwiY3VycmVudFRhYklkIiwiZ2V0Q3VycmVudFRhYklkIiwiZW1pdFRvVGFicyIsIm9uIiwiQlJPV1NFUl9FTlYiLCJleGVjdXRlR29vZ2xlU2NyaXB0Iiwib25MYW5ndWFnZVNldHRpbmdVcGRhdGVkIiwiYmluZCIsInN0b3BQcm9ub3VuY2UiLCJvbkNoYW5nZWQiLCJhZGRMaXN0ZW5lciIsImNoYW5nZXMiLCJhcmVhIiwidXNlQ29uZmlnIiwibmV3VmFsdWUiLCJ0YWJJZCIsImlkIiwicmVxdWVzdFRvVGFiIiwic2hvdWxkT3Blbk5vdGljZVBhZ2UiLCJ0ZXN0IiwiY29uZmlybSIsImkxOG4iLCJnZXRNZXNzYWdlIiwiY3JlYXRlIiwibm90aWNlUGFnZVVybCIsImdldFVSTCIsInRhYiIsImhpZ2hsaWdodCIsImluZGV4IiwiZGV0ZWN0IiwiY2FjaGVkIiwicHJvbWlzZSIsImRldGVjdGVkIiwiZmluYWxseSIsInRpbWVzdGFtcCIsInJlcyIsInNvdXJjZUxhbmd1YWdlIiwidGFyZ2V0TGFuZ3VhZ2UiLCJjb25zb2xlIiwiY29uY2F0IiwiZ2V0QXZhaWxhYmxlVHJhbnNsYXRvcnNGb3IiLCJmcm9tIiwidG8iLCJzZWxlY3RlZFRyYW5zbGF0b3IiLCJhdmFpbGFibGVUcmFuc2xhdG9ycyIsIm5ld0NvbmZpZyIsInVwZGF0ZUNvbmZpZ0ZvciIsIlNldCIsImVtaXQiLCJjb25maWciLCJ0cmFuc2xhdGVQYWdlIiwiRGVmYXVsdFBhZ2VUcmFuc2xhdG9yIiwiaXNTYWZhcmkiLCJ1c2VyQWdlbnQiLCJ1YSIsInNjcmlwdGluZyIsImV4ZWN1dGVTY3JpcHQiLCJ0YXJnZXQiLCJhbGxGcmFtZXMiLCJmaWxlcyIsImluamVjdEltbWVkaWF0ZWx5Iiwic2V0VGltZW91dCIsImZpbGUiLCJoYXNTY3JpcHRpbmciLCJFdmVudE1hbmFnZXIiLCJDaGFubmVsIiwiX3NlcnZpY2VzIiwiX2V2ZW50TWFuYWdlciIsIm9uTWVzc2FnZSIsIm1lc3NhZ2UiLCJzZW5kZXIiLCJwYXJzZWQiLCJKU09OIiwicGFyc2UiLCJldmVudCIsInNlcnZlciIsInNlcnZpY2UiLCJzdHJpbmdpZnkiLCJyZWplY3QiLCJzZW5kTWVzc2FnZSIsIl9nZXRUYWJNZXNzYWdlU2VuZGVyIiwiaGFuZGxlciIsInRhYklkcyIsImJyb3dzZXIiLCJsb2dJbmZvIiwiVVJMX1BBVFRFUk4iLCJncm91cHMiLCJtYXRjaCIsImkxOG5IVE1MIiwiaTE4bkVsZW1lbnRzIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImkiLCJwb3MiLCJoYXNBdHRyaWJ1dGUiLCJnZXRBdHRyaWJ1dGUiLCJpbnNlcnRBZGphY2VudFRleHQiLCJfaGFuZGxlcklEIiwiX2V2ZW50VG9IYW5kbGVySURzIiwiX2hhbmRsZXJJRFRvSGFuZGxlciIsImhhbmRsZXJJRCIsIl9hbGxvY0hhbmRsZXJJRCIsImFkZCIsImNhbmNlbGVkIiwiX29mZiIsIndhcm4iLCJzb3VyY2UiLCJoYW5kbGVySURzIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsIkJST1dTRVJfTEFOR1VBR0VTX01BUCIsImFjaCIsImFkeSIsImFmIiwiYWsiLCJhbSIsImFyIiwiYXoiLCJiZyIsImJuIiwiY2EiLCJjYWsiLCJjZWIiLCJjbyIsImNzIiwiY3kiLCJkYSIsImRlIiwiZHNiIiwiZWwiLCJlbiIsImVvIiwiZXMiLCJldCIsImV1IiwiZmEiLCJmZiIsImZpIiwiZnIiLCJnYSIsImdkIiwiZ2wiLCJoYSIsImhhdyIsImhlIiwiaGkiLCJobW4iLCJociIsImhzYiIsImh0IiwiaHUiLCJpZyIsImlzIiwiaXQiLCJpdyIsImphIiwia20iLCJrYWIiLCJrbiIsImtvIiwia3kiLCJsYSIsImxiIiwibG8iLCJsdCIsImx2IiwibWFpIiwibWkiLCJtayIsIm1sIiwibXIiLCJtcyIsIm10IiwibXkiLCJubyIsIm5iIiwibmUiLCJubCIsIm55Iiwib2MiLCJwYSIsInBsIiwicHQiLCJybyIsInJ1Iiwic2QiLCJzayIsInNtIiwic24iLCJzcSIsInNyIiwic3QiLCJzdSIsInN2Iiwic3ciLCJ0YSIsInRlIiwidGciLCJ0aCIsInRsaCIsInRyIiwidWsiLCJ1ciIsInV6IiwidmkiLCJ5aSIsInlvIiwiemgiLCJsb2dFcnJvciIsInNob3VsZEZpbHRlckVycm9yIiwid3JhcENvbnNvbGVGb3JGaWx0ZXJpbmciLCJzZXRMb2dMZXZlbCIsImdldExvZ0xldmVsIiwiRklMVEVSRURfRVJST1JfUEFUVEVSTlMiLCJqb2luTWVzc2FnZSIsImFyZ3MiLCJfIiwic29tZSIsInBhdHRlcm4iLCJpbmNsdWRlcyIsIkxFVkVMX09SREVSIiwiZGVidWciLCJpbmZvIiwic2lsZW50IiwiY3VycmVudExldmVsIiwiQlVJTERfRU5WIiwibGV2ZWwiLCJzaG91bGRFbWl0Iiwib3JpZ2luYWxDb25zb2xlRXJyb3IiLCJhcHBseSIsInRpbWUiLCJjcmVhdGVQcm9wZXJ0aWVzIiwicXVlcnlJbmZvIiwiZXh0ZW5zaW9ucyIsIkxheW91dFNldHRpbmdzIiwiUmVzaXplIiwiUlRMIiwiRm9sZExvbmdDb250ZW50IiwiU2VsZWN0VHJhbnNsYXRlUG9zaXRpb24iLCJnZXRVSUxhbmd1YWdlIiwiU2VsZWN0VHJhbnNsYXRlIiwiVHJhbnNsYXRlQWZ0ZXJEYmxDbGljayIsIlRyYW5zbGF0ZUFmdGVyU2VsZWN0IiwiQ2FuY2VsVGV4dFNlbGVjdGlvbiIsInRyYW5zbGF0b3JzIiwic2VsZWN0aW9ucyIsIm1haW5NZWFuaW5nIiwidFByb251bmNpYXRpb24iLCJzUHJvbnVuY2lhdGlvbiIsImRldGFpbGVkTWVhbmluZ3MiLCJkZWZpbml0aW9ucyIsImV4YW1wbGVzIiwiVHJhbnNsYXRlUmVzdWx0RmlsdGVyIiwidFByb251bmNpYXRpb25JY29uIiwic1Byb251bmNpYXRpb25JY29uIiwiQ29udGVudERpc3BsYXlPcmRlciIsIkhpZGVQYWdlVHJhbnNsYXRvckJhbm5lciIsInNldERlZmF1bHRTZXR0aW5ncyIsInNldHRpbmdzIiwiQXJyYXkiLCJkZWZhdWx0cyIsInVwZGF0ZWQiLCJzZXR0aW5nIiwiVSIsImRlZmluZVByb3BlcnR5IiwiTSIsImgiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJMIiwicyIsImRhdGEiLCJhIiwibiIsInRpbWVvdXQiLCJvIiwicmVzcG9uc2VUeXBlIiwibCIsImJhc2VVUkwiLCJ1IiwidmFsaWRhdGVTdGF0dXMiLCJUIiwiUiIsIlVSTFNlYXJjaFBhcmFtcyIsIm0iLCJ0b1VwcGVyQ2FzZSIsIkhlYWRlcnMiLCJGb3JtRGF0YSIsIkFycmF5QnVmZmVyIiwiVWludDhBcnJheSIsInkiLCJBYm9ydENvbnRyb2xsZXIiLCJzaWduYWwiLCJmIiwiYWJvcnQiLCJjbGVhclRpbWVvdXQiLCJnIiwiYmxvYiIsImFycmF5QnVmZmVyIiwiQSIsIlMiLCJOIiwiRSIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJFcnJvciIsInJlc3BvbnNlIiwiY29kZSIsImVycm9yVHlwZSIsImVycm9yQ29kZSIsImVycm9yTXNnIiwicG9zdCIsInB1dCIsInBhdGNoIiwiaGVhZCIsIm9wdGlvbnMiLCJjb21tb24iLCJpbnRlcmNlcHRvcnMiLCJ1c2UiLCJlamVjdCIsImlzQXhpb3NFcnJvciIsInAiLCJiIiwiRCIsInl1ZSIsIkgiLCJndSIsIk8iLCJyZWdpb24iLCJ0b2tlbiIsIkRPTVBhcnNlciIsImFjY2VwdCIsInJlZmVyZXIiLCJBdWRpbyIsInVwZGF0ZVRva2VucyIsIkhPTUVfUEFHRSIsImV4ZWMiLCJyZXNwb25zZVVSTCIsIkhPU1QiLCJJRyIsIkhUTUxQYXJzZXIiLCJwYXJzZUZyb21TdHJpbmciLCJJSUQiLCJnZXRFbGVtZW50QnlJZCIsImNvdW50IiwicGFyc2VUcmFuc2xhdGVSZXN1bHQiLCJ0cmFuc2xhdGlvbnMiLCJ0cmFuc2xpdGVyYXRpb24iLCJwYXJzZUxvb2t1cFJlc3VsdCIsImRpc3BsYXlTb3VyY2UiLCJkaXNwbGF5VGFyZ2V0IiwiYmFja1RyYW5zbGF0aW9ucyIsImRpc3BsYXlUZXh0IiwicG9zVGFnIiwibWVhbmluZyIsInN5bm9ueW1zIiwicGFyc2VFeGFtcGxlUmVzdWx0Iiwic291cmNlUHJlZml4Iiwic291cmNlVGVybSIsInNvdXJjZVN1ZmZpeCIsInRhcmdldFByZWZpeCIsInRhcmdldFRlcm0iLCJ0YXJnZXRTdWZmaXgiLCJ1cGRhdGVUVFNBdXRoIiwiSEVBREVSUyIsIlRUU19BVVRIIiwiZ2VuZXJhdGVUVFNEYXRhIiwiTEFOX1RPX0NPREUiLCJhcnJheUJ1ZmZlclRvQmFzZTY0IiwiYnl0ZUxlbmd0aCIsImZyb21DaGFyQ29kZSIsImJ0b2EiLCJjb25zdHJ1Y3REZXRlY3RQYXJhbXMiLCJjb25zdHJ1Y3RUcmFuc2xhdGVQYXJhbXMiLCJjb25zdHJ1Y3RMb29rdXBQYXJhbXMiLCJjb25zdHJ1Y3RFeGFtcGxlUGFyYW1zIiwiY29uc3RydWN0VFRTUGFyYW1zIiwiQXV0aG9yaXphdGlvbiIsImxhc3RSZXF1ZXN0VGltZSIsIlJFUVVFU1RfREVMQVkiLCJTdGF0dXNDb2RlIiwic3RhdHVzQ29kZSIsIk1BWF9SRVRSWSIsInRva2Vuc0luaXRpYXRlZCIsInN1cHBvcnRlZExhbmd1YWdlcyIsImRldGVjdGVkTGFuZ3VhZ2UiLCJDT0RFX1RPX0xBTiIsImVycm9yQWN0IiwiYXBpIiwiQVVESU8iLCJzcmMiLCJwbGF5IiwicGF1c2VkIiwicGF1c2UiLCJ3IiwiZ2VuZXJhdGVUSyIsImNoYXJDb2RlQXQiLCJfbWFnaWMiLCJjaGFyQXQiLCJ1cGRhdGVUS0siLCJUS0siLCJmYWxsQmFjayIsImZhbGxCYWNraW5nIiwiZ2VuZXJhdGVEZXRlY3RVUkwiLCJGQUxMQkFDS19UUkFOU0xBVEVfVVJMIiwiVFJBTlNMQVRFX1VSTCIsImdlbmVyYXRlVHJhbnNsYXRlVVJMIiwicGFyc2VEZXRlY3RSZXN1bHQiLCJsZF9yZXN1bHQiLCJleHRlbmRlZF9zcmNsYW5ncyIsInNyY2xhbmdzIiwicGFyc2VCZXR0ZXJSZXN1bHQiLCJzZW50ZW5jZXMiLCJ0cmFucyIsIm9yaWciLCJ0cmFuc2xpdCIsInNyY190cmFuc2xpdCIsImRpY3QiLCJ3b3JkIiwicmV2ZXJzZV90cmFuc2xhdGlvbiIsImdsb3NzIiwiZXhhbXBsZSIsInNvcnQiLCJwYXJzZUZhbGxiYWNrUmVzdWx0IiwiRkFMTEJBQ0tfVFRTX1VSTCIsIlRUU19VUkwiLCJDIiwiSSIsImxhbmdEZXRlY3RvciIsIlRUU0VuZ2luZSIsImNyZWF0ZUlmcmFtZSIsImRlZXBMSWZyYW1lIiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJjb250ZW50V2luZG93IiwicG9zdE1lc3NhZ2UiLCJyZXBsYWNlQWxsIiwicmVtb3ZlQ2hpbGQiLCJQIiwiQmluZ1RyYW5zbGF0ZSIsIkdvb2dsZVRyYW5zbGF0ZSIsIkRlZXBMVHJhbnNsYXRlIiwiQ09ORklHIiwiTUFJTl9UUkFOU0xBVE9SIiwibG9jYWxlQ29tcGFyZSIsImFsbCIsIiQiLCJha2EiLCJhcmciLCJoeSIsImFzbSIsImFzdCIsImF5bSIsImJhbCIsInN1biIsImJhayIsImJlIiwiYmVtIiwiYmVyIiwiYmhvIiwiYmlzIiwiYmxpIiwibm9iIiwiYnMiLCJicmUiLCJidXIiLCJjaHIiLCJjaHYiLCJ3eXciLCJjb3IiLCJjcmUiLCJjcmkiLCJwcnMiLCJkaXYiLCJmYW8iLCJmaiIsImZpbCIsImZ5IiwiZnJpIiwiZnVsIiwiZ2xhIiwia2EiLCJncm4iLCJoYWsiLCJoaWwiLCJodXAiLCJpZG8iLCJpbmciLCJpbmEiLCJpa3UiLCJqdyIsImthbCIsImthdSIsImthcyIsImthaCIsImtrIiwia2luIiwia29uIiwia29rIiwia3UiLCJrbXIiLCJsYWciLCJsaW0iLCJsaW4iLCJsb2oiLCJsdWciLCJtZyIsImdsdiIsIm1haCIsIm1hdSIsImZybSIsIm1uIiwibW90IiwibmVhIiwic21lIiwicGVkIiwibm5vIiwib2NpIiwib2ppIiwiZW5vIiwib3IiLCJvcm0iLCJvc3MiLCJwYW0iLCJwYXAiLCJwcyIsInF1ZSIsIm90cSIsInJvaCIsInJvbSIsInJ1eSIsInNhbiIsInNyZCIsInNjbyIsInNlYyIsInNoYSIsInNpbCIsInNpIiwic28iLCJzb2wiLCJuYmwiLCJzb3QiLCJzeXIiLCJ0Z2wiLCJ0eSIsInRhdCIsInRldCIsInRpciIsInRzbyIsInR1ayIsInR3aSIsInVnIiwidXBzIiwidmVuIiwid2xuIiwiZnJ5Iiwid29sIiwieGgiLCJ5dWEiLCJ6YXoiLCJ6dSIsIkJpbmdUcmFuc2xhdG9yIiwiRGVlcGxUcmFuc2xhdG9yIiwiR29vZ2xlVHJhbnNsYXRvciIsIkxBTkdVQUdFUyIsImF4aW9zIiwiX2Nocm9tZSRydW50aW1lJG9uU3RhIiwiX2Nocm9tZSRydW50aW1lJG9uU3RhMiIsIm9uU3RhcnR1cCIsIndlYk5hdmlnYXRpb24iLCJvbkNvbW1pdHRlZCIsImRldGFpbHMiLCJmcmFtZUlkIiwiaXNQZGYiLCJ2aWV3ZXJVcmwiLCJwcmV2ZW50RGVmYXVsdCIsInJlYXNvbiIsIk1vY2tFbGVtZW50IiwidGFnTmFtZSIsIm5vZGVOYW1lIiwibm9kZVR5cGUiLCJjaGlsZHJlbiIsImNoaWxkTm9kZXMiLCJhdHRyaWJ1dGVzIiwidGV4dENvbnRlbnQiLCJpbm5lckhUTUwiLCJvdXRlckhUTUwiLCJjbGFzc05hbWUiLCJwYXJlbnROb2RlIiwic3R5bGUiLCJzZXRBdHRyaWJ1dGUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJjaGlsZCIsImluZGV4T2YiLCJzcGxpY2UiLCJkaXNwYXRjaEV2ZW50IiwiY2xpY2siLCJmb2N1cyIsImJsdXIiLCJzZWxmIiwiY3JlYXRlTW9ja0VsZW1lbnQiLCJlbGVtZW50IiwicXVlcnlTZWxlY3RvciIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsIlByb3h5IiwiX3NyYyIsIm9ubG9hZCIsIl9ocmVmIiwidG9Mb3dlckNhc2UiLCJocmVmIiwiTW9ja0F1ZGlvIiwiY3VycmVudFRpbWUiLCJkdXJhdGlvbiIsImVuZGVkIiwidm9sdW1lIiwibXV0ZWQiLCJsb2FkIiwiSW1hZ2UiLCJNb2NrSW1hZ2UiLCJFdmVudFRhcmdldCIsIndpZHRoIiwiaGVpZ2h0IiwiY29tcGxldGUiLCJuYXR1cmFsV2lkdGgiLCJuYXR1cmFsSGVpZ2h0IiwiX29ubG9hZCIsIl9vbmVycm9yIiwiY3Jvc3NPcmlnaW4iLCJsb2FkaW5nIiwicmVmZXJyZXJQb2xpY3kiLCJkZWNvZGUiLCJsb2FkRXZlbnQiLCJFdmVudCIsIm9uZXJyb3IiLCJsaXN0ZW5lciIsIk1vY2tET01QYXJzZXIiLCJzdHIiLCJtaW1lVHlwZSIsImRvYyIsImRvY3VtZW50RWxlbWVudCIsInJpY2hUdGFFbGVtZW50IiwiZmluZEJ5SWQiLCJ0YXJnZXRJZCIsImZvdW5kIiwiY3JlYXRlVGV4dE5vZGUiLCJzZWxlY3RvciIsInN0YXJ0c1dpdGgiLCJwcm90b2NvbCIsImhvc3QiLCJob3N0bmFtZSIsImltcG9ydFNjcmlwdHMiLCJvcmlnaW5hbERlZmluZVByb3BlcnR5IiwiTW9ja1hNTEh0dHBSZXF1ZXN0IiwicmVhZHlTdGF0ZSIsInJlc3BvbnNlVGV4dCIsIndpdGhDcmVkZW50aWFscyIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsIm9uYWJvcnQiLCJvbnRpbWVvdXQiLCJfbWV0aG9kIiwiX3VybCIsIl9hc3luYyIsIl9yZXF1ZXN0SGVhZGVycyIsIl9hYm9ydGVkIiwiVU5TRU5UIiwiT1BFTkVEIiwiSEVBREVSU19SRUNFSVZFRCIsIkxPQURJTkciLCJET05FIiwiYXN5bmMiLCJfZmlyZVJlYWR5U3RhdGVDaGFuZ2UiLCJzZXRSZXF1ZXN0SGVhZGVyIiwiaGVhZGVyIiwiZmV0Y2hPcHRpb25zIiwiY29udHJvbGxlciIsIl9oYW5kbGVUaW1lb3V0IiwiX3RyeVBhcnNlSlNPTiIsImdldFJlc3BvbnNlSGVhZGVyIiwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIiwidHJhY2UiLCJsYW5ndWFnZXMiLCJwbGF0Zm9ybSIsIlVSTCIsImNyZWF0ZU9iamVjdFVSTCIsInN1YnN0ciIsInJldm9rZU9iamVjdFVSTCIsImNvbnRleHRNZW51c0luaXRpYWxpemVkIiwic2V0dXBDb250ZXh0TWVudXMiLCJjcmVhdGVBbGwiLCJ0aXRsZSIsImNvbnRleHRzIiwicmVtb3ZlQWxsIiwiX3VudXNlZDIiLCJvbkluc3RhbGxlZCIsInByb2Nlc3MiLCJlbnYiLCJOT0RFX0VOViIsIm5vdGlmaWNhdGlvbnMiLCJpY29uVXJsIiwiZWMiLCJlYSIsImJ1ZmZlciIsInNldFVuaW5zdGFsbFVSTCIsIlRSQU5TTEFUT1JfTUFOQUdFUiIsIl9jaHJvbWUkbm90aWZpY2F0aW9ucyIsIm9uQ2xpY2tlZCIsIm5vdGlmaWNhdGlvbklkIiwibWVudUl0ZW1JZCIsInNlbGVjdGlvblRleHQiLCJvcGVuT3B0aW9uc1BhZ2UiLCJvbkFjdGl2YXRlZCIsImFjdGl2ZUluZm8iLCJvblVwZGF0ZWQiLCJjaGFuZ2VJbmZvIiwiY29tbWFuZHMiLCJvbkNvbW1hbmQiLCJjb21tYW5kIiwibW9kdWxlIiwiaG90UmVsb2FkIiwiX2V2ZW50JHJlYXNvbiIsIl9ldmVudCRyZWFzb24yIiwiX2V2ZW50JGVycm9yIl0sInNvdXJjZVJvb3QiOiIifQ==