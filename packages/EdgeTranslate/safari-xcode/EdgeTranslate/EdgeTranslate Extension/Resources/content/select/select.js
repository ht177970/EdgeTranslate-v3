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

/***/ "./src/content/common.js":
/*!*******************************!*\
  !*** ./src/content/common.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "detectSelect": () => (/* binding */ detectSelect)
/* harmony export */ });
/**
 * detect users select action and take action after the detection
 * This function need to be called in the mouse down listener
 * @param {Node} targetElement target element to be detected
 * @param {Function} actionAfterSelect take this action after the select action detected
 * @param {Function} actionAfterNotSelect take this action if it's not select action
 */
function detectSelect(targetElement, actionAfterSelect, actionAfterNotSelect) {
  // Remember whether mouse moved.
  let moved = false;

  // inner listener for detecting mousemove and mouseup.
  const detectMouseMove = () => {
    moved = true;
  };
  const detectMouseUp = event => {
    // select action detected
    if (moved) {
      if (typeof actionAfterSelect === "function") actionAfterSelect(event);
    } else if (typeof actionAfterNotSelect === "function") {
      // select action isn't detected
      actionAfterNotSelect(event);
    }
    // remove inner event listeners.
    targetElement.removeEventListener("mousemove", detectMouseMove);
    targetElement.removeEventListener("mouseup", detectMouseUp);
  };

  // add inner event listeners
  targetElement.addEventListener("mousemove", detectMouseMove);
  targetElement.addEventListener("mouseup", detectMouseUp);
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
/*!**************************************!*\
  !*** ./src/content/select/select.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/common.js */ "./src/common/scripts/common.js");
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common.js */ "./src/content/common.js");
/* harmony import */ var common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/scripts/channel.js */ "./src/common/scripts/channel.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");





/**
 * Select Content Script 오류 필터링
 */
const FILTERED_ERROR_PATTERNS = ["Unable to download", "Unable to download all specified images", "Cannot access", "before initialization", "Extension context invalidated", "Canvas error", "Network error"];
function shouldFilterError(message) {
  return FILTERED_ERROR_PATTERNS.some(pattern => message.includes(pattern)) || /Cannot access '.*' before initialization/.test(message) || /ReferenceError.*before initialization/.test(message) || /Unable to download.*images/.test(message) || /Unable to download all specified images/.test(message);
}
const originalConsoleError = console.error;
console.error = function (...args) {
  const message = args.join(" ");
  if (!shouldFilterError(message)) {
    originalConsoleError.apply(console, args);
  }
};
const ImageData = "data:image/png;base64,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";

// Communication channel.
const channel = new common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_2__["default"]();

// to indicate whether the translation button has been shown
let HasButtonShown = false;

/**
 * Initiate translation button.
 */
let translationButtonContainer = document.createElement("iframe");
const iframeContainer = translationButtonContainer;
// Note: some websites can't get contentDocument e.g. https://raw.githubusercontent.com/git/git/master/Documentation/RelNotes/2.40.0.txt. So I use shadow DOM as a fallback.
document.documentElement.appendChild(translationButtonContainer);
if (translationButtonContainer.contentDocument === null) {
  translationButtonContainer = document.createElement("div");
  renderButton();
}
document.documentElement.removeChild(iframeContainer);
translationButtonContainer.id = "edge-translate-button";
translationButtonContainer.style.backgroundColor = "white"; // programatically set style to compatible with the extension 'Dark Reader'

/**
 * When the user clicks the translation button, the translationButtonContainer will be mounted at document.documentElement and the load event will be triggered.
 */
function renderButton() {
  var _translationButtonCon, _translationButtonCon2;
  const buttonImage = document.createElement("img");
  buttonImage.src = ImageData;
  const BUTTON_SIZE = "20px";
  Object.assign(buttonImage.style, {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    minWidth: 0,
    maxWidth: BUTTON_SIZE,
    minHeight: 0,
    maxHeight: BUTTON_SIZE,
    padding: 0,
    border: 0,
    margin: 0,
    verticalAlign: 0,
    // fix the style problem in some websites
    filter: "none" // https://github.com/EdgeTranslate/EdgeTranslate/projects/2#card-58817626
  });
  const translationButton = document.createElement("div");
  Object.assign(translationButton.style, {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    padding: "6px",
    margin: 0,
    borderRadius: "50%",
    boxSizing: "content-box",
    overflow: "hidden",
    border: "none",
    cursor: "pointer"
  });
  translationButton.appendChild(buttonImage);
  getInnerParent(translationButtonContainer).appendChild(translationButton);
  const CleanStyle = {
    padding: 0,
    margin: 0,
    border: "none",
    overflow: "hidden"
  };
  Object.assign(((_translationButtonCon = translationButtonContainer.contentDocument) === null || _translationButtonCon === void 0 ? void 0 : _translationButtonCon.documentElement.style) || {}, CleanStyle);
  Object.assign(((_translationButtonCon2 = translationButtonContainer.contentDocument) === null || _translationButtonCon2 === void 0 ? void 0 : _translationButtonCon2.body.style) || {}, CleanStyle);
  translationButton.addEventListener("mousedown", buttonClickHandler);
  translationButton.addEventListener("contextmenu", e => e.preventDefault());
}
translationButtonContainer.addEventListener("load", renderButton);
let originScrollX = 0; // record the original scroll X position(before scroll event)
let originScrollY = 0; // record the original scroll Y position(before scroll event)
let originPositionX = 0; // record the original X position of selection icon(before scroll event)
let originPositionY = 0; // record the original Y position of selection icon(before scroll event)
let scrollingElement = window; // store the scrolling element for the page
// store the name of scroll property according to scrollingElement
let scrollPropertyX = "pageXOffset";
let scrollPropertyY = "pageYOffset";
// store the position setting of the translation button. default: "TopLeft"
let ButtonPositionSetting = "TopRight";

// Fetch the button position setting.
(0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)("LayoutSettings", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
  ButtonPositionSetting = result.LayoutSettings.SelectTranslatePosition;
});
// Update the button position setting when the setting is changed.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.LayoutSettings) return;
  ButtonPositionSetting = changes.LayoutSettings.newValue.SelectTranslatePosition;
});

// this listener activated when document content is loaded
// to make selection button available ASAP
window.addEventListener("DOMContentLoaded", () => {
  // to make the selection icon move with the mouse scrolling
  scrollingElement.addEventListener("scroll", scrollHandler);
  document.addEventListener("mousedown", () => {
    disappearButton();
    // whether user take a select action
    (0,_common_js__WEBPACK_IMPORTED_MODULE_1__.detectSelect)(document, event => {
      selectTranslate(event);
    });
  });
  document.addEventListener("dblclick", event => {
    selectTranslate(event, true);
  });
  document.addEventListener("click", event => {
    // triple click
    if (event.detail === 3) {
      selectTranslate(event, true);
    }
  });

  /**
   * implement the select translate feature
   * for the implement detail, please check in the document
   * @param {MouseEvent} event mouse event of mouse up , double click or triple click
   * @param {boolean} isDoubleClick whether the event type is double click or triple click, set false by default
   */
  async function selectTranslate(event, isDoubleClick = false) {
    if (!shouldTranslate()) return;
    const inBlacklist = await isInBlacklist();
    if (inBlacklist) return;
    (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)("OtherSettings", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
      if (!result.OtherSettings) return;
      let OtherSettings = result.OtherSettings;

      // Show translating result instantly.
      if (OtherSettings["TranslateAfterSelect"] || isDoubleClick && OtherSettings["TranslateAfterDblClick"]) {
        translateSubmit();
      } else if (OtherSettings["SelectTranslate"]) {
        showButton(event);
      }
    });
  }
});

/**
 * 处理鼠标点击按钮事件
 *
 * @param {MouseEvent} event 鼠标点击事件
 */
function buttonClickHandler(event) {
  event.preventDefault();
  event.stopPropagation();
  if (event.button === 0) {
    translateSubmit();
  } else if (event.button === 2) {
    pronounceSubmit();
  }
}

/**
 * Use this function to show the translation buttion.
 */
function showButton(event) {
  document.documentElement.appendChild(translationButtonContainer);
  const OffsetXValue = 10,
    OffsetYValue = 20;
  let XBias, YBias;
  switch (ButtonPositionSetting) {
    default:
    case "TopRight":
      XBias = OffsetXValue;
      YBias = -OffsetYValue - translationButtonContainer.clientHeight;
      break;
    case "TopLeft":
      XBias = -OffsetXValue - translationButtonContainer.clientWidth;
      YBias = -OffsetYValue - translationButtonContainer.clientHeight;
      break;
    case "BottomRight":
      XBias = OffsetXValue;
      YBias = OffsetYValue;
      break;
    case "BottomLeft":
      XBias = -OffsetXValue - translationButtonContainer.clientWidth;
      YBias = OffsetYValue;
      break;
  }
  let XPosition = event.x + XBias;
  let YPosition = event.y + YBias;

  // If the icon is beyond the side of the page, we need to reposition the icon inside the page.
  if (XPosition <= 0 || XPosition + translationButtonContainer.clientWidth > window.innerWidth) XPosition = event.x - XBias - translationButtonContainer.clientWidth;
  if (YPosition <= 0 || YPosition + translationButtonContainer.clientHeight > window.innerHeight) YPosition = event.y - YBias - translationButtonContainer.clientHeight;

  // set the new position of the icon
  translationButtonContainer.style.top = `${YPosition}px`;
  translationButtonContainer.style.left = `${XPosition}px`;

  // record original position of the selection icon and the start mouse scrolling position
  originScrollX = scrollingElement[scrollPropertyX];
  originScrollY = scrollingElement[scrollPropertyY];
  originPositionX = XPosition;
  originPositionY = YPosition;
  HasButtonShown = true;
}

/**
 * get selected text and its position in the page
 *
 * @returns {Object} format: {text: "string", position: [p1,p2]}
 */
function getSelection() {
  let selection = window.getSelection();
  let text = "";
  let position;
  if (selection.rangeCount > 0) {
    text = selection.toString().trim();
    const lastRange = selection.getRangeAt(selection.rangeCount - 1);
    // If the user selects something in a shadow dom, the endContainer will be the HTML element and the position will be [0,0]. In this situation, we set the position undefined to avoid relocating the result panel.
    if (lastRange.endContainer !== document.documentElement) {
      let rect = selection.getRangeAt(selection.rangeCount - 1).getBoundingClientRect();
      position = [rect.left, rect.top];
    }
  }
  return {
    text,
    position
  };
}

/**
 * 处理点击翻译按钮后的事件
 */
function translateSubmit() {
  let selection = getSelection();
  if (selection.text && selection.text.length > 0) {
    channel.request("translate", selection).then(() => {
      (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)("OtherSettings", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
        // to check whether user need to cancel text selection after translation finished
        if (result.OtherSettings && result.OtherSettings["CancelTextSelection"]) {
          cancelTextSelection();
        }
      });
      disappearButton();
    });
  }
}

/**
 * Check if we should start translating.
 *
 * @returns {boolean} if we should start translating
 */
function shouldTranslate() {
  let selectionObject = window.getSelection();
  let selectionText = selectionObject.toString().trim();
  if (false)
    // on firefox, we don't need to tell the focusNode type because in input elements, selectionText is ""
    {}

  /**
   * Filter out the nodes to avoid the translation button appearing in some unnecessary places.
   * @param {Node} node the node to be filtered
   * @returns {boolean} if the node should be passed
   */
  const filterNode = node => {
    if (node.nodeType === Node.TEXT_NODE) return true;
    // BODY is a special case. see https://github.com/EdgeTranslate/EdgeTranslate/issues/531
    if (node.nodeType === Node.ELEMENT_NODE) return ["BODY"].includes(node.tagName);
  };
  return selectionText.length > 0 && (filterNode(selectionObject.anchorNode) || filterNode(selectionObject.focusNode)) &&
  // Do not re-translate translated text.
  !(window.isDisplayingResult && window.translateResult.originalText === selectionText);
}

/**
 * 处理发音快捷键
 */
function pronounceSubmit() {
  let selection = getSelection();
  if (selection.text && selection.text.length > 0) {
    channel.request("pronounce", {
      text: selection.text,
      language: "auto"
    });
  }
}

/**
 * execute this function to make the translation button disappear
 */
function disappearButton() {
  if (HasButtonShown) {
    document.documentElement.removeChild(translationButtonContainer);
    HasButtonShown = false;
  }
}

/**
 * the handler function to make the selection icon move with mouse scrolling
 * @param Event the event of scrolling
 */
function scrollHandler() {
  if (HasButtonShown) {
    let distanceX = originScrollX - scrollingElement[scrollPropertyX];
    let distanceY = originScrollY - scrollingElement[scrollPropertyY];
    translationButtonContainer.style.left = `${originPositionX + distanceX}px`;
    translationButtonContainer.style.top = `${originPositionY + distanceY}px`;
  }
}

/**
 * whether the url of current page is in the blacklist
 *
 * @returns {Promise<boolean>} result in promise form
 */
function isInBlacklist() {
  return (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.getOrSetDefaultSettings)("blacklist", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_3__.DEFAULT_SETTINGS).then(result => {
    let url = window.location.href;
    let blacklist = result.blacklist;
    return blacklist.domains[(0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.getDomain)(url)] || blacklist.urls[url];
  });
}

/**
 * cancel text selection when translation is finished
 */
function cancelTextSelection() {
  if (window.getSelection) {
    if (window.getSelection().empty) {
      // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {
    // IE
    document.selection.empty();
  }
}

/**
 * 处理取消网页翻译的快捷键
 */
function cancelPageTranslate() {
  let checkAndClick = button => {
    if (button !== null && button !== undefined) {
      button.click();
    }
  };
  let frame = document.getElementById(":0.container");
  if (frame !== null && frame !== undefined) {
    let cancelButton = frame.contentDocument.getElementById(":0.close");
    checkAndClick(cancelButton);
  }
  frame = document.getElementById("OUTFOX_JTR_BAR");
  if (frame !== null && frame !== undefined) {
    let cancelButton = frame.contentDocument.getElementById("OUTFOX_JTR_BAR_CLOSE");
    checkAndClick(cancelButton);
  }
}

/**
 * The container of the translation button can be either an iframe or a div with a shadow dom.
 * This function can get the inner parent of the container.
 * @param {HTMLIFrameElement|HTMLDivElement} container
 */
function getInnerParent(container) {
  if (container.tagName === "IFRAME") return container.contentDocument.body;
  if (container.shadowRoot) return container.shadowRoot;
  container.attachShadow({
    mode: "open"
  });
  return container.shadowRoot;
}

// provide user's selection result for the background module
channel.provide("get_selection", () => Promise.resolve(getSelection()));

// handler for shortcut command
channel.on("command", detail => {
  switch (detail.command) {
    case "translate_selected":
      translateSubmit();
      break;
    case "pronounce_selected":
      pronounceSubmit();
      break;
    case "cancel_page_translate":
      cancelPageTranslate();
      break;
    default:
      break;
  }
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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UixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLElBQUk7RUFDVEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLFdBQVcsRUFBRSxJQUFJO0VBQ2pCQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixRQUFRLEVBQUUsSUFBSTtFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZCxPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEdBQUcsRUFBRSxLQUFLO0VBQ1ZDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxJQUFJO0VBQ1RDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsS0FBSztFQUNULE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsS0FBSztFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixP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QztNQUNqQjtJQUNKLEtBQUssb0JBQW9CO01BQ3JCSSxlQUFlLENBQUMsQ0FBQztNQUNqQjtJQUNKLEtBQUssdUJBQXVCO01BQ3hCZ0QsbUJBQW1CLENBQUMsQ0FBQztNQUNyQjtJQUNKO01BQ0k7RUFDUjtBQUNKLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvY2hhbm5lbC5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9jb21tb24uanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvZXZlbnQuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvbGFuZ3VhZ2VzLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2xvZ2dlci5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9zZXR0aW5ncy5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb250ZW50L2NvbW1vbi5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbnRlbnQvc2VsZWN0L3NlbGVjdC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRNYW5hZ2VyIGZyb20gXCIuL2V2ZW50LmpzXCI7XG5cbi8qKlxuICogQ2hhbm5lbCBmb3IgaW50ZXItY29udGV4dCBjb21tdW5pY2F0aW9uLlxuICpcbiAqIEEgY2hyb21lIGV4dGVuc2lvbiB0eXBpY2FsbHkgY29udGFpbnMgNCB0eXBlcyBvZiBjb250ZXh0OiBiYWNrZ3JvdW5kLCBwb3B1cCxcbiAqIG9wdGlvbnMgYW5kIGNvbnRlbnQgc2NyaXB0cy4gQ29tbXVuaWNhdGlvbiBiZXR3ZWVuIHRoZXNlIGNvbnRleHRzIHJlbGllcyBvblxuICogY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UgYW5kIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlLlxuICpcbiAqIFRoaXMgbW9kdWxlIHByb3ZpZGVzIHR3byBjb21tdW5pY2F0aW9uIG1vZGVsOlxuICogICAqIHJlcXVlc3QvcmVzcG9uc2VcbiAqICAgKiBldmVudCB0cmlnZ2VyL2xpc3RlblxuICpcbiAqIGJhc2VkIG9uIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlIGFuZCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZS5cbiAqL1xuY2xhc3MgQ2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPFN0cmluZywgRnVuY3Rpb24+fSBzZXJ2aWNlc1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2VydmljZXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtFdmVudE1hbmFnZXJ9IEV2ZW50IG1hbmFnZXIuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudE1hbmFnZXIgPSBuZXcgRXZlbnRNYW5hZ2VyKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIG1hc3NhZ2UgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoXG4gICAgICAgICAgICAoKG1lc3NhZ2UsIHNlbmRlciwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgIGlmICghcGFyc2VkIHx8ICFwYXJzZWQudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWQgbWVzc2FnZTogJHttZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXJzZWQudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXZlbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50TWFuYWdlci5lbWl0KHBhcnNlZC5ldmVudCwgcGFyc2VkLmRldGFpbCwgc2VuZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNlcnZpY2VcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5fc2VydmljZXMuZ2V0KHBhcnNlZC5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VydmVyKSBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgY2FuIGNhbGwgdGhlIGNhbGxiYWNrIG9ubHkgd2hlbiB3ZSByZWFsbHkgcHJvdmlkZSB0aGUgcmVxdWVzdGVkIHNlcnZpY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIocGFyc2VkLnBhcmFtcywgc2VuZGVyKS50aGVuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQpID0+IGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5rbm93biBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS50eXBlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcylcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlIGEgc2VydmljZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZXJ2aWNlIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzZXJ2ZXIgc2VydmVyLCBzZXJ2ZXIgZnVuY3Rpb24gbXVzdCByZXR1cm4gYSBQcm9taXNlIG9mIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHByb3ZpZGUoc2VydmljZSwgc2VydmVyKSB7XG4gICAgICAgIHRoaXMuX3NlcnZpY2VzLnNldChzZXJ2aWNlLCBzZXJ2ZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSByZXF1ZXN0IGFuZCBnZXQgYSByZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZXJ2aWNlIHNlcnZpY2UgbmFtZVxuICAgICAqIEBwYXJhbSB7QW55fSBwYXJhbXMgc2VydmljZSBwYXJhbWV0ZXJzXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QW55Pn0gcHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICByZXF1ZXN0KHNlcnZpY2UsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInNlcnZpY2VcIiwgc2VydmljZSwgcGFyYW1zIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSByZXF1ZXN0IHRvIHRoZSBzcGVjaWZpZWQgdGFiIGFuZCBnZXQgYSByZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0YWJJZCB0YWIgaWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtBbnl9IHBhcmFtcyBzZXJ2aWNlIHBhcmFtZXRlcnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBbnk+fSBwcm9taXNlIG9mIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHJlcXVlc3RUb1RhYih0YWJJZCwgc2VydmljZSwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHNlbmQgPSB0aGlzLl9nZXRUYWJNZXNzYWdlU2VuZGVyKCk7XG4gICAgICAgIGlmICghc2VuZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiQ2FuIG5vdCBzZW5kIG1lc3NhZ2UgdG8gdGFicyBpbiBjdXJyZW50IGNvbnRleHQhXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJzZXJ2aWNlXCIsIHNlcnZpY2UsIHBhcmFtcyB9KTtcbiAgICAgICAgcmV0dXJuIHNlbmQodGFiSWQsIG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGhhbmRsZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgZXZlbnQgaGFuZGxlciwgYWNjZXB0cyB0d28gYXJndW1lbnRzOlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBldmVudCBkZXRhaWxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlIG9mIHRoZSBldmVudCwgY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlciBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IGEgY2FuY2VsZXIgdGhhdCB3aWxsIHJlbW92ZSB0aGUgaGFuZGxlciB3aGVuIGNhbGxlZFxuICAgICAqL1xuICAgIG9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudE1hbmFnZXIub24oZXZlbnQsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtaXQgYW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0FueX0gZGV0YWlsIGV2ZW50IGRldGFpbFxuICAgICAqL1xuICAgIGVtaXQoZXZlbnQsIGRldGFpbCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJldmVudFwiLCBldmVudCwgZGV0YWlsIH0pO1xuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbWl0IGFuIGV2ZW50IHRvIHNwZWNpZmllZCB0YWJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXIgfCBBcnJheTxOdW1iZXI+fSB0YWJJZHMgdGFiIGlkc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7QW55fSBkZXRhaWwgZXZlbnQgZGV0YWlsXG4gICAgICovXG4gICAgZW1pdFRvVGFicyh0YWJJZHMsIGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgY29uc3Qgc2VuZCA9IHRoaXMuX2dldFRhYk1lc3NhZ2VTZW5kZXIoKTtcbiAgICAgICAgaWYgKCFzZW5kKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2FuIG5vdCBzZW5kIG1lc3NhZ2UgdG8gdGFicyBpbiBjdXJyZW50IGNvbnRleHQhXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGFiSWRzIGlzIGEgbnVtYmVyLCB3cmFwIGl0IHVwIHdpdGggYW4gYXJyYXkuXG4gICAgICAgIGlmICh0eXBlb2YgdGFiSWRzID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0YWJJZHMgPSBbdGFiSWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZXZlbnRcIiwgZXZlbnQsIGRldGFpbCB9KTtcbiAgICAgICAgZm9yIChsZXQgdGFiSWQgb2YgdGFiSWRzKSB7XG4gICAgICAgICAgICBzZW5kKHRhYklkLCBtZXNzYWdlKS5jYXRjaCgoZXJyb3IpID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZFxuICAgICAqXG4gICAgICogR2V0IHRoZSBtZXNzYWdlIHNlbmRpbmcgZnVuY3Rpb24gZm9yIHNlbmRpbmcgbWVzc2FnZSB0byB0YWJzLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9uIHwgbnVsbH0gbWVzc2FnZSBzZW5kZXJcbiAgICAgKi9cbiAgICBfZ2V0VGFiTWVzc2FnZVNlbmRlcigpIHtcbiAgICAgICAgaWYgKEJST1dTRVJfRU5WID09PSBcImZpcmVmb3hcIikge1xuICAgICAgICAgICAgaWYgKCFicm93c2VyLnRhYnMgfHwgIWJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaXJlZm94IHVzZXMgUHJvbWlzZSwgcmV0dXJuIGRpcmVjdGx5LlxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hyb21lLnRhYnMgfHwgIWNocm9tZS50YWJzLnNlbmRNZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENocm9tZSB1c2VzIGNhbGxiYWNrLCB3cmFwIGl0IHVwLlxuICAgICAgICByZXR1cm4gKHRhYklkLCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCBtZXNzYWdlLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENoYW5uZWw7XG4iLCJleHBvcnQgeyBnZXREb21haW4sIGxvZyB9O1xuaW1wb3J0IHsgbG9nSW5mbyB9IGZyb20gXCIuL2xvZ2dlci5qc1wiO1xuXG4vKipcbiAqIOaPkOWPlue7meWumueahHVybOeahOWfn+WQjVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcbiAqL1xuZnVuY3Rpb24gZ2V0RG9tYWluKHVybCkge1xuICAgIGlmICh1cmwpIHtcbiAgICAgICAgbGV0IFVSTF9QQVRURVJOID0gLy4rOlxcLysoW1xcdy4tXSspLiovO1xuICAgICAgICBsZXQgZ3JvdXBzID0gdXJsLm1hdGNoKFVSTF9QQVRURVJOKTtcbiAgICAgICAgaWYgKGdyb3Vwcykge1xuICAgICAgICAgICAgcmV0dXJuIGdyb3Vwc1sxXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gXCJcIjtcbn1cblxuLyoqXG4gKiBjb25zb2xlLmxvZyB3cmFwcGVyLlxuICpcbiAqIEBwYXJhbSB7QW55fSBtZXNzYWdlIG1lc3NhZ2UgdG8gbG9nLlxuICovXG5mdW5jdGlvbiBsb2cobWVzc2FnZSkge1xuICAgIGxvZ0luZm8obWVzc2FnZSk7XG59XG5cbi8qKlxuICogc2V0IHRoZSBjb250ZW50IHRleHQgb2YgSFRNTCB0YWdzLCB3aGljaCBoYXZlIFwiaTE4blwiIGNsYXNzIG5hbWUsIHdpdGggaTE4biB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaTE4bkhUTUwoKSB7XG4gICAgbGV0IGkxOG5FbGVtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJpMThuXCIpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaTE4bkVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIC8vIERlZmF1bHQgXCJiZWZvcmVFbmRcIi5cbiAgICAgICAgbGV0IHBvcyA9IFwiYmVmb3JlRW5kXCI7XG4gICAgICAgIGlmIChpMThuRWxlbWVudHNbaV0uaGFzQXR0cmlidXRlKFwiZGF0YS1pbnNlcnQtcG9zXCIpKSB7XG4gICAgICAgICAgICBwb3MgPSBpMThuRWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKFwiZGF0YS1pbnNlcnQtcG9zXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6Lef6ZqP5rWP6KeI5Zmo55qE6K+t6KiA6K6+572u5pi+56S65YaF5a65XG4gICAgICAgIGkxOG5FbGVtZW50c1tpXS5pbnNlcnRBZGphY2VudFRleHQoXG4gICAgICAgICAgICBwb3MsXG4gICAgICAgICAgICBjaHJvbWUuaTE4bi5nZXRNZXNzYWdlKGkxOG5FbGVtZW50c1tpXS5nZXRBdHRyaWJ1dGUoXCJkYXRhLWkxOG4tbmFtZVwiKSlcbiAgICAgICAgKTtcbiAgICB9XG59XG4iLCIvKipcbiAqIEV2ZW50IG1hbmFnZXIuXG4gKi9cbmNsYXNzIEV2ZW50TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfSBuZXh0IGhhbmRsZXIgSUQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9oYW5kbGVySUQgPSAxO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPFN0cmluZywgU2V0PE51bWJlcj4+fSBldmVudCB0byBoYW5kbGVyIElEcyBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2V2ZW50VG9IYW5kbGVySURzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPE51bWJlciwgRnVuY3Rpb24+fSBoYW5kbGVyIElEIHRvIGhhbmRsZXIgbWFwXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdG8gaGFuZGxlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBldmVudCBoYW5kbGVyLCBhY2NlcHRzIHR3byBhcmd1bWVudHM6XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGV2ZW50IGRldGFpbFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2Ugb2YgdGhlIGV2ZW50LCBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyIG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gYSBjYW5jZWxlciB0aGF0IHdpbGwgcmVtb3ZlIHRoZSBoYW5kbGVyIHdoZW4gY2FsbGVkXG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcklEID0gdGhpcy5fYWxsb2NIYW5kbGVySUQoKTtcbiAgICAgICAgdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLnNldChoYW5kbGVySUQsIGhhbmRsZXIpO1xuXG4gICAgICAgIGlmICh0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpLmFkZChoYW5kbGVySUQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuc2V0KGV2ZW50LCBuZXcgU2V0KFtoYW5kbGVySURdKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFYWNoIGNhbmNlbGVyIHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICAgICAgICBsZXQgY2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNhbmNlbGVkKSB7XG4gICAgICAgICAgICAgICAgY2FuY2VsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX29mZihldmVudCwgaGFuZGxlcklEKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiWW91IHNob3VsZG4ndCBjYWxsIHRoZSBjYW5jZWxlciBtb3JlIHRoYW4gb25jZSFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtBbnl9IGRldGFpbCBldmVudCBkZXRhaWxcbiAgICAgKiBAcGFyYW0ge0FueX0gc291cmNlIGV2ZW50IHNvdXJjZVxuICAgICAqL1xuICAgIGVtaXQoZXZlbnQsIGRldGFpbCwgc291cmNlKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRHMgPSB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpO1xuXG4gICAgICAgIGlmICghaGFuZGxlcklEcykgcmV0dXJuO1xuXG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlcklEIG9mIGhhbmRsZXJJRHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuZ2V0KGhhbmRsZXJJRCk7XG4gICAgICAgICAgICBoYW5kbGVyICYmIGhhbmRsZXIoZGV0YWlsLCBzb3VyY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kXG4gICAgICpcbiAgICAgKiBBbGxvYyBhIGhhbmRsZXIgSUQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSBhbiB1bnVzZWQgaGFuZGxlciBJRFxuICAgICAqL1xuICAgIF9hbGxvY0hhbmRsZXJJRCgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5oYXModGhpcy5faGFuZGxlcklEKSkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlcklEID0gKHRoaXMuX2hhbmRsZXJJRCArIDEpICUgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJJRDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2RcbiAgICAgKlxuICAgICAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGhhbmRsZXJJRCBoYW5kbGVyIElEXG4gICAgICovXG4gICAgX29mZihldmVudCwgaGFuZGxlcklEKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRHMgPSB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpO1xuICAgICAgICBoYW5kbGVySURzICYmIGhhbmRsZXJJRHMuZGVsZXRlKGhhbmRsZXJJRCk7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5kZWxldGUoaGFuZGxlcklEKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50TWFuYWdlcjtcbiIsIi8qKlxuICogYSBtYXAgZnJvbSBhYmJyZXZpYXRpb24gb2YgbGFuZ3VhZ2VzIHRoYXQgc3VwcG9ydGVkIGJ5IGJyb3dzZXJzIHRvIGFiYnJldmlhdGlvbiBvZiB0aG9zZSBzdXBwb3J0ZWQgYnkgRWRnZSBUcmFuc2xhdGVcbiAqL1xuY29uc3QgQlJPV1NFUl9MQU5HVUFHRVNfTUFQID0ge1xuICAgIGFjaDogXCJhY2hcIixcbiAgICBhZHk6IFwiZW5cIixcbiAgICBhZjogXCJhZlwiLFxuICAgIFwiYWYtTkFcIjogXCJhZlwiLFxuICAgIFwiYWYtWkFcIjogXCJhZlwiLFxuICAgIGFrOiBcImFrYVwiLFxuICAgIGFtOiBcImFtXCIsXG4gICAgYXI6IFwiYXJcIixcbiAgICBcImFyLUFSXCI6IFwiYXJcIixcbiAgICBcImFyLU1BXCI6IFwiYXJcIixcbiAgICBcImFyLVNBXCI6IFwiYXJcIixcbiAgICBcImF5LUJPXCI6IFwiYXltXCIsXG4gICAgYXo6IFwiYXpcIixcbiAgICBcImF6LUFaXCI6IFwiYXpcIixcbiAgICBcImJlLUJZXCI6IFwiYmVcIixcbiAgICBiZzogXCJiZ1wiLFxuICAgIFwiYmctQkdcIjogXCJiZ1wiLFxuICAgIGJuOiBcImJuXCIsXG4gICAgXCJibi1JTlwiOiBcImJuXCIsXG4gICAgXCJibi1CRFwiOiBcImJuXCIsXG4gICAgXCJicy1CQVwiOiBcImJzXCIsXG4gICAgY2E6IFwiY2FcIixcbiAgICBcImNhLUVTXCI6IFwiY2FcIixcbiAgICBjYWs6IFwiZW5cIixcbiAgICBjZWI6IFwiY2ViXCIsXG4gICAgXCJjay1VU1wiOiBcImNoclwiLFxuICAgIGNvOiBcImNvXCIsXG4gICAgY3M6IFwiY3NcIixcbiAgICBcImNzLUNaXCI6IFwiY3NcIixcbiAgICBjeTogXCJjeVwiLFxuICAgIFwiY3ktR0JcIjogXCJjeVwiLFxuICAgIGRhOiBcImRhXCIsXG4gICAgXCJkYS1ES1wiOiBcImRhXCIsXG4gICAgZGU6IFwiZGVcIixcbiAgICBcImRlLUFUXCI6IFwiZGVcIixcbiAgICBcImRlLURFXCI6IFwiZGVcIixcbiAgICBcImRlLUNIXCI6IFwiZGVcIixcbiAgICBkc2I6IFwiZW5cIixcbiAgICBlbDogXCJlbFwiLFxuICAgIFwiZWwtR1JcIjogXCJlbFwiLFxuICAgIGVuOiBcImVuXCIsXG4gICAgXCJlbi1HQlwiOiBcImVuXCIsXG4gICAgXCJlbi1BVVwiOiBcImVuXCIsXG4gICAgXCJlbi1DQVwiOiBcImVuXCIsXG4gICAgXCJlbi1JRVwiOiBcImVuXCIsXG4gICAgXCJlbi1JTlwiOiBcImVuXCIsXG4gICAgXCJlbi1QSVwiOiBcImVuXCIsXG4gICAgXCJlbi1VRFwiOiBcImVuXCIsXG4gICAgXCJlbi1VU1wiOiBcImVuXCIsXG4gICAgXCJlbi1aQVwiOiBcImVuXCIsXG4gICAgXCJlbkBwaXJhdGVcIjogXCJlblwiLFxuICAgIGVvOiBcImVvXCIsXG4gICAgXCJlby1FT1wiOiBcImVvXCIsXG4gICAgZXM6IFwiZXNcIixcbiAgICBcImVzLUFSXCI6IFwiZXNcIixcbiAgICBcImVzLTQxOVwiOiBcImVzXCIsXG4gICAgXCJlcy1DTFwiOiBcImVzXCIsXG4gICAgXCJlcy1DT1wiOiBcImVzXCIsXG4gICAgXCJlcy1FQ1wiOiBcImVzXCIsXG4gICAgXCJlcy1FU1wiOiBcImVzXCIsXG4gICAgXCJlcy1MQVwiOiBcImVzXCIsXG4gICAgXCJlcy1OSVwiOiBcImVzXCIsXG4gICAgXCJlcy1NWFwiOiBcImVzXCIsXG4gICAgXCJlcy1VU1wiOiBcImVzXCIsXG4gICAgXCJlcy1WRVwiOiBcImVzXCIsXG4gICAgZXQ6IFwiZXRcIixcbiAgICBcImV0LUVFXCI6IFwiZXRcIixcbiAgICBldTogXCJldVwiLFxuICAgIFwiZXUtRVNcIjogXCJldVwiLFxuICAgIGZhOiBcImZhXCIsXG4gICAgXCJmYS1JUlwiOiBcImZhXCIsXG4gICAgXCJmYi1MVFwiOiBcImVuXCIsXG4gICAgZmY6IFwiZW5cIixcbiAgICBmaTogXCJmaVwiLFxuICAgIFwiZmktRklcIjogXCJmaVwiLFxuICAgIFwiZm8tRk9cIjogXCJmYW9cIixcbiAgICBmcjogXCJmclwiLFxuICAgIFwiZnItQ0FcIjogXCJmclwiLFxuICAgIFwiZnItRlJcIjogXCJmclwiLFxuICAgIFwiZnItQkVcIjogXCJmclwiLFxuICAgIFwiZnItQ0hcIjogXCJmclwiLFxuICAgIFwiZnktTkxcIjogXCJmeVwiLFxuICAgIGdhOiBcImdhXCIsXG4gICAgXCJnYS1JRVwiOiBcImdhXCIsXG4gICAgZ2Q6IFwiZ2RcIixcbiAgICBnbDogXCJnbFwiLFxuICAgIFwiZ2wtRVNcIjogXCJnbFwiLFxuICAgIFwiZ24tUFlcIjogXCJncm5cIixcbiAgICBcImd1LUlOXCI6IFwiZ3VcIixcbiAgICBcImd4LUdSXCI6IFwiZWxcIixcbiAgICBoYTogXCJoYVwiLFxuICAgIGhhdzogXCJoYXdcIixcbiAgICBoZTogXCJoZVwiLFxuICAgIFwiaGUtSUxcIjogXCJoZVwiLFxuICAgIGhpOiBcImhpXCIsXG4gICAgXCJoaS1JTlwiOiBcImhpXCIsXG4gICAgaG1uOiBcImhtblwiLFxuICAgIGhyOiBcImhyXCIsXG4gICAgXCJoci1IUlwiOiBcImhyXCIsXG4gICAgaHNiOiBcImVuXCIsXG4gICAgaHQ6IFwiaHRcIixcbiAgICBodTogXCJodVwiLFxuICAgIFwiaHUtSFVcIjogXCJodVwiLFxuICAgIFwiaHktQU1cIjogXCJoeVwiLFxuICAgIGlkOiBcImlkXCIsXG4gICAgXCJpZC1JRFwiOiBcImlkXCIsXG4gICAgaWc6IFwiaWdcIixcbiAgICBpczogXCJpc1wiLFxuICAgIFwiaXMtSVNcIjogXCJpc1wiLFxuICAgIGl0OiBcIml0XCIsXG4gICAgXCJpdC1JVFwiOiBcIml0XCIsXG4gICAgaXc6IFwiaGVcIixcbiAgICBqYTogXCJqYVwiLFxuICAgIFwiamEtSlBcIjogXCJqYVwiLFxuICAgIFwianYtSURcIjogXCJqd1wiLFxuICAgIFwia2EtR0VcIjogXCJrYVwiLFxuICAgIFwia2stS1pcIjogXCJra1wiLFxuICAgIGttOiBcImttXCIsXG4gICAgXCJrbS1LSFwiOiBcImttXCIsXG4gICAga2FiOiBcImthYlwiLFxuICAgIGtuOiBcImtuXCIsXG4gICAgXCJrbi1JTlwiOiBcImtuXCIsXG4gICAga286IFwia29cIixcbiAgICBcImtvLUtSXCI6IFwia29cIixcbiAgICBcImt1LVRSXCI6IFwia3VcIixcbiAgICBreTogXCJreVwiLFxuICAgIGxhOiBcImxhXCIsXG4gICAgXCJsYS1WQVwiOiBcImxhXCIsXG4gICAgbGI6IFwibGJcIixcbiAgICBcImxpLU5MXCI6IFwibGltXCIsXG4gICAgbG86IFwibG9cIixcbiAgICBsdDogXCJsdFwiLFxuICAgIFwibHQtTFRcIjogXCJsdFwiLFxuICAgIGx2OiBcImx2XCIsXG4gICAgXCJsdi1MVlwiOiBcImx2XCIsXG4gICAgbWFpOiBcIm1haVwiLFxuICAgIFwibWctTUdcIjogXCJtZ1wiLFxuICAgIG1pOiBcIm1pXCIsXG4gICAgbWs6IFwibWtcIixcbiAgICBcIm1rLU1LXCI6IFwibWtcIixcbiAgICBtbDogXCJtbFwiLFxuICAgIFwibWwtSU5cIjogXCJtbFwiLFxuICAgIFwibW4tTU5cIjogXCJtblwiLFxuICAgIG1yOiBcIm1yXCIsXG4gICAgXCJtci1JTlwiOiBcIm1yXCIsXG4gICAgbXM6IFwibXNcIixcbiAgICBcIm1zLU1ZXCI6IFwibXNcIixcbiAgICBtdDogXCJtdFwiLFxuICAgIFwibXQtTVRcIjogXCJtdFwiLFxuICAgIG15OiBcIm15XCIsXG4gICAgbm86IFwibm9cIixcbiAgICBuYjogXCJub1wiLFxuICAgIFwibmItTk9cIjogXCJub1wiLFxuICAgIG5lOiBcIm5lXCIsXG4gICAgXCJuZS1OUFwiOiBcIm5lXCIsXG4gICAgbmw6IFwibmxcIixcbiAgICBcIm5sLUJFXCI6IFwibmxcIixcbiAgICBcIm5sLU5MXCI6IFwibmxcIixcbiAgICBcIm5uLU5PXCI6IFwibm9cIixcbiAgICBueTogXCJueVwiLFxuICAgIG9jOiBcIm9jaVwiLFxuICAgIFwib3ItSU5cIjogXCJvclwiLFxuICAgIHBhOiBcInBhXCIsXG4gICAgXCJwYS1JTlwiOiBcInBhXCIsXG4gICAgcGw6IFwicGxcIixcbiAgICBcInBsLVBMXCI6IFwicGxcIixcbiAgICBcInBzLUFGXCI6IFwicHNcIixcbiAgICBwdDogXCJwdFwiLFxuICAgIFwicHQtQlJcIjogXCJwdFwiLFxuICAgIFwicHQtUFRcIjogXCJwdFwiLFxuICAgIFwicXUtUEVcIjogXCJxdWVcIixcbiAgICBcInJtLUNIXCI6IFwicm9oXCIsXG4gICAgcm86IFwicm9cIixcbiAgICBcInJvLVJPXCI6IFwicm9cIixcbiAgICBydTogXCJydVwiLFxuICAgIFwicnUtUlVcIjogXCJydVwiLFxuICAgIFwic2EtSU5cIjogXCJzYW5cIixcbiAgICBzZDogXCJzZFwiLFxuICAgIFwic2UtTk9cIjogXCJzbWVcIixcbiAgICBcInNpLUxLXCI6IFwic2lcIixcbiAgICBzazogXCJza1wiLFxuICAgIFwic2stU0tcIjogXCJza1wiLFxuICAgIHNsOiBcInNsXCIsXG4gICAgXCJzbC1TSVwiOiBcInNsXCIsXG4gICAgc206IFwic21cIixcbiAgICBzbjogXCJzblwiLFxuICAgIFwic28tU09cIjogXCJzb1wiLFxuICAgIHNxOiBcInNxXCIsXG4gICAgXCJzcS1BTFwiOiBcInNxXCIsXG4gICAgc3I6IFwic3JcIixcbiAgICBcInNyLVJTXCI6IFwic3JcIixcbiAgICBzdDogXCJzdFwiLFxuICAgIHN1OiBcInN1XCIsXG4gICAgc3Y6IFwic3ZcIixcbiAgICBcInN2LVNFXCI6IFwic3ZcIixcbiAgICBzdzogXCJzd1wiLFxuICAgIFwic3ctS0VcIjogXCJzd1wiLFxuICAgIHRhOiBcInRhXCIsXG4gICAgXCJ0YS1JTlwiOiBcInRhXCIsXG4gICAgdGU6IFwidGVcIixcbiAgICBcInRlLUlOXCI6IFwidGVcIixcbiAgICB0ZzogXCJ0Z1wiLFxuICAgIFwidGctVEpcIjogXCJ0Z1wiLFxuICAgIHRoOiBcInRoXCIsXG4gICAgXCJ0aC1USFwiOiBcInRoXCIsXG4gICAgdGw6IFwiZmlsXCIsXG4gICAgXCJ0bC1QSFwiOiBcImZpbFwiLFxuICAgIHRsaDogXCJ0bGhcIixcbiAgICB0cjogXCJ0clwiLFxuICAgIFwidHItVFJcIjogXCJ0clwiLFxuICAgIFwidHQtUlVcIjogXCJ0YXRcIixcbiAgICB1azogXCJ1a1wiLFxuICAgIFwidWstVUFcIjogXCJ1a1wiLFxuICAgIHVyOiBcInVyXCIsXG4gICAgXCJ1ci1QS1wiOiBcInVyXCIsXG4gICAgdXo6IFwidXpcIixcbiAgICBcInV6LVVaXCI6IFwidXpcIixcbiAgICB2aTogXCJ2aVwiLFxuICAgIFwidmktVk5cIjogXCJ2aVwiLFxuICAgIFwieGgtWkFcIjogXCJ4aFwiLFxuICAgIHlpOiBcInlpXCIsXG4gICAgXCJ5aS1ERVwiOiBcInlpXCIsXG4gICAgeW86IFwieW9cIixcbiAgICB6aDogXCJ6aC1DTlwiLFxuICAgIFwiemgtSGFuc1wiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1IYW50XCI6IFwiemgtVFdcIixcbiAgICBcInpoLUNOXCI6IFwiemgtQ05cIixcbiAgICBcInpoLUhLXCI6IFwiemgtVFdcIixcbiAgICBcInpoLVNHXCI6IFwiemgtQ05cIixcbiAgICBcInpoLVRXXCI6IFwiemgtVFdcIixcbiAgICBcInp1LVpBXCI6IFwienVcIixcbn07XG5cbi8qKlxuICogRXhwb3J0IGxhbmd1YWdlcyBhbmQgYnJvd3NlciBsYW5ndWFnZXMgbWFwLlxuICovXG5leHBvcnQgeyBCUk9XU0VSX0xBTkdVQUdFU19NQVAgfTtcbiIsImV4cG9ydCB7XG4gICAgbG9nSW5mbyxcbiAgICBsb2dXYXJuLFxuICAgIGxvZ0Vycm9yLFxuICAgIHNob3VsZEZpbHRlckVycm9yLFxuICAgIHdyYXBDb25zb2xlRm9yRmlsdGVyaW5nLFxuICAgIHNldExvZ0xldmVsLFxuICAgIGdldExvZ0xldmVsLFxufTtcblxuLy8gS25vd24gbm9pc3kgZXJyb3IgcGF0dGVybnMgdG8gc3VwcHJlc3MgaW4gbG9nc1xuY29uc3QgRklMVEVSRURfRVJST1JfUEFUVEVSTlMgPSBbXG4gICAgXCJVbmFibGUgdG8gZG93bmxvYWRcIixcbiAgICBcIlVuYWJsZSB0byBkb3dubG9hZCBhbGwgc3BlY2lmaWVkIGltYWdlc1wiLFxuICAgIFwiQ2Fubm90IGFjY2Vzc1wiLFxuICAgIFwiYmVmb3JlIGluaXRpYWxpemF0aW9uXCIsXG4gICAgXCJFeHRlbnNpb24gY29udGV4dCBpbnZhbGlkYXRlZFwiLFxuICAgIFwiQ2FudmFzIGVycm9yXCIsXG4gICAgXCJOZXR3b3JrIGVycm9yXCIsXG5dO1xuXG5mdW5jdGlvbiBqb2luTWVzc2FnZShhcmdzKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGFyZ3NcbiAgICAgICAgICAgIC5tYXAoKHYpID0+ICh0eXBlb2YgdiA9PT0gXCJzdHJpbmdcIiA/IHYgOiAodiAmJiB2Lm1lc3NhZ2UpIHx8IEpTT04uc3RyaW5naWZ5KHYpKSlcbiAgICAgICAgICAgIC5qb2luKFwiIFwiKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIHJldHVybiBhcmdzLmpvaW4oXCIgXCIpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkge1xuICAgIGlmICghbWVzc2FnZSkgcmV0dXJuIGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBGSUxURVJFRF9FUlJPUl9QQVRURVJOUy5zb21lKChwYXR0ZXJuKSA9PiBtZXNzYWdlLmluY2x1ZGVzKHBhdHRlcm4pKSB8fFxuICAgICAgICAgICAgL0Nhbm5vdCBhY2Nlc3MgJy4qJyBiZWZvcmUgaW5pdGlhbGl6YXRpb24vLnRlc3QobWVzc2FnZSkgfHxcbiAgICAgICAgICAgIC9SZWZlcmVuY2VFcnJvci4qYmVmb3JlIGluaXRpYWxpemF0aW9uLy50ZXN0KG1lc3NhZ2UpIHx8XG4gICAgICAgICAgICAvVW5hYmxlIHRvIGRvd25sb2FkLippbWFnZXMvLnRlc3QobWVzc2FnZSlcbiAgICAgICAgKTtcbiAgICB9IGNhdGNoIChfKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbi8vIExvZyBsZXZlbDogJ2RlYnVnJyB8ICdpbmZvJyB8ICd3YXJuJyB8ICdlcnJvcicgfCAnc2lsZW50J1xuY29uc3QgTEVWRUxfT1JERVIgPSB7IGRlYnVnOiAxMCwgaW5mbzogMjAsIHdhcm46IDMwLCBlcnJvcjogNDAsIHNpbGVudDogOTAgfTtcbmxldCBjdXJyZW50TGV2ZWwgPVxuICAgIHR5cGVvZiBCVUlMRF9FTlYgIT09IFwidW5kZWZpbmVkXCIgJiYgQlVJTERfRU5WID09PSBcImRldmVsb3BtZW50XCIgPyBcImRlYnVnXCIgOiBcIndhcm5cIjtcblxuZnVuY3Rpb24gc2V0TG9nTGV2ZWwobGV2ZWwpIHtcbiAgICBpZiAoTEVWRUxfT1JERVJbbGV2ZWxdICE9IG51bGwpIGN1cnJlbnRMZXZlbCA9IGxldmVsO1xufVxuXG5mdW5jdGlvbiBnZXRMb2dMZXZlbCgpIHtcbiAgICByZXR1cm4gY3VycmVudExldmVsO1xufVxuXG5mdW5jdGlvbiBzaG91bGRFbWl0KGxldmVsKSB7XG4gICAgcmV0dXJuIExFVkVMX09SREVSW2xldmVsXSA+PSBMRVZFTF9PUkRFUltjdXJyZW50TGV2ZWxdO1xufVxuXG5mdW5jdGlvbiBsb2dJbmZvKC4uLmFyZ3MpIHtcbiAgICBpZiAoIXNob3VsZEVtaXQoXCJpbmZvXCIpKSByZXR1cm47XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmxvZyhcIltFZGdlVHJhbnNsYXRlXVwiLCAuLi5hcmdzKTtcbn1cblxuZnVuY3Rpb24gbG9nV2FybiguLi5hcmdzKSB7XG4gICAgaWYgKCFzaG91bGRFbWl0KFwid2FyblwiKSkgcmV0dXJuO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS53YXJuKFwiW0VkZ2VUcmFuc2xhdGVdXCIsIC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBsb2dFcnJvciguLi5hcmdzKSB7XG4gICAgaWYgKCFzaG91bGRFbWl0KFwiZXJyb3JcIikpIHJldHVybjtcbiAgICBjb25zdCBtZXNzYWdlID0gam9pbk1lc3NhZ2UoYXJncyk7XG4gICAgaWYgKHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpKSByZXR1cm47XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yKFwiW0VkZ2VUcmFuc2xhdGVdXCIsIC4uLmFyZ3MpO1xufVxuXG4vLyBPcHRpb25hbDogZ2xvYmFsbHkgd3JhcCBjb25zb2xlLmVycm9yIHRvIHN1cHByZXNzIG5vaXN5IGVycm9yc1xuZnVuY3Rpb24gd3JhcENvbnNvbGVGb3JGaWx0ZXJpbmcoKSB7XG4gICAgY29uc3Qgb3JpZ2luYWxDb25zb2xlRXJyb3IgPSBjb25zb2xlLmVycm9yO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1jb25zb2xlXG4gICAgY29uc29sZS5lcnJvciA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBqb2luTWVzc2FnZShhcmdzKTtcbiAgICAgICAgaWYgKCFzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSkge1xuICAgICAgICAgICAgb3JpZ2luYWxDb25zb2xlRXJyb3IuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgQlJPV1NFUl9MQU5HVUFHRVNfTUFQIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL2xhbmd1YWdlcy5qc1wiO1xuXG4vKipcbiAqIGRlZmF1bHQgc2V0dGluZ3MgZm9yIHRoaXMgZXh0ZW5zaW9uXG4gKi9cbmNvbnN0IERFRkFVTFRfU0VUVElOR1MgPSB7XG4gICAgYmxhY2tsaXN0OiB7XG4gICAgICAgIHVybHM6IHt9LFxuICAgICAgICBkb21haW5zOiB7IFwiY2hyb21lLmdvb2dsZS5jb21cIjogdHJ1ZSwgZXh0ZW5zaW9uczogdHJ1ZSB9LFxuICAgIH0sXG4gICAgLy8gUmVzaXplOiBkZXRlcm1pbmUgd2hldGhlciB0aGUgd2ViIHBhZ2Ugd2lsbCByZXNpemUgd2hlbiBzaG93aW5nIHRyYW5zbGF0aW9uIHJlc3VsdFxuICAgIC8vIFJUTDogZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHRleHQgaW4gdHJhbnNsYXRpb24gYmxvY2sgc2hvdWxkIGRpc3BsYXkgZnJvbSByaWdodCB0byBsZWZ0XG4gICAgLy8gRm9sZExvbmdDb250ZW50OiBkZXRlcm1pbmUgd2hldGhlciB0byBmb2xkIGxvbmcgdHJhbnNsYXRpb24gY29udGVudFxuICAgIC8vIFNlbGVjdFRyYW5zbGF0ZVBvc2l0aW9uOiB0aGUgcG9zaXRpb24gb2Ygc2VsZWN0IHRyYW5zbGF0ZSBidXR0b24uXG4gICAgTGF5b3V0U2V0dGluZ3M6IHtcbiAgICAgICAgUmVzaXplOiBmYWxzZSxcbiAgICAgICAgUlRMOiBmYWxzZSxcbiAgICAgICAgRm9sZExvbmdDb250ZW50OiB0cnVlLFxuICAgICAgICBTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbjogXCJUb3BSaWdodFwiLFxuICAgIH0sXG4gICAgLy8gRGVmYXVsdCBzZXR0aW5ncyBvZiBzb3VyY2UgbGFuZ3VhZ2UgYW5kIHRhcmdldCBsYW5ndWFnZVxuICAgIGxhbmd1YWdlU2V0dGluZzogeyBzbDogXCJhdXRvXCIsIHRsOiBCUk9XU0VSX0xBTkdVQUdFU19NQVBbY2hyb21lLmkxOG4uZ2V0VUlMYW5ndWFnZSgpXSB9LFxuICAgIE90aGVyU2V0dGluZ3M6IHtcbiAgICAgICAgTXV0dWFsVHJhbnNsYXRlOiBmYWxzZSxcbiAgICAgICAgU2VsZWN0VHJhbnNsYXRlOiB0cnVlLFxuICAgICAgICBUcmFuc2xhdGVBZnRlckRibENsaWNrOiBmYWxzZSxcbiAgICAgICAgVHJhbnNsYXRlQWZ0ZXJTZWxlY3Q6IGZhbHNlLFxuICAgICAgICBDYW5jZWxUZXh0U2VsZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgVXNlR29vZ2xlQW5hbHl0aWNzOiB0cnVlLFxuICAgIH0sXG4gICAgRGVmYXVsdFRyYW5zbGF0b3I6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgRGVmYXVsdFBhZ2VUcmFuc2xhdG9yOiBcIkdvb2dsZVBhZ2VUcmFuc2xhdGVcIixcbiAgICBIeWJyaWRUcmFuc2xhdG9yQ29uZmlnOiB7XG4gICAgICAgIC8vIFRoZSB0cmFuc2xhdG9ycyB1c2VkIGluIGN1cnJlbnQgaHlicmlkIHRyYW5zbGF0ZS5cbiAgICAgICAgdHJhbnNsYXRvcnM6IFtcIkJpbmdUcmFuc2xhdGVcIiwgXCJHb29nbGVUcmFuc2xhdGVcIl0sXG5cbiAgICAgICAgLy8gVGhlIHRyYW5zbGF0b3JzIGZvciBlYWNoIGl0ZW0uXG4gICAgICAgIHNlbGVjdGlvbnM6IHtcbiAgICAgICAgICAgIC8vIEFUVEVOVElPTjogVGhlIGZvbGxvd2luZyBmb3VyIGl0ZW1zIE1VU1QgSEFWRSBUSEUgU0FNRSBUUkFOU0xBVE9SIVxuICAgICAgICAgICAgb3JpZ2luYWxUZXh0OiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgbWFpbk1lYW5pbmc6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICB0UHJvbnVuY2lhdGlvbjogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIHNQcm9udW5jaWF0aW9uOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuXG4gICAgICAgICAgICAvLyBGb3IgdGhlIGZvbGxvd2luZyB0aHJlZSBpdGVtcywgYW55IHRyYW5zbGF0b3IgY29tYmluYXRpb24gaXMgT0suXG4gICAgICAgICAgICBkZXRhaWxlZE1lYW5pbmdzOiBcIkJpbmdUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIGRlZmluaXRpb25zOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgZXhhbXBsZXM6IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBEZWZpbmVzIHdoaWNoIGNvbnRlbnRzIGluIHRoZSB0cmFuc2xhdGluZyByZXN1bHQgc2hvdWxkIGJlIGRpc3BsYXllZC5cbiAgICBUcmFuc2xhdGVSZXN1bHRGaWx0ZXI6IHtcbiAgICAgICAgbWFpbk1lYW5pbmc6IHRydWUsXG4gICAgICAgIG9yaWdpbmFsVGV4dDogdHJ1ZSxcbiAgICAgICAgdFByb251bmNpYXRpb246IHRydWUsXG4gICAgICAgIHNQcm9udW5jaWF0aW9uOiB0cnVlLFxuICAgICAgICB0UHJvbnVuY2lhdGlvbkljb246IHRydWUsXG4gICAgICAgIHNQcm9udW5jaWF0aW9uSWNvbjogdHJ1ZSxcbiAgICAgICAgZGV0YWlsZWRNZWFuaW5nczogdHJ1ZSxcbiAgICAgICAgZGVmaW5pdGlvbnM6IHRydWUsXG4gICAgICAgIGV4YW1wbGVzOiB0cnVlLFxuICAgIH0sXG4gICAgLy8gRGVmaW5lcyB0aGUgb3JkZXIgb2YgZGlzcGxheWluZyBjb250ZW50cy5cbiAgICBDb250ZW50RGlzcGxheU9yZGVyOiBbXG4gICAgICAgIFwibWFpbk1lYW5pbmdcIixcbiAgICAgICAgXCJvcmlnaW5hbFRleHRcIixcbiAgICAgICAgXCJkZXRhaWxlZE1lYW5pbmdzXCIsXG4gICAgICAgIFwiZGVmaW5pdGlvbnNcIixcbiAgICAgICAgXCJleGFtcGxlc1wiLFxuICAgIF0sXG4gICAgSGlkZVBhZ2VUcmFuc2xhdG9yQmFubmVyOiBmYWxzZSxcbn07XG5cbi8qKlxuICogYXNzaWduIGRlZmF1bHQgdmFsdWUgdG8gc2V0dGluZ3Mgd2hpY2ggYXJlIHVuZGVmaW5lZCBpbiByZWN1cnNpdmUgd2F5XG4gKiBAcGFyYW0geyp9IHJlc3VsdCBzZXR0aW5nIHJlc3VsdCBzdG9yZWQgaW4gY2hyb21lLnN0b3JhZ2VcbiAqIEBwYXJhbSB7Kn0gc2V0dGluZ3MgZGVmYXVsdCBzZXR0aW5nc1xuICovXG5mdW5jdGlvbiBzZXREZWZhdWx0U2V0dGluZ3MocmVzdWx0LCBzZXR0aW5ncykge1xuICAgIGZvciAobGV0IGkgaW4gc2V0dGluZ3MpIHtcbiAgICAgICAgLy8gc2V0dGluZ3NbaV0gY29udGFpbnMga2V5LXZhbHVlIHNldHRpbmdzXG4gICAgICAgIGlmIChcbiAgICAgICAgICAgIHR5cGVvZiBzZXR0aW5nc1tpXSA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICAgICAgIShzZXR0aW5nc1tpXSBpbnN0YW5jZW9mIEFycmF5KSAmJlxuICAgICAgICAgICAgT2JqZWN0LmtleXMoc2V0dGluZ3NbaV0pLmxlbmd0aCA+IDBcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBpZiAocmVzdWx0W2ldKSB7XG4gICAgICAgICAgICAgICAgc2V0RGVmYXVsdFNldHRpbmdzKHJlc3VsdFtpXSwgc2V0dGluZ3NbaV0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBzZXR0aW5nc1tpXSBjb250YWlucyBzZXZlcmFsIHNldHRpbmcgaXRlbXMgYnV0IHRoZXNlIGhhdmUgbm90IGJlZW4gc2V0IGJlZm9yZVxuICAgICAgICAgICAgICAgIHJlc3VsdFtpXSA9IHNldHRpbmdzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdFtpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBzZXR0aW5nc1tpXSBpcyBhIHNpbmdsZSBzZXR0aW5nIGl0ZW0gYW5kIGl0IGhhcyBub3QgYmVlbiBzZXQgYmVmb3JlXG4gICAgICAgICAgICByZXN1bHRbaV0gPSBzZXR0aW5nc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLyoqXG4gKiBHZXQgc2V0dGluZ3MgZnJvbSBzdG9yYWdlLiBJZiBzb21lIG9mIHRoZSBzZXR0aW5ncyBoYXZlIG5vdCBiZWVuIGluaXRpYWxpemVkLFxuICogaW5pdGlhbGl6ZSB0aGVtIHdpdGggdGhlIGdpdmVuIGRlZmF1bHQgdmFsdWVzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nIHwgQXJyYXk8U3RyaW5nPn0gc2V0dGluZ3Mgc2V0dGluZyBuYW1lIHRvIGdldFxuICogQHBhcmFtIHtPYmplY3QgfCBGdW5jdGlvbn0gZGVmYXVsdHMgZGVmYXVsdCB2YWx1ZXMgb3IgZnVuY3Rpb24gdG8gZ2VuZXJhdGUgZGVmYXVsdCB2YWx1ZXNcbiAqIEByZXR1cm5zIHtQcm9taXNlPEFueT59IHNldHRpbmdzXG4gKi9cbmZ1bmN0aW9uIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzKHNldHRpbmdzLCBkZWZhdWx0cykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBvbmx5IG9uZSBzZXR0aW5nIHRvIGdldCwgd2FycCBpdCB1cC5cbiAgICAgICAgaWYgKHR5cGVvZiBzZXR0aW5ncyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgc2V0dGluZ3MgPSBbc2V0dGluZ3NdO1xuICAgICAgICB9IGVsc2UgaWYgKHNldHRpbmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIElmIHNldHRpbmdzIGlzIHVuZGVmaW5lZCwgY29sbGVjdCBhbGwgc2V0dGluZyBrZXlzIGluIGRlZmF1bHRzLlxuICAgICAgICAgICAgc2V0dGluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBkZWZhdWx0cykge1xuICAgICAgICAgICAgICAgIHNldHRpbmdzLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuZ2V0KHNldHRpbmdzLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICBsZXQgdXBkYXRlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBzZXR0aW5nIG9mIHNldHRpbmdzKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFyZXN1bHRbc2V0dGluZ10pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBkZWZhdWx0cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0cyA9IGRlZmF1bHRzKHNldHRpbmdzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHRbc2V0dGluZ10gPSBkZWZhdWx0c1tzZXR0aW5nXTtcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodXBkYXRlZCkge1xuICAgICAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHJlc3VsdCwgKCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgc2V0RGVmYXVsdFNldHRpbmdzLCBnZXRPclNldERlZmF1bHRTZXR0aW5ncyB9O1xuIiwiLyoqXG4gKiBkZXRlY3QgdXNlcnMgc2VsZWN0IGFjdGlvbiBhbmQgdGFrZSBhY3Rpb24gYWZ0ZXIgdGhlIGRldGVjdGlvblxuICogVGhpcyBmdW5jdGlvbiBuZWVkIHRvIGJlIGNhbGxlZCBpbiB0aGUgbW91c2UgZG93biBsaXN0ZW5lclxuICogQHBhcmFtIHtOb2RlfSB0YXJnZXRFbGVtZW50IHRhcmdldCBlbGVtZW50IHRvIGJlIGRldGVjdGVkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY3Rpb25BZnRlclNlbGVjdCB0YWtlIHRoaXMgYWN0aW9uIGFmdGVyIHRoZSBzZWxlY3QgYWN0aW9uIGRldGVjdGVkXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY3Rpb25BZnRlck5vdFNlbGVjdCB0YWtlIHRoaXMgYWN0aW9uIGlmIGl0J3Mgbm90IHNlbGVjdCBhY3Rpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdFNlbGVjdCh0YXJnZXRFbGVtZW50LCBhY3Rpb25BZnRlclNlbGVjdCwgYWN0aW9uQWZ0ZXJOb3RTZWxlY3QpIHtcbiAgICAvLyBSZW1lbWJlciB3aGV0aGVyIG1vdXNlIG1vdmVkLlxuICAgIGxldCBtb3ZlZCA9IGZhbHNlO1xuXG4gICAgLy8gaW5uZXIgbGlzdGVuZXIgZm9yIGRldGVjdGluZyBtb3VzZW1vdmUgYW5kIG1vdXNldXAuXG4gICAgY29uc3QgZGV0ZWN0TW91c2VNb3ZlID0gKCkgPT4ge1xuICAgICAgICBtb3ZlZCA9IHRydWU7XG4gICAgfTtcblxuICAgIGNvbnN0IGRldGVjdE1vdXNlVXAgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgLy8gc2VsZWN0IGFjdGlvbiBkZXRlY3RlZFxuICAgICAgICBpZiAobW92ZWQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYWN0aW9uQWZ0ZXJTZWxlY3QgPT09IFwiZnVuY3Rpb25cIikgYWN0aW9uQWZ0ZXJTZWxlY3QoZXZlbnQpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBhY3Rpb25BZnRlck5vdFNlbGVjdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAvLyBzZWxlY3QgYWN0aW9uIGlzbid0IGRldGVjdGVkXG4gICAgICAgICAgICBhY3Rpb25BZnRlck5vdFNlbGVjdChldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlIGlubmVyIGV2ZW50IGxpc3RlbmVycy5cbiAgICAgICAgdGFyZ2V0RWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIGRldGVjdE1vdXNlTW92ZSk7XG4gICAgICAgIHRhcmdldEVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1vdXNldXBcIiwgZGV0ZWN0TW91c2VVcCk7XG4gICAgfTtcblxuICAgIC8vIGFkZCBpbm5lciBldmVudCBsaXN0ZW5lcnNcbiAgICB0YXJnZXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW1vdmVcIiwgZGV0ZWN0TW91c2VNb3ZlKTtcbiAgICB0YXJnZXRFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIGRldGVjdE1vdXNlVXApO1xufVxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJpbXBvcnQgeyBnZXREb21haW4gfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzXCI7XG5pbXBvcnQgeyBkZXRlY3RTZWxlY3QgfSBmcm9tIFwiLi4vY29tbW9uLmpzXCI7XG5pbXBvcnQgQ2hhbm5lbCBmcm9tIFwiY29tbW9uL3NjcmlwdHMvY2hhbm5lbC5qc1wiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvc2V0dGluZ3MuanNcIjtcblxuLyoqXG4gKiBTZWxlY3QgQ29udGVudCBTY3JpcHQg7Jik66WYIO2VhO2EsOungVxuICovXG5jb25zdCBGSUxURVJFRF9FUlJPUl9QQVRURVJOUyA9IFtcbiAgICBcIlVuYWJsZSB0byBkb3dubG9hZFwiLFxuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkIGFsbCBzcGVjaWZpZWQgaW1hZ2VzXCIsXG4gICAgXCJDYW5ub3QgYWNjZXNzXCIsXG4gICAgXCJiZWZvcmUgaW5pdGlhbGl6YXRpb25cIixcbiAgICBcIkV4dGVuc2lvbiBjb250ZXh0IGludmFsaWRhdGVkXCIsXG4gICAgXCJDYW52YXMgZXJyb3JcIixcbiAgICBcIk5ldHdvcmsgZXJyb3JcIixcbl07XG5cbmZ1bmN0aW9uIHNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBGSUxURVJFRF9FUlJPUl9QQVRURVJOUy5zb21lKChwYXR0ZXJuKSA9PiBtZXNzYWdlLmluY2x1ZGVzKHBhdHRlcm4pKSB8fFxuICAgICAgICAvQ2Fubm90IGFjY2VzcyAnLionIGJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAvUmVmZXJlbmNlRXJyb3IuKmJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAvVW5hYmxlIHRvIGRvd25sb2FkLippbWFnZXMvLnRlc3QobWVzc2FnZSkgfHxcbiAgICAgICAgL1VuYWJsZSB0byBkb3dubG9hZCBhbGwgc3BlY2lmaWVkIGltYWdlcy8udGVzdChtZXNzYWdlKVxuICAgICk7XG59XG5cbmNvbnN0IG9yaWdpbmFsQ29uc29sZUVycm9yID0gY29uc29sZS5lcnJvcjtcbmNvbnNvbGUuZXJyb3IgPSBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBhcmdzLmpvaW4oXCIgXCIpO1xuICAgIGlmICghc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkpIHtcbiAgICAgICAgb3JpZ2luYWxDb25zb2xlRXJyb3IuYXBwbHkoY29uc29sZSwgYXJncyk7XG4gICAgfVxufTtcblxuY29uc3QgSW1hZ2VEYXRhID1cbiAgICBcImRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBREFBQUFBd0NBWUFBQUJYQXZtSEFBQUFCR2RCVFVFQUFMR1BDL3hoQlFBQUFDQmpTRkpOQUFCNkpnQUFnSVFBQVBvQUFBQ0E2QUFBZFRBQUFPcGdBQUE2bUFBQUYzQ2N1bEU4QUFBQUJtSkxSMFFBQUFBQUFBRDVRN3QvQUFBQUNYQklXWE1BRWdXdUFCSUZyZ0ZwaXJOVEFBQU1JVWxFUVZSbzNzMVplNVJWMVhuLy9iNTk3bU11dy9DWUVSRXdSaENWQ2lzaWFuMVEzam9RUVJFaGxqU0tyY3RYS0lscGlISEZCOXFvWFRZcm1pd2EyckFxcVVnYVJGRUJRU0FJVXRLRktDaEZDTStnQ3dHRmdqQU1NM1B2T1dmdnIzL3MrMktjUVl4RDlidnIzSHZ1ZnAzdjk3MzIvcjREbkRMMVlmbS9CMys3L2x0M05PclhUbjMrVjRpbS9OdVNwemVyMHo0dlI5MitiRjQrTjQxN2VPR1RyMlJWYjErbCs3NXNYazZWaXFZejRmNVZjMzYyVC9XYTUxUnIvME8zOTN6d2NPckxaaTQ0QmViMTRsdGVyTHo2MnplOUpoa01mUFVWYUFwZ3B4b1lHN2ZUcnlJQUFpZ3dwb01mWEhsbTcrRkRWeHl0UTk4OWYxU2tKTlpVeHJDeVNwelp2UEFMUGw0SjhBc0o0YVFhdU9HWGY3ajByTXV2WHZ6aFJuU0pHaVBOU0t3V0luR1dxTzRpcUlybVNzc3pGK2ZOVGdDTUttTndHUUVEWUVTKzdhTVc1cjVPWUF1QWVnQVBmQ1k0dHRaeDMrSVBhdzhuZWl6YS8wZVhFSW1kVmFXelNxZHc2V1JTemgvZ3RqOTFWZUxDTDZpQ0wwd2xBRlVkaVdOSEZRQytPKytUVzcvZXY5T3ppeGNBbVVSb0FSaDFnTUpCRlM1SUpLVmRGZmZwd2RXM2MvOTYwM3ZBR0xRLzl3TE5ObVFaTlJ5RkNRUUU2WnlERGVzSkNwd0N4cVFZaFExSVZuYkV3ZDNiVUhmZ1BYWTkveEoxY1lxSUk0Uk45VWhsS3RGVTE4VHFjL3BIN2M3dW1FMm1nQTVHTldWczV0MnRqVnVuVCtpdys2UWFxSjAwZmRyZ3FaTWZXYnFDU0NLMlJweWhBbEF0VTZlQlljQ3Yvd1ZRbVFKeWRRQk55WEZZdGpvSnFQcSt3Z1VIbUNRZ0JyQ2hIME1BRk45SEFhSUlVQWN3QkZJR3FHNnZlUGRQUjJiTXZiTjY4dWpwKy9ucWxHNEtOUE9CbTJadm50RzN6MFgzckZvTGFEYTJwc0laT0VDaEpWY2pRRHBhamJCOUUyRVI1Qm1QUVlybkpzOG95K0JvMlhkenVUVjNZeElBTFFnSGRVU2tCajJxaVQwZkgyc0VnTENwcmpqV0F6ampFdjdxNEliZmQ2ckQ4S2VlZ2FZanA1a0tOYW9DNGdUeGswbzRlS21TemdVSVN4TDJkbGJpVzB0UUNPVFhhZzZBNVhkS2V2NzlBNmtVMEZpbm1hU1I0OGNhTEFEUTVZcXJDekNlYVBnQTYzNjkvT1VESVpBV01FZ0pMY1d2Q1Bob2Q4S3Q3eExtUCtKL1dUQUdCZUZZR09VbmFlRmVQSnRnL2dNSUNDRmdoQ0tFdnljb2hBaVVoRklJMk5qbUFFQmRYSzZCRnhXTndPeTdhMy8xOFo1ZmJyNWd5UGNXN1hzZjdadU9HU2VCa29nTE1peWdKZ0dsa0VRQUVwQzg1UWk5dVJVc3JZQzZYTzRLZXUyVmFVb1ZjSzRnSVVjZkxJcWFwM1g1eVU1RG5LREpaajZ3L0ludnIrNjlQWHZab0IvY3Q2eHhMODdaK3dFMW1UQnF4RkpWeTBCUVRSQ3c1bXpZVkJvMlFOSDhhVUJWZ2l5ekdmV2FZOEU5VkNFQURBRVZCenFGV2d1NkNISERjUWtPZnd5Tm5GVlFCWG5RM3F5Y0YwcVp6elRmeUxoei9vKzNPMVJlWFB2RDc2NnNxVUgvZDk4UkZVZE5Cd1VRUUxxZGtXUVE3OTQ0KzlHUllmM2VVRzIzaE9vRnFrRjNRWkRPUDgvQ3h4RUlvQTV4SkxDTklBNDU0RkJBMWdWa0hVVkRWY1QweWxPYjZUVzI0MW1YalYzRUxLckRNTlp5ZDFHbnJ0eU1Xd0tnQU15ZjVrOCsrdS9yUHJoeTlLUzdGbDR6dHRlMUs5WlFHM09pNlZSTU9DS1pJbEtKYkxoeC9tTTcwY1prZG1jNGR2aFlaMFNZeThHQkVKUkNnd0tBTFlQVjBsSEFBcEJ3Nzg5eUx6MStYdTNtMzYyWlBYNGtHRlNJMURjRnpsSm9zNHFnUTZWMG5maGFzczA0Rjg5TDM1c2VPcXU2QWhKbUhjQlNoRlV0aWQ2VnliMlZzd3djY0tFQXdBdFBEWnIwMXJ6TlQ5NDhCS2lvRUdrSWphTWhYRDFVZW81c085RTdPQURJZEQyTFFUMFVxbkNxZVovek1HemtyZi9NczNzVXZVQmFYM0diQXhJRWdOOCswdS8rcFM5OU5QWDZzVUFxZ0VRV1NCb0VtZkJ3MndISUUySFYwZ2RhZUllbloxUVJXNCtrcXFhbWRRMzBIRG5GbFA1RlJhUUxIdTMyODQxTFY0NGZlUjJRaTRDbUNEa3lhUE44b0VPTlNWcEZKNldCaUJSMlNCcHhzTTU1VFpROTlWTUE3cnAzYW5MeHJycmZkSjJ5cC9jSmdnRXcrNTdoOC85bjhaeGhnNjREZW5URytSMDdwbTFiQTNqL3Y5OCttazNpVUNvRGlERk9xVjROcXJDeHRRQmd5N2orRklBZmp6eW42WXBlVmJlTTZGZnpCakRpVTRlOWVWTnZXYlYzMmRKcnh0VmkzOFhuSmR1OEtyRnQ1dVZITnkxZk1MS2lHNDRsMG1Kb0FnY2huQUp4NU1lNHN2RXQrc0NVZVhqajhoRVYzWVkvL1BMcithYlMyUXpBakx0SHJaajIwSnQ5TmgvQWtVTGJSUStFcmVZV241YzJ6Unk3YWV1U3VZTzc5ME11R1JpUmhIRTBRR1FsVVdEbXBBQVl3YXo4TDJEZ3BNcWhnMyt3Y2tVQkJGa0M4ZHBqVnphdG5TTEZZK0dXeDVOdDZROWM5L1RFamJ1V3pCdlM4ekxZZE5LSW9VS2RNUURnRkNlUFFoMHJZR3hPOGZvU0YvM2xIVU9IWC92RERVc0FRUFZFVGJRVkRidER5d0pIOFJ6TEZUKzkrYzB0QytaY2M5NmxRSk1OOEVuVysxejVUdHdpZ01CQnE5SUt6Vm11ZUEwNmFQSWxvMnAvdEdrUjBDdndpL2RwVXhDanY0WE8wOS9VWjNyZTluWjNsTXhWQVdEVjQ3ZXMyckgwZDlkK3M1WVlmR1gzTGdEUVB2MFpBRlNSRUtmSXBKU0pPSXNscjBLSDN0dHY5RGZHVFB4WFAySnJtNGJQOTNibFBtbW8wMXV2bW5qcGhnNS9NNzhqVGpSenJKajI3ZDhmMjc1eDJ0K042UkFEd015aFBMa0pVU0VLQWxhMU1nMUc5VG51MkFYMDZEZXNiMXN5WHFEZjNKTzJ1dy9xSDg1b3dKa0QvM3JjaHY3MzdUaTMrWmpicnVqL2owL3MxNTgwYjI4WkFQMUJXRlVKQjIyZmdkWWZCajdjdzdiZmV2TlVuNlZwQ0lIZ0k5ZXpYMjN2dDBjOHVxUi9PVXNBc1AyYkVwMFNBQ2tsc2o1MVVtb1FBR0RVNWc1Y29Gako0MDBPWVRhMEI3ZTU2ajZqUnEyN2RkNkdvZm51VmsyMlpRQlNoSzM1bElwSUFDWTRmdG9BSkdzZ3NjOFU2ZUpRMzF2akVyMnZ1bVRsalRQWDMzeXllUzBmNWdoUjV6TXdud0lWNmg2SFRsc3QxQ1hnSEFUcW9BSlFOWExMbjNlNGNzaUF1ZGM5K3RLOXBaSEJDVUpzR1lBQXJzU3FVdFhuZG1IRGFmT0JJL3ZDNDB3aVh4Q0FWZ1FRRjBWdThUTGd1a2szUGozdWU3OTR6SStNVmNyMm90WnFvd1FBRXFwS0VRUFdmUVR0UG1EQ0lGdS9aMFo4dkFHNWhyUW1xcnFwTVVMU1FHRGduRi9jR0FPb1ZkSTZkYkdONGlhcVJveHRFd3dCQ21HakhBaURvRjBGd3ZqczJOYkYvY0lnVUpDRUFrNVYyMWRRNnVwRE4zdFJVcjR6OWZzUEJKS3VtZmVMdSs5MlpUN1JvazMvdzBKOVovOEIxLzlvUTJ5dHdnZ0lHeHZObkNHczZnSm9QaGFRWHFINUFrcFozY0pmSWkyb21JQXQ0OEFDQ0VQZzZGNkhPSXpVU0xHU1J3ZXFDRkRYSkdyVGdVd1lEYncxKzkzRkwwNy81ekU0TWxkYkJUQmxxYTQvK0tFT3FHdUluRlVJMWRjanJBTE9paW9Vem1jYVdnQlNXS2hZVklHeUxKNlY3TEVJMS85UWZUbEdhQ2wwb0k4YkRuNDc4dkl3WUYwV3Fva0UrMzBET0hBRUd3Njh2Ly9PdDZkMmY2ZEZId2dUWGtyTytucU4wN3pVVkVIR0ZGb214REVRbFVCVUFxcVlFeTRuaGtvampvYU9CdjRTT0FhME5JejlMeXdGTVlnWVVBZFZxRk1xaXRWR3pXdE10VU9HekRWcHZHTXJNSGtjQnZTOXROdU5yZm9BRlF3dGtZc0NGenVGZU5NbzVLWkZZWmN5djJMaVdwUjNvWnFxSUxYWVR4WXJTOHdYZlFRcUJJMVlNU3lkOUF1UEpBQVI0WkY2eEYvcmhtRE1RT0M1ZjlueXlQTS9uL1pUQUd3UndKQXVPRytMQXo1cGtNQmFiOHRCWHQxaENCZ0JUTUliaVN1VTNzcnJOd1RvNEN2TlpZRlhOVjloekUvUkFNZ0ZRTTRDUi9ZR0NCdGpEUUxIb2tEeXRic3doSzNLbU9ENkVjU2NoeGZldFhyV0RUUDlpcFhTSW9EL1hMVC9uL1lmcXV0eGNPZjdVY0pFY2FKZFJrd2lVd0VOVEVWMVo2ZEtaQThmZy9ORmYxQUlkZjZrcStxSU9GWUdBcEFLNTZBa1RFS1VKT0xJNytiSmRFb0RVYzN1M1lvNEpIcU52bWxzdTA3SjdybDZYMDdNMXlhcEVHdXRNZU1tTWxvMWQvV0UxYk51V09DNS9Dc0JEdWxwMjFrL0wxMzl3T0VGdlM3cmZQM0h1ME1IcWlpcHBEZ0pBblBSRldnOHRQYlZ3Yy8rL1pqMWZ2VHRCSjc1OVB1QmNycnJKYVVtL09sSERWVG9YMks0T0I4dVU4Q3NzbVB0YlN1MXpQNkJaNGRSYjF2bTI2U1plYVV6d05ZUFlyd3greTFnMmRVS0FEWG5kK3BrR3dDbFU2akFLVFZURlppdUYrTGdqaVd2REZuMDBJMWI4MUNMekFPbklidjZjK2s3TCt1YTNHRTM4RWg5RkZ0RjBMbExDb2xxYk51MWFGYnQraG0zNzhHSmIwK0w5Rm52aVZ1bDhTOG9YNXpROGl2UzhTK1V0TkhhbU9hVU93S1RqUWtWbUhON3BwQXpXTHY4aWZ0SC9PK2FKeHZ6UTc3MGQ5SW5wVEV6ZGUzZnpsT2R1a1oxd25PNnVHYmdFd1VoZkdXczVLVDBvMWQwNTYrM3FGNTE1N3JaWmMzbXoxN3cvNVB1bmFVeVo0dnVIUGFUTGM5L1h1Yi9ENjFQckM5ZkNkUVlBQUFBQUVsRlRrU3VRbUNDXCI7XG5cbi8vIENvbW11bmljYXRpb24gY2hhbm5lbC5cbmNvbnN0IGNoYW5uZWwgPSBuZXcgQ2hhbm5lbCgpO1xuXG4vLyB0byBpbmRpY2F0ZSB3aGV0aGVyIHRoZSB0cmFuc2xhdGlvbiBidXR0b24gaGFzIGJlZW4gc2hvd25cbmxldCBIYXNCdXR0b25TaG93biA9IGZhbHNlO1xuXG4vKipcbiAqIEluaXRpYXRlIHRyYW5zbGF0aW9uIGJ1dHRvbi5cbiAqL1xubGV0IHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImlmcmFtZVwiKTtcbmNvbnN0IGlmcmFtZUNvbnRhaW5lciA9IHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyO1xuLy8gTm90ZTogc29tZSB3ZWJzaXRlcyBjYW4ndCBnZXQgY29udGVudERvY3VtZW50IGUuZy4gaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2dpdC9naXQvbWFzdGVyL0RvY3VtZW50YXRpb24vUmVsTm90ZXMvMi40MC4wLnR4dC4gU28gSSB1c2Ugc2hhZG93IERPTSBhcyBhIGZhbGxiYWNrLlxuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyKTtcbmlmICh0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5jb250ZW50RG9jdW1lbnQgPT09IG51bGwpIHtcbiAgICB0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgcmVuZGVyQnV0dG9uKCk7XG59XG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoaWZyYW1lQ29udGFpbmVyKTtcbnRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyLmlkID0gXCJlZGdlLXRyYW5zbGF0ZS1idXR0b25cIjtcbnRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyLnN0eWxlLmJhY2tncm91bmRDb2xvciA9IFwid2hpdGVcIjsgLy8gcHJvZ3JhbWF0aWNhbGx5IHNldCBzdHlsZSB0byBjb21wYXRpYmxlIHdpdGggdGhlIGV4dGVuc2lvbiAnRGFyayBSZWFkZXInXG5cbi8qKlxuICogV2hlbiB0aGUgdXNlciBjbGlja3MgdGhlIHRyYW5zbGF0aW9uIGJ1dHRvbiwgdGhlIHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyIHdpbGwgYmUgbW91bnRlZCBhdCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQgYW5kIHRoZSBsb2FkIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkLlxuICovXG5mdW5jdGlvbiByZW5kZXJCdXR0b24oKSB7XG4gICAgY29uc3QgYnV0dG9uSW1hZ2UgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgIGJ1dHRvbkltYWdlLnNyYyA9IEltYWdlRGF0YTtcbiAgICBjb25zdCBCVVRUT05fU0laRSA9IFwiMjBweFwiO1xuICAgIE9iamVjdC5hc3NpZ24oYnV0dG9uSW1hZ2Uuc3R5bGUsIHtcbiAgICAgICAgd2lkdGg6IEJVVFRPTl9TSVpFLFxuICAgICAgICBoZWlnaHQ6IEJVVFRPTl9TSVpFLFxuICAgICAgICBtaW5XaWR0aDogMCxcbiAgICAgICAgbWF4V2lkdGg6IEJVVFRPTl9TSVpFLFxuICAgICAgICBtaW5IZWlnaHQ6IDAsXG4gICAgICAgIG1heEhlaWdodDogQlVUVE9OX1NJWkUsXG4gICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgIGJvcmRlcjogMCxcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICB2ZXJ0aWNhbEFsaWduOiAwLCAvLyBmaXggdGhlIHN0eWxlIHByb2JsZW0gaW4gc29tZSB3ZWJzaXRlc1xuICAgICAgICBmaWx0ZXI6IFwibm9uZVwiLCAvLyBodHRwczovL2dpdGh1Yi5jb20vRWRnZVRyYW5zbGF0ZS9FZGdlVHJhbnNsYXRlL3Byb2plY3RzLzIjY2FyZC01ODgxNzYyNlxuICAgIH0pO1xuICAgIGNvbnN0IHRyYW5zbGF0aW9uQnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBPYmplY3QuYXNzaWduKHRyYW5zbGF0aW9uQnV0dG9uLnN0eWxlLCB7XG4gICAgICAgIHdpZHRoOiBCVVRUT05fU0laRSxcbiAgICAgICAgaGVpZ2h0OiBCVVRUT05fU0laRSxcbiAgICAgICAgcGFkZGluZzogXCI2cHhcIixcbiAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiNTAlXCIsXG4gICAgICAgIGJveFNpemluZzogXCJjb250ZW50LWJveFwiLFxuICAgICAgICBvdmVyZmxvdzogXCJoaWRkZW5cIixcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgY3Vyc29yOiBcInBvaW50ZXJcIixcbiAgICB9KTtcbiAgICB0cmFuc2xhdGlvbkJ1dHRvbi5hcHBlbmRDaGlsZChidXR0b25JbWFnZSk7XG4gICAgZ2V0SW5uZXJQYXJlbnQodHJhbnNsYXRpb25CdXR0b25Db250YWluZXIpLmFwcGVuZENoaWxkKHRyYW5zbGF0aW9uQnV0dG9uKTtcblxuICAgIGNvbnN0IENsZWFuU3R5bGUgPSB7XG4gICAgICAgIHBhZGRpbmc6IDAsXG4gICAgICAgIG1hcmdpbjogMCxcbiAgICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgICAgb3ZlcmZsb3c6IFwiaGlkZGVuXCIsXG4gICAgfTtcbiAgICBPYmplY3QuYXNzaWduKFxuICAgICAgICB0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5jb250ZW50RG9jdW1lbnQ/LmRvY3VtZW50RWxlbWVudC5zdHlsZSB8fCB7fSxcbiAgICAgICAgQ2xlYW5TdHlsZVxuICAgICk7XG4gICAgT2JqZWN0LmFzc2lnbih0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5jb250ZW50RG9jdW1lbnQ/LmJvZHkuc3R5bGUgfHwge30sIENsZWFuU3R5bGUpO1xuICAgIHRyYW5zbGF0aW9uQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgYnV0dG9uQ2xpY2tIYW5kbGVyKTtcbiAgICB0cmFuc2xhdGlvbkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgKGUpID0+IGUucHJldmVudERlZmF1bHQoKSk7XG59XG50cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCByZW5kZXJCdXR0b24pO1xuXG5sZXQgb3JpZ2luU2Nyb2xsWCA9IDA7IC8vIHJlY29yZCB0aGUgb3JpZ2luYWwgc2Nyb2xsIFggcG9zaXRpb24oYmVmb3JlIHNjcm9sbCBldmVudClcbmxldCBvcmlnaW5TY3JvbGxZID0gMDsgLy8gcmVjb3JkIHRoZSBvcmlnaW5hbCBzY3JvbGwgWSBwb3NpdGlvbihiZWZvcmUgc2Nyb2xsIGV2ZW50KVxubGV0IG9yaWdpblBvc2l0aW9uWCA9IDA7IC8vIHJlY29yZCB0aGUgb3JpZ2luYWwgWCBwb3NpdGlvbiBvZiBzZWxlY3Rpb24gaWNvbihiZWZvcmUgc2Nyb2xsIGV2ZW50KVxubGV0IG9yaWdpblBvc2l0aW9uWSA9IDA7IC8vIHJlY29yZCB0aGUgb3JpZ2luYWwgWSBwb3NpdGlvbiBvZiBzZWxlY3Rpb24gaWNvbihiZWZvcmUgc2Nyb2xsIGV2ZW50KVxubGV0IHNjcm9sbGluZ0VsZW1lbnQgPSB3aW5kb3c7IC8vIHN0b3JlIHRoZSBzY3JvbGxpbmcgZWxlbWVudCBmb3IgdGhlIHBhZ2Vcbi8vIHN0b3JlIHRoZSBuYW1lIG9mIHNjcm9sbCBwcm9wZXJ0eSBhY2NvcmRpbmcgdG8gc2Nyb2xsaW5nRWxlbWVudFxubGV0IHNjcm9sbFByb3BlcnR5WCA9IFwicGFnZVhPZmZzZXRcIjtcbmxldCBzY3JvbGxQcm9wZXJ0eVkgPSBcInBhZ2VZT2Zmc2V0XCI7XG4vLyBzdG9yZSB0aGUgcG9zaXRpb24gc2V0dGluZyBvZiB0aGUgdHJhbnNsYXRpb24gYnV0dG9uLiBkZWZhdWx0OiBcIlRvcExlZnRcIlxubGV0IEJ1dHRvblBvc2l0aW9uU2V0dGluZyA9IFwiVG9wUmlnaHRcIjtcblxuLy8gRmV0Y2ggdGhlIGJ1dHRvbiBwb3NpdGlvbiBzZXR0aW5nLlxuZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJMYXlvdXRTZXR0aW5nc1wiLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICBCdXR0b25Qb3NpdGlvblNldHRpbmcgPSByZXN1bHQuTGF5b3V0U2V0dGluZ3MuU2VsZWN0VHJhbnNsYXRlUG9zaXRpb247XG59KTtcbi8vIFVwZGF0ZSB0aGUgYnV0dG9uIHBvc2l0aW9uIHNldHRpbmcgd2hlbiB0aGUgc2V0dGluZyBpcyBjaGFuZ2VkLlxuY2hyb21lLnN0b3JhZ2Uub25DaGFuZ2VkLmFkZExpc3RlbmVyKChjaGFuZ2VzLCBhcmVhKSA9PiB7XG4gICAgaWYgKGFyZWEgIT09IFwic3luY1wiIHx8ICFjaGFuZ2VzLkxheW91dFNldHRpbmdzKSByZXR1cm47XG4gICAgQnV0dG9uUG9zaXRpb25TZXR0aW5nID0gY2hhbmdlcy5MYXlvdXRTZXR0aW5ncy5uZXdWYWx1ZS5TZWxlY3RUcmFuc2xhdGVQb3NpdGlvbjtcbn0pO1xuXG4vLyB0aGlzIGxpc3RlbmVyIGFjdGl2YXRlZCB3aGVuIGRvY3VtZW50IGNvbnRlbnQgaXMgbG9hZGVkXG4vLyB0byBtYWtlIHNlbGVjdGlvbiBidXR0b24gYXZhaWxhYmxlIEFTQVBcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCAoKSA9PiB7XG4gICAgLy8gdG8gbWFrZSB0aGUgc2VsZWN0aW9uIGljb24gbW92ZSB3aXRoIHRoZSBtb3VzZSBzY3JvbGxpbmdcbiAgICBzY3JvbGxpbmdFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgc2Nyb2xsSGFuZGxlcik7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsICgpID0+IHtcbiAgICAgICAgZGlzYXBwZWFyQnV0dG9uKCk7XG4gICAgICAgIC8vIHdoZXRoZXIgdXNlciB0YWtlIGEgc2VsZWN0IGFjdGlvblxuICAgICAgICBkZXRlY3RTZWxlY3QoZG9jdW1lbnQsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgc2VsZWN0VHJhbnNsYXRlKGV2ZW50KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHNlbGVjdFRyYW5zbGF0ZShldmVudCwgdHJ1ZSk7XG4gICAgfSk7XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIC8vIHRyaXBsZSBjbGlja1xuICAgICAgICBpZiAoZXZlbnQuZGV0YWlsID09PSAzKSB7XG4gICAgICAgICAgICBzZWxlY3RUcmFuc2xhdGUoZXZlbnQsIHRydWUpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBpbXBsZW1lbnQgdGhlIHNlbGVjdCB0cmFuc2xhdGUgZmVhdHVyZVxuICAgICAqIGZvciB0aGUgaW1wbGVtZW50IGRldGFpbCwgcGxlYXNlIGNoZWNrIGluIHRoZSBkb2N1bWVudFxuICAgICAqIEBwYXJhbSB7TW91c2VFdmVudH0gZXZlbnQgbW91c2UgZXZlbnQgb2YgbW91c2UgdXAgLCBkb3VibGUgY2xpY2sgb3IgdHJpcGxlIGNsaWNrXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc0RvdWJsZUNsaWNrIHdoZXRoZXIgdGhlIGV2ZW50IHR5cGUgaXMgZG91YmxlIGNsaWNrIG9yIHRyaXBsZSBjbGljaywgc2V0IGZhbHNlIGJ5IGRlZmF1bHRcbiAgICAgKi9cbiAgICBhc3luYyBmdW5jdGlvbiBzZWxlY3RUcmFuc2xhdGUoZXZlbnQsIGlzRG91YmxlQ2xpY2sgPSBmYWxzZSkge1xuICAgICAgICBpZiAoIXNob3VsZFRyYW5zbGF0ZSgpKSByZXR1cm47XG5cbiAgICAgICAgY29uc3QgaW5CbGFja2xpc3QgPSBhd2FpdCBpc0luQmxhY2tsaXN0KCk7XG4gICAgICAgIGlmIChpbkJsYWNrbGlzdCkgcmV0dXJuO1xuXG4gICAgICAgIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzKFwiT3RoZXJTZXR0aW5nc1wiLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIGlmICghcmVzdWx0Lk90aGVyU2V0dGluZ3MpIHJldHVybjtcblxuICAgICAgICAgICAgbGV0IE90aGVyU2V0dGluZ3MgPSByZXN1bHQuT3RoZXJTZXR0aW5ncztcblxuICAgICAgICAgICAgLy8gU2hvdyB0cmFuc2xhdGluZyByZXN1bHQgaW5zdGFudGx5LlxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIE90aGVyU2V0dGluZ3NbXCJUcmFuc2xhdGVBZnRlclNlbGVjdFwiXSB8fFxuICAgICAgICAgICAgICAgIChpc0RvdWJsZUNsaWNrICYmIE90aGVyU2V0dGluZ3NbXCJUcmFuc2xhdGVBZnRlckRibENsaWNrXCJdKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdHJhbnNsYXRlU3VibWl0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKE90aGVyU2V0dGluZ3NbXCJTZWxlY3RUcmFuc2xhdGVcIl0pIHtcbiAgICAgICAgICAgICAgICBzaG93QnV0dG9uKGV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cbi8qKlxuICog5aSE55CG6byg5qCH54K55Ye75oyJ6ZKu5LqL5Lu2XG4gKlxuICogQHBhcmFtIHtNb3VzZUV2ZW50fSBldmVudCDpvKDmoIfngrnlh7vkuovku7ZcbiAqL1xuZnVuY3Rpb24gYnV0dG9uQ2xpY2tIYW5kbGVyKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBpZiAoZXZlbnQuYnV0dG9uID09PSAwKSB7XG4gICAgICAgIHRyYW5zbGF0ZVN1Ym1pdCgpO1xuICAgIH0gZWxzZSBpZiAoZXZlbnQuYnV0dG9uID09PSAyKSB7XG4gICAgICAgIHByb25vdW5jZVN1Ym1pdCgpO1xuICAgIH1cbn1cblxuLyoqXG4gKiBVc2UgdGhpcyBmdW5jdGlvbiB0byBzaG93IHRoZSB0cmFuc2xhdGlvbiBidXR0aW9uLlxuICovXG5mdW5jdGlvbiBzaG93QnV0dG9uKGV2ZW50KSB7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmFwcGVuZENoaWxkKHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyKTtcblxuICAgIGNvbnN0IE9mZnNldFhWYWx1ZSA9IDEwLFxuICAgICAgICBPZmZzZXRZVmFsdWUgPSAyMDtcbiAgICBsZXQgWEJpYXMsIFlCaWFzO1xuICAgIHN3aXRjaCAoQnV0dG9uUG9zaXRpb25TZXR0aW5nKSB7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGNhc2UgXCJUb3BSaWdodFwiOlxuICAgICAgICAgICAgWEJpYXMgPSBPZmZzZXRYVmFsdWU7XG4gICAgICAgICAgICBZQmlhcyA9IC1PZmZzZXRZVmFsdWUgLSB0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5jbGllbnRIZWlnaHQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcIlRvcExlZnRcIjpcbiAgICAgICAgICAgIFhCaWFzID0gLU9mZnNldFhWYWx1ZSAtIHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyLmNsaWVudFdpZHRoO1xuICAgICAgICAgICAgWUJpYXMgPSAtT2Zmc2V0WVZhbHVlIC0gdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJCb3R0b21SaWdodFwiOlxuICAgICAgICAgICAgWEJpYXMgPSBPZmZzZXRYVmFsdWU7XG4gICAgICAgICAgICBZQmlhcyA9IE9mZnNldFlWYWx1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiQm90dG9tTGVmdFwiOlxuICAgICAgICAgICAgWEJpYXMgPSAtT2Zmc2V0WFZhbHVlIC0gdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuY2xpZW50V2lkdGg7XG4gICAgICAgICAgICBZQmlhcyA9IE9mZnNldFlWYWx1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGxldCBYUG9zaXRpb24gPSBldmVudC54ICsgWEJpYXM7XG4gICAgbGV0IFlQb3NpdGlvbiA9IGV2ZW50LnkgKyBZQmlhcztcblxuICAgIC8vIElmIHRoZSBpY29uIGlzIGJleW9uZCB0aGUgc2lkZSBvZiB0aGUgcGFnZSwgd2UgbmVlZCB0byByZXBvc2l0aW9uIHRoZSBpY29uIGluc2lkZSB0aGUgcGFnZS5cbiAgICBpZiAoWFBvc2l0aW9uIDw9IDAgfHwgWFBvc2l0aW9uICsgdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuY2xpZW50V2lkdGggPiB3aW5kb3cuaW5uZXJXaWR0aClcbiAgICAgICAgWFBvc2l0aW9uID0gZXZlbnQueCAtIFhCaWFzIC0gdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuY2xpZW50V2lkdGg7XG4gICAgaWYgKFlQb3NpdGlvbiA8PSAwIHx8IFlQb3NpdGlvbiArIHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyLmNsaWVudEhlaWdodCA+IHdpbmRvdy5pbm5lckhlaWdodClcbiAgICAgICAgWVBvc2l0aW9uID0gZXZlbnQueSAtIFlCaWFzIC0gdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuY2xpZW50SGVpZ2h0O1xuXG4gICAgLy8gc2V0IHRoZSBuZXcgcG9zaXRpb24gb2YgdGhlIGljb25cbiAgICB0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5zdHlsZS50b3AgPSBgJHtZUG9zaXRpb259cHhgO1xuICAgIHRyYW5zbGF0aW9uQnV0dG9uQ29udGFpbmVyLnN0eWxlLmxlZnQgPSBgJHtYUG9zaXRpb259cHhgO1xuXG4gICAgLy8gcmVjb3JkIG9yaWdpbmFsIHBvc2l0aW9uIG9mIHRoZSBzZWxlY3Rpb24gaWNvbiBhbmQgdGhlIHN0YXJ0IG1vdXNlIHNjcm9sbGluZyBwb3NpdGlvblxuICAgIG9yaWdpblNjcm9sbFggPSBzY3JvbGxpbmdFbGVtZW50W3Njcm9sbFByb3BlcnR5WF07XG4gICAgb3JpZ2luU2Nyb2xsWSA9IHNjcm9sbGluZ0VsZW1lbnRbc2Nyb2xsUHJvcGVydHlZXTtcbiAgICBvcmlnaW5Qb3NpdGlvblggPSBYUG9zaXRpb247XG4gICAgb3JpZ2luUG9zaXRpb25ZID0gWVBvc2l0aW9uO1xuICAgIEhhc0J1dHRvblNob3duID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBnZXQgc2VsZWN0ZWQgdGV4dCBhbmQgaXRzIHBvc2l0aW9uIGluIHRoZSBwYWdlXG4gKlxuICogQHJldHVybnMge09iamVjdH0gZm9ybWF0OiB7dGV4dDogXCJzdHJpbmdcIiwgcG9zaXRpb246IFtwMSxwMl19XG4gKi9cbmZ1bmN0aW9uIGdldFNlbGVjdGlvbigpIHtcbiAgICBsZXQgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgIGxldCB0ZXh0ID0gXCJcIjtcbiAgICBsZXQgcG9zaXRpb247XG4gICAgaWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ID4gMCkge1xuICAgICAgICB0ZXh0ID0gc2VsZWN0aW9uLnRvU3RyaW5nKCkudHJpbSgpO1xuXG4gICAgICAgIGNvbnN0IGxhc3RSYW5nZSA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KHNlbGVjdGlvbi5yYW5nZUNvdW50IC0gMSk7XG4gICAgICAgIC8vIElmIHRoZSB1c2VyIHNlbGVjdHMgc29tZXRoaW5nIGluIGEgc2hhZG93IGRvbSwgdGhlIGVuZENvbnRhaW5lciB3aWxsIGJlIHRoZSBIVE1MIGVsZW1lbnQgYW5kIHRoZSBwb3NpdGlvbiB3aWxsIGJlIFswLDBdLiBJbiB0aGlzIHNpdHVhdGlvbiwgd2Ugc2V0IHRoZSBwb3NpdGlvbiB1bmRlZmluZWQgdG8gYXZvaWQgcmVsb2NhdGluZyB0aGUgcmVzdWx0IHBhbmVsLlxuICAgICAgICBpZiAobGFzdFJhbmdlLmVuZENvbnRhaW5lciAhPT0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KSB7XG4gICAgICAgICAgICBsZXQgcmVjdCA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KHNlbGVjdGlvbi5yYW5nZUNvdW50IC0gMSkuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBwb3NpdGlvbiA9IFtyZWN0LmxlZnQsIHJlY3QudG9wXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4geyB0ZXh0LCBwb3NpdGlvbiB9O1xufVxuXG4vKipcbiAqIOWkhOeQhueCueWHu+e/u+ivkeaMiemSruWQjueahOS6i+S7tlxuICovXG5mdW5jdGlvbiB0cmFuc2xhdGVTdWJtaXQoKSB7XG4gICAgbGV0IHNlbGVjdGlvbiA9IGdldFNlbGVjdGlvbigpO1xuICAgIGlmIChzZWxlY3Rpb24udGV4dCAmJiBzZWxlY3Rpb24udGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNoYW5uZWwucmVxdWVzdChcInRyYW5zbGF0ZVwiLCBzZWxlY3Rpb24pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJPdGhlclNldHRpbmdzXCIsIERFRkFVTFRfU0VUVElOR1MpLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIHRvIGNoZWNrIHdoZXRoZXIgdXNlciBuZWVkIHRvIGNhbmNlbCB0ZXh0IHNlbGVjdGlvbiBhZnRlciB0cmFuc2xhdGlvbiBmaW5pc2hlZFxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuT3RoZXJTZXR0aW5ncyAmJiByZXN1bHQuT3RoZXJTZXR0aW5nc1tcIkNhbmNlbFRleHRTZWxlY3Rpb25cIl0pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FuY2VsVGV4dFNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgZGlzYXBwZWFyQnV0dG9uKCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB3ZSBzaG91bGQgc3RhcnQgdHJhbnNsYXRpbmcuXG4gKlxuICogQHJldHVybnMge2Jvb2xlYW59IGlmIHdlIHNob3VsZCBzdGFydCB0cmFuc2xhdGluZ1xuICovXG5mdW5jdGlvbiBzaG91bGRUcmFuc2xhdGUoKSB7XG4gICAgbGV0IHNlbGVjdGlvbk9iamVjdCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgICBsZXQgc2VsZWN0aW9uVGV4dCA9IHNlbGVjdGlvbk9iamVjdC50b1N0cmluZygpLnRyaW0oKTtcbiAgICBpZiAoQlJPV1NFUl9FTlYgPT09IFwiZmlyZWZveFwiKVxuICAgICAgICAvLyBvbiBmaXJlZm94LCB3ZSBkb24ndCBuZWVkIHRvIHRlbGwgdGhlIGZvY3VzTm9kZSB0eXBlIGJlY2F1c2UgaW4gaW5wdXQgZWxlbWVudHMsIHNlbGVjdGlvblRleHQgaXMgXCJcIlxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgc2VsZWN0aW9uVGV4dC5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAvLyBEbyBub3QgcmUtdHJhbnNsYXRlIHRyYW5zbGF0ZWQgdGV4dC5cbiAgICAgICAgICAgICEod2luZG93LmlzRGlzcGxheWluZ1Jlc3VsdCAmJiB3aW5kb3cudHJhbnNsYXRlUmVzdWx0Lm9yaWdpbmFsVGV4dCA9PT0gc2VsZWN0aW9uVGV4dClcbiAgICAgICAgKTtcblxuICAgIC8qKlxuICAgICAqIEZpbHRlciBvdXQgdGhlIG5vZGVzIHRvIGF2b2lkIHRoZSB0cmFuc2xhdGlvbiBidXR0b24gYXBwZWFyaW5nIGluIHNvbWUgdW5uZWNlc3NhcnkgcGxhY2VzLlxuICAgICAqIEBwYXJhbSB7Tm9kZX0gbm9kZSB0aGUgbm9kZSB0byBiZSBmaWx0ZXJlZFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSBpZiB0aGUgbm9kZSBzaG91bGQgYmUgcGFzc2VkXG4gICAgICovXG4gICAgY29uc3QgZmlsdGVyTm9kZSA9IChub2RlKSA9PiB7XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkgcmV0dXJuIHRydWU7XG4gICAgICAgIC8vIEJPRFkgaXMgYSBzcGVjaWFsIGNhc2UuIHNlZSBodHRwczovL2dpdGh1Yi5jb20vRWRnZVRyYW5zbGF0ZS9FZGdlVHJhbnNsYXRlL2lzc3Vlcy81MzFcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IE5vZGUuRUxFTUVOVF9OT0RFKSByZXR1cm4gW1wiQk9EWVwiXS5pbmNsdWRlcyhub2RlLnRhZ05hbWUpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICBzZWxlY3Rpb25UZXh0Lmxlbmd0aCA+IDAgJiZcbiAgICAgICAgKGZpbHRlck5vZGUoc2VsZWN0aW9uT2JqZWN0LmFuY2hvck5vZGUpIHx8IGZpbHRlck5vZGUoc2VsZWN0aW9uT2JqZWN0LmZvY3VzTm9kZSkpICYmXG4gICAgICAgIC8vIERvIG5vdCByZS10cmFuc2xhdGUgdHJhbnNsYXRlZCB0ZXh0LlxuICAgICAgICAhKHdpbmRvdy5pc0Rpc3BsYXlpbmdSZXN1bHQgJiYgd2luZG93LnRyYW5zbGF0ZVJlc3VsdC5vcmlnaW5hbFRleHQgPT09IHNlbGVjdGlvblRleHQpXG4gICAgKTtcbn1cblxuLyoqXG4gKiDlpITnkIblj5Hpn7Plv6vmjbfplK5cbiAqL1xuZnVuY3Rpb24gcHJvbm91bmNlU3VibWl0KCkge1xuICAgIGxldCBzZWxlY3Rpb24gPSBnZXRTZWxlY3Rpb24oKTtcbiAgICBpZiAoc2VsZWN0aW9uLnRleHQgJiYgc2VsZWN0aW9uLnRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICBjaGFubmVsLnJlcXVlc3QoXCJwcm9ub3VuY2VcIiwge1xuICAgICAgICAgICAgdGV4dDogc2VsZWN0aW9uLnRleHQsXG4gICAgICAgICAgICBsYW5ndWFnZTogXCJhdXRvXCIsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuLyoqXG4gKiBleGVjdXRlIHRoaXMgZnVuY3Rpb24gdG8gbWFrZSB0aGUgdHJhbnNsYXRpb24gYnV0dG9uIGRpc2FwcGVhclxuICovXG5mdW5jdGlvbiBkaXNhcHBlYXJCdXR0b24oKSB7XG4gICAgaWYgKEhhc0J1dHRvblNob3duKSB7XG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lcik7XG4gICAgICAgIEhhc0J1dHRvblNob3duID0gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIHRoZSBoYW5kbGVyIGZ1bmN0aW9uIHRvIG1ha2UgdGhlIHNlbGVjdGlvbiBpY29uIG1vdmUgd2l0aCBtb3VzZSBzY3JvbGxpbmdcbiAqIEBwYXJhbSBFdmVudCB0aGUgZXZlbnQgb2Ygc2Nyb2xsaW5nXG4gKi9cbmZ1bmN0aW9uIHNjcm9sbEhhbmRsZXIoKSB7XG4gICAgaWYgKEhhc0J1dHRvblNob3duKSB7XG4gICAgICAgIGxldCBkaXN0YW5jZVggPSBvcmlnaW5TY3JvbGxYIC0gc2Nyb2xsaW5nRWxlbWVudFtzY3JvbGxQcm9wZXJ0eVhdO1xuICAgICAgICBsZXQgZGlzdGFuY2VZID0gb3JpZ2luU2Nyb2xsWSAtIHNjcm9sbGluZ0VsZW1lbnRbc2Nyb2xsUHJvcGVydHlZXTtcblxuICAgICAgICB0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lci5zdHlsZS5sZWZ0ID0gYCR7b3JpZ2luUG9zaXRpb25YICsgZGlzdGFuY2VYfXB4YDtcbiAgICAgICAgdHJhbnNsYXRpb25CdXR0b25Db250YWluZXIuc3R5bGUudG9wID0gYCR7b3JpZ2luUG9zaXRpb25ZICsgZGlzdGFuY2VZfXB4YDtcbiAgICB9XG59XG5cbi8qKlxuICogd2hldGhlciB0aGUgdXJsIG9mIGN1cnJlbnQgcGFnZSBpcyBpbiB0aGUgYmxhY2tsaXN0XG4gKlxuICogQHJldHVybnMge1Byb21pc2U8Ym9vbGVhbj59IHJlc3VsdCBpbiBwcm9taXNlIGZvcm1cbiAqL1xuZnVuY3Rpb24gaXNJbkJsYWNrbGlzdCgpIHtcbiAgICByZXR1cm4gZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MoXCJibGFja2xpc3RcIiwgREVGQVVMVF9TRVRUSU5HUykudGhlbigocmVzdWx0KSA9PiB7XG4gICAgICAgIGxldCB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgbGV0IGJsYWNrbGlzdCA9IHJlc3VsdC5ibGFja2xpc3Q7XG4gICAgICAgIHJldHVybiBibGFja2xpc3QuZG9tYWluc1tnZXREb21haW4odXJsKV0gfHwgYmxhY2tsaXN0LnVybHNbdXJsXTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBjYW5jZWwgdGV4dCBzZWxlY3Rpb24gd2hlbiB0cmFuc2xhdGlvbiBpcyBmaW5pc2hlZFxuICovXG5mdW5jdGlvbiBjYW5jZWxUZXh0U2VsZWN0aW9uKCkge1xuICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKSB7XG4gICAgICAgIGlmICh3aW5kb3cuZ2V0U2VsZWN0aW9uKCkuZW1wdHkpIHtcbiAgICAgICAgICAgIC8vIENocm9tZVxuICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLmVtcHR5KCk7XG4gICAgICAgIH0gZWxzZSBpZiAod2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcykge1xuICAgICAgICAgICAgLy8gRmlyZWZveFxuICAgICAgICAgICAgd2luZG93LmdldFNlbGVjdGlvbigpLnJlbW92ZUFsbFJhbmdlcygpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChkb2N1bWVudC5zZWxlY3Rpb24pIHtcbiAgICAgICAgLy8gSUVcbiAgICAgICAgZG9jdW1lbnQuc2VsZWN0aW9uLmVtcHR5KCk7XG4gICAgfVxufVxuXG4vKipcbiAqIOWkhOeQhuWPlua2iOe9kemhtee/u+ivkeeahOW/q+aNt+mUrlxuICovXG5mdW5jdGlvbiBjYW5jZWxQYWdlVHJhbnNsYXRlKCkge1xuICAgIGxldCBjaGVja0FuZENsaWNrID0gKGJ1dHRvbikgPT4ge1xuICAgICAgICBpZiAoYnV0dG9uICE9PSBudWxsICYmIGJ1dHRvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBidXR0b24uY2xpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIjowLmNvbnRhaW5lclwiKTtcbiAgICBpZiAoZnJhbWUgIT09IG51bGwgJiYgZnJhbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBsZXQgY2FuY2VsQnV0dG9uID0gZnJhbWUuY29udGVudERvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiOjAuY2xvc2VcIik7XG4gICAgICAgIGNoZWNrQW5kQ2xpY2soY2FuY2VsQnV0dG9uKTtcbiAgICB9XG5cbiAgICBmcmFtZSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiT1VURk9YX0pUUl9CQVJcIik7XG4gICAgaWYgKGZyYW1lICE9PSBudWxsICYmIGZyYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgbGV0IGNhbmNlbEJ1dHRvbiA9IGZyYW1lLmNvbnRlbnREb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIk9VVEZPWF9KVFJfQkFSX0NMT1NFXCIpO1xuICAgICAgICBjaGVja0FuZENsaWNrKGNhbmNlbEJ1dHRvbik7XG4gICAgfVxufVxuXG4vKipcbiAqIFRoZSBjb250YWluZXIgb2YgdGhlIHRyYW5zbGF0aW9uIGJ1dHRvbiBjYW4gYmUgZWl0aGVyIGFuIGlmcmFtZSBvciBhIGRpdiB3aXRoIGEgc2hhZG93IGRvbS5cbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGdldCB0aGUgaW5uZXIgcGFyZW50IG9mIHRoZSBjb250YWluZXIuXG4gKiBAcGFyYW0ge0hUTUxJRnJhbWVFbGVtZW50fEhUTUxEaXZFbGVtZW50fSBjb250YWluZXJcbiAqL1xuZnVuY3Rpb24gZ2V0SW5uZXJQYXJlbnQoY29udGFpbmVyKSB7XG4gICAgaWYgKGNvbnRhaW5lci50YWdOYW1lID09PSBcIklGUkFNRVwiKSByZXR1cm4gY29udGFpbmVyLmNvbnRlbnREb2N1bWVudC5ib2R5O1xuXG4gICAgaWYgKGNvbnRhaW5lci5zaGFkb3dSb290KSByZXR1cm4gY29udGFpbmVyLnNoYWRvd1Jvb3Q7XG5cbiAgICBjb250YWluZXIuYXR0YWNoU2hhZG93KHsgbW9kZTogXCJvcGVuXCIgfSk7XG4gICAgcmV0dXJuIGNvbnRhaW5lci5zaGFkb3dSb290O1xufVxuXG4vLyBwcm92aWRlIHVzZXIncyBzZWxlY3Rpb24gcmVzdWx0IGZvciB0aGUgYmFja2dyb3VuZCBtb2R1bGVcbmNoYW5uZWwucHJvdmlkZShcImdldF9zZWxlY3Rpb25cIiwgKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGdldFNlbGVjdGlvbigpKSk7XG5cbi8vIGhhbmRsZXIgZm9yIHNob3J0Y3V0IGNvbW1hbmRcbmNoYW5uZWwub24oXCJjb21tYW5kXCIsIChkZXRhaWwpID0+IHtcbiAgICBzd2l0Y2ggKGRldGFpbC5jb21tYW5kKSB7XG4gICAgICAgIGNhc2UgXCJ0cmFuc2xhdGVfc2VsZWN0ZWRcIjpcbiAgICAgICAgICAgIHRyYW5zbGF0ZVN1Ym1pdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJwcm9ub3VuY2Vfc2VsZWN0ZWRcIjpcbiAgICAgICAgICAgIHByb25vdW5jZVN1Ym1pdCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJjYW5jZWxfcGFnZV90cmFuc2xhdGVcIjpcbiAgICAgICAgICAgIGNhbmNlbFBhZ2VUcmFuc2xhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxufSk7XG4iXSwibmFtZXMiOlsiRXZlbnRNYW5hZ2VyIiwiQ2hhbm5lbCIsImNvbnN0cnVjdG9yIiwiX3NlcnZpY2VzIiwiTWFwIiwiX2V2ZW50TWFuYWdlciIsImNocm9tZSIsInJ1bnRpbWUiLCJvbk1lc3NhZ2UiLCJhZGRMaXN0ZW5lciIsIm1lc3NhZ2UiLCJzZW5kZXIiLCJjYWxsYmFjayIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInR5cGUiLCJjb25zb2xlIiwiZXJyb3IiLCJlbWl0IiwiZXZlbnQiLCJkZXRhaWwiLCJzZXJ2ZXIiLCJnZXQiLCJzZXJ2aWNlIiwicGFyYW1zIiwidGhlbiIsInJlc3VsdCIsImJpbmQiLCJwcm92aWRlIiwic2V0IiwicmVxdWVzdCIsInN0cmluZ2lmeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic2VuZE1lc3NhZ2UiLCJsYXN0RXJyb3IiLCJyZXF1ZXN0VG9UYWIiLCJ0YWJJZCIsInNlbmQiLCJfZ2V0VGFiTWVzc2FnZVNlbmRlciIsIm9uIiwiaGFuZGxlciIsImVtaXRUb1RhYnMiLCJ0YWJJZHMiLCJjYXRjaCIsIkJST1dTRVJfRU5WIiwiYnJvd3NlciIsInRhYnMiLCJnZXREb21haW4iLCJsb2ciLCJsb2dJbmZvIiwidXJsIiwiVVJMX1BBVFRFUk4iLCJncm91cHMiLCJtYXRjaCIsImkxOG5IVE1MIiwiaTE4bkVsZW1lbnRzIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiaSIsImxlbmd0aCIsInBvcyIsImhhc0F0dHJpYnV0ZSIsImdldEF0dHJpYnV0ZSIsImluc2VydEFkamFjZW50VGV4dCIsImkxOG4iLCJnZXRNZXNzYWdlIiwiX2hhbmRsZXJJRCIsIl9ldmVudFRvSGFuZGxlcklEcyIsIl9oYW5kbGVySURUb0hhbmRsZXIiLCJoYW5kbGVySUQiLCJfYWxsb2NIYW5kbGVySUQiLCJoYXMiLCJhZGQiLCJTZXQiLCJjYW5jZWxlZCIsIl9vZmYiLCJ3YXJuIiwic291cmNlIiwiaGFuZGxlcklEcyIsIk51bWJlciIsIk1BWF9TQUZFX0lOVEVHRVIiLCJkZWxldGUiLCJCUk9XU0VSX0xBTkdVQUdFU19NQVAiLCJhY2giLCJhZHkiLCJhZiIsImFrIiwiYW0iLCJhciIsImF6IiwiYmciLCJibiIsImNhIiwiY2FrIiwiY2ViIiwiY28iLCJjcyIsImN5IiwiZGEiLCJkZSIsImRzYiIsImVsIiwiZW4iLCJlbyIsImVzIiwiZXQiLCJldSIsImZhIiwiZmYiLCJmaSIsImZyIiwiZ2EiLCJnZCIsImdsIiwiaGEiLCJoYXciLCJoZSIsImhpIiwiaG1uIiwiaHIiLCJoc2IiLCJodCIsImh1IiwiaWQiLCJpZyIsImlzIiwiaXQiLCJpdyIsImphIiwia20iLCJrYWIiLCJrbiIsImtvIiwia3kiLCJsYSIsImxiIiwibG8iLCJsdCIsImx2IiwibWFpIiwibWkiLCJtayIsIm1sIiwibXIiLCJtcyIsIm10IiwibXkiLCJubyIsIm5iIiwibmUiLCJubCIsIm55Iiwib2MiLCJwYSIsInBsIiwicHQiLCJybyIsInJ1Iiwic2QiLCJzayIsInNsIiwic20iLCJzbiIsInNxIiwic3IiLCJzdCIsInN1Iiwic3YiLCJzdyIsInRhIiwidGUiLCJ0ZyIsInRoIiwidGwiLCJ0bGgiLCJ0ciIsInVrIiwidXIiLCJ1eiIsInZpIiwieWkiLCJ5byIsInpoIiwibG9nV2FybiIsImxvZ0Vycm9yIiwic2hvdWxkRmlsdGVyRXJyb3IiLCJ3cmFwQ29uc29sZUZvckZpbHRlcmluZyIsInNldExvZ0xldmVsIiwiZ2V0TG9nTGV2ZWwiLCJGSUxURVJFRF9FUlJPUl9QQVRURVJOUyIsImpvaW5NZXNzYWdlIiwiYXJncyIsIm1hcCIsInYiLCJqb2luIiwiXyIsInNvbWUiLCJwYXR0ZXJuIiwiaW5jbHVkZXMiLCJ0ZXN0IiwiTEVWRUxfT1JERVIiLCJkZWJ1ZyIsImluZm8iLCJzaWxlbnQiLCJjdXJyZW50TGV2ZWwiLCJCVUlMRF9FTlYiLCJsZXZlbCIsInNob3VsZEVtaXQiLCJvcmlnaW5hbENvbnNvbGVFcnJvciIsImFwcGx5IiwiREVGQVVMVF9TRVRUSU5HUyIsImJsYWNrbGlzdCIsInVybHMiLCJkb21haW5zIiwiZXh0ZW5zaW9ucyIsIkxheW91dFNldHRpbmdzIiwiUmVzaXplIiwiUlRMIiwiRm9sZExvbmdDb250ZW50IiwiU2VsZWN0VHJhbnNsYXRlUG9zaXRpb24iLCJsYW5ndWFnZVNldHRpbmciLCJnZXRVSUxhbmd1YWdlIiwiT3RoZXJTZXR0aW5ncyIsIk11dHVhbFRyYW5zbGF0ZSIsIlNlbGVjdFRyYW5zbGF0ZSIsIlRyYW5zbGF0ZUFmdGVyRGJsQ2xpY2siLCJUcmFuc2xhdGVBZnRlclNlbGVjdCIsIkNhbmNlbFRleHRTZWxlY3Rpb24iLCJVc2VHb29nbGVBbmFseXRpY3MiLCJEZWZhdWx0VHJhbnNsYXRvciIsIkRlZmF1bHRQYWdlVHJhbnNsYXRvciIsIkh5YnJpZFRyYW5zbGF0b3JDb25maWciLCJ0cmFuc2xhdG9ycyIsInNlbGVjdGlvbnMiLCJvcmlnaW5hbFRleHQiLCJtYWluTWVhbmluZyIsInRQcm9udW5jaWF0aW9uIiwic1Byb251bmNpYXRpb24iLCJkZXRhaWxlZE1lYW5pbmdzIiwiZGVmaW5pdGlvbnMiLCJleGFtcGxlcyIsIlRyYW5zbGF0ZVJlc3VsdEZpbHRlciIsInRQcm9udW5jaWF0aW9uSWNvbiIsInNQcm9udW5jaWF0aW9uSWNvbiIsIkNvbnRlbnREaXNwbGF5T3JkZXIiLCJIaWRlUGFnZVRyYW5zbGF0b3JCYW5uZXIiLCJzZXREZWZhdWx0U2V0dGluZ3MiLCJzZXR0aW5ncyIsIkFycmF5IiwiT2JqZWN0Iiwia2V5cyIsInVuZGVmaW5lZCIsImdldE9yU2V0RGVmYXVsdFNldHRpbmdzIiwiZGVmYXVsdHMiLCJrZXkiLCJwdXNoIiwic3RvcmFnZSIsInN5bmMiLCJ1cGRhdGVkIiwic2V0dGluZyIsImRldGVjdFNlbGVjdCIsInRhcmdldEVsZW1lbnQiLCJhY3Rpb25BZnRlclNlbGVjdCIsImFjdGlvbkFmdGVyTm90U2VsZWN0IiwibW92ZWQiLCJkZXRlY3RNb3VzZU1vdmUiLCJkZXRlY3RNb3VzZVVwIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImFkZEV2ZW50TGlzdGVuZXIiLCJJbWFnZURhdGEiLCJjaGFubmVsIiwiSGFzQnV0dG9uU2hvd24iLCJ0cmFuc2xhdGlvbkJ1dHRvbkNvbnRhaW5lciIsImNyZWF0ZUVsZW1lbnQiLCJpZnJhbWVDb250YWluZXIiLCJkb2N1bWVudEVsZW1lbnQiLCJhcHBlbmRDaGlsZCIsImNvbnRlbnREb2N1bWVudCIsInJlbmRlckJ1dHRvbiIsInJlbW92ZUNoaWxkIiwic3R5bGUiLCJiYWNrZ3JvdW5kQ29sb3IiLCJfdHJhbnNsYXRpb25CdXR0b25Db24iLCJfdHJhbnNsYXRpb25CdXR0b25Db24yIiwiYnV0dG9uSW1hZ2UiLCJzcmMiLCJCVVRUT05fU0laRSIsImFzc2lnbiIsIndpZHRoIiwiaGVpZ2h0IiwibWluV2lkdGgiLCJtYXhXaWR0aCIsIm1pbkhlaWdodCIsIm1heEhlaWdodCIsInBhZGRpbmciLCJib3JkZXIiLCJtYXJnaW4iLCJ2ZXJ0aWNhbEFsaWduIiwiZmlsdGVyIiwidHJhbnNsYXRpb25CdXR0b24iLCJib3JkZXJSYWRpdXMiLCJib3hTaXppbmciLCJvdmVyZmxvdyIsImN1cnNvciIsImdldElubmVyUGFyZW50IiwiQ2xlYW5TdHlsZSIsImJvZHkiLCJidXR0b25DbGlja0hhbmRsZXIiLCJlIiwicHJldmVudERlZmF1bHQiLCJvcmlnaW5TY3JvbGxYIiwib3JpZ2luU2Nyb2xsWSIsIm9yaWdpblBvc2l0aW9uWCIsIm9yaWdpblBvc2l0aW9uWSIsInNjcm9sbGluZ0VsZW1lbnQiLCJ3aW5kb3ciLCJzY3JvbGxQcm9wZXJ0eVgiLCJzY3JvbGxQcm9wZXJ0eVkiLCJCdXR0b25Qb3NpdGlvblNldHRpbmciLCJvbkNoYW5nZWQiLCJjaGFuZ2VzIiwiYXJlYSIsIm5ld1ZhbHVlIiwic2Nyb2xsSGFuZGxlciIsImRpc2FwcGVhckJ1dHRvbiIsInNlbGVjdFRyYW5zbGF0ZSIsImlzRG91YmxlQ2xpY2siLCJzaG91bGRUcmFuc2xhdGUiLCJpbkJsYWNrbGlzdCIsImlzSW5CbGFja2xpc3QiLCJ0cmFuc2xhdGVTdWJtaXQiLCJzaG93QnV0dG9uIiwic3RvcFByb3BhZ2F0aW9uIiwiYnV0dG9uIiwicHJvbm91bmNlU3VibWl0IiwiT2Zmc2V0WFZhbHVlIiwiT2Zmc2V0WVZhbHVlIiwiWEJpYXMiLCJZQmlhcyIsImNsaWVudEhlaWdodCIsImNsaWVudFdpZHRoIiwiWFBvc2l0aW9uIiwieCIsIllQb3NpdGlvbiIsInkiLCJpbm5lcldpZHRoIiwiaW5uZXJIZWlnaHQiLCJ0b3AiLCJsZWZ0IiwiZ2V0U2VsZWN0aW9uIiwic2VsZWN0aW9uIiwidGV4dCIsInBvc2l0aW9uIiwicmFuZ2VDb3VudCIsInRvU3RyaW5nIiwidHJpbSIsImxhc3RSYW5nZSIsImdldFJhbmdlQXQiLCJlbmRDb250YWluZXIiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwiY2FuY2VsVGV4dFNlbGVjdGlvbiIsInNlbGVjdGlvbk9iamVjdCIsInNlbGVjdGlvblRleHQiLCJpc0Rpc3BsYXlpbmdSZXN1bHQiLCJ0cmFuc2xhdGVSZXN1bHQiLCJmaWx0ZXJOb2RlIiwibm9kZSIsIm5vZGVUeXBlIiwiTm9kZSIsIlRFWFRfTk9ERSIsIkVMRU1FTlRfTk9ERSIsInRhZ05hbWUiLCJhbmNob3JOb2RlIiwiZm9jdXNOb2RlIiwibGFuZ3VhZ2UiLCJkaXN0YW5jZVgiLCJkaXN0YW5jZVkiLCJsb2NhdGlvbiIsImhyZWYiLCJlbXB0eSIsInJlbW92ZUFsbFJhbmdlcyIsImNhbmNlbFBhZ2VUcmFuc2xhdGUiLCJjaGVja0FuZENsaWNrIiwiY2xpY2siLCJmcmFtZSIsImdldEVsZW1lbnRCeUlkIiwiY2FuY2VsQnV0dG9uIiwiY29udGFpbmVyIiwic2hhZG93Um9vdCIsImF0dGFjaFNoYWRvdyIsIm1vZGUiLCJjb21tYW5kIl0sInNvdXJjZVJvb3QiOiIifQ==