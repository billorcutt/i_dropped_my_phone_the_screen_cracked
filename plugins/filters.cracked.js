/**
 * Lowpass Filter
 *
 * [See more lowpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#lowpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.lowpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "lowpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("lowpass", userParams).biquadFilter(options).end("lowpass");

    return cracked;
};
/**
 * Highpass Filter
 *
 * [See more highpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#highpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.highpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "highpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("highpass", userParams).biquadFilter(options).end("highpass");

    return cracked;
};
/**
 * Bandpass Filter
 *
 * [See more bandpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#bandpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.bandpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "bandpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("bandpass", userParams).biquadFilter(options).end("bandpass");

    return cracked;
};
/**
 * Lowshelf Filter
 *
 * [See more lowshelf examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#lowshelf
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.lowshelf = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "lowshelf";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.gain = __.ifUndef(userParams.gain, 0);
    options.mapping = userParams.mapping || {};

    __.begin("lowshelf", userParams).biquadFilter(options).end("lowshelf");

    return cracked;
};
/**
 * Highshelf Filter
 *
 * [See more highshelf examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#highshelf
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.highshelf = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "highshelf";
    options.frequency = userParams.frequency || freq;
    options.gain = __.ifUndef(userParams.gain, 0);
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("highshelf", userParams).biquadFilter(options).end("highshelf");

    return cracked;
};
/**
 * Peaking Filter
 *
 * [See more peaking examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#peaking
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.peaking = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "peaking";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.gain = __.ifUndef(userParams.gain, 0);
    options.mapping = userParams.mapping || {};

    __.begin("peaking", userParams).biquadFilter(options).end("peaking");

    return cracked;
};
/**
 * Notch Filter
 *
 * [See more notch examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#notch
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.notch = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "notch";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 10);
    options.mapping = userParams.mapping || {};

    __.begin("notch", userParams).biquadFilter(options).end("notch");

    return cracked;
};
/**
 * Allpass Filter
 *
 * [See more allpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#allpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.allpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "allpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 10);
    options.mapping = userParams.mapping || {};

    __.begin("allpass", userParams).biquadFilter(options).end("allpass");

    return cracked;
};