/**
 * @author XIAOCHEN GAO
 */
seajs.use(["core/class/Class"], function(Class) {
	describe("Class Test Suite", function() {
		beforeEach(function() {
			this.addMatchers({
				toBeInstanceOf : function(cls) {
					return this.actual instanceof cls
				}
			});
		});

		it("to create new class", function() {
			var cls = Class.extend({
				foo : 'bar',
				xyz : function() {
					return true;
				}
			});

			expect($.isFunction(cls)).toEqual(true);
			var obj = new cls();
			expect(obj.foo).toBe('bar');
			expect(obj.xyz).toBeDefined();
			expect(obj.xyz()).toBe(true);
		});
		it("to create a new class through constructor", function() {
			var cls = Class(function() {
				this.foo = 'bar';
			});
			expect($.isFunction(cls)).toEqual(true);
			var obj = new cls();
			expect(obj.foo).toBe('bar');
		});

		it("class Sub inherited from Super, should copy father's props", function() {
			var Super = Class.extend({
				name : 'father',
				getName : function() {
					return this.name;
				}
			});

			var Sub = Super.extend();
			var instance = new Sub();
			expect(instance.name).toBeDefined();
			expect(instance.name).toBe('father');
			expect(instance.getName()).toBe('father');
		});

		it("class Sub implement class Super, should copy father's props", function() {
			var Super = Class.extend({
				name : 'father',
				getName : function() {
					return this.name;
				}
			});

			var Sub = Class.extend({
				id : 1,
				getId : function() {
					return this.id;
				}
			}).implement(Super);
			var instance = new Sub();
			expect(instance.name).toBeDefined();
			expect(instance.name).toBe('father');
			expect(instance.getName()).toBe('father');
			expect(instance.id).toBe(1);
			expect(instance.getId()).toBe(1);
		});

		it("we inverse the order of implement and extend, the result should be same", function() {
			var Super = Class.extend({
				name : 'father',
				getName : function() {
					return this.name;
				}
			});

			var Sub = Class.implement(Super).extend({
				id : 1,
				getId : function() {
					return this.id;
				}
			});
			var instance = new Sub();
			expect(instance.name).toBeDefined();
			expect(instance.name).toBe('father');
			expect(instance.getName()).toBe('father');
			expect(instance.id).toBe(1);
			expect(instance.getId()).toBe(1);
		});

		it("Sub class can overwrite the props from their Super class", function() {
			var Super = Class.extend({
				name : 'father',
				getName : function() {
					return this.name;
				}
			});

			var Sub = Super.extend({
				name : 'child'
			});
			var instance = new Sub();
			expect(instance.name).toBe('child');
			expect(instance.getName()).toBe('child');
		});

		it("The props should be private, and should not share with other child", function() {
			var Father = Class.extend({
				id : 1
			});

			var ChildA = Father.extend();
			var ChildB = Father.extend();

			var instA = new ChildA();
			var instB = new ChildB();

			expect(instA.id).toBe(1);
			expect(instB.id).toBe(1);

			instA.id = 2;

			expect(instA.id).toBe(2);
			expect(instB.id).toBe(1);
		});

		it("Support mult-inherit through implement method", function() {
			var Flyable = Class.extend({
				fly : function() {
					return true;
				}
			});

			var Fightable = Class.extend({
				fight : function() {
					return true;
				}
			});

			var DragonClass = Class.implement([Flyable, Fightable]);
			var dragon = new DragonClass();
			expect(dragon.fly).toBeDefined();
			expect(dragon.fly()).toBe(true);
			expect(dragon.fight).toBeDefined();
			expect(dragon.fight()).toBe(true);
		});

		it("Support attach static props to Class", function() {
			var ClassA = Class.extend({
				init : function() {
					this.name = 'ClassA';
				}
			}).statics({
				get : function() {
					return new ClassA();
				}
			});

			expect(ClassA.get).toBeDefined();
			expect(ClassA.get()).toBeInstanceOf(ClassA);
			expect(ClassA.get().name).toBe('ClassA');
		});
	});
});
