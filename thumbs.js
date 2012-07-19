setModule("thumbs", function () {
_ = getModule("underscore")
parensParser = getModule("parens-parser")
fakeScript = getModule("fake-script");

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

var run = function (code) {
  parsed = parensParser(code)
  
}

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
