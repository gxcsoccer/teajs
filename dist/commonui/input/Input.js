define("commonui/input/Input", [ "./ui-input.css", "../../core/class/Class", "../../core/event/EventEmitter" ], function(require, exports, module) {
    "use strict";
    require("./ui-input.css");
    var Class = require("../../core/class/Class"), EventEmitter = require("../../core/event/EventEmitter");
    return Class.extend({
        init: function(option) {
            this.$el = option.$el;
            this.$el.addClass("ui-input");
            this.input = this.$el[0];
            this.input.type = option.type || "text";
            this.input.placeholder = option.placeholder || "";
            this.input.value = option.text || "";
            this.__defineGetter__("text", function() {
                return this.input.value;
            });
            this.__defineSetter__("text", function(val) {
                this.input.value = val;
            });
            this.__defineGetter__("caretOffset", function() {
                return this.input.selectionStart != null ? this.input.selectionStart : this.text.length;
            });
            this.__defineSetter__("caretOffset", function(val) {
                if (val < 0) {
                    val = 0;
                }
                if (val > this.text.length) {
                    val = this.text.length;
                }
                this.input.blur();
                this.input.focus();
                this.input.setSelectionRange(val, val);
            });
        },
        active: function() {
            this.caretOffset = this.text.length;
            this.$el.addClass("ui-input-active");
        },
        deactive: function() {
            this.input.blur();
            this.$el.removeClass("ui-input-active");
        },
        inputChar: function(char) {
            var offset = this.caretOffset;
            this.text = this.text.substring(0, offset) + char + this.text.substring(offset);
            this.caretOffset = offset + 1;
        },
        deleteChar: function() {
            var offset = this.caretOffset;
            this.text = this.text.substring(0, offset - 1) + this.text.substring(offset);
            this.caretOffset = offset - 1;
        },
        moveLeft: function() {
            this.caretOffset--;
        },
        moveRight: function() {
            this.caretOffset++;
        }
    });
});