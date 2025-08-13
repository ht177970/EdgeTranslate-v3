/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

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
  !*** ./src/content/notice/notice.js ***!
  \**************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/scripts/common.js */ "./src/common/scripts/common.js");
/**
 * module: content
 * part: notice
 * function: do some i18n for notice.html
 */


window.onload = () => {
  (0,common_scripts_common_js__WEBPACK_IMPORTED_MODULE_0__.i18nHTML)();
  document.getElementById("permissionPage").addEventListener("click", () => {
    chrome.tabs.create({
      url: `chrome://extensions/?id=${chrome.runtime.id}`
    });
  });
  const reasonsList = document.getElementById("reasonsList");
  if (false) {} else {
    const firefoxReason = document.getElementById("firefoxReason");
    reasonsList.removeChild(firefoxReason);
  }
};
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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R25ELFFBQVEsQ0FBQzZDLGNBQWMsQ0FBQyxhQUFhLENBQUM7RUFDMUQsSUFBSU8sS0FBeUIsRUFBRSxFQUc5QixNQUFNO0lBQ0gsTUFBTUcsYUFBYSxHQUFHdkQsUUFBUSxDQUFDNkMsY0FBYyxDQUFDLGVBQWUsQ0FBQztJQUM5RE0sV0FBVyxDQUFDRyxXQUFXLENBQUNDLGFBQWEsQ0FBQztFQUMxQztBQUNKLENBQUMsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlLy4vc3JjL2NvbW1vbi9zY3JpcHRzL2NvbW1vbi5qcyIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb21tb24vc2NyaXB0cy9sb2dnZXIuanMiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2VkZ2VfdHJhbnNsYXRlL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vZWRnZV90cmFuc2xhdGUvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9lZGdlX3RyYW5zbGF0ZS8uL3NyYy9jb250ZW50L25vdGljZS9ub3RpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IHsgZ2V0RG9tYWluLCBsb2cgfTtcbmltcG9ydCB7IGxvZ0luZm8gfSBmcm9tIFwiLi9sb2dnZXIuanNcIjtcblxuLyoqXG4gKiDmj5Dlj5bnu5nlrprnmoR1cmznmoTln5/lkI1cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXG4gKi9cbmZ1bmN0aW9uIGdldERvbWFpbih1cmwpIHtcbiAgICBpZiAodXJsKSB7XG4gICAgICAgIGxldCBVUkxfUEFUVEVSTiA9IC8uKzpcXC8rKFtcXHcuLV0rKS4qLztcbiAgICAgICAgbGV0IGdyb3VwcyA9IHVybC5tYXRjaChVUkxfUEFUVEVSTik7XG4gICAgICAgIGlmIChncm91cHMpIHtcbiAgICAgICAgICAgIHJldHVybiBncm91cHNbMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFwiXCI7XG59XG5cbi8qKlxuICogY29uc29sZS5sb2cgd3JhcHBlci5cbiAqXG4gKiBAcGFyYW0ge0FueX0gbWVzc2FnZSBtZXNzYWdlIHRvIGxvZy5cbiAqL1xuZnVuY3Rpb24gbG9nKG1lc3NhZ2UpIHtcbiAgICBsb2dJbmZvKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIHNldCB0aGUgY29udGVudCB0ZXh0IG9mIEhUTUwgdGFncywgd2hpY2ggaGF2ZSBcImkxOG5cIiBjbGFzcyBuYW1lLCB3aXRoIGkxOG4gdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGkxOG5IVE1MKCkge1xuICAgIGxldCBpMThuRWxlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiaTE4blwiKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGkxOG5FbGVtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAvLyBEZWZhdWx0IFwiYmVmb3JlRW5kXCIuXG4gICAgICAgIGxldCBwb3MgPSBcImJlZm9yZUVuZFwiO1xuICAgICAgICBpZiAoaTE4bkVsZW1lbnRzW2ldLmhhc0F0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKSkge1xuICAgICAgICAgICAgcG9zID0gaTE4bkVsZW1lbnRzW2ldLmdldEF0dHJpYnV0ZShcImRhdGEtaW5zZXJ0LXBvc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOi3n+maj+a1j+iniOWZqOeahOivreiogOiuvue9ruaYvuekuuWGheWuuVxuICAgICAgICBpMThuRWxlbWVudHNbaV0uaW5zZXJ0QWRqYWNlbnRUZXh0KFxuICAgICAgICAgICAgcG9zLFxuICAgICAgICAgICAgY2hyb21lLmkxOG4uZ2V0TWVzc2FnZShpMThuRWxlbWVudHNbaV0uZ2V0QXR0cmlidXRlKFwiZGF0YS1pMThuLW5hbWVcIikpXG4gICAgICAgICk7XG4gICAgfVxufVxuIiwiZXhwb3J0IHtcbiAgICBsb2dJbmZvLFxuICAgIGxvZ1dhcm4sXG4gICAgbG9nRXJyb3IsXG4gICAgc2hvdWxkRmlsdGVyRXJyb3IsXG4gICAgd3JhcENvbnNvbGVGb3JGaWx0ZXJpbmcsXG4gICAgc2V0TG9nTGV2ZWwsXG4gICAgZ2V0TG9nTGV2ZWwsXG59O1xuXG4vLyBLbm93biBub2lzeSBlcnJvciBwYXR0ZXJucyB0byBzdXBwcmVzcyBpbiBsb2dzXG5jb25zdCBGSUxURVJFRF9FUlJPUl9QQVRURVJOUyA9IFtcbiAgICBcIlVuYWJsZSB0byBkb3dubG9hZFwiLFxuICAgIFwiVW5hYmxlIHRvIGRvd25sb2FkIGFsbCBzcGVjaWZpZWQgaW1hZ2VzXCIsXG4gICAgXCJDYW5ub3QgYWNjZXNzXCIsXG4gICAgXCJiZWZvcmUgaW5pdGlhbGl6YXRpb25cIixcbiAgICBcIkV4dGVuc2lvbiBjb250ZXh0IGludmFsaWRhdGVkXCIsXG4gICAgXCJDYW52YXMgZXJyb3JcIixcbiAgICBcIk5ldHdvcmsgZXJyb3JcIixcbl07XG5cbmZ1bmN0aW9uIGpvaW5NZXNzYWdlKGFyZ3MpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXJnc1xuICAgICAgICAgICAgLm1hcCgodikgPT4gKHR5cGVvZiB2ID09PSBcInN0cmluZ1wiID8gdiA6ICh2ICYmIHYubWVzc2FnZSkgfHwgSlNPTi5zdHJpbmdpZnkodikpKVxuICAgICAgICAgICAgLmpvaW4oXCIgXCIpO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgcmV0dXJuIGFyZ3Muam9pbihcIiBcIik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaG91bGRGaWx0ZXJFcnJvcihtZXNzYWdlKSB7XG4gICAgaWYgKCFtZXNzYWdlKSByZXR1cm4gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIEZJTFRFUkVEX0VSUk9SX1BBVFRFUk5TLnNvbWUoKHBhdHRlcm4pID0+IG1lc3NhZ2UuaW5jbHVkZXMocGF0dGVybikpIHx8XG4gICAgICAgICAgICAvQ2Fubm90IGFjY2VzcyAnLionIGJlZm9yZSBpbml0aWFsaXphdGlvbi8udGVzdChtZXNzYWdlKSB8fFxuICAgICAgICAgICAgL1JlZmVyZW5jZUVycm9yLipiZWZvcmUgaW5pdGlhbGl6YXRpb24vLnRlc3QobWVzc2FnZSkgfHxcbiAgICAgICAgICAgIC9VbmFibGUgdG8gZG93bmxvYWQuKmltYWdlcy8udGVzdChtZXNzYWdlKVxuICAgICAgICApO1xuICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxuLy8gTG9nIGxldmVsOiAnZGVidWcnIHwgJ2luZm8nIHwgJ3dhcm4nIHwgJ2Vycm9yJyB8ICdzaWxlbnQnXG5jb25zdCBMRVZFTF9PUkRFUiA9IHsgZGVidWc6IDEwLCBpbmZvOiAyMCwgd2FybjogMzAsIGVycm9yOiA0MCwgc2lsZW50OiA5MCB9O1xubGV0IGN1cnJlbnRMZXZlbCA9XG4gICAgdHlwZW9mIEJVSUxEX0VOViAhPT0gXCJ1bmRlZmluZWRcIiAmJiBCVUlMRF9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IFwiZGVidWdcIiA6IFwid2FyblwiO1xuXG5mdW5jdGlvbiBzZXRMb2dMZXZlbChsZXZlbCkge1xuICAgIGlmIChMRVZFTF9PUkRFUltsZXZlbF0gIT0gbnVsbCkgY3VycmVudExldmVsID0gbGV2ZWw7XG59XG5cbmZ1bmN0aW9uIGdldExvZ0xldmVsKCkge1xuICAgIHJldHVybiBjdXJyZW50TGV2ZWw7XG59XG5cbmZ1bmN0aW9uIHNob3VsZEVtaXQobGV2ZWwpIHtcbiAgICByZXR1cm4gTEVWRUxfT1JERVJbbGV2ZWxdID49IExFVkVMX09SREVSW2N1cnJlbnRMZXZlbF07XG59XG5cbmZ1bmN0aW9uIGxvZ0luZm8oLi4uYXJncykge1xuICAgIGlmICghc2hvdWxkRW1pdChcImluZm9cIikpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUubG9nKFwiW0VkZ2VUcmFuc2xhdGVdXCIsIC4uLmFyZ3MpO1xufVxuXG5mdW5jdGlvbiBsb2dXYXJuKC4uLmFyZ3MpIHtcbiAgICBpZiAoIXNob3VsZEVtaXQoXCJ3YXJuXCIpKSByZXR1cm47XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLndhcm4oXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbmZ1bmN0aW9uIGxvZ0Vycm9yKC4uLmFyZ3MpIHtcbiAgICBpZiAoIXNob3VsZEVtaXQoXCJlcnJvclwiKSkgcmV0dXJuO1xuICAgIGNvbnN0IG1lc3NhZ2UgPSBqb2luTWVzc2FnZShhcmdzKTtcbiAgICBpZiAoc2hvdWxkRmlsdGVyRXJyb3IobWVzc2FnZSkpIHJldHVybjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tY29uc29sZVxuICAgIGNvbnNvbGUuZXJyb3IoXCJbRWRnZVRyYW5zbGF0ZV1cIiwgLi4uYXJncyk7XG59XG5cbi8vIE9wdGlvbmFsOiBnbG9iYWxseSB3cmFwIGNvbnNvbGUuZXJyb3IgdG8gc3VwcHJlc3Mgbm9pc3kgZXJyb3JzXG5mdW5jdGlvbiB3cmFwQ29uc29sZUZvckZpbHRlcmluZygpIHtcbiAgICBjb25zdCBvcmlnaW5hbENvbnNvbGVFcnJvciA9IGNvbnNvbGUuZXJyb3I7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICBjb25zb2xlLmVycm9yID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGpvaW5NZXNzYWdlKGFyZ3MpO1xuICAgICAgICBpZiAoIXNob3VsZEZpbHRlckVycm9yKG1lc3NhZ2UpKSB7XG4gICAgICAgICAgICBvcmlnaW5hbENvbnNvbGVFcnJvci5hcHBseShjb25zb2xlLCBhcmdzKTtcbiAgICAgICAgfVxuICAgIH07XG59XG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8qKlxuICogbW9kdWxlOiBjb250ZW50XG4gKiBwYXJ0OiBub3RpY2VcbiAqIGZ1bmN0aW9uOiBkbyBzb21lIGkxOG4gZm9yIG5vdGljZS5odG1sXG4gKi9cblxuaW1wb3J0IHsgaTE4bkhUTUwgfSBmcm9tIFwiY29tbW9uL3NjcmlwdHMvY29tbW9uLmpzXCI7XG5cbndpbmRvdy5vbmxvYWQgPSAoKSA9PiB7XG4gICAgaTE4bkhUTUwoKTtcblxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicGVybWlzc2lvblBhZ2VcIikuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHtcbiAgICAgICAgICAgIHVybDogYGNocm9tZTovL2V4dGVuc2lvbnMvP2lkPSR7Y2hyb21lLnJ1bnRpbWUuaWR9YCxcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCByZWFzb25zTGlzdCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwicmVhc29uc0xpc3RcIik7XG4gICAgaWYgKEJST1dTRVJfRU5WID09PSBcImZpcmVmb3hcIikge1xuICAgICAgICBjb25zdCBjaHJvbWVSZWFzb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNocm9tZVJlYXNvblwiKTtcbiAgICAgICAgcmVhc29uc0xpc3QucmVtb3ZlQ2hpbGQoY2hyb21lUmVhc29uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmaXJlZm94UmVhc29uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmaXJlZm94UmVhc29uXCIpO1xuICAgICAgICByZWFzb25zTGlzdC5yZW1vdmVDaGlsZChmaXJlZm94UmVhc29uKTtcbiAgICB9XG59O1xuIl0sIm5hbWVzIjpbImdldERvbWFpbiIsImxvZyIsImxvZ0luZm8iLCJ1cmwiLCJVUkxfUEFUVEVSTiIsImdyb3VwcyIsIm1hdGNoIiwibWVzc2FnZSIsImkxOG5IVE1MIiwiaTE4bkVsZW1lbnRzIiwiZG9jdW1lbnQiLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiaSIsImxlbmd0aCIsInBvcyIsImhhc0F0dHJpYnV0ZSIsImdldEF0dHJpYnV0ZSIsImluc2VydEFkamFjZW50VGV4dCIsImNocm9tZSIsImkxOG4iLCJnZXRNZXNzYWdlIiwibG9nV2FybiIsImxvZ0Vycm9yIiwic2hvdWxkRmlsdGVyRXJyb3IiLCJ3cmFwQ29uc29sZUZvckZpbHRlcmluZyIsInNldExvZ0xldmVsIiwiZ2V0TG9nTGV2ZWwiLCJGSUxURVJFRF9FUlJPUl9QQVRURVJOUyIsImpvaW5NZXNzYWdlIiwiYXJncyIsIm1hcCIsInYiLCJKU09OIiwic3RyaW5naWZ5Iiwiam9pbiIsIl8iLCJzb21lIiwicGF0dGVybiIsImluY2x1ZGVzIiwidGVzdCIsIkxFVkVMX09SREVSIiwiZGVidWciLCJpbmZvIiwid2FybiIsImVycm9yIiwic2lsZW50IiwiY3VycmVudExldmVsIiwiQlVJTERfRU5WIiwibGV2ZWwiLCJzaG91bGRFbWl0IiwiY29uc29sZSIsIm9yaWdpbmFsQ29uc29sZUVycm9yIiwiYXBwbHkiLCJ3aW5kb3ciLCJvbmxvYWQiLCJnZXRFbGVtZW50QnlJZCIsImFkZEV2ZW50TGlzdGVuZXIiLCJ0YWJzIiwiY3JlYXRlIiwicnVudGltZSIsImlkIiwicmVhc29uc0xpc3QiLCJCUk9XU0VSX0VOViIsImNocm9tZVJlYXNvbiIsInJlbW92ZUNoaWxkIiwiZmlyZWZveFJlYXNvbiJdLCJzb3VyY2VSb290IjoiIn0=