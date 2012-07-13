setModule("parens-parser", function () { return function (code) {
  var isArray = function (obj) { return toString.call(obj) == '[object Array]'; }
  var i = 0, ret, codeLength = code.length, breakSignal = "BREAK!! xyzzy";
  var incIndex = function () { i += 1 }
  var innerParse = function () {
    var inColon = false, colonIndentWidth = 0,
        indentWidth = 0, indenting = true;
    var lastGroup = function () { return group[group.length - 1] }
    var setLastGroup = function (x) { group[group.length - 1] = x }
    var secondTolastGroup = function () { return group[group.length - 2] }
    var lastCharIsEndParens = function () { return code.substr(i - 1, 1) == ")" }
    var makeArrayLastGroup = function () {
      var last = lastGroup();
      if (!isArray(last)) { setLastGroup([last])  }
    }
    var joinLastTwo = function () {
      makeArrayLastGroup();
      var func = group.splice(group.length - 2, 1)[0]
      lastGroup().unshift(func)
    }

    var handleOuterFuncCall = function () {
      var funcOutsideParens = lastCharIsEndParens() || word.length
      addWord(); handleStartParens();
      if (funcOutsideParens) { joinLastTwo() }
    }
    var handleStartParens = function () { incIndex(); nestedParens(); }
    var handleEndParens = function () { handleSpace(); return breakSignal; }
    var addWord = function () { 
      if (word.length) { group.push(word) };
      if (inDot) { joinLastTwo(); inDot = false; }
      resetWord();
    }
    var nestedParens = function () {
      group.push(innerParse());
      // do I need this next line?
      if (inDot) { joinLastTwo(); inDot = false; }
    }
    var resetWord = function () { word = "" }
    var handleSpace = function () { addWord();}
    var handleQuote = function () { strName = word; resetWord(); state = "text"; }
    var handleWord = function () { word += chr }
    var handleDot = function () { handleSpace(); inDot = true; }
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
    }, isSpaceOrTab = function () { return chr == " " || chr == "\t"
    }, nextIsntSpaceOrTab = function () { 
      var nextChr = code.charAt(i + 1);
      return !(nextChr == " " || nextChr == "\t")
    }, isAnyNextLine = function () { return chr == " " || chr == "\t"
    }, manageIndentation = function () {
      if (indenting) {
        if (isSpaceOrTab()) {
          indentWidth++
          if (inColon && nextIsntSpaceOrTab()
              && colonIndentWidth == indentWidth) {
            handleEndColon()
          }
        }
        else if (isAnyNextLine) { indentWidth = 0 }
        else { indenting = false }
      } else {
        if (isAnyNextLine) {indenting = true; indentWidth = 0}
      }
    }, isStartColon = function () { return chr == ":" 
    }, handleStartColon = function () {
      inColon = true;
      colonIndentWidth = indentWidth;
      handleOuterFuncCall()
    }, handleEndColon = function () {
      inColon = false;
      handleEndParens();
    }, handleCode = function () {
      manageIndentation()
      if (isStartParens())  return handleOuterFuncCall();
      if (isEndParens()) return handleEndParens()
      if (isSpaceLike()) return handleSpace()
      if (isQuote()) return handleQuote()
      if (isDot()) return handleDot()
      if (isStartColon()) { return handleStartColon(); }
      handleWord()
    }, handleText = function () {
      if (isQuote()) return handleEndQuote();
      handleWord();
    }, isStartParens = function () { return chr == "("; }
    var isEndParens = function () { return chr == ")"; }
    var isSpaceLike = function () { return chr == " " || chr == "\n" || chr == "\r" || chr == "\t" }
    var isQuote = function () { return chr == "\"" }
    var isEscapeChar = function () { return chr == "\\" }
    var isDot = function () { return chr == "." }
    var isColon = function () {return chr == ":"}
    var word = "", state = "code", group = [], chr = "", strName = "";
    var inDot = false;
    while (i < codeLength) {
      chr = code.charAt(i);
      if (state == "code") { ret = handleCode() } 
      else if (state == "text") { ret = handleText() }
      if (ret == breakSignal) break;
      incIndex();
    }; return group; }; return innerParse(); } })
