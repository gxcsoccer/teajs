define(function(require, exports, module) {
	'use strict';
	var Waterfall = require('commonui/waterfall/Waterfall'),
		View = require('core/view/View'),
		EventEmitter = require('core/event/EventEmitter'),
		//Position = require('tools/Position'),
		juicer = require('juicer'),
		template = juicer('<div class="ui-viewport"><ul class="ui-waterfall"></ul></div>', {});

	return View.extend({
		onInit: function(option) {
			/** 
				option.rowHeight: {number}	
				option.pivot: edge | middle | {number}	
			 */
			this.pivot = option.pivot || 'edge';
			this.$el.html(template);
			this.$waterfall = this.$('.ui-waterfall');
			this.$viewport = this.$('.ui-viewport');
			this.containerHeight = this.$viewport.height();
			this.waterfall = new Waterfall({
				$el: this.$('.ui-waterfall'),
				colWidth: option.colWidth,
				queryFunction: option.queryFunction,
				createItem: option.createItem,
				preloadRow: preloadRow
			});

			this.__defineGetter__('offsetTop', function() {
				return this._offsetTop || 0;
			});
			this.__defineSetter__('offsetTop', function(val) {
				this._offsetTop = val;
				this.$waterfall.css('transform', 'translate3d(0,' + val + 'px,0)');
			});

			var pivotFn = {
				edge: (function(currentRow, prevRow) {
					var guardTop = (currentRow - 1) * this.rowHeight,
						guardBottom = currentRow * this.rowHeight;

					if (guardBottom > (this.containerHeight - this.offsetTop)) {
						this.offsetTop = this.containerHeight - guardBottom;
					} else if (guardTop < -this.offsetTop) {
						this.offsetTop = -guardTop;
					}
				}).bind(this),
				middle: (function(currentRow, prevRow) {

				}).bind(this)
			}

			this.waterfall.on('indexChanged', function(prev, now) {
				var $pre = this.waterfall.getView(prev),
					$cur = this.waterfall.getCurrentView();

				$pre && $pre.removeClass('focused');
				$cur && $cur.addClass('focused');
			}, this);
			this.waterfall.on('rowChanged', pivotFn[this.pivot], this);
		},
		handleEvent: function(event) {
			switch (event.type) {
				case 'LEFT_KEY':
					this.waterfall.previous();
					break;
				case 'RIGHT_KEY':
					this.waterfall.next();
					break;
				case 'UP_KEY':
					this.waterfall.previousRow();
					break;
				case 'DOWN_KEY':
					this.waterfall.nextRow();
					break;
				default:
					return 0;
			}
			return 1;
		}
	}).implement([EventEmitter]);
});