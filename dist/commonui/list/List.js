define("commonui/list/List", [ "core/class/Class", "core/event/EventEmitter" ], function(require, exports, module) {
    "use strict";
    var Class = require("core/class/Class"), EventEmitter = require("core/event/EventEmitter"), interpolate = /\${([\s\S]+?)}/gim, slice = Array.prototype.slice;
    return Class.extend({
        init: function(option) {
            option = option || {};
            this.$el = option.$el;
            this.template = this.compile(option.template);
            this.__defineGetter__("currentIndex", function() {
                return this._currentIndex;
            });
            this.__defineSetter__("currentIndex", function(val) {
                var prev = this._currentIndex;
                this._currentIndex = val;
                if (prev !== val) {
                    this.emit("indexChanged", val, prev);
                }
            });
            this.onFocus = option.onFocus;
            this.onBlur = option.onBlur;
            this.size = 0;
            this.on("indexChanged", function(prev, now) {
                this.onBlur && prev != null && this.onBlur(this.getView(prev), this.getData(prev));
                this.onFocus && now != null && this.onFocus(this.getView(now), this.getData(now));
            }, this);
        },
        compile: function(template) {
            template = template || "<li></li>";
            if ($.isFunction(template)) {
                return template;
            }
            return function(model) {
                template.replace(interpolate, function($, name) {
                    return model[name];
                });
            };
        },
        render: function(data) {
            data = Array.isArray(data) ? data : [ data ];
            var html = "";
            data.forEach(function(item) {
                html += this.template(item);
            }, this);
            this.$el.html(html);
            this.dataList = data;
            this.viewList = slice.call(this.$el.children().map(function() {
                return $(this);
            }));
            this.size = this.dataList.length;
            if (data.length) {
                this.currentIndex = 0;
            }
        },
        getData: function(index) {
            return this.dataList[index];
        },
        getView: function(index) {
            return this.viewList[index];
        },
        getCurrentView: function() {
            return this.viewList[this.currentIndex];
        },
        getCurrentData: function() {
            return this.dataList[this.currentIndex];
        },
        "goto": function(index) {
            if (index < 0 && index >= this.size) {
                return;
            }
            this.currentIndex = index;
        },
        next: function(num) {
            if (this.currentIndex == null) {
                return;
            }
            num = num || 1;
            this.currentIndex = this.currentIndex + num > this.size - 1 ? this.size - 1 : this.currentIndex + num;
        },
        previous: function(num) {
            if (this.currentIndex == null) {
                return;
            }
            num = num || 1;
            this.currentIndex = this.currentIndex - num < 0 ? 0 : this.currentIndex - num;
        }
    }).implement([ EventEmitter ]);
});