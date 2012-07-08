setModule("parens-parser", function () { return function (code) {
    var i = 0, ret, codeLength = code.length, breakSignal = "BREAK!! xyzzy";
    var incIndex = function () { i += 1 }
    var innerParse = function () {
      var lastGroup = function () { return group[group.length - 1] }
      var secondTolastGroup = function () { return group[group.length - 2] }
      var lastCharIsEndParens = function () { return code.substr(i - 1, 1) == ")" }
      var nestedParens = function () { group.push(innerParse()) }
      var handleStartParens = function () { 
        var isCallCall = lastCharIsEndParens() //(get fn)(a b c)
        incIndex(); nestedParens();
        if (word.length) {
          lastGroup().unshift(word);
          resetWord();
        } else if (isCallCall) {
          var func = group.splice(group.length - 2, 1)[0]
          lastGroup().unshift(func)
        }
      }
      var handleEndParens = function () { handleSpace(); return breakSignal; }
      var addWord = function () { if (word.length) group.push(word); }
      var resetWord = function () { word = "" }
      var handleSpace = function () { addWord(); resetWord(); }
      var handleQuote = function () { strName = word; resetWord(); state = "text"; }
      var handleWord = function () { word += chr }
      var handleEscapeChar = function () { state = "escaped-text" }
      var handleEndQuote = function () { 
        if (strNameIsNext()) { 
          state = "code"; i += strName.length;
          group.push("'" + word); resetWord(); return; }
        word += chr;
      }, strNameIsNext = function () {
        var next = code.substr(i+1, strName.length);
        if (next == strName) return true;
        return false;
      }, handleCode = function () {
        if (isStartParens())  return handleStartParens();
        if (isEndParens()) return handleEndParens()
        if (isSpaceLike()) return handleSpace()
        if (isQuote()) return handleQuote()
        handleWord()
      }, handleText = function () {
        if (isQuote()) return handleEndQuote();
        handleWord();
      }, isStartParens = function () { return chr == "("; }
      var isEndParens = function () { return chr == ")"; }
      var isSpaceLike = function () { return chr == " " || chr == "\n" || chr == "\r" || chr == "\t" }
      var isQuote = function () { return chr == "\"" }
      var isEscapeChar = function () { return chr == "\\" }
      var word = "", state = "code", group = [], chr = "", strName = "";
      while (i < codeLength) {
        chr = code.charAt(i);
        if (state == "code") { ret = handleCode() } 
        else if (state == "text") { ret = handleText() }
        if (ret == breakSignal) break;
        incIndex();
      }; return group; }; return innerParse(); } })
