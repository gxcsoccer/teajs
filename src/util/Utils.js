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

	Utils.mix = function(r, s, wl) {
		// Copy "all" properties including inherited ones.
		for (var p in s) {
			if (s.hasOwnProperty(p)) {
				if (wl && indexOf(wl, p) === -1) continue;

				// 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
				if (p !== 'prototype') {
					r[p] = s[p];
				}
			}
		}
	};

	/**
	 * 不严谨的深拷贝
	 */
	Utils.clone = function(input) {
		if (!Utils.isObject(input)) {
			return input;
		}

		var type = Object.prototype.toString.call(input);
		switch (type) {
		case "[object Object]":
			return Object.create(input, JSON.parse(JSON.stringify(input)));
		case "[object Array]":
			return input.map(function(item) {
				return Object.create(item, JSON.parse(JSON.stringify(item)));
			});
			break;
		default:
			return input;
		}
	};
});