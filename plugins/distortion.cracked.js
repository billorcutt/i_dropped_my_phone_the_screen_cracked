/**
 * Bitcrusher
 *
 * [See more bitcrusher examples](examples/distortion.html)
 *
 * @plugin
 * @category Distortion
 * @function
 * @memberof cracked
 * @name cracked#bitcrusher
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=0.1]
 * @param {Number} [params.bits=6]
 */
cracked.bitcrusher = function (params) {
//adapted from http://noisehack.com/custom-audio-effects-javascript-web-audio-api/
    params = params || {};

    __.begin("bitcrusher", params);

    __.script({
        fn: (function (options) {

            var bits = options.bits || 6; // between 1 and 16
            var normfreq = __.ifUndef(options.frequency, 0.1); // between 0.0 and 1.0
            var step = Math.pow(1 / 2, bits);
            var phaser = 0;
            var last = 0;

            function crusher(e) {
                var input = e.inputBuffer.getChannelData(0);
                var output = e.outputBuffer.getChannelData(0);
                for (var i = 0; i < 4096; i++) {
                    phaser += normfreq;
                    if (phaser >= 1.0) {
                        phaser -= 1.0;
                        last = step * Math.floor(input[i] / step + 0.5);
                    }
                    output[i] = last;
                }
            }

            return crusher;

        })(params)
    });

    __.end("bitcrusher");

    return cracked;

};

/**
 * Ring Modulator
 *
 * [See more ring modulator examples](examples/distortion.html)
 *
 * @plugin
 * @category Distortion
 * @function
 * @memberof cracked
 * @name cracked#ring
 * @param {Object} [params] map of optional values
 * @param {Number} [params.distortion=1]
 * @param {Number} [params.frequency=30]
 */
cracked.ring = function (params) {
//adapted from http://webaudio.prototyping.bbc.co.uk/ring-modulator/
    var options = params || {};

    var thisCurve = setCurve(__.ifUndef(options.distortion, 1));

    __.begin("ring", params);

    __.gain({
        id: "player"
    }).
        gain({
            id: "vcInverter1",
            gain: -1
        }).
        waveshaper({
            id: "vcDiode3",
            curve: thisCurve,
            mapping: {
                "distortion": {
                    "path": "curve",
                    "fn": (function () {
                        return setCurve;
                    })()
                }
            }
        }).
        compressor({
            threshold: -12
        });

    __("#player").
        waveshaper({
            id: "vInDiode4",
            curve: thisCurve,
            mapping: {
                "distortion": {
                    "path": "curve",
                    "fn": (function () {
                        return setCurve;
                    })()
                }
            }
        }).
        connect("compressor");

    __().sine({
        id: "vIn",
        frequency: options.frequency || 30,
        mapping: {
            "frequency": "frequency.value"
        }
    }).
        gain({
            id: "vInGain",
            gain: 0.5
        }).
        gain({
            id: "vInInverter1",
            gain: -1
        }).
        gain({
            id: "vInInverter2",
            gain: -1
        }).
        waveshaper({
            id: "vInDiode1",
            curve: thisCurve,
            mapping: {
                "distortion": {
                    "path": "curve",
                    "fn": (function () {
                        return setCurve;
                    })()
                }
            }
        }).
        gain({
            id: "vInInverter3",
            gain: -1
        }).
        connect("compressor");

    __("#vInGain").
        connect("#vInDiode4");

    __("#vInGain").
        connect("#vcInverter1");

    __("#vInInverter1").
        waveshaper({
            id: "vInDiode2",
            curve: thisCurve,
            mapping: {
                "distortion": {
                    "path": "curve",
                    "fn": (function () {
                        return setCurve;
                    })()
                }
            }
        }).
        connect("#vInInverter3");

    __("compressor").
        gain({
            id: "outGain",
            gain: 4
        });

    __.end("ring");

    return cracked;

    function setCurve(distortion) {

        var i, samples, v, value, wsCurve, _i, _ref, vb, vl, h;

        vb = 0.2;
        vl = 0.4;
        h = __.ifUndef(distortion, 1);

        samples = 1024;
        wsCurve = new Float32Array(samples);

        for (i = _i = 0, _ref = wsCurve.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
            v = (i - samples / 2) / (samples / 2);
            v = Math.abs(v);
            if (v <= vb) {
                value = 0;
            } else if ((vb < v) && (v <= vl)) {
                value = h * ((Math.pow(v - vb, 2)) / (2 * vl - 2 * vb));
            } else {
                value = h * v - h * vl + (h * ((Math.pow(vl - vb, 2)) / (2 * vl - 2 * vb)));
            }
            wsCurve[i] = value;
        }
        return wsCurve;
    }

};
//adapted from https://github.com/web-audio-components
/**
 * Overdrive, waveshaper with additional parameters
 *
 * [See more overdrive examples](examples/distortion.html)
 *
 * @plugin
 * @category Distortion
 * @function
 * @memberof cracked
 * @name cracked#overdrive
 * @param {Object} [params] map of optional values
 * @param {Number} [params.drive=0.5]
 * @param {Number} [params.color=800]
 * @param {Number} [params.postCut=3000]
 */
cracked.overdrive = function (params) {

    params = params || {};
    var drive = __.isObj(params) ? __.ifUndef(params.drive, 0.5) : params;

    __.begin("overdrive", params);

    __.gain({
        id: "input"
    }).
        bandpass({
            frequency: __.ifUndef(params.color, 800),
            mapping: {
                "color": "frequency.value"
            }
        }).
        waveshaper({
            curve: makeCurve(drive),
            mapping: {
                "drive": {
                    "path": "curve",
                    "fn": (function () {
                        return makeCurve;
                    })()
                }
            }
        }).
        lowpass({
            frequency: __.ifUndef(params.postCut, 3000),
            mapping: {
                "postCut": "frequency.value"
            }
        }).
        gain({
            id: "output"
        });

    __.end("overdrive");

    function makeCurve(value) {
        var k = value * 100,
            n = 22050,
            curve = new Float32Array(n),
            deg = Math.PI / 180;

        for (var i = 0; i < n; i++) {
            var x = i * 2 / n - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    return cracked;

};