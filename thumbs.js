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

var makeThumbsFunction = function (treeNumber, name, args, scope) { //name is for debugging purposes
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
    scope: scope, //this is the parent scope of the function
    name: name, //name is for debugging purposes
    "arg-names": args //?? should this go here?
  }
}

var rawSet = function (name, value, scope) {
  //todo do a get to see which scope you should set in
  scope = scope || currentScope;
  if (isObject(scope)) {
    scope[name] = value;
    lastResult = value
  } else if (isThumbsFunction(scope)){
    //callThumbsFunction([scope, name, value]);   
    //[["get", "set", scope], name, value]
    //???
  }

  return "Do not use this return value (rawSet)"
}

var rawSetLocal = function (name, value, scope) {
  scope = scope || currentScope;
  if (isObject(scope)) {
    scope[name] = value;
    lastResult = value

  } else if (isThumbsFunction(scope)){
    callThumbsFunction([scope, name, value]);   
  }

  return "Do not use this return value (rawSetLocal)"
}

var rawGet = function (arg, scope) {
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
  return "Do not use this return value (rawGet)"
}
rawGet.info = "get"


var rawDo = function (fn) {
  callThumbsFunction(fn) 
}


var globalScope = thumbs.scope = {
  thumbs: thumbs,
  "stop-signal": stopSignal,
  "do": rawDo,
  "debugger": function () {
    debugger; 
  },
  fn: makeThumbsFunction,
  set: makeThumbsFunction(rawSet, "set"),
  get: makeThumbsFunction(rawGet, "get"),
  mult: function (a, b) { 
    return a * b 
  },
  say: function (what) {
    console.log(what)  
  },
  "get-args--deprecated": function () {
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
  },
  ",": function () { //this is a list
    var args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return args
  },
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
  "function": "*",
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
    "double = * x" +
    " mult x 2" +
    "ten = double 5"

  return ["do",
    ["*main-func", 
      //["set", "'loop", ["*", 
      //  ["set", "'list", ["get", "'0", "--args"] ],
      //  ["say", "list"],
      //  ["say", "'the list is:"],
      //]],
      //["loop",[",", "'hello", "'world"]],
      //["set", "'my-list", [",", "'hello","'world" ]],
      ["say", "'yo world!!"],
      ["set", "'double", ["*double",
          ["mult", "@", "2"]]],
      ["say", "'yo world2!!"],
      ["set", "'ten", ["double", "5"]],
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
    if (childTree[0].charAt(0) == symbols["function"]) {
      var name = childTree[0].substring(1) 
      var args = childTree[1]
      bagOfSand = ["fn", trees.length+1, "'" + name]; //we add one because we are going to be unshifting
      goldStatueWrapper = tree.splice(i, 1, bagOfSand)
      goldStatue = goldStatueWrapper[0].slice(1) 
      childTree = goldStatue
      trees.push(goldStatue); 
    } 
    if (isArray(childTree)) separateFunctions(childTree, trees);
  }
}

var rawEnd = function () {
  callBag = callBagStack.pop(); 
}
rawEnd.info = "end"
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

  console.log("---");

  console.log("trees to lines map is")
  console.log(treesToLinesMap);
  console.log("---");

  // addInternalThumbsLines(finalLines);
  return finalLines;
}

window.thumbsDebug = (function () {
  var self = {}
  self.lineHeight = 15;
  var renderDebug = self.renderDebug =  function (finalLines) {
    var infos = []
    for (lineIndex in finalLines) { infos.push(finalLines[lineIndex].info); }
     prettyPrinted = prettyPrintInfos(infos)
     addCodeSheetIfNotThere();
     fillLines(prettyPrinted)
  }
  var highlightLine = self.highlightLine = function (pc) {
    var y = self.lineHeight * pc;
    line.css("top", y + "px")
  }
  var codeSheet;
  var line;
  var pre;
  var fillLines = function (infos) {
    pre.text(infos.join("\n")) 
  }
  var addCodeSheetIfNotThere = function () {
    if (codeSheet) return;
    codeSheet = $('<div style="position: relative;"></div>')
    pre = $('<pre class="thumbs" style="background-color: transparent; font-size: 12px; width:300px; height: 500px; display: block;"></pre>')
    line = $('<div style="background-color: rgba(0,0,200, 0.25); width: 300px; height: '+self.lineHeight+'px; position: absolute; top: 0; left: 0"></div>')
    codeSheet.append(line)
    codeSheet.append(pre)
    $(document.body).append(codeSheet)

  }
  var prettyPrintInfos = function (infos) {
    var spaces = 0
    var printed = []
    _.each(infos, function (info) {
      if (info == "start") {
        spaces += 2
      } else if (info == "end"){
        spaces -= 2 
      }
      var space = getSpaceOfLength(spaces);
      printed.push(space + info)
    })
    return printed
  }
  var getSpaceOfLength = function (len) {
    var space = ""
    for (var i = 0; i < len; i++) {
      space += " "
    }
    return space;
  }
  return self
})();


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
  thumbsDebug.renderDebug(finalLines)

    var breakSignal = "BREAAAK!"
    var execLine = function () {
      thumbsDebug.highlightLine(pc) // make this optional
      todo = finalLines[pc]
      if (!todo) return breakSignal;
      secondToLastResult = lastResult;
      todo()
      if (lastResult == stopSignal) {
        lastResult = secondToLastResult;
        console.log("aborting.")
        return breakSignal;
      }
      pc += 1
      thumbsDebug.highlightLine(pc) // make this optional
    }

    var runFast = false; //todo: change this to an argument

    var runSlowWrapper = function () {
      var execed = execLine();
      if (execed == breakSignal) {
        finish()
      } else {
        setTimeout(runSlowWrapper, 100)
      }
    }
    
    var finish = function () {
      console.log("The last result is:")
      console.log(lastResult)
      return lastResult
    }

    if (runFast) {
      while (true) {
        if (execLine() == breakSignal) break;
      }
      return finish()
    } else {
      runSlowWrapper() 
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
