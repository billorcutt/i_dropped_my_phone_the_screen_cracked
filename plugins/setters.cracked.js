/**
 *
 * [See more control examples](examples/control.html)
 *
 * Frequency setter convenience method
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#frequency
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @function
 * @category Setters
 * @memberof cracked
 * @name cracked#detune
 * @public
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
 * Type setter convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#type
 * @public
 * @param {String} userParam oscillator type to set
 */
cracked.type = function (userParam) {
    if (__.isStr(userParam)) {
        cracked.attr({
            "type": userParam
        });
    }
    return cracked;
};

/**
 * Gain setter convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#volume
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#time
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#feedback
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#speed
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#drive
 * @public
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
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#distortion
 * @public
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
 * q setter convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#q
 * @public
 * @param {Number} userParam q value to set
 */
cracked.q = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "q": userParam
        });
    }
    return cracked;
};

/**
 * pan setter convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#pan
 * @public
 * @param {Number} userParam pan value (1 to -1) to set
 */
cracked.pan = function (userParam) {
    if (__.isNum(userParam)) {
        cracked.attr({
            "pan": userParam
        });
    }
    return cracked;
};