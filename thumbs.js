;(function () {

var ObjProto = Object.prototype
var toString = ObjProto.toString
var isFunction = function (obj) { return toString.call(obj) == '[object Function]'; }
var isObject = function (obj) { return obj === Object(obj); }
//todo: use native if available like underscore.js
var isArray = function(obj) { return toString.call(obj) == '[object Array]'; };
var isString = function(obj) { return toString.call(obj) == '[object String]'; };

var root = this;
var thumbs;
if (typeof exports !== 'undefined') {
  thumbs = exports;
  thumbs.global = global
} else {
  thumbs = root.thumbs = {};
  thumbs.global = window
}


var globalScope = thumbs.scope = {thumbs: thumbs}

var killSignal = "stooooooop!!!!!";

var flattenNestings = function (code, fileName) {
  //flatten nestings and one-line strings

  originalCode = "" +
    "double . x" +
    "  mult x 2" +
    "ten double 5"
  
  return [
    [0, fileName, "double", "fn", 3],
    [2, fileName, "ten", "double", 5],
    [2, fileName, "stop"],
    [0, fileName, "x", "args", 0],
    [1, fileName, "mult", "x", 2],
    [1, fileName, "return"]
  ]
}


var currentLineNumber = 0
var currentFileName = ""
var pc = 0;

var funcBag = [];
var funcBagStack = [funcBag];
var args = [];

var rawCall = function () {
    
}
var rawPushToCall = function () {}
var rawSetLineNumber = function (lineNumber) { currentLineNumber = lineNumber; }
var rawSetFileName = function (fileName) { currentFileName = fileName }
var rawGet = function (arg) { console.log("getting " + arg + "(" + pc + ")") }

var makeCachingSystem = function (fn) {
  //just caches the func, arg pair so i don't new up a bunch of arrays
  var cache = {} 
  return function (arg) {
    if (arg in cache) {
      return cache[arg] 
    } else {
      var ret = cache[arg] = function () {
        fn(arg);
      }
      return ret;
    }
  }
}

var getCachedLineNumberByteCode = makeCachingSystem(rawSetLineNumber);
var getCachedFileNameByteCode = makeCachingSystem(rawSetFileName)
var getCachedGetByteCode = makeCachingSystem(rawGet)

var phase2to3map = {} 
var flattenCodeArrays = function (codeArrays) {
  var flattenedCodeArray = []
  phase2to3map[]
  for (var i = 0; i < codeArrays.length; i++) {
    var codeArray = codeArrays[i]
    var lineNumber = codeArray[0]
    var fileName = codeArray[1]
    phase2to3map[i] = flattenedCodeArray.length;
    flattenedCodeArray.push(getCachedLineNumberByteCode(lineNumber))
    flattenedCodeArray.push(getCachedFileNameByteCode(fileName))
    for (var j = 2; j < codeArray.length; j++) {
      var word = codeArray[j];
      flattenedCodeArray.push(getCachedGetByteCode(word));
      flattenedCodeArray.push(rawPushToCall);
    }
    flattenedCodeArray.push(rawCall);
  }
  return flattenedCodeArray
}

var run = function (code, fileName, scope) {
  phase2code = flattenNestings(code, fileName);
  phase3code = flattenCodeArrays(phase2code, fileName);
  while (true) {
    todo = phase3code[pc]; 
    if (!todo) break;
    todo();
    pc += 1
  }
}

var pc = 0; //program counter

var runFile = function (file) {
  var fs = require("fs");
  var code = fs.readFileSync(file).toString();
  var ran = run(code) 
  return ran;
}    


thumbs.runScripts = runScripts
thumbs.run = run //runs raw code
thumbs.runFile = runFile

//borrowed from
//https://raw.github.com/jashkenas/coffee-script/master/src/browser.coffee

if (typeof window === "undefined" || window === null) return;

thumbs.load = function(url, callback) {
  var xhr;
  xhr = new (window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
  xhr.open('GET', url, true);
  if ('overrideMimeType' in xhr) xhr.overrideMimeType('text/plain');
  xhr.onreadystatechange = function() {
    var _ref;
    if (xhr.readyState === 4) {
      if ((_ref = xhr.status) === 0 || _ref === 200) {
        thumbs.run(xhr.responseText, url);
      } else {
        throw new Error("Could not load " + url);
      }
      if (callback) return callback();
    }
  };
  return xhr.send(null);
};

var runScripts = function() {
  var thumbses, execute, index, length, s, scripts;
  scripts = document.getElementsByTagName('script');
  thumbses = (function() {
    var _i, _len, _results;
    _results = [];
    for (_i = 0, _len = scripts.length; _i < _len; _i++) {
      s = scripts[_i];
      if (s.type === 'text/thumbs' || s.type == "thumbs") _results.push(s);
    }
    return _results;
  })();
  index = 0;
  length = thumbses.length;
  (execute = function() {
    var script;
    script = thumbses[index++];
    var scriptType = (script != null ? script.type : void 0)
    if (scriptType === 'text/thumbs' || scriptType === "thumbs") {
      if (script.src) {
        return thumbs.load(script.src, execute);
      } else {
        thumbs.run(script.innerHTML.slice(1), "scripttag" + (index - 1));
        return execute();
      }
    }
  })();
  return null;
};

if (window.addEventListener) {
  addEventListener('DOMContentLoaded', runScripts, false);
} else {
  attachEvent('onload', runScripts);
}
})();
