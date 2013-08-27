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
			var preloadRow = Math.ceil(this.containerHeight / option.rowHeight)
			this.waterfall = new Waterfall({
				$el: this.$('.ui-waterfall'),
				colWidth: option.colWidth,
				queryFunction: option.queryFunction,
				createItem: option.createItem,
				preloadRow: preloadRow,
				rowHeight: option.rowHeight
			});

			this.__defineGetter__('offsetTop', function() {
				return this._offsetTop || 0;
			});
			this.__defineSetter__('offsetTop', function(val) {
				this._offsetTop = val;
				this.$waterfall.css('transform', 'translate3d(0,' + val + 'px,0)');
			});

			var pivotFn = {
				edge: (function(prevRow, currentRow) {
					var guardTop = currentRow > 1 ? ((currentRow - 1) * this.waterfall.rowHeight) : 0,
						guardBottom = currentRow * this.waterfall.rowHeight;

					if (guardBottom > (this.containerHeight - this.offsetTop)) {
						this.offsetTop = this.containerHeight - guardBottom;
					} else if (guardTop < -this.offsetTop) {
						this.offsetTop = -guardTop;
					}
				}).bind(this),
				middle: (function(prevRow, currentRow) {
					var m = Math.ceil(this.containerHeight / (this.waterfall.rowHeight * 2)),
						noMoreData = this.waterfall.noMoreData,
						totalRow = Math.ceil(this.waterfall.dataList.length / this.waterfall.colCount);

					if (currentRow < m) {
						this.offsetTop = 0;
					} else if (noMoreData && (totalRow - currentRow) < (preloadRow - m)) {
						this.offsetTop = (preloadRow - totalRow - m + 2) * this.waterfall.rowHeight;
					} else {
						this.offsetTop = (m - currentRow) * this.waterfall.rowHeight;
					}
				}).bind(this)
			}

			this.waterfall.on('indexChanged', function(prev, now) {
				var $pre = this.waterfall.getView(prev),
					$cur = this.waterfall.getCurrentView();

				$pre && $pre.removeClass('focused');
				$cur && $cur.addClass('focused');
			}, this);
			this.waterfall.on('rowChanged', pivotFn[this.pivot], this);

			this.waterfall.show(0, 15, 0);
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