setModule("fake-script", function () { return function (scriptTypes, runFunc) {
_ = getModule("underscore")

load = function(url, callback) {
  var xhr;
  xhr = new (window.ActiveXObject || XMLHttpRequest)('Microsoft.XMLHTTP');
  xhr.open('GET', url, true);
  if ('overrideMimeType' in xhr) xhr.overrideMimeType('text/plain');
  xhr.onreadystatechange = function() {
    var _ref;
    if (xhr.readyState === 4) {
      if ((_ref = xhr.status) === 0 || _ref === 200) {
        runFunc(xhr.responseText, {fileName: url});
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
      if (_.include(scriptTypes, s.type)) _results.push(s);
    }
    return _results;
  })();
  index = 0;
  length = thumbses.length;
  (execute = function() {
    var script;
    script = thumbses[index++];
    var scriptType = (script != null ? script.type : void 0)
    if (_.include(scriptTypes, scriptType)) {
      if (script.src) {
        return thumbs.load(script.src, execute);
      } else {
        runFunc(script.innerHTML.slice(1), {fileName: "scripttag" + (index - 1)});
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
return {load: load, runScripts: runScripts}
} });
