/**
 * Clips audio level at 1/-1
 * @plugin
 * @category Miscellaneous
 * @function
 * @memberof cracked
 * @name cracked#clip
 * @public
 */
cracked.clip = function (params) {

    var userParams = __.isObj(params) ? params : {};
    userParams.mapping = userParams.mapping || {};

    var curve = new Float32Array(2);

    // Set some default clipping - just makes everything under -1 be -1, and everything over 1 be 1.
    curve[0] = -1;
    curve[1] = 1;

    __.begin("clip", userParams).waveshaper({curve: curve}).end("clip");
    return cracked;
};

/**
 * System out - destination with a master volume. Output is clipped if gain is 1 or less.
 * @plugin
 * @category Miscellaneous
 * @param {Number} [params=1] system out gain
 * @function
 * @memberof cracked
 * @name cracked#dac
 * @public
 */
cracked.dac = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    userParams.mapping = userParams.mapping || {};
    if(gain > 1) {
        __.begin("dac", userParams).gain(gain).destination().end("dac");
    } else {
        __.begin("dac", userParams).clip().gain(gain).destination().end("dac");
    }
    return cracked;
};

/**
 * System in - input with a master volume
 * @plugin
 * @category Miscellaneous
 * @param {Number} [params=1] system in gain
 * @function
 * @memberof cracked
 * @name cracked#adc
 * @public
 */
cracked.adc = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    userParams.mapping = userParams.mapping || {};
    __.begin("adc", userParams).origin().gain(gain).end("adc");
    return cracked;
};

/**
 * System out - destination with a master volume
 * Alias for dac
 * @plugin
 * @category Miscellaneous
 * @param {Number} [params=1] system out gain
 * @function
 * @memberof cracked
 * @name cracked#out
 * @public
 */
cracked.out = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    userParams.mapping = userParams.mapping || {};
    __.begin("out", userParams).gain(gain).destination().end("out");
    return cracked;
};

/**
 * System in - input with a master volume
 * Alias for adc
 * @plugin
 * @category Miscellaneous
 * @param {Number} [params=1] system in gain
 * @function
 * @memberof cracked
 * @name cracked#in
 * @public
 */
cracked.in = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    userParams.mapping = userParams.mapping || {};
    __.begin("in", userParams).origin().gain(gain).end("in");
    return cracked;
};

/**
 * Panner - simple stereo panner
 *
 * @plugin
 * @category Miscellaneous
 * @param {Object} [params] map of optional values
 * @function
 * @memberof cracked
 * @name cracked#panner
 * @public
 */
cracked.panner = function (params) {
    var pan = __.isNum(params) ? params : (__.isObj(params) && params.pan) ? params.pan : 0;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    userParams.mapping = userParams.mapping || {};
    __.begin("panner", userParams).stereoPanner({'pan':pan}).end("panner");
    return cracked;
};

/**
 * Sampler - sound file player
 *
 * [See more sampler examples](examples/sampler.html)
 *
 * @plugin
 * @category Miscellaneous
 * @function
 * @memberof cracked
 * @name cracked#sampler
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.speed=1]
 * @param {Number} [userParams.start=1]
 * @param {Number} [userParams.end=1]
 * @param {String} [userParams.path=''] path to sound file to play
 * @param {Boolean} [userParams.loop=false]
 */
cracked.sampler = function (userParams) {
    //sampler only plays sound files not data from functions
    if (userParams && userParams.path) {
        __.begin("sampler", userParams).buffer(userParams).end("sampler");
    }
    return cracked;
};
