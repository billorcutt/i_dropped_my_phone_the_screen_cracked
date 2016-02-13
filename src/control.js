/**
 * #Controlling#
 *
 * Methods for controlling nodes
 */

/**
 * Calls start() on the currently selected nodes
 * Throws no error if there are no selected nodes
 * that have a start method
 * <code>
 * //create and connect sine->lowpass->dac
 * \_\_().sine().lowpass().dac();
 * //start the sine node
 * \_\_("sine").start();</code>
 *
 * [See more control examples](../../examples/control.html)
 *
 * @function
 * @public
 */
cracked.start = function () {
    if (!recordingMacro()) {
        for (var i = 0; i < _selectedNodes.length; i++) {
            var currNode = getNodeWithUUID(_selectedNodes[i]);
            if (currNode && !currNode.getIsPlaying()) {
                currNode.start();
            }
        }
    }
    return cracked;
};

/**
 * Calls stop() on the currently selected nodes
 * Throws no error if there are no selected nodes
 * that have a stop method
 * <code>
 * //create and connect sine->lowpass->dac
 * \_\_().sine().lowpass().dac();
 * //stop the sine node
 * \_\_("sine").stop();</code>
 *
 * [See more control examples](../../examples/control.html)
 *
 * @function
 * @public
 */
cracked.stop = function () {
    for (var i = 0; i < _selectedNodes.length; i++) {
        var currNode = getNodeWithUUID(_selectedNodes[i]);
        if (currNode && currNode.getIsPlaying()) {
            currNode.stop(0);
        }
    }
    return cracked;
};

/**
 * Public method to ramp a parameter on currently selected nodes
 * Target & timeToRamp parameters can be numbers or arrays of numbers
 * for multisegement ramps. Initial value param is optional, if
 * omitted, then the current value is used as the initial value.
 * If loop is running, then ramp start times are snapped to the
 * sequencer grid.
 * <code>
 * //create and connect sine->lowpass->dac & play
 * \_\_().sine().lowpass().dac().play();
 * //ramp the frequency of the sine. 220 to 880 in 5 seconds
 * \_\_("sine").ramp(880,5,"frequency",220);</code>
 *
 * [See more envelope examples](../../examples/envelopes.html)
 *
 * @function
 * @public
 * @param {Number|Array} target value to ramp to
 * @param {Number|Array} timeToRamp length of ramp in seconds
 * @param {String} paramToRamp name of parameter to ramp
 * @param {Number} initial value to start the ramp at
 *
 */
cracked.ramp = function (target, timeToRamp, paramToRamp, initial) {
    for (var i = 0; i < _selectedNodes.length; i++) {
        var currNode = getNodeWithUUID(_selectedNodes[i]);
        if (currNode) {
            currNode.ramp(target, timeToRamp, paramToRamp, null, initial);
        }
    }
    return cracked;
};

/**
 * Set attribute values on a node. Takes an object with
 * any number of key:value pairs to set
 *
 * <code>
 * //create and connect sine->lowpass->dac & play
 * \_\_().sine().lowpass().dac().play();
 * //set the frequency of the sine to 880
 * \_\_("sine").attr({"frequency":880});</code>
 *
 * [See more control examples](../../examples/control.html)
 *
 * @function
 * @public
 * @param {Object} userParams options object
 * @param {String} userParams.paramName
 * @param {} userParams.paramValue
 *
 */
cracked.attr = function (userParams) {
    for (var i = 0; i < _selectedNodes.length; i++) {
        var currNode = getNodeWithUUID(_selectedNodes[i]);
        if (currNode && userParams) {
            currNode.attr(userParams);
        }
    }
    return cracked;
};

/**
 * parses the dot separated keys in the param string and sets the value on the node. helper for the above
 * @private
 * @param {Object} node native node we are setting on
 * @param {String} keyStr unresolved parameter name
 * @param {*} value value to set
 * @param {Object} map name/param mapping
 */
function applyParam(node, keyStr, value, map) {
    var mappingResult = resolveParamMapping(keyStr, map),
        keyArr = mappingResult.path.split("."),
        keyFunc = mappingResult.fn || function (val) {
                return val;
            };
    for (var i = 0; i < keyArr.length; i++) {
        if ((i + 1) < keyArr.length && __.isNotUndef(node[keyArr[i]])) {
            if (node[keyArr[i]].constructor.name === "AudioParam") {
                setAudioParam(node[keyArr[i]], value);
            } else {
                node = node[keyArr[i]];
            }
        } else if (node && __.isNotUndef(node[keyArr[i]])) {
            node[keyArr[i]] = keyFunc(value);
        }
    }
}

/**
 * helper for above - set value at time
 * @private
 * @param node
 * @param value
 */
function setAudioParam(node, value) {
    if (node && __.isFun(node.setValueAtTime)) {
        var time = _ignoreGrid ? _context.currentTime : _loopTimeToNextStep;
        node.cancelScheduledValues(time);
        node.setValueAtTime(value, time);
    }
}

/**
 * parameter name mapping resolver takes a native node &
 * the name to be resolved helper for above
 * @private
 * @param name param name
 * @param map mapping hash
 * @returns {*}
 */
function resolveParamMapping(name, map) {
    var mapping = map || {},
        result = mapping[name] || name;
    return result.path ? result : {
        path: result
    };
}