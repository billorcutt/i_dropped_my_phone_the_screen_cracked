/**
 *
 * [See more control examples](../../examples/control.html)
 *
 * Frequency setter convenience method
 * @plugin
 * @param {Number} userParam frequency to set
 */
cracked.frequency = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "frequency": userParam
        });
    }
    return cracked;
};

/**
 * Detune setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam detune frequency to set
 */
cracked.detune = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "detune": userParam
        });
    }
    return cracked;
};

/**
 * Gain setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam gain to set
 */
cracked.volume = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "gain": userParam
        });
    }
    return cracked;
};

/**
 * Delay time setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam delay time to set
 */
cracked.time = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "delay": userParam
        });
    }
    return cracked;
};

/**
 * Feedback setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam feedback amount to set
 */
cracked.feedback = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "feedback": userParam
        });
    }
    return cracked;
};

/**
 * Speed setter convenience method
 *
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam sampler speed to set
 */
cracked.speed = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "speed": userParam
        });
    }
    return cracked;
};

/**
 * Drive setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam drive distortion/waveshaper/etc to set
 */
cracked.drive = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "drive": userParam
        });
    }
    return cracked;
};

/**
 * Distortion setter convenience method
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 * @param {Number} userParam distortion to set
 */
cracked.distortion = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "distortion": userParam
        });
    }
    return cracked;
};

/**
 * Convenient way to say start everything
 *
 * [See more control examples](../../examples/control.html)
 *
 * @plugin
 */
cracked.play = function () {
    cracked("*").start();
    return cracked;
};

/**
 * Returns a musical scale/mode based on type
 * @plugin
 * @param {String} type scale type
 */
cracked.scale = function (type) {
    return {
        "major": [0, 2, 4, 5, 7, 9, 11],
        "minor": [0, 2, 3, 5, 7, 8, 10]
    }[type];
};

//from https://github.com/hoch/WAAX/blob/master/src/core/Helper.js
/**
 * Converts a pitch value to frequency
 * @plugin
 * @param {Number} pitch
 */
cracked.pitch2freq = function (pitch) {
    return 440.0 * Math.pow(2, ((Math.floor(pitch) - 69) / 12));
};

/**
 * Takes a reference to an array, shuffles it
 * and returns it
 * @plugin
 * @param {Array} arr
 */
cracked.shuffle = function (arr) {
    var counter = arr.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

/**
 * Returns a random number between min & max
 * @plugin
 * @param {Number} min
 * @param {Number} max
 */
cracked.random = function (min, max) {
    return Math.round(min + Math.random() * (max - min));
};

/**
 * Returns a boolean true if the browser supports
 * web audio
 * @plugin
 */
cracked.isSupported = function() {
    return ("AudioContext" in window || "webkitAudioContext" in window);
};