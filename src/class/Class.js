/**
 * @author XIAOCHEN GAO
 */
define(function(require, exports, module) {
	var Utils = require('src/util/Utils');

	function Class(o) {
		if(Utils.isFunction(o)) {
			return classify(o);
		}

		//we are being called w/o new
		if(!(this instanceof Class) && arguments.length) {
			return Class.extend.apply(Class, arguments);
		}
	}

	function classify(cls) {
		cls.extend = Class.extend;
		cls.implement = Class.implement;
		cls.statics = Class.statics;
		return cls;
	}

	// Shared empty constructor function to aid in prototype-chain creation.
	function Ctor() {
	}

	// See: http://jsperf.com/object-create-vs-new-ctor
	var createProto = Object.__proto__ ? function(proto) {
		return {
			__proto__ : proto
		};
	} : function(proto) {
		Ctor.prototype = proto;
		return new Ctor();
	};

	// tests if we can get super in .toString()
	fnTest = /peter/.test(function() { peter;
	}) ? /\b_super\b/ : /.*/,

	// overwrites an object with methods, sets up _super
	inheritProps = function(newProps, oldProps, addTo) {
		addTo = addTo || newProps
		for(var name in newProps ) {
			// Check if we're overwriting an existing function
			addTo[name] = typeof newProps[name] == "function" && typeof oldProps[name] == "function" && fnTest.test(newProps[name]) ? (function(name, fn) {
				return function() {
					var tmp = this._super, ret;

					// Add a new ._super() method that is the same method
					// but on the super-class
					this._super = oldProps[name];

					// The method only need to be bound temporarily, so we
					// remove it when we're done executing
					ret = fn.apply(this, arguments);
					this._super = tmp;
					return ret;
				};
			})(name, newProps[name]) : newProps[name];
		}
	};

	Class.extend = function(proto) {
		proto = proto || {};
		var _super = this.prototype;
		var prototype = createProto(_super);

		// Copy the properties over onto the new prototype
		inheritProps(proto, _super, prototype);

		function SubClass() {
			if(this.constructor === SubClass && this.init) {
				this.init.apply(this, arguments);
			}
		}


		prototype.constructor = SubClass;
		SubClass.prototype = prototype;

		return classify(SubClass);
	};

	Class.implement = function(items) {
		Utils.isArray(items) || ( items = [items]);
		var proto = this.prototype, item;

		while( item = items.shift()) {
			Utils.mix(proto, item.prototype || item);
		}

		return this;
	};

	Class.statics = function(staticProperties) {
		Utils.mix(this, staticProperties);

		return this;
	};

	return Class;
});
