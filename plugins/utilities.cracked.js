/**
 * Convenient way to say start everything
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#play
 * @public
 */
cracked.play = function () {
    cracked("*").start();
    return cracked;
};

/**
 * Scale an input number between min & max to an output number between a min & max. Supports logarithmic or linear scaling.
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#scale
 * @public
 * @param {Number} position
 * @param {Number} inMin
 * @param {Number} inMax
 * @param {Number} outMin
 * @param {Number} outMax
 * @param {String} type
 */
cracked.scale = function(position, inMin, inMax, outMin, outMax, type) {
    if(type === "log" || type === "logarithmic") {
        var minVal = Math.log(outMin || 1);
        var maxVal = Math.log(outMax || 1);
        // calculate adjustment factor
        var scale = (maxVal-minVal) / (inMax-inMin);
        return Math.exp(minVal + scale*(position-inMin));
    } else if(type === "linear"|| typeof type === "undefined") {
        var result = parseFloat((((position - inMin) * (outMax - outMin)) / (inMax - inMin))  + outMin);
        return result.toFixed(2);
    } else {
        console.error("scale: type "+type+" not supported.");
        return position;
    }
};

/**
 * Converts a second value to millisecond value
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#sec2ms
 * @public
 * @param {Number} second
 */
cracked.sec2ms = function(second) {
    if(__.isNum(second)) {
        return second * 1000;
    } else {
        console.error("sec2ms: param not number");
        return second;
    }
};

/**
 * Converts a millisecond value to second value
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#ms2sec
 * @public
 * @param {Number} ms
 */
cracked.ms2sec = function(ms) {
    if(__.isNum(ms)) {
        return ms / 1000;
    } else {
        console.error("ms2sec: param not number");
        return ms;
    }
};

/**
 * Returns a boolean true if the browser supports
 * web audio
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#isSupported
 * @public
 */
cracked.isSupported = function() {
    return ("AudioContext" in window || "webkitAudioContext" in window);
};

//from https://github.com/hoch/WAAX/blob/master/src/core/Helper.js
/**
 * Converts a pitch value to frequency
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#pitch2freq
 * @public
 * @param {Number} pitch
 */
cracked.pitch2freq = function (pitch) {
    return 440.0 * Math.pow(2, ((Math.floor(pitch) - 69) / 12));
};
