/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@storybook/core-client/dist/esm/globals/globals.js":
/* ./node_modules/@storybook/core-client/dist/esm/globals/globals.js */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! global */ "global");
/* harmony import */ var global__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(global__WEBPACK_IMPORTED_MODULE_0__);

var globalWindow = (global__WEBPACK_IMPORTED_MODULE_0___default().window);
globalWindow.STORYBOOK_REACT_CLASSES = {};

/***/ }),

/***/ "./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js":
/* ./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! regenerator-runtime/runtime */ "regenerator-runtime/runtime");
/* harmony import */ var regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(regenerator_runtime_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var airbnb_js_shims__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! airbnb-js-shims */ "airbnb-js-shims");
/* harmony import */ var airbnb_js_shims__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(airbnb_js_shims__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var core_js_features_symbol__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! core-js/features/symbol */ "core-js/features/symbol");
/* harmony import */ var core_js_features_symbol__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(core_js_features_symbol__WEBPACK_IMPORTED_MODULE_2__);




/***/ }),

/***/ "./.storybook/generated-stories-entry.js":
/* ./.storybook/generated-stories-entry.js */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
/* module decorator */ module = __webpack_require__.nmd(module);


var _frameworkImportPath = __webpack_require__(/*! @storybook/react */ "@storybook/react");
/* eslint-disable import/no-unresolved */


(0, _frameworkImportPath.configure)([__webpack_require__("./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?%21(?:^|\\/)\\.).)*?)\\/)(?%21\\.)(?=.)[^/]*?\\.stories\\.tsx)$")], module, false);

/***/ }),

/***/ "./.storybook/storybook-init-framework-entry.js":
/* ./.storybook/storybook-init-framework-entry.js */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _storybook_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @storybook/react */ "@storybook/react");
/* harmony import */ var _storybook_react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_storybook_react__WEBPACK_IMPORTED_MODULE_0__);


/***/ }),

/***/ "./stories/KindA.stories.tsx":
/* ./stories/KindA.stories.tsx */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "StoryA": () => (/* binding */ StoryA)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  title: 'KindA'
});
var StoryA = function StoryA() {};

/***/ }),

/***/ "./node_modules/creevey/lib/server/loaders/webpack/dummy-hmr.js":
/* ./node_modules/creevey/lib/server/loaders/webpack/dummy-hmr.js */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.default = void 0;

var _global$__CREEVEY_HMR;

global.__CREEVEY_HMR_DATA__ = (_global$__CREEVEY_HMR = global.__CREEVEY_HMR_DATA__) !== null && _global$__CREEVEY_HMR !== void 0 ? _global$__CREEVEY_HMR : {};
Object.entries(__webpack_require__.m).forEach(([key, moduleFn]) => {
  __webpack_require__.m[key] = new Proxy(moduleFn, {
    apply(target, thisArg, args) {
      var _global$__CREEVEY_HMR2;

      const [module] = args;
      const {
        data
      } = global.__CREEVEY_HMR_DATA__[module.i] = (_global$__CREEVEY_HMR2 = global.__CREEVEY_HMR_DATA__[module.i]) !== null && _global$__CREEVEY_HMR2 !== void 0 ? _global$__CREEVEY_HMR2 : {
        data: {}
      };
      Object.assign(module, {
        hot: {
          accept() {
            /* noop */
          },

          get data() {
            return data;
          },

          dispose(callback) {
            global.__CREEVEY_HMR_DATA__[module.i].callback = callback;
          }

        }
      });
      return target.apply(thisArg, args);
    }

  });
});
var _default = {};
exports.default = _default;

/***/ }),

/***/ "./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?%21(?:^|\\/)\\.).)*?)\\/)(?%21\\.)(?=.)[^/]*?\\.stories\\.tsx)$":
/* ./stories/ sync ^\.(?:(?:^|\/|(?:(?:(?%21(?:^|\/)\.).)*?)\/)(?%21\.)(?=.)[^/]*?\.stories\.tsx)$ */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var map = {
	"./KindA.stories.tsx": "./stories/KindA.stories.tsx"
};


function webpackContext(req) {
	var id = webpackContextResolve(req);
	return __webpack_require__(id);
}
function webpackContextResolve(req) {
	if(!__webpack_require__.o(map, req)) {
		var e = new Error("Cannot find module '" + req + "'");
		e.code = 'MODULE_NOT_FOUND';
		throw e;
	}
	return map[req];
}
webpackContext.keys = function webpackContextKeys() {
	return Object.keys(map);
};
webpackContext.resolve = webpackContextResolve;
module.exports = webpackContext;
webpackContext.id = "./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?%21(?:^|\\/)\\.).)*?)\\/)(?%21\\.)(?=.)[^/]*?\\.stories\\.tsx)$";

/***/ }),

/***/ "@storybook/react":
/* external "./node_modules/creevey/lib/server/storybook/entry.js" */
/***/ ((module) => {

"use strict";
module.exports = require("./node_modules/creevey/lib/server/storybook/entry.js");;

/***/ }),

/***/ "airbnb-js-shims":
/* external "airbnb-js-shims" */
/***/ ((module) => {

"use strict";
module.exports = require("airbnb-js-shims");;

/***/ }),

/***/ "core-js/features/symbol":
/* external "core-js/features/symbol" */
/***/ ((module) => {

"use strict";
module.exports = require("core-js/features/symbol");;

/***/ }),

/***/ "global":
/* external "global" */
/***/ ((module) => {

"use strict";
module.exports = require("global");;

/***/ }),

/***/ "regenerator-runtime/runtime":
/* external "regenerator-runtime/runtime" */
/***/ ((module) => {

"use strict";
module.exports = require("regenerator-runtime/runtime");;

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
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
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
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	__webpack_require__("./node_modules/creevey/lib/server/loaders/webpack/dummy-hmr.js");
/******/ 	__webpack_require__("./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js");
/******/ 	__webpack_require__("./node_modules/@storybook/core-client/dist/esm/globals/globals.js");
/******/ 	__webpack_require__("./.storybook/storybook-init-framework-entry.js");
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./.storybook/generated-stories-entry.js");
/******/ 	
/******/ })()
;