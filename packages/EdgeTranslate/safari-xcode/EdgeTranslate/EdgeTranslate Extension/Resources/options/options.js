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
/*!********************************!*\
  !*** ./src/options/options.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/channel.js */ "./src/common/scripts/channel.js");
/* harmony import */ var common_scripts_common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/common.js */ "./src/common/scripts/common.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");




/**
 * Communication channel.
 */
const channel = new common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_0__["default"]();

/**
 * 初始化设置列表
 */
window.onload = () => {
  (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_1__.i18nHTML)();

  // 设置不同语言的隐私政策链接
  let PrivacyPolicyLink = document.getElementById("PrivacyPolicyLink");
  PrivacyPolicyLink.setAttribute("href", chrome.i18n.getMessage("PrivacyPolicyLink"));

  /**
   * Set up hybrid translate config.
   */
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_2__.getOrSetDefaultSettings)(["languageSetting", "HybridTranslatorConfig"], common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_SETTINGS).then(async result => {
    let config = result.HybridTranslatorConfig;
    let languageSetting = result.languageSetting;
    let availableTranslators = await channel.request("get_available_translators", {
      from: languageSetting.sl,
      to: languageSetting.tl
    });
    setUpTranslateConfig(config,
    // Remove the hybrid translator at the beginning of the availableTranslators array.
    availableTranslators.slice(1));
  });

  /**
   * Update translator config options on translator config update.
   */
  channel.on("hybrid_translator_config_updated", detail => setUpTranslateConfig(detail.config, detail.availableTranslators));

  /**
   * initiate and update settings
   * attribute "setting-type": indicate the setting type of one option
   * attribute "setting-path": indicate the nested setting path. used to locate the path of one setting item in chrome storage
   */
  (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_2__.getOrSetDefaultSettings)(undefined, common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_2__.DEFAULT_SETTINGS).then(result => {
    let inputElements = document.getElementsByTagName("input");
    const selectTranslatePositionElement = document.getElementById("select-translate-position");
    for (let element of [...inputElements, selectTranslatePositionElement]) {
      let settingItemPath = element.getAttribute("setting-path").split(/\s/g);
      let settingItemValue = getSetting(result, settingItemPath);
      switch (element.getAttribute("setting-type")) {
        case "checkbox":
          element.checked = settingItemValue.indexOf(element.value) !== -1;
          // update setting value
          element.onchange = event => {
            const target = event.target;
            const settingItemPath = target.getAttribute("setting-path").split(/\s/g);
            const settingItemValue = getSetting(result, settingItemPath);

            // if user checked this option, add value to setting array
            if (target.checked) settingItemValue.push(target.value);
            // if user unchecked this option, delete value from setting array
            else settingItemValue.splice(settingItemValue.indexOf(target.value), 1);
            saveOption(result, settingItemPath, settingItemValue);
          };
          break;
        case "radio":
          element.checked = settingItemValue === element.value;
          // update setting value
          element.onchange = event => {
            const target = event.target;
            const settingItemPath = target.getAttribute("setting-path").split(/\s/g);
            if (target.checked) {
              saveOption(result, settingItemPath, target.value);
            }
          };
          break;
        case "switch":
          element.checked = settingItemValue;
          // update setting value
          element.onchange = event => {
            const settingItemPath = event.target.getAttribute("setting-path").split(/\s/g);
            saveOption(result, settingItemPath, event.target.checked);
          };
          break;
        case "select":
          element.value = settingItemValue;
          // update setting value
          element.onchange = event => {
            const target = event.target;
            const settingItemPath = target.getAttribute("setting-path").split(/\s/g);
            saveOption(result, settingItemPath, target.options[target.selectedIndex].value);
          };
          break;
        default:
          break;
      }
    }
  });
};

/**
 * Set up hybrid translate config.
 *
 * @param {Object} config translator config
 * @param {Array<String>} availableTranslators available translators for current language setting
 *
 * @returns {void} nothing
 */
function setUpTranslateConfig(config, availableTranslators) {
  let translatorConfigEles = document.getElementsByClassName("translator-config");
  for (let ele of translatorConfigEles) {
    // Remove existed options.
    for (let i = ele.options.length; i > 0; i--) {
      ele.options.remove(i - 1);
    }

    // data-affected indicates items affected by this element in config.selections, they always have the same value.
    let affected = ele.getAttribute("data-affected").split(/\s/g);
    let selected = config.selections[affected[0]];
    for (let translator of availableTranslators) {
      if (translator === selected) {
        ele.options.add(new Option(chrome.i18n.getMessage(translator), translator, true, true));
      } else {
        ele.options.add(new Option(chrome.i18n.getMessage(translator), translator));
      }
    }
    ele.onchange = () => {
      let value = ele.options[ele.selectedIndex].value;
      // Update every affected item.
      for (let item of affected) {
        config.selections[item] = value;
      }

      // Get the new selected translator set.
      let translators = new Set();
      config.translators = [];
      for (let item in config.selections) {
        let translator = config.selections[item];
        if (!translators.has(translator)) {
          config.translators.push(translator);
          translators.add(translator);
        }
      }
      chrome.storage.sync.set({
        HybridTranslatorConfig: config
      });
    };
  }
}

/**
 *
 * get setting value according to path of setting item
 *
 * @param {Object} localSettings setting object stored in local
 * @param {Array} settingItemPath path of the setting item
 * @returns {*} setting value
 */
function getSetting(localSettings, settingItemPath) {
  let result = localSettings;
  settingItemPath.forEach(key => {
    result = result[key];
  });
  return result;
}

/**
 * 保存一条设置项
 *
 * @param {Object} localSettings  本地存储的设置项
 * @param {Array} settingItemPath 设置项的层级路径
 * @param {*} value 设置项的值
 */
function saveOption(localSettings, settingItemPath, value) {
  // update local settings
  let pointer = localSettings; // point to children of local setting or itself

  // point to the leaf item recursively
  for (let i = 0; i < settingItemPath.length - 1; i++) {
    pointer = pointer[settingItemPath[i]];
  }
  // update the setting leaf value
  pointer[settingItemPath[settingItemPath.length - 1]] = value;
  let result = {};
  result[settingItemPath[0]] = localSettings[settingItemPath[0]];
  chrome.storage.sync.set(result);
}
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLElBQUk7RUFDVEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLFdBQVcsRUFBRSxJQUFJO0VBQ2pCQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixRQUFRLEVBQUUsSUFBSTtFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZCxPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEdBQUcsRUFBRSxLQUFLO0VBQ1ZDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxJQUFJO0VBQ1RDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsS0FBSztFQUNULE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsS0FBSztFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVB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LENBQUN2QixlQUFlLENBQUMxTixDQUFDLENBQUMsQ0FBQztFQUN6QztFQUNBO0VBQ0FpUCxPQUFPLENBQUN2QixlQUFlLENBQUNBLGVBQWUsQ0FBQ3pOLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHK04sS0FBSztFQUU1RCxJQUFJbFEsTUFBTSxHQUFHLENBQUMsQ0FBQztFQUNmQSxNQUFNLENBQUM0UCxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBR3FCLGFBQWEsQ0FBQ3JCLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5RGpSLE1BQU0sQ0FBQzZQLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDdE8sR0FBRyxDQUFDSCxNQUFNLENBQUM7QUFDbkMsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2V2ZW50LmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2xhbmd1YWdlcy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9sb2dnZXIuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9vcHRpb25zL29wdGlvbnMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEV2ZW50TWFuYWdlciBmcm9tIFwiLi9ldmVudC5qc1wiO1xuXG4vKipcbiAqIENoYW5uZWwgZm9yIGludGVyLWNvbnRleHQgY29tbXVuaWNhdGlvbi5cbiAqXG4gKiBBIGNocm9tZSBleHRlbnNpb24gdHlwaWNhbGx5IGNvbnRhaW5zIDQgdHlwZXMgb2YgY29udGV4dDogYmFja2dyb3VuZCwgcG9wdXAsXG4gKiBvcHRpb25zIGFuZCBjb250ZW50IHNjcmlwdHMuIENvbW11bmljYXRpb24gYmV0d2VlbiB0aGVzZSBjb250ZXh0cyByZWxpZXMgb25cbiAqIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlIGFuZCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZS5cbiAqXG4gKiBUaGlzIG1vZHVsZSBwcm92aWRlcyB0d28gY29tbXVuaWNhdGlvbiBtb2RlbDpcbiAqICAgKiByZXF1ZXN0L3Jlc3BvbnNlXG4gKiAgICogZXZlbnQgdHJpZ2dlci9saXN0ZW5cbiAqXG4gKiBiYXNlZCBvbiBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSBhbmQgY2hyb21lLnRhYnMuc2VuZE1lc3NhZ2UuXG4gKi9cbmNsYXNzIENoYW5uZWwge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxTdHJpbmcsIEZ1bmN0aW9uPn0gc2VydmljZXNcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3NlcnZpY2VzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7RXZlbnRNYW5hZ2VyfSBFdmVudCBtYW5hZ2VyLlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fZXZlbnRNYW5hZ2VyID0gbmV3IEV2ZW50TWFuYWdlcigpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWdpc3RlciBtYXNzYWdlIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKFxuICAgICAgICAgICAgKChtZXNzYWdlLCBzZW5kZXIsIGNhbGxiYWNrKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIXBhcnNlZCB8fCAhcGFyc2VkLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgQmFkIG1lc3NhZ2U6ICR7bWVzc2FnZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGFyc2VkLnR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImV2ZW50XCI6XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudE1hbmFnZXIuZW1pdChwYXJzZWQuZXZlbnQsIHBhcnNlZC5kZXRhaWwsIHNlbmRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJzZXJ2aWNlXCI6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNlcnZlciA9IHRoaXMuX3NlcnZpY2VzLmdldChwYXJzZWQuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXNlcnZlcikgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlIGNhbiBjYWxsIHRoZSBjYWxsYmFjayBvbmx5IHdoZW4gd2UgcmVhbGx5IHByb3ZpZGUgdGhlIHJlcXVlc3RlZCBzZXJ2aWNlLlxuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmVyKHBhcnNlZC5wYXJhbXMsIHNlbmRlcikudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocmVzdWx0KSA9PiBjYWxsYmFjayAmJiBjYWxsYmFjayhyZXN1bHQpXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVua25vd24gbWVzc2FnZSB0eXBlOiAke21lc3NhZ2UudHlwZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9KS5iaW5kKHRoaXMpXG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUHJvdmlkZSBhIHNlcnZpY2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gc2VydmVyIHNlcnZlciwgc2VydmVyIGZ1bmN0aW9uIG11c3QgcmV0dXJuIGEgUHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICBwcm92aWRlKHNlcnZpY2UsIHNlcnZlcikge1xuICAgICAgICB0aGlzLl9zZXJ2aWNlcy5zZXQoc2VydmljZSwgc2VydmVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgcmVxdWVzdCBhbmQgZ2V0IGEgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlIG5hbWVcbiAgICAgKiBAcGFyYW0ge0FueX0gcGFyYW1zIHNlcnZpY2UgcGFyYW1ldGVyc1xuICAgICAqIEByZXR1cm5zIHtQcm9taXNlPEFueT59IHByb21pc2Ugb2YgdGhlIHJlc3BvbnNlXG4gICAgICovXG4gICAgcmVxdWVzdChzZXJ2aWNlLCBwYXJhbXMpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJzZXJ2aWNlXCIsIHNlcnZpY2UsIHBhcmFtcyB9KTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBTZW5kIGEgcmVxdWVzdCB0byB0aGUgc3BlY2lmaWVkIHRhYiBhbmQgZ2V0IGEgcmVzcG9uc2UuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gdGFiSWQgdGFiIGlkXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlcnZpY2Ugc2VydmljZVxuICAgICAqIEBwYXJhbSB7QW55fSBwYXJhbXMgc2VydmljZSBwYXJhbWV0ZXJzXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QW55Pn0gcHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICByZXF1ZXN0VG9UYWIodGFiSWQsIHNlcnZpY2UsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBzZW5kID0gdGhpcy5fZ2V0VGFiTWVzc2FnZVNlbmRlcigpO1xuICAgICAgICBpZiAoIXNlbmQpIHtcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcIkNhbiBub3Qgc2VuZCBtZXNzYWdlIHRvIHRhYnMgaW4gY3VycmVudCBjb250ZXh0IVwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwic2VydmljZVwiLCBzZXJ2aWNlLCBwYXJhbXMgfSk7XG4gICAgICAgIHJldHVybiBzZW5kKHRhYklkLCBtZXNzYWdlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYW4gZXZlbnQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0byBoYW5kbGVcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBoYW5kbGVyIGV2ZW50IGhhbmRsZXIsIGFjY2VwdHMgdHdvIGFyZ3VtZW50czpcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogZXZlbnQgZGV0YWlsXG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IHNvdXJjZSBvZiB0aGUgZXZlbnQsIGNocm9tZS5ydW50aW1lLk1lc3NhZ2VTZW5kZXIgb2JqZWN0XG4gICAgICogQHJldHVybnMge0Z1bmN0aW9ufSBhIGNhbmNlbGVyIHRoYXQgd2lsbCByZW1vdmUgdGhlIGhhbmRsZXIgd2hlbiBjYWxsZWRcbiAgICAgKi9cbiAgICBvbihldmVudCwgaGFuZGxlcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXZlbnRNYW5hZ2VyLm9uKGV2ZW50LCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbWl0IGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtBbnl9IGRldGFpbCBldmVudCBkZXRhaWxcbiAgICAgKi9cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgbGV0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZXZlbnRcIiwgZXZlbnQsIGRldGFpbCB9KTtcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSwgKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRW1pdCBhbiBldmVudCB0byBzcGVjaWZpZWQgdGFicy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyIHwgQXJyYXk8TnVtYmVyPn0gdGFiSWRzIHRhYiBpZHNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0FueX0gZGV0YWlsIGV2ZW50IGRldGFpbFxuICAgICAqL1xuICAgIGVtaXRUb1RhYnModGFiSWRzLCBldmVudCwgZGV0YWlsKSB7XG4gICAgICAgIGNvbnN0IHNlbmQgPSB0aGlzLl9nZXRUYWJNZXNzYWdlU2VuZGVyKCk7XG4gICAgICAgIGlmICghc2VuZCkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNhbiBub3Qgc2VuZCBtZXNzYWdlIHRvIHRhYnMgaW4gY3VycmVudCBjb250ZXh0IVwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRhYklkcyBpcyBhIG51bWJlciwgd3JhcCBpdCB1cCB3aXRoIGFuIGFycmF5LlxuICAgICAgICBpZiAodHlwZW9mIHRhYklkcyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdGFiSWRzID0gW3RhYklkc107XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcImV2ZW50XCIsIGV2ZW50LCBkZXRhaWwgfSk7XG4gICAgICAgIGZvciAobGV0IHRhYklkIG9mIHRhYklkcykge1xuICAgICAgICAgICAgc2VuZCh0YWJJZCwgbWVzc2FnZSkuY2F0Y2goKGVycm9yKSA9PiBjb25zb2xlLmVycm9yKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2RcbiAgICAgKlxuICAgICAqIEdldCB0aGUgbWVzc2FnZSBzZW5kaW5nIGZ1bmN0aW9uIGZvciBzZW5kaW5nIG1lc3NhZ2UgdG8gdGFicy5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbiB8IG51bGx9IG1lc3NhZ2Ugc2VuZGVyXG4gICAgICovXG4gICAgX2dldFRhYk1lc3NhZ2VTZW5kZXIoKSB7XG4gICAgICAgIGlmIChCUk9XU0VSX0VOViA9PT0gXCJmaXJlZm94XCIpIHtcbiAgICAgICAgICAgIGlmICghYnJvd3Nlci50YWJzIHx8ICFicm93c2VyLnRhYnMuc2VuZE1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gRmlyZWZveCB1c2VzIFByb21pc2UsIHJldHVybiBkaXJlY3RseS5cbiAgICAgICAgICAgIHJldHVybiBicm93c2VyLnRhYnMuc2VuZE1lc3NhZ2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNocm9tZS50YWJzIHx8ICFjaHJvbWUudGFicy5zZW5kTWVzc2FnZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDaHJvbWUgdXNlcyBjYWxsYmFjaywgd3JhcCBpdCB1cC5cbiAgICAgICAgcmV0dXJuICh0YWJJZCwgbWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICBjaHJvbWUudGFicy5zZW5kTWVzc2FnZSh0YWJJZCwgbWVzc2FnZSwgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDaGFubmVsO1xuIiwiZXhwb3J0IHsgZ2V0RG9tYWluLCBsb2cgfTtcbmltcG9ydCB7IGxvZ0luZm8gfSBmcm9tIFwiLi9sb2dnZXIuanNcIjtcblxuLyoqXG4gKiDmj5Dlj5bnu5nlrprnmoR1cmznmoTln5/lkI1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKi9cbmZ1bmN0aW9uIGdldERvbWFpbih1cmwpIHtcbiAgICBpZiAodXJsKSB7XG4gICAgICAgIGxldCBVUkxfUEFUVEVSTiA9IC8uKzpcXC8rKFtcXHcuLV0rKS4qLztcbiAgICAgICAgbGV0IGdyb3VwcyA9IHVybC5tYXRjaChVUkxfUEFUVEVSTik7XG4gICAgICAgIGlmIChncm91cHMpIHtcbiAgICAgICAgICAgIHJldHVybiBncm91cHNbMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFwiXCI7XG59XG5cbi8qKlxuICogY29uc29sZS5sb2cgd3JhcHBlci5cbiAqXG4gKiBAcGFyYW0ge0FueX0gbWVzc2FnZSBtZXNzYWdlIHRvIGxvZy5cbiAqL1xuZnVuY3Rpb24gbG9nKG1lc3NhZ2UpIHtcbiAgICBsb2dJbmZvKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIHNldCB0aGUgY29udGVudCB0ZXh0IG9mIEhUTUwgdGFncywgd2hpY2ggaGF2ZSBcImkxOG5cIiBjbGFzcyBuYW1lLCB3aXRoIGkxOG4gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5IVE1MKCkge1xuICAgIGxldCBpMThuRWxlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaTE4blwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGkxOG5FbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBEZWZhdWx0IFwiYmVmb3JlRW5kXCIuXG4gICAgICAgIGxldCBwb3MgPSBcImJlZm9yZUVuZFwiO1xuICAgICAgICBpZiAoaTE4bkVsZW1lbnRzW2ldLmhhc0F0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKSkge1xuICAgICAgICAgICAgcG9zID0gaTE4bkVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi3n+maj+a1j+iniOWZqOeahOivreiogOiuvue9ruaYvuekuuWGheWuuVxuICAgICAgICBpMThuRWxlbWVudHNbaV0uaW5zZXJ0QWRqYWNlbnRUZXh0KFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShpMThuRWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKFwiZGF0YS1pMThuLW5hbWVcIikpXG4gICAgICAgICk7XG4gICAgfVxufVxuIiwiLyoqXG4gKiBFdmVudCBtYW5hZ2VyLlxuICovXG5jbGFzcyBFdmVudE1hbmFnZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge051bWJlcn0gbmV4dCBoYW5kbGVyIElELlxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faGFuZGxlcklEID0gMTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxTdHJpbmcsIFNldDxOdW1iZXI+Pn0gZXZlbnQgdG8gaGFuZGxlciBJRHMgbWFwXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudFRvSGFuZGxlcklEcyA9IG5ldyBNYXAoKTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUge01hcDxOdW1iZXIsIEZ1bmN0aW9uPn0gaGFuZGxlciBJRCB0byBoYW5kbGVyIG1hcFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyID0gbmV3IE1hcCgpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGhhbmRsZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgZXZlbnQgaGFuZGxlciwgYWNjZXB0cyB0d28gYXJndW1lbnRzOlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBldmVudCBkZXRhaWxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlIG9mIHRoZSBldmVudCwgY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlciBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IGEgY2FuY2VsZXIgdGhhdCB3aWxsIHJlbW92ZSB0aGUgaGFuZGxlciB3aGVuIGNhbGxlZFxuICAgICAqL1xuICAgIG9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRCA9IHRoaXMuX2FsbG9jSGFuZGxlcklEKCk7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5zZXQoaGFuZGxlcklELCBoYW5kbGVyKTtcblxuICAgICAgICBpZiAodGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuaGFzKGV2ZW50KSkge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KS5hZGQoaGFuZGxlcklEKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50VG9IYW5kbGVySURzLnNldChldmVudCwgbmV3IFNldChbaGFuZGxlcklEXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRWFjaCBjYW5jZWxlciBzaG91bGQgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAgICAgICAgbGV0IGNhbmNlbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiAoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFjYW5jZWxlZCkge1xuICAgICAgICAgICAgICAgIGNhbmNlbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLl9vZmYoZXZlbnQsIGhhbmRsZXJJRCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIllvdSBzaG91bGRuJ3QgY2FsbCB0aGUgY2FuY2VsZXIgbW9yZSB0aGFuIG9uY2UhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5iaW5kKHRoaXMpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEhhbmRsZSBhbiBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7QW55fSBkZXRhaWwgZXZlbnQgZGV0YWlsXG4gICAgICogQHBhcmFtIHtBbnl9IHNvdXJjZSBldmVudCBzb3VyY2VcbiAgICAgKi9cbiAgICBlbWl0KGV2ZW50LCBkZXRhaWwsIHNvdXJjZSkge1xuICAgICAgICBjb25zdCBoYW5kbGVySURzID0gdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KTtcblxuICAgICAgICBpZiAoIWhhbmRsZXJJRHMpIHJldHVybjtcblxuICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJJRCBvZiBoYW5kbGVySURzKSB7XG4gICAgICAgICAgICBjb25zdCBoYW5kbGVyID0gdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLmdldChoYW5kbGVySUQpO1xuICAgICAgICAgICAgaGFuZGxlciAmJiBoYW5kbGVyKGRldGFpbCwgc291cmNlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZFxuICAgICAqXG4gICAgICogQWxsb2MgYSBoYW5kbGVyIElELlxuICAgICAqXG4gICAgICogQHJldHVybnMge051bWJlcn0gYW4gdW51c2VkIGhhbmRsZXIgSURcbiAgICAgKi9cbiAgICBfYWxsb2NIYW5kbGVySUQoKSB7XG4gICAgICAgIHdoaWxlICh0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuaGFzKHRoaXMuX2hhbmRsZXJJRCkpIHtcbiAgICAgICAgICAgIHRoaXMuX2hhbmRsZXJJRCA9ICh0aGlzLl9oYW5kbGVySUQgKyAxKSAlIE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVySUQ7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kXG4gICAgICpcbiAgICAgKiBSZW1vdmUgYW4gZXZlbnQgaGFuZGxlci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBoYW5kbGVySUQgaGFuZGxlciBJRFxuICAgICAqL1xuICAgIF9vZmYoZXZlbnQsIGhhbmRsZXJJRCkge1xuICAgICAgICBjb25zdCBoYW5kbGVySURzID0gdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuZ2V0KGV2ZW50KTtcbiAgICAgICAgaGFuZGxlcklEcyAmJiBoYW5kbGVySURzLmRlbGV0ZShoYW5kbGVySUQpO1xuICAgICAgICB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuZGVsZXRlKGhhbmRsZXJJRCk7XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBFdmVudE1hbmFnZXI7XG4iLCIvKipcbiAqIGEgbWFwIGZyb20gYWJicmV2aWF0aW9uIG9mIGxhbmd1YWdlcyB0aGF0IHN1cHBvcnRlZCBieSBicm93c2VycyB0byBhYmJyZXZpYXRpb24gb2YgdGhvc2Ugc3VwcG9ydGVkIGJ5IEVkZ2UgVHJhbnNsYXRlXG4gKi9cbmNvbnN0IEJST1dTRVJfTEFOR1VBR0VTX01BUCA9IHtcbiAgICBhY2g6IFwiYWNoXCIsXG4gICAgYWR5OiBcImVuXCIsXG4gICAgYWY6IFwiYWZcIixcbiAgICBcImFmLU5BXCI6IFwiYWZcIixcbiAgICBcImFmLVpBXCI6IFwiYWZcIixcbiAgICBhazogXCJha2FcIixcbiAgICBhbTogXCJhbVwiLFxuICAgIGFyOiBcImFyXCIsXG4gICAgXCJhci1BUlwiOiBcImFyXCIsXG4gICAgXCJhci1NQVwiOiBcImFyXCIsXG4gICAgXCJhci1TQVwiOiBcImFyXCIsXG4gICAgXCJheS1CT1wiOiBcImF5bVwiLFxuICAgIGF6OiBcImF6XCIsXG4gICAgXCJhei1BWlwiOiBcImF6XCIsXG4gICAgXCJiZS1CWVwiOiBcImJlXCIsXG4gICAgYmc6IFwiYmdcIixcbiAgICBcImJnLUJHXCI6IFwiYmdcIixcbiAgICBibjogXCJiblwiLFxuICAgIFwiYm4tSU5cIjogXCJiblwiLFxuICAgIFwiYm4tQkRcIjogXCJiblwiLFxuICAgIFwiYnMtQkFcIjogXCJic1wiLFxuICAgIGNhOiBcImNhXCIsXG4gICAgXCJjYS1FU1wiOiBcImNhXCIsXG4gICAgY2FrOiBcImVuXCIsXG4gICAgY2ViOiBcImNlYlwiLFxuICAgIFwiY2stVVNcIjogXCJjaHJcIixcbiAgICBjbzogXCJjb1wiLFxuICAgIGNzOiBcImNzXCIsXG4gICAgXCJjcy1DWlwiOiBcImNzXCIsXG4gICAgY3k6IFwiY3lcIixcbiAgICBcImN5LUdCXCI6IFwiY3lcIixcbiAgICBkYTogXCJkYVwiLFxuICAgIFwiZGEtREtcIjogXCJkYVwiLFxuICAgIGRlOiBcImRlXCIsXG4gICAgXCJkZS1BVFwiOiBcImRlXCIsXG4gICAgXCJkZS1ERVwiOiBcImRlXCIsXG4gICAgXCJkZS1DSFwiOiBcImRlXCIsXG4gICAgZHNiOiBcImVuXCIsXG4gICAgZWw6IFwiZWxcIixcbiAgICBcImVsLUdSXCI6IFwiZWxcIixcbiAgICBlbjogXCJlblwiLFxuICAgIFwiZW4tR0JcIjogXCJlblwiLFxuICAgIFwiZW4tQVVcIjogXCJlblwiLFxuICAgIFwiZW4tQ0FcIjogXCJlblwiLFxuICAgIFwiZW4tSUVcIjogXCJlblwiLFxuICAgIFwiZW4tSU5cIjogXCJlblwiLFxuICAgIFwiZW4tUElcIjogXCJlblwiLFxuICAgIFwiZW4tVURcIjogXCJlblwiLFxuICAgIFwiZW4tVVNcIjogXCJlblwiLFxuICAgIFwiZW4tWkFcIjogXCJlblwiLFxuICAgIFwiZW5AcGlyYXRlXCI6IFwiZW5cIixcbiAgICBlbzogXCJlb1wiLFxuICAgIFwiZW8tRU9cIjogXCJlb1wiLFxuICAgIGVzOiBcImVzXCIsXG4gICAgXCJlcy1BUlwiOiBcImVzXCIsXG4gICAgXCJlcy00MTlcIjogXCJlc1wiLFxuICAgIFwiZXMtQ0xcIjogXCJlc1wiLFxuICAgIFwiZXMtQ09cIjogXCJlc1wiLFxuICAgIFwiZXMtRUNcIjogXCJlc1wiLFxuICAgIFwiZXMtRVNcIjogXCJlc1wiLFxuICAgIFwiZXMtTEFcIjogXCJlc1wiLFxuICAgIFwiZXMtTklcIjogXCJlc1wiLFxuICAgIFwiZXMtTVhcIjogXCJlc1wiLFxuICAgIFwiZXMtVVNcIjogXCJlc1wiLFxuICAgIFwiZXMtVkVcIjogXCJlc1wiLFxuICAgIGV0OiBcImV0XCIsXG4gICAgXCJldC1FRVwiOiBcImV0XCIsXG4gICAgZXU6IFwiZXVcIixcbiAgICBcImV1LUVTXCI6IFwiZXVcIixcbiAgICBmYTogXCJmYVwiLFxuICAgIFwiZmEtSVJcIjogXCJmYVwiLFxuICAgIFwiZmItTFRcIjogXCJlblwiLFxuICAgIGZmOiBcImVuXCIsXG4gICAgZmk6IFwiZmlcIixcbiAgICBcImZpLUZJXCI6IFwiZmlcIixcbiAgICBcImZvLUZPXCI6IFwiZmFvXCIsXG4gICAgZnI6IFwiZnJcIixcbiAgICBcImZyLUNBXCI6IFwiZnJcIixcbiAgICBcImZyLUZSXCI6IFwiZnJcIixcbiAgICBcImZyLUJFXCI6IFwiZnJcIixcbiAgICBcImZyLUNIXCI6IFwiZnJcIixcbiAgICBcImZ5LU5MXCI6IFwiZnlcIixcbiAgICBnYTogXCJnYVwiLFxuICAgIFwiZ2EtSUVcIjogXCJnYVwiLFxuICAgIGdkOiBcImdkXCIsXG4gICAgZ2w6IFwiZ2xcIixcbiAgICBcImdsLUVTXCI6IFwiZ2xcIixcbiAgICBcImduLVBZXCI6IFwiZ3JuXCIsXG4gICAgXCJndS1JTlwiOiBcImd1XCIsXG4gICAgXCJneC1HUlwiOiBcImVsXCIsXG4gICAgaGE6IFwiaGFcIixcbiAgICBoYXc6IFwiaGF3XCIsXG4gICAgaGU6IFwiaGVcIixcbiAgICBcImhlLUlMXCI6IFwiaGVcIixcbiAgICBoaTogXCJoaVwiLFxuICAgIFwiaGktSU5cIjogXCJoaVwiLFxuICAgIGhtbjogXCJobW5cIixcbiAgICBocjogXCJoclwiLFxuICAgIFwiaHItSFJcIjogXCJoclwiLFxuICAgIGhzYjogXCJlblwiLFxuICAgIGh0OiBcImh0XCIsXG4gICAgaHU6IFwiaHVcIixcbiAgICBcImh1LUhVXCI6IFwiaHVcIixcbiAgICBcImh5LUFNXCI6IFwiaHlcIixcbiAgICBpZDogXCJpZFwiLFxuICAgIFwiaWQtSURcIjogXCJpZFwiLFxuICAgIGlnOiBcImlnXCIsXG4gICAgaXM6IFwiaXNcIixcbiAgICBcImlzLUlTXCI6IFwiaXNcIixcbiAgICBpdDogXCJpdFwiLFxuICAgIFwiaXQtSVRcIjogXCJpdFwiLFxuICAgIGl3OiBcImhlXCIsXG4gICAgamE6IFwiamFcIixcbiAgICBcImphLUpQXCI6IFwiamFcIixcbiAgICBcImp2LUlEXCI6IFwiandcIixcbiAgICBcImthLUdFXCI6IFwia2FcIixcbiAgICBcImtrLUtaXCI6IFwia2tcIixcbiAgICBrbTogXCJrbVwiLFxuICAgIFwia20tS0hcIjogXCJrbVwiLFxuICAgIGthYjogXCJrYWJcIixcbiAgICBrbjogXCJrblwiLFxuICAgIFwia24tSU5cIjogXCJrblwiLFxuICAgIGtvOiBcImtvXCIsXG4gICAgXCJrby1LUlwiOiBcImtvXCIsXG4gICAgXCJrdS1UUlwiOiBcImt1XCIsXG4gICAga3k6IFwia3lcIixcbiAgICBsYTogXCJsYVwiLFxuICAgIFwibGEtVkFcIjogXCJsYVwiLFxuICAgIGxiOiBcImxiXCIsXG4gICAgXCJsaS1OTFwiOiBcImxpbVwiLFxuICAgIGxvOiBcImxvXCIsXG4gICAgbHQ6IFwibHRcIixcbiAgICBcImx0LUxUXCI6IFwibHRcIixcbiAgICBsdjogXCJsdlwiLFxuICAgIFwibHYtTFZcIjogXCJsdlwiLFxuICAgIG1haTogXCJtYWlcIixcbiAgICBcIm1nLU1HXCI6IFwibWdcIixcbiAgICBtaTogXCJtaVwiLFxuICAgIG1rOiBcIm1rXCIsXG4gICAgXCJtay1NS1wiOiBcIm1rXCIsXG4gICAgbWw6IFwibWxcIixcbiAgICBcIm1sLUlOXCI6IFwibWxcIixcbiAgICBcIm1uLU1OXCI6IFwibW5cIixcbiAgICBtcjogXCJtclwiLFxuICAgIFwibXItSU5cIjogXCJtclwiLFxuICAgIG1zOiBcIm1zXCIsXG4gICAgXCJtcy1NWVwiOiBcIm1zXCIsXG4gICAgbXQ6IFwibXRcIixcbiAgICBcIm10LU1UXCI6IFwibXRcIixcbiAgICBteTogXCJteVwiLFxuICAgIG5vOiBcIm5vXCIsXG4gICAgbmI6IFwibm9cIixcbiAgICBcIm5iLU5PXCI6IFwibm9cIixcbiAgICBuZTogXCJuZVwiLFxuICAgIFwibmUtTlBcIjogXCJuZVwiLFxuICAgIG5sOiBcIm5sXCIsXG4gICAgXCJubC1CRVwiOiBcIm5sXCIsXG4gICAgXCJubC1OTFwiOiBcIm5sXCIsXG4gICAgXCJubi1OT1wiOiBcIm5vXCIsXG4gICAgbnk6IFwibnlcIixcbiAgICBvYzogXCJvY2lcIixcbiAgICBcIm9yLUlOXCI6IFwib3JcIixcbiAgICBwYTogXCJwYVwiLFxuICAgIFwicGEtSU5cIjogXCJwYVwiLFxuICAgIHBsOiBcInBsXCIsXG4gICAgXCJwbC1QTFwiOiBcInBsXCIsXG4gICAgXCJwcy1BRlwiOiBcInBzXCIsXG4gICAgcHQ6IFwicHRcIixcbiAgICBcInB0LUJSXCI6IFwicHRcIixcbiAgICBcInB0LVBUXCI6IFwicHRcIixcbiAgICBcInF1LVBFXCI6IFwicXVlXCIsXG4gICAgXCJybS1DSFwiOiBcInJvaFwiLFxuICAgIHJvOiBcInJvXCIsXG4gICAgXCJyby1ST1wiOiBcInJvXCIsXG4gICAgcnU6IFwicnVcIixcbiAgICBcInJ1LVJVXCI6IFwicnVcIixcbiAgICBcInNhLUlOXCI6IFwic2FuXCIsXG4gICAgc2Q6IFwic2RcIixcbiAgICBcInNlLU5PXCI6IFwic21lXCIsXG4gICAgXCJzaS1MS1wiOiBcInNpXCIsXG4gICAgc2s6IFwic2tcIixcbiAgICBcInNrLVNLXCI6IFwic2tcIixcbiAgICBzbDogXCJzbFwiLFxuICAgIFwic2wtU0lcIjogXCJzbFwiLFxuICAgIHNtOiBcInNtXCIsXG4gICAgc246IFwic25cIixcbiAgICBcInNvLVNPXCI6IFwic29cIixcbiAgICBzcTogXCJzcVwiLFxuICAgIFwic3EtQUxcIjogXCJzcVwiLFxuICAgIHNyOiBcInNyXCIsXG4gICAgXCJzci1SU1wiOiBcInNyXCIsXG4gICAgc3Q6IFwic3RcIixcbiAgICBzdTogXCJzdVwiLFxuICAgIHN2OiBcInN2XCIsXG4gICAgXCJzdi1TRVwiOiBcInN2XCIsXG4gICAgc3c6IFwic3dcIixcbiAgICBcInN3LUtFXCI6IFwic3dcIixcbiAgICB0YTogXCJ0YVwiLFxuICAgIFwidGEtSU5cIjogXCJ0YVwiLFxuICAgIHRlOiBcInRlXCIsXG4gICAgXCJ0ZS1JTlwiOiBcInRlXCIsXG4gICAgdGc6IFwidGdcIixcbiAgICBcInRnLVRKXCI6IFwidGdcIixcbiAgICB0aDogXCJ0aFwiLFxuICAgIFwidGgtVEhcIjogXCJ0aFwiLFxuICAgIHRsOiBcImZpbFwiLFxuICAgIFwidGwtUEhcIjogXCJmaWxcIixcbiAgICB0bGg6IFwidGxoXCIsXG4gICAgdHI6IFwidHJcIixcbiAgICBcInRyLVRSXCI6IFwidHJcIixcbiAgICBcInR0LVJVXCI6IFwidGF0XCIsXG4gICAgdWs6IFwidWtcIixcbiAgICBcInVrLVVBXCI6IFwidWtcIixcbiAgICB1cjogXCJ1clwiLFxuICAgIFwidXItUEtcIjogXCJ1clwiLFxuICAgIHV6OiBcInV6XCIsXG4gICAgXCJ1ei1VWlwiOiBcInV6XCIsXG4gICAgdmk6IFwidmlcIixcbiAgICBcInZpLVZOXCI6IFwidmlcIixcbiAgICBcInhoLVpBXCI6IFwieGhcIixcbiAgICB5aTogXCJ5aVwiLFxuICAgIFwieWktREVcIjogXCJ5aVwiLFxuICAgIHlvOiBcInlvXCIsXG4gICAgemg6IFwiemgtQ05cIixcbiAgICBcInpoLUhhbnNcIjogXCJ6aC1DTlwiLFxuICAgIFwiemgtSGFudFwiOiBcInpoLVRXXCIsXG4gICAgXCJ6aC1DTlwiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1IS1wiOiBcInpoLVRXXCIsXG4gICAgXCJ6aC1TR1wiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1UV1wiOiBcInpoLVRXXCIsXG4gICAgXCJ6dS1aQVwiOiBcInp1XCIsXG59O1xuXG4vKipcbiAqIEV4cG9ydCBsYW5ndWFnZXMgYW5kIGJyb3dzZXIgbGFuZ3VhZ2VzIG1hcC5cbiAqL1xuZXhwb3J0IHsgQlJPV1NFUl9MQU5HVUFHRVNfTUFQIH07XG4iLCJleHBvcnQge1xuICAgIGxvZ0luZm8sXG4gICAgbG9nV2FybixcbiAgICBsb2dFcnJvcixcbiAgICBzaG91bGRGaWx0ZXJFcnJvcixcbiAgICB3cmFwQ29uc29sZUZvckZpbHRlcmluZyxcbiAgICBzZXRMb2dMZXZlbCxcbiAgICBnZXRMb2dMZXZlbCxcbn07XG5cbi8vIEtub3duIG5vaXN5IGVycm9yIHBhdHRlcm5zIHRvIHN1cHByZXNzIGluIGxvZ3NcbmNvbnN0IEZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TID0gW1xuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkXCIsXG4gICAgXCJVbmFibGUgdG8gZG93bmxvYWQgYWxsIHNwZWNpZmllZCBpbWFnZXNcIixcbiAgICBcIkNhbm5vdCBhY2Nlc3NcIixcbiAgICBcImJlZm9yZSBpbml0aWFsaXphdGlvblwiLFxuICAgIFwiRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWRcIixcbiAgICBcIkNhbnZhcyBlcnJvclwiLFxuICAgIFwiTmV0d29yayBlcnJvclwiLFxuXTtcblxuZnVuY3Rpb24gam9pbk1lc3NhZ2UoYXJncykge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhcmdzXG4gICAgICAgICAgICAubWFwKCh2KSA9PiAodHlwZW9mIHYgPT09IFwic3RyaW5nXCIgPyB2IDogKHYgJiYgdi5tZXNzYWdlKSB8fCBKU09OLnN0cmluZ2lmeSh2KSkpXG4gICAgICAgICAgICAuam9pbihcIiBcIik7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICByZXR1cm4gYXJncy5qb2luKFwiIFwiKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpIHtcbiAgICBpZiAoIW1lc3NhZ2UpIHJldHVybiBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgRklMVEVSRURfRVJST1JfUEFUVEVSTlMuc29tZSgocGF0dGVybikgPT4gbWVzc2FnZS5pbmNsdWRlcyhwYXR0ZXJuKSkgfHxcbiAgICAgICAgICAgIC9DYW5ub3QgYWNjZXNzICcuKicgYmVmb3JlIGluaXRpYWxpemF0aW9uLy50ZXN0KG1lc3NhZ2UpIHx8XG4gICAgICAgICAgICAvUmVmZXJlbmNlRXJyb3IuKmJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAgICAgL1VuYWJsZSB0byBkb3dubG9hZC4qaW1hZ2VzLy50ZXN0KG1lc3NhZ2UpXG4gICAgICAgICk7XG4gICAgfSBjYXRjaCAoXykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBMb2cgbGV2ZWw6ICdkZWJ1ZycgfCAnaW5mbycgfCAnd2FybicgfCAnZXJyb3InIHwgJ3NpbGVudCdcbmNvbnN0IExFVkVMX09SREVSID0geyBkZWJ1ZzogMTAsIGluZm86IDIwLCB3YXJuOiAzMCwgZXJyb3I6IDQwLCBzaWxlbnQ6IDkwIH07XG5sZXQgY3VycmVudExldmVsID1cbiAgICB0eXBlb2YgQlVJTERfRU5WICE9PSBcInVuZGVmaW5lZFwiICYmIEJVSUxEX0VOViA9PT0gXCJkZXZlbG9wbWVudFwiID8gXCJkZWJ1Z1wiIDogXCJ3YXJuXCI7XG5cbmZ1bmN0aW9uIHNldExvZ0xldmVsKGxldmVsKSB7XG4gICAgaWYgKExFVkVMX09SREVSW2xldmVsXSAhPSBudWxsKSBjdXJyZW50TGV2ZWwgPSBsZXZlbDtcbn1cblxuZnVuY3Rpb24gZ2V0TG9nTGV2ZWwoKSB7XG4gICAgcmV0dXJuIGN1cnJlbnRMZXZlbDtcbn1cblxuZnVuY3Rpb24gc2hvdWxkRW1pdChsZXZlbCkge1xuICAgIHJldHVybiBMRVZFTF9PUkRFUltsZXZlbF0gPj0gTEVWRUxfT1JERVJbY3VycmVudExldmVsXTtcbn1cblxuZnVuY3Rpb24gbG9nSW5mbyguLi5hcmdzKSB7XG4gICAgaWYgKCFzaG91bGRFbWl0KFwiaW5mb1wiKSkgcmV0dXJuO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5sb2coXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbmZ1bmN0aW9uIGxvZ1dhcm4oLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcIndhcm5cIikpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUud2FybihcIltFZGdlVHJhbnNsYXRlXVwiLCAuLi5hcmdzKTtcbn1cblxuZnVuY3Rpb24gbG9nRXJyb3IoLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcImVycm9yXCIpKSByZXR1cm47XG4gICAgY29uc3QgbWVzc2FnZSA9IGpvaW5NZXNzYWdlKGFyZ3MpO1xuICAgIGlmIChzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSkgcmV0dXJuO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvcihcIltFZGdlVHJhbnNsYXRlXVwiLCAuLi5hcmdzKTtcbn1cblxuLy8gT3B0aW9uYWw6IGdsb2JhbGx5IHdyYXAgY29uc29sZS5lcnJvciB0byBzdXBwcmVzcyBub2lzeSBlcnJvcnNcbmZ1bmN0aW9uIHdyYXBDb25zb2xlRm9yRmlsdGVyaW5nKCkge1xuICAgIGNvbnN0IG9yaWdpbmFsQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gam9pbk1lc3NhZ2UoYXJncyk7XG4gICAgICAgIGlmICghc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkpIHtcbiAgICAgICAgICAgIG9yaWdpbmFsQ29uc29sZUVycm9yLmFwcGx5KGNvbnNvbGUsIGFyZ3MpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbiIsImltcG9ydCB7IEJST1dTRVJfTEFOR1VBR0VTX01BUCB9IGZyb20gXCJjb21tb24vc2NyaXB0cy9sYW5ndWFnZXMuanNcIjtcblxuLyoqXG4gKiBkZWZhdWx0IHNldHRpbmdzIGZvciB0aGlzIGV4dGVuc2lvblxuICovXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTID0ge1xuICAgIGJsYWNrbGlzdDoge1xuICAgICAgICB1cmxzOiB7fSxcbiAgICAgICAgZG9tYWluczogeyBcImNocm9tZS5nb29nbGUuY29tXCI6IHRydWUsIGV4dGVuc2lvbnM6IHRydWUgfSxcbiAgICB9LFxuICAgIC8vIFJlc2l6ZTogZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHdlYiBwYWdlIHdpbGwgcmVzaXplIHdoZW4gc2hvd2luZyB0cmFuc2xhdGlvbiByZXN1bHRcbiAgICAvLyBSVEw6IGRldGVybWluZSB3aGV0aGVyIHRoZSB0ZXh0IGluIHRyYW5zbGF0aW9uIGJsb2NrIHNob3VsZCBkaXNwbGF5IGZyb20gcmlnaHQgdG8gbGVmdFxuICAgIC8vIEZvbGRMb25nQ29udGVudDogZGV0ZXJtaW5lIHdoZXRoZXIgdG8gZm9sZCBsb25nIHRyYW5zbGF0aW9uIGNvbnRlbnRcbiAgICAvLyBTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbjogdGhlIHBvc2l0aW9uIG9mIHNlbGVjdCB0cmFuc2xhdGUgYnV0dG9uLlxuICAgIExheW91dFNldHRpbmdzOiB7XG4gICAgICAgIFJlc2l6ZTogZmFsc2UsXG4gICAgICAgIFJUTDogZmFsc2UsXG4gICAgICAgIEZvbGRMb25nQ29udGVudDogdHJ1ZSxcbiAgICAgICAgU2VsZWN0VHJhbnNsYXRlUG9zaXRpb246IFwiVG9wUmlnaHRcIixcbiAgICB9LFxuICAgIC8vIERlZmF1bHQgc2V0dGluZ3Mgb2Ygc291cmNlIGxhbmd1YWdlIGFuZCB0YXJnZXQgbGFuZ3VhZ2VcbiAgICBsYW5ndWFnZVNldHRpbmc6IHsgc2w6IFwiYXV0b1wiLCB0bDogQlJPV1NFUl9MQU5HVUFHRVNfTUFQW2Nocm9tZS5pMThuLmdldFVJTGFuZ3VhZ2UoKV0gfSxcbiAgICBPdGhlclNldHRpbmdzOiB7XG4gICAgICAgIE11dHVhbFRyYW5zbGF0ZTogZmFsc2UsXG4gICAgICAgIFNlbGVjdFRyYW5zbGF0ZTogdHJ1ZSxcbiAgICAgICAgVHJhbnNsYXRlQWZ0ZXJEYmxDbGljazogZmFsc2UsXG4gICAgICAgIFRyYW5zbGF0ZUFmdGVyU2VsZWN0OiBmYWxzZSxcbiAgICAgICAgQ2FuY2VsVGV4dFNlbGVjdGlvbjogZmFsc2UsXG4gICAgICAgIFVzZUdvb2dsZUFuYWx5dGljczogdHJ1ZSxcbiAgICB9LFxuICAgIERlZmF1bHRUcmFuc2xhdG9yOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgIERlZmF1bHRQYWdlVHJhbnNsYXRvcjogXCJHb29nbGVQYWdlVHJhbnNsYXRlXCIsXG4gICAgSHlicmlkVHJhbnNsYXRvckNvbmZpZzoge1xuICAgICAgICAvLyBUaGUgdHJhbnNsYXRvcnMgdXNlZCBpbiBjdXJyZW50IGh5YnJpZCB0cmFuc2xhdGUuXG4gICAgICAgIHRyYW5zbGF0b3JzOiBbXCJCaW5nVHJhbnNsYXRlXCIsIFwiR29vZ2xlVHJhbnNsYXRlXCJdLFxuXG4gICAgICAgIC8vIFRoZSB0cmFuc2xhdG9ycyBmb3IgZWFjaCBpdGVtLlxuICAgICAgICBzZWxlY3Rpb25zOiB7XG4gICAgICAgICAgICAvLyBBVFRFTlRJT046IFRoZSBmb2xsb3dpbmcgZm91ciBpdGVtcyBNVVNUIEhBVkUgVEhFIFNBTUUgVFJBTlNMQVRPUiFcbiAgICAgICAgICAgIG9yaWdpbmFsVGV4dDogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIG1haW5NZWFuaW5nOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgdFByb251bmNpYXRpb246IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBzUHJvbnVuY2lhdGlvbjogXCJHb29nbGVUcmFuc2xhdGVcIixcblxuICAgICAgICAgICAgLy8gRm9yIHRoZSBmb2xsb3dpbmcgdGhyZWUgaXRlbXMsIGFueSB0cmFuc2xhdG9yIGNvbWJpbmF0aW9uIGlzIE9LLlxuICAgICAgICAgICAgZGV0YWlsZWRNZWFuaW5nczogXCJCaW5nVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBkZWZpbml0aW9uczogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIGV4YW1wbGVzOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgLy8gRGVmaW5lcyB3aGljaCBjb250ZW50cyBpbiB0aGUgdHJhbnNsYXRpbmcgcmVzdWx0IHNob3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgVHJhbnNsYXRlUmVzdWx0RmlsdGVyOiB7XG4gICAgICAgIG1haW5NZWFuaW5nOiB0cnVlLFxuICAgICAgICBvcmlnaW5hbFRleHQ6IHRydWUsXG4gICAgICAgIHRQcm9udW5jaWF0aW9uOiB0cnVlLFxuICAgICAgICBzUHJvbnVuY2lhdGlvbjogdHJ1ZSxcbiAgICAgICAgdFByb251bmNpYXRpb25JY29uOiB0cnVlLFxuICAgICAgICBzUHJvbnVuY2lhdGlvbkljb246IHRydWUsXG4gICAgICAgIGRldGFpbGVkTWVhbmluZ3M6IHRydWUsXG4gICAgICAgIGRlZmluaXRpb25zOiB0cnVlLFxuICAgICAgICBleGFtcGxlczogdHJ1ZSxcbiAgICB9LFxuICAgIC8vIERlZmluZXMgdGhlIG9yZGVyIG9mIGRpc3BsYXlpbmcgY29udGVudHMuXG4gICAgQ29udGVudERpc3BsYXlPcmRlcjogW1xuICAgICAgICBcIm1haW5NZWFuaW5nXCIsXG4gICAgICAgIFwib3JpZ2luYWxUZXh0XCIsXG4gICAgICAgIFwiZGV0YWlsZWRNZWFuaW5nc1wiLFxuICAgICAgICBcImRlZmluaXRpb25zXCIsXG4gICAgICAgIFwiZXhhbXBsZXNcIixcbiAgICBdLFxuICAgIEhpZGVQYWdlVHJhbnNsYXRvckJhbm5lcjogZmFsc2UsXG59O1xuXG4vKipcbiAqIGFzc2lnbiBkZWZhdWx0IHZhbHVlIHRvIHNldHRpbmdzIHdoaWNoIGFyZSB1bmRlZmluZWQgaW4gcmVjdXJzaXZlIHdheVxuICogQHBhcmFtIHsqfSByZXN1bHQgc2V0dGluZyByZXN1bHQgc3RvcmVkIGluIGNocm9tZS5zdG9yYWdlXG4gKiBAcGFyYW0geyp9IHNldHRpbmdzIGRlZmF1bHQgc2V0dGluZ3NcbiAqL1xuZnVuY3Rpb24gc2V0RGVmYXVsdFNldHRpbmdzKHJlc3VsdCwgc2V0dGluZ3MpIHtcbiAgICBmb3IgKGxldCBpIGluIHNldHRpbmdzKSB7XG4gICAgICAgIC8vIHNldHRpbmdzW2ldIGNvbnRhaW5zIGtleS12YWx1ZSBzZXR0aW5nc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygc2V0dGluZ3NbaV0gPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgICAgICEoc2V0dGluZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSkgJiZcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNldHRpbmdzW2ldKS5sZW5ndGggPiAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdFtpXSkge1xuICAgICAgICAgICAgICAgIHNldERlZmF1bHRTZXR0aW5ncyhyZXN1bHRbaV0sIHNldHRpbmdzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0dGluZ3NbaV0gY29udGFpbnMgc2V2ZXJhbCBzZXR0aW5nIGl0ZW1zIGJ1dCB0aGVzZSBoYXZlIG5vdCBiZWVuIHNldCBiZWZvcmVcbiAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSBzZXR0aW5nc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHRbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gc2V0dGluZ3NbaV0gaXMgYSBzaW5nbGUgc2V0dGluZyBpdGVtIGFuZCBpdCBoYXMgbm90IGJlZW4gc2V0IGJlZm9yZVxuICAgICAgICAgICAgcmVzdWx0W2ldID0gc2V0dGluZ3NbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogR2V0IHNldHRpbmdzIGZyb20gc3RvcmFnZS4gSWYgc29tZSBvZiB0aGUgc2V0dGluZ3MgaGF2ZSBub3QgYmVlbiBpbml0aWFsaXplZCxcbiAqIGluaXRpYWxpemUgdGhlbSB3aXRoIHRoZSBnaXZlbiBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZyB8IEFycmF5PFN0cmluZz59IHNldHRpbmdzIHNldHRpbmcgbmFtZSB0byBnZXRcbiAqIEBwYXJhbSB7T2JqZWN0IHwgRnVuY3Rpb259IGRlZmF1bHRzIGRlZmF1bHQgdmFsdWVzIG9yIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGRlZmF1bHQgdmFsdWVzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxBbnk+fSBzZXR0aW5nc1xuICovXG5mdW5jdGlvbiBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhzZXR0aW5ncywgZGVmYXVsdHMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgc2V0dGluZyB0byBnZXQsIHdhcnAgaXQgdXAuXG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHNldHRpbmdzID0gW3NldHRpbmdzXTtcbiAgICAgICAgfSBlbHNlIGlmIChzZXR0aW5ncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiBzZXR0aW5ncyBpcyB1bmRlZmluZWQsIGNvbGxlY3QgYWxsIHNldHRpbmcga2V5cyBpbiBkZWZhdWx0cy5cbiAgICAgICAgICAgIHNldHRpbmdzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChzZXR0aW5ncywgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yIChsZXQgc2V0dGluZyBvZiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0W3NldHRpbmddKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdHMgPSBkZWZhdWx0cyhzZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3NldHRpbmddID0gZGVmYXVsdHNbc2V0dGluZ107XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChyZXN1bHQsICgpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIHNldERlZmF1bHRTZXR0aW5ncywgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MgfTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IENoYW5uZWwgZnJvbSBcImNvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIjtcbmltcG9ydCB7IGkxOG5IVE1MIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL2NvbW1vbi5qc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanNcIjtcblxuLyoqXG4gKiBDb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKi9cbmNvbnN0IGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgpO1xuXG4vKipcbiAqIOWIneWni+WMluiuvue9ruWIl+ihqFxuICovXG53aW5kb3cub25sb2FkID0gKCkgPT4ge1xuICAgIGkxOG5IVE1MKCk7XG5cbiAgICAvLyDorr7nva7kuI3lkIzor63oqIDnmoTpmpDnp4HmlL/nrZbpk77mjqVcbiAgICBsZXQgUHJpdmFjeVBvbGljeUxpbmsgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIlByaXZhY3lQb2xpY3lMaW5rXCIpO1xuICAgIFByaXZhY3lQb2xpY3lMaW5rLnNldEF0dHJpYnV0ZShcImhyZWZcIiwgY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShcIlByaXZhY3lQb2xpY3lMaW5rXCIpKTtcblxuICAgIC8qKlxuICAgICAqIFNldCB1cCBoeWJyaWQgdHJhbnNsYXRlIGNvbmZpZy5cbiAgICAgKi9cbiAgICBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhbXCJsYW5ndWFnZVNldHRpbmdcIiwgXCJIeWJyaWRUcmFuc2xhdG9yQ29uZmlnXCJdLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKFxuICAgICAgICBhc3luYyAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgY29uZmlnID0gcmVzdWx0Lkh5YnJpZFRyYW5zbGF0b3JDb25maWc7XG4gICAgICAgICAgICBsZXQgbGFuZ3VhZ2VTZXR0aW5nID0gcmVzdWx0Lmxhbmd1YWdlU2V0dGluZztcbiAgICAgICAgICAgIGxldCBhdmFpbGFibGVUcmFuc2xhdG9ycyA9IGF3YWl0IGNoYW5uZWwucmVxdWVzdChcImdldF9hdmFpbGFibGVfdHJhbnNsYXRvcnNcIiwge1xuICAgICAgICAgICAgICAgIGZyb206IGxhbmd1YWdlU2V0dGluZy5zbCxcbiAgICAgICAgICAgICAgICB0bzogbGFuZ3VhZ2VTZXR0aW5nLnRsLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXRVcFRyYW5zbGF0ZUNvbmZpZyhcbiAgICAgICAgICAgICAgICBjb25maWcsXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBoeWJyaWQgdHJhbnNsYXRvciBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBhdmFpbGFibGVUcmFuc2xhdG9ycyBhcnJheS5cbiAgICAgICAgICAgICAgICBhdmFpbGFibGVUcmFuc2xhdG9ycy5zbGljZSgxKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICk7XG5cbiAgICAvKipcbiAgICAgKiBVcGRhdGUgdHJhbnNsYXRvciBjb25maWcgb3B0aW9ucyBvbiB0cmFuc2xhdG9yIGNvbmZpZyB1cGRhdGUuXG4gICAgICovXG4gICAgY2hhbm5lbC5vbihcImh5YnJpZF90cmFuc2xhdG9yX2NvbmZpZ191cGRhdGVkXCIsIChkZXRhaWwpID0+XG4gICAgICAgIHNldFVwVHJhbnNsYXRlQ29uZmlnKGRldGFpbC5jb25maWcsIGRldGFpbC5hdmFpbGFibGVUcmFuc2xhdG9ycylcbiAgICApO1xuXG4gICAgLyoqXG4gICAgICogaW5pdGlhdGUgYW5kIHVwZGF0ZSBzZXR0aW5nc1xuICAgICAqIGF0dHJpYnV0ZSBcInNldHRpbmctdHlwZVwiOiBpbmRpY2F0ZSB0aGUgc2V0dGluZyB0eXBlIG9mIG9uZSBvcHRpb25cbiAgICAgKiBhdHRyaWJ1dGUgXCJzZXR0aW5nLXBhdGhcIjogaW5kaWNhdGUgdGhlIG5lc3RlZCBzZXR0aW5nIHBhdGguIHVzZWQgdG8gbG9jYXRlIHRoZSBwYXRoIG9mIG9uZSBzZXR0aW5nIGl0ZW0gaW4gY2hyb21lIHN0b3JhZ2VcbiAgICAgKi9cbiAgICBnZXRPclNldERlZmF1bHRTZXR0aW5ncyh1bmRlZmluZWQsIERFRkFVTFRfU0VUVElOR1MpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICBsZXQgaW5wdXRFbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaW5wdXRcIik7XG4gICAgICAgIGNvbnN0IHNlbGVjdFRyYW5zbGF0ZVBvc2l0aW9uRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwic2VsZWN0LXRyYW5zbGF0ZS1wb3NpdGlvblwiKTtcbiAgICAgICAgZm9yIChsZXQgZWxlbWVudCBvZiBbLi4uaW5wdXRFbGVtZW50cywgc2VsZWN0VHJhbnNsYXRlUG9zaXRpb25FbGVtZW50XSkge1xuICAgICAgICAgICAgbGV0IHNldHRpbmdJdGVtUGF0aCA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwic2V0dGluZy1wYXRoXCIpLnNwbGl0KC9cXHMvZyk7XG4gICAgICAgICAgICBsZXQgc2V0dGluZ0l0ZW1WYWx1ZSA9IGdldFNldHRpbmcocmVzdWx0LCBzZXR0aW5nSXRlbVBhdGgpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwic2V0dGluZy10eXBlXCIpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcImNoZWNrYm94XCI6XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY2hlY2tlZCA9IHNldHRpbmdJdGVtVmFsdWUuaW5kZXhPZihlbGVtZW50LnZhbHVlKSAhPT0gLTE7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBzZXR0aW5nIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdJdGVtUGF0aCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJzZXR0aW5nLXBhdGhcIikuc3BsaXQoL1xccy9nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdJdGVtVmFsdWUgPSBnZXRTZXR0aW5nKHJlc3VsdCwgc2V0dGluZ0l0ZW1QYXRoKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgdXNlciBjaGVja2VkIHRoaXMgb3B0aW9uLCBhZGQgdmFsdWUgdG8gc2V0dGluZyBhcnJheVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jaGVja2VkKSBzZXR0aW5nSXRlbVZhbHVlLnB1c2godGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIHVzZXIgdW5jaGVja2VkIHRoaXMgb3B0aW9uLCBkZWxldGUgdmFsdWUgZnJvbSBzZXR0aW5nIGFycmF5XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHNldHRpbmdJdGVtVmFsdWUuc3BsaWNlKHNldHRpbmdJdGVtVmFsdWUuaW5kZXhPZih0YXJnZXQudmFsdWUpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVPcHRpb24ocmVzdWx0LCBzZXR0aW5nSXRlbVBhdGgsIHNldHRpbmdJdGVtVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwicmFkaW9cIjpcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jaGVja2VkID0gc2V0dGluZ0l0ZW1WYWx1ZSA9PT0gZWxlbWVudC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdXBkYXRlIHNldHRpbmcgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5vbmNoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2V0dGluZ0l0ZW1QYXRoID0gdGFyZ2V0LmdldEF0dHJpYnV0ZShcInNldHRpbmctcGF0aFwiKS5zcGxpdCgvXFxzL2cpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZU9wdGlvbihyZXN1bHQsIHNldHRpbmdJdGVtUGF0aCwgdGFyZ2V0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcInN3aXRjaFwiOlxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNoZWNrZWQgPSBzZXR0aW5nSXRlbVZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAvLyB1cGRhdGUgc2V0dGluZyB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm9uY2hhbmdlID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBzZXR0aW5nSXRlbVBhdGggPSBldmVudC50YXJnZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZ2V0QXR0cmlidXRlKFwic2V0dGluZy1wYXRoXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnNwbGl0KC9cXHMvZyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlT3B0aW9uKHJlc3VsdCwgc2V0dGluZ0l0ZW1QYXRoLCBldmVudC50YXJnZXQuY2hlY2tlZCk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJzZWxlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC52YWx1ZSA9IHNldHRpbmdJdGVtVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBzZXR0aW5nIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQub25jaGFuZ2UgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRhcmdldCA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHNldHRpbmdJdGVtUGF0aCA9IHRhcmdldC5nZXRBdHRyaWJ1dGUoXCJzZXR0aW5nLXBhdGhcIikuc3BsaXQoL1xccy9nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVPcHRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldHRpbmdJdGVtUGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXQub3B0aW9uc1t0YXJnZXQuc2VsZWN0ZWRJbmRleF0udmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIFNldCB1cCBoeWJyaWQgdHJhbnNsYXRlIGNvbmZpZy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIHRyYW5zbGF0b3IgY29uZmlnXG4gKiBAcGFyYW0ge0FycmF5PFN0cmluZz59IGF2YWlsYWJsZVRyYW5zbGF0b3JzIGF2YWlsYWJsZSB0cmFuc2xhdG9ycyBmb3IgY3VycmVudCBsYW5ndWFnZSBzZXR0aW5nXG4gKlxuICogQHJldHVybnMge3ZvaWR9IG5vdGhpbmdcbiAqL1xuZnVuY3Rpb24gc2V0VXBUcmFuc2xhdGVDb25maWcoY29uZmlnLCBhdmFpbGFibGVUcmFuc2xhdG9ycykge1xuICAgIGxldCB0cmFuc2xhdG9yQ29uZmlnRWxlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJ0cmFuc2xhdG9yLWNvbmZpZ1wiKTtcblxuICAgIGZvciAobGV0IGVsZSBvZiB0cmFuc2xhdG9yQ29uZmlnRWxlcykge1xuICAgICAgICAvLyBSZW1vdmUgZXhpc3RlZCBvcHRpb25zLlxuICAgICAgICBmb3IgKGxldCBpID0gZWxlLm9wdGlvbnMubGVuZ3RoOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICBlbGUub3B0aW9ucy5yZW1vdmUoaSAtIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGF0YS1hZmZlY3RlZCBpbmRpY2F0ZXMgaXRlbXMgYWZmZWN0ZWQgYnkgdGhpcyBlbGVtZW50IGluIGNvbmZpZy5zZWxlY3Rpb25zLCB0aGV5IGFsd2F5cyBoYXZlIHRoZSBzYW1lIHZhbHVlLlxuICAgICAgICBsZXQgYWZmZWN0ZWQgPSBlbGUuZ2V0QXR0cmlidXRlKFwiZGF0YS1hZmZlY3RlZFwiKS5zcGxpdCgvXFxzL2cpO1xuICAgICAgICBsZXQgc2VsZWN0ZWQgPSBjb25maWcuc2VsZWN0aW9uc1thZmZlY3RlZFswXV07XG4gICAgICAgIGZvciAobGV0IHRyYW5zbGF0b3Igb2YgYXZhaWxhYmxlVHJhbnNsYXRvcnMpIHtcbiAgICAgICAgICAgIGlmICh0cmFuc2xhdG9yID09PSBzZWxlY3RlZCkge1xuICAgICAgICAgICAgICAgIGVsZS5vcHRpb25zLmFkZChcbiAgICAgICAgICAgICAgICAgICAgbmV3IE9wdGlvbihjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKHRyYW5zbGF0b3IpLCB0cmFuc2xhdG9yLCB0cnVlLCB0cnVlKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZS5vcHRpb25zLmFkZChuZXcgT3B0aW9uKGNocm9tZS5pMThuLmdldE1lc3NhZ2UodHJhbnNsYXRvciksIHRyYW5zbGF0b3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGVsZS5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IGVsZS5vcHRpb25zW2VsZS5zZWxlY3RlZEluZGV4XS52YWx1ZTtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSBldmVyeSBhZmZlY3RlZCBpdGVtLlxuICAgICAgICAgICAgZm9yIChsZXQgaXRlbSBvZiBhZmZlY3RlZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5zZWxlY3Rpb25zW2l0ZW1dID0gdmFsdWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEdldCB0aGUgbmV3IHNlbGVjdGVkIHRyYW5zbGF0b3Igc2V0LlxuICAgICAgICAgICAgbGV0IHRyYW5zbGF0b3JzID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgY29uZmlnLnRyYW5zbGF0b3JzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBpdGVtIGluIGNvbmZpZy5zZWxlY3Rpb25zKSB7XG4gICAgICAgICAgICAgICAgbGV0IHRyYW5zbGF0b3IgPSBjb25maWcuc2VsZWN0aW9uc1tpdGVtXTtcbiAgICAgICAgICAgICAgICBpZiAoIXRyYW5zbGF0b3JzLmhhcyh0cmFuc2xhdG9yKSkge1xuICAgICAgICAgICAgICAgICAgICBjb25maWcudHJhbnNsYXRvcnMucHVzaCh0cmFuc2xhdG9yKTtcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRvcnMuYWRkKHRyYW5zbGF0b3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQoeyBIeWJyaWRUcmFuc2xhdG9yQ29uZmlnOiBjb25maWcgfSk7XG4gICAgICAgIH07XG4gICAgfVxufVxuXG4vKipcbiAqXG4gKiBnZXQgc2V0dGluZyB2YWx1ZSBhY2NvcmRpbmcgdG8gcGF0aCBvZiBzZXR0aW5nIGl0ZW1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbG9jYWxTZXR0aW5ncyBzZXR0aW5nIG9iamVjdCBzdG9yZWQgaW4gbG9jYWxcbiAqIEBwYXJhbSB7QXJyYXl9IHNldHRpbmdJdGVtUGF0aCBwYXRoIG9mIHRoZSBzZXR0aW5nIGl0ZW1cbiAqIEByZXR1cm5zIHsqfSBzZXR0aW5nIHZhbHVlXG4gKi9cbmZ1bmN0aW9uIGdldFNldHRpbmcobG9jYWxTZXR0aW5ncywgc2V0dGluZ0l0ZW1QYXRoKSB7XG4gICAgbGV0IHJlc3VsdCA9IGxvY2FsU2V0dGluZ3M7XG4gICAgc2V0dGluZ0l0ZW1QYXRoLmZvckVhY2goKGtleSkgPT4ge1xuICAgICAgICByZXN1bHQgPSByZXN1bHRba2V5XTtcbiAgICB9KTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIOS/neWtmOS4gOadoeiuvue9rumhuVxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBsb2NhbFNldHRpbmdzICDmnKzlnLDlrZjlgqjnmoTorr7nva7poblcbiAqIEBwYXJhbSB7QXJyYXl9IHNldHRpbmdJdGVtUGF0aCDorr7nva7pobnnmoTlsYLnuqfot6/lvoRcbiAqIEBwYXJhbSB7Kn0gdmFsdWUg6K6+572u6aG555qE5YC8XG4gKi9cbmZ1bmN0aW9uIHNhdmVPcHRpb24obG9jYWxTZXR0aW5ncywgc2V0dGluZ0l0ZW1QYXRoLCB2YWx1ZSkge1xuICAgIC8vIHVwZGF0ZSBsb2NhbCBzZXR0aW5nc1xuICAgIGxldCBwb2ludGVyID0gbG9jYWxTZXR0aW5nczsgLy8gcG9pbnQgdG8gY2hpbGRyZW4gb2YgbG9jYWwgc2V0dGluZyBvciBpdHNlbGZcblxuICAgIC8vIHBvaW50IHRvIHRoZSBsZWFmIGl0ZW0gcmVjdXJzaXZlbHlcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNldHRpbmdJdGVtUGF0aC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgcG9pbnRlciA9IHBvaW50ZXJbc2V0dGluZ0l0ZW1QYXRoW2ldXTtcbiAgICB9XG4gICAgLy8gdXBkYXRlIHRoZSBzZXR0aW5nIGxlYWYgdmFsdWVcbiAgICBwb2ludGVyW3NldHRpbmdJdGVtUGF0aFtzZXR0aW5nSXRlbVBhdGgubGVuZ3RoIC0gMV1dID0gdmFsdWU7XG5cbiAgICBsZXQgcmVzdWx0ID0ge307XG4gICAgcmVzdWx0W3NldHRpbmdJdGVtUGF0aFswXV0gPSBsb2NhbFNldHRpbmdzW3NldHRpbmdJdGVtUGF0aFswXV07XG4gICAgY2hyb21lLnN0b3JhZ2Uuc3luYy5zZXQocmVzdWx0KTtcbn1cbiJdLCJuYW1lcyI6WyJFdmVudE1hbmFnZXIiLCJDaGFubmVsIiwiY29uc3RydWN0b3IiLCJfc2VydmljZXMiLCJNYXAiLCJfZXZlbnRNYW5hZ2VyIiwiY2hyb21lIiwicnVudGltZSIsIm9uTWVzc2FnZSIsImFkZExpc3RlbmVyIiwibWVzc2FnZSIsInNlbmRlciIsImNhbGxiYWNrIiwicGFyc2VkIiwiSlNPTiIsInBhcnNlIiwidHlwZSIsImNvbnNvbGUiLCJlcnJvciIsImVtaXQiLCJldmVudCIsImRldGFpbCIsInNlcnZlciIsImdldCIsInNlcnZpY2UiLCJwYXJhbXMiLCJ0aGVuIiwicmVzdWx0IiwiYmluZCIsInByb3ZpZGUiLCJzZXQiLCJyZXF1ZXN0Iiwic3RyaW5naWZ5IiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJzZW5kTWVzc2FnZSIsImxhc3RFcnJvciIsInJlcXVlc3RUb1RhYiIsInRhYklkIiwic2VuZCIsIl9nZXRUYWJNZXNzYWdlU2VuZGVyIiwib24iLCJoYW5kbGVyIiwiZW1pdFRvVGFicyIsInRhYklkcyIsImNhdGNoIiwiQlJPV1NFUl9FTlYiLCJicm93c2VyIiwidGFicyIsImdldERvbWFpbiIsImxvZyIsImxvZ0luZm8iLCJ1cmwiLCJVUkxfUEFUVEVSTiIsImdyb3VwcyIsIm1hdGNoIiwiaTE4bkhUTUwiLCJpMThuRWxlbWVudHMiLCJkb2N1bWVudCIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJpIiwibGVuZ3RoIiwicG9zIiwiaGFzQXR0cmlidXRlIiwiZ2V0QXR0cmlidXRlIiwiaW5zZXJ0QWRqYWNlbnRUZXh0IiwiaTE4biIsImdldE1lc3NhZ2UiLCJfaGFuZGxlcklEIiwiX2V2ZW50VG9IYW5kbGVySURzIiwiX2hhbmRsZXJJRFRvSGFuZGxlciIsImhhbmRsZXJJRCIsIl9hbGxvY0hhbmRsZXJJRCIsImhhcyIsImFkZCIsIlNldCIsImNhbmNlbGVkIiwiX29mZiIsIndhcm4iLCJzb3VyY2UiLCJoYW5kbGVySURzIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImRlbGV0ZSIsIkJST1dTRVJfTEFOR1VBR0VTX01BUCIsImFjaCIsImFkeSIsImFmIiwiYWsiLCJhbSIsImFyIiwiYXoiLCJiZyIsImJuIiwiY2EiLCJjYWsiLCJjZWIiLCJjbyIsImNzIiwiY3kiLCJkYSIsImRlIiwiZHNiIiwiZWwiLCJlbiIsImVvIiwiZXMiLCJldCIsImV1IiwiZmEiLCJmZiIsImZpIiwiZnIiLCJnYSIsImdkIiwiZ2wiLCJoYSIsImhhdyIsImhlIiwiaGkiLCJobW4iLCJociIsImhzYiIsImh0IiwiaHUiLCJpZCIsImlnIiwiaXMiLCJpdCIsIml3IiwiamEiLCJrbSIsImthYiIsImtuIiwia28iLCJreSIsImxhIiwibGIiLCJsbyIsImx0IiwibHYiLCJtYWkiLCJtaSIsIm1rIiwibWwiLCJtciIsIm1zIiwibXQiLCJteSIsIm5vIiwibmIiLCJuZSIsIm5sIiwibnkiLCJvYyIsInBhIiwicGwiLCJwdCIsInJvIiwicnUiLCJzZCIsInNrIiwic2wiLCJzbSIsInNuIiwic3EiLCJzciIsInN0Iiwic3UiLCJzdiIsInN3IiwidGEiLCJ0ZSIsInRnIiwidGgiLCJ0bCIsInRsaCIsInRyIiwidWsiLCJ1ciIsInV6IiwidmkiLCJ5aSIsInlvIiwiemgiLCJsb2dXYXJuIiwibG9nRXJyb3IiLCJzaG91bGRGaWx0ZXJFcnJvciIsIndyYXBDb25zb2xlRm9yRmlsdGVyaW5nIiwic2V0TG9nTGV2ZWwiLCJnZXRMb2dMZXZlbCIsIkZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TIiwiam9pbk1lc3NhZ2UiLCJhcmdzIiwibWFwIiwidiIsImpvaW4iLCJfIiwic29tZSIsInBhdHRlcm4iLCJpbmNsdWRlcyIsInRlc3QiLCJMRVZFTF9PUkRFUiIsImRlYnVnIiwiaW5mbyIsInNpbGVudCIsImN1cnJlbnRMZXZlbCIsIkJVSUxEX0VOViIsImxldmVsIiwic2hvdWxkRW1pdCIsIm9yaWdpbmFsQ29uc29sZUVycm9yIiwiYXBwbHkiLCJERUZBVUxUX1NFVFRJTkdTIiwiYmxhY2tsaXN0IiwidXJscyIsImRvbWFpbnMiLCJleHRlbnNpb25zIiwiTGF5b3V0U2V0dGluZ3MiLCJSZXNpemUiLCJSVEwiLCJGb2xkTG9uZ0NvbnRlbnQiLCJTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbiIsImxhbmd1YWdlU2V0dGluZyIsImdldFVJTGFuZ3VhZ2UiLCJPdGhlclNldHRpbmdzIiwiTXV0dWFsVHJhbnNsYXRlIiwiU2VsZWN0VHJhbnNsYXRlIiwiVHJhbnNsYXRlQWZ0ZXJEYmxDbGljayIsIlRyYW5zbGF0ZUFmdGVyU2VsZWN0IiwiQ2FuY2VsVGV4dFNlbGVjdGlvbiIsIlVzZUdvb2dsZUFuYWx5dGljcyIsIkRlZmF1bHRUcmFuc2xhdG9yIiwiRGVmYXVsdFBhZ2VUcmFuc2xhdG9yIiwiSHlicmlkVHJhbnNsYXRvckNvbmZpZyIsInRyYW5zbGF0b3JzIiwic2VsZWN0aW9ucyIsIm9yaWdpbmFsVGV4dCIsIm1haW5NZWFuaW5nIiwidFByb251bmNpYXRpb24iLCJzUHJvbnVuY2lhdGlvbiIsImRldGFpbGVkTWVhbmluZ3MiLCJkZWZpbml0aW9ucyIsImV4YW1wbGVzIiwiVHJhbnNsYXRlUmVzdWx0RmlsdGVyIiwidFByb251bmNpYXRpb25JY29uIiwic1Byb251bmNpYXRpb25JY29uIiwiQ29udGVudERpc3BsYXlPcmRlciIsIkhpZGVQYWdlVHJhbnNsYXRvckJhbm5lciIsInNldERlZmF1bHRTZXR0aW5ncyIsInNldHRpbmdzIiwiQXJyYXkiLCJPYmplY3QiLCJrZXlzIiwidW5kZWZpbmVkIiwiZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MiLCJkZWZhdWx0cyIsImtleSIsInB1c2giLCJzdG9yYWdlIiwic3luYyIsInVwZGF0ZWQiLCJzZXR0aW5nIiwiY2hhbm5lbCIsIndpbmRvdyIsIm9ubG9hZCIsIlByaXZhY3lQb2xpY3lMaW5rIiwiZ2V0RWxlbWVudEJ5SWQiLCJzZXRBdHRyaWJ1dGUiLCJjb25maWciLCJhdmFpbGFibGVUcmFuc2xhdG9ycyIsImZyb20iLCJ0byIsInNldFVwVHJhbnNsYXRlQ29uZmlnIiwic2xpY2UiLCJpbnB1dEVsZW1lbnRzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJzZWxlY3RUcmFuc2xhdGVQb3NpdGlvbkVsZW1lbnQiLCJlbGVtZW50Iiwic2V0dGluZ0l0ZW1QYXRoIiwic3BsaXQiLCJzZXR0aW5nSXRlbVZhbHVlIiwiZ2V0U2V0dGluZyIsImNoZWNrZWQiLCJpbmRleE9mIiwidmFsdWUiLCJvbmNoYW5nZSIsInRhcmdldCIsInNwbGljZSIsInNhdmVPcHRpb24iLCJvcHRpb25zIiwic2VsZWN0ZWRJbmRleCIsInRyYW5zbGF0b3JDb25maWdFbGVzIiwiZWxlIiwicmVtb3ZlIiwiYWZmZWN0ZWQiLCJzZWxlY3RlZCIsInRyYW5zbGF0b3IiLCJPcHRpb24iLCJpdGVtIiwibG9jYWxTZXR0aW5ncyIsImZvckVhY2giLCJwb2ludGVyIl0sInNvdXJjZVJvb3QiOiIifQ==