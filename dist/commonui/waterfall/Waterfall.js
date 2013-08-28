/**
 * @author g00201348
 */
define("commonui/waterfall/Waterfall", [ "core/class/Class", "core/event/EventEmitter", "core/util/Utils" ], function(require, exports, module) {
    var Class = require("core/class/Class"), EventEmitter = require("core/event/EventEmitter"), timedChunk = require("core/util/Utils").timedChunk, defaultOption = {
        //$el: $('#container'),
        colWidth: 200,
        createItem: function() {},
        queryFunction: function(offset, count) {
            return $.Deferred(function(dtd) {
                dtd.resolve({
                    list: []
                });
            });
        },
        preloadRow: 1
    };
    return Class.extend({
        init: function(option) {
            $.extend(this, defaultOption, option);
            this.reset();
            this.__defineGetter__("currentIndex", function() {
                return this._currentIndex;
            });
            this.__defineSetter__("currentIndex", function(val) {
                var prev = this._currentIndex, prevRow = prev != null && Math.ceil((prev + 1) / this.colCount), curRow = Math.ceil((val + 1) / this.colCount), currentTotal = this.dataList.length;
                this._currentIndex = val;
                prev !== val && this.trigger("indexChanged", prev, val);
                prevRow !== curRow && this.trigger("rowChanged", prevRow, curRow);
                if (prev === val || this.isAdding || this.isAdjusting || this.noMoreData || this.isQuerying) return;
                if ((curRow + this.preloadRow) * this.colCount > currentTotal) {
                    this.loadMore(currentTotal, this.colCount);
                }
            });
            this.__defineGetter__("currentRow", function() {
                return Math.ceil((this.currentIndex + 1) / this.colCount);
            });
            this.__defineGetter__("isAdding", function() {
                return !!this._adder;
            });
            this.__defineGetter__("isAdjusting", function() {
                return !!this._adjuster;
            });
        },
        loadMore: function(offset, count) {
            offset = offset || 0;
            count = count || -1;
            this.isQuerying = true;
            return this.queryFunction(offset, count).done(function(res) {
                this.isQuerying = false;
                var list = res.list || [], items;
                if (list.length === 0 || count > 0 && list.length < count) {
                    this.noMoreData = true;
                }
                this.dataList = this.dataList.concat(list);
                items = list.map(function(data) {
                    return this.createItem(data);
                }.bind(this));
                this.addItems(items);
            }.bind(this));
        },
        show: function(offset, count, startIndex) {
            this.reset();
            this.$el.show();
            this.recalculate();
            this.loadMore(offset, count).done(function(res) {
                if (res && res.list.length == 0) {
                    this.emit("noData");
                } else if (startIndex != null) {
                    this.currentIndex = startIndex;
                }
            }.bind(this));
        },
        hide: function() {
            this.$el.hide();
        },
        reset: function() {
            this.viewList = [];
            this.dataList = [];
            this.noMoreData = false;
            this.currentIndex = null;
            // 清空子元素
            this.$el.empty();
        },
        next: function() {
            if (this.currentIndex == null) return;
            this.currentIndex = this.currentIndex < this.dataList.length - 1 ? this.currentIndex + 1 : this.dataList.length - 1;
        },
        previous: function() {
            if (this.currentIndex == null) return;
            this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : 0;
        },
        nextRow: function() {
            if (this.currentIndex == null) return;
            this.currentIndex = this.currentIndex + this.colCount < this.dataList.length - 1 ? this.currentIndex + this.colCount : this.dataList.length - 1;
        },
        previousRow: function() {
            if (this.currentIndex == null) return;
            this.currentIndex = this.currentIndex - this.colCount > 0 ? this.currentIndex - this.colCount : 0;
        },
        recalculate: function() {
            this.containerWidth = this.$el.width();
            this.colItems = [];
            this.curColHeights = [];
            this.colCount = Math.max(1, Math.floor(this.containerWidth / (this.colWidth == 0 ? 1 : this.colWidth)));
            // 初始化各列高度为0
            for (var i = 0; i < this.colCount; i += 1) {
                this.curColHeights[i] = 0;
            }
        },
        getData: function(index) {
            return this.dataList[index];
        },
        getCurrentData: function() {
            return this.dataList[this.currentIndex];
        },
        getView: function(index) {
            return this.viewList[index];
        },
        getCurrentView: function() {
            return this.viewList[this.currentIndex];
        },
        addItems: function(items) {
            items = $.makeArray(items);
            this.viewList = this.viewList.concat(items);
            this._adder = timedChunk(items, function(item) {
                this.placeItem(item, true);
            }, this);
            return this._adder.start().done(function() {
                var maxColHeight = Math.max.apply(Math, this.curColHeights);
                this.$el.height(maxColHeight);
                this._adder = null;
            }.bind(this));
        },
        placeItem: function(itemRaw, needToAdd) {
            var $item = $(itemRaw), colCount = this.curColHeights.length, col = 0, guard = Number.MAX_VALUE, left, top;
            if (!colCount) {
                return;
            }
            // 寻找当前高度最低的一行
            for (var i = 0; i < colCount; i += 1) {
                if (this.curColHeights[i] < guard) {
                    col = i;
                    guard = this.curColHeights[i];
                }
            }
            needToAdd && this.$el.append($item);
            left = col * this.colWidth;
            top = this.curColHeights[col];
            if (this.rowHeight) {
                $item.css({
                    left: left,
                    top: top,
                    height: this.rowHeight
                });
            } else {
                $item.css({
                    left: left,
                    top: top
                });
            }
            // 载入DOM树后才能取高度，累加到对应列
            this.curColHeights[col] += this.rowHeight || $item.outerHeight(true);
            this.colItems[col] = this.colItems[col] || [];
            this.colItems[col].push($item);
            // 记录所在列，便于后面调整
            $item.attr({
                "data-waterfall-col": col,
                "data-waterfall-left": left,
                "data-waterfall-top": top
            });
        },
        removeItem: function(index, isFadeout) {
            return $.Deferred(function(dtd) {
                var $item = this.viewList[index], doRemove = function() {
                    $item.remove();
                    this.viewList.splice(index, 1);
                    this.dataList.splice(index, 1);
                    if (index <= this.currentIndex) {
                        if (this.currentIndex == 0) {
                            this.currentIndex = null;
                        } else {
                            this.currentIndex--;
                        }
                    }
                    this.adjust().done(function() {
                        dtd.resolve();
                    });
                }.bind(this);
                if (isFadeout) {
                    $item.fadeOut().promise().done(doRemove);
                } else {
                    doRemove();
                }
            }).promise();
        },
        adjust: function() {
            var items = this.$container.children(), count = items.length;
            if (!count) {
                return;
            }
            this.recalculate();
            if (this.isAdjusting) {
                this._adjuster.stop();
                this._adjuster = 0;
            }
            this._adjuster = timedChunk(items, function(item) {
                this.placeItem(item, false);
            }, this);
            // 结束后将容器高度重置
            return this._adjuster.start().done(function() {
                var maxColHeight = Math.max.apply(Math, this.curColHeights);
                this.$el.height(maxColHeight);
                this._adjuster = null;
            });
        }
    }).implement([ EventEmitter ]).statics({
        get: function(option) {
            return new this(option);
        }
    });
});