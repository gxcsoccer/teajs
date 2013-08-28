define("commonui/carousel/Carousel", [ "../../core/class/Class", "../../core/event/EventEmitter", "lib/juicer" ], function(require, exports, module) {
    "use strict";
    var Class = require("../../core/class/Class"), EventEmitter = require("../../core/event/EventEmitter"), juicer = require("lib/juicer"), slice = Array.prototype.slice, defaultOptions = {
        direction: "horizon",
        // verical or horizon
        size: 5,
        setItem: function($view, data) {},
        itemWidth: 190,
        itemHeight: 190,
        gap: 10,
        position: "middle",
        animation: true
    };
    return Class.extend({
        init: function(option) {
            $.extend(this, defaultOptions, option);
            this.$el.html(juicer('<ul class="ui-carousel">{@each i in range(0, ' + (this.size + 2) + ')}<li class="ui-carousel-item"></li>{@/each}</ul>', {}));
            this.viewList = slice.call(this.$(".ui-carousel-item").map(function() {
                return $(this);
            }));
            this.$container = this.$(".ui-carousel");
            this.$container.css({
                width: this.direction == "horizon" ? (this.itemWidth + this.gap) * this.size - this.gap : this.itemWidth,
                height: this.direction == "horizon" ? this.itemHeight : (this.itemHeight + this.gap) * this.size - this.gap
            });
            this.initPosition();
            this.__defineGetter__("currentIndex", function() {
                return this._currentIndex;
            });
            this.__defineSetter__("currentIndex", function(val) {
                var prev = this._currentIndex, len = this.dataList.length, that = this, dataList;
                this._currentIndex = val;
                if (prev === val) return;
                if ((prev + 1) % len == val) {
                    dataList = this.getCurrentDataList();
                    this.viewList.forEach(function($el) {
                        var index = $.data($el, "index");
                        that.animation && $el.removeClass("ui-carousel-item-moveable");
                        that.animation && $el[0].offsetLeft;
                        if (index == 0) {
                            that.setItem($el, dataList[that.size + 1]);
                            index = that.size + 1;
                        } else {
                            that.animation && $el.addClass("ui-carousel-item-moveable");
                            index = index - 1;
                        }
                        $el.css({
                            "-webkit-transform": that.itemPostionList[index]
                        });
                        $.data($el, "index", index);
                    });
                } else if ((prev + len - 1) % len == val) {
                    dataList = this.getCurrentDataList();
                    this.viewList.forEach(function($el) {
                        var index = $.data($el, "index");
                        that.animation && $el.addClass("ui-carousel-item-moveable");
                        that.animation && $el[0].offsetLeft;
                        if (index == that.size + 1) {
                            that.setItem($el, dataList[0]);
                            index = 0;
                        } else {
                            that.animation && $el.addClass("ui-carousel-item-moveable");
                            index = index + 1;
                        }
                        $el.css({
                            "-webkit-transform": that.itemPostionList[index]
                        });
                        $.data($el, "index", index);
                    });
                } else {
                    dataList = this.getCurrentDataList();
                    this.viewList.forEach(function($el, index) {
                        that.animation && $el.removeClass("ui-carousel-item-moveable");
                        that.setItem($el, dataList[index]);
                        $.data($el, "index", index);
                        $el.css({
                            "-webkit-transform": that.itemPostionList[index],
                            width: that.itemWidth,
                            height: that.itemHeight
                        });
                    });
                }
                this.emit("indexChanged", prev, val);
            });
        },
        $: function(selector) {
            return this.$el.find(selector);
        },
        initPosition: function() {
            if (this.position == "middle") {
                this.position = Math.floor(this.size / 2);
            } else if (this.position == "end") {
                this.position = this.size - 1;
            }
            this.position += 1;
            this.itemPostionList = [];
            for (var i = 0; i < this.size + 2; i++) {
                this.itemPostionList.push(this.direction == "horizon" ? "translate3d(" + (i - 1) * (this.itemWidth + this.gap) + "px,0,0)" : "translate3d(0," + (i - 1) * (this.itemHeight + this.gap) + "px,0)");
            }
        },
        show: function(data, index) {
            this.$el.show();
            this.dataList = data;
            this.dataLength = data.length;
            this.currentIndex = index || 0;
        },
        hide: function() {
            this.$el.hide();
        },
        next: function() {
            this.currentIndex = this.currentIndex == this.dataLength - 1 ? this.dataLength < this.size + 2 ? this.currentIndex : 0 : this.currentIndex + 1;
        },
        previous: function() {
            this.currentIndex = this.currentIndex == 0 ? this.dataLength < this.size + 2 ? 0 : this.dataLength - 1 : this.currentIndex - 1;
        },
        "goto": function(index) {
            this.currentIndex = index;
        },
        getCurrentData: function() {
            return this.dataList[this.currentIndex];
        },
        getCurrentDataList: function() {
            var list = [], notEnoughData = this.dataLength < this.size + 2, startIndex = notEnoughData ? this.currentIndex - this.position : (this.currentIndex - this.position + this.dataLength) % this.dataLength;
            for (var i = 0; i < this.size + 2; i++) {
                list.push(notEnoughData ? this.dataList[startIndex + i] : this.dataList[(startIndex + i) % this.dataLength]);
            }
            return list;
        }
    }).implement([ EventEmitter ]);
});