/**
 * Returns the 2nd argument if the 1st is undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#ifUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 * @param {*} def default value to return if test is undefined
 */
cracked.ifUndef = function(test, def) {
    return typeof test === "undefined" ? def : test;
};

/**
 * Returns true if not undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#isNotUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 */
cracked.isNotUndef = function(test) {
    return typeof test !== "undefined";
};

/**
 * Returns true if undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#isUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 */
cracked.isUndef = function(test) {
    return typeof test === "undefined";
};

/**
 * Returns true if param is an object
 * @plugin
 * @category Type
 * @function
 * @name cracked#isObj
 * @memberof cracked
 * @param {*} obj thing to test
 */
cracked.isObj = function(obj) {
    return obj && typeof obj === "object";
};

/**
 * Returns true if param is a number
 * @plugin
 * @category Type
 * @function
 * @name cracked#isNum
 * @memberof cracked
 * @param {*} num thing to test
 */
cracked.isNum = function(num) {
    if (num === null || num === "" || typeof num === "undefined") {
        return false;
    } else {
        return !isNaN(num);
    }
};

/**
 * Returns true if param is a string
 * @plugin
 * @category Type
 * @function
 * @name cracked#isStr
 * @memberof cracked
 * @param {*} str thing to test
 */
cracked.isStr = function(str) {
    return str && typeof str === "string";
};

/**
 * Returns true if param is an array
 * @plugin
 * @category Type
 * @function
 * @name cracked#isArr
 * @memberof cracked
 * @param {*} arr thing to test
 */
cracked.isArr = function(arr) {
    return arr && arr instanceof Array;
};

/**
 * Returns true if param is a function
 * @plugin
 * @category Type
 * @function
 * @name cracked#isFun
 * @memberof cracked
 * @param {*} fn thing to test
 */
cracked.isFun = function(fn) {
    return fn && fn instanceof Function;
};