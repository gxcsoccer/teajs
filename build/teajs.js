define("customize/app", [ "widget/WaterfallWidget", "commonui/waterfall/Waterfall", "core/view/View", "core/event/EventEmitter", "juicer" ], function(require, exports, module) {
    "use strict";
    require("css/test.css");
    var Waterfall = require("widget/WaterfallWidget");
    var waterfall = new Waterfall(null, {
        colWidth: 200,
        rowHeight: 200,
        queryFunction: function(offset, count) {
            return $.Deferred(function(dtd) {
                var list = [];
                for (var i = 0; i < count && offset + i < 20; i++) {
                    list.push(offset + i);
                }
                dtd.resolve({
                    list: list
                });
            }).promise();
        },
        createItem: function(data) {
            return $('<li class="ui-waterfall-item"><div>' + data + "</div></li>");
        },
        pivot: "middle"
    });
    waterfall.show();
    var keyMap = {
        "37": "LEFT_KEY",
        "39": "RIGHT_KEY",
        "38": "UP_KEY",
        "40": "DOWN_KEY"
    };
    window.onkeydown = function(e) {
        var which = e.which;
        console.log(which);
        waterfall.dispatchEvent({
            type: keyMap[which]
        });
    };
});

define("css/test.css", [], function() {
    seajs.importStyle(".ui-viewport{position:relative;width:1000px;height:600px;overflow:hidden}.ui-waterfall{position:absolute;width:100%;-webkit-transition:-webkit-transform .6s}.ui-waterfall-item{position:absolute;width:200px;height:200px}.ui-waterfall-item>div{position:absolute;top:10px;left:10px;width:180px;height:180px;background:red}.ui-waterfall-item.focused>div{box-shadow:0 0 20px 5px #00f}ul{list-style:none;margin:0;padding:0}");
});

define([ "commonui/waterfall/Waterfall", "core/view/View", "core/event/EventEmitter", "juicer" ], function(require, exports, module) {
    "use strict";
    var Waterfall = require("commonui/waterfall/Waterfall"), View = require("core/view/View"), EventEmitter = require("core/event/EventEmitter"), //Position = require('tools/Position'),
    juicer = require("juicer"), template = juicer('<div class="ui-viewport"><ul class="ui-waterfall"></ul></div>', {});
    return View.extend({
        onInit: function(option) {
            /** 
				option.rowHeight: {number}	
				option.pivot: edge | middle | {number}	
			 */
            this.pivot = option.pivot || "edge";
            this.$el.html(template);
            this.$waterfall = this.$(".ui-waterfall");
            this.$viewport = this.$(".ui-viewport");
            this.containerHeight = this.$viewport.height();
            var preloadRow = Math.ceil(this.containerHeight / option.rowHeight);
            this.waterfall = new Waterfall({
                $el: this.$(".ui-waterfall"),
                colWidth: option.colWidth,
                queryFunction: option.queryFunction,
                createItem: option.createItem,
                preloadRow: preloadRow,
                rowHeight: option.rowHeight
            });
            this.__defineGetter__("offsetTop", function() {
                return this._offsetTop || 0;
            });
            this.__defineSetter__("offsetTop", function(val) {
                this._offsetTop = val;
                this.$waterfall.css("transform", "translate3d(0," + val + "px,0)");
            });
            var pivotFn = {
                edge: function(prevRow, currentRow) {
                    var guardTop = currentRow > 1 ? (currentRow - 1) * this.waterfall.rowHeight : 0, guardBottom = currentRow * this.waterfall.rowHeight;
                    if (guardBottom > this.containerHeight - this.offsetTop) {
                        this.offsetTop = this.containerHeight - guardBottom;
                    } else if (guardTop < -this.offsetTop) {
                        this.offsetTop = -guardTop;
                    }
                }.bind(this),
                middle: function(prevRow, currentRow) {
                    var m = Math.ceil(this.containerHeight / (this.waterfall.rowHeight * 2)), noMoreData = this.waterfall.noMoreData, totalRow = Math.ceil(this.waterfall.dataList.length / this.waterfall.colCount);
                    if (currentRow < m) {
                        this.offsetTop = 0;
                    } else if (noMoreData && totalRow - currentRow < preloadRow - m) {
                        this.offsetTop = (preloadRow - totalRow - m + 2) * this.waterfall.rowHeight;
                    } else {
                        this.offsetTop = (m - currentRow) * this.waterfall.rowHeight;
                    }
                }.bind(this)
            };
            this.waterfall.on("indexChanged", function(prev, now) {
                var $pre = this.waterfall.getView(prev), $cur = this.waterfall.getCurrentView();
                $pre && $pre.removeClass("focused");
                $cur && $cur.addClass("focused");
            }, this);
            this.waterfall.on("rowChanged", pivotFn[this.pivot], this);
            this.waterfall.show(0, 15, 0);
        },
        handleEvent: function(event) {
            switch (event.type) {
              case "LEFT_KEY":
                this.waterfall.previous();
                break;

              case "RIGHT_KEY":
                this.waterfall.next();
                break;

              case "UP_KEY":
                this.waterfall.previousRow();
                break;

              case "DOWN_KEY":
                this.waterfall.nextRow();
                break;

              default:
                return 0;
            }
            return 1;
        }
    }).implement([ EventEmitter ]);
});

/**
 * @author g00201348
 */
define([ "core/class/Class", "core/event/EventEmitter", "core/util/Utils" ], function(require, exports, module) {
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

define([ "../class/Class", "../event/EventEmitter", "../util/Utils", "juicer" ], function(require, exports, module) {
    "use strict";
    var Class = require("../class/Class"), EventEmitter = require("../event/EventEmitter"), Utils = require("../util/Utils"), juicer = require("juicer"), root = {
        $el: $(document.body),
        children: []
    };
    return Class.extend({
        template: "<div></div>",
        init: function(container, option) {
            option = option || {};
            this.container = container || root;
            this.container.children.push(this);
            this.children = [];
            this.id = option.id || Utils.nextUid();
            if (option.$el) {
                this.$el = option.$el;
            } else {
                this.$el = this.makeElement();
                this.attach();
            }
            this.show();
            this.onInit(option);
        },
        onInit: function(option) {},
        $: function(selector) {
            return this.$el.find(selector);
        },
        makeElement: function() {
            return $(this.template, {
                id: this.id
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
        onDestory: function() {}
    }).implement([ EventEmitter ]);
});

define([], function() {
    "use strict";
    // Events
    // -----------------
    // Thanks to:
    // - https://github.com/documentcloud/backbone/blob/master/backbone.js
    // - https://github.com/joyent/node/blob/master/lib/events.js
    // Regular expression used to split event strings
    var eventSplitter = /\s+/;
    // A module that can be mixed in to *any object* in order to provide it
    // with custom events. You may bind with `on` or remove with `off` callback
    // functions to an event; `trigger`-ing an event fires all callbacks in
    // succession.
    //
    // var object = new Events();
    // object.on('expand', function(){ alert('expanded'); });
    // object.trigger('expand');
    //
    function Events() {}
    // Bind one or more space separated events, `events`, to a `callback`
    // function. Passing `"all"` will bind the callback to all events fired.
    Events.prototype.on = function(events, callback, context) {
        var cache, event, list;
        if (!callback) return this;
        cache = this.__events || (this.__events = {});
        events = events.split(eventSplitter);
        while (event = events.shift()) {
            list = cache[event] || (cache[event] = []);
            list.push(callback, context);
        }
        return this;
    };
    // Remove one or many callbacks. If `context` is null, removes all callbacks
    // with that function. If `callback` is null, removes all callbacks for the
    // event. If `events` is null, removes all bound callbacks for all events.
    Events.prototype.off = function(events, callback, context) {
        var cache, event, list, i;
        // No events, or removing *all* events.
        if (!(cache = this.__events)) return this;
        if (!(events || callback || context)) {
            delete this.__events;
            return this;
        }
        events = events ? events.split(eventSplitter) : keys(cache);
        // Loop through the callback list, splicing where appropriate.
        while (event = events.shift()) {
            list = cache[event];
            if (!list) continue;
            if (!(callback || context)) {
                delete cache[event];
                continue;
            }
            for (i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                    list.splice(i, 2);
                }
            }
        }
        return this;
    };
    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    Events.prototype.trigger = function(events) {
        var cache, event, all, list, i, len, rest = [], args, returned = true;
        if (!(cache = this.__events)) return this;
        events = events.split(eventSplitter);
        // Fill up `rest` with the callback arguments. Since we're only copying
        // the tail of `arguments`, a loop is much faster than Array#slice.
        for (i = 1, len = arguments.length; i < len; i++) {
            rest[i - 1] = arguments[i];
        }
        // For each event, walk through the list of callbacks twice, first to
        // trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
            // Copy callback lists to prevent modification.
            if (all = cache.all) all = all.slice();
            if (list = cache[event]) list = list.slice();
            // Execute event callbacks.
            returned = triggerEvents(list, rest, this) && returned;
            // Execute "all" callbacks.
            returned = triggerEvents(all, [ event ].concat(rest), this) && returned;
        }
        return returned;
    };
    Events.prototype.emit = Events.prototype.trigger;
    // Mix `Events` to object instance or Class function.
    Events.mixTo = function(receiver) {
        receiver = receiver.prototype || receiver;
        var proto = Events.prototype;
        for (var p in proto) {
            if (proto.hasOwnProperty(p)) {
                receiver[p] = proto[p];
            }
        }
    };
    // Helpers
    // -------
    var keys = Object.keys;
    if (!keys) {
        keys = function(o) {
            var result = [];
            for (var name in o) {
                if (o.hasOwnProperty(name)) {
                    result.push(name);
                }
            }
            return result;
        };
    }
    // Execute callbacks
    function triggerEvents(list, args, context) {
        if (list) {
            var i = 0, l = list.length, a1 = args[0], a2 = args[1], a3 = args[2], pass = true;
            // call is faster than apply, optimize less than 3 argu
            // http://blog.csdn.net/zhengyinhui100/article/details/7837127
            switch (args.length) {
              case 0:
                for (;i < l; i += 2) {
                    pass = list[i].call(list[i + 1] || context) !== false && pass;
                }
                break;

              case 1:
                for (;i < l; i += 2) {
                    pass = list[i].call(list[i + 1] || context, a1) !== false && pass;
                }
                break;

              case 2:
                for (;i < l; i += 2) {
                    pass = list[i].call(list[i + 1] || context, a1, a2) !== false && pass;
                }
                break;

              case 3:
                for (;i < l; i += 2) {
                    pass = list[i].call(list[i + 1] || context, a1, a2, a3) !== false && pass;
                }
                break;

              default:
                for (;i < l; i += 2) {
                    pass = list[i].apply(list[i + 1] || context, args) !== false && pass;
                }
                break;
            }
        }
        // trigger will return false if one of the callbacks return false
        return pass;
    }
    return Events;
});

/*
    ********** Juicer **********
    ${A Fast template engine}
    Project Home: http://juicer.name

    Author: Guokai
    Gtalk: badkaikai@gmail.com
    Blog: http://benben.cc
    Licence: MIT License
    Version: 0.6.5-stable
*/
define([], function(require, exports, module) {
    // This is the main function for not only compiling but also rendering.
    // there's at least two parameters need to be provided, one is the tpl, 
    // another is the data, the tpl can either be a string, or an id like #id.
    // if only tpl was given, it'll return the compiled reusable function.
    // if tpl and data were given at the same time, it'll return the rendered 
    // result immediately.
    var juicer = function() {
        var args = [].slice.call(arguments);
        args.push(juicer.options);
        if (args[0].match(/^\s*#([\w:\-\.]+)\s*$/gim)) {
            args[0].replace(/^\s*#([\w:\-\.]+)\s*$/gim, function($, $id) {
                var _document = document;
                var elem = _document && _document.getElementById($id);
                args[0] = elem ? elem.value || elem.innerHTML : $;
            });
        }
        if (arguments.length == 1) {
            return juicer.compile.apply(juicer, args);
        }
        if (arguments.length >= 2) {
            return juicer.to_html.apply(juicer, args);
        }
    };
    var __escapehtml = {
        escapehash: {
            "<": "&lt;",
            ">": "&gt;",
            "&": "&amp;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2f;"
        },
        escapereplace: function(k) {
            return __escapehtml.escapehash[k];
        },
        escaping: function(str) {
            return typeof str !== "string" ? str : str.replace(/[&<>"]/gim, this.escapereplace);
        },
        detection: function(data) {
            return typeof data === "undefined" ? "" : data;
        }
    };
    var __throw = function(error) {
        if (typeof console !== "undefined") {
            if (console.warn) {
                console.warn(error);
                return;
            }
            if (console.log) {
                console.log(error);
                return;
            }
        }
        throw error;
    };
    var __creator = function(o, proto) {
        o = o !== Object(o) ? {} : o;
        if (o.__proto__) {
            o.__proto__ = proto;
            return o;
        }
        var empty = function() {};
        var n = Object.create ? Object.create(proto) : new (empty.prototype = proto, empty)();
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                n[i] = o[i];
            }
        }
        return n;
    };
    juicer.__cache = {};
    juicer.version = "0.6.5-stable";
    juicer.settings = {};
    juicer.tags = {
        operationOpen: "{@",
        operationClose: "}",
        interpolateOpen: "\\${",
        interpolateClose: "}",
        noneencodeOpen: "\\$\\${",
        noneencodeClose: "}",
        commentOpen: "\\{#",
        commentClose: "\\}"
    };
    juicer.options = {
        cache: true,
        strip: true,
        errorhandling: true,
        detection: true,
        _method: __creator({
            __escapehtml: __escapehtml,
            __throw: __throw,
            __juicer: juicer
        }, {})
    };
    juicer.tagInit = function() {
        var forstart = juicer.tags.operationOpen + "each\\s*([^}]*?)\\s*as\\s*(\\w*?)\\s*(,\\s*\\w*?)?" + juicer.tags.operationClose;
        var forend = juicer.tags.operationOpen + "\\/each" + juicer.tags.operationClose;
        var ifstart = juicer.tags.operationOpen + "if\\s*([^}]*?)" + juicer.tags.operationClose;
        var ifend = juicer.tags.operationOpen + "\\/if" + juicer.tags.operationClose;
        var elsestart = juicer.tags.operationOpen + "else" + juicer.tags.operationClose;
        var elseifstart = juicer.tags.operationOpen + "else if\\s*([^}]*?)" + juicer.tags.operationClose;
        var interpolate = juicer.tags.interpolateOpen + "([\\s\\S]+?)" + juicer.tags.interpolateClose;
        var noneencode = juicer.tags.noneencodeOpen + "([\\s\\S]+?)" + juicer.tags.noneencodeClose;
        var inlinecomment = juicer.tags.commentOpen + "[^}]*?" + juicer.tags.commentClose;
        var rangestart = juicer.tags.operationOpen + "each\\s*(\\w*?)\\s*in\\s*range\\(([^}]+?)\\s*,\\s*([^}]+?)\\)" + juicer.tags.operationClose;
        var include = juicer.tags.operationOpen + "include\\s*([^}]*?)\\s*,\\s*([^}]*?)" + juicer.tags.operationClose;
        juicer.settings.forstart = new RegExp(forstart, "igm");
        juicer.settings.forend = new RegExp(forend, "igm");
        juicer.settings.ifstart = new RegExp(ifstart, "igm");
        juicer.settings.ifend = new RegExp(ifend, "igm");
        juicer.settings.elsestart = new RegExp(elsestart, "igm");
        juicer.settings.elseifstart = new RegExp(elseifstart, "igm");
        juicer.settings.interpolate = new RegExp(interpolate, "igm");
        juicer.settings.noneencode = new RegExp(noneencode, "igm");
        juicer.settings.inlinecomment = new RegExp(inlinecomment, "igm");
        juicer.settings.rangestart = new RegExp(rangestart, "igm");
        juicer.settings.include = new RegExp(include, "igm");
    };
    juicer.tagInit();
    // Using this method to set the options by given conf-name and conf-value,
    // you can also provide more than one key-value pair wrapped by an object.
    // this interface also used to custom the template tag delimater, for this
    // situation, the conf-name must begin with tag::, for example: juicer.set
    // ('tag::operationOpen', '{@').
    juicer.set = function(conf, value) {
        var that = this;
        var escapePattern = function(v) {
            return v.replace(/[\$\(\)\[\]\+\^\{\}\?\*\|\.]/gim, function($) {
                return "\\" + $;
            });
        };
        var set = function(conf, value) {
            var tag = conf.match(/^tag::(.*)$/i);
            if (tag) {
                that.tags[tag[1]] = escapePattern(value);
                that.tagInit();
                return;
            }
            that.options[conf] = value;
        };
        if (arguments.length === 2) {
            set(conf, value);
            return;
        }
        if (conf === Object(conf)) {
            for (var i in conf) {
                if (conf.hasOwnProperty(i)) {
                    set(i, conf[i]);
                }
            }
        }
    };
    // Before you're using custom functions in your template like ${name | fnName},
    // you need to register this fn by juicer.register('fnName', fn).
    juicer.register = function(fname, fn) {
        var _method = this.options._method;
        if (_method.hasOwnProperty(fname)) {
            return false;
        }
        return _method[fname] = fn;
    };
    // remove the registered function in the memory by the provided function name.
    // for example: juicer.unregister('fnName').
    juicer.unregister = function(fname) {
        var _method = this.options._method;
        if (_method.hasOwnProperty(fname)) {
            return delete _method[fname];
        }
    };
    juicer.template = function(options) {
        var that = this;
        this.options = options;
        this.__interpolate = function(_name, _escape, options) {
            var _define = _name.split("|"), _fn = _define[0] || "", _cluster;
            if (_define.length > 1) {
                _name = _define.shift();
                _cluster = _define.shift().split(",");
                _fn = "_method." + _cluster.shift() + ".call({}, " + [ _name ].concat(_cluster) + ")";
            }
            return "<%= " + (_escape ? "_method.__escapehtml.escaping" : "") + "(" + (!options || options.detection !== false ? "_method.__escapehtml.detection" : "") + "(" + _fn + ")" + ")" + " %>";
        };
        this.__removeShell = function(tpl, options) {
            var _counter = 0;
            tpl = tpl.replace(juicer.settings.forstart, function($, _name, alias, key) {
                var alias = alias || "value", key = key && key.substr(1);
                var _iterate = "i" + _counter++;
                return "<% ~function() {" + "for(var " + _iterate + " in " + _name + ") {" + "if(" + _name + ".hasOwnProperty(" + _iterate + ")) {" + "var " + alias + "=" + _name + "[" + _iterate + "];" + (key ? "var " + key + "=" + _iterate + ";" : "") + " %>";
            }).replace(juicer.settings.forend, "<% }}}(); %>").replace(juicer.settings.ifstart, function($, condition) {
                return "<% if(" + condition + ") { %>";
            }).replace(juicer.settings.ifend, "<% } %>").replace(juicer.settings.elsestart, function($) {
                return "<% } else { %>";
            }).replace(juicer.settings.elseifstart, function($, condition) {
                return "<% } else if(" + condition + ") { %>";
            }).replace(juicer.settings.noneencode, function($, _name) {
                return that.__interpolate(_name, false, options);
            }).replace(juicer.settings.interpolate, function($, _name) {
                return that.__interpolate(_name, true, options);
            }).replace(juicer.settings.inlinecomment, "").replace(juicer.settings.rangestart, function($, _name, start, end) {
                var _iterate = "j" + _counter++;
                return "<% ~function() {" + "for(var " + _iterate + "=" + start + ";" + _iterate + "<" + end + ";" + _iterate + "++) {{" + "var " + _name + "=" + _iterate + ";" + " %>";
            }).replace(juicer.settings.include, function($, tpl, data) {
                return "<%= _method.__juicer(" + tpl + ", " + data + "); %>";
            });
            // exception handling
            if (!options || options.errorhandling !== false) {
                tpl = "<% try { %>" + tpl;
                tpl += '<% } catch(e) {_method.__throw("Juicer Render Exception: "+e.message);} %>';
            }
            return tpl;
        };
        this.__toNative = function(tpl, options) {
            return this.__convert(tpl, !options || options.strip);
        };
        this.__lexicalAnalyze = function(tpl) {
            var buffer = [];
            var method = [];
            var prefix = "";
            var reserved = [ "if", "each", "_", "_method", "console", "break", "case", "catch", "continue", "debugger", "default", "delete", "do", "finally", "for", "function", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "null", "typeof", "class", "enum", "export", "extends", "import", "super", "implements", "interface", "let", "package", "private", "protected", "public", "static", "yield", "const", "arguments", "true", "false", "undefined", "NaN" ];
            var indexOf = function(array, item) {
                if (Array.prototype.indexOf && array.indexOf === Array.prototype.indexOf) {
                    return array.indexOf(item);
                }
                for (var i = 0; i < array.length; i++) {
                    if (array[i] === item) return i;
                }
                return -1;
            };
            var variableAnalyze = function($, statement) {
                statement = statement.match(/\w+/gim)[0];
                if (indexOf(buffer, statement) === -1 && indexOf(reserved, statement) === -1 && indexOf(method, statement) === -1) {
                    // avoid re-declare native function, if not do this, template 
                    // `{@if encodeURIComponent(name)}` could be throw undefined.
                    if (typeof window !== "undefined" && typeof window[statement] === "function" && window[statement].toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
                        return $;
                    }
                    // compatible for node.js
                    if (typeof global !== "undefined" && typeof global[statement] === "function" && global[statement].toString().match(/^\s*?function \w+\(\) \{\s*?\[native code\]\s*?\}\s*?$/i)) {
                        return $;
                    }
                    // avoid re-declare registered function, if not do this, template 
                    // `{@if registered_func(name)}` could be throw undefined.
                    if (typeof juicer.options._method[statement] === "function" || juicer.options._method.hasOwnProperty(statement)) {
                        method.push(statement);
                        return $;
                    }
                    buffer.push(statement);
                }
                return $;
            };
            tpl.replace(juicer.settings.forstart, variableAnalyze).replace(juicer.settings.interpolate, variableAnalyze).replace(juicer.settings.ifstart, variableAnalyze).replace(juicer.settings.elseifstart, variableAnalyze).replace(juicer.settings.include, variableAnalyze).replace(/[\+\-\*\/%!\?\|\^&~<>=,\(\)\[\]]\s*([A-Za-z_]+)/gim, variableAnalyze);
            for (var i = 0; i < buffer.length; i++) {
                prefix += "var " + buffer[i] + "=_." + buffer[i] + ";";
            }
            for (var i = 0; i < method.length; i++) {
                prefix += "var " + method[i] + "=_method." + method[i] + ";";
            }
            return "<% " + prefix + " %>";
        };
        this.__convert = function(tpl, strip) {
            var buffer = [].join("");
            buffer += "'use strict';";
            // use strict mode
            buffer += "var _=_||{};";
            buffer += "var _out='';_out+='";
            if (strip !== false) {
                buffer += tpl.replace(/\\/g, "\\\\").replace(/[\r\t\n]/g, " ").replace(/'(?=[^%]*%>)/g, "	").split("'").join("\\'").split("	").join("'").replace(/<%=(.+?)%>/g, "';_out+=$1;_out+='").split("<%").join("';").split("%>").join("_out+='") + "';return _out;";
                return buffer;
            }
            buffer += tpl.replace(/\\/g, "\\\\").replace(/[\r]/g, "\\r").replace(/[\t]/g, "\\t").replace(/[\n]/g, "\\n").replace(/'(?=[^%]*%>)/g, "	").split("'").join("\\'").split("	").join("'").replace(/<%=(.+?)%>/g, "';_out+=$1;_out+='").split("<%").join("';").split("%>").join("_out+='") + "';return _out.replace(/[\\r\\n]\\s+[\\r\\n]/g, '\\r\\n');";
            return buffer;
        };
        this.parse = function(tpl, options) {
            var _that = this;
            if (!options || options.loose !== false) {
                tpl = this.__lexicalAnalyze(tpl) + tpl;
            }
            tpl = this.__removeShell(tpl, options);
            tpl = this.__toNative(tpl, options);
            this._render = new Function("_, _method", tpl);
            this.render = function(_, _method) {
                if (!_method || _method !== that.options._method) {
                    _method = __creator(_method, that.options._method);
                }
                return _that._render.call(this, _, _method);
            };
            return this;
        };
    };
    juicer.compile = function(tpl, options) {
        if (!options || options !== this.options) {
            options = __creator(options, this.options);
        }
        try {
            var engine = this.__cache[tpl] ? this.__cache[tpl] : new this.template(this.options).parse(tpl, options);
            if (!options || options.cache !== false) {
                this.__cache[tpl] = engine;
            }
            return engine;
        } catch (e) {
            __throw("Juicer Compile Exception: " + e.message);
            return {
                render: function() {}
            };
        }
    };
    juicer.to_html = function(tpl, data, options) {
        if (!options || options !== this.options) {
            options = __creator(options, this.options);
        }
        return this.compile(tpl, options).render(data, options._method);
    };
    typeof module !== "undefined" && module.exports ? module.exports = juicer : this.juicer = juicer;
});
