/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
/*!****************************!*\
  !*** ./src/popup/popup.js ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _edge_translate_translators__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @edge_translate/translators */ "../translators/dist/translators.es.js");
/* harmony import */ var common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/channel.js */ "./src/common/scripts/channel.js");
/* harmony import */ var common_scripts_common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/scripts/common.js */ "./src/common/scripts/common.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");





/**
 * Communication channel.
 */
const channel = new common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_1__["default"]();
const IS_CHROME = "safari" === "chrome";

// 获取下拉列表元素
let sourceLanguage = document.getElementById("sl");
let targetLanguage = document.getElementById("tl");
// 获取交换按钮
let exchangeButton = document.getElementById("exchange");
// 获取互译模式开关
let mutualTranslate = document.getElementById("mutual-translate");

/**
 * 初始化设置列表
 */
window.onload = function () {
  (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_2__.i18nHTML)();
  // Chrome가 아닌 브라우저에서는 전체 페이지 번역 UI 숨김
  if (!IS_CHROME) {
    const pageTranslateRow = document.getElementById("page-translate");
    if (pageTranslateRow) pageTranslateRow.style.display = "none";
  }
  let arrowUp = document.getElementById("arrow-up");
  let arrowDown = document.getElementById("arrow-down");
  arrowDown.setAttribute("title", chrome.i18n.getMessage("Unfold"));
  arrowUp.setAttribute("title", chrome.i18n.getMessage("Fold"));
  sourceLanguage.onchange = function () {
    // 如果源语言是自动判断语言类型(值是auto),则按钮显示灰色，避免用户点击,如果不是，则显示蓝色，可以点击
    judgeValue(exchangeButton, sourceLanguage);
    updateLanguageSetting(sourceLanguage.options[sourceLanguage.selectedIndex].value, targetLanguage.options[targetLanguage.selectedIndex].value);
    showSourceTarget(); // update source language and target language in input placeholder
  };
  targetLanguage.onchange = function () {
    updateLanguageSetting(sourceLanguage.options[sourceLanguage.selectedIndex].value, targetLanguage.options[targetLanguage.selectedIndex].value);
    showSourceTarget(); // update source language and target language in input placeholder
  };

  // 添加交换按钮对点击事件的监听
  exchangeButton.onclick = exchangeLanguage;

  // 添加互译模式开关的事件监听
  mutualTranslate.onchange = () => {
    (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)("OtherSettings", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
      let OtherSettings = result.OtherSettings;
      OtherSettings["MutualTranslate"] = mutualTranslate.checked;
      saveOption("OtherSettings", OtherSettings);
    });
    showSourceTarget();
  };

  // 获得用户之前选择的语言翻译选项和互译设置
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)(["languageSetting", "OtherSettings"], common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
    let OtherSettings = result.OtherSettings;
    let languageSetting = result.languageSetting;

    // 根据源语言设定更新
    if (languageSetting.sl === "auto") {
      mutualTranslate.disabled = true;
      mutualTranslate.parentElement.title = chrome.i18n.getMessage("MutualTranslationWarning");
      if (OtherSettings["MutualTranslate"]) {
        mutualTranslate.checked = false;
        mutualTranslate.onchange();
      }
    } else {
      mutualTranslate.checked = OtherSettings["MutualTranslate"];
      mutualTranslate.parentElement.title = "";
    }

    // languages是可选的源语言和目标语言的列表
    for (let language in _edge_translate_translators__WEBPACK_IMPORTED_MODULE_0__.LANGUAGES) {
      let value = language;
      let name = chrome.i18n.getMessage(_edge_translate_translators__WEBPACK_IMPORTED_MODULE_0__.LANGUAGES[language]);
      if (languageSetting && value == languageSetting.sl) {
        sourceLanguage.options.add(new Option(name, value, true, true));
      } else {
        sourceLanguage.options.add(new Option(name, value));
      }
      if (languageSetting && value == languageSetting.tl) {
        targetLanguage.options.add(new Option(name, value, true, true));
      } else {
        targetLanguage.options.add(new Option(name, value));
      }
    }
    showSourceTarget(); // show source language and target language in input placeholder
  });
  // 统一添加事件监听
  addEventListener();
};

/**
 * 监听展开语言设置的快捷键
 */
chrome.commands.onCommand.addListener(command => {
  switch (command) {
    case "change_language_setting":
      settingSwitch();
      break;
    case "exchange_source_target_lang":
      exchangeLanguage();
      break;
    case "change_mutual_translate":
      mutualTranslate.click();
      break;
    default:
      break;
  }
});

/**
 * 保存翻译语言设定
 *
 * @param {*} sourceLanguage 源语言
 * @param {*} targetLanguage 目标语言
 */
function updateLanguageSetting(sourceLanguage, targetLanguage) {
  // Update translator config.
  channel.emit("language_setting_update", {
    from: sourceLanguage,
    to: targetLanguage
  });
  saveOption("languageSetting", {
    sl: sourceLanguage,
    tl: targetLanguage
  });
  if (sourceLanguage === "auto") {
    mutualTranslate.checked = false;
    mutualTranslate.disabled = true;
    mutualTranslate.parentElement.title = chrome.i18n.getMessage("MutualTranslationWarning");
    mutualTranslate.onchange();
  } else if (mutualTranslate.disabled) {
    mutualTranslate.disabled = false;
    mutualTranslate.parentElement.title = "";
  }
}

/**
 * 保存一条设置项
 *
 * @param {*} key 设置项名
 * @param {*} value 设置项
 */
function saveOption(key, value) {
  let item = {};
  item[key] = value;
  chrome.storage.sync.set(item);
}

/**
 * 需要对页面中的元素添加事件监听时，请在此函数中添加
 */
function addEventListener() {
  document.getElementById("translateSubmit").addEventListener("click", translateSubmit);
  document.addEventListener("keypress", translatePreSubmit); // 对用户按下回车按键后的事件进行监听
  document.getElementById("setting-switch").addEventListener("click", settingSwitch);
  if (IS_CHROME) {
    document.getElementById("google-page-translate").addEventListener("click", () => {
      channel.emit("translate_page_google", {});
    });
  }
}

/**
 * block start
 * 事件监听的回调函数定义请在此区域中进
 */

/**
 * 负责在option页面中输入内容后进行翻译
 */
function translateSubmit() {
  let content = document.getElementById("translate_input").value;
  if (content.replace(/\s*/, "") !== "") {
    // 判断值是否为
    document.getElementById("hint_message").style.display = "none";

    // send message to background to translate content
    channel.request("translate", {
      text: content
    }).then(() => {
      setTimeout(() => {
        window.close(); // 展示结束后关闭option页面
      }, 0);
    });
  } // 提示输入的内容是
  else document.getElementById("hint_message").style.display = "inline";
}

/**
 *
 * 如果源语言是自动判断语言类型(值是auto),则按钮显示灰色，避免用户点击
 *
 * @param {*HTMLElement} exchangeButton 特定的一个element,是一个交换按钮图
 * @param {*HTMLElement} sourceLanguage 特定的一个element,源语言的选项
 */
function judgeValue(exchangeButton, sourceLanguage) {
  if (sourceLanguage.value === "auto") exchangeButton.style.color = "gray";else exchangeButton.style.color = "#4a8cf7";
}

/**
 * 交换源语言和目标语言
 */
function exchangeLanguage() {
  if (sourceLanguage.value !== "auto") {
    let tempValue = targetLanguage.value;
    targetLanguage.value = sourceLanguage.value;
    sourceLanguage.value = tempValue;
    updateLanguageSetting(sourceLanguage.value, targetLanguage.value);
    showSourceTarget(); // update source language and target language in input placeholder
  }
}

/**
 * 负责在option中隐藏或显示设置选项
 */
function settingSwitch() {
  let setting = document.getElementById("setting");
  let arrowUp = document.getElementById("arrow-up");
  let arrowDown = document.getElementById("arrow-down");
  if (!setting.style.display || setting.style.display == "none") {
    setting.style.display = "block";
    arrowDown.style.display = "none";
    arrowUp.style.display = "inline";
    document.getElementById("tl").focus(); // after show settings block, the language element <select> will be auto focused
    judgeValue(exchangeButton, sourceLanguage);
  } else {
    setting.style.display = "none";
    arrowDown.style.display = "inline";
    arrowUp.style.display = "none";
    document.getElementById("translate_input").focus(); // after settings block disappear, the translation element <input> will be auto focused
  }
}

/**
 * 判断如果按下的是按钮是enter键，就调用翻译的函数
 */
function translatePreSubmit(event) {
  let int_keycode = event.charCode || event.keyCode;
  if (int_keycode == "13") {
    translateSubmit();
  }
}

/**
 * show source language and target language hint in placeholder of input element
 */
function showSourceTarget() {
  let inputElement = document.getElementById("translate_input");
  let sourceLanguageString = sourceLanguage.options[sourceLanguage.selectedIndex].text;
  let targetLanguageString = targetLanguage.options[targetLanguage.selectedIndex].text;
  if (sourceLanguage.options[sourceLanguage.selectedIndex].value === "auto" || !mutualTranslate.checked) {
    inputElement.placeholder = `${sourceLanguageString} ==> ${targetLanguageString}`;
  } else {
    inputElement.placeholder = `${sourceLanguageString} <=> ${targetLanguageString}`;
  }
}

/**
 * end block
 */
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsSUFBSTtFQUNUQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsV0FBVyxFQUFFLElBQUk7RUFDakJDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLFFBQVEsRUFBRSxJQUFJO0VBQ2QsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxLQUFLO0VBQ1ZDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLElBQUk7RUFDVEMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxLQUFLO0VBQ1YsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxLQUFLO0VBQ1QsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZCxPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJ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TixHQUFHLEVBQUNzTixDQUFDO01BQUNPLE1BQU0sRUFBQztJQUFLLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUMrRCxJQUFJLEdBQUMsQ0FBQzlELENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUdULENBQUMsQ0FBQztNQUFDLEdBQUdTLENBQUM7TUFBQzlOLEdBQUcsRUFBQ3NOLENBQUM7TUFBQ1MsSUFBSSxFQUFDUixDQUFDO01BQUNNLE1BQU0sRUFBQztJQUFNLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUNnRSxHQUFHLEdBQUMsQ0FBQy9ELENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUdULENBQUMsQ0FBQztNQUFDLEdBQUdTLENBQUM7TUFBQzlOLEdBQUcsRUFBQ3NOLENBQUM7TUFBQ1MsSUFBSSxFQUFDUixDQUFDO01BQUNNLE1BQU0sRUFBQztJQUFLLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUNpRSxLQUFLLEdBQUMsQ0FBQ2hFLENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEdBQUMsQ0FBQyxDQUFDLEtBQUdULENBQUMsQ0FBQztNQUFDLEdBQUdTLENBQUM7TUFBQzlOLEdBQUcsRUFBQ3NOLENBQUM7TUFBQ1MsSUFBSSxFQUFDUixDQUFDO01BQUNNLE1BQU0sRUFBQztJQUFPLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUN0TCxNQUFNLEdBQUMsQ0FBQ3VMLENBQUMsRUFBQ0MsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHRixDQUFDLENBQUM7TUFBQyxHQUFHRSxDQUFDO01BQUN2TixHQUFHLEVBQUNzTixDQUFDO01BQUNPLE1BQU0sRUFBQztJQUFRLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUNrRSxJQUFJLEdBQUMsQ0FBQ2pFLENBQUMsRUFBQ0MsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHRixDQUFDLENBQUM7TUFBQyxHQUFHRSxDQUFDO01BQUN2TixHQUFHLEVBQUNzTixDQUFDO01BQUNPLE1BQU0sRUFBQztJQUFNLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUNtRSxPQUFPLEdBQUMsQ0FBQ2xFLENBQUMsRUFBQ0MsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHRixDQUFDLENBQUM7TUFBQyxHQUFHRSxDQUFDO01BQUN2TixHQUFHLEVBQUNzTixDQUFDO01BQUNPLE1BQU0sRUFBQztJQUFTLENBQUMsQ0FBQyxFQUFDUixDQUFDLENBQUNWLFFBQVEsR0FBQztNQUFDc0IsT0FBTyxFQUFDO1FBQUN3RCxNQUFNLEVBQUMsQ0FBQyxDQUFDO1FBQUN2VCxHQUFHLEVBQUMsQ0FBQyxDQUFDO1FBQUNrVCxJQUFJLEVBQUM7VUFBQyxjQUFjLEVBQUM7UUFBa0IsQ0FBQztRQUFDQyxHQUFHLEVBQUM7VUFBQyxjQUFjLEVBQUM7UUFBa0IsQ0FBQztRQUFDQyxLQUFLLEVBQUM7VUFBQyxjQUFjLEVBQUM7UUFBa0I7TUFBQyxDQUFDO01BQUNuRCxPQUFPLEVBQUMsQ0FBQztNQUFDRyxZQUFZLEVBQUMsTUFBTTtNQUFDRSxPQUFPLEVBQUMsRUFBRTtNQUFDRSxjQUFjLEVBQUNwQixDQUFDLElBQUVBLENBQUMsSUFBRSxHQUFHLElBQUVBLENBQUMsR0FBQztJQUFHLENBQUMsRUFBQ0QsQ0FBQyxDQUFDcUUsWUFBWSxHQUFDO01BQUNoVCxPQUFPLEVBQUM7UUFBQ2lULEdBQUcsRUFBQ0EsQ0FBQSxLQUFJLENBQUMsQ0FBQztRQUFDQyxLQUFLLEVBQUNBLENBQUEsS0FBSSxDQUFDO01BQUMsQ0FBQztNQUFDZCxRQUFRLEVBQUM7UUFBQ2EsR0FBRyxFQUFDQSxDQUFBLEtBQUksQ0FBQyxDQUFDO1FBQUNDLEtBQUssRUFBQ0EsQ0FBQSxLQUFJLENBQUM7TUFBQztJQUFDLENBQUMsRUFBQ3ZFLENBQUMsQ0FBQ3dFLE1BQU0sR0FBQyxDQUFDdkUsQ0FBQyxHQUFDLENBQUMsQ0FBQyxLQUFHO01BQUMsTUFBTUMsQ0FBQyxHQUFDSyxDQUFDLENBQUMsQ0FBQztNQUFDLE9BQU9yQixNQUFNLENBQUN1RixNQUFNLENBQUN2RSxDQUFDLENBQUNaLFFBQVEsRUFBQ1csQ0FBQyxDQUFDLEVBQUNDLENBQUM7SUFBQSxDQUFDLEVBQUNGLENBQUMsQ0FBQzBFLFlBQVksR0FBQ3pFLENBQUMsSUFBRUEsQ0FBQyxLQUFHQSxDQUFDLENBQUMyRCxTQUFTLEtBQUcsU0FBUyxJQUFFM0QsQ0FBQyxDQUFDc0QsTUFBTSxJQUFFdEQsQ0FBQyxDQUFDeUQsSUFBSSxDQUFDLEVBQUMxRCxDQUFDO0VBQUEsQ0FBQztFQUFDMkUsQ0FBQyxHQUFDcEUsQ0FBQyxDQUFDLENBQUM7RUFBQ3FFLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLGFBQWEsQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsT0FBTyxFQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsT0FBTyxFQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsU0FBUyxFQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsU0FBUyxFQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxDQUFDO0VBQUNDLENBQUMsR0FBQztJQUFDNVAsRUFBRSxFQUFDLENBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxhQUFhLENBQUM7SUFBQ0UsRUFBRSxFQUFDLENBQUMsT0FBTyxFQUFDLE1BQU0sRUFBQyxZQUFZLENBQUM7SUFBQ0UsRUFBRSxFQUFDLENB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QUFLLENBQUNHLE1BQU0sSUFBRSxJQUFJLENBQUNILEtBQUssQ0FBQ0ksS0FBSyxDQUFDLENBQUM7RUFBQTtBQUFDO0FBQUMsTUFBTXRPLENBQUMsR0FBQyxDQUFDLENBQUMsTUFBTSxFQUFDLE1BQU0sQ0FBQyxFQUFDLENBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsT0FBTyxFQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLEtBQUssQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsS0FBSyxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFDLElBQUksQ0FBQyxDQUFDO0FBQUMsTUFBTXVPLENBQUM7RUFBQzNhLFdBQVdBLENBQUEsRUFBRTtJQUFDMkQsQ0FBQyxDQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsQ0FBQyxNQUFNLEVBQUMsVUFBVSxDQUFDLENBQUM7SUFBQ0EsQ0FBQyxDQUFDLElBQUksRUFBQyxXQUFXLEVBQUMsK0JBQStCLENBQUM7SUFBQ0EsQ0FBQyxDQUFDLElBQUksRUFBQyxNQUFNLEVBQUMsbUNBQW1DLENBQUM7SUFBQ0EsQ0FBQyxDQUFDLElBQUksRUFBQyxlQUFlLEVBQUMsR0FBRyxJQUFJLENBQUMwUyxJQUFJLG1GQUFtRixDQUFDO0lBQUMxUyxDQUFDLENBQUMsSUFBSSxFQUFDLFNBQVMsRUFBQyxHQUFHLElBQUksQ0FBQzBTLElBQUksMEJBQTBCLENBQUM7SUFBQzFTLENBQUMsQ0FBQyxJQUFJLEVBQUMsd0JBQXdCLEVBQUMsR0FBRyxJQUFJLENBQUMwUyxJQUFJLG1IQUFtSCxDQUFDO0lBQUMxUyxDQUFDLENBQUMsSUFBSSxFQUFDLGtCQUFrQixFQUFDLEdBQUcsSUFBSSxDQUFDMFMsSUFBSSxzQ0FBc0MsQ0FBQztJQUFDMVMsQ0FBQyxDQUFDLElBQUksRUFBQyxhQUFhLEVBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQ0EsQ0FBQyxDQUFDLElBQUksRUFBQyxhQUFhLEVBQUMsSUFBSXpELEdBQUcsQ0FBQ2tNLENBQUMsQ0FBQyxDQUFDO0lBQUN6SSxDQUFDLENBQUMsSUFBSSxFQUFDLGFBQWEsRUFBQyxJQUFJekQsR0FBRyxDQUFDa00sQ0FBQyxDQUFDSCxHQUFHLENBQUMsQ0FBQyxDQUFDd0UsQ0FBQyxFQUFDQyxDQUFDLENBQUMsS0FBRyxDQUFDQSxDQUFDLEVBQUNELENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFDOU0sQ0FBQyxDQUFDLElBQUksRUFBQyxPQUFPLEVBQUMsSUFBSXFTLEtBQUssQ0FBRCxDQUFDLENBQUM7RUFBQTtFQUFDNEUsVUFBVUEsQ0FBQ25LLENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEVBQUM7SUFBQ1AsQ0FBQyxHQUFDMUwsTUFBTSxDQUFDMEwsQ0FBQyxDQUFDLElBQUUsQ0FBQztJQUFDLElBQUlTLENBQUMsR0FBQyxFQUFFO01BQUNFLENBQUMsR0FBQyxDQUFDO01BQUNFLENBQUMsR0FBQyxDQUFDO0lBQUMsT0FBS0EsQ0FBQyxHQUFDZCxDQUFDLENBQUM3TSxNQUFNLEVBQUMyTixDQUFDLEVBQUUsRUFBQztNQUFDLElBQUlDLENBQUMsR0FBQ2YsQ0FBQyxDQUFDb0ssVUFBVSxDQUFDdEosQ0FBQyxDQUFDO01BQUMsR0FBRyxHQUFDQyxDQUFDLEdBQUNMLENBQUMsQ0FBQ0UsQ0FBQyxFQUFFLENBQUMsR0FBQ0csQ0FBQyxJQUFFLElBQUksR0FBQ0EsQ0FBQyxHQUFDTCxDQUFDLENBQUNFLENBQUMsRUFBRSxDQUFDLEdBQUNHLENBQUMsSUFBRSxDQUFDLEdBQUMsR0FBRyxJQUFFLENBQUNBLENBQUMsR0FBQyxLQUFLLEtBQUcsS0FBSyxJQUFFRCxDQUFDLEdBQUMsQ0FBQyxHQUFDZCxDQUFDLENBQUM3TSxNQUFNLElBQUUsQ0FBQzZNLENBQUMsQ0FBQ29LLFVBQVUsQ0FBQ3RKLENBQUMsR0FBQyxDQUFDLENBQUMsR0FBQyxLQUFLLEtBQUcsS0FBSyxJQUFFQyxDQUFDLEdBQUMsS0FBSyxJQUFFLENBQUNBLENBQUMsR0FBQyxJQUFJLEtBQUcsRUFBRSxDQUFDLElBQUVmLENBQUMsQ0FBQ29LLFVBQVUsQ0FBQyxFQUFFdEosQ0FBQyxDQUFDLEdBQUMsSUFBSSxDQUFDLEVBQUNKLENBQUMsQ0FBQ0UsQ0FBQyxFQUFFLENBQUMsR0FBQ0csQ0FBQyxJQUFFLEVBQUUsR0FBQyxHQUFHLEVBQUNMLENBQUMsQ0FBQ0UsQ0FBQyxFQUFFLENBQUMsR0FBQ0csQ0FBQyxJQUFFLEVBQUUsR0FBQyxFQUFFLEdBQUMsR0FBRyxJQUFFTCxDQUFDLENBQUNFLENBQUMsRUFBRSxDQUFDLEdBQUNHLENBQUMsSUFBRSxFQUFFLEdBQUMsR0FBRyxFQUFDTCxDQUFDLENBQUNFLENBQUMsRUFBRSxDQUFDLEdBQUNHLENBQUMsSUFBRSxDQUFDLEdBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQyxFQUFDTCxDQUFDLENBQUNFLENBQUMsRUFBRSxDQUFDLEdBQUNHLENBQUMsR0FBQyxFQUFFLEdBQUMsR0FBRyxDQUFDO0lBQUE7SUFBQyxLQUFJZixDQUFDLEdBQUNDLENBQUMsRUFBQ1csQ0FBQyxHQUFDLENBQUMsRUFBQ0EsQ0FBQyxHQUFDRixDQUFDLENBQUN2TixNQUFNLEVBQUN5TixDQUFDLEVBQUUsRUFBQ1osQ0FBQyxJQUFFVSxDQUFDLENBQUNFLENBQUMsQ0FBQyxFQUFDWixDQUFDLEdBQUMsSUFBSSxDQUFDcUssTUFBTSxDQUFDckssQ0FBQyxFQUFDLFFBQVEsQ0FBQztJQUFDLE9BQU9BLENBQUMsR0FBQyxJQUFJLENBQUNxSyxNQUFNLENBQUNySyxDQUFDLEVBQUMsV0FBVyxDQUFDLEVBQUNBLENBQUMsSUFBRXpMLE1BQU0sQ0FBQ2lNLENBQUMsQ0FBQyxJQUFFLENBQUMsRUFBQyxDQUFDLEdBQUNSLENBQUMsS0FBR0EsQ0FBQyxHQUFDLENBQUNBLENBQUMsR0FBQyxVQUFVLElBQUUsVUFBVSxDQUFDLEVBQUNBLENBQUMsSUFBRSxHQUFHLEVBQUNBLENBQUMsQ0FBQ3lCLFFBQVEsQ0FBQyxDQUFDLEdBQUMsR0FBRyxJQUFFekIsQ0FBQyxHQUFDQyxDQUFDLENBQUM7RUFBQTtFQUFDb0ssTUFBTUEsQ0FBQ3JLLENBQUMsRUFBQ0MsQ0FBQyxFQUFDO0lBQUMsS0FBSSxJQUFJTyxDQUFDLEdBQUMsQ0FBQyxFQUFDQSxDQUFDLEdBQUNQLENBQUMsQ0FBQzlNLE1BQU0sR0FBQyxDQUFDLEVBQUNxTixDQUFDLElBQUUsQ0FBQyxFQUFDO01BQUMsSUFBSUUsQ0FBQyxHQUFDVCxDQUFDLENBQUNxSyxNQUFNLENBQUM5SixDQUFDLEdBQUMsQ0FBQyxDQUFDO1FBQUNFLENBQUMsR0FBQyxHQUFHLElBQUVBLENBQUMsR0FBQ0EsQ0FBQyxDQUFDMEosVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQzdWLE1BQU0sQ0FBQ21NLENBQUMsQ0FBQztRQUFDQSxDQUFDLEdBQUNULENBQUMsQ0FBQ3FLLE1BQU0sQ0FBQzlKLENBQUMsR0FBQyxDQUFDLENBQUMsSUFBRSxHQUFHLEdBQUNSLENBQUMsS0FBR1UsQ0FBQyxHQUFDVixDQUFDLElBQUVVLENBQUM7TUFBQ1YsQ0FBQyxHQUFDQyxDQUFDLENBQUNxSyxNQUFNLENBQUM5SixDQUFDLENBQUMsSUFBRSxHQUFHLEdBQUNSLENBQUMsR0FBQ1UsQ0FBQyxHQUFDLFVBQVUsR0FBQ1YsQ0FBQyxHQUFDVSxDQUFDO0lBQUE7SUFBQyxPQUFPVixDQUFDO0VBQUE7RUFBQyxNQUFNdUssU0FBU0EsQ0FBQSxFQUFFO0lBQUMsSUFBSXZLLENBQUMsR0FBQyxDQUFDLE1BQU0wRSxDQUFDLENBQUM5VCxHQUFHLENBQUMsSUFBSSxDQUFDNlUsU0FBUyxDQUFDLEVBQUVoRixJQUFJO01BQUNSLENBQUMsR0FBQyxDQUFDRCxDQUFDLENBQUNuTixLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDMlgsT0FBTyxDQUFDLHNCQUFzQixFQUFDLEVBQUUsQ0FBQyxDQUFDM1gsS0FBSyxDQUFDLFdBQVcsQ0FBQztJQUFDb04sQ0FBQyxJQUFFLElBQUksQ0FBQ3dLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQ2xXLE1BQU0sQ0FBQzBMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQ3dLLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBQ2xXLE1BQU0sQ0FBQzBMLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDMUwsTUFBTSxDQUFDMEwsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUdBLENBQUMsR0FBQ0QsQ0FBQyxDQUFDbk4sS0FBSyxDQUFDLGdDQUFnQyxDQUFDLEVBQUNvTixDQUFDLEtBQUcsSUFBSSxDQUFDd0ssR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDbFcsTUFBTSxDQUFDMEwsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsSUFBSSxDQUFDd0ssR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFDbFcsTUFBTSxDQUFDMEwsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUFBO0VBQUN5SyxRQUFRQSxDQUFBLEVBQUU7SUFBQyxJQUFJLENBQUNDLFdBQVcsR0FBQyxDQUFDLENBQUMsRUFBQ3RJLFVBQVUsQ0FBQyxNQUFJO01BQUMsSUFBSSxDQUFDc0ksV0FBVyxHQUFDLENBQUMsQ0FBQztJQUFBLENBQUMsRUFBQyxFQUFFLEdBQUMsRUFBRSxHQUFDLEdBQUcsQ0FBQztFQUFBO0VBQUNDLGlCQUFpQkEsQ0FBQzVLLENBQUMsRUFBQztJQUFDLElBQUlDLENBQUMsR0FBQyxtQkFBbUI7SUFBQyxPQUFPQSxDQUFDLElBQUUsT0FBTyxJQUFJLENBQUNrSyxVQUFVLENBQUNuSyxDQUFDLEVBQUMsSUFBSSxDQUFDeUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQ0EsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU1qRCxrQkFBa0IsQ0FBQ3hILENBQUMsQ0FBQyxFQUFFLEVBQUMsSUFBSSxDQUFDMkssV0FBVyxHQUFDLElBQUksQ0FBQ0Usc0JBQXNCLEdBQUM1SyxDQUFDLEdBQUMsSUFBSSxDQUFDNkssYUFBYSxHQUFDN0ssQ0FBQztFQUFBO0VBQUM4SyxvQkFBb0JBLENBQUMvSyxDQUFDLEVBQUNDLENBQUMsRUFBQ08sQ0FBQyxFQUFDO0lBQUMsSUFBSUUsQ0FBQyxHQUFDLE9BQU8sSUFBSSxDQUFDaUgsV0FBVyxDQUFDL1csR0FBRyxDQUFDcVAsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDMEgsV0FBVyxDQUFDL1csR0FBRyxDQUFDNFAsQ0FBQyxDQUFDLEVBQUU7SUFBQyxPQUFPRSxDQUFDLElBQUUsT0FBTyxJQUFJLENBQUN5SixVQUFVLENBQUNuSyxDQUFDLEVBQUMsSUFBSSxDQUFDeUssR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFDLElBQUksQ0FBQ0EsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU1qRCxrQkFBa0IsQ0FBQ3hILENBQUMsQ0FBQyxFQUFFLEVBQUMsSUFBSSxDQUFDMkssV0FBVyxHQUFDLElBQUksQ0FBQ0Usc0JBQXNCLEdBQUNuSyxDQUFDLEdBQUMsSUFBSSxDQUFDb0ssYUFBYSxHQUFDcEssQ0FBQztFQUFBO0VBQUNzSyxpQkFBaUJBLENBQUNoTCxDQUFDLEVBQUM7SUFBQyxPQUFPLElBQUksQ0FBQzJLLFdBQVcsR0FBQyxJQUFJLENBQUN2QixXQUFXLENBQUN4WSxHQUFHLENBQUNvUCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRSxFQUFFLEdBQUNBLENBQUMsQ0FBQ2lMLFNBQVMsQ0FBQ0MsaUJBQWlCLEdBQUMsSUFBSSxDQUFDOUIsV0FBVyxDQUFDeFksR0FBRyxDQUFDb1AsQ0FBQyxDQUFDaUwsU0FBUyxDQUFDQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLEVBQUUsR0FBQyxJQUFJLENBQUM5QixXQUFXLENBQUN4WSxHQUFHLENBQUNvUCxDQUFDLENBQUNpTCxTQUFTLENBQUNFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFLEVBQUU7RUFBQTtFQUFDQyxpQkFBaUJBLENBQUNwTCxDQUFDLEVBQUM7SUFBQyxNQUFNQyxDQUFDLEdBQUM7TUFBQy9CLFlBQVksRUFBQyxFQUFFO01BQUNDLFdBQVcsRUFBQztJQUFFLENBQUM7SUFBQyxJQUFHNkIsQ0FBQyxDQUFDcUwsU0FBUyxFQUFDO01BQUNwTCxDQUFDLENBQUM5QixXQUFXLEdBQUMsRUFBRSxFQUFDOEIsQ0FBQyxDQUFDL0IsWUFBWSxHQUFDLEVBQUU7TUFBQyxJQUFJc0MsQ0FBQyxHQUFDLENBQUM7TUFBQyxPQUFLQSxDQUFDLEdBQUNSLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQ2xZLE1BQU0sSUFBRTZNLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQzdLLENBQUMsQ0FBQyxDQUFDOEssS0FBSyxFQUFDOUssQ0FBQyxFQUFFLEVBQUNQLENBQUMsQ0FBQzlCLFdBQVcsSUFBRTZCLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQzdLLENBQUMsQ0FBQyxDQUFDOEssS0FBSyxFQUFDckwsQ0FBQyxDQUFDL0IsWUFBWSxJQUFFOEIsQ0FBQyxDQUFDcUwsU0FBUyxDQUFDN0ssQ0FBQyxDQUFDLENBQUMrSyxJQUFJO01BQUMvSyxDQUFDLEdBQUNSLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQ2xZLE1BQU0sS0FBRzZNLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQzdLLENBQUMsQ0FBQyxDQUFDZ0wsUUFBUSxLQUFHdkwsQ0FBQyxDQUFDN0IsY0FBYyxHQUFDNEIsQ0FBQyxDQUFDcUwsU0FBUyxDQUFDN0ssQ0FBQyxDQUFDLENBQUNnTCxRQUFRLENBQUMsRUFBQ3hMLENBQUMsQ0FBQ3FMLFNBQVMsQ0FBQzdLLENBQUMsQ0FBQyxDQUFDaUwsWUFBWSxLQUFHeEwsQ0FBQyxDQUFDNUIsY0FBYyxHQUFDMkIsQ0FBQyxDQUFDcUwsU0FBUyxDQUFDN0ssQ0FBQyxDQUFDLENBQUNpTCxZQUFZLENBQUMsQ0FBQztJQUFBO0lBQUMsSUFBR3pMLENBQUMsQ0FBQzBMLElBQUksRUFBQztNQUFDekwsQ0FBQyxDQUFDM0IsZ0JBQWdCLEdBQUMsRUFBRTtNQUFDLEtBQUksSUFBSWtDLENBQUMsSUFBSVIsQ0FBQyxDQUFDMEwsSUFBSSxFQUFDLEtBQUksSUFBSWhMLENBQUMsSUFBSUYsQ0FBQyxDQUFDbUwsS0FBSyxFQUFDMUwsQ0FBQyxDQUFDM0IsZ0JBQWdCLENBQUNpQixJQUFJLENBQUM7UUFBQ25NLEdBQUcsRUFBQ29OLENBQUMsQ0FBQ3BOLEdBQUc7UUFBQ3dULE9BQU8sRUFBQ2xHLENBQUMsQ0FBQ2tMLElBQUk7UUFBQy9FLFFBQVEsRUFBQ25HLENBQUMsQ0FBQ21MO01BQW1CLENBQUMsQ0FBQztJQUFBO0lBQUMsSUFBRzdMLENBQUMsQ0FBQ3pCLFdBQVcsRUFBQztNQUFDMEIsQ0FBQyxDQUFDMUIsV0FBVyxHQUFDLEVBQUU7TUFBQyxLQUFJLElBQUlpQyxDQUFDLElBQUlSLENBQUMsQ0FBQ3pCLFdBQVcsRUFBQyxLQUFJLElBQUltQyxDQUFDLElBQUlGLENBQUMsQ0FBQ21MLEtBQUssRUFBQzFMLENBQUMsQ0FBQzFCLFdBQVcsQ0FBQ2dCLElBQUksQ0FBQztRQUFDbk0sR0FBRyxFQUFDb04sQ0FBQyxDQUFDcE4sR0FBRztRQUFDd1QsT0FBTyxFQUFDbEcsQ0FBQyxDQUFDb0wsS0FBSztRQUFDakYsUUFBUSxFQUFDLEVBQUU7UUFBQ2tGLE9BQU8sRUFBQ3JMLENBQUMsQ0FBQ3FMO01BQU8sQ0FBQyxDQUFDO0lBQUE7SUFBQyxJQUFHL0wsQ0FBQyxDQUFDeEIsUUFBUSxFQUFDO01BQUN5QixDQUFDLENBQUN6QixRQUFRLEdBQUMsRUFBRTtNQUFDLEtBQUksSUFBSWdDLENBQUMsSUFBSVIsQ0FBQyxDQUFDeEIsUUFBUSxDQUFDdU4sT0FBTyxFQUFDOUwsQ0FBQyxDQUFDekIsUUFBUSxDQUFDZSxJQUFJLENBQUM7UUFBQ2xMLE1BQU0sRUFBQ21NLENBQUMsQ0FBQ2tDLElBQUk7UUFBQ3dFLE1BQU0sRUFBQztNQUFJLENBQUMsQ0FBQztNQUFDakgsQ0FBQyxDQUFDekIsUUFBUSxDQUFDd04sSUFBSSxDQUFDLENBQUN4TCxDQUFDLEVBQUNFLENBQUMsS0FBR0YsQ0FBQyxDQUFDbk0sTUFBTSxHQUFDcU0sQ0FBQyxDQUFDck0sTUFBTSxHQUFDLENBQUMsR0FBQ21NLENBQUMsQ0FBQ25NLE1BQU0sS0FBR3FNLENBQUMsQ0FBQ3JNLE1BQU0sR0FBQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQTtJQUFDLE9BQU80TCxDQUFDO0VBQUE7RUFBQ2dNLG1CQUFtQkEsQ0FBQ2pNLENBQUMsRUFBQztJQUFDLE1BQU1DLENBQUMsR0FBQztNQUFDL0IsWUFBWSxFQUFDLEVBQUU7TUFBQ0MsV0FBVyxFQUFDO0lBQUUsQ0FBQztJQUFDLEtBQUksSUFBSXFDLENBQUMsR0FBQyxDQUFDLEVBQUNBLENBQUMsR0FBQ1IsQ0FBQyxDQUFDN00sTUFBTSxFQUFDcU4sQ0FBQyxFQUFFLEVBQUMsSUFBR1IsQ0FBQyxDQUFDUSxDQUFDLENBQUMsRUFBQztNQUFDLE1BQU1FLENBQUMsR0FBQ1YsQ0FBQyxDQUFDUSxDQUFDLENBQUM7TUFBQyxRQUFPQSxDQUFDO1FBQUUsS0FBSyxDQUFDO1VBQUM7WUFBQyxJQUFJSSxDQUFDLEdBQUMsRUFBRTtjQUFDRSxDQUFDLEdBQUMsRUFBRTtjQUFDQyxDQUFDLEdBQUNMLENBQUMsQ0FBQ3ZOLE1BQU0sR0FBQyxDQUFDO1lBQUMsS0FBSSxJQUFJOE4sQ0FBQyxHQUFDLENBQUMsRUFBQ0EsQ0FBQyxJQUFFRixDQUFDLEVBQUNFLENBQUMsRUFBRSxFQUFDTCxDQUFDLENBQUNyQixJQUFJLENBQUNtQixDQUFDLENBQUNPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUNILENBQUMsQ0FBQ3ZCLElBQUksQ0FBQ21CLENBQUMsQ0FBQ08sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQ2hCLENBQUMsQ0FBQzlCLFdBQVcsR0FBQ3lDLENBQUMsQ0FBQ2xGLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBQ3VFLENBQUMsQ0FBQy9CLFlBQVksR0FBQzRDLENBQUMsQ0FBQ3BGLElBQUksQ0FBQyxFQUFFLENBQUM7WUFBQyxJQUFHO2NBQUNxRixDQUFDLEdBQUMsQ0FBQyxLQUFHTCxDQUFDLENBQUNLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFFTCxDQUFDLENBQUNLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDNU4sTUFBTSxHQUFDLENBQUMsS0FBRzhNLENBQUMsQ0FBQzdCLGNBQWMsR0FBQ3NDLENBQUMsQ0FBQ0ssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQ0wsQ0FBQyxDQUFDSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBRUwsQ0FBQyxDQUFDSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzVOLE1BQU0sR0FBQyxDQUFDLEtBQUc4TSxDQUFDLENBQUM1QixjQUFjLEdBQUNxQyxDQUFDLENBQUNLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQSxDQUFDLE9BQUssQ0FBQztZQUFDO1VBQUs7UUFBQyxLQUFLLENBQUM7VUFBQ2QsQ0FBQyxDQUFDM0IsZ0JBQWdCLEdBQUMsSUFBSVUsS0FBSyxDQUFELENBQUMsRUFBQzBCLENBQUMsQ0FBQ3NDLE9BQU8sQ0FBQ3BDLENBQUMsSUFBRVgsQ0FBQyxDQUFDM0IsZ0JBQWdCLENBQUNpQixJQUFJLENBQUM7WUFBQ25NLEdBQUcsRUFBQ3dOLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQ2dHLE9BQU8sRUFBQ2hHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2xGLElBQUksQ0FBQyxJQUFJO1VBQUMsQ0FBQyxDQUFDLENBQUM7VUFBQztRQUFNLEtBQUssRUFBRTtVQUFDdUUsQ0FBQyxDQUFDMUIsV0FBVyxHQUFDLElBQUlTLEtBQUssQ0FBRCxDQUFDLEVBQUMwQixDQUFDLENBQUNzQyxPQUFPLENBQUNwQyxDQUFDLElBQUU7WUFBQ0EsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDb0MsT0FBTyxDQUFDbEMsQ0FBQyxJQUFFO2NBQUNiLENBQUMsQ0FBQzFCLFdBQVcsQ0FBQ2dCLElBQUksQ0FBQztnQkFBQ25NLEdBQUcsRUFBQ3dOLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUNnRyxPQUFPLEVBQUM5RixDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDaUwsT0FBTyxFQUFDakwsQ0FBQyxDQUFDLENBQUM7Y0FBQyxDQUFDLENBQUM7WUFBQSxDQUFDLENBQUM7VUFBQSxDQUFDLENBQUM7VUFBQztRQUFNLEtBQUssRUFBRTtVQUFDYixDQUFDLENBQUN6QixRQUFRLEdBQUMsSUFBSVEsS0FBSyxDQUFELENBQUMsRUFBQzBCLENBQUMsQ0FBQ3NDLE9BQU8sQ0FBQ3BDLENBQUMsSUFBRUEsQ0FBQyxDQUFDb0MsT0FBTyxDQUFDbEMsQ0FBQyxJQUFFYixDQUFDLENBQUN6QixRQUFRLENBQUNlLElBQUksQ0FBQztZQUFDbEwsTUFBTSxFQUFDLElBQUk7WUFBQzZTLE1BQU0sRUFBQ3BHLENBQUMsQ0FBQyxDQUFDO1VBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUFDO01BQUs7SUFBQztJQUFDLE9BQU9iLENBQUM7RUFBQTtFQUFDa0csb0JBQW9CQSxDQUFDbkcsQ0FBQyxFQUFDO0lBQUMsT0FBTyxJQUFJLENBQUMySyxXQUFXLEdBQUMsSUFBSSxDQUFDc0IsbUJBQW1CLENBQUNqTSxDQUFDLENBQUMsR0FBQyxJQUFJLENBQUNvTCxpQkFBaUIsQ0FBQ3BMLENBQUMsQ0FBQztFQUFBO0VBQUNnSixrQkFBa0JBLENBQUEsRUFBRTtJQUFDLE9BQU8sSUFBSS9VLEdBQUcsQ0FBQyxJQUFJLENBQUMwVCxXQUFXLENBQUN6SSxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQUE7RUFBQytKLE1BQU1BLENBQUNqSixDQUFDLEVBQUM7SUFBQyxNQUFNQyxDQUFDLEdBQUMsTUFBQUEsQ0FBQSxLQUFTO01BQUMsTUFBTU8sQ0FBQyxHQUFDLE1BQU1rRSxDQUFDLENBQUM5VCxHQUFHLENBQUMsSUFBSSxDQUFDZ2EsaUJBQWlCLENBQUM1SyxDQUFDLENBQUMsRUFBQztRQUFDb0IsY0FBYyxFQUFDVixDQUFDLElBQUVBLENBQUMsR0FBQztNQUFHLENBQUMsQ0FBQztNQUFDLElBQUdGLENBQUMsQ0FBQzRDLE1BQU0sS0FBRyxHQUFHLEVBQUMsT0FBTyxJQUFJLENBQUM0SCxpQkFBaUIsQ0FBQ3hLLENBQUMsQ0FBQ0MsSUFBSSxDQUFDO01BQUMsSUFBR0QsQ0FBQyxDQUFDNEMsTUFBTSxLQUFHLEdBQUcsSUFBRSxDQUFDLElBQUksQ0FBQ3VILFdBQVcsRUFBQyxPQUFPLElBQUksQ0FBQ0QsUUFBUSxDQUFDLENBQUMsRUFBQyxNQUFNLElBQUksQ0FBQ0gsU0FBUyxDQUFDLENBQUMsQ0FBQ3haLElBQUksQ0FBQ2tQLENBQUMsQ0FBQztNQUFDLE1BQUs7UUFBQzBELFNBQVMsRUFBQyxTQUFTO1FBQUNDLFNBQVMsRUFBQ3BELENBQUMsQ0FBQzRDLE1BQU07UUFBQ1MsUUFBUSxFQUFDLGdCQUFnQjtRQUFDd0YsUUFBUSxFQUFDO1VBQUNDLEdBQUcsRUFBQyxRQUFRO1VBQUNDLE1BQU0sRUFBQyxRQUFRO1VBQUM3RyxJQUFJLEVBQUMxQyxDQUFDO1VBQUN3SixJQUFJLEVBQUMsSUFBSTtVQUFDQyxFQUFFLEVBQUM7UUFBSTtNQUFDLENBQUM7SUFBQSxDQUFDO0lBQUMsT0FBT3hKLENBQUMsQ0FBQyxDQUFDO0VBQUE7RUFBQ3lKLFNBQVNBLENBQUMxSixDQUFDLEVBQUNDLENBQUMsRUFBQ08sQ0FBQyxFQUFDO0lBQUMsTUFBTUUsQ0FBQyxHQUFDLE1BQUFBLENBQUEsS0FBUztNQUFDLE1BQU1FLENBQUMsR0FBQyxNQUFNOEQsQ0FBQyxDQUFDOVQsR0FBRyxDQUFDLElBQUksQ0FBQ21hLG9CQUFvQixDQUFDL0ssQ0FBQyxFQUFDQyxDQUFDLEVBQUNPLENBQUMsQ0FBQyxFQUFDO1FBQUNZLGNBQWMsRUFBQ04sQ0FBQyxJQUFFQSxDQUFDLEdBQUM7TUFBRyxDQUFDLENBQUM7TUFBQyxJQUFHRixDQUFDLENBQUN3QyxNQUFNLEtBQUcsR0FBRyxFQUFDLE9BQU8sSUFBSSxDQUFDK0Msb0JBQW9CLENBQUN2RixDQUFDLENBQUNILElBQUksQ0FBQztNQUFDLElBQUdHLENBQUMsQ0FBQ3dDLE1BQU0sS0FBRyxHQUFHLElBQUUsQ0FBQyxJQUFJLENBQUN1SCxXQUFXLEVBQUMsT0FBTyxJQUFJLENBQUNELFFBQVEsQ0FBQyxDQUFDLEVBQUMsTUFBTSxJQUFJLENBQUNILFNBQVMsQ0FBQyxDQUFDLENBQUN4WixJQUFJLENBQUMyUCxDQUFDLENBQUM7TUFBQyxNQUFLO1FBQUNpRCxTQUFTLEVBQUMsU0FBUztRQUFDQyxTQUFTLEVBQUNoRCxDQUFDLENBQUN3QyxNQUFNO1FBQUNTLFFBQVEsRUFBQyxtQkFBbUI7UUFBQ3dGLFFBQVEsRUFBQztVQUFDQyxHQUFHLEVBQUMsUUFBUTtVQUFDQyxNQUFNLEVBQUMsV0FBVztVQUFDN0csSUFBSSxFQUFDMUMsQ0FBQztVQUFDd0osSUFBSSxFQUFDdkosQ0FBQztVQUFDd0osRUFBRSxFQUFDako7UUFBQztNQUFDLENBQUM7SUFBQSxDQUFDO0lBQUMsT0FBT0UsQ0FBQyxDQUFDLENBQUM7RUFBQTtFQUFDLE1BQU1pSixTQUFTQSxDQUFDM0osQ0FBQyxFQUFDQyxDQUFDLEVBQUNPLENBQUMsRUFBQztJQUFDLElBQUksQ0FBQ29KLGFBQWEsQ0FBQyxDQUFDO0lBQUMsSUFBSWxKLENBQUMsR0FBQ0YsQ0FBQyxLQUFHLE1BQU0sR0FBQyxLQUFLLEdBQUMsS0FBSztJQUFDLElBQUksQ0FBQ3FKLEtBQUssQ0FBQ0MsR0FBRyxHQUFDLEdBQUcsSUFBSSxDQUFDYSxXQUFXLEdBQUMsSUFBSSxDQUFDdUIsZ0JBQWdCLEdBQUMsSUFBSSxDQUFDQyxPQUFPLE1BQU0zRSxrQkFBa0IsQ0FBQ3hILENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQzJILFdBQVcsQ0FBQy9XLEdBQUcsQ0FBQ3FQLENBQUMsQ0FBQyxhQUFhUyxDQUFDLE9BQU8sSUFBSSxDQUFDeUosVUFBVSxDQUFDbkssQ0FBQyxFQUFDLElBQUksQ0FBQ3lLLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUNBLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO0lBQUMsSUFBRztNQUFDLE1BQU0sSUFBSSxDQUFDWixLQUFLLENBQUNFLElBQUksQ0FBQyxDQUFDO0lBQUEsQ0FBQyxRQUFNbkosQ0FBQyxFQUFDO01BQUMsTUFBSztRQUFDK0MsU0FBUyxFQUFDLFNBQVM7UUFBQ0MsU0FBUyxFQUFDLENBQUM7UUFBQ0MsUUFBUSxFQUFDakQsQ0FBQyxDQUFDN1EsT0FBTztRQUFDc1osUUFBUSxFQUFDO1VBQUNDLEdBQUcsRUFBQyxRQUFRO1VBQUNDLE1BQU0sRUFBQyxXQUFXO1VBQUM3RyxJQUFJLEVBQUMxQyxDQUFDO1VBQUN3SixJQUFJLEVBQUN2SixDQUFDO1VBQUN3SixFQUFFLEVBQUM7UUFBSTtNQUFDLENBQUM7SUFBQTtFQUFDO0VBQUNHLGFBQWFBLENBQUEsRUFBRTtJQUFDLElBQUksQ0FBQ0MsS0FBSyxDQUFDRyxNQUFNLElBQUUsSUFBSSxDQUFDSCxLQUFLLENBQUNJLEtBQUssQ0FBQyxDQUFDO0VBQUE7QUFBQztBQUFDLE1BQU1tQyxDQUFDLEdBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBQyxNQUFNLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLE9BQU8sRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsRUFBQyxDQUFDLElBQUksRUFBQyxJQUFJLENBQUMsQ0FBQztBQUFDLE1BQU1DLENBQUM7RUFBQzljLFdBQVdBLENBQUN5USxDQUFDLEVBQUNDLENBQUMsRUFBQztJQUFDL00sQ0FBQyxDQUFDLElBQUksRUFBQyxXQUFXLEVBQUMsa0NBQWtDLENBQUM7SUFBQ0EsQ0FBQyxDQUFDLElBQUksRUFBQyxhQUFhLEVBQUMsSUFBSXpELEdBQUcsQ0FBQzJjLENBQUMsQ0FBQyxDQUFDO0lBQUNsWixDQUFDLENBQUMsSUFBSSxFQUFDLGFBQWEsRUFBQyxJQUFJekQsR0FBRyxDQUFDMmMsQ0FBQyxDQUFDNVEsR0FBRyxDQUFDLENBQUMsQ0FBQ3dFLENBQUMsRUFBQ0MsQ0FBQyxDQUFDLEtBQUcsQ0FBQ0EsQ0FBQyxFQUFDRCxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFBQzlNLENBQUMsQ0FBQyxJQUFJLEVBQUMsY0FBYyxDQUFDO0lBQUNBLENBQUMsQ0FBQyxJQUFJLEVBQUMsV0FBVyxDQUFDO0lBQUNBLENBQUMsQ0FBQyxJQUFJLEVBQUMsYUFBYSxDQUFDO0lBQUMsSUFBSSxDQUFDb1osWUFBWSxHQUFDdE0sQ0FBQyxFQUFDLElBQUksQ0FBQ3VNLFNBQVMsR0FBQ3RNLENBQUMsRUFBQyxJQUFJLENBQUN1TSxZQUFZLENBQUMsQ0FBQztFQUFBO0VBQUNBLFlBQVlBLENBQUEsRUFBRTtJQUFDLElBQUksQ0FBQ0MsV0FBVyxHQUFDelosUUFBUSxDQUFDMFosYUFBYSxDQUFDLFFBQVEsQ0FBQyxFQUFDMVosUUFBUSxDQUFDNk8sSUFBSSxDQUFDOEssV0FBVyxDQUFDLElBQUksQ0FBQ0YsV0FBVyxDQUFDLEVBQUMsSUFBSSxDQUFDQSxXQUFXLENBQUMzQyxHQUFHLEdBQUMsSUFBSSxDQUFDckUsU0FBUztFQUFBO0VBQUN1RCxrQkFBa0JBLENBQUEsRUFBRTtJQUFDLE9BQU8sSUFBSS9VLEdBQUcsQ0FBQyxJQUFJLENBQUMwVCxXQUFXLENBQUN6SSxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQUE7RUFBQyxNQUFNK0osTUFBTUEsQ0FBQ2pKLENBQUMsRUFBQztJQUFDLE9BQU8sTUFBTSxJQUFJLENBQUNzTSxZQUFZLENBQUNyRCxNQUFNLENBQUNqSixDQUFDLENBQUM7RUFBQTtFQUFDLE1BQU0wSixTQUFTQSxDQUFDMUosQ0FBQyxFQUFDQyxDQUFDLEVBQUNPLENBQUMsRUFBQztJQUFDLElBQUc7TUFBQyxPQUFNO1FBQUNyQyxXQUFXLEVBQUMsTUFBTSxJQUFJN00sT0FBTyxDQUFDLENBQUNvUCxDQUFDLEVBQUNFLENBQUMsS0FBRztVQUFDLE1BQU1FLENBQUMsR0FBQ3VCLFVBQVUsQ0FBQyxNQUFJO2NBQUN6QixDQUFDLENBQUM7Z0JBQUN3QyxNQUFNLEVBQUMsR0FBRztnQkFBQ1MsUUFBUSxFQUFDO2NBQWtCLENBQUMsQ0FBQztZQUFBLENBQUMsRUFBQyxHQUFHLENBQUM7WUFBQzlDLENBQUMsR0FBQ0UsQ0FBQyxJQUFFO2NBQUMsQ0FBQ0EsQ0FBQyxDQUFDUixJQUFJLENBQUNwUSxJQUFJLElBQUU0USxDQUFDLENBQUNSLElBQUksQ0FBQ3BRLElBQUksS0FBRywrQkFBK0IsS0FBR3VjLE1BQU0sQ0FBQ0MsbUJBQW1CLENBQUMsU0FBUyxFQUFDOUwsQ0FBQyxDQUFDLEVBQUN5QixZQUFZLENBQUMxQixDQUFDLENBQUMsRUFBQ0csQ0FBQyxDQUFDUixJQUFJLENBQUMyQyxNQUFNLEtBQUcsR0FBRyxHQUFDMUMsQ0FBQyxDQUFDTyxDQUFDLENBQUNSLElBQUksQ0FBQ3pQLE1BQU0sQ0FBQyxHQUFDNFAsQ0FBQyxDQUFDSyxDQUFDLENBQUNSLElBQUksQ0FBQyxDQUFDO1lBQUEsQ0FBQztVQUFDbU0sTUFBTSxDQUFDRSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUMvTCxDQUFDLENBQUMsRUFBQyxJQUFJLENBQUMwTCxXQUFXLENBQUNNLGFBQWEsQ0FBQ0MsV0FBVyxDQUFDO1lBQUMzYyxJQUFJLEVBQUMsOEJBQThCO1lBQUNxQyxHQUFHLEVBQUMsR0FBRyxJQUFJLENBQUMrUyxTQUFTLElBQUksSUFBSSxDQUFDa0MsV0FBVyxDQUFDL1csR0FBRyxDQUFDcVAsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDMEgsV0FBVyxDQUFDL1csR0FBRyxDQUFDNFAsQ0FBQyxDQUFDLElBQUlnSCxrQkFBa0IsQ0FBQ3hILENBQUMsQ0FBQ2lOLFVBQVUsQ0FBQyxHQUFHLEVBQUMsS0FBSyxDQUFDLENBQUM7VUFBRSxDQUFDLEVBQUMsSUFBSSxDQUFDeEgsU0FBUyxDQUFDO1FBQUEsQ0FBQyxDQUFDO1FBQUN2SCxZQUFZLEVBQUM4QjtNQUFDLENBQUM7SUFBQSxDQUFDLFFBQU1VLENBQUMsRUFBQztNQUFDLE1BQU1BLENBQUMsQ0FBQzBDLE1BQU0sS0FBRyxHQUFHLEtBQUdwUSxRQUFRLENBQUM2TyxJQUFJLENBQUNxTCxXQUFXLENBQUMsSUFBSSxDQUFDVCxXQUFXLENBQUMsRUFBQyxJQUFJLENBQUNELFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBQzlMLENBQUMsQ0FBQ2tELFNBQVMsR0FBQ2xELENBQUMsQ0FBQzBDLE1BQU0sSUFBRSxDQUFDLEVBQUMxQyxDQUFDLENBQUNtRCxRQUFRLEdBQUNuRCxDQUFDLENBQUNtRCxRQUFRLElBQUVuRCxDQUFDLENBQUMzUSxPQUFPLEVBQUMyUSxDQUFDLENBQUMySSxRQUFRLEdBQUM7UUFBQ0MsR0FBRyxFQUFDLE9BQU87UUFBQ0MsTUFBTSxFQUFDLFdBQVc7UUFBQzdHLElBQUksRUFBQzFDLENBQUM7UUFBQ3dKLElBQUksRUFBQ3ZKLENBQUM7UUFBQ3dKLEVBQUUsRUFBQ2pKO01BQUMsQ0FBQyxFQUFDRSxDQUFDO0lBQUE7RUFBQztFQUFDLE1BQU1pSixTQUFTQSxDQUFDM0osQ0FBQyxFQUFDQyxDQUFDLEVBQUNPLENBQUMsRUFBQztJQUFDLE9BQU8sTUFBTSxJQUFJLENBQUMrTCxTQUFTLENBQUM1QyxTQUFTLENBQUMzSixDQUFDLEVBQUNDLENBQUMsRUFBQ08sQ0FBQyxDQUFDO0VBQUE7RUFBQ29KLGFBQWFBLENBQUEsRUFBRTtJQUFDLElBQUksQ0FBQzJDLFNBQVMsQ0FBQzNDLGFBQWEsQ0FBQyxDQUFDO0VBQUE7QUFBQztBQUFDLE1BQU11RCxDQUFDO0VBQUM1ZCxXQUFXQSxDQUFDeVEsQ0FBQyxFQUFDQyxDQUFDLEVBQUM7SUFBQy9NLENBQUMsQ0FBQyxJQUFJLEVBQUMsU0FBUyxDQUFDO0lBQUNBLENBQUMsQ0FBQyxJQUFJLEVBQUMsUUFBUSxFQUFDO01BQUMrSyxVQUFVLEVBQUMsQ0FBQyxDQUFDO01BQUNELFdBQVcsRUFBQztJQUFFLENBQUMsQ0FBQztJQUFDOUssQ0FBQyxDQUFDLElBQUksRUFBQyxrQkFBa0IsQ0FBQztJQUFDQSxDQUFDLENBQUMsSUFBSSxFQUFDLGlCQUFpQixFQUFDLGlCQUFpQixDQUFDO0lBQUMsSUFBRyxJQUFJLENBQUNrYSxPQUFPLEdBQUNuTixDQUFDLEVBQUMsSUFBSSxDQUFDb04sZ0JBQWdCLEdBQUM7TUFBQ0MsYUFBYSxFQUFDLElBQUl0SSxDQUFDLENBQUQsQ0FBQztNQUFDdUksZUFBZSxFQUFDLElBQUlyRCxDQUFDLENBQUQsQ0FBQztNQUFDc0QsY0FBYyxFQUFDO0lBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQyxNQUFJO01BQUMsSUFBRyxPQUFPQyxTQUFTLEdBQUMsR0FBRyxJQUFFLENBQUNBLFNBQVMsQ0FBQ0MsU0FBUyxFQUFDLE9BQU0sQ0FBQyxDQUFDO01BQUMsTUFBTWxOLENBQUMsR0FBQ2lOLFNBQVMsQ0FBQ0MsU0FBUztNQUFDLE9BQU0sVUFBVSxDQUFDM1IsSUFBSSxDQUFDeUUsQ0FBQyxDQUFDLElBQUUsQ0FBQyxVQUFVLENBQUN6RSxJQUFJLENBQUN5RSxDQUFDLENBQUMsSUFBRSxDQUFDLFlBQVksQ0FBQ3pFLElBQUksQ0FBQ3lFLENBQUMsQ0FBQyxJQUFFLENBQUMsT0FBTyxDQUFDekUsSUFBSSxDQUFDeUUsQ0FBQyxDQUFDO0lBQUEsQ0FBQyxFQUFFLENBQUMsRUFBQyxJQUFJLENBQUM2TSxnQkFBZ0IsQ0FBQ0csY0FBYyxHQUFDLElBQUluQixDQUFDLENBQUMsSUFBSSxDQUFDZ0IsZ0JBQWdCLENBQUNDLGFBQWEsRUFBQyxJQUFJLENBQUNELGdCQUFnQixDQUFDQyxhQUFhLENBQUMsQ0FBQyxLQUFJO01BQUMsTUFBTTlNLENBQUMsR0FBQyxJQUFJLENBQUM2TSxnQkFBZ0IsQ0FBQ0UsZUFBZTtRQUFDN00sQ0FBQyxHQUFDLElBQUksQ0FBQzJNLGdCQUFnQixDQUFDQyxhQUFhO01BQUMsSUFBSSxDQUFDRCxnQkFBZ0IsQ0FBQ0csY0FBYyxHQUFDO1FBQUN4RSxrQkFBa0IsRUFBQ0EsQ0FBQSxLQUFJLElBQUkvVSxHQUFHLENBQUQsQ0FBQztRQUFDZ1YsTUFBTSxFQUFDLE1BQU1ySSxDQUFDLElBQUVKLENBQUMsQ0FBQ3lJLE1BQU0sQ0FBQ3JJLENBQUMsQ0FBQztRQUFDOEksU0FBUyxFQUFDLE1BQUFBLENBQU05SSxDQUFDLEVBQUNFLENBQUMsRUFBQ0MsQ0FBQyxLQUFHUCxDQUFDLENBQUNrSixTQUFTLENBQUM5SSxDQUFDLEVBQUNFLENBQUMsRUFBQ0MsQ0FBQyxDQUFDO1FBQUM0SSxTQUFTLEVBQUMsTUFBQUEsQ0FBTS9JLENBQUMsRUFBQ0UsQ0FBQyxFQUFDQyxDQUFDLEtBQUdMLENBQUMsQ0FBQ2lKLFNBQVMsQ0FBQy9JLENBQUMsRUFBQ0UsQ0FBQyxFQUFDQyxDQUFDLENBQUM7UUFBQzZJLGFBQWEsRUFBQ0EsQ0FBQSxLQUFJbEosQ0FBQyxDQUFDa0osYUFBYSxDQUFDO01BQUMsQ0FBQztJQUFBO0lBQUMsSUFBSSxDQUFDK0QsU0FBUyxDQUFDM04sQ0FBQyxDQUFDO0VBQUE7RUFBQzJOLFNBQVNBLENBQUMzTixDQUFDLEVBQUM7SUFBQyxJQUFHLENBQUNBLENBQUMsSUFBRSxDQUFDQSxDQUFDLENBQUNoQyxXQUFXLElBQUUsQ0FBQ2dDLENBQUMsQ0FBQy9CLFVBQVUsRUFBQztNQUFDM04sT0FBTyxDQUFDQyxLQUFLLENBQUMsc0NBQXNDLENBQUM7TUFBQztJQUFNO0lBQUMsSUFBSSxDQUFDcWQsTUFBTSxHQUFDNU4sQ0FBQyxFQUFDLElBQUksQ0FBQzZOLGVBQWUsR0FBQzdOLENBQUMsQ0FBQy9CLFVBQVUsQ0FBQ0UsV0FBVztFQUFBO0VBQUMyUCwwQkFBMEJBLENBQUM5TixDQUFDLEVBQUNDLENBQUMsRUFBQztJQUFDLE1BQU1PLENBQUMsR0FBQyxFQUFFO0lBQUMsS0FBSSxNQUFNRSxDQUFDLElBQUl6QixNQUFNLENBQUNDLElBQUksQ0FBQyxJQUFJLENBQUNtTyxnQkFBZ0IsQ0FBQyxFQUFDO01BQUMsTUFBTXpNLENBQUMsR0FBQyxJQUFJLENBQUN5TSxnQkFBZ0IsQ0FBQzNNLENBQUMsQ0FBQyxDQUFDc0ksa0JBQWtCLENBQUMsQ0FBQztNQUFDcEksQ0FBQyxDQUFDN00sR0FBRyxDQUFDaU0sQ0FBQyxDQUFDLElBQUVZLENBQUMsQ0FBQzdNLEdBQUcsQ0FBQ2tNLENBQUMsQ0FBQyxJQUFFTyxDQUFDLENBQUNqQixJQUFJLENBQUNtQixDQUFDLENBQUM7SUFBQTtJQUFDLE9BQU9GLENBQUMsQ0FBQ3dMLElBQUksQ0FBQyxDQUFDdEwsQ0FBQyxFQUFDRSxDQUFDLEtBQUdGLENBQUMsS0FBRyxpQkFBaUIsR0FBQyxDQUFDLENBQUMsR0FBQ0UsQ0FBQyxLQUFHLGlCQUFpQixHQUFDLENBQUMsR0FBQ0YsQ0FBQyxDQUFDcU4sYUFBYSxDQUFDbk4sQ0FBQyxDQUFDLENBQUM7RUFBQTtFQUFDb04sZUFBZUEsQ0FBQ2hPLENBQUMsRUFBQ0MsQ0FBQyxFQUFDO0lBQUMsTUFBTU8sQ0FBQyxHQUFDO1FBQUN4QyxXQUFXLEVBQUMsRUFBRTtRQUFDQyxVQUFVLEVBQUMsQ0FBQztNQUFDLENBQUM7TUFBQ3lDLENBQUMsR0FBQyxJQUFJek0sR0FBRyxDQUFELENBQUM7TUFBQzJNLENBQUMsR0FBQyxJQUFJLENBQUNrTiwwQkFBMEIsQ0FBQzlOLENBQUMsRUFBQ0MsQ0FBQyxDQUFDO01BQUNhLENBQUMsR0FBQ0YsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUFDRyxDQUFDLEdBQUMsSUFBSTlNLEdBQUcsQ0FBQzJNLENBQUMsQ0FBQztJQUFDLElBQUlLLENBQUM7SUFBQyxLQUFJQSxDQUFDLElBQUksSUFBSSxDQUFDMk0sTUFBTSxDQUFDM1AsVUFBVSxFQUFDO01BQUMsSUFBSWtELENBQUM7UUFBQ0UsQ0FBQyxHQUFDLElBQUksQ0FBQ3VNLE1BQU0sQ0FBQzNQLFVBQVUsQ0FBQ2dELENBQUMsQ0FBQztNQUFDRixDQUFDLENBQUNoTixHQUFHLENBQUNzTixDQUFDLENBQUMsSUFBRWIsQ0FBQyxDQUFDdkMsVUFBVSxDQUFDZ0QsQ0FBQyxDQUFDLEdBQUNJLENBQUMsRUFBQ0YsQ0FBQyxHQUFDRSxDQUFDLEtBQUdiLENBQUMsQ0FBQ3ZDLFVBQVUsQ0FBQ2dELENBQUMsQ0FBQyxHQUFDSCxDQUFDLEVBQUNLLENBQUMsR0FBQ0wsQ0FBQyxDQUFDLEVBQUNKLENBQUMsQ0FBQzFNLEdBQUcsQ0FBQ21OLENBQUMsQ0FBQztJQUFBO0lBQUMsT0FBT1gsQ0FBQyxDQUFDeEMsV0FBVyxHQUFDZ0IsS0FBSyxDQUFDd0ssSUFBSSxDQUFDOUksQ0FBQyxDQUFDLEVBQUNGLENBQUM7RUFBQTtFQUFDLE1BQU15SSxNQUFNQSxDQUFDakosQ0FBQyxFQUFDO0lBQUMsT0FBTyxJQUFJLENBQUNxTixnQkFBZ0IsQ0FBQyxJQUFJLENBQUNRLGVBQWUsQ0FBQyxDQUFDNUUsTUFBTSxDQUFDakosQ0FBQyxDQUFDO0VBQUE7RUFBQyxNQUFNMEosU0FBU0EsQ0FBQzFKLENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEVBQUM7SUFBQyxJQUFJRSxDQUFDLEdBQUMsRUFBRTtJQUFDLEtBQUksSUFBSU8sQ0FBQyxJQUFJLElBQUksQ0FBQzJNLE1BQU0sQ0FBQzVQLFdBQVcsRUFBQzBDLENBQUMsQ0FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUM4TixnQkFBZ0IsQ0FBQ3BNLENBQUMsQ0FBQyxDQUFDeUksU0FBUyxDQUFDMUosQ0FBQyxFQUFDQyxDQUFDLEVBQUNPLENBQUMsQ0FBQyxDQUFDelAsSUFBSSxDQUFDb1EsQ0FBQyxJQUFFLENBQUNGLENBQUMsRUFBQ0UsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFDLE1BQU1QLENBQUMsR0FBQztRQUFDMUMsWUFBWSxFQUFDLEVBQUU7UUFBQ0MsV0FBVyxFQUFDO01BQUUsQ0FBQztNQUFDMkMsQ0FBQyxHQUFDLElBQUlyUixHQUFHLENBQUMsTUFBTTZCLE9BQU8sQ0FBQzJjLEdBQUcsQ0FBQ3ZOLENBQUMsQ0FBQyxDQUFDO0lBQUMsSUFBSUssQ0FBQztJQUFDLEtBQUlBLENBQUMsSUFBSSxJQUFJLENBQUM2TSxNQUFNLENBQUMzUCxVQUFVLEVBQUMsSUFBRztNQUFDLE1BQU1nRCxDQUFDLEdBQUMsSUFBSSxDQUFDMk0sTUFBTSxDQUFDM1AsVUFBVSxDQUFDOEMsQ0FBQyxDQUFDO01BQUNILENBQUMsQ0FBQ0csQ0FBQyxDQUFDLEdBQUNELENBQUMsQ0FBQ2xRLEdBQUcsQ0FBQ3FRLENBQUMsQ0FBQyxDQUFDRixDQUFDLENBQUM7SUFBQSxDQUFDLFFBQU1FLENBQUMsRUFBQztNQUFDM1EsT0FBTyxDQUFDa0MsR0FBRyxDQUFDLEdBQUd1TyxDQUFDLElBQUksSUFBSSxDQUFDNk0sTUFBTSxDQUFDM1AsVUFBVSxDQUFDOEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFDelEsT0FBTyxDQUFDa0MsR0FBRyxDQUFDeU8sQ0FBQyxDQUFDO0lBQUE7SUFBQyxPQUFPTCxDQUFDO0VBQUE7RUFBQyxNQUFNK0ksU0FBU0EsQ0FBQzNKLENBQUMsRUFBQ0MsQ0FBQyxFQUFDTyxDQUFDLEVBQUM7SUFBQyxPQUFPLElBQUksQ0FBQzZNLGdCQUFnQixDQUFDLElBQUksQ0FBQ1EsZUFBZSxDQUFDLENBQUNsRSxTQUFTLENBQUMzSixDQUFDLEVBQUNDLENBQUMsRUFBQ08sQ0FBQyxDQUFDO0VBQUE7RUFBQyxNQUFNb0osYUFBYUEsQ0FBQSxFQUFFO0lBQUMsSUFBSSxDQUFDeUQsZ0JBQWdCLENBQUMsSUFBSSxDQUFDUSxlQUFlLENBQUMsQ0FBQ2pFLGFBQWEsQ0FBQyxDQUFDO0VBQUE7QUFBQztBQUFDLE1BQU1zRSxDQUFDLEdBQUM7RUFBQ3BZLEVBQUUsRUFBQyxTQUFTO0VBQUMsT0FBTyxFQUFDLG1CQUFtQjtFQUFDLE9BQU8sRUFBQyxvQkFBb0I7RUFBQ1EsRUFBRSxFQUFDLFFBQVE7RUFBQ04sRUFBRSxFQUFDLFNBQVM7RUFBQ3FELEVBQUUsRUFBQyxTQUFTO0VBQUNyRSxFQUFFLEVBQUMsUUFBUTtFQUFDVyxFQUFFLEVBQUMsUUFBUTtFQUFDNkIsRUFBRSxFQUFDLFVBQVU7RUFBQzJCLEVBQUUsRUFBQyxZQUFZO0VBQUN0QyxFQUFFLEVBQUMsT0FBTztFQUFDNEQsRUFBRSxFQUFDLE1BQU07RUFBQzdDLEVBQUUsRUFBQyxRQUFRO0VBQUNqRCxHQUFHLEVBQUMsVUFBVTtFQUFDRSxFQUFFLEVBQUMsV0FBVztFQUFDc1osR0FBRyxFQUFDLE1BQU07RUFBQ3hVLEVBQUUsRUFBQyxVQUFVO0VBQUM1RSxFQUFFLEVBQUMsU0FBUztFQUFDcVosR0FBRyxFQUFDLFdBQVc7RUFBQ0MsRUFBRSxFQUFDLFVBQVU7RUFBQ0MsR0FBRyxFQUFDLFVBQVU7RUFBQ0MsR0FBRyxFQUFDLFVBQVU7RUFBQ0MsR0FBRyxFQUFDLFFBQVE7RUFBQ3ZaLEVBQUUsRUFBQyxhQUFhO0VBQUN3WixHQUFHLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsV0FBVztFQUFDQyxHQUFHLEVBQUMsU0FBUztFQUFDelksRUFBRSxFQUFDLFFBQVE7RUFBQzBZLEVBQUUsRUFBQyxZQUFZO0VBQUNDLEdBQUcsRUFBQyxPQUFPO0VBQUMxWixFQUFFLEVBQUMsU0FBUztFQUFDMlosR0FBRyxFQUFDLGlCQUFpQjtFQUFDQyxHQUFHLEVBQUMsVUFBVTtFQUFDQyxHQUFHLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsTUFBTTtFQUFDQyxHQUFHLEVBQUMsUUFBUTtFQUFDQyxFQUFFLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsUUFBUTtFQUFDbGEsRUFBRSxFQUFDLFdBQVc7RUFBQ21hLEdBQUcsRUFBQyxTQUFTO0VBQUN4SyxHQUFHLEVBQUMsV0FBVztFQUFDelAsRUFBRSxFQUFDLFNBQVM7RUFBQ0UsR0FBRyxFQUFDLFNBQVM7RUFBQ2dhLEdBQUcsRUFBQyxVQUFVO0VBQUN2VyxFQUFFLEVBQUMsVUFBVTtFQUFDd1csR0FBRyxFQUFDLFNBQVM7RUFBQ0MsR0FBRyxFQUFDLGtCQUFrQjtFQUFDQyxHQUFHLEVBQUMsU0FBUztFQUFDbGEsRUFBRSxFQUFDLFVBQVU7RUFBQ21hLEdBQUcsRUFBQyxPQUFPO0VBQUNDLEdBQUcsRUFBQyxjQUFjO0VBQUM1WSxFQUFFLEVBQUMsVUFBVTtFQUFDdkIsRUFBRSxFQUFDLE9BQU87RUFBQ0UsRUFBRSxFQUFDLFFBQVE7RUFBQ2thLEdBQUcsRUFBQyxNQUFNO0VBQUNDLEdBQUcsRUFBQyxRQUFRO0VBQUMvVyxFQUFFLEVBQUMsT0FBTztFQUFDL0MsRUFBRSxFQUFDLFdBQVc7RUFBQ0UsRUFBRSxFQUFDLFVBQVU7RUFBQzZaLEdBQUcsRUFBQyxTQUFTO0VBQUNDLEVBQUUsRUFBQyxNQUFNO0VBQUNDLEdBQUcsRUFBQyxVQUFVO0VBQUMzWixFQUFFLEVBQUMsU0FBUztFQUFDNFosRUFBRSxFQUFDLFNBQVM7RUFBQ0MsR0FBRyxFQUFDLFVBQVU7RUFBQ0MsR0FBRyxFQUFDLFFBQVE7RUFBQ0MsR0FBRyxFQUFDLFFBQVE7RUFBQzNaLEVBQUUsRUFBQyxVQUFVO0VBQUM0WixFQUFFLEVBQUMsVUFBVTtFQUFDeGEsRUFBRSxFQUFDLE9BQU87RUFBQ3lhLEdBQUcsRUFBQyxTQUFTO0VBQUN2TCxFQUFFLEVBQUMsVUFBVTtFQUFDOU4sRUFBRSxFQUFDLGVBQWU7RUFBQ3NaLEdBQUcsRUFBQyxXQUFXO0VBQUM3WixFQUFFLEVBQUMsT0FBTztFQUFDQyxHQUFHLEVBQUMsVUFBVTtFQUFDQyxFQUFFLEVBQUMsUUFBUTtFQUFDNFosR0FBRyxFQUFDLFlBQVk7RUFBQzFaLEdBQUcsRUFBQyxPQUFPO0VBQUNJLEVBQUUsRUFBQyxXQUFXO0VBQUN1WixHQUFHLEVBQUMsTUFBTTtFQUFDcFosRUFBRSxFQUFDLFdBQVc7RUFBQ3FaLEdBQUcsRUFBQyxLQUFLO0VBQUN0WixFQUFFLEVBQUMsTUFBTTtFQUFDRCxFQUFFLEVBQUMsWUFBWTtFQUFDd1osR0FBRyxFQUFDLFFBQVE7RUFBQ0MsR0FBRyxFQUFDLGFBQWE7RUFBQ0MsR0FBRyxFQUFDLFdBQVc7RUFBQ3RhLEVBQUUsRUFBQyxPQUFPO0VBQUNlLEVBQUUsRUFBQyxTQUFTO0VBQUN3WixFQUFFLEVBQUMsVUFBVTtFQUFDcFosR0FBRyxFQUFDLFFBQVE7RUFBQ3FaLEdBQUcsRUFBQyxhQUFhO0VBQUNwWixFQUFFLEVBQUMsU0FBUztFQUFDcVosR0FBRyxFQUFDLFFBQVE7RUFBQ0MsR0FBRyxFQUFDLFVBQVU7RUFBQ0MsR0FBRyxFQUFDLFdBQVc7RUFBQ0MsRUFBRSxFQUFDLFFBQVE7RUFBQzFaLEVBQUUsRUFBQyxPQUFPO0VBQUMyWixHQUFHLEVBQUMsYUFBYTtFQUFDOVcsR0FBRyxFQUFDLFNBQVM7RUFBQytXLEdBQUcsRUFBQyxPQUFPO0VBQUNDLEdBQUcsRUFBQyxTQUFTO0VBQUNDLEVBQUUsRUFBQyxTQUFTO0VBQUNDLEdBQUcsRUFBQyxpQkFBaUI7RUFBQzNaLEVBQUUsRUFBQyxRQUFRO0VBQUNHLEVBQUUsRUFBQyxLQUFLO0VBQUN5WixHQUFHLEVBQUMsV0FBVztFQUFDM1osRUFBRSxFQUFDLE9BQU87RUFBQ0ksRUFBRSxFQUFDLFNBQVM7RUFBQ3daLEdBQUcsRUFBQyxZQUFZO0VBQUNDLEdBQUcsRUFBQyxTQUFTO0VBQUMxWixFQUFFLEVBQUMsWUFBWTtFQUFDMlosR0FBRyxFQUFDLFFBQVE7RUFBQ0MsR0FBRyxFQUFDLFNBQVM7RUFBQzlaLEVBQUUsRUFBQyxlQUFlO0VBQUNNLEVBQUUsRUFBQyxZQUFZO0VBQUNGLEdBQUcsRUFBQyxVQUFVO0VBQUMyWixFQUFFLEVBQUMsVUFBVTtFQUFDdFosRUFBRSxFQUFDLE9BQU87RUFBQ0YsRUFBRSxFQUFDLFdBQVc7RUFBQ0csRUFBRSxFQUFDLFNBQVM7RUFBQ3NaLEdBQUcsRUFBQyxNQUFNO0VBQUMzWixFQUFFLEVBQUMsT0FBTztFQUFDRyxFQUFFLEVBQUMsU0FBUztFQUFDeVosR0FBRyxFQUFDLGFBQWE7RUFBQ0MsR0FBRyxFQUFDLGlCQUFpQjtFQUFDQyxHQUFHLEVBQUMsY0FBYztFQUFDQyxFQUFFLEVBQUMsV0FBVztFQUFDQyxHQUFHLEVBQUMsYUFBYTtFQUFDMVosRUFBRSxFQUFDLFNBQVM7RUFBQzJaLEdBQUcsRUFBQyxZQUFZO0VBQUN4WixFQUFFLEVBQUMsUUFBUTtFQUFDeVosR0FBRyxFQUFDLGNBQWM7RUFBQ0MsR0FBRyxFQUFDLGVBQWU7RUFBQzVaLEVBQUUsRUFBQyxXQUFXO0VBQUM2WixHQUFHLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsUUFBUTtFQUFDQyxHQUFHLEVBQUMsWUFBWTtFQUFDQyxFQUFFLEVBQUMsT0FBTztFQUFDQyxHQUFHLEVBQUMsT0FBTztFQUFDQyxHQUFHLEVBQUMsVUFBVTtFQUFDQyxHQUFHLEVBQUMsVUFBVTtFQUFDQyxHQUFHLEVBQUMsWUFBWTtFQUFDQyxFQUFFLEVBQUMsUUFBUTtFQUFDOWMsRUFBRSxFQUFDLFNBQVM7RUFBQytDLEVBQUUsRUFBQyxRQUFRO0VBQUNELEVBQUUsRUFBQyxTQUFTO0VBQUNpYSxHQUFHLEVBQUMsU0FBUztFQUFDQyxHQUFHLEVBQUMsaUJBQWlCO0VBQUMvWixFQUFFLEVBQUMsVUFBVTtFQUFDZ2EsR0FBRyxFQUFDLFNBQVM7RUFBQ0MsR0FBRyxFQUFDLFFBQVE7RUFBQ0MsR0FBRyxFQUFDLE9BQU87RUFBQzdaLEVBQUUsRUFBQyxRQUFRO0VBQUM4WixHQUFHLEVBQUMsVUFBVTtFQUFDQyxHQUFHLEVBQUMsV0FBVztFQUFDQyxHQUFHLEVBQUMsT0FBTztFQUFDamQsRUFBRSxFQUFDLGFBQWE7RUFBQ3NULEdBQUcsRUFBQyxjQUFjO0VBQUNsUSxFQUFFLEVBQUMsU0FBUztFQUFDLFNBQVMsRUFBQyxpQkFBaUI7RUFBQyxTQUFTLEVBQUMsY0FBYztFQUFDOFosR0FBRyxFQUFDLGVBQWU7RUFBQzdaLEVBQUUsRUFBQyxTQUFTO0VBQUM4WixHQUFHLEVBQUMsTUFBTTtFQUFDamEsRUFBRSxFQUFDLE9BQU87RUFBQ2thLEdBQUcsRUFBQyxVQUFVO0VBQUN0YSxFQUFFLEVBQUMsUUFBUTtFQUFDdWEsRUFBRSxFQUFDLFNBQVM7RUFBQ3RhLEVBQUUsRUFBQyxRQUFRO0VBQUNDLEVBQUUsRUFBQyxXQUFXO0VBQUNzYSxFQUFFLEVBQUMsUUFBUTtFQUFDQyxHQUFHLEVBQUMsa0JBQWtCO0VBQUNDLEdBQUcsRUFBQyxpQkFBaUI7RUFBQ0MsR0FBRyxFQUFDLGVBQWU7RUFBQ25hLEVBQUUsRUFBQyxXQUFXO0VBQUNFLEVBQUUsRUFBQyxTQUFTO0VBQUNELEVBQUUsRUFBQyxTQUFTO0VBQUNtYSxHQUFHLEVBQUMsUUFBUTtFQUFDQyxHQUFHLEVBQUMsU0FBUztFQUFDQyxFQUFFLEVBQUMsUUFBUTtFQUFDamEsRUFBRSxFQUFDLE9BQU87RUFBQ0YsRUFBRSxFQUFDLE9BQU87RUFBQ29hLEdBQUcsRUFBQyxPQUFPO0VBQUNuYSxFQUFFLEVBQUMsUUFBUTtFQUFDb2EsR0FBRyxFQUFDLE9BQU87RUFBQ2xhLEVBQUUsRUFBQyxNQUFNO0VBQUNtYSxHQUFHLEVBQUMsVUFBVTtFQUFDOUssRUFBRSxFQUFDLFFBQVE7RUFBQytLLEdBQUcsRUFBQyxRQUFRO0VBQUNqYSxFQUFFLEVBQUMsU0FBUztFQUFDa2EsR0FBRyxFQUFDLFNBQVM7RUFBQ0MsR0FBRyxFQUFDLEtBQUs7RUFBQ0MsRUFBRSxFQUFDLFFBQVE7RUFBQ25hLEVBQUUsRUFBQyxXQUFXO0VBQUNvYSxHQUFHLEVBQUMsY0FBYztFQUFDbGEsRUFBRSxFQUFDLE9BQU87RUFBQ21hLEdBQUcsRUFBQyxPQUFPO0VBQUNsYSxFQUFFLEVBQUMsWUFBWTtFQUFDbWEsR0FBRyxFQUFDLFNBQVM7RUFBQ3JmLEVBQUUsRUFBQyxPQUFPO0VBQUNzZixHQUFHLEVBQUMsZ0JBQWdCO0VBQUNDLEdBQUcsRUFBQyxPQUFPO0VBQUNDLEVBQUUsRUFBQyxPQUFPO0VBQUNyYSxFQUFFLEVBQUMsU0FBUztFQUFDQyxFQUFFLEVBQUMsUUFBUTtFQUFDcWEsR0FBRyxFQUFDLGNBQWM7RUFBQ0MsR0FBRyxFQUFDLE1BQU07RUFBQ0MsRUFBRSxFQUFDO0FBQU0sQ0FBQzs7Ozs7OztVQ0F4NjBCO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7Ozs7QUNOd0Q7QUFDUjtBQUNJO0FBQ21DOztBQUV2RjtBQUNBO0FBQ0E7QUFDQSxNQUFNaEksT0FBTyxHQUFHLElBQUk5ZCxpRUFBTyxDQUFDLENBQUM7QUFDN0IsTUFBTXFtQixTQUFTLEdBQUd2akIsUUFBVyxLQUFLLFFBQVE7O0FBRTFDO0FBQ0EsSUFBSXdqQixjQUFjLEdBQUc1aUIsUUFBUSxDQUFDaVQsY0FBYyxDQUFDLElBQUksQ0FBQztBQUNsRCxJQUFJNFAsY0FBYyxHQUFHN2lCLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxJQUFJLENBQUM7QUFDbEQ7QUFDQSxJQUFJNlAsY0FBYyxHQUFHOWlCLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxVQUFVLENBQUM7QUFDeEQ7QUFDQSxJQUFJOFAsZUFBZSxHQUFHL2lCLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQzs7QUFFakU7QUFDQTtBQUNBO0FBQ0EyRyxNQUFNLENBQUNvSixNQUFNLEdBQUcsWUFBWTtFQUN4QmxqQixrRUFBUSxDQUFDLENBQUM7RUFDVjtFQUNBLElBQUksQ0FBQzZpQixTQUFTLEVBQUU7SUFDWixNQUFNTSxnQkFBZ0IsR0FBR2pqQixRQUFRLENBQUNpVCxjQUFjLENBQUMsZ0JBQWdCLENBQUM7SUFDbEUsSUFBSWdRLGdCQUFnQixFQUFFQSxnQkFBZ0IsQ0FBQ0MsS0FBSyxDQUFDQyxPQUFPLEdBQUcsTUFBTTtFQUNqRTtFQUVBLElBQUlDLE9BQU8sR0FBR3BqQixRQUFRLENBQUNpVCxjQUFjLENBQUMsVUFBVSxDQUFDO0VBQ2pELElBQUlvUSxTQUFTLEdBQUdyakIsUUFBUSxDQUFDaVQsY0FBYyxDQUFDLFlBQVksQ0FBQztFQUNyRG9RLFNBQVMsQ0FBQ0MsWUFBWSxDQUFDLE9BQU8sRUFBRTNtQixNQUFNLENBQUM2RCxJQUFJLENBQUNDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztFQUNqRTJpQixPQUFPLENBQUNFLFlBQVksQ0FBQyxPQUFPLEVBQUUzbUIsTUFBTSxDQUFDNkQsSUFBSSxDQUFDQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7RUFFN0RtaUIsY0FBYyxDQUFDVyxRQUFRLEdBQUcsWUFBWTtJQUNsQztJQUNBQyxVQUFVLENBQUNWLGNBQWMsRUFBRUYsY0FBYyxDQUFDO0lBQzFDYSxxQkFBcUIsQ0FDakJiLGNBQWMsQ0FBQzFSLE9BQU8sQ0FBQzBSLGNBQWMsQ0FBQ2MsYUFBYSxDQUFDLENBQUNyVyxLQUFLLEVBQzFEd1YsY0FBYyxDQUFDM1IsT0FBTyxDQUFDMlIsY0FBYyxDQUFDYSxhQUFhLENBQUMsQ0FBQ3JXLEtBQ3pELENBQUM7SUFDRHNXLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3hCLENBQUM7RUFFRGQsY0FBYyxDQUFDVSxRQUFRLEdBQUcsWUFBWTtJQUNsQ0UscUJBQXFCLENBQ2pCYixjQUFjLENBQUMxUixPQUFPLENBQUMwUixjQUFjLENBQUNjLGFBQWEsQ0FBQyxDQUFDclcsS0FBSyxFQUMxRHdWLGNBQWMsQ0FBQzNSLE9BQU8sQ0FBQzJSLGNBQWMsQ0FBQ2EsYUFBYSxDQUFDLENBQUNyVyxLQUN6RCxDQUFDO0lBQ0RzVyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN4QixDQUFDOztFQUVEO0VBQ0FiLGNBQWMsQ0FBQ2MsT0FBTyxHQUFHQyxnQkFBZ0I7O0VBRXpDO0VBQ0FkLGVBQWUsQ0FBQ1EsUUFBUSxHQUFHLE1BQU07SUFDN0JuWCxtRkFBdUIsQ0FBQyxlQUFlLEVBQUUxQyx3RUFBZ0IsQ0FBQyxDQUFDM0wsSUFBSSxDQUFFQyxNQUFNLElBQUs7TUFDeEUsSUFBSXNNLGFBQWEsR0FBR3RNLE1BQU0sQ0FBQ3NNLGFBQWE7TUFDeENBLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHeVksZUFBZSxDQUFDZSxPQUFPO01BQzFEQyxVQUFVLENBQUMsZUFBZSxFQUFFelosYUFBYSxDQUFDO0lBQzlDLENBQUMsQ0FBQztJQUNGcVosZ0JBQWdCLENBQUMsQ0FBQztFQUN0QixDQUFDOztFQUVEO0VBQ0F2WCxtRkFBdUIsQ0FBQyxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxFQUFFMUMsd0VBQWdCLENBQUMsQ0FBQzNMLElBQUksQ0FDL0VDLE1BQU0sSUFBSztJQUNSLElBQUlzTSxhQUFhLEdBQUd0TSxNQUFNLENBQUNzTSxhQUFhO0lBQ3hDLElBQUlGLGVBQWUsR0FBR3BNLE1BQU0sQ0FBQ29NLGVBQWU7O0lBRTVDO0lBQ0EsSUFBSUEsZUFBZSxDQUFDNUQsRUFBRSxLQUFLLE1BQU0sRUFBRTtNQUMvQnVjLGVBQWUsQ0FBQ2lCLFFBQVEsR0FBRyxJQUFJO01BQy9CakIsZUFBZSxDQUFDa0IsYUFBYSxDQUFDQyxLQUFLLEdBQUd2bkIsTUFBTSxDQUFDNkQsSUFBSSxDQUFDQyxVQUFVLENBQ3hELDBCQUNKLENBQUM7TUFDRCxJQUFJNkosYUFBYSxDQUFDLGlCQUFpQixDQUFDLEVBQUU7UUFDbEN5WSxlQUFlLENBQUNlLE9BQU8sR0FBRyxLQUFLO1FBQy9CZixlQUFlLENBQUNRLFFBQVEsQ0FBQyxDQUFDO01BQzlCO0lBQ0osQ0FBQyxNQUFNO01BQ0hSLGVBQWUsQ0FBQ2UsT0FBTyxHQUFHeFosYUFBYSxDQUFDLGlCQUFpQixDQUFDO01BQzFEeVksZUFBZSxDQUFDa0IsYUFBYSxDQUFDQyxLQUFLLEdBQUcsRUFBRTtJQUM1Qzs7SUFFQTtJQUNBLEtBQUssSUFBSS9OLFFBQVEsSUFBSXNNLGtFQUFTLEVBQUU7TUFDNUIsSUFBSXBWLEtBQUssR0FBRzhJLFFBQVE7TUFDcEIsSUFBSXpGLElBQUksR0FBRy9ULE1BQU0sQ0FBQzZELElBQUksQ0FBQ0MsVUFBVSxDQUFDZ2lCLGtFQUFTLENBQUN0TSxRQUFRLENBQUMsQ0FBQztNQUV0RCxJQUFJL0wsZUFBZSxJQUFJaUQsS0FBSyxJQUFJakQsZUFBZSxDQUFDNUQsRUFBRSxFQUFFO1FBQ2hEb2MsY0FBYyxDQUFDMVIsT0FBTyxDQUFDbFEsR0FBRyxDQUFDLElBQUltakIsTUFBTSxDQUFDelQsSUFBSSxFQUFFckQsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztNQUNuRSxDQUFDLE1BQU07UUFDSHVWLGNBQWMsQ0FBQzFSLE9BQU8sQ0FBQ2xRLEdBQUcsQ0FBQyxJQUFJbWpCLE1BQU0sQ0FBQ3pULElBQUksRUFBRXJELEtBQUssQ0FBQyxDQUFDO01BQ3ZEO01BRUEsSUFBSWpELGVBQWUsSUFBSWlELEtBQUssSUFBSWpELGVBQWUsQ0FBQy9DLEVBQUUsRUFBRTtRQUNoRHdiLGNBQWMsQ0FBQzNSLE9BQU8sQ0FBQ2xRLEdBQUcsQ0FBQyxJQUFJbWpCLE1BQU0sQ0FBQ3pULElBQUksRUFBRXJELEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7TUFDbkUsQ0FBQyxNQUFNO1FBQ0h3VixjQUFjLENBQUMzUixPQUFPLENBQUNsUSxHQUFHLENBQUMsSUFBSW1qQixNQUFNLENBQUN6VCxJQUFJLEVBQUVyRCxLQUFLLENBQUMsQ0FBQztNQUN2RDtJQUNKO0lBRUFzVyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN4QixDQUNKLENBQUM7RUFDRDtFQUNBN0osZ0JBQWdCLENBQUMsQ0FBQztBQUN0QixDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBbmQsTUFBTSxDQUFDeW5CLFFBQVEsQ0FBQ0MsU0FBUyxDQUFDdm5CLFdBQVcsQ0FBRXduQixPQUFPLElBQUs7RUFDL0MsUUFBUUEsT0FBTztJQUNYLEtBQUsseUJBQXlCO01BQzFCQyxhQUFhLENBQUMsQ0FBQztNQUNmO0lBQ0osS0FBSyw2QkFBNkI7TUFDOUJWLGdCQUFnQixDQUFDLENBQUM7TUFDbEI7SUFDSixLQUFLLHlCQUF5QjtNQUMxQmQsZUFBZSxDQUFDeUIsS0FBSyxDQUFDLENBQUM7TUFDdkI7SUFDSjtNQUNJO0VBQ1I7QUFDSixDQUFDLENBQUM7O0FBRUY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU2YscUJBQXFCQSxDQUFDYixjQUFjLEVBQUVDLGNBQWMsRUFBRTtFQUMzRDtFQUNBekksT0FBTyxDQUFDNWMsSUFBSSxDQUFDLHlCQUF5QixFQUFFO0lBQ3BDZ1osSUFBSSxFQUFFb00sY0FBYztJQUNwQm5NLEVBQUUsRUFBRW9NO0VBQ1IsQ0FBQyxDQUFDO0VBRUZrQixVQUFVLENBQUMsaUJBQWlCLEVBQUU7SUFBRXZkLEVBQUUsRUFBRW9jLGNBQWM7SUFBRXZiLEVBQUUsRUFBRXdiO0VBQWUsQ0FBQyxDQUFDO0VBQ3pFLElBQUlELGNBQWMsS0FBSyxNQUFNLEVBQUU7SUFDM0JHLGVBQWUsQ0FBQ2UsT0FBTyxHQUFHLEtBQUs7SUFDL0JmLGVBQWUsQ0FBQ2lCLFFBQVEsR0FBRyxJQUFJO0lBQy9CakIsZUFBZSxDQUFDa0IsYUFBYSxDQUFDQyxLQUFLLEdBQUd2bkIsTUFBTSxDQUFDNkQsSUFBSSxDQUFDQyxVQUFVLENBQUMsMEJBQTBCLENBQUM7SUFDeEZzaUIsZUFBZSxDQUFDUSxRQUFRLENBQUMsQ0FBQztFQUM5QixDQUFDLE1BQU0sSUFBSVIsZUFBZSxDQUFDaUIsUUFBUSxFQUFFO0lBQ2pDakIsZUFBZSxDQUFDaUIsUUFBUSxHQUFHLEtBQUs7SUFDaENqQixlQUFlLENBQUNrQixhQUFhLENBQUNDLEtBQUssR0FBRyxFQUFFO0VBQzVDO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0gsVUFBVUEsQ0FBQ3pYLEdBQUcsRUFBRWUsS0FBSyxFQUFFO0VBQzVCLElBQUlvWCxJQUFJLEdBQUcsQ0FBQyxDQUFDO0VBQ2JBLElBQUksQ0FBQ25ZLEdBQUcsQ0FBQyxHQUFHZSxLQUFLO0VBQ2pCMVEsTUFBTSxDQUFDNlAsT0FBTyxDQUFDQyxJQUFJLENBQUN0TyxHQUFHLENBQUNzbUIsSUFBSSxDQUFDO0FBQ2pDOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVMzSyxnQkFBZ0JBLENBQUEsRUFBRztFQUN4QjlaLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDNkcsZ0JBQWdCLENBQUMsT0FBTyxFQUFFNEssZUFBZSxDQUFDO0VBQ3JGMWtCLFFBQVEsQ0FBQzhaLGdCQUFnQixDQUFDLFVBQVUsRUFBRTZLLGtCQUFrQixDQUFDLENBQUMsQ0FBQztFQUMzRDNrQixRQUFRLENBQUNpVCxjQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzZHLGdCQUFnQixDQUFDLE9BQU8sRUFBRXlLLGFBQWEsQ0FBQztFQUNsRixJQUFJNUIsU0FBUyxFQUFFO0lBQ1gzaUIsUUFBUSxDQUFDaVQsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM2RyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTTtNQUM3RU0sT0FBTyxDQUFDNWMsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzdDLENBQUMsQ0FBQztFQUNOO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBU2tuQixlQUFlQSxDQUFBLEVBQUc7RUFDdkIsSUFBSUUsT0FBTyxHQUFHNWtCLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDNUYsS0FBSztFQUM5RCxJQUFJdVgsT0FBTyxDQUFDcE4sT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7SUFDbkM7SUFDQXhYLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQ2lRLEtBQUssQ0FBQ0MsT0FBTyxHQUFHLE1BQU07O0lBRTlEO0lBQ0EvSSxPQUFPLENBQUNoYyxPQUFPLENBQUMsV0FBVyxFQUFFO01BQUVzUixJQUFJLEVBQUVrVjtJQUFRLENBQUMsQ0FBQyxDQUFDN21CLElBQUksQ0FBQyxNQUFNO01BQ3ZEc1IsVUFBVSxDQUFDLE1BQU07UUFDYnVLLE1BQU0sQ0FBQ2lMLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNwQixDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ1QsQ0FBQyxDQUFDO0VBQ04sQ0FBQyxDQUFDO0VBQUEsS0FDRzdrQixRQUFRLENBQUNpVCxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUNpUSxLQUFLLENBQUNDLE9BQU8sR0FBRyxRQUFRO0FBQ3pFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0ssVUFBVUEsQ0FBQ1YsY0FBYyxFQUFFRixjQUFjLEVBQUU7RUFDaEQsSUFBSUEsY0FBYyxDQUFDdlYsS0FBSyxLQUFLLE1BQU0sRUFBRXlWLGNBQWMsQ0FBQ0ksS0FBSyxDQUFDNEIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUNwRWhDLGNBQWMsQ0FBQ0ksS0FBSyxDQUFDNEIsS0FBSyxHQUFHLFNBQVM7QUFDL0M7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsU0FBU2pCLGdCQUFnQkEsQ0FBQSxFQUFHO0VBQ3hCLElBQUlqQixjQUFjLENBQUN2VixLQUFLLEtBQUssTUFBTSxFQUFFO0lBQ2pDLElBQUkwWCxTQUFTLEdBQUdsQyxjQUFjLENBQUN4VixLQUFLO0lBQ3BDd1YsY0FBYyxDQUFDeFYsS0FBSyxHQUFHdVYsY0FBYyxDQUFDdlYsS0FBSztJQUMzQ3VWLGNBQWMsQ0FBQ3ZWLEtBQUssR0FBRzBYLFNBQVM7SUFDaEN0QixxQkFBcUIsQ0FBQ2IsY0FBYyxDQUFDdlYsS0FBSyxFQUFFd1YsY0FBYyxDQUFDeFYsS0FBSyxDQUFDO0lBQ2pFc1csZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDeEI7QUFDSjs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxTQUFTWSxhQUFhQSxDQUFBLEVBQUc7RUFDckIsSUFBSTVYLE9BQU8sR0FBRzNNLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxTQUFTLENBQUM7RUFDaEQsSUFBSW1RLE9BQU8sR0FBR3BqQixRQUFRLENBQUNpVCxjQUFjLENBQUMsVUFBVSxDQUFDO0VBQ2pELElBQUlvUSxTQUFTLEdBQUdyakIsUUFBUSxDQUFDaVQsY0FBYyxDQUFDLFlBQVksQ0FBQztFQUNyRCxJQUFJLENBQUN0RyxPQUFPLENBQUN1VyxLQUFLLENBQUNDLE9BQU8sSUFBSXhXLE9BQU8sQ0FBQ3VXLEtBQUssQ0FBQ0MsT0FBTyxJQUFJLE1BQU0sRUFBRTtJQUMzRHhXLE9BQU8sQ0FBQ3VXLEtBQUssQ0FBQ0MsT0FBTyxHQUFHLE9BQU87SUFDL0JFLFNBQVMsQ0FBQ0gsS0FBSyxDQUFDQyxPQUFPLEdBQUcsTUFBTTtJQUNoQ0MsT0FBTyxDQUFDRixLQUFLLENBQUNDLE9BQU8sR0FBRyxRQUFRO0lBQ2hDbmpCLFFBQVEsQ0FBQ2lULGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQytSLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2Q3hCLFVBQVUsQ0FBQ1YsY0FBYyxFQUFFRixjQUFjLENBQUM7RUFDOUMsQ0FBQyxNQUFNO0lBQ0hqVyxPQUFPLENBQUN1VyxLQUFLLENBQUNDLE9BQU8sR0FBRyxNQUFNO0lBQzlCRSxTQUFTLENBQUNILEtBQUssQ0FBQ0MsT0FBTyxHQUFHLFFBQVE7SUFDbENDLE9BQU8sQ0FBQ0YsS0FBSyxDQUFDQyxPQUFPLEdBQUcsTUFBTTtJQUM5Qm5qQixRQUFRLENBQUNpVCxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQytSLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN4RDtBQUNKOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVNMLGtCQUFrQkEsQ0FBQ2xuQixLQUFLLEVBQUU7RUFDL0IsSUFBSXduQixXQUFXLEdBQUd4bkIsS0FBSyxDQUFDeW5CLFFBQVEsSUFBSXpuQixLQUFLLENBQUMwbkIsT0FBTztFQUNqRCxJQUFJRixXQUFXLElBQUksSUFBSSxFQUFFO0lBQ3JCUCxlQUFlLENBQUMsQ0FBQztFQUNyQjtBQUNKOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFNBQVNmLGdCQUFnQkEsQ0FBQSxFQUFHO0VBQ3hCLElBQUl5QixZQUFZLEdBQUdwbEIsUUFBUSxDQUFDaVQsY0FBYyxDQUFDLGlCQUFpQixDQUFDO0VBQzdELElBQUlvUyxvQkFBb0IsR0FBR3pDLGNBQWMsQ0FBQzFSLE9BQU8sQ0FBQzBSLGNBQWMsQ0FBQ2MsYUFBYSxDQUFDLENBQUNoVSxJQUFJO0VBQ3BGLElBQUk0VixvQkFBb0IsR0FBR3pDLGNBQWMsQ0FBQzNSLE9BQU8sQ0FBQzJSLGNBQWMsQ0FBQ2EsYUFBYSxDQUFDLENBQUNoVSxJQUFJO0VBQ3BGLElBQ0lrVCxjQUFjLENBQUMxUixPQUFPLENBQUMwUixjQUFjLENBQUNjLGFBQWEsQ0FBQyxDQUFDclcsS0FBSyxLQUFLLE1BQU0sSUFDckUsQ0FBQzBWLGVBQWUsQ0FBQ2UsT0FBTyxFQUMxQjtJQUNFc0IsWUFBWSxDQUFDRyxXQUFXLEdBQUcsR0FBR0Ysb0JBQW9CLFFBQVFDLG9CQUFvQixFQUFFO0VBQ3BGLENBQUMsTUFBTTtJQUNIRixZQUFZLENBQUNHLFdBQVcsR0FBRyxHQUFHRixvQkFBb0IsUUFBUUMsb0JBQW9CLEVBQUU7RUFDcEY7QUFDSjs7QUFFQTtBQUNBO0FBQ0EsRyIsInNvdXJjZXMiOlsid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2V2ZW50LmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2xhbmd1YWdlcy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9sb2dnZXIuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi4vdHJhbnNsYXRvcnMvZGlzdC90cmFuc2xhdG9ycy5lcy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL3BvcHVwL3BvcHVwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFdmVudE1hbmFnZXIgZnJvbSBcIi4vZXZlbnQuanNcIjtcblxuLyoqXG4gKiBDaGFubmVsIGZvciBpbnRlci1jb250ZXh0IGNvbW11bmljYXRpb24uXG4gKlxuICogQSBjaHJvbWUgZXh0ZW5zaW9uIHR5cGljYWxseSBjb250YWlucyA0IHR5cGVzIG9mIGNvbnRleHQ6IGJhY2tncm91bmQsIHBvcHVwLFxuICogb3B0aW9ucyBhbmQgY29udGVudCBzY3JpcHRzLiBDb21tdW5pY2F0aW9uIGJldHdlZW4gdGhlc2UgY29udGV4dHMgcmVsaWVzIG9uXG4gKiBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSBhbmQgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UuXG4gKlxuICogVGhpcyBtb2R1bGUgcHJvdmlkZXMgdHdvIGNvbW11bmljYXRpb24gbW9kZWw6XG4gKiAgICogcmVxdWVzdC9yZXNwb25zZVxuICogICAqIGV2ZW50IHRyaWdnZXIvbGlzdGVuXG4gKlxuICogYmFzZWQgb24gY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UgYW5kIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlLlxuICovXG5jbGFzcyBDaGFubmVsIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtNYXA8U3RyaW5nLCBGdW5jdGlvbj59IHNlcnZpY2VzXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zZXJ2aWNlcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge0V2ZW50TWFuYWdlcn0gRXZlbnQgbWFuYWdlci5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2V2ZW50TWFuYWdlciA9IG5ldyBFdmVudE1hbmFnZXIoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVnaXN0ZXIgbWFzc2FnZSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihcbiAgICAgICAgICAgICgobWVzc2FnZSwgc2VuZGVyLCBjYWxsYmFjaykgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFwYXJzZWQgfHwgIXBhcnNlZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYEJhZCBtZXNzYWdlOiAke21lc3NhZ2V9YCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKHBhcnNlZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJldmVudFwiOlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRNYW5hZ2VyLmVtaXQocGFyc2VkLmV2ZW50LCBwYXJzZWQuZGV0YWlsLCBzZW5kZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwic2VydmljZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXJ2ZXIgPSB0aGlzLl9zZXJ2aWNlcy5nZXQocGFyc2VkLnNlcnZpY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzZXJ2ZXIpIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBXZSBjYW4gY2FsbCB0aGUgY2FsbGJhY2sgb25seSB3aGVuIHdlIHJlYWxseSBwcm92aWRlIHRoZSByZXF1ZXN0ZWQgc2VydmljZS5cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZlcihwYXJzZWQucGFyYW1zLCBzZW5kZXIpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHJlc3VsdCkgPT4gY2FsbGJhY2sgJiYgY2FsbGJhY2socmVzdWx0KVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmtub3duIG1lc3NhZ2UgdHlwZTogJHttZXNzYWdlLnR5cGV9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSkuYmluZCh0aGlzKVxuICAgICAgICApO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFByb3ZpZGUgYSBzZXJ2aWNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlcnZpY2Ugc2VydmljZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IHNlcnZlciBzZXJ2ZXIsIHNlcnZlciBmdW5jdGlvbiBtdXN0IHJldHVybiBhIFByb21pc2Ugb2YgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcHJvdmlkZShzZXJ2aWNlLCBzZXJ2ZXIpIHtcbiAgICAgICAgdGhpcy5fc2VydmljZXMuc2V0KHNlcnZpY2UsIHNlcnZlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIHJlcXVlc3QgYW5kIGdldCBhIHJlc3BvbnNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlcnZpY2Ugc2VydmljZSBuYW1lXG4gICAgICogQHBhcmFtIHtBbnl9IHBhcmFtcyBzZXJ2aWNlIHBhcmFtZXRlcnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBbnk+fSBwcm9taXNlIG9mIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHJlcXVlc3Qoc2VydmljZSwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwic2VydmljZVwiLCBzZXJ2aWNlLCBwYXJhbXMgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogU2VuZCBhIHJlcXVlc3QgdG8gdGhlIHNwZWNpZmllZCB0YWIgYW5kIGdldCBhIHJlc3BvbnNlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRhYklkIHRhYiBpZFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZXJ2aWNlIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ge0FueX0gcGFyYW1zIHNlcnZpY2UgcGFyYW1ldGVyc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEFueT59IHByb21pc2Ugb2YgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcmVxdWVzdFRvVGFiKHRhYklkLCBzZXJ2aWNlLCBwYXJhbXMpIHtcbiAgICAgICAgY29uc3Qgc2VuZCA9IHRoaXMuX2dldFRhYk1lc3NhZ2VTZW5kZXIoKTtcbiAgICAgICAgaWYgKCFzZW5kKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJDYW4gbm90IHNlbmQgbWVzc2FnZSB0byB0YWJzIGluIGN1cnJlbnQgY29udGV4dCFcIik7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInNlcnZpY2VcIiwgc2VydmljZSwgcGFyYW1zIH0pO1xuICAgICAgICByZXR1cm4gc2VuZCh0YWJJZCwgbWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdG8gaGFuZGxlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBldmVudCBoYW5kbGVyLCBhY2NlcHRzIHR3byBhcmd1bWVudHM6XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGV2ZW50IGRldGFpbFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2Ugb2YgdGhlIGV2ZW50LCBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyIG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gYSBjYW5jZWxlciB0aGF0IHdpbGwgcmVtb3ZlIHRoZSBoYW5kbGVyIHdoZW4gY2FsbGVkXG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2V2ZW50TWFuYWdlci5vbihldmVudCwgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW1pdCBhbiBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7QW55fSBkZXRhaWwgZXZlbnQgZGV0YWlsXG4gICAgICovXG4gICAgZW1pdChldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGxldCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImV2ZW50XCIsIGV2ZW50LCBkZXRhaWwgfSk7XG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKG1lc3NhZ2UsICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtaXQgYW4gZXZlbnQgdG8gc3BlY2lmaWVkIHRhYnMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlciB8IEFycmF5PE51bWJlcj59IHRhYklkcyB0YWIgaWRzXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtBbnl9IGRldGFpbCBldmVudCBkZXRhaWxcbiAgICAgKi9cbiAgICBlbWl0VG9UYWJzKHRhYklkcywgZXZlbnQsIGRldGFpbCkge1xuICAgICAgICBjb25zdCBzZW5kID0gdGhpcy5fZ2V0VGFiTWVzc2FnZVNlbmRlcigpO1xuICAgICAgICBpZiAoIXNlbmQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJDYW4gbm90IHNlbmQgbWVzc2FnZSB0byB0YWJzIGluIGN1cnJlbnQgY29udGV4dCFcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0YWJJZHMgaXMgYSBudW1iZXIsIHdyYXAgaXQgdXAgd2l0aCBhbiBhcnJheS5cbiAgICAgICAgaWYgKHR5cGVvZiB0YWJJZHMgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgIHRhYklkcyA9IFt0YWJJZHNdO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJldmVudFwiLCBldmVudCwgZGV0YWlsIH0pO1xuICAgICAgICBmb3IgKGxldCB0YWJJZCBvZiB0YWJJZHMpIHtcbiAgICAgICAgICAgIHNlbmQodGFiSWQsIG1lc3NhZ2UpLmNhdGNoKChlcnJvcikgPT4gY29uc29sZS5lcnJvcihlcnJvcikpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kXG4gICAgICpcbiAgICAgKiBHZXQgdGhlIG1lc3NhZ2Ugc2VuZGluZyBmdW5jdGlvbiBmb3Igc2VuZGluZyBtZXNzYWdlIHRvIHRhYnMuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb24gfCBudWxsfSBtZXNzYWdlIHNlbmRlclxuICAgICAqL1xuICAgIF9nZXRUYWJNZXNzYWdlU2VuZGVyKCkge1xuICAgICAgICBpZiAoQlJPV1NFUl9FTlYgPT09IFwiZmlyZWZveFwiKSB7XG4gICAgICAgICAgICBpZiAoIWJyb3dzZXIudGFicyB8fCAhYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZpcmVmb3ggdXNlcyBQcm9taXNlLCByZXR1cm4gZGlyZWN0bHkuXG4gICAgICAgICAgICByZXR1cm4gYnJvd3Nlci50YWJzLnNlbmRNZXNzYWdlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjaHJvbWUudGFicyB8fCAhY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hyb21lIHVzZXMgY2FsbGJhY2ssIHdyYXAgaXQgdXAuXG4gICAgICAgIHJldHVybiAodGFiSWQsIG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UodGFiSWQsIG1lc3NhZ2UsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQ2hhbm5lbDtcbiIsImV4cG9ydCB7IGdldERvbWFpbiwgbG9nIH07XG5pbXBvcnQgeyBsb2dJbmZvIH0gZnJvbSBcIi4vbG9nZ2VyLmpzXCI7XG5cbi8qKlxuICog5o+Q5Y+W57uZ5a6a55qEdXJs55qE5Z+f5ZCNXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFxuICovXG5mdW5jdGlvbiBnZXREb21haW4odXJsKSB7XG4gICAgaWYgKHVybCkge1xuICAgICAgICBsZXQgVVJMX1BBVFRFUk4gPSAvLis6XFwvKyhbXFx3Li1dKykuKi87XG4gICAgICAgIGxldCBncm91cHMgPSB1cmwubWF0Y2goVVJMX1BBVFRFUk4pO1xuICAgICAgICBpZiAoZ3JvdXBzKSB7XG4gICAgICAgICAgICByZXR1cm4gZ3JvdXBzWzFdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBcIlwiO1xufVxuXG4vKipcbiAqIGNvbnNvbGUubG9nIHdyYXBwZXIuXG4gKlxuICogQHBhcmFtIHtBbnl9IG1lc3NhZ2UgbWVzc2FnZSB0byBsb2cuXG4gKi9cbmZ1bmN0aW9uIGxvZyhtZXNzYWdlKSB7XG4gICAgbG9nSW5mbyhtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBzZXQgdGhlIGNvbnRlbnQgdGV4dCBvZiBIVE1MIHRhZ3MsIHdoaWNoIGhhdmUgXCJpMThuXCIgY2xhc3MgbmFtZSwgd2l0aCBpMThuIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMThuSFRNTCgpIHtcbiAgICBsZXQgaTE4bkVsZW1lbnRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcImkxOG5cIik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpMThuRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgLy8gRGVmYXVsdCBcImJlZm9yZUVuZFwiLlxuICAgICAgICBsZXQgcG9zID0gXCJiZWZvcmVFbmRcIjtcbiAgICAgICAgaWYgKGkxOG5FbGVtZW50c1tpXS5oYXNBdHRyaWJ1dGUoXCJkYXRhLWluc2VydC1wb3NcIikpIHtcbiAgICAgICAgICAgIHBvcyA9IGkxOG5FbGVtZW50c1tpXS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWluc2VydC1wb3NcIik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDot5/pmo/mtY/op4jlmajnmoTor63oqIDorr7nva7mmL7npLrlhoXlrrlcbiAgICAgICAgaTE4bkVsZW1lbnRzW2ldLmluc2VydEFkamFjZW50VGV4dChcbiAgICAgICAgICAgIHBvcyxcbiAgICAgICAgICAgIGNocm9tZS5pMThuLmdldE1lc3NhZ2UoaTE4bkVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZShcImRhdGEtaTE4bi1uYW1lXCIpKVxuICAgICAgICApO1xuICAgIH1cbn1cbiIsIi8qKlxuICogRXZlbnQgbWFuYWdlci5cbiAqL1xuY2xhc3MgRXZlbnRNYW5hZ2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtOdW1iZXJ9IG5leHQgaGFuZGxlciBJRC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRCA9IDE7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtNYXA8U3RyaW5nLCBTZXQ8TnVtYmVyPj59IGV2ZW50IHRvIGhhbmRsZXIgSURzIG1hcFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtNYXA8TnVtYmVyLCBGdW5jdGlvbj59IGhhbmRsZXIgSUQgdG8gaGFuZGxlciBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlciA9IG5ldyBNYXAoKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gZXZlbnQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0byBoYW5kbGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIGV2ZW50IGhhbmRsZXIsIGFjY2VwdHMgdHdvIGFyZ3VtZW50czpcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZXZlbnQgZGV0YWlsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSBvZiB0aGUgZXZlbnQsIGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXIgb2JqZWN0XG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBhIGNhbmNlbGVyIHRoYXQgd2lsbCByZW1vdmUgdGhlIGhhbmRsZXIgd2hlbiBjYWxsZWRcbiAgICAgKi9cbiAgICBvbihldmVudCwgaGFuZGxlcikge1xuICAgICAgICBjb25zdCBoYW5kbGVySUQgPSB0aGlzLl9hbGxvY0hhbmRsZXJJRCgpO1xuICAgICAgICB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuc2V0KGhhbmRsZXJJRCwgaGFuZGxlcik7XG5cbiAgICAgICAgaWYgKHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLmhhcyhldmVudCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLmdldChldmVudCkuYWRkKGhhbmRsZXJJRCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5zZXQoZXZlbnQsIG5ldyBTZXQoW2hhbmRsZXJJRF0pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVhY2ggY2FuY2VsZXIgc2hvdWxkIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gICAgICAgIGxldCBjYW5jZWxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgIGlmICghY2FuY2VsZWQpIHtcbiAgICAgICAgICAgICAgICBjYW5jZWxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy5fb2ZmKGV2ZW50LCBoYW5kbGVySUQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJZb3Ugc2hvdWxkbid0IGNhbGwgdGhlIGNhbmNlbGVyIG1vcmUgdGhhbiBvbmNlIVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuYmluZCh0aGlzKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgYW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0FueX0gZGV0YWlsIGV2ZW50IGRldGFpbFxuICAgICAqIEBwYXJhbSB7QW55fSBzb3VyY2UgZXZlbnQgc291cmNlXG4gICAgICovXG4gICAgZW1pdChldmVudCwgZGV0YWlsLCBzb3VyY2UpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcklEcyA9IHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLmdldChldmVudCk7XG5cbiAgICAgICAgaWYgKCFoYW5kbGVySURzKSByZXR1cm47XG5cbiAgICAgICAgZm9yIChjb25zdCBoYW5kbGVySUQgb2YgaGFuZGxlcklEcykge1xuICAgICAgICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5nZXQoaGFuZGxlcklEKTtcbiAgICAgICAgICAgIGhhbmRsZXIgJiYgaGFuZGxlcihkZXRhaWwsIHNvdXJjZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2RcbiAgICAgKlxuICAgICAqIEFsbG9jIGEgaGFuZGxlciBJRC5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtOdW1iZXJ9IGFuIHVudXNlZCBoYW5kbGVyIElEXG4gICAgICovXG4gICAgX2FsbG9jSGFuZGxlcklEKCkge1xuICAgICAgICB3aGlsZSAodGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLmhhcyh0aGlzLl9oYW5kbGVySUQpKSB7XG4gICAgICAgICAgICB0aGlzLl9oYW5kbGVySUQgPSAodGhpcy5faGFuZGxlcklEICsgMSkgJSBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5faGFuZGxlcklEO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZFxuICAgICAqXG4gICAgICogUmVtb3ZlIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gaGFuZGxlcklEIGhhbmRsZXIgSURcbiAgICAgKi9cbiAgICBfb2ZmKGV2ZW50LCBoYW5kbGVySUQpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcklEcyA9IHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLmdldChldmVudCk7XG4gICAgICAgIGhhbmRsZXJJRHMgJiYgaGFuZGxlcklEcy5kZWxldGUoaGFuZGxlcklEKTtcbiAgICAgICAgdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLmRlbGV0ZShoYW5kbGVySUQpO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgRXZlbnRNYW5hZ2VyO1xuIiwiLyoqXG4gKiBhIG1hcCBmcm9tIGFiYnJldmlhdGlvbiBvZiBsYW5ndWFnZXMgdGhhdCBzdXBwb3J0ZWQgYnkgYnJvd3NlcnMgdG8gYWJicmV2aWF0aW9uIG9mIHRob3NlIHN1cHBvcnRlZCBieSBFZGdlIFRyYW5zbGF0ZVxuICovXG5jb25zdCBCUk9XU0VSX0xBTkdVQUdFU19NQVAgPSB7XG4gICAgYWNoOiBcImFjaFwiLFxuICAgIGFkeTogXCJlblwiLFxuICAgIGFmOiBcImFmXCIsXG4gICAgXCJhZi1OQVwiOiBcImFmXCIsXG4gICAgXCJhZi1aQVwiOiBcImFmXCIsXG4gICAgYWs6IFwiYWthXCIsXG4gICAgYW06IFwiYW1cIixcbiAgICBhcjogXCJhclwiLFxuICAgIFwiYXItQVJcIjogXCJhclwiLFxuICAgIFwiYXItTUFcIjogXCJhclwiLFxuICAgIFwiYXItU0FcIjogXCJhclwiLFxuICAgIFwiYXktQk9cIjogXCJheW1cIixcbiAgICBhejogXCJhelwiLFxuICAgIFwiYXotQVpcIjogXCJhelwiLFxuICAgIFwiYmUtQllcIjogXCJiZVwiLFxuICAgIGJnOiBcImJnXCIsXG4gICAgXCJiZy1CR1wiOiBcImJnXCIsXG4gICAgYm46IFwiYm5cIixcbiAgICBcImJuLUlOXCI6IFwiYm5cIixcbiAgICBcImJuLUJEXCI6IFwiYm5cIixcbiAgICBcImJzLUJBXCI6IFwiYnNcIixcbiAgICBjYTogXCJjYVwiLFxuICAgIFwiY2EtRVNcIjogXCJjYVwiLFxuICAgIGNhazogXCJlblwiLFxuICAgIGNlYjogXCJjZWJcIixcbiAgICBcImNrLVVTXCI6IFwiY2hyXCIsXG4gICAgY286IFwiY29cIixcbiAgICBjczogXCJjc1wiLFxuICAgIFwiY3MtQ1pcIjogXCJjc1wiLFxuICAgIGN5OiBcImN5XCIsXG4gICAgXCJjeS1HQlwiOiBcImN5XCIsXG4gICAgZGE6IFwiZGFcIixcbiAgICBcImRhLURLXCI6IFwiZGFcIixcbiAgICBkZTogXCJkZVwiLFxuICAgIFwiZGUtQVRcIjogXCJkZVwiLFxuICAgIFwiZGUtREVcIjogXCJkZVwiLFxuICAgIFwiZGUtQ0hcIjogXCJkZVwiLFxuICAgIGRzYjogXCJlblwiLFxuICAgIGVsOiBcImVsXCIsXG4gICAgXCJlbC1HUlwiOiBcImVsXCIsXG4gICAgZW46IFwiZW5cIixcbiAgICBcImVuLUdCXCI6IFwiZW5cIixcbiAgICBcImVuLUFVXCI6IFwiZW5cIixcbiAgICBcImVuLUNBXCI6IFwiZW5cIixcbiAgICBcImVuLUlFXCI6IFwiZW5cIixcbiAgICBcImVuLUlOXCI6IFwiZW5cIixcbiAgICBcImVuLVBJXCI6IFwiZW5cIixcbiAgICBcImVuLVVEXCI6IFwiZW5cIixcbiAgICBcImVuLVVTXCI6IFwiZW5cIixcbiAgICBcImVuLVpBXCI6IFwiZW5cIixcbiAgICBcImVuQHBpcmF0ZVwiOiBcImVuXCIsXG4gICAgZW86IFwiZW9cIixcbiAgICBcImVvLUVPXCI6IFwiZW9cIixcbiAgICBlczogXCJlc1wiLFxuICAgIFwiZXMtQVJcIjogXCJlc1wiLFxuICAgIFwiZXMtNDE5XCI6IFwiZXNcIixcbiAgICBcImVzLUNMXCI6IFwiZXNcIixcbiAgICBcImVzLUNPXCI6IFwiZXNcIixcbiAgICBcImVzLUVDXCI6IFwiZXNcIixcbiAgICBcImVzLUVTXCI6IFwiZXNcIixcbiAgICBcImVzLUxBXCI6IFwiZXNcIixcbiAgICBcImVzLU5JXCI6IFwiZXNcIixcbiAgICBcImVzLU1YXCI6IFwiZXNcIixcbiAgICBcImVzLVVTXCI6IFwiZXNcIixcbiAgICBcImVzLVZFXCI6IFwiZXNcIixcbiAgICBldDogXCJldFwiLFxuICAgIFwiZXQtRUVcIjogXCJldFwiLFxuICAgIGV1OiBcImV1XCIsXG4gICAgXCJldS1FU1wiOiBcImV1XCIsXG4gICAgZmE6IFwiZmFcIixcbiAgICBcImZhLUlSXCI6IFwiZmFcIixcbiAgICBcImZiLUxUXCI6IFwiZW5cIixcbiAgICBmZjogXCJlblwiLFxuICAgIGZpOiBcImZpXCIsXG4gICAgXCJmaS1GSVwiOiBcImZpXCIsXG4gICAgXCJmby1GT1wiOiBcImZhb1wiLFxuICAgIGZyOiBcImZyXCIsXG4gICAgXCJmci1DQVwiOiBcImZyXCIsXG4gICAgXCJmci1GUlwiOiBcImZyXCIsXG4gICAgXCJmci1CRVwiOiBcImZyXCIsXG4gICAgXCJmci1DSFwiOiBcImZyXCIsXG4gICAgXCJmeS1OTFwiOiBcImZ5XCIsXG4gICAgZ2E6IFwiZ2FcIixcbiAgICBcImdhLUlFXCI6IFwiZ2FcIixcbiAgICBnZDogXCJnZFwiLFxuICAgIGdsOiBcImdsXCIsXG4gICAgXCJnbC1FU1wiOiBcImdsXCIsXG4gICAgXCJnbi1QWVwiOiBcImdyblwiLFxuICAgIFwiZ3UtSU5cIjogXCJndVwiLFxuICAgIFwiZ3gtR1JcIjogXCJlbFwiLFxuICAgIGhhOiBcImhhXCIsXG4gICAgaGF3OiBcImhhd1wiLFxuICAgIGhlOiBcImhlXCIsXG4gICAgXCJoZS1JTFwiOiBcImhlXCIsXG4gICAgaGk6IFwiaGlcIixcbiAgICBcImhpLUlOXCI6IFwiaGlcIixcbiAgICBobW46IFwiaG1uXCIsXG4gICAgaHI6IFwiaHJcIixcbiAgICBcImhyLUhSXCI6IFwiaHJcIixcbiAgICBoc2I6IFwiZW5cIixcbiAgICBodDogXCJodFwiLFxuICAgIGh1OiBcImh1XCIsXG4gICAgXCJodS1IVVwiOiBcImh1XCIsXG4gICAgXCJoeS1BTVwiOiBcImh5XCIsXG4gICAgaWQ6IFwiaWRcIixcbiAgICBcImlkLUlEXCI6IFwiaWRcIixcbiAgICBpZzogXCJpZ1wiLFxuICAgIGlzOiBcImlzXCIsXG4gICAgXCJpcy1JU1wiOiBcImlzXCIsXG4gICAgaXQ6IFwiaXRcIixcbiAgICBcIml0LUlUXCI6IFwiaXRcIixcbiAgICBpdzogXCJoZVwiLFxuICAgIGphOiBcImphXCIsXG4gICAgXCJqYS1KUFwiOiBcImphXCIsXG4gICAgXCJqdi1JRFwiOiBcImp3XCIsXG4gICAgXCJrYS1HRVwiOiBcImthXCIsXG4gICAgXCJray1LWlwiOiBcImtrXCIsXG4gICAga206IFwia21cIixcbiAgICBcImttLUtIXCI6IFwia21cIixcbiAgICBrYWI6IFwia2FiXCIsXG4gICAga246IFwia25cIixcbiAgICBcImtuLUlOXCI6IFwia25cIixcbiAgICBrbzogXCJrb1wiLFxuICAgIFwia28tS1JcIjogXCJrb1wiLFxuICAgIFwia3UtVFJcIjogXCJrdVwiLFxuICAgIGt5OiBcImt5XCIsXG4gICAgbGE6IFwibGFcIixcbiAgICBcImxhLVZBXCI6IFwibGFcIixcbiAgICBsYjogXCJsYlwiLFxuICAgIFwibGktTkxcIjogXCJsaW1cIixcbiAgICBsbzogXCJsb1wiLFxuICAgIGx0OiBcImx0XCIsXG4gICAgXCJsdC1MVFwiOiBcImx0XCIsXG4gICAgbHY6IFwibHZcIixcbiAgICBcImx2LUxWXCI6IFwibHZcIixcbiAgICBtYWk6IFwibWFpXCIsXG4gICAgXCJtZy1NR1wiOiBcIm1nXCIsXG4gICAgbWk6IFwibWlcIixcbiAgICBtazogXCJta1wiLFxuICAgIFwibWstTUtcIjogXCJta1wiLFxuICAgIG1sOiBcIm1sXCIsXG4gICAgXCJtbC1JTlwiOiBcIm1sXCIsXG4gICAgXCJtbi1NTlwiOiBcIm1uXCIsXG4gICAgbXI6IFwibXJcIixcbiAgICBcIm1yLUlOXCI6IFwibXJcIixcbiAgICBtczogXCJtc1wiLFxuICAgIFwibXMtTVlcIjogXCJtc1wiLFxuICAgIG10OiBcIm10XCIsXG4gICAgXCJtdC1NVFwiOiBcIm10XCIsXG4gICAgbXk6IFwibXlcIixcbiAgICBubzogXCJub1wiLFxuICAgIG5iOiBcIm5vXCIsXG4gICAgXCJuYi1OT1wiOiBcIm5vXCIsXG4gICAgbmU6IFwibmVcIixcbiAgICBcIm5lLU5QXCI6IFwibmVcIixcbiAgICBubDogXCJubFwiLFxuICAgIFwibmwtQkVcIjogXCJubFwiLFxuICAgIFwibmwtTkxcIjogXCJubFwiLFxuICAgIFwibm4tTk9cIjogXCJub1wiLFxuICAgIG55OiBcIm55XCIsXG4gICAgb2M6IFwib2NpXCIsXG4gICAgXCJvci1JTlwiOiBcIm9yXCIsXG4gICAgcGE6IFwicGFcIixcbiAgICBcInBhLUlOXCI6IFwicGFcIixcbiAgICBwbDogXCJwbFwiLFxuICAgIFwicGwtUExcIjogXCJwbFwiLFxuICAgIFwicHMtQUZcIjogXCJwc1wiLFxuICAgIHB0OiBcInB0XCIsXG4gICAgXCJwdC1CUlwiOiBcInB0XCIsXG4gICAgXCJwdC1QVFwiOiBcInB0XCIsXG4gICAgXCJxdS1QRVwiOiBcInF1ZVwiLFxuICAgIFwicm0tQ0hcIjogXCJyb2hcIixcbiAgICBybzogXCJyb1wiLFxuICAgIFwicm8tUk9cIjogXCJyb1wiLFxuICAgIHJ1OiBcInJ1XCIsXG4gICAgXCJydS1SVVwiOiBcInJ1XCIsXG4gICAgXCJzYS1JTlwiOiBcInNhblwiLFxuICAgIHNkOiBcInNkXCIsXG4gICAgXCJzZS1OT1wiOiBcInNtZVwiLFxuICAgIFwic2ktTEtcIjogXCJzaVwiLFxuICAgIHNrOiBcInNrXCIsXG4gICAgXCJzay1TS1wiOiBcInNrXCIsXG4gICAgc2w6IFwic2xcIixcbiAgICBcInNsLVNJXCI6IFwic2xcIixcbiAgICBzbTogXCJzbVwiLFxuICAgIHNuOiBcInNuXCIsXG4gICAgXCJzby1TT1wiOiBcInNvXCIsXG4gICAgc3E6IFwic3FcIixcbiAgICBcInNxLUFMXCI6IFwic3FcIixcbiAgICBzcjogXCJzclwiLFxuICAgIFwic3ItUlNcIjogXCJzclwiLFxuICAgIHN0OiBcInN0XCIsXG4gICAgc3U6IFwic3VcIixcbiAgICBzdjogXCJzdlwiLFxuICAgIFwic3YtU0VcIjogXCJzdlwiLFxuICAgIHN3OiBcInN3XCIsXG4gICAgXCJzdy1LRVwiOiBcInN3XCIsXG4gICAgdGE6IFwidGFcIixcbiAgICBcInRhLUlOXCI6IFwidGFcIixcbiAgICB0ZTogXCJ0ZVwiLFxuICAgIFwidGUtSU5cIjogXCJ0ZVwiLFxuICAgIHRnOiBcInRnXCIsXG4gICAgXCJ0Zy1USlwiOiBcInRnXCIsXG4gICAgdGg6IFwidGhcIixcbiAgICBcInRoLVRIXCI6IFwidGhcIixcbiAgICB0bDogXCJmaWxcIixcbiAgICBcInRsLVBIXCI6IFwiZmlsXCIsXG4gICAgdGxoOiBcInRsaFwiLFxuICAgIHRyOiBcInRyXCIsXG4gICAgXCJ0ci1UUlwiOiBcInRyXCIsXG4gICAgXCJ0dC1SVVwiOiBcInRhdFwiLFxuICAgIHVrOiBcInVrXCIsXG4gICAgXCJ1ay1VQVwiOiBcInVrXCIsXG4gICAgdXI6IFwidXJcIixcbiAgICBcInVyLVBLXCI6IFwidXJcIixcbiAgICB1ejogXCJ1elwiLFxuICAgIFwidXotVVpcIjogXCJ1elwiLFxuICAgIHZpOiBcInZpXCIsXG4gICAgXCJ2aS1WTlwiOiBcInZpXCIsXG4gICAgXCJ4aC1aQVwiOiBcInhoXCIsXG4gICAgeWk6IFwieWlcIixcbiAgICBcInlpLURFXCI6IFwieWlcIixcbiAgICB5bzogXCJ5b1wiLFxuICAgIHpoOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1IYW5zXCI6IFwiemgtQ05cIixcbiAgICBcInpoLUhhbnRcIjogXCJ6aC1UV1wiLFxuICAgIFwiemgtQ05cIjogXCJ6aC1DTlwiLFxuICAgIFwiemgtSEtcIjogXCJ6aC1UV1wiLFxuICAgIFwiemgtU0dcIjogXCJ6aC1DTlwiLFxuICAgIFwiemgtVFdcIjogXCJ6aC1UV1wiLFxuICAgIFwienUtWkFcIjogXCJ6dVwiLFxufTtcblxuLyoqXG4gKiBFeHBvcnQgbGFuZ3VhZ2VzIGFuZCBicm93c2VyIGxhbmd1YWdlcyBtYXAuXG4gKi9cbmV4cG9ydCB7IEJST1dTRVJfTEFOR1VBR0VTX01BUCB9O1xuIiwiZXhwb3J0IHtcbiAgICBsb2dJbmZvLFxuICAgIGxvZ1dhcm4sXG4gICAgbG9nRXJyb3IsXG4gICAgc2hvdWxkRmlsdGVyRXJyb3IsXG4gICAgd3JhcENvbnNvbGVGb3JGaWx0ZXJpbmcsXG4gICAgc2V0TG9nTGV2ZWwsXG4gICAgZ2V0TG9nTGV2ZWwsXG59O1xuXG4vLyBLbm93biBub2lzeSBlcnJvciBwYXR0ZXJucyB0byBzdXBwcmVzcyBpbiBsb2dzXG5jb25zdCBGSUxURVJFRF9FUlJPUl9QQVRURVJOUyA9IFtcbiAgICBcIlVuYWJsZSB0byBkb3dubG9hZFwiLFxuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkIGFsbCBzcGVjaWZpZWQgaW1hZ2VzXCIsXG4gICAgXCJDYW5ub3QgYWNjZXNzXCIsXG4gICAgXCJiZWZvcmUgaW5pdGlhbGl6YXRpb25cIixcbiAgICBcIkV4dGVuc2lvbiBjb250ZXh0IGludmFsaWRhdGVkXCIsXG4gICAgXCJDYW52YXMgZXJyb3JcIixcbiAgICBcIk5ldHdvcmsgZXJyb3JcIixcbl07XG5cbmZ1bmN0aW9uIGpvaW5NZXNzYWdlKGFyZ3MpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXJnc1xuICAgICAgICAgICAgLm1hcCgodikgPT4gKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gdiA6ICh2ICYmIHYubWVzc2FnZSkgfHwgSlNPTi5zdHJpbmdpZnkodikpKVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgcmV0dXJuIGFyZ3Muam9pbihcIiBcIik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSB7XG4gICAgaWYgKCFtZXNzYWdlKSByZXR1cm4gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIEZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TLnNvbWUoKHBhdHRlcm4pID0+IG1lc3NhZ2UuaW5jbHVkZXMocGF0dGVybikpIHx8XG4gICAgICAgICAgICAvQ2Fubm90IGFjY2VzcyAnLionIGJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAgICAgL1JlZmVyZW5jZUVycm9yLipiZWZvcmUgaW5pdGlhbGl6YXRpb24vLnRlc3QobWVzc2FnZSkgfHxcbiAgICAgICAgICAgIC9VbmFibGUgdG8gZG93bmxvYWQuKmltYWdlcy8udGVzdChtZXNzYWdlKVxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLy8gTG9nIGxldmVsOiAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdzaWxlbnQnXG5jb25zdCBMRVZFTF9PUkRFUiA9IHsgZGVidWc6IDEwLCBpbmZvOiAyMCwgd2FybjogMzAsIGVycm9yOiA0MCwgc2lsZW50OiA5MCB9O1xubGV0IGN1cnJlbnRMZXZlbCA9XG4gICAgdHlwZW9mIEJVSUxEX0VOViAhPT0gXCJ1bmRlZmluZWRcIiAmJiBCVUlMRF9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IFwiZGVidWdcIiA6IFwid2FyblwiO1xuXG5mdW5jdGlvbiBzZXRMb2dMZXZlbChsZXZlbCkge1xuICAgIGlmIChMRVZFTF9PUkRFUltsZXZlbF0gIT0gbnVsbCkgY3VycmVudExldmVsID0gbGV2ZWw7XG59XG5cbmZ1bmN0aW9uIGdldExvZ0xldmVsKCkge1xuICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG59XG5cbmZ1bmN0aW9uIHNob3VsZEVtaXQobGV2ZWwpIHtcbiAgICByZXR1cm4gTEVWRUxfT1JERVJbbGV2ZWxdID49IExFVkVMX09SREVSW2N1cnJlbnRMZXZlbF07XG59XG5cbmZ1bmN0aW9uIGxvZ0luZm8oLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcImluZm9cIikpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKFwiW0VkZ2VUcmFuc2xhdGVdXCIsIC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBsb2dXYXJuKC4uLmFyZ3MpIHtcbiAgICBpZiAoIXNob3VsZEVtaXQoXCJ3YXJuXCIpKSByZXR1cm47XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4oXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbmZ1bmN0aW9uIGxvZ0Vycm9yKC4uLmFyZ3MpIHtcbiAgICBpZiAoIXNob3VsZEVtaXQoXCJlcnJvclwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBqb2luTWVzc2FnZShhcmdzKTtcbiAgICBpZiAoc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IoXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbi8vIE9wdGlvbmFsOiBnbG9iYWxseSB3cmFwIGNvbnNvbGUuZXJyb3IgdG8gc3VwcHJlc3Mgbm9pc3kgZXJyb3JzXG5mdW5jdGlvbiB3cmFwQ29uc29sZUZvckZpbHRlcmluZygpIHtcbiAgICBjb25zdCBvcmlnaW5hbENvbnNvbGVFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGpvaW5NZXNzYWdlKGFyZ3MpO1xuICAgICAgICBpZiAoIXNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVFcnJvci5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4iLCJpbXBvcnQgeyBCUk9XU0VSX0xBTkdVQUdFU19NQVAgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvbGFuZ3VhZ2VzLmpzXCI7XG5cbi8qKlxuICogZGVmYXVsdCBzZXR0aW5ncyBmb3IgdGhpcyBleHRlbnNpb25cbiAqL1xuY29uc3QgREVGQVVMVF9TRVRUSU5HUyA9IHtcbiAgICBibGFja2xpc3Q6IHtcbiAgICAgICAgdXJsczoge30sXG4gICAgICAgIGRvbWFpbnM6IHsgXCJjaHJvbWUuZ29vZ2xlLmNvbVwiOiB0cnVlLCBleHRlbnNpb25zOiB0cnVlIH0sXG4gICAgfSxcbiAgICAvLyBSZXNpemU6IGRldGVybWluZSB3aGV0aGVyIHRoZSB3ZWIgcGFnZSB3aWxsIHJlc2l6ZSB3aGVuIHNob3dpbmcgdHJhbnNsYXRpb24gcmVzdWx0XG4gICAgLy8gUlRMOiBkZXRlcm1pbmUgd2hldGhlciB0aGUgdGV4dCBpbiB0cmFuc2xhdGlvbiBibG9jayBzaG91bGQgZGlzcGxheSBmcm9tIHJpZ2h0IHRvIGxlZnRcbiAgICAvLyBGb2xkTG9uZ0NvbnRlbnQ6IGRldGVybWluZSB3aGV0aGVyIHRvIGZvbGQgbG9uZyB0cmFuc2xhdGlvbiBjb250ZW50XG4gICAgLy8gU2VsZWN0VHJhbnNsYXRlUG9zaXRpb246IHRoZSBwb3NpdGlvbiBvZiBzZWxlY3QgdHJhbnNsYXRlIGJ1dHRvbi5cbiAgICBMYXlvdXRTZXR0aW5nczoge1xuICAgICAgICBSZXNpemU6IGZhbHNlLFxuICAgICAgICBSVEw6IGZhbHNlLFxuICAgICAgICBGb2xkTG9uZ0NvbnRlbnQ6IHRydWUsXG4gICAgICAgIFNlbGVjdFRyYW5zbGF0ZVBvc2l0aW9uOiBcIlRvcFJpZ2h0XCIsXG4gICAgfSxcbiAgICAvLyBEZWZhdWx0IHNldHRpbmdzIG9mIHNvdXJjZSBsYW5ndWFnZSBhbmQgdGFyZ2V0IGxhbmd1YWdlXG4gICAgbGFuZ3VhZ2VTZXR0aW5nOiB7IHNsOiBcImF1dG9cIiwgdGw6IEJST1dTRVJfTEFOR1VBR0VTX01BUFtjaHJvbWUuaTE4bi5nZXRVSUxhbmd1YWdlKCldIH0sXG4gICAgT3RoZXJTZXR0aW5nczoge1xuICAgICAgICBNdXR1YWxUcmFuc2xhdGU6IGZhbHNlLFxuICAgICAgICBTZWxlY3RUcmFuc2xhdGU6IHRydWUsXG4gICAgICAgIFRyYW5zbGF0ZUFmdGVyRGJsQ2xpY2s6IGZhbHNlLFxuICAgICAgICBUcmFuc2xhdGVBZnRlclNlbGVjdDogZmFsc2UsXG4gICAgICAgIENhbmNlbFRleHRTZWxlY3Rpb246IGZhbHNlLFxuICAgICAgICBVc2VHb29nbGVBbmFseXRpY3M6IHRydWUsXG4gICAgfSxcbiAgICBEZWZhdWx0VHJhbnNsYXRvcjogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICBEZWZhdWx0UGFnZVRyYW5zbGF0b3I6IFwiR29vZ2xlUGFnZVRyYW5zbGF0ZVwiLFxuICAgIEh5YnJpZFRyYW5zbGF0b3JDb25maWc6IHtcbiAgICAgICAgLy8gVGhlIHRyYW5zbGF0b3JzIHVzZWQgaW4gY3VycmVudCBoeWJyaWQgdHJhbnNsYXRlLlxuICAgICAgICB0cmFuc2xhdG9yczogW1wiQmluZ1RyYW5zbGF0ZVwiLCBcIkdvb2dsZVRyYW5zbGF0ZVwiXSxcblxuICAgICAgICAvLyBUaGUgdHJhbnNsYXRvcnMgZm9yIGVhY2ggaXRlbS5cbiAgICAgICAgc2VsZWN0aW9uczoge1xuICAgICAgICAgICAgLy8gQVRURU5USU9OOiBUaGUgZm9sbG93aW5nIGZvdXIgaXRlbXMgTVVTVCBIQVZFIFRIRSBTQU1FIFRSQU5TTEFUT1IhXG4gICAgICAgICAgICBvcmlnaW5hbFRleHQ6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBtYWluTWVhbmluZzogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIHRQcm9udW5jaWF0aW9uOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgc1Byb251bmNpYXRpb246IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG5cbiAgICAgICAgICAgIC8vIEZvciB0aGUgZm9sbG93aW5nIHRocmVlIGl0ZW1zLCBhbnkgdHJhbnNsYXRvciBjb21iaW5hdGlvbiBpcyBPSy5cbiAgICAgICAgICAgIGRldGFpbGVkTWVhbmluZ3M6IFwiQmluZ1RyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgZGVmaW5pdGlvbnM6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBleGFtcGxlczogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIC8vIERlZmluZXMgd2hpY2ggY29udGVudHMgaW4gdGhlIHRyYW5zbGF0aW5nIHJlc3VsdCBzaG91bGQgYmUgZGlzcGxheWVkLlxuICAgIFRyYW5zbGF0ZVJlc3VsdEZpbHRlcjoge1xuICAgICAgICBtYWluTWVhbmluZzogdHJ1ZSxcbiAgICAgICAgb3JpZ2luYWxUZXh0OiB0cnVlLFxuICAgICAgICB0UHJvbnVuY2lhdGlvbjogdHJ1ZSxcbiAgICAgICAgc1Byb251bmNpYXRpb246IHRydWUsXG4gICAgICAgIHRQcm9udW5jaWF0aW9uSWNvbjogdHJ1ZSxcbiAgICAgICAgc1Byb251bmNpYXRpb25JY29uOiB0cnVlLFxuICAgICAgICBkZXRhaWxlZE1lYW5pbmdzOiB0cnVlLFxuICAgICAgICBkZWZpbml0aW9uczogdHJ1ZSxcbiAgICAgICAgZXhhbXBsZXM6IHRydWUsXG4gICAgfSxcbiAgICAvLyBEZWZpbmVzIHRoZSBvcmRlciBvZiBkaXNwbGF5aW5nIGNvbnRlbnRzLlxuICAgIENvbnRlbnREaXNwbGF5T3JkZXI6IFtcbiAgICAgICAgXCJtYWluTWVhbmluZ1wiLFxuICAgICAgICBcIm9yaWdpbmFsVGV4dFwiLFxuICAgICAgICBcImRldGFpbGVkTWVhbmluZ3NcIixcbiAgICAgICAgXCJkZWZpbml0aW9uc1wiLFxuICAgICAgICBcImV4YW1wbGVzXCIsXG4gICAgXSxcbiAgICBIaWRlUGFnZVRyYW5zbGF0b3JCYW5uZXI6IGZhbHNlLFxufTtcblxuLyoqXG4gKiBhc3NpZ24gZGVmYXVsdCB2YWx1ZSB0byBzZXR0aW5ncyB3aGljaCBhcmUgdW5kZWZpbmVkIGluIHJlY3Vyc2l2ZSB3YXlcbiAqIEBwYXJhbSB7Kn0gcmVzdWx0IHNldHRpbmcgcmVzdWx0IHN0b3JlZCBpbiBjaHJvbWUuc3RvcmFnZVxuICogQHBhcmFtIHsqfSBzZXR0aW5ncyBkZWZhdWx0IHNldHRpbmdzXG4gKi9cbmZ1bmN0aW9uIHNldERlZmF1bHRTZXR0aW5ncyhyZXN1bHQsIHNldHRpbmdzKSB7XG4gICAgZm9yIChsZXQgaSBpbiBzZXR0aW5ncykge1xuICAgICAgICAvLyBzZXR0aW5nc1tpXSBjb250YWlucyBrZXktdmFsdWUgc2V0dGluZ3NcbiAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIHNldHRpbmdzW2ldID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgICAgICAhKHNldHRpbmdzW2ldIGluc3RhbmNlb2YgQXJyYXkpICYmXG4gICAgICAgICAgICBPYmplY3Qua2V5cyhzZXR0aW5nc1tpXSkubGVuZ3RoID4gMFxuICAgICAgICApIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHRbaV0pIHtcbiAgICAgICAgICAgICAgICBzZXREZWZhdWx0U2V0dGluZ3MocmVzdWx0W2ldLCBzZXR0aW5nc1tpXSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHNldHRpbmdzW2ldIGNvbnRhaW5zIHNldmVyYWwgc2V0dGluZyBpdGVtcyBidXQgdGhlc2UgaGF2ZSBub3QgYmVlbiBzZXQgYmVmb3JlXG4gICAgICAgICAgICAgICAgcmVzdWx0W2ldID0gc2V0dGluZ3NbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAocmVzdWx0W2ldID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIHNldHRpbmdzW2ldIGlzIGEgc2luZ2xlIHNldHRpbmcgaXRlbSBhbmQgaXQgaGFzIG5vdCBiZWVuIHNldCBiZWZvcmVcbiAgICAgICAgICAgIHJlc3VsdFtpXSA9IHNldHRpbmdzW2ldO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4vKipcbiAqIEdldCBzZXR0aW5ncyBmcm9tIHN0b3JhZ2UuIElmIHNvbWUgb2YgdGhlIHNldHRpbmdzIGhhdmUgbm90IGJlZW4gaW5pdGlhbGl6ZWQsXG4gKiBpbml0aWFsaXplIHRoZW0gd2l0aCB0aGUgZ2l2ZW4gZGVmYXVsdCB2YWx1ZXMuXG4gKlxuICogQHBhcmFtIHtTdHJpbmcgfCBBcnJheTxTdHJpbmc+fSBzZXR0aW5ncyBzZXR0aW5nIG5hbWUgdG8gZ2V0XG4gKiBAcGFyYW0ge09iamVjdCB8IEZ1bmN0aW9ufSBkZWZhdWx0cyBkZWZhdWx0IHZhbHVlcyBvciBmdW5jdGlvbiB0byBnZW5lcmF0ZSBkZWZhdWx0IHZhbHVlc1xuICogQHJldHVybnMge1Byb21pc2U8QW55Pn0gc2V0dGluZ3NcbiAqL1xuZnVuY3Rpb24gZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3Moc2V0dGluZ3MsIGRlZmF1bHRzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG9ubHkgb25lIHNldHRpbmcgdG8gZ2V0LCB3YXJwIGl0IHVwLlxuICAgICAgICBpZiAodHlwZW9mIHNldHRpbmdzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBzZXR0aW5ncyA9IFtzZXR0aW5nc107XG4gICAgICAgIH0gZWxzZSBpZiAoc2V0dGluZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gSWYgc2V0dGluZ3MgaXMgdW5kZWZpbmVkLCBjb2xsZWN0IGFsbCBzZXR0aW5nIGtleXMgaW4gZGVmYXVsdHMuXG4gICAgICAgICAgICBzZXR0aW5ncyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRlZmF1bHRzKSB7XG4gICAgICAgICAgICAgICAgc2V0dGluZ3MucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5nZXQoc2V0dGluZ3MsIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGxldCB1cGRhdGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGZvciAobGV0IHNldHRpbmcgb2Ygc2V0dGluZ3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdFtzZXR0aW5nXSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRlZmF1bHRzID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRzID0gZGVmYXVsdHMoc2V0dGluZ3MpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdFtzZXR0aW5nXSA9IGRlZmF1bHRzW3NldHRpbmddO1xuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh1cGRhdGVkKSB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQocmVzdWx0LCAoKSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5leHBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCBzZXREZWZhdWx0U2V0dGluZ3MsIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzIH07XG4iLCJ2YXIgVT1PYmplY3QuZGVmaW5lUHJvcGVydHk7dmFyIE09KGgsZSx0KT0+ZSBpbiBoP1UoaCxlLHtlbnVtZXJhYmxlOiEwLGNvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMCx2YWx1ZTp0fSk6aFtlXT10O3ZhciBpPShoLGUsdCk9PihNKGgsdHlwZW9mIGUhPVwic3ltYm9sXCI/ZStcIlwiOmUsdCksdCk7Y29uc3QgTD0oKT0+e2NvbnN0IGg9ZnVuY3Rpb24oZSl7dHlwZW9mIGU9PVwic3RyaW5nXCImJihlPXt1cmw6ZSxtZXRob2Q6XCJHRVRcIn0pO2NvbnN0e3VybDp0LG1ldGhvZDpzPVwiR0VUXCIsZGF0YTphLGhlYWRlcnM6bj17fSx0aW1lb3V0Om89MCxwYXJhbXM6cixyZXNwb25zZVR5cGU6bD1cImpzb25cIixiYXNlVVJMOnU9XCJcIix2YWxpZGF0ZVN0YXR1czpUPWM9PmM+PTIwMCYmYzwzMDB9PWU7bGV0IFI9dT91K3Q6dDtpZihyKXtjb25zdCBjPW5ldyBVUkxTZWFyY2hQYXJhbXMocik7Uis9KFIuaW5jbHVkZXMoXCI/XCIpP1wiJlwiOlwiP1wiKStjLnRvU3RyaW5nKCl9Y29uc3QgbT17bWV0aG9kOnMudG9VcHBlckNhc2UoKSxoZWFkZXJzOm5ldyBIZWFkZXJzKG4pfTtpZihhJiYhW1wiR0VUXCIsXCJIRUFEXCJdLmluY2x1ZGVzKG0ubWV0aG9kKSlpZih0eXBlb2YgYT09XCJzdHJpbmdcIiltLmJvZHk9YTtlbHNlIGlmKGEgaW5zdGFuY2VvZiBGb3JtRGF0YSltLmJvZHk9YTtlbHNlIGlmKGEgaW5zdGFuY2VvZiBVUkxTZWFyY2hQYXJhbXMpe20uYm9keT1hO2NvbnN0IGM9bS5oZWFkZXJzO2MuZ2V0KFwiY29udGVudC10eXBlXCIpfHxjLnNldChcImNvbnRlbnQtdHlwZVwiLFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkXCIpfWVsc2UgaWYoYSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyfHxhIGluc3RhbmNlb2YgVWludDhBcnJheSltLmJvZHk9YTtlbHNle20uYm9keT1KU09OLnN0cmluZ2lmeShhKTtjb25zdCBjPW0uaGVhZGVycztjLmdldChcImNvbnRlbnQtdHlwZVwiKXx8Yy5zZXQoXCJjb250ZW50LXR5cGVcIixcImFwcGxpY2F0aW9uL2pzb25cIil9Y29uc3QgeT1uZXcgQWJvcnRDb250cm9sbGVyO20uc2lnbmFsPXkuc2lnbmFsO2xldCBmPW51bGw7cmV0dXJuIG8+MCYmKGY9c2V0VGltZW91dCgoKT0+eS5hYm9ydCgpLG8pKSxmZXRjaChSLG0pLnRoZW4oYz0+e2YmJmNsZWFyVGltZW91dChmKTtsZXQgZztzd2l0Y2gobCl7Y2FzZVwidGV4dFwiOmc9Yy50ZXh0KCk7YnJlYWs7Y2FzZVwiYmxvYlwiOmc9Yy5ibG9iKCk7YnJlYWs7Y2FzZVwiYXJyYXlidWZmZXJcIjpnPWMuYXJyYXlCdWZmZXIoKTticmVhaztjYXNlXCJqc29uXCI6ZGVmYXVsdDpnPWMudGV4dCgpLnRoZW4oQT0+e3RyeXtyZXR1cm4gQT9KU09OLnBhcnNlKEEpOnt9fWNhdGNoe3JldHVybiBBfX0pO2JyZWFrfXJldHVybiBnLnRoZW4oQT0+e2NvbnN0IGs9e30sUz1jLmhlYWRlcnM7UyYmdHlwZW9mIFMuZm9yRWFjaD09XCJmdW5jdGlvblwiJiZTLmZvckVhY2goKGQsTik9PntrW05dPWR9KTtjb25zdCBFPXtkYXRhOkEsc3RhdHVzOmMuc3RhdHVzLHN0YXR1c1RleHQ6Yy5zdGF0dXNUZXh0LGhlYWRlcnM6ayxjb25maWc6ZSxyZXF1ZXN0Ont9fTtpZighVChjLnN0YXR1cykpe2NvbnN0IGQ9bmV3IEVycm9yKGBSZXF1ZXN0IGZhaWxlZCB3aXRoIHN0YXR1cyAke2Muc3RhdHVzfWApO3Rocm93IGQuY29uZmlnPWUsZC5yZXNwb25zZT1FLGQuY29kZT1jLnN0YXR1cz49NTAwP1wiRUNPTk5BQk9SVEVEXCI6XCJFUlJfQkFEX1JFUVVFU1RcIixkfXJldHVybiBFfSl9KS5jYXRjaChjPT57aWYoZiYmY2xlYXJUaW1lb3V0KGYpLGMubmFtZT09PVwiQWJvcnRFcnJvclwiKXtjb25zdCBnPW5ldyBFcnJvcihgUmVxdWVzdCB0aW1lb3V0IGFmdGVyICR7b31tc2ApO3Rocm93IGcuY29uZmlnPWUsZy5jb2RlPVwiRUNPTk5BQk9SVEVEXCIse2Vycm9yVHlwZTpcIk5FVF9FUlJcIixlcnJvckNvZGU6MCxlcnJvck1zZzpnLm1lc3NhZ2V9fWVsc2UgdGhyb3cgYy5yZXNwb25zZT97ZXJyb3JUeXBlOlwiTkVUX0VSUlwiLGVycm9yQ29kZTpjLnJlc3BvbnNlLnN0YXR1c3x8MCxlcnJvck1zZzpjLm1lc3NhZ2V8fFwiUmVxdWVzdCBmYWlsZWRcIn06e2Vycm9yVHlwZTpcIk5FVF9FUlJcIixlcnJvckNvZGU6MCxlcnJvck1zZzpjLm1lc3NhZ2V8fFwiTmV0d29yayBFcnJvclwifX0pfTtyZXR1cm4gaC5nZXQ9KGUsdD17fSk9Pmgoey4uLnQsdXJsOmUsbWV0aG9kOlwiR0VUXCJ9KSxoLnBvc3Q9KGUsdCxzPXt9KT0+aCh7Li4ucyx1cmw6ZSxkYXRhOnQsbWV0aG9kOlwiUE9TVFwifSksaC5wdXQ9KGUsdCxzPXt9KT0+aCh7Li4ucyx1cmw6ZSxkYXRhOnQsbWV0aG9kOlwiUFVUXCJ9KSxoLnBhdGNoPShlLHQscz17fSk9Pmgoey4uLnMsdXJsOmUsZGF0YTp0LG1ldGhvZDpcIlBBVENIXCJ9KSxoLmRlbGV0ZT0oZSx0PXt9KT0+aCh7Li4udCx1cmw6ZSxtZXRob2Q6XCJERUxFVEVcIn0pLGguaGVhZD0oZSx0PXt9KT0+aCh7Li4udCx1cmw6ZSxtZXRob2Q6XCJIRUFEXCJ9KSxoLm9wdGlvbnM9KGUsdD17fSk9Pmgoey4uLnQsdXJsOmUsbWV0aG9kOlwiT1BUSU9OU1wifSksaC5kZWZhdWx0cz17aGVhZGVyczp7Y29tbW9uOnt9LGdldDp7fSxwb3N0OntcIkNvbnRlbnQtVHlwZVwiOlwiYXBwbGljYXRpb24vanNvblwifSxwdXQ6e1wiQ29udGVudC1UeXBlXCI6XCJhcHBsaWNhdGlvbi9qc29uXCJ9LHBhdGNoOntcIkNvbnRlbnQtVHlwZVwiOlwiYXBwbGljYXRpb24vanNvblwifX0sdGltZW91dDowLHJlc3BvbnNlVHlwZTpcImpzb25cIixiYXNlVVJMOlwiXCIsdmFsaWRhdGVTdGF0dXM6ZT0+ZT49MjAwJiZlPDMwMH0saC5pbnRlcmNlcHRvcnM9e3JlcXVlc3Q6e3VzZTooKT0+e30sZWplY3Q6KCk9Pnt9fSxyZXNwb25zZTp7dXNlOigpPT57fSxlamVjdDooKT0+e319fSxoLmNyZWF0ZT0oZT17fSk9Pntjb25zdCB0PUwoKTtyZXR1cm4gT2JqZWN0LmFzc2lnbih0LmRlZmF1bHRzLGUpLHR9LGguaXNBeGlvc0Vycm9yPWU9PmUmJihlLmVycm9yVHlwZT09PVwiTkVUX0VSUlwifHxlLmNvbmZpZyYmZS5jb2RlKSxofSxwPUwoKSxiPVtbXCJhdXRvXCIsXCJhdXRvLWRldGVjdFwiXSxbXCJhclwiLFwiYXJcIl0sW1wiZ2FcIixcImdhXCJdLFtcImV0XCIsXCJldFwiXSxbXCJvclwiLFwib3JcIl0sW1wiYmdcIixcImJnXCJdLFtcImlzXCIsXCJpc1wiXSxbXCJwbFwiLFwicGxcIl0sW1wiYnNcIixcImJzLUxhdG5cIl0sW1wiZmFcIixcImZhXCJdLFtcInByc1wiLFwicHJzXCJdLFtcImRhXCIsXCJkYVwiXSxbXCJkZVwiLFwiZGVcIl0sW1wicnVcIixcInJ1XCJdLFtcImZyXCIsXCJmclwiXSxbXCJ6aC1UV1wiLFwiemgtSGFudFwiXSxbXCJmaWxcIixcImZpbFwiXSxbXCJmalwiLFwiZmpcIl0sW1wiZmlcIixcImZpXCJdLFtcImd1XCIsXCJndVwiXSxbXCJra1wiLFwia2tcIl0sW1wiaHRcIixcImh0XCJdLFtcImtvXCIsXCJrb1wiXSxbXCJubFwiLFwibmxcIl0sW1wiY2FcIixcImNhXCJdLFtcInpoLUNOXCIsXCJ6aC1IYW5zXCJdLFtcImNzXCIsXCJjc1wiXSxbXCJrblwiLFwia25cIl0sW1wib3RxXCIsXCJvdHFcIl0sW1widGxoXCIsXCJ0bGhcIl0sW1wiaHJcIixcImhyXCJdLFtcImx2XCIsXCJsdlwiXSxbXCJsdFwiLFwibHRcIl0sW1wicm9cIixcInJvXCJdLFtcIm1nXCIsXCJtZ1wiXSxbXCJtdFwiLFwibXRcIl0sW1wibXJcIixcIm1yXCJdLFtcIm1sXCIsXCJtbFwiXSxbXCJtc1wiLFwibXNcIl0sW1wibWlcIixcIm1pXCJdLFtcImJuXCIsXCJibi1CRFwiXSxbXCJobW5cIixcIm13d1wiXSxbXCJhZlwiLFwiYWZcIl0sW1wicGFcIixcInBhXCJdLFtcInB0XCIsXCJwdFwiXSxbXCJwc1wiLFwicHNcIl0sW1wiamFcIixcImphXCJdLFtcInN2XCIsXCJzdlwiXSxbXCJzbVwiLFwic21cIl0sW1wic3ItTGF0blwiLFwic3ItTGF0blwiXSxbXCJzci1DeXJsXCIsXCJzci1DeXJsXCJdLFtcIm5vXCIsXCJuYlwiXSxbXCJza1wiLFwic2tcIl0sW1wic2xcIixcInNsXCJdLFtcInN3XCIsXCJzd1wiXSxbXCJ0eVwiLFwidHlcIl0sW1widGVcIixcInRlXCJdLFtcInRhXCIsXCJ0YVwiXSxbXCJ0aFwiLFwidGhcIl0sW1widG9cIixcInRvXCJdLFtcInRyXCIsXCJ0clwiXSxbXCJjeVwiLFwiY3lcIl0sW1widXJcIixcInVyXCJdLFtcInVrXCIsXCJ1a1wiXSxbXCJlc1wiLFwiZXNcIl0sW1wiaGVcIixcIml3XCJdLFtcImVsXCIsXCJlbFwiXSxbXCJodVwiLFwiaHVcIl0sW1wiaXRcIixcIml0XCJdLFtcImhpXCIsXCJoaVwiXSxbXCJpZFwiLFwiaWRcIl0sW1wiZW5cIixcImVuXCJdLFtcInl1YVwiLFwieXVhXCJdLFtcInl1ZVwiLFwieXVhXCJdLFtcInZpXCIsXCJ2aVwiXSxbXCJrdVwiLFwia3VcIl0sW1wia21yXCIsXCJrbXJcIl1dLEQ9e2FyOltcImFyLVNBXCIsXCJNYWxlXCIsXCJhci1TQS1OYWF5ZlwiXSxiZzpbXCJiZy1CR1wiLFwiTWFsZVwiLFwiYmctQkctSXZhblwiXSxjYTpbXCJjYS1FU1wiLFwiRmVtYWxlXCIsXCJjYS1FUy1IZXJlbmFSVVNcIl0sY3M6W1wiY3MtQ1pcIixcIk1hbGVcIixcImNzLUNaLUpha3ViXCJdLGRhOltcImRhLURLXCIsXCJGZW1hbGVcIixcImRhLURLLUhlbGxlUlVTXCJdLGRlOltcImRlLURFXCIsXCJGZW1hbGVcIixcImRlLURFLUhlZGRhXCJdLGVsOltcImVsLUdSXCIsXCJNYWxlXCIsXCJlbC1HUi1TdGVmYW5vc1wiXSxlbjpbXCJlbi1VU1wiLFwiRmVtYWxlXCIsXCJlbi1VUy1KZXNzYVJVU1wiXSxlczpbXCJlcy1FU1wiLFwiRmVtYWxlXCIsXCJlcy1FUy1MYXVyYS1BcG9sbG9cIl0sZmk6W1wiZmktRklcIixcIkZlbWFsZVwiLFwiZmktRkktSGVpZGlSVVNcIl0sZnI6W1wiZnItRlJcIixcIkZlbWFsZVwiLFwiZnItRlItSnVsaWUtQXBvbGxvXCJdLGhlOltcImhlLUlMXCIsXCJNYWxlXCIsXCJoZS1JTC1Bc2FmXCJdLGhpOltcImhpLUlOXCIsXCJGZW1hbGVcIixcImhpLUlOLUthbHBhbmEtQXBvbGxvXCJdLGhyOltcImhyLUhSXCIsXCJNYWxlXCIsXCJoci1IUi1NYXRlalwiXSxodTpbXCJodS1IVVwiLFwiTWFsZVwiLFwiaHUtSFUtU3phYm9sY3NcIl0saWQ6W1wiaWQtSURcIixcIk1hbGVcIixcImlkLUlELUFuZGlrYVwiXSxpdDpbXCJpdC1JVFwiLFwiTWFsZVwiLFwiaXQtSVQtQ29zaW1vLUFwb2xsb1wiXSxqYTpbXCJqYS1KUFwiLFwiRmVtYWxlXCIsXCJqYS1KUC1BeXVtaS1BcG9sbG9cIl0sa286W1wia28tS1JcIixcIkZlbWFsZVwiLFwia28tS1ItSGVhbWlSVVNcIl0sbXM6W1wibXMtTVlcIixcIk1hbGVcIixcIm1zLU1ZLVJpendhblwiXSxubDpbXCJubC1OTFwiLFwiRmVtYWxlXCIsXCJubC1OTC1IYW5uYVJVU1wiXSxuYjpbXCJuYi1OT1wiLFwiRmVtYWxlXCIsXCJuYi1OTy1IdWxkYVJVU1wiXSxubzpbXCJuYi1OT1wiLFwiRmVtYWxlXCIsXCJuYi1OTy1IdWxkYVJVU1wiXSxwbDpbXCJwbC1QTFwiLFwiRmVtYWxlXCIsXCJwbC1QTC1QYXVsaW5hUlVTXCJdLHB0OltcInB0LVBUXCIsXCJGZW1hbGVcIixcInB0LVBULUhlbGlhUlVTXCJdLHJvOltcInJvLVJPXCIsXCJNYWxlXCIsXCJyby1STy1BbmRyZWlcIl0scnU6W1wicnUtUlVcIixcIkZlbWFsZVwiLFwicnUtUlUtSXJpbmEtQXBvbGxvXCJdLHNrOltcInNrLVNLXCIsXCJNYWxlXCIsXCJzay1TSy1GaWxpcFwiXSxzbDpbXCJzbC1TTFwiLFwiTWFsZVwiLFwic2wtU0ktTGFkb1wiXSxzdjpbXCJzdi1TRVwiLFwiRmVtYWxlXCIsXCJzdi1TRS1IZWR2aWdSVVNcIl0sdGE6W1widGEtSU5cIixcIkZlbWFsZVwiLFwidGEtSU4tVmFsbHV2YXJcIl0sdGU6W1widGUtSU5cIixcIk1hbGVcIixcInRlLUlOLUNoaXRyYVwiXSx0aDpbXCJ0aC1USFwiLFwiTWFsZVwiLFwidGgtVEgtUGF0dGFyYVwiXSx0cjpbXCJ0ci1UUlwiLFwiRmVtYWxlXCIsXCJ0ci1UUi1TZWRhUlVTXCJdLHZpOltcInZpLVZOXCIsXCJNYWxlXCIsXCJ2aS1WTi1BblwiXSxcInpoLUhhbnNcIjpbXCJ6aC1DTlwiLFwiRmVtYWxlXCIsXCJ6aC1DTi1IdWlodWlSVVNcIl0sXCJ6aC1IYW50XCI6W1wiemgtQ05cIixcIkZlbWFsZVwiLFwiemgtQ04tSHVpaHVpUlVTXCJdLHl1ZTpbXCJ6aC1IS1wiLFwiRmVtYWxlXCIsXCJ6aC1ISy1UcmFjeVJVU1wiXX0sSD17YXI6XCJhci1FR1wiLGNhOlwiY2EtRVNcIixkYTpcImRhLURLXCIsZGU6XCJkZS1ERVwiLGVuOlwiZW4tVVNcIixlczpcImVzLUVTXCIsZmk6XCJmaS1GSVwiLGZyOlwiZnItRlJcIixoaTpcImhpLUlOXCIsaXQ6XCJpdC1JVFwiLGphOlwiamEtSlBcIixrbzpcImtvLUtSXCIsbmI6XCJuYi1OT1wiLG5sOlwibmwtTkxcIixwbDpcInBsLVBMXCIscHQ6XCJwdC1QVFwiLHJ1OlwicnUtUlVcIixzdjpcInN2LVNFXCIsdGg6XCJ0aC1USFwiLFwiemgtSGFuc1wiOlwiemgtQ05cIixcInpoLUhhbnRcIjpcInpoLUhLXCIseXVlOlwiemgtSEtcIixndTpcImd1LUlOXCIsbXI6XCJtci1JTlwiLHRhOlwidGEtSU5cIix0ZTpcInRlLUlOXCIsdHI6XCJ0ci1UUlwifTtjbGFzcyBPe2NvbnN0cnVjdG9yKCl7aSh0aGlzLFwiSUdcIixcIlwiKTtpKHRoaXMsXCJJSURcIixcIlwiKTtpKHRoaXMsXCJ0b2tlblwiLFwiXCIpO2kodGhpcyxcImtleVwiLFwiXCIpO2kodGhpcyxcInRva2Vuc0luaXRpYXRlZFwiLCExKTtpKHRoaXMsXCJUVFNfQVVUSFwiLHtyZWdpb246XCJcIix0b2tlbjpcIlwifSk7aSh0aGlzLFwiY291bnRcIiwwKTtpKHRoaXMsXCJsYXN0UmVxdWVzdFRpbWVcIiwwKTtpKHRoaXMsXCJSRVFVRVNUX0RFTEFZXCIsMWUzKTtpKHRoaXMsXCJIVE1MUGFyc2VyXCIsbmV3IERPTVBhcnNlcik7aSh0aGlzLFwiTUFYX1JFVFJZXCIsMSk7aSh0aGlzLFwiSE9TVFwiLFwiaHR0cHM6Ly93d3cuYmluZy5jb20vXCIpO2kodGhpcyxcIkhPTUVfUEFHRVwiLFwiaHR0cHM6Ly93d3cuYmluZy5jb20vdHJhbnNsYXRvclwiKTtpKHRoaXMsXCJIRUFERVJTXCIse2FjY2VwdDpcIiovKlwiLFwiYWNjZXB0LWxhbmd1YWdlXCI6XCJlbi1VUyxlbjtxPTAuOSxrbztxPTAuOCx6aC1DTjtxPTAuNyx6aDtxPTAuNlwiLFwiY29udGVudC10eXBlXCI6XCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIixcInVzZXItYWdlbnRcIjpcIk1vemlsbGEvNS4wIChNYWNpbnRvc2g7IEludGVsIE1hYyBPUyBYIDEwXzE1XzcpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjAuMC4wLjAgU2FmYXJpLzUzNy4zNiBFZGcvMTIwLjAuMC4wXCIsXCJhY2NlcHQtZW5jb2RpbmdcIjpcImd6aXAsIGRlZmxhdGUsIGJyXCIsXCJjYWNoZS1jb250cm9sXCI6XCJuby1jYWNoZVwiLG9yaWdpbjpcImh0dHBzOi8vd3d3LmJpbmcuY29tXCIscmVmZXJlcjpcImh0dHBzOi8vd3d3LmJpbmcuY29tL3RyYW5zbGF0b3JcIixcInNlYy1jaC11YVwiOidcIk5vdF9BIEJyYW5kXCI7dj1cIjhcIiwgXCJDaHJvbWl1bVwiO3Y9XCIxMjBcIiwgXCJNaWNyb3NvZnQgRWRnZVwiO3Y9XCIxMjBcIicsXCJzZWMtY2gtdWEtbW9iaWxlXCI6XCI/MFwiLFwic2VjLWNoLXVhLXBsYXRmb3JtXCI6J1wibWFjT1NcIicsXCJzZWMtZmV0Y2gtZGVzdFwiOlwiZW1wdHlcIixcInNlYy1mZXRjaC1tb2RlXCI6XCJjb3JzXCIsXCJzZWMtZmV0Y2gtc2l0ZVwiOlwic2FtZS1vcmlnaW5cIn0pO2kodGhpcyxcIkxBTl9UT19DT0RFXCIsbmV3IE1hcChiKSk7aSh0aGlzLFwiQ09ERV9UT19MQU5cIixuZXcgTWFwKGIubWFwKChbZSx0XSk9Plt0LGVdKSkpO2kodGhpcyxcIkFVRElPXCIsbmV3IEF1ZGlvKX1hc3luYyB1cGRhdGVUb2tlbnMoKXtjb25zdCBlPWF3YWl0IHAuZ2V0KHRoaXMuSE9NRV9QQUdFKSx0PS8oaHR0cHM6XFwvXFwvLipcXC5iaW5nXFwuY29tXFwvKS4qL2cuZXhlYyhlLnJlcXVlc3QucmVzcG9uc2VVUkwpO3QmJnRbMV0hPXRoaXMuSE9TVCYmKHRoaXMuSE9TVD10WzFdLHRoaXMuSE9NRV9QQUdFPWAke3RoaXMuSE9TVH10cmFuc2xhdG9yYCksdGhpcy5JRz1lLmRhdGEubWF0Y2goL0lHOlwiKFtBLVphLXowLTldKylcIi8pWzFdLFssdGhpcy5rZXksdGhpcy50b2tlbl09ZS5kYXRhLm1hdGNoKC92YXIgcGFyYW1zX0FidXNlUHJldmVudGlvbkhlbHBlclxccyo9XFxzKlxcWyhbMC05XSspLFxccypcIihbXlwiXSspXCIsW15cXF1dKlxcXTsvKTtjb25zdCBzPXRoaXMuSFRNTFBhcnNlci5wYXJzZUZyb21TdHJpbmcoZS5kYXRhLFwidGV4dC9odG1sXCIpO3RoaXMuSUlEPXMuZ2V0RWxlbWVudEJ5SWQoXCJyaWNoX3R0YVwiKS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWlpZFwiKXx8XCJcIix0aGlzLmNvdW50PTB9cGFyc2VUcmFuc2xhdGVSZXN1bHQoZSx0KXtjb25zdCBzPXR8fG5ldyBPYmplY3Q7dHJ5e2NvbnN0IGE9ZVswXS50cmFuc2xhdGlvbnM7cy5tYWluTWVhbmluZz1hWzBdLnRleHQscy50UHJvbnVuY2lhdGlvbj1hWzBdLnRyYW5zbGl0ZXJhdGlvbi50ZXh0fWNhdGNoe31yZXR1cm4gc31wYXJzZUxvb2t1cFJlc3VsdChlLHQpe2NvbnN0IHM9dHx8bmV3IE9iamVjdDt0cnl7cy5vcmlnaW5hbFRleHQ9ZVswXS5kaXNwbGF5U291cmNlO2NvbnN0IGE9ZVswXS50cmFuc2xhdGlvbnM7cy5tYWluTWVhbmluZz1hWzBdLmRpc3BsYXlUYXJnZXQscy50UHJvbnVuY2lhdGlvbj1hWzBdLnRyYW5zbGl0ZXJhdGlvbjtjb25zdCBuPVtdO2Zvcihjb25zdCBvIGluIGEpe2NvbnN0IHI9W107Zm9yKGNvbnN0IGwgaW4gYVtvXS5iYWNrVHJhbnNsYXRpb25zKXIucHVzaChhW29dLmJhY2tUcmFuc2xhdGlvbnNbbF0uZGlzcGxheVRleHQpO24ucHVzaCh7cG9zOmFbb10ucG9zVGFnLG1lYW5pbmc6YVtvXS5kaXNwbGF5VGFyZ2V0LHN5bm9ueW1zOnJ9KX1zLmRldGFpbGVkTWVhbmluZ3M9bn1jYXRjaHt9cmV0dXJuIHN9cGFyc2VFeGFtcGxlUmVzdWx0KGUsdCl7Y29uc3Qgcz10fHxuZXcgT2JqZWN0O3RyeXtzLmV4YW1wbGVzPWVbMF0uZXhhbXBsZXMubWFwKGE9Pih7c291cmNlOmAke2Euc291cmNlUHJlZml4fTxiPiR7YS5zb3VyY2VUZXJtfTwvYj4ke2Euc291cmNlU3VmZml4fWAsdGFyZ2V0OmAke2EudGFyZ2V0UHJlZml4fTxiPiR7YS50YXJnZXRUZXJtfTwvYj4ke2EudGFyZ2V0U3VmZml4fWB9KSl9Y2F0Y2h7fXJldHVybiBzfWFzeW5jIHVwZGF0ZVRUU0F1dGgoKXtjb25zdCBlPSgpPT4oe21ldGhvZDpcIlBPU1RcIixiYXNlVVJMOnRoaXMuSE9TVCx1cmw6YHRmZXRzcGt0b2s/aXNWZXJ0aWNhbD0xJiZJRz0ke3RoaXMuSUd9JklJRD0ke3RoaXMuSUlEfS4ke3RoaXMuY291bnQudG9TdHJpbmcoKX1gLGhlYWRlcnM6dGhpcy5IRUFERVJTLGRhdGE6YCZ0b2tlbj0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLnRva2VuKX0ma2V5PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMua2V5KX1gfSksdD1hd2FpdCB0aGlzLnJlcXVlc3QoZSxbXSk7dGhpcy5UVFNfQVVUSC5yZWdpb249dC5yZWdpb24sdGhpcy5UVFNfQVVUSC50b2tlbj10LnRva2VufWdlbmVyYXRlVFRTRGF0YShlLHQscyl7Y29uc3QgYT10aGlzLkxBTl9UT19DT0RFLmdldCh0KSxuPURbYV0sbz1IW2FdLHI9cz09PVwiZmFzdFwiP1wiLTEwLjAwJVwiOlwiLTMwLjAwJVwiO3JldHVybmA8c3BlYWsgdmVyc2lvbj0nMS4wJyB4bWw6bGFuZz0nJHtvfSc+PHZvaWNlIHhtbDpsYW5nPScke299JyB4bWw6Z2VuZGVyPScke25bMV19JyBuYW1lPScke25bMl19Jz48cHJvc29keSByYXRlPScke3J9Jz4ke2V9PC9wcm9zb2R5Pjwvdm9pY2U+PC9zcGVhaz5gfWFycmF5QnVmZmVyVG9CYXNlNjQoZSl7bGV0IHQ9XCJcIixzPW5ldyBVaW50OEFycmF5KGUpO2ZvcihsZXQgYT0wO2E8cy5ieXRlTGVuZ3RoO2ErKyl0Kz1TdHJpbmcuZnJvbUNoYXJDb2RlKHNbYV0pO3JldHVybiBidG9hKHQpfWNvbnN0cnVjdERldGVjdFBhcmFtcyhlKXtjb25zdCB0PWB0dHJhbnNsYXRldjM/aXNWZXJ0aWNhbD0xJklHPSR7dGhpcy5JR30mSUlEPSR7dGhpcy5JSUR9LiR7dGhpcy5jb3VudC50b1N0cmluZygpfWAscz1gJmZyb21MYW5nPWF1dG8tZGV0ZWN0JnRvPXpoLUhhbnMmdGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChlKX0mdG9rZW49JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy50b2tlbil9JmtleT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmtleSl9YDtyZXR1cm57bWV0aG9kOlwiUE9TVFwiLGJhc2VVUkw6dGhpcy5IT1NULHVybDp0LGhlYWRlcnM6dGhpcy5IRUFERVJTLGRhdGE6c319Y29uc3RydWN0VHJhbnNsYXRlUGFyYW1zKGUsdCxzKXtjb25zdCBhPWB0dHJhbnNsYXRldjM/aXNWZXJ0aWNhbD0xJklHPSR7dGhpcy5JR30mSUlEPSR7dGhpcy5JSUR9LiR7dGhpcy5jb3VudC50b1N0cmluZygpfWAsbj1gJmZyb21MYW5nPSR7dGhpcy5MQU5fVE9fQ09ERS5nZXQodCl9JnRvPSR7dGhpcy5MQU5fVE9fQ09ERS5nZXQocyl9JnRleHQ9JHtlbmNvZGVVUklDb21wb25lbnQoZSl9JnRva2VuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMudG9rZW4pfSZrZXk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5rZXkpfWA7cmV0dXJue21ldGhvZDpcIlBPU1RcIixiYXNlVVJMOnRoaXMuSE9TVCx1cmw6YSxoZWFkZXJzOnRoaXMuSEVBREVSUyxkYXRhOm59fWNvbnN0cnVjdExvb2t1cFBhcmFtcyhlLHQscyl7Y29uc3QgYT1gdGxvb2t1cHYzP2lzVmVydGljYWw9MSZJRz0ke3RoaXMuSUd9JklJRD0ke3RoaXMuSUlEfS4ke3RoaXMuY291bnQudG9TdHJpbmcoKX1gLG49YCZmcm9tPSR7dH0mdG89JHt0aGlzLkxBTl9UT19DT0RFLmdldChzKX0mdGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChlKX0mdG9rZW49JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy50b2tlbil9JmtleT0ke2VuY29kZVVSSUNvbXBvbmVudCh0aGlzLmtleSl9YDtyZXR1cm57bWV0aG9kOlwiUE9TVFwiLGJhc2VVUkw6dGhpcy5IT1NULHVybDphLGhlYWRlcnM6dGhpcy5IRUFERVJTLGRhdGE6bn19Y29uc3RydWN0RXhhbXBsZVBhcmFtcyhlLHQscyxhKXtjb25zdCBuPWB0ZXhhbXBsZXYzP2lzVmVydGljYWw9MSZJRz0ke3RoaXMuSUd9JklJRD0ke3RoaXMuSUlEfS4ke3RoaXMuY291bnQudG9TdHJpbmcoKX1gLG89YCZmcm9tPSR7ZX0mdG89JHt0aGlzLkxBTl9UT19DT0RFLmdldCh0KX0mdGV4dD0ke2VuY29kZVVSSUNvbXBvbmVudChzKX0mdHJhbnNsYXRpb249JHtlbmNvZGVVUklDb21wb25lbnQoYSl9JnRva2VuPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMudG9rZW4pfSZrZXk9JHtlbmNvZGVVUklDb21wb25lbnQodGhpcy5rZXkpfWA7cmV0dXJue21ldGhvZDpcIlBPU1RcIixiYXNlVVJMOnRoaXMuSE9TVCx1cmw6bixoZWFkZXJzOnRoaXMuSEVBREVSUyxkYXRhOm99fWNvbnN0cnVjdFRUU1BhcmFtcyhlLHQscyl7Y29uc3QgYT1gaHR0cHM6Ly8ke3RoaXMuVFRTX0FVVEgucmVnaW9ufS50dHMuc3BlZWNoLm1pY3Jvc29mdC5jb20vY29nbml0aXZlc2VydmljZXMvdjE/YCxuPXtcIkNvbnRlbnQtVHlwZVwiOlwiYXBwbGljYXRpb24vc3NtbCt4bWxcIixBdXRob3JpemF0aW9uOmBCZWFyZXIgJHt0aGlzLlRUU19BVVRILnRva2VufWAsXCJYLU1JQ1JPU09GVC1PdXRwdXRGb3JtYXRcIjpcImF1ZGlvLTE2a2h6LTMya2JpdHJhdGUtbW9uby1tcDNcIixcImNhY2hlLWNvbnRyb2xcIjpcIm5vLWNhY2hlXCJ9O3JldHVybnttZXRob2Q6XCJQT1NUXCIsYmFzZVVSTDphLGhlYWRlcnM6bixkYXRhOnRoaXMuZ2VuZXJhdGVUVFNEYXRhKGUsdCxzKSxyZXNwb25zZVR5cGU6XCJhcnJheWJ1ZmZlclwifX1hc3luYyByZXF1ZXN0KGUsdCxzPSEwKXtjb25zdCBhPURhdGUubm93KCktdGhpcy5sYXN0UmVxdWVzdFRpbWU7aWYoYTx0aGlzLlJFUVVFU1RfREVMQVkpe2NvbnN0IHI9dGhpcy5SRVFVRVNUX0RFTEFZLWE7YXdhaXQgbmV3IFByb21pc2UobD0+c2V0VGltZW91dChsLHIpKX10aGlzLmxhc3RSZXF1ZXN0VGltZT1EYXRlLm5vdygpO2xldCBuPTA7Y29uc3Qgbz1hc3luYygpPT57dGhpcy5jb3VudCsrO2NvbnN0IHI9YXdhaXQgcChlLmNhbGwodGhpcywuLi50KSk7aWYoci5zdGF0dXM9PT00MDF8fHIuc3RhdHVzPT09NDI5KXRocm93e2Vycm9yVHlwZTpcIkFQSV9FUlJcIixlcnJvckNvZGU6ci5zdGF0dXMsZXJyb3JNc2c6XCJSZXF1ZXN0IHRvbyBmcmVxdWVudGx5IVwifTtjb25zdCBsPS8oaHR0cHM6XFwvXFwvLipcXC5iaW5nXFwuY29tXFwvKS4qL2cuZXhlYyhyLnJlcXVlc3QucmVzcG9uc2VVUkwpO2lmKGwmJmxbMV0hPT10aGlzLkhPU1QpcmV0dXJuIHRoaXMuSE9TVD1sWzFdLHRoaXMuSE9NRV9QQUdFPWAke3RoaXMuSE9TVH10cmFuc2xhdG9yYCxhd2FpdCB0aGlzLnVwZGF0ZVRva2VucygpLnRoZW4obyk7Y29uc3QgdT1yLmRhdGEuU3RhdHVzQ29kZXx8ci5kYXRhLnN0YXR1c0NvZGV8fDIwMDtzd2l0Y2godSl7Y2FzZSAyMDA6cmV0dXJuIHIuZGF0YTtjYXNlIDIwNTpyZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVUb2tlbnMoKS50aGVuKG8pfWlmKHMmJm48dGhpcy5NQVhfUkVUUlkpcmV0dXJuIG4rKyxhd2FpdCB0aGlzLnVwZGF0ZVRva2VucygpLnRoZW4obyk7dGhyb3d7ZXJyb3JUeXBlOlwiQVBJX0VSUlwiLGVycm9yQ29kZTp1LGVycm9yTXNnOlwiUmVxdWVzdCBmYWlsZWQuXCJ9fTtyZXR1cm4gdGhpcy50b2tlbnNJbml0aWF0ZWR8fChhd2FpdCB0aGlzLnVwZGF0ZVRva2VucygpLHRoaXMudG9rZW5zSW5pdGlhdGVkPSEwKSxvKCl9c3VwcG9ydGVkTGFuZ3VhZ2VzKCl7cmV0dXJuIG5ldyBTZXQodGhpcy5MQU5fVE9fQ09ERS5rZXlzKCkpfWFzeW5jIGRldGVjdChlKXt0cnl7Y29uc3QgdD0oYXdhaXQgdGhpcy5yZXF1ZXN0KHRoaXMuY29uc3RydWN0RGV0ZWN0UGFyYW1zLFtlXSkpWzBdLmRldGVjdGVkTGFuZ3VhZ2UubGFuZ3VhZ2U7cmV0dXJuIHRoaXMuQ09ERV9UT19MQU4uZ2V0KHQpfWNhdGNoKHQpe3Rocm93IHQuZXJyb3JNc2c9dC5lcnJvck1zZ3x8dC5tZXNzYWdlLHQuZXJyb3JBY3Q9e2FwaTpcImJpbmdcIixhY3Rpb246XCJkZXRlY3RcIix0ZXh0OmUsZnJvbTpudWxsLHRvOm51bGx9LHR9fWFzeW5jIHRyYW5zbGF0ZShlLHQscyl7bGV0IGE7dHJ5e2E9YXdhaXQgdGhpcy5yZXF1ZXN0KHRoaXMuY29uc3RydWN0VHJhbnNsYXRlUGFyYW1zLFtlLHQsc10pfWNhdGNoKG8pe3Rocm93IG8uZXJyb3JBY3Q9e2FwaTpcImJpbmdcIixhY3Rpb246XCJ0cmFuc2xhdGVcIix0ZXh0OmUsZnJvbTp0LHRvOnN9LG99Y29uc3Qgbj10aGlzLnBhcnNlVHJhbnNsYXRlUmVzdWx0KGEse29yaWdpbmFsVGV4dDplLG1haW5NZWFuaW5nOlwiXCJ9KTt0cnl7Y29uc3Qgbz1hd2FpdCB0aGlzLnJlcXVlc3QodGhpcy5jb25zdHJ1Y3RMb29rdXBQYXJhbXMsW2UsYVswXS5kZXRlY3RlZExhbmd1YWdlLmxhbmd1YWdlLHNdLCExKSxyPXRoaXMucGFyc2VMb29rdXBSZXN1bHQobyxuKSxsPWF3YWl0IHRoaXMucmVxdWVzdCh0aGlzLmNvbnN0cnVjdEV4YW1wbGVQYXJhbXMsW2FbMF0uZGV0ZWN0ZWRMYW5ndWFnZS5sYW5ndWFnZSxzLGUsci5tYWluTWVhbmluZ10sITEpO3JldHVybiB0aGlzLnBhcnNlRXhhbXBsZVJlc3VsdChsLHIpfWNhdGNoe3JldHVybiBufX1hc3luYyBwcm9ub3VuY2UoZSx0LHMpe3RoaXMuc3RvcFByb25vdW5jZSgpO2xldCBhPTA7Y29uc3Qgbj1hc3luYygpPT57dHJ5e2NvbnN0IG89YXdhaXQgdGhpcy5yZXF1ZXN0KHRoaXMuY29uc3RydWN0VFRTUGFyYW1zLFtlLHQsc10sITEpO3RoaXMuQVVESU8uc3JjPWBkYXRhOmF1ZGlvL21wMztiYXNlNjQsJHt0aGlzLmFycmF5QnVmZmVyVG9CYXNlNjQobyl9YCxhd2FpdCB0aGlzLkFVRElPLnBsYXkoKX1jYXRjaChvKXtpZihhPHRoaXMuTUFYX1JFVFJZKXJldHVybiBhKyssdGhpcy51cGRhdGVUVFNBdXRoKCkudGhlbihuKTtjb25zdCByPXthcGk6XCJiaW5nXCIsYWN0aW9uOlwicHJvbm91bmNlXCIsdGV4dDplLGZyb206dCx0bzpudWxsfTt0aHJvdyBvLmVycm9yVHlwZT8oby5lcnJvckFjdD1yLG8pOntlcnJvclR5cGU6XCJORVRfRVJSXCIsZXJyb3JDb2RlOjAsZXJyb3JNc2c6by5tZXNzYWdlLGVycm9yQWN0OnJ9fX07cmV0dXJuIHRoaXMuVFRTX0FVVEgucmVnaW9uLmxlbmd0aD4wJiZ0aGlzLlRUU19BVVRILnRva2VuLmxlbmd0aD4wfHxhd2FpdCB0aGlzLnVwZGF0ZVRUU0F1dGgoKSxuKCl9c3RvcFByb25vdW5jZSgpe3RoaXMuQVVESU8ucGF1c2VkfHx0aGlzLkFVRElPLnBhdXNlKCl9fWNvbnN0IF89W1tcImF1dG9cIixcImF1dG9cIl0sW1wiemgtQ05cIixcInpoLUNOXCJdLFtcInpoLVRXXCIsXCJ6aC1UV1wiXSxbXCJlblwiLFwiZW5cIl0sW1wiYWZcIixcImFmXCJdLFtcImFtXCIsXCJhbVwiXSxbXCJhclwiLFwiYXJcIl0sW1wiYXpcIixcImF6XCJdLFtcImJlXCIsXCJiZVwiXSxbXCJiZ1wiLFwiYmdcIl0sW1wiYm5cIixcImJuXCJdLFtcImJzXCIsXCJic1wiXSxbXCJjYVwiLFwiY2FcIl0sW1wiY2ViXCIsXCJjZWJcIl0sW1wiY29cIixcImNvXCJdLFtcImNzXCIsXCJjc1wiXSxbXCJjeVwiLFwiY3lcIl0sW1wiZGFcIixcImRhXCJdLFtcImRlXCIsXCJkZVwiXSxbXCJlbFwiLFwiZWxcIl0sW1wiZW9cIixcImVvXCJdLFtcImVzXCIsXCJlc1wiXSxbXCJldFwiLFwiZXRcIl0sW1wiZXVcIixcImV1XCJdLFtcImZhXCIsXCJmYVwiXSxbXCJmaVwiLFwiZmlcIl0sW1wiZnJcIixcImZyXCJdLFtcImZ5XCIsXCJmeVwiXSxbXCJnYVwiLFwiZ2FcIl0sW1wiZ2RcIixcImdkXCJdLFtcImdsXCIsXCJnbFwiXSxbXCJndVwiLFwiZ3VcIl0sW1wiaGFcIixcImhhXCJdLFtcImhhd1wiLFwiaGF3XCJdLFtcImhlXCIsXCJoZVwiXSxbXCJoaVwiLFwiaGlcIl0sW1wiaG1uXCIsXCJobW5cIl0sW1wiaHJcIixcImhyXCJdLFtcImh0XCIsXCJodFwiXSxbXCJodVwiLFwiaHVcIl0sW1wiaHlcIixcImh5XCJdLFtcImlkXCIsXCJpZFwiXSxbXCJpZ1wiLFwiaWdcIl0sW1wiaXNcIixcImlzXCJdLFtcIml0XCIsXCJpdFwiXSxbXCJqYVwiLFwiamFcIl0sW1wiandcIixcImp3XCJdLFtcImthXCIsXCJrYVwiXSxbXCJra1wiLFwia2tcIl0sW1wia21cIixcImttXCJdLFtcImtuXCIsXCJrblwiXSxbXCJrb1wiLFwia29cIl0sW1wia3VcIixcImt1XCJdLFtcImt5XCIsXCJreVwiXSxbXCJsYVwiLFwibGFcIl0sW1wibGJcIixcImxiXCJdLFtcImxvXCIsXCJsb1wiXSxbXCJsdFwiLFwibHRcIl0sW1wibHZcIixcImx2XCJdLFtcIm1nXCIsXCJtZ1wiXSxbXCJtaVwiLFwibWlcIl0sW1wibWtcIixcIm1rXCJdLFtcIm1sXCIsXCJtbFwiXSxbXCJtblwiLFwibW5cIl0sW1wibXJcIixcIm1yXCJdLFtcIm1zXCIsXCJtc1wiXSxbXCJtdFwiLFwibXRcIl0sW1wibXlcIixcIm15XCJdLFtcIm5lXCIsXCJuZVwiXSxbXCJubFwiLFwibmxcIl0sW1wibm9cIixcIm5vXCJdLFtcIm55XCIsXCJueVwiXSxbXCJwbFwiLFwicGxcIl0sW1wicHNcIixcInBzXCJdLFtcInB0XCIsXCJwdFwiXSxbXCJyb1wiLFwicm9cIl0sW1wicnVcIixcInJ1XCJdLFtcInNkXCIsXCJzZFwiXSxbXCJzaVwiLFwic2lcIl0sW1wic2tcIixcInNrXCJdLFtcInNsXCIsXCJzbFwiXSxbXCJzbVwiLFwic21cIl0sW1wic25cIixcInNuXCJdLFtcInNvXCIsXCJzb1wiXSxbXCJzcVwiLFwic3FcIl0sW1wic3JcIixcInNyXCJdLFtcInN0XCIsXCJzdFwiXSxbXCJzdVwiLFwic3VcIl0sW1wic3ZcIixcInN2XCJdLFtcInN3XCIsXCJzd1wiXSxbXCJ0YVwiLFwidGFcIl0sW1widGVcIixcInRlXCJdLFtcInRnXCIsXCJ0Z1wiXSxbXCJ0aFwiLFwidGhcIl0sW1wiZmlsXCIsXCJ0bFwiXSxbXCJ0clwiLFwidHJcIl0sW1widWdcIixcInVnXCJdLFtcInVrXCIsXCJ1a1wiXSxbXCJ1clwiLFwidXJcIl0sW1widXpcIixcInV6XCJdLFtcInZpXCIsXCJ2aVwiXSxbXCJ4aFwiLFwieGhcIl0sW1wieWlcIixcInlpXCJdLFtcInlvXCIsXCJ5b1wiXSxbXCJ6dVwiLFwienVcIl1dO2NsYXNzIHd7Y29uc3RydWN0b3IoKXtpKHRoaXMsXCJUS0tcIixbNDM0MjE3LDE1MzQ1NTkwMDFdKTtpKHRoaXMsXCJIT01FX1BBR0VcIixcImh0dHBzOi8vdHJhbnNsYXRlLmdvb2dsZS5jb20vXCIpO2kodGhpcyxcIkhPU1RcIixcImh0dHBzOi8vdHJhbnNsYXRlLmdvb2dsZWFwaXMuY29tL1wiKTtpKHRoaXMsXCJUUkFOU0xBVEVfVVJMXCIsYCR7dGhpcy5IT1NUfXRyYW5zbGF0ZV9hL3NpbmdsZT9jbGllbnQ9Z3R4JmRqPTEmZHQ9dCZkdD1hdCZkdD1iZCZkdD1leCZkdD1tZCZkdD1ydyZkdD1zcyZkdD1ybWApO2kodGhpcyxcIlRUU19VUkxcIixgJHt0aGlzLkhPU1R9dHJhbnNsYXRlX3R0cz9jbGllbnQ9Z3R4YCk7aSh0aGlzLFwiRkFMTEJBQ0tfVFJBTlNMQVRFX1VSTFwiLGAke3RoaXMuSE9TVH10cmFuc2xhdGVfYS9zaW5nbGU/aWU9VVRGLTgmY2xpZW50PXdlYmFwcCZvdGY9MSZzc2VsPTAmdHNlbD0wJmtjPTUmZHQ9dCZkdD1hdCZkdD1iZCZkdD1leCZkdD1tZCZkdD1ydyZkdD1zcyZkdD1ybWApO2kodGhpcyxcIkZBTExCQUNLX1RUU19VUkxcIixgJHt0aGlzLkhPU1R9dHJhbnNsYXRlX3R0cz9pZT1VVEYtOCZjbGllbnQ9d2ViYXBwYCk7aSh0aGlzLFwiZmFsbEJhY2tpbmdcIiwhMSk7aSh0aGlzLFwiTEFOX1RPX0NPREVcIixuZXcgTWFwKF8pKTtpKHRoaXMsXCJDT0RFX1RPX0xBTlwiLG5ldyBNYXAoXy5tYXAoKFtlLHRdKT0+W3QsZV0pKSk7aSh0aGlzLFwiQVVESU9cIixuZXcgQXVkaW8pfWdlbmVyYXRlVEsoZSx0LHMpe3Q9TnVtYmVyKHQpfHwwO2xldCBhPVtdLG49MCxvPTA7Zm9yKDtvPGUubGVuZ3RoO28rKyl7bGV0IHI9ZS5jaGFyQ29kZUF0KG8pOzEyOD5yP2FbbisrXT1yOigyMDQ4PnI/YVtuKytdPXI+PjZ8MTkyOigociY2NDUxMik9PTU1Mjk2JiZvKzE8ZS5sZW5ndGgmJihlLmNoYXJDb2RlQXQobysxKSY2NDUxMik9PTU2MzIwPyhyPTY1NTM2KygociYxMDIzKTw8MTApKyhlLmNoYXJDb2RlQXQoKytvKSYxMDIzKSxhW24rK109cj4+MTh8MjQwLGFbbisrXT1yPj4xMiY2M3wxMjgpOmFbbisrXT1yPj4xMnwyMjQsYVtuKytdPXI+PjYmNjN8MTI4KSxhW24rK109ciY2M3wxMjgpfWZvcihlPXQsbj0wO248YS5sZW5ndGg7bisrKWUrPWFbbl0sZT10aGlzLl9tYWdpYyhlLFwiKy1hXis2XCIpO3JldHVybiBlPXRoaXMuX21hZ2ljKGUsXCIrLTNeK2IrLWZcIiksZV49TnVtYmVyKHMpfHwwLDA+ZSYmKGU9KGUmMjE0NzQ4MzY0NykrMjE0NzQ4MzY0OCksZSU9MWU2LGUudG9TdHJpbmcoKStcIi5cIisoZV50KX1fbWFnaWMoZSx0KXtmb3IodmFyIHM9MDtzPHQubGVuZ3RoLTI7cys9Myl7dmFyIGE9dC5jaGFyQXQocysyKSxhPVwiYVwiPD1hP2EuY2hhckNvZGVBdCgwKS04NzpOdW1iZXIoYSksYT10LmNoYXJBdChzKzEpPT1cIitcIj9lPj4+YTplPDxhO2U9dC5jaGFyQXQocyk9PVwiK1wiP2UrYSY0Mjk0OTY3Mjk1OmVeYX1yZXR1cm4gZX1hc3luYyB1cGRhdGVUS0soKXtsZXQgZT0oYXdhaXQgcC5nZXQodGhpcy5IT01FX1BBR0UpKS5kYXRhLHQ9KGUubWF0Y2goL1RLSz0oLio/KVxcKFxcKVxcKSdcXCk7L2kpfHxbXCJcIl0pWzBdLnJlcGxhY2UoL1xcXFx4KFswLTlBLUZhLWZdezJ9KS9nLFwiXCIpLm1hdGNoKC9bKy1dP1xcZCsvZyk7dD8odGhpcy5US0tbMF09TnVtYmVyKHRbMl0pLHRoaXMuVEtLWzFdPU51bWJlcih0WzBdKStOdW1iZXIodFsxXSkpOih0PWUubWF0Y2goL1RLS1s9Ol1bJ1wiXShcXGQrPylcXC4oXFxkKz8pWydcIl0vaSksdCYmKHRoaXMuVEtLWzBdPU51bWJlcih0WzFdKSx0aGlzLlRLS1sxXT1OdW1iZXIodFsyXSkpKX1mYWxsQmFjaygpe3RoaXMuZmFsbEJhY2tpbmc9ITAsc2V0VGltZW91dCgoKT0+e3RoaXMuZmFsbEJhY2tpbmc9ITF9LDMwKjYwKjFlMyl9Z2VuZXJhdGVEZXRlY3RVUkwoZSl7bGV0IHQ9XCImc2w9YXV0byZ0bD16aC1jblwiO3JldHVybiB0Kz1gJnRrPSR7dGhpcy5nZW5lcmF0ZVRLKGUsdGhpcy5US0tbMF0sdGhpcy5US0tbMV0pfSZxPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGUpfWAsdGhpcy5mYWxsQmFja2luZz90aGlzLkZBTExCQUNLX1RSQU5TTEFURV9VUkwrdDp0aGlzLlRSQU5TTEFURV9VUkwrdH1nZW5lcmF0ZVRyYW5zbGF0ZVVSTChlLHQscyl7bGV0IGE9YCZzbD0ke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHQpfSZ0bD0ke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHMpfWA7cmV0dXJuIGErPWAmdGs9JHt0aGlzLmdlbmVyYXRlVEsoZSx0aGlzLlRLS1swXSx0aGlzLlRLS1sxXSl9JnE9JHtlbmNvZGVVUklDb21wb25lbnQoZSl9YCx0aGlzLmZhbGxCYWNraW5nP3RoaXMuRkFMTEJBQ0tfVFJBTlNMQVRFX1VSTCthOnRoaXMuVFJBTlNMQVRFX1VSTCthfXBhcnNlRGV0ZWN0UmVzdWx0KGUpe3JldHVybiB0aGlzLmZhbGxCYWNraW5nP3RoaXMuQ09ERV9UT19MQU4uZ2V0KGVbMl0pfHxcIlwiOmUubGRfcmVzdWx0LmV4dGVuZGVkX3NyY2xhbmdzP3RoaXMuQ09ERV9UT19MQU4uZ2V0KGUubGRfcmVzdWx0LmV4dGVuZGVkX3NyY2xhbmdzWzBdKXx8XCJcIjp0aGlzLkNPREVfVE9fTEFOLmdldChlLmxkX3Jlc3VsdC5zcmNsYW5nc1swXSl8fFwiXCJ9cGFyc2VCZXR0ZXJSZXN1bHQoZSl7Y29uc3QgdD17b3JpZ2luYWxUZXh0OlwiXCIsbWFpbk1lYW5pbmc6XCJcIn07aWYoZS5zZW50ZW5jZXMpe3QubWFpbk1lYW5pbmc9XCJcIix0Lm9yaWdpbmFsVGV4dD1cIlwiO2xldCBzPTA7Zm9yKDtzPGUuc2VudGVuY2VzLmxlbmd0aCYmZS5zZW50ZW5jZXNbc10udHJhbnM7cysrKXQubWFpbk1lYW5pbmcrPWUuc2VudGVuY2VzW3NdLnRyYW5zLHQub3JpZ2luYWxUZXh0Kz1lLnNlbnRlbmNlc1tzXS5vcmlnO3M8ZS5zZW50ZW5jZXMubGVuZ3RoJiYoZS5zZW50ZW5jZXNbc10udHJhbnNsaXQmJih0LnRQcm9udW5jaWF0aW9uPWUuc2VudGVuY2VzW3NdLnRyYW5zbGl0KSxlLnNlbnRlbmNlc1tzXS5zcmNfdHJhbnNsaXQmJih0LnNQcm9udW5jaWF0aW9uPWUuc2VudGVuY2VzW3NdLnNyY190cmFuc2xpdCkpfWlmKGUuZGljdCl7dC5kZXRhaWxlZE1lYW5pbmdzPVtdO2ZvcihsZXQgcyBvZiBlLmRpY3QpZm9yKGxldCBhIG9mIHMuZW50cnkpdC5kZXRhaWxlZE1lYW5pbmdzLnB1c2goe3BvczpzLnBvcyxtZWFuaW5nOmEud29yZCxzeW5vbnltczphLnJldmVyc2VfdHJhbnNsYXRpb259KX1pZihlLmRlZmluaXRpb25zKXt0LmRlZmluaXRpb25zPVtdO2ZvcihsZXQgcyBvZiBlLmRlZmluaXRpb25zKWZvcihsZXQgYSBvZiBzLmVudHJ5KXQuZGVmaW5pdGlvbnMucHVzaCh7cG9zOnMucG9zLG1lYW5pbmc6YS5nbG9zcyxzeW5vbnltczpbXSxleGFtcGxlOmEuZXhhbXBsZX0pfWlmKGUuZXhhbXBsZXMpe3QuZXhhbXBsZXM9W107Zm9yKGxldCBzIG9mIGUuZXhhbXBsZXMuZXhhbXBsZSl0LmV4YW1wbGVzLnB1c2goe3NvdXJjZTpzLnRleHQsdGFyZ2V0Om51bGx9KTt0LmV4YW1wbGVzLnNvcnQoKHMsYSk9PnMuc291cmNlPmEuc291cmNlPzE6cy5zb3VyY2U9PT1hLnNvdXJjZT8wOi0xKX1yZXR1cm4gdH1wYXJzZUZhbGxiYWNrUmVzdWx0KGUpe2NvbnN0IHQ9e29yaWdpbmFsVGV4dDpcIlwiLG1haW5NZWFuaW5nOlwiXCJ9O2ZvcihsZXQgcz0wO3M8ZS5sZW5ndGg7cysrKWlmKGVbc10pe2NvbnN0IGE9ZVtzXTtzd2l0Y2gocyl7Y2FzZSAwOntsZXQgbj1bXSxvPVtdLHI9YS5sZW5ndGgtMTtmb3IobGV0IGw9MDtsPD1yO2wrKyluLnB1c2goYVtsXVswXSksby5wdXNoKGFbbF1bMV0pO3QubWFpbk1lYW5pbmc9bi5qb2luKFwiXCIpLHQub3JpZ2luYWxUZXh0PW8uam9pbihcIlwiKTt0cnl7cj4wJiYoYVtyXVsyXSYmYVtyXVsyXS5sZW5ndGg+MCYmKHQudFByb251bmNpYXRpb249YVtyXVsyXSksYVtyXVszXSYmYVtyXVszXS5sZW5ndGg+MCYmKHQuc1Byb251bmNpYXRpb249YVtyXVszXSkpfWNhdGNoe31icmVha31jYXNlIDE6dC5kZXRhaWxlZE1lYW5pbmdzPW5ldyBBcnJheSxhLmZvckVhY2gobj0+dC5kZXRhaWxlZE1lYW5pbmdzLnB1c2goe3BvczpuWzBdLG1lYW5pbmc6blsxXS5qb2luKFwiLCBcIil9KSk7YnJlYWs7Y2FzZSAxMjp0LmRlZmluaXRpb25zPW5ldyBBcnJheSxhLmZvckVhY2gobj0+e25bMV0uZm9yRWFjaChvPT57dC5kZWZpbml0aW9ucy5wdXNoKHtwb3M6blswXSxtZWFuaW5nOm9bMF0sZXhhbXBsZTpvWzJdfSl9KX0pO2JyZWFrO2Nhc2UgMTM6dC5leGFtcGxlcz1uZXcgQXJyYXksYS5mb3JFYWNoKG49Pm4uZm9yRWFjaChvPT50LmV4YW1wbGVzLnB1c2goe3NvdXJjZTpudWxsLHRhcmdldDpvWzBdfSkpKTticmVha319cmV0dXJuIHR9cGFyc2VUcmFuc2xhdGVSZXN1bHQoZSl7cmV0dXJuIHRoaXMuZmFsbEJhY2tpbmc/dGhpcy5wYXJzZUZhbGxiYWNrUmVzdWx0KGUpOnRoaXMucGFyc2VCZXR0ZXJSZXN1bHQoZSl9c3VwcG9ydGVkTGFuZ3VhZ2VzKCl7cmV0dXJuIG5ldyBTZXQodGhpcy5MQU5fVE9fQ09ERS5rZXlzKCkpfWRldGVjdChlKXtjb25zdCB0PWFzeW5jKCk9Pntjb25zdCBzPWF3YWl0IHAuZ2V0KHRoaXMuZ2VuZXJhdGVEZXRlY3RVUkwoZSkse3ZhbGlkYXRlU3RhdHVzOmE9PmE8NTAwfSk7aWYocy5zdGF0dXM9PT0yMDApcmV0dXJuIHRoaXMucGFyc2VEZXRlY3RSZXN1bHQocy5kYXRhKTtpZihzLnN0YXR1cz09PTQyOSYmIXRoaXMuZmFsbEJhY2tpbmcpcmV0dXJuIHRoaXMuZmFsbEJhY2soKSxhd2FpdCB0aGlzLnVwZGF0ZVRLSygpLnRoZW4odCk7dGhyb3d7ZXJyb3JUeXBlOlwiQVBJX0VSUlwiLGVycm9yQ29kZTpzLnN0YXR1cyxlcnJvck1zZzpcIkRldGVjdCBmYWlsZWQuXCIsZXJyb3JBY3Q6e2FwaTpcImdvb2dsZVwiLGFjdGlvbjpcImRldGVjdFwiLHRleHQ6ZSxmcm9tOm51bGwsdG86bnVsbH19fTtyZXR1cm4gdCgpfXRyYW5zbGF0ZShlLHQscyl7Y29uc3QgYT1hc3luYygpPT57Y29uc3Qgbj1hd2FpdCBwLmdldCh0aGlzLmdlbmVyYXRlVHJhbnNsYXRlVVJMKGUsdCxzKSx7dmFsaWRhdGVTdGF0dXM6bz0+bzw1MDB9KTtpZihuLnN0YXR1cz09PTIwMClyZXR1cm4gdGhpcy5wYXJzZVRyYW5zbGF0ZVJlc3VsdChuLmRhdGEpO2lmKG4uc3RhdHVzPT09NDI5JiYhdGhpcy5mYWxsQmFja2luZylyZXR1cm4gdGhpcy5mYWxsQmFjaygpLGF3YWl0IHRoaXMudXBkYXRlVEtLKCkudGhlbihhKTt0aHJvd3tlcnJvclR5cGU6XCJBUElfRVJSXCIsZXJyb3JDb2RlOm4uc3RhdHVzLGVycm9yTXNnOlwiVHJhbnNsYXRlIGZhaWxlZC5cIixlcnJvckFjdDp7YXBpOlwiZ29vZ2xlXCIsYWN0aW9uOlwidHJhbnNsYXRlXCIsdGV4dDplLGZyb206dCx0bzpzfX19O3JldHVybiBhKCl9YXN5bmMgcHJvbm91bmNlKGUsdCxzKXt0aGlzLnN0b3BQcm9ub3VuY2UoKTtsZXQgYT1zPT09XCJmYXN0XCI/XCIwLjhcIjpcIjAuMlwiO3RoaXMuQVVESU8uc3JjPWAke3RoaXMuZmFsbEJhY2tpbmc/dGhpcy5GQUxMQkFDS19UVFNfVVJMOnRoaXMuVFRTX1VSTH0mcT0ke2VuY29kZVVSSUNvbXBvbmVudChlKX0mdGw9JHt0aGlzLkxBTl9UT19DT0RFLmdldCh0KX0mdHRzc3BlZWQ9JHthfSZ0az0ke3RoaXMuZ2VuZXJhdGVUSyhlLHRoaXMuVEtLWzBdLHRoaXMuVEtLWzFdKX1gO3RyeXthd2FpdCB0aGlzLkFVRElPLnBsYXkoKX1jYXRjaChuKXt0aHJvd3tlcnJvclR5cGU6XCJORVRfRVJSXCIsZXJyb3JDb2RlOjAsZXJyb3JNc2c6bi5tZXNzYWdlLGVycm9yQWN0OnthcGk6XCJnb29nbGVcIixhY3Rpb246XCJwcm9ub3VuY2VcIix0ZXh0OmUsZnJvbTp0LHRvOm51bGx9fX19c3RvcFByb25vdW5jZSgpe3RoaXMuQVVESU8ucGF1c2VkfHx0aGlzLkFVRElPLnBhdXNlKCl9fWNvbnN0IEM9W1tcImF1dG9cIixcImF1dG9cIl0sW1wiYmdcIixcImJnXCJdLFtcImV0XCIsXCJldFwiXSxbXCJwbFwiLFwicGxcIl0sW1wiZGFcIixcImRhXCJdLFtcImRlXCIsXCJkZVwiXSxbXCJydVwiLFwicnVcIl0sW1wiZnJcIixcImZyXCJdLFtcImZpXCIsXCJmaVwiXSxbXCJubFwiLFwibmxcIl0sW1wiemgtQ05cIixcInpoXCJdLFtcImNzXCIsXCJjc1wiXSxbXCJsdlwiLFwibHZcIl0sW1wibHRcIixcImx0XCJdLFtcInJvXCIsXCJyb1wiXSxbXCJwdFwiLFwicHRcIl0sW1wiamFcIixcImphXCJdLFtcInN2XCIsXCJzdlwiXSxbXCJza1wiLFwic2tcIl0sW1wic2xcIixcInNsXCJdLFtcImVzXCIsXCJlc1wiXSxbXCJlbFwiLFwiZWxcIl0sW1wiaHVcIixcImh1XCJdLFtcIml0XCIsXCJpdFwiXSxbXCJlblwiLFwiZW5cIl1dO2NsYXNzIEl7Y29uc3RydWN0b3IoZSx0KXtpKHRoaXMsXCJIT01FX1BBR0VcIixcImh0dHBzOi8vd3d3LmRlZXBsLmNvbS90cmFuc2xhdG9yXCIpO2kodGhpcyxcIkxBTl9UT19DT0RFXCIsbmV3IE1hcChDKSk7aSh0aGlzLFwiQ09ERV9UT19MQU5cIixuZXcgTWFwKEMubWFwKChbZSx0XSk9Plt0LGVdKSkpO2kodGhpcyxcImxhbmdEZXRlY3RvclwiKTtpKHRoaXMsXCJUVFNFbmdpbmVcIik7aSh0aGlzLFwiZGVlcExJZnJhbWVcIik7dGhpcy5sYW5nRGV0ZWN0b3I9ZSx0aGlzLlRUU0VuZ2luZT10LHRoaXMuY3JlYXRlSWZyYW1lKCl9Y3JlYXRlSWZyYW1lKCl7dGhpcy5kZWVwTElmcmFtZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaWZyYW1lXCIpLGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5kZWVwTElmcmFtZSksdGhpcy5kZWVwTElmcmFtZS5zcmM9dGhpcy5IT01FX1BBR0V9c3VwcG9ydGVkTGFuZ3VhZ2VzKCl7cmV0dXJuIG5ldyBTZXQodGhpcy5MQU5fVE9fQ09ERS5rZXlzKCkpfWFzeW5jIGRldGVjdChlKXtyZXR1cm4gYXdhaXQgdGhpcy5sYW5nRGV0ZWN0b3IuZGV0ZWN0KGUpfWFzeW5jIHRyYW5zbGF0ZShlLHQscyl7dHJ5e3JldHVybnttYWluTWVhbmluZzphd2FpdCBuZXcgUHJvbWlzZSgoYSxuKT0+e2NvbnN0IG89c2V0VGltZW91dCgoKT0+e24oe3N0YXR1czo0MDgsZXJyb3JNc2c6XCJSZXF1ZXN0IHRpbWVvdXQhXCJ9KX0sMWU0KSxyPWw9PnshbC5kYXRhLnR5cGV8fGwuZGF0YS50eXBlIT09XCJlZGdlX3RyYW5zbGF0ZV9kZWVwbF9yZXNwb25zZVwifHwod2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsciksY2xlYXJUaW1lb3V0KG8pLGwuZGF0YS5zdGF0dXM9PT0yMDA/YShsLmRhdGEucmVzdWx0KTpuKGwuZGF0YSkpfTt3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIixyKSx0aGlzLmRlZXBMSWZyYW1lLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2Uoe3R5cGU6XCJlZGdlX3RyYW5zbGF0ZV9kZWVwbF9yZXF1ZXN0XCIsdXJsOmAke3RoaXMuSE9NRV9QQUdFfSMke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHQpfS8ke3RoaXMuTEFOX1RPX0NPREUuZ2V0KHMpfS8ke2VuY29kZVVSSUNvbXBvbmVudChlLnJlcGxhY2VBbGwoXCIvXCIsXCJcXFxcL1wiKSl9YH0sdGhpcy5IT01FX1BBR0UpfSksb3JpZ2luYWxUZXh0OmV9fWNhdGNoKGEpe3Rocm93IGEuc3RhdHVzPT09NDA4JiYoZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLmRlZXBMSWZyYW1lKSx0aGlzLmNyZWF0ZUlmcmFtZSgpKSxhLmVycm9yQ29kZT1hLnN0YXR1c3x8MCxhLmVycm9yTXNnPWEuZXJyb3JNc2d8fGEubWVzc2FnZSxhLmVycm9yQWN0PXthcGk6XCJkZWVwbFwiLGFjdGlvbjpcInRyYW5zbGF0ZVwiLHRleHQ6ZSxmcm9tOnQsdG86c30sYX19YXN5bmMgcHJvbm91bmNlKGUsdCxzKXtyZXR1cm4gYXdhaXQgdGhpcy5UVFNFbmdpbmUucHJvbm91bmNlKGUsdCxzKX1zdG9wUHJvbm91bmNlKCl7dGhpcy5UVFNFbmdpbmUuc3RvcFByb25vdW5jZSgpfX1jbGFzcyBQe2NvbnN0cnVjdG9yKGUsdCl7aSh0aGlzLFwiY2hhbm5lbFwiKTtpKHRoaXMsXCJDT05GSUdcIix7c2VsZWN0aW9uczp7fSx0cmFuc2xhdG9yczpbXX0pO2kodGhpcyxcIlJFQUxfVFJBTlNMQVRPUlNcIik7aSh0aGlzLFwiTUFJTl9UUkFOU0xBVE9SXCIsXCJHb29nbGVUcmFuc2xhdGVcIik7aWYodGhpcy5jaGFubmVsPXQsdGhpcy5SRUFMX1RSQU5TTEFUT1JTPXtCaW5nVHJhbnNsYXRlOm5ldyBPLEdvb2dsZVRyYW5zbGF0ZTpuZXcgdyxEZWVwTFRyYW5zbGF0ZTpudWxsfSwhKCgpPT57aWYodHlwZW9mIG5hdmlnYXRvcj5cInVcInx8IW5hdmlnYXRvci51c2VyQWdlbnQpcmV0dXJuITE7Y29uc3Qgcz1uYXZpZ2F0b3IudXNlckFnZW50O3JldHVybi9TYWZhcmlcXC8vLnRlc3QocykmJiEvQ2hyb21lXFwvLy50ZXN0KHMpJiYhL0Nocm9taXVtXFwvLy50ZXN0KHMpJiYhL0VkZ1xcLy8udGVzdChzKX0pKCkpdGhpcy5SRUFMX1RSQU5TTEFUT1JTLkRlZXBMVHJhbnNsYXRlPW5ldyBJKHRoaXMuUkVBTF9UUkFOU0xBVE9SUy5CaW5nVHJhbnNsYXRlLHRoaXMuUkVBTF9UUkFOU0xBVE9SUy5CaW5nVHJhbnNsYXRlKTtlbHNle2NvbnN0IHM9dGhpcy5SRUFMX1RSQU5TTEFUT1JTLkdvb2dsZVRyYW5zbGF0ZSxhPXRoaXMuUkVBTF9UUkFOU0xBVE9SUy5CaW5nVHJhbnNsYXRlO3RoaXMuUkVBTF9UUkFOU0xBVE9SUy5EZWVwTFRyYW5zbGF0ZT17c3VwcG9ydGVkTGFuZ3VhZ2VzOigpPT5uZXcgU2V0LGRldGVjdDphc3luYyBuPT5zLmRldGVjdChuKSx0cmFuc2xhdGU6YXN5bmMobixvLHIpPT5zLnRyYW5zbGF0ZShuLG8scikscHJvbm91bmNlOmFzeW5jKG4sbyxyKT0+YS5wcm9ub3VuY2UobixvLHIpLHN0b3BQcm9ub3VuY2U6KCk9PmEuc3RvcFByb25vdW5jZSgpfX10aGlzLnVzZUNvbmZpZyhlKX11c2VDb25maWcoZSl7aWYoIWV8fCFlLnRyYW5zbGF0b3JzfHwhZS5zZWxlY3Rpb25zKXtjb25zb2xlLmVycm9yKFwiSW52YWxpZCBjb25maWcgZm9yIEh5YnJpZFRyYW5zbGF0b3IhXCIpO3JldHVybn10aGlzLkNPTkZJRz1lLHRoaXMuTUFJTl9UUkFOU0xBVE9SPWUuc2VsZWN0aW9ucy5tYWluTWVhbmluZ31nZXRBdmFpbGFibGVUcmFuc2xhdG9yc0ZvcihlLHQpe2NvbnN0IHM9W107Zm9yKGNvbnN0IGEgb2YgT2JqZWN0LmtleXModGhpcy5SRUFMX1RSQU5TTEFUT1JTKSl7Y29uc3Qgbj10aGlzLlJFQUxfVFJBTlNMQVRPUlNbYV0uc3VwcG9ydGVkTGFuZ3VhZ2VzKCk7bi5oYXMoZSkmJm4uaGFzKHQpJiZzLnB1c2goYSl9cmV0dXJuIHMuc29ydCgoYSxuKT0+YT09PVwiR29vZ2xlVHJhbnNsYXRlXCI/LTE6bj09PVwiR29vZ2xlVHJhbnNsYXRlXCI/MTphLmxvY2FsZUNvbXBhcmUobikpfXVwZGF0ZUNvbmZpZ0ZvcihlLHQpe2NvbnN0IHM9e3RyYW5zbGF0b3JzOltdLHNlbGVjdGlvbnM6e319LGE9bmV3IFNldCxuPXRoaXMuZ2V0QXZhaWxhYmxlVHJhbnNsYXRvcnNGb3IoZSx0KSxvPW5bMF0scj1uZXcgU2V0KG4pO2xldCBsO2ZvcihsIGluIHRoaXMuQ09ORklHLnNlbGVjdGlvbnMpe2xldCB1LFQ9dGhpcy5DT05GSUcuc2VsZWN0aW9uc1tsXTtyLmhhcyhUKT8ocy5zZWxlY3Rpb25zW2xdPVQsdT1UKToocy5zZWxlY3Rpb25zW2xdPW8sdT1vKSxhLmFkZCh1KX1yZXR1cm4gcy50cmFuc2xhdG9ycz1BcnJheS5mcm9tKGEpLHN9YXN5bmMgZGV0ZWN0KGUpe3JldHVybiB0aGlzLlJFQUxfVFJBTlNMQVRPUlNbdGhpcy5NQUlOX1RSQU5TTEFUT1JdLmRldGVjdChlKX1hc3luYyB0cmFuc2xhdGUoZSx0LHMpe2xldCBhPVtdO2ZvcihsZXQgbCBvZiB0aGlzLkNPTkZJRy50cmFuc2xhdG9ycylhLnB1c2godGhpcy5SRUFMX1RSQU5TTEFUT1JTW2xdLnRyYW5zbGF0ZShlLHQscykudGhlbih1PT5bbCx1XSkpO2NvbnN0IG49e29yaWdpbmFsVGV4dDpcIlwiLG1haW5NZWFuaW5nOlwiXCJ9LG89bmV3IE1hcChhd2FpdCBQcm9taXNlLmFsbChhKSk7bGV0IHI7Zm9yKHIgaW4gdGhpcy5DT05GSUcuc2VsZWN0aW9ucyl0cnl7Y29uc3QgbD10aGlzLkNPTkZJRy5zZWxlY3Rpb25zW3JdO25bcl09by5nZXQobClbcl19Y2F0Y2gobCl7Y29uc29sZS5sb2coYCR7cn0gJHt0aGlzLkNPTkZJRy5zZWxlY3Rpb25zW3JdfWApLGNvbnNvbGUubG9nKGwpfXJldHVybiBufWFzeW5jIHByb25vdW5jZShlLHQscyl7cmV0dXJuIHRoaXMuUkVBTF9UUkFOU0xBVE9SU1t0aGlzLk1BSU5fVFJBTlNMQVRPUl0ucHJvbm91bmNlKGUsdCxzKX1hc3luYyBzdG9wUHJvbm91bmNlKCl7dGhpcy5SRUFMX1RSQU5TTEFUT1JTW3RoaXMuTUFJTl9UUkFOU0xBVE9SXS5zdG9wUHJvbm91bmNlKCl9fWNvbnN0ICQ9e2VuOlwiRW5nbGlzaFwiLFwiemgtQ05cIjpcIkNoaW5lc2VTaW1wbGlmaWVkXCIsXCJ6aC1UV1wiOlwiQ2hpbmVzZVRyYWRpdGlvbmFsXCIsZnI6XCJGcmVuY2hcIixlczpcIlNwYW5pc2hcIixydTpcIlJ1c3NpYW5cIixhcjpcIkFyYWJpY1wiLGRlOlwiR2VybWFuXCIsamE6XCJKYXBhbmVzZVwiLHB0OlwiUG9ydHVndWVzZVwiLGhpOlwiSGluZGlcIix1cjpcIlVyZHVcIixrbzpcIktvcmVhblwiLGFjaDpcIkFjaGluZXNlXCIsYWY6XCJBZnJpa2FhbnNcIixha2E6XCJBa2FuXCIsc3E6XCJBbGJhbmlhblwiLGFtOlwiQW1oYXJpY1wiLGFyZzpcIkFyYWdvbmVzZVwiLGh5OlwiQXJtZW5pYW5cIixhc206XCJBc3NhbWVzZVwiLGFzdDpcIkFzdHVyaWFuXCIsYXltOlwiQXltYXJhXCIsYXo6XCJBemVyYmFpamFuaVwiLGJhbDpcIkJhbHVjaGlcIixzdW46XCJCYXNhU3VuZGFcIixiYWs6XCJCYXNoa2lyXCIsZXU6XCJCYXNxdWVcIixiZTpcIkJlbGFydXNpYW5cIixiZW06XCJCZW1iYVwiLGJuOlwiQmVuZ2FsaVwiLGJlcjpcIkJlcmJlcmxhbmd1YWdlc1wiLGJobzpcIkJob2pwdXJpXCIsYmlzOlwiQmlzbGFtYVwiLGJsaTpcIkJsaW5cIixub2I6XCJCb2ttYWxcIixiczpcIkJvc25pYW5cIixicmU6XCJCcmV0b25cIixiZzpcIkJ1bGdhcmlhblwiLGJ1cjpcIkJ1cm1lc2VcIix5dWU6XCJDYW50b25lc2VcIixjYTpcIkNhdGFsYW5cIixjZWI6XCJDZWJ1YW5vXCIsY2hyOlwiQ2hlcm9rZWVcIixueTpcIkNoaWNoZXdhXCIsY2h2OlwiQ2h1dmFzaFwiLHd5dzpcIkNsYXNzaWNhbENoaW5lc2VcIixjb3I6XCJDb3JuaXNoXCIsY286XCJDb3JzaWNhblwiLGNyZTpcIkNyZWVrXCIsY3JpOlwiQ3JpbWVhblRhdGFyXCIsaHI6XCJDcm9hdGlhblwiLGNzOlwiQ3plY2hcIixkYTpcIkRhbmlzaFwiLHByczpcIkRhcmlcIixkaXY6XCJEaXZlaGlcIixubDpcIkR1dGNoXCIsZW86XCJFc3BlcmFudG9cIixldDpcIkVzdG9uaWFuXCIsZmFvOlwiRmFyb2VzZVwiLGZqOlwiRmlqaVwiLGZpbDpcIkZpbGlwaW5vXCIsZmk6XCJGaW5uaXNoXCIsZnk6XCJGcmlzaWFuXCIsZnJpOlwiRnJpdWxpYW5cIixmdWw6XCJGdWxhbmlcIixnbGE6XCJHYWVsaWNcIixnbDpcIkdhbGljaWFuXCIsa2E6XCJHZW9yZ2lhblwiLGVsOlwiR3JlZWtcIixncm46XCJHdWFyYW5pXCIsZ3U6XCJHdWphcmF0aVwiLGh0OlwiSGFpdGlhbkNyZW9sZVwiLGhhazpcIkhha2hhQ2hpblwiLGhhOlwiSGF1c2FcIixoYXc6XCJIYXdhaWlhblwiLGhlOlwiSGVicmV3XCIsaGlsOlwiSGlsaWdheW5vblwiLGhtbjpcIkhtb25nXCIsaHU6XCJIdW5nYXJpYW5cIixodXA6XCJIdXBhXCIsaXM6XCJJY2VsYW5kaWNcIixpZG86XCJJZG9cIixpZzpcIklnYm9cIixpZDpcIkluZG9uZXNpYW5cIixpbmc6XCJJbmd1c2hcIixpbmE6XCJpbnRlcmxpbmd1YVwiLGlrdTpcIkludWt0aXR1dFwiLGdhOlwiSXJpc2hcIixpdDpcIkl0YWxpYW5cIixqdzpcIkphdmFuZXNlXCIsa2FiOlwiS2FieWxlXCIsa2FsOlwiS2FsYWFsbGlzdXRcIixrbjpcIkthbm5hZGFcIixrYXU6XCJLYW51cmlcIixrYXM6XCJLYXNobWlyaVwiLGthaDpcIkthc2h1YmlhblwiLGtrOlwiS2F6YWtoXCIsa206XCJLaG1lclwiLGtpbjpcIktpbnlhcndhbmRhXCIsdGxoOlwiS2xpbmdvblwiLGtvbjpcIktvbmdvXCIsa29rOlwiS29ua2FuaVwiLGt1OlwiS3VyZGlzaFwiLGttcjpcIkt1cmRpc2hOb3J0aGVyblwiLGt5OlwiS3lyZ3l6XCIsbG86XCJMYW9cIixsYWc6XCJMYXRnYWxpYW5cIixsYTpcIkxhdGluXCIsbHY6XCJMYXR2aWFuXCIsbGltOlwiTGltYnVyZ2lzaFwiLGxpbjpcIkxpbmdhbGFcIixsdDpcIkxpdGh1YW5pYW5cIixsb2o6XCJMb2piYW5cIixsdWc6XCJMdWdhbmRhXCIsbGI6XCJMdXhlbWJvdXJnaXNoXCIsbWs6XCJNYWNlZG9uaWFuXCIsbWFpOlwiTWFpdGhpbGlcIixtZzpcIk1hbGFnYXN5XCIsbXM6XCJNYWxheVwiLG1sOlwiTWFsYXlhbGFtXCIsbXQ6XCJNYWx0ZXNlXCIsZ2x2OlwiTWFueFwiLG1pOlwiTWFvcmlcIixtcjpcIk1hcmF0aGlcIixtYWg6XCJNYXJzaGFsbGVzZVwiLG1hdTpcIk1hdXJpdGlhbkNyZW9sZVwiLGZybTpcIk1pZGRsZUZyZW5jaFwiLG1uOlwiTW9uZ29saWFuXCIsbW90OlwiTW9udGVuZWdyaW5cIixteTpcIk15YW5tYXJcIixuZWE6XCJOZWFwb2xpdGFuXCIsbmU6XCJOZXBhbGlcIixzbWU6XCJOb3J0aGVyblNhbWlcIixwZWQ6XCJOb3J0aGVyblNvdGhvXCIsbm86XCJOb3J3ZWdpYW5cIixubm86XCJOeW5vcnNrXCIsb2NpOlwiT2NjaXRhblwiLG9qaTpcIk9qaWJ3YVwiLGVubzpcIk9sZEVuZ2xpc2hcIixvcjpcIk9yaXlhXCIsb3JtOlwiT3JvbW9cIixvc3M6XCJPc3NldGlhblwiLHBhbTpcIlBhbXBhbmdhXCIscGFwOlwiUGFwaWFtZW50b1wiLHBzOlwiUGFzaHRvXCIsZmE6XCJQZXJzaWFuXCIscGw6XCJQb2xpc2hcIixwYTpcIlB1bmphYmlcIixxdWU6XCJRdWVjaHVhXCIsb3RxOlwiUXVlcmV0YXJvT3R0b21pXCIscm86XCJSb21hbmlhblwiLHJvaDpcIlJvbWFuc2hcIixyb206XCJSb21hbnlcIixydXk6XCJSdXN5blwiLHNtOlwiU2Ftb2FuXCIsc2FuOlwiU2Fuc2tyaXRcIixzcmQ6XCJTYXJkaW5pYW5cIixzY286XCJTY290c1wiLGdkOlwiU2NvdHNHYWVsaWNcIixzcmM6XCJTZXJiQ3lyaWxsaWNcIixzcjpcIlNlcmJpYW5cIixcInNyLUN5cmxcIjpcIlNlcmJpYW5DeXJpbGxpY1wiLFwic3ItTGF0blwiOlwiU2VyYmlhbkxhdGluXCIsc2VjOlwiU2VyYm9Dcm9hdGlhblwiLHN0OlwiU2Vzb3Rob1wiLHNoYTpcIlNoYW5cIixzbjpcIlNob25hXCIsc2lsOlwiU2lsZXNpYW5cIixzZDpcIlNpbmRoaVwiLHNpOlwiU2luaGFsYVwiLHNrOlwiU2xvdmFrXCIsc2w6XCJTbG92ZW5pYW5cIixzbzpcIlNvbWFsaVwiLHNvbDpcIlNvbmdoYWlsYW5ndWFnZXNcIixuYmw6XCJTb3V0aGVybk5kZWJlbGVcIixzb3Q6XCJTb3V0aGVyblNvdGhvXCIsc3U6XCJTdW5kYW5lc2VcIixzdzpcIlN3YWhpbGlcIixzdjpcIlN3ZWRpc2hcIixzeXI6XCJTeXJpYWNcIix0Z2w6XCJUYWdhbG9nXCIsdHk6XCJUYWhpdGlcIix0ZzpcIlRhamlrXCIsdGE6XCJUYW1pbFwiLHRhdDpcIlRhdGFyXCIsdGU6XCJUZWx1Z3VcIix0ZXQ6XCJUZXR1bVwiLHRoOlwiVGhhaVwiLHRpcjpcIlRpZ3JpbnlhXCIsdG86XCJUb25nYW5cIix0c286XCJUc29uZ2FcIix0cjpcIlR1cmtpc2hcIix0dWs6XCJUdXJrbWVuXCIsdHdpOlwiVHdpXCIsdWc6XCJVeWdodXJcIix1azpcIlVrcmFpbmlhblwiLHVwczpcIlVwcGVyU29yYmlhblwiLHV6OlwiVXpiZWtcIix2ZW46XCJWZW5kYVwiLHZpOlwiVmlldG5hbWVzZVwiLHdsbjpcIldhbGxvb25cIixjeTpcIldlbHNoXCIsZnJ5OlwiV2VzdGVybkZyaXNpYW5cIix3b2w6XCJXb2xvZlwiLHhoOlwiWGhvc2FcIix5aTpcIllpZGRpc2hcIix5bzpcIllvcnViYVwiLHl1YTpcIll1a2F0YW5NYXlhblwiLHphejpcIlphemFcIix6dTpcIlp1bHVcIn07ZXhwb3J0e08gYXMgQmluZ1RyYW5zbGF0b3IsSSBhcyBEZWVwbFRyYW5zbGF0b3IsdyBhcyBHb29nbGVUcmFuc2xhdG9yLFAgYXMgSHlicmlkVHJhbnNsYXRvciwkIGFzIExBTkdVQUdFUyxwIGFzIGF4aW9zfTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IHsgTEFOR1VBR0VTIH0gZnJvbSBcIkBlZGdlX3RyYW5zbGF0ZS90cmFuc2xhdG9yc1wiO1xuaW1wb3J0IENoYW5uZWwgZnJvbSBcImNvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIjtcbmltcG9ydCB7IGkxOG5IVE1MIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL2NvbW1vbi5qc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanNcIjtcblxuLyoqXG4gKiBDb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKi9cbmNvbnN0IGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgpO1xuY29uc3QgSVNfQ0hST01FID0gQlJPV1NFUl9FTlYgPT09IFwiY2hyb21lXCI7XG5cbi8vIOiOt+WPluS4i+aLieWIl+ihqOWFg+e0oFxubGV0IHNvdXJjZUxhbmd1YWdlID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbFwiKTtcbmxldCB0YXJnZXRMYW5ndWFnZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidGxcIik7XG4vLyDojrflj5bkuqTmjaLmjInpkq5cbmxldCBleGNoYW5nZUJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZXhjaGFuZ2VcIik7XG4vLyDojrflj5bkupLor5HmqKHlvI/lvIDlhbNcbmxldCBtdXR1YWxUcmFuc2xhdGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm11dHVhbC10cmFuc2xhdGVcIik7XG5cbi8qKlxuICog5Yid5aeL5YyW6K6+572u5YiX6KGoXG4gKi9cbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgaTE4bkhUTUwoKTtcbiAgICAvLyBDaHJvbWXqsIAg7JWE64uMIOu4jOudvOyasOyggOyXkOyEnOuKlCDsoITssrQg7Y6Y7J207KeAIOuyiOyXrSBVSSDsiKjquYBcbiAgICBpZiAoIUlTX0NIUk9NRSkge1xuICAgICAgICBjb25zdCBwYWdlVHJhbnNsYXRlUm93ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJwYWdlLXRyYW5zbGF0ZVwiKTtcbiAgICAgICAgaWYgKHBhZ2VUcmFuc2xhdGVSb3cpIHBhZ2VUcmFuc2xhdGVSb3cuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgIH1cblxuICAgIGxldCBhcnJvd1VwID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcnJvdy11cFwiKTtcbiAgICBsZXQgYXJyb3dEb3duID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhcnJvdy1kb3duXCIpO1xuICAgIGFycm93RG93bi5zZXRBdHRyaWJ1dGUoXCJ0aXRsZVwiLCBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKFwiVW5mb2xkXCIpKTtcbiAgICBhcnJvd1VwLnNldEF0dHJpYnV0ZShcInRpdGxlXCIsIGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJGb2xkXCIpKTtcblxuICAgIHNvdXJjZUxhbmd1YWdlLm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyDlpoLmnpzmupDor63oqIDmmK/oh6rliqjliKTmlq3or63oqIDnsbvlnoso5YC85pivYXV0byks5YiZ5oyJ6ZKu5pi+56S654Gw6Imy77yM6YG/5YWN55So5oi354K55Ye7LOWmguaenOS4jeaYr++8jOWImeaYvuekuuiTneiJsu+8jOWPr+S7peeCueWHu1xuICAgICAgICBqdWRnZVZhbHVlKGV4Y2hhbmdlQnV0dG9uLCBzb3VyY2VMYW5ndWFnZSk7XG4gICAgICAgIHVwZGF0ZUxhbmd1YWdlU2V0dGluZyhcbiAgICAgICAgICAgIHNvdXJjZUxhbmd1YWdlLm9wdGlvbnNbc291cmNlTGFuZ3VhZ2Uuc2VsZWN0ZWRJbmRleF0udmFsdWUsXG4gICAgICAgICAgICB0YXJnZXRMYW5ndWFnZS5vcHRpb25zW3RhcmdldExhbmd1YWdlLnNlbGVjdGVkSW5kZXhdLnZhbHVlXG4gICAgICAgICk7XG4gICAgICAgIHNob3dTb3VyY2VUYXJnZXQoKTsgLy8gdXBkYXRlIHNvdXJjZSBsYW5ndWFnZSBhbmQgdGFyZ2V0IGxhbmd1YWdlIGluIGlucHV0IHBsYWNlaG9sZGVyXG4gICAgfTtcblxuICAgIHRhcmdldExhbmd1YWdlLm9uY2hhbmdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB1cGRhdGVMYW5ndWFnZVNldHRpbmcoXG4gICAgICAgICAgICBzb3VyY2VMYW5ndWFnZS5vcHRpb25zW3NvdXJjZUxhbmd1YWdlLnNlbGVjdGVkSW5kZXhdLnZhbHVlLFxuICAgICAgICAgICAgdGFyZ2V0TGFuZ3VhZ2Uub3B0aW9uc1t0YXJnZXRMYW5ndWFnZS5zZWxlY3RlZEluZGV4XS52YWx1ZVxuICAgICAgICApO1xuICAgICAgICBzaG93U291cmNlVGFyZ2V0KCk7IC8vIHVwZGF0ZSBzb3VyY2UgbGFuZ3VhZ2UgYW5kIHRhcmdldCBsYW5ndWFnZSBpbiBpbnB1dCBwbGFjZWhvbGRlclxuICAgIH07XG5cbiAgICAvLyDmt7vliqDkuqTmjaLmjInpkq7lr7nngrnlh7vkuovku7bnmoTnm5HlkKxcbiAgICBleGNoYW5nZUJ1dHRvbi5vbmNsaWNrID0gZXhjaGFuZ2VMYW5ndWFnZTtcblxuICAgIC8vIOa3u+WKoOS6kuivkeaooeW8j+W8gOWFs+eahOS6i+S7tuebkeWQrFxuICAgIG11dHVhbFRyYW5zbGF0ZS5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJPdGhlclNldHRpbmdzXCIsIERFRkFVTFRfU0VUVElOR1MpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgbGV0IE90aGVyU2V0dGluZ3MgPSByZXN1bHQuT3RoZXJTZXR0aW5ncztcbiAgICAgICAgICAgIE90aGVyU2V0dGluZ3NbXCJNdXR1YWxUcmFuc2xhdGVcIl0gPSBtdXR1YWxUcmFuc2xhdGUuY2hlY2tlZDtcbiAgICAgICAgICAgIHNhdmVPcHRpb24oXCJPdGhlclNldHRpbmdzXCIsIE90aGVyU2V0dGluZ3MpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2hvd1NvdXJjZVRhcmdldCgpO1xuICAgIH07XG5cbiAgICAvLyDojrflvpfnlKjmiLfkuYvliY3pgInmi6nnmoTor63oqIDnv7vor5HpgInpobnlkozkupLor5Horr7nva5cbiAgICBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhbXCJsYW5ndWFnZVNldHRpbmdcIiwgXCJPdGhlclNldHRpbmdzXCJdLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKFxuICAgICAgICAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgT3RoZXJTZXR0aW5ncyA9IHJlc3VsdC5PdGhlclNldHRpbmdzO1xuICAgICAgICAgICAgbGV0IGxhbmd1YWdlU2V0dGluZyA9IHJlc3VsdC5sYW5ndWFnZVNldHRpbmc7XG5cbiAgICAgICAgICAgIC8vIOagueaNrua6kOivreiogOiuvuWumuabtOaWsFxuICAgICAgICAgICAgaWYgKGxhbmd1YWdlU2V0dGluZy5zbCA9PT0gXCJhdXRvXCIpIHtcbiAgICAgICAgICAgICAgICBtdXR1YWxUcmFuc2xhdGUuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIG11dHVhbFRyYW5zbGF0ZS5wYXJlbnRFbGVtZW50LnRpdGxlID0gY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcbiAgICAgICAgICAgICAgICAgICAgXCJNdXR1YWxUcmFuc2xhdGlvbldhcm5pbmdcIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgaWYgKE90aGVyU2V0dGluZ3NbXCJNdXR1YWxUcmFuc2xhdGVcIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgbXV0dWFsVHJhbnNsYXRlLmNoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgbXV0dWFsVHJhbnNsYXRlLm9uY2hhbmdlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtdXR1YWxUcmFuc2xhdGUuY2hlY2tlZCA9IE90aGVyU2V0dGluZ3NbXCJNdXR1YWxUcmFuc2xhdGVcIl07XG4gICAgICAgICAgICAgICAgbXV0dWFsVHJhbnNsYXRlLnBhcmVudEVsZW1lbnQudGl0bGUgPSBcIlwiO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBsYW5ndWFnZXPmmK/lj6/pgInnmoTmupDor63oqIDlkoznm67moIfor63oqIDnmoTliJfooahcbiAgICAgICAgICAgIGZvciAobGV0IGxhbmd1YWdlIGluIExBTkdVQUdFUykge1xuICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IGxhbmd1YWdlO1xuICAgICAgICAgICAgICAgIGxldCBuYW1lID0gY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShMQU5HVUFHRVNbbGFuZ3VhZ2VdKTtcblxuICAgICAgICAgICAgICAgIGlmIChsYW5ndWFnZVNldHRpbmcgJiYgdmFsdWUgPT0gbGFuZ3VhZ2VTZXR0aW5nLnNsKSB7XG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZUxhbmd1YWdlLm9wdGlvbnMuYWRkKG5ldyBPcHRpb24obmFtZSwgdmFsdWUsIHRydWUsIHRydWUpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzb3VyY2VMYW5ndWFnZS5vcHRpb25zLmFkZChuZXcgT3B0aW9uKG5hbWUsIHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGxhbmd1YWdlU2V0dGluZyAmJiB2YWx1ZSA9PSBsYW5ndWFnZVNldHRpbmcudGwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0TGFuZ3VhZ2Uub3B0aW9ucy5hZGQobmV3IE9wdGlvbihuYW1lLCB2YWx1ZSwgdHJ1ZSwgdHJ1ZSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldExhbmd1YWdlLm9wdGlvbnMuYWRkKG5ldyBPcHRpb24obmFtZSwgdmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNob3dTb3VyY2VUYXJnZXQoKTsgLy8gc2hvdyBzb3VyY2UgbGFuZ3VhZ2UgYW5kIHRhcmdldCBsYW5ndWFnZSBpbiBpbnB1dCBwbGFjZWhvbGRlclxuICAgICAgICB9XG4gICAgKTtcbiAgICAvLyDnu5/kuIDmt7vliqDkuovku7bnm5HlkKxcbiAgICBhZGRFdmVudExpc3RlbmVyKCk7XG59O1xuXG4vKipcbiAqIOebkeWQrOWxleW8gOivreiogOiuvue9rueahOW/q+aNt+mUrlxuICovXG5jaHJvbWUuY29tbWFuZHMub25Db21tYW5kLmFkZExpc3RlbmVyKChjb21tYW5kKSA9PiB7XG4gICAgc3dpdGNoIChjb21tYW5kKSB7XG4gICAgICAgIGNhc2UgXCJjaGFuZ2VfbGFuZ3VhZ2Vfc2V0dGluZ1wiOlxuICAgICAgICAgICAgc2V0dGluZ1N3aXRjaCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJleGNoYW5nZV9zb3VyY2VfdGFyZ2V0X2xhbmdcIjpcbiAgICAgICAgICAgIGV4Y2hhbmdlTGFuZ3VhZ2UoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiY2hhbmdlX211dHVhbF90cmFuc2xhdGVcIjpcbiAgICAgICAgICAgIG11dHVhbFRyYW5zbGF0ZS5jbGljaygpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG59KTtcblxuLyoqXG4gKiDkv53lrZjnv7vor5Hor63oqIDorr7lrppcbiAqXG4gKiBAcGFyYW0geyp9IHNvdXJjZUxhbmd1YWdlIOa6kOivreiogFxuICogQHBhcmFtIHsqfSB0YXJnZXRMYW5ndWFnZSDnm67moIfor63oqIBcbiAqL1xuZnVuY3Rpb24gdXBkYXRlTGFuZ3VhZ2VTZXR0aW5nKHNvdXJjZUxhbmd1YWdlLCB0YXJnZXRMYW5ndWFnZSkge1xuICAgIC8vIFVwZGF0ZSB0cmFuc2xhdG9yIGNvbmZpZy5cbiAgICBjaGFubmVsLmVtaXQoXCJsYW5ndWFnZV9zZXR0aW5nX3VwZGF0ZVwiLCB7XG4gICAgICAgIGZyb206IHNvdXJjZUxhbmd1YWdlLFxuICAgICAgICB0bzogdGFyZ2V0TGFuZ3VhZ2UsXG4gICAgfSk7XG5cbiAgICBzYXZlT3B0aW9uKFwibGFuZ3VhZ2VTZXR0aW5nXCIsIHsgc2w6IHNvdXJjZUxhbmd1YWdlLCB0bDogdGFyZ2V0TGFuZ3VhZ2UgfSk7XG4gICAgaWYgKHNvdXJjZUxhbmd1YWdlID09PSBcImF1dG9cIikge1xuICAgICAgICBtdXR1YWxUcmFuc2xhdGUuY2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICBtdXR1YWxUcmFuc2xhdGUuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICBtdXR1YWxUcmFuc2xhdGUucGFyZW50RWxlbWVudC50aXRsZSA9IGNocm9tZS5pMThuLmdldE1lc3NhZ2UoXCJNdXR1YWxUcmFuc2xhdGlvbldhcm5pbmdcIik7XG4gICAgICAgIG11dHVhbFRyYW5zbGF0ZS5vbmNoYW5nZSgpO1xuICAgIH0gZWxzZSBpZiAobXV0dWFsVHJhbnNsYXRlLmRpc2FibGVkKSB7XG4gICAgICAgIG11dHVhbFRyYW5zbGF0ZS5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICBtdXR1YWxUcmFuc2xhdGUucGFyZW50RWxlbWVudC50aXRsZSA9IFwiXCI7XG4gICAgfVxufVxuXG4vKipcbiAqIOS/neWtmOS4gOadoeiuvue9rumhuVxuICpcbiAqIEBwYXJhbSB7Kn0ga2V5IOiuvue9rumhueWQjVxuICogQHBhcmFtIHsqfSB2YWx1ZSDorr7nva7poblcbiAqL1xuZnVuY3Rpb24gc2F2ZU9wdGlvbihrZXksIHZhbHVlKSB7XG4gICAgbGV0IGl0ZW0gPSB7fTtcbiAgICBpdGVtW2tleV0gPSB2YWx1ZTtcbiAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChpdGVtKTtcbn1cblxuLyoqXG4gKiDpnIDopoHlr7npobXpnaLkuK3nmoTlhYPntKDmt7vliqDkuovku7bnm5HlkKzml7bvvIzor7flnKjmraTlh73mlbDkuK3mt7vliqBcbiAqL1xuZnVuY3Rpb24gYWRkRXZlbnRMaXN0ZW5lcigpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRyYW5zbGF0ZVN1Ym1pdFwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdHJhbnNsYXRlU3VibWl0KTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwia2V5cHJlc3NcIiwgdHJhbnNsYXRlUHJlU3VibWl0KTsgLy8g5a+555So5oi35oyJ5LiL5Zue6L2m5oyJ6ZSu5ZCO55qE5LqL5Lu26L+b6KGM55uR5ZCsXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzZXR0aW5nLXN3aXRjaFwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgc2V0dGluZ1N3aXRjaCk7XG4gICAgaWYgKElTX0NIUk9NRSkge1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdvb2dsZS1wYWdlLXRyYW5zbGF0ZVwiKS5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICAgICAgY2hhbm5lbC5lbWl0KFwidHJhbnNsYXRlX3BhZ2VfZ29vZ2xlXCIsIHt9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vKipcbiAqIGJsb2NrIHN0YXJ0XG4gKiDkuovku7bnm5HlkKznmoTlm57osIPlh73mlbDlrprkuYnor7flnKjmraTljLrln5/kuK3ov5tcbiAqL1xuXG4vKipcbiAqIOi0n+i0o+WcqG9wdGlvbumhtemdouS4rei+k+WFpeWGheWuueWQjui/m+ihjOe/u+ivkVxuICovXG5mdW5jdGlvbiB0cmFuc2xhdGVTdWJtaXQoKSB7XG4gICAgbGV0IGNvbnRlbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInRyYW5zbGF0ZV9pbnB1dFwiKS52YWx1ZTtcbiAgICBpZiAoY29udGVudC5yZXBsYWNlKC9cXHMqLywgXCJcIikgIT09IFwiXCIpIHtcbiAgICAgICAgLy8g5Yik5pat5YC85piv5ZCm5Li6XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGludF9tZXNzYWdlXCIpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgICAgICAvLyBzZW5kIG1lc3NhZ2UgdG8gYmFja2dyb3VuZCB0byB0cmFuc2xhdGUgY29udGVudFxuICAgICAgICBjaGFubmVsLnJlcXVlc3QoXCJ0cmFuc2xhdGVcIiwgeyB0ZXh0OiBjb250ZW50IH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsb3NlKCk7IC8vIOWxleekuue7k+adn+WQjuWFs+mXrW9wdGlvbumhtemdolxuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgIH0pO1xuICAgIH0gLy8g5o+Q56S66L6T5YWl55qE5YaF5a655pivXG4gICAgZWxzZSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhpbnRfbWVzc2FnZVwiKS5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmVcIjtcbn1cblxuLyoqXG4gKlxuICog5aaC5p6c5rqQ6K+t6KiA5piv6Ieq5Yqo5Yik5pat6K+t6KiA57G75Z6LKOWAvOaYr2F1dG8pLOWImeaMiemSruaYvuekuueBsOiJsu+8jOmBv+WFjeeUqOaIt+eCueWHu1xuICpcbiAqIEBwYXJhbSB7KkhUTUxFbGVtZW50fSBleGNoYW5nZUJ1dHRvbiDnibnlrprnmoTkuIDkuKplbGVtZW50LOaYr+S4gOS4quS6pOaNouaMiemSruWbvlxuICogQHBhcmFtIHsqSFRNTEVsZW1lbnR9IHNvdXJjZUxhbmd1YWdlIOeJueWumueahOS4gOS4qmVsZW1lbnQs5rqQ6K+t6KiA55qE6YCJ6aG5XG4gKi9cbmZ1bmN0aW9uIGp1ZGdlVmFsdWUoZXhjaGFuZ2VCdXR0b24sIHNvdXJjZUxhbmd1YWdlKSB7XG4gICAgaWYgKHNvdXJjZUxhbmd1YWdlLnZhbHVlID09PSBcImF1dG9cIikgZXhjaGFuZ2VCdXR0b24uc3R5bGUuY29sb3IgPSBcImdyYXlcIjtcbiAgICBlbHNlIGV4Y2hhbmdlQnV0dG9uLnN0eWxlLmNvbG9yID0gXCIjNGE4Y2Y3XCI7XG59XG5cbi8qKlxuICog5Lqk5o2i5rqQ6K+t6KiA5ZKM55uu5qCH6K+t6KiAXG4gKi9cbmZ1bmN0aW9uIGV4Y2hhbmdlTGFuZ3VhZ2UoKSB7XG4gICAgaWYgKHNvdXJjZUxhbmd1YWdlLnZhbHVlICE9PSBcImF1dG9cIikge1xuICAgICAgICBsZXQgdGVtcFZhbHVlID0gdGFyZ2V0TGFuZ3VhZ2UudmFsdWU7XG4gICAgICAgIHRhcmdldExhbmd1YWdlLnZhbHVlID0gc291cmNlTGFuZ3VhZ2UudmFsdWU7XG4gICAgICAgIHNvdXJjZUxhbmd1YWdlLnZhbHVlID0gdGVtcFZhbHVlO1xuICAgICAgICB1cGRhdGVMYW5ndWFnZVNldHRpbmcoc291cmNlTGFuZ3VhZ2UudmFsdWUsIHRhcmdldExhbmd1YWdlLnZhbHVlKTtcbiAgICAgICAgc2hvd1NvdXJjZVRhcmdldCgpOyAvLyB1cGRhdGUgc291cmNlIGxhbmd1YWdlIGFuZCB0YXJnZXQgbGFuZ3VhZ2UgaW4gaW5wdXQgcGxhY2Vob2xkZXJcbiAgICB9XG59XG5cbi8qKlxuICog6LSf6LSj5Zyob3B0aW9u5Lit6ZqQ6JeP5oiW5pi+56S66K6+572u6YCJ6aG5XG4gKi9cbmZ1bmN0aW9uIHNldHRpbmdTd2l0Y2goKSB7XG4gICAgbGV0IHNldHRpbmcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNldHRpbmdcIik7XG4gICAgbGV0IGFycm93VXAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFycm93LXVwXCIpO1xuICAgIGxldCBhcnJvd0Rvd24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFycm93LWRvd25cIik7XG4gICAgaWYgKCFzZXR0aW5nLnN0eWxlLmRpc3BsYXkgfHwgc2V0dGluZy5zdHlsZS5kaXNwbGF5ID09IFwibm9uZVwiKSB7XG4gICAgICAgIHNldHRpbmcuc3R5bGUuZGlzcGxheSA9IFwiYmxvY2tcIjtcbiAgICAgICAgYXJyb3dEb3duLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcbiAgICAgICAgYXJyb3dVcC5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmVcIjtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0bFwiKS5mb2N1cygpOyAvLyBhZnRlciBzaG93IHNldHRpbmdzIGJsb2NrLCB0aGUgbGFuZ3VhZ2UgZWxlbWVudCA8c2VsZWN0PiB3aWxsIGJlIGF1dG8gZm9jdXNlZFxuICAgICAgICBqdWRnZVZhbHVlKGV4Y2hhbmdlQnV0dG9uLCBzb3VyY2VMYW5ndWFnZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgc2V0dGluZy5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGFycm93RG93bi5zdHlsZS5kaXNwbGF5ID0gXCJpbmxpbmVcIjtcbiAgICAgICAgYXJyb3dVcC5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJhbnNsYXRlX2lucHV0XCIpLmZvY3VzKCk7IC8vIGFmdGVyIHNldHRpbmdzIGJsb2NrIGRpc2FwcGVhciwgdGhlIHRyYW5zbGF0aW9uIGVsZW1lbnQgPGlucHV0PiB3aWxsIGJlIGF1dG8gZm9jdXNlZFxuICAgIH1cbn1cblxuLyoqXG4gKiDliKTmlq3lpoLmnpzmjInkuIvnmoTmmK/mjInpkq7mmK9lbnRlcumUru+8jOWwseiwg+eUqOe/u+ivkeeahOWHveaVsFxuICovXG5mdW5jdGlvbiB0cmFuc2xhdGVQcmVTdWJtaXQoZXZlbnQpIHtcbiAgICBsZXQgaW50X2tleWNvZGUgPSBldmVudC5jaGFyQ29kZSB8fCBldmVudC5rZXlDb2RlO1xuICAgIGlmIChpbnRfa2V5Y29kZSA9PSBcIjEzXCIpIHtcbiAgICAgICAgdHJhbnNsYXRlU3VibWl0KCk7XG4gICAgfVxufVxuXG4vKipcbiAqIHNob3cgc291cmNlIGxhbmd1YWdlIGFuZCB0YXJnZXQgbGFuZ3VhZ2UgaGludCBpbiBwbGFjZWhvbGRlciBvZiBpbnB1dCBlbGVtZW50XG4gKi9cbmZ1bmN0aW9uIHNob3dTb3VyY2VUYXJnZXQoKSB7XG4gICAgbGV0IGlucHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidHJhbnNsYXRlX2lucHV0XCIpO1xuICAgIGxldCBzb3VyY2VMYW5ndWFnZVN0cmluZyA9IHNvdXJjZUxhbmd1YWdlLm9wdGlvbnNbc291cmNlTGFuZ3VhZ2Uuc2VsZWN0ZWRJbmRleF0udGV4dDtcbiAgICBsZXQgdGFyZ2V0TGFuZ3VhZ2VTdHJpbmcgPSB0YXJnZXRMYW5ndWFnZS5vcHRpb25zW3RhcmdldExhbmd1YWdlLnNlbGVjdGVkSW5kZXhdLnRleHQ7XG4gICAgaWYgKFxuICAgICAgICBzb3VyY2VMYW5ndWFnZS5vcHRpb25zW3NvdXJjZUxhbmd1YWdlLnNlbGVjdGVkSW5kZXhdLnZhbHVlID09PSBcImF1dG9cIiB8fFxuICAgICAgICAhbXV0dWFsVHJhbnNsYXRlLmNoZWNrZWRcbiAgICApIHtcbiAgICAgICAgaW5wdXRFbGVtZW50LnBsYWNlaG9sZGVyID0gYCR7c291cmNlTGFuZ3VhZ2VTdHJpbmd9ID09PiAke3RhcmdldExhbmd1YWdlU3RyaW5nfWA7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaW5wdXRFbGVtZW50LnBsYWNlaG9sZGVyID0gYCR7c291cmNlTGFuZ3VhZ2VTdHJpbmd9IDw9PiAke3RhcmdldExhbmd1YWdlU3RyaW5nfWA7XG4gICAgfVxufVxuXG4vKipcbiAqIGVuZCBibG9ja1xuICovXG4iXSwibmFtZXMiOlsiRXZlbnRNYW5hZ2VyIiwiQ2hhbm5lbCIsImNvbnN0cnVjdG9yIiwiX3NlcnZpY2VzIiwiTWFwIiwiX2V2ZW50TWFuYWdlciIsImNocm9tZSIsInJ1bnRpbWUiLCJvbk1lc3NhZ2UiLCJhZGRMaXN0ZW5lciIsIm1lc3NhZ2UiLCJzZW5kZXIiLCJjYWxsYmFjayIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInR5cGUiLCJjb25zb2xlIiwiZXJyb3IiLCJlbWl0IiwiZXZlbnQiLCJkZXRhaWwiLCJzZXJ2ZXIiLCJnZXQiLCJzZXJ2aWNlIiwicGFyYW1zIiwidGhlbiIsInJlc3VsdCIsImJpbmQiLCJwcm92aWRlIiwic2V0IiwicmVxdWVzdCIsInN0cmluZ2lmeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic2VuZE1lc3NhZ2UiLCJsYXN0RXJyb3IiLCJyZXF1ZXN0VG9UYWIiLCJ0YWJJZCIsInNlbmQiLCJfZ2V0VGFiTWVzc2FnZVNlbmRlciIsIm9uIiwiaGFuZGxlciIsImVtaXRUb1RhYnMiLCJ0YWJJZHMiLCJjYXRjaCIsIkJST1dTRVJfRU5WIiwiYnJvd3NlciIsInRhYnMiLCJnZXREb21haW4iLCJsb2ciLCJsb2dJbmZvIiwidXJsIiwiVVJMX1BBVFRFUk4iLCJncm91cHMiLCJtYXRjaCIsImkxOG5IVE1MIiwiaTE4bkVsZW1lbnRzIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiaSIsImxlbmd0aCIsInBvcyIsImhhc0F0dHJpYnV0ZSIsImdldEF0dHJpYnV0ZSIsImluc2VydEFkamFjZW50VGV4dCIsImkxOG4iLCJnZXRNZXNzYWdlIiwiX2hhbmRsZXJJRCIsIl9ldmVudFRvSGFuZGxlcklEcyIsIl9oYW5kbGVySURUb0hhbmRsZXIiLCJoYW5kbGVySUQiLCJfYWxsb2NIYW5kbGVySUQiLCJoYXMiLCJhZGQiLCJTZXQiLCJjYW5jZWxlZCIsIl9vZmYiLCJ3YXJuIiwic291cmNlIiwiaGFuZGxlcklEcyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJkZWxldGUiLCJCUk9XU0VSX0xBTkdVQUdFU19NQVAiLCJhY2giLCJhZHkiLCJhZiIsImFrIiwiYW0iLCJhciIsImF6IiwiYmciLCJibiIsImNhIiwiY2FrIiwiY2ViIiwiY28iLCJjcyIsImN5IiwiZGEiLCJkZSIsImRzYiIsImVsIiwiZW4iLCJlbyIsImVzIiwiZXQiLCJldSIsImZhIiwiZmYiLCJmaSIsImZyIiwiZ2EiLCJnZCIsImdsIiwiaGEiLCJoYXciLCJoZSIsImhpIiwiaG1uIiwiaHIiLCJoc2IiLCJodCIsImh1IiwiaWQiLCJpZyIsImlzIiwiaXQiLCJpdyIsImphIiwia20iLCJrYWIiLCJrbiIsImtvIiwia3kiLCJsYSIsImxiIiwibG8iLCJsdCIsImx2IiwibWFpIiwibWkiLCJtayIsIm1sIiwibXIiLCJtcyIsIm10IiwibXkiLCJubyIsIm5iIiwibmUiLCJubCIsIm55Iiwib2MiLCJwYSIsInBsIiwicHQiLCJybyIsInJ1Iiwic2QiLCJzayIsInNsIiwic20iLCJzbiIsInNxIiwic3IiLCJzdCIsInN1Iiwic3YiLCJzdyIsInRhIiwidGUiLCJ0ZyIsInRoIiwidGwiLCJ0bGgiLCJ0ciIsInVrIiwidXIiLCJ1eiIsInZpIiwieWkiLCJ5byIsInpoIiwibG9nV2FybiIsImxvZ0Vycm9yIiwic2hvdWxkRmlsdGVyRXJyb3IiLCJ3cmFwQ29uc29sZUZvckZpbHRlcmluZyIsInNldExvZ0xldmVsIiwiZ2V0TG9nTGV2ZWwiLCJGSUxURVJFRF9FUlJPUl9QQVRURVJOUyIsImpvaW5NZXNzYWdlIiwiYXJncyIsIm1hcCIsInYiLCJqb2luIiwiXyIsInNvbWUiLCJwYXR0ZXJuIiwiaW5jbHVkZXMiLCJ0ZXN0IiwiTEVWRUxfT1JERVIiLCJkZWJ1ZyIsImluZm8iLCJzaWxlbnQiLCJjdXJyZW50TGV2ZWwiLCJCVUlMRF9FTlYiLCJsZXZlbCIsInNob3VsZEVtaXQiLCJvcmlnaW5hbENvbnNvbGVFcnJvciIsImFwcGx5IiwiREVGQVVMVF9TRVRUSU5HUyIsImJsYWNrbGlzdCIsInVybHMiLCJkb21haW5zIiwiZXh0ZW5zaW9ucyIsIkxheW91dFNldHRpbmdzIiwiUmVzaXplIiwiUlRMIiwiRm9sZExvbmdDb250ZW50IiwiU2VsZWN0VHJhbnNsYXRlUG9zaXRpb24iLCJsYW5ndWFnZVNldHRpbmciLCJnZXRVSUxhbmd1YWdlIiwiT3RoZXJTZXR0aW5ncyIsIk11dHVhbFRyYW5zbGF0ZSIsIlNlbGVjdFRyYW5zbGF0ZSIsIlRyYW5zbGF0ZUFmdGVyRGJsQ2xpY2siLCJUcmFuc2xhdGVBZnRlclNlbGVjdCIsIkNhbmNlbFRleHRTZWxlY3Rpb24iLCJVc2VHb29nbGVBbmFseXRpY3MiLCJEZWZhdWx0VHJhbnNsYXRvciIsIkRlZmF1bHRQYWdlVHJhbnNsYXRvciIsIkh5YnJpZFRyYW5zbGF0b3JDb25maWciLCJ0cmFuc2xhdG9ycyIsInNlbGVjdGlvbnMiLCJvcmlnaW5hbFRleHQiLCJtYWluTWVhbmluZyIsInRQcm9udW5jaWF0aW9uIiwic1Byb251bmNpYXRpb24iLCJkZXRhaWxlZE1lYW5pbmdzIiwiZGVmaW5pdGlvbnMiLCJleGFtcGxlcyIsIlRyYW5zbGF0ZVJlc3VsdEZpbHRlciIsInRQcm9udW5jaWF0aW9uSWNvbiIsInNQcm9udW5jaWF0aW9uSWNvbiIsIkNvbnRlbnREaXNwbGF5T3JkZXIiLCJIaWRlUGFnZVRyYW5zbGF0b3JCYW5uZXIiLCJzZXREZWZhdWx0U2V0dGluZ3MiLCJzZXR0aW5ncyIsIkFycmF5IiwiT2JqZWN0Iiwia2V5cyIsInVuZGVmaW5lZCIsImdldE9yU2V0RGVmYXVsdFNldHRpbmdzIiwiZGVmYXVsdHMiLCJrZXkiLCJwdXNoIiwic3RvcmFnZSIsInN5bmMiLCJ1cGRhdGVkIiwic2V0dGluZyIsIlUiLCJkZWZpbmVQcm9wZXJ0eSIsIk0iLCJoIiwiZSIsInQiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwid3JpdGFibGUiLCJ2YWx1ZSIsIkwiLCJtZXRob2QiLCJzIiwiZGF0YSIsImEiLCJoZWFkZXJzIiwibiIsInRpbWVvdXQiLCJvIiwiciIsInJlc3BvbnNlVHlwZSIsImwiLCJiYXNlVVJMIiwidSIsInZhbGlkYXRlU3RhdHVzIiwiVCIsImMiLCJSIiwiVVJMU2VhcmNoUGFyYW1zIiwidG9TdHJpbmciLCJtIiwidG9VcHBlckNhc2UiLCJIZWFkZXJzIiwiYm9keSIsIkZvcm1EYXRhIiwiQXJyYXlCdWZmZXIiLCJVaW50OEFycmF5IiwieSIsIkFib3J0Q29udHJvbGxlciIsInNpZ25hbCIsImYiLCJzZXRUaW1lb3V0IiwiYWJvcnQiLCJmZXRjaCIsImNsZWFyVGltZW91dCIsImciLCJ0ZXh0IiwiYmxvYiIsImFycmF5QnVmZmVyIiwiQSIsImsiLCJTIiwiZm9yRWFjaCIsImQiLCJOIiwiRSIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJjb25maWciLCJFcnJvciIsInJlc3BvbnNlIiwiY29kZSIsIm5hbWUiLCJlcnJvclR5cGUiLCJlcnJvckNvZGUiLCJlcnJvck1zZyIsInBvc3QiLCJwdXQiLCJwYXRjaCIsImhlYWQiLCJvcHRpb25zIiwiY29tbW9uIiwiaW50ZXJjZXB0b3JzIiwidXNlIiwiZWplY3QiLCJjcmVhdGUiLCJhc3NpZ24iLCJpc0F4aW9zRXJyb3IiLCJwIiwiYiIsIkQiLCJ5dWUiLCJIIiwiZ3UiLCJPIiwicmVnaW9uIiwidG9rZW4iLCJET01QYXJzZXIiLCJhY2NlcHQiLCJvcmlnaW4iLCJyZWZlcmVyIiwiQXVkaW8iLCJ1cGRhdGVUb2tlbnMiLCJIT01FX1BBR0UiLCJleGVjIiwicmVzcG9uc2VVUkwiLCJIT1NUIiwiSUciLCJIVE1MUGFyc2VyIiwicGFyc2VGcm9tU3RyaW5nIiwiSUlEIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb3VudCIsInBhcnNlVHJhbnNsYXRlUmVzdWx0IiwidHJhbnNsYXRpb25zIiwidHJhbnNsaXRlcmF0aW9uIiwicGFyc2VMb29rdXBSZXN1bHQiLCJkaXNwbGF5U291cmNlIiwiZGlzcGxheVRhcmdldCIsImJhY2tUcmFuc2xhdGlvbnMiLCJkaXNwbGF5VGV4dCIsInBvc1RhZyIsIm1lYW5pbmciLCJzeW5vbnltcyIsInBhcnNlRXhhbXBsZVJlc3VsdCIsInNvdXJjZVByZWZpeCIsInNvdXJjZVRlcm0iLCJzb3VyY2VTdWZmaXgiLCJ0YXJnZXQiLCJ0YXJnZXRQcmVmaXgiLCJ0YXJnZXRUZXJtIiwidGFyZ2V0U3VmZml4IiwidXBkYXRlVFRTQXV0aCIsIkhFQURFUlMiLCJlbmNvZGVVUklDb21wb25lbnQiLCJUVFNfQVVUSCIsImdlbmVyYXRlVFRTRGF0YSIsIkxBTl9UT19DT0RFIiwiYXJyYXlCdWZmZXJUb0Jhc2U2NCIsImJ5dGVMZW5ndGgiLCJTdHJpbmciLCJmcm9tQ2hhckNvZGUiLCJidG9hIiwiY29uc3RydWN0RGV0ZWN0UGFyYW1zIiwiY29uc3RydWN0VHJhbnNsYXRlUGFyYW1zIiwiY29uc3RydWN0TG9va3VwUGFyYW1zIiwiY29uc3RydWN0RXhhbXBsZVBhcmFtcyIsImNvbnN0cnVjdFRUU1BhcmFtcyIsIkF1dGhvcml6YXRpb24iLCJEYXRlIiwibm93IiwibGFzdFJlcXVlc3RUaW1lIiwiUkVRVUVTVF9ERUxBWSIsImNhbGwiLCJTdGF0dXNDb2RlIiwic3RhdHVzQ29kZSIsIk1BWF9SRVRSWSIsInRva2Vuc0luaXRpYXRlZCIsInN1cHBvcnRlZExhbmd1YWdlcyIsImRldGVjdCIsImRldGVjdGVkTGFuZ3VhZ2UiLCJsYW5ndWFnZSIsIkNPREVfVE9fTEFOIiwiZXJyb3JBY3QiLCJhcGkiLCJhY3Rpb24iLCJmcm9tIiwidG8iLCJ0cmFuc2xhdGUiLCJwcm9ub3VuY2UiLCJzdG9wUHJvbm91bmNlIiwiQVVESU8iLCJzcmMiLCJwbGF5IiwicGF1c2VkIiwicGF1c2UiLCJ3IiwiZ2VuZXJhdGVUSyIsImNoYXJDb2RlQXQiLCJfbWFnaWMiLCJjaGFyQXQiLCJ1cGRhdGVUS0siLCJyZXBsYWNlIiwiVEtLIiwiZmFsbEJhY2siLCJmYWxsQmFja2luZyIsImdlbmVyYXRlRGV0ZWN0VVJMIiwiRkFMTEJBQ0tfVFJBTlNMQVRFX1VSTCIsIlRSQU5TTEFURV9VUkwiLCJnZW5lcmF0ZVRyYW5zbGF0ZVVSTCIsInBhcnNlRGV0ZWN0UmVzdWx0IiwibGRfcmVzdWx0IiwiZXh0ZW5kZWRfc3JjbGFuZ3MiLCJzcmNsYW5ncyIsInBhcnNlQmV0dGVyUmVzdWx0Iiwic2VudGVuY2VzIiwidHJhbnMiLCJvcmlnIiwidHJhbnNsaXQiLCJzcmNfdHJhbnNsaXQiLCJkaWN0IiwiZW50cnkiLCJ3b3JkIiwicmV2ZXJzZV90cmFuc2xhdGlvbiIsImdsb3NzIiwiZXhhbXBsZSIsInNvcnQiLCJwYXJzZUZhbGxiYWNrUmVzdWx0IiwiRkFMTEJBQ0tfVFRTX1VSTCIsIlRUU19VUkwiLCJDIiwiSSIsImxhbmdEZXRlY3RvciIsIlRUU0VuZ2luZSIsImNyZWF0ZUlmcmFtZSIsImRlZXBMSWZyYW1lIiwiY3JlYXRlRWxlbWVudCIsImFwcGVuZENoaWxkIiwid2luZG93IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJjb250ZW50V2luZG93IiwicG9zdE1lc3NhZ2UiLCJyZXBsYWNlQWxsIiwicmVtb3ZlQ2hpbGQiLCJQIiwiY2hhbm5lbCIsIlJFQUxfVFJBTlNMQVRPUlMiLCJCaW5nVHJhbnNsYXRlIiwiR29vZ2xlVHJhbnNsYXRlIiwiRGVlcExUcmFuc2xhdGUiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJ1c2VDb25maWciLCJDT05GSUciLCJNQUlOX1RSQU5TTEFUT1IiLCJnZXRBdmFpbGFibGVUcmFuc2xhdG9yc0ZvciIsImxvY2FsZUNvbXBhcmUiLCJ1cGRhdGVDb25maWdGb3IiLCJhbGwiLCIkIiwiYWthIiwiYXJnIiwiaHkiLCJhc20iLCJhc3QiLCJheW0iLCJiYWwiLCJzdW4iLCJiYWsiLCJiZSIsImJlbSIsImJlciIsImJobyIsImJpcyIsImJsaSIsIm5vYiIsImJzIiwiYnJlIiwiYnVyIiwiY2hyIiwiY2h2Iiwid3l3IiwiY29yIiwiY3JlIiwiY3JpIiwicHJzIiwiZGl2IiwiZmFvIiwiZmoiLCJmaWwiLCJmeSIsImZyaSIsImZ1bCIsImdsYSIsImthIiwiZ3JuIiwiaGFrIiwiaGlsIiwiaHVwIiwiaWRvIiwiaW5nIiwiaW5hIiwiaWt1IiwianciLCJrYWwiLCJrYXUiLCJrYXMiLCJrYWgiLCJrayIsImtpbiIsImtvbiIsImtvayIsImt1Iiwia21yIiwibGFnIiwibGltIiwibGluIiwibG9qIiwibHVnIiwibWciLCJnbHYiLCJtYWgiLCJtYXUiLCJmcm0iLCJtbiIsIm1vdCIsIm5lYSIsInNtZSIsInBlZCIsIm5ubyIsIm9jaSIsIm9qaSIsImVubyIsIm9yIiwib3JtIiwib3NzIiwicGFtIiwicGFwIiwicHMiLCJxdWUiLCJvdHEiLCJyb2giLCJyb20iLCJydXkiLCJzYW4iLCJzcmQiLCJzY28iLCJzZWMiLCJzaGEiLCJzaWwiLCJzaSIsInNvIiwic29sIiwibmJsIiwic290Iiwic3lyIiwidGdsIiwidHkiLCJ0YXQiLCJ0ZXQiLCJ0aXIiLCJ0c28iLCJ0dWsiLCJ0d2kiLCJ1ZyIsInVwcyIsInZlbiIsIndsbiIsImZyeSIsIndvbCIsInhoIiwieXVhIiwiemF6IiwienUiLCJCaW5nVHJhbnNsYXRvciIsIkRlZXBsVHJhbnNsYXRvciIsIkdvb2dsZVRyYW5zbGF0b3IiLCJIeWJyaWRUcmFuc2xhdG9yIiwiTEFOR1VBR0VTIiwiYXhpb3MiLCJJU19DSFJPTUUiLCJzb3VyY2VMYW5ndWFnZSIsInRhcmdldExhbmd1YWdlIiwiZXhjaGFuZ2VCdXR0b24iLCJtdXR1YWxUcmFuc2xhdGUiLCJvbmxvYWQiLCJwYWdlVHJhbnNsYXRlUm93Iiwic3R5bGUiLCJkaXNwbGF5IiwiYXJyb3dVcCIsImFycm93RG93biIsInNldEF0dHJpYnV0ZSIsIm9uY2hhbmdlIiwianVkZ2VWYWx1ZSIsInVwZGF0ZUxhbmd1YWdlU2V0dGluZyIsInNlbGVjdGVkSW5kZXgiLCJzaG93U291cmNlVGFyZ2V0Iiwib25jbGljayIsImV4Y2hhbmdlTGFuZ3VhZ2UiLCJjaGVja2VkIiwic2F2ZU9wdGlvbiIsImRpc2FibGVkIiwicGFyZW50RWxlbWVudCIsInRpdGxlIiwiT3B0aW9uIiwiY29tbWFuZHMiLCJvbkNvbW1hbmQiLCJjb21tYW5kIiwic2V0dGluZ1N3aXRjaCIsImNsaWNrIiwiaXRlbSIsInRyYW5zbGF0ZVN1Ym1pdCIsInRyYW5zbGF0ZVByZVN1Ym1pdCIsImNvbnRlbnQiLCJjbG9zZSIsImNvbG9yIiwidGVtcFZhbHVlIiwiZm9jdXMiLCJpbnRfa2V5Y29kZSIsImNoYXJDb2RlIiwia2V5Q29kZSIsImlucHV0RWxlbWVudCIsInNvdXJjZUxhbmd1YWdlU3RyaW5nIiwidGFyZ2V0TGFuZ3VhZ2VTdHJpbmciLCJwbGFjZWhvbGRlciJdLCJzb3VyY2VSb290IjoiIn0=