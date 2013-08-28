/**
 * @author XIAOCHEN GAO
 */
define("core/util/Utils", [], function(require, exports, module) {
    "use strict";
    var seed = 0;
    return {
        later: function(fn, ms, context) {
            ms = ms || 0;
            context = context || null;
            var timer, wrapper = function() {
                var args = arguments;
                timer = setTimeout(function() {
                    fn.apply(context, args);
                }, ms);
            };
            wrapper.stop = function() {
                timer && clearTimeout(timer);
            };
            return wrapper;
        },
        buffer: function(fn, ms, context) {
            var wrapper = this.later(fn, ms, context);
            return function() {
                wrapper.stop();
                wrapper.apply(null, arguments);
            };
        },
        nextUid: function() {
            return seed++ + "";
        },
        timedChunk: function(items, processor, context) {
            var dtd = $.Deferred(), timer, todo;
            dtd.start = function() {
                todo = [].concat($.makeArray(items));
                if (todo.length == 0) {
                    return dtd.resolve();
                }
                function handler() {
                    var st = +new Date(), item;
                    do {
                        item = todo.shift();
                        processor.call(context, item);
                    } while (todo.length > 0 && +new Date() - st < 50);
                    if (todo.length > 0) {
                        timer = setTimeout(handler, 25);
                    } else {
                        dtd.resolve();
                    }
                }
                handler();
                return dtd;
            };
            dtd.stop = function() {
                if (timer) {
                    clearTimeout(timer);
                    todo = [];
                }
                dtd.reject();
                return dtd;
            };
            return dtd;
        }
    };
});