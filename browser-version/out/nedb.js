(function(e){if("function"==typeof bootstrap)bootstrap("nedb",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makeNedb=e}else"undefined"!=typeof window?window.Nedb=e():global.Nedb=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var process=require("__browserify_process");if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (typeof emitter._events[type] === 'function')
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

},{"__browserify_process":4}],2:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\u001b[' + styles[style][0] + 'm' + str +
             '\u001b[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return Array.isArray(ar) ||
         (typeof ar === 'object' && Object.prototype.toString.call(ar) === '[object Array]');
}


function isRegExp(re) {
  typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]';
}


function isDate(d) {
  return typeof d === 'object' && Object.prototype.toString.call(d) === '[object Date]';
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":1}],3:[function(require,module,exports){
require=(function(e,t,n,r){function i(r){if(!n[r]){if(!t[r]){if(e)return e(r);throw new Error("Cannot find module '"+r+"'")}var s=n[r]={exports:{}};t[r][0](function(e){var n=t[r][1][e];return i(n?n:e)},s,s.exports)}return n[r].exports}for(var s=0;s<r.length;s++)i(r[s]);return i})(typeof require!=="undefined"&&require,{1:[function(require,module,exports){
// UTILITY
var util = require('util');
var Buffer = require("buffer").Buffer;
var pSlice = Array.prototype.slice;

function objectKeys(object) {
  if (Object.keys) return Object.keys(object);
  var result = [];
  for (var name in object) {
    if (Object.prototype.hasOwnProperty.call(object, name)) {
      result.push(name);
    }
  }
  return result;
}

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.message = options.message;
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
};
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (value === undefined) {
    return '' + value;
  }
  if (typeof value === 'number' && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (typeof value === 'function' || value instanceof RegExp) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (typeof s == 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

assert.AssertionError.prototype.toString = function() {
  if (this.message) {
    return [this.name + ':', this.message].join(' ');
  } else {
    return [
      this.name + ':',
      truncate(JSON.stringify(this.actual, replacer), 128),
      this.operator,
      truncate(JSON.stringify(this.expected, replacer), 128)
    ].join(' ');
  }
};

// assert.AssertionError instanceof Error

assert.AssertionError.__proto__ = Error.prototype;

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!!!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (expected instanceof RegExp) {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail('Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail('Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

},{"util":2,"buffer":3}],2:[function(require,module,exports){
var events = require('events');

exports.isArray = isArray;
exports.isDate = function(obj){return Object.prototype.toString.call(obj) === '[object Date]'};
exports.isRegExp = function(obj){return Object.prototype.toString.call(obj) === '[object RegExp]'};


exports.print = function () {};
exports.puts = function () {};
exports.debug = function() {};

exports.inspect = function(obj, showHidden, depth, colors) {
  var seen = [];

  var stylize = function(str, styleType) {
    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    var styles =
        { 'bold' : [1, 22],
          'italic' : [3, 23],
          'underline' : [4, 24],
          'inverse' : [7, 27],
          'white' : [37, 39],
          'grey' : [90, 39],
          'black' : [30, 39],
          'blue' : [34, 39],
          'cyan' : [36, 39],
          'green' : [32, 39],
          'magenta' : [35, 39],
          'red' : [31, 39],
          'yellow' : [33, 39] };

    var style =
        { 'special': 'cyan',
          'number': 'blue',
          'boolean': 'yellow',
          'undefined': 'grey',
          'null': 'bold',
          'string': 'green',
          'date': 'magenta',
          // "name": intentionally not styling
          'regexp': 'red' }[styleType];

    if (style) {
      return '\033[' + styles[style][0] + 'm' + str +
             '\033[' + styles[style][1] + 'm';
    } else {
      return str;
    }
  };
  if (! colors) {
    stylize = function(str, styleType) { return str; };
  }

  function format(value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (value && typeof value.inspect === 'function' &&
        // Filter out the util module, it's inspect function is special
        value !== exports &&
        // Also filter out any prototype objects using the circular check.
        !(value.constructor && value.constructor.prototype === value)) {
      return value.inspect(recurseTimes);
    }

    // Primitive types cannot have properties
    switch (typeof value) {
      case 'undefined':
        return stylize('undefined', 'undefined');

      case 'string':
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return stylize(simple, 'string');

      case 'number':
        return stylize('' + value, 'number');

      case 'boolean':
        return stylize('' + value, 'boolean');
    }
    // For some reason typeof null is "object", so special case here.
    if (value === null) {
      return stylize('null', 'null');
    }

    // Look up the keys of the object.
    var visible_keys = Object_keys(value);
    var keys = showHidden ? Object_getOwnPropertyNames(value) : visible_keys;

    // Functions without properties can be shortcutted.
    if (typeof value === 'function' && keys.length === 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        var name = value.name ? ': ' + value.name : '';
        return stylize('[Function' + name + ']', 'special');
      }
    }

    // Dates without properties can be shortcutted
    if (isDate(value) && keys.length === 0) {
      return stylize(value.toUTCString(), 'date');
    }

    var base, type, braces;
    // Determine the object type
    if (isArray(value)) {
      type = 'Array';
      braces = ['[', ']'];
    } else {
      type = 'Object';
      braces = ['{', '}'];
    }

    // Make functions say that they are functions
    if (typeof value === 'function') {
      var n = value.name ? ': ' + value.name : '';
      base = (isRegExp(value)) ? ' ' + value : ' [Function' + n + ']';
    } else {
      base = '';
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + value.toUTCString();
    }

    if (keys.length === 0) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return stylize('' + value, 'regexp');
      } else {
        return stylize('[Object]', 'special');
      }
    }

    seen.push(value);

    var output = keys.map(function(key) {
      var name, str;
      if (value.__lookupGetter__) {
        if (value.__lookupGetter__(key)) {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Getter/Setter]', 'special');
          } else {
            str = stylize('[Getter]', 'special');
          }
        } else {
          if (value.__lookupSetter__(key)) {
            str = stylize('[Setter]', 'special');
          }
        }
      }
      if (visible_keys.indexOf(key) < 0) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (seen.indexOf(value[key]) < 0) {
          if (recurseTimes === null) {
            str = format(value[key]);
          } else {
            str = format(value[key], recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (isArray(value)) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = stylize('[Circular]', 'special');
        }
      }
      if (typeof name === 'undefined') {
        if (type === 'Array' && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    });

    seen.pop();

    var numLinesEst = 0;
    var length = output.reduce(function(prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.length + 1;
    }, 0);

    if (length > 50) {
      output = braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];

    } else {
      output = braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }

    return output;
  }
  return format(obj, (typeof depth === 'undefined' ? 2 : depth));
};


function isArray(ar) {
  return ar instanceof Array ||
         Array.isArray(ar) ||
         (ar && ar !== Object.prototype && isArray(ar.__proto__));
}


function isRegExp(re) {
  return re instanceof RegExp ||
    (typeof re === 'object' && Object.prototype.toString.call(re) === '[object RegExp]');
}


function isDate(d) {
  if (d instanceof Date) return true;
  if (typeof d !== 'object') return false;
  var properties = Date.prototype && Object_getOwnPropertyNames(Date.prototype);
  var proto = d.__proto__ && Object_getOwnPropertyNames(d.__proto__);
  return JSON.stringify(proto) === JSON.stringify(properties);
}

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

exports.log = function (msg) {};

exports.pump = null;

var Object_keys = Object.keys || function (obj) {
    var res = [];
    for (var key in obj) res.push(key);
    return res;
};

var Object_getOwnPropertyNames = Object.getOwnPropertyNames || function (obj) {
    var res = [];
    for (var key in obj) {
        if (Object.hasOwnProperty.call(obj, key)) res.push(key);
    }
    return res;
};

var Object_create = Object.create || function (prototype, properties) {
    // from es5-shim
    var object;
    if (prototype === null) {
        object = { '__proto__' : null };
    }
    else {
        if (typeof prototype !== 'object') {
            throw new TypeError(
                'typeof prototype[' + (typeof prototype) + '] != \'object\''
            );
        }
        var Type = function () {};
        Type.prototype = prototype;
        object = new Type();
        object.__proto__ = prototype;
    }
    if (typeof properties !== 'undefined' && Object.defineProperties) {
        Object.defineProperties(object, properties);
    }
    return object;
};

exports.inherits = function(ctor, superCtor) {
  ctor.super_ = superCtor;
  ctor.prototype = Object_create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
};

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (typeof f !== 'string') {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(exports.inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j': return JSON.stringify(args[i++]);
      default:
        return x;
    }
  });
  for(var x = args[i]; i < len; x = args[++i]){
    if (x === null || typeof x !== 'object') {
      str += ' ' + x;
    } else {
      str += ' ' + exports.inspect(x);
    }
  }
  return str;
};

},{"events":4}],5:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],6:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],4:[function(require,module,exports){
(function(process){if (!process.EventEmitter) process.EventEmitter = function () {};

var EventEmitter = exports.EventEmitter = process.EventEmitter;
var isArray = typeof Array.isArray === 'function'
    ? Array.isArray
    : function (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]'
    }
;
function indexOf (xs, x) {
    if (xs.indexOf) return xs.indexOf(x);
    for (var i = 0; i < xs.length; i++) {
        if (x === xs[i]) return i;
    }
    return -1;
}

// By default EventEmitters will print a warning if more than
// 10 listeners are added to it. This is a useful default which
// helps finding memory leaks.
//
// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
var defaultMaxListeners = 10;
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!this._events) this._events = {};
  this._events.maxListeners = n;
};


EventEmitter.prototype.emit = function(type) {
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (isArray(this._events.error) && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  var handler = this._events[type];
  if (!handler) return false;

  if (typeof handler == 'function') {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        var args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
    return true;

  } else if (isArray(handler)) {
    var args = Array.prototype.slice.call(arguments, 1);

    var listeners = handler.slice();
    for (var i = 0, l = listeners.length; i < l; i++) {
      listeners[i].apply(this, args);
    }
    return true;

  } else {
    return false;
  }
};

// EventEmitter is defined in src/node_events.cc
// EventEmitter.prototype.emit() is also defined there.
EventEmitter.prototype.addListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('addListener only takes instances of Function');
  }

  if (!this._events) this._events = {};

  // To avoid recursion in the case that type == "newListeners"! Before
  // adding it to the listeners, first emit "newListeners".
  this.emit('newListener', type, listener);

  if (!this._events[type]) {
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  } else if (isArray(this._events[type])) {

    // Check for listener leak
    if (!this._events[type].warned) {
      var m;
      if (this._events.maxListeners !== undefined) {
        m = this._events.maxListeners;
      } else {
        m = defaultMaxListeners;
      }

      if (m && m > 0 && this._events[type].length > m) {
        this._events[type].warned = true;
        console.error('(node) warning: possible EventEmitter memory ' +
                      'leak detected. %d listeners added. ' +
                      'Use emitter.setMaxListeners() to increase limit.',
                      this._events[type].length);
        console.trace();
      }
    }

    // If we've already got an array, just append.
    this._events[type].push(listener);
  } else {
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  var self = this;
  self.on(type, function g() {
    self.removeListener(type, g);
    listener.apply(this, arguments);
  });

  return this;
};

EventEmitter.prototype.removeListener = function(type, listener) {
  if ('function' !== typeof listener) {
    throw new Error('removeListener only takes instances of Function');
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (!this._events || !this._events[type]) return this;

  var list = this._events[type];

  if (isArray(list)) {
    var i = indexOf(list, listener);
    if (i < 0) return this;
    list.splice(i, 1);
    if (list.length == 0)
      delete this._events[type];
  } else if (this._events[type] === listener) {
    delete this._events[type];
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  if (arguments.length === 0) {
    this._events = {};
    return this;
  }

  // does not use listeners(), so no side effect of creating _events[type]
  if (type && this._events && this._events[type]) this._events[type] = null;
  return this;
};

EventEmitter.prototype.listeners = function(type) {
  if (!this._events) this._events = {};
  if (!this._events[type]) this._events[type] = [];
  if (!isArray(this._events[type])) {
    this._events[type] = [this._events[type]];
  }
  return this._events[type];
};

})(require("__browserify_process"))
},{"__browserify_process":6}],"buffer-browserify":[function(require,module,exports){
module.exports=require('q9TxCC');
},{}],"q9TxCC":[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
    case 'binary':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.binaryWrite = SlowBuffer.prototype.asciiWrite;

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.binarySlice = SlowBuffer.prototype.asciiSlice;

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

SlowBuffer.prototype.fill = function(value, start, end) {
  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  for (var i = start; i < end; i++) {
    this[i] = value;
  }
}

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        if (subject instanceof Buffer) {
          this.parent[i + this.offset] = subject.readUInt8(i);
        }
        else {
          this.parent[i + this.offset] = subject[i];
        }
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1];
    }
  } else {
    val = buffer.parent[buffer.offset + offset];
    if (offset + 1 < buffer.length) {
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    }
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return 0;

  if (isBigEndian) {
    if (offset + 1 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 1] << 16;
    if (offset + 2 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 2] << 8;
    if (offset + 3 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    if (offset + 2 < buffer.length)
      val = buffer.parent[buffer.offset + offset + 2] << 16;
    if (offset + 1 < buffer.length)
      val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    if (offset + 3 < buffer.length)
      val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (offset >= buffer.length) return;

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  if (offset < buffer.length) {
    buffer.parent[buffer.offset + offset] = value;
  }
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 2); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value & (0xff << (8 * (isBigEndian ? 1 - i : i)))) >>>
            (isBigEndian ? 1 - i : i) * 8;
  }

}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  for (var i = 0; i < Math.min(buffer.length - offset, 4); i++) {
    buffer.parent[buffer.offset + offset + i] =
        (value >>> (isBigEndian ? 3 - i : i) * 8) & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":5,"base64-js":7}],7:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}],8:[function(require,module,exports){
exports.readIEEE754 = function(buffer, offset, isBE, mLen, nBytes) {
  var e, m,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      nBits = -7,
      i = isBE ? 0 : (nBytes - 1),
      d = isBE ? 1 : -1,
      s = buffer[offset + i];

  i += d;

  e = s & ((1 << (-nBits)) - 1);
  s >>= (-nBits);
  nBits += eLen;
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8);

  m = e & ((1 << (-nBits)) - 1);
  e >>= (-nBits);
  nBits += mLen;
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8);

  if (e === 0) {
    e = 1 - eBias;
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity);
  } else {
    m = m + Math.pow(2, mLen);
    e = e - eBias;
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
};

exports.writeIEEE754 = function(buffer, value, offset, isBE, mLen, nBytes) {
  var e, m, c,
      eLen = nBytes * 8 - mLen - 1,
      eMax = (1 << eLen) - 1,
      eBias = eMax >> 1,
      rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0),
      i = isBE ? (nBytes - 1) : 0,
      d = isBE ? -1 : 1,
      s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

  value = Math.abs(value);

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0;
    e = eMax;
  } else {
    e = Math.floor(Math.log(value) / Math.LN2);
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--;
      c *= 2;
    }
    if (e + eBias >= 1) {
      value += rt / c;
    } else {
      value += rt * Math.pow(2, 1 - eBias);
    }
    if (value * c >= 2) {
      e++;
      c /= 2;
    }

    if (e + eBias >= eMax) {
      m = 0;
      e = eMax;
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen);
      e = e + eBias;
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
      e = 0;
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8);

  e = (e << mLen) | m;
  eLen += mLen;
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8);

  buffer[offset + i - d] |= s * 128;
};

},{}],3:[function(require,module,exports){
function SlowBuffer (size) {
    this.length = size;
};

var assert = require('assert');

exports.INSPECT_MAX_BYTES = 50;


function toHex(n) {
  if (n < 16) return '0' + n.toString(16);
  return n.toString(16);
}

function utf8ToBytes(str) {
  var byteArray = [];
  for (var i = 0; i < str.length; i++)
    if (str.charCodeAt(i) <= 0x7F)
      byteArray.push(str.charCodeAt(i));
    else {
      var h = encodeURIComponent(str.charAt(i)).substr(1).split('%');
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16));
    }

  return byteArray;
}

function asciiToBytes(str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++ )
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push( str.charCodeAt(i) & 0xFF );

  return byteArray;
}

function base64ToBytes(str) {
  return require("base64-js").toByteArray(str);
}

SlowBuffer.byteLength = function (str, encoding) {
  switch (encoding || "utf8") {
    case 'hex':
      return str.length / 2;

    case 'utf8':
    case 'utf-8':
      return utf8ToBytes(str).length;

    case 'ascii':
      return str.length;

    case 'base64':
      return base64ToBytes(str).length;

    default:
      throw new Error('Unknown encoding');
  }
};

function blitBuffer(src, dst, offset, length) {
  var pos, i = 0;
  while (i < length) {
    if ((i+offset >= dst.length) || (i >= src.length))
      break;

    dst[i + offset] = src[i];
    i++;
  }
  return i;
}

SlowBuffer.prototype.utf8Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(utf8ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.asciiWrite = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten =  blitBuffer(asciiToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Write = function (string, offset, length) {
  var bytes, pos;
  return SlowBuffer._charsWritten = blitBuffer(base64ToBytes(string), this, offset, length);
};

SlowBuffer.prototype.base64Slice = function (start, end) {
  var bytes = Array.prototype.slice.apply(this, arguments)
  return require("base64-js").fromByteArray(bytes);
}

function decodeUtf8Char(str) {
  try {
    return decodeURIComponent(str);
  } catch (err) {
    return String.fromCharCode(0xFFFD); // UTF 8 invalid char
  }
}

SlowBuffer.prototype.utf8Slice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var res = "";
  var tmp = "";
  var i = 0;
  while (i < bytes.length) {
    if (bytes[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(bytes[i]);
      tmp = "";
    } else
      tmp += "%" + bytes[i].toString(16);

    i++;
  }

  return res + decodeUtf8Char(tmp);
}

SlowBuffer.prototype.asciiSlice = function () {
  var bytes = Array.prototype.slice.apply(this, arguments);
  var ret = "";
  for (var i = 0; i < bytes.length; i++)
    ret += String.fromCharCode(bytes[i]);
  return ret;
}

SlowBuffer.prototype.inspect = function() {
  var out = [],
      len = this.length;
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }
  return '<SlowBuffer ' + out.join(' ') + '>';
};


SlowBuffer.prototype.hexSlice = function(start, end) {
  var len = this.length;

  if (!start || start < 0) start = 0;
  if (!end || end < 0 || end > len) end = len;

  var out = '';
  for (var i = start; i < end; i++) {
    out += toHex(this[i]);
  }
  return out;
};


SlowBuffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();
  start = +start || 0;
  if (typeof end == 'undefined') end = this.length;

  // Fastpath empty strings
  if (+end == start) {
    return '';
  }

  switch (encoding) {
    case 'hex':
      return this.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.utf8Slice(start, end);

    case 'ascii':
      return this.asciiSlice(start, end);

    case 'binary':
      return this.binarySlice(start, end);

    case 'base64':
      return this.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


SlowBuffer.prototype.hexWrite = function(string, offset, length) {
  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }

  // must be an even number of digits
  var strLen = string.length;
  if (strLen % 2) {
    throw new Error('Invalid hex string');
  }
  if (length > strLen / 2) {
    length = strLen / 2;
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('Invalid hex string');
    this[offset + i] = byte;
  }
  SlowBuffer._charsWritten = i * 2;
  return i;
};


SlowBuffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  switch (encoding) {
    case 'hex':
      return this.hexWrite(string, offset, length);

    case 'utf8':
    case 'utf-8':
      return this.utf8Write(string, offset, length);

    case 'ascii':
      return this.asciiWrite(string, offset, length);

    case 'binary':
      return this.binaryWrite(string, offset, length);

    case 'base64':
      return this.base64Write(string, offset, length);

    case 'ucs2':
    case 'ucs-2':
      return this.ucs2Write(string, offset, length);

    default:
      throw new Error('Unknown encoding');
  }
};


// slice(start, end)
SlowBuffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;

  if (end > this.length) {
    throw new Error('oob');
  }
  if (start > end) {
    throw new Error('oob');
  }

  return new Buffer(this, end - start, +start);
};

SlowBuffer.prototype.copy = function(target, targetstart, sourcestart, sourceend) {
  var temp = [];
  for (var i=sourcestart; i<sourceend; i++) {
    assert.ok(typeof this[i] !== 'undefined', "copying undefined buffer bytes!");
    temp.push(this[i]);
  }

  for (var i=targetstart; i<targetstart+temp.length; i++) {
    target[i] = temp[i-targetstart];
  }
};

function coerce(length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length);
  return length < 0 ? 0 : length;
}


// Buffer

function Buffer(subject, encoding, offset) {
  if (!(this instanceof Buffer)) {
    return new Buffer(subject, encoding, offset);
  }

  var type;

  // Are we slicing?
  if (typeof offset === 'number') {
    this.length = coerce(encoding);
    this.parent = subject;
    this.offset = offset;
  } else {
    // Find the length
    switch (type = typeof subject) {
      case 'number':
        this.length = coerce(subject);
        break;

      case 'string':
        this.length = Buffer.byteLength(subject, encoding);
        break;

      case 'object': // Assume object is an array
        this.length = coerce(subject.length);
        break;

      default:
        throw new Error('First argument needs to be a number, ' +
                        'array or string.');
    }

    if (this.length > Buffer.poolSize) {
      // Big buffer, just alloc one.
      this.parent = new SlowBuffer(this.length);
      this.offset = 0;

    } else {
      // Small buffer.
      if (!pool || pool.length - pool.used < this.length) allocPool();
      this.parent = pool;
      this.offset = pool.used;
      pool.used += this.length;
    }

    // Treat array-ish objects as a byte array.
    if (isArrayIsh(subject)) {
      for (var i = 0; i < this.length; i++) {
        this.parent[i + this.offset] = subject[i];
      }
    } else if (type == 'string') {
      // We are a string
      this.length = this.write(subject, 0, encoding);
    }
  }

}

function isArrayIsh(subject) {
  return Array.isArray(subject) || Buffer.isBuffer(subject) ||
         subject && typeof subject === 'object' &&
         typeof subject.length === 'number';
}

exports.SlowBuffer = SlowBuffer;
exports.Buffer = Buffer;

Buffer.poolSize = 8 * 1024;
var pool;

function allocPool() {
  pool = new SlowBuffer(Buffer.poolSize);
  pool.used = 0;
}


// Static methods
Buffer.isBuffer = function isBuffer(b) {
  return b instanceof Buffer || b instanceof SlowBuffer;
};

Buffer.concat = function (list, totalLength) {
  if (!Array.isArray(list)) {
    throw new Error("Usage: Buffer.concat(list, [totalLength])\n \
      list should be an Array.");
  }

  if (list.length === 0) {
    return new Buffer(0);
  } else if (list.length === 1) {
    return list[0];
  }

  if (typeof totalLength !== 'number') {
    totalLength = 0;
    for (var i = 0; i < list.length; i++) {
      var buf = list[i];
      totalLength += buf.length;
    }
  }

  var buffer = new Buffer(totalLength);
  var pos = 0;
  for (var i = 0; i < list.length; i++) {
    var buf = list[i];
    buf.copy(buffer, pos);
    pos += buf.length;
  }
  return buffer;
};

// Inspect
Buffer.prototype.inspect = function inspect() {
  var out = [],
      len = this.length;

  for (var i = 0; i < len; i++) {
    out[i] = toHex(this.parent[i + this.offset]);
    if (i == exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...';
      break;
    }
  }

  return '<Buffer ' + out.join(' ') + '>';
};


Buffer.prototype.get = function get(i) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i];
};


Buffer.prototype.set = function set(i, v) {
  if (i < 0 || i >= this.length) throw new Error('oob');
  return this.parent[this.offset + i] = v;
};


// write(string, offset = 0, length = buffer.length-offset, encoding = 'utf8')
Buffer.prototype.write = function(string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length;
      length = undefined;
    }
  } else {  // legacy
    var swap = encoding;
    encoding = offset;
    offset = length;
    length = swap;
  }

  offset = +offset || 0;
  var remaining = this.length - offset;
  if (!length) {
    length = remaining;
  } else {
    length = +length;
    if (length > remaining) {
      length = remaining;
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase();

  var ret;
  switch (encoding) {
    case 'hex':
      ret = this.parent.hexWrite(string, this.offset + offset, length);
      break;

    case 'utf8':
    case 'utf-8':
      ret = this.parent.utf8Write(string, this.offset + offset, length);
      break;

    case 'ascii':
      ret = this.parent.asciiWrite(string, this.offset + offset, length);
      break;

    case 'binary':
      ret = this.parent.binaryWrite(string, this.offset + offset, length);
      break;

    case 'base64':
      // Warning: maxLength not taken into account in base64Write
      ret = this.parent.base64Write(string, this.offset + offset, length);
      break;

    case 'ucs2':
    case 'ucs-2':
      ret = this.parent.ucs2Write(string, this.offset + offset, length);
      break;

    default:
      throw new Error('Unknown encoding');
  }

  Buffer._charsWritten = SlowBuffer._charsWritten;

  return ret;
};


// toString(encoding, start=0, end=buffer.length)
Buffer.prototype.toString = function(encoding, start, end) {
  encoding = String(encoding || 'utf8').toLowerCase();

  if (typeof start == 'undefined' || start < 0) {
    start = 0;
  } else if (start > this.length) {
    start = this.length;
  }

  if (typeof end == 'undefined' || end > this.length) {
    end = this.length;
  } else if (end < 0) {
    end = 0;
  }

  start = start + this.offset;
  end = end + this.offset;

  switch (encoding) {
    case 'hex':
      return this.parent.hexSlice(start, end);

    case 'utf8':
    case 'utf-8':
      return this.parent.utf8Slice(start, end);

    case 'ascii':
      return this.parent.asciiSlice(start, end);

    case 'binary':
      return this.parent.binarySlice(start, end);

    case 'base64':
      return this.parent.base64Slice(start, end);

    case 'ucs2':
    case 'ucs-2':
      return this.parent.ucs2Slice(start, end);

    default:
      throw new Error('Unknown encoding');
  }
};


// byteLength
Buffer.byteLength = SlowBuffer.byteLength;


// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill(value, start, end) {
  value || (value = 0);
  start || (start = 0);
  end || (end = this.length);

  if (typeof value === 'string') {
    value = value.charCodeAt(0);
  }
  if (!(typeof value === 'number') || isNaN(value)) {
    throw new Error('value is not a number');
  }

  if (end < start) throw new Error('end < start');

  // Fill 0 bytes; we're done
  if (end === start) return 0;
  if (this.length == 0) return 0;

  if (start < 0 || start >= this.length) {
    throw new Error('start out of bounds');
  }

  if (end < 0 || end > this.length) {
    throw new Error('end out of bounds');
  }

  return this.parent.fill(value,
                          start + this.offset,
                          end + this.offset);
};


// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function(target, target_start, start, end) {
  var source = this;
  start || (start = 0);
  end || (end = this.length);
  target_start || (target_start = 0);

  if (end < start) throw new Error('sourceEnd < sourceStart');

  // Copy 0 bytes; we're done
  if (end === start) return 0;
  if (target.length == 0 || source.length == 0) return 0;

  if (target_start < 0 || target_start >= target.length) {
    throw new Error('targetStart out of bounds');
  }

  if (start < 0 || start >= source.length) {
    throw new Error('sourceStart out of bounds');
  }

  if (end < 0 || end > source.length) {
    throw new Error('sourceEnd out of bounds');
  }

  // Are we oob?
  if (end > this.length) {
    end = this.length;
  }

  if (target.length - target_start < end - start) {
    end = target.length - target_start + start;
  }

  return this.parent.copy(target.parent,
                          target_start + target.offset,
                          start + this.offset,
                          end + this.offset);
};


// slice(start, end)
Buffer.prototype.slice = function(start, end) {
  if (end === undefined) end = this.length;
  if (end > this.length) throw new Error('oob');
  if (start > end) throw new Error('oob');

  return new Buffer(this.parent, end - start, +start + this.offset);
};


// Legacy methods for backwards compatibility.

Buffer.prototype.utf8Slice = function(start, end) {
  return this.toString('utf8', start, end);
};

Buffer.prototype.binarySlice = function(start, end) {
  return this.toString('binary', start, end);
};

Buffer.prototype.asciiSlice = function(start, end) {
  return this.toString('ascii', start, end);
};

Buffer.prototype.utf8Write = function(string, offset) {
  return this.write(string, offset, 'utf8');
};

Buffer.prototype.binaryWrite = function(string, offset) {
  return this.write(string, offset, 'binary');
};

Buffer.prototype.asciiWrite = function(string, offset) {
  return this.write(string, offset, 'ascii');
};

Buffer.prototype.readUInt8 = function(offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  return buffer.parent[buffer.offset + offset];
};

function readUInt16(buffer, offset, isBigEndian, noAssert) {
  var val = 0;


  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset] << 8;
    val |= buffer.parent[buffer.offset + offset + 1];
  } else {
    val = buffer.parent[buffer.offset + offset];
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
  }

  return val;
}

Buffer.prototype.readUInt16LE = function(offset, noAssert) {
  return readUInt16(this, offset, false, noAssert);
};

Buffer.prototype.readUInt16BE = function(offset, noAssert) {
  return readUInt16(this, offset, true, noAssert);
};

function readUInt32(buffer, offset, isBigEndian, noAssert) {
  var val = 0;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  if (isBigEndian) {
    val = buffer.parent[buffer.offset + offset + 1] << 16;
    val |= buffer.parent[buffer.offset + offset + 2] << 8;
    val |= buffer.parent[buffer.offset + offset + 3];
    val = val + (buffer.parent[buffer.offset + offset] << 24 >>> 0);
  } else {
    val = buffer.parent[buffer.offset + offset + 2] << 16;
    val |= buffer.parent[buffer.offset + offset + 1] << 8;
    val |= buffer.parent[buffer.offset + offset];
    val = val + (buffer.parent[buffer.offset + offset + 3] << 24 >>> 0);
  }

  return val;
}

Buffer.prototype.readUInt32LE = function(offset, noAssert) {
  return readUInt32(this, offset, false, noAssert);
};

Buffer.prototype.readUInt32BE = function(offset, noAssert) {
  return readUInt32(this, offset, true, noAssert);
};


/*
 * Signed integer types, yay team! A reminder on how two's complement actually
 * works. The first bit is the signed bit, i.e. tells us whether or not the
 * number should be positive or negative. If the two's complement value is
 * positive, then we're done, as it's equivalent to the unsigned representation.
 *
 * Now if the number is positive, you're pretty much done, you can just leverage
 * the unsigned translations and return those. Unfortunately, negative numbers
 * aren't quite that straightforward.
 *
 * At first glance, one might be inclined to use the traditional formula to
 * translate binary numbers between the positive and negative values in two's
 * complement. (Though it doesn't quite work for the most negative value)
 * Mainly:
 *  - invert all the bits
 *  - add one to the result
 *
 * Of course, this doesn't quite work in Javascript. Take for example the value
 * of -128. This could be represented in 16 bits (big-endian) as 0xff80. But of
 * course, Javascript will do the following:
 *
 * > ~0xff80
 * -65409
 *
 * Whoh there, Javascript, that's not quite right. But wait, according to
 * Javascript that's perfectly correct. When Javascript ends up seeing the
 * constant 0xff80, it has no notion that it is actually a signed number. It
 * assumes that we've input the unsigned value 0xff80. Thus, when it does the
 * binary negation, it casts it into a signed value, (positive 0xff80). Then
 * when you perform binary negation on that, it turns it into a negative number.
 *
 * Instead, we're going to have to use the following general formula, that works
 * in a rather Javascript friendly way. I'm glad we don't support this kind of
 * weird numbering scheme in the kernel.
 *
 * (BIT-MAX - (unsigned)val + 1) * -1
 *
 * The astute observer, may think that this doesn't make sense for 8-bit numbers
 * (really it isn't necessary for them). However, when you get 16-bit numbers,
 * you do. Let's go back to our prior example and see how this will look:
 *
 * (0xffff - 0xff80 + 1) * -1
 * (0x007f + 1) * -1
 * (0x0080) * -1
 */
Buffer.prototype.readInt8 = function(offset, noAssert) {
  var buffer = this;
  var neg;

  if (!noAssert) {
    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to read beyond buffer length');
  }

  neg = buffer.parent[buffer.offset + offset] & 0x80;
  if (!neg) {
    return (buffer.parent[buffer.offset + offset]);
  }

  return ((0xff - buffer.parent[buffer.offset + offset] + 1) * -1);
};

function readInt16(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt16(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x8000;
  if (!neg) {
    return val;
  }

  return (0xffff - val + 1) * -1;
}

Buffer.prototype.readInt16LE = function(offset, noAssert) {
  return readInt16(this, offset, false, noAssert);
};

Buffer.prototype.readInt16BE = function(offset, noAssert) {
  return readInt16(this, offset, true, noAssert);
};

function readInt32(buffer, offset, isBigEndian, noAssert) {
  var neg, val;

  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  val = readUInt32(buffer, offset, isBigEndian, noAssert);
  neg = val & 0x80000000;
  if (!neg) {
    return (val);
  }

  return (0xffffffff - val + 1) * -1;
}

Buffer.prototype.readInt32LE = function(offset, noAssert) {
  return readInt32(this, offset, false, noAssert);
};

Buffer.prototype.readInt32BE = function(offset, noAssert) {
  return readInt32(this, offset, true, noAssert);
};

function readFloat(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 3 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.readFloatLE = function(offset, noAssert) {
  return readFloat(this, offset, false, noAssert);
};

Buffer.prototype.readFloatBE = function(offset, noAssert) {
  return readFloat(this, offset, true, noAssert);
};

function readDouble(buffer, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset + 7 < buffer.length,
        'Trying to read beyond buffer length');
  }

  return require('./buffer_ieee754').readIEEE754(buffer, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.readDoubleLE = function(offset, noAssert) {
  return readDouble(this, offset, false, noAssert);
};

Buffer.prototype.readDoubleBE = function(offset, noAssert) {
  return readDouble(this, offset, true, noAssert);
};


/*
 * We have to make sure that the value is a valid integer. This means that it is
 * non-negative. It has no fractional component and that it does not exceed the
 * maximum allowed value.
 *
 *      value           The number to check for validity
 *
 *      max             The maximum value
 */
function verifuint(value, max) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value >= 0,
      'specified a negative value for writing an unsigned value');

  assert.ok(value <= max, 'value is larger than maximum value for type');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

Buffer.prototype.writeUInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xff);
  }

  buffer.parent[buffer.offset + offset] = value;
};

function writeUInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset + 1] = value & 0x00ff;
  } else {
    buffer.parent[buffer.offset + offset + 1] = (value & 0xff00) >>> 8;
    buffer.parent[buffer.offset + offset] = value & 0x00ff;
  }
}

Buffer.prototype.writeUInt16LE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt16BE = function(value, offset, noAssert) {
  writeUInt16(this, value, offset, true, noAssert);
};

function writeUInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'trying to write beyond buffer length');

    verifuint(value, 0xffffffff);
  }

  if (isBigEndian) {
    buffer.parent[buffer.offset + offset] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset + 3] = value & 0xff;
  } else {
    buffer.parent[buffer.offset + offset + 3] = (value >>> 24) & 0xff;
    buffer.parent[buffer.offset + offset + 2] = (value >>> 16) & 0xff;
    buffer.parent[buffer.offset + offset + 1] = (value >>> 8) & 0xff;
    buffer.parent[buffer.offset + offset] = value & 0xff;
  }
}

Buffer.prototype.writeUInt32LE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeUInt32BE = function(value, offset, noAssert) {
  writeUInt32(this, value, offset, true, noAssert);
};


/*
 * We now move onto our friends in the signed number category. Unlike unsigned
 * numbers, we're going to have to worry a bit more about how we put values into
 * arrays. Since we are only worrying about signed 32-bit values, we're in
 * slightly better shape. Unfortunately, we really can't do our favorite binary
 * & in this system. It really seems to do the wrong thing. For example:
 *
 * > -32 & 0xff
 * 224
 *
 * What's happening above is really: 0xe0 & 0xff = 0xe0. However, the results of
 * this aren't treated as a signed number. Ultimately a bad thing.
 *
 * What we're going to want to do is basically create the unsigned equivalent of
 * our representation and pass that off to the wuint* functions. To do that
 * we're going to do the following:
 *
 *  - if the value is positive
 *      we can pass it directly off to the equivalent wuint
 *  - if the value is negative
 *      we do the following computation:
 *         mb + val + 1, where
 *         mb   is the maximum unsigned value in that byte size
 *         val  is the Javascript negative integer
 *
 *
 * As a concrete value, take -128. In signed 16 bits this would be 0xff80. If
 * you do out the computations:
 *
 * 0xffff - 128 + 1
 * 0xffff - 127
 * 0xff80
 *
 * You can then encode this value as the signed version. This is really rather
 * hacky, but it should work and get the job done which is our goal here.
 */

/*
 * A series of checks to make sure we actually have a signed 32-bit number
 */
function verifsint(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');

  assert.ok(Math.floor(value) === value, 'value has a fractional component');
}

function verifIEEE754(value, max, min) {
  assert.ok(typeof (value) == 'number',
      'cannot write a non-number as a number');

  assert.ok(value <= max, 'value larger than maximum allowed value');

  assert.ok(value >= min, 'value smaller than minimum allowed value');
}

Buffer.prototype.writeInt8 = function(value, offset, noAssert) {
  var buffer = this;

  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7f, -0x80);
  }

  if (value >= 0) {
    buffer.writeUInt8(value, offset, noAssert);
  } else {
    buffer.writeUInt8(0xff + value + 1, offset, noAssert);
  }
};

function writeInt16(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 1 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fff, -0x8000);
  }

  if (value >= 0) {
    writeUInt16(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt16(buffer, 0xffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt16LE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt16BE = function(value, offset, noAssert) {
  writeInt16(this, value, offset, true, noAssert);
};

function writeInt32(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifsint(value, 0x7fffffff, -0x80000000);
  }

  if (value >= 0) {
    writeUInt32(buffer, value, offset, isBigEndian, noAssert);
  } else {
    writeUInt32(buffer, 0xffffffff + value + 1, offset, isBigEndian, noAssert);
  }
}

Buffer.prototype.writeInt32LE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, false, noAssert);
};

Buffer.prototype.writeInt32BE = function(value, offset, noAssert) {
  writeInt32(this, value, offset, true, noAssert);
};

function writeFloat(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 3 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      23, 4);
}

Buffer.prototype.writeFloatLE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, false, noAssert);
};

Buffer.prototype.writeFloatBE = function(value, offset, noAssert) {
  writeFloat(this, value, offset, true, noAssert);
};

function writeDouble(buffer, value, offset, isBigEndian, noAssert) {
  if (!noAssert) {
    assert.ok(value !== undefined && value !== null,
        'missing value');

    assert.ok(typeof (isBigEndian) === 'boolean',
        'missing or invalid endian');

    assert.ok(offset !== undefined && offset !== null,
        'missing offset');

    assert.ok(offset + 7 < buffer.length,
        'Trying to write beyond buffer length');

    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308);
  }

  require('./buffer_ieee754').writeIEEE754(buffer, value, offset, isBigEndian,
      52, 8);
}

Buffer.prototype.writeDoubleLE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, false, noAssert);
};

Buffer.prototype.writeDoubleBE = function(value, offset, noAssert) {
  writeDouble(this, value, offset, true, noAssert);
};

SlowBuffer.prototype.readUInt8 = Buffer.prototype.readUInt8;
SlowBuffer.prototype.readUInt16LE = Buffer.prototype.readUInt16LE;
SlowBuffer.prototype.readUInt16BE = Buffer.prototype.readUInt16BE;
SlowBuffer.prototype.readUInt32LE = Buffer.prototype.readUInt32LE;
SlowBuffer.prototype.readUInt32BE = Buffer.prototype.readUInt32BE;
SlowBuffer.prototype.readInt8 = Buffer.prototype.readInt8;
SlowBuffer.prototype.readInt16LE = Buffer.prototype.readInt16LE;
SlowBuffer.prototype.readInt16BE = Buffer.prototype.readInt16BE;
SlowBuffer.prototype.readInt32LE = Buffer.prototype.readInt32LE;
SlowBuffer.prototype.readInt32BE = Buffer.prototype.readInt32BE;
SlowBuffer.prototype.readFloatLE = Buffer.prototype.readFloatLE;
SlowBuffer.prototype.readFloatBE = Buffer.prototype.readFloatBE;
SlowBuffer.prototype.readDoubleLE = Buffer.prototype.readDoubleLE;
SlowBuffer.prototype.readDoubleBE = Buffer.prototype.readDoubleBE;
SlowBuffer.prototype.writeUInt8 = Buffer.prototype.writeUInt8;
SlowBuffer.prototype.writeUInt16LE = Buffer.prototype.writeUInt16LE;
SlowBuffer.prototype.writeUInt16BE = Buffer.prototype.writeUInt16BE;
SlowBuffer.prototype.writeUInt32LE = Buffer.prototype.writeUInt32LE;
SlowBuffer.prototype.writeUInt32BE = Buffer.prototype.writeUInt32BE;
SlowBuffer.prototype.writeInt8 = Buffer.prototype.writeInt8;
SlowBuffer.prototype.writeInt16LE = Buffer.prototype.writeInt16LE;
SlowBuffer.prototype.writeInt16BE = Buffer.prototype.writeInt16BE;
SlowBuffer.prototype.writeInt32LE = Buffer.prototype.writeInt32LE;
SlowBuffer.prototype.writeInt32BE = Buffer.prototype.writeInt32BE;
SlowBuffer.prototype.writeFloatLE = Buffer.prototype.writeFloatLE;
SlowBuffer.prototype.writeFloatBE = Buffer.prototype.writeFloatBE;
SlowBuffer.prototype.writeDoubleLE = Buffer.prototype.writeDoubleLE;
SlowBuffer.prototype.writeDoubleBE = Buffer.prototype.writeDoubleBE;

},{"assert":1,"./buffer_ieee754":8,"base64-js":9}],9:[function(require,module,exports){
(function (exports) {
	'use strict';

	var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	function b64ToByteArray(b64) {
		var i, j, l, tmp, placeHolders, arr;
	
		if (b64.length % 4 > 0) {
			throw 'Invalid string. Length must be a multiple of 4';
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		placeHolders = b64.indexOf('=');
		placeHolders = placeHolders > 0 ? b64.length - placeHolders : 0;

		// base64 is 4/3 + up to two characters of the original data
		arr = [];//new Uint8Array(b64.length * 3 / 4 - placeHolders);

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length;

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (lookup.indexOf(b64[i]) << 18) | (lookup.indexOf(b64[i + 1]) << 12) | (lookup.indexOf(b64[i + 2]) << 6) | lookup.indexOf(b64[i + 3]);
			arr.push((tmp & 0xFF0000) >> 16);
			arr.push((tmp & 0xFF00) >> 8);
			arr.push(tmp & 0xFF);
		}

		if (placeHolders === 2) {
			tmp = (lookup.indexOf(b64[i]) << 2) | (lookup.indexOf(b64[i + 1]) >> 4);
			arr.push(tmp & 0xFF);
		} else if (placeHolders === 1) {
			tmp = (lookup.indexOf(b64[i]) << 10) | (lookup.indexOf(b64[i + 1]) << 4) | (lookup.indexOf(b64[i + 2]) >> 2);
			arr.push((tmp >> 8) & 0xFF);
			arr.push(tmp & 0xFF);
		}

		return arr;
	}

	function uint8ToBase64(uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length;

		function tripletToBase64 (num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
		};

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
			output += tripletToBase64(temp);
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1];
				output += lookup[temp >> 2];
				output += lookup[(temp << 4) & 0x3F];
				output += '==';
				break;
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
				output += lookup[temp >> 10];
				output += lookup[(temp >> 4) & 0x3F];
				output += lookup[(temp << 2) & 0x3F];
				output += '=';
				break;
		}

		return output;
	}

	module.exports.toByteArray = b64ToByteArray;
	module.exports.fromByteArray = uint8ToBase64;
}());

},{}]},{},[])
;;module.exports=require("buffer-browserify")

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],5:[function(require,module,exports){
/**
 * Manage access to data, be it to find, update or remove it
 */
var model = require('./model');

 

/**
 * Create a new cursor for this collection
 * @param {Datastore} db - The datastore this cursor is bound to
 * @param {Query} query - The query this cursor will operate on
 * @param {Function} execDn - Handler to be executed  after cursor has found the results and before the callback passed to find/findOne/update/remove
 */
function Cursor (db, query, execFn) {
  this.db = db;
  this.query = query || {};
  if (execFn) { this.execFn = execFn; }
}


/**
 * Set a limit to the number of results
 */
Cursor.prototype.limit = function(limit) {
  this._limit = limit;
  return this;
};


/**
 * Skip a the number of results
 */
Cursor.prototype.skip = function(skip) {
  this._skip = skip;
  return this;
};

/**
 * Aggregate on results
 */
Cursor.prototype.group = function (group) {
  this._group = group;
  return this;
};

/**
 * Sort results of the query
 * @Param {SortQuery} sortQuery - SortQuery is { field: order }, field can use the dot-notation, order is 1 for ascending and -1 for descending
 */
Cursor.prototype.sort = function(sortQuery) {
  this._sort = sortQuery;
  return this;
};


/**
 * Get all matching elements
 * Will return pointers to matched elements (shallow copies), returning full copies is the role of find or findOne
 * This is an internal function, use exec which uses the executor
 *
 * @param {Function} callback - Signature: err, results
 */
Cursor.prototype._exec = function(callback) {
  var candidates = this.db.getCandidates(this.query)
    , res = [], added = 0, skipped = 0, self = this
    , i, keys, key
    ;
  
  try {
    for (i = 0; i < candidates.length; i += 1) {
      if (model.match(candidates[i], this.query)) {
        // If a sort is defined, wait for the results to be sorted before applying limit and skip
        if (!this._sort && !this._group) {
          if (this._skip && this._skip > skipped) {
            skipped += 1;
          } else {
            res.push(candidates[i]);
            added += 1;
            if (this._limit && this._limit <= added) { break; }                  
          }
        } else {
          res.push(candidates[i]);
        }
      }
    }
  } catch (err) {
    return callback(err);
  }

  //Apply grouping
  if (this._group) {
    try {
      res = model.aggregate(res, this._group);
    } catch (err) {
      return callback(err);
    }
  }

  // Apply all sorts
  if (this._sort) {
    keys = Object.keys(this._sort);
    
    // Going backwards so that the first sort is the last that gets applied
    for (i = keys.length - 1; i >= 0; i -= 1) {
      key = keys[i];
      res.sort(function(a, b) {
        return self._sort[key] * model.compareThings(model.getDotValue(a, key), model.getDotValue(b, key));
      });    
    }
  }

  // Applying limit and skip
  if (this._sort || this._group) {
    var limit = this._limit || res.length,
    skip = this._skip || 0;

    res = res.slice(skip, skip + limit);
  }

  if (this.execFn) {
    return this.execFn(null, res, callback);
  } else {
    return callback(null, res);
  }
};

Cursor.prototype.exec = function () {
  this.db.executor.push({ this: this, fn: this._exec, arguments: arguments });
};



// Interface
module.exports = Cursor;
},{"./model":10}],6:[function(require,module,exports){
/**
 * Specific customUtils for the browser, where we don't have access to the Crypto and Buffer modules
 */

/**
 * Taken from the crypto-browserify module
 * https://github.com/dominictarr/crypto-browserify
 * NOTE: Math.random() does not guarantee "cryptographic quality" but we actually don't need it
 */
function randomBytes (size) {
  var bytes = new Array(size);
  var r;

  for (var i = 0, r; i < size; i++) {
    if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
    bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
  }

  return bytes;
}


/**
 * Taken from the base64-js module
 * https://github.com/beatgammit/base64-js/
 */
function byteArrayToBase64 (uint8) {
  var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    , extraBytes = uint8.length % 3   // if we have 1 byte left, pad 2 bytes
    , output = ""
    , temp, length, i;

  function tripletToBase64 (num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  };

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
    temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
    output += tripletToBase64(temp);
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  switch (extraBytes) {
    case 1:
      temp = uint8[uint8.length - 1];
      output += lookup[temp >> 2];
      output += lookup[(temp << 4) & 0x3F];
      output += '==';
      break;
    case 2:
      temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1]);
      output += lookup[temp >> 10];
      output += lookup[(temp >> 4) & 0x3F];
      output += lookup[(temp << 2) & 0x3F];
      output += '=';
      break;
  }

  return output;
}


/**
 * Return a random alphanumerical string of length len
 * There is a very small probability (less than 1/1,000,000) for the length to be less than len
 * (il the base64 conversion yields too many pluses and slashes) but
 * that's not an issue here
 * The probability of a collision is extremely small (need 3*10^12 documents to have one chance in a million of a collision)
 * See http://en.wikipedia.org/wiki/Birthday_problem
 */
function uid (len) {
  return byteArrayToBase64(randomBytes(Math.ceil(Math.max(8, len * 2)))).replace(/[+\/]/g, '').slice(0, len);
}



module.exports.uid = uid;

},{}],7:[function(require,module,exports){
var customUtils = require('./customUtils')
  , model = require('./model')
  , async = require('async')
  , Executor = require('./executor')
  , Index = require('./indexes')
  , util = require('util')
  , _ = require('underscore')
  , Persistence = require('./persistence')
  , Cursor = require('./cursor')
  ;


/**
 * Create a new collection
 * @param {String} options.filename Optional, datastore will be in-memory only if not provided
 * @param {Boolean} options.inMemoryOnly Optional, default to false
 * @param {Boolean} options.nodeWebkitAppName Optional, specify the name of your NW app if you want options.filename to be relative to the directory where
 *                                            Node Webkit stores application data such as cookies and local storage (the best place to store data in my opinion)
 * @param {Boolean} options.autoload Optional, defaults to false
 * @param {Function} options.onload Optional, if autoload is used this will be called after the load database with the error object as parameter. If you don't pass it the error will be thrown
 */
function Datastore (options) {
  var filename;

  // Retrocompatibility with v0.6 and before
  if (typeof options === 'string') {
    filename = options;
    this.inMemoryOnly = false;   // Default
  } else {
    options = options || {};
    filename = options.filename;
    this.inMemoryOnly = options.inMemoryOnly || false;
    this.autoload = options.autoload || false;
  }

  // Determine whether in memory or persistent
  if (!filename || typeof filename !== 'string' || filename.length === 0) {
    this.filename = null;
    this.inMemoryOnly = true;
  } else {
    this.filename = filename;
  }

  // Persistence handling
  this.persistence = new Persistence({ db: this, nodeWebkitAppName: options.nodeWebkitAppName });

  // This new executor is ready if we don't use persistence
  // If we do, it will only be ready once loadDatabase is called
  this.executor = new Executor();
  if (this.inMemoryOnly) { this.executor.ready = true; }

  // Indexed by field name, dot notation can be used
  // _id is always indexed and since _ids are generated randomly the underlying
  // binary is always well-balanced
  this.indexes = {};
  this.indexes._id = new Index({ fieldName: '_id', unique: true });
  
  // Queue a load of the database right away and call the onload handler
  // By default (no onload handler), if there is an error there, no operation will be possible so warn the user by throwing an exception
  if (this.autoload) { this.loadDatabase(options.onload || function (err) {
    if (err) { throw err; }
  }); }
}


/**
 * Load the database from the datafile, and trigger the execution of buffered commands if any
 */
Datastore.prototype.loadDatabase = function () {
  this.executor.push({ this: this.persistence, fn: this.persistence.loadDatabase, arguments: arguments }, true);
};


/**
 * Get an array of all the data in the database
 */
Datastore.prototype.getAllData = function () {
  return this.indexes._id.getAll();
};


/**
 * Reset all currently defined indexes
 */
Datastore.prototype.resetIndexes = function (newData) {
  var self = this;

  Object.keys(this.indexes).forEach(function (i) {
    self.indexes[i].reset(newData);
  });
};


/**
 * Ensure an index is kept for this field. Same parameters as lib/indexes
 * For now this function is synchronous, we need to test how much time it takes
 * We use an async API for consistency with the rest of the code
 * @param {String} options.fieldName
 * @param {Boolean} options.unique
 * @param {Boolean} options.sparse
 * @param {Function} cb Optional callback, signature: err
 */
Datastore.prototype.ensureIndex = function (options, cb) {
  var callback = cb || function () {};

  options = options || {};

  if (!options.fieldName) { return callback({ missingFieldName: true }); }
  if (this.indexes[options.fieldName]) { return callback(null); }

  this.indexes[options.fieldName] = new Index(options);

  try {
    this.indexes[options.fieldName].insert(this.getAllData());
  } catch (e) {
    delete this.indexes[options.fieldName];
    return callback(e);
  }

  this.persistence.persistNewState([{ $$indexCreated: options }], function (err) {
    if (err) { return callback(err); }
    return callback(null);
  });
};


/**
 * Remove an index
 * @param {String} fieldName
 * @param {Function} cb Optional callback, signature: err 
 */
Datastore.prototype.removeIndex = function (fieldName, cb) {
  var callback = cb || function () {};
  
  delete this.indexes[fieldName];
  
  this.persistence.persistNewState([{ $$indexRemoved: fieldName }], function (err) {
    if (err) { return callback(err); }
    return callback(null);
  });  
};


/**
 * Add one or several document(s) to all indexes
 */
Datastore.prototype.addToIndexes = function (doc) {
  var i, failingIndex, error
    , keys = Object.keys(this.indexes)
    ;

  for (i = 0; i < keys.length; i += 1) {
    try {
      this.indexes[keys[i]].insert(doc);
    } catch (e) {
      failingIndex = i;
      error = e;
      break;
    }
  }

  // If an error happened, we need to rollback the insert on all other indexes
  if (error) {
    for (i = 0; i < failingIndex; i += 1) {
      this.indexes[keys[i]].remove(doc);
    }

    throw error;
  }
};


/**
 * Remove one or several document(s) from all indexes
 */
Datastore.prototype.removeFromIndexes = function (doc) {
  var self = this;

  Object.keys(this.indexes).forEach(function (i) {
    self.indexes[i].remove(doc);
  });
};


/**
 * Update one or several documents in all indexes
 * To update multiple documents, oldDoc must be an array of { oldDoc, newDoc } pairs
 * If one update violates a constraint, all changes are rolled back
 */
Datastore.prototype.updateIndexes = function (oldDoc, newDoc) {
  var i, failingIndex, error
    , keys = Object.keys(this.indexes)
    ;

  for (i = 0; i < keys.length; i += 1) {
    try {
      this.indexes[keys[i]].update(oldDoc, newDoc);
    } catch (e) {
      failingIndex = i;
      error = e;
      break;
    }
  }

  // If an error happened, we need to rollback the update on all other indexes
  if (error) {
    for (i = 0; i < failingIndex; i += 1) {
      this.indexes[keys[i]].revertUpdate(oldDoc, newDoc);
    }

    throw error;
  }
};


/**
 * Return the list of candidates for a given query
 * Crude implementation for now, we return the candidates given by the first usable index if any
 * We try the following query types, in this order: basic match, $in match, comparison match
 * One way to make it better would be to enable the use of multiple indexes if the first usable index
 * returns too much data. I may do it in the future.
 *
 * TODO: needs to be moved to the Cursor module
 */
Datastore.prototype.getCandidates = function (query) {
  var indexNames = Object.keys(this.indexes)
    , usableQueryKeys;

  // For a basic match
  usableQueryKeys = [];
  Object.keys(query).forEach(function (k) {
    if (typeof query[k] === 'string' || typeof query[k] === 'number' || typeof query[k] === 'boolean' || util.isDate(query[k]) || query[k] === null) {
      usableQueryKeys.push(k);
    }
  });
  usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
  if (usableQueryKeys.length > 0) {
    return this.indexes[usableQueryKeys[0]].getMatching(query[usableQueryKeys[0]]);
  }

  // For a $in match
  usableQueryKeys = [];
  Object.keys(query).forEach(function (k) {
    if (query[k] && query[k].hasOwnProperty('$in')) {
      usableQueryKeys.push(k);
    }
  });
  usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
  if (usableQueryKeys.length > 0) {
    return this.indexes[usableQueryKeys[0]].getMatching(query[usableQueryKeys[0]].$in);
  }

  // For a comparison match
  usableQueryKeys = [];
  Object.keys(query).forEach(function (k) {
    if (query[k] && (query[k].hasOwnProperty('$lt') || query[k].hasOwnProperty('$lte') || query[k].hasOwnProperty('$gt') || query[k].hasOwnProperty('$gte'))) {
      usableQueryKeys.push(k);
    }
  });
  usableQueryKeys = _.intersection(usableQueryKeys, indexNames);
  if (usableQueryKeys.length > 0) {
    return this.indexes[usableQueryKeys[0]].getBetweenBounds(query[usableQueryKeys[0]]);
  }

  // By default, return all the DB data
  return this.getAllData();
};


/**
 * Insert a new document
 * @param {Function} cb Optional callback, signature: err, insertedDoc
 *
 * @api private Use Datastore.insert which has the same signature
 */
Datastore.prototype._insert = function (newDoc, cb) {
  var callback = cb || function () {}
    ;

  try {
    this._insertInCache(newDoc);
  } catch (e) {
    return callback(e);
  }

  this.persistence.persistNewState(util.isArray(newDoc) ? newDoc : [newDoc], function (err) {
    if (err) { return callback(err); }
    return callback(null, newDoc);
  });
};

/**
 * Prepare a document (or array of documents) to be inserted in a database
 * @api private
 */
Datastore.prototype.prepareDocumentForInsertion = function (newDoc) {
  var preparedDoc, self = this;

  if (util.isArray(newDoc)) {
    preparedDoc = [];
    newDoc.forEach(function (doc) { preparedDoc.push(self.prepareDocumentForInsertion(doc)); });
  } else {
    newDoc._id = customUtils.uid(16);
    preparedDoc = model.deepCopy(newDoc);
    model.checkObject(preparedDoc);
  }
  
  return preparedDoc;
};

/**
 * If newDoc is an array of documents, this will insert all documents in the cache
 * @api private
 */
Datastore.prototype._insertInCache = function (newDoc) {
  if (util.isArray(newDoc)) {
    this._insertMultipleDocsInCache(newDoc);
  } else {
    this.addToIndexes(this.prepareDocumentForInsertion(newDoc));  
  }
};

/**
 * If one insertion fails (e.g. because of a unique constraint), roll back all previous
 * inserts and throws the error
 * @api private
 */
Datastore.prototype._insertMultipleDocsInCache = function (newDocs) {
  var i, failingI, error
    , preparedDocs = this.prepareDocumentForInsertion(newDocs)
    ;
  
  for (i = 0; i < preparedDocs.length; i += 1) {
    try {
      this.addToIndexes(preparedDocs[i]);
    } catch (e) {
      error = e;
      failingI = i;
      break;
    }
  }
  
  if (error) {
    for (i = 0; i < failingI; i += 1) {
      this.removeFromIndexes(preparedDocs[i]);
    }
    
    throw error;
  }
};

Datastore.prototype.insert = function () {
  this.executor.push({ this: this, fn: this._insert, arguments: arguments });
};


/**
 * Count all documents matching the query
 * @param {Object} query MongoDB-style query
 */
Datastore.prototype.count = function(query, callback) {
  var cursor = new Cursor(this, query, function(err, docs, callback) {
    if (err) { return callback(err); }
    return callback(null, docs.length);
  });

  if (typeof callback === 'function') {
    cursor.exec(callback);
  } else {
    return cursor;
  }
};


/**
 * Find all documents matching the query
 * If no callback is passed, we return the cursor so that user can limit, skip and finally exec
 * @param {Object} query MongoDB-style query
 */
Datastore.prototype.find = function (query, callback) {
  var cursor = new Cursor(this, query, function(err, docs, callback) {
    var res = [], i;
  
    if (err) { return callback(err); }
    
    for (i = 0; i < docs.length; i += 1) {
      res.push(model.deepCopy(docs[i]));
    }
    return callback(null, res);
  });

  if (typeof callback === 'function') {
    cursor.exec(callback);
  } else {
    return cursor;
  }
};


/**
 * Find one document matching the query
 * @param {Object} query MongoDB-style query
 */
Datastore.prototype.findOne = function (query, callback) {
  var cursor = new Cursor(this, query, function(err, docs, callback) {
    if (err) { return callback(err); }
    if (docs.length === 1) {
      return callback(null, model.deepCopy(docs[0]));
    } else {
      return callback(null, null);    
    }
  });

  cursor.limit(1);
  if (typeof callback === 'function') {
    cursor.exec(callback);
  } else {
    return cursor;
  }
};


/**
 * Update all docs matching query
 * For now, very naive implementation (recalculating the whole database)
 * @param {Object} query
 * @param {Object} updateQuery
 * @param {Object} options Optional options
 *                 options.multi If true, can update multiple documents (defaults to false)
 *                 options.upsert If true, document is inserted if the query doesn't match anything
 * @param {Function} cb Optional callback, signature: err, numReplaced, upsert (set to true if the update was in fact an upsert)
 *
 * @api private Use Datastore.update which has the same signature
 */
Datastore.prototype._update = function (query, updateQuery, options, cb) {
  var callback
    , self = this
    , numReplaced = 0
    , multi, upsert
    , i
    ;

  if (typeof options === 'function') { cb = options; options = {}; }
  callback = cb || function () {};
  multi = options.multi !== undefined ? options.multi : false;
  upsert = options.upsert !== undefined ? options.upsert : false;

  async.waterfall([
  function (cb) {   // If upsert option is set, check whether we need to insert the doc
    if (!upsert) { return cb(); }

    // Need to use an internal function not tied to the executor to avoid deadlock
    var cursor = new Cursor(self, query);
    cursor.limit(1)._exec(function (err, docs) {
      if (err) { return callback(err); }
      if (docs.length === 1) {
        return cb();
      } else {
        return self._insert(model.modify(query, updateQuery), function (err, newDoc) {
          if (err) { return callback(err); }
          return callback(null, 1, newDoc);
        });
      }
    });
  }
  , function () {   // Perform the update
    var modifiedDoc
	  , candidates = self.getCandidates(query)
	  , modifications = []
	  ;

	// Preparing update (if an error is thrown here neither the datafile nor
	// the in-memory indexes are affected)
    try {
      for (i = 0; i < candidates.length; i += 1) {
        if (model.match(candidates[i], query) && (multi || numReplaced === 0)) {
          numReplaced += 1;
          modifiedDoc = model.modify(candidates[i], updateQuery);
          modifications.push({ oldDoc: candidates[i], newDoc: modifiedDoc });
        }
      }
    } catch (err) {
      return callback(err);
    }
	
	// Change the docs in memory
	try {
      self.updateIndexes(modifications);
	} catch (err) {
	  return callback(err);
	}

	// Update the datafile
    self.persistence.persistNewState(_.pluck(modifications, 'newDoc'), function (err) {
      if (err) { return callback(err); }
      return callback(null, numReplaced);
    });
  }
  ]);
};
Datastore.prototype.update = function () {
  this.executor.push({ this: this, fn: this._update, arguments: arguments });
};


/**
 * Remove all docs matching the query
 * For now very naive implementation (similar to update)
 * @param {Object} query
 * @param {Object} options Optional options
 *                 options.multi If true, can update multiple documents (defaults to false)
 * @param {Function} cb Optional callback, signature: err, numRemoved
 *
 * @api private Use Datastore.remove which has the same signature
 */
Datastore.prototype._remove = function (query, options, cb) {
  var callback
    , self = this
    , numRemoved = 0
    , multi
    , removedDocs = []
    , candidates = this.getCandidates(query)
    ;

  if (typeof options === 'function') { cb = options; options = {}; }
  callback = cb || function () {};
  multi = options.multi !== undefined ? options.multi : false;

  try {
    candidates.forEach(function (d) {
      if (model.match(d, query) && (multi || numRemoved === 0)) {
        numRemoved += 1;
        removedDocs.push({ $$deleted: true, _id: d._id });
        self.removeFromIndexes(d);
      }
    });
  } catch (err) { return callback(err); }

  self.persistence.persistNewState(removedDocs, function (err) {
    if (err) { return callback(err); }
    return callback(null, numRemoved);
  });
};
Datastore.prototype.remove = function () {
  this.executor.push({ this: this, fn: this._remove, arguments: arguments });
};



module.exports = Datastore;

},{"./cursor":5,"./customUtils":6,"./executor":8,"./indexes":9,"./model":10,"./persistence":11,"async":12,"underscore":17,"util":2}],8:[function(require,module,exports){
var process=require("__browserify_process");/**
 * Responsible for sequentially executing actions on the database
 */

var async = require('async')
  ;

function Executor () {
  this.buffer = [];
  this.ready = false;

  // This queue will execute all commands, one-by-one in order
  this.queue = async.queue(function (task, cb) {
    var callback
      , lastArg = task.arguments[task.arguments.length - 1]
      , i, newArguments = []
      ;

    // task.arguments is an array-like object on which adding a new field doesn't work, so we transform it into a real array
    for (i = 0; i < task.arguments.length; i += 1) { newArguments.push(task.arguments[i]); }

    // Always tell the queue task is complete. Execute callback if any was given.
    if (typeof lastArg === 'function') {
      callback = function () {
        process.nextTick(cb);
        lastArg.apply(null, arguments);
      };

      newArguments[newArguments.length - 1] = callback;
    } else {
      callback = function () { cb(); };
      newArguments.push(callback);
    }


    task.fn.apply(task.this, newArguments);
  }, 1);
}


/**
 * If executor is ready, queue task (and process it immediately if executor was idle)
 * If not, buffer task for later processing
 * @param {Object} task
 *                 task.this - Object to use as this
 *                 task.fn - Function to execute
 *                 task.arguments - Array of arguments
 * @param {Boolean} forceQueuing Optional (defaults to false) force executor to queue task even if it is not ready
 */
Executor.prototype.push = function (task, forceQueuing) {
  if (this.ready || forceQueuing) {
    this.queue.push(task);
  } else {
    this.buffer.push(task);
  }
};


/**
 * Queue all tasks in buffer (in the same order they came in)
 * Automatically sets executor as ready
 */
Executor.prototype.processBuffer = function () {
  var i;
  this.ready = true;
  for (i = 0; i < this.buffer.length; i += 1) { this.queue.push(this.buffer[i]); }
  this.buffer = [];
};



// Interface
module.exports = Executor;

},{"__browserify_process":4,"async":12}],9:[function(require,module,exports){
var BinarySearchTree = require('binary-search-tree').AVLTree
  , model = require('./model')
  , _ = require('underscore')
  , util = require('util')
  ;

/**
 * Two indexed pointers are equal iif they point to the same place
 */
function checkValueEquality (a, b) {
  return a === b;
}

/**
 * Type-aware projection
 */
function projectForUnique (elt) {
  if (elt === null) { return '$null'; }
  if (typeof elt === 'string') { return '$string' + elt; }
  if (typeof elt === 'boolean') { return '$boolean' + elt; }
  if (typeof elt === 'number') { return '$number' + elt; }
  if (util.isArray(elt)) { return '$date' + elt.getTime(); }
  
  return elt;   // Arrays and objects, will check for pointer equality
}


/**
 * Create a new index
 * All methods on an index guarantee that either the whole operation was successful and the index changed
 * or the operation was unsuccessful and an error is thrown while the index is unchanged
 * @param {String} options.fieldName On which field should the index apply (can use dot notation to index on sub fields)
 * @param {Boolean} options.unique Optional, enforce a unique constraint (default: false)
 * @param {Boolean} options.sparse Optional, allow a sparse index (we can have documents for which fieldName is undefined) (default: false)
 */
function Index (options) {
  this.fieldName = options.fieldName;
  this.unique = options.unique || false;
  this.sparse = options.sparse || false;

  this.treeOptions = { unique: this.unique, compareKeys: model.compareThings, checkValueEquality: checkValueEquality };

  this.reset();   // No data in the beginning
}


/**
 * Reset an index
 * @param {Document or Array of documents} newData Optional, data to initialize the index with
 *                                                 If an error is thrown during insertion, the index is not modified
 */
Index.prototype.reset = function (newData) {
  this.tree = new BinarySearchTree(this.treeOptions);

  if (newData) { this.insert(newData); }
};


/**
 * Insert a new document in the index
 * If an array is passed, we insert all its elements (if one insertion fails the index is not modified)
 * O(log(n))
 */
Index.prototype.insert = function (doc) {
  var key, self = this
    , keys, i, failingI, error
    ;

  if (util.isArray(doc)) { this.insertMultipleDocs(doc); return; }

  key = model.getDotValue(doc, this.fieldName);

  // We don't index documents that don't contain the field if the index is sparse
  if (key === undefined && this.sparse) { return; }

  if (!util.isArray(key)) {
    this.tree.insert(key, doc);
  } else {
    // If an insert fails due to a unique constraint, roll back all inserts before it
    keys = _.uniq(key, projectForUnique);

    for (i = 0; i < keys.length; i += 1) {
      try {
        this.tree.insert(keys[i], doc);
      } catch (e) {
        error = e;
        failingI = i;
        break;
      }
    }
    
    if (error) {
      for (i = 0; i < failingI; i += 1) {
        this.tree.delete(keys[i], doc);
      }
      
      throw error;
    }
  }
};


/**
 * Insert an array of documents in the index
 * If a constraint is violated, the changes should be rolled back and an error thrown
 *
 * @API private
 */
Index.prototype.insertMultipleDocs = function (docs) {
  var i, error, failingI;

  for (i = 0; i < docs.length; i += 1) {
    try {
      this.insert(docs[i]);
    } catch (e) {
      error = e;
      failingI = i;
      break;
    }
  }

  if (error) {
    for (i = 0; i < failingI; i += 1) {
      this.remove(docs[i]);
    }

    throw error;
  }
};


/**
 * Remove a document from the index
 * If an array is passed, we remove all its elements
 * The remove operation is safe with regards to the 'unique' constraint
 * O(log(n))
 */
Index.prototype.remove = function (doc) {
  var key, self = this;

  if (util.isArray(doc)) { doc.forEach(function (d) { self.remove(d); }); return; }

  key = model.getDotValue(doc, this.fieldName);

  if (key === undefined && this.sparse) { return; }

  if (!util.isArray(key)) {
    this.tree.delete(key, doc);
  } else {
    _.uniq(key, projectForUnique).forEach(function (_key) {
      self.tree.delete(_key, doc);
    });
  }
};


/**
 * Update a document in the index
 * If a constraint is violated, changes are rolled back and an error thrown
 * Naive implementation, still in O(log(n))
 */
Index.prototype.update = function (oldDoc, newDoc) {
  if (util.isArray(oldDoc)) { this.updateMultipleDocs(oldDoc); return; }

  this.remove(oldDoc);

  try {
    this.insert(newDoc);
  } catch (e) {
    this.insert(oldDoc);
    throw e;
  }
};


/**
 * Update multiple documents in the index
 * If a constraint is violated, the changes need to be rolled back
 * and an error thrown
 * @param {Array of oldDoc, newDoc pairs} pairs
 *
 * @API private
 */
Index.prototype.updateMultipleDocs = function (pairs) {
  var i, failingI, error;

  for (i = 0; i < pairs.length; i += 1) {
    this.remove(pairs[i].oldDoc);
  }

  for (i = 0; i < pairs.length; i += 1) {
    try {
      this.insert(pairs[i].newDoc);
    } catch (e) {
      error = e;
      failingI = i;
      break;
    }
  }

  // If an error was raised, roll back changes in the inverse order
  if (error) {
    for (i = 0; i < failingI; i += 1) {
      this.remove(pairs[i].newDoc);
    }

    for (i = 0; i < pairs.length; i += 1) {
      this.insert(pairs[i].oldDoc);
    }

    throw error;
  }
};


/**
 * Revert an update
 */
Index.prototype.revertUpdate = function (oldDoc, newDoc) {
  var revert = [];

  if (!util.isArray(oldDoc)) {
    this.update(newDoc, oldDoc);
  } else {
    oldDoc.forEach(function (pair) {
      revert.push({ oldDoc: pair.newDoc, newDoc: pair.oldDoc });
    });
    this.update(revert);
  }
};


// Append all elements in toAppend to array
function append (array, toAppend) {
  var i;

  for (i = 0; i < toAppend.length; i += 1) {
    array.push(toAppend[i]);
  }
}


/**
 * Get all documents in index whose key match value (if it is a Thing) or one of the elements of value (if it is an array of Things)
 * @param {Thing} value Value to match the key against
 * @return {Array of documents}
 */
Index.prototype.getMatching = function (value) {
  var res, self = this;

  if (!util.isArray(value)) {
    return this.tree.search(value);
  } else {
    res = [];
    value.forEach(function (v) { append(res, self.getMatching(v)); });
    return res;
  }
};


/**
 * Get all documents in index whose key is between bounds are they are defined by query
 * Documents are sorted by key
 * @param {Query} query
 * @return {Array of documents}
 */
Index.prototype.getBetweenBounds = function (query) {
  return this.tree.betweenBounds(query);
};


/**
 * Get all elements in the index
 * @return {Array of documents}
 */
Index.prototype.getAll = function () {
  var res = [];

  this.tree.executeOnEveryNode(function (node) {
    var i;

    for (i = 0; i < node.data.length; i += 1) {
      res.push(node.data[i]);
    }
  });

  return res;
};




// Interface
module.exports = Index;

},{"./model":10,"binary-search-tree":13,"underscore":17,"util":2}],10:[function(require,module,exports){
/**
 * Handle models (i.e. docs)
 * Serialization/deserialization
 * Copying
 * Querying, update
 */

var dateToJSON = function () { return { $$date: this.getTime() }; }
  , originalDateToJSON = Date.prototype.toJSON
  , util = require('util')
  , _ = require('underscore')
  // , XXHash = require('xxhash')
  , XXHash = require('xxhashjs')
  , modifierFunctions = {}
  , lastStepModifierFunctions = {}
  , comparisonFunctions = {}
  , logicalOperators = {}
  , arrayComparisonFunctions = {}
  ;


/**
 * Check a key, throw an error if the key is non valid
 * @param {String} k key
 * @param {Model} v value, needed to treat the Date edge case
 * Non-treatable edge cases here: if part of the object if of the form { $$date: number } or { $$deleted: true }
 * Its serialized-then-deserialized version it will transformed into a Date object
 * But you really need to want it to trigger such behaviour, even when warned not to use '$' at the beginning of the field names...
 */
function checkKey (k, v) {
  if (k[0] === '$' && !(k === '$$date' && typeof v === 'number') && !(k === '$$deleted' && v === true) && !(k === '$$indexCreated') && !(k === '$$indexRemoved')) {
    throw 'Field names cannot begin with the $ character';
  }

  if (k.indexOf('.') !== -1) {
    throw 'Field names cannot contain a .';
  }
}


/**
 * Check a DB object and throw an error if it's not valid
 * Works by applying the above checkKey function to all fields recursively
 */
function checkObject (obj) {
  if (util.isArray(obj)) {
    obj.forEach(function (o) {
      checkObject(o);
    });
  }

  if (typeof obj === 'object' && obj !== null) {
    Object.keys(obj).forEach(function (k) {
      checkKey(k, obj[k]);
      checkObject(obj[k]);
    });
  }
}


/**
 * Serialize an object to be persisted to a one-line string
 * For serialization/deserialization, we use the native JSON parser and not eval or Function
 * That gives us less freedom but data entered in the database may come from users
 * so eval and the like are not safe
 * Accepted primitive types: Number, String, Boolean, Date, null
 * Accepted secondary types: Objects, Arrays
 */
function serialize (obj) {
  var res;

  // Keep track of the fact that this is a Date object
  Date.prototype.toJSON = dateToJSON;

  res = JSON.stringify(obj, function (k, v) {
    checkKey(k, v);

    if (typeof v === undefined) { return null; }
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) { return v; }

    return v;
  });

  // Return Date to its original state
  Date.prototype.toJSON = originalDateToJSON;

  return res;
}


/**
 * From a one-line representation of an object generate by the serialize function
 * Return the object itself
 */
function deserialize (rawData) {
  return JSON.parse(rawData, function (k, v) {
    if (k === '$$date') { return new Date(v); }
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) { return v; }
    if (v && v.$$date) { return v.$$date; }

    return v;
  });
}


/**
 * Deep copy a DB object
 */
function deepCopy (obj) {
  var res;

  if ( typeof obj === 'boolean' ||
       typeof obj === 'number' ||
       typeof obj === 'string' ||
       obj === null ||
       (util.isDate(obj)) ) {
    return obj;
  }

  if (util.isArray(obj)) {
    res = [];
    obj.forEach(function (o) { res.push(o); });
    return res;
  }

  if (typeof obj === 'object') {
    res = {};
    Object.keys(obj).forEach(function (k) {
      res[k] = deepCopy(obj[k]);
    });
    return res;
  }

  return undefined;   // For now everything else is undefined. We should probably throw an error instead
}


/**
 * Tells if an object is a primitive type or a "real" object
 * Arrays are considered primitive
 */
function isPrimitiveType (obj) {
  return ( typeof obj === 'boolean' ||
       typeof obj === 'number' ||
       typeof obj === 'string' ||
       obj === null ||
       util.isDate(obj) ||
       util.isArray(obj));
}


/**
 * Utility functions for comparing things
 * Assumes type checking was already done (a and b already have the same type)
 * compareNSB works for numbers, strings and booleans
 */
function compareNSB (a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
}

function compareArrays (a, b) {
  var i, comp;

  for (i = 0; i < Math.min(a.length, b.length); i += 1) {
    comp = compareThings(a[i], b[i]);

    if (comp !== 0) { return comp; }
  }

  // Common section was identical, longest one wins
  return compareNSB(a.length, b.length);
}


/**
 * Compare { things U undefined }
 * Things are defined as any native types (string, number, boolean, null, date) and objects
 * We need to compare with undefined as it will be used in indexes
 * In the case of objects and arrays, we deep-compare
 * If two objects dont have the same type, the (arbitrary) type hierarchy is: undefined, null, number, strings, boolean, dates, arrays, objects
 * Return -1 if a < b, 1 if a > b and 0 if a = b (note that equality here is NOT the same as defined in areThingsEqual!)
 */
function compareThings (a, b) {
  var aKeys, bKeys, comp, i;

  // undefined
  if (a === undefined) { return b === undefined ? 0 : -1; }
  if (b === undefined) { return a === undefined ? 0 : 1; }

  // null
  if (a === null) { return b === null ? 0 : -1; }
  if (b === null) { return a === null ? 0 : 1; }

  // Numbers
  if (typeof a === 'number') { return typeof b === 'number' ? compareNSB(a, b) : -1; }
  if (typeof b === 'number') { return typeof a === 'number' ? compareNSB(a, b) : 1; }

  // Strings
  if (typeof a === 'string') { return typeof b === 'string' ? compareNSB(a, b) : -1; }
  if (typeof b === 'string') { return typeof a === 'string' ? compareNSB(a, b) : 1; }

  // Booleans
  if (typeof a === 'boolean') { return typeof b === 'boolean' ? compareNSB(a, b) : -1; }
  if (typeof b === 'boolean') { return typeof a === 'boolean' ? compareNSB(a, b) : 1; }

  // Dates
  if (util.isDate(a)) { return util.isDate(b) ? compareNSB(a.getTime(), b.getTime()) : -1; }
  if (util.isDate(b)) { return util.isDate(a) ? compareNSB(a.getTime(), b.getTime()) : 1; }

  // Arrays (first element is most significant and so on)
  if (util.isArray(a)) { return util.isArray(b) ? compareArrays(a, b) : -1; }
  if (util.isArray(b)) { return util.isArray(a) ? compareArrays(a, b) : 1; }

  // Objects
  aKeys = Object.keys(a).sort();
  bKeys = Object.keys(b).sort();

  for (i = 0; i < Math.min(aKeys.length, bKeys.length); i += 1) {
    comp = compareThings(a[aKeys[i]], b[bKeys[i]]);

    if (comp !== 0) { return comp; }
  }

  return compareNSB(aKeys.length, bKeys.length);
}



// ==============================================================
// Updating documents
// ==============================================================

/**
 * The signature of modifier functions is as follows
 * Their structure is always the same: recursively follow the dot notation while creating
 * the nested documents if needed, then apply the "last step modifier"
 * @param {Object} obj The model to modify
 * @param {String} field Can contain dots, in that case that means we will set a subfield recursively
 * @param {Model} value
 */

/**
 * Set a field to a new value
 */
lastStepModifierFunctions.$set = function (obj, field, value) {
  obj[field] = value;
};


/**
 * Unset a field
 */
lastStepModifierFunctions.$unset = function (obj, field, value) {
  delete obj[field];
};


/**
 * Push an element to the end of an array field
 */
lastStepModifierFunctions.$push = function (obj, field, value) {
  // Create the array if it doesn't exist
  if (!obj.hasOwnProperty(field)) { obj[field] = []; }

  if (!util.isArray(obj[field])) { throw "Can't $push an element on non-array values"; }

  if (value !== null && typeof value === 'object' && value.$each) {
    if (Object.keys(value).length > 1) { throw "Can't use another field in conjunction with $each"; }
    if (!util.isArray(value.$each)) { throw "$each requires an array value"; }

    value.$each.forEach(function (v) {
      obj[field].push(v);
    });
  } else {
    obj[field].push(value);
  }
};


/**
 * Add an element to an array field only if it is not already in it
 * No modification if the element is already in the array
 * Note that it doesn't check whether the original array contains duplicates
 */
lastStepModifierFunctions.$addToSet = function (obj, field, value) {
  var addToSet = true;

  // Create the array if it doesn't exist
  if (!obj.hasOwnProperty(field)) { obj[field] = []; }

  if (!util.isArray(obj[field])) { throw "Can't $addToSet an element on non-array values"; }

  if (value !== null && typeof value === 'object' && value.$each) {
    if (Object.keys(value).length > 1) { throw "Can't use another field in conjunction with $each"; }
    if (!util.isArray(value.$each)) { throw "$each requires an array value"; }

    value.$each.forEach(function (v) {
      lastStepModifierFunctions.$addToSet(obj, field, v);
    });
  } else {
    obj[field].forEach(function (v) {
      if (compareThings(v, value) === 0) { addToSet = false; }
    });
    if (addToSet) { obj[field].push(value); }
  }
};


/**
 * Remove the first or last element of an array
 */
lastStepModifierFunctions.$pop = function (obj, field, value) {
  if (!util.isArray(obj[field])) { throw "Can't $pop an element from non-array values"; }
  if (typeof value !== 'number') { throw value + " isn't an integer, can't use it with $pop"; }
  if (value === 0) { return; }

  if (value > 0) {
    obj[field] = obj[field].slice(0, obj[field].length - 1);
  } else {
    obj[field] = obj[field].slice(1);
  }
};


/**
 * Removes all instances of a value from an existing array
 */
lastStepModifierFunctions.$pull = function (obj, field, value) {
  var arr, i;
  
  if (!util.isArray(obj[field])) { throw "Can't $pull an element from non-array values"; }

  arr = obj[field];
  for (i = arr.length - 1; i >= 0; i -= 1) {
    if (match(arr[i], value)) {
      arr.splice(i, 1);
    }
  }
};


/**
 * Increment a numeric field's value
 */
lastStepModifierFunctions.$inc = function (obj, field, value) {
  if (typeof value !== 'number') { throw value + " must be a number"; }

  if (typeof obj[field] !== 'number') {
    if (!_.has(obj, field)) {
      obj[field] = value;
    } else {
      throw "Don't use the $inc modifier on non-number fields";
    }
  } else {
    obj[field] += value;
  }
};

// Given its name, create the complete modifier function
function createModifierFunction (modifier) {
  return function (obj, field, value) {
    var fieldParts = typeof field === 'string' ? field.split('.') : field;

    if (fieldParts.length === 1) {
      lastStepModifierFunctions[modifier](obj, field, value);
    } else {
      obj[fieldParts[0]] = obj[fieldParts[0]] || {};
      modifierFunctions[modifier](obj[fieldParts[0]], fieldParts.slice(1), value);
    }
  };
}

// Actually create all modifier functions
Object.keys(lastStepModifierFunctions).forEach(function (modifier) {
  modifierFunctions[modifier] = createModifierFunction(modifier);
});


/**
 * Modify a DB object according to an update query
 * For now the updateQuery only replaces the object
 */
function modify (obj, updateQuery) {
  var keys = Object.keys(updateQuery)
    , firstChars = _.map(keys, function (item) { return item[0]; })
    , dollarFirstChars = _.filter(firstChars, function (c) { return c === '$'; })
    , newDoc, modifiers
    ;

  if (keys.indexOf('_id') !== -1 && updateQuery._id !== obj._id) { throw "You cannot change a document's _id"; }

  if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) {
    throw "You cannot mix modifiers and normal fields";
  }

  if (dollarFirstChars.length === 0) {
    // Simply replace the object with the update query contents
    newDoc = deepCopy(updateQuery);
    newDoc._id = obj._id;
  } else {
    // Apply modifiers
    modifiers = _.uniq(keys);
    newDoc = deepCopy(obj);
    modifiers.forEach(function (m) {
      var keys;

      if (!modifierFunctions[m]) { throw "Unknown modifier " + m; }

      try {
        keys = Object.keys(updateQuery[m]);
      } catch (e) {
        throw "Modifier " + m + "'s argument must be an object";
      }

      keys.forEach(function (k) {
        modifierFunctions[m](newDoc, k, updateQuery[m][k]);
      });
    });
  }

  // Check result is valid and return it
  checkObject(newDoc);
  if (obj._id !== newDoc._id) { throw "You can't change a document's _id"; }
  return newDoc;
};


// ==============================================================
// Finding documents
// ==============================================================

/**
 * Get a value from object with dot notation
 * @param {Object} obj
 * @param {String} field
 */
function getDotValue (obj, field) {
  var fieldParts = typeof field === 'string' ? field.split('.') : field
    , i, objs;

  if (!obj) { return undefined; }   // field cannot be empty so that means we should return undefined so that nothing can match

  if (fieldParts.length === 0) { return obj; }

  if (fieldParts.length === 1) { return obj[fieldParts[0]]; }
  
  if (util.isArray(obj[fieldParts[0]])) {
    // If the next field is an integer, return only this item of the array
    i = parseInt(fieldParts[1], 10);
    if (typeof i === 'number' && !isNaN(i)) {
      return getDotValue(obj[fieldParts[0]][i], fieldParts.slice(2))
    }

    // Return the array of values
    objs = new Array();
    for (i = 0; i < obj[fieldParts[0]].length; i += 1) {
       objs.push(getDotValue(obj[fieldParts[0]][i], fieldParts.slice(1)));
    }
    return objs;
  } else {
    return getDotValue(obj[fieldParts[0]], fieldParts.slice(1));
  }
}


/**
 * Check whether 'things' are equal
 * Things are defined as any native types (string, number, boolean, null, date) and objects
 * In the case of object, we check deep equality
 * Returns true if they are, false otherwise
 */
function areThingsEqual (a, b) {
  var aKeys , bKeys , i;

  // Strings, booleans, numbers, null
  if (a === null || typeof a === 'string' || typeof a === 'boolean' || typeof a === 'number' ||
      b === null || typeof b === 'string' || typeof b === 'boolean' || typeof b === 'number') { return a === b; }

  // Dates
  if (util.isDate(a) || util.isDate(b)) { return util.isDate(a) && util.isDate(b) && a.getTime() === b.getTime(); }

  // Arrays (no match since arrays are used as a $in)
  // undefined (no match since they mean field doesn't exist and can't be serialized)
  if (util.isArray(a) || util.isArray(b) || a === undefined || b === undefined) { return false; }

  // General objects (check for deep equality)
  // a and b should be objects at this point
  try {
    aKeys = Object.keys(a);
    bKeys = Object.keys(b);
  } catch (e) {
    return false;
  }

  if (aKeys.length !== bKeys.length) { return false; }
  for (i = 0; i < aKeys.length; i += 1) {
    if (bKeys.indexOf(aKeys[i]) === -1) { return false; }
    if (!areThingsEqual(a[aKeys[i]], b[aKeys[i]])) { return false; }
  }
  return true;
}


/**
 * Check that two values are comparable
 */
function areComparable (a, b) {
  if (typeof a !== 'string' && typeof a !== 'number' && !util.isDate(a) &&
      typeof b !== 'string' && typeof b !== 'number' && !util.isDate(b)) {
    return false;
  }

  if (typeof a !== typeof b) { return false; }

  return true;
}


/**
 * Arithmetic and comparison operators
 * @param {Native value} a Value in the object
 * @param {Native value} b Value in the query
 */
comparisonFunctions.$lt = function (a, b) {
  return areComparable(a, b) && a < b;
};

comparisonFunctions.$lte = function (a, b) {
  return areComparable(a, b) && a <= b;
};

comparisonFunctions.$gt = function (a, b) {
  return areComparable(a, b) && a > b;
};

comparisonFunctions.$gte = function (a, b) {
  return areComparable(a, b) && a >= b;
};

comparisonFunctions.$ne = function (a, b) {
  if (!a) { return true; }
  return !areThingsEqual(a, b);
};

comparisonFunctions.$in = function (a, b) {
  var i;

  if (!util.isArray(b)) { throw "$in operator called with a non-array"; }

  for (i = 0; i < b.length; i += 1) {
    if (areThingsEqual(a, b[i])) { return true; }
  }

  return false;
};

comparisonFunctions.$nin = function (a, b) {
  if (!util.isArray(b)) { throw "$nin operator called with a non-array"; }

  return !comparisonFunctions.$in(a, b);
};

comparisonFunctions.$regex = function (a, b) {
  if (!util.isRegExp(b)) { throw "$regex operator called with non regular expression"; }

  if (typeof a !== 'string') {
    return false
  } else {
    return b.test(a);
  }
};

comparisonFunctions.$exists = function (value, exists) {
  if (exists || exists === '') {   // This will be true for all values of exists except false, null, undefined and 0
    exists = true;                 // That's strange behaviour (we should only use true/false) but that's the way Mongo does it...
  } else {
    exists = false;
  }

  if (value === undefined) {
    return !exists
  } else {
    return exists;
  }
};

// Specific to arrays
comparisonFunctions.$size = function (obj, value) {
    if (!util.isArray(obj)) { return false; }
    if (value % 1 !== 0) { throw "$size operator called without an integer"; }

    return (obj.length == value);
};
arrayComparisonFunctions.$size = true;


/**
 * Match any of the subqueries
 * @param {Model} obj
 * @param {Array of Queries} query
 */
logicalOperators.$or = function (obj, query) {
  var i;

  if (!util.isArray(query)) { throw "$or operator used without an array"; }

  for (i = 0; i < query.length; i += 1) {
    if (match(obj, query[i])) { return true; }
  }

  return false;
};


/**
 * Match all of the subqueries
 * @param {Model} obj
 * @param {Array of Queries} query
 */
logicalOperators.$and = function (obj, query) {
  var i;

  if (!util.isArray(query)) { throw "$and operator used without an array"; }

  for (i = 0; i < query.length; i += 1) {
    if (!match(obj, query[i])) { return false; }
  }

  return true;
};


/**
 * Inverted match of the query
 * @param {Model} obj
 * @param {Query} query
 */
logicalOperators.$not = function (obj, query) {
  return !match(obj, query);
};


/**
 * Use a function to match
 * @param {Model} obj
 * @param {Query} query
 */
logicalOperators.$where = function (obj, fn) {
  var result;

  if (!_.isFunction(fn)) { throw "$where operator used without a function"; }

  result = fn.call(obj);
  if (!_.isBoolean(result)) { throw "$where function must return boolean"; }

  return result;
};


/**
 * Tell if a given document matches a query
 * @param {Object} obj Document to check
 * @param {Object} query
 */
function match (obj, query) {
  var queryKeys, queryKey, queryValue, i;

  // Primitive query against a primitive type
  // This is a bit of a hack since we construct an object with an arbitrary key only to dereference it later
  // But I don't have time for a cleaner implementation now
  if (isPrimitiveType(obj) || isPrimitiveType(query)) {
    return matchQueryPart({ needAKey: obj }, 'needAKey', query);
  }
    
  // Normal query
  queryKeys = Object.keys(query);
  for (i = 0; i < queryKeys.length; i += 1) {
    queryKey = queryKeys[i];
    queryValue = query[queryKey];
  
    if (queryKey[0] === '$') {
      if (!logicalOperators[queryKey]) { throw "Unknown logical operator " + queryKey; }
      if (!logicalOperators[queryKey](obj, queryValue)) { return false; }
    } else {
      if (!matchQueryPart(obj, queryKey, queryValue)) { return false; }
    }
  }

  return true;
};


/**
 * Match an object against a specific { key: value } part of a query
 * if the treatObjAsValue flag is set, don't try to match every part separately, but the array as a whole
 */
function matchQueryPart (obj, queryKey, queryValue, treatObjAsValue) {
  var objValue = getDotValue(obj, queryKey)
    , i, keys, firstChars, dollarFirstChars;

  // Check if the value is an array if we don't force a treatment as value
  if (util.isArray(objValue) && !treatObjAsValue) {
    // Check if we are using an array-specific comparison function
    if (queryValue !== null && typeof queryValue === 'object' && !util.isRegExp(queryValue)) {
      keys = Object.keys(queryValue);      
      for (i = 0; i < keys.length; i += 1) {
        if (arrayComparisonFunctions[keys[i]]) { return matchQueryPart(obj, queryKey, queryValue, true); }
      }
    }

    // If not, treat it as an array of { obj, query } where there needs to be at least one match
    for (i = 0; i < objValue.length; i += 1) {
      if (matchQueryPart({ k: objValue[i] }, 'k', queryValue)) { return true; }   // k here could be any string
    }
    return false;
  }

  // queryValue is an actual object. Determine whether it contains comparison operators
  // or only normal fields. Mixed objects are not allowed
  if (queryValue !== null && typeof queryValue === 'object' && !util.isRegExp(queryValue)) {
    keys = Object.keys(queryValue);
    firstChars = _.map(keys, function (item) { return item[0]; });
    dollarFirstChars = _.filter(firstChars, function (c) { return c === '$'; });

    if (dollarFirstChars.length !== 0 && dollarFirstChars.length !== firstChars.length) {
      throw "You cannot mix operators and normal fields";
    }

    // queryValue is an object of this form: { $comparisonOperator1: value1, ... }
    if (dollarFirstChars.length > 0) {
      for (i = 0; i < keys.length; i += 1) {
        if (!comparisonFunctions[keys[i]]) { throw "Unknown comparison function " + keys[i]; }

        if (!comparisonFunctions[keys[i]](objValue, queryValue[keys[i]])) { return false; }
      }
      return true;
    }
  }

  // Using regular expressions with basic querying
  if (util.isRegExp(queryValue)) { return comparisonFunctions.$regex(objValue, queryValue); }

  // queryValue is either a native value or a normal object
  // Basic matching is possible
  if (!areThingsEqual(objValue, queryValue)) { return false; }

  return true;
}

function aggregate(res, group) {
  var nested = {},
    flattened = [],
        outKeys = [],
        keyHash = {},
        keys = null,
    i, j, k, handle, sub, entry, nodeKeys, hash;

  if (!_.isFunction(group.reduce)) {
    throw new Error("A reduce function must be provided.");
  }

  if (!group.initial) {
    throw new Error("An initial vector must be provided.");
  }

  if (group.finalize && !_.isFunction(group.finalize)) {
    throw new Error("'finalize', if provided, must be a function.");
  }

  if (group.key) {
    keys = _.filter(_.keys(group.key), function (key) {
      return group.key[key];
    });
    if (_.isEmpty(keys)) {
      throw new Error("At least one key should be enabled.");
    }
    for (i = 0; i < keys.length; ++i) {
      outKeys.push(keys[i].replace(/\./g, '_'));
      keys[i] = keys[i].split('.');
    }
  }

  if (keys) {
    for (i = 0; i < res.length; ++i) {
      handle = nested;
      for (j = 0; j < keys.length; ++j) {
        sub = _getValue(res[i], keys[j]);
        if (!handle[sub]) {
          if (j === keys.length - 1) {
            handle[sub] = deepCopy(group.initial);
          } else {
            handle[sub] = {};
          }
        }
        if (j === keys.length - 1) {
          group.reduce(res[i], handle[sub]);
        }
        handle = handle[sub];
      }
    }
    console.dir(nested);
    _walk(nested, 0, []);
  }
  else {
    flattened = [_.reduce(res, function(memo, item){
      group.reduce(item, memo);
      return memo;
    }, deepCopy(group.initial))];
    group.finalize(flattened[0]);
  }
  return flattened;

  function _getValue(item, key) {
    try {
      for (k = 0; k < key.length; ++k) {
        item = item[key[k]];
        if (k === key.length - 1) {
          if (!isPrimitiveType(item) || util.isArray(item)) {
            // hash = XXHash.hash(new Buffer(JSON.stringify(item)), 0xCAFEBABE);
            hash = XXHash(JSON.stringify(item), 0xCAFEBABE).toString(16);
            // hash = new Buffer(JSON.stringify(item)).toString('base64');
          }
          else {
            hash = item;
          }
        }
      }
    } catch (err) {
      hash = 'NULL';
    }
    keyHash[hash] = item;
    return hash;
  }

  function _walk(node, depth, path) {
    if (depth === keys.length) {
      if (group.finalize) group.finalize(node);
      entry = {};
      for (i = 0; i < path.length; ++i) {
        entry[outKeys[i]] = keyHash[path[i]];
      }

      nodeKeys = Object.keys(node);
      for (i = 0; i < nodeKeys.length; ++i) {
        entry[nodeKeys[i]] = node[nodeKeys[i]];
      }

      flattened.push(entry);
    } else {
      for (var key in node) {
        _walk(node[key], depth + 1, path.concat([key]));
      }
    }
  }
}

// Interface
module.exports.serialize = serialize;
module.exports.deserialize = deserialize;
module.exports.deepCopy = deepCopy;
module.exports.checkObject = checkObject;
module.exports.isPrimitiveType = isPrimitiveType;
module.exports.modify = modify;
module.exports.getDotValue = getDotValue;
module.exports.match = match;
module.exports.areThingsEqual = areThingsEqual;
module.exports.compareThings = compareThings;
module.exports.aggregate = aggregate;
},{"underscore":17,"util":2,"xxhashjs":21}],11:[function(require,module,exports){
/**
 * Handle every persistence-related task
 * The interface Datastore expects to be implemented is
 * * Persistence.loadDatabase(callback) and callback has signature err
 * * Persistence.persistNewState(newDocs, callback) where newDocs is an array of documents and callback has signature err
 *
 * Shim for the browser
 */

/**
 * Create a new Persistence object for database options.db
 * For now, no browser persistence supported, in-memory only mode forced
 * @param {Datastore} options.db
 */
function Persistence (options) {
  this.db = options.db;
  this.db.inMemoryOnly = true;
  this.db.filename = null;
  this.inMemoryOnly = true;
};


/**
 * No persistence in the browser (for now)
 */
Persistence.prototype.persistNewState = function (newDocs, cb) {
  if (cb) { return cb(); }
};


/**
 * No persistence in the browser (for now)
 */
Persistence.prototype.loadDatabase = function (cb) {
  if (cb) { return cb(); }
};


// Interface
module.exports = Persistence;

},{}],12:[function(require,module,exports){
var process=require("__browserify_process");/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

},{"__browserify_process":4}],13:[function(require,module,exports){
module.exports.BinarySearchTree = require('./lib/bst');
module.exports.AVLTree = require('./lib/avltree');

},{"./lib/avltree":14,"./lib/bst":15}],14:[function(require,module,exports){
/**
 * Self-balancing binary search tree using the AVL implementation
 */
var BinarySearchTree = require('./bst')
  , customUtils = require('./customUtils')
  , util = require('util')
  , _ = require('underscore')
  ;


/**
 * Constructor
 * We can't use a direct pointer to the root node (as in the simple binary search tree)
 * as the root will change during tree rotations
 * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
 * @param {Function} options.compareKeys Initialize this BST's compareKeys
 */
function AVLTree (options) {
  this.tree = new _AVLTree(options);
}


/**
 * Constructor of the internal AVLTree
 * @param {Object} options Optional
 * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
 * @param {Key}      options.key Initialize this BST's key with key
 * @param {Value}    options.value Initialize this BST's data with [value]
 * @param {Function} options.compareKeys Initialize this BST's compareKeys
 */
function _AVLTree (options) {
  options = options || {};

  this.left = null;
  this.right = null;
  this.parent = options.parent !== undefined ? options.parent : null;
  if (options.hasOwnProperty('key')) { this.key = options.key; }
  this.data = options.hasOwnProperty('value') ? [options.value] : [];
  this.unique = options.unique || false;

  this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
  this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
}


/**
 * Inherit basic functions from the basic binary search tree
 */
util.inherits(_AVLTree, BinarySearchTree);

/**
 * Keep a pointer to the internal tree constructor for testing purposes
 */
AVLTree._AVLTree = _AVLTree;


/**
 * Check the recorded height is correct for every node
 * Throws if one height doesn't match
 */
_AVLTree.prototype.checkHeightCorrect = function () {
  var leftH, rightH;

  if (!this.hasOwnProperty('key')) { return; }   // Empty tree

  if (this.left && this.left.height === undefined) { throw "Undefined height for node " + this.left.key; }
  if (this.right && this.right.height === undefined) { throw "Undefined height for node " + this.right.key; }
  if (this.height === undefined) { throw "Undefined height for node " + this.key; }

  leftH = this.left ? this.left.height : 0;
  rightH = this.right ? this.right.height : 0;

  if (this.height !== 1 + Math.max(leftH, rightH)) { throw "Height constraint failed for node " + this.key; }
  if (this.left) { this.left.checkHeightCorrect(); }
  if (this.right) { this.right.checkHeightCorrect(); }
};


/**
 * Return the balance factor
 */
_AVLTree.prototype.balanceFactor = function () {
  var leftH = this.left ? this.left.height : 0
    , rightH = this.right ? this.right.height : 0
    ;
  return leftH - rightH;
};


/**
 * Check that the balance factors are all between -1 and 1
 */
_AVLTree.prototype.checkBalanceFactors = function () {
  if (Math.abs(this.balanceFactor()) > 1) { throw 'Tree is unbalanced at node ' + this.key; }

  if (this.left) { this.left.checkBalanceFactors(); }
  if (this.right) { this.right.checkBalanceFactors(); }
};


/**
 * When checking if the BST conditions are met, also check that the heights are correct
 * and the tree is balanced
 */
_AVLTree.prototype.checkIsAVLT = function () {
  _AVLTree.super_.prototype.checkIsBST.call(this);
  this.checkHeightCorrect();
  this.checkBalanceFactors();
};
AVLTree.prototype.checkIsAVLT = function () { this.tree.checkIsAVLT(); };


/**
 * Perform a right rotation of the tree if possible
 * and return the root of the resulting tree
 * The resulting tree's nodes' heights are also updated
 */
_AVLTree.prototype.rightRotation = function () {
  var q = this
    , p = this.left
    , b
    , ah, bh, ch;

  if (!p) { return this; }   // No change

  b = p.right;

  // Alter tree structure
  if (q.parent) {
    p.parent = q.parent;
    if (q.parent.left === q) { q.parent.left = p; } else { q.parent.right = p; }
  } else {
    p.parent = null;
  }
  p.right = q;
  q.parent = p;
  q.left = b;
  if (b) { b.parent = q; }

  // Update heights
  ah = p.left ? p.left.height : 0;
  bh = b ? b.height : 0;
  ch = q.right ? q.right.height : 0;
  q.height = Math.max(bh, ch) + 1;
  p.height = Math.max(ah, q.height) + 1;

  return p;
};


/**
 * Perform a left rotation of the tree if possible
 * and return the root of the resulting tree
 * The resulting tree's nodes' heights are also updated
 */
_AVLTree.prototype.leftRotation = function () {
  var p = this
    , q = this.right
    , b
    , ah, bh, ch;

  if (!q) { return this; }   // No change

  b = q.left;

  // Alter tree structure
  if (p.parent) {
    q.parent = p.parent;
    if (p.parent.left === p) { p.parent.left = q; } else { p.parent.right = q; }
  } else {
    q.parent = null;
  }
  q.left = p;
  p.parent = q;
  p.right = b;
  if (b) { b.parent = p; }

  // Update heights
  ah = p.left ? p.left.height : 0;
  bh = b ? b.height : 0;
  ch = q.right ? q.right.height : 0;
  p.height = Math.max(ah, bh) + 1;
  q.height = Math.max(ch, p.height) + 1;

  return q;
};


/**
 * Modify the tree if its right subtree is too small compared to the left
 * Return the new root if any
 */
_AVLTree.prototype.rightTooSmall = function () {
  if (this.balanceFactor() <= 1) { return this; }   // Right is not too small, don't change

  if (this.left.balanceFactor() < 0) {
    this.left.leftRotation();
  }

  return this.rightRotation();
};


/**
 * Modify the tree if its left subtree is too small compared to the right
 * Return the new root if any
 */
_AVLTree.prototype.leftTooSmall = function () {
  if (this.balanceFactor() >= -1) { return this; }   // Left is not too small, don't change

  if (this.right.balanceFactor() > 0) {
    this.right.rightRotation();
  }

  return this.leftRotation();
};


/**
 * Rebalance the tree along the given path. The path is given reversed (as he was calculated
 * in the insert and delete functions).
 * Returns the new root of the tree
 * Of course, the first element of the path must be the root of the tree
 */
_AVLTree.prototype.rebalanceAlongPath = function (path) {
  var newRoot = this
    , rotated
    , i;

  if (!this.hasOwnProperty('key')) { delete this.height; return this; }   // Empty tree

  // Rebalance the tree and update all heights
  for (i = path.length - 1; i >= 0; i -= 1) {
    path[i].height = 1 + Math.max(path[i].left ? path[i].left.height : 0, path[i].right ? path[i].right.height : 0);

    if (path[i].balanceFactor() > 1) {
      rotated = path[i].rightTooSmall();
      if (i === 0) { newRoot = rotated; }
    }

    if (path[i].balanceFactor() < -1) {
      rotated = path[i].leftTooSmall();
      if (i === 0) { newRoot = rotated; }
    }
  }

  return newRoot;
};


/**
 * Insert a key, value pair in the tree while maintaining the AVL tree height constraint
 * Return a pointer to the root node, which may have changed
 */
_AVLTree.prototype.insert = function (key, value) {
  var insertPath = []
    , currentNode = this
    ;

  // Empty tree, insert as root
  if (!this.hasOwnProperty('key')) {
    this.key = key;
    this.data.push(value);
    this.height = 1;
    return this;
  }

  // Insert new leaf at the right place
  while (true) {
    // Same key: no change in the tree structure
    if (currentNode.compareKeys(currentNode.key, key) === 0) {
      if (currentNode.unique) {
        throw { message: "Can't insert key " + key + ", it violates the unique constraint"
              , key: key
              , errorType: 'uniqueViolated'
              };
      } else {
        currentNode.data.push(value);
      }
      return this;
    }

    insertPath.push(currentNode);

    if (currentNode.compareKeys(key, currentNode.key) < 0) {
      if (!currentNode.left) {
        insertPath.push(currentNode.createLeftChild({ key: key, value: value }));
        break;
      } else {
        currentNode = currentNode.left;
      }
    } else {
      if (!currentNode.right) {
        insertPath.push(currentNode.createRightChild({ key: key, value: value }));
        break;
      } else {
        currentNode = currentNode.right;
      }
    }
  }

  return this.rebalanceAlongPath(insertPath);
};

// Insert in the internal tree, update the pointer to the root if needed
AVLTree.prototype.insert = function (key, value) {
  var newTree = this.tree.insert(key, value);

  // If newTree is undefined, that means its structure was not modified
  if (newTree) { this.tree = newTree; }
};


/**
 * Delete a key or just a value and return the new root of the tree
 * @param {Key} key
 * @param {Value} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
 */
_AVLTree.prototype.delete = function (key, value) {
  var newData = [], replaceWith
    , self = this
    , currentNode = this
    , deletePath = []
    ;

  if (!this.hasOwnProperty('key')) { return this; }   // Empty tree

  // Either no match is found and the function will return from within the loop
  // Or a match is found and deletePath will contain the path from the root to the node to delete after the loop
  while (true) {
    if (currentNode.compareKeys(key, currentNode.key) === 0) { break; }

    deletePath.push(currentNode);

    if (currentNode.compareKeys(key, currentNode.key) < 0) {
      if (currentNode.left) {
        currentNode = currentNode.left;
      } else {
        return this;   // Key not found, no modification
      }
    } else {
      // currentNode.compareKeys(key, currentNode.key) is > 0
      if (currentNode.right) {
        currentNode = currentNode.right;
      } else {
        return this;   // Key not found, no modification
      }
    }
  }

  // Delete only a value (no tree modification)
  if (currentNode.data.length > 1 && value) {
    currentNode.data.forEach(function (d) {
      if (!currentNode.checkValueEquality(d, value)) { newData.push(d); }
    });
    currentNode.data = newData;
    return this;
  }

  // Delete a whole node

  // Leaf
  if (!currentNode.left && !currentNode.right) {
    if (currentNode === this) {   // This leaf is also the root
      delete currentNode.key;
      currentNode.data = [];
      delete currentNode.height;
      return this;
    } else {
      if (currentNode.parent.left === currentNode) {
        currentNode.parent.left = null;
      } else {
        currentNode.parent.right = null;
      }
      return this.rebalanceAlongPath(deletePath);
    }
  }


  // Node with only one child
  if (!currentNode.left || !currentNode.right) {
    replaceWith = currentNode.left ? currentNode.left : currentNode.right;

    if (currentNode === this) {   // This node is also the root
      replaceWith.parent = null;
      return replaceWith;   // height of replaceWith is necessarily 1 because the tree was balanced before deletion
    } else {
      if (currentNode.parent.left === currentNode) {
        currentNode.parent.left = replaceWith;
        replaceWith.parent = currentNode.parent;
      } else {
        currentNode.parent.right = replaceWith;
        replaceWith.parent = currentNode.parent;
      }

      return this.rebalanceAlongPath(deletePath);
    }
  }


  // Node with two children
  // Use the in-order predecessor (no need to randomize since we actively rebalance)
  deletePath.push(currentNode);
  replaceWith = currentNode.left;

  // Special case: the in-order predecessor is right below the node to delete
  if (!replaceWith.right) {
    currentNode.key = replaceWith.key;
    currentNode.data = replaceWith.data;
    currentNode.left = replaceWith.left;
    if (replaceWith.left) { replaceWith.left.parent = currentNode; }
    return this.rebalanceAlongPath(deletePath);
  }

  // After this loop, replaceWith is the right-most leaf in the left subtree
  // and deletePath the path from the root (inclusive) to replaceWith (exclusive)
  while (true) {
    if (replaceWith.right) {
      deletePath.push(replaceWith);
      replaceWith = replaceWith.right;
    } else {
      break;
    }
  }

  currentNode.key = replaceWith.key;
  currentNode.data = replaceWith.data;

  replaceWith.parent.right = replaceWith.left;
  if (replaceWith.left) { replaceWith.left.parent = replaceWith.parent; }

  return this.rebalanceAlongPath(deletePath);
};

// Delete a value
AVLTree.prototype.delete = function (key, value) {
  var newTree = this.tree.delete(key, value);

  // If newTree is undefined, that means its structure was not modified
  if (newTree) { this.tree = newTree; }
};


/**
 * Other functions we want to use on an AVLTree as if it were the internal _AVLTree
 */
['getNumberOfKeys', 'search', 'betweenBounds', 'prettyPrint', 'executeOnEveryNode'].forEach(function (fn) {
  AVLTree.prototype[fn] = function () {
    return this.tree[fn].apply(this.tree, arguments);
  };
});


// Interface
module.exports = AVLTree;

},{"./bst":15,"./customUtils":16,"underscore":17,"util":2}],15:[function(require,module,exports){
/**
 * Simple binary search tree
 */
var customUtils = require('./customUtils');


/**
 * Constructor
 * @param {Object} options Optional
 * @param {Boolean}  options.unique Whether to enforce a 'unique' constraint on the key or not
 * @param {Key}      options.key Initialize this BST's key with key
 * @param {Value}    options.value Initialize this BST's data with [value]
 * @param {Function} options.compareKeys Initialize this BST's compareKeys
 */
function BinarySearchTree (options) {
  options = options || {};

  this.left = null;
  this.right = null;
  this.parent = options.parent !== undefined ? options.parent : null;
  if (options.hasOwnProperty('key')) { this.key = options.key; }
  this.data = options.hasOwnProperty('value') ? [options.value] : [];
  this.unique = options.unique || false;

  this.compareKeys = options.compareKeys || customUtils.defaultCompareKeysFunction;
  this.checkValueEquality = options.checkValueEquality || customUtils.defaultCheckValueEquality;
}


// ================================
// Methods used to test the tree
// ================================


/**
 * Get the descendant with max key
 */
BinarySearchTree.prototype.getMaxKeyDescendant = function () {
  if (this.right) {
    return this.right.getMaxKeyDescendant();
  } else {
    return this;
  }
};


/**
 * Get the maximum key
 */
BinarySearchTree.prototype.getMaxKey = function () {
  return this.getMaxKeyDescendant().key;
};


/**
 * Get the descendant with min key
 */
BinarySearchTree.prototype.getMinKeyDescendant = function () {
  if (this.left) {
    return this.left.getMinKeyDescendant()
  } else {
    return this;
  }
};


/**
 * Get the minimum key
 */
BinarySearchTree.prototype.getMinKey = function () {
  return this.getMinKeyDescendant().key;
};


/**
 * Check that all nodes (incl. leaves) fullfil condition given by fn
 * test is a function passed every (key, data) and which throws if the condition is not met
 */
BinarySearchTree.prototype.checkAllNodesFullfillCondition = function (test) {
  if (!this.hasOwnProperty('key')) { return; }

  test(this.key, this.data);
  if (this.left) { this.left.checkAllNodesFullfillCondition(test); }
  if (this.right) { this.right.checkAllNodesFullfillCondition(test); }
};


/**
 * Check that the core BST properties on node ordering are verified
 * Throw if they aren't
 */
BinarySearchTree.prototype.checkNodeOrdering = function () {
  var self = this;

  if (!this.hasOwnProperty('key')) { return; }

  if (this.left) {
    this.left.checkAllNodesFullfillCondition(function (k) {
      if (self.compareKeys(k, self.key) >= 0) {
        throw 'Tree with root ' + self.key + ' is not a binary search tree';
      }
    });
    this.left.checkNodeOrdering();
  }

  if (this.right) {
    this.right.checkAllNodesFullfillCondition(function (k) {
      if (self.compareKeys(k, self.key) <= 0) {
        throw 'Tree with root ' + self.key + ' is not a binary search tree';
      }
    });
    this.right.checkNodeOrdering();
  }
};


/**
 * Check that all pointers are coherent in this tree
 */
BinarySearchTree.prototype.checkInternalPointers = function () {
  if (this.left) {
    if (this.left.parent !== this) { throw 'Parent pointer broken for key ' + this.key; }
    this.left.checkInternalPointers();
  }

  if (this.right) {
    if (this.right.parent !== this) { throw 'Parent pointer broken for key ' + this.key; }
    this.right.checkInternalPointers();
  }
};


/**
 * Check that a tree is a BST as defined here (node ordering and pointer references)
 */
BinarySearchTree.prototype.checkIsBST = function () {
  this.checkNodeOrdering();
  this.checkInternalPointers();
  if (this.parent) { throw "The root shouldn't have a parent"; }
};


/**
 * Get number of keys inserted
 */
BinarySearchTree.prototype.getNumberOfKeys = function () {
  var res;

  if (!this.hasOwnProperty('key')) { return 0; }

  res = 1;
  if (this.left) { res += this.left.getNumberOfKeys(); }
  if (this.right) { res += this.right.getNumberOfKeys(); }

  return res;
};



// ============================================
// Methods used to actually work on the tree
// ============================================

/**
 * Create a BST similar (i.e. same options except for key and value) to the current one
 * Use the same constructor (i.e. BinarySearchTree, AVLTree etc)
 * @param {Object} options see constructor
 */
BinarySearchTree.prototype.createSimilar = function (options) {
  options = options || {};
  options.unique = this.unique;
  options.compareKeys = this.compareKeys;
  options.checkValueEquality = this.checkValueEquality;

  return new this.constructor(options);
};


/**
 * Create the left child of this BST and return it
 */
BinarySearchTree.prototype.createLeftChild = function (options) {
  var leftChild = this.createSimilar(options);
  leftChild.parent = this;
  this.left = leftChild;

  return leftChild;
};


/**
 * Create the right child of this BST and return it
 */
BinarySearchTree.prototype.createRightChild = function (options) {
  var rightChild = this.createSimilar(options);
  rightChild.parent = this;
  this.right = rightChild;

  return rightChild;
};


/**
 * Insert a new element
 */
BinarySearchTree.prototype.insert = function (key, value) {
  // Empty tree, insert as root
  if (!this.hasOwnProperty('key')) {
    this.key = key;
    this.data.push(value);
    return;
  }

  // Same key as root
  if (this.compareKeys(this.key, key) === 0) {
    if (this.unique) {
      throw { message: "Can't insert key " + key + ", it violates the unique constraint"
            , key: key
            , errorType: 'uniqueViolated'
            };
    } else {
      this.data.push(value);
    }
    return;
  }

  if (this.compareKeys(key, this.key) < 0) {
    // Insert in left subtree
    if (this.left) {
      this.left.insert(key, value);
    } else {
      this.createLeftChild({ key: key, value: value });
    }
  } else {
    // Insert in right subtree
    if (this.right) {
      this.right.insert(key, value);
    } else {
      this.createRightChild({ key: key, value: value });
    }
  }
};


/**
 * Search for all data corresponding to a key
 */
BinarySearchTree.prototype.search = function (key) {
  if (!this.hasOwnProperty('key')) { return []; }

  if (this.compareKeys(this.key, key) === 0) { return this.data; }

  if (this.compareKeys(key, this.key) < 0) {
    if (this.left) {
      return this.left.search(key);
    } else {
      return [];
    }
  } else {
    if (this.right) {
      return this.right.search(key);
    } else {
      return [];
    }
  }
};


/**
 * Return a function that tells whether a given key matches a lower bound
 */
BinarySearchTree.prototype.getLowerBoundMatcher = function (query) {
  var self = this;

  // No lower bound
  if (!query.hasOwnProperty('$gt') && !query.hasOwnProperty('$gte')) {
    return function () { return true; };
  }

  if (query.hasOwnProperty('$gt') && query.hasOwnProperty('$gte')) {
    if (self.compareKeys(query.$gte, query.$gt) === 0) {
      return function (key) { return self.compareKeys(key, query.$gt) > 0; };
    }

    if (self.compareKeys(query.$gte, query.$gt) > 0) {
      return function (key) { return self.compareKeys(key, query.$gte) >= 0; };
    } else {
      return function (key) { return self.compareKeys(key, query.$gt) > 0; };
    }
  }

  if (query.hasOwnProperty('$gt')) {
    return function (key) { return self.compareKeys(key, query.$gt) > 0; };
  } else {
    return function (key) { return self.compareKeys(key, query.$gte) >= 0; };
  }
};


/**
 * Return a function that tells whether a given key matches an upper bound
 */
BinarySearchTree.prototype.getUpperBoundMatcher = function (query) {
  var self = this;

  // No lower bound
  if (!query.hasOwnProperty('$lt') && !query.hasOwnProperty('$lte')) {
    return function () { return true; };
  }

  if (query.hasOwnProperty('$lt') && query.hasOwnProperty('$lte')) {
    if (self.compareKeys(query.$lte, query.$lt) === 0) {
      return function (key) { return self.compareKeys(key, query.$lt) < 0; };
    }

    if (self.compareKeys(query.$lte, query.$lt) < 0) {
      return function (key) { return self.compareKeys(key, query.$lte) <= 0; };
    } else {
      return function (key) { return self.compareKeys(key, query.$lt) < 0; };
    }
  }

  if (query.hasOwnProperty('$lt')) {
    return function (key) { return self.compareKeys(key, query.$lt) < 0; };
  } else {
    return function (key) { return self.compareKeys(key, query.$lte) <= 0; };
  }
};


// Append all elements in toAppend to array
function append (array, toAppend) {
  var i;

  for (i = 0; i < toAppend.length; i += 1) {
    array.push(toAppend[i]);
  }
}


/**
 * Get all data for a key between bounds
 * Return it in key order
 * @param {Object} query Mongo-style query where keys are $lt, $lte, $gt or $gte (other keys are not considered)
 * @param {Functions} lbm/ubm matching functions calculated at the first recursive step
 */
BinarySearchTree.prototype.betweenBounds = function (query, lbm, ubm) {
  var res = [];

  if (!this.hasOwnProperty('key')) { return []; }   // Empty tree

  lbm = lbm || this.getLowerBoundMatcher(query);
  ubm = ubm || this.getUpperBoundMatcher(query);

  if (lbm(this.key) && this.left) { append(res, this.left.betweenBounds(query, lbm, ubm)); }
  if (lbm(this.key) && ubm(this.key)) { append(res, this.data); }
  if (ubm(this.key) && this.right) { append(res, this.right.betweenBounds(query, lbm, ubm)); }

  return res;
};


/**
 * Delete the current node if it is a leaf
 * Return true if it was deleted
 */
BinarySearchTree.prototype.deleteIfLeaf = function () {
  if (this.left || this.right) { return false; }

  // The leaf is itself a root
  if (!this.parent) {
    delete this.key;
    this.data = [];
    return true;
  }

  if (this.parent.left === this) {
    this.parent.left = null;
  } else {
    this.parent.right = null;
  }

  return true;
};


/**
 * Delete the current node if it has only one child
 * Return true if it was deleted
 */
BinarySearchTree.prototype.deleteIfOnlyOneChild = function () {
  var child;

  if (this.left && !this.right) { child = this.left; }
  if (!this.left && this.right) { child = this.right; }
  if (!child) { return false; }

  // Root
  if (!this.parent) {
    this.key = child.key;
    this.data = child.data;

    this.left = null;
    if (child.left) {
      this.left = child.left;
      child.left.parent = this;
    }

    this.right = null;
    if (child.right) {
      this.right = child.right;
      child.right.parent = this;
    }

    return true;
  }

  if (this.parent.left === this) {
    this.parent.left = child;
    child.parent = this.parent;
  } else {
    this.parent.right = child;
    child.parent = this.parent;
  }

  return true;
};


/**
 * Delete a key or just a value
 * @param {Key} key
 * @param {Value} value Optional. If not set, the whole key is deleted. If set, only this value is deleted
 */
BinarySearchTree.prototype.delete = function (key, value) {
  var newData = [], replaceWith
    , self = this
    ;

  if (!this.hasOwnProperty('key')) { return; }

  if (this.compareKeys(key, this.key) < 0) {
    if (this.left) { this.left.delete(key, value); }
    return;
  }

  if (this.compareKeys(key, this.key) > 0) {
    if (this.right) { this.right.delete(key, value); }
    return;
  }

  if (!this.compareKeys(key, this.key) === 0) { return; }

  // Delete only a value
  if (this.data.length > 1 && value) {
    this.data.forEach(function (d) {
      if (!self.checkValueEquality(d, value)) { newData.push(d); }
    });
    self.data = newData;
    return;
  }

  // Delete the whole node
  if (this.deleteIfLeaf()) {
    return;
  }
  if (this.deleteIfOnlyOneChild()) {
    return;
  }

  // We are in the case where the node to delete has two children
  if (Math.random() >= 0.5) {   // Randomize replacement to avoid unbalancing the tree too much
    // Use the in-order predecessor
    replaceWith = this.left.getMaxKeyDescendant();

    this.key = replaceWith.key;
    this.data = replaceWith.data;

    if (this === replaceWith.parent) {   // Special case
      this.left = replaceWith.left;
      if (replaceWith.left) { replaceWith.left.parent = replaceWith.parent; }
    } else {
      replaceWith.parent.right = replaceWith.left;
      if (replaceWith.left) { replaceWith.left.parent = replaceWith.parent; }
    }
  } else {
    // Use the in-order successor
    replaceWith = this.right.getMinKeyDescendant();

    this.key = replaceWith.key;
    this.data = replaceWith.data;

    if (this === replaceWith.parent) {   // Special case
      this.right = replaceWith.right;
      if (replaceWith.right) { replaceWith.right.parent = replaceWith.parent; }
    } else {
      replaceWith.parent.left = replaceWith.right;
      if (replaceWith.right) { replaceWith.right.parent = replaceWith.parent; }
    }
  }
};


/**
 * Execute a function on every node of the tree, in key order
 * @param {Function} fn Signature: node. Most useful will probably be node.key and node.data
 */
BinarySearchTree.prototype.executeOnEveryNode = function (fn) {
  if (this.left) { this.left.executeOnEveryNode(fn); }
  fn(this);
  if (this.right) { this.right.executeOnEveryNode(fn); }
};


/**
 * Pretty print a tree
 * @param {Boolean} printData To print the nodes' data along with the key
 */
BinarySearchTree.prototype.prettyPrint = function (printData, spacing) {
  spacing = spacing || "";

  console.log(spacing + "* " + this.key);
  if (printData) { console.log(spacing + "* " + this.data); }

  if (!this.left && !this.right) { return; }

  if (this.left) {
    this.left.prettyPrint(printData, spacing + "  ");
  } else {
    console.log(spacing + "  *");
  }
  if (this.right) {
    this.right.prettyPrint(printData, spacing + "  ");
  } else {
    console.log(spacing + "  *");
  }
};




// Interface
module.exports = BinarySearchTree;

},{"./customUtils":16}],16:[function(require,module,exports){
/**
 * Return an array with the numbers from 0 to n-1, in a random order
 */
function getRandomArray (n) {
  var res, next;

  if (n === 0) { return []; }
  if (n === 1) { return [0]; }

  res = getRandomArray(n - 1);
  next = Math.floor(Math.random() * n);
  res.splice(next, 0, n - 1);   // Add n-1 at a random position in the array

  return res;
};
module.exports.getRandomArray = getRandomArray;


/*
 * Default compareKeys function will work for numbers, strings and dates
 */
function defaultCompareKeysFunction (a, b) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  if (a === b) { return 0; }

  throw { message: "Couldn't compare elements", a: a, b: b };
}
module.exports.defaultCompareKeysFunction = defaultCompareKeysFunction;


/**
 * Check whether two values are equal (used in non-unique deletion)
 */
function defaultCheckValueEquality (a, b) {
  return a === b;
}
module.exports.defaultCheckValueEquality = defaultCheckValueEquality;

},{}],17:[function(require,module,exports){
//     Underscore.js 1.4.4
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.4.4';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? null : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See: https://bugs.webkit.org/show_bug.cgi?id=80797
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        index : index,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index < right.index ? -1 : 1;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(obj, value, context, behavior) {
    var result = {};
    var iterator = lookupIterator(value || _.identity);
    each(obj, function(value, index) {
      var key = iterator.call(context, value, index, obj);
      behavior(result, key, value);
    });
    return result;
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key, value) {
      (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
    });
  };

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = function(obj, value, context) {
    return group(obj, value, context, function(result, key) {
      if (!_.has(result, key)) result[key] = 0;
      result[key]++;
    });
  };

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    each(input, function(value) {
      if (_.isArray(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(concat.apply(ArrayProto, arguments));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(args, "" + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, l = list.length; i < l; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, l = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, l + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < l; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    var args = slice.call(arguments, 2);
    return function() {
      return func.apply(context, args.concat(slice.call(arguments)));
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, result;
    var previous = 0;
    var later = function() {
      previous = new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, result;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) result = func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var values = [];
    for (var key in obj) if (_.has(obj, key)) values.push(obj[key]);
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var pairs = [];
    for (var key in obj) if (_.has(obj, key)) pairs.push([key, obj[key]]);
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    for (var key in obj) if (_.has(obj, key)) result[obj[key]] = key;
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] == null) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent, but `Object`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                               _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
        return false;
      }
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(n);
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],18:[function(require,module,exports){
exports.UINT32 = require('./lib/uint32')
exports.UINT64 = require('./lib/uint64')
},{"./lib/uint32":19,"./lib/uint64":20}],19:[function(require,module,exports){
/**
	C-like unsigned 32 bits integers in Javascript
	Copyright (C) 2013, Pierre Curto
	MIT license
 */
;(function (root) {

	// Local cache for typical radices
	var radixPowerCache = {
		36: UINT32( Math.pow(36, 5) )
	,	16: UINT32( Math.pow(16, 7) )
	,	10: UINT32( Math.pow(10, 9) )
	,	2:  UINT32( Math.pow(2, 30) )
	}
	var radixCache = {
		36: UINT32(36)
	,	16: UINT32(16)
	,	10: UINT32(10)
	,	2:  UINT32(2)
	}

	/**
	 *	Represents an unsigned 32 bits integer
	 * @constructor
	 * @param {Number|String|Number} low bits     | integer as a string 		 | integer as a number
	 * @param {Number|Number|Undefined} high bits | radix (optional, default=10)
	 * @return 
	 */
	function UINT32 (l, h) {
		if ( !(this instanceof UINT32) )
			return new UINT32(l, h)

		this._low = 0
		this._high = 0
		this.remainder = null
		if (typeof h == 'undefined')
			return fromNumber.call(this, l)

		if (typeof l == 'string')
			return fromString.call(this, l, h)

		fromBits.call(this, l, h)
	}

	/**
	 * Set the current _UINT32_ object with its low and high bits
	 * @method fromBits
	 * @param {Number} low bits
	 * @param {Number} high bits
	 * @return ThisExpression
	 */
	function fromBits (l, h) {
		this._low = l | 0
		this._high = h | 0

		return this
	}
	UINT32.prototype.fromBits = fromBits

	/**
	 * Set the current _UINT32_ object from a number
	 * @method fromNumber
	 * @param {Number} number
	 * @return ThisExpression
	 */
	function fromNumber (value) {
		this._low = value & 0xFFFF
		this._high = value >>> 16

		return this
	}
	UINT32.prototype.fromNumber = fromNumber

	/**
	 * Set the current _UINT32_ object from a string
	 * @method fromString
	 * @param {String} integer as a string
	 * @param {Number} radix (optional, default=10)
	 * @return ThisExpression
	 */
	function fromString (s, radix) {
		var value = parseInt(s, radix || 10)

		this._low = value & 0xFFFF
		this._high = value >>> 16

		return this
	}
	UINT32.prototype.fromString = fromString

	/**
	 * Convert this _UINT32_ to a number
	 * @method toNumber
	 * @return {Number} the converted UINT32
	 */
	UINT32.prototype.toNumber = function () {
		return (this._high << 16) | this._low
	}

	/**
	 * Convert this _UINT32_ to a string
	 * @method toString
	 * @param {Number} radix (optional, default=10)
	 * @return {String} the converted UINT32
	 */
	UINT32.prototype.toString = function (radix) {
		radix = radix || 10
		var radixUint = radixCache[radix] || new UINT32(radix)

		if ( !this.gt(radixUint) ) return this.toNumber().toString(radix)

		var self = this.clone()
		var res = new Array(32)
		for (var i = 31; i >= 0; i--) {
			self.div(radixUint)
			res[i] = self.remainder.toNumber().toString(radix)
			if ( !self.gt(radixUint) ) break
		}
		res[i-1] = self.toNumber().toString(radix)

		return res.join('')
	}

	/**
	 * Add two _UINT32_. The current _UINT32_ stores the result
	 * @method add
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.add = function (other) {
		var a00 = this._low + other._low
		var a16 = a00 >>> 16

		a16 += this._high + other._high

		this._low = a00 & 0xFFFF
		this._high = a16 & 0xFFFF

		return this
	}

	/**
	 * Subtract two _UINT32_. The current _UINT32_ stores the result
	 * @method subtract
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.subtract = function (other) {
		//TODO inline
		return this.add( other.clone().negate() )
	}

	/**
	 * Multiply two _UINT32_. The current _UINT32_ stores the result
	 * @method multiply
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.multiply = function (other) {
		/*
			a = a00 + a16
			b = b00 + b16
			a*b = (a00 + a16)(b00 + b16)
				= a00b00 + a00b16 + a16b00 + a16b16

			a16b16 overflows the 32bits
		 */
		var a16 = this._high
		var a00 = this._low
		var b16 = other._high
		var b00 = other._low

/* Removed to increase speed under normal circumstances (i.e. not multiplying by 0 or 1)
		// this == 0 or other == 1: nothing to do
		if ((a00 == 0 && a16 == 0) || (b00 == 1 && b16 == 0)) return this

		// other == 0 or this == 1: this = other
		if ((b00 == 0 && b16 == 0) || (a00 == 1 && a16 == 0)) {
			this._low = other._low
			this._high = other._high
			return this
		}
*/

		var c16, c00
		c00 = a00 * b00
		c16 = c00 >>> 16

		c16 += a16 * b00
		c16 &= 0xFFFF		// Not required but improves performance
		c16 += a00 * b16

		this._low = c00 & 0xFFFF
		this._high = c16 & 0xFFFF

		return this
	}

	/**
	 * Divide two _UINT32_. The current _UINT32_ stores the result.
	 * The remainder is made available as the _remainder_ property on
	 * the _UINT32_ object. It can be null, meaning there are no remainder.
	 * @method div
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.div = function (other) {
		if ( (other._low == 0) && (other._high == 0) ) throw Error('division by zero')

		// other == 1
		if (other._high == 0 && other._low == 1) {
			this.remainder = new UINT32(0)
			return this
		}

		// other > this: 0
		if ( other.gt(this) ) {
			this.remainder = new UINT32(0)
			this._low = 0
			this._high = 0
			return this
		}
		// other == this: 1
		if ( this.eq(other) ) {
			this.remainder = new UINT32(0)
			this._low = 1
			this._high = 0
			return this
		}

		// Shift the divisor left until it is higher than the dividend
		var _other = other.clone()
		var i = -1
		while ( !this.lt(_other) ) {
			// High bit can overflow the default 16bits
			// Its ok since we right shift after this loop
			// The overflown bit must be kept though
			_other.shiftLeft(1, true)
			i++
		}

		// Set the remainder
		this.remainder = this.clone()
		// Initialize the current result to 0
		this._low = 0
		this._high = 0
		for (; i >= 0; i--) {
			_other.shiftRight(1)
			// If shifted divisor is smaller than the dividend
			// then subtract it from the dividend
			if ( !this.remainder.lt(_other) ) {
				this.remainder.subtract(_other)
				// Update the current result
				if (i >= 16) {
					this._high |= 1 << (i - 16)
				} else {
					this._low |= 1 << i
				}
			}
		}

		return this
	}

	/**
	 * Negate the current _UINT32_
	 * @method negate
	 * @return ThisExpression
	 */
	UINT32.prototype.negate = UINT32.prototype.not = function () {
		var v = ( ~this._low & 0xFFFF ) + 1
		this._low = v & 0xFFFF
		this._high = (~this._high + (v >>> 16)) & 0xFFFF

		return this
	}

	/**
	 * Equals
	 * @method eq
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.equals = UINT32.prototype.eq = function (other) {
		return (this._low == other._low) && (this._high == other._high)
	}

	/**
	 * Greater than (strict)
	 * @method gt
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.greaterThan = UINT32.prototype.gt = function (other) {
		if (this._high > other._high) return true
		if (this._high < other._high) return false
		return this._low > other._low
	}

	/**
	 * Less than (strict)
	 * @method lt
	 * @param {Object} other UINT32
	 * @return {Boolean}
	 */
	UINT32.prototype.lessThan = UINT32.prototype.lt = function (other) {
		if (this._high < other._high) return true
		if (this._high > other._high) return false
		return this._low < other._low
	}

	/**
	 * Bitwise OR
	 * @method or
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.or = function (other) {
		this._low |= other._low
		this._high |= other._high

		return this
	}

	/**
	 * Bitwise AND
	 * @method and
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.and = function (other) {
		this._low &= other._low
		this._high &= other._high

		return this
	}

	/**
	 * Bitwise XOR
	 * @method xor
	 * @param {Object} other UINT32
	 * @return ThisExpression
	 */
	UINT32.prototype.xor = function (other) {
		this._low ^= other._low
		this._high ^= other._high

		return this
	}

	/**
	 * Bitwise shift right
	 * @method shiftRight
	 * @param {Number} number of bits to shift
	 * @return ThisExpression
	 */
	UINT32.prototype.shiftRight = UINT32.prototype.shiftr = function (n) {
		if (n > 16) {
			this._low = this._high >> (n - 16)
			this._high = 0
		} else if (n == 16) {
			this._low = this._high
			this._high = 0
		} else {
			this._low = (this._low >> n) | ( (this._high << (16-n)) & 0xFFFF )
			this._high >>= n
		}

		return this
	}

	/**
	 * Bitwise shift left
	 * @method shiftLeft
	 * @param {Number} number of bits to shift
	 * @param {Boolean} allow overflow
	 * @return ThisExpression
	 */
	UINT32.prototype.shiftLeft = UINT32.prototype.shiftl = function (n, allowOverflow) {
		if (n > 16) {
			this._high = this._low << (n - 16)
			this._low = 0
			if (!allowOverflow) {
				this._high &= 0xFFFF
			}
		} else if (n == 16) {
			this._high = this._low
			this._low = 0
		} else {
			this._high = (this._high << n) | (this._low >> (16-n))
			this._low = (this._low << n) & 0xFFFF
			if (!allowOverflow) {
				// Overflow only allowed on the high bits...
				this._high &= 0xFFFF
			}
		}

		return this
	}

	/**
	 * Bitwise rotate left
	 * @method rotl
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT32.prototype.rotateLeft = UINT32.prototype.rotl = function (n) {
		var v = (this._high << 16) | this._low
		v = (v << n) | (v >>> (32 - n))
		this._low = v & 0xFFFF
		this._high = v >>> 16

		return this
	}

	/**
	 * Bitwise rotate right
	 * @method rotr
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT32.prototype.rotateRight = UINT32.prototype.rotr = function (n) {
		var v = (this._high << 16) | this._low
		v = (v >>> n) | (v << (32 - n))
		this._low = v & 0xFFFF
		this._high = v >>> 16

		return this
	}

	/**
	 * Clone the current _UINT32_
	 * @method clone
	 * @return {Object} cloned UINT32
	 */
	UINT32.prototype.clone = function () {
		return new UINT32(this._low, this._high)
	}

	if (typeof define != 'undefined' && define.amd) {
		// AMD / RequireJS
		define([], function () {
			return UINT32
		})
	} else if (typeof module != 'undefined' && module.exports) {
		// Node.js
		module.exports = UINT32
	} else {
		// Browser
		root['UINT32'] = UINT32
	}

})(this)
},{}],20:[function(require,module,exports){
/**
	C-like unsigned 64 bits integers in Javascript
	Copyright (C) 2013, Pierre Curto
	MIT license
 */
;(function (root) {

	// Local cache for typical radices
	var radixPowerCache = {
		16: UINT64( Math.pow(16, 5) )
	,	10: UINT64( Math.pow(10, 5) )
	,	2:  UINT64( Math.pow(2, 5) )
	}
	var radixCache = {
		16: UINT64(16)
	,	10: UINT64(10)
	,	2:  UINT64(2)
	}

	/**
	 *	Represents an unsigned 64 bits integer
	 * @constructor
	 * @param {Number} first low bits (8)
	 * @param {Number} second low bits (8)
	 * @param {Number} first high bits (8)
	 * @param {Number} second high bits (8)
	 * or
	 * @param {Number} low bits (32)
	 * @param {Number} high bits (32)
	 * or
	 * @param {String|Number} integer as a string 		 | integer as a number
	 * @param {Number|Undefined} radix (optional, default=10)
	 * @return 
	 */
	function UINT64 (a00, a16, a32, a48) {
		if ( !(this instanceof UINT64) )
			return new UINT64(a00, a16, a32, a48)

		this.remainder = null
		if (typeof a00 == 'string')
			return fromString.call(this, a00, a16)

		if (typeof a16 == 'undefined')
			return fromNumber.call(this, a00)

		fromBits.apply(this, arguments)
	}

	/**
	 * Set the current _UINT64_ object with its low and high bits
	 * @method fromBits
	 * @param {Number} first low bits (8)
	 * @param {Number} second low bits (8)
	 * @param {Number} first high bits (8)
	 * @param {Number} second high bits (8)
	 * or
	 * @param {Number} low bits (32)
	 * @param {Number} high bits (32)
	 * @return ThisExpression
	 */
	function fromBits (a00, a16, a32, a48) {
		if (typeof a32 == 'undefined') {
			this._a00 = a00 & 0xFFFF
			this._a16 = a00 >>> 16
			this._a32 = a16 & 0xFFFF
			this._a48 = a16 >>> 16
			return this
		}

		this._a00 = a00 | 0
		this._a16 = a16 | 0
		this._a32 = a32 | 0
		this._a48 = a48 | 0

		return this
	}
	UINT64.prototype.fromBits = fromBits

	/**
	 * Set the current _UINT64_ object from a number
	 * @method fromNumber
	 * @param {Number} number
	 * @return ThisExpression
	 */
	function fromNumber (value) {
		this._a00 = value & 0xFFFF
		this._a16 = value >>> 16
		this._a32 = 0
		this._a48 = 0

		return this
	}
	UINT64.prototype.fromNumber = fromNumber

	/**
	 * Set the current _UINT64_ object from a string
	 * @method fromString
	 * @param {String} integer as a string
	 * @param {Number} radix (optional, default=10)
	 * @return ThisExpression
	 */
	function fromString (s, radix) {
		radix = radix || 10

		this._a00 = 0
		this._a16 = 0
		this._a32 = 0
		this._a48 = 0

		/*
			In Javascript, bitwise operators only operate on the first 32 bits 
			of a number, even though parseInt() encodes numbers with a 53 bits 
			mantissa.
			Therefore UINT64(<Number>) can only work on 32 bits.
			The radix maximum value is 36 (as per ECMA specs) (26 letters + 10 digits)
			maximum input value is m = 32bits as 1 = 2^32 - 1
			So the maximum substring length n is:
			36^(n+1) - 1 = 2^32 - 1
			36^(n+1) = 2^32
			(n+1)ln(36) = 32ln(2)
			n = 32ln(2)/ln(36) - 1
			n = 5.189644915687692
			n = 5
		 */
		var radixUint = radixPowerCache[radix] || new UINT64( Math.pow(radix, 5) )

		for (var i = 0, len = s.length; i < len; i += 5) {
			var size = Math.min(5, len - i)
			var value = parseInt( s.slice(i, i + size), radix )
			this.multiply(
					size < 5
						? new UINT64( Math.pow(radix, size) )
						: radixUint
				)
				.add( new UINT64(value) )
		}

		return this
	}
	UINT64.prototype.fromString = fromString

	/**
	 * Convert this _UINT64_ to a number (last 32 bits are dropped)
	 * @method toNumber
	 * @return {Number} the converted UINT64
	 */
	UINT64.prototype.toNumber = function () {
		return (this._a16 << 16) | this._a00
	}

	/**
	 * Convert this _UINT64_ to a string
	 * @method toString
	 * @param {Number} radix (optional, default=10)
	 * @return {String} the converted UINT64
	 */
	UINT64.prototype.toString = function (radix) {
		radix = radix || 10
		var radixUint = radixCache[radix] || new UINT64(radix)

		if ( !this.gt(radixUint) ) return this.toNumber().toString(radix)

		var self = this.clone()
		var res = new Array(64)
		for (var i = 63; i >= 0; i--) {
			self.div(radixUint)
			res[i] = self.remainder.toNumber().toString(radix)
			if ( !self.gt(radixUint) ) break
		}
		res[i-1] = self.toNumber().toString(radix)

		return res.join('')
	}

	/**
	 * Add two _UINT64_. The current _UINT64_ stores the result
	 * @method add
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.add = function (other) {
		var a00 = this._a00 + other._a00

		var a16 = a00 >>> 16
		a16 += this._a16 + other._a16

		var a32 = a16 >>> 16
		a32 += this._a32 + other._a32

		var a48 = a32 >>> 16
		a48 += this._a48 + other._a48

		this._a00 = a00 & 0xFFFF
		this._a16 = a16 & 0xFFFF
		this._a32 = a32 & 0xFFFF
		this._a48 = a48 & 0xFFFF

		return this
	}

	/**
	 * Subtract two _UINT64_. The current _UINT64_ stores the result
	 * @method subtract
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.subtract = function (other) {
		return this.add( other.clone().negate() )
	}

	/**
	 * Multiply two _UINT64_. The current _UINT64_ stores the result
	 * @method multiply
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.multiply = function (other) {
		/*
			a = a00 + a16 + a32 + a48
			b = b00 + b16 + b32 + b48
			a*b = (a00 + a16 + a32 + a48)(b00 + b16 + b32 + b48)
				= a00b00 + a00b16 + a00b32 + a00b48
				+ a16b00 + a16b16 + a16b32 + a16b48
				+ a32b00 + a32b16 + a32b32 + a32b48
				+ a48b00 + a48b16 + a48b32 + a48b48

			a16b48, a32b32, a48b16, a48b32 and a48b48 overflow the 64 bits
			so it comes down to:
			a*b	= a00b00 + a00b16 + a00b32 + a00b48
				+ a16b00 + a16b16 + a16b32
				+ a32b00 + a32b16
				+ a48b00
				= a00b00
				+ a00b16 + a16b00
				+ a00b32 + a16b16 + a32b00
				+ a00b48 + a16b32 + a32b16 + a48b00
		 */
		var a00 = this._a00
		var a16 = this._a16
		var a32 = this._a32
		var a48 = this._a48
		var b00 = other._a00
		var b16 = other._a16
		var b32 = other._a32
		var b48 = other._a48

		var c00 = a00 * b00

		var c16 = c00 >>> 16
		c16 += a00 * b16
		var c32 = c16 >>> 16
		c16 &= 0xFFFF
		c16 += a16 * b00

		c32 += c16 >>> 16
		c32 += a00 * b32
		var c48 = c32 >>> 16
		c32 &= 0xFFFF
		c32 += a16 * b16
		c48 += c32 >>> 16
		c32 &= 0xFFFF
		c32 += a32 * b00

		c48 += c32 >>> 16
		c48 += a00 * b48
		c48 &= 0xFFFF
		c48 += a16 * b32
		c48 &= 0xFFFF
		c48 += a32 * b16
		c48 &= 0xFFFF
		c48 += a48 * b00

		this._a00 = c00 & 0xFFFF
		this._a16 = c16 & 0xFFFF
		this._a32 = c32 & 0xFFFF
		this._a48 = c48 & 0xFFFF

		return this
	}

	/**
	 * Divide two _UINT64_. The current _UINT64_ stores the result.
	 * The remainder is made available as the _remainder_ property on
	 * the _UINT64_ object. It can be null, meaning there are no remainder.
	 * @method div
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.div = function (other) {
		if ( (other._a16 == 0) && (other._a32 == 0) && (other._a48 == 0) ) {
			if (other._a00 == 0) throw Error('division by zero')

			// other == 1: this
			if (other._a00 == 1) {
				this.remainder = new UINT64(0)
				return this
			}
		}

		// other > this: 0
		if ( other.gt(this) ) {
			this.remainder = new UINT64(0)
			this._a00 = 0
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
			return this
		}
		// other == this: 1
		if ( this.eq(other) ) {
			this.remainder = new UINT64(0)
			this._a00 = 1
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
			return this
		}

		// Shift the divisor left until it is higher than the dividend
		var _other = other.clone()
		var i = -1
		while ( !this.lt(_other) ) {
			// High bit can overflow the default 16bits
			// Its ok since we right shift after this loop
			// The overflown bit must be kept though
			_other.shiftLeft(1, true)
			i++
		}

		// Set the remainder
		this.remainder = this.clone()
		// Initialize the current result to 0
		this._a00 = 0
		this._a16 = 0
		this._a32 = 0
		this._a48 = 0
		for (; i >= 0; i--) {
			_other.shiftRight(1)
			// If shifted divisor is smaller than the dividend
			// then subtract it from the dividend
			if ( !this.remainder.lt(_other) ) {
				this.remainder.subtract(_other)
				// Update the current result
				if (i >= 48) {
					this._a48 |= 1 << (i - 48)
				} else if (i >= 32) {
					this._a32 |= 1 << (i - 32)
				} else if (i >= 16) {
					this._a16 |= 1 << (i - 16)
				} else {
					this._a00 |= 1 << i
				}
			}
		}

		return this
	}

	/**
	 * Negate the current _UINT64_
	 * @method negate
	 * @return ThisExpression
	 */
	UINT64.prototype.negate = UINT64.prototype.not = function () {
		var v = ( ~this._a00 & 0xFFFF ) + 1
		this._a00 = v & 0xFFFF
		v = (~this._a16 & 0xFFFF) + (v >>> 16)
		this._a16 = v & 0xFFFF
		v = (~this._a32 & 0xFFFF) + (v >>> 16)
		this._a32 = v & 0xFFFF
		this._a48 = (~this._a48 + (v >>> 16)) & 0xFFFF

		return this
	}

	/**

	 * @method eq
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.equals = UINT64.prototype.eq = function (other) {
		return (this._a48 == other._a48) && (this._a00 == other._a00)
			 && (this._a32 == other._a32) && (this._a16 == other._a16)
	}

	/**
	 * Greater than (strict)
	 * @method gt
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.greaterThan = UINT64.prototype.gt = function (other) {
		if (this._a48 > other._a48) return true
		if (this._a48 < other._a48) return false
		if (this._a32 > other._a32) return true
		if (this._a32 < other._a32) return false
		if (this._a16 > other._a16) return true
		if (this._a16 < other._a16) return false
		return this._a00 > other._a00
	}

	/**
	 * Less than (strict)
	 * @method lt
	 * @param {Object} other UINT64
	 * @return {Boolean}
	 */
	UINT64.prototype.lessThan = UINT64.prototype.lt = function (other) {
		if (this._a48 < other._a48) return true
		if (this._a48 > other._a48) return false
		if (this._a32 < other._a32) return true
		if (this._a32 > other._a32) return false
		if (this._a16 < other._a16) return true
		if (this._a16 > other._a16) return false
		return this._a00 < other._a00
	}

	/**
	 * Bitwise OR
	 * @method or
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.or = function (other) {
		this._a00 |= other._a00
		this._a16 |= other._a16
		this._a32 |= other._a32
		this._a48 |= other._a48

		return this
	}

	/**
	 * Bitwise AND
	 * @method and
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.and = function (other) {
		this._a00 &= other._a00
		this._a16 &= other._a16
		this._a32 &= other._a32
		this._a48 &= other._a48

		return this
	}

	/**
	 * Bitwise XOR
	 * @method xor
	 * @param {Object} other UINT64
	 * @return ThisExpression
	 */
	UINT64.prototype.xor = function (other) {
		this._a00 ^= other._a00
		this._a16 ^= other._a16
		this._a32 ^= other._a32
		this._a48 ^= other._a48

		return this
	}

	/**
	 * Bitwise shift right
	 * @method shiftRight
	 * @param {Number} number of bits to shift
	 * @return ThisExpression
	 */
	UINT64.prototype.shiftRight = UINT64.prototype.shiftr = function (n) {
		n %= 64
		if (n >= 48) {
			this._a00 = this._a48 >> (n - 48)
			this._a16 = 0
			this._a32 = 0
			this._a48 = 0
		} else if (n >= 32) {
			n -= 32
			this._a00 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a16 = (this._a48 >> n) & 0xFFFF
			this._a32 = 0
			this._a48 = 0
		} else if (n >= 16) {
			n -= 16
			this._a00 = ( (this._a16 >> n) | (this._a32 << (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a32 = (this._a48 >> n) & 0xFFFF
			this._a48 = 0
		} else {
			this._a00 = ( (this._a00 >> n) | (this._a16 << (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a16 >> n) | (this._a32 << (16-n)) ) & 0xFFFF
			this._a32 = ( (this._a32 >> n) | (this._a48 << (16-n)) ) & 0xFFFF
			this._a48 = (this._a48 >> n) & 0xFFFF
		}

		return this
	}

	/**
	 * Bitwise shift left
	 * @method shiftLeft
	 * @param {Number} number of bits to shift
	 * @param {Boolean} allow overflow
	 * @return ThisExpression
	 */
	UINT64.prototype.shiftLeft = UINT64.prototype.shiftl = function (n, allowOverflow) {
		n %= 64
		if (n >= 48) {
			this._a48 = this._a00 << (n - 48)
			this._a32 = 0
			this._a16 = 0
			this._a00 = 0
		} else if (n >= 32) {
			n -= 32
			this._a48 = (this._a16 << n) | (this._a00 >> (16-n))
			this._a32 = (this._a00 << n) & 0xFFFF
			this._a16 = 0
			this._a00 = 0
		} else if (n >= 16) {
			n -= 16
			this._a48 = (this._a32 << n) | (this._a16 >> (16-n))
			this._a32 = ( (this._a16 << n) | (this._a00 >> (16-n)) ) & 0xFFFF
			this._a16 = (this._a00 << n) & 0xFFFF
			this._a00 = 0
		} else {
			this._a48 = (this._a48 << n) | (this._a32 >> (16-n))
			this._a32 = ( (this._a32 << n) | (this._a16 >> (16-n)) ) & 0xFFFF
			this._a16 = ( (this._a16 << n) | (this._a00 >> (16-n)) ) & 0xFFFF
			this._a00 = (this._a00 << n) & 0xFFFF
		}
		if (!allowOverflow) {
			this._a48 &= 0xFFFF
		}

		return this
	}

	/**
	 * Bitwise rotate left
	 * @method rotl
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT64.prototype.rotateLeft = UINT64.prototype.rotl = function (n) {
		n %= 64
		if (n == 0) return this
		if (n >= 32) {
			// A.B.C.D
			// B.C.D.A rotl(16)
			// C.D.A.B rotl(32)
			var v = this._a00
			this._a00 = this._a32
			this._a32 = v
			v = this._a48
			this._a48 = this._a16
			this._a16 = v
			if (n == 32) return this
			n -= 32
		}

		var high = (this._a48 << 16) | this._a32
		var low = (this._a16 << 16) | this._a00

		var _high = (high << n) | (low >>> (32 - n))
		var _low = (low << n) | (high >>> (32 - n))

		this._a00 = _low & 0xFFFF
		this._a16 = _low >>> 16
		this._a32 = _high & 0xFFFF
		this._a48 = _high >>> 16

		return this
	}

	/**
	 * Bitwise rotate right
	 * @method rotr
	 * @param {Number} number of bits to rotate
	 * @return ThisExpression
	 */
	UINT64.prototype.rotateRight = UINT64.prototype.rotr = function (n) {
		n %= 64
		if (n == 0) return this
		if (n >= 32) {
			// A.B.C.D
			// D.A.B.C rotr(16)
			// C.D.A.B rotr(32)
			var v = this._a00
			this._a00 = this._a32
			this._a32 = v
			v = this._a48
			this._a48 = this._a16
			this._a16 = v
			if (n == 32) return this
			n -= 32
		}

		var high = (this._a48 << 16) | this._a32
		var low = (this._a16 << 16) | this._a00

		var _high = (high >>> n) | (low << (32 - n))
		var _low = (low >>> n) | (high << (32 - n))

		this._a00 = _low & 0xFFFF
		this._a16 = _low >>> 16
		this._a32 = _high & 0xFFFF
		this._a48 = _high >>> 16

		return this
	}

	/**
	 * Clone the current _UINT64_
	 * @method clone
	 * @return {Object} cloned UINT64
	 */
	UINT64.prototype.clone = function () {
		return new UINT64(this._a00, this._a16, this._a32, this._a48)
	}

	if (typeof define != 'undefined' && define.amd) {
		// AMD / RequireJS
		define([], function () {
			return UINT64
		})
	} else if (typeof module != 'undefined' && module.exports) {
		// Node.js
		module.exports = UINT64
	} else {
		// Browser
		root['UINT64'] = UINT64
	}

})(this)
},{}],21:[function(require,module,exports){
var Buffer=require("__browserify_Buffer").Buffer;/**
	xxHash implementation in pure Javascript

	Copyright (C) 2013, Pierre Curto
	MIT license
 */
;(function (root) {

	var UINT32 = require('cuint').UINT32

	/*
		Merged this sequence of method calls as it speeds up
		the calculations by a factor of 2
	 */
	// this.v1.add( other.multiply(PRIME32_2) ).rotl(13).multiply(PRIME32_1);
	UINT32.prototype.xxh_update = function (low, high) {
		var b00 = PRIME32_2._low
		var b16 = PRIME32_2._high

		var c16, c00
		c00 = low * b00
		c16 = c00 >>> 16

		c16 += high * b00
		c16 &= 0xFFFF		// Not required but improves performance
		c16 += low * b16

		var a00 = this._low + (c00 & 0xFFFF)
		var a16 = a00 >>> 16

		a16 += this._high + (c16 & 0xFFFF)

		var v = (a16 << 16) | (a00 & 0xFFFF)
		v = (v << 13) | (v >>> 19)

		a00 = v & 0xFFFF
		a16 = v >>> 16

		b00 = PRIME32_1._low
		b16 = PRIME32_1._high

		c00 = a00 * b00
		c16 = c00 >>> 16

		c16 += a16 * b00
		c16 &= 0xFFFF		// Not required but improves performance
		c16 += a00 * b16

		this._low = c00 & 0xFFFF
		this._high = c16 & 0xFFFF
	}

	/*
	 * Constants
	 */
	var PRIME32_1 = UINT32( '2654435761' )
	var PRIME32_2 = UINT32( '2246822519' )
	var PRIME32_3 = UINT32( '3266489917' )
	var PRIME32_4 = UINT32(  '668265263' )
	var PRIME32_5 = UINT32(  '374761393' )

	var PRIME32_1plus2 = PRIME32_1.clone().add(PRIME32_2)

	/**
	 * XXH object used as a constructor or a function
	 * @constructor
	 * or
	 * @param {Object|String} input data
	 * @param {Number|UINT32} seed
	 * @return ThisExpression
	 * or
	 * @return {UINT32} xxHash
	 */
	function XXH () {
		if (arguments.length == 2)
			return new XXH( arguments[1] ).update( arguments[0] ).digest()

		if (!(this instanceof XXH))
			return new XXH( arguments[0] )

		init.call(this, arguments[0])
	}

	/**
	 * Initialize the XXH instance with the given seed
	 * @method init
	 * @param {Number|Object} seed as a number or an unsigned 32 bits integer
	 * @return ThisExpression
	 */
	 function init (seed) {
		this.seed = seed instanceof UINT32 ? seed.clone() : UINT32(seed)
		this.v1 = this.seed.clone().add(PRIME32_1plus2)
		this.v2 = this.seed.clone().add(PRIME32_2)
		this.v3 = this.seed.clone()
		this.v4 = this.seed.clone().subtract(PRIME32_1)
		this.total_len = 0
		this.memsize = 0
		this.memory = new Buffer(16)

		return this
	}
	XXH.prototype.init = init

	/**
	 * Add data to be computed for the XXH hash
	 * @method update
	 * @param {String|Buffer} input as a string or nodejs Buffer
	 * @return ThisExpression
	 */
	XXH.prototype.update = function (input) {
		var isString = typeof input == 'string'
		var p = 0
		var len = input.length
		var bEnd = p + len

		if (len == 0) return this

		this.total_len += len

		if (this.memsize == 0 && isString) this.memory = ''

		if (this.memsize + len < 16)   // fill in tmp buffer
		{
			// XXH_memcpy(this.memory + this.memsize, input, len)
			if (isString) {
				this.memory += input
			} else {
				input.copy( this.memory, this.memsize, 0, len )
			}

			this.memsize += len
			return this
		}

		if (this.memsize > 0)   // some data left from previous update
		{
			// XXH_memcpy(this.memory + this.memsize, input, 16-this.memsize);
			if (isString) {
				this.memory += input.slice(0, 16 - this.memsize)
			} else {
				input.copy( this.memory, this.memsize, 0, 16 - this.memsize )
			}

			var p32 = 0
			if (isString) {
				this.v1.xxh_update(
					(this.memory.charCodeAt(p32+1) << 8) | this.memory.charCodeAt(p32)
				,	(this.memory.charCodeAt(p32+3) << 8) | this.memory.charCodeAt(p32+2)
				)
				p32 += 4
				this.v2.xxh_update(
					(this.memory.charCodeAt(p32+1) << 8) | this.memory.charCodeAt(p32)
				,	(this.memory.charCodeAt(p32+3) << 8) | this.memory.charCodeAt(p32+2)
				)
				p32 += 4
				this.v3.xxh_update(
					(this.memory.charCodeAt(p32+1) << 8) | this.memory.charCodeAt(p32)
				,	(this.memory.charCodeAt(p32+3) << 8) | this.memory.charCodeAt(p32+2)
				)
				p32 += 4
				this.v4.xxh_update(
					(this.memory.charCodeAt(p32+1) << 8) | this.memory.charCodeAt(p32)
				,	(this.memory.charCodeAt(p32+3) << 8) | this.memory.charCodeAt(p32+2)
				)
			} else {
				this.v1.xxh_update(
					(this.memory[p32+1] << 8) | this.memory[p32]
				,	(this.memory[p32+3] << 8) | this.memory[p32+2]
				)
				p32 += 4
				this.v2.xxh_update(
					(this.memory[p32+1] << 8) | this.memory[p32]
				,	(this.memory[p32+3] << 8) | this.memory[p32+2]
				)
				p32 += 4
				this.v3.xxh_update(
					(this.memory[p32+1] << 8) | this.memory[p32]
				,	(this.memory[p32+3] << 8) | this.memory[p32+2]
				)
				p32 += 4
				this.v4.xxh_update(
					(this.memory[p32+1] << 8) | this.memory[p32]
				,	(this.memory[p32+3] << 8) | this.memory[p32+2]
				)
			}

			p += 16 - this.memsize
			this.memsize = 0
			if (isString) this.memory = ''
		}

		if (p <= bEnd - 16)
		{
			var limit = bEnd - 16

			do
			{
				if (isString) {
					this.v1.xxh_update(
						(input.charCodeAt(p+1) << 8) | input.charCodeAt(p)
					,	(input.charCodeAt(p+3) << 8) | input.charCodeAt(p+2)
					)
					p += 4
					this.v2.xxh_update(
						(input.charCodeAt(p+1) << 8) | input.charCodeAt(p)
					,	(input.charCodeAt(p+3) << 8) | input.charCodeAt(p+2)
					)
					p += 4
					this.v3.xxh_update(
						(input.charCodeAt(p+1) << 8) | input.charCodeAt(p)
					,	(input.charCodeAt(p+3) << 8) | input.charCodeAt(p+2)
					)
					p += 4
					this.v4.xxh_update(
						(input.charCodeAt(p+1) << 8) | input.charCodeAt(p)
					,	(input.charCodeAt(p+3) << 8) | input.charCodeAt(p+2)
					)
				} else {
					this.v1.xxh_update(
						(input[p+1] << 8) | input[p]
					,	(input[p+3] << 8) | input[p+2]
					)
					p += 4
					this.v2.xxh_update(
						(input[p+1] << 8) | input[p]
					,	(input[p+3] << 8) | input[p+2]
					)
					p += 4
					this.v3.xxh_update(
						(input[p+1] << 8) | input[p]
					,	(input[p+3] << 8) | input[p+2]
					)
					p += 4
					this.v4.xxh_update(
						(input[p+1] << 8) | input[p]
					,	(input[p+3] << 8) | input[p+2]
					)
				}
				p += 4
			} while (p <= limit)
		}

		if (p < bEnd)
		{
			// XXH_memcpy(this.memory, p, bEnd-p);
			if (isString) {
				this.memory += input.slice(p)
			} else {
				input.copy( this.memory, this.memsize, p, bEnd )
			}

			this.memsize = bEnd - p
		}

		return this
	}

	/**
	 * Finalize the XXH computation. The XXH instance is ready for reuse for the given seed
	 * @method digest
	 * @return {UINT32} xxHash
	 */
	XXH.prototype.digest = function () {
		var input = this.memory
		var isString = typeof input == 'string'
		var p = 0
		var bEnd = this.memsize
		var h32, h
		var u = new UINT32

		if (this.total_len >= 16)
		{
			h32 = this.v1.rotl(1).add( this.v2.rotl(7).add( this.v3.rotl(12).add( this.v4.rotl(18) ) ) )
		}
		else
		{
			h32  = this.seed.add( PRIME32_5 )
		}

		h32.add( u.fromNumber(this.total_len) )

		while (p <= bEnd - 4)
		{
			if (isString) {
				u.fromBits(
					(input.charCodeAt(p+1) << 8) | input.charCodeAt(p)
				,	(input.charCodeAt(p+3) << 8) | input.charCodeAt(p+2)
				)
			} else {
				u.fromBits(
					(input[p+1] << 8) | input[p]
				,	(input[p+3] << 8) | input[p+2]
				)
			}
			h32
				.add( u.multiply(PRIME32_3) )
				.rotl(17)
				.multiply( PRIME32_4 )
			p += 4
		}

		while (p < bEnd)
		{
			u.fromBits( isString ? input.charCodeAt(p++) : input[p++], 0 )
			h32
				.add( u.multiply(PRIME32_5) )
				.rotl(11)
				.multiply(PRIME32_1)
		}

		h = h32.clone().shiftRight(15)
		h32.xor(h).multiply(PRIME32_2)

		h = h32.clone().shiftRight(13)
		h32.xor(h).multiply(PRIME32_3)

		h = h32.clone().shiftRight(16)
		h32.xor(h)

		// Reset the state
		this.init( this.seed )

		return h32
	}

	if (typeof define != 'undefined' && define.amd) {
		// AMD / RequireJS
		define([], function () {
			return XXH
		})
	} else if (typeof module != 'undefined' && module.exports) {
		// Node.js
		module.exports = XXH
	} else {
		// Browser
		root['XXH'] = XXH
	}

})(this)
},{"__browserify_Buffer":3,"cuint":18}]},{},[7])(7)
});
;