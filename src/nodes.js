/**
 * #Native Audio Nodes#
 * Native implementations of web audio nodes.
 */

/**
 * Native Script node
 * @function
 * @memberof cracked
 * @name cracked#script
 * @public
 * @category Node
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.buffersize=4096]
 * @param {Number} [userParams.channels=1]
 * @param {Function} [userParams.fn=defaultFunction]
 */
cracked.script = function (userParams) {
    userParams = userParams || {};
    var buffersize = userParams.buffersize || 4096;
    var channels = userParams.channels || 1;
    var fn = userParams.fn || defaultFunction;
    var creationParams = {
        "method": "createScriptProcessor",
        "methodParams": [buffersize, channels, channels],
        "settings": {
            "onaudioprocess": fn
        }
    };
    createNode("script", creationParams, userParams);

    //default function just passes sound thru
    function defaultFunction(e) {
        var input = e.inputBuffer.getChannelData(0);
        var output = e.outputBuffer.getChannelData(0);
        for (var i = 0; i < buffersize; i++) {
            output[i] = input[i];
        }
    }

    return cracked;
};

/**
 * Native Waveshaper
 * @function
 * @memberof cracked
 * @category Node
 * @name cracked#waveshaper
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.drive=50]
 */
cracked.waveshaper = function (userParams) {

    userParams = userParams || {};
    var drive = __.isObj(userParams) ?
        cracked.ifUndef(userParams.drive, 50) :
        userParams;
    var creationParams = {
        "method": "createWaveShaper",
        "settings": {
            "curve": userParams.curve || makeCurve(drive),
            "mapping": {
                "distortion": {
                    "path": "curve",
                    "fn": (function () {
                        return makeCurve;
                    })()
                }
            }
        }
    };
    //tbd need a way to modifiy the param to makeCurve
    createNode("waveshaper", creationParams, userParams);

    return cracked;

    //curve generator for waveshaper
    function makeCurve(amount) {
        var k = __.isNum(amount) ? amount : 50,
            n_samples = 44100, //hard coded
            curve = new Float32Array(n_samples),
            deg = Math.PI / 180,
            x;
        for (var i = 0; i < n_samples; ++i) {
            x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

};

/**
 * Native Compressor
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#compressor
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.threshold=-24] in decibels, nominal range of -100 to 0.
 * @param {Number} [userParams.knee=30] in decibels, range of 0 to 40
 * @param {Number} [userParams.ratio=12] nominal range of 1 to 20
 * @param {Number} [userParams.attack=0.003] time in seconds, nominal range of 0 to 1
 * @param {Number} [userParams.release=0.250] time in seconds, nominal range of 0 to 1
 */
cracked.compressor = function (userParams) {
    var mapping = {
        "threshold": "threshold.value",
        "knee": "knee.value",
        "ratio": "ratio.value",
        "attack": "attack.value",
        "release": "release.value"
    };
    var creationParams = {
        "method": "createDynamicsCompressor",
        "settings": {},
        "mapping": mapping
    };
    createNode("compressor", creationParams, userParams);
    return cracked;
};

/**
 * Native Gain
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#gain
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.threshold=-24] in decibels, nominal range of -100 to 0.
 */
cracked.gain = function (userParams) {
    var gain = __.isNum(userParams) ? userParams : 1;
    var params = __.isObj(userParams) ? userParams : {
        "gain": gain
    };
    var creationParams = {
        "method": "createGain",
        "settings": {},
        "mapping": {
            "gain": "gain.value"
        }
    };
    createNode("gain", creationParams, params);
    return cracked;
};

/**
 * Naming this with prefix native so I can use "delay" as a plugin name
 * max buffer size three minutes
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#native_delay
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.delay=0] in seconds.
 */
cracked.native_delay = function (userParams) {
    var creationParams = {
        "method": "createDelay",
        "methodParams": [179.0],
        "settings": {},
        "mapping": {
            "delay": "delayTime.value"
        }
    };
    createNode("delay", creationParams, userParams);
    return cracked;
};

/**
 * Native oscillator, used the oscillator plugins
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#osc
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440]
 * @param {Number} [userParams.detune=0]
 * @param {String} [userParams.type=sine]
 */
cracked.osc = function (userParams) {
    var creationParams = {
        "method": "createOscillator",
        "settings": {},
        "mapping": {
            "frequency": "frequency.value",
            "detune": "detune.value"
        }
    };
    createNode("osc", creationParams, userParams);
    return cracked;
};

/**
 * Native biquad filter, used by filter plugins
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#biquadFilter
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.frequency=440]
 * @param {Number} [userParams.q=0]
 * @param {String} [userParams.gain=0]
 * @param {String} [userParams.type=lowpass]
 */
cracked.biquadFilter = function (userParams) {
    var creationParams = {
        "method": "createBiquadFilter",
        "settings": {},
        "mapping": {
            "q": "Q.value",
            "frequency": "frequency.value",
            "gain": "gain.value"
        }
    };
    createNode("biquadFilter", creationParams, userParams);
    return cracked;
};

/**
 * Native convolver, used by reverb
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#convolver
 * @public
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.path] path to remote impulse
 * @param {Function} [userParams.fn] function to generate impulse
 */
cracked.convolver = function (userParams) {

    userParams = userParams || {};
    var creationParams = {
        "method": "createConvolver",
        "settings": {}
    };
    var node = createNode("convolver", creationParams, userParams);
    loadBuffer(userParams, node);

    return cracked;

};

/**
 * Native stereo panner, used by panner
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#stereoPanner
 * @public
 * @param {Object} [userParams] map of optional values
 */
cracked.stereoPanner = function (userParams) {

    userParams = userParams || {};
    var creationParams = {
        "mapping": {
            "pan": "pan.value"
        },
        "method": "createStereoPanner",
        "settings": {}
    };
    createNode("stereoPanner", creationParams, userParams);
    return cracked;
};

/**
 * Native destination, used by the dac plugin
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#destination
 * @public
 * @param {Object} [userParams] map of optional values
 */
cracked.destination = function (userParams) {
    createNode("destination", {
        "method": "createDestination",
        "settings": {}
    }, userParams);
    return cracked;
};

/**
 * Native sound input node, used by the adc plugin
 * origin = opposite of destination
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#origin
 * @public
 * @param {Object} [userParams] map of optional values
 */
cracked.origin = function (userParams) {
    var cParams = {
        "method": "createOrigin",
        "settings": {}
    };
    //mediastream creation is async so we need to jump thru some hoops...
    //first create a temporary, silent imposter mediastream we get swap out later
    var tmpNode = createNode("origin", cParams, userParams);
    //now create the real object asynchronously and swap it in when its ready
    createMediaStreamSourceNode(cParams,tmpNode);
    return cracked;
};

/**
* helper function for origin method
* @function
* @private
*/
function createMockMediaStream(creationParams) {
    //create buffer-less buffer source object as our mock mediastream
    creationParams.method = "createBufferSource";
    var tmpnode = _context[creationParams.method].apply(_context, creationParams.methodParams || []);
    for (var creationParam in creationParams.settings) {
        if (creationParams.settings.hasOwnProperty(creationParam)) {
            applyParam(tmpnode, creationParam, creationParams.settings[creationParam], creationParams.mapping);
        }
    }
    return tmpnode;
}

/**
* helper function for origin method
* @function
* @private
*/
function createMediaStreamSourceNode(params,temporaryNode) {
    //make the real mediastream and drop it into place.
    var newNode = null;
    navigator.getUserMedia = (navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia);

    if(navigator.getUserMedia) {
        navigator.getUserMedia(
            {
                audio:true
            },
            (function(params){
                var p = params;
                return function(stream) {
                    p.method = "createMediaStreamSource";
                    p.methodParams = [stream];
                    //made an actual media stream source
                    newNode = audioNodeFactory(p);
                    //update the imposter mediastream w/ the real thing
                    getNodeWithUUID(temporaryNode.getNativeNode().uuid).replaceNode(newNode);
                };
            })(params),
            function(error) {
                console.error("createMediaStreamSourceNode: getUserMedia failed.");
            }
        );
    } else {
        console.error("createMediaStreamSourceNode: getUserMedia not supported.");
    }

}

/**
 * Native audio source node and buffer combined.
 * @function
 * @public
 * @memberof cracked
 * @name cracked#buffer
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.path] path to remote file
 * @param {Number} [userParams.speed=1] playback speed
 * @param {Number} [userParams.start=0] play head start value in seconds
 * @param {Number} [userParams.end=0] play head end value in seconds
 * @param {Boolean} [userParams.loop=false] loop?
 */
cracked.buffer = function (userParams) {
    var creationParams = {
        "method": "createBufferSource",
        "settings": {},
        "mapping": {
            "speed": "playbackRate.value",
            "start": "loopStart",
            "end": "loopEnd"
        }
    };
    var buffersrc = createNode("buffer", creationParams, userParams);
    loadBuffer(userParams, buffersrc);
    return cracked;
};

/**
* helper function for buffer & reverb
* @function
* @private
*/
function loadBuffer(userParams, node) {
    if (userParams && userParams.path && node) {
        loadBufferFromFile(userParams.path, node.getNativeNode());
    } else if (userParams && userParams.fn && node) {
        loadBufferWithData(userParams.fn, node.getNativeNode());
    }
}

/**
* helper function for buffer & reverb
* @function
* @private
*/
function loadBufferWithData(dataFunction, buffersrc) {
    if (dataFunction && buffersrc) {
        buffersrc.buffer = dataFunction(_context);
    }
}

/**
* helper function for buffer & reverb
* @function
* @private
*/
function loadBufferFromFile(path_to_soundfile, buffersrc) {
    if (path_to_soundfile && buffersrc) {
        fetchSoundFile(path_to_soundfile, function (sndArray) {
            _context.decodeAudioData(sndArray, function (buf) {
                buffersrc.buffer = buf;
                logToConsole("sound loaded");
            }, function (e) {
                logToConsole("Couldn't load audio");
            });
        });
    }
}

/**
* asynchronously fetches a file for the buffer and returns an arraybuffer
* @function
* @private
*/
function fetchSoundFile(path, callback) {
    if (path && callback) {
        var request = new XMLHttpRequest();
        request.open("GET", path, true); // Path to Audio File
        request.responseType = "arraybuffer"; // Read as Binary Data
        request.onload = function () {
            if (__.isFun(callback)) {
                callback(request.response);
            }
        };
        request.send();
    }
}