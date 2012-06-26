/**
 * @author XIAOCHEN GAO
 */
define(function(require, exports, module) {
	var Utils = exports;
	var toString = Object.prototype.toString;

	Utils.isFunction = function(val) {
		return toString.call(val) === "[object Function]";
	};

	Utils.isObject = function(val) {
		return val === Object(val);
	};

	Utils.isString = function(val) {
		return toString.call(val) === "[object String]";
	};

	Utils.isArray = Array.isArray ||
	function(val) {
		return toString.call(val) === "[object Array]";
	};

});
