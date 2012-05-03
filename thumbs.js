;(function () {

if (typeof console === "undefined" || console === null) {
 console = {
   log: function() {}
 };
}

var ObjProto = Object.prototype
var toString = ObjProto.toString
var isFunction = function (obj) { return toString.call(obj) == '[object Function]'; }
var isObject = function (obj) { return obj === Object(obj); }
var isArray = Array.isArray || function(obj) { return toString.call(obj) == '[object Array]'; };
var isString = function(obj) { return toString.call(obj) == '[object String]'; };
var isNumber = function(obj) { return toString.call(obj) == '[object Number]'; };
var last = function(arr) {return arr[arr.length - 1]}
var __slice = [].slice;

var root = this;
var thumbs;
if (typeof exports !== 'undefined') {
  thumbs = exports;
  thumbs.hostScope = global
} else {
  thumbs = root.thumbs = {};
  thumbs.hostScope = window
}

var stopSignal = "abort. repeat. abort. :)";

//todo: cache getting of default functions like 'set' and 'get-args'

var makeThumbsFunction = function (treeNumber, scope) {
  scope = scope || currentScope
  var lineNumberOrFunc;
  if (isNumber(treeNumber) || isString(treeNumber)) {
    lineNumberOrFunc = treesToLinesMap[treeNumber]
  } else if (isFunction(treeNumber)) {
    lineNumberOrFunc = treeNumber
  }
  //todo: pre compile that so I don't have to do it runtime.
  return {
    line: lineNumberOrFunc,
    type: "fn",
    scope: scope //this is the parent scope of the function
  }
}


var rawSet = function (name, value, scope) {
  scope = scope || currentScope;
  if (isObject(scope)) {
    scope[name] = value;
  } else if (isThumbsFunction(scope)){
    callThumbsFunction([scope, name, value]);   
  }
}

var globalScope = thumbs.scope = {
  thumbs: thumbs,
  "stop-signal": stopSignal,
  "do": function (fn) {

  },
  fn: makeThumbsFunction,
  set: rawSet
}

var rawAdd = function (opts, scope) { 
  scope = scope || currentScope
  callBag.push(lastResult);
}
rawAdd.info = "add"

var isThumbsFunction = function (fn) {
  // fn?.type == "fn"
  return (typeof fn !== "undefined" && fn !== null ? fn.type : void 0) === "fn";
}

var rawNoOp = function () {}
rawNoOp.info = "noop"

var callThumbsFunction = function (/*args...*/) { //different from callThumbsFuncitonFromJs (not implemented yet)
  var args; args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  rawStart();
  callBag.concat(args)
  rawCall();
}

var rawCall = function (scope) {
  scope = scope || currentScope
  var first = callBag[0];
  var rest = callBag.slice(1)
  if (isFunction(first)) {//if is javascript function
    first.apply(null, rest, currentScope)
  } else if (isThumbsFunction(first)) {
    callStack.push(currentScope);
    currentScope = {
      '--parent-scope': first.scope,
      '--calling-scope': currentScope,
      '--args': rest,
      '@': rest[0]
    }
    if (isNumber(fn.line)) {
      pc = fn.line - 1
    } else if (isFunction(fn.line)) {
      fn.line.apply(null, rest, currentScope)  //a function that sets its own pc
    }
  }
  console.log(callBag)
}
rawCall.info = "call"

var symbols = {
  "access": ".",
  "function": "&",
  "terminal-assign": ".",
  "assign": "=",
  "object": ":",
  "access": ".",
  "access-variable": ",",
  "array": ",",
  "no-arg-function": "!",
  "string": "'",
  "string-literal": '"',
  "first-arg": "@",
  "inline-call": ";",
  "interpolated-string": "$"
}


var rawReturn = function () {
  callBag = callBagStack.pop(); 
  currentScope = callStack.pop()
  pc = currentScope.__pc
}
rawReturn.info = "return"

var codeToTree = function (code, fileName) {
  originalCode = "" +
    "double && x" +
    " mult x 2" +
    "ten = double 5"

  return [ 0, fileName, "do",
    [0, fileName, "&", 
      [0, fileName, "set", "'double", [0, fileName, "&", [0, fileName, "get-args", "'x"],
          [1, fileName, "mult", "x", "2"]]],
      [2, fileName, "ten", "double", "5"]
    ]
  ]
}

var id = 0;
var getId = function (prefix) {
  id += 1;
  return prefix + id;
}

var separateFunctions = function (tree, trees) {
  var trees = trees || [];
  var childTree, lineNumber, fileName, bagOfSand, goldStatue;
  for (var i = 2; i < tree.length; i++) {
    childTree = tree[i];
    if (childTree[2] == symbols["function"]) {
      lineNumber = childTree[0];
      fileName = childTree[1];
      bagOfSand = [lineNumber, fileName, "fn", trees.length+1]; //we add one because we are going to be unshifting
      goldStatue = tree.splice(i, 1, bagOfSand)[0].slice(3);
      lastGoldStatueBranch = last(goldStatue)
      trees.push(goldStatue); 
    } 
    
    separateFunctions(childTree, trees);
  }
}

var parsedIsStringLiteral = function (twig) {
  return twig.charAt(0) == symbols.string
}

var parsedJustString = function (word) {
  return word.subString(1) 
}

var branchToLines = function (branch, lines) {
  var lineNumber = branch[0]
  var fileName = branch[1]
  lines.push(rawStart)
  lines.push(rawSetLineNumber2(lineNumber))
  lines.push(rawSetFileName2(fileName))
  var twig;
  var opts;
  for (var i = 2; i < branch.length; i++) {
    opts = {}
    twig = branch[i]
    if (isString(twig) || isNumber(twig)) {
      if (twig.charAt(0) == "'") {
        lines.push(rawGetForString2(twig.subString(1)));
      } else {
        lines.push(rawGet2(twig, opts)) //rawGet
      }
      lines.push(rawAdd) //rawAdd
    } else if (isArray(twig)) {
      branchToLines(twig, lines)
    }
  }
  lines.push(rawCall);
  lines.push(rawAdd);
}


var branchesToLines = function (branches, lines) {
  lines = lines || [];
  var branch;
  for (var i = 0; i < branches.length; i++) {
    branch = branches[i]
    branchToLines(branch, lines)
  }
  lines.push(rawReturn)
} 

var treesToLinesMap = {}
var theFunctions = []
var treeToLines = function (tree, fileName, codeLines) {
  var trees = [];
  separateFunctions(tree, trees);
  var stop = [0, 0, "stop-signal"]
  trees.unshift([tree, stop]);
  console.log("debranched trees are")
  console.log(trees)
  console.log("---")
  var braches;
  var lines = [];
  for (var i = 0; i < trees.length; i++) {
    branches = trees[i];
    treesToLinesMap[i] = lines.length
    branchesToLines(branches, lines); 
  }
  console.log("lines are")
  var line;
  var infos = []
  for (lineIndex in lines) { infos.push(lines[lineIndex].info); }
  console.log(infos);
  console.log("---");

  console.log("trees to lines map is")
  console.log(treesToLinesMap);
  console.log("---");

  // addInternalThumbsLines(lines);
  return lines;
}


var currentLineNumber = 0;
var currentFileName = "";
var pc = 0;

var callBag = [];
var callBagStack = [];
var lastResult = null;
var secondToLastResult = null;
var currentScope = globalScope;
var callStack = [currentScope];


var rawStart = function () {
  callBagStack.push(callBag);
  callBag = []
} 
rawStart.info = "start"


var rawGetForString = function (arg) {
  lastResult = arg
}
rawGetForString.info = "get for string"

var rawGet = function (arg, opts, scope) {
  var message = "getting " + arg
  scope = scope || currentScope
  lastResult = null;
  if (!isObject(scope)) { 
    throw new Error("no scope") // for now
  } else if (arg - 0 == arg && scope == currentScope) { //??
    lastResult = arg - 0;
  } else if (isThumbsFunction(scope)) {
    callThumbsFunction([scope, arg]);
    //here you are creating new scope and it will return
  } else if (arg in scope) {
    lastResult = scope[arg];
  } else if (scope['--parent-scope']) {
    rawGet(arg, scope['--parent-scope']) 
  } else if (arg in thumbs.hostScope) {
    lastResult = thumbs.hostScope[arg];
  }
  //todo: php-like chain setting!
  return message
}
rawGet.info = "get"


var isAnyFunction = function (fn) {
  return (isFunction(fn) || isThumbsFunction(fn))
}

var rawSetLineNumber = function (lineNumber) { currentLineNumber = lineNumber; }
rawSetLineNumber.info = "set-line-number"
var rawSetFileName = function (fileName) { currentFileName = fileName }
rawSetFileName.info = "set-file-name"

var makeCachingSystem = function (fn, name) {
  //just caches the func, arg pair so i don't new up a bunch of arrays
  var cache = {} 
  return function (/*args...*/) {
    var args; args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    var serializedArgs = JSON.stringify(args);
    if (serializedArgs in cache) {
      return cache[serializedArgs] 
    } else {
      var ret = cache[serializedArgs] = function () { 
        fn.apply(null, args); 
      }
      ret.info = name + " " + serializedArgs
      return ret;
    }
  }
}

var rawSetLineNumber2 = makeCachingSystem(rawSetLineNumber, "set-line-number")
var rawSetFileName2 = makeCachingSystem(rawSetFileName, "set-file-name")
var rawGet2 = makeCachingSystem(rawGet, "get")
var rawGetForString2 = makeCachingSystem(rawGetForString, "get-for-string")
var rawAdd2 = makeCachingSystem(rawAdd, "add")

var run = function (code, fileName, scope) {
  var codeTree = codeToTree(code, fileName);
  var codeLines = treeToLines(codeTree, fileName);
  var ret;
  while (true) {
    todo = codeLines[pc]
    if (!todo) break;
    secondToLastResult = lastResult;
    ret = todo()
    if (lastResult == stopSignal) {
      lastResult = secondToLastResult;
      console.log("aborting.")
      break;
    }
    pc += 1
  }
  return lastResult
}

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
