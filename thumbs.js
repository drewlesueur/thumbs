;(function () {

if (typeof console === "undefined" || console === null) {
  console = { log: function() {} };
}

var isFunction = _.isFunction;
var isObject = _.isObject;
var isArray = _.isArray;
var isString = _.isString;
var isNumber = _.isNumber;
var last = _.last;
var each = _.each;
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

var rawSet = function (name, value) {
  scope = currentScope;
  if (isObject(scope)) {
    scope[name] = value;
    return value
  } else if (isThumbsFunction(scope)){
    callThumbsFunction([scope, name, value]);   
  }
}

var rawDo = function (fn) {
  callThumbsFunction(fn) 
}

var globalScope = thumbs.scope = {
  thumbs: thumbs,
  "stop-signal": stopSignal,
  "do": rawDo,
  fn: makeThumbsFunction,
  set: rawSet,
  mult: function (a, b) { 
    return a * b 
  },
  "get-args": function () {
    //this could maybe be more compiled. thing other arguments to fn
    var args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    var oldPc = pc
    var startSettingPc = finalLines.length
    each(args, function (arg, i) {
      finalLines.push(function () { 
        rawSet(arg, currentScope['--args'][i])
      })  
      // lines.push ! raw-set arg current-scope.--args,i
    })
    finalLines.push(function () {
      pc = oldPc;
    })
    pc = startSettingPc - 1
  }
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
  callBag = args
  rawCall();
}

var rawCall = function (scope) {
  scope = scope || currentScope
  var first = callBag[0];
  var rest = callBag.slice(1)
  callBag = callBagStack.pop(); 
  if (isFunction(first)) {//if is javascript function
    lastResult = first.apply(null, rest)
    lastResult
  } else if (isThumbsFunction(first)) {
    currentScope["--pc"] = pc;
    callStack.push(currentScope);
    currentScope = {
      '--parent-scope': first.scope,
      '--calling-scope': currentScope,
      '--args': rest,
    }
    currentScope[symbols["first-arg"]] = rest[0]
    pc = first.line - 1
  }
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
  currentScope = callStack.pop()
  pc = currentScope["--pc"]
}
rawReturn.info = "return"

var codeToTree = function (code, fileName) {
  originalCode = "" +
    "double && x" +
    " mult x 2" +
    "ten = double 5"

  return ["do",
    ["&", 
      ["set", "'double", ["&", ["get-args", "'x"],
          ["mult", "x", "2"]]],
      ["set", "'ten", ["double", "5"]]
    ]
  ]
}

var id = 0;
var getId = function (prefix) {
  prefix = prefix || ""
  id += 1;
  return prefix + id;
}

var separateFunctions = function (tree, trees) {
  var trees = trees || [];
  var childTree, lineNumber, fileName, bagOfSand, goldStatue;
  for (var i = 0; i < tree.length; i++) {
    childTree = tree[i];
    if (childTree[0] == symbols["function"]) {
      bagOfSand = ["fn", trees.length+1]; //we add one because we are going to be unshifting
      goldStatueWrapper = tree.splice(i, 1, bagOfSand)
      goldStatue = goldStatueWrapper[0].slice(1) 
      childTree = goldStatue
      trees.push(goldStatue); 
    } 
    if (isArray(childTree)) separateFunctions(childTree, trees);
  }
}

var branchToLines = function (branch, lines) {
  var lineNumber = branch[0]
  var fileName = branch[1]
  lines.push(rawStart)
  //lines.push(rawSetLineNumber2(lineNumber))
  //lines.push(rawSetFileName2(fileName))
  var twig;
  for (var i = 0; i < branch.length; i++) {
    twig = branch[i]
    if (isString(twig) || isNumber(twig)) {
      if (twig.charAt && twig.charAt(0) == "'") {
        lines.push(rawGetForString2(twig.substring(1)));
      } else {
        lines.push(rawGet2(twig)) //rawGet
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
var treeToLines = function (tree, fileName, finalLines) {
  var trees = [];
  separateFunctions(tree, trees);
  var stop = ["stop-signal"]
  trees.unshift([tree, stop]);
  console.log("debranched trees are")
  console.log(trees)
  console.log("---")
  var braches;
  for (var i = 0; i < trees.length; i++) {
    branches = trees[i];
    treesToLinesMap[i] = finalLines.length
    branchesToLines(branches, finalLines); 
  }
  console.log("lines are")
  var line;
  var infos = []
  for (lineIndex in finalLines) { infos.push(finalLines[lineIndex].info); }
  console.log(infos);
  console.log("---");

  console.log("trees to lines map is")
  console.log(treesToLinesMap);
  console.log("---");

  // addInternalThumbsLines(finalLines);
  return finalLines;
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

var rawGet = function (arg, scope) {
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

var finalLines = []
var run = function (code, fileName, scope) {
  var codeTree = codeToTree(code, fileName);
  treeToLines(codeTree, fileName, finalLines);
  var ret;
  while (true) {
    todo = finalLines[pc]
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
  console.log("The last result is " + lastResult)
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
