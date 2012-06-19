var parse = function (code) {
  //not done
  var newCode = [] 
  var len = code.length
  var chr;
  var mode = "new-line";
  var indentCount = 0;
  var isSpace = function () { return chr == " "}
  var isNewLine = function () { return chr == "\n"}
  var isStringChr = function () { return chr != " " && chr != "\n" && chr != "\r" && chr != "\t"}
  var isStartString = function () { return chr == symbols.string || symbols["string-literal"] }
  var finalBucket = []
  var callBucket = []
  var wordBucket = []


  var handleNewLine = function () {
    if (isNewLine())
      indentCount == 0;
    else if (isSpace()) 
      indentCount += 1;
    else if (isStringChr()) 
      mode = "code";
    else if (isStartString()) 
      mode = "string";
  }

  var handleCode = function () {
    if (isStartString())
      mode = "string";
  }

  var handleString = function () {
  
  }

  for (var i; i < len; i++) {
    chr = code.charAt(i);

    if (mode == "new-line") {
      handleNewLine()
    } else if (mode = "code") {
      handleCode()
    } else if (mode == "string") {
      handleString() 
    }
  }
}
