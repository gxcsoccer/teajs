define(function(require, exports, module) {
	'use strict';
	var Waterfall = require('commonui/waterfall/Waterfall'),
		View = require('core/view/View'),
		EventEmitter = require('core/event/EventEmitter'),
		juicer = require('juicer'),
		template = juicer('<div class="ui-viewport"><ul class="ui-waterfall"></ul></div>', {});

	return View.extend({
		onInit: function(option) {
			this.$el.html(template);
			this.waterfall = new Waterfall({
				$el: this.$('.ui-waterfall'),
				colWidth: option.colWidth,
				queryFunction: option.queryFunction,
				createItem: option.createItem,
				preloadRow: preloadRow
			});

			this.waterfall.on('indexChanged', function(prev, now) {

			}, this);
			this.waterfall.on('rowChanged', function(prev, now) {

			}, this);
		},
		handleEvent: function(event) {
			switch (event.type) {
				case 'LEFT_KEY':
					break;
				case 'RIGHT_KEY':
					break;
				case 'UP_KEY':
					break;
				case 'DOWN_KEY':
					break;
				default:
					return 0;
			}
			return 1;
		}
	}).implement([EventEmitter]);
});