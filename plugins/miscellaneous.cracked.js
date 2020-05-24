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
 * System multi_out - destination with a master volume w/ multi-channel support
 * @plugin
 * @category Miscellaneous
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.gain=1]
 * @param {Number} [userParams.channel=1]
 * @function
 * @memberof cracked
 * @name cracked#multi_out
 * @public
 */
cracked.multi_out = function (params) {
    var to_channel = __.isNum(params) ? params : __.isObj(params) && params.channel ?  params.channel : 0;
    var userParams = __.isObj(params) ? params : {};
    var gain = userParams.gain ? userParams.gain : 1;
    userParams.mapping = userParams.mapping || {};
    __.begin("multi_out", userParams).gain({from_channel:0,to_channel:to_channel,gain:gain}).channelMerger().destination().end("multi_out");
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

///**
// * Splitter - channel splitter
// *
// * @plugin
// * @category Miscellaneous
// * @param {Object} [params] map of optional values
// * @function
// * @memberof cracked
// * @name cracked#splitter
// * @public
// */
//cracked.splitter = function (params) {
//    var channels = __.isNum(params) ? params : (__.isObj(params) && params.channels) ? params.channels : 2;
//    var userParams = __.isObj(params) ? params : {channels:channels};
//    userParams.mapping = userParams.mapping || {};
//    __.begin("splitter", userParams).channelSplitter(userParams).end("splitter");
//    return cracked;
//};

///**
// * Merger - channel merger
// *
// * @plugin
// * @category Miscellaneous
// * @param {Object} [params] map of optional values
// * @function
// * @memberof cracked
// * @name cracked#merger
// * @public
// */
//cracked.merger = function (params) {
//    var userParams = __.isObj(params) ? params : {};
//    userParams.mapping = userParams.mapping || {};
//    __.begin("merger", userParams).channelMerger(userParams).end("merger");
//    return cracked;
//};

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

//Sequence

/*
 __.sequence("foo").step(function(){console.log("this step got called")},1).step(function(){console.log("this step 2 got called")},2);
 __.sequence("foo").start();
 */

//this should be private
cracked.__sequence_storage = {};

/**
 * Sampler - sound file player
 *
 * [See more sampler examples](examples/sampler.html)
 *
 * @plugin
 * @category Miscellaneous
 * @function
 * @memberof cracked
 * @name cracked#sequence
 * @public
 * @param {String} name name of sequence
 */
cracked.sequence = function(name) {

    if(!cracked.__sequence_storage[name]) {
        cracked.__sequence_storage[name]={
            steps:{}
        };
    }

    return (function(name){
        return {
            step:function(func,time){
                cracked.__sequence_storage[name].steps[time.toString()]=func;
                return this;
            },
            start:function(){
                cracked.__sequence_storage[name].startTime = Date.now();
                cracked.__sequence_storage[name].clearInterval=setInterval(function(){
                    var time_elapsed = Date.now() - cracked.__sequence_storage[name].startTime;
                    var steps = Object.keys(cracked.__sequence_storage[name].steps);
                    if(steps.length) {
                        steps.map(function(x){
                            if(Math.floor(time_elapsed/60000) >= x) {
                                cracked.__sequence_storage[name].steps[x]();
                                delete cracked.__sequence_storage[name].steps[x]
                            }
                        });
                    } else {
                        clearInterval(cracked.__sequence_storage[name].clearInterval);
                    }
                },1000);
            },
            stop:function(){
                clearInterval(cracked.__sequence_storage[name].clearInterval);
            }
        };
    })(name);
};