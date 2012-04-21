;(function () {

var ObjProto = Object.prototype
var toString = ObjProto.toString
var isFunction = function (obj) { return toString.call(obj) == '[object Function]'; }
var isObject = function (obj) { return obj === Object(obj); }
var isArray = Array.isArray || function(obj) { return toString.call(obj) == '[object Array]'; };
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

var codeToTree = function (code, fileName) {
  originalCode = "" +
    "double . x" +
    "  mult x 2" +
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
  lines.push(lineNumberByteCode)
  lines.push(fileNameByteCode)
  var twig;
  for (var i = 2; i < branch.length; i++) {
    twig = branch[i]
    if (isString(twig)) {
      lines.push(getCachedGetByteCode(twig)) 
    } else if (isArray(twig)) {
      branchesToLines(twig, lines)    
    }
  }
  var lineNumberByteCode = getCachedLineNumberByteCode(lineNumber)
  var fileNameByteCode =  getCachedFileNameByteCode(fileName)

}
var branchesToLines = function (branches, lines) {
  lines = lines || [];
  var branch;
  for (var i = 0; i < branches.length; i++) {
    branch = branches[i]
    branchToLines(branch, lines)
  }
} 

var treeToLines = function (tree, fileName, codeLines) {
  var trees = [];
  separateFunctions(tree, trees);
  trees.unshift([tree]);
  console.log("debranched trees are")
  console.log(trees)
  console.log("original tree is")
  console.log(tree)
  var braches;
  var lines = [];
  for (var i = 0; i < trees.length; i++) {
    branches = trees[i];
    branchesToLines(branches, lines); 
  }

  return lines;
  return;

  codeLines = codeLines || [];
  var childTree, lineNumber, fileName, getBytecode;
  lineNumber = tree[0]
  fileName = tree[1]
  var lineNumberByteCode = getCachedLineNumberByteCode(lineNumber)
  var fileNameByteCode =  getCachedFileNameByteCode(fileName)
}


var currentLineNumber = 0
var currentFileName = ""
var pc = 0;

var funcBag = [];
var funcBagStack = [funcBag];
var args = [];

var rawStart = function () { return "starting function call"} 
var rawEnd = function () { return "endin function call"}
var rawAdd = function () { return "adding to args" }

var rawSetLineNumber = function (lineNumber) { currentLineNumber = lineNumber; }
var rawSetFileName = function (fileName) { currentFileName = fileName }
var rawGet = function (arg) { return ("getting " + arg + "(" + pc + ")") }

var makeCachingSystem = function (fn, name) {
  //just caches the func, arg pair so i don't new up a bunch of arrays
  var cache = {} 
  return function (arg) {
    if (arg in cache) {
      return cache[arg] 
    } else {
      var ret = cache[arg] = name + "(" + arg + ")"; //function () { fn(arg); }
      return ret;
    }
  }
}

var getCachedLineNumberByteCode = makeCachingSystem(rawSetLineNumber, "setLineNumber")
var getCachedFileNameByteCode = makeCachingSystem(rawSetFileName, "setFileName")
var getCachedGetByteCode = makeCachingSystem(rawGet, "get")


var run = function (code, fileName, scope) {
  var codeTree = codeToTree(code, fileName);
  var codeLines = treeToLines(codeTree, fileName);
  console.log(codeLines);
  while (false && true) {
    todo = codeLines[pc]
    if (!todo) break;
    todo()
    pc += 1
  }
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
