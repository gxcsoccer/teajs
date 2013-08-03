/**
 * @author XIAOCHEN GAO
 */
seajs.use('core/util/Utils', function(Utils) {
	describe("Utility Test Suite", function() {
		beforeEach(function() {
			jasmine.Clock.useMock();
		});

		describe("Utils.later", function() {
			it("should execute a function later", function() {
				var val = 0,
					fn = function() {
						val = 1;
					},
					laterFn = Utils.later(fn, 100);

				laterFn();
				expect(val).toEqual(0);
				jasmine.Clock.tick(100);
				expect(val).toEqual(1);
			});

			it("should be able to limit execution of function", function() {
				var val = 0,
					fn = function(v) {
						val = v;
					},
					bufferFn = Utils.buffer(fn, 100);

				bufferFn(1);
				expect(val).toEqual(0);
				bufferFn(2);
				expect(val).toEqual(0);
				bufferFn(3);
				expect(val).toEqual(0);
				jasmine.Clock.tick(100);
				expect(val).toEqual(3);
			});
		});
	});
});