/**
 * Low Frequency Oscillator
 *
 * [See more LFO examples](examples/modulation.html)
 *
 * @plugin
 * @category Modulator
 * @function
 * @memberof cracked
 * @name cracked#lfo
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.modulates=frequency]
 * @param {String} [userParams.type=saw]
 * @param {Number} [userParams.frequency=6]
 * @param {Number} [userParams.gain=1000]
 */
cracked.lfo = function (userParams) {
    var params = userParams || {};
    params.modulates = params.modulates || "frequency";

    if (params.type === "white" || params.type === "pink" || params.type === "brown") {
        __.
            begin("lfo", params).
            noise({
                "type": (params.type || "white"),
                "channels": 1,
                "length": (params.length || 1)
            }).
            gain({
                "gain": __.ifUndef(params.gain, 1000)
            }).
            end("lfo");
    } else {
        __.
            begin("lfo", params).
            osc({
                "type": (params.type || "sawtooth"),
                "frequency": (params.frequency || 6)
            }).
            gain({
                "gain": __.ifUndef(params.gain, 1000)
            }).
            end("lfo");
    }
    return cracked;
};

/**
 * Stepper
 *
 * fill an audio buffer with a series of discrete values.
 *
 * @plugin
 * @category Modulator
 * @function
 * @memberof cracked
 * @name cracked#stepper
 * @public
 * @param {Object} [params] map of optional values
 * @param {String} [params.modulates=frequency]
 * @param {Function} [params.fn=function to generate values (if not supplied, then random values between -1 & 1)]
 * @param {Number} [params.steps=number of steps in the buffer]
 * @param {Number} [params.length=length of the buffer in seconds]
 * @param {Number} [params.gain=1000]
 */
cracked.stepper = function (params) {
    var userParams = params || {};
    var length = userParams.length || 1;
    var steps = userParams.steps || 8;
    var fn = userParams.fn || function(){return (__.random(-100,100)/100);};
    userParams.modulates = params.modulates || "frequency";
    var step_size = length / steps;
    var bufferParams = {
        fn: buildBuffer,
        loop: true
    };

    var start_point = (userParams.start * step_size) || 0;
    var end_point = (userParams.end * step_size) || 0;

    if(start_point) {
        bufferParams.start = start_point;
    }

    if(end_point) {
        bufferParams.end = end_point;
    }

    __().begin("stepper", userParams).buffer(bufferParams).
    gain({
        "gain": __.ifUndef(params.gain, 1000)
    }).
    end("stepper");

    return cracked;

    function buildBuffer(audioContext) {
        var buffer = audioContext.createBuffer(1, (length * audioContext.sampleRate), audioContext.sampleRate);
        var buflen = buffer.length;
        var buffArr = [];
        var stepSize = Math.floor(buflen/steps);
        var stepCount = 0;
        var value = 0;

        buffArr.push(buffer.getChannelData(0)); //call only once and cache

        for (var i = 0; i < buflen; i++) {
            value = (!i || i % stepSize === 0 && stepCount < steps) ?  (function(){ stepCount++; return fn(); })() : value;
            buffArr[0][i] = value;
        }
        return buffer;
    }
};