setModule("thumbs", function () {
_ = getModule("underscore")
parensParser = getModule("parens-parser")
fakeScript = getModule("fake-script");

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
//


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

//This should be the scope function? scope(key, value) == set(key, value) ??
var thumbsSet = function (name, value, scope) { //compare with a potential rawset
  //todo do a get to see which scope you should set in. like see if it exists in a parent scope
  scope = scope || currentScope;
  if (isObject(scope)) {
    scope["--parent-scope"][name] = value;
    lastResult = value
    rawReturn()
  } else if (isThumbsFunction(scope)){
    //todo: make this a goto, so its return will count for this return
    //callThumbsFunction([scope, name, value]);   
    //[["get", "set", scope], name, value]
    //???
  }
  return "Do not use this return value (thumbsSet)"
}

var thumbsSetLocal = function (name, value, scope) {
  scope = scope || currentScope;
  if (isObject(scope)) {
    scope[name] = value;
    lastResult = value
    rawReturn()
  } else if (isThumbsFunction(scope)){
    // see thumbsSet
  }

  return "Do not use this return value (rawSetLocal)"
}

var thumbsGet = function (arg, scope) { //compare with rawget
  scope = scope || currentScope
  lastResult = null;
  if (!isObject(scope)) { 
    throw new Error("no scope") // for now
  } else if (arg - 0 == arg && scope == currentScope) { //??
    lastResult = arg - 0;
    rawReturn()
  } else if (isThumbsFunction(scope)) {
    //see rawSet ??
  } else if (arg in scope) {
    lastResult = scope[arg]; //todo: start out with parent scope?? see thumbsSet
    rawReturn()
  } else if (scope['--parent-scope']) {
    thumbsGet(arg, scope['--parent-scope']) //this is like a goto? because I am not calling callthumbsfunction
  } else if (arg in thumbs.hostScope) {
    lastResult = thumbs.hostScope[arg];
    rawReturn()
  }
  //todo: php-like chain setting!
  return "Do not use this return value (thumbsGet)"
}

var rawGet = function (arg, scope) { //compare with thumbsget
  scope = scope || currentScope
  lastResult = null;
  if (!isObject(scope)) { 
    throw new Error("no scope") // for now
  } else if (arg - 0 == arg && scope == currentScope) { //??
    lastResult = arg - 0;
  } else if (isThumbsFunction(scope)) {
    //callThumbsFunction([scope, arg]); ??
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


var rawDo = function (fn) { //todo: this should be called thumbsDo
  callThumbsFunction(fn) 
}


var globalScope = thumbs.scope = {}
_.extend(globalScope, {
  thumbs: thumbs,
  "stop-signal": stopSignal,
  "do": rawDo, //todo: this should not be raw. None of these should
  "debugger": function () {
    debugger; 
  },
  fn: makeThumbsFunction,
  set: makeThumbsFunction(thumbsSet, "set", [], globalScope),
  get: makeThumbsFunction(thumbsGet, "get", [], globalScope),
  mult: function (a, b) { 
    return a * b 
  },
  say: function (what) {
    console.log(what)  
    return what
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
  ",": function () { //this is a list
    var args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    return args
  }
})

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
  //rawStart, no rawEnd??
  rawStart(); //should I comment this out?
  callBag = args
  rawCall();
}

//var rawGoto //??
//var gotoThumbsFunction //??

var rawCall = function (scope) { //optionally pass in a callbag?
  scope = scope || currentScope
  var fn = callBag[0];
  var args = callBag.slice(1)
  if (isFunction(fn)) {//if is javascript function
    lastResult = fn.apply(null, args)
    lastResult
  } else if (isThumbsFunction(fn)) {
    currentScope["--pc"] = pc;
    callStack.push(currentScope);
    currentScope = {
      '--parent-scope': fn.scope,
      '--calling-scope': currentScope,
      '--args': args,
    }

    if (isNumber(fn.line)) {
      currentScope[symbols["first-arg"]] = args[0]
      pc = fn.line - 1
    } else if (isFunction(fn.line)) {
      fn.line.apply(null, args) //a function that sets its own pc and returns
    }
  } else if (_.isNull(fn)) {
    throw new Error("you tried to call a null function on line + " + pc)
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
  //todo: return an a lisp-like array based off the code.
  var parsed = parensParser(code)
  console.log(parsed)
  return parsed;
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
      //TODO: bagOfSand should be a js function that calls makethumbsfunction
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
  var twig;
  for (var i = 0; i < branch.length; i++) {
    twig = branch[i]
    if (isString(twig) || isNumber(twig)) {
      if (twig.charAt && twig.charAt(0) == "'") {
        lines.push(rawGetForString2(twig.substring(1)));
        //TODO: this should probably be compiled so that you
        //don't have to call this when running
        //like maybe push the actual string
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
  var braches;
  for (var i = 0; i < trees.length; i++) {
    branches = trees[i];
    treesToLinesMap[i] = finalLines.length
    branchesToLines(branches, finalLines); 
  }
  var line;
  // addInternalThumbsLines(finalLines);
  return finalLines;
}

window.thumbsDebug = (function () {
  var self = {}
  self.lineHeight = 15;
  self.paused = true;
  var renderDebug = self.renderDebug =  function (finalLines) {
    var infos = []
    for (lineIndex in finalLines) { infos.push(finalLines[lineIndex].info); }
    prettyPrinted = prettyPrintInfos(infos)
    addCodeSheetIfNotThere();
    fillLines(prettyPrinted)
    bindFunctionKeys()
    handleAddingBreakpoints()
    addInitialBreakpoints()
  }

  var addInitialBreakpoints = function () {
    if (localStorage.breakpoints) {
      breakpoints = JSON.parse(localStorage.breakpoints);
    }

    _.each(breakpoints, function (breakpoint) {
        var lineEl = $('[data-line-number="'+breakpoint+'"]'); 
        addBreakpointHandler(breakpoint, lineEl)
    })
  }

  var handleAddingBreakpoints = function () {
    codeSheet.click(function (e) {
      lineEl = $(e.target) 
      var lineNumber = parseInt(lineEl.attr("data-line-number"))
      if (lineEl.hasClass("breakpoint")) {
        lineEl.removeClass("breakpoint") 
        removeBreakpoint(lineNumber)
      } else {
        addBreakpointHandler(lineNumber, lineEl)
      }
    })
  }

  var addBreakpointHandler = function (lineNumber, lineEl) {
    lineEl.addClass("breakpoint")
    addBreakpoint(lineNumber)
  }
  
  var getBreakpoints = self.getBreakpoints = function () {
    return breakpoints;
  }
  var breakpointExistsAt = self.breakpointExistsAt = function (pc) {
    return _.indexOf(breakpoints, pc, true) != -1; //true means breakpoints is sorted
  }

  var bindFunctionKeys = function () {
    //TODO: figure out step into, step out etc
    var f10 = 121
    var f8 = 119
    $(document.body).keydown(function (e) {
      console.log(e.keyCode)
      if (e.keyCode == f10) {
        e.preventDefault()
        self.next()
      } else if (e.keyCode == f8) {
        e.preventDefault() 
        self.play()
      }
    })
  }
  var lastHighlitLine = $();
  var highlightLine = self.highlightLine = function (pc) {
    lastHighlitLine.removeClass("highlight")
    lastHighlitLine = $('[data-line-number="'+pc+'"]')
    lastHighlitLine.addClass("highlight")
  }
  var codeSheet, next, wrapper, breakpoints;
  var breakpoints = []
  var addBreakpoint = function (bp) {
    breakpoints.push(bp) 
    breakpoints = _.sortBy(breakpoints, _.identity)
    localStorage.breakpoints = JSON.stringify(breakpoints)
  }

  var removeBreakpoint = function (bp) {
    breakpoints = _.without(breakpoints, bp)
    localStorage.breakpoints = JSON.stringify(breakpoints)
  }

  var fillLines = function (infos) {
    _.each(infos, function(line, number){
      var lineEl = $('<pre data-line-number="'+number+'">'+number+" "+line+'</pre>')
      codeSheet.append(lineEl);
    })
  }
  var play = self.play = function () {
    self.paused = false 
    self.next()
    console.log("play")
  }
  var addCodeSheetIfNotThere = function () {
    if (wrapper) return;
    wrapper = $("<div class='thumbs-debug'></div>") 
    codeSheet = $('<div class="code-sheet" style="position: relative;"></div>')
    var next = $('<a href="#">Next</a>')
    next.click(self.next)

    var playEl = $('<a href="#">Play</a>')
    playEl.click(self.play)

    wrapper.append(next)
    wrapper.append("&nbsp;")
    wrapper.append(playEl)
    wrapper.append(codeSheet)
    $(document.body).append(wrapper)
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

var rawGet2 = makeCachingSystem(rawGet, "get")
var rawGetForString2 = makeCachingSystem(rawGetForString, "get-for-string")
var rawAdd2 = makeCachingSystem(rawAdd, "add")

var execLineMaker = function (finalLines, options) {
  var execLine = function () {
    todo = finalLines[pc]
    if (!todo) return breakSignal;
    secondToLastResult = lastResult;
    todo()
    if (lastResult == stopSignal) {
      lastResult = secondToLastResult;
      return breakSignal;
    }
    pc += 1
  }
  if (options.debug) execLine = debugExecLine(execLine)
  return execLine;
}

var breakSignal = "BREAAAK!"

var finishRunning = function () {
  console.log("The last result is:")
  console.log(lastResult)
  return lastResult
}

var runSlowExecLineMaker = function (execLine) {
  var runSlowExecLine = function () {
    var execed = execLine();
    if (execed == breakSignal) return finishRunning();
    if (!thumbsDebug.paused) setTimeout(runSlowExecLine, 1);
  }
  return runSlowExecLine
}

var execLinesFast = function (execLine) {
  while (true) {
    if (execLine() == breakSignal) break;
  }
  return finishRunning()
}

var execLinesWithDebug = function (execLine, finalLines) {
  var runSlowExecLine = runSlowExecLineMaker(execLine)
  if (!thumbsDebug.paused) runSlowExecLine() 
  thumbsDebug.next = runSlowExecLine
  thumbsDebug.renderDebug(finalLines)
  setTimeout(function () {
    thumbsDebug.highlightLine(pc)
  }, 100)
}

var execLines = function (execLine, debug, finalLines) {
  debug ? execLinesWithDebug(execLine, finalLines) : execLinesFast(execLine)
}

var debugExecLine = function (execLine) {
  return function () {
    thumbsDebug.highlightLine(pc)
    var ret = execLine()
    thumbsDebug.highlightLine(pc)
    if (thumbsDebug.breakpointExistsAt(pc)) thumbsDebug.paused = true;
    return ret
  }
}

var run = function (code, options) {
  var finalLines = []
  options = options || {}
  _.defaults(options, {debug: true})
  var codeTree = code;
  if (isString(code)) codeTree = codeToTree(code, options.fileName);
  treeToLines(codeTree, options.fileName, finalLines);
  var execLine = execLineMaker(finalLines, options)
  execLines(execLine, options.debug, finalLines)
}

var runFile = function (file) {
  var fs = require("fs");
  var code = fs.readFileSync(file).toString();
  var ran = run(code) 
  return ran;
} 

// parse

thumbs.run = run //runs raw code
thumbs.runFile = runFile
thumbs.getCurrentScope = function () { return currentScope; }
thumbs.getCallBag = function () { return callBag; }

//borrowed from
//https://raw.github.com/jashkenas/coffee-script/master/src/browser.coffee
if (typeof window === "undefined" || window === null) return thumbs;
fakeScript = fakeScript(["text/thumbs", "thumbs"], thumbs.run);
fakeScript.runScripts();
_.extend(thumbs, fakeScript);
return thumbs;
})
