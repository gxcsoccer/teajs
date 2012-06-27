/**
 * @author XIAOCHEN GAO
 */
seajs.use('src/util/Utils', function(Utils) {
	describe("Utility Test Suite", function() {
		describe("Utils.isString", function() {
			it("isString return true if input argument is a string", function() {
				expect(Utils.isString("xyz")).toEqual(true);
			});

			it("isString return false if input argument is a number", function() {
				expect(Utils.isString(123)).toEqual(false);
			});

			it("isString return false if input argument is a object", function() {
				expect(Utils.isString({})).toEqual(false);
			});
		});
	});
});
