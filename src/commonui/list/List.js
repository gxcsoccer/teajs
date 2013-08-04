define(function(require, exports, module) {
	'use strict';
	var Class = require('../../core/class/Class'),
		EventEmitter = require('../../core/event/EventEmitter');

	return Class.extend({
		init: function(option) {
			option = option || {};
			this.$el
			this.template = option.template;
			this.model = option.model;
		},
		render: function() {

		},
		next: function() {

		},
		previous: function() {

		}
	}).implement([EventEmitter]);
});