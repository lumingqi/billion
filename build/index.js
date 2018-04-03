webpackJsonp([0],[
/* 0 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function() {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		var result = [];
		for(var i = 0; i < this.length; i++) {
			var item = this[i];
			if(item[2]) {
				result.push("@media " + item[2] + "{" + item[1] + "}");
			} else {
				result.push(item[1]);
			}
		}
		return result.join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
  Modified by Evan You @yyx990803
*/

var hasDocument = typeof document !== 'undefined'

if (typeof DEBUG !== 'undefined' && DEBUG) {
  if (!hasDocument) {
    throw new Error(
    'vue-style-loader cannot be used in a non-browser environment. ' +
    "Use { target: 'node' } in your Webpack config to indicate a server-rendering environment."
  ) }
}

var listToStyles = __webpack_require__(11)

/*
type StyleObject = {
  id: number;
  parts: Array<StyleObjectPart>
}

type StyleObjectPart = {
  css: string;
  media: string;
  sourceMap: ?string
}
*/

var stylesInDom = {/*
  [id: number]: {
    id: number,
    refs: number,
    parts: Array<(obj?: StyleObjectPart) => void>
  }
*/}

var head = hasDocument && (document.head || document.getElementsByTagName('head')[0])
var singletonElement = null
var singletonCounter = 0
var isProduction = false
var noop = function () {}

// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
// tags it will allow on a page
var isOldIE = typeof navigator !== 'undefined' && /msie [6-9]\b/.test(navigator.userAgent.toLowerCase())

module.exports = function (parentId, list, _isProduction) {
  isProduction = _isProduction

  var styles = listToStyles(parentId, list)
  addStylesToDom(styles)

  return function update (newList) {
    var mayRemove = []
    for (var i = 0; i < styles.length; i++) {
      var item = styles[i]
      var domStyle = stylesInDom[item.id]
      domStyle.refs--
      mayRemove.push(domStyle)
    }
    if (newList) {
      styles = listToStyles(parentId, newList)
      addStylesToDom(styles)
    } else {
      styles = []
    }
    for (var i = 0; i < mayRemove.length; i++) {
      var domStyle = mayRemove[i]
      if (domStyle.refs === 0) {
        for (var j = 0; j < domStyle.parts.length; j++) {
          domStyle.parts[j]()
        }
        delete stylesInDom[domStyle.id]
      }
    }
  }
}

function addStylesToDom (styles /* Array<StyleObject> */) {
  for (var i = 0; i < styles.length; i++) {
    var item = styles[i]
    var domStyle = stylesInDom[item.id]
    if (domStyle) {
      domStyle.refs++
      for (var j = 0; j < domStyle.parts.length; j++) {
        domStyle.parts[j](item.parts[j])
      }
      for (; j < item.parts.length; j++) {
        domStyle.parts.push(addStyle(item.parts[j]))
      }
      if (domStyle.parts.length > item.parts.length) {
        domStyle.parts.length = item.parts.length
      }
    } else {
      var parts = []
      for (var j = 0; j < item.parts.length; j++) {
        parts.push(addStyle(item.parts[j]))
      }
      stylesInDom[item.id] = { id: item.id, refs: 1, parts: parts }
    }
  }
}

function createStyleElement () {
  var styleElement = document.createElement('style')
  styleElement.type = 'text/css'
  head.appendChild(styleElement)
  return styleElement
}

function addStyle (obj /* StyleObjectPart */) {
  var update, remove
  var styleElement = document.querySelector('style[data-vue-ssr-id~="' + obj.id + '"]')

  if (styleElement) {
    if (isProduction) {
      // has SSR styles and in production mode.
      // simply do nothing.
      return noop
    } else {
      // has SSR styles but in dev mode.
      // for some reason Chrome can't handle source map in server-rendered
      // style tags - source maps in <style> only works if the style tag is
      // created and inserted dynamically. So we remove the server rendered
      // styles and inject new ones.
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  if (isOldIE) {
    // use singleton mode for IE9.
    var styleIndex = singletonCounter++
    styleElement = singletonElement || (singletonElement = createStyleElement())
    update = applyToSingletonTag.bind(null, styleElement, styleIndex, false)
    remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true)
  } else {
    // use multi-style-tag mode in all other cases
    styleElement = createStyleElement()
    update = applyToTag.bind(null, styleElement)
    remove = function () {
      styleElement.parentNode.removeChild(styleElement)
    }
  }

  update(obj)

  return function updateStyle (newObj /* StyleObjectPart */) {
    if (newObj) {
      if (newObj.css === obj.css &&
          newObj.media === obj.media &&
          newObj.sourceMap === obj.sourceMap) {
        return
      }
      update(obj = newObj)
    } else {
      remove()
    }
  }
}

var replaceText = (function () {
  var textStore = []

  return function (index, replacement) {
    textStore[index] = replacement
    return textStore.filter(Boolean).join('\n')
  }
})()

function applyToSingletonTag (styleElement, index, remove, obj) {
  var css = remove ? '' : obj.css

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = replaceText(index, css)
  } else {
    var cssNode = document.createTextNode(css)
    var childNodes = styleElement.childNodes
    if (childNodes[index]) styleElement.removeChild(childNodes[index])
    if (childNodes.length) {
      styleElement.insertBefore(cssNode, childNodes[index])
    } else {
      styleElement.appendChild(cssNode)
    }
  }
}

function applyToTag (styleElement, obj) {
  var css = obj.css
  var media = obj.media
  var sourceMap = obj.sourceMap

  if (media) {
    styleElement.setAttribute('media', media)
  }

  if (sourceMap) {
    // https://developer.chrome.com/devtools/docs/javascript-debugging
    // this makes source maps inside style tags work properly in Chrome
    css += '\n/*# sourceURL=' + sourceMap.sources[0] + ' */'
    // http://stackoverflow.com/a/26603875
    css += '\n/*# sourceMappingURL=data:application/json;base64,' + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + ' */'
  }

  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild)
    }
    styleElement.appendChild(document.createTextNode(css))
  }
}


/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = function normalizeComponent (
  rawScriptExports,
  compiledTemplate,
  scopeId,
  cssModules
) {
  var esModule
  var scriptExports = rawScriptExports = rawScriptExports || {}

  // ES6 modules interop
  var type = typeof rawScriptExports.default
  if (type === 'object' || type === 'function') {
    esModule = rawScriptExports
    scriptExports = rawScriptExports.default
  }

  // Vue.extend constructor export interop
  var options = typeof scriptExports === 'function'
    ? scriptExports.options
    : scriptExports

  // render functions
  if (compiledTemplate) {
    options.render = compiledTemplate.render
    options.staticRenderFns = compiledTemplate.staticRenderFns
  }

  // scopedId
  if (scopeId) {
    options._scopeId = scopeId
  }

  // inject cssModules
  if (cssModules) {
    var computed = options.computed || (options.computed = {})
    Object.keys(cssModules).forEach(function (key) {
      var module = cssModules[key]
      computed[key] = function () { return module }
    })
  }

  return {
    esModule: esModule,
    exports: scriptExports,
    options: options
  }
}


/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* WEBPACK VAR INJECTION */(function(global, setImmediate) {/*!
 * Vue.js v2.5.16
 * (c) 2014-2018 Evan You
 * Released under the MIT License.
 */
/*  */

var emptyObject = Object.freeze({});

// these helpers produces better vm code in JS engines due to their
// explicitness and function inlining
function isUndef (v) {
  return v === undefined || v === null
}

function isDef (v) {
  return v !== undefined && v !== null
}

function isTrue (v) {
  return v === true
}

function isFalse (v) {
  return v === false
}

/**
 * Check if value is primitive
 */
function isPrimitive (value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    // $flow-disable-line
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
function isObject (obj) {
  return obj !== null && typeof obj === 'object'
}

/**
 * Get the raw type string of a value e.g. [object Object]
 */
var _toString = Object.prototype.toString;

function toRawType (value) {
  return _toString.call(value).slice(8, -1)
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
function isPlainObject (obj) {
  return _toString.call(obj) === '[object Object]'
}

function isRegExp (v) {
  return _toString.call(v) === '[object RegExp]'
}

/**
 * Check if val is a valid array index.
 */
function isValidArrayIndex (val) {
  var n = parseFloat(String(val));
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}

/**
 * Convert a value to a string that is actually rendered.
 */
function toString (val) {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
function toNumber (val) {
  var n = parseFloat(val);
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
function makeMap (
  str,
  expectsLowerCase
) {
  var map = Object.create(null);
  var list = str.split(',');
  for (var i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase
    ? function (val) { return map[val.toLowerCase()]; }
    : function (val) { return map[val]; }
}

/**
 * Check if a tag is a built-in tag.
 */
var isBuiltInTag = makeMap('slot,component', true);

/**
 * Check if a attribute is a reserved attribute.
 */
var isReservedAttribute = makeMap('key,ref,slot,slot-scope,is');

/**
 * Remove an item from an array
 */
function remove (arr, item) {
  if (arr.length) {
    var index = arr.indexOf(item);
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

/**
 * Create a cached version of a pure function.
 */
function cached (fn) {
  var cache = Object.create(null);
  return (function cachedFn (str) {
    var hit = cache[str];
    return hit || (cache[str] = fn(str))
  })
}

/**
 * Camelize a hyphen-delimited string.
 */
var camelizeRE = /-(\w)/g;
var camelize = cached(function (str) {
  return str.replace(camelizeRE, function (_, c) { return c ? c.toUpperCase() : ''; })
});

/**
 * Capitalize a string.
 */
var capitalize = cached(function (str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
});

/**
 * Hyphenate a camelCase string.
 */
var hyphenateRE = /\B([A-Z])/g;
var hyphenate = cached(function (str) {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
});

/**
 * Simple bind polyfill for environments that do not support it... e.g.
 * PhantomJS 1.x. Technically we don't need this anymore since native bind is
 * now more performant in most browsers, but removing it would be breaking for
 * code that was able to run in PhantomJS 1.x, so this must be kept for
 * backwards compatibility.
 */

/* istanbul ignore next */
function polyfillBind (fn, ctx) {
  function boundFn (a) {
    var l = arguments.length;
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length;
  return boundFn
}

function nativeBind (fn, ctx) {
  return fn.bind(ctx)
}

var bind = Function.prototype.bind
  ? nativeBind
  : polyfillBind;

/**
 * Convert an Array-like object to a real Array.
 */
function toArray (list, start) {
  start = start || 0;
  var i = list.length - start;
  var ret = new Array(i);
  while (i--) {
    ret[i] = list[i + start];
  }
  return ret
}

/**
 * Mix properties into target object.
 */
function extend (to, _from) {
  for (var key in _from) {
    to[key] = _from[key];
  }
  return to
}

/**
 * Merge an Array of Objects into a single Object.
 */
function toObject (arr) {
  var res = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i]);
    }
  }
  return res
}

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 */
function noop (a, b, c) {}

/**
 * Always return false.
 */
var no = function (a, b, c) { return false; };

/**
 * Return same value
 */
var identity = function (_) { return _; };

/**
 * Generate a static keys string from compiler modules.
 */


/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
function looseEqual (a, b) {
  if (a === b) { return true }
  var isObjectA = isObject(a);
  var isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      var isArrayA = Array.isArray(a);
      var isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every(function (e, i) {
          return looseEqual(e, b[i])
        })
      } else if (!isArrayA && !isArrayB) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(function (key) {
          return looseEqual(a[key], b[key])
        })
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

function looseIndexOf (arr, val) {
  for (var i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) { return i }
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
function once (fn) {
  var called = false;
  return function () {
    if (!called) {
      called = true;
      fn.apply(this, arguments);
    }
  }
}

var SSR_ATTR = 'data-server-rendered';

var ASSET_TYPES = [
  'component',
  'directive',
  'filter'
];

var LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured'
];

/*  */

var config = ({
  /**
   * Option merge strategies (used in core/util/options)
   */
  // $flow-disable-line
  optionMergeStrategies: Object.create(null),

  /**
   * Whether to suppress warnings.
   */
  silent: false,

  /**
   * Show production mode tip message on boot?
   */
  productionTip: "production" !== 'production',

  /**
   * Whether to enable devtools
   */
  devtools: "production" !== 'production',

  /**
   * Whether to record perf
   */
  performance: false,

  /**
   * Error handler for watcher errors
   */
  errorHandler: null,

  /**
   * Warn handler for watcher warns
   */
  warnHandler: null,

  /**
   * Ignore certain custom elements
   */
  ignoredElements: [],

  /**
   * Custom user key aliases for v-on
   */
  // $flow-disable-line
  keyCodes: Object.create(null),

  /**
   * Check if a tag is reserved so that it cannot be registered as a
   * component. This is platform-dependent and may be overwritten.
   */
  isReservedTag: no,

  /**
   * Check if an attribute is reserved so that it cannot be used as a component
   * prop. This is platform-dependent and may be overwritten.
   */
  isReservedAttr: no,

  /**
   * Check if a tag is an unknown element.
   * Platform-dependent.
   */
  isUnknownElement: no,

  /**
   * Get the namespace of an element
   */
  getTagNamespace: noop,

  /**
   * Parse the real tag name for the specific platform.
   */
  parsePlatformTagName: identity,

  /**
   * Check if an attribute must be bound using property, e.g. value
   * Platform-dependent.
   */
  mustUseProp: no,

  /**
   * Exposed for legacy reasons
   */
  _lifecycleHooks: LIFECYCLE_HOOKS
})

/*  */

/**
 * Check if a string starts with $ or _
 */
function isReserved (str) {
  var c = (str + '').charCodeAt(0);
  return c === 0x24 || c === 0x5F
}

/**
 * Define a property.
 */
function def (obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  });
}

/**
 * Parse simple path.
 */
var bailRE = /[^\w.$]/;
function parsePath (path) {
  if (bailRE.test(path)) {
    return
  }
  var segments = path.split('.');
  return function (obj) {
    for (var i = 0; i < segments.length; i++) {
      if (!obj) { return }
      obj = obj[segments[i]];
    }
    return obj
  }
}

/*  */

// can we use __proto__?
var hasProto = '__proto__' in {};

// Browser environment sniffing
var inBrowser = typeof window !== 'undefined';
var inWeex = typeof WXEnvironment !== 'undefined' && !!WXEnvironment.platform;
var weexPlatform = inWeex && WXEnvironment.platform.toLowerCase();
var UA = inBrowser && window.navigator.userAgent.toLowerCase();
var isIE = UA && /msie|trident/.test(UA);
var isIE9 = UA && UA.indexOf('msie 9.0') > 0;
var isEdge = UA && UA.indexOf('edge/') > 0;
var isAndroid = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
var isIOS = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
var isChrome = UA && /chrome\/\d+/.test(UA) && !isEdge;

// Firefox has a "watch" function on Object.prototype...
var nativeWatch = ({}).watch;

var supportsPassive = false;
if (inBrowser) {
  try {
    var opts = {};
    Object.defineProperty(opts, 'passive', ({
      get: function get () {
        /* istanbul ignore next */
        supportsPassive = true;
      }
    })); // https://github.com/facebook/flow/issues/285
    window.addEventListener('test-passive', null, opts);
  } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
var _isServer;
var isServerRendering = function () {
  if (_isServer === undefined) {
    /* istanbul ignore if */
    if (!inBrowser && !inWeex && typeof global !== 'undefined') {
      // detect presence of vue-server-renderer and avoid
      // Webpack shimming the process
      _isServer = global['process'].env.VUE_ENV === 'server';
    } else {
      _isServer = false;
    }
  }
  return _isServer
};

// detect devtools
var devtools = inBrowser && window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
function isNative (Ctor) {
  return typeof Ctor === 'function' && /native code/.test(Ctor.toString())
}

var hasSymbol =
  typeof Symbol !== 'undefined' && isNative(Symbol) &&
  typeof Reflect !== 'undefined' && isNative(Reflect.ownKeys);

var _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
  // use native Set when available.
  _Set = Set;
} else {
  // a non-standard Set polyfill that only works with primitive keys.
  _Set = (function () {
    function Set () {
      this.set = Object.create(null);
    }
    Set.prototype.has = function has (key) {
      return this.set[key] === true
    };
    Set.prototype.add = function add (key) {
      this.set[key] = true;
    };
    Set.prototype.clear = function clear () {
      this.set = Object.create(null);
    };

    return Set;
  }());
}

/*  */

var warn = noop;
var tip = noop;
var generateComponentTrace = (noop); // work around flow check
var formatComponentName = (noop);

if (false) {
  var hasConsole = typeof console !== 'undefined';
  var classifyRE = /(?:^|[-_])(\w)/g;
  var classify = function (str) { return str
    .replace(classifyRE, function (c) { return c.toUpperCase(); })
    .replace(/[-_]/g, ''); };

  warn = function (msg, vm) {
    var trace = vm ? generateComponentTrace(vm) : '';

    if (config.warnHandler) {
      config.warnHandler.call(null, msg, vm, trace);
    } else if (hasConsole && (!config.silent)) {
      console.error(("[Vue warn]: " + msg + trace));
    }
  };

  tip = function (msg, vm) {
    if (hasConsole && (!config.silent)) {
      console.warn("[Vue tip]: " + msg + (
        vm ? generateComponentTrace(vm) : ''
      ));
    }
  };

  formatComponentName = function (vm, includeFile) {
    if (vm.$root === vm) {
      return '<Root>'
    }
    var options = typeof vm === 'function' && vm.cid != null
      ? vm.options
      : vm._isVue
        ? vm.$options || vm.constructor.options
        : vm || {};
    var name = options.name || options._componentTag;
    var file = options.__file;
    if (!name && file) {
      var match = file.match(/([^/\\]+)\.vue$/);
      name = match && match[1];
    }

    return (
      (name ? ("<" + (classify(name)) + ">") : "<Anonymous>") +
      (file && includeFile !== false ? (" at " + file) : '')
    )
  };

  var repeat = function (str, n) {
    var res = '';
    while (n) {
      if (n % 2 === 1) { res += str; }
      if (n > 1) { str += str; }
      n >>= 1;
    }
    return res
  };

  generateComponentTrace = function (vm) {
    if (vm._isVue && vm.$parent) {
      var tree = [];
      var currentRecursiveSequence = 0;
      while (vm) {
        if (tree.length > 0) {
          var last = tree[tree.length - 1];
          if (last.constructor === vm.constructor) {
            currentRecursiveSequence++;
            vm = vm.$parent;
            continue
          } else if (currentRecursiveSequence > 0) {
            tree[tree.length - 1] = [last, currentRecursiveSequence];
            currentRecursiveSequence = 0;
          }
        }
        tree.push(vm);
        vm = vm.$parent;
      }
      return '\n\nfound in\n\n' + tree
        .map(function (vm, i) { return ("" + (i === 0 ? '---> ' : repeat(' ', 5 + i * 2)) + (Array.isArray(vm)
            ? ((formatComponentName(vm[0])) + "... (" + (vm[1]) + " recursive calls)")
            : formatComponentName(vm))); })
        .join('\n')
    } else {
      return ("\n\n(found in " + (formatComponentName(vm)) + ")")
    }
  };
}

/*  */


var uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
var Dep = function Dep () {
  this.id = uid++;
  this.subs = [];
};

Dep.prototype.addSub = function addSub (sub) {
  this.subs.push(sub);
};

Dep.prototype.removeSub = function removeSub (sub) {
  remove(this.subs, sub);
};

Dep.prototype.depend = function depend () {
  if (Dep.target) {
    Dep.target.addDep(this);
  }
};

Dep.prototype.notify = function notify () {
  // stabilize the subscriber list first
  var subs = this.subs.slice();
  for (var i = 0, l = subs.length; i < l; i++) {
    subs[i].update();
  }
};

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;
var targetStack = [];

function pushTarget (_target) {
  if (Dep.target) { targetStack.push(Dep.target); }
  Dep.target = _target;
}

function popTarget () {
  Dep.target = targetStack.pop();
}

/*  */

var VNode = function VNode (
  tag,
  data,
  children,
  text,
  elm,
  context,
  componentOptions,
  asyncFactory
) {
  this.tag = tag;
  this.data = data;
  this.children = children;
  this.text = text;
  this.elm = elm;
  this.ns = undefined;
  this.context = context;
  this.fnContext = undefined;
  this.fnOptions = undefined;
  this.fnScopeId = undefined;
  this.key = data && data.key;
  this.componentOptions = componentOptions;
  this.componentInstance = undefined;
  this.parent = undefined;
  this.raw = false;
  this.isStatic = false;
  this.isRootInsert = true;
  this.isComment = false;
  this.isCloned = false;
  this.isOnce = false;
  this.asyncFactory = asyncFactory;
  this.asyncMeta = undefined;
  this.isAsyncPlaceholder = false;
};

var prototypeAccessors = { child: { configurable: true } };

// DEPRECATED: alias for componentInstance for backwards compat.
/* istanbul ignore next */
prototypeAccessors.child.get = function () {
  return this.componentInstance
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

var createEmptyVNode = function (text) {
  if ( text === void 0 ) text = '';

  var node = new VNode();
  node.text = text;
  node.isComment = true;
  return node
};

function createTextVNode (val) {
  return new VNode(undefined, undefined, undefined, String(val))
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
function cloneVNode (vnode) {
  var cloned = new VNode(
    vnode.tag,
    vnode.data,
    vnode.children,
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.isCloned = true;
  return cloned
}

/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);

var methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
];

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  var original = arrayProto[method];
  def(arrayMethods, method, function mutator () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    var result = original.apply(this, args);
    var ob = this.__ob__;
    var inserted;
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break
      case 'splice':
        inserted = args.slice(2);
        break
    }
    if (inserted) { ob.observeArray(inserted); }
    // notify change
    ob.dep.notify();
    return result
  });
});

/*  */

var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
var shouldObserve = true;

function toggleObserving (value) {
  shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
var Observer = function Observer (value) {
  this.value = value;
  this.dep = new Dep();
  this.vmCount = 0;
  def(value, '__ob__', this);
  if (Array.isArray(value)) {
    var augment = hasProto
      ? protoAugment
      : copyAugment;
    augment(value, arrayMethods, arrayKeys);
    this.observeArray(value);
  } else {
    this.walk(value);
  }
};

/**
 * Walk through each property and convert them into
 * getter/setters. This method should only be called when
 * value type is Object.
 */
Observer.prototype.walk = function walk (obj) {
  var keys = Object.keys(obj);
  for (var i = 0; i < keys.length; i++) {
    defineReactive(obj, keys[i]);
  }
};

/**
 * Observe a list of Array items.
 */
Observer.prototype.observeArray = function observeArray (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
};

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src, keys) {
  /* eslint-disable no-proto */
  target.__proto__ = src;
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
function observe (value, asRootData) {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  var ob;
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    ob = new Observer(value);
  }
  if (asRootData && ob) {
    ob.vmCount++;
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 */
function defineReactive (
  obj,
  key,
  val,
  customSetter,
  shallow
) {
  var dep = new Dep();

  var property = Object.getOwnPropertyDescriptor(obj, key);
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  var getter = property && property.get;
  if (!getter && arguments.length === 2) {
    val = obj[key];
  }
  var setter = property && property.set;

  var childOb = !shallow && observe(val);
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      var value = getter ? getter.call(obj) : val;
      if (Dep.target) {
        dep.depend();
        if (childOb) {
          childOb.dep.depend();
          if (Array.isArray(value)) {
            dependArray(value);
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      var value = getter ? getter.call(obj) : val;
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (false) {
        customSetter();
      }
      if (setter) {
        setter.call(obj, newVal);
      } else {
        val = newVal;
      }
      childOb = !shallow && observe(newVal);
      dep.notify();
    }
  });
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
function set (target, key, val) {
  if (false
  ) {
    warn(("Cannot set reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, val);
    return val
  }
  if (key in target && !(key in Object.prototype)) {
    target[key] = val;
    return val
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "production" !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    );
    return val
  }
  if (!ob) {
    target[key] = val;
    return val
  }
  defineReactive(ob.value, key, val);
  ob.dep.notify();
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
function del (target, key) {
  if (false
  ) {
    warn(("Cannot delete reactive property on undefined, null, or primitive value: " + ((target))));
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return
  }
  var ob = (target).__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    "production" !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    );
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key];
  if (!ob) {
    return
  }
  ob.dep.notify();
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value) {
  for (var e = (void 0), i = 0, l = value.length; i < l; i++) {
    e = value[i];
    e && e.__ob__ && e.__ob__.dep.depend();
    if (Array.isArray(e)) {
      dependArray(e);
    }
  }
}

/*  */

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
var strats = config.optionMergeStrategies;

/**
 * Options with restrictions
 */
if (false) {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    if (!vm) {
      warn(
        "option \"" + key + "\" can only be used during instance " +
        'creation with the `new` keyword.'
      );
    }
    return defaultStrat(parent, child)
  };
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to, from) {
  if (!from) { return to }
  var key, toVal, fromVal;
  var keys = Object.keys(from);
  for (var i = 0; i < keys.length; i++) {
    key = keys[i];
    toVal = to[key];
    fromVal = from[key];
    if (!hasOwn(to, key)) {
      set(to, key, fromVal);
    } else if (isPlainObject(toVal) && isPlainObject(fromVal)) {
      mergeData(toVal, fromVal);
    }
  }
  return to
}

/**
 * Data
 */
function mergeDataOrFn (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    return function mergedDataFn () {
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      var instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal;
      var defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal;
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

strats.data = function (
  parentVal,
  childVal,
  vm
) {
  if (!vm) {
    if (childVal && typeof childVal !== 'function') {
      "production" !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      );

      return parentVal
    }
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
};

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal,
  childVal
) {
  return childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
}

LIFECYCLE_HOOKS.forEach(function (hook) {
  strats[hook] = mergeHook;
});

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal,
  childVal,
  vm,
  key
) {
  var res = Object.create(parentVal || null);
  if (childVal) {
    "production" !== 'production' && assertObjectType(key, childVal, vm);
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets;
});

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal,
  childVal,
  vm,
  key
) {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) { parentVal = undefined; }
  if (childVal === nativeWatch) { childVal = undefined; }
  /* istanbul ignore if */
  if (!childVal) { return Object.create(parentVal || null) }
  if (false) {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = {};
  extend(ret, parentVal);
  for (var key$1 in childVal) {
    var parent = ret[key$1];
    var child = childVal[key$1];
    if (parent && !Array.isArray(parent)) {
      parent = [parent];
    }
    ret[key$1] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child];
  }
  return ret
};

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal,
  childVal,
  vm,
  key
) {
  if (childVal && "production" !== 'production') {
    assertObjectType(key, childVal, vm);
  }
  if (!parentVal) { return childVal }
  var ret = Object.create(null);
  extend(ret, parentVal);
  if (childVal) { extend(ret, childVal); }
  return ret
};
strats.provide = mergeDataOrFn;

/**
 * Default strategy.
 */
var defaultStrat = function (parentVal, childVal) {
  return childVal === undefined
    ? parentVal
    : childVal
};

/**
 * Validate component names
 */
function checkComponents (options) {
  for (var key in options.components) {
    validateComponentName(key);
  }
}

function validateComponentName (name) {
  if (!/^[a-zA-Z][\w-]*$/.test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'can only contain alphanumeric characters and the hyphen, ' +
      'and must start with a letter.'
    );
  }
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    );
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 */
function normalizeProps (options, vm) {
  var props = options.props;
  if (!props) { return }
  var res = {};
  var i, val, name;
  if (Array.isArray(props)) {
    i = props.length;
    while (i--) {
      val = props[i];
      if (typeof val === 'string') {
        name = camelize(val);
        res[name] = { type: null };
      } else if (false) {
        warn('props must be strings when using array syntax.');
      }
    }
  } else if (isPlainObject(props)) {
    for (var key in props) {
      val = props[key];
      name = camelize(key);
      res[name] = isPlainObject(val)
        ? val
        : { type: val };
    }
  } else if (false) {
    warn(
      "Invalid value for option \"props\": expected an Array or an Object, " +
      "but got " + (toRawType(props)) + ".",
      vm
    );
  }
  options.props = res;
}

/**
 * Normalize all injections into Object-based format
 */
function normalizeInject (options, vm) {
  var inject = options.inject;
  if (!inject) { return }
  var normalized = options.inject = {};
  if (Array.isArray(inject)) {
    for (var i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] };
    }
  } else if (isPlainObject(inject)) {
    for (var key in inject) {
      var val = inject[key];
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)
        : { from: val };
    }
  } else if (false) {
    warn(
      "Invalid value for option \"inject\": expected an Array or an Object, " +
      "but got " + (toRawType(inject)) + ".",
      vm
    );
  }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options) {
  var dirs = options.directives;
  if (dirs) {
    for (var key in dirs) {
      var def = dirs[key];
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def };
      }
    }
  }
}

function assertObjectType (name, value, vm) {
  if (!isPlainObject(value)) {
    warn(
      "Invalid value for option \"" + name + "\": expected an Object, " +
      "but got " + (toRawType(value)) + ".",
      vm
    );
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 */
function mergeOptions (
  parent,
  child,
  vm
) {
  if (false) {
    checkComponents(child);
  }

  if (typeof child === 'function') {
    child = child.options;
  }

  normalizeProps(child, vm);
  normalizeInject(child, vm);
  normalizeDirectives(child);
  var extendsFrom = child.extends;
  if (extendsFrom) {
    parent = mergeOptions(parent, extendsFrom, vm);
  }
  if (child.mixins) {
    for (var i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm);
    }
  }
  var options = {};
  var key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!hasOwn(parent, key)) {
      mergeField(key);
    }
  }
  function mergeField (key) {
    var strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key], vm, key);
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
function resolveAsset (
  options,
  type,
  id,
  warnMissing
) {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  var assets = options[type];
  // check local registration variations first
  if (hasOwn(assets, id)) { return assets[id] }
  var camelizedId = camelize(id);
  if (hasOwn(assets, camelizedId)) { return assets[camelizedId] }
  var PascalCaseId = capitalize(camelizedId);
  if (hasOwn(assets, PascalCaseId)) { return assets[PascalCaseId] }
  // fallback to prototype chain
  var res = assets[id] || assets[camelizedId] || assets[PascalCaseId];
  if (false) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    );
  }
  return res
}

/*  */

function validateProp (
  key,
  propOptions,
  propsData,
  vm
) {
  var prop = propOptions[key];
  var absent = !hasOwn(propsData, key);
  var value = propsData[key];
  // boolean casting
  var booleanIndex = getTypeIndex(Boolean, prop.type);
  if (booleanIndex > -1) {
    if (absent && !hasOwn(prop, 'default')) {
      value = false;
    } else if (value === '' || value === hyphenate(key)) {
      // only cast empty string / same name to boolean if
      // boolean has higher priority
      var stringIndex = getTypeIndex(String, prop.type);
      if (stringIndex < 0 || booleanIndex < stringIndex) {
        value = true;
      }
    }
  }
  // check default value
  if (value === undefined) {
    value = getPropDefaultValue(vm, prop, key);
    // since the default value is a fresh copy,
    // make sure to observe it.
    var prevShouldObserve = shouldObserve;
    toggleObserving(true);
    observe(value);
    toggleObserving(prevShouldObserve);
  }
  if (
    false
  ) {
    assertProp(prop, key, value, vm, absent);
  }
  return value
}

/**
 * Get the default value of a prop.
 */
function getPropDefaultValue (vm, prop, key) {
  // no default, return undefined
  if (!hasOwn(prop, 'default')) {
    return undefined
  }
  var def = prop.default;
  // warn against non-factory defaults for Object & Array
  if (false) {
    warn(
      'Invalid default value for prop "' + key + '": ' +
      'Props with type Object/Array must use a factory function ' +
      'to return the default value.',
      vm
    );
  }
  // the raw prop value was also undefined from previous render,
  // return previous default value to avoid unnecessary watcher trigger
  if (vm && vm.$options.propsData &&
    vm.$options.propsData[key] === undefined &&
    vm._props[key] !== undefined
  ) {
    return vm._props[key]
  }
  // call factory function for non-Function types
  // a value is Function if its prototype is function even across different execution context
  return typeof def === 'function' && getType(prop.type) !== 'Function'
    ? def.call(vm)
    : def
}

/**
 * Assert whether a prop is valid.
 */
function assertProp (
  prop,
  name,
  value,
  vm,
  absent
) {
  if (prop.required && absent) {
    warn(
      'Missing required prop: "' + name + '"',
      vm
    );
    return
  }
  if (value == null && !prop.required) {
    return
  }
  var type = prop.type;
  var valid = !type || type === true;
  var expectedTypes = [];
  if (type) {
    if (!Array.isArray(type)) {
      type = [type];
    }
    for (var i = 0; i < type.length && !valid; i++) {
      var assertedType = assertType(value, type[i]);
      expectedTypes.push(assertedType.expectedType || '');
      valid = assertedType.valid;
    }
  }
  if (!valid) {
    warn(
      "Invalid prop: type check failed for prop \"" + name + "\"." +
      " Expected " + (expectedTypes.map(capitalize).join(', ')) +
      ", got " + (toRawType(value)) + ".",
      vm
    );
    return
  }
  var validator = prop.validator;
  if (validator) {
    if (!validator(value)) {
      warn(
        'Invalid prop: custom validator check failed for prop "' + name + '".',
        vm
      );
    }
  }
}

var simpleCheckRE = /^(String|Number|Boolean|Function|Symbol)$/;

function assertType (value, type) {
  var valid;
  var expectedType = getType(type);
  if (simpleCheckRE.test(expectedType)) {
    var t = typeof value;
    valid = t === expectedType.toLowerCase();
    // for primitive wrapper objects
    if (!valid && t === 'object') {
      valid = value instanceof type;
    }
  } else if (expectedType === 'Object') {
    valid = isPlainObject(value);
  } else if (expectedType === 'Array') {
    valid = Array.isArray(value);
  } else {
    valid = value instanceof type;
  }
  return {
    valid: valid,
    expectedType: expectedType
  }
}

/**
 * Use function string name to check built-in types,
 * because a simple equality check will fail when running
 * across different vms / iframes.
 */
function getType (fn) {
  var match = fn && fn.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ''
}

function isSameType (a, b) {
  return getType(a) === getType(b)
}

function getTypeIndex (type, expectedTypes) {
  if (!Array.isArray(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1
  }
  for (var i = 0, len = expectedTypes.length; i < len; i++) {
    if (isSameType(expectedTypes[i], type)) {
      return i
    }
  }
  return -1
}

/*  */

function handleError (err, vm, info) {
  if (vm) {
    var cur = vm;
    while ((cur = cur.$parent)) {
      var hooks = cur.$options.errorCaptured;
      if (hooks) {
        for (var i = 0; i < hooks.length; i++) {
          try {
            var capture = hooks[i].call(cur, err, vm, info) === false;
            if (capture) { return }
          } catch (e) {
            globalHandleError(e, cur, 'errorCaptured hook');
          }
        }
      }
    }
  }
  globalHandleError(err, vm, info);
}

function globalHandleError (err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info)
    } catch (e) {
      logError(e, null, 'config.errorHandler');
    }
  }
  logError(err, vm, info);
}

function logError (err, vm, info) {
  if (false) {
    warn(("Error in " + info + ": \"" + (err.toString()) + "\""), vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== 'undefined') {
    console.error(err);
  } else {
    throw err
  }
}

/*  */
/* globals MessageChannel */

var callbacks = [];
var pending = false;

function flushCallbacks () {
  pending = false;
  var copies = callbacks.slice(0);
  callbacks.length = 0;
  for (var i = 0; i < copies.length; i++) {
    copies[i]();
  }
}

// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
var microTimerFunc;
var macroTimerFunc;
var useMacroTask = false;

// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  macroTimerFunc = function () {
    setImmediate(flushCallbacks);
  };
} else if (typeof MessageChannel !== 'undefined' && (
  isNative(MessageChannel) ||
  // PhantomJS
  MessageChannel.toString() === '[object MessageChannelConstructor]'
)) {
  var channel = new MessageChannel();
  var port = channel.port2;
  channel.port1.onmessage = flushCallbacks;
  macroTimerFunc = function () {
    port.postMessage(1);
  };
} else {
  /* istanbul ignore next */
  macroTimerFunc = function () {
    setTimeout(flushCallbacks, 0);
  };
}

// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  var p = Promise.resolve();
  microTimerFunc = function () {
    p.then(flushCallbacks);
    // in problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) { setTimeout(noop); }
  };
} else {
  // fallback to macro
  microTimerFunc = macroTimerFunc;
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a (macro) task instead of a microtask.
 */
function withMacroTask (fn) {
  return fn._withTask || (fn._withTask = function () {
    useMacroTask = true;
    var res = fn.apply(null, arguments);
    useMacroTask = false;
    return res
  })
}

function nextTick (cb, ctx) {
  var _resolve;
  callbacks.push(function () {
    if (cb) {
      try {
        cb.call(ctx);
      } catch (e) {
        handleError(e, ctx, 'nextTick');
      }
    } else if (_resolve) {
      _resolve(ctx);
    }
  });
  if (!pending) {
    pending = true;
    if (useMacroTask) {
      macroTimerFunc();
    } else {
      microTimerFunc();
    }
  }
  // $flow-disable-line
  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(function (resolve) {
      _resolve = resolve;
    })
  }
}

/*  */

/* not type checking this file because flow doesn't play well with Proxy */

var initProxy;

if (false) {
  var allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,' +
    'require' // for Webpack/Browserify
  );

  var warnNonPresent = function (target, key) {
    warn(
      "Property or method \"" + key + "\" is not defined on the instance but " +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    );
  };

  var hasProxy =
    typeof Proxy !== 'undefined' && isNative(Proxy);

  if (hasProxy) {
    var isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact');
    config.keyCodes = new Proxy(config.keyCodes, {
      set: function set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(("Avoid overwriting built-in modifier in config.keyCodes: ." + key));
          return false
        } else {
          target[key] = value;
          return true
        }
      }
    });
  }

  var hasHandler = {
    has: function has (target, key) {
      var has = key in target;
      var isAllowed = allowedGlobals(key) || key.charAt(0) === '_';
      if (!has && !isAllowed) {
        warnNonPresent(target, key);
      }
      return has || !isAllowed
    }
  };

  var getHandler = {
    get: function get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        warnNonPresent(target, key);
      }
      return target[key]
    }
  };

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      // determine which proxy handler to use
      var options = vm.$options;
      var handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler;
      vm._renderProxy = new Proxy(vm, handlers);
    } else {
      vm._renderProxy = vm;
    }
  };
}

/*  */

var seenObjects = new _Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
function traverse (val) {
  _traverse(val, seenObjects);
  seenObjects.clear();
}

function _traverse (val, seen) {
  var i, keys;
  var isA = Array.isArray(val);
  if ((!isA && !isObject(val)) || Object.isFrozen(val) || val instanceof VNode) {
    return
  }
  if (val.__ob__) {
    var depId = val.__ob__.dep.id;
    if (seen.has(depId)) {
      return
    }
    seen.add(depId);
  }
  if (isA) {
    i = val.length;
    while (i--) { _traverse(val[i], seen); }
  } else {
    keys = Object.keys(val);
    i = keys.length;
    while (i--) { _traverse(val[keys[i]], seen); }
  }
}

var mark;
var measure;

if (false) {
  var perf = inBrowser && window.performance;
  /* istanbul ignore if */
  if (
    perf &&
    perf.mark &&
    perf.measure &&
    perf.clearMarks &&
    perf.clearMeasures
  ) {
    mark = function (tag) { return perf.mark(tag); };
    measure = function (name, startTag, endTag) {
      perf.measure(name, startTag, endTag);
      perf.clearMarks(startTag);
      perf.clearMarks(endTag);
      perf.clearMeasures(name);
    };
  }
}

/*  */

var normalizeEvent = cached(function (name) {
  var passive = name.charAt(0) === '&';
  name = passive ? name.slice(1) : name;
  var once$$1 = name.charAt(0) === '~'; // Prefixed last, checked first
  name = once$$1 ? name.slice(1) : name;
  var capture = name.charAt(0) === '!';
  name = capture ? name.slice(1) : name;
  return {
    name: name,
    once: once$$1,
    capture: capture,
    passive: passive
  }
});

function createFnInvoker (fns) {
  function invoker () {
    var arguments$1 = arguments;

    var fns = invoker.fns;
    if (Array.isArray(fns)) {
      var cloned = fns.slice();
      for (var i = 0; i < cloned.length; i++) {
        cloned[i].apply(null, arguments$1);
      }
    } else {
      // return handler return value for single handlers
      return fns.apply(null, arguments)
    }
  }
  invoker.fns = fns;
  return invoker
}

function updateListeners (
  on,
  oldOn,
  add,
  remove$$1,
  vm
) {
  var name, def, cur, old, event;
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (isUndef(cur)) {
      "production" !== 'production' && warn(
        "Invalid handler for event \"" + (event.name) + "\": got " + String(cur),
        vm
      );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur);
      }
      add(event.name, cur, event.once, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  for (name in oldOn) {
    if (isUndef(on[name])) {
      event = normalizeEvent(name);
      remove$$1(event.name, oldOn[name], event.capture);
    }
  }
}

/*  */

function mergeVNodeHook (def, hookKey, hook) {
  if (def instanceof VNode) {
    def = def.data.hook || (def.data.hook = {});
  }
  var invoker;
  var oldHook = def[hookKey];

  function wrappedHook () {
    hook.apply(this, arguments);
    // important: remove merged hook to ensure it's called only once
    // and prevent memory leak
    remove(invoker.fns, wrappedHook);
  }

  if (isUndef(oldHook)) {
    // no existing hook
    invoker = createFnInvoker([wrappedHook]);
  } else {
    /* istanbul ignore if */
    if (isDef(oldHook.fns) && isTrue(oldHook.merged)) {
      // already a merged invoker
      invoker = oldHook;
      invoker.fns.push(wrappedHook);
    } else {
      // existing plain hook
      invoker = createFnInvoker([oldHook, wrappedHook]);
    }
  }

  invoker.merged = true;
  def[hookKey] = invoker;
}

/*  */

function extractPropsFromVNodeData (
  data,
  Ctor,
  tag
) {
  // we are only extracting raw values here.
  // validation and default values are handled in the child
  // component itself.
  var propOptions = Ctor.options.props;
  if (isUndef(propOptions)) {
    return
  }
  var res = {};
  var attrs = data.attrs;
  var props = data.props;
  if (isDef(attrs) || isDef(props)) {
    for (var key in propOptions) {
      var altKey = hyphenate(key);
      if (false) {
        var keyInLowerCase = key.toLowerCase();
        if (
          key !== keyInLowerCase &&
          attrs && hasOwn(attrs, keyInLowerCase)
        ) {
          tip(
            "Prop \"" + keyInLowerCase + "\" is passed to component " +
            (formatComponentName(tag || Ctor)) + ", but the declared prop name is" +
            " \"" + key + "\". " +
            "Note that HTML attributes are case-insensitive and camelCased " +
            "props need to use their kebab-case equivalents when using in-DOM " +
            "templates. You should probably use \"" + altKey + "\" instead of \"" + key + "\"."
          );
        }
      }
      checkProp(res, props, key, altKey, true) ||
      checkProp(res, attrs, key, altKey, false);
    }
  }
  return res
}

function checkProp (
  res,
  hash,
  key,
  altKey,
  preserve
) {
  if (isDef(hash)) {
    if (hasOwn(hash, key)) {
      res[key] = hash[key];
      if (!preserve) {
        delete hash[key];
      }
      return true
    } else if (hasOwn(hash, altKey)) {
      res[key] = hash[altKey];
      if (!preserve) {
        delete hash[altKey];
      }
      return true
    }
  }
  return false
}

/*  */

// The template compiler attempts to minimize the need for normalization by
// statically analyzing the template at compile time.
//
// For plain HTML markup, normalization can be completely skipped because the
// generated render function is guaranteed to return Array<VNode>. There are
// two cases where extra normalization is needed:

// 1. When the children contains components - because a functional component
// may return an Array instead of a single root. In this case, just a simple
// normalization is needed - if any child is an Array, we flatten the whole
// thing with Array.prototype.concat. It is guaranteed to be only 1-level deep
// because functional components already normalize their own children.
function simpleNormalizeChildren (children) {
  for (var i = 0; i < children.length; i++) {
    if (Array.isArray(children[i])) {
      return Array.prototype.concat.apply([], children)
    }
  }
  return children
}

// 2. When the children contains constructs that always generated nested Arrays,
// e.g. <template>, <slot>, v-for, or when the children is provided by user
// with hand-written render functions / JSX. In such cases a full normalization
// is needed to cater to all possible types of children values.
function normalizeChildren (children) {
  return isPrimitive(children)
    ? [createTextVNode(children)]
    : Array.isArray(children)
      ? normalizeArrayChildren(children)
      : undefined
}

function isTextNode (node) {
  return isDef(node) && isDef(node.text) && isFalse(node.isComment)
}

function normalizeArrayChildren (children, nestedIndex) {
  var res = [];
  var i, c, lastIndex, last;
  for (i = 0; i < children.length; i++) {
    c = children[i];
    if (isUndef(c) || typeof c === 'boolean') { continue }
    lastIndex = res.length - 1;
    last = res[lastIndex];
    //  nested
    if (Array.isArray(c)) {
      if (c.length > 0) {
        c = normalizeArrayChildren(c, ((nestedIndex || '') + "_" + i));
        // merge adjacent text nodes
        if (isTextNode(c[0]) && isTextNode(last)) {
          res[lastIndex] = createTextVNode(last.text + (c[0]).text);
          c.shift();
        }
        res.push.apply(res, c);
      }
    } else if (isPrimitive(c)) {
      if (isTextNode(last)) {
        // merge adjacent text nodes
        // this is necessary for SSR hydration because text nodes are
        // essentially merged when rendered to HTML strings
        res[lastIndex] = createTextVNode(last.text + c);
      } else if (c !== '') {
        // convert primitive to vnode
        res.push(createTextVNode(c));
      }
    } else {
      if (isTextNode(c) && isTextNode(last)) {
        // merge adjacent text nodes
        res[lastIndex] = createTextVNode(last.text + c.text);
      } else {
        // default key for nested array children (likely generated by v-for)
        if (isTrue(children._isVList) &&
          isDef(c.tag) &&
          isUndef(c.key) &&
          isDef(nestedIndex)) {
          c.key = "__vlist" + nestedIndex + "_" + i + "__";
        }
        res.push(c);
      }
    }
  }
  return res
}

/*  */

function ensureCtor (comp, base) {
  if (
    comp.__esModule ||
    (hasSymbol && comp[Symbol.toStringTag] === 'Module')
  ) {
    comp = comp.default;
  }
  return isObject(comp)
    ? base.extend(comp)
    : comp
}

function createAsyncPlaceholder (
  factory,
  data,
  context,
  children,
  tag
) {
  var node = createEmptyVNode();
  node.asyncFactory = factory;
  node.asyncMeta = { data: data, context: context, children: children, tag: tag };
  return node
}

function resolveAsyncComponent (
  factory,
  baseCtor,
  context
) {
  if (isTrue(factory.error) && isDef(factory.errorComp)) {
    return factory.errorComp
  }

  if (isDef(factory.resolved)) {
    return factory.resolved
  }

  if (isTrue(factory.loading) && isDef(factory.loadingComp)) {
    return factory.loadingComp
  }

  if (isDef(factory.contexts)) {
    // already pending
    factory.contexts.push(context);
  } else {
    var contexts = factory.contexts = [context];
    var sync = true;

    var forceRender = function () {
      for (var i = 0, l = contexts.length; i < l; i++) {
        contexts[i].$forceUpdate();
      }
    };

    var resolve = once(function (res) {
      // cache resolved
      factory.resolved = ensureCtor(res, baseCtor);
      // invoke callbacks only if this is not a synchronous resolve
      // (async resolves are shimmed as synchronous during SSR)
      if (!sync) {
        forceRender();
      }
    });

    var reject = once(function (reason) {
      "production" !== 'production' && warn(
        "Failed to resolve async component: " + (String(factory)) +
        (reason ? ("\nReason: " + reason) : '')
      );
      if (isDef(factory.errorComp)) {
        factory.error = true;
        forceRender();
      }
    });

    var res = factory(resolve, reject);

    if (isObject(res)) {
      if (typeof res.then === 'function') {
        // () => Promise
        if (isUndef(factory.resolved)) {
          res.then(resolve, reject);
        }
      } else if (isDef(res.component) && typeof res.component.then === 'function') {
        res.component.then(resolve, reject);

        if (isDef(res.error)) {
          factory.errorComp = ensureCtor(res.error, baseCtor);
        }

        if (isDef(res.loading)) {
          factory.loadingComp = ensureCtor(res.loading, baseCtor);
          if (res.delay === 0) {
            factory.loading = true;
          } else {
            setTimeout(function () {
              if (isUndef(factory.resolved) && isUndef(factory.error)) {
                factory.loading = true;
                forceRender();
              }
            }, res.delay || 200);
          }
        }

        if (isDef(res.timeout)) {
          setTimeout(function () {
            if (isUndef(factory.resolved)) {
              reject(
                 false
                  ? ("timeout (" + (res.timeout) + "ms)")
                  : null
              );
            }
          }, res.timeout);
        }
      }
    }

    sync = false;
    // return in case resolved synchronously
    return factory.loading
      ? factory.loadingComp
      : factory.resolved
  }
}

/*  */

function isAsyncPlaceholder (node) {
  return node.isComment && node.asyncFactory
}

/*  */

function getFirstComponentChild (children) {
  if (Array.isArray(children)) {
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
        return c
      }
    }
  }
}

/*  */

/*  */

function initEvents (vm) {
  vm._events = Object.create(null);
  vm._hasHookEvent = false;
  // init parent attached events
  var listeners = vm.$options._parentListeners;
  if (listeners) {
    updateComponentListeners(vm, listeners);
  }
}

var target;

function add (event, fn, once) {
  if (once) {
    target.$once(event, fn);
  } else {
    target.$on(event, fn);
  }
}

function remove$1 (event, fn) {
  target.$off(event, fn);
}

function updateComponentListeners (
  vm,
  listeners,
  oldListeners
) {
  target = vm;
  updateListeners(listeners, oldListeners || {}, add, remove$1, vm);
  target = undefined;
}

function eventsMixin (Vue) {
  var hookRE = /^hook:/;
  Vue.prototype.$on = function (event, fn) {
    var this$1 = this;

    var vm = this;
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$on(event[i], fn);
      }
    } else {
      (vm._events[event] || (vm._events[event] = [])).push(fn);
      // optimize hook:event cost by using a boolean flag marked at registration
      // instead of a hash lookup
      if (hookRE.test(event)) {
        vm._hasHookEvent = true;
      }
    }
    return vm
  };

  Vue.prototype.$once = function (event, fn) {
    var vm = this;
    function on () {
      vm.$off(event, on);
      fn.apply(vm, arguments);
    }
    on.fn = fn;
    vm.$on(event, on);
    return vm
  };

  Vue.prototype.$off = function (event, fn) {
    var this$1 = this;

    var vm = this;
    // all
    if (!arguments.length) {
      vm._events = Object.create(null);
      return vm
    }
    // array of events
    if (Array.isArray(event)) {
      for (var i = 0, l = event.length; i < l; i++) {
        this$1.$off(event[i], fn);
      }
      return vm
    }
    // specific event
    var cbs = vm._events[event];
    if (!cbs) {
      return vm
    }
    if (!fn) {
      vm._events[event] = null;
      return vm
    }
    if (fn) {
      // specific handler
      var cb;
      var i$1 = cbs.length;
      while (i$1--) {
        cb = cbs[i$1];
        if (cb === fn || cb.fn === fn) {
          cbs.splice(i$1, 1);
          break
        }
      }
    }
    return vm
  };

  Vue.prototype.$emit = function (event) {
    var vm = this;
    if (false) {
      var lowerCaseEvent = event.toLowerCase();
      if (lowerCaseEvent !== event && vm._events[lowerCaseEvent]) {
        tip(
          "Event \"" + lowerCaseEvent + "\" is emitted in component " +
          (formatComponentName(vm)) + " but the handler is registered for \"" + event + "\". " +
          "Note that HTML attributes are case-insensitive and you cannot use " +
          "v-on to listen to camelCase events when using in-DOM templates. " +
          "You should probably use \"" + (hyphenate(event)) + "\" instead of \"" + event + "\"."
        );
      }
    }
    var cbs = vm._events[event];
    if (cbs) {
      cbs = cbs.length > 1 ? toArray(cbs) : cbs;
      var args = toArray(arguments, 1);
      for (var i = 0, l = cbs.length; i < l; i++) {
        try {
          cbs[i].apply(vm, args);
        } catch (e) {
          handleError(e, vm, ("event handler for \"" + event + "\""));
        }
      }
    }
    return vm
  };
}

/*  */



/**
 * Runtime helper for resolving raw children VNodes into a slot object.
 */
function resolveSlots (
  children,
  context
) {
  var slots = {};
  if (!children) {
    return slots
  }
  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    var data = child.data;
    // remove slot attribute if the node is resolved as a Vue slot node
    if (data && data.attrs && data.attrs.slot) {
      delete data.attrs.slot;
    }
    // named slots should only be respected if the vnode was rendered in the
    // same context.
    if ((child.context === context || child.fnContext === context) &&
      data && data.slot != null
    ) {
      var name = data.slot;
      var slot = (slots[name] || (slots[name] = []));
      if (child.tag === 'template') {
        slot.push.apply(slot, child.children || []);
      } else {
        slot.push(child);
      }
    } else {
      (slots.default || (slots.default = [])).push(child);
    }
  }
  // ignore slots that contains only whitespace
  for (var name$1 in slots) {
    if (slots[name$1].every(isWhitespace)) {
      delete slots[name$1];
    }
  }
  return slots
}

function isWhitespace (node) {
  return (node.isComment && !node.asyncFactory) || node.text === ' '
}

function resolveScopedSlots (
  fns, // see flow/vnode
  res
) {
  res = res || {};
  for (var i = 0; i < fns.length; i++) {
    if (Array.isArray(fns[i])) {
      resolveScopedSlots(fns[i], res);
    } else {
      res[fns[i].key] = fns[i].fn;
    }
  }
  return res
}

/*  */

var activeInstance = null;
var isUpdatingChildComponent = false;

function initLifecycle (vm) {
  var options = vm.$options;

  // locate first non-abstract parent
  var parent = options.parent;
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent;
    }
    parent.$children.push(vm);
  }

  vm.$parent = parent;
  vm.$root = parent ? parent.$root : vm;

  vm.$children = [];
  vm.$refs = {};

  vm._watcher = null;
  vm._inactive = null;
  vm._directInactive = false;
  vm._isMounted = false;
  vm._isDestroyed = false;
  vm._isBeingDestroyed = false;
}

function lifecycleMixin (Vue) {
  Vue.prototype._update = function (vnode, hydrating) {
    var vm = this;
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate');
    }
    var prevEl = vm.$el;
    var prevVnode = vm._vnode;
    var prevActiveInstance = activeInstance;
    activeInstance = vm;
    vm._vnode = vnode;
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      );
      // no need for the ref nodes after initial patch
      // this prevents keeping a detached DOM tree in memory (#5851)
      vm.$options._parentElm = vm.$options._refElm = null;
    } else {
      // updates
      vm.$el = vm.__patch__(prevVnode, vnode);
    }
    activeInstance = prevActiveInstance;
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null;
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm;
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el;
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  };

  Vue.prototype.$forceUpdate = function () {
    var vm = this;
    if (vm._watcher) {
      vm._watcher.update();
    }
  };

  Vue.prototype.$destroy = function () {
    var vm = this;
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy');
    vm._isBeingDestroyed = true;
    // remove self from parent
    var parent = vm.$parent;
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm);
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown();
    }
    var i = vm._watchers.length;
    while (i--) {
      vm._watchers[i].teardown();
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--;
    }
    // call the last hook...
    vm._isDestroyed = true;
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null);
    // fire destroyed hook
    callHook(vm, 'destroyed');
    // turn off all instance listeners.
    vm.$off();
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null;
    }
    // release circular reference (#6759)
    if (vm.$vnode) {
      vm.$vnode.parent = null;
    }
  };
}

function mountComponent (
  vm,
  el,
  hydrating
) {
  vm.$el = el;
  if (!vm.$options.render) {
    vm.$options.render = createEmptyVNode;
    if (false) {
      /* istanbul ignore if */
      if ((vm.$options.template && vm.$options.template.charAt(0) !== '#') ||
        vm.$options.el || el) {
        warn(
          'You are using the runtime-only build of Vue where the template ' +
          'compiler is not available. Either pre-compile the templates into ' +
          'render functions, or use the compiler-included build.',
          vm
        );
      } else {
        warn(
          'Failed to mount component: template or render function not defined.',
          vm
        );
      }
    }
  }
  callHook(vm, 'beforeMount');

  var updateComponent;
  /* istanbul ignore if */
  if (false) {
    updateComponent = function () {
      var name = vm._name;
      var id = vm._uid;
      var startTag = "vue-perf-start:" + id;
      var endTag = "vue-perf-end:" + id;

      mark(startTag);
      var vnode = vm._render();
      mark(endTag);
      measure(("vue " + name + " render"), startTag, endTag);

      mark(startTag);
      vm._update(vnode, hydrating);
      mark(endTag);
      measure(("vue " + name + " patch"), startTag, endTag);
    };
  } else {
    updateComponent = function () {
      vm._update(vm._render(), hydrating);
    };
  }

  // we set this to vm._watcher inside the watcher's constructor
  // since the watcher's initial patch may call $forceUpdate (e.g. inside child
  // component's mounted hook), which relies on vm._watcher being already defined
  new Watcher(vm, updateComponent, noop, null, true /* isRenderWatcher */);
  hydrating = false;

  // manually mounted instance, call mounted on self
  // mounted is called for render-created child components in its inserted hook
  if (vm.$vnode == null) {
    vm._isMounted = true;
    callHook(vm, 'mounted');
  }
  return vm
}

function updateChildComponent (
  vm,
  propsData,
  listeners,
  parentVnode,
  renderChildren
) {
  if (false) {
    isUpdatingChildComponent = true;
  }

  // determine whether component has slot children
  // we need to do this before overwriting $options._renderChildren
  var hasChildren = !!(
    renderChildren ||               // has new static slots
    vm.$options._renderChildren ||  // has old static slots
    parentVnode.data.scopedSlots || // has new scoped slots
    vm.$scopedSlots !== emptyObject // has old scoped slots
  );

  vm.$options._parentVnode = parentVnode;
  vm.$vnode = parentVnode; // update vm's placeholder node without re-render

  if (vm._vnode) { // update child tree's parent
    vm._vnode.parent = parentVnode;
  }
  vm.$options._renderChildren = renderChildren;

  // update $attrs and $listeners hash
  // these are also reactive so they may trigger child update if the child
  // used them during render
  vm.$attrs = parentVnode.data.attrs || emptyObject;
  vm.$listeners = listeners || emptyObject;

  // update props
  if (propsData && vm.$options.props) {
    toggleObserving(false);
    var props = vm._props;
    var propKeys = vm.$options._propKeys || [];
    for (var i = 0; i < propKeys.length; i++) {
      var key = propKeys[i];
      var propOptions = vm.$options.props; // wtf flow?
      props[key] = validateProp(key, propOptions, propsData, vm);
    }
    toggleObserving(true);
    // keep a copy of raw propsData
    vm.$options.propsData = propsData;
  }

  // update listeners
  listeners = listeners || emptyObject;
  var oldListeners = vm.$options._parentListeners;
  vm.$options._parentListeners = listeners;
  updateComponentListeners(vm, listeners, oldListeners);

  // resolve slots + force update if has children
  if (hasChildren) {
    vm.$slots = resolveSlots(renderChildren, parentVnode.context);
    vm.$forceUpdate();
  }

  if (false) {
    isUpdatingChildComponent = false;
  }
}

function isInInactiveTree (vm) {
  while (vm && (vm = vm.$parent)) {
    if (vm._inactive) { return true }
  }
  return false
}

function activateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = false;
    if (isInInactiveTree(vm)) {
      return
    }
  } else if (vm._directInactive) {
    return
  }
  if (vm._inactive || vm._inactive === null) {
    vm._inactive = false;
    for (var i = 0; i < vm.$children.length; i++) {
      activateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'activated');
  }
}

function deactivateChildComponent (vm, direct) {
  if (direct) {
    vm._directInactive = true;
    if (isInInactiveTree(vm)) {
      return
    }
  }
  if (!vm._inactive) {
    vm._inactive = true;
    for (var i = 0; i < vm.$children.length; i++) {
      deactivateChildComponent(vm.$children[i]);
    }
    callHook(vm, 'deactivated');
  }
}

function callHook (vm, hook) {
  // #7573 disable dep collection when invoking lifecycle hooks
  pushTarget();
  var handlers = vm.$options[hook];
  if (handlers) {
    for (var i = 0, j = handlers.length; i < j; i++) {
      try {
        handlers[i].call(vm);
      } catch (e) {
        handleError(e, vm, (hook + " hook"));
      }
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook);
  }
  popTarget();
}

/*  */


var MAX_UPDATE_COUNT = 100;

var queue = [];
var activatedChildren = [];
var has = {};
var circular = {};
var waiting = false;
var flushing = false;
var index = 0;

/**
 * Reset the scheduler's state.
 */
function resetSchedulerState () {
  index = queue.length = activatedChildren.length = 0;
  has = {};
  if (false) {
    circular = {};
  }
  waiting = flushing = false;
}

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  flushing = true;
  var watcher, id;

  // Sort queue before flush.
  // This ensures that:
  // 1. Components are updated from parent to child. (because parent is always
  //    created before the child)
  // 2. A component's user watchers are run before its render watcher (because
  //    user watchers are created before the render watcher)
  // 3. If a component is destroyed during a parent component's watcher run,
  //    its watchers can be skipped.
  queue.sort(function (a, b) { return a.id - b.id; });

  // do not cache length because more watchers might be pushed
  // as we run existing watchers
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index];
    id = watcher.id;
    has[id] = null;
    watcher.run();
    // in dev build, check and stop circular updates.
    if (false) {
      circular[id] = (circular[id] || 0) + 1;
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? ("in watcher with expression \"" + (watcher.expression) + "\"")
              : "in a component render function."
          ),
          watcher.vm
        );
        break
      }
    }
  }

  // keep copies of post queues before resetting state
  var activatedQueue = activatedChildren.slice();
  var updatedQueue = queue.slice();

  resetSchedulerState();

  // call component updated and activated hooks
  callActivatedHooks(activatedQueue);
  callUpdatedHooks(updatedQueue);

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush');
  }
}

function callUpdatedHooks (queue) {
  var i = queue.length;
  while (i--) {
    var watcher = queue[i];
    var vm = watcher.vm;
    if (vm._watcher === watcher && vm._isMounted) {
      callHook(vm, 'updated');
    }
  }
}

/**
 * Queue a kept-alive component that was activated during patch.
 * The queue will be processed after the entire tree has been patched.
 */
function queueActivatedComponent (vm) {
  // setting _inactive to false here so that a render function can
  // rely on checking whether it's in an inactive tree (e.g. router-view)
  vm._inactive = false;
  activatedChildren.push(vm);
}

function callActivatedHooks (queue) {
  for (var i = 0; i < queue.length; i++) {
    queue[i]._inactive = true;
    activateChildComponent(queue[i], true /* true */);
  }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 */
function queueWatcher (watcher) {
  var id = watcher.id;
  if (has[id] == null) {
    has[id] = true;
    if (!flushing) {
      queue.push(watcher);
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      var i = queue.length - 1;
      while (i > index && queue[i].id > watcher.id) {
        i--;
      }
      queue.splice(i + 1, 0, watcher);
    }
    // queue the flush
    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  }
}

/*  */

var uid$1 = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
var Watcher = function Watcher (
  vm,
  expOrFn,
  cb,
  options,
  isRenderWatcher
) {
  this.vm = vm;
  if (isRenderWatcher) {
    vm._watcher = this;
  }
  vm._watchers.push(this);
  // options
  if (options) {
    this.deep = !!options.deep;
    this.user = !!options.user;
    this.lazy = !!options.lazy;
    this.sync = !!options.sync;
  } else {
    this.deep = this.user = this.lazy = this.sync = false;
  }
  this.cb = cb;
  this.id = ++uid$1; // uid for batching
  this.active = true;
  this.dirty = this.lazy; // for lazy watchers
  this.deps = [];
  this.newDeps = [];
  this.depIds = new _Set();
  this.newDepIds = new _Set();
  this.expression =  false
    ? expOrFn.toString()
    : '';
  // parse expression for getter
  if (typeof expOrFn === 'function') {
    this.getter = expOrFn;
  } else {
    this.getter = parsePath(expOrFn);
    if (!this.getter) {
      this.getter = function () {};
      "production" !== 'production' && warn(
        "Failed watching path: \"" + expOrFn + "\" " +
        'Watcher only accepts simple dot-delimited paths. ' +
        'For full control, use a function instead.',
        vm
      );
    }
  }
  this.value = this.lazy
    ? undefined
    : this.get();
};

/**
 * Evaluate the getter, and re-collect dependencies.
 */
Watcher.prototype.get = function get () {
  pushTarget(this);
  var value;
  var vm = this.vm;
  try {
    value = this.getter.call(vm, vm);
  } catch (e) {
    if (this.user) {
      handleError(e, vm, ("getter for watcher \"" + (this.expression) + "\""));
    } else {
      throw e
    }
  } finally {
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
  }
  return value
};

/**
 * Add a dependency to this directive.
 */
Watcher.prototype.addDep = function addDep (dep) {
  var id = dep.id;
  if (!this.newDepIds.has(id)) {
    this.newDepIds.add(id);
    this.newDeps.push(dep);
    if (!this.depIds.has(id)) {
      dep.addSub(this);
    }
  }
};

/**
 * Clean up for dependency collection.
 */
Watcher.prototype.cleanupDeps = function cleanupDeps () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    var dep = this$1.deps[i];
    if (!this$1.newDepIds.has(dep.id)) {
      dep.removeSub(this$1);
    }
  }
  var tmp = this.depIds;
  this.depIds = this.newDepIds;
  this.newDepIds = tmp;
  this.newDepIds.clear();
  tmp = this.deps;
  this.deps = this.newDeps;
  this.newDeps = tmp;
  this.newDeps.length = 0;
};

/**
 * Subscriber interface.
 * Will be called when a dependency changes.
 */
Watcher.prototype.update = function update () {
  /* istanbul ignore else */
  if (this.lazy) {
    this.dirty = true;
  } else if (this.sync) {
    this.run();
  } else {
    queueWatcher(this);
  }
};

/**
 * Scheduler job interface.
 * Will be called by the scheduler.
 */
Watcher.prototype.run = function run () {
  if (this.active) {
    var value = this.get();
    if (
      value !== this.value ||
      // Deep watchers and watchers on Object/Arrays should fire even
      // when the value is the same, because the value may
      // have mutated.
      isObject(value) ||
      this.deep
    ) {
      // set new value
      var oldValue = this.value;
      this.value = value;
      if (this.user) {
        try {
          this.cb.call(this.vm, value, oldValue);
        } catch (e) {
          handleError(e, this.vm, ("callback for watcher \"" + (this.expression) + "\""));
        }
      } else {
        this.cb.call(this.vm, value, oldValue);
      }
    }
  }
};

/**
 * Evaluate the value of the watcher.
 * This only gets called for lazy watchers.
 */
Watcher.prototype.evaluate = function evaluate () {
  this.value = this.get();
  this.dirty = false;
};

/**
 * Depend on all deps collected by this watcher.
 */
Watcher.prototype.depend = function depend () {
    var this$1 = this;

  var i = this.deps.length;
  while (i--) {
    this$1.deps[i].depend();
  }
};

/**
 * Remove self from all dependencies' subscriber list.
 */
Watcher.prototype.teardown = function teardown () {
    var this$1 = this;

  if (this.active) {
    // remove self from vm's watcher list
    // this is a somewhat expensive operation so we skip it
    // if the vm is being destroyed.
    if (!this.vm._isBeingDestroyed) {
      remove(this.vm._watchers, this);
    }
    var i = this.deps.length;
    while (i--) {
      this$1.deps[i].removeSub(this$1);
    }
    this.active = false;
  }
};

/*  */

var sharedPropertyDefinition = {
  enumerable: true,
  configurable: true,
  get: noop,
  set: noop
};

function proxy (target, sourceKey, key) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  };
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val;
  };
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function initState (vm) {
  vm._watchers = [];
  var opts = vm.$options;
  if (opts.props) { initProps(vm, opts.props); }
  if (opts.methods) { initMethods(vm, opts.methods); }
  if (opts.data) {
    initData(vm);
  } else {
    observe(vm._data = {}, true /* asRootData */);
  }
  if (opts.computed) { initComputed(vm, opts.computed); }
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch);
  }
}

function initProps (vm, propsOptions) {
  var propsData = vm.$options.propsData || {};
  var props = vm._props = {};
  // cache prop keys so that future props updates can iterate using Array
  // instead of dynamic object key enumeration.
  var keys = vm.$options._propKeys = [];
  var isRoot = !vm.$parent;
  // root instance props should be converted
  if (!isRoot) {
    toggleObserving(false);
  }
  var loop = function ( key ) {
    keys.push(key);
    var value = validateProp(key, propsOptions, propsData, vm);
    /* istanbul ignore else */
    if (false) {
      var hyphenatedKey = hyphenate(key);
      if (isReservedAttribute(hyphenatedKey) ||
          config.isReservedAttr(hyphenatedKey)) {
        warn(
          ("\"" + hyphenatedKey + "\" is a reserved attribute and cannot be used as component prop."),
          vm
        );
      }
      defineReactive(props, key, value, function () {
        if (vm.$parent && !isUpdatingChildComponent) {
          warn(
            "Avoid mutating a prop directly since the value will be " +
            "overwritten whenever the parent component re-renders. " +
            "Instead, use a data or computed property based on the prop's " +
            "value. Prop being mutated: \"" + key + "\"",
            vm
          );
        }
      });
    } else {
      defineReactive(props, key, value);
    }
    // static props are already proxied on the component's prototype
    // during Vue.extend(). We only need to proxy props defined at
    // instantiation here.
    if (!(key in vm)) {
      proxy(vm, "_props", key);
    }
  };

  for (var key in propsOptions) loop( key );
  toggleObserving(true);
}

function initData (vm) {
  var data = vm.$options.data;
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {};
  if (!isPlainObject(data)) {
    data = {};
    "production" !== 'production' && warn(
      'data functions should return an object:\n' +
      'https://vuejs.org/v2/guide/components.html#data-Must-Be-a-Function',
      vm
    );
  }
  // proxy data on instance
  var keys = Object.keys(data);
  var props = vm.$options.props;
  var methods = vm.$options.methods;
  var i = keys.length;
  while (i--) {
    var key = keys[i];
    if (false) {
      if (methods && hasOwn(methods, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a data property."),
          vm
        );
      }
    }
    if (props && hasOwn(props, key)) {
      "production" !== 'production' && warn(
        "The data property \"" + key + "\" is already declared as a prop. " +
        "Use prop default value instead.",
        vm
      );
    } else if (!isReserved(key)) {
      proxy(vm, "_data", key);
    }
  }
  // observe data
  observe(data, true /* asRootData */);
}

function getData (data, vm) {
  // #7573 disable dep collection when invoking data getters
  pushTarget();
  try {
    return data.call(vm, vm)
  } catch (e) {
    handleError(e, vm, "data()");
    return {}
  } finally {
    popTarget();
  }
}

var computedWatcherOptions = { lazy: true };

function initComputed (vm, computed) {
  // $flow-disable-line
  var watchers = vm._computedWatchers = Object.create(null);
  // computed properties are just getters during SSR
  var isSSR = isServerRendering();

  for (var key in computed) {
    var userDef = computed[key];
    var getter = typeof userDef === 'function' ? userDef : userDef.get;
    if (false) {
      warn(
        ("Getter is missing for computed property \"" + key + "\"."),
        vm
      );
    }

    if (!isSSR) {
      // create internal watcher for the computed property.
      watchers[key] = new Watcher(
        vm,
        getter || noop,
        noop,
        computedWatcherOptions
      );
    }

    // component-defined computed properties are already defined on the
    // component prototype. We only need to define computed properties defined
    // at instantiation here.
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else if (false) {
      if (key in vm.$data) {
        warn(("The computed property \"" + key + "\" is already defined in data."), vm);
      } else if (vm.$options.props && key in vm.$options.props) {
        warn(("The computed property \"" + key + "\" is already defined as a prop."), vm);
      }
    }
  }
}

function defineComputed (
  target,
  key,
  userDef
) {
  var shouldCache = !isServerRendering();
  if (typeof userDef === 'function') {
    sharedPropertyDefinition.get = shouldCache
      ? createComputedGetter(key)
      : userDef;
    sharedPropertyDefinition.set = noop;
  } else {
    sharedPropertyDefinition.get = userDef.get
      ? shouldCache && userDef.cache !== false
        ? createComputedGetter(key)
        : userDef.get
      : noop;
    sharedPropertyDefinition.set = userDef.set
      ? userDef.set
      : noop;
  }
  if (false) {
    sharedPropertyDefinition.set = function () {
      warn(
        ("Computed property \"" + key + "\" was assigned to but it has no setter."),
        this
      );
    };
  }
  Object.defineProperty(target, key, sharedPropertyDefinition);
}

function createComputedGetter (key) {
  return function computedGetter () {
    var watcher = this._computedWatchers && this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value
    }
  }
}

function initMethods (vm, methods) {
  var props = vm.$options.props;
  for (var key in methods) {
    if (false) {
      if (methods[key] == null) {
        warn(
          "Method \"" + key + "\" has an undefined value in the component definition. " +
          "Did you reference the function correctly?",
          vm
        );
      }
      if (props && hasOwn(props, key)) {
        warn(
          ("Method \"" + key + "\" has already been defined as a prop."),
          vm
        );
      }
      if ((key in vm) && isReserved(key)) {
        warn(
          "Method \"" + key + "\" conflicts with an existing Vue instance method. " +
          "Avoid defining component methods that start with _ or $."
        );
      }
    }
    vm[key] = methods[key] == null ? noop : bind(methods[key], vm);
  }
}

function initWatch (vm, watch) {
  for (var key in watch) {
    var handler = watch[key];
    if (Array.isArray(handler)) {
      for (var i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}

function createWatcher (
  vm,
  expOrFn,
  handler,
  options
) {
  if (isPlainObject(handler)) {
    options = handler;
    handler = handler.handler;
  }
  if (typeof handler === 'string') {
    handler = vm[handler];
  }
  return vm.$watch(expOrFn, handler, options)
}

function stateMixin (Vue) {
  // flow somehow has problems with directly declared definition object
  // when using Object.defineProperty, so we have to procedurally build up
  // the object here.
  var dataDef = {};
  dataDef.get = function () { return this._data };
  var propsDef = {};
  propsDef.get = function () { return this._props };
  if (false) {
    dataDef.set = function (newData) {
      warn(
        'Avoid replacing instance root $data. ' +
        'Use nested data properties instead.',
        this
      );
    };
    propsDef.set = function () {
      warn("$props is readonly.", this);
    };
  }
  Object.defineProperty(Vue.prototype, '$data', dataDef);
  Object.defineProperty(Vue.prototype, '$props', propsDef);

  Vue.prototype.$set = set;
  Vue.prototype.$delete = del;

  Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    if (isPlainObject(cb)) {
      return createWatcher(vm, expOrFn, cb, options)
    }
    options = options || {};
    options.user = true;
    var watcher = new Watcher(vm, expOrFn, cb, options);
    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };
}

/*  */

function initProvide (vm) {
  var provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === 'function'
      ? provide.call(vm)
      : provide;
  }
}

function initInjections (vm) {
  var result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false);
    Object.keys(result).forEach(function (key) {
      /* istanbul ignore else */
      if (false) {
        defineReactive(vm, key, result[key], function () {
          warn(
            "Avoid mutating an injected value directly since the changes will be " +
            "overwritten whenever the provided component re-renders. " +
            "injection being mutated: \"" + key + "\"",
            vm
          );
        });
      } else {
        defineReactive(vm, key, result[key]);
      }
    });
    toggleObserving(true);
  }
}

function resolveInject (inject, vm) {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    var result = Object.create(null);
    var keys = hasSymbol
      ? Reflect.ownKeys(inject).filter(function (key) {
        /* istanbul ignore next */
        return Object.getOwnPropertyDescriptor(inject, key).enumerable
      })
      : Object.keys(inject);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var provideKey = inject[key].from;
      var source = vm;
      while (source) {
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break
        }
        source = source.$parent;
      }
      if (!source) {
        if ('default' in inject[key]) {
          var provideDefault = inject[key].default;
          result[key] = typeof provideDefault === 'function'
            ? provideDefault.call(vm)
            : provideDefault;
        } else if (false) {
          warn(("Injection \"" + key + "\" not found"), vm);
        }
      }
    }
    return result
  }
}

/*  */

/**
 * Runtime helper for rendering v-for lists.
 */
function renderList (
  val,
  render
) {
  var ret, i, l, keys, key;
  if (Array.isArray(val) || typeof val === 'string') {
    ret = new Array(val.length);
    for (i = 0, l = val.length; i < l; i++) {
      ret[i] = render(val[i], i);
    }
  } else if (typeof val === 'number') {
    ret = new Array(val);
    for (i = 0; i < val; i++) {
      ret[i] = render(i + 1, i);
    }
  } else if (isObject(val)) {
    keys = Object.keys(val);
    ret = new Array(keys.length);
    for (i = 0, l = keys.length; i < l; i++) {
      key = keys[i];
      ret[i] = render(val[key], key, i);
    }
  }
  if (isDef(ret)) {
    (ret)._isVList = true;
  }
  return ret
}

/*  */

/**
 * Runtime helper for rendering <slot>
 */
function renderSlot (
  name,
  fallback,
  props,
  bindObject
) {
  var scopedSlotFn = this.$scopedSlots[name];
  var nodes;
  if (scopedSlotFn) { // scoped slot
    props = props || {};
    if (bindObject) {
      if (false) {
        warn(
          'slot v-bind without argument expects an Object',
          this
        );
      }
      props = extend(extend({}, bindObject), props);
    }
    nodes = scopedSlotFn(props) || fallback;
  } else {
    var slotNodes = this.$slots[name];
    // warn duplicate slot usage
    if (slotNodes) {
      if (false) {
        warn(
          "Duplicate presence of slot \"" + name + "\" found in the same render tree " +
          "- this will likely cause render errors.",
          this
        );
      }
      slotNodes._rendered = true;
    }
    nodes = slotNodes || fallback;
  }

  var target = props && props.slot;
  if (target) {
    return this.$createElement('template', { slot: target }, nodes)
  } else {
    return nodes
  }
}

/*  */

/**
 * Runtime helper for resolving filters
 */
function resolveFilter (id) {
  return resolveAsset(this.$options, 'filters', id, true) || identity
}

/*  */

function isKeyNotMatch (expect, actual) {
  if (Array.isArray(expect)) {
    return expect.indexOf(actual) === -1
  } else {
    return expect !== actual
  }
}

/**
 * Runtime helper for checking keyCodes from config.
 * exposed as Vue.prototype._k
 * passing in eventKeyName as last argument separately for backwards compat
 */
function checkKeyCodes (
  eventKeyCode,
  key,
  builtInKeyCode,
  eventKeyName,
  builtInKeyName
) {
  var mappedKeyCode = config.keyCodes[key] || builtInKeyCode;
  if (builtInKeyName && eventKeyName && !config.keyCodes[key]) {
    return isKeyNotMatch(builtInKeyName, eventKeyName)
  } else if (mappedKeyCode) {
    return isKeyNotMatch(mappedKeyCode, eventKeyCode)
  } else if (eventKeyName) {
    return hyphenate(eventKeyName) !== key
  }
}

/*  */

/**
 * Runtime helper for merging v-bind="object" into a VNode's data.
 */
function bindObjectProps (
  data,
  tag,
  value,
  asProp,
  isSync
) {
  if (value) {
    if (!isObject(value)) {
      "production" !== 'production' && warn(
        'v-bind without argument expects an Object or Array value',
        this
      );
    } else {
      if (Array.isArray(value)) {
        value = toObject(value);
      }
      var hash;
      var loop = function ( key ) {
        if (
          key === 'class' ||
          key === 'style' ||
          isReservedAttribute(key)
        ) {
          hash = data;
        } else {
          var type = data.attrs && data.attrs.type;
          hash = asProp || config.mustUseProp(tag, type, key)
            ? data.domProps || (data.domProps = {})
            : data.attrs || (data.attrs = {});
        }
        if (!(key in hash)) {
          hash[key] = value[key];

          if (isSync) {
            var on = data.on || (data.on = {});
            on[("update:" + key)] = function ($event) {
              value[key] = $event;
            };
          }
        }
      };

      for (var key in value) loop( key );
    }
  }
  return data
}

/*  */

/**
 * Runtime helper for rendering static trees.
 */
function renderStatic (
  index,
  isInFor
) {
  var cached = this._staticTrees || (this._staticTrees = []);
  var tree = cached[index];
  // if has already-rendered static tree and not inside v-for,
  // we can reuse the same tree.
  if (tree && !isInFor) {
    return tree
  }
  // otherwise, render a fresh tree.
  tree = cached[index] = this.$options.staticRenderFns[index].call(
    this._renderProxy,
    null,
    this // for render fns generated for functional component templates
  );
  markStatic(tree, ("__static__" + index), false);
  return tree
}

/**
 * Runtime helper for v-once.
 * Effectively it means marking the node as static with a unique key.
 */
function markOnce (
  tree,
  index,
  key
) {
  markStatic(tree, ("__once__" + index + (key ? ("_" + key) : "")), true);
  return tree
}

function markStatic (
  tree,
  key,
  isOnce
) {
  if (Array.isArray(tree)) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i] && typeof tree[i] !== 'string') {
        markStaticNode(tree[i], (key + "_" + i), isOnce);
      }
    }
  } else {
    markStaticNode(tree, key, isOnce);
  }
}

function markStaticNode (node, key, isOnce) {
  node.isStatic = true;
  node.key = key;
  node.isOnce = isOnce;
}

/*  */

function bindObjectListeners (data, value) {
  if (value) {
    if (!isPlainObject(value)) {
      "production" !== 'production' && warn(
        'v-on without argument expects an Object value',
        this
      );
    } else {
      var on = data.on = data.on ? extend({}, data.on) : {};
      for (var key in value) {
        var existing = on[key];
        var ours = value[key];
        on[key] = existing ? [].concat(existing, ours) : ours;
      }
    }
  }
  return data
}

/*  */

function installRenderHelpers (target) {
  target._o = markOnce;
  target._n = toNumber;
  target._s = toString;
  target._l = renderList;
  target._t = renderSlot;
  target._q = looseEqual;
  target._i = looseIndexOf;
  target._m = renderStatic;
  target._f = resolveFilter;
  target._k = checkKeyCodes;
  target._b = bindObjectProps;
  target._v = createTextVNode;
  target._e = createEmptyVNode;
  target._u = resolveScopedSlots;
  target._g = bindObjectListeners;
}

/*  */

function FunctionalRenderContext (
  data,
  props,
  children,
  parent,
  Ctor
) {
  var options = Ctor.options;
  // ensure the createElement function in functional components
  // gets a unique context - this is necessary for correct named slot check
  var contextVm;
  if (hasOwn(parent, '_uid')) {
    contextVm = Object.create(parent);
    // $flow-disable-line
    contextVm._original = parent;
  } else {
    // the context vm passed in is a functional context as well.
    // in this case we want to make sure we are able to get a hold to the
    // real context instance.
    contextVm = parent;
    // $flow-disable-line
    parent = parent._original;
  }
  var isCompiled = isTrue(options._compiled);
  var needNormalization = !isCompiled;

  this.data = data;
  this.props = props;
  this.children = children;
  this.parent = parent;
  this.listeners = data.on || emptyObject;
  this.injections = resolveInject(options.inject, parent);
  this.slots = function () { return resolveSlots(children, parent); };

  // support for compiled functional template
  if (isCompiled) {
    // exposing $options for renderStatic()
    this.$options = options;
    // pre-resolve slots for renderSlot()
    this.$slots = this.slots();
    this.$scopedSlots = data.scopedSlots || emptyObject;
  }

  if (options._scopeId) {
    this._c = function (a, b, c, d) {
      var vnode = createElement(contextVm, a, b, c, d, needNormalization);
      if (vnode && !Array.isArray(vnode)) {
        vnode.fnScopeId = options._scopeId;
        vnode.fnContext = parent;
      }
      return vnode
    };
  } else {
    this._c = function (a, b, c, d) { return createElement(contextVm, a, b, c, d, needNormalization); };
  }
}

installRenderHelpers(FunctionalRenderContext.prototype);

function createFunctionalComponent (
  Ctor,
  propsData,
  data,
  contextVm,
  children
) {
  var options = Ctor.options;
  var props = {};
  var propOptions = options.props;
  if (isDef(propOptions)) {
    for (var key in propOptions) {
      props[key] = validateProp(key, propOptions, propsData || emptyObject);
    }
  } else {
    if (isDef(data.attrs)) { mergeProps(props, data.attrs); }
    if (isDef(data.props)) { mergeProps(props, data.props); }
  }

  var renderContext = new FunctionalRenderContext(
    data,
    props,
    children,
    contextVm,
    Ctor
  );

  var vnode = options.render.call(null, renderContext._c, renderContext);

  if (vnode instanceof VNode) {
    return cloneAndMarkFunctionalResult(vnode, data, renderContext.parent, options)
  } else if (Array.isArray(vnode)) {
    var vnodes = normalizeChildren(vnode) || [];
    var res = new Array(vnodes.length);
    for (var i = 0; i < vnodes.length; i++) {
      res[i] = cloneAndMarkFunctionalResult(vnodes[i], data, renderContext.parent, options);
    }
    return res
  }
}

function cloneAndMarkFunctionalResult (vnode, data, contextVm, options) {
  // #7817 clone node before setting fnContext, otherwise if the node is reused
  // (e.g. it was from a cached normal slot) the fnContext causes named slots
  // that should not be matched to match.
  var clone = cloneVNode(vnode);
  clone.fnContext = contextVm;
  clone.fnOptions = options;
  if (data.slot) {
    (clone.data || (clone.data = {})).slot = data.slot;
  }
  return clone
}

function mergeProps (to, from) {
  for (var key in from) {
    to[camelize(key)] = from[key];
  }
}

/*  */




// Register the component hook to weex native render engine.
// The hook will be triggered by native, not javascript.


// Updates the state of the component to weex native render engine.

/*  */

// https://github.com/Hanks10100/weex-native-directive/tree/master/component

// listening on native callback

/*  */

/*  */

// inline hooks to be invoked on component VNodes during patch
var componentVNodeHooks = {
  init: function init (
    vnode,
    hydrating,
    parentElm,
    refElm
  ) {
    if (
      vnode.componentInstance &&
      !vnode.componentInstance._isDestroyed &&
      vnode.data.keepAlive
    ) {
      // kept-alive components, treat as a patch
      var mountedNode = vnode; // work around flow
      componentVNodeHooks.prepatch(mountedNode, mountedNode);
    } else {
      var child = vnode.componentInstance = createComponentInstanceForVnode(
        vnode,
        activeInstance,
        parentElm,
        refElm
      );
      child.$mount(hydrating ? vnode.elm : undefined, hydrating);
    }
  },

  prepatch: function prepatch (oldVnode, vnode) {
    var options = vnode.componentOptions;
    var child = vnode.componentInstance = oldVnode.componentInstance;
    updateChildComponent(
      child,
      options.propsData, // updated props
      options.listeners, // updated listeners
      vnode, // new parent vnode
      options.children // new children
    );
  },

  insert: function insert (vnode) {
    var context = vnode.context;
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isMounted) {
      componentInstance._isMounted = true;
      callHook(componentInstance, 'mounted');
    }
    if (vnode.data.keepAlive) {
      if (context._isMounted) {
        // vue-router#1212
        // During updates, a kept-alive component's child components may
        // change, so directly walking the tree here may call activated hooks
        // on incorrect children. Instead we push them into a queue which will
        // be processed after the whole patch process ended.
        queueActivatedComponent(componentInstance);
      } else {
        activateChildComponent(componentInstance, true /* direct */);
      }
    }
  },

  destroy: function destroy (vnode) {
    var componentInstance = vnode.componentInstance;
    if (!componentInstance._isDestroyed) {
      if (!vnode.data.keepAlive) {
        componentInstance.$destroy();
      } else {
        deactivateChildComponent(componentInstance, true /* direct */);
      }
    }
  }
};

var hooksToMerge = Object.keys(componentVNodeHooks);

function createComponent (
  Ctor,
  data,
  context,
  children,
  tag
) {
  if (isUndef(Ctor)) {
    return
  }

  var baseCtor = context.$options._base;

  // plain options object: turn it into a constructor
  if (isObject(Ctor)) {
    Ctor = baseCtor.extend(Ctor);
  }

  // if at this stage it's not a constructor or an async component factory,
  // reject.
  if (typeof Ctor !== 'function') {
    if (false) {
      warn(("Invalid Component definition: " + (String(Ctor))), context);
    }
    return
  }

  // async component
  var asyncFactory;
  if (isUndef(Ctor.cid)) {
    asyncFactory = Ctor;
    Ctor = resolveAsyncComponent(asyncFactory, baseCtor, context);
    if (Ctor === undefined) {
      // return a placeholder node for async component, which is rendered
      // as a comment node but preserves all the raw information for the node.
      // the information will be used for async server-rendering and hydration.
      return createAsyncPlaceholder(
        asyncFactory,
        data,
        context,
        children,
        tag
      )
    }
  }

  data = data || {};

  // resolve constructor options in case global mixins are applied after
  // component constructor creation
  resolveConstructorOptions(Ctor);

  // transform component v-model data into props & events
  if (isDef(data.model)) {
    transformModel(Ctor.options, data);
  }

  // extract props
  var propsData = extractPropsFromVNodeData(data, Ctor, tag);

  // functional component
  if (isTrue(Ctor.options.functional)) {
    return createFunctionalComponent(Ctor, propsData, data, context, children)
  }

  // extract listeners, since these needs to be treated as
  // child component listeners instead of DOM listeners
  var listeners = data.on;
  // replace with listeners with .native modifier
  // so it gets processed during parent component patch.
  data.on = data.nativeOn;

  if (isTrue(Ctor.options.abstract)) {
    // abstract components do not keep anything
    // other than props & listeners & slot

    // work around flow
    var slot = data.slot;
    data = {};
    if (slot) {
      data.slot = slot;
    }
  }

  // install component management hooks onto the placeholder node
  installComponentHooks(data);

  // return a placeholder vnode
  var name = Ctor.options.name || tag;
  var vnode = new VNode(
    ("vue-component-" + (Ctor.cid) + (name ? ("-" + name) : '')),
    data, undefined, undefined, undefined, context,
    { Ctor: Ctor, propsData: propsData, listeners: listeners, tag: tag, children: children },
    asyncFactory
  );

  // Weex specific: invoke recycle-list optimized @render function for
  // extracting cell-slot template.
  // https://github.com/Hanks10100/weex-native-directive/tree/master/component
  /* istanbul ignore if */
  return vnode
}

function createComponentInstanceForVnode (
  vnode, // we know it's MountedComponentVNode but flow doesn't
  parent, // activeInstance in lifecycle state
  parentElm,
  refElm
) {
  var options = {
    _isComponent: true,
    parent: parent,
    _parentVnode: vnode,
    _parentElm: parentElm || null,
    _refElm: refElm || null
  };
  // check inline-template render functions
  var inlineTemplate = vnode.data.inlineTemplate;
  if (isDef(inlineTemplate)) {
    options.render = inlineTemplate.render;
    options.staticRenderFns = inlineTemplate.staticRenderFns;
  }
  return new vnode.componentOptions.Ctor(options)
}

function installComponentHooks (data) {
  var hooks = data.hook || (data.hook = {});
  for (var i = 0; i < hooksToMerge.length; i++) {
    var key = hooksToMerge[i];
    hooks[key] = componentVNodeHooks[key];
  }
}

// transform component v-model info (value and callback) into
// prop and event handler respectively.
function transformModel (options, data) {
  var prop = (options.model && options.model.prop) || 'value';
  var event = (options.model && options.model.event) || 'input';(data.props || (data.props = {}))[prop] = data.model.value;
  var on = data.on || (data.on = {});
  if (isDef(on[event])) {
    on[event] = [data.model.callback].concat(on[event]);
  } else {
    on[event] = data.model.callback;
  }
}

/*  */

var SIMPLE_NORMALIZE = 1;
var ALWAYS_NORMALIZE = 2;

// wrapper function for providing a more flexible interface
// without getting yelled at by flow
function createElement (
  context,
  tag,
  data,
  children,
  normalizationType,
  alwaysNormalize
) {
  if (Array.isArray(data) || isPrimitive(data)) {
    normalizationType = children;
    children = data;
    data = undefined;
  }
  if (isTrue(alwaysNormalize)) {
    normalizationType = ALWAYS_NORMALIZE;
  }
  return _createElement(context, tag, data, children, normalizationType)
}

function _createElement (
  context,
  tag,
  data,
  children,
  normalizationType
) {
  if (isDef(data) && isDef((data).__ob__)) {
    "production" !== 'production' && warn(
      "Avoid using observed data object as vnode data: " + (JSON.stringify(data)) + "\n" +
      'Always create fresh vnode data objects in each render!',
      context
    );
    return createEmptyVNode()
  }
  // object syntax in v-bind
  if (isDef(data) && isDef(data.is)) {
    tag = data.is;
  }
  if (!tag) {
    // in case of component :is set to falsy value
    return createEmptyVNode()
  }
  // warn against non-primitive key
  if (false
  ) {
    {
      warn(
        'Avoid using non-primitive value as key, ' +
        'use string/number value instead.',
        context
      );
    }
  }
  // support single function children as default scoped slot
  if (Array.isArray(children) &&
    typeof children[0] === 'function'
  ) {
    data = data || {};
    data.scopedSlots = { default: children[0] };
    children.length = 0;
  }
  if (normalizationType === ALWAYS_NORMALIZE) {
    children = normalizeChildren(children);
  } else if (normalizationType === SIMPLE_NORMALIZE) {
    children = simpleNormalizeChildren(children);
  }
  var vnode, ns;
  if (typeof tag === 'string') {
    var Ctor;
    ns = (context.$vnode && context.$vnode.ns) || config.getTagNamespace(tag);
    if (config.isReservedTag(tag)) {
      // platform built-in elements
      vnode = new VNode(
        config.parsePlatformTagName(tag), data, children,
        undefined, undefined, context
      );
    } else if (isDef(Ctor = resolveAsset(context.$options, 'components', tag))) {
      // component
      vnode = createComponent(Ctor, data, context, children, tag);
    } else {
      // unknown or unlisted namespaced elements
      // check at runtime because it may get assigned a namespace when its
      // parent normalizes children
      vnode = new VNode(
        tag, data, children,
        undefined, undefined, context
      );
    }
  } else {
    // direct component options / constructor
    vnode = createComponent(tag, data, context, children);
  }
  if (Array.isArray(vnode)) {
    return vnode
  } else if (isDef(vnode)) {
    if (isDef(ns)) { applyNS(vnode, ns); }
    if (isDef(data)) { registerDeepBindings(data); }
    return vnode
  } else {
    return createEmptyVNode()
  }
}

function applyNS (vnode, ns, force) {
  vnode.ns = ns;
  if (vnode.tag === 'foreignObject') {
    // use default namespace inside foreignObject
    ns = undefined;
    force = true;
  }
  if (isDef(vnode.children)) {
    for (var i = 0, l = vnode.children.length; i < l; i++) {
      var child = vnode.children[i];
      if (isDef(child.tag) && (
        isUndef(child.ns) || (isTrue(force) && child.tag !== 'svg'))) {
        applyNS(child, ns, force);
      }
    }
  }
}

// ref #5318
// necessary to ensure parent re-render when deep bindings like :style and
// :class are used on slot nodes
function registerDeepBindings (data) {
  if (isObject(data.style)) {
    traverse(data.style);
  }
  if (isObject(data.class)) {
    traverse(data.class);
  }
}

/*  */

function initRender (vm) {
  vm._vnode = null; // the root of the child tree
  vm._staticTrees = null; // v-once cached trees
  var options = vm.$options;
  var parentVnode = vm.$vnode = options._parentVnode; // the placeholder node in parent tree
  var renderContext = parentVnode && parentVnode.context;
  vm.$slots = resolveSlots(options._renderChildren, renderContext);
  vm.$scopedSlots = emptyObject;
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = function (a, b, c, d) { return createElement(vm, a, b, c, d, false); };
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = function (a, b, c, d) { return createElement(vm, a, b, c, d, true); };

  // $attrs & $listeners are exposed for easier HOC creation.
  // they need to be reactive so that HOCs using them are always updated
  var parentData = parentVnode && parentVnode.data;

  /* istanbul ignore else */
  if (false) {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, function () {
      !isUpdatingChildComponent && warn("$attrs is readonly.", vm);
    }, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, function () {
      !isUpdatingChildComponent && warn("$listeners is readonly.", vm);
    }, true);
  } else {
    defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true);
    defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true);
  }
}

function renderMixin (Vue) {
  // install runtime convenience helpers
  installRenderHelpers(Vue.prototype);

  Vue.prototype.$nextTick = function (fn) {
    return nextTick(fn, this)
  };

  Vue.prototype._render = function () {
    var vm = this;
    var ref = vm.$options;
    var render = ref.render;
    var _parentVnode = ref._parentVnode;

    // reset _rendered flag on slots for duplicate slot check
    if (false) {
      for (var key in vm.$slots) {
        // $flow-disable-line
        vm.$slots[key]._rendered = false;
      }
    }

    if (_parentVnode) {
      vm.$scopedSlots = _parentVnode.data.scopedSlots || emptyObject;
    }

    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode;
    // render self
    var vnode;
    try {
      vnode = render.call(vm._renderProxy, vm.$createElement);
    } catch (e) {
      handleError(e, vm, "render");
      // return error render result,
      // or previous vnode to prevent render error causing blank component
      /* istanbul ignore else */
      if (false) {
        if (vm.$options.renderError) {
          try {
            vnode = vm.$options.renderError.call(vm._renderProxy, vm.$createElement, e);
          } catch (e) {
            handleError(e, vm, "renderError");
            vnode = vm._vnode;
          }
        } else {
          vnode = vm._vnode;
        }
      } else {
        vnode = vm._vnode;
      }
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (false) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        );
      }
      vnode = createEmptyVNode();
    }
    // set parent
    vnode.parent = _parentVnode;
    return vnode
  };
}

/*  */

var uid$3 = 0;

function initMixin (Vue) {
  Vue.prototype._init = function (options) {
    var vm = this;
    // a uid
    vm._uid = uid$3++;

    var startTag, endTag;
    /* istanbul ignore if */
    if (false) {
      startTag = "vue-perf-start:" + (vm._uid);
      endTag = "vue-perf-end:" + (vm._uid);
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    /* istanbul ignore else */
    if (false) {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    vm._self = vm;
    initLifecycle(vm);
    initEvents(vm);
    initRender(vm);
    callHook(vm, 'beforeCreate');
    initInjections(vm); // resolve injections before data/props
    initState(vm);
    initProvide(vm); // resolve provide after data/props
    callHook(vm, 'created');

    /* istanbul ignore if */
    if (false) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(("vue " + (vm._name) + " init"), startTag, endTag);
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}

function initInternalComponent (vm, options) {
  var opts = vm.$options = Object.create(vm.constructor.options);
  // doing this because it's faster than dynamic enumeration.
  var parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;
  opts._parentElm = options._parentElm;
  opts._refElm = options._refElm;

  var vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

function resolveConstructorOptions (Ctor) {
  var options = Ctor.options;
  if (Ctor.super) {
    var superOptions = resolveConstructorOptions(Ctor.super);
    var cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      var modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options
}

function resolveModifiedOptions (Ctor) {
  var modified;
  var latest = Ctor.options;
  var extended = Ctor.extendOptions;
  var sealed = Ctor.sealedOptions;
  for (var key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) { modified = {}; }
      modified[key] = dedupe(latest[key], extended[key], sealed[key]);
    }
  }
  return modified
}

function dedupe (latest, extended, sealed) {
  // compare latest and sealed to ensure lifecycle hooks won't be duplicated
  // between merges
  if (Array.isArray(latest)) {
    var res = [];
    sealed = Array.isArray(sealed) ? sealed : [sealed];
    extended = Array.isArray(extended) ? extended : [extended];
    for (var i = 0; i < latest.length; i++) {
      // push original options and not sealed options to exclude duplicated options
      if (extended.indexOf(latest[i]) >= 0 || sealed.indexOf(latest[i]) < 0) {
        res.push(latest[i]);
      }
    }
    return res
  } else {
    return latest
  }
}

function Vue (options) {
  if (false
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword');
  }
  this._init(options);
}

initMixin(Vue);
stateMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

/*  */

function initUse (Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // additional parameters
    var args = toArray(arguments, 1);
    args.unshift(this);
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}

/*  */

function initMixin$1 (Vue) {
  Vue.mixin = function (mixin) {
    this.options = mergeOptions(this.options, mixin);
    return this
  };
}

/*  */

function initExtend (Vue) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0;
  var cid = 1;

  /**
   * Class inheritance
   */
  Vue.extend = function (extendOptions) {
    extendOptions = extendOptions || {};
    var Super = this;
    var SuperId = Super.cid;
    var cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {});
    if (cachedCtors[SuperId]) {
      return cachedCtors[SuperId]
    }

    var name = extendOptions.name || Super.options.name;
    if (false) {
      validateComponentName(name);
    }

    var Sub = function VueComponent (options) {
      this._init(options);
    };
    Sub.prototype = Object.create(Super.prototype);
    Sub.prototype.constructor = Sub;
    Sub.cid = cid++;
    Sub.options = mergeOptions(
      Super.options,
      extendOptions
    );
    Sub['super'] = Super;

    // For props and computed properties, we define the proxy getters on
    // the Vue instances at extension time, on the extended prototype. This
    // avoids Object.defineProperty calls for each instance created.
    if (Sub.options.props) {
      initProps$1(Sub);
    }
    if (Sub.options.computed) {
      initComputed$1(Sub);
    }

    // allow further extension/mixin/plugin usage
    Sub.extend = Super.extend;
    Sub.mixin = Super.mixin;
    Sub.use = Super.use;

    // create asset registers, so extended classes
    // can have their private assets too.
    ASSET_TYPES.forEach(function (type) {
      Sub[type] = Super[type];
    });
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub;
    }

    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    Sub.superOptions = Super.options;
    Sub.extendOptions = extendOptions;
    Sub.sealedOptions = extend({}, Sub.options);

    // cache constructor
    cachedCtors[SuperId] = Sub;
    return Sub
  };
}

function initProps$1 (Comp) {
  var props = Comp.options.props;
  for (var key in props) {
    proxy(Comp.prototype, "_props", key);
  }
}

function initComputed$1 (Comp) {
  var computed = Comp.options.computed;
  for (var key in computed) {
    defineComputed(Comp.prototype, key, computed[key]);
  }
}

/*  */

function initAssetRegisters (Vue) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(function (type) {
    Vue[type] = function (
      id,
      definition
    ) {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (false) {
          validateComponentName(id);
        }
        if (type === 'component' && isPlainObject(definition)) {
          definition.name = definition.name || id;
          definition = this.options._base.extend(definition);
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition };
        }
        this.options[type + 's'][id] = definition;
        return definition
      }
    };
  });
}

/*  */

function getComponentName (opts) {
  return opts && (opts.Ctor.options.name || opts.tag)
}

function matches (pattern, name) {
  if (Array.isArray(pattern)) {
    return pattern.indexOf(name) > -1
  } else if (typeof pattern === 'string') {
    return pattern.split(',').indexOf(name) > -1
  } else if (isRegExp(pattern)) {
    return pattern.test(name)
  }
  /* istanbul ignore next */
  return false
}

function pruneCache (keepAliveInstance, filter) {
  var cache = keepAliveInstance.cache;
  var keys = keepAliveInstance.keys;
  var _vnode = keepAliveInstance._vnode;
  for (var key in cache) {
    var cachedNode = cache[key];
    if (cachedNode) {
      var name = getComponentName(cachedNode.componentOptions);
      if (name && !filter(name)) {
        pruneCacheEntry(cache, key, keys, _vnode);
      }
    }
  }
}

function pruneCacheEntry (
  cache,
  key,
  keys,
  current
) {
  var cached$$1 = cache[key];
  if (cached$$1 && (!current || cached$$1.tag !== current.tag)) {
    cached$$1.componentInstance.$destroy();
  }
  cache[key] = null;
  remove(keys, key);
}

var patternTypes = [String, RegExp, Array];

var KeepAlive = {
  name: 'keep-alive',
  abstract: true,

  props: {
    include: patternTypes,
    exclude: patternTypes,
    max: [String, Number]
  },

  created: function created () {
    this.cache = Object.create(null);
    this.keys = [];
  },

  destroyed: function destroyed () {
    var this$1 = this;

    for (var key in this$1.cache) {
      pruneCacheEntry(this$1.cache, key, this$1.keys);
    }
  },

  mounted: function mounted () {
    var this$1 = this;

    this.$watch('include', function (val) {
      pruneCache(this$1, function (name) { return matches(val, name); });
    });
    this.$watch('exclude', function (val) {
      pruneCache(this$1, function (name) { return !matches(val, name); });
    });
  },

  render: function render () {
    var slot = this.$slots.default;
    var vnode = getFirstComponentChild(slot);
    var componentOptions = vnode && vnode.componentOptions;
    if (componentOptions) {
      // check pattern
      var name = getComponentName(componentOptions);
      var ref = this;
      var include = ref.include;
      var exclude = ref.exclude;
      if (
        // not included
        (include && (!name || !matches(include, name))) ||
        // excluded
        (exclude && name && matches(exclude, name))
      ) {
        return vnode
      }

      var ref$1 = this;
      var cache = ref$1.cache;
      var keys = ref$1.keys;
      var key = vnode.key == null
        // same constructor may get registered as different local components
        // so cid alone is not enough (#3269)
        ? componentOptions.Ctor.cid + (componentOptions.tag ? ("::" + (componentOptions.tag)) : '')
        : vnode.key;
      if (cache[key]) {
        vnode.componentInstance = cache[key].componentInstance;
        // make current key freshest
        remove(keys, key);
        keys.push(key);
      } else {
        cache[key] = vnode;
        keys.push(key);
        // prune oldest entry
        if (this.max && keys.length > parseInt(this.max)) {
          pruneCacheEntry(cache, keys[0], keys, this._vnode);
        }
      }

      vnode.data.keepAlive = true;
    }
    return vnode || (slot && slot[0])
  }
}

var builtInComponents = {
  KeepAlive: KeepAlive
}

/*  */

function initGlobalAPI (Vue) {
  // config
  var configDef = {};
  configDef.get = function () { return config; };
  if (false) {
    configDef.set = function () {
      warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      );
    };
  }
  Object.defineProperty(Vue, 'config', configDef);

  // exposed util methods.
  // NOTE: these are not considered part of the public API - avoid relying on
  // them unless you are aware of the risk.
  Vue.util = {
    warn: warn,
    extend: extend,
    mergeOptions: mergeOptions,
    defineReactive: defineReactive
  };

  Vue.set = set;
  Vue.delete = del;
  Vue.nextTick = nextTick;

  Vue.options = Object.create(null);
  ASSET_TYPES.forEach(function (type) {
    Vue.options[type + 's'] = Object.create(null);
  });

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue;

  extend(Vue.options.components, builtInComponents);

  initUse(Vue);
  initMixin$1(Vue);
  initExtend(Vue);
  initAssetRegisters(Vue);
}

initGlobalAPI(Vue);

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
});

Object.defineProperty(Vue.prototype, '$ssrContext', {
  get: function get () {
    /* istanbul ignore next */
    return this.$vnode && this.$vnode.ssrContext
  }
});

// expose FunctionalRenderContext for ssr runtime helper installation
Object.defineProperty(Vue, 'FunctionalRenderContext', {
  value: FunctionalRenderContext
});

Vue.version = '2.5.16';

/*  */

// these are reserved for web because they are directly compiled away
// during template compilation
var isReservedAttr = makeMap('style,class');

// attributes that should be using props for binding
var acceptValue = makeMap('input,textarea,option,select,progress');
var mustUseProp = function (tag, type, attr) {
  return (
    (attr === 'value' && acceptValue(tag)) && type !== 'button' ||
    (attr === 'selected' && tag === 'option') ||
    (attr === 'checked' && tag === 'input') ||
    (attr === 'muted' && tag === 'video')
  )
};

var isEnumeratedAttr = makeMap('contenteditable,draggable,spellcheck');

var isBooleanAttr = makeMap(
  'allowfullscreen,async,autofocus,autoplay,checked,compact,controls,declare,' +
  'default,defaultchecked,defaultmuted,defaultselected,defer,disabled,' +
  'enabled,formnovalidate,hidden,indeterminate,inert,ismap,itemscope,loop,multiple,' +
  'muted,nohref,noresize,noshade,novalidate,nowrap,open,pauseonexit,readonly,' +
  'required,reversed,scoped,seamless,selected,sortable,translate,' +
  'truespeed,typemustmatch,visible'
);

var xlinkNS = 'http://www.w3.org/1999/xlink';

var isXlink = function (name) {
  return name.charAt(5) === ':' && name.slice(0, 5) === 'xlink'
};

var getXlinkProp = function (name) {
  return isXlink(name) ? name.slice(6, name.length) : ''
};

var isFalsyAttrValue = function (val) {
  return val == null || val === false
};

/*  */

function genClassForVnode (vnode) {
  var data = vnode.data;
  var parentNode = vnode;
  var childNode = vnode;
  while (isDef(childNode.componentInstance)) {
    childNode = childNode.componentInstance._vnode;
    if (childNode && childNode.data) {
      data = mergeClassData(childNode.data, data);
    }
  }
  while (isDef(parentNode = parentNode.parent)) {
    if (parentNode && parentNode.data) {
      data = mergeClassData(data, parentNode.data);
    }
  }
  return renderClass(data.staticClass, data.class)
}

function mergeClassData (child, parent) {
  return {
    staticClass: concat(child.staticClass, parent.staticClass),
    class: isDef(child.class)
      ? [child.class, parent.class]
      : parent.class
  }
}

function renderClass (
  staticClass,
  dynamicClass
) {
  if (isDef(staticClass) || isDef(dynamicClass)) {
    return concat(staticClass, stringifyClass(dynamicClass))
  }
  /* istanbul ignore next */
  return ''
}

function concat (a, b) {
  return a ? b ? (a + ' ' + b) : a : (b || '')
}

function stringifyClass (value) {
  if (Array.isArray(value)) {
    return stringifyArray(value)
  }
  if (isObject(value)) {
    return stringifyObject(value)
  }
  if (typeof value === 'string') {
    return value
  }
  /* istanbul ignore next */
  return ''
}

function stringifyArray (value) {
  var res = '';
  var stringified;
  for (var i = 0, l = value.length; i < l; i++) {
    if (isDef(stringified = stringifyClass(value[i])) && stringified !== '') {
      if (res) { res += ' '; }
      res += stringified;
    }
  }
  return res
}

function stringifyObject (value) {
  var res = '';
  for (var key in value) {
    if (value[key]) {
      if (res) { res += ' '; }
      res += key;
    }
  }
  return res
}

/*  */

var namespaceMap = {
  svg: 'http://www.w3.org/2000/svg',
  math: 'http://www.w3.org/1998/Math/MathML'
};

var isHTMLTag = makeMap(
  'html,body,base,head,link,meta,style,title,' +
  'address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,hgroup,nav,section,' +
  'div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,' +
  'a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,rtc,ruby,' +
  's,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,' +
  'embed,object,param,source,canvas,script,noscript,del,ins,' +
  'caption,col,colgroup,table,thead,tbody,td,th,tr,' +
  'button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,' +
  'output,progress,select,textarea,' +
  'details,dialog,menu,menuitem,summary,' +
  'content,element,shadow,template,blockquote,iframe,tfoot'
);

// this map is intentionally selective, only covering SVG elements that may
// contain child elements.
var isSVG = makeMap(
  'svg,animate,circle,clippath,cursor,defs,desc,ellipse,filter,font-face,' +
  'foreignObject,g,glyph,image,line,marker,mask,missing-glyph,path,pattern,' +
  'polygon,polyline,rect,switch,symbol,text,textpath,tspan,use,view',
  true
);



var isReservedTag = function (tag) {
  return isHTMLTag(tag) || isSVG(tag)
};

function getTagNamespace (tag) {
  if (isSVG(tag)) {
    return 'svg'
  }
  // basic support for MathML
  // note it doesn't support other MathML elements being component roots
  if (tag === 'math') {
    return 'math'
  }
}

var unknownElementCache = Object.create(null);
function isUnknownElement (tag) {
  /* istanbul ignore if */
  if (!inBrowser) {
    return true
  }
  if (isReservedTag(tag)) {
    return false
  }
  tag = tag.toLowerCase();
  /* istanbul ignore if */
  if (unknownElementCache[tag] != null) {
    return unknownElementCache[tag]
  }
  var el = document.createElement(tag);
  if (tag.indexOf('-') > -1) {
    // http://stackoverflow.com/a/28210364/1070244
    return (unknownElementCache[tag] = (
      el.constructor === window.HTMLUnknownElement ||
      el.constructor === window.HTMLElement
    ))
  } else {
    return (unknownElementCache[tag] = /HTMLUnknownElement/.test(el.toString()))
  }
}

var isTextInputType = makeMap('text,number,password,search,email,tel,url');

/*  */

/**
 * Query an element selector if it's not an element already.
 */
function query (el) {
  if (typeof el === 'string') {
    var selected = document.querySelector(el);
    if (!selected) {
      "production" !== 'production' && warn(
        'Cannot find element: ' + el
      );
      return document.createElement('div')
    }
    return selected
  } else {
    return el
  }
}

/*  */

function createElement$1 (tagName, vnode) {
  var elm = document.createElement(tagName);
  if (tagName !== 'select') {
    return elm
  }
  // false or null will remove the attribute but undefined will not
  if (vnode.data && vnode.data.attrs && vnode.data.attrs.multiple !== undefined) {
    elm.setAttribute('multiple', 'multiple');
  }
  return elm
}

function createElementNS (namespace, tagName) {
  return document.createElementNS(namespaceMap[namespace], tagName)
}

function createTextNode (text) {
  return document.createTextNode(text)
}

function createComment (text) {
  return document.createComment(text)
}

function insertBefore (parentNode, newNode, referenceNode) {
  parentNode.insertBefore(newNode, referenceNode);
}

function removeChild (node, child) {
  node.removeChild(child);
}

function appendChild (node, child) {
  node.appendChild(child);
}

function parentNode (node) {
  return node.parentNode
}

function nextSibling (node) {
  return node.nextSibling
}

function tagName (node) {
  return node.tagName
}

function setTextContent (node, text) {
  node.textContent = text;
}

function setStyleScope (node, scopeId) {
  node.setAttribute(scopeId, '');
}


var nodeOps = Object.freeze({
	createElement: createElement$1,
	createElementNS: createElementNS,
	createTextNode: createTextNode,
	createComment: createComment,
	insertBefore: insertBefore,
	removeChild: removeChild,
	appendChild: appendChild,
	parentNode: parentNode,
	nextSibling: nextSibling,
	tagName: tagName,
	setTextContent: setTextContent,
	setStyleScope: setStyleScope
});

/*  */

var ref = {
  create: function create (_, vnode) {
    registerRef(vnode);
  },
  update: function update (oldVnode, vnode) {
    if (oldVnode.data.ref !== vnode.data.ref) {
      registerRef(oldVnode, true);
      registerRef(vnode);
    }
  },
  destroy: function destroy (vnode) {
    registerRef(vnode, true);
  }
}

function registerRef (vnode, isRemoval) {
  var key = vnode.data.ref;
  if (!isDef(key)) { return }

  var vm = vnode.context;
  var ref = vnode.componentInstance || vnode.elm;
  var refs = vm.$refs;
  if (isRemoval) {
    if (Array.isArray(refs[key])) {
      remove(refs[key], ref);
    } else if (refs[key] === ref) {
      refs[key] = undefined;
    }
  } else {
    if (vnode.data.refInFor) {
      if (!Array.isArray(refs[key])) {
        refs[key] = [ref];
      } else if (refs[key].indexOf(ref) < 0) {
        // $flow-disable-line
        refs[key].push(ref);
      }
    } else {
      refs[key] = ref;
    }
  }
}

/**
 * Virtual DOM patching algorithm based on Snabbdom by
 * Simon Friis Vindum (@paldepind)
 * Licensed under the MIT License
 * https://github.com/paldepind/snabbdom/blob/master/LICENSE
 *
 * modified by Evan You (@yyx990803)
 *
 * Not type-checking this because this file is perf-critical and the cost
 * of making flow understand it is not worth it.
 */

var emptyNode = new VNode('', {}, []);

var hooks = ['create', 'activate', 'update', 'remove', 'destroy'];

function sameVnode (a, b) {
  return (
    a.key === b.key && (
      (
        a.tag === b.tag &&
        a.isComment === b.isComment &&
        isDef(a.data) === isDef(b.data) &&
        sameInputType(a, b)
      ) || (
        isTrue(a.isAsyncPlaceholder) &&
        a.asyncFactory === b.asyncFactory &&
        isUndef(b.asyncFactory.error)
      )
    )
  )
}

function sameInputType (a, b) {
  if (a.tag !== 'input') { return true }
  var i;
  var typeA = isDef(i = a.data) && isDef(i = i.attrs) && i.type;
  var typeB = isDef(i = b.data) && isDef(i = i.attrs) && i.type;
  return typeA === typeB || isTextInputType(typeA) && isTextInputType(typeB)
}

function createKeyToOldIdx (children, beginIdx, endIdx) {
  var i, key;
  var map = {};
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) { map[key] = i; }
  }
  return map
}

function createPatchFunction (backend) {
  var i, j;
  var cbs = {};

  var modules = backend.modules;
  var nodeOps = backend.nodeOps;

  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (isDef(modules[j][hooks[i]])) {
        cbs[hooks[i]].push(modules[j][hooks[i]]);
      }
    }
  }

  function emptyNodeAt (elm) {
    return new VNode(nodeOps.tagName(elm).toLowerCase(), {}, [], undefined, elm)
  }

  function createRmCb (childElm, listeners) {
    function remove () {
      if (--remove.listeners === 0) {
        removeNode(childElm);
      }
    }
    remove.listeners = listeners;
    return remove
  }

  function removeNode (el) {
    var parent = nodeOps.parentNode(el);
    // element may have already been removed due to v-html / v-text
    if (isDef(parent)) {
      nodeOps.removeChild(parent, el);
    }
  }

  function isUnknownElement$$1 (vnode, inVPre) {
    return (
      !inVPre &&
      !vnode.ns &&
      !(
        config.ignoredElements.length &&
        config.ignoredElements.some(function (ignore) {
          return isRegExp(ignore)
            ? ignore.test(vnode.tag)
            : ignore === vnode.tag
        })
      ) &&
      config.isUnknownElement(vnode.tag)
    )
  }

  var creatingElmInVPre = 0;

  function createElm (
    vnode,
    insertedVnodeQueue,
    parentElm,
    refElm,
    nested,
    ownerArray,
    index
  ) {
    if (isDef(vnode.elm) && isDef(ownerArray)) {
      // This vnode was used in a previous render!
      // now it's used as a new node, overwriting its elm would cause
      // potential patch errors down the road when it's used as an insertion
      // reference node. Instead, we clone the node on-demand before creating
      // associated DOM element for it.
      vnode = ownerArray[index] = cloneVNode(vnode);
    }

    vnode.isRootInsert = !nested; // for transition enter check
    if (createComponent(vnode, insertedVnodeQueue, parentElm, refElm)) {
      return
    }

    var data = vnode.data;
    var children = vnode.children;
    var tag = vnode.tag;
    if (isDef(tag)) {
      if (false) {
        if (data && data.pre) {
          creatingElmInVPre++;
        }
        if (isUnknownElement$$1(vnode, creatingElmInVPre)) {
          warn(
            'Unknown custom element: <' + tag + '> - did you ' +
            'register the component correctly? For recursive components, ' +
            'make sure to provide the "name" option.',
            vnode.context
          );
        }
      }

      vnode.elm = vnode.ns
        ? nodeOps.createElementNS(vnode.ns, tag)
        : nodeOps.createElement(tag, vnode);
      setScope(vnode);

      /* istanbul ignore if */
      {
        createChildren(vnode, children, insertedVnodeQueue);
        if (isDef(data)) {
          invokeCreateHooks(vnode, insertedVnodeQueue);
        }
        insert(parentElm, vnode.elm, refElm);
      }

      if (false) {
        creatingElmInVPre--;
      }
    } else if (isTrue(vnode.isComment)) {
      vnode.elm = nodeOps.createComment(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    } else {
      vnode.elm = nodeOps.createTextNode(vnode.text);
      insert(parentElm, vnode.elm, refElm);
    }
  }

  function createComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i = vnode.data;
    if (isDef(i)) {
      var isReactivated = isDef(vnode.componentInstance) && i.keepAlive;
      if (isDef(i = i.hook) && isDef(i = i.init)) {
        i(vnode, false /* hydrating */, parentElm, refElm);
      }
      // after calling the init hook, if the vnode is a child component
      // it should've created a child instance and mounted it. the child
      // component also has set the placeholder vnode's elm.
      // in that case we can just return the element and be done.
      if (isDef(vnode.componentInstance)) {
        initComponent(vnode, insertedVnodeQueue);
        if (isTrue(isReactivated)) {
          reactivateComponent(vnode, insertedVnodeQueue, parentElm, refElm);
        }
        return true
      }
    }
  }

  function initComponent (vnode, insertedVnodeQueue) {
    if (isDef(vnode.data.pendingInsert)) {
      insertedVnodeQueue.push.apply(insertedVnodeQueue, vnode.data.pendingInsert);
      vnode.data.pendingInsert = null;
    }
    vnode.elm = vnode.componentInstance.$el;
    if (isPatchable(vnode)) {
      invokeCreateHooks(vnode, insertedVnodeQueue);
      setScope(vnode);
    } else {
      // empty component root.
      // skip all element-related modules except for ref (#3455)
      registerRef(vnode);
      // make sure to invoke the insert hook
      insertedVnodeQueue.push(vnode);
    }
  }

  function reactivateComponent (vnode, insertedVnodeQueue, parentElm, refElm) {
    var i;
    // hack for #4339: a reactivated component with inner transition
    // does not trigger because the inner node's created hooks are not called
    // again. It's not ideal to involve module-specific logic in here but
    // there doesn't seem to be a better way to do it.
    var innerNode = vnode;
    while (innerNode.componentInstance) {
      innerNode = innerNode.componentInstance._vnode;
      if (isDef(i = innerNode.data) && isDef(i = i.transition)) {
        for (i = 0; i < cbs.activate.length; ++i) {
          cbs.activate[i](emptyNode, innerNode);
        }
        insertedVnodeQueue.push(innerNode);
        break
      }
    }
    // unlike a newly created component,
    // a reactivated keep-alive component doesn't insert itself
    insert(parentElm, vnode.elm, refElm);
  }

  function insert (parent, elm, ref$$1) {
    if (isDef(parent)) {
      if (isDef(ref$$1)) {
        if (ref$$1.parentNode === parent) {
          nodeOps.insertBefore(parent, elm, ref$$1);
        }
      } else {
        nodeOps.appendChild(parent, elm);
      }
    }
  }

  function createChildren (vnode, children, insertedVnodeQueue) {
    if (Array.isArray(children)) {
      if (false) {
        checkDuplicateKeys(children);
      }
      for (var i = 0; i < children.length; ++i) {
        createElm(children[i], insertedVnodeQueue, vnode.elm, null, true, children, i);
      }
    } else if (isPrimitive(vnode.text)) {
      nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)));
    }
  }

  function isPatchable (vnode) {
    while (vnode.componentInstance) {
      vnode = vnode.componentInstance._vnode;
    }
    return isDef(vnode.tag)
  }

  function invokeCreateHooks (vnode, insertedVnodeQueue) {
    for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
      cbs.create[i$1](emptyNode, vnode);
    }
    i = vnode.data.hook; // Reuse variable
    if (isDef(i)) {
      if (isDef(i.create)) { i.create(emptyNode, vnode); }
      if (isDef(i.insert)) { insertedVnodeQueue.push(vnode); }
    }
  }

  // set scope id attribute for scoped CSS.
  // this is implemented as a special case to avoid the overhead
  // of going through the normal attribute patching process.
  function setScope (vnode) {
    var i;
    if (isDef(i = vnode.fnScopeId)) {
      nodeOps.setStyleScope(vnode.elm, i);
    } else {
      var ancestor = vnode;
      while (ancestor) {
        if (isDef(i = ancestor.context) && isDef(i = i.$options._scopeId)) {
          nodeOps.setStyleScope(vnode.elm, i);
        }
        ancestor = ancestor.parent;
      }
    }
    // for slot content they should also get the scopeId from the host instance.
    if (isDef(i = activeInstance) &&
      i !== vnode.context &&
      i !== vnode.fnContext &&
      isDef(i = i.$options._scopeId)
    ) {
      nodeOps.setStyleScope(vnode.elm, i);
    }
  }

  function addVnodes (parentElm, refElm, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      createElm(vnodes[startIdx], insertedVnodeQueue, parentElm, refElm, false, vnodes, startIdx);
    }
  }

  function invokeDestroyHook (vnode) {
    var i, j;
    var data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.destroy)) { i(vnode); }
      for (i = 0; i < cbs.destroy.length; ++i) { cbs.destroy[i](vnode); }
    }
    if (isDef(i = vnode.children)) {
      for (j = 0; j < vnode.children.length; ++j) {
        invokeDestroyHook(vnode.children[j]);
      }
    }
  }

  function removeVnodes (parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.tag)) {
          removeAndInvokeRemoveHook(ch);
          invokeDestroyHook(ch);
        } else { // Text node
          removeNode(ch.elm);
        }
      }
    }
  }

  function removeAndInvokeRemoveHook (vnode, rm) {
    if (isDef(rm) || isDef(vnode.data)) {
      var i;
      var listeners = cbs.remove.length + 1;
      if (isDef(rm)) {
        // we have a recursively passed down rm callback
        // increase the listeners count
        rm.listeners += listeners;
      } else {
        // directly removing
        rm = createRmCb(vnode.elm, listeners);
      }
      // recursively invoke hooks on child component root node
      if (isDef(i = vnode.componentInstance) && isDef(i = i._vnode) && isDef(i.data)) {
        removeAndInvokeRemoveHook(i, rm);
      }
      for (i = 0; i < cbs.remove.length; ++i) {
        cbs.remove[i](vnode, rm);
      }
      if (isDef(i = vnode.data.hook) && isDef(i = i.remove)) {
        i(vnode, rm);
      } else {
        rm();
      }
    } else {
      removeNode(vnode.elm);
    }
  }

  function updateChildren (parentElm, oldCh, newCh, insertedVnodeQueue, removeOnly) {
    var oldStartIdx = 0;
    var newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, vnodeToMove, refElm;

    // removeOnly is a special flag used only by <transition-group>
    // to ensure removed elements stay in correct relative positions
    // during leaving transitions
    var canMove = !removeOnly;

    if (false) {
      checkDuplicateKeys(newCh);
    }

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldStartVnode.elm, nodeOps.nextSibling(oldEndVnode.elm));
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        canMove && nodeOps.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) { oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx); }
        idxInOld = isDef(newStartVnode.key)
          ? oldKeyToIdx[newStartVnode.key]
          : findIdxInOld(newStartVnode, oldCh, oldStartIdx, oldEndIdx);
        if (isUndef(idxInOld)) { // New element
          createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
        } else {
          vnodeToMove = oldCh[idxInOld];
          if (sameVnode(vnodeToMove, newStartVnode)) {
            patchVnode(vnodeToMove, newStartVnode, insertedVnodeQueue);
            oldCh[idxInOld] = undefined;
            canMove && nodeOps.insertBefore(parentElm, vnodeToMove.elm, oldStartVnode.elm);
          } else {
            // same key but different element. treat as new element
            createElm(newStartVnode, insertedVnodeQueue, parentElm, oldStartVnode.elm, false, newCh, newStartIdx);
          }
        }
        newStartVnode = newCh[++newStartIdx];
      }
    }
    if (oldStartIdx > oldEndIdx) {
      refElm = isUndef(newCh[newEndIdx + 1]) ? null : newCh[newEndIdx + 1].elm;
      addVnodes(parentElm, refElm, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function checkDuplicateKeys (children) {
    var seenKeys = {};
    for (var i = 0; i < children.length; i++) {
      var vnode = children[i];
      var key = vnode.key;
      if (isDef(key)) {
        if (seenKeys[key]) {
          warn(
            ("Duplicate keys detected: '" + key + "'. This may cause an update error."),
            vnode.context
          );
        } else {
          seenKeys[key] = true;
        }
      }
    }
  }

  function findIdxInOld (node, oldCh, start, end) {
    for (var i = start; i < end; i++) {
      var c = oldCh[i];
      if (isDef(c) && sameVnode(node, c)) { return i }
    }
  }

  function patchVnode (oldVnode, vnode, insertedVnodeQueue, removeOnly) {
    if (oldVnode === vnode) {
      return
    }

    var elm = vnode.elm = oldVnode.elm;

    if (isTrue(oldVnode.isAsyncPlaceholder)) {
      if (isDef(vnode.asyncFactory.resolved)) {
        hydrate(oldVnode.elm, vnode, insertedVnodeQueue);
      } else {
        vnode.isAsyncPlaceholder = true;
      }
      return
    }

    // reuse element for static trees.
    // note we only do this if the vnode is cloned -
    // if the new node is not cloned it means the render functions have been
    // reset by the hot-reload-api and we need to do a proper re-render.
    if (isTrue(vnode.isStatic) &&
      isTrue(oldVnode.isStatic) &&
      vnode.key === oldVnode.key &&
      (isTrue(vnode.isCloned) || isTrue(vnode.isOnce))
    ) {
      vnode.componentInstance = oldVnode.componentInstance;
      return
    }

    var i;
    var data = vnode.data;
    if (isDef(data) && isDef(i = data.hook) && isDef(i = i.prepatch)) {
      i(oldVnode, vnode);
    }

    var oldCh = oldVnode.children;
    var ch = vnode.children;
    if (isDef(data) && isPatchable(vnode)) {
      for (i = 0; i < cbs.update.length; ++i) { cbs.update[i](oldVnode, vnode); }
      if (isDef(i = data.hook) && isDef(i = i.update)) { i(oldVnode, vnode); }
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) { updateChildren(elm, oldCh, ch, insertedVnodeQueue, removeOnly); }
      } else if (isDef(ch)) {
        if (isDef(oldVnode.text)) { nodeOps.setTextContent(elm, ''); }
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      } else if (isDef(oldVnode.text)) {
        nodeOps.setTextContent(elm, '');
      }
    } else if (oldVnode.text !== vnode.text) {
      nodeOps.setTextContent(elm, vnode.text);
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.postpatch)) { i(oldVnode, vnode); }
    }
  }

  function invokeInsertHook (vnode, queue, initial) {
    // delay insert hooks for component root nodes, invoke them after the
    // element is really inserted
    if (isTrue(initial) && isDef(vnode.parent)) {
      vnode.parent.data.pendingInsert = queue;
    } else {
      for (var i = 0; i < queue.length; ++i) {
        queue[i].data.hook.insert(queue[i]);
      }
    }
  }

  var hydrationBailed = false;
  // list of modules that can skip create hook during hydration because they
  // are already rendered on the client or has no need for initialization
  // Note: style is excluded because it relies on initial clone for future
  // deep updates (#7063).
  var isRenderedModule = makeMap('attrs,class,staticClass,staticStyle,key');

  // Note: this is a browser-only function so we can assume elms are DOM nodes.
  function hydrate (elm, vnode, insertedVnodeQueue, inVPre) {
    var i;
    var tag = vnode.tag;
    var data = vnode.data;
    var children = vnode.children;
    inVPre = inVPre || (data && data.pre);
    vnode.elm = elm;

    if (isTrue(vnode.isComment) && isDef(vnode.asyncFactory)) {
      vnode.isAsyncPlaceholder = true;
      return true
    }
    // assert node match
    if (false) {
      if (!assertNodeMatch(elm, vnode, inVPre)) {
        return false
      }
    }
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) { i(vnode, true /* hydrating */); }
      if (isDef(i = vnode.componentInstance)) {
        // child component. it should have hydrated its own tree.
        initComponent(vnode, insertedVnodeQueue);
        return true
      }
    }
    if (isDef(tag)) {
      if (isDef(children)) {
        // empty element, allow client to pick up and populate children
        if (!elm.hasChildNodes()) {
          createChildren(vnode, children, insertedVnodeQueue);
        } else {
          // v-html and domProps: innerHTML
          if (isDef(i = data) && isDef(i = i.domProps) && isDef(i = i.innerHTML)) {
            if (i !== elm.innerHTML) {
              /* istanbul ignore if */
              if (false
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('server innerHTML: ', i);
                console.warn('client innerHTML: ', elm.innerHTML);
              }
              return false
            }
          } else {
            // iterate and compare children lists
            var childrenMatch = true;
            var childNode = elm.firstChild;
            for (var i$1 = 0; i$1 < children.length; i$1++) {
              if (!childNode || !hydrate(childNode, children[i$1], insertedVnodeQueue, inVPre)) {
                childrenMatch = false;
                break
              }
              childNode = childNode.nextSibling;
            }
            // if childNode is not null, it means the actual childNodes list is
            // longer than the virtual children list.
            if (!childrenMatch || childNode) {
              /* istanbul ignore if */
              if (false
              ) {
                hydrationBailed = true;
                console.warn('Parent: ', elm);
                console.warn('Mismatching childNodes vs. VNodes: ', elm.childNodes, children);
              }
              return false
            }
          }
        }
      }
      if (isDef(data)) {
        var fullInvoke = false;
        for (var key in data) {
          if (!isRenderedModule(key)) {
            fullInvoke = true;
            invokeCreateHooks(vnode, insertedVnodeQueue);
            break
          }
        }
        if (!fullInvoke && data['class']) {
          // ensure collecting deps for deep class bindings for future updates
          traverse(data['class']);
        }
      }
    } else if (elm.data !== vnode.text) {
      elm.data = vnode.text;
    }
    return true
  }

  function assertNodeMatch (node, vnode, inVPre) {
    if (isDef(vnode.tag)) {
      return vnode.tag.indexOf('vue-component') === 0 || (
        !isUnknownElement$$1(vnode, inVPre) &&
        vnode.tag.toLowerCase() === (node.tagName && node.tagName.toLowerCase())
      )
    } else {
      return node.nodeType === (vnode.isComment ? 8 : 3)
    }
  }

  return function patch (oldVnode, vnode, hydrating, removeOnly, parentElm, refElm) {
    if (isUndef(vnode)) {
      if (isDef(oldVnode)) { invokeDestroyHook(oldVnode); }
      return
    }

    var isInitialPatch = false;
    var insertedVnodeQueue = [];

    if (isUndef(oldVnode)) {
      // empty mount (likely as component), create new root element
      isInitialPatch = true;
      createElm(vnode, insertedVnodeQueue, parentElm, refElm);
    } else {
      var isRealElement = isDef(oldVnode.nodeType);
      if (!isRealElement && sameVnode(oldVnode, vnode)) {
        // patch existing root node
        patchVnode(oldVnode, vnode, insertedVnodeQueue, removeOnly);
      } else {
        if (isRealElement) {
          // mounting to a real element
          // check if this is server-rendered content and if we can perform
          // a successful hydration.
          if (oldVnode.nodeType === 1 && oldVnode.hasAttribute(SSR_ATTR)) {
            oldVnode.removeAttribute(SSR_ATTR);
            hydrating = true;
          }
          if (isTrue(hydrating)) {
            if (hydrate(oldVnode, vnode, insertedVnodeQueue)) {
              invokeInsertHook(vnode, insertedVnodeQueue, true);
              return oldVnode
            } else if (false) {
              warn(
                'The client-side rendered virtual DOM tree is not matching ' +
                'server-rendered content. This is likely caused by incorrect ' +
                'HTML markup, for example nesting block-level elements inside ' +
                '<p>, or missing <tbody>. Bailing hydration and performing ' +
                'full client-side render.'
              );
            }
          }
          // either not server-rendered, or hydration failed.
          // create an empty node and replace it
          oldVnode = emptyNodeAt(oldVnode);
        }

        // replacing existing element
        var oldElm = oldVnode.elm;
        var parentElm$1 = nodeOps.parentNode(oldElm);

        // create new node
        createElm(
          vnode,
          insertedVnodeQueue,
          // extremely rare edge case: do not insert if old element is in a
          // leaving transition. Only happens when combining transition +
          // keep-alive + HOCs. (#4590)
          oldElm._leaveCb ? null : parentElm$1,
          nodeOps.nextSibling(oldElm)
        );

        // update parent placeholder node element, recursively
        if (isDef(vnode.parent)) {
          var ancestor = vnode.parent;
          var patchable = isPatchable(vnode);
          while (ancestor) {
            for (var i = 0; i < cbs.destroy.length; ++i) {
              cbs.destroy[i](ancestor);
            }
            ancestor.elm = vnode.elm;
            if (patchable) {
              for (var i$1 = 0; i$1 < cbs.create.length; ++i$1) {
                cbs.create[i$1](emptyNode, ancestor);
              }
              // #6513
              // invoke insert hooks that may have been merged by create hooks.
              // e.g. for directives that uses the "inserted" hook.
              var insert = ancestor.data.hook.insert;
              if (insert.merged) {
                // start at index 1 to avoid re-invoking component mounted hook
                for (var i$2 = 1; i$2 < insert.fns.length; i$2++) {
                  insert.fns[i$2]();
                }
              }
            } else {
              registerRef(ancestor);
            }
            ancestor = ancestor.parent;
          }
        }

        // destroy old node
        if (isDef(parentElm$1)) {
          removeVnodes(parentElm$1, [oldVnode], 0, 0);
        } else if (isDef(oldVnode.tag)) {
          invokeDestroyHook(oldVnode);
        }
      }
    }

    invokeInsertHook(vnode, insertedVnodeQueue, isInitialPatch);
    return vnode.elm
  }
}

/*  */

var directives = {
  create: updateDirectives,
  update: updateDirectives,
  destroy: function unbindDirectives (vnode) {
    updateDirectives(vnode, emptyNode);
  }
}

function updateDirectives (oldVnode, vnode) {
  if (oldVnode.data.directives || vnode.data.directives) {
    _update(oldVnode, vnode);
  }
}

function _update (oldVnode, vnode) {
  var isCreate = oldVnode === emptyNode;
  var isDestroy = vnode === emptyNode;
  var oldDirs = normalizeDirectives$1(oldVnode.data.directives, oldVnode.context);
  var newDirs = normalizeDirectives$1(vnode.data.directives, vnode.context);

  var dirsWithInsert = [];
  var dirsWithPostpatch = [];

  var key, oldDir, dir;
  for (key in newDirs) {
    oldDir = oldDirs[key];
    dir = newDirs[key];
    if (!oldDir) {
      // new directive, bind
      callHook$1(dir, 'bind', vnode, oldVnode);
      if (dir.def && dir.def.inserted) {
        dirsWithInsert.push(dir);
      }
    } else {
      // existing directive, update
      dir.oldValue = oldDir.value;
      callHook$1(dir, 'update', vnode, oldVnode);
      if (dir.def && dir.def.componentUpdated) {
        dirsWithPostpatch.push(dir);
      }
    }
  }

  if (dirsWithInsert.length) {
    var callInsert = function () {
      for (var i = 0; i < dirsWithInsert.length; i++) {
        callHook$1(dirsWithInsert[i], 'inserted', vnode, oldVnode);
      }
    };
    if (isCreate) {
      mergeVNodeHook(vnode, 'insert', callInsert);
    } else {
      callInsert();
    }
  }

  if (dirsWithPostpatch.length) {
    mergeVNodeHook(vnode, 'postpatch', function () {
      for (var i = 0; i < dirsWithPostpatch.length; i++) {
        callHook$1(dirsWithPostpatch[i], 'componentUpdated', vnode, oldVnode);
      }
    });
  }

  if (!isCreate) {
    for (key in oldDirs) {
      if (!newDirs[key]) {
        // no longer present, unbind
        callHook$1(oldDirs[key], 'unbind', oldVnode, oldVnode, isDestroy);
      }
    }
  }
}

var emptyModifiers = Object.create(null);

function normalizeDirectives$1 (
  dirs,
  vm
) {
  var res = Object.create(null);
  if (!dirs) {
    // $flow-disable-line
    return res
  }
  var i, dir;
  for (i = 0; i < dirs.length; i++) {
    dir = dirs[i];
    if (!dir.modifiers) {
      // $flow-disable-line
      dir.modifiers = emptyModifiers;
    }
    res[getRawDirName(dir)] = dir;
    dir.def = resolveAsset(vm.$options, 'directives', dir.name, true);
  }
  // $flow-disable-line
  return res
}

function getRawDirName (dir) {
  return dir.rawName || ((dir.name) + "." + (Object.keys(dir.modifiers || {}).join('.')))
}

function callHook$1 (dir, hook, vnode, oldVnode, isDestroy) {
  var fn = dir.def && dir.def[hook];
  if (fn) {
    try {
      fn(vnode.elm, dir, vnode, oldVnode, isDestroy);
    } catch (e) {
      handleError(e, vnode.context, ("directive " + (dir.name) + " " + hook + " hook"));
    }
  }
}

var baseModules = [
  ref,
  directives
]

/*  */

function updateAttrs (oldVnode, vnode) {
  var opts = vnode.componentOptions;
  if (isDef(opts) && opts.Ctor.options.inheritAttrs === false) {
    return
  }
  if (isUndef(oldVnode.data.attrs) && isUndef(vnode.data.attrs)) {
    return
  }
  var key, cur, old;
  var elm = vnode.elm;
  var oldAttrs = oldVnode.data.attrs || {};
  var attrs = vnode.data.attrs || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(attrs.__ob__)) {
    attrs = vnode.data.attrs = extend({}, attrs);
  }

  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      setAttr(elm, key, cur);
    }
  }
  // #4391: in IE9, setting type can reset value for input[type=radio]
  // #6666: IE/Edge forces progress value down to 1 before setting a max
  /* istanbul ignore if */
  if ((isIE || isEdge) && attrs.value !== oldAttrs.value) {
    setAttr(elm, 'value', attrs.value);
  }
  for (key in oldAttrs) {
    if (isUndef(attrs[key])) {
      if (isXlink(key)) {
        elm.removeAttributeNS(xlinkNS, getXlinkProp(key));
      } else if (!isEnumeratedAttr(key)) {
        elm.removeAttribute(key);
      }
    }
  }
}

function setAttr (el, key, value) {
  if (el.tagName.indexOf('-') > -1) {
    baseSetAttr(el, key, value);
  } else if (isBooleanAttr(key)) {
    // set attribute for blank value
    // e.g. <option disabled>Select one</option>
    if (isFalsyAttrValue(value)) {
      el.removeAttribute(key);
    } else {
      // technically allowfullscreen is a boolean attribute for <iframe>,
      // but Flash expects a value of "true" when used on <embed> tag
      value = key === 'allowfullscreen' && el.tagName === 'EMBED'
        ? 'true'
        : key;
      el.setAttribute(key, value);
    }
  } else if (isEnumeratedAttr(key)) {
    el.setAttribute(key, isFalsyAttrValue(value) || value === 'false' ? 'false' : 'true');
  } else if (isXlink(key)) {
    if (isFalsyAttrValue(value)) {
      el.removeAttributeNS(xlinkNS, getXlinkProp(key));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    baseSetAttr(el, key, value);
  }
}

function baseSetAttr (el, key, value) {
  if (isFalsyAttrValue(value)) {
    el.removeAttribute(key);
  } else {
    // #7138: IE10 & 11 fires input event when setting placeholder on
    // <textarea>... block the first input event and remove the blocker
    // immediately.
    /* istanbul ignore if */
    if (
      isIE && !isIE9 &&
      el.tagName === 'TEXTAREA' &&
      key === 'placeholder' && !el.__ieph
    ) {
      var blocker = function (e) {
        e.stopImmediatePropagation();
        el.removeEventListener('input', blocker);
      };
      el.addEventListener('input', blocker);
      // $flow-disable-line
      el.__ieph = true; /* IE placeholder patched */
    }
    el.setAttribute(key, value);
  }
}

var attrs = {
  create: updateAttrs,
  update: updateAttrs
}

/*  */

function updateClass (oldVnode, vnode) {
  var el = vnode.elm;
  var data = vnode.data;
  var oldData = oldVnode.data;
  if (
    isUndef(data.staticClass) &&
    isUndef(data.class) && (
      isUndef(oldData) || (
        isUndef(oldData.staticClass) &&
        isUndef(oldData.class)
      )
    )
  ) {
    return
  }

  var cls = genClassForVnode(vnode);

  // handle transition classes
  var transitionClass = el._transitionClasses;
  if (isDef(transitionClass)) {
    cls = concat(cls, stringifyClass(transitionClass));
  }

  // set the class
  if (cls !== el._prevClass) {
    el.setAttribute('class', cls);
    el._prevClass = cls;
  }
}

var klass = {
  create: updateClass,
  update: updateClass
}

/*  */

/*  */









// add a raw attr (use this in preTransforms)








// note: this only removes the attr from the Array (attrsList) so that it
// doesn't get processed by processAttrs.
// By default it does NOT remove it from the map (attrsMap) because the map is
// needed during codegen.

/*  */

/**
 * Cross-platform code generation for component v-model
 */


/**
 * Cross-platform codegen helper for generating v-model value assignment code.
 */

/*  */

// in some cases, the event used has to be determined at runtime
// so we used some reserved tokens during compile.
var RANGE_TOKEN = '__r';
var CHECKBOX_RADIO_TOKEN = '__c';

/*  */

// normalize v-model event tokens that can only be determined at runtime.
// it's important to place the event as the first in the array because
// the whole point is ensuring the v-model callback gets called before
// user-attached handlers.
function normalizeEvents (on) {
  /* istanbul ignore if */
  if (isDef(on[RANGE_TOKEN])) {
    // IE input[type=range] only supports `change` event
    var event = isIE ? 'change' : 'input';
    on[event] = [].concat(on[RANGE_TOKEN], on[event] || []);
    delete on[RANGE_TOKEN];
  }
  // This was originally intended to fix #4521 but no longer necessary
  // after 2.5. Keeping it for backwards compat with generated code from < 2.4
  /* istanbul ignore if */
  if (isDef(on[CHECKBOX_RADIO_TOKEN])) {
    on.change = [].concat(on[CHECKBOX_RADIO_TOKEN], on.change || []);
    delete on[CHECKBOX_RADIO_TOKEN];
  }
}

var target$1;

function createOnceHandler (handler, event, capture) {
  var _target = target$1; // save current target element in closure
  return function onceHandler () {
    var res = handler.apply(null, arguments);
    if (res !== null) {
      remove$2(event, onceHandler, capture, _target);
    }
  }
}

function add$1 (
  event,
  handler,
  once$$1,
  capture,
  passive
) {
  handler = withMacroTask(handler);
  if (once$$1) { handler = createOnceHandler(handler, event, capture); }
  target$1.addEventListener(
    event,
    handler,
    supportsPassive
      ? { capture: capture, passive: passive }
      : capture
  );
}

function remove$2 (
  event,
  handler,
  capture,
  _target
) {
  (_target || target$1).removeEventListener(
    event,
    handler._withTask || handler,
    capture
  );
}

function updateDOMListeners (oldVnode, vnode) {
  if (isUndef(oldVnode.data.on) && isUndef(vnode.data.on)) {
    return
  }
  var on = vnode.data.on || {};
  var oldOn = oldVnode.data.on || {};
  target$1 = vnode.elm;
  normalizeEvents(on);
  updateListeners(on, oldOn, add$1, remove$2, vnode.context);
  target$1 = undefined;
}

var events = {
  create: updateDOMListeners,
  update: updateDOMListeners
}

/*  */

function updateDOMProps (oldVnode, vnode) {
  if (isUndef(oldVnode.data.domProps) && isUndef(vnode.data.domProps)) {
    return
  }
  var key, cur;
  var elm = vnode.elm;
  var oldProps = oldVnode.data.domProps || {};
  var props = vnode.data.domProps || {};
  // clone observed objects, as the user probably wants to mutate it
  if (isDef(props.__ob__)) {
    props = vnode.data.domProps = extend({}, props);
  }

  for (key in oldProps) {
    if (isUndef(props[key])) {
      elm[key] = '';
    }
  }
  for (key in props) {
    cur = props[key];
    // ignore children if the node has textContent or innerHTML,
    // as these will throw away existing DOM nodes and cause removal errors
    // on subsequent patches (#3360)
    if (key === 'textContent' || key === 'innerHTML') {
      if (vnode.children) { vnode.children.length = 0; }
      if (cur === oldProps[key]) { continue }
      // #6601 work around Chrome version <= 55 bug where single textNode
      // replaced by innerHTML/textContent retains its parentNode property
      if (elm.childNodes.length === 1) {
        elm.removeChild(elm.childNodes[0]);
      }
    }

    if (key === 'value') {
      // store value as _value as well since
      // non-string values will be stringified
      elm._value = cur;
      // avoid resetting cursor position when value is the same
      var strCur = isUndef(cur) ? '' : String(cur);
      if (shouldUpdateValue(elm, strCur)) {
        elm.value = strCur;
      }
    } else {
      elm[key] = cur;
    }
  }
}

// check platforms/web/util/attrs.js acceptValue


function shouldUpdateValue (elm, checkVal) {
  return (!elm.composing && (
    elm.tagName === 'OPTION' ||
    isNotInFocusAndDirty(elm, checkVal) ||
    isDirtyWithModifiers(elm, checkVal)
  ))
}

function isNotInFocusAndDirty (elm, checkVal) {
  // return true when textbox (.number and .trim) loses focus and its value is
  // not equal to the updated value
  var notInFocus = true;
  // #6157
  // work around IE bug when accessing document.activeElement in an iframe
  try { notInFocus = document.activeElement !== elm; } catch (e) {}
  return notInFocus && elm.value !== checkVal
}

function isDirtyWithModifiers (elm, newVal) {
  var value = elm.value;
  var modifiers = elm._vModifiers; // injected by v-model runtime
  if (isDef(modifiers)) {
    if (modifiers.lazy) {
      // inputs with lazy should only be updated when not in focus
      return false
    }
    if (modifiers.number) {
      return toNumber(value) !== toNumber(newVal)
    }
    if (modifiers.trim) {
      return value.trim() !== newVal.trim()
    }
  }
  return value !== newVal
}

var domProps = {
  create: updateDOMProps,
  update: updateDOMProps
}

/*  */

var parseStyleText = cached(function (cssText) {
  var res = {};
  var listDelimiter = /;(?![^(]*\))/g;
  var propertyDelimiter = /:(.+)/;
  cssText.split(listDelimiter).forEach(function (item) {
    if (item) {
      var tmp = item.split(propertyDelimiter);
      tmp.length > 1 && (res[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return res
});

// merge static and dynamic style data on the same vnode
function normalizeStyleData (data) {
  var style = normalizeStyleBinding(data.style);
  // static style is pre-processed into an object during compilation
  // and is always a fresh object, so it's safe to merge into it
  return data.staticStyle
    ? extend(data.staticStyle, style)
    : style
}

// normalize possible array / string values into Object
function normalizeStyleBinding (bindingStyle) {
  if (Array.isArray(bindingStyle)) {
    return toObject(bindingStyle)
  }
  if (typeof bindingStyle === 'string') {
    return parseStyleText(bindingStyle)
  }
  return bindingStyle
}

/**
 * parent component style should be after child's
 * so that parent component's style could override it
 */
function getStyle (vnode, checkChild) {
  var res = {};
  var styleData;

  if (checkChild) {
    var childNode = vnode;
    while (childNode.componentInstance) {
      childNode = childNode.componentInstance._vnode;
      if (
        childNode && childNode.data &&
        (styleData = normalizeStyleData(childNode.data))
      ) {
        extend(res, styleData);
      }
    }
  }

  if ((styleData = normalizeStyleData(vnode.data))) {
    extend(res, styleData);
  }

  var parentNode = vnode;
  while ((parentNode = parentNode.parent)) {
    if (parentNode.data && (styleData = normalizeStyleData(parentNode.data))) {
      extend(res, styleData);
    }
  }
  return res
}

/*  */

var cssVarRE = /^--/;
var importantRE = /\s*!important$/;
var setProp = function (el, name, val) {
  /* istanbul ignore if */
  if (cssVarRE.test(name)) {
    el.style.setProperty(name, val);
  } else if (importantRE.test(val)) {
    el.style.setProperty(name, val.replace(importantRE, ''), 'important');
  } else {
    var normalizedName = normalize(name);
    if (Array.isArray(val)) {
      // Support values array created by autoprefixer, e.g.
      // {display: ["-webkit-box", "-ms-flexbox", "flex"]}
      // Set them one by one, and the browser will only set those it can recognize
      for (var i = 0, len = val.length; i < len; i++) {
        el.style[normalizedName] = val[i];
      }
    } else {
      el.style[normalizedName] = val;
    }
  }
};

var vendorNames = ['Webkit', 'Moz', 'ms'];

var emptyStyle;
var normalize = cached(function (prop) {
  emptyStyle = emptyStyle || document.createElement('div').style;
  prop = camelize(prop);
  if (prop !== 'filter' && (prop in emptyStyle)) {
    return prop
  }
  var capName = prop.charAt(0).toUpperCase() + prop.slice(1);
  for (var i = 0; i < vendorNames.length; i++) {
    var name = vendorNames[i] + capName;
    if (name in emptyStyle) {
      return name
    }
  }
});

function updateStyle (oldVnode, vnode) {
  var data = vnode.data;
  var oldData = oldVnode.data;

  if (isUndef(data.staticStyle) && isUndef(data.style) &&
    isUndef(oldData.staticStyle) && isUndef(oldData.style)
  ) {
    return
  }

  var cur, name;
  var el = vnode.elm;
  var oldStaticStyle = oldData.staticStyle;
  var oldStyleBinding = oldData.normalizedStyle || oldData.style || {};

  // if static style exists, stylebinding already merged into it when doing normalizeStyleData
  var oldStyle = oldStaticStyle || oldStyleBinding;

  var style = normalizeStyleBinding(vnode.data.style) || {};

  // store normalized style under a different key for next diff
  // make sure to clone it if it's reactive, since the user likely wants
  // to mutate it.
  vnode.data.normalizedStyle = isDef(style.__ob__)
    ? extend({}, style)
    : style;

  var newStyle = getStyle(vnode, true);

  for (name in oldStyle) {
    if (isUndef(newStyle[name])) {
      setProp(el, name, '');
    }
  }
  for (name in newStyle) {
    cur = newStyle[name];
    if (cur !== oldStyle[name]) {
      // ie9 setting to null has no effect, must use empty string
      setProp(el, name, cur == null ? '' : cur);
    }
  }
}

var style = {
  create: updateStyle,
  update: updateStyle
}

/*  */

/**
 * Add class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function addClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.add(c); });
    } else {
      el.classList.add(cls);
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    if (cur.indexOf(' ' + cls + ' ') < 0) {
      el.setAttribute('class', (cur + cls).trim());
    }
  }
}

/**
 * Remove class with compatibility for SVG since classList is not supported on
 * SVG elements in IE
 */
function removeClass (el, cls) {
  /* istanbul ignore if */
  if (!cls || !(cls = cls.trim())) {
    return
  }

  /* istanbul ignore else */
  if (el.classList) {
    if (cls.indexOf(' ') > -1) {
      cls.split(/\s+/).forEach(function (c) { return el.classList.remove(c); });
    } else {
      el.classList.remove(cls);
    }
    if (!el.classList.length) {
      el.removeAttribute('class');
    }
  } else {
    var cur = " " + (el.getAttribute('class') || '') + " ";
    var tar = ' ' + cls + ' ';
    while (cur.indexOf(tar) >= 0) {
      cur = cur.replace(tar, ' ');
    }
    cur = cur.trim();
    if (cur) {
      el.setAttribute('class', cur);
    } else {
      el.removeAttribute('class');
    }
  }
}

/*  */

function resolveTransition (def) {
  if (!def) {
    return
  }
  /* istanbul ignore else */
  if (typeof def === 'object') {
    var res = {};
    if (def.css !== false) {
      extend(res, autoCssTransition(def.name || 'v'));
    }
    extend(res, def);
    return res
  } else if (typeof def === 'string') {
    return autoCssTransition(def)
  }
}

var autoCssTransition = cached(function (name) {
  return {
    enterClass: (name + "-enter"),
    enterToClass: (name + "-enter-to"),
    enterActiveClass: (name + "-enter-active"),
    leaveClass: (name + "-leave"),
    leaveToClass: (name + "-leave-to"),
    leaveActiveClass: (name + "-leave-active")
  }
});

var hasTransition = inBrowser && !isIE9;
var TRANSITION = 'transition';
var ANIMATION = 'animation';

// Transition property/event sniffing
var transitionProp = 'transition';
var transitionEndEvent = 'transitionend';
var animationProp = 'animation';
var animationEndEvent = 'animationend';
if (hasTransition) {
  /* istanbul ignore if */
  if (window.ontransitionend === undefined &&
    window.onwebkittransitionend !== undefined
  ) {
    transitionProp = 'WebkitTransition';
    transitionEndEvent = 'webkitTransitionEnd';
  }
  if (window.onanimationend === undefined &&
    window.onwebkitanimationend !== undefined
  ) {
    animationProp = 'WebkitAnimation';
    animationEndEvent = 'webkitAnimationEnd';
  }
}

// binding to window is necessary to make hot reload work in IE in strict mode
var raf = inBrowser
  ? window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : setTimeout
  : /* istanbul ignore next */ function (fn) { return fn(); };

function nextFrame (fn) {
  raf(function () {
    raf(fn);
  });
}

function addTransitionClass (el, cls) {
  var transitionClasses = el._transitionClasses || (el._transitionClasses = []);
  if (transitionClasses.indexOf(cls) < 0) {
    transitionClasses.push(cls);
    addClass(el, cls);
  }
}

function removeTransitionClass (el, cls) {
  if (el._transitionClasses) {
    remove(el._transitionClasses, cls);
  }
  removeClass(el, cls);
}

function whenTransitionEnds (
  el,
  expectedType,
  cb
) {
  var ref = getTransitionInfo(el, expectedType);
  var type = ref.type;
  var timeout = ref.timeout;
  var propCount = ref.propCount;
  if (!type) { return cb() }
  var event = type === TRANSITION ? transitionEndEvent : animationEndEvent;
  var ended = 0;
  var end = function () {
    el.removeEventListener(event, onEnd);
    cb();
  };
  var onEnd = function (e) {
    if (e.target === el) {
      if (++ended >= propCount) {
        end();
      }
    }
  };
  setTimeout(function () {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(event, onEnd);
}

var transformRE = /\b(transform|all)(,|$)/;

function getTransitionInfo (el, expectedType) {
  var styles = window.getComputedStyle(el);
  var transitionDelays = styles[transitionProp + 'Delay'].split(', ');
  var transitionDurations = styles[transitionProp + 'Duration'].split(', ');
  var transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  var animationDelays = styles[animationProp + 'Delay'].split(', ');
  var animationDurations = styles[animationProp + 'Duration'].split(', ');
  var animationTimeout = getTimeout(animationDelays, animationDurations);

  var type;
  var timeout = 0;
  var propCount = 0;
  /* istanbul ignore if */
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0
      ? transitionTimeout > animationTimeout
        ? TRANSITION
        : ANIMATION
      : null;
    propCount = type
      ? type === TRANSITION
        ? transitionDurations.length
        : animationDurations.length
      : 0;
  }
  var hasTransform =
    type === TRANSITION &&
    transformRE.test(styles[transitionProp + 'Property']);
  return {
    type: type,
    timeout: timeout,
    propCount: propCount,
    hasTransform: hasTransform
  }
}

function getTimeout (delays, durations) {
  /* istanbul ignore next */
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }

  return Math.max.apply(null, durations.map(function (d, i) {
    return toMs(d) + toMs(delays[i])
  }))
}

function toMs (s) {
  return Number(s.slice(0, -1)) * 1000
}

/*  */

function enter (vnode, toggleDisplay) {
  var el = vnode.elm;

  // call leave callback now
  if (isDef(el._leaveCb)) {
    el._leaveCb.cancelled = true;
    el._leaveCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (isUndef(data)) {
    return
  }

  /* istanbul ignore if */
  if (isDef(el._enterCb) || el.nodeType !== 1) {
    return
  }

  var css = data.css;
  var type = data.type;
  var enterClass = data.enterClass;
  var enterToClass = data.enterToClass;
  var enterActiveClass = data.enterActiveClass;
  var appearClass = data.appearClass;
  var appearToClass = data.appearToClass;
  var appearActiveClass = data.appearActiveClass;
  var beforeEnter = data.beforeEnter;
  var enter = data.enter;
  var afterEnter = data.afterEnter;
  var enterCancelled = data.enterCancelled;
  var beforeAppear = data.beforeAppear;
  var appear = data.appear;
  var afterAppear = data.afterAppear;
  var appearCancelled = data.appearCancelled;
  var duration = data.duration;

  // activeInstance will always be the <transition> component managing this
  // transition. One edge case to check is when the <transition> is placed
  // as the root node of a child component. In that case we need to check
  // <transition>'s parent for appear check.
  var context = activeInstance;
  var transitionNode = activeInstance.$vnode;
  while (transitionNode && transitionNode.parent) {
    transitionNode = transitionNode.parent;
    context = transitionNode.context;
  }

  var isAppear = !context._isMounted || !vnode.isRootInsert;

  if (isAppear && !appear && appear !== '') {
    return
  }

  var startClass = isAppear && appearClass
    ? appearClass
    : enterClass;
  var activeClass = isAppear && appearActiveClass
    ? appearActiveClass
    : enterActiveClass;
  var toClass = isAppear && appearToClass
    ? appearToClass
    : enterToClass;

  var beforeEnterHook = isAppear
    ? (beforeAppear || beforeEnter)
    : beforeEnter;
  var enterHook = isAppear
    ? (typeof appear === 'function' ? appear : enter)
    : enter;
  var afterEnterHook = isAppear
    ? (afterAppear || afterEnter)
    : afterEnter;
  var enterCancelledHook = isAppear
    ? (appearCancelled || enterCancelled)
    : enterCancelled;

  var explicitEnterDuration = toNumber(
    isObject(duration)
      ? duration.enter
      : duration
  );

  if (false) {
    checkDuration(explicitEnterDuration, 'enter', vnode);
  }

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(enterHook);

  var cb = el._enterCb = once(function () {
    if (expectsCSS) {
      removeTransitionClass(el, toClass);
      removeTransitionClass(el, activeClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, startClass);
      }
      enterCancelledHook && enterCancelledHook(el);
    } else {
      afterEnterHook && afterEnterHook(el);
    }
    el._enterCb = null;
  });

  if (!vnode.data.show) {
    // remove pending leave element on enter by injecting an insert hook
    mergeVNodeHook(vnode, 'insert', function () {
      var parent = el.parentNode;
      var pendingNode = parent && parent._pending && parent._pending[vnode.key];
      if (pendingNode &&
        pendingNode.tag === vnode.tag &&
        pendingNode.elm._leaveCb
      ) {
        pendingNode.elm._leaveCb();
      }
      enterHook && enterHook(el, cb);
    });
  }

  // start enter transition
  beforeEnterHook && beforeEnterHook(el);
  if (expectsCSS) {
    addTransitionClass(el, startClass);
    addTransitionClass(el, activeClass);
    nextFrame(function () {
      removeTransitionClass(el, startClass);
      if (!cb.cancelled) {
        addTransitionClass(el, toClass);
        if (!userWantsControl) {
          if (isValidDuration(explicitEnterDuration)) {
            setTimeout(cb, explicitEnterDuration);
          } else {
            whenTransitionEnds(el, type, cb);
          }
        }
      }
    });
  }

  if (vnode.data.show) {
    toggleDisplay && toggleDisplay();
    enterHook && enterHook(el, cb);
  }

  if (!expectsCSS && !userWantsControl) {
    cb();
  }
}

function leave (vnode, rm) {
  var el = vnode.elm;

  // call enter callback now
  if (isDef(el._enterCb)) {
    el._enterCb.cancelled = true;
    el._enterCb();
  }

  var data = resolveTransition(vnode.data.transition);
  if (isUndef(data) || el.nodeType !== 1) {
    return rm()
  }

  /* istanbul ignore if */
  if (isDef(el._leaveCb)) {
    return
  }

  var css = data.css;
  var type = data.type;
  var leaveClass = data.leaveClass;
  var leaveToClass = data.leaveToClass;
  var leaveActiveClass = data.leaveActiveClass;
  var beforeLeave = data.beforeLeave;
  var leave = data.leave;
  var afterLeave = data.afterLeave;
  var leaveCancelled = data.leaveCancelled;
  var delayLeave = data.delayLeave;
  var duration = data.duration;

  var expectsCSS = css !== false && !isIE9;
  var userWantsControl = getHookArgumentsLength(leave);

  var explicitLeaveDuration = toNumber(
    isObject(duration)
      ? duration.leave
      : duration
  );

  if (false) {
    checkDuration(explicitLeaveDuration, 'leave', vnode);
  }

  var cb = el._leaveCb = once(function () {
    if (el.parentNode && el.parentNode._pending) {
      el.parentNode._pending[vnode.key] = null;
    }
    if (expectsCSS) {
      removeTransitionClass(el, leaveToClass);
      removeTransitionClass(el, leaveActiveClass);
    }
    if (cb.cancelled) {
      if (expectsCSS) {
        removeTransitionClass(el, leaveClass);
      }
      leaveCancelled && leaveCancelled(el);
    } else {
      rm();
      afterLeave && afterLeave(el);
    }
    el._leaveCb = null;
  });

  if (delayLeave) {
    delayLeave(performLeave);
  } else {
    performLeave();
  }

  function performLeave () {
    // the delayed leave may have already been cancelled
    if (cb.cancelled) {
      return
    }
    // record leaving element
    if (!vnode.data.show) {
      (el.parentNode._pending || (el.parentNode._pending = {}))[(vnode.key)] = vnode;
    }
    beforeLeave && beforeLeave(el);
    if (expectsCSS) {
      addTransitionClass(el, leaveClass);
      addTransitionClass(el, leaveActiveClass);
      nextFrame(function () {
        removeTransitionClass(el, leaveClass);
        if (!cb.cancelled) {
          addTransitionClass(el, leaveToClass);
          if (!userWantsControl) {
            if (isValidDuration(explicitLeaveDuration)) {
              setTimeout(cb, explicitLeaveDuration);
            } else {
              whenTransitionEnds(el, type, cb);
            }
          }
        }
      });
    }
    leave && leave(el, cb);
    if (!expectsCSS && !userWantsControl) {
      cb();
    }
  }
}

// only used in dev mode
function checkDuration (val, name, vnode) {
  if (typeof val !== 'number') {
    warn(
      "<transition> explicit " + name + " duration is not a valid number - " +
      "got " + (JSON.stringify(val)) + ".",
      vnode.context
    );
  } else if (isNaN(val)) {
    warn(
      "<transition> explicit " + name + " duration is NaN - " +
      'the duration expression might be incorrect.',
      vnode.context
    );
  }
}

function isValidDuration (val) {
  return typeof val === 'number' && !isNaN(val)
}

/**
 * Normalize a transition hook's argument length. The hook may be:
 * - a merged hook (invoker) with the original in .fns
 * - a wrapped component method (check ._length)
 * - a plain function (.length)
 */
function getHookArgumentsLength (fn) {
  if (isUndef(fn)) {
    return false
  }
  var invokerFns = fn.fns;
  if (isDef(invokerFns)) {
    // invoker
    return getHookArgumentsLength(
      Array.isArray(invokerFns)
        ? invokerFns[0]
        : invokerFns
    )
  } else {
    return (fn._length || fn.length) > 1
  }
}

function _enter (_, vnode) {
  if (vnode.data.show !== true) {
    enter(vnode);
  }
}

var transition = inBrowser ? {
  create: _enter,
  activate: _enter,
  remove: function remove$$1 (vnode, rm) {
    /* istanbul ignore else */
    if (vnode.data.show !== true) {
      leave(vnode, rm);
    } else {
      rm();
    }
  }
} : {}

var platformModules = [
  attrs,
  klass,
  events,
  domProps,
  style,
  transition
]

/*  */

// the directive module should be applied last, after all
// built-in modules have been applied.
var modules = platformModules.concat(baseModules);

var patch = createPatchFunction({ nodeOps: nodeOps, modules: modules });

/**
 * Not type checking this file because flow doesn't like attaching
 * properties to Elements.
 */

/* istanbul ignore if */
if (isIE9) {
  // http://www.matts411.com/post/internet-explorer-9-oninput/
  document.addEventListener('selectionchange', function () {
    var el = document.activeElement;
    if (el && el.vmodel) {
      trigger(el, 'input');
    }
  });
}

var directive = {
  inserted: function inserted (el, binding, vnode, oldVnode) {
    if (vnode.tag === 'select') {
      // #6903
      if (oldVnode.elm && !oldVnode.elm._vOptions) {
        mergeVNodeHook(vnode, 'postpatch', function () {
          directive.componentUpdated(el, binding, vnode);
        });
      } else {
        setSelected(el, binding, vnode.context);
      }
      el._vOptions = [].map.call(el.options, getValue);
    } else if (vnode.tag === 'textarea' || isTextInputType(el.type)) {
      el._vModifiers = binding.modifiers;
      if (!binding.modifiers.lazy) {
        el.addEventListener('compositionstart', onCompositionStart);
        el.addEventListener('compositionend', onCompositionEnd);
        // Safari < 10.2 & UIWebView doesn't fire compositionend when
        // switching focus before confirming composition choice
        // this also fixes the issue where some browsers e.g. iOS Chrome
        // fires "change" instead of "input" on autocomplete.
        el.addEventListener('change', onCompositionEnd);
        /* istanbul ignore if */
        if (isIE9) {
          el.vmodel = true;
        }
      }
    }
  },

  componentUpdated: function componentUpdated (el, binding, vnode) {
    if (vnode.tag === 'select') {
      setSelected(el, binding, vnode.context);
      // in case the options rendered by v-for have changed,
      // it's possible that the value is out-of-sync with the rendered options.
      // detect such cases and filter out values that no longer has a matching
      // option in the DOM.
      var prevOptions = el._vOptions;
      var curOptions = el._vOptions = [].map.call(el.options, getValue);
      if (curOptions.some(function (o, i) { return !looseEqual(o, prevOptions[i]); })) {
        // trigger change event if
        // no matching option found for at least one value
        var needReset = el.multiple
          ? binding.value.some(function (v) { return hasNoMatchingOption(v, curOptions); })
          : binding.value !== binding.oldValue && hasNoMatchingOption(binding.value, curOptions);
        if (needReset) {
          trigger(el, 'change');
        }
      }
    }
  }
};

function setSelected (el, binding, vm) {
  actuallySetSelected(el, binding, vm);
  /* istanbul ignore if */
  if (isIE || isEdge) {
    setTimeout(function () {
      actuallySetSelected(el, binding, vm);
    }, 0);
  }
}

function actuallySetSelected (el, binding, vm) {
  var value = binding.value;
  var isMultiple = el.multiple;
  if (isMultiple && !Array.isArray(value)) {
    "production" !== 'production' && warn(
      "<select multiple v-model=\"" + (binding.expression) + "\"> " +
      "expects an Array value for its binding, but got " + (Object.prototype.toString.call(value).slice(8, -1)),
      vm
    );
    return
  }
  var selected, option;
  for (var i = 0, l = el.options.length; i < l; i++) {
    option = el.options[i];
    if (isMultiple) {
      selected = looseIndexOf(value, getValue(option)) > -1;
      if (option.selected !== selected) {
        option.selected = selected;
      }
    } else {
      if (looseEqual(getValue(option), value)) {
        if (el.selectedIndex !== i) {
          el.selectedIndex = i;
        }
        return
      }
    }
  }
  if (!isMultiple) {
    el.selectedIndex = -1;
  }
}

function hasNoMatchingOption (value, options) {
  return options.every(function (o) { return !looseEqual(o, value); })
}

function getValue (option) {
  return '_value' in option
    ? option._value
    : option.value
}

function onCompositionStart (e) {
  e.target.composing = true;
}

function onCompositionEnd (e) {
  // prevent triggering an input event for no reason
  if (!e.target.composing) { return }
  e.target.composing = false;
  trigger(e.target, 'input');
}

function trigger (el, type) {
  var e = document.createEvent('HTMLEvents');
  e.initEvent(type, true, true);
  el.dispatchEvent(e);
}

/*  */

// recursively search for possible transition defined inside the component root
function locateNode (vnode) {
  return vnode.componentInstance && (!vnode.data || !vnode.data.transition)
    ? locateNode(vnode.componentInstance._vnode)
    : vnode
}

var show = {
  bind: function bind (el, ref, vnode) {
    var value = ref.value;

    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    var originalDisplay = el.__vOriginalDisplay =
      el.style.display === 'none' ? '' : el.style.display;
    if (value && transition$$1) {
      vnode.data.show = true;
      enter(vnode, function () {
        el.style.display = originalDisplay;
      });
    } else {
      el.style.display = value ? originalDisplay : 'none';
    }
  },

  update: function update (el, ref, vnode) {
    var value = ref.value;
    var oldValue = ref.oldValue;

    /* istanbul ignore if */
    if (!value === !oldValue) { return }
    vnode = locateNode(vnode);
    var transition$$1 = vnode.data && vnode.data.transition;
    if (transition$$1) {
      vnode.data.show = true;
      if (value) {
        enter(vnode, function () {
          el.style.display = el.__vOriginalDisplay;
        });
      } else {
        leave(vnode, function () {
          el.style.display = 'none';
        });
      }
    } else {
      el.style.display = value ? el.__vOriginalDisplay : 'none';
    }
  },

  unbind: function unbind (
    el,
    binding,
    vnode,
    oldVnode,
    isDestroy
  ) {
    if (!isDestroy) {
      el.style.display = el.__vOriginalDisplay;
    }
  }
}

var platformDirectives = {
  model: directive,
  show: show
}

/*  */

// Provides transition support for a single element/component.
// supports transition mode (out-in / in-out)

var transitionProps = {
  name: String,
  appear: Boolean,
  css: Boolean,
  mode: String,
  type: String,
  enterClass: String,
  leaveClass: String,
  enterToClass: String,
  leaveToClass: String,
  enterActiveClass: String,
  leaveActiveClass: String,
  appearClass: String,
  appearActiveClass: String,
  appearToClass: String,
  duration: [Number, String, Object]
};

// in case the child is also an abstract component, e.g. <keep-alive>
// we want to recursively retrieve the real component to be rendered
function getRealChild (vnode) {
  var compOptions = vnode && vnode.componentOptions;
  if (compOptions && compOptions.Ctor.options.abstract) {
    return getRealChild(getFirstComponentChild(compOptions.children))
  } else {
    return vnode
  }
}

function extractTransitionData (comp) {
  var data = {};
  var options = comp.$options;
  // props
  for (var key in options.propsData) {
    data[key] = comp[key];
  }
  // events.
  // extract listeners and pass them directly to the transition methods
  var listeners = options._parentListeners;
  for (var key$1 in listeners) {
    data[camelize(key$1)] = listeners[key$1];
  }
  return data
}

function placeholder (h, rawChild) {
  if (/\d-keep-alive$/.test(rawChild.tag)) {
    return h('keep-alive', {
      props: rawChild.componentOptions.propsData
    })
  }
}

function hasParentTransition (vnode) {
  while ((vnode = vnode.parent)) {
    if (vnode.data.transition) {
      return true
    }
  }
}

function isSameChild (child, oldChild) {
  return oldChild.key === child.key && oldChild.tag === child.tag
}

var Transition = {
  name: 'transition',
  props: transitionProps,
  abstract: true,

  render: function render (h) {
    var this$1 = this;

    var children = this.$slots.default;
    if (!children) {
      return
    }

    // filter out text nodes (possible whitespaces)
    children = children.filter(function (c) { return c.tag || isAsyncPlaceholder(c); });
    /* istanbul ignore if */
    if (!children.length) {
      return
    }

    // warn multiple elements
    if (false) {
      warn(
        '<transition> can only be used on a single element. Use ' +
        '<transition-group> for lists.',
        this.$parent
      );
    }

    var mode = this.mode;

    // warn invalid mode
    if (false
    ) {
      warn(
        'invalid <transition> mode: ' + mode,
        this.$parent
      );
    }

    var rawChild = children[0];

    // if this is a component root node and the component's
    // parent container node also has transition, skip.
    if (hasParentTransition(this.$vnode)) {
      return rawChild
    }

    // apply transition data to child
    // use getRealChild() to ignore abstract components e.g. keep-alive
    var child = getRealChild(rawChild);
    /* istanbul ignore if */
    if (!child) {
      return rawChild
    }

    if (this._leaving) {
      return placeholder(h, rawChild)
    }

    // ensure a key that is unique to the vnode type and to this transition
    // component instance. This key will be used to remove pending leaving nodes
    // during entering.
    var id = "__transition-" + (this._uid) + "-";
    child.key = child.key == null
      ? child.isComment
        ? id + 'comment'
        : id + child.tag
      : isPrimitive(child.key)
        ? (String(child.key).indexOf(id) === 0 ? child.key : id + child.key)
        : child.key;

    var data = (child.data || (child.data = {})).transition = extractTransitionData(this);
    var oldRawChild = this._vnode;
    var oldChild = getRealChild(oldRawChild);

    // mark v-show
    // so that the transition module can hand over the control to the directive
    if (child.data.directives && child.data.directives.some(function (d) { return d.name === 'show'; })) {
      child.data.show = true;
    }

    if (
      oldChild &&
      oldChild.data &&
      !isSameChild(child, oldChild) &&
      !isAsyncPlaceholder(oldChild) &&
      // #6687 component root is a comment node
      !(oldChild.componentInstance && oldChild.componentInstance._vnode.isComment)
    ) {
      // replace old child transition data with fresh one
      // important for dynamic transitions!
      var oldData = oldChild.data.transition = extend({}, data);
      // handle transition mode
      if (mode === 'out-in') {
        // return placeholder node and queue update when leave finishes
        this._leaving = true;
        mergeVNodeHook(oldData, 'afterLeave', function () {
          this$1._leaving = false;
          this$1.$forceUpdate();
        });
        return placeholder(h, rawChild)
      } else if (mode === 'in-out') {
        if (isAsyncPlaceholder(child)) {
          return oldRawChild
        }
        var delayedLeave;
        var performLeave = function () { delayedLeave(); };
        mergeVNodeHook(data, 'afterEnter', performLeave);
        mergeVNodeHook(data, 'enterCancelled', performLeave);
        mergeVNodeHook(oldData, 'delayLeave', function (leave) { delayedLeave = leave; });
      }
    }

    return rawChild
  }
}

/*  */

// Provides transition support for list items.
// supports move transitions using the FLIP technique.

// Because the vdom's children update algorithm is "unstable" - i.e.
// it doesn't guarantee the relative positioning of removed elements,
// we force transition-group to update its children into two passes:
// in the first pass, we remove all nodes that need to be removed,
// triggering their leaving transition; in the second pass, we insert/move
// into the final desired state. This way in the second pass removed
// nodes will remain where they should be.

var props = extend({
  tag: String,
  moveClass: String
}, transitionProps);

delete props.mode;

var TransitionGroup = {
  props: props,

  render: function render (h) {
    var tag = this.tag || this.$vnode.data.tag || 'span';
    var map = Object.create(null);
    var prevChildren = this.prevChildren = this.children;
    var rawChildren = this.$slots.default || [];
    var children = this.children = [];
    var transitionData = extractTransitionData(this);

    for (var i = 0; i < rawChildren.length; i++) {
      var c = rawChildren[i];
      if (c.tag) {
        if (c.key != null && String(c.key).indexOf('__vlist') !== 0) {
          children.push(c);
          map[c.key] = c
          ;(c.data || (c.data = {})).transition = transitionData;
        } else if (false) {
          var opts = c.componentOptions;
          var name = opts ? (opts.Ctor.options.name || opts.tag || '') : c.tag;
          warn(("<transition-group> children must be keyed: <" + name + ">"));
        }
      }
    }

    if (prevChildren) {
      var kept = [];
      var removed = [];
      for (var i$1 = 0; i$1 < prevChildren.length; i$1++) {
        var c$1 = prevChildren[i$1];
        c$1.data.transition = transitionData;
        c$1.data.pos = c$1.elm.getBoundingClientRect();
        if (map[c$1.key]) {
          kept.push(c$1);
        } else {
          removed.push(c$1);
        }
      }
      this.kept = h(tag, null, kept);
      this.removed = removed;
    }

    return h(tag, null, children)
  },

  beforeUpdate: function beforeUpdate () {
    // force removing pass
    this.__patch__(
      this._vnode,
      this.kept,
      false, // hydrating
      true // removeOnly (!important, avoids unnecessary moves)
    );
    this._vnode = this.kept;
  },

  updated: function updated () {
    var children = this.prevChildren;
    var moveClass = this.moveClass || ((this.name || 'v') + '-move');
    if (!children.length || !this.hasMove(children[0].elm, moveClass)) {
      return
    }

    // we divide the work into three loops to avoid mixing DOM reads and writes
    // in each iteration - which helps prevent layout thrashing.
    children.forEach(callPendingCbs);
    children.forEach(recordPosition);
    children.forEach(applyTranslation);

    // force reflow to put everything in position
    // assign to this to avoid being removed in tree-shaking
    // $flow-disable-line
    this._reflow = document.body.offsetHeight;

    children.forEach(function (c) {
      if (c.data.moved) {
        var el = c.elm;
        var s = el.style;
        addTransitionClass(el, moveClass);
        s.transform = s.WebkitTransform = s.transitionDuration = '';
        el.addEventListener(transitionEndEvent, el._moveCb = function cb (e) {
          if (!e || /transform$/.test(e.propertyName)) {
            el.removeEventListener(transitionEndEvent, cb);
            el._moveCb = null;
            removeTransitionClass(el, moveClass);
          }
        });
      }
    });
  },

  methods: {
    hasMove: function hasMove (el, moveClass) {
      /* istanbul ignore if */
      if (!hasTransition) {
        return false
      }
      /* istanbul ignore if */
      if (this._hasMove) {
        return this._hasMove
      }
      // Detect whether an element with the move class applied has
      // CSS transitions. Since the element may be inside an entering
      // transition at this very moment, we make a clone of it and remove
      // all other transition classes applied to ensure only the move class
      // is applied.
      var clone = el.cloneNode();
      if (el._transitionClasses) {
        el._transitionClasses.forEach(function (cls) { removeClass(clone, cls); });
      }
      addClass(clone, moveClass);
      clone.style.display = 'none';
      this.$el.appendChild(clone);
      var info = getTransitionInfo(clone);
      this.$el.removeChild(clone);
      return (this._hasMove = info.hasTransform)
    }
  }
}

function callPendingCbs (c) {
  /* istanbul ignore if */
  if (c.elm._moveCb) {
    c.elm._moveCb();
  }
  /* istanbul ignore if */
  if (c.elm._enterCb) {
    c.elm._enterCb();
  }
}

function recordPosition (c) {
  c.data.newPos = c.elm.getBoundingClientRect();
}

function applyTranslation (c) {
  var oldPos = c.data.pos;
  var newPos = c.data.newPos;
  var dx = oldPos.left - newPos.left;
  var dy = oldPos.top - newPos.top;
  if (dx || dy) {
    c.data.moved = true;
    var s = c.elm.style;
    s.transform = s.WebkitTransform = "translate(" + dx + "px," + dy + "px)";
    s.transitionDuration = '0s';
  }
}

var platformComponents = {
  Transition: Transition,
  TransitionGroup: TransitionGroup
}

/*  */

// install platform specific utils
Vue.config.mustUseProp = mustUseProp;
Vue.config.isReservedTag = isReservedTag;
Vue.config.isReservedAttr = isReservedAttr;
Vue.config.getTagNamespace = getTagNamespace;
Vue.config.isUnknownElement = isUnknownElement;

// install platform runtime directives & components
extend(Vue.options.directives, platformDirectives);
extend(Vue.options.components, platformComponents);

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop;

// public mount method
Vue.prototype.$mount = function (
  el,
  hydrating
) {
  el = el && inBrowser ? query(el) : undefined;
  return mountComponent(this, el, hydrating)
};

// devtools global hook
/* istanbul ignore next */
if (inBrowser) {
  setTimeout(function () {
    if (config.devtools) {
      if (devtools) {
        devtools.emit('init', Vue);
      } else if (
        false
      ) {
        console[console.info ? 'info' : 'log'](
          'Download the Vue Devtools extension for a better development experience:\n' +
          'https://github.com/vuejs/vue-devtools'
        );
      }
    }
    if (false
    ) {
      console[console.info ? 'info' : 'log'](
        "You are running Vue in development mode.\n" +
        "Make sure to turn on production mode when deploying for production.\n" +
        "See more tips at https://vuejs.org/guide/deployment.html"
      );
    }
  }, 0);
}

/*  */

/* harmony default export */ __webpack_exports__["default"] = (Vue);

/* WEBPACK VAR INJECTION */}.call(__webpack_exports__, __webpack_require__(4), __webpack_require__(20).setImmediate))

/***/ }),
/* 4 */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1,eval)("this");
} catch(e) {
	// This works if the window reference is available
	if(typeof window === "object")
		g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__style_index_css__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__style_index_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__style_index_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__style_module_css__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__style_module_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__style_module_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_app_app_vue__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_app_app_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__pages_app_app_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__router__ = __webpack_require__(19);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__mixins_mixin__ = __webpack_require__(48);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_vue_ydui_dist_ydui_base_css__ = __webpack_require__(49);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_vue_ydui_dist_ydui_base_css___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5_vue_ydui_dist_ydui_base_css__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_vue_ydui__ = __webpack_require__(50);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6_vue_ydui___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_6_vue_ydui__);



// import lbCom from './components'





Vue.use(Vuex);
Vue.mixin(__WEBPACK_IMPORTED_MODULE_4__mixins_mixin__["a" /* default */]);
// Vue.use(lbCom)
Vue.use(__WEBPACK_IMPORTED_MODULE_6_vue_ydui___default.a);

new Vue({
    el: '#app',
    router: __WEBPACK_IMPORTED_MODULE_3__router__["a" /* default */],
    render: h => h(__WEBPACK_IMPORTED_MODULE_2__pages_app_app_vue___default.a)
});

/***/ }),
/* 6 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 7 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(9)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(12),
  /* template */
  __webpack_require__(18),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(10);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("2b5be705", content, true);

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, ".lo_nav{position:fixed;bottom:0}", ""]);

// exports


/***/ }),
/* 11 */
/***/ (function(module, exports) {

/**
 * Translates the list format produced by css-loader into something
 * easier to manipulate.
 */
module.exports = function listToStyles (parentId, list) {
  var styles = []
  var newStyles = {}
  for (var i = 0; i < list.length; i++) {
    var item = list[i]
    var id = item[0]
    var css = item[1]
    var media = item[2]
    var sourceMap = item[3]
    var part = {
      id: parentId + ':' + i,
      css: css,
      media: media,
      sourceMap: sourceMap
    }
    if (!newStyles[id]) {
      styles.push(newStyles[id] = { id: id, parts: [part] })
    } else {
      newStyles[id].parts.push(part)
    }
  }
  return styles
}


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nav_vue__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__nav_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__nav_vue__);
//
//
//
//
//
//
//
//
//
//
//
//
//



/* harmony default export */ __webpack_exports__["default"] = ({
    name: 'app',
    data() {

        return {};
    },
    components: {
        'lo-nav': __WEBPACK_IMPORTED_MODULE_0__nav_vue___default.a
    },
    computed: {},
    watch: {},
    methods: {}
});

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(14)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(16),
  /* template */
  __webpack_require__(17),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(15);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("1ff7827e", content, true);

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, ".yd-tabbar-icon img{height:83%!important}", ""]);

// exports


/***/ }),
/* 16 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    data() {
        return {
            istrend: true,
            isdetailview: false,
            isexplain: false,
            isperson: false
        };
    },
    watch: {
        "$route": "routelinkchange"
    },
    computed: {},
    methods: {
        routelinkchange() {
            let path = this.$route.path;
            // console.log(path)
            if (path == '/' || path == "/trend") {
                this.istrend = true;
                this.isdetailview = false;
                this.isexplain = false;
                this.isperson = false;
                console.log('0000', this.istrend, this.isdetailview, this.isexplain, this.isperson);
            } else if (path == '/detailview') {
                this.isdetailview = true;
                this.istrend = false;
                this.isexplain = false;
                this.isperson = false;
                console.log('0000', this.istrend, this.isdetailview, this.isexplain, this.isperson);
            } else if (path == '/explain') {
                this.isdetailview = false;
                this.istrend = false;
                this.isexplain = true;
                this.isperson = false;
                console.log('0000', this.istrend, this.isdetailview, this.isexplain, this.isperson);
            } else if (path == '/person') {
                this.isdetailview = false;
                this.istrend = false;
                this.isexplain = false;
                this.isperson = true;
                console.log('0000', this.istrend, this.isdetailview, this.isexplain, this.isperson);
            }
        }
    }
});

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('yd-tabbar', {
    attrs: {
      "active-color": "#ed293f"
    }
  }, [_c('yd-tabbar-item', {
    attrs: {
      "title": "首页",
      "link": "/",
      "active": _vm.istrend
    }
  }, [(!_vm.istrend) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/trend.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e(), _vm._v(" "), (_vm.istrend) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/trend-active.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e()]), _vm._v(" "), _c('yd-tabbar-item', {
    attrs: {
      "title": "购物车",
      "link": "/detailview",
      "active": _vm.isdetailview
    }
  }, [(!_vm.isdetailview) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/detail.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e(), _vm._v(" "), (_vm.isdetailview) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/detail-active.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e()]), _vm._v(" "), _c('yd-tabbar-item', {
    attrs: {
      "title": "个人中心",
      "link": "/explain",
      "active": _vm.isexplain
    }
  }, [(!_vm.isexplain) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/explain.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e(), _vm._v(" "), (_vm.isexplain) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/explain-active.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e()]), _vm._v(" "), _c('yd-tabbar-item', {
    attrs: {
      "title": "图片",
      "link": "/person",
      "active": _vm.isperson
    }
  }, [(!_vm.isperson) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/person.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e(), _vm._v(" "), (_vm.isperson) ? _c('img', {
    attrs: {
      "slot": "icon",
      "src": "/assets/images/person-active.png",
      "size": "0.54rem"
    },
    slot: "icon"
  }) : _vm._e()])], 1)
},staticRenderFns: []}

/***/ }),
/* 18 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', [_c('router-view'), _vm._v(" "), _c('lo-nav', {
    staticClass: "lo_nav"
  })], 1)
},staticRenderFns: []}

/***/ }),
/* 19 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_router__ = __webpack_require__(23);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_view_trend_vue__ = __webpack_require__(24);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__pages_view_trend_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2__pages_view_trend_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__pages_view_detailview_vue__ = __webpack_require__(32);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__pages_view_detailview_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3__pages_view_detailview_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__pages_view_person_vue__ = __webpack_require__(37);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__pages_view_person_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4__pages_view_person_vue__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__pages_view_explain_vue__ = __webpack_require__(43);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__pages_view_explain_vue___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_5__pages_view_explain_vue__);








__WEBPACK_IMPORTED_MODULE_0_vue__["default"].use(__WEBPACK_IMPORTED_MODULE_1_vue_router__["a" /* default */]);

/* harmony default export */ __webpack_exports__["a"] = (new __WEBPACK_IMPORTED_MODULE_1_vue_router__["a" /* default */]({
  routes: [{
    path: '/',
    name: 'trends',
    component: __WEBPACK_IMPORTED_MODULE_2__pages_view_trend_vue___default.a
  }, {
    path: '/trend',
    name: 'trend',
    component: __WEBPACK_IMPORTED_MODULE_2__pages_view_trend_vue___default.a
  }, {
    path: '/detailview',
    name: 'detailview',
    component: __WEBPACK_IMPORTED_MODULE_3__pages_view_detailview_vue___default.a
  }, {
    path: '/explain',
    name: 'explain',
    component: __WEBPACK_IMPORTED_MODULE_5__pages_view_explain_vue___default.a
  }, {
    path: '/person',
    name: 'person',
    component: __WEBPACK_IMPORTED_MODULE_4__pages_view_person_vue___default.a
  }]
}));

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {var apply = Function.prototype.apply;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) {
  if (timeout) {
    timeout.close();
  }
};

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// setimmediate attaches itself to the global object
__webpack_require__(21);
// On some exotic environments, it's not clear which object `setimmeidate` was
// able to install onto.  Search each possibility in the same order as the
// `setimmediate` library.
exports.setImmediate = (typeof self !== "undefined" && self.setImmediate) ||
                       (typeof global !== "undefined" && global.setImmediate) ||
                       (this && this.setImmediate);
exports.clearImmediate = (typeof self !== "undefined" && self.clearImmediate) ||
                         (typeof global !== "undefined" && global.clearImmediate) ||
                         (this && this.clearImmediate);

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4)))

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(4), __webpack_require__(22)))

/***/ }),
/* 22 */
/***/ (function(module, exports) {

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };


/***/ }),
/* 23 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
  * vue-router v2.8.1
  * (c) 2017 Evan You
  * @license MIT
  */
/*  */

function assert (condition, message) {
  if (!condition) {
    throw new Error(("[vue-router] " + message))
  }
}

function warn (condition, message) {
  if (false) {
    typeof console !== 'undefined' && console.warn(("[vue-router] " + message));
  }
}

function isError (err) {
  return Object.prototype.toString.call(err).indexOf('Error') > -1
}

var View = {
  name: 'router-view',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render: function render (_, ref) {
    var props = ref.props;
    var children = ref.children;
    var parent = ref.parent;
    var data = ref.data;

    data.routerView = true;

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    var h = parent.$createElement;
    var name = props.name;
    var route = parent.$route;
    var cache = parent._routerViewCache || (parent._routerViewCache = {});

    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    var depth = 0;
    var inactive = false;
    while (parent && parent._routerRoot !== parent) {
      if (parent.$vnode && parent.$vnode.data.routerView) {
        depth++;
      }
      if (parent._inactive) {
        inactive = true;
      }
      parent = parent.$parent;
    }
    data.routerViewDepth = depth;

    // render previous view if the tree is inactive and kept-alive
    if (inactive) {
      return h(cache[name], data, children)
    }

    var matched = route.matched[depth];
    // render empty node if no matched route
    if (!matched) {
      cache[name] = null;
      return h()
    }

    var component = cache[name] = matched.components[name];

    // attach instance registration hook
    // this will be called in the instance's injected lifecycle hooks
    data.registerRouteInstance = function (vm, val) {
      // val could be undefined for unregistration
      var current = matched.instances[name];
      if (
        (val && current !== vm) ||
        (!val && current === vm)
      ) {
        matched.instances[name] = val;
      }
    }

    // also register instance in prepatch hook
    // in case the same component instance is reused across different routes
    ;(data.hook || (data.hook = {})).prepatch = function (_, vnode) {
      matched.instances[name] = vnode.componentInstance;
    };

    // resolve props
    var propsToPass = data.props = resolveProps(route, matched.props && matched.props[name]);
    if (propsToPass) {
      // clone to prevent mutation
      propsToPass = data.props = extend({}, propsToPass);
      // pass non-declared props as attrs
      var attrs = data.attrs = data.attrs || {};
      for (var key in propsToPass) {
        if (!component.props || !(key in component.props)) {
          attrs[key] = propsToPass[key];
          delete propsToPass[key];
        }
      }
    }

    return h(component, data, children)
  }
};

function resolveProps (route, config) {
  switch (typeof config) {
    case 'undefined':
      return
    case 'object':
      return config
    case 'function':
      return config(route)
    case 'boolean':
      return config ? route.params : undefined
    default:
      if (false) {
        warn(
          false,
          "props in \"" + (route.path) + "\" is a " + (typeof config) + ", " +
          "expecting an object, function or boolean."
        );
      }
  }
}

function extend (to, from) {
  for (var key in from) {
    to[key] = from[key];
  }
  return to
}

/*  */

var encodeReserveRE = /[!'()*]/g;
var encodeReserveReplacer = function (c) { return '%' + c.charCodeAt(0).toString(16); };
var commaRE = /%2C/g;

// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
var encode = function (str) { return encodeURIComponent(str)
  .replace(encodeReserveRE, encodeReserveReplacer)
  .replace(commaRE, ','); };

var decode = decodeURIComponent;

function resolveQuery (
  query,
  extraQuery,
  _parseQuery
) {
  if ( extraQuery === void 0 ) extraQuery = {};

  var parse = _parseQuery || parseQuery;
  var parsedQuery;
  try {
    parsedQuery = parse(query || '');
  } catch (e) {
    "production" !== 'production' && warn(false, e.message);
    parsedQuery = {};
  }
  for (var key in extraQuery) {
    parsedQuery[key] = extraQuery[key];
  }
  return parsedQuery
}

function parseQuery (query) {
  var res = {};

  query = query.trim().replace(/^(\?|#|&)/, '');

  if (!query) {
    return res
  }

  query.split('&').forEach(function (param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = decode(parts.shift());
    var val = parts.length > 0
      ? decode(parts.join('='))
      : null;

    if (res[key] === undefined) {
      res[key] = val;
    } else if (Array.isArray(res[key])) {
      res[key].push(val);
    } else {
      res[key] = [res[key], val];
    }
  });

  return res
}

function stringifyQuery (obj) {
  var res = obj ? Object.keys(obj).map(function (key) {
    var val = obj[key];

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return encode(key)
    }

    if (Array.isArray(val)) {
      var result = [];
      val.forEach(function (val2) {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(encode(key));
        } else {
          result.push(encode(key) + '=' + encode(val2));
        }
      });
      return result.join('&')
    }

    return encode(key) + '=' + encode(val)
  }).filter(function (x) { return x.length > 0; }).join('&') : null;
  return res ? ("?" + res) : ''
}

/*  */


var trailingSlashRE = /\/?$/;

function createRoute (
  record,
  location,
  redirectedFrom,
  router
) {
  var stringifyQuery$$1 = router && router.options.stringifyQuery;

  var query = location.query || {};
  try {
    query = clone(query);
  } catch (e) {}

  var route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query: query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery$$1),
    matched: record ? formatMatch(record) : []
  };
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery$$1);
  }
  return Object.freeze(route)
}

function clone (value) {
  if (Array.isArray(value)) {
    return value.map(clone)
  } else if (value && typeof value === 'object') {
    var res = {};
    for (var key in value) {
      res[key] = clone(value[key]);
    }
    return res
  } else {
    return value
  }
}

// the starting route that represents the initial state
var START = createRoute(null, {
  path: '/'
});

function formatMatch (record) {
  var res = [];
  while (record) {
    res.unshift(record);
    record = record.parent;
  }
  return res
}

function getFullPath (
  ref,
  _stringifyQuery
) {
  var path = ref.path;
  var query = ref.query; if ( query === void 0 ) query = {};
  var hash = ref.hash; if ( hash === void 0 ) hash = '';

  var stringify = _stringifyQuery || stringifyQuery;
  return (path || '/') + stringify(query) + hash
}

function isSameRoute (a, b) {
  if (b === START) {
    return a === b
  } else if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  } else {
    return false
  }
}

function isObjectEqual (a, b) {
  if ( a === void 0 ) a = {};
  if ( b === void 0 ) b = {};

  // handle null value #1566
  if (!a || !b) { return a === b }
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(function (key) {
    var aVal = a[key];
    var bVal = b[key];
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}

function isIncludedRoute (current, target) {
  return (
    current.path.replace(trailingSlashRE, '/').indexOf(
      target.path.replace(trailingSlashRE, '/')
    ) === 0 &&
    (!target.hash || current.hash === target.hash) &&
    queryIncludes(current.query, target.query)
  )
}

function queryIncludes (current, target) {
  for (var key in target) {
    if (!(key in current)) {
      return false
    }
  }
  return true
}

/*  */

// work around weird flow bug
var toTypes = [String, Object];
var eventTypes = [String, Array];

var Link = {
  name: 'router-link',
  props: {
    to: {
      type: toTypes,
      required: true
    },
    tag: {
      type: String,
      default: 'a'
    },
    exact: Boolean,
    append: Boolean,
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    event: {
      type: eventTypes,
      default: 'click'
    }
  },
  render: function render (h) {
    var this$1 = this;

    var router = this.$router;
    var current = this.$route;
    var ref = router.resolve(this.to, current, this.append);
    var location = ref.location;
    var route = ref.route;
    var href = ref.href;

    var classes = {};
    var globalActiveClass = router.options.linkActiveClass;
    var globalExactActiveClass = router.options.linkExactActiveClass;
    // Support global empty active class
    var activeClassFallback = globalActiveClass == null
            ? 'router-link-active'
            : globalActiveClass;
    var exactActiveClassFallback = globalExactActiveClass == null
            ? 'router-link-exact-active'
            : globalExactActiveClass;
    var activeClass = this.activeClass == null
            ? activeClassFallback
            : this.activeClass;
    var exactActiveClass = this.exactActiveClass == null
            ? exactActiveClassFallback
            : this.exactActiveClass;
    var compareTarget = location.path
      ? createRoute(null, location, null, router)
      : route;

    classes[exactActiveClass] = isSameRoute(current, compareTarget);
    classes[activeClass] = this.exact
      ? classes[exactActiveClass]
      : isIncludedRoute(current, compareTarget);

    var handler = function (e) {
      if (guardEvent(e)) {
        if (this$1.replace) {
          router.replace(location);
        } else {
          router.push(location);
        }
      }
    };

    var on = { click: guardEvent };
    if (Array.isArray(this.event)) {
      this.event.forEach(function (e) { on[e] = handler; });
    } else {
      on[this.event] = handler;
    }

    var data = {
      class: classes
    };

    if (this.tag === 'a') {
      data.on = on;
      data.attrs = { href: href };
    } else {
      // find the first <a> child and apply listener and href
      var a = findAnchor(this.$slots.default);
      if (a) {
        // in case the <a> is a static node
        a.isStatic = false;
        var extend = _Vue.util.extend;
        var aData = a.data = extend({}, a.data);
        aData.on = on;
        var aAttrs = a.data.attrs = extend({}, a.data.attrs);
        aAttrs.href = href;
      } else {
        // doesn't have <a> child, apply listener to self
        data.on = on;
      }
    }

    return h(this.tag, data, this.$slots.default)
  }
};

function guardEvent (e) {
  // don't redirect with control keys
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) { return }
  // don't redirect when preventDefault called
  if (e.defaultPrevented) { return }
  // don't redirect on right click
  if (e.button !== undefined && e.button !== 0) { return }
  // don't redirect if `target="_blank"`
  if (e.currentTarget && e.currentTarget.getAttribute) {
    var target = e.currentTarget.getAttribute('target');
    if (/\b_blank\b/i.test(target)) { return }
  }
  // this may be a Weex event which doesn't have this method
  if (e.preventDefault) {
    e.preventDefault();
  }
  return true
}

function findAnchor (children) {
  if (children) {
    var child;
    for (var i = 0; i < children.length; i++) {
      child = children[i];
      if (child.tag === 'a') {
        return child
      }
      if (child.children && (child = findAnchor(child.children))) {
        return child
      }
    }
  }
}

var _Vue;

function install (Vue) {
  if (install.installed && _Vue === Vue) { return }
  install.installed = true;

  _Vue = Vue;

  var isDef = function (v) { return v !== undefined; };

  var registerInstance = function (vm, callVal) {
    var i = vm.$options._parentVnode;
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal);
    }
  };

  Vue.mixin({
    beforeCreate: function beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this;
        this._router = this.$options.router;
        this._router.init(this);
        Vue.util.defineReactive(this, '_route', this._router.history.current);
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this;
      }
      registerInstance(this, this);
    },
    destroyed: function destroyed () {
      registerInstance(this);
    }
  });

  Object.defineProperty(Vue.prototype, '$router', {
    get: function get () { return this._routerRoot._router }
  });

  Object.defineProperty(Vue.prototype, '$route', {
    get: function get () { return this._routerRoot._route }
  });

  Vue.component('router-view', View);
  Vue.component('router-link', Link);

  var strats = Vue.config.optionMergeStrategies;
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created;
}

/*  */

var inBrowser = typeof window !== 'undefined';

/*  */

function resolvePath (
  relative,
  base,
  append
) {
  var firstChar = relative.charAt(0);
  if (firstChar === '/') {
    return relative
  }

  if (firstChar === '?' || firstChar === '#') {
    return base + relative
  }

  var stack = base.split('/');

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)
  if (!append || !stack[stack.length - 1]) {
    stack.pop();
  }

  // resolve relative path
  var segments = relative.replace(/^\//, '').split('/');
  for (var i = 0; i < segments.length; i++) {
    var segment = segments[i];
    if (segment === '..') {
      stack.pop();
    } else if (segment !== '.') {
      stack.push(segment);
    }
  }

  // ensure leading slash
  if (stack[0] !== '') {
    stack.unshift('');
  }

  return stack.join('/')
}

function parsePath (path) {
  var hash = '';
  var query = '';

  var hashIndex = path.indexOf('#');
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex);
    path = path.slice(0, hashIndex);
  }

  var queryIndex = path.indexOf('?');
  if (queryIndex >= 0) {
    query = path.slice(queryIndex + 1);
    path = path.slice(0, queryIndex);
  }

  return {
    path: path,
    query: query,
    hash: hash
  }
}

function cleanPath (path) {
  return path.replace(/\/\//g, '/')
}

var isarray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

/**
 * Expose `pathToRegexp`.
 */
var pathToRegexp_1 = pathToRegexp;
var parse_1 = parse;
var compile_1 = compile;
var tokensToFunction_1 = tokensToFunction;
var tokensToRegExp_1 = tokensToRegExp;

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g');

/**
 * Parse a string for the raw tokens.
 *
 * @param  {string}  str
 * @param  {Object=} options
 * @return {!Array}
 */
function parse (str, options) {
  var tokens = [];
  var key = 0;
  var index = 0;
  var path = '';
  var defaultDelimiter = options && options.delimiter || '/';
  var res;

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0];
    var escaped = res[1];
    var offset = res.index;
    path += str.slice(index, offset);
    index = offset + m.length;

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1];
      continue
    }

    var next = str[index];
    var prefix = res[2];
    var name = res[3];
    var capture = res[4];
    var group = res[5];
    var modifier = res[6];
    var asterisk = res[7];

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path);
      path = '';
    }

    var partial = prefix != null && next != null && next !== prefix;
    var repeat = modifier === '+' || modifier === '*';
    var optional = modifier === '?' || modifier === '*';
    var delimiter = res[2] || defaultDelimiter;
    var pattern = capture || group;

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      partial: partial,
      asterisk: !!asterisk,
      pattern: pattern ? escapeGroup(pattern) : (asterisk ? '.*' : '[^' + escapeString(delimiter) + ']+?')
    });
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index);
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path);
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {string}             str
 * @param  {Object=}            options
 * @return {!function(Object=, Object=)}
 */
function compile (str, options) {
  return tokensToFunction(parse(str, options))
}

/**
 * Prettier encoding of URI path segments.
 *
 * @param  {string}
 * @return {string}
 */
function encodeURIComponentPretty (str) {
  return encodeURI(str).replace(/[\/?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Encode the asterisk parameter. Similar to `pretty`, but allows slashes.
 *
 * @param  {string}
 * @return {string}
 */
function encodeAsterisk (str) {
  return encodeURI(str).replace(/[?#]/g, function (c) {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase()
  })
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length);

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$');
    }
  }

  return function (obj, opts) {
    var path = '';
    var data = obj || {};
    var options = opts || {};
    var encode = options.pretty ? encodeURIComponentPretty : encodeURIComponent;

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === 'string') {
        path += token;

        continue
      }

      var value = data[token.name];
      var segment;

      if (value == null) {
        if (token.optional) {
          // Prepend partial segment prefixes.
          if (token.partial) {
            path += token.prefix;
          }

          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received `' + JSON.stringify(value) + '`')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encode(value[j]);

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received `' + JSON.stringify(segment) + '`')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment;
        }

        continue
      }

      segment = token.asterisk ? encodeAsterisk(value) : encode(value);

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment;
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {string} str
 * @return {string}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/\\])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {string} group
 * @return {string}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {!RegExp} re
 * @param  {Array}   keys
 * @return {!RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys;
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {string}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {!RegExp} path
 * @param  {!Array}  keys
 * @return {!RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        partial: false,
        asterisk: false,
        pattern: null
      });
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {!Array}  path
 * @param  {Array}   keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = [];

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source);
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {string}  path
 * @param  {!Array}  keys
 * @param  {!Object} options
 * @return {!RegExp}
 */
function stringToRegexp (path, keys, options) {
  return tokensToRegExp(parse(path, options), keys, options)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {!Array}          tokens
 * @param  {(Array|Object)=} keys
 * @param  {Object=}         options
 * @return {!RegExp}
 */
function tokensToRegExp (tokens, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  var strict = options.strict;
  var end = options.end !== false;
  var route = '';

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];

    if (typeof token === 'string') {
      route += escapeString(token);
    } else {
      var prefix = escapeString(token.prefix);
      var capture = '(?:' + token.pattern + ')';

      keys.push(token);

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*';
      }

      if (token.optional) {
        if (!token.partial) {
          capture = '(?:' + prefix + '(' + capture + '))?';
        } else {
          capture = prefix + '(' + capture + ')?';
        }
      } else {
        capture = prefix + '(' + capture + ')';
      }

      route += capture;
    }
  }

  var delimiter = escapeString(options.delimiter || '/');
  var endsWithDelimiter = route.slice(-delimiter.length) === delimiter;

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithDelimiter ? route.slice(0, -delimiter.length) : route) + '(?:' + delimiter + '(?=$))?';
  }

  if (end) {
    route += '$';
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithDelimiter ? '' : '(?=' + delimiter + '|$)';
  }

  return attachKeys(new RegExp('^' + route, flags(options)), keys)
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(string|RegExp|Array)} path
 * @param  {(Array|Object)=}       keys
 * @param  {Object=}               options
 * @return {!RegExp}
 */
function pathToRegexp (path, keys, options) {
  if (!isarray(keys)) {
    options = /** @type {!Object} */ (keys || options);
    keys = [];
  }

  options = options || {};

  if (path instanceof RegExp) {
    return regexpToRegexp(path, /** @type {!Array} */ (keys))
  }

  if (isarray(path)) {
    return arrayToRegexp(/** @type {!Array} */ (path), /** @type {!Array} */ (keys), options)
  }

  return stringToRegexp(/** @type {string} */ (path), /** @type {!Array} */ (keys), options)
}

pathToRegexp_1.parse = parse_1;
pathToRegexp_1.compile = compile_1;
pathToRegexp_1.tokensToFunction = tokensToFunction_1;
pathToRegexp_1.tokensToRegExp = tokensToRegExp_1;

/*  */

// $flow-disable-line
var regexpCompileCache = Object.create(null);

function fillParams (
  path,
  params,
  routeMsg
) {
  try {
    var filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = pathToRegexp_1.compile(path));
    return filler(params || {}, { pretty: true })
  } catch (e) {
    if (false) {
      warn(false, ("missing param for " + routeMsg + ": " + (e.message)));
    }
    return ''
  }
}

/*  */

function createRouteMap (
  routes,
  oldPathList,
  oldPathMap,
  oldNameMap
) {
  // the path list is used to control path matching priority
  var pathList = oldPathList || [];
  // $flow-disable-line
  var pathMap = oldPathMap || Object.create(null);
  // $flow-disable-line
  var nameMap = oldNameMap || Object.create(null);

  routes.forEach(function (route) {
    addRouteRecord(pathList, pathMap, nameMap, route);
  });

  // ensure wildcard routes are always at the end
  for (var i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0]);
      l--;
      i--;
    }
  }

  return {
    pathList: pathList,
    pathMap: pathMap,
    nameMap: nameMap
  }
}

function addRouteRecord (
  pathList,
  pathMap,
  nameMap,
  route,
  parent,
  matchAs
) {
  var path = route.path;
  var name = route.name;
  if (false) {
    assert(path != null, "\"path\" is required in a route configuration.");
    assert(
      typeof route.component !== 'string',
      "route config \"component\" for path: " + (String(path || name)) + " cannot be a " +
      "string id. Use an actual component instead."
    );
  }

  var pathToRegexpOptions = route.pathToRegexpOptions || {};
  var normalizedPath = normalizePath(
    path,
    parent,
    pathToRegexpOptions.strict
  );

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive;
  }

  var record = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name: name,
    parent: parent,
    matchAs: matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props: route.props == null
      ? {}
      : route.components
        ? route.props
        : { default: route.props }
  };

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (false) {
      if (route.name && !route.redirect && route.children.some(function (child) { return /^\/?$/.test(child.path); })) {
        warn(
          false,
          "Named Route '" + (route.name) + "' has a default child route. " +
          "When navigating to this named route (:to=\"{name: '" + (route.name) + "'\"), " +
          "the default child route will not be rendered. Remove the name from " +
          "this route and use the name of the default child route for named " +
          "links instead."
        );
      }
    }
    route.children.forEach(function (child) {
      var childMatchAs = matchAs
        ? cleanPath((matchAs + "/" + (child.path)))
        : undefined;
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs);
    });
  }

  if (route.alias !== undefined) {
    var aliases = Array.isArray(route.alias)
      ? route.alias
      : [route.alias];

    aliases.forEach(function (alias) {
      var aliasRoute = {
        path: alias,
        children: route.children
      };
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      );
    });
  }

  if (!pathMap[record.path]) {
    pathList.push(record.path);
    pathMap[record.path] = record;
  }

  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record;
    } else if (false) {
      warn(
        false,
        "Duplicate named routes definition: " +
        "{ name: \"" + name + "\", path: \"" + (record.path) + "\" }"
      );
    }
  }
}

function compileRouteRegex (path, pathToRegexpOptions) {
  var regex = pathToRegexp_1(path, [], pathToRegexpOptions);
  if (false) {
    var keys = Object.create(null);
    regex.keys.forEach(function (key) {
      warn(!keys[key.name], ("Duplicate param keys in route with path: \"" + path + "\""));
      keys[key.name] = true;
    });
  }
  return regex
}

function normalizePath (path, parent, strict) {
  if (!strict) { path = path.replace(/\/$/, ''); }
  if (path[0] === '/') { return path }
  if (parent == null) { return path }
  return cleanPath(((parent.path) + "/" + path))
}

/*  */


function normalizeLocation (
  raw,
  current,
  append,
  router
) {
  var next = typeof raw === 'string' ? { path: raw } : raw;
  // named target
  if (next.name || next._normalized) {
    return next
  }

  // relative params
  if (!next.path && next.params && current) {
    next = assign({}, next);
    next._normalized = true;
    var params = assign(assign({}, current.params), next.params);
    if (current.name) {
      next.name = current.name;
      next.params = params;
    } else if (current.matched.length) {
      var rawPath = current.matched[current.matched.length - 1].path;
      next.path = fillParams(rawPath, params, ("path " + (current.path)));
    } else if (false) {
      warn(false, "relative params navigation requires a current route.");
    }
    return next
  }

  var parsedPath = parsePath(next.path || '');
  var basePath = (current && current.path) || '/';
  var path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath;

  var query = resolveQuery(
    parsedPath.query,
    next.query,
    router && router.options.parseQuery
  );

  var hash = next.hash || parsedPath.hash;
  if (hash && hash.charAt(0) !== '#') {
    hash = "#" + hash;
  }

  return {
    _normalized: true,
    path: path,
    query: query,
    hash: hash
  }
}

function assign (a, b) {
  for (var key in b) {
    a[key] = b[key];
  }
  return a
}

/*  */


function createMatcher (
  routes,
  router
) {
  var ref = createRouteMap(routes);
  var pathList = ref.pathList;
  var pathMap = ref.pathMap;
  var nameMap = ref.nameMap;

  function addRoutes (routes) {
    createRouteMap(routes, pathList, pathMap, nameMap);
  }

  function match (
    raw,
    currentRoute,
    redirectedFrom
  ) {
    var location = normalizeLocation(raw, currentRoute, false, router);
    var name = location.name;

    if (name) {
      var record = nameMap[name];
      if (false) {
        warn(record, ("Route with name '" + name + "' does not exist"));
      }
      if (!record) { return _createRoute(null, location) }
      var paramNames = record.regex.keys
        .filter(function (key) { return !key.optional; })
        .map(function (key) { return key.name; });

      if (typeof location.params !== 'object') {
        location.params = {};
      }

      if (currentRoute && typeof currentRoute.params === 'object') {
        for (var key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key];
          }
        }
      }

      if (record) {
        location.path = fillParams(record.path, location.params, ("named route \"" + name + "\""));
        return _createRoute(record, location, redirectedFrom)
      }
    } else if (location.path) {
      location.params = {};
      for (var i = 0; i < pathList.length; i++) {
        var path = pathList[i];
        var record$1 = pathMap[path];
        if (matchRoute(record$1.regex, location.path, location.params)) {
          return _createRoute(record$1, location, redirectedFrom)
        }
      }
    }
    // no match
    return _createRoute(null, location)
  }

  function redirect (
    record,
    location
  ) {
    var originalRedirect = record.redirect;
    var redirect = typeof originalRedirect === 'function'
        ? originalRedirect(createRoute(record, location, null, router))
        : originalRedirect;

    if (typeof redirect === 'string') {
      redirect = { path: redirect };
    }

    if (!redirect || typeof redirect !== 'object') {
      if (false) {
        warn(
          false, ("invalid redirect option: " + (JSON.stringify(redirect)))
        );
      }
      return _createRoute(null, location)
    }

    var re = redirect;
    var name = re.name;
    var path = re.path;
    var query = location.query;
    var hash = location.hash;
    var params = location.params;
    query = re.hasOwnProperty('query') ? re.query : query;
    hash = re.hasOwnProperty('hash') ? re.hash : hash;
    params = re.hasOwnProperty('params') ? re.params : params;

    if (name) {
      // resolved named direct
      var targetRecord = nameMap[name];
      if (false) {
        assert(targetRecord, ("redirect failed: named route \"" + name + "\" not found."));
      }
      return match({
        _normalized: true,
        name: name,
        query: query,
        hash: hash,
        params: params
      }, undefined, location)
    } else if (path) {
      // 1. resolve relative redirect
      var rawPath = resolveRecordPath(path, record);
      // 2. resolve params
      var resolvedPath = fillParams(rawPath, params, ("redirect route with path \"" + rawPath + "\""));
      // 3. rematch with existing query and hash
      return match({
        _normalized: true,
        path: resolvedPath,
        query: query,
        hash: hash
      }, undefined, location)
    } else {
      if (false) {
        warn(false, ("invalid redirect option: " + (JSON.stringify(redirect))));
      }
      return _createRoute(null, location)
    }
  }

  function alias (
    record,
    location,
    matchAs
  ) {
    var aliasedPath = fillParams(matchAs, location.params, ("aliased route with path \"" + matchAs + "\""));
    var aliasedMatch = match({
      _normalized: true,
      path: aliasedPath
    });
    if (aliasedMatch) {
      var matched = aliasedMatch.matched;
      var aliasedRecord = matched[matched.length - 1];
      location.params = aliasedMatch.params;
      return _createRoute(aliasedRecord, location)
    }
    return _createRoute(null, location)
  }

  function _createRoute (
    record,
    location,
    redirectedFrom
  ) {
    if (record && record.redirect) {
      return redirect(record, redirectedFrom || location)
    }
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
    return createRoute(record, location, redirectedFrom, router)
  }

  return {
    match: match,
    addRoutes: addRoutes
  }
}

function matchRoute (
  regex,
  path,
  params
) {
  var m = path.match(regex);

  if (!m) {
    return false
  } else if (!params) {
    return true
  }

  for (var i = 1, len = m.length; i < len; ++i) {
    var key = regex.keys[i - 1];
    var val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i];
    if (key) {
      params[key.name] = val;
    }
  }

  return true
}

function resolveRecordPath (path, record) {
  return resolvePath(path, record.parent ? record.parent.path : '/', true)
}

/*  */


var positionStore = Object.create(null);

function setupScroll () {
  // Fix for #1585 for Firefox
  window.history.replaceState({ key: getStateKey() }, '');
  window.addEventListener('popstate', function (e) {
    saveScrollPosition();
    if (e.state && e.state.key) {
      setStateKey(e.state.key);
    }
  });
}

function handleScroll (
  router,
  to,
  from,
  isPop
) {
  if (!router.app) {
    return
  }

  var behavior = router.options.scrollBehavior;
  if (!behavior) {
    return
  }

  if (false) {
    assert(typeof behavior === 'function', "scrollBehavior must be a function");
  }

  // wait until re-render finishes before scrolling
  router.app.$nextTick(function () {
    var position = getScrollPosition();
    var shouldScroll = behavior(to, from, isPop ? position : null);

    if (!shouldScroll) {
      return
    }

    if (typeof shouldScroll.then === 'function') {
      shouldScroll.then(function (shouldScroll) {
        scrollToPosition((shouldScroll), position);
      }).catch(function (err) {
        if (false) {
          assert(false, err.toString());
        }
      });
    } else {
      scrollToPosition(shouldScroll, position);
    }
  });
}

function saveScrollPosition () {
  var key = getStateKey();
  if (key) {
    positionStore[key] = {
      x: window.pageXOffset,
      y: window.pageYOffset
    };
  }
}

function getScrollPosition () {
  var key = getStateKey();
  if (key) {
    return positionStore[key]
  }
}

function getElementPosition (el, offset) {
  var docEl = document.documentElement;
  var docRect = docEl.getBoundingClientRect();
  var elRect = el.getBoundingClientRect();
  return {
    x: elRect.left - docRect.left - offset.x,
    y: elRect.top - docRect.top - offset.y
  }
}

function isValidPosition (obj) {
  return isNumber(obj.x) || isNumber(obj.y)
}

function normalizePosition (obj) {
  return {
    x: isNumber(obj.x) ? obj.x : window.pageXOffset,
    y: isNumber(obj.y) ? obj.y : window.pageYOffset
  }
}

function normalizeOffset (obj) {
  return {
    x: isNumber(obj.x) ? obj.x : 0,
    y: isNumber(obj.y) ? obj.y : 0
  }
}

function isNumber (v) {
  return typeof v === 'number'
}

function scrollToPosition (shouldScroll, position) {
  var isObject = typeof shouldScroll === 'object';
  if (isObject && typeof shouldScroll.selector === 'string') {
    var el = document.querySelector(shouldScroll.selector);
    if (el) {
      var offset = shouldScroll.offset && typeof shouldScroll.offset === 'object' ? shouldScroll.offset : {};
      offset = normalizeOffset(offset);
      position = getElementPosition(el, offset);
    } else if (isValidPosition(shouldScroll)) {
      position = normalizePosition(shouldScroll);
    }
  } else if (isObject && isValidPosition(shouldScroll)) {
    position = normalizePosition(shouldScroll);
  }

  if (position) {
    window.scrollTo(position.x, position.y);
  }
}

/*  */

var supportsPushState = inBrowser && (function () {
  var ua = window.navigator.userAgent;

  if (
    (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
    ua.indexOf('Mobile Safari') !== -1 &&
    ua.indexOf('Chrome') === -1 &&
    ua.indexOf('Windows Phone') === -1
  ) {
    return false
  }

  return window.history && 'pushState' in window.history
})();

// use User Timing api (if present) for more accurate key precision
var Time = inBrowser && window.performance && window.performance.now
  ? window.performance
  : Date;

var _key = genKey();

function genKey () {
  return Time.now().toFixed(3)
}

function getStateKey () {
  return _key
}

function setStateKey (key) {
  _key = key;
}

function pushState (url, replace) {
  saveScrollPosition();
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  var history = window.history;
  try {
    if (replace) {
      history.replaceState({ key: _key }, '', url);
    } else {
      _key = genKey();
      history.pushState({ key: _key }, '', url);
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url);
  }
}

function replaceState (url) {
  pushState(url, true);
}

/*  */

function runQueue (queue, fn, cb) {
  var step = function (index) {
    if (index >= queue.length) {
      cb();
    } else {
      if (queue[index]) {
        fn(queue[index], function () {
          step(index + 1);
        });
      } else {
        step(index + 1);
      }
    }
  };
  step(0);
}

/*  */

function resolveAsyncComponents (matched) {
  return function (to, from, next) {
    var hasAsync = false;
    var pending = 0;
    var error = null;

    flatMapComponents(matched, function (def, _, match, key) {
      // if it's a function and doesn't have cid attached,
      // assume it's an async component resolve function.
      // we are not using Vue's default async resolving mechanism because
      // we want to halt the navigation until the incoming component has been
      // resolved.
      if (typeof def === 'function' && def.cid === undefined) {
        hasAsync = true;
        pending++;

        var resolve = once(function (resolvedDef) {
          if (isESModule(resolvedDef)) {
            resolvedDef = resolvedDef.default;
          }
          // save resolved on async factory in case it's used elsewhere
          def.resolved = typeof resolvedDef === 'function'
            ? resolvedDef
            : _Vue.extend(resolvedDef);
          match.components[key] = resolvedDef;
          pending--;
          if (pending <= 0) {
            next();
          }
        });

        var reject = once(function (reason) {
          var msg = "Failed to resolve async component " + key + ": " + reason;
          "production" !== 'production' && warn(false, msg);
          if (!error) {
            error = isError(reason)
              ? reason
              : new Error(msg);
            next(error);
          }
        });

        var res;
        try {
          res = def(resolve, reject);
        } catch (e) {
          reject(e);
        }
        if (res) {
          if (typeof res.then === 'function') {
            res.then(resolve, reject);
          } else {
            // new syntax in Vue 2.3
            var comp = res.component;
            if (comp && typeof comp.then === 'function') {
              comp.then(resolve, reject);
            }
          }
        }
      }
    });

    if (!hasAsync) { next(); }
  }
}

function flatMapComponents (
  matched,
  fn
) {
  return flatten(matched.map(function (m) {
    return Object.keys(m.components).map(function (key) { return fn(
      m.components[key],
      m.instances[key],
      m, key
    ); })
  }))
}

function flatten (arr) {
  return Array.prototype.concat.apply([], arr)
}

var hasSymbol =
  typeof Symbol === 'function' &&
  typeof Symbol.toStringTag === 'symbol';

function isESModule (obj) {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once (fn) {
  var called = false;
  return function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    if (called) { return }
    called = true;
    return fn.apply(this, args)
  }
}

/*  */

var History = function History (router, base) {
  this.router = router;
  this.base = normalizeBase(base);
  // start with a route object that stands for "nowhere"
  this.current = START;
  this.pending = null;
  this.ready = false;
  this.readyCbs = [];
  this.readyErrorCbs = [];
  this.errorCbs = [];
};

History.prototype.listen = function listen (cb) {
  this.cb = cb;
};

History.prototype.onReady = function onReady (cb, errorCb) {
  if (this.ready) {
    cb();
  } else {
    this.readyCbs.push(cb);
    if (errorCb) {
      this.readyErrorCbs.push(errorCb);
    }
  }
};

History.prototype.onError = function onError (errorCb) {
  this.errorCbs.push(errorCb);
};

History.prototype.transitionTo = function transitionTo (location, onComplete, onAbort) {
    var this$1 = this;

  var route = this.router.match(location, this.current);
  this.confirmTransition(route, function () {
    this$1.updateRoute(route);
    onComplete && onComplete(route);
    this$1.ensureURL();

    // fire ready cbs once
    if (!this$1.ready) {
      this$1.ready = true;
      this$1.readyCbs.forEach(function (cb) { cb(route); });
    }
  }, function (err) {
    if (onAbort) {
      onAbort(err);
    }
    if (err && !this$1.ready) {
      this$1.ready = true;
      this$1.readyErrorCbs.forEach(function (cb) { cb(err); });
    }
  });
};

History.prototype.confirmTransition = function confirmTransition (route, onComplete, onAbort) {
    var this$1 = this;

  var current = this.current;
  var abort = function (err) {
    if (isError(err)) {
      if (this$1.errorCbs.length) {
        this$1.errorCbs.forEach(function (cb) { cb(err); });
      } else {
        warn(false, 'uncaught error during route navigation:');
        console.error(err);
      }
    }
    onAbort && onAbort(err);
  };
  if (
    isSameRoute(route, current) &&
    // in the case the route map has been dynamically appended to
    route.matched.length === current.matched.length
  ) {
    this.ensureURL();
    return abort()
  }

  var ref = resolveQueue(this.current.matched, route.matched);
    var updated = ref.updated;
    var deactivated = ref.deactivated;
    var activated = ref.activated;

  var queue = [].concat(
    // in-component leave guards
    extractLeaveGuards(deactivated),
    // global before hooks
    this.router.beforeHooks,
    // in-component update hooks
    extractUpdateHooks(updated),
    // in-config enter guards
    activated.map(function (m) { return m.beforeEnter; }),
    // async components
    resolveAsyncComponents(activated)
  );

  this.pending = route;
  var iterator = function (hook, next) {
    if (this$1.pending !== route) {
      return abort()
    }
    try {
      hook(route, current, function (to) {
        if (to === false || isError(to)) {
          // next(false) -> abort navigation, ensure current URL
          this$1.ensureURL(true);
          abort(to);
        } else if (
          typeof to === 'string' ||
          (typeof to === 'object' && (
            typeof to.path === 'string' ||
            typeof to.name === 'string'
          ))
        ) {
          // next('/') or next({ path: '/' }) -> redirect
          abort();
          if (typeof to === 'object' && to.replace) {
            this$1.replace(to);
          } else {
            this$1.push(to);
          }
        } else {
          // confirm transition and pass on the value
          next(to);
        }
      });
    } catch (e) {
      abort(e);
    }
  };

  runQueue(queue, iterator, function () {
    var postEnterCbs = [];
    var isValid = function () { return this$1.current === route; };
    // wait until async components are resolved before
    // extracting in-component enter guards
    var enterGuards = extractEnterGuards(activated, postEnterCbs, isValid);
    var queue = enterGuards.concat(this$1.router.resolveHooks);
    runQueue(queue, iterator, function () {
      if (this$1.pending !== route) {
        return abort()
      }
      this$1.pending = null;
      onComplete(route);
      if (this$1.router.app) {
        this$1.router.app.$nextTick(function () {
          postEnterCbs.forEach(function (cb) { cb(); });
        });
      }
    });
  });
};

History.prototype.updateRoute = function updateRoute (route) {
  var prev = this.current;
  this.current = route;
  this.cb && this.cb(route);
  this.router.afterHooks.forEach(function (hook) {
    hook && hook(route, prev);
  });
};

function normalizeBase (base) {
  if (!base) {
    if (inBrowser) {
      // respect <base> tag
      var baseEl = document.querySelector('base');
      base = (baseEl && baseEl.getAttribute('href')) || '/';
      // strip full URL origin
      base = base.replace(/^https?:\/\/[^\/]+/, '');
    } else {
      base = '/';
    }
  }
  // make sure there's the starting slash
  if (base.charAt(0) !== '/') {
    base = '/' + base;
  }
  // remove trailing slash
  return base.replace(/\/$/, '')
}

function resolveQueue (
  current,
  next
) {
  var i;
  var max = Math.max(current.length, next.length);
  for (i = 0; i < max; i++) {
    if (current[i] !== next[i]) {
      break
    }
  }
  return {
    updated: next.slice(0, i),
    activated: next.slice(i),
    deactivated: current.slice(i)
  }
}

function extractGuards (
  records,
  name,
  bind,
  reverse
) {
  var guards = flatMapComponents(records, function (def, instance, match, key) {
    var guard = extractGuard(def, name);
    if (guard) {
      return Array.isArray(guard)
        ? guard.map(function (guard) { return bind(guard, instance, match, key); })
        : bind(guard, instance, match, key)
    }
  });
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard (
  def,
  key
) {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    def = _Vue.extend(def);
  }
  return def.options[key]
}

function extractLeaveGuards (deactivated) {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

function extractUpdateHooks (updated) {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}

function bindGuard (guard, instance) {
  if (instance) {
    return function boundRouteGuard () {
      return guard.apply(instance, arguments)
    }
  }
}

function extractEnterGuards (
  activated,
  cbs,
  isValid
) {
  return extractGuards(activated, 'beforeRouteEnter', function (guard, _, match, key) {
    return bindEnterGuard(guard, match, key, cbs, isValid)
  })
}

function bindEnterGuard (
  guard,
  match,
  key,
  cbs,
  isValid
) {
  return function routeEnterGuard (to, from, next) {
    return guard(to, from, function (cb) {
      next(cb);
      if (typeof cb === 'function') {
        cbs.push(function () {
          // #750
          // if a router-view is wrapped with an out-in transition,
          // the instance may not have been registered at this time.
          // we will need to poll for registration until current route
          // is no longer valid.
          poll(cb, match.instances, key, isValid);
        });
      }
    })
  }
}

function poll (
  cb, // somehow flow cannot infer this is a function
  instances,
  key,
  isValid
) {
  if (instances[key]) {
    cb(instances[key]);
  } else if (isValid()) {
    setTimeout(function () {
      poll(cb, instances, key, isValid);
    }, 16);
  }
}

/*  */


var HTML5History = (function (History$$1) {
  function HTML5History (router, base) {
    var this$1 = this;

    History$$1.call(this, router, base);

    var expectScroll = router.options.scrollBehavior;

    if (expectScroll) {
      setupScroll();
    }

    var initLocation = getLocation(this.base);
    window.addEventListener('popstate', function (e) {
      var current = this$1.current;

      // Avoiding first `popstate` event dispatched in some browsers but first
      // history route not updated since async guard at the same time.
      var location = getLocation(this$1.base);
      if (this$1.current === START && location === initLocation) {
        return
      }

      this$1.transitionTo(location, function (route) {
        if (expectScroll) {
          handleScroll(router, route, current, true);
        }
      });
    });
  }

  if ( History$$1 ) HTML5History.__proto__ = History$$1;
  HTML5History.prototype = Object.create( History$$1 && History$$1.prototype );
  HTML5History.prototype.constructor = HTML5History;

  HTML5History.prototype.go = function go (n) {
    window.history.go(n);
  };

  HTML5History.prototype.push = function push (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      pushState(cleanPath(this$1.base + route.fullPath));
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HTML5History.prototype.replace = function replace (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      replaceState(cleanPath(this$1.base + route.fullPath));
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HTML5History.prototype.ensureURL = function ensureURL (push) {
    if (getLocation(this.base) !== this.current.fullPath) {
      var current = cleanPath(this.base + this.current.fullPath);
      push ? pushState(current) : replaceState(current);
    }
  };

  HTML5History.prototype.getCurrentLocation = function getCurrentLocation () {
    return getLocation(this.base)
  };

  return HTML5History;
}(History));

function getLocation (base) {
  var path = window.location.pathname;
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length);
  }
  return (path || '/') + window.location.search + window.location.hash
}

/*  */


var HashHistory = (function (History$$1) {
  function HashHistory (router, base, fallback) {
    History$$1.call(this, router, base);
    // check history fallback deeplinking
    if (fallback && checkFallback(this.base)) {
      return
    }
    ensureSlash();
  }

  if ( History$$1 ) HashHistory.__proto__ = History$$1;
  HashHistory.prototype = Object.create( History$$1 && History$$1.prototype );
  HashHistory.prototype.constructor = HashHistory;

  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  HashHistory.prototype.setupListeners = function setupListeners () {
    var this$1 = this;

    var router = this.router;
    var expectScroll = router.options.scrollBehavior;
    var supportsScroll = supportsPushState && expectScroll;

    if (supportsScroll) {
      setupScroll();
    }

    window.addEventListener(supportsPushState ? 'popstate' : 'hashchange', function () {
      var current = this$1.current;
      if (!ensureSlash()) {
        return
      }
      this$1.transitionTo(getHash(), function (route) {
        if (supportsScroll) {
          handleScroll(this$1.router, route, current, true);
        }
        if (!supportsPushState) {
          replaceHash(route.fullPath);
        }
      });
    });
  };

  HashHistory.prototype.push = function push (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      pushHash(route.fullPath);
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HashHistory.prototype.replace = function replace (location, onComplete, onAbort) {
    var this$1 = this;

    var ref = this;
    var fromRoute = ref.current;
    this.transitionTo(location, function (route) {
      replaceHash(route.fullPath);
      handleScroll(this$1.router, route, fromRoute, false);
      onComplete && onComplete(route);
    }, onAbort);
  };

  HashHistory.prototype.go = function go (n) {
    window.history.go(n);
  };

  HashHistory.prototype.ensureURL = function ensureURL (push) {
    var current = this.current.fullPath;
    if (getHash() !== current) {
      push ? pushHash(current) : replaceHash(current);
    }
  };

  HashHistory.prototype.getCurrentLocation = function getCurrentLocation () {
    return getHash()
  };

  return HashHistory;
}(History));

function checkFallback (base) {
  var location = getLocation(base);
  if (!/^\/#/.test(location)) {
    window.location.replace(
      cleanPath(base + '/#' + location)
    );
    return true
  }
}

function ensureSlash () {
  var path = getHash();
  if (path.charAt(0) === '/') {
    return true
  }
  replaceHash('/' + path);
  return false
}

function getHash () {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  var href = window.location.href;
  var index = href.indexOf('#');
  return index === -1 ? '' : href.slice(index + 1)
}

function getUrl (path) {
  var href = window.location.href;
  var i = href.indexOf('#');
  var base = i >= 0 ? href.slice(0, i) : href;
  return (base + "#" + path)
}

function pushHash (path) {
  if (supportsPushState) {
    pushState(getUrl(path));
  } else {
    window.location.hash = path;
  }
}

function replaceHash (path) {
  if (supportsPushState) {
    replaceState(getUrl(path));
  } else {
    window.location.replace(getUrl(path));
  }
}

/*  */


var AbstractHistory = (function (History$$1) {
  function AbstractHistory (router, base) {
    History$$1.call(this, router, base);
    this.stack = [];
    this.index = -1;
  }

  if ( History$$1 ) AbstractHistory.__proto__ = History$$1;
  AbstractHistory.prototype = Object.create( History$$1 && History$$1.prototype );
  AbstractHistory.prototype.constructor = AbstractHistory;

  AbstractHistory.prototype.push = function push (location, onComplete, onAbort) {
    var this$1 = this;

    this.transitionTo(location, function (route) {
      this$1.stack = this$1.stack.slice(0, this$1.index + 1).concat(route);
      this$1.index++;
      onComplete && onComplete(route);
    }, onAbort);
  };

  AbstractHistory.prototype.replace = function replace (location, onComplete, onAbort) {
    var this$1 = this;

    this.transitionTo(location, function (route) {
      this$1.stack = this$1.stack.slice(0, this$1.index).concat(route);
      onComplete && onComplete(route);
    }, onAbort);
  };

  AbstractHistory.prototype.go = function go (n) {
    var this$1 = this;

    var targetIndex = this.index + n;
    if (targetIndex < 0 || targetIndex >= this.stack.length) {
      return
    }
    var route = this.stack[targetIndex];
    this.confirmTransition(route, function () {
      this$1.index = targetIndex;
      this$1.updateRoute(route);
    });
  };

  AbstractHistory.prototype.getCurrentLocation = function getCurrentLocation () {
    var current = this.stack[this.stack.length - 1];
    return current ? current.fullPath : '/'
  };

  AbstractHistory.prototype.ensureURL = function ensureURL () {
    // noop
  };

  return AbstractHistory;
}(History));

/*  */

var VueRouter = function VueRouter (options) {
  if ( options === void 0 ) options = {};

  this.app = null;
  this.apps = [];
  this.options = options;
  this.beforeHooks = [];
  this.resolveHooks = [];
  this.afterHooks = [];
  this.matcher = createMatcher(options.routes || [], this);

  var mode = options.mode || 'hash';
  this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false;
  if (this.fallback) {
    mode = 'hash';
  }
  if (!inBrowser) {
    mode = 'abstract';
  }
  this.mode = mode;

  switch (mode) {
    case 'history':
      this.history = new HTML5History(this, options.base);
      break
    case 'hash':
      this.history = new HashHistory(this, options.base, this.fallback);
      break
    case 'abstract':
      this.history = new AbstractHistory(this, options.base);
      break
    default:
      if (false) {
        assert(false, ("invalid mode: " + mode));
      }
  }
};

var prototypeAccessors = { currentRoute: { configurable: true } };

VueRouter.prototype.match = function match (
  raw,
  current,
  redirectedFrom
) {
  return this.matcher.match(raw, current, redirectedFrom)
};

prototypeAccessors.currentRoute.get = function () {
  return this.history && this.history.current
};

VueRouter.prototype.init = function init (app /* Vue component instance */) {
    var this$1 = this;

  "production" !== 'production' && assert(
    install.installed,
    "not installed. Make sure to call `Vue.use(VueRouter)` " +
    "before creating root instance."
  );

  this.apps.push(app);

  // main app already initialized.
  if (this.app) {
    return
  }

  this.app = app;

  var history = this.history;

  if (history instanceof HTML5History) {
    history.transitionTo(history.getCurrentLocation());
  } else if (history instanceof HashHistory) {
    var setupHashListener = function () {
      history.setupListeners();
    };
    history.transitionTo(
      history.getCurrentLocation(),
      setupHashListener,
      setupHashListener
    );
  }

  history.listen(function (route) {
    this$1.apps.forEach(function (app) {
      app._route = route;
    });
  });
};

VueRouter.prototype.beforeEach = function beforeEach (fn) {
  return registerHook(this.beforeHooks, fn)
};

VueRouter.prototype.beforeResolve = function beforeResolve (fn) {
  return registerHook(this.resolveHooks, fn)
};

VueRouter.prototype.afterEach = function afterEach (fn) {
  return registerHook(this.afterHooks, fn)
};

VueRouter.prototype.onReady = function onReady (cb, errorCb) {
  this.history.onReady(cb, errorCb);
};

VueRouter.prototype.onError = function onError (errorCb) {
  this.history.onError(errorCb);
};

VueRouter.prototype.push = function push (location, onComplete, onAbort) {
  this.history.push(location, onComplete, onAbort);
};

VueRouter.prototype.replace = function replace (location, onComplete, onAbort) {
  this.history.replace(location, onComplete, onAbort);
};

VueRouter.prototype.go = function go (n) {
  this.history.go(n);
};

VueRouter.prototype.back = function back () {
  this.go(-1);
};

VueRouter.prototype.forward = function forward () {
  this.go(1);
};

VueRouter.prototype.getMatchedComponents = function getMatchedComponents (to) {
  var route = to
    ? to.matched
      ? to
      : this.resolve(to).route
    : this.currentRoute;
  if (!route) {
    return []
  }
  return [].concat.apply([], route.matched.map(function (m) {
    return Object.keys(m.components).map(function (key) {
      return m.components[key]
    })
  }))
};

VueRouter.prototype.resolve = function resolve (
  to,
  current,
  append
) {
  var location = normalizeLocation(
    to,
    current || this.history.current,
    append,
    this
  );
  var route = this.match(location, current);
  var fullPath = route.redirectedFrom || route.fullPath;
  var base = this.history.base;
  var href = createHref(base, fullPath, this.mode);
  return {
    location: location,
    route: route,
    href: href,
    // for backwards compat
    normalizedTo: location,
    resolved: route
  }
};

VueRouter.prototype.addRoutes = function addRoutes (routes) {
  this.matcher.addRoutes(routes);
  if (this.history.current !== START) {
    this.history.transitionTo(this.history.getCurrentLocation());
  }
};

Object.defineProperties( VueRouter.prototype, prototypeAccessors );

function registerHook (list, fn) {
  list.push(fn);
  return function () {
    var i = list.indexOf(fn);
    if (i > -1) { list.splice(i, 1); }
  }
}

function createHref (base, fullPath, mode) {
  var path = mode === 'hash' ? '#' + fullPath : fullPath;
  return base ? cleanPath(base + '/' + path) : path
}

VueRouter.install = install;
VueRouter.version = '2.8.1';

if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter);
}

/* harmony default export */ __webpack_exports__["a"] = (VueRouter);


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(25)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(27),
  /* template */
  __webpack_require__(31),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(26);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("756ab3ae", content, true);

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, ".slider{height:31%}.group{display:flex;flex-wrap:wrap;background-color:#fff;border-top:1px solid #ddd}.groupitem:nth-child(Odd){border-right:1px solid #ddd}.groupitem:nth-child(2n),.groupitem:nth-child(Odd){width:50%;box-sizing:border-box;border-bottom:1px solid #ddd}.groupitem img{display:block;max-width:100%;height:auto;padding:10px}.groupitem p{text-align:center}", ""]);

// exports


/***/ }),
/* 27 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__ = __webpack_require__(28);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__ = __webpack_require__(29);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__ = __webpack_require__(30);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//





__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBar"].name, __WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBar"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBarBackIcon"].name, __WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBarBackIcon"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBarNextIcon"].name, __WEBPACK_IMPORTED_MODULE_2_vue_ydui_dist_lib_rem_navbar__["NavBarNextIcon"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__["Slider"].name, __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__["Slider"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__["SliderItem"].name, __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_slider__["SliderItem"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__["RollNotice"].name, __WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__["RollNotice"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__["RollNoticeItem"].name, __WEBPACK_IMPORTED_MODULE_3_vue_ydui_dist_lib_rem_rollnotice__["RollNoticeItem"]);
/* harmony default export */ __webpack_exports__["default"] = ({

    name: 'trend',

    data() {
        return {
            Sliderdata: [{ to: '#/detailview', src: '/assets/images/1.jpg' }, { to: '#/explain', src: '/assets/images/2.jpg' }, { to: '#/person', src: '/assets/images/3.jpg' }],
            rollnoticedata: [{ icon: '荐', content: '荣耀V9 3月超级钜惠！' }, { icon: '推荐', content: '3.23京东超级品牌日格力盛典' }, { icon: '超推荐', content: '京东服饰 早春新品低至7折' }],
            groupdata: [{ src: '/assets/images/3.jpg', text: '网格1' }, { src: '/assets/images/3.jpg', text: '网格2' }, { src: '/assets/images/3.jpg', text: '网格3' }, { src: '/assets/images/3.jpg', text: '网格4' }, { src: '/assets/images/3.jpg', text: '网格5' }, { src: '/assets/images/3.jpg', text: '网格6' }, { src: '/assets/images/3.jpg', text: '网格7' }, { src: '/assets/images/3.jpg', text: '网格8' }, { src: '/assets/images/3.jpg', text: '网格9' }, { src: '/assets/images/3.jpg', text: '网格10' }]
        };
    },
    created() {},
    mounted() {},
    computed: {},
    methods: {}

});

/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

/*! vue-ydui v1.2.1 by YDCSS (c) 2018 Licensed MIT */
!function(t,e){ true?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.ydui=e():t.ydui=e()}(this,function(){return function(t){function e(n){if(i[n])return i[n].exports;var r=i[n]={exports:{},id:n,loaded:!1};return t[n].call(r.exports,r,r.exports,e),r.loaded=!0,r.exports}var i={};return e.m=t,e.c=i,e.p="/dist/",e(0)}([function(t,e,i){"use strict";function n(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.SliderItem=e.Slider=void 0;var r=i(21),s=n(r),o=i(20),a=n(o);e.Slider=s.default,e.SliderItem=a.default},function(t,e){t.exports=function(t,e,i,n){var r,s=t=t||{},o=typeof t.default;"object"!==o&&"function"!==o||(r=t,s=t.default);var a="function"==typeof s?s.options:s;if(e&&(a.render=e.render,a.staticRenderFns=e.staticRenderFns),i&&(a._scopeId=i),n){var l=a.computed||(a.computed={});Object.keys(n).forEach(function(t){var e=n[t];l[t]=function(){return e}})}return{esModule:r,exports:s,options:a}}},function(t,e){t.exports=function(){var t=[];return t.toString=function(){for(var t=[],e=0;e<this.length;e++){var i=this[e];i[2]?t.push("@media "+i[2]+"{"+i[1]+"}"):t.push(i[1])}return t.join("")},t.i=function(e,i){"string"==typeof e&&(e=[[null,e,""]]);for(var n={},r=0;r<this.length;r++){var s=this[r][0];"number"==typeof s&&(n[s]=!0)}for(r=0;r<e.length;r++){var o=e[r];"number"==typeof o[0]&&n[o[0]]||(i&&!o[2]?o[2]=i:i&&(o[2]="("+o[2]+") and ("+i+")"),t.push(o))}},t}},function(t,e,i){function n(t){for(var e=0;e<t.length;e++){var i=t[e],n=c[i.id];if(n){n.refs++;for(var r=0;r<n.parts.length;r++)n.parts[r](i.parts[r]);for(;r<i.parts.length;r++)n.parts.push(s(i.parts[r]));n.parts.length>i.parts.length&&(n.parts.length=i.parts.length)}else{for(var o=[],r=0;r<i.parts.length;r++)o.push(s(i.parts[r]));c[i.id]={id:i.id,refs:1,parts:o}}}}function r(){var t=document.createElement("style");return t.type="text/css",h.appendChild(t),t}function s(t){var e,i,n=document.querySelector('style[data-vue-ssr-id~="'+t.id+'"]');if(n){if(p)return m;n.parentNode.removeChild(n)}if(v){var s=f++;n=u||(u=r()),e=o.bind(null,n,s,!1),i=o.bind(null,n,s,!0)}else n=r(),e=a.bind(null,n),i=function(){n.parentNode.removeChild(n)};return e(t),function(n){if(n){if(n.css===t.css&&n.media===t.media&&n.sourceMap===t.sourceMap)return;e(t=n)}else i()}}function o(t,e,i,n){var r=i?"":n.css;if(t.styleSheet)t.styleSheet.cssText=y(e,r);else{var s=document.createTextNode(r),o=t.childNodes;o[e]&&t.removeChild(o[e]),o.length?t.insertBefore(s,o[e]):t.appendChild(s)}}function a(t,e){var i=e.css,n=e.media,r=e.sourceMap;if(n&&t.setAttribute("media",n),r&&(i+="\n/*# sourceURL="+r.sources[0]+" */",i+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */"),t.styleSheet)t.styleSheet.cssText=i;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(i))}}var l="undefined"!=typeof document,d=i(4),c={},h=l&&(document.head||document.getElementsByTagName("head")[0]),u=null,f=0,p=!1,m=function(){},v="undefined"!=typeof navigator&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());t.exports=function(t,e,i){p=i;var r=d(t,e);return n(r),function(e){for(var i=[],s=0;s<r.length;s++){var o=r[s],a=c[o.id];a.refs--,i.push(a)}e?(r=d(t,e),n(r)):r=[];for(var s=0;s<i.length;s++){var a=i[s];if(0===a.refs){for(var l=0;l<a.parts.length;l++)a.parts[l]();delete c[a.id]}}}};var y=function(){var t=[];return function(e,i){return t[e]=i,t.filter(Boolean).join("\n")}}()},function(t,e){t.exports=function(t,e){for(var i=[],n={},r=0;r<e.length;r++){var s=e[r],o=s[0],a=s[1],l=s[2],d=s[3],c={id:t+":"+r,css:a,media:l,sourceMap:d};n[o]?n[o].parts.push(c):i.push(n[o]={id:o,parts:[c]})}return i}},,,,,,,,,,,,,function(t,e,i){e=t.exports=i(2)(),e.push([t.id,"@-webkit-keyframes yd-kf-opacity-in{0%{opacity:0}to{opacity:1}}@keyframes yd-kf-opacity-in{0%{opacity:0}to{opacity:1}}.yd-slider{width:100%;overflow:hidden;position:relative}.yd-slider-wrapper{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;width:100%;height:100%;-webkit-transform:translateZ(0);transform:translateZ(0);position:relative;z-index:1;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-transition-property:-webkit-transform;transition-property:-webkit-transform;transition-property:transform;transition-property:transform,-webkit-transform}.yd-slider-wrapper-vertical{-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column}.yd-slider-item{width:100%;height:100%;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.yd-slider-item a{display:block}.yd-slider-item img{width:100%;display:block}.yd-slider-pagination{position:absolute;width:100%;z-index:2;left:0;bottom:.1rem;pointer-events:none;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:end;-webkit-align-items:flex-end;-ms-flex-align:end;align-items:flex-end;opacity:0;-webkit-animation:yd-kf-opacity-in .3s linear .4s forwards;animation:yd-kf-opacity-in .3s linear .4s forwards}.yd-slider-pagination,.yd-slider-pagination-vertical{-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.yd-slider-pagination-vertical{width:0;height:100%;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;bottom:0;left:auto;right:.1rem}.yd-slider-pagination-item{margin:.05rem;width:6px;height:6px;display:inline-block;border-radius:100%;background-color:#b7d0e1}.yd-slider-pagination-item-active{background-color:#ff0005}",""])},,,function(t,e,i){var n=i(1)(i(31),i(23),null,null);t.exports=n.exports},function(t,e,i){i(28);var n=i(1)(i(32),i(25),null,null);t.exports=n.exports},,function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{staticClass:"yd-slider-item"},[t._t("default")],2)},staticRenderFns:[]}},,function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("div",{ref:"slider",staticClass:"yd-slider"},[i("div",{ref:"warpper",staticClass:"yd-slider-wrapper",class:"vertical"==t.direction?"yd-slider-wrapper-vertical":"",style:t.dragStyleObject},[t.loop?i("div",{staticClass:"yd-slider-item",style:t.itemHeight,domProps:{innerHTML:t._s(t.lastItem)}}):t._e(),t._v(" "),t._t("default"),t._v(" "),t.loop?i("div",{staticClass:"yd-slider-item",style:t.itemHeight,domProps:{innerHTML:t._s(t.firstItem)}}):t._e()],2),t._v(" "),t.itemsArr.length>1&&t.showPagination?i("div",{staticClass:"yd-slider-pagination",class:"vertical"==t.direction?"yd-slider-pagination-vertical":""},t._l(t.itemNums,function(e,n){return i("span",{key:n,staticClass:"yd-slider-pagination-item",class:t.paginationIndex==n?"yd-slider-pagination-item-active":""})})):t._e()])},staticRenderFns:[]}},,,function(t,e,i){var n=i(17);"string"==typeof n&&(n=[[t.id,n,""]]),n.locals&&(t.exports=n.locals);i(3)("787def37",n,!0)},,,function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-slider-item",mounted:function(){this.$nextTick(this.$parent.init)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-slider",data:function(){return{firstItem:"",lastItem:"",currentIndex:0,itemNums:0,itemsArr:[],autoPlayTimer:null,paginationIndex:0,itemHeight:{height:null},dragStyleObject:{transform:0,speed:0},touches:{moveTag:0,moveOffset:0,touchStartTime:0,isTouchEvent:!1,allowClick:!1,isDraging:!1}}},props:{index:{default:0,validator:function(t){return/^\d*$/.test(t)}},speed:{default:300,validator:function(t){return/^\d*$/.test(t)}},autoplay:{default:0,validator:function(t){return/^\d*$/.test(t)}},direction:{validator:function(t){return["horizontal","vertical"].indexOf(t)>-1},default:"horizontal"},showPagination:{type:Boolean,default:!0},callback:{type:Function},loop:{type:Boolean,default:!0}},watch:{index:function(t){t=~~t,t>this.itemNums&&(t=this.itemNums),this.currentIndex=this.loop?t+1:t,this.showItem(this.currentIndex)},currentIndex:function(t){var e=this.itemNums,i=(t-1)%e;this.loop?this.paginationIndex=i<0?e-1:i:this.paginationIndex=t}},methods:{init:function(){this.destroy(),this.isVertical="vertical"===this.direction,this.itemsArr=this.$children.filter(function(t){return"yd-slider-item"===t.$options.name}),this.itemNums=this.itemsArr.length,this.loop?(this.currentIndex=1,this.index>0&&(this.currentIndex=~~this.index+1)):(this.currentIndex=0,this.index>0&&(this.currentIndex=~~this.index)),this.cloneItem(),this.showItem(this.currentIndex),this.bindEvents(),this.autoPlay()},showItem:function(t){if(this.isVertical){this.$refs.slider.style.height="100%";var e=this.$el.clientHeight;this.itemHeight.height=e+"px",this.setTranslate(0,-e*t),this.itemsArr.forEach(function(t){t.$el.style.height=e+"px"})}else this.setTranslate(0,-this.$refs.warpper.offsetWidth*t)},cloneItem:function(){if(!(this.itemsArr.length<=1)&&this.loop){var t=this.itemsArr;this.firstItem=t[0].$el.innerHTML,this.lastItem=t[t.length-1].$el.innerHTML}},touchStartHandler:function(t){var e=this.touches;if(e.allowClick=!0,e.isTouchEvent="touchstart"===t.type,(e.isTouchEvent||!("which"in t)||3!==t.which)&&0===e.moveTag){e.moveTag=1,e.startX=t.touches?t.touches[0].clientX:t.clientX,e.startY=t.touches?t.touches[0].clientY:t.clientY,e.touchStartTime=Date.now();var i=this.itemNums;if(this.loop){if(0===this.currentIndex)return this.currentIndex=i,void this.setTranslate(0,-i*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));this.currentIndex>i&&(this.currentIndex=1,this.setTranslate(0,this.isVertical?-this.$el.clientHeight:-this.$refs.warpper.offsetWidth))}else{if(this.currentIndex===-1)return this.currentIndex=i-1,void this.setTranslate(0,-(i-1)*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));this.currentIndex>i-1&&(this.currentIndex=1,this.setTranslate(0,this.isVertical?-this.$el.clientHeight:-this.$refs.warpper.offsetWidth))}}},touchMoveHandler:function(t){this.supportTouch&&!this.isVertical||t.preventDefault();var e=this.touches;if(e.allowClick=!1,!e.isTouchEvent||"mousemove"!==t.type){var i=t.touches?t.touches[0].clientY:t.clientY,n=t.touches?t.touches[0].clientX:t.clientX,r=180*Math.atan2(Math.abs(i-e.startY),Math.abs(n-e.startX))/Math.PI;if((this.isVertical?90-r>45:r>45)&&this.supportTouch)return e.moveTag=3,this.stopAutoplay(),void this.setTranslate(0,-this.currentIndex*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));e.isDraging=!0;var s=e.moveOffset=this.isVertical?i-e.startY:n-e.startX;0!==s&&0!==e.moveTag&&(1===e.moveTag&&(this.stopAutoplay(),e.moveTag=2),2===e.moveTag&&this.setTranslate(0,-this.currentIndex*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth)+s/2))}},touchEndHandler:function(){var t=this.touches,e=t.moveOffset,i=this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth;if(1===t.moveTag&&(t.moveTag=0),setTimeout(function(){t.allowClick=!0,t.isDraging=!1},this.speed),2===t.moveTag){t.moveTag=0;var n=Date.now()-t.touchStartTime,r=!this.loop&&(0===this.currentIndex&&e>0||this.currentIndex>=this.itemNums-1&&e<0);return n>300&&Math.abs(e)<=.5*i||this.itemsArr.length<=1||r?this.setTranslate(this.speed,-this.currentIndex*i):(this.setTranslate(this.speed,-((e>0?--this.currentIndex:++this.currentIndex)*i)),this.sendIndex()),void this.autoPlay()}3===t.moveTag&&(t.moveTag=0,this.autoPlay())},autoPlay:function(){var t=this;this.autoplay<=0||this.itemsArr.length<=1||(this.autoPlayTimer=setInterval(function(){var e=t.isVertical?t.$el.clientHeight:t.$refs.warpper.offsetWidth;return t.loop||t.currentIndex+1>=t.itemNums&&(t.currentIndex=-1),t.currentIndex>t.itemNums?(t.currentIndex=1,t.setTranslate(0,-e),setTimeout(function(){t.setTranslate(t.speed,-(++t.currentIndex*e))},100),void(t.callback&&t.callback(t.currentIndex))):(t.setTranslate(t.speed,-(++t.currentIndex*e)),void t.sendIndex())},this.autoplay))},sendIndex:function(){if(this.loop){var t=this.currentIndex%this.itemNums;this.callback&&this.callback(0===t?this.itemNums-1:t-1)}else this.callback&&this.callback(this.currentIndex)},stopAutoplay:function(){clearInterval(this.autoPlayTimer)},stopDrag:function(t){this.touches.isDraging&&t.preventDefault()},bindEvents:function(){var t=this;this.$el.addEventListener("touchstart",this.touchStartHandler),this.$el.addEventListener("touchmove",this.touchMoveHandler),this.$el.addEventListener("touchend",this.touchEndHandler),this.$el.addEventListener("click",function(e){t.touches.allowClick||e.preventDefault()}),window.addEventListener("resize",this.resizeSlides),document.body.addEventListener("touchmove",this.stopDrag,{passive:!1})},unbindEvents:function(){this.$el.removeEventListener("touchstart",this.touchStartHandler),this.$el.removeEventListener("touchmove",this.touchMoveHandler),this.$el.removeEventListener("touchend",this.touchEndHandler),window.removeEventListener("resize",this.resizeSlides),document.body.removeEventListener("touchmove",this.stopDrag,{passive:!1})},setTranslate:function(t,e){this.dragStyleObject.transitionDuration=t+"ms",this.isVertical?this.dragStyleObject.transform="translate3d(0, "+e+"px, 0)":this.dragStyleObject.transform="translate3d("+e+"px, 0, 0)"},resizeSlides:function(){if(this.isVertical){var t=this.$el.clientHeight;this.dragStyleObject.transform="translate3d(0, "+-this.currentIndex*t+"px, 0)"}else{var e=this.$refs.warpper.offsetWidth;this.dragStyleObject.transform="translate3d("+-this.currentIndex*e+"px, 0, 0)"}},destroy:function(){this.unbindEvents(),this.stopAutoplay()}},mounted:function(){this.supportTouch=window.Modernizr&&!!window.Modernizr.touch||function(){return!!("ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch)}()},beforeDestroy:function(){this.destroy()}}}])});

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

/*! vue-ydui v1.2.1 by YDCSS (c) 2018 Licensed MIT */
!function(e,t){ true?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.ydui=t():e.ydui=t()}(this,function(){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={exports:{},id:r,loaded:!1};return e[r].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var n={};return t.m=e,t.c=n,t.p="/dist/",t(0)}({0:function(e,t,n){"use strict";function r(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.NavBarNextIcon=t.NavBarBackIcon=t.NavBar=void 0;var o=n(109),i=r(o),a=n(107),s=r(a),l=n(108),c=r(l);t.NavBar=i.default,t.NavBarBackIcon=s.default,t.NavBarNextIcon=c.default},1:function(e,t){e.exports=function(e,t,n,r){var o,i=e=e||{},a=typeof e.default;"object"!==a&&"function"!==a||(o=e,i=e.default);var s="function"==typeof i?i.options:i;if(t&&(s.render=t.render,s.staticRenderFns=t.staticRenderFns),n&&(s._scopeId=n),r){var l=s.computed||(s.computed={});Object.keys(r).forEach(function(e){var t=r[e];l[e]=function(){return t}})}return{esModule:o,exports:i,options:s}}},2:function(e,t){e.exports=function(){var e=[];return e.toString=function(){for(var e=[],t=0;t<this.length;t++){var n=this[t];n[2]?e.push("@media "+n[2]+"{"+n[1]+"}"):e.push(n[1])}return e.join("")},e.i=function(t,n){"string"==typeof t&&(t=[[null,t,""]]);for(var r={},o=0;o<this.length;o++){var i=this[o][0];"number"==typeof i&&(r[i]=!0)}for(o=0;o<t.length;o++){var a=t[o];"number"==typeof a[0]&&r[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),e.push(a))}},e}},3:function(e,t,n){function r(e){for(var t=0;t<e.length;t++){var n=e[t],r=d[n.id];if(r){r.refs++;for(var o=0;o<r.parts.length;o++)r.parts[o](n.parts[o]);for(;o<n.parts.length;o++)r.parts.push(i(n.parts[o]));r.parts.length>n.parts.length&&(r.parts.length=n.parts.length)}else{for(var a=[],o=0;o<n.parts.length;o++)a.push(i(n.parts[o]));d[n.id]={id:n.id,refs:1,parts:a}}}}function o(){var e=document.createElement("style");return e.type="text/css",f.appendChild(e),e}function i(e){var t,n,r=document.querySelector('style[data-vue-ssr-id~="'+e.id+'"]');if(r){if(v)return m;r.parentNode.removeChild(r)}if(b){var i=p++;r=u||(u=o()),t=a.bind(null,r,i,!1),n=a.bind(null,r,i,!0)}else r=o(),t=s.bind(null,r),n=function(){r.parentNode.removeChild(r)};return t(e),function(r){if(r){if(r.css===e.css&&r.media===e.media&&r.sourceMap===e.sourceMap)return;t(e=r)}else n()}}function a(e,t,n,r){var o=n?"":r.css;if(e.styleSheet)e.styleSheet.cssText=h(t,o);else{var i=document.createTextNode(o),a=e.childNodes;a[t]&&e.removeChild(a[t]),a.length?e.insertBefore(i,a[t]):e.appendChild(i)}}function s(e,t){var n=t.css,r=t.media,o=t.sourceMap;if(r&&e.setAttribute("media",r),o&&(n+="\n/*# sourceURL="+o.sources[0]+" */",n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(o))))+" */"),e.styleSheet)e.styleSheet.cssText=n;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(n))}}var l="undefined"!=typeof document,c=n(4),d={},f=l&&(document.head||document.getElementsByTagName("head")[0]),u=null,p=0,v=!1,m=function(){},b="undefined"!=typeof navigator&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());e.exports=function(e,t,n){v=n;var o=c(e,t);return r(o),function(t){for(var n=[],i=0;i<o.length;i++){var a=o[i],s=d[a.id];s.refs--,n.push(s)}t?(o=c(e,t),r(o)):o=[];for(var i=0;i<n.length;i++){var s=n[i];if(0===s.refs){for(var l=0;l<s.parts.length;l++)s.parts[l]();delete d[s.id]}}}};var h=function(){var e=[];return function(t,n){return e[t]=n,e.filter(Boolean).join("\n")}}()},4:function(e,t){e.exports=function(e,t){for(var n=[],r={},o=0;o<t.length;o++){var i=t[o],a=i[0],s=i[1],l=i[2],c=i[3],d={id:e+":"+o,css:s,media:l,sourceMap:c};r[a]?r[a].parts.push(d):n.push(r[a]={id:a,parts:[d]})}return n}},5:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n=function(){var e=function(e){e.preventDefault(),e.stopPropagation()},t=!1;return{lock:function(n){t||(t=!0,(n||document).addEventListener("touchmove",e))},unlock:function(n){t=!1,(n||document).removeEventListener("touchmove",e)}}}(),r=function(){return{lock:function(e){o&&c(e||document.body,"g-fix-ios-prevent-scroll")},unlock:function(e){o&&d(e||document.body,"g-fix-ios-prevent-scroll")}}}(),o=!!(window.navigator&&window.navigator.userAgent||"").match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),i=function(e){var t=/^#([a-fA-F0-9]){3}(([a-fA-F0-9]){3})?$/,n=/^[rR][gG][bB][aA]\(\s*((25[0-5]|2[0-4]\d|1?\d{1,2})\s*,\s*){3}\s*(\.|\d+\.)?\d+\s*\)$/,r=/^[rR][gG][bB]\(\s*((25[0-5]|2[0-4]\d|1?\d{1,2})\s*,\s*){2}(25[0-5]|2[0-4]\d|1?\d{1,2})\s*\)$/;return t.test(e)||n.test(e)||r.test(e)},a=function(e){for(var t=e;t&&"HTML"!==t.tagName&&"BODY"!==t.tagName&&1===t.nodeType;){var n=document.defaultView.getComputedStyle(t).overflowY;if("scroll"===n||"auto"===n)return t;t=t.parentNode}return window},s=function(e,t){var n=e===window?document.body.offsetHeight:e.offsetHeight,r=e===window?0:e.getBoundingClientRect().top,o=t.getBoundingClientRect().top-r,i=o+t.offsetHeight;return o>=0&&o<n||i>0&&i<=n},l=function(e,t){return t=t||"",!(0===t.replace(/\s/g,"").length||!e)&&new RegExp(" "+t+" ").test(" "+e.className+" ")},c=function(e,t){l(e,t)||(e.className=""===e.className?t:e.className+" "+t)},d=function(e,t){if(l(e,t)){for(var n=" "+e.className.replace(/[\t\r\n]/g,"")+" ";n.indexOf(" "+t+" ")>=0;)n=n.replace(" "+t+" "," ");e.className=n.replace(/^\s+|\s+$/g,"")}},f=function(e){function t(n,r,o){if(n===r)return void("function"==typeof i&&i());var a=n+o>r?r:n+o;n>r&&(a=n-o<r?r:n-o),e===window?window.scrollTo(a,a):e.scrollTop=a,window.requestAnimationFrame(function(){return t(a,r,o)})}var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,r=arguments[2],o=arguments.length>3&&void 0!==arguments[3]?arguments[3]:500,i=arguments[4];window.requestAnimationFrame||(window.requestAnimationFrame=window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||function(e){return window.setTimeout(e,1e3/60)});var a=Math.abs(n-r),s=Math.ceil(a/o*50);t(n,r,s)};t.pageScroll=n,t.preventScroll=r,t.isIOS=o,t.isColor=i,t.getScrollview=a,t.checkInview=s,t.addClass=c,t.removeClass=d,t.scrollTop=f},60:function(e,t,n){t=e.exports=n(2)(),t.push([e.id,'.yd-navbar{height:.9rem;position:relative;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.yd-navbar:after{content:"";position:absolute;z-index:2;bottom:0;left:0;width:100%;border-bottom:1px solid #b2b2b2;-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 0;transform-origin:0 0}.yd-navbar-fixed{position:fixed;top:0;left:0;width:100%;z-index:100}.yd-navbar-item{-webkit-box-flex:0;-webkit-flex:0 0 25%;-ms-flex:0 0 25%;flex:0 0 25%;padding:0 .2rem;font-size:.3rem;white-space:nowrap;overflow:hidden;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;color:inherit}.yd-navbar-item:first-child{-webkit-box-ordinal-group:2;-webkit-order:1;-ms-flex-order:1;order:1;margin-right:-25%}.yd-navbar-item:last-child{-webkit-box-ordinal-group:4;-webkit-order:3;-ms-flex-order:3;order:3}.yd-navbar-item:last-child,.yd-navbar-item:last-child>a{-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}.yd-navbar-item>a{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;height:.9rem;min-width:25%;-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1}.yd-navbar-center-box{-webkit-box-ordinal-group:3;-webkit-order:2;-ms-flex-order:2;order:2;height:.9rem;width:50%;margin-left:25%}.yd-navbar-center{width:100%;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;height:inherit}.yd-navbar-center-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yd-navbar-center img{height:60%}.yd-back-icon:before,.yd-next-icon:before{display:inline-block;font-family:YDUI-INLAY;font-size:.36rem;color:inherit}.yd-back-icon:before{content:"\\E607"}.yd-next-icon:before{content:"\\E608"}',""])},107:function(e,t,n){var r=n(1)(n(280),n(148),null,null);e.exports=r.exports},108:function(e,t,n){var r=n(1)(n(281),n(160),null,null);e.exports=r.exports},109:function(e,t,n){n(231);var r=n(1)(n(282),n(184),null,null);e.exports=r.exports},148:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("span",[n("i",{staticClass:"yd-back-icon",style:{color:e.color}}),e._t("default")],2)},staticRenderFns:[]}},160:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("span",[e._t("default"),n("i",{staticClass:"yd-next-icon",style:{color:e.color}})],2)},staticRenderFns:[]}},184:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("header",{staticClass:"yd-navbar navbar-bottom-line-color",class:e.classes,style:{backgroundColor:e.bgcolor,height:e.height}},[n("div",{staticClass:"yd-navbar-item"},[e._t("left")],2),e._v(" "),n("div",{staticClass:"yd-navbar-center-box",style:{height:e.height}},[n("div",{staticClass:"yd-navbar-center"},[e._t("center",[n("span",{staticClass:"yd-navbar-center-title",style:{color:e.color,fontSize:e.fontsize}},[e._v(e._s(e.title))])])],2)]),e._v(" "),n("div",{staticClass:"yd-navbar-item"},[e._t("right")],2)])},staticRenderFns:[]}},231:function(e,t,n){var r=n(60);"string"==typeof r&&(r=[[e.id,r,""]]),r.locals&&(e.exports=r.locals);n(3)("259181be",r,!0)},280:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(5);t.default={name:"yd-navbar-back-icon",props:{color:{validator:function(e){return!e||(0,r.isColor)(e)},default:"#5C5C5C"}}}},281:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(5);t.default={name:"yd-navbar-next-icon",props:{color:{validator:function(e){return!e||(0,r.isColor)(e)},default:"#5C5C5C"}}}},282:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var r=n(5);t.default={name:"yd-navbar",props:{title:String,fixed:Boolean,bgcolor:{validator:function(e){return!e||(0,r.isColor)(e)},default:"#FFF"},color:{validator:function(e){return!e||(0,r.isColor)(e)},default:"#5C5C5C"},fontsize:{validator:function(e){return/^(\.|\d+\.)?\d+(px|rem)$/.test(e)},default:".4rem"},height:{validator:function(e){return/^(\.|\d+\.)?\d+(px|rem)$/.test(e)},default:"1rem"}},computed:{classes:function(){return this.fixed?"yd-navbar-fixed":""}}}}})});

/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

/*! vue-ydui v1.2.1 by YDCSS (c) 2018 Licensed MIT */
!function(t,e){ true?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.ydui=e():t.ydui=e()}(this,function(){return function(t){function e(i){if(n[i])return n[i].exports;var r=n[i]={exports:{},id:i,loaded:!1};return t[i].call(r.exports,r,r.exports,e),r.loaded=!0,r.exports}var n={};return e.m=t,e.c=n,e.p="/dist/",e(0)}({0:function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.RollNoticeItem=e.RollNotice=void 0;var r=n(120),o=i(r),s=n(119),a=i(s);e.RollNotice=o.default,e.RollNoticeItem=a.default},1:function(t,e){t.exports=function(t,e,n,i){var r,o=t=t||{},s=typeof t.default;"object"!==s&&"function"!==s||(r=t,o=t.default);var a="function"==typeof o?o.options:o;if(e&&(a.render=e.render,a.staticRenderFns=e.staticRenderFns),n&&(a._scopeId=n),i){var l=a.computed||(a.computed={});Object.keys(i).forEach(function(t){var e=i[t];l[t]=function(){return e}})}return{esModule:r,exports:o,options:a}}},2:function(t,e){t.exports=function(){var t=[];return t.toString=function(){for(var t=[],e=0;e<this.length;e++){var n=this[e];n[2]?t.push("@media "+n[2]+"{"+n[1]+"}"):t.push(n[1])}return t.join("")},t.i=function(e,n){"string"==typeof e&&(e=[[null,e,""]]);for(var i={},r=0;r<this.length;r++){var o=this[r][0];"number"==typeof o&&(i[o]=!0)}for(r=0;r<e.length;r++){var s=e[r];"number"==typeof s[0]&&i[s[0]]||(n&&!s[2]?s[2]=n:n&&(s[2]="("+s[2]+") and ("+n+")"),t.push(s))}},t}},3:function(t,e,n){function i(t){for(var e=0;e<t.length;e++){var n=t[e],i=c[n.id];if(i){i.refs++;for(var r=0;r<i.parts.length;r++)i.parts[r](n.parts[r]);for(;r<n.parts.length;r++)i.parts.push(o(n.parts[r]));i.parts.length>n.parts.length&&(i.parts.length=n.parts.length)}else{for(var s=[],r=0;r<n.parts.length;r++)s.push(o(n.parts[r]));c[n.id]={id:n.id,refs:1,parts:s}}}}function r(){var t=document.createElement("style");return t.type="text/css",d.appendChild(t),t}function o(t){var e,n,i=document.querySelector('style[data-vue-ssr-id~="'+t.id+'"]');if(i){if(h)return m;i.parentNode.removeChild(i)}if(y){var o=p++;i=f||(f=r()),e=s.bind(null,i,o,!1),n=s.bind(null,i,o,!0)}else i=r(),e=a.bind(null,i),n=function(){i.parentNode.removeChild(i)};return e(t),function(i){if(i){if(i.css===t.css&&i.media===t.media&&i.sourceMap===t.sourceMap)return;e(t=i)}else n()}}function s(t,e,n,i){var r=n?"":i.css;if(t.styleSheet)t.styleSheet.cssText=v(e,r);else{var o=document.createTextNode(r),s=t.childNodes;s[e]&&t.removeChild(s[e]),s.length?t.insertBefore(o,s[e]):t.appendChild(o)}}function a(t,e){var n=e.css,i=e.media,r=e.sourceMap;if(i&&t.setAttribute("media",i),r&&(n+="\n/*# sourceURL="+r.sources[0]+" */",n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */"),t.styleSheet)t.styleSheet.cssText=n;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(n))}}var l="undefined"!=typeof document,u=n(4),c={},d=l&&(document.head||document.getElementsByTagName("head")[0]),f=null,p=0,h=!1,m=function(){},y="undefined"!=typeof navigator&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());t.exports=function(t,e,n){h=n;var r=u(t,e);return i(r),function(e){for(var n=[],o=0;o<r.length;o++){var s=r[o],a=c[s.id];a.refs--,n.push(a)}e?(r=u(t,e),i(r)):r=[];for(var o=0;o<n.length;o++){var a=n[o];if(0===a.refs){for(var l=0;l<a.parts.length;l++)a.parts[l]();delete c[a.id]}}}};var v=function(){var t=[];return function(e,n){return t[e]=n,t.filter(Boolean).join("\n")}}()},4:function(t,e){t.exports=function(t,e){for(var n=[],i={},r=0;r<e.length;r++){var o=e[r],s=o[0],a=o[1],l=o[2],u=o[3],c={id:t+":"+r,css:a,media:l,sourceMap:u};i[s]?i[s].parts.push(c):n.push(i[s]={id:s,parts:[c]})}return n}},52:function(t,e,n){e=t.exports=n(2)(),e.push([t.id,".yd-rollnotice{overflow:hidden;width:100%;background-color:#fff}.yd-rollnotice-box{height:inherit}.yd-rollnotice-align-left{-webkit-box-pack:start;-webkit-justify-content:flex-start;-ms-flex-pack:start;justify-content:flex-start}.yd-rollnotice-align-right{-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}.yd-rollnotice-align-center{-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.yd-rollnotice-item{height:inherit;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:inherit;-webkit-justify-content:inherit;-ms-flex-pack:inherit;justify-content:inherit}",""])},119:function(t,e,n){var i=n(1)(n(292),n(153),null,null);t.exports=i.exports},120:function(t,e,n){n(223);var i=n(1)(n(293),n(168),null,null);t.exports=i.exports},153:function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-rollnotice-item"},[t._t("default")],2)},staticRenderFns:[]}},168:function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-rollnotice",style:{height:t.height+"px"}},[n("div",{staticClass:"yd-rollnotice-box",class:"yd-rollnotice-align-"+t.align,style:t.styles},[n("div",{staticClass:"yd-rollnotice-item",domProps:{innerHTML:t._s(t.lastItem)}}),t._v(" "),t._t("default"),t._v(" "),n("div",{staticClass:"yd-rollnotice-item",domProps:{innerHTML:t._s(t.firtstItem)}})],2)])},staticRenderFns:[]}},223:function(t,e,n){var i=n(52);"string"==typeof i&&(i=[[t.id,i,""]]),i.locals&&(t.exports=i.locals);n(3)("2e5c7b14",i,!0)},292:function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-rollnotice-item",mounted:function(){this.$parent.init()}}},293:function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-rollnotice",data:function(){return{timer:null,index:1,totalNum:0,firtstItem:"",lastItem:"",styles:{transform:0,transitionDuration:0}}},props:{height:{validator:function(t){return/^\d*$/.test(t)},default:30},speed:{validator:function(t){return/^\d*$/.test(t)},default:500},autoplay:{validator:function(t){return/^\d*$/.test(t)},default:3e3},align:{validator:function(t){return["left","center","right"].indexOf(t)>-1},default:"left"},direction:{validator:function(t){return["up","down"].indexOf(t)>-1},default:"up"}},methods:{init:function(){this.destroy(),this.items=this.$children.filter(function(t){return"yd-rollnotice-item"===t.$options.name}),this.totalNum=this.items.length,this.totalNum<=0||(this.firtstItem=this.items[0].$el.innerHTML,this.lastItem=this.items[this.totalNum-1].$el.innerHTML,this.setTranslate(0,-this.height),this.autoPlay())},autoPlay:function(){var t=this;this.timer=setInterval(function(){"up"===t.direction?(t.setTranslate(t.speed,-(++t.index*t.height)),t.index>=t.totalNum&&(t.index=0,setTimeout(function(){t.setTranslate(0,0)},t.speed))):(t.setTranslate(t.speed,-(--t.index*t.height)),t.index<=0&&(t.index=t.totalNum,setTimeout(function(){t.setTranslate(0,-t.totalNum*t.height)},t.speed)))},this.autoplay)},setTranslate:function(t,e){this.styles.transitionDuration=t+"ms",this.styles.transform="translate3d(0, "+e+"px, 0)"},destroy:function(){clearInterval(this.timer)}},beforeDestroy:function(){this.destroy()}}}})});

/***/ }),
/* 31 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "trend hasfooter"
  }, [_c('div', {
    staticClass: "header"
  }, [_c('yd-navbar', {
    attrs: {
      "title": "主页",
      "bgcolor": "#ed293f",
      "fontsize": "20px",
      "color": "#fff"
    }
  })], 1), _vm._v(" "), _c('div', {
    staticClass: "slider"
  }, [_c('yd-slider', {
    attrs: {
      "autoplay": "3000"
    }
  }, [_vm._l((_vm.Sliderdata), function(item) {
    return [_c('yd-slider-item', [_c('a', {
      attrs: {
        "href": item.to
      }
    }, [_c('img', {
      attrs: {
        "src": item.src
      }
    })])])]
  })], 2)], 1), _vm._v(" "), _c('div', {
    staticClass: "rollnotice"
  }, [_c('yd-rollnotice', {
    attrs: {
      "autoplay": "2000",
      "align": "center"
    }
  }, [_vm._l((_vm.rollnoticedata), function(item) {
    return [_c('yd-rollnotice-item', [_c('span', {
      staticStyle: {
        "color": "#F00"
      }
    }, [_vm._v(" " + _vm._s(item.icon) + " ")]), _vm._v(_vm._s(item.content))])]
  })], 2)], 1), _vm._v(" "), _c('div', {
    staticClass: "group"
  }, [_vm._l((_vm.groupdata), function(item) {
    return [_c('div', {
      staticClass: "groupitem"
    }, [_c('img', {
      attrs: {
        "slot": "icon",
        "src": item.src
      },
      slot: "icon"
    }), _vm._v(" "), _c('p', {
      attrs: {
        "slot": "text"
      },
      slot: "text"
    }, [_vm._v(_vm._s(item.text))])])]
  })], 2)])
},staticRenderFns: []}

/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(33)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(35),
  /* template */
  __webpack_require__(36),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(34);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("329e9080", content, true);

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, "", ""]);

// exports


/***/ }),
/* 35 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    name: 'detailview',
    data() {
        return {};
    },
    created() {},
    mounted() {},
    computed: {},
    methods: {}

});

/***/ }),
/* 36 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "detailview"
  }, [_vm._v("\n    222\n")])
},staticRenderFns: []}

/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(38)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(40),
  /* template */
  __webpack_require__(42),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(39);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("6253ae7a", content, true);

/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, ".uerimages{height:1.5rem!important;margin:.3rem 0}", ""]);

// exports


/***/ }),
/* 40 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_vue__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__ = __webpack_require__(41);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__);
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//
//



__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__["CellGroup"].name, __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__["CellGroup"]);
__WEBPACK_IMPORTED_MODULE_0_vue__["default"].component(__WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__["CellItem"].name, __WEBPACK_IMPORTED_MODULE_1_vue_ydui_dist_lib_rem_cell__["CellItem"]);
/* harmony default export */ __webpack_exports__["default"] = ({
    name: 'person',
    data() {
        return {};
    },
    created() {},
    mounted() {},
    computed: {},
    methods: {}

});

/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

/*! vue-ydui v1.2.1 by YDCSS (c) 2018 Licensed MIT */
!function(e,t){ true?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports.ydui=t():e.ydui=t()}(this,function(){return function(e){function t(l){if(i[l])return i[l].exports;var r=i[l]={exports:{},id:l,loaded:!1};return e[l].call(r.exports,r,r.exports,t),r.loaded=!0,r.exports}var i={};return t.m=e,t.c=i,t.p="/dist/",t(0)}({0:function(e,t,i){"use strict";function l(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(t,"__esModule",{value:!0}),t.CellGroup=t.CellItem=void 0;var r=i(76),n=l(r),o=i(75),c=l(o);t.CellItem=n.default,t.CellGroup=c.default},1:function(e,t){e.exports=function(e,t,i,l){var r,n=e=e||{},o=typeof e.default;"object"!==o&&"function"!==o||(r=e,n=e.default);var c="function"==typeof n?n.options:n;if(t&&(c.render=t.render,c.staticRenderFns=t.staticRenderFns),i&&(c._scopeId=i),l){var s=c.computed||(c.computed={});Object.keys(l).forEach(function(e){var t=l[e];s[e]=function(){return t}})}return{esModule:r,exports:n,options:c}}},2:function(e,t){e.exports=function(){var e=[];return e.toString=function(){for(var e=[],t=0;t<this.length;t++){var i=this[t];i[2]?e.push("@media "+i[2]+"{"+i[1]+"}"):e.push(i[1])}return e.join("")},e.i=function(t,i){"string"==typeof t&&(t=[[null,t,""]]);for(var l={},r=0;r<this.length;r++){var n=this[r][0];"number"==typeof n&&(l[n]=!0)}for(r=0;r<t.length;r++){var o=t[r];"number"==typeof o[0]&&l[o[0]]||(i&&!o[2]?o[2]=i:i&&(o[2]="("+o[2]+") and ("+i+")"),e.push(o))}},e}},3:function(e,t,i){function l(e){for(var t=0;t<e.length;t++){var i=e[t],l=d[i.id];if(l){l.refs++;for(var r=0;r<l.parts.length;r++)l.parts[r](i.parts[r]);for(;r<i.parts.length;r++)l.parts.push(n(i.parts[r]));l.parts.length>i.parts.length&&(l.parts.length=i.parts.length)}else{for(var o=[],r=0;r<i.parts.length;r++)o.push(n(i.parts[r]));d[i.id]={id:i.id,refs:1,parts:o}}}}function r(){var e=document.createElement("style");return e.type="text/css",f.appendChild(e),e}function n(e){var t,i,l=document.querySelector('style[data-vue-ssr-id~="'+e.id+'"]');if(l){if(u)return h;l.parentNode.removeChild(l)}if(m){var n=y++;l=p||(p=r()),t=o.bind(null,l,n,!1),i=o.bind(null,l,n,!0)}else l=r(),t=c.bind(null,l),i=function(){l.parentNode.removeChild(l)};return t(e),function(l){if(l){if(l.css===e.css&&l.media===e.media&&l.sourceMap===e.sourceMap)return;t(e=l)}else i()}}function o(e,t,i,l){var r=i?"":l.css;if(e.styleSheet)e.styleSheet.cssText=g(t,r);else{var n=document.createTextNode(r),o=e.childNodes;o[t]&&e.removeChild(o[t]),o.length?e.insertBefore(n,o[t]):e.appendChild(n)}}function c(e,t){var i=t.css,l=t.media,r=t.sourceMap;if(l&&e.setAttribute("media",l),r&&(i+="\n/*# sourceURL="+r.sources[0]+" */",i+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(r))))+" */"),e.styleSheet)e.styleSheet.cssText=i;else{for(;e.firstChild;)e.removeChild(e.firstChild);e.appendChild(document.createTextNode(i))}}var s="undefined"!=typeof document,a=i(4),d={},f=s&&(document.head||document.getElementsByTagName("head")[0]),p=null,y=0,u=!1,h=function(){},m="undefined"!=typeof navigator&&/msie [6-9]\b/.test(navigator.userAgent.toLowerCase());e.exports=function(e,t,i){u=i;var r=a(e,t);return l(r),function(t){for(var i=[],n=0;n<r.length;n++){var o=r[n],c=d[o.id];c.refs--,i.push(c)}t?(r=a(e,t),l(r)):r=[];for(var n=0;n<i.length;n++){var c=i[n];if(0===c.refs){for(var s=0;s<c.parts.length;s++)c.parts[s]();delete d[c.id]}}}};var g=function(){var e=[];return function(t,i){return e[t]=i,e.filter(Boolean).join("\n")}}()},4:function(e,t){e.exports=function(e,t){for(var i=[],l={},r=0;r<t.length;r++){var n=t[r],o=n[0],c=n[1],s=n[2],a=n[3],d={id:e+":"+r,css:c,media:s,sourceMap:a};l[o]?l[o].parts.push(d):i.push(l[o]={id:o,parts:[d]})}return i}},53:function(e,t,i){t=e.exports=i(2)(),t.push([e.id,'.yd-cell-box{margin-bottom:.35rem}.yd-cell{background-color:#fff;position:relative;z-index:5}.yd-cell:after{content:"";position:absolute;z-index:0;bottom:0;left:0;width:100%;border-bottom:1px solid #b2b2b2;-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 0;transform-origin:0 0}.yd-cell a.yd-cell-item,.yd-cell label.yd-cell-item{background-color:#fff}.yd-cell a.yd-cell-item:active,.yd-cell label.yd-cell-item:active{background-color:#f5f5f5}.yd-cell-item{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;position:relative;padding-left:.24rem;overflow:hidden}.yd-cell-item:not(:last-child):after{margin-left:.24rem;content:"";position:absolute;z-index:0;bottom:0;left:0;width:100%;border-bottom:1px solid #d9d9d9;-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 0;transform-origin:0 0}.yd-cell-left{color:#333;font-size:.3rem;white-space:nowrap;-ms-flex-align:center}.yd-cell-left,.yd-cell-right{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;align-items:center}.yd-cell-right{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1;width:100%;min-height:1rem;color:#525252;text-align:right;font-size:.26rem;padding-right:.24rem;-ms-flex-align:center;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}.yd-cell-right input[type=date],.yd-cell-right input[type=datetime-local],.yd-cell-right input[type=time]{line-height:1rem}.yd-cell-right input[type=checkbox]:not(.yd-switch),.yd-cell-right input[type=radio]{position:absolute;left:-9999em}.yd-cell-right input[type=checkbox]:not(.yd-switch)+.yd-cell-checkbox-icon:after,.yd-cell-right input[type=checkbox]:not(.yd-switch)+.yd-cell-radio-icon:after,.yd-cell-right input[type=radio]+.yd-cell-checkbox-icon:after,.yd-cell-right input[type=radio]+.yd-cell-radio-icon:after{font-family:YDUI-INLAY;font-size:.44rem}.yd-cell-right input[type=checkbox]:not(.yd-switch)+.yd-cell-radio-icon:after,.yd-cell-right input[type=radio]+.yd-cell-radio-icon:after{content:"\\E600";color:#4cd864;display:none}.yd-cell-right input[type=checkbox]:not(.yd-switch)+.yd-cell-checkbox-icon:after,.yd-cell-right input[type=radio]+.yd-cell-checkbox-icon:after{content:"\\E604";color:#d9d9d9}.yd-cell-right input[type=checkbox]:not(.yd-switch):checked+.yd-cell-radio-icon:after,.yd-cell-right input[type=radio]:checked+.yd-cell-radio-icon:after{display:inline-block}.yd-cell-right input[type=checkbox]:not(.yd-switch):checked+.yd-cell-checkbox-icon:after,.yd-cell-right input[type=radio]:checked+.yd-cell-checkbox-icon:after{color:#4cd864;content:"\\E601"}.yd-cell-right:active{background:none}.yd-cell-right .yd-input-clear,.yd-cell-right .yd-input-password{height:1rem}.yd-cell-right .yd-datetime-input,.yd-cell-right input[type=date],.yd-cell-right input[type=datetime-local],.yd-cell-right input[type=email],.yd-cell-right input[type=number]:not(.yd-spinner-input),.yd-cell-right input[type=password],.yd-cell-right input[type=tel],.yd-cell-right input[type=text],.yd-cell-right input[type=time],.yd-cell-right input[type=url]{width:1%;-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1;height:1rem;border:none;font-size:.3rem;background:transparent;color:#555;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-pack:start;-webkit-justify-content:flex-start;-ms-flex-pack:start;justify-content:flex-start;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;text-align:left}.yd-cell-right select{-webkit-box-flex:1;-webkit-flex:1;-ms-flex:1;flex:1;height:1rem;border:none;display:block;color:#a9a9a9;font-size:.3rem;margin-left:-.08rem}.yd-cell-icon{display:block;margin-right:.1rem}.yd-cell-icon img{height:.4rem}.yd-cell-arrow:after{margin-left:.05rem;margin-right:-.08rem;display:block;font-family:YDUI-INLAY;font-size:.34rem;color:#c9c9c9;content:"\\E608"}.yd-cell-title{padding:0 .24rem .1rem;font-size:.3rem;text-align:left;color:#888;position:relative;z-index:1;background-color:#f5f5f5}.yd-cell-title:after{content:"";position:absolute;z-index:3;bottom:0;left:0;width:100%;border-bottom:1px solid #d9d9d9;-webkit-transform:scaleY(.5);transform:scaleY(.5);-webkit-transform-origin:0 0;transform-origin:0 0}',""])},75:function(e,t,i){var l=i(1)(i(249),i(192),null,null);e.exports=l.exports},76:function(e,t,i){i(224);var l=i(1)(i(250),i(169),null,null);e.exports=l.exports},169:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,i=e._self._c||t;return"label"==e.type||"checkbox"==e.type||"radio"==e.type?i("label",{staticClass:"yd-cell-item"},[e.checkLeft?i("span",{staticClass:"yd-cell-left"},[i("span",{staticClass:"yd-cell-icon"},[e._t("icon")],2),e._v(" "),e._t("left")],2):e._e(),e._v(" "),i("label",{staticClass:"yd-cell-right",class:e.classes},[e._t("right"),e._v(" "),"checkbox"==e.type?i("i",{staticClass:"yd-cell-checkbox-icon"}):e._e(),e._v(" "),"radio"==e.type?i("i",{staticClass:"yd-cell-radio-icon"}):e._e()],2)]):"link"==e.type?i("router-link",{staticClass:"yd-cell-item",attrs:{to:e.href}},[e.checkLeft?i("div",{staticClass:"yd-cell-left"},[i("span",{staticClass:"yd-cell-icon"},[e._t("icon")],2),e._v(" "),e._t("left")],2):e._e(),e._v(" "),i("div",{staticClass:"yd-cell-right",class:e.classes},[e._t("right")],2)]):"a"==e.type?i("a",{staticClass:"yd-cell-item",attrs:{href:e.href}},[e.checkLeft?i("div",{staticClass:"yd-cell-left"},[i("span",{staticClass:"yd-cell-icon"},[e._t("icon")],2),e._v(" "),e._t("left")],2):e._e(),e._v(" "),i("div",{staticClass:"yd-cell-right",class:e.classes},[e._t("right")],2)]):i("div",{staticClass:"yd-cell-item"},[e.checkLeft?i("div",{staticClass:"yd-cell-left"},[i("span",{staticClass:"yd-cell-icon"},[e._t("icon")],2),e._v(" "),e._t("left")],2):e._e(),e._v(" "),i("div",{staticClass:"yd-cell-right",class:e.classes},[e._t("right")],2)])},staticRenderFns:[]}},192:function(e,t){e.exports={render:function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{staticClass:"yd-cell-box"},[i("div",{staticClass:"yd-cell"},[e.title?i("div",{staticClass:"yd-cell-title"},[e._v(e._s(e.title))]):e._e(),e._v(" "),e._t("default")],2),e._v(" "),e._t("bottom")],2)},staticRenderFns:[]}},224:function(e,t,i){var l=i(53);"string"==typeof l&&(l=[[e.id,l,""]]),l.locals&&(e.exports=l.locals);i(3)("5a29a3fa",l,!0)},249:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"yd-cell-group",props:{title:String}}},250:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.default={name:"yd-cell-item",props:{type:{validator:function(e){return["link","a","label","div","checkbox","radio"].indexOf(e)>-1},default:"div"},arrow:{type:Boolean,default:!1},href:{type:[String,Object]}},computed:{checkLeft:function(){return!!this.$slots.left||!!this.$slots.icon},classes:function(){return this.arrow?"yd-cell-arrow":""}}}}})});

/***/ }),
/* 42 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "person hasfooter"
  }, [_c('div', {
    staticClass: "header"
  }, [_c('yd-navbar', {
    attrs: {
      "title": "我 的",
      "bgcolor": "#ed293f",
      "fontsize": "20px",
      "color": "#fff"
    }
  })], 1), _vm._v(" "), _c('yd-cell-group', [_c('yd-cell-item', {
    attrs: {
      "arrow": ""
    }
  }, [_c('img', {
    staticClass: "uerimages",
    attrs: {
      "slot": "icon",
      "src": "/assets/images/person-active.png"
    },
    slot: "icon"
  }), _vm._v(" "), _c('span', {
    attrs: {
      "slot": "left"
    },
    slot: "left"
  }, [_vm._v("我的")]), _vm._v(" "), _c('span', {
    attrs: {
      "slot": "right"
    },
    slot: "right"
  }, [_vm._v("个人信息")])])], 1)], 1)
},staticRenderFns: []}

/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {


/* styles */
__webpack_require__(44)

var Component = __webpack_require__(2)(
  /* script */
  __webpack_require__(46),
  /* template */
  __webpack_require__(47),
  /* scopeId */
  null,
  /* cssModules */
  null
)

module.exports = Component.exports


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(45);
if(typeof content === 'string') content = [[module.i, content, '']];
if(content.locals) module.exports = content.locals;
// add the styles to the DOM
var update = __webpack_require__(1)("6d1eeee4", content, true);

/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(0)();
// imports


// module
exports.push([module.i, "", ""]);

// exports


/***/ }),
/* 46 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
//
//
//
//
//
//

/* harmony default export */ __webpack_exports__["default"] = ({
    name: 'explain',
    data() {
        return {};
    },
    created() {},
    mounted() {},
    computed: {},
    methods: {}

});

/***/ }),
/* 47 */
/***/ (function(module, exports) {

module.exports={render:function (){var _vm=this;var _h=_vm.$createElement;var _c=_vm._self._c||_h;
  return _c('div', {
    staticClass: "explain"
  }, [_vm._v("\n    333\n")])
},staticRenderFns: []}

/***/ }),
/* 48 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";

/* harmony default export */ __webpack_exports__["a"] = ({});

/***/ }),
/* 49 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

/*! vue-ydui v1.2.1 by YDCSS (c) 2018 Licensed MIT */
!function(t,e){ true?module.exports=e(__webpack_require__(3)):"function"==typeof define&&define.amd?define(["vue"],e):"object"==typeof exports?exports.ydui=e(require("vue")):t.ydui=e(t.Vue)}(this,function(t){return function(t){function e(i){if(n[i])return n[i].exports;var r=n[i]={exports:{},id:i,loaded:!1};return t[i].call(r.exports,r,r.exports,e),r.loaded=!0,r.exports}var n={};return e.m=t,e.c=n,e.p="/dist/",e(0)}([function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),n(13);var i=n(287),r=n(299),o=n(276),a=n(302),s=n(277),l=n(317),c=n(294),u=n(295),d=n(301),f=n(296),h=n(306),p=n(275),m=n(319),A=n(318),v=n(311),g=n(273),_=n(313),y=n(298),b=n(314),x=n(315),w=n(280),C=n(305),k=n(281),B=n(308),T=n(320),M=n(303),E=n(282),D=n(309),I=n(297),S=n(293),$=n(307),F=n(278),P=n(274),H=n(272),O=n(284),V=n(300),N=n(321),R=n(316),L=n(279),j=n(312),Q=n(310),Y=n(304);window.document.addEventListener("touchstart",function(t){},!1);var G=function(t){t.component(r.Layout.name,r.Layout),t.component(o.Button.name,o.Button),t.component(o.ButtonGroup.name,o.ButtonGroup),t.component(a.NavBar.name,a.NavBar),t.component(a.NavBarBackIcon.name,a.NavBarBackIcon),t.component(a.NavBarNextIcon.name,a.NavBarNextIcon),t.component(s.CellGroup.name,s.CellGroup),t.component(s.CellItem.name,s.CellItem),t.component(l.Switch.name,l.Switch),t.component(c.GridsItem.name,c.GridsItem),t.component(c.GridsGroup.name,c.GridsGroup),t.component(u.Icons.name,u.Icons),t.component(d.ListTheme.name,d.ListTheme),t.component(d.ListItem.name,d.ListItem),t.component(d.ListOther.name,d.ListOther),t.component(f.InfiniteScroll.name,f.InfiniteScroll),t.component(h.PullRefresh.name,h.PullRefresh),t.component(p.Badge.name,p.Badge),t.component(m.TabBar.name,m.TabBar),t.component(m.TabBarItem.name,m.TabBarItem),t.component(A.Tab.name,A.Tab),t.component(A.TabPanel.name,A.TabPanel),t.component(v.ScrollTab.name,v.ScrollTab),t.component(v.ScrollTabPanel.name,v.ScrollTabPanel),t.component(g.ActionSheet.name,g.ActionSheet),t.component(_.SendCode.name,_.SendCode),t.component(y.KeyBoard.name,y.KeyBoard),t.component(b.Slider.name,b.Slider),t.component(b.SliderItem.name,b.SliderItem),t.component(x.Spinner.name,x.Spinner),t.component(w.CitySelect.name,w.CitySelect),t.component(C.ProgressBar.name,C.ProgressBar),t.component(k.CountDown.name,k.CountDown),t.component(B.Rate.name,B.Rate),t.component(T.TextArea.name,T.TextArea),t.component(M.Popup.name,M.Popup),t.component(E.CountUp.name,E.CountUp),t.component(D.RollNotice.name,D.RollNotice),t.component(D.RollNoticeItem.name,D.RollNoticeItem),t.component(I.Input.name,I.Input),t.component(S.FlexBox.name,S.FlexBox),t.component(S.FlexBoxItem.name,S.FlexBoxItem),t.component($.Radio.name,$.Radio),t.component($.RadioGroup.name,$.RadioGroup),t.component(F.CheckBox.name,F.CheckBox),t.component(F.CheckBoxGroup.name,F.CheckBoxGroup),t.component(P.BackTop.name,P.BackTop),t.component(H.Accordion.name,H.Accordion),t.component(H.AccordionItem.name,H.AccordionItem),t.component(O.DateTime.name,O.DateTime),t.component(V.LightBox.name,V.LightBox),t.component(V.LightBoxImg.name,V.LightBoxImg),t.component(V.LightBoxTxt.name,V.LightBoxTxt),t.component(N.TimeLine.name,N.TimeLine),t.component(N.TimeLineItem.name,N.TimeLineItem),t.component(R.Step.name,R.Step),t.component(R.StepItem.name,R.StepItem),t.component(L.CheckList.name,L.CheckList),t.component(L.CheckListItem.name,L.CheckListItem),t.component(j.Search.name,j.Search),t.component(Q.ScrollNav.name,Q.ScrollNav),t.component(Q.ScrollNavPanel.name,Q.ScrollNavPanel),t.component(Y.Preview.name,Y.Preview),t.component(Y.PreviewHeader.name,Y.PreviewHeader),t.component(Y.PreviewItem.name,Y.PreviewItem),t.prototype.$dialog={confirm:i.Confirm,alert:i.Alert,toast:i.Toast,notify:i.Notify,loading:i.Loading}};"undefined"!=typeof window&&window.Vue&&G(window.Vue),e.default={install:G}},function(t,e){t.exports=function(t,e,n,i){var r,o=t=t||{},a=typeof t.default;"object"!==a&&"function"!==a||(r=t,o=t.default);var s="function"==typeof o?o.options:o;if(e&&(s.render=e.render,s.staticRenderFns=e.staticRenderFns),n&&(s._scopeId=n),i){var l=s.computed||(s.computed={});Object.keys(i).forEach(function(t){var e=i[t];l[t]=function(){return e}})}return{esModule:r,exports:o,options:s}}},,,function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var n=function(){var t=function(t){t.preventDefault(),t.stopPropagation()},e=!1;return{lock:function(n){e||(e=!0,(n||document).addEventListener("touchmove",t))},unlock:function(n){e=!1,(n||document).removeEventListener("touchmove",t)}}}(),i=function(){return{lock:function(t){r&&c(t||document.body,"g-fix-ios-prevent-scroll")},unlock:function(t){r&&u(t||document.body,"g-fix-ios-prevent-scroll")}}}(),r=!!(window.navigator&&window.navigator.userAgent||"").match(/\(i[^;]+;( U;)? CPU.+Mac OS X/),o=function(t){var e=/^#([a-fA-F0-9]){3}(([a-fA-F0-9]){3})?$/,n=/^[rR][gG][bB][aA]\(\s*((25[0-5]|2[0-4]\d|1?\d{1,2})\s*,\s*){3}\s*(\.|\d+\.)?\d+\s*\)$/,i=/^[rR][gG][bB]\(\s*((25[0-5]|2[0-4]\d|1?\d{1,2})\s*,\s*){2}(25[0-5]|2[0-4]\d|1?\d{1,2})\s*\)$/;return e.test(t)||n.test(t)||i.test(t)},a=function(t){for(var e=t;e&&"HTML"!==e.tagName&&"BODY"!==e.tagName&&1===e.nodeType;){var n=document.defaultView.getComputedStyle(e).overflowY;if("scroll"===n||"auto"===n)return e;e=e.parentNode}return window},s=function(t,e){var n=t===window?document.body.offsetHeight:t.offsetHeight,i=t===window?0:t.getBoundingClientRect().top,r=e.getBoundingClientRect().top-i,o=r+e.offsetHeight;return r>=0&&r<n||o>0&&o<=n},l=function(t,e){return e=e||"",!(0===e.replace(/\s/g,"").length||!t)&&new RegExp(" "+e+" ").test(" "+t.className+" ")},c=function(t,e){l(t,e)||(t.className=""===t.className?e:t.className+" "+e)},u=function(t,e){if(l(t,e)){for(var n=" "+t.className.replace(/[\t\r\n]/g,"")+" ";n.indexOf(" "+e+" ")>=0;)n=n.replace(" "+e+" "," ");t.className=n.replace(/^\s+|\s+$/g,"")}},d=function(t){function e(n,i,r){if(n===i)return void("function"==typeof o&&o());var a=n+r>i?i:n+r;n>i&&(a=n-r<i?i:n-r),t===window?window.scrollTo(a,a):t.scrollTop=a,window.requestAnimationFrame(function(){return e(a,i,r)})}var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,i=arguments[2],r=arguments.length>3&&void 0!==arguments[3]?arguments[3]:500,o=arguments[4];window.requestAnimationFrame||(window.requestAnimationFrame=window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.msRequestAnimationFrame||function(t){return window.setTimeout(t,1e3/60)});var a=Math.abs(n-i),s=Math.ceil(a/r*50);e(n,i,s)};e.pageScroll=n,e.preventScroll=i,e.isIOS=r,e.isColor=o,e.getScrollview=a,e.checkInview=s,e.addClass=c,e.removeClass=u,e.scrollTop=d},function(e,n){e.exports=t},function(t,e,n){n(39);var i=n(1)(n(238),n(162),null,null);t.exports=i.exports},function(t,e,n){n(29);var i=n(1)(n(205),n(147),null,null);t.exports=i.exports},function(t,e,n){n(23);var i=n(1)(n(228),n(134),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(259),n(139),null,null);t.exports=i.exports},function(t,e,n){n(37);var i=n(1)(n(260),n(159),null,null);t.exports=i.exports},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={isDateTimeString:function(t){return/^\d{4}((\.|-|\/)(0[1-9]|1[0-2]))((\.|-|\/)(0[1-9]|[12][0-9]|3[0-1]))( ([01][0-9]|2[0-3]):([012345][0-9]))?$/.test(t)},isMonthString:function(t){return/^\d{4}((\.|-|\/)(0[1-9]|1[0-2]))?$/.test(t)},isDayString:function(t){return/^((0[1-9]|1[0-2]))((\.|-|\/)(0[1-9]|[12][0-9]|3[0-1]))?$/.test(t)},isTimeString:function(t){return/^([01][0-9]|2[0-3]):([012345][0-9])$/.test(t)},mentStr:function(t){return(100+~~t+"").substr(1,2)},getYearItems:function(t){var e=[],n=~~t.startYear,i=~~t.endYear,r=new Date,o=r.getFullYear()-10,a=r.getFullYear()+10;for(0!==n&&(o=n),0!==i&&(a=i),a<o&&(a=o+10),t.startDate&&(o=new Date(t.startDate.replace(/-/g,"/")).getFullYear()),t.endDate&&(a=new Date(t.endDate.replace(/-/g,"/")).getFullYear()),t.startDate>t.endDate&&(a=o+10),o<n&&0!==n&&(o=n),a>i&&0!==i&&(a=i);o<=a;)e.push({value:o,name:t.format.replace("{value}",o)}),o++;return e},getMonthItems:function(t){var e=[],n=1,i=12;if(t.startDate){var r=new Date(t.startDate.replace(/-/g,"/"));r.getFullYear()===~~t.currentYear&&(n=r.getMonth()+1)}if(t.endDate){var o=new Date(t.endDate.replace(/-/g,"/"));o.getFullYear()===~~t.currentYear&&(i=o.getMonth()+1)}for(;n<=i;){var a=this.mentStr(n);e.push({value:a,name:t.format.replace("{value}",a)}),n++}return e},getDayItems:function(t){var e=[],n=new Date,i=n.getFullYear(),r=n.getMonth();t.currentYear&&(i=~~t.currentYear),t.currentMonth&&(r=~~t.currentMonth-1);var o=30;if([0,2,4,6,7,9,11].indexOf(r)>-1?o=31:1===r&&(o=i%100===0?i%400===0?29:28:i%4===0?29:28),t.endDate){var a=new Date(t.endDate.replace(/-/g,"/"));a.getMonth()+1===~~t.currentMonth&&a.getFullYear()===~~t.currentYear&&a.getDate()<o&&(o=a.getDate())}var s=1;if(t.startDate){var l=new Date(t.startDate.replace(/-/g,"/"));l.getMonth()+1===~~t.currentMonth&&l.getFullYear()===~~t.currentYear&&(s=l.getDate())}for(;s<=o;){var c=this.mentStr(s);e.push({value:c,name:t.format.replace("{value}",c)}),s++}return e},getHourItems:function(t){var e=[],n=~~t.startHour,i=~~t.endHour,r=n,o=i;if(o<r&&(o=23),t.startDate){var a=new Date(t.startDate.replace(/-/g,"/"));a.getFullYear()===~~t.currentYear&&a.getMonth()+1===~~t.currentMonth&&a.getDate()===~~t.currentDay&&r<=n&&(r=a.getHours(),r<n&&(r=n))}if(t.endDate){var s=new Date(t.endDate.replace(/-/g,"/"));s.getFullYear()===~~t.currentYear&&s.getMonth()+1===~~t.currentMonth&&s.getDate()===~~t.currentDay&&(o=s.getHours()),o>i&&(o=i)}for(;r<=o;){var l=this.mentStr(r);e.push({value:l,name:t.format.replace("{value}",l)}),r++}return e},getMinuteItems:function(t){var e=[],n=0,i=59;if(t.startDate){var r=new Date(t.startDate.replace(/-/g,"/"));r.getFullYear()===~~t.currentYear&&r.getMonth()+1===~~t.currentMonth&&r.getDate()===~~t.currentDay&&r.getHours()===~~t.currentHour&&(n=r.getMinutes())}if(t.endDate){var o=new Date(t.endDate.replace(/-/g,"/"));o.getFullYear()===~~t.currentYear&&o.getMonth()+1===~~t.currentMonth&&o.getDate()===~~t.currentDay&&o.getHours()===~~t.currentHour&&(i=o.getMinutes())}for(;n<=i;){var a=this.mentStr(n);e.push({value:a,name:t.format.replace("{value}",a)}),n++}return e}}},function(t,e,n){function i(t,e){for(var n=0;n<t.length;n++){var i=t[n],r=h[i.id];if(r){r.refs++;for(var o=0;o<r.parts.length;o++)r.parts[o](i.parts[o]);for(;o<i.parts.length;o++)r.parts.push(c(i.parts[o],e))}else{for(var a=[],o=0;o<i.parts.length;o++)a.push(c(i.parts[o],e));h[i.id]={id:i.id,refs:1,parts:a}}}}function r(t){for(var e=[],n={},i=0;i<t.length;i++){var r=t[i],o=r[0],a=r[1],s=r[2],l=r[3],c={css:a,media:s,sourceMap:l};n[o]?n[o].parts.push(c):e.push(n[o]={id:o,parts:[c]})}return e}function o(t,e){var n=A(),i=_[_.length-1];if("top"===t.insertAt)i?i.nextSibling?n.insertBefore(e,i.nextSibling):n.appendChild(e):n.insertBefore(e,n.firstChild),_.push(e);else{if("bottom"!==t.insertAt)throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");n.appendChild(e)}}function a(t){t.parentNode.removeChild(t);var e=_.indexOf(t);e>=0&&_.splice(e,1)}function s(t){var e=document.createElement("style");return e.type="text/css",o(t,e),e}function l(t){var e=document.createElement("link");return e.rel="stylesheet",o(t,e),e}function c(t,e){var n,i,r;if(e.singleton){var o=g++;n=v||(v=s(e)),i=u.bind(null,n,o,!1),r=u.bind(null,n,o,!0)}else t.sourceMap&&"function"==typeof URL&&"function"==typeof URL.createObjectURL&&"function"==typeof URL.revokeObjectURL&&"function"==typeof Blob&&"function"==typeof btoa?(n=l(e),i=f.bind(null,n),r=function(){a(n),n.href&&URL.revokeObjectURL(n.href)}):(n=s(e),i=d.bind(null,n),r=function(){a(n)});return i(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;i(t=e)}else r()}}function u(t,e,n,i){var r=n?"":i.css;if(t.styleSheet)t.styleSheet.cssText=y(e,r);else{var o=document.createTextNode(r),a=t.childNodes;a[e]&&t.removeChild(a[e]),a.length?t.insertBefore(o,a[e]):t.appendChild(o)}}function d(t,e){var n=e.css,i=e.media;if(i&&t.setAttribute("media",i),t.styleSheet)t.styleSheet.cssText=n;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(n))}}function f(t,e){var n=e.css,i=e.sourceMap;i&&(n+="\n/*# sourceMappingURL=data:application/json;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(i))))+" */");var r=new Blob([n],{type:"text/css"}),o=t.href;t.href=URL.createObjectURL(r),o&&URL.revokeObjectURL(o)}var h={},p=function(t){var e;return function(){return"undefined"==typeof e&&(e=t.apply(this,arguments)),e}},m=p(function(){return/msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase())}),A=p(function(){return document.head||document.getElementsByTagName("head")[0]}),v=null,g=0,_=[];t.exports=function(t,e){e=e||{},"undefined"==typeof e.singleton&&(e.singleton=m()),"undefined"==typeof e.insertAt&&(e.insertAt="bottom");var n=r(t);return i(n,e),function(t){for(var o=[],a=0;a<n.length;a++){var s=n[a],l=h[s.id];l.refs--,o.push(l)}if(t){var c=r(t);i(c,e)}for(var a=0;a<o.length;a++){var l=o[a];if(0===l.refs){for(var u=0;u<l.parts.length;u++)l.parts[u]();delete h[l.id]}}}};var y=function(){var t=[];return function(e,n){return t[e]=n,t.filter(Boolean).join("\n")}}()},function(t,e,n){var i=n(14);"string"==typeof i&&(i=[[t.id,i,""]]);n(12)(i,{});i.locals&&(t.exports=i.locals)},function(t,e,n){e=t.exports=n(15)(),e.push([t.id,'*,:after,:before{box-sizing:border-box;outline:none}body,html{height:100%}body{background-color:#f5f5f5;font-size:12px;-webkit-font-smoothing:antialiased;font-family:arial,sans-serif}blockquote,body,button,dd,dl,dt,fieldset,form,h1,h2,h3,h4,h5,h6,hr,iframe,img,input,legend,li,ol,p,pre,td,textarea,th,ul{margin:0;padding:0}article,aside,audio,details,figcaption,figure,footer,header,mark,menu,nav,section,summary,time,video{display:block;margin:0;padding:0}h1,h2,h3,h4,h5,h6{font-size:100%}fieldset,img{border:0}address,caption,cite,dfn,em,i,th,var{font-style:normal;font-weight:400}ol,ul{list-style:none}a{color:inherit}a,a:hover{text-decoration:none}a,button,input,label,select{-webkit-tap-highlight-color:rgba(0,0,0,0)}button,input,select{font:100% tahoma,\\5b8b\\4f53,arial;vertical-align:baseline;border-radius:0;background-color:transparent}select{-webkit-appearance:none;-moz-appearance:none}button::-moz-focus-inner,input[type=button]::-moz-focus-inner,input[type=file]>input[type=button]::-moz-focus-inner,input[type=reset]::-moz-focus-inner,input[type=submit]::-moz-focus-inner{border:none}input[type=checkbox],input[type=radio]{vertical-align:middle}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none!important;-moz-appearance:none!important;margin:0}input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #fff inset}textarea{outline:none;border-radius:0;-webkit-appearance:none;-moz-appearance:none;overflow:auto;resize:none;font:100% tahoma,\\5b8b\\4f53,arial}@font-face{font-family:YDUI-INLAY;src:url(data:application/x-font-ttf;base64,AAEAAAALAIAAAwAwR1NVQrD+s+0AAAE4AAAAQk9TLzJW+kmeAAABfAAAAFZjbWFwpikNIgAAAjAAAALuZ2x5Zi2mw6cAAAVQAAAKdGhlYWQP7wPbAAAA4AAAADZoaGVhB94DmAAAALwAAAAkaG10eFvpAAAAAAHUAAAAXGxvY2Ed6iBkAAAFIAAAADBtYXhwAScAZwAAARgAAAAgbmFtZT5U/n0AAA/EAAACbXBvc3SBbPGYAAASNAAAAXUAAQAAA4D/gABcBAAAAAAABAAAAQAAAAAAAAAAAAAAAAAAABcAAQAAAAEAAAGgAnVfDzz1AAsEAAAAAADWZ9/1AAAAANZn3/UAAP90BAADgAAAAAgAAgAAAAAAAAABAAAAFwBbAAYAAAAAAAIAAAAKAAoAAAD/AAAAAAAAAAEAAAAKAB4ALAABREZMVAAIAAQAAAAAAAAAAQAAAAFsaWdhAAgAAAABAAAAAQAEAAQAAAABAAgAAQAGAAAAAQAAAAAAAQP/AZAABQAIAokCzAAAAI8CiQLMAAAB6wAyAQgAAAIABQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAUGZFZABAAHjnrQOA/4AAXAOAAIwAAAABAAAAAAAABAAAAAPpAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAEAAAABAAAAAQAAAAAAAAFAAAAAwAAACwAAAAEAAAB1gABAAAAAADQAAMAAQAAACwAAwAKAAAB1gAEAKQAAAAaABAAAwAKAHjmAuYE5g3mFOYm5lHmjOd+54jnmOet//8AAAB45gDmBOYH5hTmJuZR5oznfeeI55jnrP//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAGgAaAB4AHgAqACoAKgAqACoALAAsACwAAAABAAYACAAOAAQACgALAAwADQAPAAMACQAFAAcAAgATABAAEQASABQAFQAWAAABBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAEYAAAAAAAAABYAAAB4AAAAeAAAAAEAAOYAAADmAAAAAAYAAOYBAADmAQAAAAgAAOYCAADmAgAAAA4AAOYEAADmBAAAAAQAAOYHAADmBwAAAAoAAOYIAADmCAAAAAsAAOYJAADmCQAAAAwAAOYKAADmCgAAAA0AAOYLAADmCwAAAA8AAOYMAADmDAAAAAMAAOYNAADmDQAAAAkAAOYUAADmFAAAAAUAAOYmAADmJgAAAAcAAOZRAADmUQAAAAIAAOaMAADmjAAAABMAAOd9AADnfQAAABAAAOd+AADnfgAAABEAAOeIAADniAAAABIAAOeYAADnmAAAABQAAOesAADnrAAAABUAAOetAADnrQAAABYAAAAAAAAAdgCqAPABQgF6AZABzgIOAmoCggKaAw4DOANSA2IDogQ0BHYEigSmBOAFOgAFAAD/4QO8AxgAEwAoADEARABQAAABBisBIg4CHQEhJzQuAisBFSEFFRcUDgMnIychByMiLgM9ARciBhQWMjY0JhcGBwYPAQ4BHgEzITI2Jy4CJwE1ND4COwEyFh0BARkbGlMSJRwSA5ABChgnHoX+SgKiARUfIxwPPi3+SSw/FDIgEwh3DBISGRISjAgGBQUIAgIEDw4BbRcWCQUJCgb+pAUPGhW8HykCHwEMGScaTFkNIBsSYYg0bh0lFwkBAYCAARMbIA6nPxEaEREaEXwaFhMSGQcQDQgYGg0jJBQBd+QLGBMMHSbjAAAAAAIAAP/ZAzEDCgAMABkAAAEOAQcWABc2ADcuAScTDgEHLgEnPgE3HgEXAgKBqgMSAQkTEwEIEwOrgLUCZk1NZwICZ01NZgIDCQOqgI7+nBAQAWSOgKoD/tNNZgICZk1NZgICZk0AAAAAAwAA/8ADwANAAAwAKAApAAABDgEHHgEXPgE3LgEnExYUBiIvAQcGIiY0PwEnJjQ2Mh8BNzYyFhQPARcCAL79BQX9vr79BQX9vrcJExoKiYoKGRQKiooJExoKiYoKGhMKiooDQAX9vr79BQX9vr79Bf22ChkTCYqJCRQZCoiKChkTCYqJCRQZCoiKAAADAAD/uQPEA0AAIQAuAC8AABM1NzY3Njc2NzY/ATMXFhcWFxYXFgcGBwYHBicmJyYnJicBPgE3LgEnDgEHHgEXMUABAwYVRElrQEYWGQc+OnxTWAwGDQ8mQG1ygEE8ukwZBQG+qNwEBN2npt4EBN6mAXEcBiQjalRaLBsFAgECFChla4pAP0pBbDs9CAQXR7g+Qv6dBN6mp90EBN2np90EAAAAAAMAAP/AA8ADQAALABQAIAAAAQ4BBx4BFz4BNy4BAy4BNDYyFhQGNxQGIiY9ATQ2MhYVAgC+/QUF/b6+/QUF/b4QFRUgFRUVFSAVFSAVA0AF/b6+/QUF/b6+/f1lARUfFRUfFacQFRUQ8w8VFQ8AAAACAAAAAAPAAucABQAGAAAJAjcXARcDv/26/sdzxgHtWQKM/Y4Bk2LPAaZaAAUAAP/AA8YDQAADAAQAEgAgACEAACUHFzcnAQ4BBx4BFz4BNy4BJzEBDgEHLgEnPgE3HgEXOQEDIzGiMaL+pKjgBATgqKjgBATgqAFHBLiLi7gEBLiLi7gElDGjMaMCrAXfqajgBATgqKnfBf5zirkEBLmKi7kDA7mLAAADAAD/wAPAA0AADAAjACQAAAEOAQceARc+ATcuAScJATEOAScmJzAxJyY0NjIfAQE2MhYUBzECAL79BQX9vr79BQX9vgEB/t4KGwwEBKcMGSAMiwEFDCAZDANABf2+vv0FBf2+vv0F/rT+3woEBwMEpg0gGAuKAQQMGCANAAAAAAQAAP/FA04DOQAZABoANQA2AAAFAyY2Fx4BBxM+ARcTPgEXPgEXPgEXERYGByETDgEHHgEXNS4BNT4BNx4BFxQGBxU+ATcuAScxAY/cBBZGKiQBAgNDKQEBTzoBSj0BQywBESH+dAJffQIBPDIaHgJdR0ZeAR0ZMjwBAn1eOgESCEwZFjcCAaEIMjr++AgvPQkzQQs6Tv60ASAWA3MCfV8+Yx5FFz8lR10CAl1HJD8XRh5jPl99AgACAAD/wAMDA0AABQAGAAAlCQE3CQEnAvb+rAFUDf36AgYNWQEnASeZ/kD+QZgAAAACAAD/wAMDA0AABQAGAAAlBwkBFwkBAQoNAgb9+g0BVP6sWZgBvwHAmf7Z/tkAAAACAAAAAAPDApEAFgBOAAAlES4BByEiBhUHBg8BHgEzFx4BNyE+ASUOATEuATEnBzAGByImJy4BJzQ2PwEnLgExPgExPgExHgEVFzc0NjcwFhcwFhUyBg8BFx4BFQ4BA8AIUwb92QoK3QUBAQEGAdoHCwECKkcd/ugHDgwLSEgLDAENBwEIAQMHR0gIAQEICA0LDUhIDAwNCAgBAghHRwcDAQnUAVZGIAMGAfQGBQYKC/IGAgEJUjwGAgEISEgIAQIGAQwKARAHR0gIDwsKBwMBCAFISAEIAQMHCgsPCEhHBxABCgwAAAAAAgAA/3QD6wOAAAsAEQAAAQYkJwYEJxIANyQSASc3FxMXA9an/tMLdf63ER0BlR0BeXr95r4mhfg5AswCqQ15QAX+B/6hDOwCRf4RmDlyAR0mAAAAAQAA/8ADwANAAAsAAAEhESMRIRUhETMRIQPA/n9+/n8BgX4BgQG/AYH+f37+fwGBAAAAAAEAAAAAA8ABvwAFAAABMSEVITUCP/4BA4ABv35+AAAAAgAAAAADwAK+AB0AKQAAATA5AS4BJzEmIw4BBzEeARcxFhcVHgEXMzE+AT8BBS4BJz4BNx4BFw4BA8AwvXwrLJruOBlMMR8hM3Q+F4vaOw7+QDxQAgJQPDxQAgJQAYF4oxkIAqyOPmspGRMBHiABB5p9II8CUDw8UAICUDw8UAAGAAAAAAPAAr4AJgA3AD8ARwBZAFoAAAExLgEnNz4BLwEuAQ8BLgEjDgEHMR4BFwcOAR8BHgE/AR4BMz4BNyE+ATcWFwcmIw4BBxQXBy4BJQ4BByYnNxYHPgE3MhcHJhcmJzceATM+ATcmJzceARcOAQcDwBpUNygJAQgECRcJNDNzPpruOBlPNDAJAQgECBcKOzV4QZrtOfzDNMmAYFJYKDJEWwITZyxFAccBNykdF4oLwgE3KRUThAVhZ1ZYFTMdRFsCARllL0oYNMmAAYFDbyokCRcJBAkBCC8dHwKsjkBtKSwJFwkFCAIINiAiAq6OcokCAShRGwFbRCoiXiFXMik3AQEPfRQYKTcBCXcP7AEuUBESAVtEMSdbIVo2cosBAAAAAgAA/8ADngNAABoAJgAACQEmIyciBgcBBhQWMj8BERQWMjY1ERMWMjY0EyEiJjQ2NyEeARQGA1H+ywsOAwgNBf7pChUbC94THhP/ChwUIP0KDhQUDgL2DhQUAXQBNwoBBgX+6gscFArd/aIPExMPAmD/AAoVGwGSFB0TAQETHRQAAAAAAQAAAAADwAJbAAUAACUBJwkBBwIAAcAz/nP+czNQAdU1/mABoDUAAAIAAAAAA2oDgAALAAwAABMeARc+ATcuAScOAQeWBMyamswEBMyamswEAhaZzAQEzJmazAQEzJoAAQAA/8AD2QNAAB8AAAEmJyUnJiIPAQUOAR8BAwYXFjMyNyUFFjMyNzYnAzc2A9QGEP7wlAkiCZT+8BALC7QUAQ4ICgYGAQMBAwYGCggOARS0CwHsEAVD7g0N7kMFIA3W/ukRCwYDaGgDBgsRARfWDQAAAAACAAD/wAPZA0AAHwA0AAABJiclJyYiDwEFDgEfAQMGFxYzMjclBRYzMjc2JwM3NgU2LwE3Nj8BFxYfAQcGHwEnJiIPAQPUBhD+8JQJIgmU/vAQCwu0FAEOCAoGBgEDAQMGBgoIDgEUtAv9TAEInOsMB4CABwzrnAgBEeAGDAbgAewQBUPuDQ3uQwUgDdb+6RELBgNoaAMGCxEBF9YN2wwKuTsDC83NCwM7uQoM8lsCAlsAAAAAABIA3gABAAAAAAAAABUAAAABAAAAAAABAAgAFQABAAAAAAACAAcAHQABAAAAAAADAAgAJAABAAAAAAAEAAgALAABAAAAAAAFAAsANAABAAAAAAAGAAgAPwABAAAAAAAKACsARwABAAAAAAALABMAcgADAAEECQAAACoAhQADAAEECQABABAArwADAAEECQACAA4AvwADAAEECQADABAAzQADAAEECQAEABAA3QADAAEECQAFABYA7QADAAEECQAGABABAwADAAEECQAKAFYBEwADAAEECQALACYBaQpDcmVhdGVkIGJ5IGljb25mb250Cmljb25mb250UmVndWxhcmljb25mb250aWNvbmZvbnRWZXJzaW9uIDEuMGljb25mb250R2VuZXJhdGVkIGJ5IHN2ZzJ0dGYgZnJvbSBGb250ZWxsbyBwcm9qZWN0Lmh0dHA6Ly9mb250ZWxsby5jb20ACgBDAHIAZQBhAHQAZQBkACAAYgB5ACAAaQBjAG8AbgBmAG8AbgB0AAoAaQBjAG8AbgBmAG8AbgB0AFIAZQBnAHUAbABhAHIAaQBjAG8AbgBmAG8AbgB0AGkAYwBvAG4AZgBvAG4AdABWAGUAcgBzAGkAbwBuACAAMQAuADAAaQBjAG8AbgBmAG8AbgB0AEcAZQBuAGUAcgBhAHQAZQBkACAAYgB5ACAAcwB2AGcAMgB0AHQAZgAgAGYAcgBvAG0AIABGAG8AbgB0AGUAbABsAG8AIABwAHIAbwBqAGUAYwB0AC4AaAB0AHQAcAA6AC8ALwBmAG8AbgB0AGUAbABsAG8ALgBjAG8AbQAAAAACAAAAAAAAAAoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABcBAgEDAQQBBQEGAQcBCAEJAQoBCwEMAQ0BDgEPARABEQESARMBFAEVARYBFwEYAAF4CGRpbmd3ZWkyD3lkdWljdW93dXNoaXhpbhB5ZHVpZGFueHVhbmt1YW5nE3lkdWlnYW50YW5oYW9zaGl4aW4LeWR1aWdvdXh1YW4KeWR1aXNvdXN1bxJ5ZHVpemhlbmdxdWVzaGl4aW4Hc2hvdXpoaQp5ZHVpZmFuaHVpC3lkdWlxaWFuamluCXlkdWl0dWlnZQd5ZHVpZHVuB3lkdWlqaWEIeWR1aWppYW4QWURVSS15aW5jYW5nbWltYRFZRFVJLXlpbmNhbmdtaW1hMRFZRFVJLWZhbmh1aWRpbmdidQVhcnJvdw9ZRFVJLXNoaXhpbnl1YW4UWURVSS14aW5neGluZ3NoaXhpbjEVWURVSS14aW5neGluZ2tvbmd4aW4xAAAAAAA=) format("truetype")}.g-fix-ios-overflow-scrolling-bug{-webkit-overflow-scrolling:auto!important}.g-fix-ios-prevent-scroll{overflow:hidden!important;position:fixed;width:100%}',""])},function(t,e){t.exports=function(){var t=[];return t.toString=function(){for(var t=[],e=0;e<this.length;e++){var n=this[e];n[2]?t.push("@media "+n[2]+"{"+n[1]+"}"):t.push(n[1])}return t.join("")},t.i=function(e,n){"string"==typeof e&&(e=[[null,e,""]]);for(var i={},r=0;r<this.length;r++){var o=this[r][0];"number"==typeof o&&(i[o]=!0)}for(r=0;r<e.length;r++){var a=e[r];"number"==typeof a[0]&&i[a[0]]||(n&&!a[2]?a[2]=n:n&&(a[2]="("+a[2]+") and ("+n+")"),t.push(a))}},t}},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e){},function(t,e,n){var i=n(1)(n(199),n(183),null,null);t.exports=i.exports},function(t,e,n){n(33);var i=n(1)(n(200),n(155),null,null);t.exports=i.exports},function(t,e,n){n(19);var i=n(1)(n(201),n(129),null,null);t.exports=i.exports},function(t,e,n){n(27);var i=n(1)(n(202),n(143),null,null);t.exports=i.exports},function(t,e,n){n(31);var i=n(1)(n(203),n(150),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(204),n(164),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(206),n(186),null,null);t.exports=i.exports},function(t,e,n){n(40);var i=n(1)(n(207),n(163),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(208),n(149),null,null);t.exports=i.exports},function(t,e,n){n(48);var i=n(1)(n(209),n(179),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(210),n(177),null,null);t.exports=i.exports},function(t,e,n){n(55);var i=n(1)(n(211),n(197),null,null);t.exports=i.exports},function(t,e,n){n(41);var i=n(1)(n(212),n(169),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(213),n(171),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(214),n(165),null,null);t.exports=i.exports},function(t,e,n){n(53);var i=n(1)(n(215),n(194),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(216),n(170),null,null);t.exports=i.exports},function(t,e,n){n(26);var i=n(1)(n(217),n(137),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(218),n(180),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(219),n(192),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(220),n(125),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(221),n(141),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(222),n(182),null,null);t.exports=i.exports},function(t,e,n){n(35);var i=n(1)(n(223),n(157),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(224),n(188),null,null);t.exports=i.exports},function(t,e,n){n(17);var i=n(1)(n(225),n(127),null,null);t.exports=i.exports},function(t,e,n){n(24);var i=n(1)(n(226),n(135),null,null);t.exports=i.exports},function(t,e,n){n(43);var i=n(1)(n(227),n(173),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(null,n(187),null,null);t.exports=i.exports},function(t,e,n){n(51);var i=n(1)(n(229),n(185),null,null);t.exports=i.exports},function(t,e,n){n(20);var i=n(1)(n(230),n(130),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(231),n(166),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(232),n(151),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(233),n(193),null,null);t.exports=i.exports},function(t,e,n){n(18);var i=n(1)(n(234),n(128),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(235),n(153),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(236),n(167),null,null);t.exports=i.exports},function(t,e,n){n(32);var i=n(1)(n(237),n(154),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(239),n(138),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(240),n(152),null,null);t.exports=i.exports},function(t,e,n){n(47);var i=n(1)(n(241),n(178),null,null);t.exports=i.exports},function(t,e,n){n(54);var i=n(1)(n(242),n(195),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(243),n(160),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(244),n(168),null,null);t.exports=i.exports},function(t,e,n){n(25);var i=n(1)(n(245),n(136),null,null);t.exports=i.exports},function(t,e,n){n(45);var i=n(1)(n(246),n(175),null,null);t.exports=i.exports},function(t,e,n){n(21);var i=n(1)(n(247),n(131),null,null);t.exports=i.exports},function(t,e,n){n(52);var i=n(1)(n(248),n(191),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(249),n(190),null,null);t.exports=i.exports},function(t,e,n){n(16);var i=n(1)(n(250),n(126),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(251),n(144),null,null);t.exports=i.exports},function(t,e,n){n(38);var i=n(1)(n(252),n(161),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(253),n(146),null,null);t.exports=i.exports},function(t,e,n){n(50);var i=n(1)(n(254),n(184),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(255),n(142),null,null);t.exports=i.exports},function(t,e,n){n(30);var i=n(1)(n(256),n(148),null,null);t.exports=i.exports},function(t,e,n){n(46);var i=n(1)(n(257),n(176),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(258),n(133),null,null);t.exports=i.exports},function(t,e,n){n(44);var i=n(1)(n(261),n(174),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(262),n(198),null,null);t.exports=i.exports},function(t,e,n){n(49);var i=n(1)(n(263),n(181),null,null);t.exports=i.exports},function(t,e,n){n(42);var i=n(1)(n(264),n(172),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(265),n(196),null,null);t.exports=i.exports},function(t,e,n){n(28);var i=n(1)(n(266),n(145),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(267),n(189),null,null);t.exports=i.exports},function(t,e,n){n(34);var i=n(1)(n(268),n(156),null,null);t.exports=i.exports},function(t,e,n){n(22);var i=n(1)(n(269),n(132),null,null);t.exports=i.exports},function(t,e,n){var i=n(1)(n(270),n(140),null,null);t.exports=i.exports},function(t,e,n){n(36);var i=n(1)(n(271),n(158),null,null);t.exports=i.exports},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-notify",class:t.classes,domProps:{innerHTML:t._s(t.mes)}})},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",{staticClass:"yd-rate",style:{fontSize:t.size,color:t.color}},[t._l(~~t.count,function(e,i){return n("a",{key:i,class:t.index>=e?"rate-active":"",style:{color:t.index>=e?t.activeColor:t.color,paddingRight:t.padding},attrs:{href:"javascript:;"},on:{click:function(n){!t.readonly&&t.choose(e)}}})}),t._v(" "),t.str?n("span",{staticClass:"yd-rate-text",domProps:{innerHTML:t._s(t.str)}}):t._e()],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return"link"==t.type?n("router-link",{staticClass:"yd-grids-item",class:0!=t.$parent.itemHeight?"yd-grids-item-center":"",style:t.styles,attrs:{to:t.link||""}},[t.checkIcon?n("div",{staticClass:"yd-grids-icon"},[t._t("icon")],2):t._e(),t._v(" "),t.checkText?n("div",{staticClass:"yd-grids-txt"},[t._t("text")],2):t._e(),t._v(" "),t._t("else")],2):n("a",{staticClass:"yd-grids-item",class:0!=t.$parent.itemHeight?"yd-grids-item-center":"",style:t.styles,attrs:{href:t.link||""}},[t.checkIcon?n("div",{staticClass:"yd-grids-icon"},[t._t("icon")],2):t._e(),t._v(" "),t.checkText?n("div",{staticClass:"yd-grids-txt"},[t._t("text")],2):t._e(),t._v(" "),t._t("else")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("yd-mask",{attrs:{opacity:t.maskerOpacity},nativeOn:{click:function(e){t.close(e)}},model:{value:t.show,callback:function(e){t.show=e},expression:"show"}}),t._v(" "),n("div",{staticClass:"yd-actionsheet",class:t.show?"yd-actionsheet-active":""},[t._l(t.items,function(e,i){return n("a",{key:i,staticClass:"yd-actionsheet-item",attrs:{href:"javascript:;"},on:{click:function(n){n.stopPropagation(),t.itemClick(e)}}},[t._v(t._s(e.label))])}),t._v(" "),t.cancel?n("a",{staticClass:"yd-actionsheet-action",attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.close(e)}}},[t._v(t._s(t.cancel))]):t._e()],2)],1)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("section",{staticClass:"yd-flexview"},[t.showNavbar?t._t("navbar",[t.title?n("yd-navbar",{attrs:{title:t.title}},[n("router-link",{attrs:{slot:"left",to:t.link||"/"},slot:"left"},[n("yd-navbar-back-icon")],1)],1):t._e()]):t._e(),t._v(" "),t._t("top"),t._v(" "),n("section",{ref:"scrollView",staticClass:"yd-scrollview",attrs:{id:"scrollView"}},[t._t("default")],2),t._v(" "),t._t("bottom"),t._v(" "),t._t("tabbar")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("div",{ref:"dragBox"},[t._t("default"),t._v(" "),n("div",{directives:[{name:"show",rawName:"v-show",value:t.touches.isDraging,expression:"touches.isDraging"}],ref:"dragTip",staticClass:"yd-pullrefresh-dragtip",class:t.dragTip.animationTiming,style:{transform:"translate3d(0, "+t.dragTip.translate+"px, 0)"}},[n("span",{staticClass:"yd-pullrefresh-dragtip-icon"},[n("i",{class:t.dragTip.loadingIcon,style:{transform:"rotate("+t.dragTip.iconRotate+"deg)"}}),t._v("\n                "+t._s(t.dragTip.statusText)+"\n            ")])])],2),t._v(" "),t.showHelpTag?n("div",{staticClass:"yd-pullrefresh-draghelp",
on:{click:function(e){t.showHelpTag=!1}}},[t._m(0)]):t._e()])},staticRenderFns:[function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("span",[t._v("下拉更新")])])}]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-textarea",class:t.readonly?"yd-textarea-readonly":""},[n("textarea",{directives:[{name:"model",rawName:"v-model",value:t.mlstr,expression:"mlstr"}],attrs:{placeholder:t.placeholder,maxlength:t.maxlength,readonly:t.readonly},domProps:{value:t.mlstr},on:{input:function(e){e.target.composing||(t.mlstr=e.target.value)}}}),t._v(" "),t.showCounter&&t.maxlength?n("div",{staticClass:"yd-textarea-counter"},[t._v(t._s(t.num)+"/"+t._s(t.maxlength))]):t._e()])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("yd-sendcode-button",{class:t.start?"btn-disabled":"",style:{backgroundColor:t.bgcolor,color:t.color},attrs:{size:t.size,type:t.type,"action-type":t.actionType,disabled:t.start}},[t._v(t._s(t.tmpStr)+"\n")])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-input"},["mobile"==t.regex?[n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"tel",pattern:"[0-9]*",name:t.name,maxlength:"11",placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}})]:["password"==t.type?[t.showPwd?t._e():n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"password",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}),t._v(" "),t.showPwd?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"text",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e()]:t._e(),t._v(" "),"text"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"text",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"search"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"search",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"number"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"number",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"email"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"email",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"tel"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"tel",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"datetime-local"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"datetime-local",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"date"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"date",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e(),t._v(" "),"time"==t.type?n("input",{directives:[{name:"model",rawName:"v-model",value:t.currentValue,expression:"currentValue"}],ref:"input",attrs:{type:"time",name:t.name,maxlength:t.max,placeholder:t.placeholder,autocomplete:t.autocomplete,readonly:t.readonly,disabled:t.disabled},domProps:{value:t.currentValue},on:{focus:t.focusHandler,blur:t.blurHandler,input:function(e){e.target.composing||(t.currentValue=e.target.value)}}}):t._e()],t._v(" "),n("a",{directives:[{name:"show",rawName:"v-show",value:t.showClearIcon&&t.showClear&&!t.isempty,expression:"showClearIcon && showClear && !isempty"}],staticClass:"yd-input-clear",attrs:{href:"javascript:;",tabindex:"-1"},on:{click:t.clearInput}}),t._v(" "),t.showErrorIcon?n("span",{directives:[{name:"show",rawName:"v-show",value:(!!t.regex||!!t.min||!!t.max||t.required)&&t.iserror&&t.initError,expression:"(!!regex || !!min || !!max || required) && iserror && initError"}],staticClass:"yd-input-error"}):t._e(),t._v(" "),t.showRequiredIcon&&t.showErrorIcon?n("span",{directives:[{name:"show",rawName:"v-show",value:(t.required||!!t.min&&t.min>0)&&t.isempty&&t.showWarn,expression:"(required || (!!min && min > 0)) && isempty && showWarn"}],staticClass:"yd-input-warn"}):t._e(),t._v(" "),t.showSuccessIcon?n("span",{directives:[{name:"show",rawName:"v-show",value:(!!t.regex||!!t.min||!!t.max||t.required)&&!t.iserror&&""!=t.currentValue,expression:"(!!regex || !!min || !!max || required) && !iserror && currentValue != ''"}],staticClass:"yd-input-success"}):t._e(),t._v(" "),"password"==t.type?n("a",{staticClass:"yd-input-password",class:t.showPwd?"yd-input-password-open":"",attrs:{href:"javascript:;",tabindex:"-1"},on:{click:function(e){e.stopPropagation(),t.showPwd=!t.showPwd}}}):t._e()],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("i",{class:t.classes,style:t.styles})},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-preview"},[t._t("default"),t._v(" "),t.buttons.length>0?n("div",{staticClass:"yd-preview-footer"},[t._l(t.buttons,function(e){return["object"==typeof e.link?[n("router-link",{style:{color:e.color},attrs:{to:e.link},nativeOn:{click:function(n){t.clickHander(e.click)}}},[t._v(t._s(e.text))])]:[n("a",{style:{color:e.color},attrs:{href:e.link?e.link:"javascript:;"},on:{click:function(n){t.clickHander(e.click)}}},[t._v(t._s(e.text))])]]})],2):t._e()],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-dialog-black-mask"},[n("div",{staticClass:"yd-confirm yd-alert"},[n("div",{staticClass:"yd-confirm-bd",domProps:{innerHTML:t._s(t.mes)}}),t._v(" "),n("div",{staticClass:"yd-confirm-ft"},[n("a",{staticClass:"yd-confirm-btn primary",attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.closeAlert(e)}}},[t._v("确定")])])])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",[n("i",{staticClass:"yd-back-icon",style:{color:t.color}}),t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-slider-item"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("li",{class:t.$slots.icon?"yd-timeline-custom-item":"yd-timeline-item"},[t.$slots.icon?[n("span",{staticClass:"yd-timeline-icon"},[t._t("icon")],2)]:[n("em",{staticClass:"yd-timeline-icon"})],t._v(" "),t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-dialog-white-mask"},[n("div",{staticClass:"yd-toast",class:""==t.iconsClass?"yd-toast-none-icon":""},[t.iconsClass?n("div",{class:t.iconsClass}):t._e(),t._v(" "),n("p",{staticClass:"yd-toast-content",domProps:{innerHTML:t._s(t.mes)}})])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-scrolltab-content-item"},[n("strong",{staticClass:"yd-scrolltab-content-title"},[t._v(t._s(t.label))]),t._v(" "),t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{directives:[{name:"show",rawName:"v-show",value:t.show,expression:"show"}],on:{click:function(e){e.stopPropagation(),t.backtop(e)}}},[t.$slots.default?t._t("default"):n("div",{staticClass:"yd-backtop"})],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-rollnotice-item"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-tab"},[n("div",{staticClass:"yd-tab-box",class:t.horizontalScroll?"yd-tab-nav-scoll":"yd-tab-nav-nomal"},[n("ul",{directives:[{name:"show",rawName:"v-show",value:t.navList.length>0,expression:"navList.length > 0"}],ref:"navbox",staticClass:"yd-tab-nav",style:{color:t.activeColor,width:t.width}},t._l(t.navList,function(e,i){return n("li",{key:i,staticClass:"yd-tab-nav-item",class:e._uid==t.activeIndex||i===t.activeIndex?"yd-tab-active":"",on:{click:function(n){t.changeHandler(i,e._uid)}}},[n("a",{attrs:{href:"javascript:"}},[t._v(t._s(e.label))])])}))]),t._v(" "),n("div",{staticClass:"yd-tab-panel"},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("button",{class:t.classes,style:{backgroundColor:t.bgcolor,color:t.color},attrs:{disabled:t.disabled,type:t.actionType}},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-scrolltab"},[n("div",{ref:"navbox",staticClass:"yd-scrolltab-nav"},t._l(t.navList,function(e,i){return n("a",{key:i,ref:"tabitem_"+i,refInFor:!0,staticClass:"yd-scrolltab-item",class:t.activeIndex==i?"yd-scrolltab-active":"",attrs:{href:"javascript:;"},on:{click:function(e){t.moveHandler(i)}}},[n("div",{staticClass:"yd-scrolltab-icon"},[n("i",{class:e.icon})]),t._v(" "),n("div",{staticClass:"yd-scrolltab-title"},[t._v(t._s(e.label))])])})),t._v(" "),n("div",{ref:"scrollView",staticClass:"yd-scrolltab-content"},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",{staticClass:"yd-badge",class:t.typesClass,style:{backgroundColor:t.bgcolor,color:t.color}},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("img",{attrs:{src:t.src,original:t.original}})},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",[t._t("default"),n("i",{staticClass:"yd-next-icon",style:{color:t.color}})],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return"link"==t.type?n("router-link",{staticClass:"yd-list-item",attrs:{to:t.href}},[n("div",{staticClass:"yd-list-img"},[t._t("img")],2),t._v(" "),n("div",{staticClass:"yd-list-mes"},[n("div",{staticClass:"yd-list-title"},[t._t("title")],2),t._v(" "),t._t("other")],2)]):"a"==t.type?n("a",{staticClass:"yd-list-item",attrs:{href:t.href||"javascript:;"}},[n("div",{staticClass:"yd-list-img"},[t._t("img")],2),t._v(" "),n("div",{staticClass:"yd-list-mes"},[n("div",{staticClass:"yd-list-title"},[t._t("title")],2),t._v(" "),t._t("other")],2)]):n("div",{staticClass:"yd-list-item"},[n("div",{staticClass:"yd-list-img"},[t._t("img")],2),t._v(" "),n("div",{staticClass:"yd-list-mes"},[n("div",{staticClass:"yd-list-title"},[t._t("title")],2),t._v(" "),t._t("other")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("article",{staticClass:"yd-list",class:t.classes},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-accordion"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("footer",{staticClass:"yd-tabbar tabbbar-top-line-color",class:t.classes,style:t.styles},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-flexbox",class:"vertical"==t.direction?"yd-flexbox-vertical":"yd-flexbox-horizontal"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-timeline"},[n("ul",{staticClass:"yd-timeline-content"},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{ref:"slider",staticClass:"yd-slider"},[n("div",{ref:"warpper",staticClass:"yd-slider-wrapper",class:"vertical"==t.direction?"yd-slider-wrapper-vertical":"",style:t.dragStyleObject},[t.loop?n("div",{staticClass:"yd-slider-item",style:t.itemHeight,domProps:{innerHTML:t._s(t.lastItem)}}):t._e(),t._v(" "),t._t("default"),t._v(" "),t.loop?n("div",{staticClass:"yd-slider-item",style:t.itemHeight,domProps:{innerHTML:t._s(t.firstItem)}}):t._e()],2),t._v(" "),t.itemsArr.length>1&&t.showPagination?n("div",{staticClass:"yd-slider-pagination",class:"vertical"==t.direction?"yd-slider-pagination-vertical":""},t._l(t.itemNums,function(e,i){return n("span",{key:i,staticClass:"yd-slider-pagination-item",class:t.paginationIndex==i?"yd-slider-pagination-item-active":""})})):t._e()])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-preview-header"},[t._t("left"),t._v(" "),t._t("right")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-rollnotice",style:{height:t.height+"px"}},[n("div",{staticClass:"yd-rollnotice-box",class:"yd-rollnotice-align-"+t.align,style:t.styles},[n("div",{staticClass:"yd-rollnotice-item",domProps:{innerHTML:t._s(t.lastItem)}}),t._v(" "),t._t("default"),t._v(" "),n("div",{staticClass:"yd-rollnotice-item",domProps:{innerHTML:t._s(t.firtstItem)}})],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-mask",style:t.styles},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return"label"==t.type||"checkbox"==t.type||"radio"==t.type?n("label",{staticClass:"yd-cell-item"},[t.checkLeft?n("span",{staticClass:"yd-cell-left"},[n("span",{staticClass:"yd-cell-icon"},[t._t("icon")],2),t._v(" "),t._t("left")],2):t._e(),t._v(" "),n("label",{staticClass:"yd-cell-right",class:t.classes},[t._t("right"),t._v(" "),"checkbox"==t.type?n("i",{staticClass:"yd-cell-checkbox-icon"}):t._e(),t._v(" "),"radio"==t.type?n("i",{staticClass:"yd-cell-radio-icon"}):t._e()],2)]):"link"==t.type?n("router-link",{staticClass:"yd-cell-item",attrs:{to:t.href}},[t.checkLeft?n("div",{staticClass:"yd-cell-left"},[n("span",{staticClass:"yd-cell-icon"},[t._t("icon")],2),t._v(" "),t._t("left")],2):t._e(),t._v(" "),n("div",{staticClass:"yd-cell-right",class:t.classes},[t._t("right")],2)]):"a"==t.type?n("a",{staticClass:"yd-cell-item",attrs:{href:t.href}},[t.checkLeft?n("div",{staticClass:"yd-cell-left"},[n("span",{staticClass:"yd-cell-icon"},[t._t("icon")],2),t._v(" "),t._t("left")],2):t._e(),t._v(" "),n("div",{staticClass:"yd-cell-right",class:t.classes},[t._t("right")],2)]):n("div",{staticClass:"yd-cell-item"},[t.checkLeft?n("div",{staticClass:"yd-cell-left"},[n("span",{staticClass:"yd-cell-icon"},[t._t("icon")],2),t._v(" "),t._t("left")],2):t._e(),t._v(" "),n("div",{staticClass:"yd-cell-right",class:t.classes},[t._t("right")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-button"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span")},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("div",{staticClass:"yd-lightbox"},[n("div",{staticClass:"yd-lightbox-head",class:t.show?"":"yd-lightbox-up-hide"},[n("span",[t._v(t._s(t.currentIndex+1)+" / "+t._s(t.imgItems.length))]),t._v(" "),n("a",{attrs:{href:"javascript:;"},on:{click:t.close}},[t._v(t._s(t.closeText))])]),t._v(" "),n("div",{staticClass:"yd-lightbox-img",on:{click:function(e){t.show=!t.show}}},[n("slider",{attrs:{autoplay:"0","show-pagination":!1,loop:!1,callback:t.changeIndex,index:t.index}},t._l(t.imgItems,function(e,i){return n("slider-item",{key:i},[n("img",{staticStyle:{"background-color":"#000"},attrs:{src:t.getImgSrc(e.$el)}})])})),t._v(" "),n("div",{staticClass:"yd-lightbox-loading"},[n("svg",{attrs:{width:"100%",height:"100%",xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",preserveAspectRatio:"xMidYMid"}},[n("circle",{attrs:{cx:"50",cy:"50",fill:"none",stroke:"#ffffff","stroke-width":"7",r:"47","stroke-dasharray":"221.48228207808043 75.82742735936014",transform:"rotate(25.5138 50 50)"}},[n("animateTransform",{attrs:{attributeName:"transform",type:"rotate",calcMode:"linear",values:"0 50 50;360 50 50",keyTimes:"0;1",dur:"0.8s",begin:"0s",repeatCount:"indefinite"}})],1)])])],1),t._v(" "),t.txtHTML?n("div",{staticClass:"yd-lightbox-foot",class:t.show?"":"yd-lightbox-down-hide",domProps:{innerHTML:t._s(t.txtHTML)}}):t._e()])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-list-other"},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-preview-item"},[t._t("left"),t._v(" "),t._t("right")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("yd-mask",{ref:"mask",attrs:{opacity:t.maskerOpacity},nativeOn:{click:function(e){t.close(e)}},model:{value:t.show,callback:function(e){t.show=e},expression:"show"}}),t._v(" "),n("div",{staticClass:"yd-cityselect",class:t.show?"yd-cityselect-active":""},[n("div",{staticClass:"yd-cityselect-header"},[n("p",{staticClass:"yd-cityselect-title",on:{touchstart:function(t){t.stopPropagation(),t.preventDefault()}}},[t._v(t._s(t.title))]),t._v(" "),n("div",{directives:[{name:"show",rawName:"v-show",value:t.ready,expression:"ready"}],staticClass:"yd-cityselect-nav"},t._l(t.columnNum,function(e,i){return n("a",{directives:[{name:"show",rawName:"v-show",value:!!t.nav["txt"+e],expression:"!!nav['txt' + index]"}],key:i,class:e==t.navIndex?"yd-cityselect-nav-active":"",attrs:{href:"javascript:;"},on:{click:function(n){n.stopPropagation(),t.navEvent(e)}}},[t._v(t._s(t.nav["txt"+e]))])}))]),t._v(" "),t.ready?t._e():n("div",{staticClass:"yd-cityselect-loading"},[n("svg",{attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",preserveAspectRatio:"xMidYMid"}},[n("path",{attrs:{stroke:"none",d:"M3 50A47 47 0 0 0 97 50A47 49 0 0 1 3 50",fill:"#bababa",transform:"rotate(317.143 50 51)"}},[n("animateTransform",{attrs:{attributeName:"transform",type:"rotate",calcMode:"linear",values:"0 50 51;360 50 51",keyTimes:"0;1",dur:"0.6s",begin:"0s",repeatCount:"indefinite"}})],1)])]),t._v(" "),n("ul",{directives:[{name:"show",rawName:"v-show",value:t.ready,expression:"ready"}],staticClass:"yd-cityselect-content",class:t.activeClasses},t._l(t.columnNum,function(e,i){return n("li",{key:i,ref:"itemBox"+e,refInFor:!0,staticClass:"yd-cityselect-item"},[t.columnsObj["columnItems"+e]&&t.columnsObj["columnItems"+e].length>0?[n("div",{staticClass:"yd-cityselect-item-box"},t._l(t.columnsObj["columnItems"+e],function(i,r){return n("a",{key:r,class:t.currentClass(i.v,i.n,e),attrs:{href:"javascript:;"},on:{click:function(n){n.stopPropagation(),t.itemEvent(e,i.n,i.v,i.c)}}},[n("span",[t._v(t._s(i.n))])])}))]:[n("div",{staticClass:"yd-cityselect-item-box",on:{touchstart:function(t){t.stopPropagation(),t.preventDefault()}}})]],2)}))])],1)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("yd-mask",{attrs:{opacity:t.maskerOpacity},nativeOn:{click:function(e){t.close(e)}},model:{value:t.show,callback:function(e){t.show=e},expression:"show"}}),t._v(" "),n("div",{staticClass:"yd-datetime",class:t.show?"yd-datetime-active":""},[n("div",{staticClass:"yd-datetime-head"},[n("a",{attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.close(e)}}},[t._v(t._s(t.cancelText))]),t._v(" "),n("a",{attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.setValue(e)}}},[t._v(t._s(t.confirmText))])]),t._v(" "),n("div",{staticClass:"yd-datetime-content"},[t._l(t.columns,function(e,i){return n("div",{key:i,staticClass:"yd-datetime-item"},[n("div",{ref:"Component_"+e,refInFor:!0,staticClass:"yd-datetime-item-box"},[n("div",{ref:"Content_"+e,refInFor:!0,staticClass:"yd-datetime-item-content"},t._l(t.items[e],function(e,i){return n("span",{key:i,attrs:{"data-value":e.value},domProps:{innerHTML:t._s(e.name)}})}))])])}),t._v(" "),n("div",{staticClass:"yd-datetime-shade"}),t._v(" "),t._m(0)],2)])],1)},staticRenderFns:[function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-datetime-indicator"},[n("span")])}]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",[n("span",{domProps:{innerHTML:t._s(t.str)}}),t._v(" "),t.showTpl?n("span",{ref:"tpl"},[t._t("default")],2):t._e()])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("input",{directives:[{name:"model",rawName:"v-model",value:t.checked,expression:"checked"}],staticClass:"yd-switch",style:{color:t.color},attrs:{type:"checkbox","true-value":t.trueValue,"false-value":t.falseValue,disabled:t.disabled},domProps:{checked:Array.isArray(t.checked)?t._i(t.checked,null)>-1:t._q(t.checked,t.trueValue)},on:{change:function(e){var n=t.checked,i=e.target,r=i.checked?t.trueValue:t.falseValue;if(Array.isArray(n)){var o=null,a=t._i(n,o);i.checked?a<0&&(t.checked=n.concat([o])):a>-1&&(t.checked=n.slice(0,a).concat(n.slice(a+1)))}else t.checked=r}}})},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t._t("list"),t._v(" "),n("div",{ref:"tag",staticStyle:{height:"0"}}),t._v(" "),t.isDone?t._e():n("div",{staticClass:"yd-list-loading"},[n("div",{directives:[{name:"show",rawName:"v-show",value:t.isLoading,expression:"isLoading"}]},[t._t("loadingTip",[n("loading")])],2)]),t._v(" "),n("div",{directives:[{name:"show",rawName:"v-show",value:!t.isLoading&&t.isDone,expression:"!isLoading && isDone"}],staticClass:"yd-list-donetip"},[t._t("doneTip",[t._v("没有更多数据了")])],2)],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",{staticClass:"yd-spinner",style:{height:t.height,width:t.width}},[n("a",{ref:"minus",attrs:{href:"javascript:;"}}),t._v(" "),n("input",{directives:[{name:"model",rawName:"v-model",value:t.counter,expression:"counter"}],ref:"numInput",staticClass:"yd-spinner-input",attrs:{type:"number",pattern:"[0-9]*",readonly:t.readonly,placeholder:""},domProps:{value:t.counter},on:{input:function(e){e.target.composing||(t.counter=e.target.value)}}}),t._v(" "),n("a",{ref:"add",attrs:{href:"javascript:;"}})])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-progressbar"},["line"!=t.type?n("div",{staticClass:"yd-progressbar-content"},[t._t("default")],2):t._e(),t._v(" "),n("svg",{directives:[{name:"show",rawName:"v-show",value:t.show,expression:"show"}],attrs:{viewBox:t.viewBox,preserveAspectRatio:"line"==t.type?"none":""}},[n("path",{attrs:{"fill-opacity":t.fillColor?1:0,d:t.getPathString,fill:t.fillColor,stroke:t.strokeColor,"stroke-width":t.trailWidth}}),t._v(" "),n("path",{ref:"trailPath",style:{strokeDasharray:t.stroke.dasharray,strokeDashoffset:t.stroke.dashoffset},attrs:{"fill-opacity":"0",d:t.getPathString,stroke:t.trailColor,"stroke-width":t.strokeWidth?t.strokeWidth:t.trailWidth}})])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("div",{staticClass:"yd-search"},[n("div",{staticClass:"yd-search-input"},[n("form",{staticClass:"search-input",attrs:{action:"#"},on:{submit:function(e){e.preventDefault(),t.submit(e)}}},[n("i",{staticClass:"search-icon"}),t._v(" "),n("yd-search-input",{ref:"search",attrs:{type:"search",placeholder:t.placeholder,readonly:t.fullpage},nativeOn:{click:function(e){t.open(e)}},model:{value:t.currentValue,callback:function(e){t.currentValue=e},expression:"currentValue"}})],1),t._v(" "),n("a",{directives:[{name:"show",rawName:"v-show",value:""!==t.currentValue,expression:"currentValue !== ''"}],staticClass:"cancel-text",attrs:{href:"javascript:;"},on:{click:function(e){t.close(!1)}}},[t._v(t._s(t.cancelText))])])]),t._v(" "),t.fullpage?[n("div",{staticClass:"yd-search yd-search-fly",class:t.show?"yd-search-show":"",style:{top:t.top}},[n("div",{staticClass:"yd-search-input"},[n("form",{staticClass:"search-input",attrs:{action:"#"},on:{submit:function(e){e.preventDefault(),t.submit(e)}}},[n("i",{staticClass:"search-icon"}),t._v(" "),n("yd-search-input",{ref:"search",attrs:{type:"search",placeholder:t.placeholder},model:{value:t.currentValue,callback:function(e){t.currentValue=e},expression:"currentValue"}})],1),t._v(" "),n("a",{staticClass:"cancel-text",attrs:{href:"javascript:;"},on:{click:function(e){t.close(!1)}}},[t._v(t._s(t.cancelText))])]),t._v(" "),n("div",{staticClass:"yd-search-list",style:{paddingBottom:t.top}},t._l(t.result,function(e,i){return n("p",{key:i,staticClass:"yd-search-list-item",on:{click:function(n){t.clickHandler(e)}}},[t._v("\n                    "+t._s(e.label||e))])}))])]:t._e()],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-checklist-item",on:{click:t.emitChangeHandler}},[t.label?n("div",{staticClass:"yd-checklist-item-icon"},[n("input",{attrs:{type:"checkbox",disabled:t.disabled},domProps:{checked:t.checked}}),t._v(" "),t._m(0)]):n("label",{staticClass:"yd-checklist-item-icon"},[n("input",{attrs:{type:"checkbox",disabled:t.disabled},domProps:{checked:t.checked},on:{change:t.changeHandler}}),t._v(" "),t._m(1)]),t._v(" "),n("div",{staticClass:"yd-checklist-content"},[t._t("default")],2)])},staticRenderFns:[function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",{staticClass:"yd-checklist-icon"},[n("i")])},function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("span",{staticClass:"yd-checklist-icon"},[n("i")])}]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("header",{staticClass:"yd-navbar navbar-bottom-line-color",class:t.classes,style:{backgroundColor:t.bgcolor,height:t.height}},[n("div",{staticClass:"yd-navbar-item"},[t._t("left")],2),t._v(" "),n("div",{staticClass:"yd-navbar-center-box",style:{height:t.height}},[n("div",{staticClass:"yd-navbar-center"},[t._t("center",[n("span",{staticClass:"yd-navbar-center-title",style:{color:t.color,fontSize:t.fontsize}},[t._v(t._s(t.title))])])],2)]),t._v(" "),n("div",{staticClass:"yd-navbar-item"},[t._t("right")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("label",{staticClass:"yd-checkbox",class:"circle"==t.shape?"yd-checkbox-circle":""},[t.group?[n("input",{directives:[{name:"model",rawName:"v-model",value:t.model,expression:"model"}],attrs:{type:"checkbox",disabled:t.disabled},domProps:{value:t.val,checked:Array.isArray(t.model)?t._i(t.model,t.val)>-1:t.model},on:{change:[function(e){var n=t.model,i=e.target,r=!!i.checked;if(Array.isArray(n)){var o=t.val,a=t._i(n,o);i.checked?a<0&&(t.model=n.concat([o])):a>-1&&(t.model=n.slice(0,a).concat(n.slice(a+1)))}else t.model=r},t.changeHandler]}})]:[n("input",{directives:[{name:"model",rawName:"v-model",value:t.checked,expression:"checked"},{name:"checkall",rawName:"v-checkall",value:t.update,expression:"update"}],attrs:{type:"checkbox",disabled:t.disabled,"true-value":t.trueValue,"false-value":t.falseValue},domProps:{checked:Array.isArray(t.checked)?t._i(t.checked,null)>-1:t._q(t.checked,t.trueValue)},on:{change:function(e){var n=t.checked,i=e.target,r=i.checked?t.trueValue:t.falseValue;if(Array.isArray(n)){var o=null,a=t._i(n,o);i.checked?a<0&&(t.checked=n.concat([o])):a>-1&&(t.checked=n.slice(0,a).concat(n.slice(a+1)))}else t.checked=r}}})],t._v(" "),n("span",{staticClass:"yd-checkbox-icon",style:t.iconStyles()},[n("i",{style:t.checkIconStyles()})]),t._v(" "),t.$slots.default?[n("span",{staticClass:"yd-checkbox-text"},[t._t("default")],2)]:[n("span",{staticClass:"yd-checkbox-text"},[t._v(t._s(t.val))])]],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-dialog-black-mask"},[n("div",{staticClass:"yd-confirm"
},[n("div",{staticClass:"yd-confirm-hd"},[n("strong",{staticClass:"yd-confirm-title",domProps:{innerHTML:t._s(t.title)}})]),t._v(" "),n("div",{staticClass:"yd-confirm-bd",domProps:{innerHTML:t._s(t.mes)}}),t._v(" "),"function"==typeof t.opts?[n("div",{staticClass:"yd-confirm-ft"},[n("a",{staticClass:"yd-confirm-btn default",attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.closeConfirm(!1)}}},[t._v("取消")]),t._v(" "),n("a",{staticClass:"yd-confirm-btn primary",attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.closeConfirm(!1,t.opts)}}},[t._v("确定")])])]:[n("div",{staticClass:"yd-confirm-ft"},t._l(t.opts,function(e,i){return n("a",{key:i,staticClass:"yd-confirm-btn",class:"boolean"==typeof e.color?e.color?"primary":"default":"",style:{color:e.color},attrs:{href:"javascript:;"},on:{click:function(n){n.stopPropagation(),t.closeConfirm(e.stay,e.callback)}}},[t._v(t._s(e.txt))])}))]],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-step",class:"yd-step-theme"+t.theme},[n("ul",{staticClass:"yd-step-content",style:{paddingBottom:t.hasBottom?"42px":"10px",paddingTop:t.hasTop?"42px":"10px",color:t.currentColor}},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-flexbox-item",class:t.classes},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("div",{staticClass:"yd-accordion-head"},[n("div",{staticClass:"yd-accordion-head-content"},[t._t("icon"),t._v(" "),n("div",{staticClass:"yd-accordion-title",class:t.$slots.icon||t.$slots.txt?"":"yd-accordion-title-full",on:{click:t.toggle}},[t.$slots.title?n("span",[t._t("title")],2):n("span",[t._v(t._s(t.title))])]),t._v(" "),t._t("txt")],2),t._v(" "),n("div",{staticClass:"yd-accordion-head-arrow",class:t.show?"yd-accordion-rotated":"",on:{click:function(e){e.stopPropagation(),t.toggle(e)}}})]),t._v(" "),n("div",{staticClass:"yd-accordion-content",style:t.styleHeight},[n("div",{ref:"content"},[t._t("default")],2)])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-scrollnav"},[n("div",{ref:"navbox",staticClass:"yd-scrollnav-tab",style:{color:t.color,backgroundColor:t.bgcolor}},[n("div",{staticClass:"yd-scrollnav-unfold",class:t.toggle?"yd-scrollnav-unfold-active":""},[n("div",{staticClass:"yd-scrollnav-unfold-header",style:{height:t.height,borderColor:t.borderColor}},[n("div",{style:{backgroundColor:t.bgcolor},domProps:{innerHTML:t._s(t.toggleText)}}),t._v(" "),n("span")]),t._v(" "),n("ul",{style:{color:t.currentColor,backgroundColor:t.bgcolor}},t._l(t.navList,function(e,i){return n("li",{key:i,class:t.activeIndex===i?"yd-scrollnav-current":"",style:{color:t.color},on:{click:function(e){e.stopPropagation(),t.scrollContent(i)}}},[t._v(t._s(e.label)+"\n                ")])}))]),t._v(" "),n("ul",{ref:"nav",staticClass:"yd-scrollnav-tab-item",style:{color:t.currentColor,height:t.height}},t._l(t.navList,function(e,i){return n("li",{key:i,ref:"navitem_"+i,refInFor:!0,class:t.activeIndex===i?"yd-scrollnav-current":"",style:{color:t.color},on:{click:function(e){e.stopPropagation(),t.scrollContent(i)}}},[n("i"),n("span",[t._v(t._s(e.label))])])})),t._v(" "),n("div",{staticClass:"yd-scrollnav-toggle",class:t.toggle?"yd-scrollnav-toggle-active":"",on:{click:function(e){t.toggle=!t.toggle}}})]),t._v(" "),n("div",{ref:"scrollView",staticClass:"yd-scrollnav-content"},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("yd-mask",{attrs:{opacity:t.maskerOpacity},nativeOn:{click:function(e){t.close(e)}},model:{value:t.show,callback:function(e){t.show=e},expression:"show"}}),t._v(" "),n("div",{staticClass:"yd-keyboard",class:t.show?"yd-keyboard-active":""},[n("div",{staticClass:"yd-keyboard-head"},[n("strong",[t._v(t._s(t.inputText))])]),t._v(" "),n("div",{staticClass:"yd-keyboard-error"},[t._v(t._s(t.error))]),t._v(" "),n("ul",{staticClass:"yd-keyboard-password"},t._l(6,function(e,i){return n("li",{key:i},[n("i",{directives:[{name:"show",rawName:"v-show",value:t.nums.length>=e,expression:"nums.length >= n"}]})])})),t._v(" "),n("div",{staticClass:"yd-keyboard-content"},[n("div",{staticClass:"yd-keyboard-title"},[t._v(t._s(t.title))]),t._v(" "),n("ul",{staticClass:"yd-keyboard-numbers"},t._l(4,function(e,i){return n("li",{key:i},[t.triggerClose?[4==e?n("a",{attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.close(e)}}},[t._v(t._s(t.cancelText))]):t._e()]:[4==e?n("a",{attrs:{href:"javascript:;"}}):t._e()],t._v(" "),t.isMobile?t._l(t.numsArr.slice(3*(e-1),3*e),function(e,i){return n("a",{key:i,attrs:{href:"javascript:;"},on:{touchstart:function(n){n.stopPropagation(),t.numclick(e)}}},[t._v(t._s(e))])}):t._l(t.numsArr.slice(3*(e-1),3*e),function(e,i){return n("a",{key:i,attrs:{href:"javascript:;"},on:{click:function(n){n.stopPropagation(),t.numclick(e)}}},[t._v(t._s(e))])}),t._v(" "),4==e?n("a",{attrs:{href:"javascript:;"},on:{click:function(e){e.stopPropagation(),t.backspace(e)}}}):t._e()],2)}))])])],1)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-cell-box"},[n("div",{staticClass:"yd-cell"},[t.title?n("div",{staticClass:"yd-cell-title"},[t._v(t._s(t.title))]):t._e(),t._v(" "),t._t("default")],2),t._v(" "),t._t("bottom")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("svg",{staticClass:"lds-ellipsis",attrs:{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 100 100",preserveAspectRatio:"xMidYMid"}},[n("circle",{attrs:{cx:"84",cy:"50",r:"5.04711",fill:"#f3b72e"}},[n("animate",{attrs:{attributeName:"r",values:"10;0;0;0;0",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}}),t._v(" "),n("animate",{attrs:{attributeName:"cx",values:"84;84;84;84;84",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}})]),t._v(" "),n("circle",{attrs:{cx:"66.8398",cy:"50",r:"10",fill:"#E8574E"}},[n("animate",{attrs:{attributeName:"r",values:"0;10;10;10;0",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"-0.85s"}}),t._v(" "),n("animate",{attrs:{attributeName:"cx",values:"16;16;50;84;84",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"-0.85s"}})]),t._v(" "),n("circle",{attrs:{cx:"32.8398",cy:"50",r:"10",fill:"#43A976"}},[n("animate",{attrs:{attributeName:"r",values:"0;10;10;10;0",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"-0.425s"}}),t._v(" "),n("animate",{attrs:{attributeName:"cx",values:"16;16;50;84;84",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"-0.425s"}})]),t._v(" "),n("circle",{attrs:{cx:"16",cy:"50",r:"4.95289",fill:"#304153"}},[n("animate",{attrs:{attributeName:"r",values:"0;10;10;10;0",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}}),t._v(" "),n("animate",{attrs:{attributeName:"cx",values:"16;16;50;84;84",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}})]),t._v(" "),n("circle",{attrs:{cx:"16",cy:"50",r:"0",fill:"#f3b72e"}},[n("animate",{attrs:{attributeName:"r",values:"0;0;10;10;10",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}}),t._v(" "),n("animate",{attrs:{attributeName:"cx",values:"16;16;16;50;84",keyTimes:"0;0.25;0.5;0.75;1",keySplines:"0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1;0 0.5 0.5 1",calcMode:"spline",dur:"1.7s",repeatCount:"indefinite",begin:"0s"}})])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t.title?n("div",{staticClass:"yd-gridstitle"},[t._v(t._s(t.title))]):t._e(),t._v(" "),n("div",{class:t.classes},[t._t("default")],2)])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return"link"===t.type?n("router-link",{staticClass:"yd-tabbar-item",class:t.classes,style:t.styles,attrs:{to:t.link,exact:t.$parent.exact,"active-class":t.$parent.activeClass,tag:t.tag}},[n("span",{staticClass:"yd-tabbar-icon"},[t._t("icon"),t._v(" "),n("span",{staticClass:"yd-tabbar-badge"},[t._t("badge")],2),t._v(" "),t.dot?n("span",{staticClass:"yd-tabbar-dot"}):t._e()],2),t._v(" "),n("span",{staticClass:"yd-tabbar-txt"},[t._v(t._s(t.title))])]):n("a",{staticClass:"yd-tabbar-item",class:t.classes,style:t.styles,attrs:{href:t.link}},[n("span",{staticClass:"yd-tabbar-icon"},[t._t("icon"),t._v(" "),n("span",{staticClass:"yd-tabbar-badge"},[t._t("badge")],2),t._v(" "),t.dot?n("span",{staticClass:"yd-tabbar-dot"}):t._e()],2),t._v(" "),n("span",{staticClass:"yd-tabbar-txt"},[t._v(t._s(t.title))])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("label",{staticClass:"yd-radio"},[n("input",{attrs:{type:"radio",disabled:t.disabled},domProps:{checked:t.checked},on:{change:t.changeHandler}}),t._v(" "),n("span",{staticClass:"yd-radio-icon",style:[{color:t.$parent.color},t.styles(1)]},[n("i",{style:t.styles(2)})]),t._v(" "),t.$slots.default?n("span",{staticClass:"yd-radio-text"},[t._t("default")],2):n("span",{staticClass:"yd-radio-text"},[t._v(t._s(t.val))])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-dialog-white-mask"},[n("div",{staticClass:"yd-loading"},[n("div",{staticClass:"yd-loading-icon"}),t._v(" "),n("div",{staticClass:"yd-loading-txt",domProps:{innerHTML:t._s(t.title)}})])])},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticStyle:{display:"none"}},[t._t("top"),t._v(" "),n("div",{staticClass:"yd-lightbox-scroller"},[t._t("content")],2),t._v(" "),t._t("bottom")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-datetime-input",on:{click:function(e){e.stopPropagation(),t.open(e)}}},[t.value?[t._v(t._s(t.value))]:[n("span",{staticClass:"yd-datetime-placeholder"},[t._v(t._s(t.placeholder))])]],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",[n("yd-mask",{attrs:{opacity:t.maskerOpacity},nativeOn:{click:function(e){t.close(e)}},model:{value:t.show,callback:function(e){t.show=e},expression:"show"}}),t._v(" "),n("div",{ref:"box",class:t.classes,style:t.styles},[t.$slots.top&&"center"!==t.position?n("div",{ref:"top"},[t._t("top")],2):t._e(),t._v(" "),n("div",{staticClass:"yd-popup-content"},[n("div",{ref:"content"},[t._t("default")],2)]),t._v(" "),t.$slots.bottom&&"center"!==t.position?n("div",{ref:"bottom"},[t._t("bottom")],2):t._e()])],1)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-tab-panel-item",class:t.classes},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("div",{staticClass:"yd-checklist",class:"right"==t.align?"yd-checklist-alignright":"",style:{color:t.color}},[t._t("default")],2)},staticRenderFns:[]}},function(t,e){t.exports={render:function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("li",{staticClass:"yd-step-item",class:t.currentClass},[1==t.theme?[n("em",{class:t.stepNumber<t.current?"yd-step-checkmark":""},[n("i",[t._v(t._s(t.stepNumber>=t.current?t.stepNumber:""))])])]:[n("em")],t._v(" "),n("div",{staticClass:"yd-step-item-top"},[n("div",{staticClass:"yd-step-item-top-text"},[n("span",[t._t("top")],2)])]),t._v(" "),n("div",{staticClass:"yd-step-item-bottom"},[t._t("bottom")],2)],2)},staticRenderFns:[]}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-accordion-item",data:function(){return{show:this.open,height:0,styleHeight:{height:0}}},props:{title:String,open:{type:Boolean,default:!1},auto:{type:Boolean,default:!0}},watch:{open:function(t){t?this.$parent.open(this._uid):this.closeItem()}},methods:{toggle:function(){this.auto&&this.$parent.open(this._uid)},openItem:function(){var t=this;this.$parent.opening=!0,this.styleHeight={height:this.$refs.content.offsetHeight+"px"},setTimeout(function(){t.styleHeight={},t.$parent.opening=!1},200),this.show=!0},closeItem:function(){var t=this;void 0===this.styleHeight.height?(this.styleHeight={height:this.$refs.content.offsetHeight+"px"},setTimeout(function(){t.styleHeight={height:0}},50)):this.styleHeight={height:0},this.show=!1}},mounted:function(){var t=this;this.$nextTick(function(){t.open&&t.openItem()})}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-accordion",data:function(){return{opening:!1}},props:{accordion:{type:Boolean,default:!1}},methods:{open:function(t){var e=this;this.opening||this.$children.forEach(function(n){n._uid===t?n.show?n.closeItem():n.openItem():!e.accordion&&n.closeItem()})}}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(6),a=i(o);e.default={name:"yd-actionsheet",components:{"yd-mask":a.default},data:function(){return{show:this.value}},props:{value:{type:Boolean,default:!1},items:{type:Array,required:!0},cancel:String,maskerOpacity:{validator:function(t){return/^([0]|[1-9]\d*)?(\.\d*)?$/.test(t)},default:.5}},watch:{value:function(t){r.isIOS&&(t?r.pageScroll.lock():r.pageScroll.unlock()),this.show=t}},methods:{itemClick:function(t){t&&("function"==typeof t.callback&&t.callback(t),!t.stay&&this.close())},close:function(){this.$emit("input",!1)}},destroyed:function(){this.close(),r.pageScroll.unlock()}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-backtop",data:function(){return{show:!1}},methods:{backtop:function(){var t=0;t=this.scrollView===window?document.documentElement&&document.documentElement.scrollTop?document.documentElement.scrollTop:document.body.scrollTop:this.scrollView.scrollTop,(0,i.scrollTop)(this.scrollView,t,0)},scrollHandler:function(){var t=window.pageYOffset,e=window.innerHeight;this.scrollView!==window&&(t=this.scrollView.scrollTop,e=this.scrollView.offsetHeight),this.show=t>=e/2},throttle:function(t,e){clearTimeout(t.tId),t.tId=setTimeout(function(){t.call(e)},50)},throttledCheck:function(){this.throttle(this.scrollHandler)}},mounted:function(){this.scrollView=(0,i.getScrollview)(this.$el),this.scrollView.addEventListener("scroll",this.throttledCheck,!1),this.scrollView.addEventListener("resize",this.scrollHandler,!1)},beforeDestroy:function(){this.scrollView.removeEventListener("scroll",this.throttledCheck,!1),this.scrollView.removeEventListener("resize",this.scrollHandler,!1)}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-badge",props:{type:{validator:function(t){return["primary","danger","warning","hollow"].indexOf(t)>-1}},shape:{validator:function(t){return["circle","square"].indexOf(t)>-1}},color:{validator:function(t){return!t||(0,i.isColor)(t)}},bgcolor:{validator:function(t){return!t||(0,i.isColor)(t)}}},computed:{typesClass:function(){return this.bgcolor?"square"==this.shape?" yd-badge-radius":"":(this.type?"yd-badge-"+this.type:"")+("square"==this.shape?" yd-badge-radius":"")}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-button-group"}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-button",props:{disabled:Boolean,actionType:{validator:function(t){return["button","submit","reset"].indexOf(t)>-1},default:"button"},type:{validator:function(t){return["primary","danger","warning","hollow","disabled"].indexOf(t)>-1},default:"primary"},size:{validator:function(t){return["small","large"].indexOf(t)>-1}},bgcolor:{validator:function(t){return!t||(0,i.isColor)(t)}},color:{validator:function(t){return!t||(0,i.isColor)(t)}},shape:{validator:function(t){return["square","circle"].indexOf(t)>-1},default:"square"}},computed:{classes:function(){var t="large"===this.size?"yd-btn-block":"yd-btn",e="yd-btn-"+this.type;return this.disabled&&(e="yd-btn-disabled"),this.bgcolor&&(e=""),t+" "+e+("circle"===this.shape?" yd-btn-circle":"")}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-cell-group",props:{title:String}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-cell-item",props:{type:{validator:function(t){return["link","a","label","div","checkbox","radio"].indexOf(t)>-1},default:"div"},arrow:{type:Boolean,default:!1},href:{type:[String,Object]}},computed:{checkLeft:function(){return!!this.$slots.left||!!this.$slots.icon},classes:function(){return this.arrow?"yd-cell-arrow":""}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-checkbox-group",props:{value:{type:Array,default:[]},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#4CD864"},size:{validator:function(t){return/^([1-9]\d*)$/.test(t)},default:20}},methods:{updateValue:function(){var t=this.value;this.childrens=this.$children.filter(function(t){return"yd-checkbox"===t.$options.name}),this.childrens&&this.childrens.forEach(function(e){e.model=t})},change:function(t){this.$emit("input",t)}},watch:{value:function(){this.updateValue()}},mounted:function(){this.$nextTick(this.updateValue)}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-checkbox",data:function(){return{model:[],group:!1,checked:this.value,update:this.change}},directives:{checkall:{bind:function(t,e){t.addEventListener("click",e.value)}}},props:{change:{type:Function},value:{type:[Boolean,String,Number],default:!1},val:{type:[Boolean,String,Number]},disabled:{type:Boolean,default:!1},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#4CD864"},size:{validator:function(t){return/^([1-9]\d*)$/.test(t)},default:20},shape:{validator:function(t){return["square","circle"].indexOf(t)>-1},default:"square"},trueValue:{type:[String,Number,Boolean],default:!0},falseValue:{type:[String,Number,Boolean],default:!1}},methods:{changeHandler:function(){var t=this;this.disabled||setTimeout(function(){t.$parent.change(t.model)},0)},iconStyles:function(){var t=(this.group?this.$parent.size:this.size)+"px",e=this.group?this.$parent.color:this.color;return{width:t,height:t,color:e}},checkIconStyles:function(){var t=this.group?this.$parent.size:this.size;return{width:Math.round(t/3.2)+"px",height:Math.round(t/1.7)+"px"}}},watch:{checked:function(t){this.$emit("input",t)},value:function(t){this.checked=t}},created:function(){this.$parent.color&&(this.group=!0)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-checklist-item",data:function(){return{checked:!1,label:!0}},methods:{changeHandler:function(){this.disabled||(this.checked=!this.checked,this.$parent.emitInput())},emitChangeHandler:function(){this.label&&this.changeHandler()}},props:{disabled:{type:Boolean,default:!1},val:{type:[Boolean,String,Number],required:!0}},mounted:function(){this.$nextTick(this.$parent.checkItem)}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-checklist",data:function(){return{isCheckAll:!1}},props:{value:{type:Array},color:{validator:function(t){return(0,i.isColor)(t)},default:"#4CD864"},align:{type:String,validator:function(t){return["left","right"].indexOf(t)>-1},default:"left"},label:{type:Boolean,default:!0},callback:{type:Function}},methods:{checkItem:function(){var t=this,e=this.$children.filter(function(t){return"yd-checklist-item"===t.$options.name});e.forEach(function(e){e.checked=t.contains(t.value,e.val),e.label=t.label})},contains:function(t,e){for(var n=t.length;n--;)if(t[n]==e)return!0;return!1},emitInput:function(t,e){var n=[],i=this.$children.filter(function(t){return"yd-checklist-item"===t.$options.name}),r=0;i.forEach(function(i){i.disabled?r++:t&&(i.checked=e),i.checked&&n.push(i.val)}),this.isCheckAll=n.length>=i.length-r,this.$emit("input",n)},checkAll:function(t){this.emitInput(!0,t)}},watch:{value:function(t){this.callback&&this.callback(t,this.isCheckAll),this.$nextTick(this.checkItem)}},mounted:function(){this.$on("ydui.checklist.checkall",this.checkAll)}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(6),a=i(o);e.default={name:"yd-cityselect",components:{"yd-mask":a.default},data:function(){return{show:this.value,navIndex:1,nav:{txt1:this.chooseTitle,txt2:"",txt3:""},columnsObj:{},active:{},activeClasses:"",itemHeight:40,columnNum:1}},props:{ready:{type:Boolean,default:!0},provance:String,city:String,area:String,done:Function,callback:Function,title:{type:String,default:"所在地区"},chooseTitle:{type:String,default:"请选择"},value:{type:Boolean,default:!1},items:{type:Array,required:!0},columns:{validator:function(t){return/^\d*$/.test(t)}},maskerOpacity:{validator:function(t){return/^([0]|[1-9]\d*)?(\.\d*)?$/.test(t)},default:.5}},watch:{value:function(t){r.isIOS&&(t?r.pageScroll.lock(this.$refs.mask.$el):r.pageScroll.unlock(this.$refs.mask.$el)),this.show=t},ready:function(t){t&&this.init()}},methods:{init:function(){var t=this;this.ready&&this.items&&this.items[0]&&this.isArray(this.items)&&(this.columns&&~~this.columns>1?this.columnNum=~~this.columns:this.getColumsNum(this.items[0]),this.columnsObj.columnItems1=this.items,this.provance&&this.$nextTick(function(){t.setDefalutValue(t.items,"provance",1)}),this.$on("ydui.cityselect.reset",function(){for(var e=1;e<=t.columnNum;e++)t.active["itemValue"+e]="",t.active["itemName"+e]="",e-1===0?(t.navIndex=e,t.nav["txt"+e]=t.chooseTitle,t.$refs["itemBox"+e][0].scrollTop=0,t.backoffView(!1)):(t.nav["txt"+e]="",t.columnsObj["columnItems"+e]=[]),e===t.columnNum&&t.returnValue()}))},navEvent:function(t){this.columnNum>2&&(t>=this.columnNum?this.forwardView(!0):this.backoffView(!0)),this.navIndex=t},itemEvent:function(t,e,n,i){if(this.active["itemValue"+t]=n,this.active["itemName"+t]=e,this.nav["txt"+t]=e,this.columnsObj["columnItems"+(t+1)]=i,t>1&&i&&i.length>0&&this.columnNum>2&&this.forwardView(!0),this.clearNavTxt(t),t===this.columnNum||i.length<=0){if(t!==this.columnNum)for(var r=this.columnNum;r>=0;r--)r>t&&(this.active["itemValue"+r]="",this.active["itemName"+r]="",this.nav["txt"+r]="");this.navIndex=t,this.returnValue()}else this.navIndex=t+1,this.nav["txt"+(t+1)]=this.chooseTitle},currentClass:function(t,e,n){return t&&t==this.active["itemValue"+n]||e&&e===this.active["itemName"+n]?"yd-cityselect-item-active":""},clearNavTxt:function(t){for(var e=0;e<this.columnNum;e++)e>t&&(this.nav["txt"+(e+1)]="")},getColumsNum:function(t){this.isArray(t.c)&&(this.columnNum++,this.getColumsNum(t.c[0]))},isArray:function(t){return t&&t.constructor===Array&&t.length>0},setDefalutValue:function(t,e,n){var i=this;t.every(function(t,r){if(t.v==i[e]||t.n===i[e]){var o=i.columnsObj["columnItems"+(n+1)]=t.c,a=i.$refs["itemBox"+n][0];return a.scrollTop=r*i.itemHeight-a.offsetHeight/3,i.active["itemValue"+n]=t.v,i.active["itemName"+n]=t.n,i.nav["txt"+n]=t.n,i.navIndex=n,++n,n>=i.columnNum&&i.columnNum>2&&i.forwardView(!1),i.isArray(o)&&i.setDefalutValue(o,["","provance","city","area"][n],n),!1}return!0})},returnValue:function(){this.callback&&this.callback(this.active),this.close()},close:function(){this.$emit("input",!1),this.show=!1},backoffView:function(t){this.activeClasses=(t?"yd-cityselect-move-animate":"")+" yd-cityselect-prev"},forwardView:function(t){this.activeClasses=(t?"yd-cityselect-move-animate":"")+" yd-cityselect-next"}},mounted:function(){this.init()},beforeDestroy:function(){this.close()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-countdown",data:function(){return{str:"",timer:null,tempFormat:"",showTpl:!0}},props:{time:{type:[String,Number,Date]},format:{type:String,default:"{%d}天{%h}时{%m}分{%s}秒"},timetype:{validator:function(t){return["datetime","second"].indexOf(t)>-1},default:"datetime"},callback:{type:Function},doneText:{type:String,default:"已结束"}},watch:{time:function(t){t&&this.run()}},methods:{run:function(){this.time&&("second"===this.timetype?this.lastTime=Math.floor(new Date/1e3)+~~this.time:this.time instanceof Date?this.lastTime=Math.floor(this.time.getTime()/1e3):this.lastTime=Math.floor(new Date(this.time).getTime()/1e3),this.doRun(),this.timer=setInterval(this.doRun,1e3))},doRun:function(){var t=this.lastTime-Math.floor((new Date).getTime()/1e3);t>0?this.str=this.timestampTotime(t):(this.callback&&this.callback(),this.str=this.doneText,clearInterval(this.timer))},timestampTotime:function(t){var e=this.tempFormat,n={};n.s=t%60,t=Math.floor(t/60),n.m=t%60,t=Math.floor(t/60),n.h=t%24,n.d=Math.floor(t/24);var i=function(t){return t<=0?"00":t<10?"0"+t:t},r=["d","h","m","s"];return r.forEach(function(t){var r=i(n[t]).toString().split("");e=e.replace("{%"+t+"}",i(n[t])),e=e.replace("{%"+t+"0}",0!=~~r[0]?r[0]:""),e=e.replace("{%"+t+"1}",~~r[r.length-2]),e=e.replace("{%"+t+"2}",~~r[r.length-1])}),e}},mounted:function(){var t=this;this.$nextTick(function(){t.tempFormat=t.$slots.default?t.$refs.tpl.innerHTML:t.format,t.showTpl=!1,t.run()})},beforeDestroy:function(){clearInterval(this.timer)}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(283),o=i(r);e.default={name:"yd-countup",data:function(){return{instance:null}},props:{start:{type:Boolean,default:!0},startnum:{validator:function(t){return/^([0]|[1-9]\d*)(\.\d*)?$/.test(t)},default:0},endnum:{validator:function(t){return/^([0]|[1-9]\d*)(\.\d*)?$/.test(t)},required:!0},decimals:{validator:function(t){return/^\d*$/.test(t)},default:0},duration:{validator:function(t){return/^([0]|[1-9]\d*)(\.\d*)?$/.test(t)},default:2},useEasing:{type:Boolean,default:!1},separator:{type:String,default:""},prefix:{type:String,default:""},suffix:{type:String,default:""},callback:{type:Function}},watch:{start:function(t){var e=this;t&&this.instance.start(function(){e.callback&&e.callback(e.instance)})},endnum:function(t){this.instance&&this.instance.update&&this.instance.update(t)}},methods:{init:function(){var t=this;if(!this.instance){var e={decimal:".",useEasing:this.useEasing,separator:this.separator,prefix:this.prefix,suffix:this.suffix};this.instance=new o.default(this.$el,this.startnum,this.endnum,this.decimals,this.duration,e),this.start&&this.instance.start(function(){t.callback&&t.callback(t.instance)})}}},mounted:function(){this.init()},beforeDestroy:function(){this.instance=null}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(5),a=i(o),s=n(11),l=i(s),c=n(72),u=i(c);e.default={name:"yd-datetime",data:function(){return{picker:null,currentValue:this.value,tmpNum:0}},props:{readonly:{type:Boolean,default:!1},type:{type:String,validator:function(t){return["datetime","date","time","month","day"].indexOf(t)>-1},default:"datetime"},startDate:{type:String,validator:function(t){return!t||(l.default.isDateTimeString(t)||l.default.isTimeString(t)||l.default.isMonthString(t)||l.default.isDayString(t))}},endDate:{type:String,validator:function(t){return!t||(l.default.isDateTimeString(t)||l.default.isTimeString(t)||l.default.isMonthString(t)||l.default.isDayString(t))}},startYear:{validator:function(t){return/^\d{4}|0$/.test(t)},default:0},endYear:{validator:function(t){return/^\d{4}|0$/.test(t)},default:0},startHour:{validator:function(t){return/^(0|[1-9]|1[0-9]|2[0-3])?$/.test(t)},default:0},endHour:{validator:function(t){return/^([1-9]|1[0-9]|2[0-3])?$/.test(t)},default:23},yearFormat:{type:String,default:"{value}年"},monthFormat:{type:String,default:"{value}月"},dayFormat:{type:String,default:"{value}日"},hourFormat:{type:String,default:"{value}时"},minuteFormat:{type:String,default:"{value}分"},cancelText:{type:String,default:"取消"},confirmText:{type:String,default:"确定"},value:{type:String,validator:function(t){return!t||(l.default.isDateTimeString(t)||l.default.isTimeString(t)||l.default.isMonthString(t)||l.default.isDayString(t))}},initEmit:{type:Boolean,default:!0},placeholder:String,callback:Function,maskerOpacity:{validator:function(t){return/^([0]|[1-9]\d*)?(\.\d*)?$/.test(t)},default:.5}},watch:{value:function(t){this.currentValue!=t&&this.render(!1)},startDate:function(){this.render(!0)},endDate:function(){this.render(!0)}},methods:{open:function(){this.readonly||this.picker.open()},close:function(){this.picker.close()},removeElement:function(){this.picker&&this.picker.$el&&document.body.removeChild(this.picker.$el)},render:function(t){var e=this;this.removeElement();var n=a.default.extend(u.default),i=this._props;i.reloadMonth=t,this.picker=new n({el:document.createElement("div"),data:i}),document.body.appendChild(this.picker.$el),this.picker.$on("pickerConfirm",function(t){(e.tmpNum>0||e.initEmit)&&(e.currentValue=t,e.$emit("input",t),e.callback&&e.callback(t)),e.tmpNum++})}},mounted:function(){this.render()},beforeDestroy:function(){r.pageScroll.unlock(),this.removeElement()}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(6),a=i(o),s=n(286),l=i(s),c=n(11),u=i(c);e.default={data:function(){return{itemHeight:38,value:"",reloadMonth:!1,show:!1,parentEL:null,columns:[],scroller:[],type:"",cancelText:"",confirmText:"",items:{Year:[],Month:[],Day:[],Hour:[],Minute:[]},scrolling:{Year:!1,Month:!1,Day:!1,Hour:!1,Minute:!1},readonly:!1,currentYear:"",currentMonth:"",currentDay:"",currentHour:"",currentMinute:"",currentValue:"",yearFormat:"{value}年",monthFormat:"{value}月",dayFormat:"{value}日",hourFormat:"{value}时",minuteFormat:"{value}分",startYear:0,endYear:0,startHour:0,endHour:23,maskerOpacity:.5}},components:{"yd-mask":a.default},watch:{currentYear:function(t){this.setMonths(t)},currentMonth:function(t){this.setDays(t)},currentDay:function(t){this.setHours(t)},currentHour:function(t){this.setMinutes(t)}},methods:{init:function(){var t=this,e=t.currentValue=t.value.replace(/-/g,"/");t.startDate&&new Date(e).getTime()<new Date(t.startDate).getTime()&&(e=t.currentValue=t.startDate),t.endDate&&new Date(e).getTime()>new Date(t.endDate).getTime()&&(e=t.currentValue=t.endDate);var n=new Date(e),i=n.getFullYear(),r=n.getMonth()+1,o=n.getDate(),a=n.getHours(),s=n.getMinutes();
if("time"!==t.type){var l=t.items.Year=u.default.getYearItems({format:t.yearFormat,startDate:t.startDate,endDate:t.endDate,startYear:t.startYear,endYear:t.endYear});e||(i=l[0].value);var c=u.default.getMonthItems({format:t.monthFormat,currentYear:i,startDate:t.startDate,endDate:t.endDate});e||(r=c[0].value);var d=u.default.getDayItems({format:t.dayFormat,currentYear:i,currentMonth:r,startDate:t.startDate,endDate:t.endDate});e||(o=d[0].value),e?(t.currentYear=i,t.inDatas(l,t.currentYear)||(t.currentYear=l[0].value),this.reloadMonth&&this.setMonths(t.currentYear),t.currentMonth=u.default.mentStr(r),t.inDatas(c,t.currentMonth)||(t.currentMonth=c[0].value),t.currentDay=u.default.mentStr(o),t.inDatas(d,t.currentDay)||(t.currentDay=d[0].value)):(t.currentYear=i,t.currentMonth=r,t.currentDay=o)}if("datetime"===t.type||"time"===t.type){var f=u.default.getHourItems({format:t.hourFormat,currentYear:i,currentMonth:r,currentDay:o,startDate:t.startDate,endDate:t.endDate,startHour:t.startHour,endHour:t.endHour});e||(a=f[0].value);var h=u.default.getMinuteItems({format:t.minuteFormat,currentYear:i,currentMonth:r,currentDay:o,currentHour:a,startDate:t.startDate,endDate:t.endDate});if(e||(s=h[0].value),"time"===t.type&&(t.items.Hour=f),e){if(u.default.isDateTimeString(e))t.currentHour=u.default.mentStr(a),t.currentMinute=u.default.mentStr(s);else{var p=e.split(":");t.currentHour=u.default.mentStr(p[0]),t.currentMinute=u.default.mentStr(p[1])}t.inDatas(f,t.currentHour)||(t.currentHour=f[0].value),t.inDatas(h,t.currentMinute)||(t.currentMinute=h[0].value)}else t.currentHour=a,t.currentMinute=s}"datetime"===t.type?t.columns=["Year","Month","Day","Hour","Minute"]:"month"===t.type?t.columns=["Year","Month"]:"day"===t.type?t.columns=["Month","Day"]:"date"===t.type?t.columns=["Year","Month","Day"]:t.columns=["Hour","Minute"]},render:function(){var t=this;t.columns.forEach(function(e){var n=t.$refs["Component_"+e][0],i=t.$refs["Content_"+e][0];t.scroller[e]=new l.default(n,i,{itemHeight:t.itemHeight,onSelect:function(n){t["current"+e]=n,t.scrolling[e]=!1},callback:function(n,r){r&&(t.scrolling[e]=!0),i.style.webkitTransform="translate3d(0, "+-n+"px, 0)"}});var r=t.items[e].length;t.scroller[e].setDimensions(7*t.itemHeight,r*t.itemHeight,r),t.scroller[e].select(t["current"+e],!1),t.scrolling[e]=!1}),t.setValue()},setMonths:function(t){var e=this,n=e.items.Month=u.default.getMonthItems({format:e.monthFormat,currentYear:t,startDate:e.startDate,endDate:e.endDate});e.scrolloToPosition("Month",n,function(){e.setDays(e.currentMonth)})},setDays:function(t){var e=this,n=e.items.Day=u.default.getDayItems({format:e.dayFormat,currentYear:e.currentYear,currentMonth:t,startDate:e.startDate,endDate:e.endDate});e.scrolloToPosition("Day",n,function(){e.setHours(e.currentDay)})},setHours:function(t){var e=this,n=e.items.Hour=u.default.getHourItems({format:e.hourFormat,currentYear:e.currentYear,currentMonth:e.currentMonth,currentDay:t,startDate:e.startDate,endDate:e.endDate,startHour:e.startHour,endHour:e.endHour});e.scrolloToPosition("Hour",n,function(){e.setMinutes(e.currentHour)})},setMinutes:function(t){var e=this,n=e.items.Minute=u.default.getMinuteItems({format:e.minuteFormat,currentYear:e.currentYear,currentMonth:e.currentMonth,currentDay:e.currentDay,currentHour:t,startDate:e.startDate,endDate:e.endDate});e.scrolloToPosition("Minute",n)},scrolloToPosition:function(t,e,n){var i=this,r=i.scroller[t];if(r){var o=e.length;r.setDimensions(7*i.itemHeight,o*i.itemHeight,o),setTimeout(function(){var o=i.inDatas(e,i["current"+t]);i.scrolling[t]||r.select(o?i["current"+t]:e[0].value,!1),"function"==typeof n&&n()},0)}},setValue:function(){var t="";t="datetime"===this.type?this.currentYear+"-"+this.currentMonth+"-"+this.currentDay+" "+this.currentHour+":"+this.currentMinute:"month"===this.type?this.currentYear+"-"+this.currentMonth:"day"===this.type?this.currentMonth+"-"+this.currentDay:"date"===this.type?this.currentYear+"-"+this.currentMonth+"-"+this.currentDay:this.currentHour+":"+this.currentMinute,this.currentValue=t,this.$emit("pickerConfirm",t),this.close()},inDatas:function(t,e){var n=!1;return t.forEach(function(t){t.value==e&&(n=!0)}),n},open:function(){this.readonly||(this.show=!0,r.isIOS&&r.pageScroll.lock())},close:function(){this.show=!1,r.isIOS&&r.pageScroll.unlock()}},created:function(){this.init()},mounted:function(){this.$nextTick(this.render)},beforeDestroy:function(){var t=this;this.columns.forEach(function(e){t.scroller[e]=null})}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={props:{mes:String,callback:Function}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={props:{title:String,mes:String,opts:{type:[Array,Function],default:function(){}}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={props:{title:String}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={data:function(){return{classes:""}},props:{mes:String,timeout:Number,callback:Function}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={props:{mes:String,icon:String,timeout:Number,callback:Function},computed:{iconsClass:function(){var t="";return"success"!==this.icon&&"error"!==this.icon||(t="yd-toast-"+this.icon+"-icon"),t}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-flexbox-item",props:{align:{validator:function(t){return["top","center","bottom"].indexOf(t)>-1},default:"center"}},computed:{classes:function(){return"top"===this.align?"yd-flexbox-item-start":"bottom"===this.align?"yd-flexbox-item-end":"yd-flexbox-item-center"}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-flexbox",props:{direction:{validator:function(t){return["horizontal","vertical"].indexOf(t)>-1},default:"horizontal"}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-grids-group",data:function(){return{height:55}},props:{rows:{validator:function(t){return["2","3","4","5"].indexOf(t+"")>-1},default:"4"},title:String,itemHeight:{validator:function(t){return 0==t||/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:0}},computed:{classes:function(){return"yd-grids-"+this.rows}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-grids-item",props:{type:{validator:function(t){return["link","a"].indexOf(t)>-1},default:"link"},link:[String,Object]},computed:{checkIcon:function(){return!!this.$slots.icon},checkText:function(){return!!this.$slots.text},styles:function(){if(0!=this.$parent.itemHeight)return{height:this.$parent.itemHeight,padding:0}}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-icon",props:{name:String,color:{validator:function(t){return!t||(0,i.isColor)(t)}},size:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".6rem"},custom:{type:Boolean,default:!1}},computed:{classes:function(){return this.custom?"icon-custom-"+this.name:"yd-icon-"+this.name},styles:function(){var t={};return this.size&&(t.fontSize=this.size),this.color&&(t.color=this.color),t}}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(84),o=i(r),a=n(4);e.default={name:"yd-infinitescroll",components:{Loading:o.default},data:function(){return{isLoading:!1,isDone:!1,num:1}},props:{onInfinite:{type:Function},callback:{type:Function},distance:{default:0,validator:function(t){return/^\d*$/.test(t)}},scrollTop:{type:Boolean,default:!0}},methods:{init:function(){var t=this;this.scrollview=(0,a.getScrollview)(this.$el),this.scrollTop&&(this.scrollview===window?window.scrollTo(0,0):this.scrollview.scrollTop=0),this.scrollview.addEventListener("scroll",this.throttledCheck,!1),this.$on("ydui.infinitescroll.loadedDone",function(){t.isLoading=!1,t.isDone=!0}),this.$on("ydui.infinitescroll.finishLoad",function(e){t.isLoading=!1}),this.$on("ydui.infinitescroll.reInit",function(){t.isLoading=!1,t.isDone=!1})},scrollHandler:function(){if(!this.isLoading&&!this.isDone){var t=this.scrollview,e=document.body.offsetHeight,n=t===window,i=n?0:t.getBoundingClientRect().top,r=n?e:t.offsetHeight;if(!t)return void console.warn("Can't find the scrollview!");if(!this.$refs.tag)return void console.warn("Can't find the refs.tag!");var o=Math.floor(this.$refs.tag.getBoundingClientRect().top)-1,a=this.distance&&this.distance>0?~~this.distance:Math.floor(e/10);o>i&&o-(a+i)*this.num<=e&&this.$el.offsetHeight>r&&(this.isLoading=!0,this.callback&&this.callback(),this.num++)}},throttle:function(t,e){clearTimeout(t.tId),t.tId=setTimeout(function(){t.call(e)},30)},throttledCheck:function(){this.throttle(this.scrollHandler)}},mounted:function(){this.$nextTick(this.init)},beforeDestroy:function(){this.scrollview.removeEventListener("scroll",this.throttledCheck)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-input",data:function(){return{currentValue:this.value,isempty:!this.value,iserror:!1,showPwd:!1,showClear:!1,showWarn:!0,initError:!1,valid:!0,errorMsg:"",errorCode:"",regexObj:{email:"^\\w+((-\\w+)|(\\.\\w+))*\\@[A-Za-z0-9]+((\\.|-)[A-Za-z0-9]+)*\\.[A-Za-z0-9]+$",mobile:"^(86){0,1}1[3-9]{1}\\d{9}$",bankcard:"^\\d{15,19}$"}}},props:{name:String,placeholder:String,value:[String,Number],readonly:Boolean,disabled:Boolean,regex:String,autocomplete:{type:String,default:"off"},showClearIcon:{type:Boolean,default:!0},showErrorIcon:{type:Boolean,default:!0},showSuccessIcon:{type:Boolean,default:!0},showRequiredIcon:{type:Boolean,default:!0},required:{type:Boolean,default:!1},type:{validator:function(t){return["text","password","search","email","number","tel","datetime-local","date","time"].indexOf(t)>-1},default:"text"},max:{validator:function(t){return/^\d*$/.test(t)}},min:{validator:function(t){return/^\d*$/.test(t)}},onBlur:{type:Function},onFocus:{type:Function}},watch:{value:function(t){this.currentValue=t,this.emitInput()},currentValue:function(t){this.isempty=!t,this.validatorInput(t,!0),this.emitInput()},required:function(t){this.required=t,this.validatorInput(this.currentValue,!1)}},methods:{validatorInput:function(t,e){if(this.initError=e,e&&(this.showWarn=!1),this.required&&""===t)return this.setError("不能为空","NOT_NULL"),void(this.iserror=!0);if(this.min&&t.length<this.min)return this.setError("最少输入"+this.min+"位字符","NOT_MIN_SIZE"),void(this.iserror=!0);var n="bankcard"===this.regex?t.replace(/\s/g,""):t,i=this.regexObj[this.regex]?this.regexObj[this.regex]:this.trim(this.regex,"/");return n&&this.regex&&!new RegExp(i).test(n)?(this.setError("输入字符不符合规则","NOT_REGEX_RULE"),void(this.iserror=!0)):(this.iserror=!1,this.valid=!0,this.errorMsg="",void(this.errorCode=""))},blurHandler:function(t){var e=this;this.validatorInput(this.currentValue,!0),setTimeout(function(){e.showClear=!1},200),this.onBlur&&this.onBlur(t)},focusHandler:function(t){this.showClear=!0,this.onFocus&&this.onFocus(t)},clearInput:function(){this.currentValue="",this.emitInput()},emitInput:function(){return"bankcard"===this.regex?(/\S{5}/.test(this.currentValue)&&(this.currentValue=this.currentValue.replace(/\s/g,"").replace(/(\d{4})(?=\d)/g,"$1 ")),void this.$emit("input",this.currentValue.replace(/\s/g,""))):void this.$emit("input",this.currentValue)},setError:function(t,e){this.errorMsg=t,this.errorCode=e,this.valid=!1},trim:function(t,e){return t?t.replace(new RegExp("^\\"+e+"+|\\"+e+"+$","g"),""):t},setFocus:function(){this.$refs.input.focus()},setBlur:function(){this.$refs.input.blur()}},mounted:function(){this.validatorInput(this.currentValue,!1)}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(6),a=i(o);e.default={name:"yd-keyboard",components:{"yd-mask":a.default},data:function(){return{nums:"",show:this.value,error:"",numsArr:[1,2,3,4,5,6,7,8,9,0]}},props:{inputDone:{type:Function},callback:{type:Function},disorder:{type:Boolean,default:!1},value:{type:Boolean,default:!1},title:{type:String,default:"YDUI安全键盘"},cancelText:{type:String,default:"取消"},inputText:{type:String,default:"输入数字密码"},triggerClose:{type:Boolean,default:!0},maskerOpacity:{validator:function(t){return/^([0]|[1-9]\d*)?(\.\d*)?$/.test(t)},default:.5}},watch:{value:function(t){r.isIOS&&(t?r.pageScroll.lock():r.pageScroll.unlock()),this.nums="",this.error="",this.show=t,this.show&&this.disorder&&(this.numsArr=this.upsetOrder(this.numsArr))},nums:function(t){t.length>=6&&this.callback&&this.callback(t)}},methods:{init:function(){var t=this;this.$on("ydui.keyboard.error",function(e){t.setError(e)}),this.$on("ydui.keyboard.close",this.close)},numclick:function(t){this.error="",this.nums.length>=6||(this.nums+=t)},backspace:function(){var t=this.nums;t&&(this.nums=t.substr(0,t.length-1))},upsetOrder:function(t){for(var e=Math.floor,n=Math.random,i=t.length,r=void 0,o=void 0,a=void 0,s=e(i/2)+1;s--;)r=e(n()*i),o=e(n()*i),r!==o&&(a=t[r],t[r]=t[o],t[o]=a);return t},close:function(){this.triggerClose&&this.$emit("input",!1)},setError:function(t){this.error=t,this.nums=""}},created:function(){var t=window.navigator&&window.navigator.userAgent||"";this.isMobile=!!t.match(/AppleWebKit.*Mobile.*/)||"ontouchstart"in document.documentElement,this.$nextTick(this.init)},beforeDestroy:function(){this.close(),r.pageScroll.unlock()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-layout",props:{link:String,title:String,showNavbar:{type:Boolean,default:!0}}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(10),o=i(r),a=n(9),s=i(a);e.default={components:{slider:o.default,sliderItem:s.default},data:function(){return{currentIndex:0,index:1,imgItems:[],show:!0,txtHTML:"",closeText:""}},methods:{close:function(){this.$el.parentNode&&this.$el.parentNode.removeChild(this.$el)},changeIndex:function(t){this.currentIndex=t},getImgSrc:function(t){return t.getAttribute("original")||t.getAttribute("src")}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-lightbox-img",props:{src:String,original:String}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-lightbox-txt"}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=n(87),s=i(a);e.default={name:"yd-lightbox",data:function(){return{show:!0,tabPanels:[],imgItems:[]}},props:{num:{default:0,validator:function(t){return/^\d*$/.test(t)}},closeText:{type:String,default:"关闭"}},watch:{num:function(){this.init()}},methods:{init:function(){var t=this;this.$nextTick(function(){t.imgItems=[],t.findImgs(t.$children),t.imgItems.forEach(function(e,n){e.bindedEvent||(e.bindedEvent=!0,e.$el.addEventListener("click",function(){t.appendDOM(n)},!1))})})},findImgs:function(t){var e=this;t.forEach(function(t){t&&"yd-lightbox-img"===t.$options.name&&e.imgItems.push(t),t.$children&&e.findImgs(t.$children)})},appendDOM:function(t){var e=o.default.extend(s.default),n=this.$children.filter(function(t){return"yd-lightbox-txt"===t.$options.name});this.box=new e({el:document.createElement("div"),data:{index:t,currentIndex:t,imgItems:this.imgItems,txtHTML:n[0]&&n[0].$el?n[0].$el.innerHTML:"",closeText:this.closeText}}),document.body.appendChild(this.box.$el)}},mounted:function(){this.$nextTick(this.init)},beforeDestroy:function(){this.box&&this.box.close()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-list-item",props:{type:{type:String,validator:function(t){return["link","a","div"].indexOf(t)>-1},default:"a"},href:[String,Object]}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-list-other"}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-list",props:{theme:{validator:function(t){return["1","2","3","4","5"].indexOf(t+"")>-1},default:"1"}},computed:{classes:function(){return"yd-list-theme"+this.theme}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-mask",data:function(){return{show:this.value}},props:{value:{type:Boolean,default:!1},bgcolor:{type:String,default:"#000"},zindex:{default:1500},opacity:{default:.5},animated:{type:Boolean,default:!0}},watch:{value:function(t){var e=this;this.show=t,i.isIOS&&(t?(0,i.addClass)(this.scrollView,"g-fix-ios-overflow-scrolling-bug"):setTimeout(function(){(0,i.removeClass)(e.scrollView,"g-fix-ios-overflow-scrolling-bug")},200))}},computed:{styles:function(){var t={"z-index":this.zindex,"background-color":this.bgcolor};return this.show&&(t.opacity=this.opacity,t["pointer-events"]="auto"),t}},mounted:function(){this.scrollView=(0,i.getScrollview)(this.$el)},beforeDestroy:function(){i.isIOS&&(0,i.removeClass)(this.scrollView,"g-fix-ios-overflow-scrolling-bug")}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-navbar-back-icon",props:{color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#5C5C5C"}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-navbar-next-icon",props:{color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#5C5C5C"}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-navbar",props:{title:String,fixed:Boolean,bgcolor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#FFF"},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#5C5C5C"},fontsize:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".4rem"},height:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:"1rem"}},computed:{classes:function(){return this.fixed?"yd-navbar-fixed":""}}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(6),a=i(o);e.default={name:"yd-popup",components:{"yd-mask":a.default},data:function(){return{show:this.value}},props:{position:{validator:function(t){return["bottom","center","left","right"].indexOf(t)>-1},default:"bottom"},height:{type:String,default:"auto"},width:{type:String,default:"auto"},value:{type:Boolean},closeOnMasker:{type:Boolean,default:!0},maskerOpacity:{validator:function(t){return/^([0]|[1-9]\d*)?(\.\d*)?$/.test(t)},default:.5}},watch:{value:function(t){t?r.preventScroll.lock():r.preventScroll.unlock(),this.show=t}},computed:{classes:function(){return("center"===this.position?"yd-popup-center ":"yd-popup yd-popup-"+this.position)+(this.show?" yd-popup-show ":"")},styles:function(){return"left"===this.position||"right"===this.position?{width:this.width}:"bottom"===this.position?{width:"100%",height:this.height}:{width:this.width,height:this.height}}},methods:{close:function(){this.closeOnMasker&&(this.show=!1,this.$emit("input",!1))}},beforeDestroy:function(){r.preventScroll.unlock()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-preview-header"}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-preview-item"}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-preview",props:{buttons:[Array]},methods:{clickHander:function(t){"function"==typeof t&&t()}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-progressbar",data:function(){return{viewBox:"0 0 100 100",show:!1,stroke:{dasharray:"",dashoffset:""}}},props:{type:{validator:function(t){return["circle","line"].indexOf(t)>-1},default:"circle"},fillColor:{validator:function(t){return!t||(0,i.isColor)(t)}},strokeWidth:{validator:function(t){return/^\d*$/.test(t)},default:0},strokeColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#E5E5E5"},trailWidth:{validator:function(t){return/^\d*$/.test(t)},default:0,required:!0},trailColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#646464"},progress:{validator:function(t){return/^(0(.\d+)?|1(\.0+)?)$/.test(t)},default:0}},methods:{init:function(){var t=this,e=this.length=this.$refs.trailPath.getTotalLength();this.stroke.dashoffset=e,this.stroke.dasharray=e+","+e,this.scrollview=(0,i.getScrollview)(this.$el),this.show=!0,"line"===this.type&&(this.viewBox="0 0 100 "+(this.strokeWidth?this.strokeWidth:this.trailWidth)),this.$nextTick(function(){t.scrollHandler()}),this.bindEvent()},scrollHandler:function(){(0,i.checkInview)(this.scrollview,this.$el)&&(this.stroke.dashoffset=this.length-this.progress*this.length)},bindEvent:function(){this.scrollview.addEventListener("scroll",this.scrollHandler),window.addEventListener("resize",this.scrollHandler)},unbindEvent:function(){this.scrollview.removeEventListener("scroll",this.scrollHandler),window.removeEventListener("resize",this.scrollHandler)}},watch:{progress:function(t){this.stroke.dashoffset=this.length-t*this.length}},computed:{getPathString:function(){if("line"===this.type)return"M 0,{R} L 100,{R}".replace(/\{R\}/g,this.trailWidth/2);var t=50-(this.strokeWidth?this.strokeWidth:this.trailWidth)/2;return"M 50,50 m 0,-{R} a {R},{R} 0 1 1 0,{2R} a {R},{R} 0 1 1 0,-{2R}".replace(/\{R\}/g,t).replace(/\{2R\}/g,2*t)}},mounted:function(){this.init()},destoryed:function(){this.unbindEvent()}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-pullrefresh",props:{onInfinite:{type:Function},callback:{type:Function},stopDrag:{type:Boolean,default:!1},pullText:{type:String,default:"下拉刷新"},dropText:{type:String,default:"松开加载"},loadingText:{type:String,default:"加载中..."},showInitTip:{type:Boolean,default:!0}},data:function(){return{showHelpTag:!1,dragTip:{statusText:this.pullText,animationTiming:"",translate:0,distance:36,iconRotate:0,loadingIcon:""},touches:{loading:!1,startClientY:0,moveOffset:0,isDraging:!1},limitSpeed:0,isDragToUp:!1}},methods:{init:function(){this.offsetTop=this.$refs.dragBox.getBoundingClientRect().top,this.bindEvents(),this.$on("ydui.pullrefresh.finishLoad",this.resetParams),this.showHelp()},showHelp:function(){var t=this;if(this.showInitTip){var e="PULLREFRESH-TIP",n=window.localStorage;1!=n.getItem(e)&&(this.showHelpTag=!0,setTimeout(function(){t.showHelpTag=!1},5e3)),n.setItem(e,1)}},bindEvents:function(){var t=this.$refs.dragBox;t.addEventListener("touchstart",this.touchStartHandler),t.addEventListener("touchmove",this.touchMoveHandler),t.addEventListener("touchend",this.touchEndHandler),document.body.addEventListener("touchmove",this.stopDragEvent,{passive:!1})},unbindEvents:function(){var t=this.$refs.dragBox;t.removeEventListener("touchstart",this.touchStartHandler),t.removeEventListener("touchmove",this.touchMoveHandler),t.removeEventListener("touchend",this.touchEndHandler),document.body.removeEventListener("touchmove",this.stopDragEvent,{passive:!1})},stopDragEvent:function(t){this.touches.isDraging&&t.preventDefault()},getScrollTop:function(t){return t===window?Math.max(window.pageYOffset||0,document.documentElement.scrollTop):t.scrollTop},touchStartHandler:function(t){if(!this.stopDrag)return this.touches.loading?void t.preventDefault():void(this.scrollview.scrollTop>0||this.$refs.dragBox.getBoundingClientRect().top<this.offsetTop||(this.touches.startClientX=t.touches[0].clientX,this.touches.startClientY=t.touches[0].clientY))},touchMoveHandler:function(t){var e=this.touches;if(!this.stopDrag&&!this.isDragToUp){if(this.touches.loading)return void t.preventDefault();if(this.scrollview.scrollTop>0)return this.dragTip.translate=0,void this.resetParams();var n=t.touches[0].clientY,i=t.touches[0].clientX;if(n-e.startClientY<0)return void(this.isDragToUp=!0);if(!(e.startClientY>n||this.$refs.dragBox.getBoundingClientRect().top<this.offsetTop)){0===this.getScrollTop(this.scrollview)&&t.preventDefault(),e.isDraging=!0;var r=180*Math.atan2(Math.abs(n-e.startClientY),Math.abs(i-e.startClientX))/Math.PI;if(!(90-r>45)){var o=n-e.startClientY;o>=this.dragTip.distance&&(this.dragTip.statusText=this.dropText,o=this.dragTip.distance),this.dragTip.iconRotate=o/.25,this.limitSpeed+=5,this.limitSpeed<o&&(o=this.limitSpeed),e.moveOffset=this.dragTip.translate=o}}}},touchEndHandler:function(t){if(!this.stopDrag){this.isDragToUp=!1;var e=this.touches;if(e.loading)return void t.preventDefault();if(!(this.$refs.dragBox.getBoundingClientRect().top<this.offsetTop))return this.dragTip.animationTiming="yd-pullrefresh-animation-timing",e.moveOffset>=this.dragTip.distance?(this.dragTip.statusText=this.loadingText,this.dragTip.loadingIcon="yd-pullrefresh-loading",void this.triggerLoad()):void this.resetParams()}},triggerLoad:function(){this.touches.loading=!0,this.callback&&this.callback()},resetParams:function(){var t=this;this.dragTip.translate=0,setTimeout(function(){var e=t.touches,n=t.dragTip;e.isDraging=!1,e.loading=!1,n.animationTiming="",e.moveOffset=0,n.translate=0,n.statusText=t.pullText,n.loadingIcon="",n.iconRotate=0,t.limitSpeed=0},200)}},mounted:function(){this.scrollview=(0,i.getScrollview)(this.$el),this.$nextTick(this.init)},beforeDestroy:function(){this.unbindEvents()}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-radio-group",data:function(){return{currentValue:this.value}},props:{value:{type:[String,Number],default:""},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#4CD864"},size:{validator:function(t){return/^([1-9]\d*)$/.test(t)},default:20}},methods:{updateValue:function(){var t=this.value;this.childrens=this.$children.filter(function(t){return"yd-radio"===t.$options.name}),this.childrens&&this.childrens.forEach(function(e){e.checked=t==e.val})},change:function(t){this.currentValue=t,this.updateValue(),this.$emit("input",t)}},watch:{value:function(){this.updateValue()}},mounted:function(){this.$nextTick(this.updateValue)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-radio",data:function(){return{checked:!1}},props:{val:[String,Number],disabled:{type:Boolean,default:!1}},methods:{changeHandler:function(t){this.disabled||(this.checked=t.target.checked,this.$parent.change(this.val))},styles:function(t){return{width:this.$parent.size/t+"px",height:this.$parent.size/t+"px"}}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-rate",data:function(){return{index:0,str:""}},watch:{value:function(t){this.choose(t)}},props:{count:{validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)},default:5},size:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".5rem"},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#CCC"},activeColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#FF5D50"},value:{validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)}},showText:{type:Array},readonly:{type:Boolean,default:!1},padding:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".06rem"}},methods:{choose:function(t){this.index=t,this.$emit("input",t),this.showText&&(this.str=(this.showText[t-1]||"").replace("$",t))}},mounted:function(){var t=this;this.$nextTick(function(){t.choose(t.value)})}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-rollnotice-item",mounted:function(){this.$parent.init()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-rollnotice",data:function(){return{timer:null,index:1,totalNum:0,firtstItem:"",lastItem:"",styles:{transform:0,transitionDuration:0}}},props:{height:{validator:function(t){return/^\d*$/.test(t)},default:30},speed:{validator:function(t){return/^\d*$/.test(t)},default:500},autoplay:{validator:function(t){return/^\d*$/.test(t)},default:3e3},align:{validator:function(t){return["left","center","right"].indexOf(t)>-1},default:"left"},direction:{validator:function(t){return["up","down"].indexOf(t)>-1},default:"up"}},methods:{init:function(){this.destroy(),this.items=this.$children.filter(function(t){return"yd-rollnotice-item"===t.$options.name}),this.totalNum=this.items.length,this.totalNum<=0||(this.firtstItem=this.items[0].$el.innerHTML,this.lastItem=this.items[this.totalNum-1].$el.innerHTML,this.setTranslate(0,-this.height),this.autoPlay())},autoPlay:function(){var t=this;this.timer=setInterval(function(){"up"===t.direction?(t.setTranslate(t.speed,-(++t.index*t.height)),t.index>=t.totalNum&&(t.index=0,setTimeout(function(){t.setTranslate(0,0)},t.speed))):(t.setTranslate(t.speed,-(--t.index*t.height)),t.index<=0&&(t.index=t.totalNum,setTimeout(function(){t.setTranslate(0,-t.totalNum*t.height)},t.speed)))},this.autoplay)},setTranslate:function(t,e){this.styles.transitionDuration=t+"ms",this.styles.transform="translate3d(0, "+e+"px, 0)"},destroy:function(){clearInterval(this.timer)}},beforeDestroy:function(){this.destroy()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-scrollnav-panel",props:{label:String},mounted:function(){this.$parent.addItem({label:this.label,_uid:this._uid})}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-scrollnav",data:function(){return{toggle:!1,activeIndex:this.index,navList:[],currentOffset:0,currentPosition:0,scrolling:!1}},props:{index:{validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)},default:0},height:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".9rem"},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#333"},currentColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#F00"},toggleText:{type:String,default:"切换分类"},bgcolor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#FFF"},borderColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#EFEFEF"},callback:{type:Function}},watch:{activeIndex:function(t){this.scrollNav(this.navList[t]._uid)},index:function(t){this.activeIndex=t,this.scrollContent(t)}},methods:{init:function(){this.scrollView=this.$refs.scrollView,this.contentOffsetTop=this.scrollView.getBoundingClientRect().top,this.bindEvent(),this.index>0&&(this.scrollNav(this.navList[this.index]._uid,!1),this.scrollContent(this.index,!1))},addItem:function(t){this.navList.push(t)},bindEvent:function(){this.scrollView.addEventListener("scroll",this.scrollHandler),window.addEventListener("resize",this.scrollHandler)},getPanels:function(){return this.$children.filter(function(t){return"yd-scrollnav-panel"===t.$options.name})},scrollHandler:function(){var t=this;if(!this.scrolling){var e=this.getPanels(),n=e.length,i=this.scrollView;return i.scrollTop>=e[0].$el.offsetHeight*n-i.offsetHeight?void(this.activeIndex=n-1):void e.forEach(function(e,n){e.$el.getBoundingClientRect().top<=i.offsetHeight/2+t.contentOffsetTop&&(t.activeIndex=n)})}},scrollNav:function(t){var e=this,n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1],i=~~this.$refs.nav.offsetWidth/2;this.navList.every(function(r,o){if(r._uid===t){var a=e.$refs["navitem_"+o][0],s=a.offsetLeft-i+a.offsetWidth/2;return e.scrollLeft(e.currentOffset,s,n,function(){e.callback&&e.callback(o)}),!1}return!0})},scrollContent:function(t){var e=this,n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];this.toggle=!1,this.activeIndex=t,this.scrolling=!0;var r=this.getPanels()[t].$el,o=n&&(window.navigator&&window.navigator.userAgent||"").indexOf("MicroMessenger")<0?500:0;(0,
i.scrollTop)(this.scrollView,this.currentPosition,r.offsetTop-this.$refs.navbox.offsetHeight,o,function(){e.scrolling=!1}),this.currentPosition=r.offsetTop-this.$refs.navbox.offsetHeight},scrollLeft:function(t,e,n,i){function r(t,e,n){if(t===e)return void(i&&i());var o=t+n>e?e:t+n;t>e&&(o=t-n<e?e:t-n),s.$refs.nav.scrollLeft=o,s.currentOffset=o,window.requestAnimationFrame(function(){return r(o,e,n)})}var o=Math.abs(t-e),a=n?Math.ceil(o/600*50):o,s=this;r(t,e,a)}},mounted:function(){this.$nextTick(this.init)},beforeDestroy:function(){this.scrollView.removeEventListener("scroll",this.scrollHandler),window.removeEventListener("resize",this.scrollHandler)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-scrolltab-panel",props:{label:String,icon:String,active:Boolean},mounted:function(){this.$parent.addItem({label:this.label,icon:this.icon,_uid:this._uid})}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-scrolltab",data:function(){return{scrolling:!1,navList:[],activeIndex:this.index,timer:null,navtop:0}},props:{index:{validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)},default:0},callback:{type:Function}},methods:{init:function(){this.scrollView=this.$refs.scrollView,this.contentOffsetTop=this.scrollView.getBoundingClientRect().top,this.bindEvent()},addItem:function(t){this.navList.push(t)},getPanels:function(){return this.$children.filter(function(t){return"yd-scrolltab-panel"===t.$options.name})},bindEvent:function(){this.scrollView.addEventListener("scroll",this.scrollHandler),window.addEventListener("resize",this.scrollHandler)},setDefault:function(){var t=this;this.getPanels().every(function(e,n){return t.activeIndex!==n||(t.moveHandler(n),!1)})},moveHandler:function(t){this.activeIndex=t,this.scrollContent(t)},scrollContent:function(t){var e=this;if(!this.scrolling){this.scrolling=!0;var n=this.getPanels()[t].$el.getBoundingClientRect().top;this.scrollView.scrollTop=n+this.scrollView.scrollTop-this.contentOffsetTop+2,setTimeout(function(){e.scrolling=!1},10)}},navInView:function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:0,e=this.$refs["tabitem_"+t][0],n=~~e.offsetHeight;e.offsetTop-n<=this.navtop?this.navtop-=n:e.offsetTop+3*n>=this.scrollView.offsetHeight&&(this.navtop+=n),this.$refs.navbox.scrollTop=this.navtop},scrollHandler:function(){var t=this;if(!this.scrolling){var e=this.getPanels(),n=e.length,i=this.scrollView,r=i.offsetHeight,o=i.scrollTop,a=e[0].$el.offsetHeight;return o>=a*n-r?void(this.activeIndex=n-1):void e.forEach(function(e,n){e.$el.getBoundingClientRect().top<=t.contentOffsetTop&&(t.activeIndex=n)})}}},watch:{navList:function(){this.setDefault()},activeIndex:function(t){this.navInView(t),this.callback&&this.callback(t)},index:function(t){this.scrollContent(t),this.activeIndex=t}},mounted:function(){this.init()},beforeDestroy:function(){this.scrollView.removeEventListener("scroll",this.scrollHandler),window.removeEventListener("resize",this.scrollHandler)}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(4),o=n(8),a=i(o);e.default={name:"yd-search",extends:a.default,components:{"yd-search-input":a.default},data:function(){return{show:!1,currentValue:this.value}},props:{placeholder:{type:String,default:"搜 索"},cancelText:{type:String,default:"取消"},result:{type:Array,default:function(){return[]}},itemClick:{type:Function},value:{type:String,default:""},fullpage:{type:Boolean,default:!1},top:{validator:function(t){return/^-?(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:"-1px"},onSubmit:{type:Function},onCancel:{type:Function}},watch:{currentValue:function(t){this.$emit("input",t)},value:function(t){this.currentValue=t},show:function(t){t?(this.$refs.search.setFocus(),r.isIOS&&(0,r.addClass)(this.scrollView,"g-fix-ios-overflow-scrolling-bug")):(this.$refs.search.setBlur(),r.isIOS&&(0,r.removeClass)(this.scrollView,"g-fix-ios-overflow-scrolling-bug"))}},methods:{open:function(){this.fullpage&&(this.show=!0,this.$refs.search.setFocus())},close:function(t){this.show=!1,t||this.onCancel&&this.onCancel()},submit:function(){this.$refs.search.setBlur(),this.onSubmit&&this.onSubmit(this.currentValue),this.close(!0)},clickHandler:function(t){this.currentValue=t.label?t.label:t,this.itemClick&&this.itemClick(t),this.close(!0)}},destroyed:function(){r.isIOS&&(0,r.removeClass)(this.scrollView,"g-fix-ios-overflow-scrolling-bug")},mounted:function(){this.scrollView=(0,r.getScrollview)(this.$el)}}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(7),o=i(r);e.default={name:"yd-sendcode",extends:o.default,components:{"yd-sendcode-button":o.default},data:function(){return{tmpStr:this.initStr,timer:null,start:!1,runSecond:this.second,lastSecond:0}},props:{initStr:{type:String,default:"获取短信验证码"},second:{default:60,validator:function(t){return/^\d*$/.test(t)}},runStr:{type:String,default:"{%s}秒后重新获取"},resetStr:{type:String,default:"重新获取验证码"},value:{type:Boolean,default:!1},storageKey:{type:String}},methods:{run:function(){var t=this,e=this.lastSecond,n=e?e:this.runSecond;if(this.storageKey){var i=(new Date).getTime()+1e3*n;window.sessionStorage.setItem(this.storageKey,i)}e||(this.tmpStr=this.getStr(n)),this.timer=setInterval(function(){n--,t.tmpStr=t.getStr(n),n<=0&&t.timeout()},1e3)},timeout:function(){this.tmpStr=this.resetStr,this.start=!1,this.$emit("input",!1),clearInterval(this.timer)},getStr:function(t){return this.runStr.replace(/\{([^{]*?)%s(.*?)\}/g,t)}},watch:{value:function(t){this.start=t,t?this.run():(clearInterval(this.timer),this.tmpStr=this.initStr,this.storageKey&&(window.sessionStorage.removeItem(this.storageKey),this.lastSecond=0))}},created:function(){var t=~~((window.sessionStorage.getItem(this.storageKey)-(new Date).getTime())/1e3);t>0&&this.storageKey&&(this.$emit("input",!0),this.tmpStr=this.getStr(t),this.lastSecond=t)},beforeDestroy:function(){!this.storageKey&&this.timeout()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-slider-item",mounted:function(){this.$nextTick(this.$parent.init)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-slider",data:function(){return{firstItem:"",lastItem:"",currentIndex:0,itemNums:0,itemsArr:[],autoPlayTimer:null,paginationIndex:0,itemHeight:{height:null},dragStyleObject:{transform:0,speed:0},touches:{moveTag:0,moveOffset:0,touchStartTime:0,isTouchEvent:!1,allowClick:!1,isDraging:!1}}},props:{index:{default:0,validator:function(t){return/^\d*$/.test(t)}},speed:{default:300,validator:function(t){return/^\d*$/.test(t)}},autoplay:{default:0,validator:function(t){return/^\d*$/.test(t)}},direction:{validator:function(t){return["horizontal","vertical"].indexOf(t)>-1},default:"horizontal"},showPagination:{type:Boolean,default:!0},callback:{type:Function},loop:{type:Boolean,default:!0}},watch:{index:function(t){t=~~t,t>this.itemNums&&(t=this.itemNums),this.currentIndex=this.loop?t+1:t,this.showItem(this.currentIndex)},currentIndex:function(t){var e=this.itemNums,n=(t-1)%e;this.loop?this.paginationIndex=n<0?e-1:n:this.paginationIndex=t}},methods:{init:function(){this.destroy(),this.isVertical="vertical"===this.direction,this.itemsArr=this.$children.filter(function(t){return"yd-slider-item"===t.$options.name}),this.itemNums=this.itemsArr.length,this.loop?(this.currentIndex=1,this.index>0&&(this.currentIndex=~~this.index+1)):(this.currentIndex=0,this.index>0&&(this.currentIndex=~~this.index)),this.cloneItem(),this.showItem(this.currentIndex),this.bindEvents(),this.autoPlay()},showItem:function(t){if(this.isVertical){this.$refs.slider.style.height="100%";var e=this.$el.clientHeight;this.itemHeight.height=e+"px",this.setTranslate(0,-e*t),this.itemsArr.forEach(function(t){t.$el.style.height=e+"px"})}else this.setTranslate(0,-this.$refs.warpper.offsetWidth*t)},cloneItem:function(){if(!(this.itemsArr.length<=1)&&this.loop){var t=this.itemsArr;this.firstItem=t[0].$el.innerHTML,this.lastItem=t[t.length-1].$el.innerHTML}},touchStartHandler:function(t){var e=this.touches;if(e.allowClick=!0,e.isTouchEvent="touchstart"===t.type,(e.isTouchEvent||!("which"in t)||3!==t.which)&&0===e.moveTag){e.moveTag=1,e.startX=t.touches?t.touches[0].clientX:t.clientX,e.startY=t.touches?t.touches[0].clientY:t.clientY,e.touchStartTime=Date.now();var n=this.itemNums;if(this.loop){if(0===this.currentIndex)return this.currentIndex=n,void this.setTranslate(0,-n*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));this.currentIndex>n&&(this.currentIndex=1,this.setTranslate(0,this.isVertical?-this.$el.clientHeight:-this.$refs.warpper.offsetWidth))}else{if(this.currentIndex===-1)return this.currentIndex=n-1,void this.setTranslate(0,-(n-1)*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));this.currentIndex>n-1&&(this.currentIndex=1,this.setTranslate(0,this.isVertical?-this.$el.clientHeight:-this.$refs.warpper.offsetWidth))}}},touchMoveHandler:function(t){this.supportTouch&&!this.isVertical||t.preventDefault();var e=this.touches;if(e.allowClick=!1,!e.isTouchEvent||"mousemove"!==t.type){var n=t.touches?t.touches[0].clientY:t.clientY,i=t.touches?t.touches[0].clientX:t.clientX,r=180*Math.atan2(Math.abs(n-e.startY),Math.abs(i-e.startX))/Math.PI;if((this.isVertical?90-r>45:r>45)&&this.supportTouch)return e.moveTag=3,this.stopAutoplay(),void this.setTranslate(0,-this.currentIndex*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth));e.isDraging=!0;var o=e.moveOffset=this.isVertical?n-e.startY:i-e.startX;0!==o&&0!==e.moveTag&&(1===e.moveTag&&(this.stopAutoplay(),e.moveTag=2),2===e.moveTag&&this.setTranslate(0,-this.currentIndex*(this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth)+o/2))}},touchEndHandler:function(){var t=this.touches,e=t.moveOffset,n=this.isVertical?this.$el.clientHeight:this.$refs.warpper.offsetWidth;if(1===t.moveTag&&(t.moveTag=0),setTimeout(function(){t.allowClick=!0,t.isDraging=!1},this.speed),2===t.moveTag){t.moveTag=0;var i=Date.now()-t.touchStartTime,r=!this.loop&&(0===this.currentIndex&&e>0||this.currentIndex>=this.itemNums-1&&e<0);return i>300&&Math.abs(e)<=.5*n||this.itemsArr.length<=1||r?this.setTranslate(this.speed,-this.currentIndex*n):(this.setTranslate(this.speed,-((e>0?--this.currentIndex:++this.currentIndex)*n)),this.sendIndex()),void this.autoPlay()}3===t.moveTag&&(t.moveTag=0,this.autoPlay())},autoPlay:function(){var t=this;this.autoplay<=0||this.itemsArr.length<=1||(this.autoPlayTimer=setInterval(function(){var e=t.isVertical?t.$el.clientHeight:t.$refs.warpper.offsetWidth;return t.loop||t.currentIndex+1>=t.itemNums&&(t.currentIndex=-1),t.currentIndex>t.itemNums?(t.currentIndex=1,t.setTranslate(0,-e),setTimeout(function(){t.setTranslate(t.speed,-(++t.currentIndex*e))},100),void(t.callback&&t.callback(t.currentIndex))):(t.setTranslate(t.speed,-(++t.currentIndex*e)),void t.sendIndex())},this.autoplay))},sendIndex:function(){if(this.loop){var t=this.currentIndex%this.itemNums;this.callback&&this.callback(0===t?this.itemNums-1:t-1)}else this.callback&&this.callback(this.currentIndex)},stopAutoplay:function(){clearInterval(this.autoPlayTimer)},stopDrag:function(t){this.touches.isDraging&&t.preventDefault()},bindEvents:function(){var t=this;this.$el.addEventListener("touchstart",this.touchStartHandler),this.$el.addEventListener("touchmove",this.touchMoveHandler),this.$el.addEventListener("touchend",this.touchEndHandler),this.$el.addEventListener("click",function(e){t.touches.allowClick||e.preventDefault()}),window.addEventListener("resize",this.resizeSlides),document.body.addEventListener("touchmove",this.stopDrag,{passive:!1})},unbindEvents:function(){this.$el.removeEventListener("touchstart",this.touchStartHandler),this.$el.removeEventListener("touchmove",this.touchMoveHandler),this.$el.removeEventListener("touchend",this.touchEndHandler),window.removeEventListener("resize",this.resizeSlides),document.body.removeEventListener("touchmove",this.stopDrag,{passive:!1})},setTranslate:function(t,e){this.dragStyleObject.transitionDuration=t+"ms",this.isVertical?this.dragStyleObject.transform="translate3d(0, "+e+"px, 0)":this.dragStyleObject.transform="translate3d("+e+"px, 0, 0)"},resizeSlides:function(){if(this.isVertical){var t=this.$el.clientHeight;this.dragStyleObject.transform="translate3d(0, "+-this.currentIndex*t+"px, 0)"}else{var e=this.$refs.warpper.offsetWidth;this.dragStyleObject.transform="translate3d("+-this.currentIndex*e+"px, 0, 0)"}},destroy:function(){this.unbindEvents(),this.stopAutoplay()}},mounted:function(){this.supportTouch=window.Modernizr&&!!window.Modernizr.touch||function(){return!!("ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch)}()},beforeDestroy:function(){this.destroy()}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-spinner",data:function(){return{counter:0,tapParams:{timer:null,tapStartTime:0},parms:{max:0,min:-1}}},watch:{value:function(){this.setDefalutValue()}},props:{unit:{default:1,validator:function(t){return/^([1-9]\d*)$/.test(t)}},max:{default:0,validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)}},min:{default:-1,validator:function(t){return/^((-?([1-9]\d*))|0)$/.test(t)}},longpress:{type:Boolean,default:!0},readonly:{type:Boolean,default:!1},value:{validator:function(t){return/^(([1-9]\d*)|0)$/.test(t)}},width:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:"2rem"},height:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".6rem"}},methods:{init:function(){this.checkParameters()&&(this.setDefalutValue(),this.bindEvents())},checkParameters:function(){var t=~~this.max,e=~~this.unit,n=~~this.min;return t<e&&0!=t?(console.error("[YDUI warn]: The parameter 'max'("+t+") must be greater than or equal to 'unit'("+e+")."),!1):t%e!=0?(console.error("[YDUI warn]: The parameter 'max'("+t+") and 'unit'("+e+") must be multiple."),!1):n%e!=0&&n>=0?(console.error("[YDUI warn]: The parameter 'min'("+n+") and 'unit'("+e+") must be multiple."),!1):!(t<n&&0!=t)||(console.error("[YDUI warn]: The parameter 'max'("+t+") must be greater than to 'min'("+n+")."),!1)},setDefalutValue:function(){var t=~~this.unit,e=~~this.min,n=~~this.value;return~~n>0?void this.setValue(n):void this.setValue(e<0?t:e)},calculation:function(t){var e=~~this.max,n=~~this.min<0?~~this.unit:~~this.min,i=~~this.unit;if(!this.readonly){var r=~~this.counter,o=void 0;if("add"==t){if(o=r+i,0!=e&&o>e)return}else if(o=r-i,o<n)return;this.setValue(o),this.longpress&&this.longpressHandler(t)}},setValue:function(t){var e=~~this.max,n=~~this.min<0?~~this.unit:~~this.min,i=~~this.unit;/^(([1-9]\d*)|0)$/.test(t)||(t=i),t>e&&0!=e&&(t=e),t%i>0&&(t=t-t%i+i,t>e&&0!=e&&(t-=i)),t<n&&(t=n-n%i),this.counter=t,this.$emit("input",t)},longpressHandler:function(t){var e=this,n=(new Date).getTime()/1e3,i=n-this.tapParams.tapStartTime;i<1&&(i=.5);var r=10*i;30==i&&(r=50),i>=40&&(r=100),this.tapParams.timer=setTimeout(function(){e.calculation(t)},1e3/r)},clearTapTimer:function(){clearTimeout(this.tapParams.timer)},bindEvents:function(){var t=this,e=this.$refs.add,n=this.$refs.minus,i={mousedownEvent:"touchstart",mouseupEvent:"touchend"},r=window.Modernizr&&!!window.Modernizr.touch||function(){return!!("ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch)}();r||(i.mousedownEvent="mousedown",i.mouseupEvent="mouseup"),e.addEventListener(i.mousedownEvent,function(n){t.longpress&&(n.preventDefault(),n.stopPropagation(),t.tapParams.tapStartTime=(new Date).getTime()/1e3,e.addEventListener(i.mouseupEvent,t.clearTapTimer)),t.calculation("add")}),n.addEventListener(i.mousedownEvent,function(e){t.longpress&&(e.preventDefault(),e.stopPropagation(),t.tapParams.tapStartTime=(new Date).getTime()/1e3,n.addEventListener(i.mouseupEvent,t.clearTapTimer)),t.calculation("minus")}),this.$refs.numInput.addEventListener("change",function(){t.setValue(~~t.counter)})}},mounted:function(){this.$nextTick(this.init)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-step-item",data:function(){return{stepNumber:"",current:"",theme:"",currentClass:""}},methods:{setCurrentClass:function(){return 2==this.theme?void(this.currentClass=this.stepNumber==this.current?"yd-step-item-current":""):void(this.currentClass=this.stepNumber<=this.current?"yd-step-item-current":"")}},mounted:function(){this.$nextTick(this.$parent.updateChildStatus)}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-step",data:function(){return{hasTop:!1,hasBottom:!1}},props:{theme:{validator:function(t){return["1","2"].indexOf(t)>-1},default:"1"},current:{validator:function(t){return/^\d*$/.test(t)},default:0},currentColor:{validator:function(t){return(0,i.isColor)(t)},default:"#0DB78A"}},methods:{updateChildStatus:function(t){var e=this,n=this.$children.filter(function(t){return"yd-step-item"===t.$options.name});n.forEach(function(i,r){i.stepNumber=r+1,r+1===n.length&&e.current>=i.stepNumber?i.current=i.stepNumber:i.current=e.current,i.theme=e.theme,i.$slots.bottom&&(e.hasBottom=!0),i.$slots.top&&(e.hasTop=!0),i.loaded&&!t||(i.setCurrentClass(),i.loaded=!0)})}},watch:{current:function(){var t=this;this.$nextTick(function(){t.updateChildStatus(!0)})}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-switch",data:function(){return{checked:this.value}},props:{value:[String,Number,Boolean],disabled:{type:Boolean,default:!1},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#4CD864"},trueValue:{type:[String,Number,Boolean],default:!0},falseValue:{type:[String,Number,Boolean],default:!1}},watch:{checked:function(t){this.$emit("input",t)},value:function(t){this.checked=t}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-tab-panel",data:function(){return{isCurrent:!1}},props:{label:String,active:Boolean,tabkey:[String,Number]},computed:{classes:function(){return this.$parent.activeIndex===this._uid||this.isCurrent?"yd-tab-active":""}},watch:{active:function(){this.$parent.init()},label:function(){this.$parent.init()}},mounted:function(){var t=this;this.$nextTick(function(){t.$parent.init()})}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-tab",data:function(){return{navList:[],activeIndex:this.value||0,currentIndex:0,width:"auto"}},props:{value:Number,change:Function,callback:Function,itemClick:Function,preventDefault:{type:Boolean,default:!0},activeColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#FF5E53"},horizontalScroll:{type:Boolean,default:!1}},watch:{value:function(t){var e=this,n=this.$children.filter(function(t){return"yd-tab-panel"===t.$options.name});t>=n.length-1&&(t=n.length-1),t<0&&(t=0),this.activeIndex=this.currentIndex=t>n.length-1?n.length-1:t;var i="";n.forEach(function(n,r){t===r?(e.$set(n,"isCurrent",!0),i=n.label,n.tabkey&&(t=n.tabkey)):e.$set(n,"isCurrent",!1)}),this.callback&&this.callback(i,t)}},methods:{init:function(){var t=this,e=this.$children.filter(function(t){return"yd-tab-panel"===t.$options.name});if(this.navList=[],e.forEach(function(n,i){t.navList.push({_uid:n._uid,label:n.label,tabkey:n.tabkey}),n.active||t.activeIndex===i?t.activeIndex=t.currentIndex=n._uid:i>=e.length&&(t.activeIndex=t.currentIndex=e[0]._uid)}),this.horizontalScroll){var n=1;this.$nextTick(function(){var e=t.getChildNodes(t.$refs.navbox);e.forEach(function(t){n+=t.offsetWidth}),t.width=n+"px"})}},getChildNodes:function(t){if(!t)return[];for(var e=t.children||t.childNodes,n=[],i=0,r=e.length;i<r;i++)1===e[i].nodeType&&n.push(e[i]);return n},changeHandler:function(t,e){return this.preventDefault?void(this.currentIndex!==e&&(this.activeIndex=this.currentIndex=e,this.$emit("input",t))):void(this.itemClick&&this.itemClick(t))}}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-tabbar-item",data:function(){return{isCurrent:!1}},props:{type:{validator:function(t){return["link","a"].indexOf(t)>-1},default:"link"},tag:String,link:[String,Object],title:String,active:Boolean,dot:Boolean},computed:{classes:function(){return this.active||this.isCurrent?"yd-tabbar-active":""},styles:function(){return this.active||this.isCurrent?{}:{color:this.$parent.color}}}}},function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=n(4);e.default={name:"yd-tabbar",data:function(){return{activeIndex:this.value}},props:{value:Number,fixed:Boolean,exact:{type:Boolean,default:!0},activeClass:{type:String,default:"router-link-active"},activeColor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#09BB07"},bgcolor:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#FFF"},color:{validator:function(t){return!t||(0,i.isColor)(t)},default:"#979797"},fontsize:{validator:function(t){return/^(\.|\d+\.)?\d+(px|rem)$/.test(t)},default:".24rem"}},computed:{classes:function(){return this.fixed?"yd-tabbar-fixed":""},styles:function(){return{color:this.activeColor,backgroundColor:this.bgcolor,fontSize:this.fontsize}}},methods:{setCurrent:function(t){var e=this,n=this.$children.filter(function(t){return"yd-tabbar-item"===t.$options.name});n.forEach(function(n,i){e.$set(n,"isCurrent",t===i)})}},watch:{value:function(t){this.setCurrent(t)}},mounted:function(){this.setCurrent(this.activeIndex)}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-textarea",data:function(){return{num:0,mlstr:""}},props:{maxlength:{validator:function(t){return!t||/^(([1-9]\d*)|0)$/.test(t)}},placeholder:{type:String},readonly:{type:Boolean,default:!1},value:{type:String},showCounter:{type:Boolean,default:!0},change:{type:Function},callback:{type:Function}},watch:{mlstr:function(t){this.$emit("input",t),this.callback&&this.change(),this.showCounter&&(this.num=t.length)},value:function(t){this.mlstr=t}},mounted:function(){var t=this;this.$nextTick(function(){var e=t.value;e&&(t.mlstr=e.length>t.maxlength?e.substr(e,t.maxlength):e)})}}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-timeline-item"}},function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.default={name:"yd-timeline"}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.AccordionItem=e.Accordion=void 0;var r=n(57),o=i(r),a=n(56),s=i(a);e.Accordion=o.default,e.AccordionItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ActionSheet=void 0;var r=n(58),o=i(r);e.ActionSheet=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.BackTop=void 0;var r=n(59),o=i(r);e.BackTop=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Badge=void 0;var r=n(60),o=i(r);e.Badge=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ButtonGroup=e.Button=void 0;var r=n(7),o=i(r),a=n(61),s=i(a);e.Button=o.default,e.ButtonGroup=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CellGroup=e.CellItem=void 0;var r=n(63),o=i(r),a=n(62),s=i(a);e.CellItem=o.default,e.CellGroup=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CheckBoxGroup=e.CheckBox=void 0;var r=n(65),o=i(r),a=n(64),s=i(a);e.CheckBox=o.default,e.CheckBoxGroup=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CheckListItem=e.CheckList=void 0;var r=n(67),o=i(r),a=n(66),s=i(a);e.CheckList=o.default,e.CheckListItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CitySelect=void 0;var r=n(68),o=i(r);e.CitySelect=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CountDown=void 0;var r=n(69),o=i(r);e.CountDown=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.CountUp=void 0;var r=n(70),o=i(r);e.CountUp=o.default},function(t,e,n){var i,r,o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};!function(o,a){i=a,r="function"==typeof i?i.call(e,n,e,t):i,!(void 0!==r&&(t.exports=r))}(void 0,function(t,e,n){var i=function(t,e,n,i,r,a){for(var s=0,l=["webkit","moz","ms","o"],c=0;c<l.length&&!window.requestAnimationFrame;++c)window.requestAnimationFrame=window[l[c]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[l[c]+"CancelAnimationFrame"]||window[l[c]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(t,e){var n=(new Date).getTime(),i=Math.max(0,16-(n-s)),r=window.setTimeout(function(){t(n+i)},i);return s=n+i,r}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(t){clearTimeout(t)});var u=this;if(u.options={useEasing:!0,useGrouping:!0,separator:",",decimal:".",easingFn:null,formattingFn:null,prefix:"",suffix:""},a&&"object"===("undefined"==typeof a?"undefined":o(a)))for(var d in u.options)a.hasOwnProperty(d)&&(u.options[d]=a[d]);""===u.options.separator&&(u.options.useGrouping=!1),u.version=function(){return"1.8.2"},u.d="string"==typeof t?document.getElementById(t):t,u.startVal=Number(e),u.endVal=Number(n),u.countDown=u.startVal>u.endVal,u.frameVal=u.startVal,u.decimals=Math.max(0,i||0),u.dec=Math.pow(10,u.decimals),u.duration=1e3*Number(r)||2e3,u.formatNumber=function(t){t=t.toFixed(u.decimals),t+="";var e,n,i,r;if(e=t.split("."),n=e[0],i=e.length>1?u.options.decimal+e[1]:"",r=/(\d+)(\d{3})/,u.options.useGrouping)for(;r.test(n);)n=n.replace(r,"$1"+u.options.separator+"$2");return u.options.prefix+n+i+u.options.suffix},u.easeOutExpo=function(t,e,n,i){return n*(-Math.pow(2,-10*t/i)+1)*1024/1023+e},u.easingFn=u.options.easingFn?u.options.easingFn:u.easeOutExpo,u.formattingFn=u.options.formattingFn?u.options.formattingFn:u.formatNumber,u.printValue=function(t){var e=u.formattingFn(t);"INPUT"===u.d.tagName?this.d.value=e:"text"===u.d.tagName||"tspan"===u.d.tagName?this.d.textContent=e:this.d.innerHTML=e},u.count=function(t){u.startTime||(u.startTime=t),u.timestamp=t;var e=t-u.startTime;u.remaining=u.duration-e,u.options.useEasing?u.countDown?u.frameVal=u.startVal-u.easingFn(e,0,u.startVal-u.endVal,u.duration):u.frameVal=u.easingFn(e,u.startVal,u.endVal-u.startVal,u.duration):u.countDown?u.frameVal=u.startVal-(u.startVal-u.endVal)*(e/u.duration):u.frameVal=u.startVal+(u.endVal-u.startVal)*(e/u.duration),u.countDown?u.frameVal=u.frameVal<u.endVal?u.endVal:u.frameVal:u.frameVal=u.frameVal>u.endVal?u.endVal:u.frameVal,u.frameVal=Math.round(u.frameVal*u.dec)/u.dec,u.printValue(u.frameVal),e<u.duration?u.rAF=requestAnimationFrame(u.count):u.callback&&u.callback()},u.start=function(t){return u.callback=t,u.rAF=requestAnimationFrame(u.count),!1},u.pauseResume=function(){u.paused?(u.paused=!1,delete u.startTime,u.duration=u.remaining,u.startVal=u.frameVal,requestAnimationFrame(u.count)):(u.paused=!0,cancelAnimationFrame(u.rAF))},u.reset=function(){u.paused=!1,delete u.startTime,u.startVal=e,cancelAnimationFrame(u.rAF),u.printValue(u.startVal)},u.update=function(t){cancelAnimationFrame(u.rAF),u.paused=!1,delete u.startTime,u.startVal=u.frameVal,u.endVal=Number(t),u.countDown=u.startVal>u.endVal,u.rAF=requestAnimationFrame(u.count)},u.printValue(u.startVal)};return i})},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.DateTime=void 0;var r=n(71),o=i(r);e.DateTime=o.default},function(t,e){"use strict";var n=Date.now||function(){return+new Date},i={},r=1,o=60,a=1e3;t.exports={requestAnimationFrame:function(){var t=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame,e=!!t;if(t&&!/requestAnimationFrame\(\)\s*\{\s*\[native code\]\s*\}/i.test(t.toString())&&(e=!1),e)return function(e,n){t(e,n)};var n=60,i={},r=0,o=1,a=null,s=+new Date;return function(t,e){var l=o++;return i[l]=t,r++,null===a&&(a=setInterval(function(){var t=+new Date,e=i;i={},r=0;for(var n in e)e.hasOwnProperty(n)&&(e[n](t),s=t);t-s>2500&&(clearInterval(a),a=null)},1e3/n)),l}}(),stop:function(t){var e=null!=i[t];return e&&(i[t]=null),e},isRunning:function(t){return null!=i[t]},start:function t(e,s,l,c,u,d){var f=this,t=n(),h=t,p=0,m=0,A=r++;if(d||(d=document.body),A%20===0){var v={};for(var g in i)v[g]=!0;i=v}var _=function r(v){var g=v!==!0,_=n();if(!i[A]||s&&!s(A))return i[A]=null,void(l&&l(o-m/((_-t)/a),A,!1));if(g)for(var y=Math.round((_-h)/(a/o))-1,b=0;b<Math.min(y,4);b++)r(!0),m++;c&&(p=(_-t)/c,p>1&&(p=1));var x=u?u(p):p;e(x,_,g)!==!1&&1!==p||!g?g&&(h=_,f.requestAnimationFrame(r,d)):(i[A]=null,l&&l(o-m/((_-t)/a),A,1===p||null==c))};return i[A]=!0,f.requestAnimationFrame(_,d),A}}},function(t,e,n){"use strict";var i=n(285),r=function(t,e,n){var i=this;if(t){n=n||{},i.options={onSelect:function(){},itemHeight:38};for(var r in n)void 0!==n[r]&&(i.options[r]=n[r]);i.__content=e,i.__component=t,i.__itemHeight=i.options.itemHeight;var o=window.Modernizr&&!!window.Modernizr.touch||function(){return!!("ontouchstart"in window||window.DocumentTouch&&document instanceof DocumentTouch)}(),a={start:o?"touchstart":"mousedown",move:o?"touchmove":"mousemove",end:o?"touchend":"mouseup"};t.addEventListener(a.start,function(t){t.target.tagName.match(/input|textarea|select/i)||(t.preventDefault(),i.__doTouchStart(t,t.timeStamp))},!1),t.addEventListener(a.move,function(t){i.__doTouchMove(t,t.timeStamp)},!1),t.addEventListener(a.end,function(t){i.__doTouchEnd(t.timeStamp)},!1)}},o={value:null,__prevValue:null,__isSingleTouch:!1,__isTracking:!1,__didDecelerationComplete:!1,__isGesturing:!1,__isDragging:!1,__isDecelerating:!1,__isAnimating:!1,__clientTop:0,__clientHeight:0,__contentHeight:0,__itemHeight:0,__scrollTop:0,__minScrollTop:0,__maxScrollTop:0,__scheduledTop:0,__lastTouchTop:null,__lastTouchMove:null,__positions:null,__minDecelerationScrollTop:null,__maxDecelerationScrollTop:null,__decelerationVelocityY:null,setDimensions:function(t,e,n){var i=this;i.__clientHeight=t,i.__contentHeight=e;var r=Math.round(i.__clientHeight/i.__itemHeight);i.__minScrollTop=-i.__itemHeight*(r/2),i.__maxScrollTop=i.__minScrollTop+n*i.__itemHeight-.1},selectByIndex:function(t,e){var n=this;t<0||t>n.__content.childElementCount-1||(n.__scrollTop=n.__minScrollTop+t*n.__itemHeight,n.scrollTo(n.__scrollTop,e),n.__selectItem(n.__content.children[t]))},select:function(t,e){for(var n=this,i=n.__content.children,r=0,o=i.length;r<o;r++)if(i[r].dataset.value==t)return void n.selectByIndex(r,e);n.selectByIndex(0,e)},scrollTo:function(t,e){var n=this;return e=void 0===e||e,n.__isDecelerating&&(i.stop(n.__isDecelerating),n.__isDecelerating=!1),t=Math.round(t/n.__itemHeight)*n.__itemHeight,t=Math.max(Math.min(n.__maxScrollTop,t),n.__minScrollTop),t!==n.__scrollTop&&e?void n.__publish(t,250):(n.__publish(t),void n.__scrollingComplete())},__selectItem:function(t){
var e=this;null!==e.value&&(e.__prevValue=e.value),e.value=t.dataset.value},__scrollingComplete:function(){var t=this,e=Math.round((t.__scrollTop-t.__minScrollTop-t.__itemHeight/2)/t.__itemHeight);t.__selectItem(t.__content.children[e]),null!==t.__prevValue&&t.__prevValue!==t.value&&t.options.onSelect(t.value)},__doTouchStart:function(t,e){var n=t.touches,r=this,o=t.touches?t.touches[0]:t,a=!!t.touches;if(t.touches&&null==n.length)throw new Error("Invalid touch list: "+n);if(e instanceof Date&&(e=e.valueOf()),"number"!=typeof e)throw new Error("Invalid timestamp value: "+e);r.__interruptedAnimation=!0,r.__isDecelerating&&(i.stop(r.__isDecelerating),r.__isDecelerating=!1,r.__interruptedAnimation=!0),r.__isAnimating&&(i.stop(r.__isAnimating),r.__isAnimating=!1,r.__interruptedAnimation=!0);var s,l=a&&1===n.length||!a;s=l?o.pageY:Math.abs(o.pageY+n[1].pageY)/2,r.__initialTouchTop=s,r.__lastTouchTop=s,r.__lastTouchMove=e,r.__lastScale=1,r.__enableScrollY=!l,r.__isTracking=!0,r.__didDecelerationComplete=!1,r.__isDragging=!l,r.__isSingleTouch=l,r.__positions=[]},__doTouchMove:function(t,e,n){var i=this,r=t.touches,o=t.touches?t.touches[0]:t,a=!!t.touches;if(r&&null==r.length)throw new Error("Invalid touch list: "+r);if(e instanceof Date&&(e=e.valueOf()),"number"!=typeof e)throw new Error("Invalid timestamp value: "+e);if(i.__isTracking){var s;s=a&&2===r.length?Math.abs(o.pageY+r[1].pageY)/2:o.pageY;var l=i.__positions;if(i.__isDragging){var c=s-i.__lastTouchTop,u=i.__scrollTop;if(i.__enableScrollY){u-=c;var d=i.__minScrollTop,f=i.__maxScrollTop;(u>f||u<d)&&(u=u>f?f:d)}l.length>40&&l.splice(0,20),l.push(u,e),i.__publish(u)}else{var h=0,p=5,m=Math.abs(s-i.__initialTouchTop);i.__enableScrollY=m>=h,l.push(i.__scrollTop,e),i.__isDragging=i.__enableScrollY&&m>=p,i.__isDragging&&(i.__interruptedAnimation=!1)}i.__lastTouchTop=s,i.__lastTouchMove=e,i.__lastScale=n}},__doTouchEnd:function(t){var e=this;if(t instanceof Date&&(t=t.valueOf()),"number"!=typeof t)throw new Error("Invalid timestamp value: "+t);if(e.__isTracking){if(e.__isTracking=!1,e.__isDragging&&(e.__isDragging=!1,e.__isSingleTouch&&t-e.__lastTouchMove<=100)){for(var n=e.__positions,i=n.length-1,r=i,o=i;o>0&&n[o]>e.__lastTouchMove-100;o-=2)r=o;if(r!==i){var a=n[i]-n[r],s=e.__scrollTop-n[r-1];e.__decelerationVelocityY=s/a*(1e3/60);var l=4;Math.abs(e.__decelerationVelocityY)>l&&e.__startDeceleration(t)}}e.__isDecelerating||e.scrollTo(e.__scrollTop),e.__positions.length=0}},__easeOutCubic:function(t){return Math.pow(t-1,3)+1},__easeInOutCubic:function(t){return(t/=.5)<1?.5*Math.pow(t,3):.5*(Math.pow(t-2,3)+2)},__publish:function(t,e){var n=this,r=n.__isAnimating;if(r&&(i.stop(r),n.__isAnimating=!1),e){n.__scheduledTop=t;var o=n.__scrollTop,a=t-o,s=function(t,e,i){n.__scrollTop=o+a*t,n.options.callback&&n.options.callback(n.__scrollTop,n.__isDragging)},l=function(t){return n.__isAnimating===t},c=function(t,e,i){e===n.__isAnimating&&(n.__isAnimating=!1),(n.__didDecelerationComplete||i)&&n.__scrollingComplete()};n.__isAnimating=i.start(s,l,c,e,r?n.__easeOutCubic:n.__easeInOutCubic)}else n.__scheduledTop=n.__scrollTop=t,n.options.callback&&n.options.callback(t,n.__isDragging)},__startDeceleration:function(t){var e=this;e.__minDecelerationScrollTop=e.__minScrollTop,e.__maxDecelerationScrollTop=e.__maxScrollTop;var n=function(t,n,i){e.__stepThroughDeceleration(i)},r=.5,o=function(){var t=Math.abs(e.__decelerationVelocityY)>=r;return t||(e.__didDecelerationComplete=!0),t},a=function(t,n,i){return e.__isDecelerating=!1,e.__scrollTop<=e.__minScrollTop||e.__scrollTop>=e.__maxScrollTop?void e.scrollTo(e.__scrollTop):void(e.__didDecelerationComplete&&e.__scrollingComplete())};e.__isDecelerating=i.start(n,o,a)},__stepThroughDeceleration:function(t){var e=this,n=e.__scrollTop+e.__decelerationVelocityY,i=Math.max(Math.min(e.__maxDecelerationScrollTop,n),e.__minDecelerationScrollTop);i!==n&&(n=i,e.__decelerationVelocityY=0),Math.abs(e.__decelerationVelocityY)<=1?Math.abs(n%e.__itemHeight)<1&&(e.__decelerationVelocityY=0):e.__decelerationVelocityY*=.95,e.__publish(n)}};for(var a in o)r.prototype[a]=o[a];t.exports=r},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Loading=e.Notify=e.Toast=e.Alert=e.Confirm=void 0;var r=n(288),o=i(r),a=n(289),s=i(a),l=n(292),c=i(l),u=n(291),d=i(u),f=n(290),h=i(f);e.Confirm=s.default,e.Alert=o.default,e.Toast=c.default,e.Notify=d.default,e.Loading=h.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=n(4),s=o.default.extend(n(73)),l=new s({el:document.createElement("div")}),c=function(){a.pageScroll.unlock();var t=l.$el;t.parentNode&&t.parentNode.removeChild(t)};s.prototype.closeAlert=function(){a.pageScroll.unlock();var t=l.$el;t.parentNode&&t.parentNode.removeChild(t),window.removeEventListener("hashchange",c),"function"==typeof this.callback&&this.callback()};var u=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};l.mes=t.mes,l.callback=t.callback,window.addEventListener("hashchange",c),document.body.appendChild(l.$el),a.pageScroll.lock()};e.default=u},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=n(4),s=o.default.extend(n(74)),l=new s({el:document.createElement("div")}),c=function(){a.pageScroll.unlock();var t=l.$el;t.parentNode&&t.parentNode.removeChild(t)};s.prototype.closeConfirm=function(t,e){var n=!0;if("function"==typeof e&&(n=e(),void 0===n&&(n=!0)),n&&!t){a.pageScroll.unlock();var i=l.$el;i.parentNode&&i.parentNode.removeChild(i),window.removeEventListener("hashchange",c)}};var u=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};l.mes=t.mes||"",l.title=t.title||"提示",l.opts=t.opts,window.addEventListener("hashchange",c),document.body.appendChild(l.$el),a.pageScroll.lock()};e.default=u},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=n(4),s=o.default.extend(n(75)),l=new s({el:document.createElement("div")});s.prototype.open=function(t){l.title=t||"正在加载",document.body.appendChild(l.$el),a.pageScroll.lock()},s.prototype.close=function(){var t=l.$el;t.parentNode&&t.parentNode.removeChild(t),a.pageScroll.unlock()},e.default={open:l.open,close:l.close}},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=o.default.extend(n(76)),s=new a({el:document.createElement("div")}),l=null,c=!1;a.prototype.closeNotify=function(){s.classes="yd-notify-out",setTimeout(function(){var t=s.$el;t.parentNode&&t.parentNode.removeChild(t),c=!1},150),"function"==typeof this.callback&&this.callback()};var u=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};s.classes="",s.mes=t.mes,s.timeout=~~t.timeout||5e3,s.callback=t.callback,c||(c=!0,document.body.appendChild(s.$el),s.$el.addEventListener("click",function(){clearTimeout(l),s.closeNotify()}),l=setTimeout(function(){clearTimeout(l),s.closeNotify()},s.timeout))};e.default=u},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0});var r=n(5),o=i(r),a=n(4),s=o.default.extend(n(77)),l=new s({el:document.createElement("div")});s.prototype.closeToast=function(){var t=l.$el;t.parentNode&&t.parentNode.removeChild(t),a.pageScroll.unlock(),"function"==typeof this.callback&&this.callback()};var c=function(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};l.mes=t.mes,l.icon=t.icon,l.timeout=~~t.timeout||2e3,l.callback=t.callback,document.body.appendChild(l.$el),a.pageScroll.lock();var e=setTimeout(function(){clearTimeout(e),l.closeToast()},l.timeout+100)};e.default=c},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.FlexBoxItem=e.FlexBox=void 0;var r=n(79),o=i(r),a=n(78),s=i(a);e.FlexBox=o.default,e.FlexBoxItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.GridsGroup=e.GridsItem=void 0;var r=n(81),o=i(r),a=n(80),s=i(a);e.GridsItem=o.default,e.GridsGroup=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Icons=void 0;var r=n(82),o=i(r);e.Icons=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.InfiniteScroll=void 0;var r=n(83),o=i(r);e.InfiniteScroll=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Input=void 0;var r=n(8),o=i(r);e.Input=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.KeyBoard=void 0;var r=n(85),o=i(r);e.KeyBoard=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Layout=void 0;var r=n(86),o=i(r);e.Layout=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.LightBoxTxt=e.LightBoxImg=e.LightBox=void 0;var r=n(90),o=i(r),a=n(88),s=i(a),l=n(89),c=i(l);e.LightBox=o.default,e.LightBoxImg=s.default,e.LightBoxTxt=c.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ListOther=e.ListItem=e.ListTheme=void 0;var r=n(93),o=i(r),a=n(91),s=i(a),l=n(92),c=i(l);e.ListTheme=o.default,e.ListItem=s.default,e.ListOther=c.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.NavBarNextIcon=e.NavBarBackIcon=e.NavBar=void 0;var r=n(96),o=i(r),a=n(94),s=i(a),l=n(95),c=i(l);e.NavBar=o.default,e.NavBarBackIcon=s.default,e.NavBarNextIcon=c.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Popup=void 0;var r=n(97),o=i(r);e.Popup=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.PreviewItem=e.PreviewHeader=e.Preview=void 0;var r=n(100),o=i(r),a=n(98),s=i(a),l=n(99),c=i(l);e.Preview=o.default,e.PreviewHeader=s.default,e.PreviewItem=c.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ProgressBar=void 0;var r=n(101),o=i(r);e.ProgressBar=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.PullRefresh=void 0;var r=n(102),o=i(r);e.PullRefresh=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.RadioGroup=e.Radio=void 0;var r=n(104),o=i(r),a=n(103),s=i(a);e.Radio=o.default,e.RadioGroup=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Rate=void 0;var r=n(105),o=i(r);e.Rate=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.RollNoticeItem=e.RollNotice=void 0;var r=n(107),o=i(r),a=n(106),s=i(a);e.RollNotice=o.default,e.RollNoticeItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ScrollNavPanel=e.ScrollNav=void 0;var r=n(109),o=i(r),a=n(108),s=i(a);e.ScrollNav=o.default,e.ScrollNavPanel=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.ScrollTabPanel=e.ScrollTab=void 0;var r=n(111),o=i(r),a=n(110),s=i(a);e.ScrollTab=o.default,e.ScrollTabPanel=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Search=void 0;var r=n(112),o=i(r);e.Search=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.SendCode=void 0;var r=n(113),o=i(r);e.SendCode=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.SliderItem=e.Slider=void 0;var r=n(10),o=i(r),a=n(9),s=i(a);e.Slider=o.default,e.SliderItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Spinner=void 0;var r=n(114),o=i(r);e.Spinner=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.StepItem=e.Step=void 0;var r=n(116),o=i(r),a=n(115),s=i(a);e.Step=o.default,e.StepItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.Switch=void 0;var r=n(117),o=i(r);e.Switch=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.TabPanel=e.Tab=void 0;var r=n(119),o=i(r),a=n(118),s=i(a);e.Tab=o.default,e.TabPanel=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.TabBarItem=e.TabBar=void 0;var r=n(121),o=i(r),a=n(120),s=i(a);e.TabBar=o.default,e.TabBarItem=s.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.TextArea=void 0;var r=n(122),o=i(r);e.TextArea=o.default},function(t,e,n){"use strict";function i(t){return t&&t.__esModule?t:{default:t}}Object.defineProperty(e,"__esModule",{value:!0}),e.TimeLineItem=e.TimeLine=void 0;var r=n(124),o=i(r),a=n(123),s=i(a);e.TimeLine=o.default,e.TimeLineItem=s.default}])});

/***/ })
],[5]);
//# sourceMappingURL=index.js.map?9be32b33aa669cca89d4