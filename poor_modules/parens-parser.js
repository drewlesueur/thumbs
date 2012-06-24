setModule("parens-parser", function () { return function (code) {
    var i = 0, ret, codeLength = code.length, breakSignal = "BREAK!! xyzzy";
    var incIndex = function () { i += 1 }
    var innerParse = function () {
      var nestedParens = function () { group.push(innerParse()) }
      var handleStartParens = function () { incIndex(); nestedParens(); }
      var handleEndParens = function () { return breakSignal; }
      var addWord = function () { if (word.length) group.push(word); }
      var resetWord = function () { word = "" }
      var handleSpace = function () { addWord(); resetWord(); }
      var handleQuote = function () { }
      var handleWord = function () { word += chr }
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
      var word = "", state = "code", group = [], chr = "";
      while (i < codeLength) {
        chr = code.charAt(i);
        if (state == "code") { ret = handleCode() } 
        else if (state == "text") { ret = handleText() }
        if (ret == breakSignal) break;
        incIndex();
      }; return group; }; return innerParse(); } })
