define(function(require, exports, module) {
	'use strict';
	var Class = require('../class/Class'),
		EventEmitter = require('../event/EventEmitter'),
		Utils = require('../util/Utils'),
		juicer = require('juicer'),
		root = {
			$el: $(document.body),
			children: []
		};

	return Class.extend({
		template: '<div></div>',
		init: function(container, option) {
			option = option || {};
			this.container = container || root;
			this.container.children.push(this);
			this.children = [];

			this.id = option.id || Utils.nextUid();
			if (option.$el) {
				this.$el = option.$el
			} else {
				this.$el = this.makeElement();
				this.attach();
			}
			this.show();
			this.onInit(option);
		},
		onInit: function(option) {
			// ...
		},
		$: function(selector) {
			return this.$el.find(selector);
		},
		makeElement: function() {
			return $(this.template, {
				'id': this.id
			});
		},
		attach: function() {
			if (!$.contains(this.container.$el[0], this.$el[0])) {
				this.container.$el.append(this.$el);
			}
		},
		detach: function() {
			this.$el.remove();
		},
		show: function() {
			this.$el.show();
			this.active();
		},
		hide: function() {
			this.$el.hide();
			this.deactive();
		},
		active: function() {
			this.isActive = true;
		},
		deactive: function() {
			this.isActive = false;
		},
		dispatchEvent: function(event) {
			if (!this.isActive) {
				return 0;
			}
			var ret = 0;
			$.each(this.children, function(index, child) {
				ret = child.dispatchEvent(event);
				return ret === 0;
			});

			return ret || this.handleEvent(event);
		},
		handleEvent: function(event) {
			// ...
			return 0;
		},
		destory: function() {
			this.detach();
			var index = this.container.children.indexOf(this);
			index >= 0 && this.container.children.splice(index, 1);

			this.children.forEach(function(child) {
				child.destory();
			});

			this.onDestory();
		},
		onDestory: function() {
			// ...
		}
	}).implement([EventEmitter]);
});