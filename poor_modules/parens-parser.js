setModule("parens-parser", function () { return function (code) {
  var isArray = function (obj) { return toString.call(obj) == '[object Array]'; }
  var i = 0, ret, codeLength = code.length, breakSignal = "BREAK!! xyzzy";
  var incIndex = function () { i += 1 }
  var indenting = true;
  var indentWidth = 0;
  var innerParse = function (options) {
    // this innerParse mehtod is recursive
    // would it be easier to do the indentation
    // handling if it were iterative instead of recursive?
    // looks easier this way.
    options = options || {}
    var inColon = ("inColon" in options) ? options.inColon : false;
    var colonIndentWidth = ("colonIndentWidth" in options) ? options.colonIndentWidth : 0;
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

    var handleOuterFuncCall = function (options) {
      var funcOutsideParens = lastCharIsEndParens() || word.length
      addWord();
      var ret = handleStartParens(options);
      if (funcOutsideParens) { joinLastTwo() }
      return ret;
    }
    var handleStartParens = function (options) { 
      incIndex();
      return nestedParens(options);
    }
    var handleEndParens = function () {
      handleSpace();
      // close all open parens
      if (inColon) i--;
      return breakSignal;
    }
    var addWord = function () { 
      if (word.length) { group.push(word) };
      if (inDot) { joinLastTwo(); inDot = false; }
      resetWord();
    }
    var nestedParens = function (options) {
      var ret = innerParse(options)
      group.push(ret);
      if (inColon) { 
        ret = checkForCloseColon() 
        if (ret == breakSignal) console.log("yay!")
      }
      // do I need this next line?
      if (inDot) { joinLastTwo(); inDot = false; }
      return ret
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
    }, isAnyNextLine = function () { return chr == "\n" || chr == "\r"
    }, checkForCloseColon = function () {
      if (inColon && nextIsntSpaceOrTab()
          && colonIndentWidth >= indentWidth) {
        return handleEndColon()
      }
    }, manageIndentation = function () {
      if (indenting) {
        if (isSpaceOrTab()) { indentWidth++; return checkForCloseColon(); }
        else if (isAnyNextLine()) { indentWidth = 0 }
        else { indenting = false }
      } else {
        if (isAnyNextLine()) {
          indenting = true; indentWidth = 0;
          return checkForCloseColon()
        }
      }
    }, isStartColon = function () { return chr == ":" 
    }, handleStartColon = function () {
      console.log("colon indent " + indentWidth)
      return handleOuterFuncCall({
        inColon: true,
        colonIndentWidth: indentWidth
      })
    }, handleEndColon = function () {
      handleSpace();
      return breakSignal;
    }, handleCode = function () {
      if (manageIndentation() == breakSignal) return breakSignal;
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
