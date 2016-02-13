/**
 * System out - destination with a master volume
 * @plugin
 * @param {Number} [params=1] system out gain
 */
cracked.dac = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.mapping = userParams.mapping || {};
    __.begin("dac", userParams).gain(gain).destination().end("dac");
    return cracked;
};

/**
 * System in - input with a master volume
 * @plugin
 * @param {Number} [params=1] system in gain
 */
cracked.adc = function (params) {
    var gain = __.isNum(params) ? params : 1;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.mapping = userParams.mapping || {};
    __.begin("adc", userParams).origin().gain(gain).end("adc");
    return cracked;
};

/**
 * Panner - simple stereo panner
 *
 * @plugin
 * @param {Object} [params] map of optional values
 */
cracked.panner = function (params) {
    var pan = __.isNum(params) ? params : (__.isObj(params) && params.pan) ? params.pan : 0;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.mapping = userParams.mapping || {};
    __.begin("panner", userParams).stereoPanner({'pan':pan}).end("panner");
    return cracked;
};

/**
 * Sampler - sound file player
 *
 * [See more sampler examples](../../examples/sampler.html)
 *
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.speed=1]
 * @param {Number} [userParams.start=1]
 * @param {Number} [userParams.end=1]
 * @param {Boolean} [userParams.loop=false]
 */
cracked.sampler = function (userParams) {
    //sampler only plays sound files not data from functions
    if (userParams && userParams.path) {
        __.begin("sampler", userParams).buffer(userParams).end("sampler");
    }
    return cracked;
};