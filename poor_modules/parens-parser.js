setModule("parens-parser", function () {
	var parser = {};
  
  var parse = function (code, i) {
    if (!i) i = 0;
    var codeLength = code.length;
    var breakSignal = "BREAK!! xyzzy"
    var ret;
    var innerParse = function () {
      var handleStartParens = function () {
        i += 1
        group.push(innerParse())
      }

      var handleEndParens = function () { return breakSignal; }

      var handleSpace = function () {
        if (word.length) group.push(word);
        word = ""
      }

      var handleQuote = function () {

      }

      var handleWord = function () {
        word += chr
      }

      var handleCode = function () {
        if (isStartParens())  return handleStartParens();
        if (isEndParens()) return handleEndParens()
        if (isSpaceLike()) return handleSpace()
        if (isQuote()) return handleQuote()
        handleWord()
      }
      var isStartParens = function () { return chr == "("; }
      var isEndParens = function () { return chr == ")"; }
      var isSpaceLike = function () { return chr == " " || chr == "\n" || chr == "\r" || chr == "\t" }
      var isQuote = function () { return chr == "\"" }
      var word = "";
      var state = "code" // (string-list code text)
      var group = [];
      var chr = "";
      while (i < codeLength) {
        debugger
        chr = code.charAt(i);
        if (state == "code") {
          ret = handleCode()
        } else if (state == "text") {
          ret = handleText()
        }
        if (ret == breakSignal) break;
        i += 1
      }    
      return group;
    }
    return innerParse();
  }
  parser.parse = parse
  return parser
})
