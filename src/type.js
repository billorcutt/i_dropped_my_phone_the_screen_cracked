/**
 * Returns a random number between min & max
 * @plugin
 * @param {*} test thing to test for undefined
 * @param {*} def default value to return if test is undefined
 */
cracked.ifUndef = function(test, def) {
    return typeof test === "undefined" ? def : test;
};

/**
 * Returns true if not undefined
 * @plugin
 * @param {*} test thing to test for undefined
 */
cracked.isNotUndef = function(test) {
    return typeof test !== "undefined";
};

/**
 * Returns true if undefined
 * @plugin
 * @param {*} test thing to test for undefined
 */
cracked.isUndef = function(test) {
    return typeof test === "undefined";
};

/**
 * Returns true if param is an object
 * @plugin
 * @param {*} obj thing to test
 */
cracked.isObj = function(obj) {
    return obj && typeof obj === "object";
};

/**
 * Returns true if param is a number
 * @plugin
 * @param {*} num thing to test
 */
cracked.isNum = function(num) {
    if (num === null || num === "") {
        return false;
    } else {
        return !isNaN(num);
    }
};

/**
 * Returns true if param is a string
 * @plugin
 * @param {*} str thing to test
 */
cracked.isStr = function(str) {
    return str && typeof str === "string";
};

/**
 * Returns true if param is an array
 * @plugin
 * @param {*} arr thing to test
 */
cracked.isArr = function(arr) {
    return arr && arr instanceof Array;
};

/**
 * Returns true if param is a function
 * @plugin
 * @param {*} fn thing to test
 */
cracked.isFun = function(fn) {
    return fn && fn instanceof Function;
};