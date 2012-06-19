//get global object, either window or global
//if window? then window else if global? then global else this
var root = typeof window !== "undefined" && window !== null ? window : typeof global !== "undefined" && global !== null ? global : this;   
if (!root.poorModule) {
  var poorModule = root.poorModule = {};
  var defs = poorModule.defs = {};
  var modules = poorModule.modules = {};
  
  var setModule = poorModule.setModule = function (name, fn) {
    defs[name] = fn;
    delete modules[name]; 
  }

  var getModule = poorModule.getModule = function (name) {
    if (modules.hasOwnProperty(name)) return modules[name];
    if (defs.hasOwnProperty(name)) {
      var fn = defs[name];
      defs[name] = function () { throw new Error("Circular Dependency"); }
      return modules[name] = fn();
    }
    throw new Error("Module not found: " + name);
  }

  if (!root.setModule) { root.setModule = setModule; }
  if (!root.getModule) { root.getModule = getModule; }
}
