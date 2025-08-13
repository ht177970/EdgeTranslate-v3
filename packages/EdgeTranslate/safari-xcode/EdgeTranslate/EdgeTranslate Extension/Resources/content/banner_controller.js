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
/*!******************************************!*\
  !*** ./src/content/banner_controller.js ***!
  \******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/channel.js */ "./src/common/scripts/channel.js");
/* harmony import */ var common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/scripts/settings.js */ "./src/common/scripts/settings.js");



/**
 * Control the visibility of page translator banners.
 */
class BannerController {
  constructor() {
    // Communication channel.
    this.channel = new common_scripts_channel_js__WEBPACK_IMPORTED_MODULE_0__["default"]();

    // Allowed translator: google.
    this.currentTranslator = null;

    // Message listener canceller.
    this.canceller = null;
    this.addListeners();
  }

  /**
   * Add event and message listeners.
   */
  addListeners() {
    this.channel.on("start_page_translate", (detail => {
      switch (detail.translator) {
        case "google":
          {
            // Google page translator runs in website context, so we use window.postMessage
            // for message passing.
            this.currentTranslator = "google";
            let handler = this.googleMessageHandler.bind(this);
            window.addEventListener("message", handler);
            this.canceller = (() => {
              window.removeEventListener("message", handler);
            }).bind(this);
            break;
          }
        default:
          break;
      }
    }).bind(this));
    this.channel.on("command", detail => {
      switch (detail.command) {
        case "toggle_page_translate_banner":
          this.toggleBanner();
          break;
        default:
          break;
      }
    });
  }

  /**
   * Toggle the visibility of banner frame.
   *
   * @param {boolean} visible the visibility of banner frame.
   * @returns {void} nothing
   */
  toggleBannerFrame(visible) {
    switch (this.currentTranslator) {
      case "google":
        {
          let banner = document.getElementById(":0.container");
          if (banner !== null && banner !== undefined) {
            banner.style.visibility = visible ? "visible" : "hidden";
            return;
          }
          break;
        }
      default:
        break;
    }
  }

  /**
   * Move the page body.
   *
   * @param {String} property indicates which style property to use for moving. Google uses "top".
   *
   * @param {Number} distance the distance to move.
   * @param {boolean} absolute whether the distance is relative or absolute.
   */
  movePage(property, distance, absolute) {
    let orig = document.body.style.getPropertyValue(property);
    try {
      // The property has value originally.
      let orig_value = parseInt(orig, 10);
      document.body.style.cssText = document.body.style.cssText.replace(new RegExp(`${property}:.*;`, "g"), `${property}: ${absolute ? distance : orig_value + distance}px !important;`);
    } catch (_unused) {
      // The property has no valid value originally, move absolutely.
      document.body.style.setProperty(property, `${distance}px`, "important");
    }
  }

  /**
   * Handle messages sent by Google page translator.
   *
   * @param {Object} msg the message content.
   * @returns {void} nothing
   */
  googleMessageHandler(msg) {
    let data = JSON.parse(msg.data);
    if (!data.type || data.type !== "edge_translate_page_translate_event") return;
    switch (data.event) {
      case "page_moved":
        // The "page_moved" event may be sent when the banner is created or destroyed.
        // If the distance property is positive, it means the banner is created, and
        // the page has been moved down. Else if it is negative, it means the banner is
        // destroyed, and the banner has been moved up.
        (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.getOrSetDefaultSettings)("HidePageTranslatorBanner", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS).then(result => {
          if (result.HidePageTranslatorBanner) {
            setTimeout(() => {
              this.toggleBannerFrame(false);
              // If user decide to hide the banner, we just keep the top
              // of the page at 0px.
              this.movePage("top", 0, true);
            }, 0);
          }
        });

        // If the banner is destroyed, we should cancel listeners.
        if (data.distance <= 0) {
          this.canceller();
          this.canceller = null;
          this.currentTranslator = null;
        }
        break;
      default:
        break;
    }
  }

  /**
   * Toggle the visibility of the banner.
   *
   * @returns {void} nothing
   */
  toggleBanner() {
    if (!this.currentTranslator) return;
    (0,common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.getOrSetDefaultSettings)("HidePageTranslatorBanner", common_scripts_settings_js__WEBPACK_IMPORTED_MODULE_1__.DEFAULT_SETTINGS).then(result => {
      result.HidePageTranslatorBanner = !result.HidePageTranslatorBanner;
      chrome.storage.sync.set(result);
      switch (this.currentTranslator) {
        case "google":
          {
            if (result.HidePageTranslatorBanner) {
              // Hide the banner.
              this.toggleBannerFrame(false);
              this.movePage("top", 0, true);
            } else {
              // Show the banner.
              this.toggleBannerFrame(true);
              this.movePage("top", 40, true);
            }
            break;
          }
        default:
          break;
      }
    });
  }
}

// Create the object.
window.EdgeTranslateBannerController = new BannerController();
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsSUFBSTtFQUNUQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsV0FBVyxFQUFFLElBQUk7RUFDakJDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLFFBQVEsRUFBRSxJQUFJO0VBQ2QsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxLQUFLO0VBQ1ZDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsR0FBRyxFQUFFLElBQUk7RUFDVEMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxHQUFHLEVBQUUsS0FBSztFQUNWQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLEtBQUs7RUFDZEMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEdBQUcsRUFBRSxLQUFLO0VBQ1YsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxLQUFLO0VBQ1QsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxJQUFJO0VBQ2IsT0FBTyxFQUFFLEtBQUs7RUFDZCxPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsS0FBSztFQUNkQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxLQUFLO0VBQ2QsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxLQUFLO0VBQ1QsT0FBTyxFQUFFLEtBQUs7RUFDZEMsR0FBRyxFQUFFLEtBQUs7RUFDVkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiLE9BQU8sRUFBRSxLQUFLO0VBQ2RDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYkMsRUFBRSxFQUFFLElBQUk7RUFDUixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1IsT0FBTyxFQUFFLElBQUk7RUFDYixPQUFPLEVBQUUsSUFBSTtFQUNiQyxFQUFFLEVBQUUsSUFBSTtFQUNSLE9BQU8sRUFBRSxJQUFJO0VBQ2JDLEVBQUUsRUFBRSxJQUFJO0VBQ1JDLEVBQUUsRUFBRSxPQUFPO0VBQ1gsU0FBUyxFQUFFLE9BQU87RUFDbEIsU0FBUyxFQUFFLE9BQU87RUFDbEIsT0FBTyxFQUFFLE9BQU87RUFDaEIsT0FBTyxFQUFFLE9BQU87RUFDaEIsT0FBTyxFQUFFLE9BQU87RUFDaEIsT0FBTyxFQUFFLE9BQU87RUFDaEIsT0FBTyxFQUFFO0FBQ2IsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQy9Pb0U7O0FBRXBFO0FBQ0E7QUFDQTtBQUNBLE1BQU1DLGdCQUFnQixHQUFHO0VBQ3JCQyxTQUFTLEVBQUU7SUFDUEMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNSQyxPQUFPLEVBQUU7TUFBRSxtQkFBbUIsRUFBRSxJQUFJO01BQUVDLFVBQVUsRUFBRTtJQUFLO0VBQzNELENBQUM7RUFDRDtFQUNBO0VBQ0E7RUFDQTtFQUNBQyxjQUFjLEVBQUU7SUFDWkMsTUFBTSxFQUFFLEtBQUs7SUFDYkMsR0FBRyxFQUFFLEtBQUs7SUFDVkMsZUFBZSxFQUFFLElBQUk7SUFDckJDLHVCQUF1QixFQUFFO0VBQzdCLENBQUM7RUFDRDtFQUNBQyxlQUFlLEVBQUU7SUFBRWpDLEVBQUUsRUFBRSxNQUFNO0lBQUVhLEVBQUUsRUFBRTNGLDhFQUFxQixDQUFDNUQsTUFBTSxDQUFDNEssSUFBSSxDQUFDQyxhQUFhLENBQUMsQ0FBQztFQUFFLENBQUM7RUFDdkZDLGFBQWEsRUFBRTtJQUNYQyxlQUFlLEVBQUUsS0FBSztJQUN0QkMsZUFBZSxFQUFFLElBQUk7SUFDckJDLHNCQUFzQixFQUFFLEtBQUs7SUFDN0JDLG9CQUFvQixFQUFFLEtBQUs7SUFDM0JDLG1CQUFtQixFQUFFLEtBQUs7SUFDMUJDLGtCQUFrQixFQUFFO0VBQ3hCLENBQUM7RUFDREMsaUJBQWlCLEVBQUUsaUJBQWlCO0VBQ3BDQyxxQkFBcUIsRUFBRSxxQkFBcUI7RUFDNUNDLHNCQUFzQixFQUFFO0lBQ3BCO0lBQ0FDLFdBQVcsRUFBRSxDQUFDLGVBQWUsRUFBRSxpQkFBaUIsQ0FBQztJQUVqRDtJQUNBQyxVQUFVLEVBQUU7TUFDUjtNQUNBQyxZQUFZLEVBQUUsaUJBQWlCO01BQy9CQyxXQUFXLEVBQUUsaUJBQWlCO01BQzlCQyxjQUFjLEVBQUUsaUJBQWlCO01BQ2pDQyxjQUFjLEVBQUUsaUJBQWlCO01BRWpDO01BQ0FDLGdCQUFnQixFQUFFLGVBQWU7TUFDakNDLFdBQVcsRUFBRSxpQkFBaUI7TUFDOUJDLFFBQVEsRUFBRTtJQUNkO0VBQ0osQ0FBQztFQUNEO0VBQ0FDLHFCQUFxQixFQUFFO0lBQ25CTixXQUFXLEVBQUUsSUFBSTtJQUNqQkQsWUFBWSxFQUFFLElBQUk7SUFDbEJFLGNBQWMsRUFBRSxJQUFJO0lBQ3BCQyxjQUFjLEVBQUUsSUFBSTtJQUNwQkssa0JBQWtCLEVBQUUsSUFBSTtJQUN4QkMsa0JBQWtCLEVBQUUsSUFBSTtJQUN4QkwsZ0JBQWdCLEVBQUUsSUFBSTtJQUN0QkMsV0FBVyxFQUFFLElBQUk7SUFDakJDLFFBQVEsRUFBRTtFQUNkLENBQUM7RUFDRDtFQUNBSSxtQkFBbUIsRUFBRSxDQUNqQixhQUFhLEVBQ2IsY0FBYyxFQUNkLGtCQUFrQixFQUNsQixhQUFhLEVBQ2IsVUFBVSxDQUNiO0VBQ0RDLHdCQUF3QixFQUFFO0FBQzlCLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNDLGtCQUFrQkEsQ0FBQ2pMLE1BQU0sRUFBRWtMLFFBQVEsRUFBRTtFQUMxQyxLQUFLLElBQUlDLENBQUMsSUFBSUQsUUFBUSxFQUFFO0lBQ3BCO0lBQ0EsSUFDSSxPQUFPQSxRQUFRLENBQUNDLENBQUMsQ0FBQyxLQUFLLFFBQVEsSUFDL0IsRUFBRUQsUUFBUSxDQUFDQyxDQUFDLENBQUMsWUFBWUMsS0FBSyxDQUFDLElBQy9CQyxNQUFNLENBQUNDLElBQUksQ0FBQ0osUUFBUSxDQUFDQyxDQUFDLENBQUMsQ0FBQyxDQUFDSSxNQUFNLEdBQUcsQ0FBQyxFQUNyQztNQUNFLElBQUl2TCxNQUFNLENBQUNtTCxDQUFDLENBQUMsRUFBRTtRQUNYRixrQkFBa0IsQ0FBQ2pMLE1BQU0sQ0FBQ21MLENBQUMsQ0FBQyxFQUFFRCxRQUFRLENBQUNDLENBQUMsQ0FBQyxDQUFDO01BQzlDLENBQUMsTUFBTTtRQUNIO1FBQ0FuTCxNQUFNLENBQUNtTCxDQUFDLENBQUMsR0FBR0QsUUFBUSxDQUFDQyxDQUFDLENBQUM7TUFDM0I7SUFDSixDQUFDLE1BQU0sSUFBSW5MLE1BQU0sQ0FBQ21MLENBQUMsQ0FBQyxLQUFLSyxTQUFTLEVBQUU7TUFDaEM7TUFDQXhMLE1BQU0sQ0FBQ21MLENBQUMsQ0FBQyxHQUFHRCxRQUFRLENBQUNDLENBQUMsQ0FBQztJQUMzQjtFQUNKO0FBQ0o7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVNNLHVCQUF1QkEsQ0FBQ1AsUUFBUSxFQUFFUSxRQUFRLEVBQUU7RUFDakQsT0FBTyxJQUFJcEwsT0FBTyxDQUFFQyxPQUFPLElBQUs7SUFDNUI7SUFDQSxJQUFJLE9BQU8ySyxRQUFRLEtBQUssUUFBUSxFQUFFO01BQzlCQSxRQUFRLEdBQUcsQ0FBQ0EsUUFBUSxDQUFDO0lBQ3pCLENBQUMsTUFBTSxJQUFJQSxRQUFRLEtBQUtNLFNBQVMsRUFBRTtNQUMvQjtNQUNBTixRQUFRLEdBQUcsRUFBRTtNQUNiLEtBQUssSUFBSVMsR0FBRyxJQUFJRCxRQUFRLEVBQUU7UUFDdEJSLFFBQVEsQ0FBQ1UsSUFBSSxDQUFDRCxHQUFHLENBQUM7TUFDdEI7SUFDSjtJQUVBaE4sTUFBTSxDQUFDa04sT0FBTyxDQUFDQyxJQUFJLENBQUNsTSxHQUFHLENBQUNzTCxRQUFRLEVBQUdsTCxNQUFNLElBQUs7TUFDMUMsSUFBSStMLE9BQU8sR0FBRyxLQUFLO01BRW5CLEtBQUssSUFBSUMsT0FBTyxJQUFJZCxRQUFRLEVBQUU7UUFDMUIsSUFBSSxDQUFDbEwsTUFBTSxDQUFDZ00sT0FBTyxDQUFDLEVBQUU7VUFDbEIsSUFBSSxPQUFPTixRQUFRLEtBQUssVUFBVSxFQUFFO1lBQ2hDQSxRQUFRLEdBQUdBLFFBQVEsQ0FBQ1IsUUFBUSxDQUFDO1VBQ2pDO1VBQ0FsTCxNQUFNLENBQUNnTSxPQUFPLENBQUMsR0FBR04sUUFBUSxDQUFDTSxPQUFPLENBQUM7VUFDbkNELE9BQU8sR0FBRyxJQUFJO1FBQ2xCO01BQ0o7TUFFQSxJQUFJQSxPQUFPLEVBQUU7UUFDVHBOLE1BQU0sQ0FBQ2tOLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDM0wsR0FBRyxDQUFDSCxNQUFNLEVBQUUsTUFBTU8sT0FBTyxDQUFDUCxNQUFNLENBQUMsQ0FBQztNQUMxRCxDQUFDLE1BQU07UUFDSE8sT0FBTyxDQUFDUCxNQUFNLENBQUM7TUFDbkI7SUFDSixDQUFDLENBQUM7RUFDTixDQUFDLENBQUM7QUFDTjs7Ozs7OztVQzVJQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7OztBQ05nRDtBQUN1Qzs7QUFFdkY7QUFDQTtBQUNBO0FBQ0EsTUFBTWlNLGdCQUFnQixDQUFDO0VBQ25CMU4sV0FBV0EsQ0FBQSxFQUFHO0lBQ1Y7SUFDQSxJQUFJLENBQUMyTixPQUFPLEdBQUcsSUFBSTVOLGlFQUFPLENBQUMsQ0FBQzs7SUFFNUI7SUFDQSxJQUFJLENBQUM2TixpQkFBaUIsR0FBRyxJQUFJOztJQUU3QjtJQUNBLElBQUksQ0FBQ0MsU0FBUyxHQUFHLElBQUk7SUFFckIsSUFBSSxDQUFDQyxZQUFZLENBQUMsQ0FBQztFQUN2Qjs7RUFFQTtBQUNKO0FBQ0E7RUFDSUEsWUFBWUEsQ0FBQSxFQUFHO0lBQ1gsSUFBSSxDQUFDSCxPQUFPLENBQUNuTCxFQUFFLENBQ1gsc0JBQXNCLEVBQ3RCLENBQUVyQixNQUFNLElBQUs7TUFDVCxRQUFRQSxNQUFNLENBQUM0TSxVQUFVO1FBQ3JCLEtBQUssUUFBUTtVQUFFO1lBQ1g7WUFDQTtZQUNBLElBQUksQ0FBQ0gsaUJBQWlCLEdBQUcsUUFBUTtZQUNqQyxJQUFJbkwsT0FBTyxHQUFHLElBQUksQ0FBQ3VMLG9CQUFvQixDQUFDdE0sSUFBSSxDQUFDLElBQUksQ0FBQztZQUNsRHVNLE1BQU0sQ0FBQ0MsZ0JBQWdCLENBQUMsU0FBUyxFQUFFekwsT0FBTyxDQUFDO1lBQzNDLElBQUksQ0FBQ29MLFNBQVMsR0FBRyxDQUFDLE1BQU07Y0FDcEJJLE1BQU0sQ0FBQ0UsbUJBQW1CLENBQUMsU0FBUyxFQUFFMUwsT0FBTyxDQUFDO1lBQ2xELENBQUMsRUFBRWYsSUFBSSxDQUFDLElBQUksQ0FBQztZQUNiO1VBQ0o7UUFDQTtVQUNJO01BQ1I7SUFDSixDQUFDLEVBQUVBLElBQUksQ0FBQyxJQUFJLENBQ2hCLENBQUM7SUFFRCxJQUFJLENBQUNpTSxPQUFPLENBQUNuTCxFQUFFLENBQUMsU0FBUyxFQUFHckIsTUFBTSxJQUFLO01BQ25DLFFBQVFBLE1BQU0sQ0FBQ2lOLE9BQU87UUFDbEIsS0FBSyw4QkFBOEI7VUFDL0IsSUFBSSxDQUFDQyxZQUFZLENBQUMsQ0FBQztVQUNuQjtRQUNKO1VBQ0k7TUFDUjtJQUNKLENBQUMsQ0FBQztFQUNOOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJQyxpQkFBaUJBLENBQUNDLE9BQU8sRUFBRTtJQUN2QixRQUFRLElBQUksQ0FBQ1gsaUJBQWlCO01BQzFCLEtBQUssUUFBUTtRQUFFO1VBQ1gsSUFBSVksTUFBTSxHQUFHQyxRQUFRLENBQUNDLGNBQWMsQ0FBQyxjQUFjLENBQUM7VUFDcEQsSUFBSUYsTUFBTSxLQUFLLElBQUksSUFBSUEsTUFBTSxLQUFLdkIsU0FBUyxFQUFFO1lBQ3pDdUIsTUFBTSxDQUFDRyxLQUFLLENBQUNDLFVBQVUsR0FBR0wsT0FBTyxHQUFHLFNBQVMsR0FBRyxRQUFRO1lBQ3hEO1VBQ0o7VUFDQTtRQUNKO01BQ0E7UUFDSTtJQUNSO0VBQ0o7O0VBRUE7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJTSxRQUFRQSxDQUFDQyxRQUFRLEVBQUVDLFFBQVEsRUFBRUMsUUFBUSxFQUFFO0lBQ25DLElBQUlDLElBQUksR0FBR1IsUUFBUSxDQUFDUyxJQUFJLENBQUNQLEtBQUssQ0FBQ1EsZ0JBQWdCLENBQUNMLFFBQVEsQ0FBQztJQUN6RCxJQUFJO01BQ0E7TUFDQSxJQUFJTSxVQUFVLEdBQUdDLFFBQVEsQ0FBQ0osSUFBSSxFQUFFLEVBQUUsQ0FBQztNQUNuQ1IsUUFBUSxDQUFDUyxJQUFJLENBQUNQLEtBQUssQ0FBQ1csT0FBTyxHQUFHYixRQUFRLENBQUNTLElBQUksQ0FBQ1AsS0FBSyxDQUFDVyxPQUFPLENBQUNDLE9BQU8sQ0FDN0QsSUFBSUMsTUFBTSxDQUFDLEdBQUdWLFFBQVEsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUNsQyxHQUFHQSxRQUFRLEtBQUtFLFFBQVEsR0FBR0QsUUFBUSxHQUFHSyxVQUFVLEdBQUdMLFFBQVEsZ0JBQy9ELENBQUM7SUFDTCxDQUFDLENBQUMsT0FBQVUsT0FBQSxFQUFNO01BQ0o7TUFDQWhCLFFBQVEsQ0FBQ1MsSUFBSSxDQUFDUCxLQUFLLENBQUNlLFdBQVcsQ0FBQ1osUUFBUSxFQUFFLEdBQUdDLFFBQVEsSUFBSSxFQUFFLFdBQVcsQ0FBQztJQUMzRTtFQUNKOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNJZixvQkFBb0JBLENBQUMyQixHQUFHLEVBQUU7SUFDdEIsSUFBSUMsSUFBSSxHQUFHaFAsSUFBSSxDQUFDQyxLQUFLLENBQUM4TyxHQUFHLENBQUNDLElBQUksQ0FBQztJQUMvQixJQUFJLENBQUNBLElBQUksQ0FBQzlPLElBQUksSUFBSThPLElBQUksQ0FBQzlPLElBQUksS0FBSyxxQ0FBcUMsRUFBRTtJQUV2RSxRQUFROE8sSUFBSSxDQUFDMU8sS0FBSztNQUNkLEtBQUssWUFBWTtRQUNiO1FBQ0E7UUFDQTtRQUNBO1FBQ0FnTSxtRkFBdUIsQ0FBQywwQkFBMEIsRUFBRTdDLHdFQUFnQixDQUFDLENBQUM3SSxJQUFJLENBQ3JFQyxNQUFNLElBQUs7VUFDUixJQUFJQSxNQUFNLENBQUNnTCx3QkFBd0IsRUFBRTtZQUNqQ29ELFVBQVUsQ0FBQyxNQUFNO2NBQ2IsSUFBSSxDQUFDdkIsaUJBQWlCLENBQUMsS0FBSyxDQUFDO2NBQzdCO2NBQ0E7Y0FDQSxJQUFJLENBQUNPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztZQUNqQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1VBQ1Q7UUFDSixDQUNKLENBQUM7O1FBRUQ7UUFDQSxJQUFJZSxJQUFJLENBQUNiLFFBQVEsSUFBSSxDQUFDLEVBQUU7VUFDcEIsSUFBSSxDQUFDbEIsU0FBUyxDQUFDLENBQUM7VUFDaEIsSUFBSSxDQUFDQSxTQUFTLEdBQUcsSUFBSTtVQUNyQixJQUFJLENBQUNELGlCQUFpQixHQUFHLElBQUk7UUFDakM7UUFDQTtNQUNKO1FBQ0k7SUFDUjtFQUNKOztFQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7RUFDSVMsWUFBWUEsQ0FBQSxFQUFHO0lBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQ1QsaUJBQWlCLEVBQUU7SUFFN0JWLG1GQUF1QixDQUFDLDBCQUEwQixFQUFFN0Msd0VBQWdCLENBQUMsQ0FBQzdJLElBQUksQ0FBRUMsTUFBTSxJQUFLO01BQ25GQSxNQUFNLENBQUNnTCx3QkFBd0IsR0FBRyxDQUFDaEwsTUFBTSxDQUFDZ0wsd0JBQXdCO01BQ2xFck0sTUFBTSxDQUFDa04sT0FBTyxDQUFDQyxJQUFJLENBQUMzTCxHQUFHLENBQUNILE1BQU0sQ0FBQztNQUUvQixRQUFRLElBQUksQ0FBQ21NLGlCQUFpQjtRQUMxQixLQUFLLFFBQVE7VUFBRTtZQUNYLElBQUluTSxNQUFNLENBQUNnTCx3QkFBd0IsRUFBRTtjQUNqQztjQUNBLElBQUksQ0FBQzZCLGlCQUFpQixDQUFDLEtBQUssQ0FBQztjQUM3QixJQUFJLENBQUNPLFFBQVEsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQztZQUNqQyxDQUFDLE1BQU07Y0FDSDtjQUNBLElBQUksQ0FBQ1AsaUJBQWlCLENBQUMsSUFBSSxDQUFDO2NBQzVCLElBQUksQ0FBQ08sUUFBUSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDO1lBQ2xDO1lBQ0E7VUFDSjtRQUNBO1VBQ0k7TUFDUjtJQUNKLENBQUMsQ0FBQztFQUNOO0FBQ0o7O0FBRUE7QUFDQVosTUFBTSxDQUFDNkIsNkJBQTZCLEdBQUcsSUFBSXBDLGdCQUFnQixDQUFDLENBQUMsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvZXZlbnQuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29tbW9uL3NjcmlwdHMvbGFuZ3VhZ2VzLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL3NldHRpbmdzLmpzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svYm9vdHN0cmFwIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9tYWtlIG5hbWVzcGFjZSBvYmplY3QiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvLi9zcmMvY29udGVudC9iYW5uZXJfY29udHJvbGxlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgRXZlbnRNYW5hZ2VyIGZyb20gXCIuL2V2ZW50LmpzXCI7XG5cbi8qKlxuICogQ2hhbm5lbCBmb3IgaW50ZXItY29udGV4dCBjb21tdW5pY2F0aW9uLlxuICpcbiAqIEEgY2hyb21lIGV4dGVuc2lvbiB0eXBpY2FsbHkgY29udGFpbnMgNCB0eXBlcyBvZiBjb250ZXh0OiBiYWNrZ3JvdW5kLCBwb3B1cCxcbiAqIG9wdGlvbnMgYW5kIGNvbnRlbnQgc2NyaXB0cy4gQ29tbXVuaWNhdGlvbiBiZXR3ZWVuIHRoZXNlIGNvbnRleHRzIHJlbGllcyBvblxuICogY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UgYW5kIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlLlxuICpcbiAqIFRoaXMgbW9kdWxlIHByb3ZpZGVzIHR3byBjb21tdW5pY2F0aW9uIG1vZGVsOlxuICogICAqIHJlcXVlc3QvcmVzcG9uc2VcbiAqICAgKiBldmVudCB0cmlnZ2VyL2xpc3RlblxuICpcbiAqIGJhc2VkIG9uIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlIGFuZCBjaHJvbWUudGFicy5zZW5kTWVzc2FnZS5cbiAqL1xuY2xhc3MgQ2hhbm5lbCB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPFN0cmluZywgRnVuY3Rpb24+fSBzZXJ2aWNlc1xuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fc2VydmljZXMgPSBuZXcgTWFwKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEB0eXBlIHtFdmVudE1hbmFnZXJ9IEV2ZW50IG1hbmFnZXIuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9ldmVudE1hbmFnZXIgPSBuZXcgRXZlbnRNYW5hZ2VyKCk7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlZ2lzdGVyIG1hc3NhZ2UgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBjaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoXG4gICAgICAgICAgICAoKG1lc3NhZ2UsIHNlbmRlciwgY2FsbGJhY2spID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgIGlmICghcGFyc2VkIHx8ICFwYXJzZWQudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBCYWQgbWVzc2FnZTogJHttZXNzYWdlfWApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3dpdGNoIChwYXJzZWQudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZXZlbnRcIjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50TWFuYWdlci5lbWl0KHBhcnNlZC5ldmVudCwgcGFyc2VkLmRldGFpbCwgc2VuZGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcInNlcnZpY2VcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3Qgc2VydmVyID0gdGhpcy5fc2VydmljZXMuZ2V0KHBhcnNlZC5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VydmVyKSBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgY2FuIGNhbGwgdGhlIGNhbGxiYWNrIG9ubHkgd2hlbiB3ZSByZWFsbHkgcHJvdmlkZSB0aGUgcmVxdWVzdGVkIHNlcnZpY2UuXG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2ZXIocGFyc2VkLnBhcmFtcywgc2VuZGVyKS50aGVuKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChyZXN1bHQpID0+IGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlc3VsdClcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5rbm93biBtZXNzYWdlIHR5cGU6ICR7bWVzc2FnZS50eXBlfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0pLmJpbmQodGhpcylcbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBQcm92aWRlIGEgc2VydmljZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZXJ2aWNlIHNlcnZpY2VcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzZXJ2ZXIgc2VydmVyLCBzZXJ2ZXIgZnVuY3Rpb24gbXVzdCByZXR1cm4gYSBQcm9taXNlIG9mIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHByb3ZpZGUoc2VydmljZSwgc2VydmVyKSB7XG4gICAgICAgIHRoaXMuX3NlcnZpY2VzLnNldChzZXJ2aWNlLCBzZXJ2ZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSByZXF1ZXN0IGFuZCBnZXQgYSByZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZXJ2aWNlIHNlcnZpY2UgbmFtZVxuICAgICAqIEBwYXJhbSB7QW55fSBwYXJhbXMgc2VydmljZSBwYXJhbWV0ZXJzXG4gICAgICogQHJldHVybnMge1Byb21pc2U8QW55Pn0gcHJvbWlzZSBvZiB0aGUgcmVzcG9uc2VcbiAgICAgKi9cbiAgICByZXF1ZXN0KHNlcnZpY2UsIHBhcmFtcykge1xuICAgICAgICBjb25zdCBtZXNzYWdlID0gSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiBcInNlcnZpY2VcIiwgc2VydmljZSwgcGFyYW1zIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGNocm9tZS5ydW50aW1lLmxhc3RFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFNlbmQgYSByZXF1ZXN0IHRvIHRoZSBzcGVjaWZpZWQgdGFiIGFuZCBnZXQgYSByZXNwb25zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB0YWJJZCB0YWIgaWRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VydmljZSBzZXJ2aWNlXG4gICAgICogQHBhcmFtIHtBbnl9IHBhcmFtcyBzZXJ2aWNlIHBhcmFtZXRlcnNcbiAgICAgKiBAcmV0dXJucyB7UHJvbWlzZTxBbnk+fSBwcm9taXNlIG9mIHRoZSByZXNwb25zZVxuICAgICAqL1xuICAgIHJlcXVlc3RUb1RhYih0YWJJZCwgc2VydmljZSwgcGFyYW1zKSB7XG4gICAgICAgIGNvbnN0IHNlbmQgPSB0aGlzLl9nZXRUYWJNZXNzYWdlU2VuZGVyKCk7XG4gICAgICAgIGlmICghc2VuZCkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiQ2FuIG5vdCBzZW5kIG1lc3NhZ2UgdG8gdGFicyBpbiBjdXJyZW50IGNvbnRleHQhXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJzZXJ2aWNlXCIsIHNlcnZpY2UsIHBhcmFtcyB9KTtcbiAgICAgICAgcmV0dXJuIHNlbmQodGFiSWQsIG1lc3NhZ2UpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50IHRvIGhhbmRsZVxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgZXZlbnQgaGFuZGxlciwgYWNjZXB0cyB0d28gYXJndW1lbnRzOlxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBldmVudCBkZXRhaWxcbiAgICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZTogc291cmNlIG9mIHRoZSBldmVudCwgY2hyb21lLnJ1bnRpbWUuTWVzc2FnZVNlbmRlciBvYmplY3RcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IGEgY2FuY2VsZXIgdGhhdCB3aWxsIHJlbW92ZSB0aGUgaGFuZGxlciB3aGVuIGNhbGxlZFxuICAgICAqL1xuICAgIG9uKGV2ZW50LCBoYW5kbGVyKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9ldmVudE1hbmFnZXIub24oZXZlbnQsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEVtaXQgYW4gZXZlbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnRcbiAgICAgKiBAcGFyYW0ge0FueX0gZGV0YWlsIGV2ZW50IGRldGFpbFxuICAgICAqL1xuICAgIGVtaXQoZXZlbnQsIGRldGFpbCkge1xuICAgICAgICBsZXQgbWVzc2FnZSA9IEpTT04uc3RyaW5naWZ5KHsgdHlwZTogXCJldmVudFwiLCBldmVudCwgZGV0YWlsIH0pO1xuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlLCAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBFbWl0IGFuIGV2ZW50IHRvIHNwZWNpZmllZCB0YWJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtOdW1iZXIgfCBBcnJheTxOdW1iZXI+fSB0YWJJZHMgdGFiIGlkc1xuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudFxuICAgICAqIEBwYXJhbSB7QW55fSBkZXRhaWwgZXZlbnQgZGV0YWlsXG4gICAgICovXG4gICAgZW1pdFRvVGFicyh0YWJJZHMsIGV2ZW50LCBkZXRhaWwpIHtcbiAgICAgICAgY29uc3Qgc2VuZCA9IHRoaXMuX2dldFRhYk1lc3NhZ2VTZW5kZXIoKTtcbiAgICAgICAgaWYgKCFzZW5kKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiQ2FuIG5vdCBzZW5kIG1lc3NhZ2UgdG8gdGFicyBpbiBjdXJyZW50IGNvbnRleHQhXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGFiSWRzIGlzIGEgbnVtYmVyLCB3cmFwIGl0IHVwIHdpdGggYW4gYXJyYXkuXG4gICAgICAgIGlmICh0eXBlb2YgdGFiSWRzID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgICAgICB0YWJJZHMgPSBbdGFiSWRzXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IG1lc3NhZ2UgPSBKU09OLnN0cmluZ2lmeSh7IHR5cGU6IFwiZXZlbnRcIiwgZXZlbnQsIGRldGFpbCB9KTtcbiAgICAgICAgZm9yIChsZXQgdGFiSWQgb2YgdGFiSWRzKSB7XG4gICAgICAgICAgICBzZW5kKHRhYklkLCBtZXNzYWdlKS5jYXRjaCgoZXJyb3IpID0+IGNvbnNvbGUuZXJyb3IoZXJyb3IpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEludGVybmFsIG1ldGhvZFxuICAgICAqXG4gICAgICogR2V0IHRoZSBtZXNzYWdlIHNlbmRpbmcgZnVuY3Rpb24gZm9yIHNlbmRpbmcgbWVzc2FnZSB0byB0YWJzLlxuICAgICAqXG4gICAgICogQHJldHVybnMge0Z1bmN0aW9uIHwgbnVsbH0gbWVzc2FnZSBzZW5kZXJcbiAgICAgKi9cbiAgICBfZ2V0VGFiTWVzc2FnZVNlbmRlcigpIHtcbiAgICAgICAgaWYgKEJST1dTRVJfRU5WID09PSBcImZpcmVmb3hcIikge1xuICAgICAgICAgICAgaWYgKCFicm93c2VyLnRhYnMgfHwgIWJyb3dzZXIudGFicy5zZW5kTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBGaXJlZm94IHVzZXMgUHJvbWlzZSwgcmV0dXJuIGRpcmVjdGx5LlxuICAgICAgICAgICAgcmV0dXJuIGJyb3dzZXIudGFicy5zZW5kTWVzc2FnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hyb21lLnRhYnMgfHwgIWNocm9tZS50YWJzLnNlbmRNZXNzYWdlKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENocm9tZSB1c2VzIGNhbGxiYWNrLCB3cmFwIGl0IHVwLlxuICAgICAgICByZXR1cm4gKHRhYklkLCBtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGNocm9tZS50YWJzLnNlbmRNZXNzYWdlKHRhYklkLCBtZXNzYWdlLCAocmVzdWx0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChjaHJvbWUucnVudGltZS5sYXN0RXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IENoYW5uZWw7XG4iLCIvKipcbiAqIEV2ZW50IG1hbmFnZXIuXG4gKi9cbmNsYXNzIEV2ZW50TWFuYWdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TnVtYmVyfSBuZXh0IGhhbmRsZXIgSUQuXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9oYW5kbGVySUQgPSAxO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPFN0cmluZywgU2V0PE51bWJlcj4+fSBldmVudCB0byBoYW5kbGVyIElEcyBtYXBcbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX2V2ZW50VG9IYW5kbGVySURzID0gbmV3IE1hcCgpO1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAdHlwZSB7TWFwPE51bWJlciwgRnVuY3Rpb24+fSBoYW5kbGVyIElEIHRvIGhhbmRsZXIgbWFwXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIgPSBuZXcgTWFwKCk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQWRkIGFuIGV2ZW50IGhhbmRsZXIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdG8gaGFuZGxlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gaGFuZGxlciBldmVudCBoYW5kbGVyLCBhY2NlcHRzIHR3byBhcmd1bWVudHM6XG4gICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IGV2ZW50IGRldGFpbFxuICAgICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlOiBzb3VyY2Ugb2YgdGhlIGV2ZW50LCBjaHJvbWUucnVudGltZS5NZXNzYWdlU2VuZGVyIG9iamVjdFxuICAgICAqIEByZXR1cm5zIHtGdW5jdGlvbn0gYSBjYW5jZWxlciB0aGF0IHdpbGwgcmVtb3ZlIHRoZSBoYW5kbGVyIHdoZW4gY2FsbGVkXG4gICAgICovXG4gICAgb24oZXZlbnQsIGhhbmRsZXIpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlcklEID0gdGhpcy5fYWxsb2NIYW5kbGVySUQoKTtcbiAgICAgICAgdGhpcy5faGFuZGxlcklEVG9IYW5kbGVyLnNldChoYW5kbGVySUQsIGhhbmRsZXIpO1xuXG4gICAgICAgIGlmICh0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5oYXMoZXZlbnQpKSB7XG4gICAgICAgICAgICB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpLmFkZChoYW5kbGVySUQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZXZlbnRUb0hhbmRsZXJJRHMuc2V0KGV2ZW50LCBuZXcgU2V0KFtoYW5kbGVySURdKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFYWNoIGNhbmNlbGVyIHNob3VsZCBiZSBjYWxsZWQgb25seSBvbmNlLlxuICAgICAgICBsZXQgY2FuY2VsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWNhbmNlbGVkKSB7XG4gICAgICAgICAgICAgICAgY2FuY2VsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuX29mZihldmVudCwgaGFuZGxlcklEKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiWW91IHNob3VsZG4ndCBjYWxsIHRoZSBjYW5jZWxlciBtb3JlIHRoYW4gb25jZSFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSGFuZGxlIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtBbnl9IGRldGFpbCBldmVudCBkZXRhaWxcbiAgICAgKiBAcGFyYW0ge0FueX0gc291cmNlIGV2ZW50IHNvdXJjZVxuICAgICAqL1xuICAgIGVtaXQoZXZlbnQsIGRldGFpbCwgc291cmNlKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRHMgPSB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpO1xuXG4gICAgICAgIGlmICghaGFuZGxlcklEcykgcmV0dXJuO1xuXG4gICAgICAgIGZvciAoY29uc3QgaGFuZGxlcklEIG9mIGhhbmRsZXJJRHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVySURUb0hhbmRsZXIuZ2V0KGhhbmRsZXJJRCk7XG4gICAgICAgICAgICBoYW5kbGVyICYmIGhhbmRsZXIoZGV0YWlsLCBzb3VyY2UpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogSW50ZXJuYWwgbWV0aG9kXG4gICAgICpcbiAgICAgKiBBbGxvYyBhIGhhbmRsZXIgSUQuXG4gICAgICpcbiAgICAgKiBAcmV0dXJucyB7TnVtYmVyfSBhbiB1bnVzZWQgaGFuZGxlciBJRFxuICAgICAqL1xuICAgIF9hbGxvY0hhbmRsZXJJRCgpIHtcbiAgICAgICAgd2hpbGUgKHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5oYXModGhpcy5faGFuZGxlcklEKSkge1xuICAgICAgICAgICAgdGhpcy5faGFuZGxlcklEID0gKHRoaXMuX2hhbmRsZXJJRCArIDEpICUgTnVtYmVyLk1BWF9TQUZFX0lOVEVHRVI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZXJJRDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJbnRlcm5hbCBtZXRob2RcbiAgICAgKlxuICAgICAqIFJlbW92ZSBhbiBldmVudCBoYW5kbGVyLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IGV2ZW50XG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGhhbmRsZXJJRCBoYW5kbGVyIElEXG4gICAgICovXG4gICAgX29mZihldmVudCwgaGFuZGxlcklEKSB7XG4gICAgICAgIGNvbnN0IGhhbmRsZXJJRHMgPSB0aGlzLl9ldmVudFRvSGFuZGxlcklEcy5nZXQoZXZlbnQpO1xuICAgICAgICBoYW5kbGVySURzICYmIGhhbmRsZXJJRHMuZGVsZXRlKGhhbmRsZXJJRCk7XG4gICAgICAgIHRoaXMuX2hhbmRsZXJJRFRvSGFuZGxlci5kZWxldGUoaGFuZGxlcklEKTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IEV2ZW50TWFuYWdlcjtcbiIsIi8qKlxuICogYSBtYXAgZnJvbSBhYmJyZXZpYXRpb24gb2YgbGFuZ3VhZ2VzIHRoYXQgc3VwcG9ydGVkIGJ5IGJyb3dzZXJzIHRvIGFiYnJldmlhdGlvbiBvZiB0aG9zZSBzdXBwb3J0ZWQgYnkgRWRnZSBUcmFuc2xhdGVcbiAqL1xuY29uc3QgQlJPV1NFUl9MQU5HVUFHRVNfTUFQID0ge1xuICAgIGFjaDogXCJhY2hcIixcbiAgICBhZHk6IFwiZW5cIixcbiAgICBhZjogXCJhZlwiLFxuICAgIFwiYWYtTkFcIjogXCJhZlwiLFxuICAgIFwiYWYtWkFcIjogXCJhZlwiLFxuICAgIGFrOiBcImFrYVwiLFxuICAgIGFtOiBcImFtXCIsXG4gICAgYXI6IFwiYXJcIixcbiAgICBcImFyLUFSXCI6IFwiYXJcIixcbiAgICBcImFyLU1BXCI6IFwiYXJcIixcbiAgICBcImFyLVNBXCI6IFwiYXJcIixcbiAgICBcImF5LUJPXCI6IFwiYXltXCIsXG4gICAgYXo6IFwiYXpcIixcbiAgICBcImF6LUFaXCI6IFwiYXpcIixcbiAgICBcImJlLUJZXCI6IFwiYmVcIixcbiAgICBiZzogXCJiZ1wiLFxuICAgIFwiYmctQkdcIjogXCJiZ1wiLFxuICAgIGJuOiBcImJuXCIsXG4gICAgXCJibi1JTlwiOiBcImJuXCIsXG4gICAgXCJibi1CRFwiOiBcImJuXCIsXG4gICAgXCJicy1CQVwiOiBcImJzXCIsXG4gICAgY2E6IFwiY2FcIixcbiAgICBcImNhLUVTXCI6IFwiY2FcIixcbiAgICBjYWs6IFwiZW5cIixcbiAgICBjZWI6IFwiY2ViXCIsXG4gICAgXCJjay1VU1wiOiBcImNoclwiLFxuICAgIGNvOiBcImNvXCIsXG4gICAgY3M6IFwiY3NcIixcbiAgICBcImNzLUNaXCI6IFwiY3NcIixcbiAgICBjeTogXCJjeVwiLFxuICAgIFwiY3ktR0JcIjogXCJjeVwiLFxuICAgIGRhOiBcImRhXCIsXG4gICAgXCJkYS1ES1wiOiBcImRhXCIsXG4gICAgZGU6IFwiZGVcIixcbiAgICBcImRlLUFUXCI6IFwiZGVcIixcbiAgICBcImRlLURFXCI6IFwiZGVcIixcbiAgICBcImRlLUNIXCI6IFwiZGVcIixcbiAgICBkc2I6IFwiZW5cIixcbiAgICBlbDogXCJlbFwiLFxuICAgIFwiZWwtR1JcIjogXCJlbFwiLFxuICAgIGVuOiBcImVuXCIsXG4gICAgXCJlbi1HQlwiOiBcImVuXCIsXG4gICAgXCJlbi1BVVwiOiBcImVuXCIsXG4gICAgXCJlbi1DQVwiOiBcImVuXCIsXG4gICAgXCJlbi1JRVwiOiBcImVuXCIsXG4gICAgXCJlbi1JTlwiOiBcImVuXCIsXG4gICAgXCJlbi1QSVwiOiBcImVuXCIsXG4gICAgXCJlbi1VRFwiOiBcImVuXCIsXG4gICAgXCJlbi1VU1wiOiBcImVuXCIsXG4gICAgXCJlbi1aQVwiOiBcImVuXCIsXG4gICAgXCJlbkBwaXJhdGVcIjogXCJlblwiLFxuICAgIGVvOiBcImVvXCIsXG4gICAgXCJlby1FT1wiOiBcImVvXCIsXG4gICAgZXM6IFwiZXNcIixcbiAgICBcImVzLUFSXCI6IFwiZXNcIixcbiAgICBcImVzLTQxOVwiOiBcImVzXCIsXG4gICAgXCJlcy1DTFwiOiBcImVzXCIsXG4gICAgXCJlcy1DT1wiOiBcImVzXCIsXG4gICAgXCJlcy1FQ1wiOiBcImVzXCIsXG4gICAgXCJlcy1FU1wiOiBcImVzXCIsXG4gICAgXCJlcy1MQVwiOiBcImVzXCIsXG4gICAgXCJlcy1OSVwiOiBcImVzXCIsXG4gICAgXCJlcy1NWFwiOiBcImVzXCIsXG4gICAgXCJlcy1VU1wiOiBcImVzXCIsXG4gICAgXCJlcy1WRVwiOiBcImVzXCIsXG4gICAgZXQ6IFwiZXRcIixcbiAgICBcImV0LUVFXCI6IFwiZXRcIixcbiAgICBldTogXCJldVwiLFxuICAgIFwiZXUtRVNcIjogXCJldVwiLFxuICAgIGZhOiBcImZhXCIsXG4gICAgXCJmYS1JUlwiOiBcImZhXCIsXG4gICAgXCJmYi1MVFwiOiBcImVuXCIsXG4gICAgZmY6IFwiZW5cIixcbiAgICBmaTogXCJmaVwiLFxuICAgIFwiZmktRklcIjogXCJmaVwiLFxuICAgIFwiZm8tRk9cIjogXCJmYW9cIixcbiAgICBmcjogXCJmclwiLFxuICAgIFwiZnItQ0FcIjogXCJmclwiLFxuICAgIFwiZnItRlJcIjogXCJmclwiLFxuICAgIFwiZnItQkVcIjogXCJmclwiLFxuICAgIFwiZnItQ0hcIjogXCJmclwiLFxuICAgIFwiZnktTkxcIjogXCJmeVwiLFxuICAgIGdhOiBcImdhXCIsXG4gICAgXCJnYS1JRVwiOiBcImdhXCIsXG4gICAgZ2Q6IFwiZ2RcIixcbiAgICBnbDogXCJnbFwiLFxuICAgIFwiZ2wtRVNcIjogXCJnbFwiLFxuICAgIFwiZ24tUFlcIjogXCJncm5cIixcbiAgICBcImd1LUlOXCI6IFwiZ3VcIixcbiAgICBcImd4LUdSXCI6IFwiZWxcIixcbiAgICBoYTogXCJoYVwiLFxuICAgIGhhdzogXCJoYXdcIixcbiAgICBoZTogXCJoZVwiLFxuICAgIFwiaGUtSUxcIjogXCJoZVwiLFxuICAgIGhpOiBcImhpXCIsXG4gICAgXCJoaS1JTlwiOiBcImhpXCIsXG4gICAgaG1uOiBcImhtblwiLFxuICAgIGhyOiBcImhyXCIsXG4gICAgXCJoci1IUlwiOiBcImhyXCIsXG4gICAgaHNiOiBcImVuXCIsXG4gICAgaHQ6IFwiaHRcIixcbiAgICBodTogXCJodVwiLFxuICAgIFwiaHUtSFVcIjogXCJodVwiLFxuICAgIFwiaHktQU1cIjogXCJoeVwiLFxuICAgIGlkOiBcImlkXCIsXG4gICAgXCJpZC1JRFwiOiBcImlkXCIsXG4gICAgaWc6IFwiaWdcIixcbiAgICBpczogXCJpc1wiLFxuICAgIFwiaXMtSVNcIjogXCJpc1wiLFxuICAgIGl0OiBcIml0XCIsXG4gICAgXCJpdC1JVFwiOiBcIml0XCIsXG4gICAgaXc6IFwiaGVcIixcbiAgICBqYTogXCJqYVwiLFxuICAgIFwiamEtSlBcIjogXCJqYVwiLFxuICAgIFwianYtSURcIjogXCJqd1wiLFxuICAgIFwia2EtR0VcIjogXCJrYVwiLFxuICAgIFwia2stS1pcIjogXCJra1wiLFxuICAgIGttOiBcImttXCIsXG4gICAgXCJrbS1LSFwiOiBcImttXCIsXG4gICAga2FiOiBcImthYlwiLFxuICAgIGtuOiBcImtuXCIsXG4gICAgXCJrbi1JTlwiOiBcImtuXCIsXG4gICAga286IFwia29cIixcbiAgICBcImtvLUtSXCI6IFwia29cIixcbiAgICBcImt1LVRSXCI6IFwia3VcIixcbiAgICBreTogXCJreVwiLFxuICAgIGxhOiBcImxhXCIsXG4gICAgXCJsYS1WQVwiOiBcImxhXCIsXG4gICAgbGI6IFwibGJcIixcbiAgICBcImxpLU5MXCI6IFwibGltXCIsXG4gICAgbG86IFwibG9cIixcbiAgICBsdDogXCJsdFwiLFxuICAgIFwibHQtTFRcIjogXCJsdFwiLFxuICAgIGx2OiBcImx2XCIsXG4gICAgXCJsdi1MVlwiOiBcImx2XCIsXG4gICAgbWFpOiBcIm1haVwiLFxuICAgIFwibWctTUdcIjogXCJtZ1wiLFxuICAgIG1pOiBcIm1pXCIsXG4gICAgbWs6IFwibWtcIixcbiAgICBcIm1rLU1LXCI6IFwibWtcIixcbiAgICBtbDogXCJtbFwiLFxuICAgIFwibWwtSU5cIjogXCJtbFwiLFxuICAgIFwibW4tTU5cIjogXCJtblwiLFxuICAgIG1yOiBcIm1yXCIsXG4gICAgXCJtci1JTlwiOiBcIm1yXCIsXG4gICAgbXM6IFwibXNcIixcbiAgICBcIm1zLU1ZXCI6IFwibXNcIixcbiAgICBtdDogXCJtdFwiLFxuICAgIFwibXQtTVRcIjogXCJtdFwiLFxuICAgIG15OiBcIm15XCIsXG4gICAgbm86IFwibm9cIixcbiAgICBuYjogXCJub1wiLFxuICAgIFwibmItTk9cIjogXCJub1wiLFxuICAgIG5lOiBcIm5lXCIsXG4gICAgXCJuZS1OUFwiOiBcIm5lXCIsXG4gICAgbmw6IFwibmxcIixcbiAgICBcIm5sLUJFXCI6IFwibmxcIixcbiAgICBcIm5sLU5MXCI6IFwibmxcIixcbiAgICBcIm5uLU5PXCI6IFwibm9cIixcbiAgICBueTogXCJueVwiLFxuICAgIG9jOiBcIm9jaVwiLFxuICAgIFwib3ItSU5cIjogXCJvclwiLFxuICAgIHBhOiBcInBhXCIsXG4gICAgXCJwYS1JTlwiOiBcInBhXCIsXG4gICAgcGw6IFwicGxcIixcbiAgICBcInBsLVBMXCI6IFwicGxcIixcbiAgICBcInBzLUFGXCI6IFwicHNcIixcbiAgICBwdDogXCJwdFwiLFxuICAgIFwicHQtQlJcIjogXCJwdFwiLFxuICAgIFwicHQtUFRcIjogXCJwdFwiLFxuICAgIFwicXUtUEVcIjogXCJxdWVcIixcbiAgICBcInJtLUNIXCI6IFwicm9oXCIsXG4gICAgcm86IFwicm9cIixcbiAgICBcInJvLVJPXCI6IFwicm9cIixcbiAgICBydTogXCJydVwiLFxuICAgIFwicnUtUlVcIjogXCJydVwiLFxuICAgIFwic2EtSU5cIjogXCJzYW5cIixcbiAgICBzZDogXCJzZFwiLFxuICAgIFwic2UtTk9cIjogXCJzbWVcIixcbiAgICBcInNpLUxLXCI6IFwic2lcIixcbiAgICBzazogXCJza1wiLFxuICAgIFwic2stU0tcIjogXCJza1wiLFxuICAgIHNsOiBcInNsXCIsXG4gICAgXCJzbC1TSVwiOiBcInNsXCIsXG4gICAgc206IFwic21cIixcbiAgICBzbjogXCJzblwiLFxuICAgIFwic28tU09cIjogXCJzb1wiLFxuICAgIHNxOiBcInNxXCIsXG4gICAgXCJzcS1BTFwiOiBcInNxXCIsXG4gICAgc3I6IFwic3JcIixcbiAgICBcInNyLVJTXCI6IFwic3JcIixcbiAgICBzdDogXCJzdFwiLFxuICAgIHN1OiBcInN1XCIsXG4gICAgc3Y6IFwic3ZcIixcbiAgICBcInN2LVNFXCI6IFwic3ZcIixcbiAgICBzdzogXCJzd1wiLFxuICAgIFwic3ctS0VcIjogXCJzd1wiLFxuICAgIHRhOiBcInRhXCIsXG4gICAgXCJ0YS1JTlwiOiBcInRhXCIsXG4gICAgdGU6IFwidGVcIixcbiAgICBcInRlLUlOXCI6IFwidGVcIixcbiAgICB0ZzogXCJ0Z1wiLFxuICAgIFwidGctVEpcIjogXCJ0Z1wiLFxuICAgIHRoOiBcInRoXCIsXG4gICAgXCJ0aC1USFwiOiBcInRoXCIsXG4gICAgdGw6IFwiZmlsXCIsXG4gICAgXCJ0bC1QSFwiOiBcImZpbFwiLFxuICAgIHRsaDogXCJ0bGhcIixcbiAgICB0cjogXCJ0clwiLFxuICAgIFwidHItVFJcIjogXCJ0clwiLFxuICAgIFwidHQtUlVcIjogXCJ0YXRcIixcbiAgICB1azogXCJ1a1wiLFxuICAgIFwidWstVUFcIjogXCJ1a1wiLFxuICAgIHVyOiBcInVyXCIsXG4gICAgXCJ1ci1QS1wiOiBcInVyXCIsXG4gICAgdXo6IFwidXpcIixcbiAgICBcInV6LVVaXCI6IFwidXpcIixcbiAgICB2aTogXCJ2aVwiLFxuICAgIFwidmktVk5cIjogXCJ2aVwiLFxuICAgIFwieGgtWkFcIjogXCJ4aFwiLFxuICAgIHlpOiBcInlpXCIsXG4gICAgXCJ5aS1ERVwiOiBcInlpXCIsXG4gICAgeW86IFwieW9cIixcbiAgICB6aDogXCJ6aC1DTlwiLFxuICAgIFwiemgtSGFuc1wiOiBcInpoLUNOXCIsXG4gICAgXCJ6aC1IYW50XCI6IFwiemgtVFdcIixcbiAgICBcInpoLUNOXCI6IFwiemgtQ05cIixcbiAgICBcInpoLUhLXCI6IFwiemgtVFdcIixcbiAgICBcInpoLVNHXCI6IFwiemgtQ05cIixcbiAgICBcInpoLVRXXCI6IFwiemgtVFdcIixcbiAgICBcInp1LVpBXCI6IFwienVcIixcbn07XG5cbi8qKlxuICogRXhwb3J0IGxhbmd1YWdlcyBhbmQgYnJvd3NlciBsYW5ndWFnZXMgbWFwLlxuICovXG5leHBvcnQgeyBCUk9XU0VSX0xBTkdVQUdFU19NQVAgfTtcbiIsImltcG9ydCB7IEJST1dTRVJfTEFOR1VBR0VTX01BUCB9IGZyb20gXCJjb21tb24vc2NyaXB0cy9sYW5ndWFnZXMuanNcIjtcblxuLyoqXG4gKiBkZWZhdWx0IHNldHRpbmdzIGZvciB0aGlzIGV4dGVuc2lvblxuICovXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTID0ge1xuICAgIGJsYWNrbGlzdDoge1xuICAgICAgICB1cmxzOiB7fSxcbiAgICAgICAgZG9tYWluczogeyBcImNocm9tZS5nb29nbGUuY29tXCI6IHRydWUsIGV4dGVuc2lvbnM6IHRydWUgfSxcbiAgICB9LFxuICAgIC8vIFJlc2l6ZTogZGV0ZXJtaW5lIHdoZXRoZXIgdGhlIHdlYiBwYWdlIHdpbGwgcmVzaXplIHdoZW4gc2hvd2luZyB0cmFuc2xhdGlvbiByZXN1bHRcbiAgICAvLyBSVEw6IGRldGVybWluZSB3aGV0aGVyIHRoZSB0ZXh0IGluIHRyYW5zbGF0aW9uIGJsb2NrIHNob3VsZCBkaXNwbGF5IGZyb20gcmlnaHQgdG8gbGVmdFxuICAgIC8vIEZvbGRMb25nQ29udGVudDogZGV0ZXJtaW5lIHdoZXRoZXIgdG8gZm9sZCBsb25nIHRyYW5zbGF0aW9uIGNvbnRlbnRcbiAgICAvLyBTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbjogdGhlIHBvc2l0aW9uIG9mIHNlbGVjdCB0cmFuc2xhdGUgYnV0dG9uLlxuICAgIExheW91dFNldHRpbmdzOiB7XG4gICAgICAgIFJlc2l6ZTogZmFsc2UsXG4gICAgICAgIFJUTDogZmFsc2UsXG4gICAgICAgIEZvbGRMb25nQ29udGVudDogdHJ1ZSxcbiAgICAgICAgU2VsZWN0VHJhbnNsYXRlUG9zaXRpb246IFwiVG9wUmlnaHRcIixcbiAgICB9LFxuICAgIC8vIERlZmF1bHQgc2V0dGluZ3Mgb2Ygc291cmNlIGxhbmd1YWdlIGFuZCB0YXJnZXQgbGFuZ3VhZ2VcbiAgICBsYW5ndWFnZVNldHRpbmc6IHsgc2w6IFwiYXV0b1wiLCB0bDogQlJPV1NFUl9MQU5HVUFHRVNfTUFQW2Nocm9tZS5pMThuLmdldFVJTGFuZ3VhZ2UoKV0gfSxcbiAgICBPdGhlclNldHRpbmdzOiB7XG4gICAgICAgIE11dHVhbFRyYW5zbGF0ZTogZmFsc2UsXG4gICAgICAgIFNlbGVjdFRyYW5zbGF0ZTogdHJ1ZSxcbiAgICAgICAgVHJhbnNsYXRlQWZ0ZXJEYmxDbGljazogZmFsc2UsXG4gICAgICAgIFRyYW5zbGF0ZUFmdGVyU2VsZWN0OiBmYWxzZSxcbiAgICAgICAgQ2FuY2VsVGV4dFNlbGVjdGlvbjogZmFsc2UsXG4gICAgICAgIFVzZUdvb2dsZUFuYWx5dGljczogdHJ1ZSxcbiAgICB9LFxuICAgIERlZmF1bHRUcmFuc2xhdG9yOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgIERlZmF1bHRQYWdlVHJhbnNsYXRvcjogXCJHb29nbGVQYWdlVHJhbnNsYXRlXCIsXG4gICAgSHlicmlkVHJhbnNsYXRvckNvbmZpZzoge1xuICAgICAgICAvLyBUaGUgdHJhbnNsYXRvcnMgdXNlZCBpbiBjdXJyZW50IGh5YnJpZCB0cmFuc2xhdGUuXG4gICAgICAgIHRyYW5zbGF0b3JzOiBbXCJCaW5nVHJhbnNsYXRlXCIsIFwiR29vZ2xlVHJhbnNsYXRlXCJdLFxuXG4gICAgICAgIC8vIFRoZSB0cmFuc2xhdG9ycyBmb3IgZWFjaCBpdGVtLlxuICAgICAgICBzZWxlY3Rpb25zOiB7XG4gICAgICAgICAgICAvLyBBVFRFTlRJT046IFRoZSBmb2xsb3dpbmcgZm91ciBpdGVtcyBNVVNUIEhBVkUgVEhFIFNBTUUgVFJBTlNMQVRPUiFcbiAgICAgICAgICAgIG9yaWdpbmFsVGV4dDogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIG1haW5NZWFuaW5nOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICAgICAgdFByb251bmNpYXRpb246IFwiR29vZ2xlVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBzUHJvbnVuY2lhdGlvbjogXCJHb29nbGVUcmFuc2xhdGVcIixcblxuICAgICAgICAgICAgLy8gRm9yIHRoZSBmb2xsb3dpbmcgdGhyZWUgaXRlbXMsIGFueSB0cmFuc2xhdG9yIGNvbWJpbmF0aW9uIGlzIE9LLlxuICAgICAgICAgICAgZGV0YWlsZWRNZWFuaW5nczogXCJCaW5nVHJhbnNsYXRlXCIsXG4gICAgICAgICAgICBkZWZpbml0aW9uczogXCJHb29nbGVUcmFuc2xhdGVcIixcbiAgICAgICAgICAgIGV4YW1wbGVzOiBcIkdvb2dsZVRyYW5zbGF0ZVwiLFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgLy8gRGVmaW5lcyB3aGljaCBjb250ZW50cyBpbiB0aGUgdHJhbnNsYXRpbmcgcmVzdWx0IHNob3VsZCBiZSBkaXNwbGF5ZWQuXG4gICAgVHJhbnNsYXRlUmVzdWx0RmlsdGVyOiB7XG4gICAgICAgIG1haW5NZWFuaW5nOiB0cnVlLFxuICAgICAgICBvcmlnaW5hbFRleHQ6IHRydWUsXG4gICAgICAgIHRQcm9udW5jaWF0aW9uOiB0cnVlLFxuICAgICAgICBzUHJvbnVuY2lhdGlvbjogdHJ1ZSxcbiAgICAgICAgdFByb251bmNpYXRpb25JY29uOiB0cnVlLFxuICAgICAgICBzUHJvbnVuY2lhdGlvbkljb246IHRydWUsXG4gICAgICAgIGRldGFpbGVkTWVhbmluZ3M6IHRydWUsXG4gICAgICAgIGRlZmluaXRpb25zOiB0cnVlLFxuICAgICAgICBleGFtcGxlczogdHJ1ZSxcbiAgICB9LFxuICAgIC8vIERlZmluZXMgdGhlIG9yZGVyIG9mIGRpc3BsYXlpbmcgY29udGVudHMuXG4gICAgQ29udGVudERpc3BsYXlPcmRlcjogW1xuICAgICAgICBcIm1haW5NZWFuaW5nXCIsXG4gICAgICAgIFwib3JpZ2luYWxUZXh0XCIsXG4gICAgICAgIFwiZGV0YWlsZWRNZWFuaW5nc1wiLFxuICAgICAgICBcImRlZmluaXRpb25zXCIsXG4gICAgICAgIFwiZXhhbXBsZXNcIixcbiAgICBdLFxuICAgIEhpZGVQYWdlVHJhbnNsYXRvckJhbm5lcjogZmFsc2UsXG59O1xuXG4vKipcbiAqIGFzc2lnbiBkZWZhdWx0IHZhbHVlIHRvIHNldHRpbmdzIHdoaWNoIGFyZSB1bmRlZmluZWQgaW4gcmVjdXJzaXZlIHdheVxuICogQHBhcmFtIHsqfSByZXN1bHQgc2V0dGluZyByZXN1bHQgc3RvcmVkIGluIGNocm9tZS5zdG9yYWdlXG4gKiBAcGFyYW0geyp9IHNldHRpbmdzIGRlZmF1bHQgc2V0dGluZ3NcbiAqL1xuZnVuY3Rpb24gc2V0RGVmYXVsdFNldHRpbmdzKHJlc3VsdCwgc2V0dGluZ3MpIHtcbiAgICBmb3IgKGxldCBpIGluIHNldHRpbmdzKSB7XG4gICAgICAgIC8vIHNldHRpbmdzW2ldIGNvbnRhaW5zIGtleS12YWx1ZSBzZXR0aW5nc1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0eXBlb2Ygc2V0dGluZ3NbaV0gPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgICAgICEoc2V0dGluZ3NbaV0gaW5zdGFuY2VvZiBBcnJheSkgJiZcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNldHRpbmdzW2ldKS5sZW5ndGggPiAwXG4gICAgICAgICkge1xuICAgICAgICAgICAgaWYgKHJlc3VsdFtpXSkge1xuICAgICAgICAgICAgICAgIHNldERlZmF1bHRTZXR0aW5ncyhyZXN1bHRbaV0sIHNldHRpbmdzW2ldKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gc2V0dGluZ3NbaV0gY29udGFpbnMgc2V2ZXJhbCBzZXR0aW5nIGl0ZW1zIGJ1dCB0aGVzZSBoYXZlIG5vdCBiZWVuIHNldCBiZWZvcmVcbiAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSBzZXR0aW5nc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChyZXN1bHRbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gc2V0dGluZ3NbaV0gaXMgYSBzaW5nbGUgc2V0dGluZyBpdGVtIGFuZCBpdCBoYXMgbm90IGJlZW4gc2V0IGJlZm9yZVxuICAgICAgICAgICAgcmVzdWx0W2ldID0gc2V0dGluZ3NbaV07XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogR2V0IHNldHRpbmdzIGZyb20gc3RvcmFnZS4gSWYgc29tZSBvZiB0aGUgc2V0dGluZ3MgaGF2ZSBub3QgYmVlbiBpbml0aWFsaXplZCxcbiAqIGluaXRpYWxpemUgdGhlbSB3aXRoIHRoZSBnaXZlbiBkZWZhdWx0IHZhbHVlcy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZyB8IEFycmF5PFN0cmluZz59IHNldHRpbmdzIHNldHRpbmcgbmFtZSB0byBnZXRcbiAqIEBwYXJhbSB7T2JqZWN0IHwgRnVuY3Rpb259IGRlZmF1bHRzIGRlZmF1bHQgdmFsdWVzIG9yIGZ1bmN0aW9uIHRvIGdlbmVyYXRlIGRlZmF1bHQgdmFsdWVzXG4gKiBAcmV0dXJucyB7UHJvbWlzZTxBbnk+fSBzZXR0aW5nc1xuICovXG5mdW5jdGlvbiBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhzZXR0aW5ncywgZGVmYXVsdHMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgb25seSBvbmUgc2V0dGluZyB0byBnZXQsIHdhcnAgaXQgdXAuXG4gICAgICAgIGlmICh0eXBlb2Ygc2V0dGluZ3MgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHNldHRpbmdzID0gW3NldHRpbmdzXTtcbiAgICAgICAgfSBlbHNlIGlmIChzZXR0aW5ncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBJZiBzZXR0aW5ncyBpcyB1bmRlZmluZWQsIGNvbGxlY3QgYWxsIHNldHRpbmcga2V5cyBpbiBkZWZhdWx0cy5cbiAgICAgICAgICAgIHNldHRpbmdzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gZGVmYXVsdHMpIHtcbiAgICAgICAgICAgICAgICBzZXR0aW5ncy5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLmdldChzZXR0aW5ncywgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgICAgbGV0IHVwZGF0ZWQgPSBmYWxzZTtcblxuICAgICAgICAgICAgZm9yIChsZXQgc2V0dGluZyBvZiBzZXR0aW5ncykge1xuICAgICAgICAgICAgICAgIGlmICghcmVzdWx0W3NldHRpbmddKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZGVmYXVsdHMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdHMgPSBkZWZhdWx0cyhzZXR0aW5ncyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0W3NldHRpbmddID0gZGVmYXVsdHNbc2V0dGluZ107XG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVwZGF0ZWQpIHtcbiAgICAgICAgICAgICAgICBjaHJvbWUuc3RvcmFnZS5zeW5jLnNldChyZXN1bHQsICgpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cbmV4cG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIHNldERlZmF1bHRTZXR0aW5ncywgZ2V0T3JTZXREZWZhdWx0U2V0dGluZ3MgfTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiaW1wb3J0IENoYW5uZWwgZnJvbSBcImNvbW1vbi9zY3JpcHRzL2NoYW5uZWwuanNcIjtcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzIH0gZnJvbSBcImNvbW1vbi9zY3JpcHRzL3NldHRpbmdzLmpzXCI7XG5cbi8qKlxuICogQ29udHJvbCB0aGUgdmlzaWJpbGl0eSBvZiBwYWdlIHRyYW5zbGF0b3IgYmFubmVycy5cbiAqL1xuY2xhc3MgQmFubmVyQ29udHJvbGxlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIC8vIENvbW11bmljYXRpb24gY2hhbm5lbC5cbiAgICAgICAgdGhpcy5jaGFubmVsID0gbmV3IENoYW5uZWwoKTtcblxuICAgICAgICAvLyBBbGxvd2VkIHRyYW5zbGF0b3I6IGdvb2dsZS5cbiAgICAgICAgdGhpcy5jdXJyZW50VHJhbnNsYXRvciA9IG51bGw7XG5cbiAgICAgICAgLy8gTWVzc2FnZSBsaXN0ZW5lciBjYW5jZWxsZXIuXG4gICAgICAgIHRoaXMuY2FuY2VsbGVyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmFkZExpc3RlbmVycygpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEFkZCBldmVudCBhbmQgbWVzc2FnZSBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgYWRkTGlzdGVuZXJzKCkge1xuICAgICAgICB0aGlzLmNoYW5uZWwub24oXG4gICAgICAgICAgICBcInN0YXJ0X3BhZ2VfdHJhbnNsYXRlXCIsXG4gICAgICAgICAgICAoKGRldGFpbCkgPT4ge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoZGV0YWlsLnRyYW5zbGF0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImdvb2dsZVwiOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBHb29nbGUgcGFnZSB0cmFuc2xhdG9yIHJ1bnMgaW4gd2Vic2l0ZSBjb250ZXh0LCBzbyB3ZSB1c2Ugd2luZG93LnBvc3RNZXNzYWdlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmb3IgbWVzc2FnZSBwYXNzaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VHJhbnNsYXRvciA9IFwiZ29vZ2xlXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgaGFuZGxlciA9IHRoaXMuZ29vZ2xlTWVzc2FnZUhhbmRsZXIuYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBoYW5kbGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2FuY2VsbGVyID0gKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmJpbmQodGhpcylcbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLmNoYW5uZWwub24oXCJjb21tYW5kXCIsIChkZXRhaWwpID0+IHtcbiAgICAgICAgICAgIHN3aXRjaCAoZGV0YWlsLmNvbW1hbmQpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwidG9nZ2xlX3BhZ2VfdHJhbnNsYXRlX2Jhbm5lclwiOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRvZ2dsZUJhbm5lcigpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVG9nZ2xlIHRoZSB2aXNpYmlsaXR5IG9mIGJhbm5lciBmcmFtZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdmlzaWJsZSB0aGUgdmlzaWJpbGl0eSBvZiBiYW5uZXIgZnJhbWUuXG4gICAgICogQHJldHVybnMge3ZvaWR9IG5vdGhpbmdcbiAgICAgKi9cbiAgICB0b2dnbGVCYW5uZXJGcmFtZSh2aXNpYmxlKSB7XG4gICAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50VHJhbnNsYXRvcikge1xuICAgICAgICAgICAgY2FzZSBcImdvb2dsZVwiOiB7XG4gICAgICAgICAgICAgICAgbGV0IGJhbm5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiOjAuY29udGFpbmVyXCIpO1xuICAgICAgICAgICAgICAgIGlmIChiYW5uZXIgIT09IG51bGwgJiYgYmFubmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFubmVyLnN0eWxlLnZpc2liaWxpdHkgPSB2aXNpYmxlID8gXCJ2aXNpYmxlXCIgOiBcImhpZGRlblwiO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE1vdmUgdGhlIHBhZ2UgYm9keS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBwcm9wZXJ0eSBpbmRpY2F0ZXMgd2hpY2ggc3R5bGUgcHJvcGVydHkgdG8gdXNlIGZvciBtb3ZpbmcuIEdvb2dsZSB1c2VzIFwidG9wXCIuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gZGlzdGFuY2UgdGhlIGRpc3RhbmNlIHRvIG1vdmUuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBhYnNvbHV0ZSB3aGV0aGVyIHRoZSBkaXN0YW5jZSBpcyByZWxhdGl2ZSBvciBhYnNvbHV0ZS5cbiAgICAgKi9cbiAgICBtb3ZlUGFnZShwcm9wZXJ0eSwgZGlzdGFuY2UsIGFic29sdXRlKSB7XG4gICAgICAgIGxldCBvcmlnID0gZG9jdW1lbnQuYm9keS5zdHlsZS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFRoZSBwcm9wZXJ0eSBoYXMgdmFsdWUgb3JpZ2luYWxseS5cbiAgICAgICAgICAgIGxldCBvcmlnX3ZhbHVlID0gcGFyc2VJbnQob3JpZywgMTApO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jc3NUZXh0ID0gZG9jdW1lbnQuYm9keS5zdHlsZS5jc3NUZXh0LnJlcGxhY2UoXG4gICAgICAgICAgICAgICAgbmV3IFJlZ0V4cChgJHtwcm9wZXJ0eX06Lio7YCwgXCJnXCIpLFxuICAgICAgICAgICAgICAgIGAke3Byb3BlcnR5fTogJHthYnNvbHV0ZSA/IGRpc3RhbmNlIDogb3JpZ192YWx1ZSArIGRpc3RhbmNlfXB4ICFpbXBvcnRhbnQ7YFxuICAgICAgICAgICAgKTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICAvLyBUaGUgcHJvcGVydHkgaGFzIG5vIHZhbGlkIHZhbHVlIG9yaWdpbmFsbHksIG1vdmUgYWJzb2x1dGVseS5cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuc2V0UHJvcGVydHkocHJvcGVydHksIGAke2Rpc3RhbmNlfXB4YCwgXCJpbXBvcnRhbnRcIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBIYW5kbGUgbWVzc2FnZXMgc2VudCBieSBHb29nbGUgcGFnZSB0cmFuc2xhdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG1zZyB0aGUgbWVzc2FnZSBjb250ZW50LlxuICAgICAqIEByZXR1cm5zIHt2b2lkfSBub3RoaW5nXG4gICAgICovXG4gICAgZ29vZ2xlTWVzc2FnZUhhbmRsZXIobXNnKSB7XG4gICAgICAgIGxldCBkYXRhID0gSlNPTi5wYXJzZShtc2cuZGF0YSk7XG4gICAgICAgIGlmICghZGF0YS50eXBlIHx8IGRhdGEudHlwZSAhPT0gXCJlZGdlX3RyYW5zbGF0ZV9wYWdlX3RyYW5zbGF0ZV9ldmVudFwiKSByZXR1cm47XG5cbiAgICAgICAgc3dpdGNoIChkYXRhLmV2ZW50KSB7XG4gICAgICAgICAgICBjYXNlIFwicGFnZV9tb3ZlZFwiOlxuICAgICAgICAgICAgICAgIC8vIFRoZSBcInBhZ2VfbW92ZWRcIiBldmVudCBtYXkgYmUgc2VudCB3aGVuIHRoZSBiYW5uZXIgaXMgY3JlYXRlZCBvciBkZXN0cm95ZWQuXG4gICAgICAgICAgICAgICAgLy8gSWYgdGhlIGRpc3RhbmNlIHByb3BlcnR5IGlzIHBvc2l0aXZlLCBpdCBtZWFucyB0aGUgYmFubmVyIGlzIGNyZWF0ZWQsIGFuZFxuICAgICAgICAgICAgICAgIC8vIHRoZSBwYWdlIGhhcyBiZWVuIG1vdmVkIGRvd24uIEVsc2UgaWYgaXQgaXMgbmVnYXRpdmUsIGl0IG1lYW5zIHRoZSBiYW5uZXIgaXNcbiAgICAgICAgICAgICAgICAvLyBkZXN0cm95ZWQsIGFuZCB0aGUgYmFubmVyIGhhcyBiZWVuIG1vdmVkIHVwLlxuICAgICAgICAgICAgICAgIGdldE9yU2V0RGVmYXVsdFNldHRpbmdzKFwiSGlkZVBhZ2VUcmFuc2xhdG9yQmFubmVyXCIsIERFRkFVTFRfU0VUVElOR1MpLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgIChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuSGlkZVBhZ2VUcmFuc2xhdG9yQmFubmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlQmFubmVyRnJhbWUoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiB1c2VyIGRlY2lkZSB0byBoaWRlIHRoZSBiYW5uZXIsIHdlIGp1c3Qga2VlcCB0aGUgdG9wXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG9mIHRoZSBwYWdlIGF0IDBweC5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlUGFnZShcInRvcFwiLCAwLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgYmFubmVyIGlzIGRlc3Ryb3llZCwgd2Ugc2hvdWxkIGNhbmNlbCBsaXN0ZW5lcnMuXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuZGlzdGFuY2UgPD0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbGxlcigpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbmNlbGxlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRyYW5zbGF0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUb2dnbGUgdGhlIHZpc2liaWxpdHkgb2YgdGhlIGJhbm5lci5cbiAgICAgKlxuICAgICAqIEByZXR1cm5zIHt2b2lkfSBub3RoaW5nXG4gICAgICovXG4gICAgdG9nZ2xlQmFubmVyKCkge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudFRyYW5zbGF0b3IpIHJldHVybjtcblxuICAgICAgICBnZXRPclNldERlZmF1bHRTZXR0aW5ncyhcIkhpZGVQYWdlVHJhbnNsYXRvckJhbm5lclwiLCBERUZBVUxUX1NFVFRJTkdTKS50aGVuKChyZXN1bHQpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5IaWRlUGFnZVRyYW5zbGF0b3JCYW5uZXIgPSAhcmVzdWx0LkhpZGVQYWdlVHJhbnNsYXRvckJhbm5lcjtcbiAgICAgICAgICAgIGNocm9tZS5zdG9yYWdlLnN5bmMuc2V0KHJlc3VsdCk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy5jdXJyZW50VHJhbnNsYXRvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgXCJnb29nbGVcIjoge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0LkhpZGVQYWdlVHJhbnNsYXRvckJhbm5lcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGlkZSB0aGUgYmFubmVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVCYW5uZXJGcmFtZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vdmVQYWdlKFwidG9wXCIsIDAsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdyB0aGUgYmFubmVyLlxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50b2dnbGVCYW5uZXJGcmFtZSh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW92ZVBhZ2UoXCJ0b3BcIiwgNDAsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4vLyBDcmVhdGUgdGhlIG9iamVjdC5cbndpbmRvdy5FZGdlVHJhbnNsYXRlQmFubmVyQ29udHJvbGxlciA9IG5ldyBCYW5uZXJDb250cm9sbGVyKCk7XG4iXSwibmFtZXMiOlsiRXZlbnRNYW5hZ2VyIiwiQ2hhbm5lbCIsImNvbnN0cnVjdG9yIiwiX3NlcnZpY2VzIiwiTWFwIiwiX2V2ZW50TWFuYWdlciIsImNocm9tZSIsInJ1bnRpbWUiLCJvbk1lc3NhZ2UiLCJhZGRMaXN0ZW5lciIsIm1lc3NhZ2UiLCJzZW5kZXIiLCJjYWxsYmFjayIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInR5cGUiLCJjb25zb2xlIiwiZXJyb3IiLCJlbWl0IiwiZXZlbnQiLCJkZXRhaWwiLCJzZXJ2ZXIiLCJnZXQiLCJzZXJ2aWNlIiwicGFyYW1zIiwidGhlbiIsInJlc3VsdCIsImJpbmQiLCJwcm92aWRlIiwic2V0IiwicmVxdWVzdCIsInN0cmluZ2lmeSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0Iiwic2VuZE1lc3NhZ2UiLCJsYXN0RXJyb3IiLCJyZXF1ZXN0VG9UYWIiLCJ0YWJJZCIsInNlbmQiLCJfZ2V0VGFiTWVzc2FnZVNlbmRlciIsIm9uIiwiaGFuZGxlciIsImVtaXRUb1RhYnMiLCJ0YWJJZHMiLCJjYXRjaCIsIkJST1dTRVJfRU5WIiwiYnJvd3NlciIsInRhYnMiLCJfaGFuZGxlcklEIiwiX2V2ZW50VG9IYW5kbGVySURzIiwiX2hhbmRsZXJJRFRvSGFuZGxlciIsImhhbmRsZXJJRCIsIl9hbGxvY0hhbmRsZXJJRCIsImhhcyIsImFkZCIsIlNldCIsImNhbmNlbGVkIiwiX29mZiIsIndhcm4iLCJzb3VyY2UiLCJoYW5kbGVySURzIiwiTnVtYmVyIiwiTUFYX1NBRkVfSU5URUdFUiIsImRlbGV0ZSIsIkJST1dTRVJfTEFOR1VBR0VTX01BUCIsImFjaCIsImFkeSIsImFmIiwiYWsiLCJhbSIsImFyIiwiYXoiLCJiZyIsImJuIiwiY2EiLCJjYWsiLCJjZWIiLCJjbyIsImNzIiwiY3kiLCJkYSIsImRlIiwiZHNiIiwiZWwiLCJlbiIsImVvIiwiZXMiLCJldCIsImV1IiwiZmEiLCJmZiIsImZpIiwiZnIiLCJnYSIsImdkIiwiZ2wiLCJoYSIsImhhdyIsImhlIiwiaGkiLCJobW4iLCJociIsImhzYiIsImh0IiwiaHUiLCJpZCIsImlnIiwiaXMiLCJpdCIsIml3IiwiamEiLCJrbSIsImthYiIsImtuIiwia28iLCJreSIsImxhIiwibGIiLCJsbyIsImx0IiwibHYiLCJtYWkiLCJtaSIsIm1rIiwibWwiLCJtciIsIm1zIiwibXQiLCJteSIsIm5vIiwibmIiLCJuZSIsIm5sIiwibnkiLCJvYyIsInBhIiwicGwiLCJwdCIsInJvIiwicnUiLCJzZCIsInNrIiwic2wiLCJzbSIsInNuIiwic3EiLCJzciIsInN0Iiwic3UiLCJzdiIsInN3IiwidGEiLCJ0ZSIsInRnIiwidGgiLCJ0bCIsInRsaCIsInRyIiwidWsiLCJ1ciIsInV6IiwidmkiLCJ5aSIsInlvIiwiemgiLCJERUZBVUxUX1NFVFRJTkdTIiwiYmxhY2tsaXN0IiwidXJscyIsImRvbWFpbnMiLCJleHRlbnNpb25zIiwiTGF5b3V0U2V0dGluZ3MiLCJSZXNpemUiLCJSVEwiLCJGb2xkTG9uZ0NvbnRlbnQiLCJTZWxlY3RUcmFuc2xhdGVQb3NpdGlvbiIsImxhbmd1YWdlU2V0dGluZyIsImkxOG4iLCJnZXRVSUxhbmd1YWdlIiwiT3RoZXJTZXR0aW5ncyIsIk11dHVhbFRyYW5zbGF0ZSIsIlNlbGVjdFRyYW5zbGF0ZSIsIlRyYW5zbGF0ZUFmdGVyRGJsQ2xpY2siLCJUcmFuc2xhdGVBZnRlclNlbGVjdCIsIkNhbmNlbFRleHRTZWxlY3Rpb24iLCJVc2VHb29nbGVBbmFseXRpY3MiLCJEZWZhdWx0VHJhbnNsYXRvciIsIkRlZmF1bHRQYWdlVHJhbnNsYXRvciIsIkh5YnJpZFRyYW5zbGF0b3JDb25maWciLCJ0cmFuc2xhdG9ycyIsInNlbGVjdGlvbnMiLCJvcmlnaW5hbFRleHQiLCJtYWluTWVhbmluZyIsInRQcm9udW5jaWF0aW9uIiwic1Byb251bmNpYXRpb24iLCJkZXRhaWxlZE1lYW5pbmdzIiwiZGVmaW5pdGlvbnMiLCJleGFtcGxlcyIsIlRyYW5zbGF0ZVJlc3VsdEZpbHRlciIsInRQcm9udW5jaWF0aW9uSWNvbiIsInNQcm9udW5jaWF0aW9uSWNvbiIsIkNvbnRlbnREaXNwbGF5T3JkZXIiLCJIaWRlUGFnZVRyYW5zbGF0b3JCYW5uZXIiLCJzZXREZWZhdWx0U2V0dGluZ3MiLCJzZXR0aW5ncyIsImkiLCJBcnJheSIsIk9iamVjdCIsImtleXMiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJnZXRPclNldERlZmF1bHRTZXR0aW5ncyIsImRlZmF1bHRzIiwia2V5IiwicHVzaCIsInN0b3JhZ2UiLCJzeW5jIiwidXBkYXRlZCIsInNldHRpbmciLCJCYW5uZXJDb250cm9sbGVyIiwiY2hhbm5lbCIsImN1cnJlbnRUcmFuc2xhdG9yIiwiY2FuY2VsbGVyIiwiYWRkTGlzdGVuZXJzIiwidHJhbnNsYXRvciIsImdvb2dsZU1lc3NhZ2VIYW5kbGVyIiwid2luZG93IiwiYWRkRXZlbnRMaXN0ZW5lciIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJjb21tYW5kIiwidG9nZ2xlQmFubmVyIiwidG9nZ2xlQmFubmVyRnJhbWUiLCJ2aXNpYmxlIiwiYmFubmVyIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50QnlJZCIsInN0eWxlIiwidmlzaWJpbGl0eSIsIm1vdmVQYWdlIiwicHJvcGVydHkiLCJkaXN0YW5jZSIsImFic29sdXRlIiwib3JpZyIsImJvZHkiLCJnZXRQcm9wZXJ0eVZhbHVlIiwib3JpZ192YWx1ZSIsInBhcnNlSW50IiwiY3NzVGV4dCIsInJlcGxhY2UiLCJSZWdFeHAiLCJfdW51c2VkIiwic2V0UHJvcGVydHkiLCJtc2ciLCJkYXRhIiwic2V0VGltZW91dCIsIkVkZ2VUcmFuc2xhdGVCYW5uZXJDb250cm9sbGVyIl0sInNvdXJjZVJvb3QiOiIifQ==