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
var globalScope = thumbs.scope = {thumbs: thumbs, "stop-signal": stopSignal}


var codeToTree = function (code, fileName) {
  originalCode = "" +
    "double . x" +
    " mult x 2" +
    "ten double 5"

  return [ 0, fileName, "do",
    [0, fileName, ".", 
      [0, fileName, "double", [0, fileName, ".", [0, fileName, "args", "x"],
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
    if (childTree[2] == ".") {
      lineNumber = childTree[0];
      fileName = childTree[1];
      bagOfSand = [lineNumber, fileName, "fn", trees.length+1]; //we add one because we are going to be unshifting
      goldStatue = tree.splice(i, 1, bagOfSand)[0].slice(3);
      trees.push(goldStatue); 
    } 
    separateFunctions(childTree, trees);
  }
}

var branchToLines = function (branch, lines) {
  var lineNumber = branch[0]
  var fileName = branch[1]
  var lineNumberByteCode = getCachedLineNumberByteCode(lineNumber)
  var fileNameByteCode =  getCachedFileNameByteCode(fileName)
  lines.push(rawStart)
  lines.push(lineNumberByteCode)
  lines.push(fileNameByteCode)
  var twig;
  for (var i = 2; i < branch.length; i++) {
    twig = branch[i]
    if (isString(twig) || isNumber(twig)) {
      lines.push(getCachedGetByteCode(twig)) 
      lines.push(rawAdd)
    } else if (isArray(twig)) {
      branchToLines(twig, lines)
    }
  }
  lines.push(rawEnd);
  lines.push(rawAdd);
}


var branchesToLines = function (branches, lines) {
  lines = lines || [];
  var branch;
  for (var i = 0; i < branches.length; i++) {
    branch = branches[i]
    branchToLines(branch, lines)
  }
} 

var treesToLinesMap = {}
thumbs.hostScope.treesToLinesMap = treesToLinesMap
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


  return lines;
}


var currentLineNumber = 0;
var currentFileName = "";
var pc = 0;

var callBag = [];
var callBagStack = [callBag];
var lastResult = null;
var secondToLastResult = null;
var currentScope = globalScope;
var callStack = [currentScope];

var rawStart = function () {
  callBag = []
  callBagStack.push(callBag);
  currentScope = {__parent: currentScope};
  callStack.push(currentScope);
} 
rawStart.info = "start"

var rawEnd = function () { 
  console.log(callBag)

  callBagStack.pop()
  callBag = last(callBagStack) 

  callStack.pop()
  currentScope = last(callStack)
  lastResult = "boo"
}
rawEnd.info = "end"

var rawGet = function (arg, scope) {
  var message = "getting " + arg
  scope = scope || currentScope
  lastResult = null;
  if (!isObject(scope)) return message;
  if (scope.type == "fn") {
    // no se todavia 
  } else {
    if (arg in scope) {
      lastResult = scope[arg];
    } else if (scope.__parent) {
      rawGet(arg, scope.__parent) 
    } else if (arg in thumbs.hostScope) {
      lastResult = thumbs.hostScope[arg];
    } else {
      lastResult = {
        type: "string",
        value: arg,
        "parent": scope 
      }
    }
  }
  return message
}
rawGet.info = "get"

var rawAdd = function () { 
  callBag.push(lastResult);
}
rawAdd.info = "add"

var rawSetLineNumber = function (lineNumber) { currentLineNumber = lineNumber; }
rawSetLineNumber.info = "set-line-number"
var rawSetFileName = function (fileName) { currentFileName = fileName }
rawSetFileName.info = "set-file-name"

var makeCachingSystem = function (fn, name) {
  //just caches the func, arg pair so i don't new up a bunch of arrays
  var cache = {} 
  return function (arg) {
    if (arg in cache) {
      return cache[arg] 
    } else {
      var ret = cache[arg] = function () { 
        fn(arg); 
      }
      ret.info = name + " " + arg
      return ret;
    }
  }
}

var getCachedLineNumberByteCode = makeCachingSystem(rawSetLineNumber, "set-line-number")
var getCachedFileNameByteCode = makeCachingSystem(rawSetFileName, "set-file-name")
var getCachedGetByteCode = makeCachingSystem(rawGet, "get")


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
