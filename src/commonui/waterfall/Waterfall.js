/**
 * @author g00201348
 */
define(function(require, exports, module) {
    var Class = require('core/class/Class'),
        EventEmitter = require('core/event/EventEmitter'),
        timedChunk = function(items, process, context) {
            var timer, todo, dtd = $.Deferred();

            function start() {
                // create a clone the original
                todo = [].concat($.makeArray(items));
                if (todo.length > 0) {
                    (function() {
                        var st = +new Date(),
                            item;
                        do {
                            item = todo.shift();
                            process.call(context, item);
                        } while (todo.length > 0 && (+new Date() - st < 50))

                        if (todo.length > 0) {
                            timer = setTimeout(arguments.callee, 25);
                        } else {
                            dtd.resolve();
                        }
                    })();
                } else {
                    dtd.reject();
                }
                return dtd;
            };

            dtd.stop = function() {
                if (timer) {
                    clearTimeout(timer);
                    todo = [];
                }
                dtd.reject();
                return dtd;
            }

            dtd.start = start;
            return dtd;
        },
        defaultOption = {
            //$el: $('#container'),
            colWidth: 200,
            createItem: function() {
                // ...
            },
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
        },
        show: function(offset, count) {
            this.$el.show();
            this.reset();
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
        active: function() {

        },
        deactive: function() {

        },
        next: function() {

        },
        previous: function() {

        },
        nextRow: function() {

        },
        previousRow: function() {

        }
    });


    var Waterfall = function(option) {
        $.extend(this, defaultOption, option);
        this.reset();


        this.__defineGetter__("currentIndex", function() {
            return this._currentIndex;
        });
        this.__defineSetter__("currentIndex", function(val) {
            if (!inQueryData) {
                var prev = this._currentIndex,
                    prevRow = prev != null && Math.ceil((prev + 1) / this.colCount),
                    curRow = Math.ceil((val + 1) / this.colCount),
                    length = this.viewList.length;

                console.warn("prev:" + prev + ",  now:" + val);
                if (prev == val) {
                    return;
                }
                this._currentIndex = val;
                if (prevRow && prevRow < curRow && curRow > length / this.colCount - 2 && !this.isNoMoreData) {
                    inQueryData = true;
                    console.warn("call queryFunction offset:" + length + ",  count:" + this.colCount);
                    this.queryFunction(length, this.colCount).done(function(resp) {
                        inQueryData = false;
                        if (resp.list.length < self.colCount) {
                            self.isNoMoreData = true;
                        }
                        self.dataList = self.dataList.concat(resp.list);
                        self.counttotal = self.dataList.length;
                        var items = resp.list.map(function(data) {
                            return self.createItem(data);
                        });
                        self.addItems(items);
                    })
                }
                prev !== val && this.trigger("indexChanged", prev, val);
                prevRow !== curRow && this.trigger("rowChanged", prevRow, curRow);

            }
        });
        this.__defineGetter__("currentRow", function() {
            return Math.ceil((this.currentIndex + 1) / this.colCount);
        });
        this.__defineGetter__("totolRowCount", function() {
            return Math.ceil(this.viewList.length / this.colCount);
        });
    };

    Waterfall.prototype = {
        show: function(offset, count) {
            if (arguments.length) {
                var self = this;
                this.reset();
                setTimeout(function() {
                    // 先调整一次
                    self.adjust();
                    self.queryFunction(offset || 0, count || -1).done(function(resp) {
                        self.dataList = self.dataList.concat(resp.list);
                        self.counttotal = self.dataList.length;
                        (self.counttotal < count || count === -1) && (self.isNoMoreData = true);
                        var items = resp.list.map(function(data) {
                            return self.createItem(data);
                        });
                        if (!items.length) {
                            self.trigger("noData");
                            return;
                        }

                        self.addItems(items);
                        self.currentIndex = 0;
                    });
                }, 0);
            }
            // 显示
            this.$container.show();
        },
        hide: function() {
            this.$container.hide();
        },
        active: function() {
            this.$container.addClass("active");
        },
        deactive: function() {
            this.$container.removeClass("active");
        },
        isActive: function() {
            return this.$container.hasClass("active");
        },
        reset: function() {
            this.viewList = [];
            this.dataList = [];
            this.isNoMoreData = false;
            this.counttotal = null;
            this._currentIndex = null;
            // 清空子元素
            this.$container.empty();
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
        setCurrentData: function(data) {
            this.dataList[this.currentIndex] = data;
        },
        getCount: function() {
            return this.dataList.length;
        },
        next: function() {
            if (this.currentIndex == (
                void 0)) {
                return;
            }
            this.currentIndex < (this.counttotal - 1) && (this.currentIndex += 1);
        },
        previous: function() {
            if (this.currentIndex == (
                void 0)) {
                return;
            }
            this.currentIndex && (this.currentIndex -= 1);
        },
        nextRow: function() {
            if (this.currentIndex == (
                void 0)) {
                return;
            }
            this.currentIndex = (this.currentIndex + this.colCount) < (this.counttotal - 1) ? (this.currentIndex + this.colCount) : (this.counttotal - 1);
        },
        previousRow: function() {
            if (this.currentIndex == (
                void 0)) {
                return;
            }
            this.currentIndex = (this.currentIndex - this.colCount) > 0 ? (this.currentIndex - this.colCount) : 0;
        },
        adjust: function() {
            var items = this.$container.children(),
                count = items.length,
                self = this,
                dtd;
            this.recalculate();
            if (!count) {
                return;
            }

            if (this.isAdjusting()) {
                this._adjuster.stop();
                this._adjuster = 0;
            }

            this._adjuster = timedChunk(items, function(item) {
                this.placeItem(item, false);
            }, this);
            // 结束后将容器高度重置
            dtd = this._adjuster.start()
            dtd.done(function() {
                var maxColHeight = Math.max.apply(Math, self.curColHeights);
                self.$container.height(maxColHeight);
                self._adjuster = null;
            });
            return dtd;
        },
        isAdjusting: function() {
            return !!this._adjuster;
        },
        isAdding: function() {
            return !!this._adder;
        },
        recalculate: function() {
            this.containerWidth = this.$container.width();
            console.log('the container width:' + this.containerWidth);
            this.colItems = [];
            this.curColHeights = [];
            this.colCount = Math.max(1, Math.floor(this.containerWidth / (this.colWidth == 0 ? 1 : this.colWidth)));

            // 初始化各列高度为0
            for (var i = 0; i < this.colCount; i += 1) {
                this.curColHeights[i] = 0;
            }
        },
        addItems: function(items) {
            items = $.makeArray(items);
            this.viewList = this.viewList.concat(items);
            this._adder = timedChunk(items, function(item) {
                this.placeItem(item, true);
            }, this);
            var self = this;
            var dtd = this._adder.start()
            dtd.done(function() {
                var maxColHeight = Math.max.apply(Math, self.curColHeights);
                self.$container.height(maxColHeight);
                self._adder = null;
            });
            return dtd;
        },
        placeItem: function(itemRaw, needToAdd) {
            var $item = $(itemRaw),
                colCount = this.curColHeights.length,
                col = 0,
                guard = Number.MAX_VALUE;

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
            needToAdd && this.$container.append($item);
            $item.css({
                left: col * this.colWidth,
                top: this.curColHeights[col]
            });

            // 载入DOM树后才能取高度，累加到对应列
            this.curColHeights[col] += $item.outerHeight(true);
            this.colItems[col] = this.colItems[col] || [];
            this.colItems[col].push($item);
            // 记录所在列，便于后面调整
            $item.attr('waterfall-col', col);
        },
        removeItem: function(index, isFadeout) {
            var $item = this.viewList[index],
                self = this;
            return $.Deferred(function(dtd) {
                function doRemove() {
                    $item.remove();
                    self.viewList.splice(index, 1);
                    self.dataList.splice(index, 1);
                    self.counttotal = self.counttotal - 1;
                    if (index <= self.currentIndex) {
                        if (self.currentIndex == 0) {
                            self._currentIndex = null;
                            self.currentIndex = 0;
                        } else {
                            self.currentIndex--;
                        }
                    }
                    //self.currentIndex = index === self.counttotal ? self.counttotal - 1 : index;
                    self.adjust().done(function() {
                        dtd.resolve();
                    });
                };
                if (isFadeout) {
                    $item.fadeOut().promise().done(doRemove);
                } else {
                    doRemove();
                }
            }).promise();
        }
    };
    Waterfall.prototype.__proto__ = EventEmitter.prototype;

    /**
     * To get a WaterfallObj, Static Method
     * @param {Object} option
     */
    Waterfall.get = function(option) {
        return new this(option);
    };
    return Waterfall;
});