/**
 * Low Frequency Oscillator
 *
 * [See more LFO examples](../../examples/modulation.html)
 *
 * @plugin
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
                "channels": (params.channels || 1),
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
 * fill an audio buffer with a series of values
 *
 * @plugin
 * @param {Object} [params] map of optional values
 */
cracked.stepper = function (params) {
    var userParams = params || {};
    var channels = userParams.channels || 1;
    var length = userParams.length || 1;
    var steps = userParams.steps || 8;
    var fn = userParams.fn || function(){return (__.random(-100,100)/100);};

    __().begin("stepper", userParams).buffer({
        fn: buildBuffer,
        loop: true
    }).end("stepper");

    return cracked;

    function buildBuffer(audioContext) {
        var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
        var buflen = buffer.length;
        var bufNum = buffer.numberOfChannels;
        var buffArr = []; //call only once and cache
        var stepSize = parseInt(buflen/steps);

        for (var k = 0; k < bufNum; k++) {
            buffArr.push(buffer.getChannelData(k));
        }

        for (var i = 0; i < buflen; i++) {
            var value = (!i || i % stepSize === 0) ?  fn() : value;
            for (var j = 0; j < bufNum; j++) {
                buffArr[j][i] = value;
            }
        }
        return buffer;
    }
};