/**
 * Convolver Reverb
 *
 * [See more reverb examples](examples/delay.html)
 *
 * @plugin
 * @function
 * @category Delay
 * @memberof cracked
 * @name cracked#reverb
 * @param {Object} [params] map of optional values
 * @param {Boolean} [params.reverse=false] reverse reverb
 * @param {String} [params.path] path to impulse file. if no path, impulse is generated.
 * @param {Number} [params.seconds=3] if generated impulse, length in seconds.
 * @param {Number} [params.decay=2] if generated impulse, length of decay in seconds
 * @param {Function} [params.fn=buildImpulse] custom function to generate an impulse buffer
 */

cracked.reverb = function (params) {

    params = __.ifUndef(params, {});

    //if there's no path to an impulse
    //then generate our own
    if (!params.path) {
        params.fn = params.fn || buildImpulse;
    }

    //if building an impulse
    var _seconds = __.ifUndef(params.seconds, 3);
    var _reverse = __.ifUndef(params.reverse, false);
    var _decay = __.ifUndef(params.decay, 2);

    __.begin("reverb", params).convolver(params).end("reverb");

    //default method to generate an impules
    function buildImpulse(audioContext) {

        var rate = audioContext.sampleRate,
            length = rate * _seconds,
            decay = _decay,
            impulse = audioContext.createBuffer(2, length, rate),
            impulseL = impulse.getChannelData(0),
            impulseR = impulse.getChannelData(1),
            n, i;

        for (i = 0; i < length; i++) {
            n = _reverse ? length - i : i;
            impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
        }
        return impulse;
    }

    return cracked;

};


/**
 * Delay
 *
 * [See more delay examples](examples/delay.html)
 *
 * @plugin
 * @category Delay
 * @function
 * @memberof cracked
 * @name cracked#delay
 * @param {Object} [params] map of optional values
 * @param {Number} [params.delay=1] delay time in seconds
 * @param {Number} [params.damping=0.84] feedback input gain
 * @param {Number} [params.cutoff=1500] frequency of lowpass filtering on feedback loop
 * @param {Number} [params.feedback=0.5] feedback gain output
 */

cracked.delay = function (params) {

    params = __.ifUndef(params, {});
    var time = __.isObj(params) ? (__.ifUndef(params.delay, 1)) : params;

    __.begin("delay", params);

    __.gain({
        id: "delay-input"
    }).

        native_delay({
            id: "native-delay",
            delay: time,
            mapping: {
                "delay": "delayTime.value"
            }
        }).

        gain({
            id: "delay-damping",
            gain: __.ifUndef(params.damping, 0.84),
            mapping: {
                "damping": "gain.value"
            }
        }).

        lowpass({
            id: "delay-cutoff",
            frequency: __.ifUndef(params.cutoff, 1500),
            mapping: {
                "cutoff": "frequency.value"
            }
        }).

        gain({
            id: "delay-feedback",
            gain: __.ifUndef(params.feedback, 0.5),
            mapping: {
                "feedback": "gain.value"
            }
        }).

        gain({
            id: "delay-output"
        });

    __("#delay-feedback").connect("#delay-input");

    __("#native-delay").gain(0.5).connect("#delay-output");

    __.end("delay");

    return cracked;

};

/**
 * Comb
 *
 * [See more reverb examples](examples/delay.html)
 *
 * @plugin
 * @category Delay
 * @function
 * @memberof cracked
 * @name cracked#comb
 * @param {Object} [params] map of optional values
 * @param {Number} [params.delay=0.027] delay time in seconds
 * @param {Number} [params.damping=0.84] feedback input gain
 * @param {Number} [params.cutoff=3000] frequency of lowpass filtering on feedback loop
 * @param {Number} [params.feedback=0.84] feedback gain output
 */
cracked.comb = function (params) {
//adapted from https://github.com/web-audio-components
    var userParams = __.ifUndef(params, {});

    __.begin("comb", userParams);

    __.gain({
        id: "comb-input"
    }).
        native_delay({
            id: "comb-delay",
            delay: __.ifUndef(userParams.delay, 0.027),
            mapping: {
                "delay": "delayTime.value"
            }
        }).
        gain({
            id: "comb-damping",
            gain: __.ifUndef(userParams.damping, 0.84),
            mapping: {
                "damping": "gain.value"
            }
        }).
        lowpass({
            id: "comb-cutoff",
            frequency: __.ifUndef(userParams.cutoff, 3000),
            mapping: {
                "cutoff": "frequency.value"
            }
        }).
        gain({
            id: "comb-feedback",
            gain: __.ifUndef(userParams.feedback, 0.84),
            mapping: {
                "feedback": "gain.value"
            }
        }).
        connect("#comb-input");

    __("#comb-damping").
        gain({
            id: "output"
        });

    __.end("comb");

    return cracked;

};