define(function(require, exports, module) {
	'use strict';
	var Class = require('../../core/class/Class'),
		EventEmitter = require('../../core/event/EventEmitter'),
		hiddenCanvas = document.createElement('canvas'),
		hiddenContext = hiddenCanvas.getContext('2d'),
		juicer = require('juicer');

	return Class.extend({
		init: function(option) {
			$.extend(this, option);
			this.$el.addClass('ui-input');
			this.text = this.text || text;

			this.__defineGetter__('font', function() {
				return this._font || (this._font = this.$el.css('font'));
			});
			this.__defineGetter__('width', function() {
				return this._width || (this._width = this.$el.width());
			});

			this.cursorOffset = 0;
			hiddenContext.font = this.font;
			var contentWidth = hiddenContext.measureText(text).width;
		},
		inputChar: function(char) {

		},
		deleteChar: function() {

		},
		render: function(text) {
			text = this.text;
			hiddenContext.font = this.font;
			var contentWidth = hiddenContext.measureText(text).width;

		},
		active: function() {

		},
		deactive: function() {

		},
		moveLeft: function() {

		},
		moveRight: function() {

		}
	});
});