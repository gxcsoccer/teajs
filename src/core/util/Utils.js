/**
 * @author XIAOCHEN GAO
 */
define(function(require, exports, module) {
	'use strict';
	var toString = Object.prototype.toString;


	return {
		later: function(fn, ms, context) {
			ms = ms || 0;
			context = context || null;

			var timer, wrapper = function() {
					var args = arguments;

					timer = setTimeout(function() {
						fn.apply(context, args);
					}, ms);
				};

			wrapper.stop = function() {
				timer && clearTimeout(timer);
			};

			return wrapper;
		},
		buffer: function(fn, ms, context) {
			var wrapper = this.later(fn, ms, context);

			return function() {
				wrapper.stop();
				wrapper.apply(null, arguments);
			};
		}
	};
});