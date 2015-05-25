function TerritoryArray() { }
TerritoryArray.prototype.length = 0;

(function () {
    var methods = ['push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'join'];
    for (var i = 0; i < methods.length; i++) (function (name) {
        TerritoryArray.prototype[name] = function () {
            return Array.prototype[name].apply(this, arguments);
        };
    })(methods[i]);
})();

