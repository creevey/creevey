/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./.storybook/generated-stories-entry.js":
/* ./.storybook/generated-stories-entry.js */
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(module) {

var _frameworkImportPath = __webpack_require__(/*! @storybook/react */ "@storybook/react");
/* eslint-disable import/no-unresolved */


(0, _frameworkImportPath.configure)([__webpack_require__("./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(md|ts)x)$")], module, false);
/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

/***/ }),

/***/ "./.storybook/preview.js":
/* ./.storybook/preview.js */
/*! exports provided: parameters */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parameters", function() { return parameters; });
var parameters = {
  creevey: {
    skip: [{
      "in": 'browser',
      tests: ['TestA']
    }]
  }
};

/***/ }),

/***/ "./.storybook/preview.js-generated-config-entry.js":
/* ./.storybook/preview.js-generated-config-entry.js */
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_core_js_modules_es_object_keys_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.keys.js */ "./node_modules/core-js/modules/es.object.keys.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_keys_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_keys_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_core_js_modules_es_symbol_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.symbol.js */ "./node_modules/core-js/modules/es.symbol.js");
/* harmony import */ var _node_modules_core_js_modules_es_symbol_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_symbol_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.array.filter.js */ "./node_modules/core-js/modules/es.array.filter.js");
/* harmony import */ var _node_modules_core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_array_filter_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_core_js_modules_es_object_get_own_property_descriptor_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.get-own-property-descriptor.js */ "./node_modules/core-js/modules/es.object.get-own-property-descriptor.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_get_own_property_descriptor_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_get_own_property_descriptor_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_core_js_modules_es_array_for_each_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.array.for-each.js */ "./node_modules/core-js/modules/es.array.for-each.js");
/* harmony import */ var _node_modules_core_js_modules_es_array_for_each_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_array_for_each_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./node_modules/core-js/modules/web.dom-collections.for-each.js */ "./node_modules/core-js/modules/web.dom-collections.for-each.js");
/* harmony import */ var _node_modules_core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_web_dom_collections_for_each_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_core_js_modules_es_object_get_own_property_descriptors_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.get-own-property-descriptors.js */ "./node_modules/core-js/modules/es.object.get-own-property-descriptors.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_get_own_property_descriptors_js__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_get_own_property_descriptors_js__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _node_modules_core_js_modules_es_object_define_properties_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.define-properties.js */ "./node_modules/core-js/modules/es.object.define-properties.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_define_properties_js__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_define_properties_js__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var _node_modules_core_js_modules_es_object_define_property_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.define-property.js */ "./node_modules/core-js/modules/es.object.define-property.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_define_property_js__WEBPACK_IMPORTED_MODULE_8___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_define_property_js__WEBPACK_IMPORTED_MODULE_8__);
/* harmony import */ var _node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./node_modules/@storybook/client-api */ "./node_modules/@storybook/client-api");
/* harmony import */ var _node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9___default = /*#__PURE__*/__webpack_require__.n(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__);
/* harmony import */ var _node_modules_storybook_client_logger__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./node_modules/@storybook/client-logger */ "./node_modules/@storybook/client-logger");
/* harmony import */ var _node_modules_storybook_client_logger__WEBPACK_IMPORTED_MODULE_10___default = /*#__PURE__*/__webpack_require__.n(_node_modules_storybook_client_logger__WEBPACK_IMPORTED_MODULE_10__);
/* harmony import */ var _storybook_preview_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./.storybook/preview.js */ "./.storybook/preview.js");










function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}
/* eslint-disable import/no-unresolved */





Object.keys(_storybook_preview_js__WEBPACK_IMPORTED_MODULE_11__).forEach(function (key) {
  var value = _storybook_preview_js__WEBPACK_IMPORTED_MODULE_11__[key];

  switch (key) {
    case 'args':
    case 'argTypes':
      {
        return _node_modules_storybook_client_logger__WEBPACK_IMPORTED_MODULE_10__["logger"].warn('Invalid args/argTypes in config, ignoring.', JSON.stringify(value));
      }

    case 'decorators':
      {
        return value.forEach(function (decorator) {
          return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addDecorator"])(decorator, false);
        });
      }

    case 'loaders':
      {
        return value.forEach(function (loader) {
          return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addLoader"])(loader, false);
        });
      }

    case 'parameters':
      {
        return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addParameters"])(_objectSpread({}, value), false);
      }

    case 'argTypesEnhancers':
      {
        return value.forEach(function (enhancer) {
          return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addArgTypesEnhancer"])(enhancer);
        });
      }

    case 'argsEnhancers':
      {
        return value.forEach(function (enhancer) {
          return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addArgsEnhancer"])(enhancer);
        });
      }

    case 'render':
      {
        return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["setGlobalRender"])(value);
      }

    case 'globals':
    case 'globalTypes':
      {
        var v = {};
        v[key] = value;
        return Object(_node_modules_storybook_client_api__WEBPACK_IMPORTED_MODULE_9__["addParameters"])(v, false);
      }

    default:
      {
        // eslint-disable-next-line prefer-template
        return console.log(key + ' was not supported :( !');
      }
  }
});

/***/ }),

/***/ "./.storybook/storybook-init-framework-entry.js":
/* ./.storybook/storybook-init-framework-entry.js */
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _storybook_react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @storybook/react */ "@storybook/react");
/* harmony import */ var _storybook_react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_storybook_react__WEBPACK_IMPORTED_MODULE_0__);


/***/ }),

/***/ "./node_modules/creevey/lib/cjs/server/loaders/webpack/dummy-hmr.js":
/* ./node_modules/creevey/lib/cjs/server/loaders/webpack/dummy-hmr.js */
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
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

/***/ "./node_modules/webpack/buildin/module.js":
/* (webpack)/buildin/module.js */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function(module) {
	if (!module.webpackPolyfill) {
		module.deprecate = function() {};
		module.paths = [];
		// module.parent = undefined by default
		if (!module.children) module.children = [];
		Object.defineProperty(module, "loaded", {
			enumerable: true,
			get: function() {
				return module.l;
			}
		});
		Object.defineProperty(module, "id", {
			enumerable: true,
			get: function() {
				return module.i;
			}
		});
		module.webpackPolyfill = 1;
	}
	return module;
};


/***/ }),

/***/ "./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(md|ts)x)$":
/* ./stories sync ^\.(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.).)*?)\/)(?!\.)(?=.)[^/]*?\.stories\.(md|ts)x)$ */
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var map = {
	"./KindA.stories.tsx": "./stories/KindA.stories.tsx",
	"./KindB.stories.tsx": "./stories/KindB.stories.tsx",
	"./KindC.stories.tsx": "./stories/KindC.stories.tsx",
	"./KindD.stories.mdx": "./stories/KindD.stories.mdx"
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
webpackContext.id = "./stories sync recursive ^\\.(?:(?:^|\\/|(?:(?:(?!(?:^|\\/)\\.).)*?)\\/)(?!\\.)(?=.)[^/]*?\\.stories\\.(md|ts)x)$";

/***/ }),

/***/ "./stories/KindA.stories.tsx":
/* ./stories/KindA.stories.tsx */
/*! exports provided: default, ImportedTests, SkippedTests, DynamicStoryTests, decorators, parameters */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "ImportedTests", function() { return ImportedTests; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SkippedTests", function() { return SkippedTests; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "DynamicStoryTests", function() { return DynamicStoryTests; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "decorators", function() { return decorators; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "parameters", function() { return parameters; });
/* harmony import */ var _node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.promise.js */ "./node_modules/core-js/modules/es.promise.js");
/* harmony import */ var _node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.to-string.js */ "./node_modules/core-js/modules/es.object.to-string.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _tests_click__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./tests/click */ "./stories/tests/click.ts");
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }




/* harmony default export */ __webpack_exports__["default"] = ({
  title: 'KindA'
});
var ImportedTests = function ImportedTests() {};
ImportedTests.parameters = {
  creevey: {
    tests: _tests_click__WEBPACK_IMPORTED_MODULE_2__["clickTests"]
  }
};
var SkippedTests = function SkippedTests() {};
SkippedTests.parameters = {
  creevey: {
    skip: [{
      "in": 'browser',
      tests: ['testB']
    }]
  }
};
var DynamicStoryTests = function DynamicStoryTests(props) {};
DynamicStoryTests.parameters = {
  creevey: {
    tests: {
      updateArgs: function () {
        var _updateArgs = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.next = 2;
                  return this.updateStoryArgs({
                    content: 'test'
                  });

                case 2:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function updateArgs() {
          return _updateArgs.apply(this, arguments);
        }

        return updateArgs;
      }()
    }
  }
};
var decorators = function decorators() {};
var parameters = function parameters() {};

/***/ }),

/***/ "./stories/KindB.stories.tsx":
/* ./stories/KindB.stories.tsx */
/*! exports provided: default, StoryA */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StoryA", function() { return StoryA; });
/* harmony default export */ __webpack_exports__["default"] = ({
  title: 'KindB / SubKind'
});
var StoryA = function StoryA() {};

/***/ }),

/***/ "./stories/KindC.stories.tsx":
/* ./stories/KindC.stories.tsx */
/*! exports provided: StoryA, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _KindC_StoryA__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./KindC/StoryA */ "./stories/KindC/StoryA.tsx");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "StoryA", function() { return _KindC_StoryA__WEBPACK_IMPORTED_MODULE_0__["StoryA"]; });


/* harmony default export */ __webpack_exports__["default"] = ({
  title: 'KindC'
});

/***/ }),

/***/ "./stories/KindC/StoryA.tsx":
/* ./stories/KindC/StoryA.tsx */
/*! exports provided: StoryA */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "StoryA", function() { return StoryA; });
var StoryA = function StoryA() {};

/***/ }),

/***/ "./stories/KindD.stories.mdx":
/* ./stories/KindD.stories.mdx */
/*! exports provided: _SkippedTests_, _ExternalStory_, storyA, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_SkippedTests_", function() { return _SkippedTests_; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_ExternalStory_", function() { return _ExternalStory_; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "storyA", function() { return storyA; });
/* harmony import */ var _node_modules_core_js_modules_es_object_assign_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.assign.js */ "./node_modules/core-js/modules/es.object.assign.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_assign_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_assign_js__WEBPACK_IMPORTED_MODULE_0__);


/* @jsxRuntime classic */

/* @jsx mdx */
var _SkippedTests_ = function _SkippedTests_() {};
var _ExternalStory_ = function _ExternalStory_() {};
var storyA = function storyA() {};
storyA.storyName = 'StoryA';
storyA.parameters = Object.assign({}, {
  creevey: {
    captureElement: 'mdx-by-children'
  }
});
var componentMeta = {
  title: 'Docs/KindD',
  parameters: {
    creevey: {
      ignoreElements: ['img']
    }
  },
  includeStories: ["_SkippedTests_", "_ExternalStory_", "storyA"]
};
componentMeta.parameters = componentMeta.parameters || {};
/* harmony default export */ __webpack_exports__["default"] = (componentMeta);

/***/ }),

/***/ "./stories/tests/click.ts":
/* ./stories/tests/click.ts */
/*! exports provided: clickTests */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "clickTests", function() { return clickTests; });
/* harmony import */ var _node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.promise.js */ "./node_modules/core-js/modules/es.promise.js");
/* harmony import */ var _node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_promise_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/core-js/modules/es.object.to-string.js */ "./node_modules/core-js/modules/es.object.to-string.js");
/* harmony import */ var _node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_core_js_modules_es_object_to_string_js__WEBPACK_IMPORTED_MODULE_1__);
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }



var clickTests = {
  click: function () {
    var _click = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function click() {
      return _click.apply(this, arguments);
    }

    return click;
  }()
};

/***/ }),

/***/ "./node_modules/@storybook/client-api":
/* external "./node_modules/@storybook/client-api" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/@storybook/client-api");

/***/ }),

/***/ "./node_modules/@storybook/client-logger":
/* external "./node_modules/@storybook/client-logger" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/@storybook/client-logger");

/***/ }),

/***/ "./node_modules/@storybook/core-client/dist/esm/globals/globals.js":
/* external "./node_modules/@storybook/core-client/dist/esm/globals/globals.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/@storybook/core-client/dist/esm/globals/globals.js");

/***/ }),

/***/ "./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js":
/* external "./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.array.filter.js":
/* external "./node_modules/core-js/modules/es.array.filter.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.array.filter.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.array.for-each.js":
/* external "./node_modules/core-js/modules/es.array.for-each.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.array.for-each.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.assign.js":
/* external "./node_modules/core-js/modules/es.object.assign.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.assign.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.define-properties.js":
/* external "./node_modules/core-js/modules/es.object.define-properties.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.define-properties.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.define-property.js":
/* external "./node_modules/core-js/modules/es.object.define-property.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.define-property.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.get-own-property-descriptor.js":
/* external "./node_modules/core-js/modules/es.object.get-own-property-descriptor.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.get-own-property-descriptor.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.get-own-property-descriptors.js":
/* external "./node_modules/core-js/modules/es.object.get-own-property-descriptors.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.get-own-property-descriptors.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.keys.js":
/* external "./node_modules/core-js/modules/es.object.keys.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.keys.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.object.to-string.js":
/* external "./node_modules/core-js/modules/es.object.to-string.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.object.to-string.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.promise.js":
/* external "./node_modules/core-js/modules/es.promise.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.promise.js");

/***/ }),

/***/ "./node_modules/core-js/modules/es.symbol.js":
/* external "./node_modules/core-js/modules/es.symbol.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/es.symbol.js");

/***/ }),

/***/ "./node_modules/core-js/modules/web.dom-collections.for-each.js":
/* external "./node_modules/core-js/modules/web.dom-collections.for-each.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/core-js/modules/web.dom-collections.for-each.js");

/***/ }),

/***/ 0:
/* multi ./node_modules/creevey/lib/cjs/server/loaders/webpack/dummy-hmr.js ./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js ./node_modules/@storybook/core-client/dist/esm/globals/globals.js ./.storybook/storybook-init-framework-entry.js ./.storybook/preview.js-generated-config-entry.js ./.storybook/generated-stories-entry.js */
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ./node_modules/creevey/lib/cjs/server/loaders/webpack/dummy-hmr.js */"./node_modules/creevey/lib/cjs/server/loaders/webpack/dummy-hmr.js");
__webpack_require__(/*! ./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js */"./node_modules/@storybook/core-client/dist/esm/globals/polyfills.js");
__webpack_require__(/*! ./node_modules/@storybook/core-client/dist/esm/globals/globals.js */"./node_modules/@storybook/core-client/dist/esm/globals/globals.js");
__webpack_require__(/*! ./.storybook/storybook-init-framework-entry.js */"./.storybook/storybook-init-framework-entry.js");
__webpack_require__(/*! ./.storybook/preview.js-generated-config-entry.js */"./.storybook/preview.js-generated-config-entry.js");
module.exports = __webpack_require__(/*! ./.storybook/generated-stories-entry.js */"./.storybook/generated-stories-entry.js");


/***/ }),

/***/ "@storybook/react":
/* external "./node_modules/creevey/lib/cjs/server/storybook/entry.js" */
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = require("./node_modules/creevey/lib/cjs/server/storybook/entry.js");

/***/ })

/******/ });