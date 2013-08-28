define("customize/app", [ "css/test.css", "widget/WaterfallWidget", "commonui/waterfall/Waterfall", "core/view/View", "core/event/EventEmitter", "juicer" ], function(require, exports, module) {
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