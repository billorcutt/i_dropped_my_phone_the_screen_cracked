(function () {
'use strict';

/**
 * set up some variables used throughout the module
 * @private
 */

var _nodeStore = {},
    _nodeLookup = {},
    _previousNode = null,
    _selectedNodes = [],
    _currentSelector = "",
    _currentMacro = [],
    _debugEnabled = false,
    _context = window.AudioContext ? new AudioContext() : new webkitAudioContext(),
    _maxChannelCount = _context.destination.maxChannelCount;

/**
 * #Finding#
 * Methods for selecting & working with audio nodes
 */

/**
 * Updates the internal selected nodes array with a collection of audio nodes matching the selector provided. Type, Class & Id selectors are supported.
 * <pre>
 * <code>//type selector using the node name, sets the frequency for all sines
 * __("sine").frequency(200);
 *
 * //set the frequency for the node with id "foo"
 * __("#foo").frequency(200);
 *
 * //set the frequency for any nodes with a class of "bar"
 * __(".bar").frequency(200);
 *
 * //select all sines, any nodes with classname "bar" or id of "foo"
 * //and set their frequencies to 200
 * __("sine,.bar,#foo").frequency(200);</code></pre>
 *
 * [See more selector examples](examples/selector.html)
 *
 * If invoked without arguments, cracked() resets the selection/connection state, removing any record of previous nodes and effectively marking the start of a new connection chain. Since a new node will try to connect to any previous node, calling __() tells a node that there is no previous node to connect to.
 * For example:
 * <pre>
 * <code>//Create & connect sine -> lowpass -> dac
 * __().sine();
 * __.lowpass();
 * __.dac();
 *
 * //Create but don't connect
 * __().sine();
 * __().lowpass();
 * __().dac();</code></pre>
 *
 * cracked is also the namespace for public methods and also can be written as a
 * double underscore __
 * <pre>
 * <code>__("sine"); //same as cracked("sine")</code>
 * </pre>
 *
 *
 * @public
 * @category Find
 * @type cracked
 * @function
 * @namespace
 * @global
 * @param {String} [selector] selector expression
 * @returns {cracked}
 */
var cracked = find;

function find() {
    if (arguments && arguments.length) {
        if (recordingMacro()) {
            //if we're making a macro right now
            //search in the macro
            findInMacro(arguments[0]);
        } else {
            //search everywhere
            if(__.isStr(arguments[0])) {
                var selector = arguments[0];
                _currentSelector = selector;
                _selectedNodes = getNodesWithSelector(selector);
            } else if(__.isObj(arguments[0]) && arguments[0].constructor.name === "AudioNode") {
                _currentSelector = arguments[0].getType();
                _selectedNodes = [arguments[0].getUUID()];
            }
        }
    } else {
        //if there are no arguments
        //then reset the entire state
        reset();
    }
    //if we're finding, then no previous node
    _previousNode = null;
    return cracked;
}

/**
 * find nodes in a macro with a selector updates the _selectedNodes array
 * @function
 * @private
 */
function findInMacro() {
    if (arguments && arguments.length) {
        if(__.isStr(arguments[0])) {
            var macroUUID = getCurrentMacro().getUUID();
            //update the shared _currentSelector variable
            //then find the nodes
            _currentSelector = processSelectorForMacro(arguments[0]);
            //update selectedNodes
            _selectedNodes = getNodesWithSelector(_currentSelector);
            //strip out anything we found that's not part of this
            //container macro
            _selectedNodes.forEach(function (el, i, arr) {
                if (el && getNodeWithUUID(el).getMacroContainerUUID() !== macroUUID) {
                    arr.splice(i, 1);
                }
            });
        } else if(__.isObj(arguments[0]) && arguments[0].constructor.name === "AudioNode") {
            _currentSelector = getCurrentMacroNamespace()+" "+arguments[0].getType();
            _selectedNodes = [arguments[0].getUUID()];
        }
    }
}

//helper method used above and in cracked.find()
//prepends macro name to incoming selectors
function processSelectorForMacro(selector) {
    //look for the macro namespace in the incoming selector
    //if its there, do nothing, else add it.
    var selectorArr = selector.split(","),
        prefix = getCurrentMacroNamespace();
    //insert the prefix
    //use a loop to handle comma delimited selectors
    for (var i = 0; i < selectorArr.length; i++) {
        selectorArr[i] = (selectorArr[i].indexOf(prefix) !== -1) ?
            selectorArr[i] : prefix + selectorArr[i];
    }
    //re-join the now prefixed selectors and return
    return selectorArr.join(",");
}

/**
 * reset state
 * @function
 * @private
 */
function reset() {
    _previousNode = null;
    _selectedNodes = [];
    _currentSelector = "";
}

/**
 * reset selection
 * @function
 * @private
 */
function resetSelection() {
    _selectedNodes = [];
    _currentSelector = "";
}

/**
 * resets everything to its initial state
 * <pre><code>//reset state for the entire app
 *  cracked.reset();</code></pre>
 * @public
 * @category Find
 * @name cracked#reset
 * @memberof cracked
 * @function
 * @returns {cracked}
 */
cracked.reset = function() {
    __("*").remove();
    resetMacro();
    reset();
    resetModel();
    resetLoop();
    return cracked;
};

/**
 * executes a method with a specific set of selected nodes without modifying the internal selectedNodes array
 * <pre><code>//filter everything but the sines from currently selected nodes and
 * //execute the frequency method against the remaining sines.
 * //the internal _selectedNodes array remains unchanged
 * cracked.exec(
 *    "frequency",
 *    200,
 *    cracked.filter("sine")
 * );</code></pre>
 *
 * @public
 * @category Find
 * @function
 * @name cracked#exec
 * @memberof cracked
 * @param {String} method method name
 * @param {Array} args arguments to supply to the method
 * @param {Array} nodes node array to execute against
 * @returns {cracked}
 */
cracked.exec = function (method, args, nodes) {
    var save = _selectedNodes;
    _selectedNodes = nodes;
    cracked[method].apply(cracked, args);
    _selectedNodes = save;
    return cracked;
};

/**
 * iterate over the selectedNodes array, executing the supplied function for each element
 * <pre><code>__.each(type, function(node,index,array){
     *      //Loops over any selected nodes. Parameters are the
     *      //current node, current index, and the selectedNode array
     * });</code></pre>
 *
 * @public
 * @category Find
 * @name cracked#each
 * @memberof cracked
 * @function
 * @param {String} type string to be checked against the node type
 * @param {Function} fn function to be called on each node
 * @returns {cracked}
 */
cracked.each = function (type, fn) {
    if (__.isFun(fn)) {
        for (var i = 0; i < _selectedNodes.length; i++) {
            var node = getNodeWithUUID(_selectedNodes[i]);
            if (!type || (type && node.getType() === type)) {
                fn(node, i, _selectedNodes);
            }
        }
    }
    return cracked;
};

/**
 * Filter selected nodes with an additional selector returns node array that can used with exec()
 * <pre><code>//select any sine & sawtooth oscillators
 * __("sine,saw");
 *
 * //filter out everything but the sines and
 * //execute the frequency method against those nodes.
 * //the internal _selectedNodes array remains unchanged
 * cracked.exec(
 *    "frequency",
 *    200,
 *    cracked.filter("sine")
 * );</code></pre>
 *
 * @public
 * @category Find
 * @name cracked#filter
 * @memberof cracked
 * @function
 * @param {String} selector selector expression
 * @returns {Array}
 */
cracked.filter = function () {
    var tmp = [];
    if (arguments && arguments.length) {
        var str = arguments[0],
            selectorType = getSelectorType(str),
            match = str.match(/^\.|\#/) ? str.substring(1) : str;
        _selectedNodes.forEach(function (nodeID, i, arr) {
            var node = getNodeWithUUID(nodeID);
            if (
                selectorType === "type" && node.getType() === match ||
                selectorType === "class" && node.getClass() === match ||
                selectorType === "id" && node.getID() === match
            ) {
                tmp.push(nodeID);
            }
        });
    }
    return tmp;
};

/**
 * Find nodes with a selector returns node array that can used with exec()
 * <pre><code>//find all the sines in the patch and
 * //execute the frequency method against those nodes.
 * //the internal _selectedNodes array remains unchanged
 * cracked.exec(
 *    "frequency",
 *    200,
 *    cracked.find("sine")
 * );</code></pre>
 *
 * @public
 * @category Find
 * @name cracked#find
 * @memberof cracked
 * @function
 * @param {String} selector selector expression
 * @returns {Array}
 */
cracked.find = function () {
    var selector = recordingMacro() ? processSelectorForMacro(arguments[0]) : arguments[0];
    return getNodesWithSelector(selector);
};


/**
 * #Audio Node Creation#
 *
 * Audio node wrapper class, methods for node manufacture
 *
 */

/**
* node factory -  create, configure and connect new nodes. returns an instance of audio node wrapper class
* @private
* @param {String} type
* @param {Object} creationParams hash of params supplied by the invoking factory method
* @param {Object} userSettings user supplied params
* @returns {AudioNode}
*/
function createNode(type, creationParams, userSettings) {
    var node = new AudioNode(type, creationParams, userSettings || {});
    saveNode(node);
    //bail if we're only creating a macro wrapper
    if (node.isMacro()) {
        return node;
    }
    //if there are selected nodes then connect to those, otherwise use the previous node
    var nodesToConnect = _selectedNodes.length ? _selectedNodes : [getPreviousNode()];
    for (var i = 0; i < nodesToConnect.length; i++) {
        var nodeToConnect = getNodeWithUUID(nodesToConnect[i]);
        if (nodeToConnect) {
            try {
                nodeToConnect.connect(node);
                nodeToConnect.pushNextNode(node);
                node.setPrevNode(nodeToConnect);
                logConnections(nodeToConnect, node);
            } catch (e) {
                console.error("ERROR : couldn't connect nodes " + nodeToConnect.getType() + " and " + node.getType());
                throw e;
            }
        }
    }
    resetSelection();
    setPreviousNode(node);
    return node;
}

/**
* Native audio nodes are made here.
* @param {Object} creationParams
* @private
* @returns {*}
*/
function audioNodeFactory(creationParams) {
    var node;
    if (_context && creationParams.method && _context[creationParams.method]) {
        node = _context[creationParams.method].apply(_context, creationParams.methodParams || []);
        for (var creationParam in creationParams.settings) {
            if (creationParams.settings.hasOwnProperty(creationParam)) {
                if(creationParam === "to_channel" || creationParam === "from_channel") {
                    node[creationParam] = creationParams.settings[creationParam];
                } else {
                    applyParam(node, creationParam, creationParams.settings[creationParam], creationParams.mapping);
                }
            }
        }
    } else if (_context && creationParams.method === "createDestination") {
        node = _context.destination;
    } else if (_context && creationParams.method === "createOrigin") {
        node = createMockMediaStream(creationParams);
    } else if (_context && creationParams.method === "createMacro") {
        //its a macro
        node = [];
    } else {
        throw new Error("Couldn't create audio node. Create method "+creationParams.method+" not supported.");
    }
    logToConsole(node);
    return node;
}

/**
* wrapper class for audio nodes
* @private
* @param {String} type audio node type
* @param {Object} creationParams app supplied params
* @param {Object} userSettings user supplied params
* @type {AudioNode}
* @constructor
*/
function AudioNode(type, creationParams, userSettings) {

    var uuid,
        macroContainerUUID,
        macroNameSpace = "",
        parameters,
        nodeType,
        nativeNode,
        prevNode,
        isPlaying = false,
        nextNode = [],
        paramMapping = {},
        that = this;

    uuid = generateUUID(); //generate uuid
    mergeObjects(userSettings, creationParams.settings); //merge in the params from the user
    mergeObjects(userSettings.mapping, creationParams.mapping); //merge in mappings from the user
    parameters = creationParams; //merged user and creations params
    paramMapping = creationParams.mapping || creationParams.settings.mapping;
    nodeType = type; //store the node type
    nativeNode = audioNodeFactory(parameters); //make the node
    nativeNode.uuid = uuid; //tag the native node so we can find it's wrapper later

    //wrapper node start method
    this.start = function (nodeParam) {
        var currNode = nodeParam || nativeNode;
        if (__.isArr(currNode)) {
            currNode.forEach(function (_node, _i, _array) {
                //recurse
                that.start(_node);
            });
        } else {
            if (currNode && __.isFun(currNode.start)) {
                var wrapper = getNodeWithUUID(currNode.uuid);
                if (!wrapper.getIsPlaying()) {
                    var offset = (currNode && currNode.loopStart && __.isNum(currNode.loopStart)) ? currNode.loopStart : 0;
                    var duration = (currNode && currNode.loopEnd && __.isNum(currNode.loopEnd)) ? currNode.loopEnd - offset : 0;
                    var time = _ignoreGrid ? _context.currentTime : _loopTimeToNextStep;
                    /*if(duration) {
                        currNode.start(time,offset,duration);
                    } else*/ if(offset) {
                        currNode.start(time,offset);
                    } else {
                        currNode.start(time);
                    }
                    wrapper.setIsPlaying(true);
                    this.setIsPlaying(true);
                }
            }
        }
    };

    //wrapper node stop method
    this.stop = function (nodeParam) {
        var currNode = nodeParam || nativeNode;
        if (__.isArr(currNode)) {
            currNode.forEach(function (_node, _i, _array) {
                //recurse
                that.stop(_node);
            });
        } else {
            if (currNode && __.isFun(currNode.stop)) {
                var wrapper = getNodeWithUUID(currNode.uuid);
                if (wrapper.getIsPlaying()) {
                    var time = _ignoreGrid ? _context.currentTime : _loopTimeToNextStep;
                    currNode.stop(time);
                    this.resetNode(currNode);
                    wrapper.setIsPlaying(false);
                    this.setIsPlaying(false);
                }
            }
        }
    };

    //wrapper node ramp method
    //TBD - needs to work with something other than linear ramp
    this.ramp = function (target, time, paramToRamp, nodeParam, initial, type) {
        var currNode = nodeParam || nativeNode;
        var rampMethod = type === 'exp' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
        var _target;
        if (__.isArr(currNode)) {
            currNode.forEach(function (_node, _i, _array) {
                //recurse
                that.ramp(target, time, paramToRamp, _node, initial);
            });
        } else {
            var now = _ignoreGrid ? _context.currentTime : _loopTimeToNextStep;
            if (
                currNode &&
                currNode[paramToRamp] &&
                __.isFun(currNode[paramToRamp][rampMethod])
            ) {
                currNode[paramToRamp].cancelScheduledValues(now);
                var initialValue = __.ifUndef(initial, currNode[paramToRamp].value),
                    prevTime = 0;
                currNode[paramToRamp].setValueAtTime(initialValue, now);
                if (
                    __.isArr(target) &&
                    __.isArr(time) &&
                    target.length === time.length
                ) {
                    for (var i = 0; i < target.length; i++) {
                        prevTime = __.isUndef(time[i - 1]) ? 0 : (time[i - 1] + prevTime);
                        logToConsole(" target " + target[i] + " time " + (_context.currentTime + prevTime + time[i]) + " current time " + (_context.currentTime));
                        _target = (target[i] === 0 && type === 'exp') ? 0.0001 : target[i];
                        currNode[paramToRamp][rampMethod](_target, (now + prevTime + time[i]));
                    }
                } else {
                    //if we're looping and the user seems to be trying to sync to the loop, we'll clamp it
                    if(!_ignoreGrid && __.sec2ms(time) === _loopInterval) {
                        time = Math.min(time,(_loopTimeToNextStep - _context.currentTime));
                    }
                    //and yes, this is some bullshit code to fix a bug i dont understand...
                    logToConsole(" target " + target + " time " + (_context.currentTime + prevTime + time) + " current time " + (_context.currentTime));
                    _target = (target === 0 && type === 'exp') ? 0.0001 : target;
                    currNode[paramToRamp][rampMethod](_target, (now + time));
                }
            }
        }
    };

    //instance method for getting attribute values
    this.getAttr = function(userParams) {
        var nativeNode = this.getNativeNode();
        var values = [];
        if (__.isArr(nativeNode)) {
            flatten(nativeNode).forEach(function (_node, _i, _array) {
                var mapping = getNodeWithUUID(_node.uuid).getParamMapping();
                values.push(getParamValue(_node, userParams, mapping || {}));
                logToConsole(_node);
            });
        } else {
            var mapping = getNodeWithUUID(nativeNode.uuid).getParamMapping();
            values.push(getParamValue(nativeNode, userParams, mapping || {}));
            logToConsole(nativeNode);
        }
        return values[0];
    };

    //helper for above
    function getParamValue(node, keyStr, map) {
        var mappingResult = resolveParamMapping(keyStr, map),
        keyArr = mappingResult.path.split(".");

        for (var i = 0; i < keyArr.length; i++) {
            if((i + 1) < keyArr.length && node[keyArr[i]]) {
                node = node[keyArr[i]];
            } else if(node[keyArr[i]]) {
                return node[keyArr[i]];
            } else {
                return null;
            }
        }
    }

    //instance method for setting attributes
    this.attr = function (userParams) {
        for (var key in userParams) {
            if (userParams.hasOwnProperty(key)) {
                if (__.isNotUndef(userParams[key])) {
                    var nativeNode = this.getNativeNode();
                    if (__.isArr(nativeNode)) {
                        flatten(nativeNode).forEach(function (_node, _i, _array) {
                            var mapping = userParams.mapping || getNodeWithUUID(_node.uuid).getParamMapping();
                            applyParam(_node, key, userParams[key], mapping || {});
                            logToConsole(_node);
                        });
                    } else {
                        var mapping = userParams.mapping || getNodeWithUUID(nativeNode.uuid).getParamMapping();
                        applyParam(nativeNode, key, userParams[key], mapping || {});
                        logToConsole(nativeNode);
                    }
                }
            }
        }
    };

    //search the macro wrapper for nodes matching this selector
    this.search = function (str) {
        var nodes = [];
        if (str) {
            var prefix = this.getMacroNameSpace();
            var selector = prefix + str;
            var nodeIds = getNodesWithSelector(selector);
            for (var i = 0; i < nodeIds.length; i++) {
                if (getNodeWithUUID(nodeIds[i]).getMacroContainerUUID() === this.getUUID()) {
                    nodes.push(nodeIds[i]);
                }
            }
        }
        return nodes;
    };

    //returns the full macro namespace
    this.getMacroNameSpace = function () {
        return macroNameSpace;
    };

    this.setMacroNameSpace = function (name) {
        if (name) {
            macroNameSpace = name;
        }
    };

    //returns true if this node is a macro container
    this.isMacro = function () {
        return (__.isArr(nativeNode));
    };

    //returns true if its part of macro
    this.isMacroComponent = function () {
        return __.isNotUndef(macroContainerUUID);
    };

    //id of the containing macro
    this.setMacroContainerUUID = function (uuid) {
        if (__.isStr(uuid)) {
            macroContainerUUID = uuid;
        }
    };

    //id of the containing macro
    this.getMacroContainerUUID = function () {
        return macroContainerUUID;
    };

    //is this node playing
    this.getIsPlaying = function () {
        return isPlaying;
    };

    this.setIsPlaying = function (bool) {
        isPlaying = bool;
    };

    //get the previous node in the chain
    //that this node is connected to
    this.getPrevNode = function () {
        return prevNode;
    };

    this.setPrevNode = function (node) {
        prevNode = node;
    };

    //add a node to the next node array
    this.pushNextNode = function (node) {
        if (node) {
            //make sure that we're setting next node on the same
            //node that the connect is happening on (not a container macro)
            var nodes = getNodesToConnect(this, node);
            var fromNode = getNodeWithUUID(nodes.from.uuid);
            if (fromNode.getUUID() !== this.getUUID()) {
                fromNode.pushNextNode(node);
            } else {
                nextNode.push(node);
            }
        }
    };

    //returns the uuid for a node
    this.getUUID = function () {
        return uuid;
    };

    //returns all the parameters for this node
    this.getParams = function () {
        return parameters;
    };

    //returns the param mapping for this node
    this.getParamMapping = function () {
        return paramMapping;
    };

    //returns the type of this node
    this.getType = function () {
        return nodeType;
    };

    //returns the user created id (not the uuid)
    //if there is one
    this.getID = function () {
        return parameters.settings.id || "";
    };

    //returns user created classname if there is one
    this.getClass = function () {
        return parameters.settings["class"] || "";
    };

    //returns true if this node and the node param have
    //the same macro container
    this.areSiblings = function (node) {
        var parentNodeID = (__.isObj(node)) ?
            node.getMacroContainerUUID() : (__.isStr(node)) ?
            getNodeWithUUID(node).getMacroContainerUUID() : "";
        return parentNodeID && this.getMacroContainerUUID() && parentNodeID === this.getMacroContainerUUID();
    };

    //returns true if this node is (or is part of) a modulator macro
    this.isModulator = function () {
        if (
            this.getMacroContainerUUID() && !!getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates
        ) {
            return true;
        } else {
            return !!this.getParams().settings.modulates;
        }
    };

    //returns a string identifying the parameter that the macro node modulates
    this.isModulatorType = function () {
        if (
            this.isModulator() &&
            this.getMacroContainerUUID() && !!getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates
        ) {
            return getNodeWithUUID(this.getMacroContainerUUID()).getParams().settings.modulates;
        } else if (this.isModulator()) {
            return this.getParams().settings.modulates;
        } else {
            return "";
        }
    };

    //macro support - adds a native node to the
    //array when a node is added to a macro
    this.addNativeNode = function (nodeToAdd) {
        nativeNode.push(nodeToAdd);
    };

    //returns a native node or an array of native nodes
    this.getNativeNode = function () {
        return nativeNode;
    };

    //replace and reconnect a single native node with a supplied node
    this.replaceNode = function(node) {
        var saved_buffer = nativeNode.buffer;
        //create  a new node
        nativeNode = node;
        //restore uuid
        nativeNode.uuid = this.getUUID();
        //restore connections
        for (var i = 0; i < nextNode.length; i++) {
            this.connect(nextNode[i]);
        }
        this.connectPrevious();
        //not playing yet so false
        this.setIsPlaying(false);
        //restore the buffer
        if (saved_buffer) {
            nativeNode.buffer = saved_buffer;
        }
    };

    //reset the nodes that need to be restored after play is complete
    this.resetNode = function (currNode) {
        //if "this" node is a macro ...
        if (this.isMacro()) {
            //then get the wrapper node for the
            //current node and call reset on it
            getNodeWithUUID(currNode.uuid).resetNode();
            //after it's reset, add it to nativeNode array here in the macro
            updateNativeNode(getNodeWithUUID(currNode.uuid).getNativeNode(), currNode.uuid);
        } else {
            //save a reference to any buffers
            var saved_buffer = nativeNode.buffer;
            //create  a new node
            nativeNode = audioNodeFactory(parameters);
            //restore uuid
            nativeNode.uuid = this.getUUID();
            //restore connections
            for (var i = 0; i < nextNode.length; i++) {
                this.connect(nextNode[i]);
            }
            this.connectPrevious();
            //not playing yet so false
            this.setIsPlaying(false);
            //restore the buffer
            if (saved_buffer) {
                nativeNode.buffer = saved_buffer;
            }
        }
    };

    //for macros - replaces native node in a macro node array
    //with a fresh copy. used by reset.
    //helper for above
    function updateNativeNode(newNode, id) {
        newNode.uuid = id;
        updateNativeNodeHelper(nativeNode, newNode);
    }

    //helper for above
    function updateNativeNodeHelper(currNode, newNode) {
        currNode.forEach(function (n, i, a) {
            if (__.isArr(n)) {
                updateNativeNodeHelper(n, newNode);
            } else if (n.uuid === newNode.uuid) {
                a[i] = newNode;
            }
        });
    }

    // Connection

    //wrapper node disconnect method
    this.disconnect = function(nodeParam) {
        var currNode = nodeParam || nativeNode;
        if (__.isArr(currNode)) {
            currNode.forEach(function (_node, _i, _array) {
                //recurse
                that.disconnect(_node);
            });
        } else {
            if (currNode && __.isFun(currNode.disconnect)) {
                var wrapper = getNodeWithUUID(currNode.uuid);
                //fixes a bug in Firefox and Safari when disconnecting a destination node
                try {
                    currNode.disconnect();
                } catch (e) {}
                wrapper.setIsPlaying(false);
                this.setIsPlaying(false);
            }
        }
    };

    //public connection method
    this.connect = function (nodeToConnect) {
        if (nodeToConnect && this.getUUID() !== nodeToConnect.getUUID()) {
            var nodes = getNodesToConnect(this, nodeToConnect);
            if (nodes.from && __.isFun(nodes.from.connect) && nodes.to) {
                var from_channel = nodes.from.from_channel;
                var to_channel = nodes.from.to_channel;
                if(__.isNotUndef(from_channel) && __.isNotUndef(to_channel)) {
                    nodes.from.connect(nodes.to,from_channel,to_channel);
                } else {
                    nodes.from.connect(nodes.to);
                }
            } else {
                logToConsole("ERROR - connect did not happen");
            }
        }
    };

    //public connection method
    this.connectPrevious = function () {
        var pNode = this.getPrevNode();
        if (pNode && this.getUUID() !== pNode.getUUID()) {
            var nodes = getNodesToConnect(pNode, this);
            if (nodes.from && __.isFun(nodes.from.connect) && nodes.to) {
                var from_channel = nodes.from.from_channel;
                var to_channel = nodes.from.to_channel;
                if(__.isNotUndef(from_channel) && __.isNotUndef(to_channel)) {
                    nodes.from.connect(nodes.to,from_channel,to_channel);
                } else {
                    nodes.from.connect(nodes.to);
                }
            } else {
                logToConsole("ERROR - connect did not happen");
            }
        }
    };

    //private method to find the right node connection points
    //helper for above
    //"!fromNode.areSiblings(toNode)" is there to prevent sibling nodes whose
    //common parent container is a modulator from
    //trying to connect to each other as modulators (since their parent
    //is a modulator, they are considered modulators too)
    function getNodesToConnect(fromNode, toNode) {
        if (
            fromNode &&
            fromNode.isModulator() &&
            toNode && !fromNode.areSiblings(toNode)
        ) {
            return {
                "from": getNodeToConnect(fromNode, "from"),
                "to": getNodeToConnectToModulator(toNode, fromNode.isModulatorType())
            };
        } else {
            return {
                "from": getNodeToConnect(fromNode, "from"),
                "to": getNodeToConnect(toNode, "to")
            };
        }
    }

    //returns the right node for a connection
    //helper for above
    function getNodeToConnect(node, whichNode) {
        if (node) {
            var rawNode = node.getNativeNode();
            if (__.isArr(rawNode)) {
                //in a macro connections are made with the first and last node in the macro.
                //tbd - support a way to designate connection nodes
                rawNode = (whichNode === "from") ? getRawNode(rawNode,(rawNode.length - 1)) : getRawNode(rawNode,0);
            }
            return rawNode;
        } else {
            return null;
        }
    }

    //recursive method extract the raw node
    function getRawNode(node,position) {
        if(__.isArr(node)) {
            var pos = !position ? 0 : node.length-1;
            return getRawNode(node[position],pos);
        } else {
            return node;
        }
    }

    //private method that returns the correct audio param to connect a modulator to.
    //helper for above
    function getNodeToConnectToModulator(node, property) {
        if (node) {
            var rawNode = node.getNativeNode(),
                resolvedProperty = property;
            if (__.isArr(rawNode)) {
                for (var i = 0; i < rawNode.length; i++) {
                    resolvedProperty = resolveParamMapping(
                        property,
                        getNodeWithUUID(rawNode[i].uuid).getParamMapping()
                    ).path.replace(".value", "");
                    if (__.isNotUndef(rawNode[i][resolvedProperty])) {
                        rawNode = rawNode[i][resolvedProperty];
                        break;
                    }
                }
            } else {
                resolvedProperty = resolveParamMapping(
                    property,
                    node.getParamMapping()
                ).path.replace(".value", "");
                rawNode = rawNode[resolvedProperty] ? rawNode[resolvedProperty] : null;
            }
            return rawNode;
        } else {
            return null;
        }
    }
}

/**
 * #Controlling#
 *
 * Methods for controlling nodes
 */

/**
 * Calls start() on the currently selected nodes. Throws no error if there aren't any selected nodes with a start method
 * <pre><code>//create and connect sine->lowpass->dac
 * __().sine().lowpass().dac();
 * //start the sine node
 * __("sine").start();</code></pre>
 *
 * [See more control examples](examples/control.html)
 * @memberof cracked
 * @name cracked#start
 * @category Control
 * @function
 * @public
 */
cracked.start = function () {

    //workaround for https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
    if(_context.state === 'suspended') {
        _context.resume().then(function() {
            _start();
        });
    } else {
        _start();
    }

    function _start() {
        if (!recordingMacro()) {
            for (var i = 0; i < _selectedNodes.length; i++) {
                var currNode = getNodeWithUUID(_selectedNodes[i]);
                if (currNode && !currNode.getIsPlaying()) {
                    currNode.start();
                }
            }
        }
    }

    return cracked;
};

/**
 * Calls stop() on the currently selected nodes. Throws no error if there are no selected nodes that have a stop method.
 * <pre><code>//create and connect sine->lowpass->dac
 * __().sine().lowpass().dac();
 * //stop the sine node
 * __("sine").stop();</code></pre>
 *
 * [See more control examples](examples/control.html)
 * 
 * @memberof cracked
 * @name cracked#stop
 * @category Control
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
 * Public method to ramp a parameter on currently selected nodes. Target & timeToRamp parameters can be numbers or arrays of numbers for multisegement ramps. Initial value param is optional, if omitted, then the current value is used as the initial value. If loop is running, then ramp start times are snapped to the sequencer grid.
 * <pre><code>//create and connect sine->lowpass->dac & play
 * __().sine().lowpass().dac().play();
 * //ramp the frequency of the sine. 220 to 880 in 5 seconds
 * __("sine").ramp(880,5,"frequency",220);</code></pre>
 *
 * [See more envelope examples](examples/envelopes.html)
 *
 * @function
 * @memberof cracked
 * @name cracked#ramp
 * @public
 * @category Control
 * @param {Number|Array} target value to ramp to
 * @param {Number|Array} timeToRamp length of ramp in seconds
 * @param {String} paramToRamp name of parameter to ramp
 * @param {Number} initial value to start the ramp at
 * @param {String} type of ramp, "exp" is exponential. defaults to linear.
 *
 */
cracked.ramp = function (target, timeToRamp, paramToRamp, initial, type) {

    //helper function to get param mapping
    var mapParam = function (node,param) {
        var mappingResult = "";
        if(node.getParamMapping) {
            var mapping = node.getParamMapping() || {};
            mappingResult = mapping[param] || "";
            //strip off .value
            if(mappingResult.indexOf(".")!==-1) {
                mappingResult = mappingResult.split(".")[0];
            }
        }
        return mappingResult;
    };

    //loop over selected nodes
    for (var i = 0; i < _selectedNodes.length; i++) {

        var currNode = getNodeWithUUID(_selectedNodes[i]);
        var native = currNode.isMacro() ? currNode.getNativeNode() : [currNode.getNativeNode()];
        var mappedParam = "";
        for(var z=0;z<native.length;z++) {
            var nativeWrapper = getNodeWithUUID(native[z].uuid);
            if(nativeWrapper) {
                mappedParam = mapParam(nativeWrapper,paramToRamp);
                if(mappedParam) {
                    break;
                }
            }
        }

        if (currNode) {
            currNode.ramp(target, timeToRamp, (mappedParam || paramToRamp), null, initial, type);
        }
    }
    return cracked;
};

/**
 * Set or get attribute values on a node. Takes an object with
 * any number of key:value pairs to set. A string with the param
 * name returns the current value of that param on the first selected
 * node.
 *
 * <pre><code>//create and connect sine->lowpass->dac & play
 * __().sine().lowpass().dac().play();
 * //set the frequency of the sine to 880
 * __("sine").attr({"frequency":880});
 *
 * //get the frequency
 * __("sine").attr("frequency"); //880</code></pre>
 *
 * [See more control examples](examples/control.html)
 *
 * @function
 * @memberof cracked
 * @name cracked#attr
 * @public
 * @category Control
 * @param {Object} userParams options object
 * @param {String} userParams.paramName
 * @param {} userParams.paramValue
 * @param {String} userParams
 *
 */
cracked.attr = function (userParams) {
    if(typeof userParams === "object") {
        for (var i = 0; i < _selectedNodes.length; i++) {
            var currNode = getNodeWithUUID(_selectedNodes[i]);
            if (currNode && userParams) {
                currNode.attr(userParams);
            }
        }
    } else if (typeof userParams === "string" && _selectedNodes.length && getNodeWithUUID(_selectedNodes[0])){
        return getNodeWithUUID(_selectedNodes[0]).getAttr(userParams);
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
 * Native channelMerger
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#channelMerger
 * @public
 * @param {Object} [userParams] map of optional values
 */
cracked.channelMerger = function (userParams) {

    if(_maxChannelCount > 2) {
        _context.destination.channelCount = _maxChannelCount;
        _context.destination.channelCountMode = "explicit";
        _context.destination.channelInterpretation = "discrete";
    }

    var channels = __.isNum(userParams) ? userParams : (__.isObj(userParams) && userParams.channels) ? userParams.channels : _context.destination.maxChannelCount;
    var creationParams = {
        "method": "createChannelMerger",
        "methodParams":[channels],
        "settings": {
            channelCount:1,
            channelCountMode:"explicit",
            channelInterpretation:"discrete"
        }
    };
    createNode("channelMerger", creationParams, userParams);
    return cracked;
};

/**
 * Native channelSplitter
 * @function
 * @category Node
 * @memberof cracked
 * @name cracked#channelSplitter
 * @public
 * @param {Object} [userParams] map of optional values
 */
cracked.channelSplitter = function (userParams) {
    userParams = userParams || 2;
    var channels = __.isNum(userParams) ? userParams : (__.isObj(userParams) && userParams.channels) ? userParams.channels : 2;
    var creationParams = {
        "method": "createChannelSplitter",
        "methodParams":[channels],
        "settings": {}
    };
    createNode("channelSplitter", creationParams, userParams);
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
            "end": "loopEnd",
            "duration":"buffer.duration"
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

/**
 * #Sequencing#
 */

/**
* vars for loop
* @type {boolean}
* @private
*/

var _isLoopRunning = false,
    _ignoreGrid = true,
    _loopStepSize = 0,
    _loopInterval = 100,
    _loopCB = null,
    _loopData = [],
    _loopIndex = -1,
    _loopCount = 0,
    _loopListeners = [],
    _loopTimeToNextStep = 0,
    _loopTolerance = 0.30,
    _timerWorker = null;     // The Web Worker used to fire timer messages

/**
 * main method for loop
 *
 * <pre><code>//configure the loop: 8 steps, 100ms between steps
 * __.loop({steps:8,interval:100});
 *
 * //start
 * __.loop("start");
 * //stop
 * __.loop("stop");
 * //reset the loop params
 * __.loop("reset");</code></pre>
 *
 * [See sequencing examples](examples/sequencing.html)
 *
 * @public
 * @memberof cracked
 * @category Sequence
 * @name cracked#loop
 * @function
 * @param {String} [arg] stop/start/reset commands
 * @param {Object} [config] configuration object
 * @param {Number} [config.interval=100] step length in ms
 * @returns {cracked}
 */
cracked.loop = function () {
    if (arguments && arguments.length) {
        if (arguments[0] === "stop") {
            stopLoop();
        } else if (arguments[0] === "start") {
            startLoop();
        } else if (arguments[0] === "reset") {
            resetLoop();
        } else if (arguments[0] === "toggle_grid") {
            toggleGrid();
        } else if (arguments.length === 3 && __.isObj(arguments[0]) && __.isFun(arguments[1])  && __.isArr(arguments[2])) {
            //configure loop with options
            //set data & callback
            configureLoop(arguments[0], arguments[1], arguments[2]);
        } else if(arguments.length === 1 && __.isNum(arguments[0])) {
            //tempo only
            configureLoop(arguments[0]);
        } else if(arguments.length === 1 && __.isObj(arguments[0])) {
            //just an options object
            configureLoop(arguments[0]);
        } else if(arguments.length === 2 && __.isNum(arguments[0]) && __.isFun(arguments[1])) {
            //configure loop
            configureLoop({interval:arguments[0]}, arguments[1], []);
        } else if(arguments.length === 3 && !arguments[0] && !arguments[1] && __.isArr(arguments[2])) {
			//configure data
	        configureLoop(arguments[0], arguments[1], arguments[2]);
		}
    }
    return cracked;
};

/**
* Toggles the state of the _ignoreGrid variable
* @private
*/
function toggleGrid() {
    if (_isLoopRunning) {
        _ignoreGrid = !_ignoreGrid;
    }
}

/**
* Get the millisecond value for setting timeout
* @private
*/
function calculateTimeout() {
    return __.sec2ms(_loopTimeToNextStep  - _context.currentTime - (__.ms2sec(_loopInterval * _loopTolerance)));
}

/**
* Starts the loop
* @private
*/
function startLoop() {
    if (!_isLoopRunning) {
        _loopInit();
        _loopTimeToNextStep = _context.currentTime + (_loopInterval / 1000);
        _isLoopRunning = true;
        _ignoreGrid = false;
        if(_timerWorker) {
            _timerWorker.postMessage("start");
        }
    }
}

/**
* Stops the loop
* @private
*/
function stopLoop() {
    if (_isLoopRunning) {
        _isLoopRunning = false;
        _loopTimeToNextStep = 0;
        _ignoreGrid = true;
        if(_timerWorker) {
            _timerWorker.postMessage("stop");
        }
    }
}

/**
* Resets the loop to defaults
* @private
*/
function resetLoop() {
    _loopStepSize = 0;
    _loopInterval = 100;
    _ignoreGrid = true;
    _loopCB = null;
    _loopData = [];
    _loopListeners = [];
    _loopIndex = -1;
    _loopCount = 0;
    _isLoopRunning = false;
    _loopTimeToNextStep = 0;
}

/**
* configure the loop options
* @param {Object} opts configuration object
* @param {Function} fn global callback
* @param {Array} data array of data to be passed to the global callback
* @private
*/
function configureLoop(opts, fn, data) {
    if (opts && __.isObj(opts)) {
        //step size is determined by data length now
        //_loopStepSize = opts.steps ? opts.steps : data && data.length ? data.length : 0;
        _loopInterval = opts.interval || 200;
    } else if(opts && __.isNum(opts) && !fn && !data) {
        //just configuring tempo only
        _loopInterval = opts;
    }
    if (__.isFun(fn)) {
        _loopCB = fn;
    }
    if (__.isArr(data)) {
        _loopData = data;
        _loopStepSize = data.length;
    } else {
        _loopData = [];
    }
}

/**
* called by setInterval - sets the time to next step
* @private
*/
function checkup() {
    if (_isLoopRunning) {
        var now = _context.currentTime,
            loopIntervalInSecs = __.ms2sec(_loopInterval),
            timeAtPreviousStep = _loopTimeToNextStep - loopIntervalInSecs;
        if (now < _loopTimeToNextStep && now > timeAtPreviousStep) {
            loopStep();
            _loopTimeToNextStep += loopIntervalInSecs;
        } else if (now > _loopTimeToNextStep) {
            //we dropped a frame
            _loopTimeToNextStep += loopIntervalInSecs;
        }
    }
}

/**
* call on every step
* @private
*/
function loopStep() {

    //globals- tbd deprecate. step size should just be based on available data
    if(_loopStepSize) {
        //if a step size is configured globally, increment the index
        _loopIndex = (_loopIndex < (_loopStepSize - 1)) ? _loopIndex + 1 : 0;
    }
    //global callback
    if (__.isFun(_loopCB)) {
        _loopCB(_loopIndex, cracked.ifUndef(_loopData[_loopIndex], null), _loopData, ++_loopCount);
    }

    //loop thru any bound step event listeners
    for (var i = 0; i < _loopListeners.length; i++) {
        var listener = _loopListeners[i],
            tmp = _selectedNodes,
            index = listener.loopIndex,
            stepSize = listener.loopStepSize,
            data = listener.data,
            count = ++listener.count;

        //if step size not configured globally
        listener.loopIndex = (index < (stepSize - 1)) ? index + 1 : 0;

        //load up the selected nodes for this listener
        _selectedNodes = listener.selection;

        //run the callback
        listener.callback(listener.loopIndex, cracked.ifUndef(data[listener.loopIndex], null), data, count);

        //put the nodes back in place
        _selectedNodes = tmp;
    }
}

function _loopInit() {
    //based on https://github.com/cwilso/metronome, thanks Chris Wilson!
    //prepare worker blob
    var jstext = 'var timerID=null,interval=100;self.onmessage=function(a){"start"==a.data?timerID=setInterval(function(){postMessage("tick")},interval):a.data.interval?(interval=a.data.interval,timerID&&(clearInterval(timerID),timerID=setInterval(function(){postMessage("tick")},interval))):"stop"==a.data&&(clearInterval(timerID),timerID=null)};';
    var blob = new Blob([jstext]);
    var blobURL = window.URL.createObjectURL(blob);

    //make worker
    _timerWorker = new Worker(blobURL);

    //setup method for communicating w/ worker
    _timerWorker.onmessage = function(e) {
        if (e.data === "tick") {
            checkup();
        } else {
            console.error("message: " + e.data);
        }
    };
    //set the worker interval
    _timerWorker.postMessage({"interval":calculateTimeout()});
}


/**
 * Listener - binds a set of audio nodes and a callback to loop step events
 * @public
 * @category Sequence
 * @memberof cracked
 * @name cracked#bind
 * @function
 * @param {String} eventType currently just "step"
 * @param {Function} fn callback to be invoked at each step
 * @param {Array} data should the same length as the number of steps
 * @returns {cracked}
 */
cracked.bind = function (eventType, fn, data) {
    if (eventType === "step" && __.isFun(fn)) {
        _loopListeners.push({
            eventType: eventType,
            callback: fn,
            data: data || [],
            loopStepSize : data.length || 0,
            loopIndex : -1,
            selection: _selectedNodes.slice(0),
            selector: _currentSelector,
            count:0
        });
    }
    return cracked;
};

/**
 * Remove any steps listeners registered on these nodes
 * @public
 * @category Sequence
 * @memberof cracked
 * @function
 * @name cracked#unbind
 * @param {String} eventType
 */
cracked.unbind = function (eventType) {
    if (eventType === "step") {
        var tmp = [];
        _loopListeners.forEach(function (el, i, arr) {
            if (_currentSelector !== el.selector) {
                tmp.push(el);
            }
        });
        _loopListeners = tmp;
    }
};

/**
 * #Model#
 */

/**
* Resets Model
* @param node
* @private
*/
function resetModel() {
    _nodeStore = {};
    _nodeLookup = {};
}

/**
* Squirrel away nodes for winter
* @param node
* @private
*/
function saveNode(node) {
    updateMacro(node);
    setNode(node);
    setNodeLookup(node);
}

/**
* add node to the master list
* @param node
* @private
*/
function setNode(node) {
    _nodeStore[node.getUUID()] = node;
}

/**
* save node for lookup table setting references using node type,
* class & id. tbd - fix bug - when saving node must walk up the
* macro array to get the complete namespace #11
* @param node
* @private
*/
function setNodeLookup(node) {
    var params = node.getParams().settings;
    var prefix = getCurrentMacroNamespace();
    var selector_array = [];
    if (__.isObj(params)) {
        for (var x in params) {
            if (x === "id") {
                selector_array.push((prefix + "#" + params[x]));
                setter(_nodeLookup, (prefix + "#" + params[x]), node.getUUID());
            } else if (x === "class") {
                var classArr = params[x].split(",");
                classArr.forEach(function () {
                    selector_array.push((prefix + "." + params[x]));
                    setter(_nodeLookup, (prefix + "." + params[x]), node.getUUID());
                });
            }
        }
    }
    selector_array.push("*");
    setter(_nodeLookup, "*", node.getUUID()); //everything
    selector_array.push((prefix + node.getType()));
    setter(_nodeLookup, (prefix + node.getType()), node.getUUID());
    node.selector_array = selector_array;
}

/**
* remove nodes from the model
* @param nodes to remove. optional. if not
* supplied currently selected nodes are used.
* @private
*/
function removeModelReferences(nodes) {
    var nodesToRemove = nodes || _selectedNodes;
    nodesToRemove.forEach(removeReferences);
    function removeReferences(node) {
        var uuid = node;
        node = getNodeWithUUID(uuid);
        if(node) {
            var arr = node.selector_array;
            if(__.isArr(arr)) {
                arr.forEach(function(selector){
                    unsetter(_nodeLookup,selector,uuid);
                    unsetter(_nodeStore,uuid,null);
                });
            }
            if(node.isMacro()) {
                var natives = node.getNativeNode();
                natives.forEach(function(nativeNode){
                    removeReferences(nativeNode.uuid);
                });
            }
        }
    }
}

/**
* remove references to selected nodes tbd - need to do this for
* * real works ok right now for top level macros
* @private
*/
cracked.removeMacros = function () {
    var arr = _currentSelector.split(",");
    //iterate over selectors
    for (var i = 0; i < arr.length; i++) {
        //if we have a top level match
        if (_nodeLookup[arr[i]]) {
            var keyArr = Object.keys(_nodeLookup);
            for (var j = 0; j < keyArr.length; j++) {
                var re = new RegExp(arr[i] + "\\s*");
                //get all the child nodes of this macro
                if (keyArr[j].match(re)) {
                    var tmp = _nodeLookup[keyArr[j]];
                    for (var k = 0; k < tmp.length; k++) {
                        delete _nodeStore[[keyArr[j]][k]];
                        var index = _nodeLookup["*"].indexOf(_nodeLookup[keyArr[j]][k]);
                        if (index > -1) {
                            _nodeLookup["*"].splice(index, 1);
                        }
                    }
                    delete _nodeLookup[keyArr[j]];
                }
            }
        }
    }
};

/**
* get node with a uuid returns a AudioNode instance
* says uuid but actually works with a variety of input
* tbd - refactor this to getNode() or something
* @private
* @param {*} uuid
* @returns {*}
*/
function getNodeWithUUID(uuid) {
    if (uuid && _nodeStore[uuid]) {
        return _nodeStore[uuid];
    } else if (
        uuid && __.isObj(uuid) &&
        uuid.constructor.name === "AudioNode"
    ) {
        //its already an audio node so just return it
        return uuid;
        //its the raw node so fetch the wrapper and return it
    } else if (__.isObj(uuid) && __.isNotUndef(uuid.uuid)) {
        return getNodeWithUUID(uuid.uuid);
    } else {
        return null;
    }
}

/**
* get node reference, supports comma delimited selectors node
* type, id or class returns array of node ids
* @param {String} selector
* @returns {Array}
* @private
*/
function getNodesWithSelector(selector) {
    var selector_array = selector.split(","),
        nodes = [];
    selector_array.forEach(function (currSelector, i, array) {
        if (currSelector && _nodeLookup[currSelector]) {
            var tmp = _nodeLookup[currSelector];
            //if id then just return the first in the array
            tmp = (
                getSelectorType(currSelector) === "id" &&
                __.isArr(tmp) &&
                tmp.length > 1
            ) ? [tmp[0]] : tmp;
            //dedupe
            nodes = arrayUnique(nodes.concat(tmp));
        }
    });
    return nodes;
}

/**
* Get previous node
* @private
* @returns {*}
*/
function getPreviousNode() {
    return _previousNode;
}

/**
* Sets previous node
* @private
* @param {Object} node
*/
function setPreviousNode(node) {
    if (node) {
        _previousNode = node;
    }
}

/**
* Returns selector type: class, id or type
* @private
* @param {String} str
* @returns {string}
*/
function getSelectorType(str) {
    return str.match(/^\./) ? "class" : str.match(/^\#/) ? "id" : "type";
}

/**
 * #Macro#
 *
 * Macro support
 *
 */

/**
 * start macro recording, add any user parameters (id,classname,etc) to the container macro
 * <pre><code>//define a simple macro named "microsynth"
 * __().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>
 *
 * @memberof cracked
 * @category Macro
 * @name cracked#begin
 * @public
 * @function
 * @param {String} name macro name
 * @param {Object} userParams options object
 */
cracked.begin = function (name, userParams) {
    if (name) {
        _currentMacro.push(createMacro(name, userParams));
    }
    return cracked;
};

/**
 * end macro recording
 * <pre><code>//define a simple macro named "microsynth"
 * __().begin("microsynth").sine().gain(0).dac().end("microsynth");</code></pre>
 *
 * @memberof cracked
 * @category Macro
 * @name cracked#end
 * @public
 * @function
 * @param {String} name macro name
 */
cracked.end = function (name) {
    if (
        recordingMacro() &&
        getCurrentMacro().getType() === name
    ) {
        getCurrentMacro().setMacroNameSpace(getCurrentMacroNamespace());
        _currentMacro.pop();
    }
    return cracked;
};

/**
* create the macro container node
* @function
* @private
*/
function createMacro(name, userParams) {
    //tbd - macro needs its own class
    return createNode(name, {
        method: "createMacro",
        settings: {}
    }, userParams);
}

/**
* method that updates the current macro
* container with nodes as they are created
* @function
* @private
*/
function updateMacro(node) {
    if (recordingMacro()) {
        node.setMacroContainerUUID(getCurrentMacro().getUUID());
        getCurrentMacro().addNativeNode(node.getNativeNode());
    }
}

/**
* are we currently recording a macro? returns boolean
* @function
* @private
*/
function recordingMacro() {
    return !!_currentMacro.length;
}

/**
* returns the current macro if there is one
* @function
* @private
*/
function getCurrentMacro() {
    if (recordingMacro()) {
        return _currentMacro[_currentMacro.length - 1];
    } else {
        return null;
    }
}

/**
* walks the currentMacro stack and returns a
* str with the current namespace
* @function
* @private
* @return {String} namespace
*/
function getCurrentMacroNamespace() {
    var arr = [],
        space = " ";
    if (recordingMacro()) {
        for (var i = 0; i < _currentMacro.length; i++) {
            arr.push(_currentMacro[i].getType());
            arr.push(space);
        }
    }
    return arr.join("");
}

/**
* resets the current Macro;
* @function
* @private
*/
function resetMacro() {
    _currentMacro = [];
}

/**
 * #Midi#
 */

/**
 * vars for midi
 * @type {Object}
 * @private
 */
var _midi_access = null,
    _midi_inputs = null,
    _midi_outputs = null,
    _midi_callbacks = {noteon:function(){},noteoff:function(){},control:function(){}},
    _midi_noteons = {};

/**
 * Is midi supported?
 * <pre><code>if(__.midi_supported()) {
 *      //do midi stuff here
 *      //cuz you can
 * }</code></pre>
 * @public
 * @category Midi
 * @memberof cracked
 * @function
 * @name cracked#midi_supported
 * @returns {boolean}
 */
cracked.midi_supported = function(){
    return typeof navigator.requestMIDIAccess === "function";
};

/**
 * Initialize midi. Callback is invoked when ready.
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //...call this function
 * });</code></pre>
 * @param {Function} callback
 * @memberof cracked
 * @name cracked#midi_init
 * @public
 * @category Midi
 * @function
 */
cracked.midi_init = function(callback) {
    if(_midi_access) {
        //midi already initialized
        callback.apply(cracked,[true]);
    } else if(__.midi_supported()) {
        navigator.requestMIDIAccess().then( function(access) {
            _midi_access = access;
            _midi_inputs = access.inputs; // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
            _midi_outputs = access.outputs; // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators
            callback.apply(cracked,[true]);
        }, function( err ) {
            console.error( "midi_init: Initialization failed. Error code: " + err.code );
            callback.apply(cracked,[false]);
        } );
    } else {
        console.error("midi_init: Failed. Midi not supported by your browser");
        callback.apply(cracked,[false]);
    }
};

/**
 * Midi input. Bind handler for the onMIDIMessage event.
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      __.midi_receive(function(midiEvent){
 *          //handle incoming raw midi events here...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @memberof cracked
 * @name cracked#midi_receive
 * @public
 * @category Midi
 * @function
 */
cracked.midi_receive = function(callback){
    if(_midi_access) {
        var fun = __.isFun(callback) ? callback : function(){};
        var inputs = _midi_inputs.values();
        // loop over all available inputs and listen for any MIDI input
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            // each time there is a midi message call the onMIDIMessage function
            input.value.onmidimessage = function(ev){
                if(ev.data) {

                    //data
                    var status=ev.data[0],
                        pitch=ev.data[1],
                        velocity=ev.data[2],
                        note_data = [status,pitch,velocity];

                    //general midi receive
                    fun(ev);

                    //note on/off/control methods
                    switch(status) {
                        case 144:
                            if(velocity > 0) {
                                if(!_midi_noteons[pitch]) {
                                    _midi_noteons[pitch]=pitch;
                                    _midi_callbacks.noteon(note_data);
                                }
                            } else {
                                _midi_callbacks.noteoff(note_data);
                                delete _midi_noteons[pitch];
                            }
                            break;
                        case 128:
                            _midi_callbacks.noteoff(note_data);
                            delete _midi_noteons[pitch];
                            break;
                        case 176:
                            _midi_callbacks.control(note_data);
                            break;
                    }
                }
            };
        }
    } else {
        console.error("midi_receive: midi not available");
    }
};

/**
 * Midi input. Shorthand binding for note ons
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi noteon events
 *      __.midi_noteon(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi note ons...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_noteon
 * @function
 */
cracked.midi_noteon = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteon = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for note offs
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi noteoff events
 *      __.midi_noteoff(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi note offs...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_noteoff
 * @function
 */
cracked.midi_noteoff = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteoff = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for midi control messages
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi control events
 *      __.midi_control(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi control events...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_control
 * @function
 */
cracked.midi_control = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.control = callback;
        cracked.midi_receive();
    }
};



/**
 * #Connecting#
 * Methods for connecting and removing nodes
 *
 */

/**
 * chainable method to connect nodes to previously instantiated nodes. Takes a selector to find the nodes to connect to.
 * <pre><code>//create and connect sine->lowpass->dac
 * __().sine().lowpass().dac();
 * //create a sawtooth and connect to the lowpass instantiated above
 * __().saw().connect("lowpass");</code></pre>
 *
 * @public
 * @category Connect
 * @memberof cracked
 * @name cracked#connect
 * @function
 * @param {String} selector selector expression
 * @return cracked
 */
cracked.connect = function () {
    //save a copy of previous node
    var tmp = getPreviousNode();
    //if we're arriving directly from find()
    if (!tmp && _selectedNodes.length) {
        //overwrite the previous node with a selected node
        tmp = getNodeWithUUID(_selectedNodes[0]);
        //tbd - this should work w the entire selectednodes array
    }
    find(arguments[0]);
    //find() resets the previous node to null.
    //it's needed however in connectPreviousToSelected()
    //so restore it with one from _selectednodes we stored in tmp.
    setPreviousNode(tmp);
    //do the connection
    connectPreviousToSelected();
    return cracked;
};

/**
 * helper for connect method above
 * @function
 * @private
 */
function connectPreviousToSelected() {
    var pNode = getPreviousNode();
    _selectedNodes.forEach(function (node, i, array) {
        node = getNodeWithUUID(node);
        if (node && pNode) {
            pNode.connect(node);
            pNode.pushNextNode(node);
            node.setPrevNode(pNode);
            logConnections(pNode, node);
        }
    });
}

//disconnects and removes all references to selected nodes
/**
 * chainable method to stop, disconnect and remove the currently selected nodes. Takes a time in ms to schedule the node removal.
 * <pre><code>//create and connect sine->lowpass->dac
 * __().sine().lowpass().dac();
 * //remove the lowpass instantiated above in 100ms
 * __("lowpass").remove(100);</code></pre>
 *
 * @public
 * @category Connect
 * @memberof cracked
 * @name cracked#remove
 * @function
 * @param {Number} time in ms to schedule node removal
 * @return cracked
 */
cracked.remove = function(time) {
    var nodesToRemove = _selectedNodes.slice();
    var when = __.isNum(time) ? time : 0;

    if(when) {
        setTimeout(function(){
            _remove(nodesToRemove);
        },when);
    } else {
        _remove(nodesToRemove);
    }

    function _remove(nodes) {
        nodes.forEach(function (node, i, array) {
            node = getNodeWithUUID(node);
            if (node) {
                node.stop();
                node.disconnect();
            }
        });
        removeModelReferences(nodes);
    }
};

/**
* flatten multidimensional arrays
* @private
* @param {Array} a
* @param {Array} r
* @returns {*|Array} 
*/
function flatten(a, r) {
    //http://stackoverflow.com/questions/10865025/merge-flatten-an-array-of-arrays-in-javascript
    r = r || [];
    for (var i = 0; i < a.length; i++) {
        if (a[i].constructor === Array) {
            flatten(a[i], r);
        } else {
            r.push(a[i]);
        }
    }
    return r;
}

/**
* Dedupe array
* @private
* @param {Array} array
* @returns {*|Array|string}
*/
function arrayUnique(array) {
    var a = array.concat();
    for (var i = 0; i < a.length; ++i) {
        for (var j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) {
                a.splice(j--, 1);
            }
        }
    }
    return a;
}

/**
* get unique id
* @private
* @returns {string}
*/
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
* helper function to set values in a map
* @param {Object} map
* @param {string} key
* @param {*} value
* @private
*/
function setter(map, key, value) {
    if (map && key) {
        if (map[key] && map[key].push) {
            map[key].push(value);
        } else {
            map[key] = [value];
        }
    }
}

/**
* helper function to remove values in a map
* @param {Object} map
* @param {string} key
* @param {*} value
* @private
*/
function unsetter(map, key, value) {
    if(__.isNotUndef(map[key])) {
        if(__.isArr(map[key])) {
            map[key] = map[key].filter(function(val){
                return value !== val;
            });
            if(map[key].length===0) {
                delete map[key];
            }
        } else {
            delete map[key];
        }
    }
}

/**
* adds and overwrites properties from the src obect to the target object
* @private
* @param source
* @param target
* @returns {*|{}}
*/
function mergeObjects(source, target) {
    source = source || {};
    target = target || {};
    for (var x in source) {
        if (source.hasOwnProperty(x)) {
            target[x] = source[x];
        }
    }
    return target;
}

// Development/Debug
/**
 * @description Debug
 */

/**
 * log selected nodes to console if any.
 * <pre><code>//create and connect sine -> lowpass -> dac
 * __().sine().lowpass().dac();
 *
 * //logs the [oscillatorNode] object to the console
 * __("sine").log()</code></pre>
 *
 * @memberof cracked
 * @category Debug
 * @name cracked#log
 * @public
 * @function
 */
cracked.log = function () {
    var arr = [];
    logNodes(null, arr);
    console.log(arr);
};

/**
 * helper for above
 * @private
 * @param node
 * @param arr
 */
function logNodes(node, arr) {
    if (_currentSelector) {
        var nodes = arr || [];
        var selectedNodes = node || _selectedNodes;
        selectedNodes.forEach(function (nodeID, i, array) {
            var tmp = getNodeWithUUID(nodeID).getNativeNode();
            //recurse thru the node array if its a macro
            if (__.isArr(tmp)) {
                logNodes(tmp, nodes);
            }
            //if we're in outer loop, add to the output array
            if (array === _selectedNodes) {
                nodes.push(tmp);
            }
        });
    }
}

/**
 * return the length of selected nodes array
 * <pre><code>//create and connect sine -> lowpass -> dac
 * __().sine().lowpass().dac();
 *
 * //returns 2
 * __("sine,lowpass").size();</code></pre>
 *
 * @memberof cracked
 * @name cracked#size
 * @category Debug
 * @public
 * @function
 * @returns {Number}
 */
cracked.size = function () {
    if (_selectedNodes.length) {
        return _selectedNodes.length;
    } else {
        return 0;
    }
};

//turn on debug flag when the url param is appended
(function () {
    if (window.location.href.indexOf("debug=true") !== -1) {
        _debugEnabled = true;
    }
})();

/**
 * print a ton of shit to the console
 * @private
 * @param msg
 */
function logToConsole(msg) {
    if (_debugEnabled) {
        console.log(msg);
    }
}

/**
 * dump the node lookup object to the console
 * works in debug only
 * @memberof cracked
 * @category Debug
 * @name cracked#_dumpState
 * @public
 * @function
 */
cracked._dumpState = function () {
    console.log(_nodeLookup,_nodeStore);
};

/**
 * debug method to get a node with a uuid
 * works in debug only
 * @param uuid
 * @category Debug
 * @returns {*}
 * @public
 * @function
 * @memberof cracked
 * @name cracked#_getNode
 */
cracked._getNode = function (uuid) {
    return (getNodeWithUUID(uuid));
};

/**
 * log connections
 * @param nodeToConnect
 * @param node
 * @private
 */
function logConnections(nodeToConnect, node) {

    var vals = [
        nodeToConnect.getType(),
        nodeToConnect.getID(),
        node.getType(),
        node.getID()
    ];

    logToConsole("connected " + vals[0] + " - " + vals[1] + " to " + vals[2] + " - " + vals[3]);
}


//set the global entry points
window.cracked = cracked;
window.__ = window.__ || cracked;

/**
 * Returns the 2nd argument if the 1st is undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#ifUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 * @param {*} def default value to return if test is undefined
 */
cracked.ifUndef = function(test, def) {
    return typeof test === "undefined" ? def : test;
};

/**
 * Returns true if not undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#isNotUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 */
cracked.isNotUndef = function(test) {
    return typeof test !== "undefined";
};

/**
 * Returns true if undefined
 * @plugin
 * @category Type
 * @function
 * @name cracked#isUndef
 * @memberof cracked
 * @param {*} test thing to test for undefined
 */
cracked.isUndef = function(test) {
    return typeof test === "undefined";
};

/**
 * Returns true if param is an object
 * @plugin
 * @category Type
 * @function
 * @name cracked#isObj
 * @memberof cracked
 * @param {*} obj thing to test
 */
cracked.isObj = function(obj) {
    return obj && typeof obj === "object";
};

/**
 * Returns true if param is a number
 * @plugin
 * @category Type
 * @function
 * @name cracked#isNum
 * @memberof cracked
 * @param {*} num thing to test
 */
cracked.isNum = function(num) {
    if (num === null || num === "" || typeof num === "undefined") {
        return false;
    } else {
        return !isNaN(num);
    }
};

/**
 * Returns true if param is a string
 * @plugin
 * @category Type
 * @function
 * @name cracked#isStr
 * @memberof cracked
 * @param {*} str thing to test
 */
cracked.isStr = function(str) {
    return str && typeof str === "string";
};

/**
 * Returns true if param is an array
 * @plugin
 * @category Type
 * @function
 * @name cracked#isArr
 * @memberof cracked
 * @param {*} arr thing to test
 */
cracked.isArr = function(arr) {
    return arr && arr instanceof Array;
};

/**
 * Returns true if param is a function
 * @plugin
 * @category Type
 * @function
 * @name cracked#isFun
 * @memberof cracked
 * @param {*} fn thing to test
 */
cracked.isFun = function(fn) {
    return fn && fn instanceof Function;
};

/**
 * execute a callback at random intervals within a range
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#random_interval
 * @public
 * @param {Function} callback to be invoked at every interval
 * @param {Number} minTime minimum value for the random interval
 * @param {Number} maxTime maximum value for the random interval
 */
cracked.random_interval = function(callback, minTime, maxTime) {

    function set_timeout(callback, minTime, maxTime,ran) {
        var nextRan = cracked.random(minTime, maxTime);
        setTimeout(function(){
            callback(nextRan);
            set_timeout(callback, minTime, maxTime,nextRan);
        },ran);
    }

    if(typeof callback === "function" && __.isNum(minTime) && __.isNum(maxTime)) {
        set_timeout(callback, minTime, maxTime,cracked.random(minTime, maxTime));
    }

};

/**
 * create a adsr envelope with random values scaled to a length
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#random_envelope
 * @public
 * @param {Number} length in sec
 * @returns {Array}
 */
cracked.random_envelope = function(length) {

    var result = [];

    if(__.isNum(length)) {

        var tmp = __.fill_array(4,function(){
            return __.random(0,100);
        });

        var sum = tmp.reduce(function(a, b) {
            return a + b;
        });

        var factor = (length/sum);

        result = tmp.map(function(element,index){
            return element*factor;
        });
    }

    return result;
};

/**
 * fill an array with some values
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#fill_array
 * @public
 * @param {Number} size of the array to be filled
 * @param {Function} fn to provide the value, if absent then array is filled with 0's.
 * @returns {Array}
 */
cracked.fill_array = function(size,fn) {
    var tmp = [];
    if(__.isNum(size)) {
        var fun = __.isFun(fn) ? fn : function(){return 0;};
        for(var i=0;i<size;i++) {
            tmp.push(fun.apply(this,[i]));
        }
    }
    return tmp;
};

/**
 * advance thru array one step at a time.
 * start over when arriving at the end
 * @param {Array} arr to loop over
 * @param {Number} offset added to index
 * @param {Number} limit upper bound to iteration
 * @param {Function} callback invoked when the count resets
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#array_next
 * @public
 */

cracked.array_next = function(arr,offset,limit,callback) {
    offset = offset || 0;
    limit = limit || arr.length;
    var adjusted_limit = Math.min(limit,arr.length);
    var adjusted_offset = Math.min(offset,adjusted_limit-1);
    var old_index = arr.current_index = __.ifUndef(arr.current_index,-1);
    arr.current_index = (arr.current_index+1+adjusted_offset) >= adjusted_limit ? 0 : arr.current_index+1;
    if((old_index > arr.current_index) && (typeof callback === "function")) {
        callback();
    }
    return arr[arr.current_index + adjusted_offset];
};

/**
 * Returns a boolean based on percentage.
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#chance
 * @public
 * @param {Number} percentage
 * @returns {boolean}
 */
cracked.chance = function(percentage) {
    return percentage > __.random(0,100);
};

/**
 * Returns a musical scale/mode based on type
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#scales
 * @public
 * @param {String} type scale type
 */
cracked.scales = function (type) {
    return {
        "major": [0, 2, 4, 5, 7, 9, 11],
        "minor": [0, 2, 3, 5, 7, 8, 10],
        "wholetone": [0, 2, 4, 6, 8, 10],
        "overtone": [0, 2, 4, 6, 7, 9, 10],
        "lydian": [0, 2, 4, 6, 7, 9, 11],
        "mixolydian": [0, 2, 4, 5, 7, 9, 10],
        "ionian": [0, 2, 4, 5, 7, 9, 11]
    }[type];
};

/**
 * Returns a musical scale/mode based on type
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#chords
 * @public
 * @param {String} type scale type
 */
cracked.chords = function (type) {
    return {
        "major": [0, 4, 7],
        "minor": [0, 3, 7],
        "seventh": [0, 4, 7, 10],
        "ninth": [0, 4, 7, 10, 14],
        "major_seventh": [0, 4, 7, 11],
        "minor_seventh": [0, 3, 7, 10],
        "suspended": [0, 5, 7],
        "diminished": [0, 3, 6],
        "eleventh": [0, 4, 7, 10, 14, 17],
        "thirteenth": [0, 4, 7, 10, 14, 17, 21]
    }[type];
};

/**
 * Return a random series of frequencies from randomly selected octaves from a given scale
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random_scale
 * @public
 * @param {String} scale
 * @param {Number} octave_lower
 * @param {Number} octave_upper
 */
cracked.random_scale = function (scale,octave_lower,octave_upper) {
    var lower = __.ifUndef(octave_lower,3);
    var upper = __.ifUndef(octave_upper,7);
    return __.pitch2freq(__.scales(scale)[__.random(0,__.scales(scale).length-1)] + __.random(lower,upper) * 12);
};

/**
 * Return a random series of frequencies from a randomly selected octave from a given chord
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random_arpeggio
 * @public
 * @param {String} chord
 * @param {Number} octave_lower
 * @param {Number} octave_upper
 */
cracked.random_arpeggio = function (chord,octave_lower,octave_upper) {
    var lower = __.ifUndef(octave_lower,3);
    var upper = __.ifUndef(octave_upper,7);
    return __.pitch2freq(__.chords(chord)[__.random(0,__.chords(chord).length-1)] + __.random(lower,upper) * 12);
};

/**
 * Takes a reference to an array, shuffles it
 * and returns it
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#shuffle
 * @public
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
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random
 * @public
 * @param {Number} min
 * @param {Number} max
 */
cracked.random = function (min, max) {
    return Math.round(min + Math.random() * (max - min));
};

/**
 * Factory to create a throttling function that returns true when called every nth times
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#throttle_factory
 * @public
 * @param {Number} num
 */
cracked.throttle_factory = function  (num) {
    var index = 0;
    var number = num;
    return function() {
        index++;
        return index % number===0;
    };
};

/**
 * Factory to create a sequencing function that returns true when called every nth times
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#sequence_factory
 * @public
 * @param {Array} arr
 * @param {Function} fn
 */
cracked.sequence_factory = function  (arr,fn) {
    var count = 0;
    var current_index = 0;
    var arr_copy = arr.slice();
    var current_value = arr_copy[current_index];
    var transition = true;
    var first_run = true;
    return function() {
        if(count===current_value) {
            if(current_index===arr_copy.length-1) {
                current_index = 0;
            } else {
                current_index++;
            }
            count = 1;
            transition=true;
            current_value = arr_copy[current_index];
        } else {
            count++;
            transition=first_run||false;
        }
        fn(transition,current_index);
        first_run=false;
    };
};

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

/**
 * Attack Decay Sustain Release envelope
 *
 * [See more adsr examples](examples/envelopes.html)
 *
 * Attack time is the time taken for initial run-up of level from nil to peak, beginning when the key is first pressed.
 * Decay time is the time taken for the subsequent run down from the attack level to the designated sustain level.
 * Sustain level is the level during the main sequence of the sound's duration, until the key is released.
 * Release time is the time taken for the level to decay from the sustain level to zero after the key is released.
 *
 * @plugin
 * @category Envelope
 * @function
 * @memberof cracked
 * @name cracked#adsr
 * @param {Array} [userParams] 5 values: attack,decay,sustain,hold,release
 * @param {Array}  [userParams] 4 values: attack,decay,sustain,release
 * @param {Array} [userParams] 3 values: attack,decay,sustain (holds until released)
 * @param {String} [userParams] "slow" or "fast"
 * @param {Number} [userParams=0.5] length of the total envelope
 */
cracked.adsr = function (userParams) {
    var methods = {
        init: function (options) {

            options = options || {};

            options = __.isNum(options) ||
                __.isArr(options) ||
                __.isStr(options) ? {envelope: options} : options;

            __.begin("adsr", options).gain({

                gain: 0

            }).end("adsr");

        },
        trigger: function (params) {
            cracked.each("adsr", function (el, i, arr) {
                var p = makeEnv(params, el.getParams().settings.envelope);
                //options = attack,decay,sustain,hold,release
                el.ramp(
                    [1, p[2], p[2], 0],
                    [p[0], p[1], p[3], p[4]],
                    "gain",
                    null,
                    0
                );
            });
        },
        release: function (time) {
            time = __.ifUndef(time,0);
            cracked.each("adsr", function (el, i, arr) {
                    el.ramp(0, time, "gain");
            });
        }
    };

    if (methods[userParams]) {
        methods[userParams].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(userParams);
    }

    function makeEnv(userParams, nodeParams) {

        //user params take precedence over the ones stored in the node
        var args = userParams || nodeParams;

        //trigger arguments :
        //an array of 5 values [attack,decay,sustain,hold,release]
        //or 4 values [attack,decay,sustain,release] ()
        //or a one number specifying the total length of the envelope
        //or a string (either "fast" or "slow") to specify the length
        //tbd - add a proper default

        var p = [0, 0, 0, 0, 0],
            segment,
            options = args || 0.5;

        if (__.isArr(options)) {
            if (options.length === 5) {
                p = options;
            } else if (options.length === 4) {
                var sum = options[0] + options[1] + options[3];
                p = [options[0], options[1], options[2], (sum / 3), options[3]];
            } else if (options.length === 3) {
                //a,d,s, hold for two hours, r = 0
                p = [options[0], options[1], options[2], 7200, 0];
            }

        } else if (__.isNum(options)) {
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        } else if (__.isStr(options)) {
            if (options === "slow") {
                options = 1;
            } else if (options === "fast") {
                options = 0.25;
            } else {
                options = 0.5;
            }
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        }
        return p;
    }

    return cracked;
};

/**
 * Lowpass Filter
 *
 * [See more lowpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#lowpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.lowpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "lowpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("lowpass", userParams).biquadFilter(options).end("lowpass");

    return cracked;
};
/**
 * Highpass Filter
 *
 * [See more highpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#highpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.highpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "highpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("highpass", userParams).biquadFilter(options).end("highpass");

    return cracked;
};
/**
 * Bandpass Filter
 *
 * [See more bandpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#bandpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.bandpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "bandpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("bandpass", userParams).biquadFilter(options).end("bandpass");

    return cracked;
};
/**
 * Lowshelf Filter
 *
 * [See more lowshelf examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#lowshelf
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.lowshelf = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "lowshelf";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.gain = __.ifUndef(userParams.gain, 0);
    options.mapping = userParams.mapping || {};

    __.begin("lowshelf", userParams).biquadFilter(options).end("lowshelf");

    return cracked;
};
/**
 * Highshelf Filter
 *
 * [See more highshelf examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#highshelf
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.highshelf = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "highshelf";
    options.frequency = userParams.frequency || freq;
    options.gain = __.ifUndef(userParams.gain, 0);
    options.q = __.ifUndef(userParams.q, 0);
    options.mapping = userParams.mapping || {};

    __.begin("highshelf", userParams).biquadFilter(options).end("highshelf");

    return cracked;
};
/**
 * Peaking Filter
 *
 * [See more peaking examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#peaking
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 * @param {Number} [params.gain=0] gain
 */
cracked.peaking = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "peaking";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 0);
    options.gain = __.ifUndef(userParams.gain, 0);
    options.mapping = userParams.mapping || {};

    __.begin("peaking", userParams).biquadFilter(options).end("peaking");

    return cracked;
};
/**
 * Notch Filter
 *
 * [See more notch examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#notch
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.notch = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "notch";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 10);
    options.mapping = userParams.mapping || {};

    __.begin("notch", userParams).biquadFilter(options).end("notch");

    return cracked;
};
/**
 * Allpass Filter
 *
 * [See more allpass examples](examples/filters.html)
 *
 * @plugin
 * @category Filter
 * @function
 * @memberof cracked
 * @name cracked#allpass
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440] frequency
 * @param {Number} [params.q=0] Q
 */
cracked.allpass = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};

    options.type = userParams.type || "allpass";
    options.frequency = userParams.frequency || freq;
    options.q = __.ifUndef(userParams.q, 10);
    options.mapping = userParams.mapping || {};

    __.begin("allpass", userParams).biquadFilter(options).end("allpass");

    return cracked;
};

/**
 * Passes mouse move events to a callback. Tracks the movement of the mouse.
 * web audio
 * @plugin
 * @category Interaction
 * @function
 * @memberof cracked
 * @name cracked#mouse_movement
 * @public
 */
cracked.mouse_movement = function(callback) {
    function moveHandler(e) {
        if(callback) {
            callback(e);
        }
    }
    window.parent.document.removeEventListener("mousemove", moveHandler, false);
    window.parent.document.addEventListener("mousemove", moveHandler, false);
};

/**
 * Passes key press events to a callback. Tracks keyboard activity.
 * web audio
 * @plugin
 * @category Interaction
 * @function
 * @memberof cracked
 * @name cracked#key_press
 * @public
 */
cracked.key_press = function(callback) {
    function keyPressHandler(e) {
        if(callback) {
            callback(e);
        }
    }
    window.parent.document.removeEventListener("keypress", keyPressHandler, false);
    window.parent.document.addEventListener("keypress", keyPressHandler, false);
};

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

/**
 * noise parametrized noise node
 *
 * [See more noise examples](examples/noise.html)
 *
 * @plugin
 * @category Noise
 * @function
 * @memberof cracked
 * @name cracked#noise
 * @public
 * @param {Object} [params] map of optional values
 * @param {String} [params.type=white]
 */
cracked.noise = function (params) {
    var userParams = params || {};
    if (userParams.type === "brown") {
        __.begin("noise", userParams).brown(userParams).end("noise");
    } else if (userParams.type === "pink") {
        __.begin("noise", userParams).pink(userParams).end("noise");
    } else {
        __.begin("noise", userParams).white(userParams).end("noise");
    }
    return cracked;
};

/**
 * Pink Noise
 *
 * [See more noise examples](examples/noise.html)
 *
 * @plugin
 * @category Noise
 * @function
 * @memberof cracked
 * @name cracked#pink
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.channels=1]
 * @param {Number} [params.length=1]
 */
cracked.pink = function (params) {
//http://noisehack.com/generate-noise-web-audio-api/
    var userParams = params || {};
    var channels = userParams.channels || 1;
    var length = userParams.length || 1;

    __().begin("pink", userParams).buffer({
        fn: buildBuffer,
        loop: true
    }).end("pink");

    return cracked;

    function buildBuffer(audioContext) {

        var buf = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
        var buflen = buf.length;
        var bufNum = buf.numberOfChannels;
        var buffArr = []; //call only once and cache

        for (var k = 0; k < bufNum; k++) {
            buffArr.push(buf.getChannelData(k));
        }

        for (var i = 0; i < buflen; i++) {
            for (var j = 0; j < bufNum; j++) {
                buffArr[j][i] = Math.random() * 2 - 1;
            }
        }

        pinkify(buf, buffArr);

        function pinkify(buf, buffArr) {
            var buffer = buf,
                b = [0, 0, 0, 0, 0, 0, 0],
                channelData, white, i, j, pink = [],
                bufNum = buffer.numberOfChannels, buflen = buffer.length;
            for (i = 0; i < bufNum; i++) {
                pink[i] = new Float32Array(buflen);
                channelData = buffArr[i];
                for (j = 0; j < buflen; j++) {
                    white = channelData[j];
                    b[0] = 0.99886 * b[0] + white * 0.0555179;
                    b[1] = 0.99332 * b[1] + white * 0.0750759;
                    b[2] = 0.96900 * b[2] + white * 0.1538520;
                    b[3] = 0.86650 * b[3] + white * 0.3104856;
                    b[4] = 0.55000 * b[4] + white * 0.5329522;
                    b[5] = -0.7616 * b[5] - white * 0.0168980;
                    pink[i][j] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
                    pink[i][j] *= 0.11;
                    b[6] = white * 0.115926;
                }
                b = [0, 0, 0, 0, 0, 0, 0];
            }

            for (i = 0; i < bufNum; i++) {
                for (j = 0; j < buflen; j++) {
                    buffArr[i][j] = pink[i][j];
                }
            }

        }

        return buf;
    }
};
/**
 * White Noise
 *
 * [See more noise examples](examples/noise.html)
 *
 * @plugin
 * @category Noise
 * @function
 * @memberof cracked
 * @name cracked#white
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.channels=1]
 * @param {Number} [params.length=1]
 */
cracked.white = function (params) {
//http://noisehack.com/generate-noise-web-audio-api/
    var userParams = params || {};
    var channels = userParams.channels || 1;
    var length = userParams.length || 1;

    __().begin("white", userParams).buffer({
        fn: buildBuffer,
        loop: true
    }).end("white");

    return cracked;

    function buildBuffer(audioContext) {
        var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
        var buflen = buffer.length;
        var bufNum = buffer.numberOfChannels;
        var buffArr = []; //call only once and cache

        for (var k = 0; k < bufNum; k++) {
            buffArr.push(buffer.getChannelData(k));
        }

        for (var i = 0; i < buflen; i++) {
            for (var j = 0; j < bufNum; j++) {
                buffArr[j][i] = (Math.random() * 2 - 1) * 0.44;
            }
        }
        return buffer;
    }
};

/**
 * Brown Noise
 *
 * [See more noise examples](examples/noise.html)
 *
 * @plugin
 * @category Noise
 * @function
 * @memberof cracked
 * @name cracked#brown
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.channels=1]
 * @param {Number} [params.length=1]
 */
cracked.brown = function (params) {
//http://noisehack.com/generate-noise-web-audio-api/
    var userParams = params || {};
    var channels = userParams.channels || 1;
    var length = userParams.length || 1;

    __().begin("brown", userParams).buffer({
        fn: buildBuffer,
        loop: true
    }).end("brown");

    return cracked;

    function buildBuffer(audioContext) {
        var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate),
            lastOut = 0.0, bufLen = buffer.length, bufNum = buffer.numberOfChannels;

        var buffArr = []; //call only once and cache

        for (var k = 0; k < bufNum; k++) {
            buffArr.push(buffer.getChannelData(k));
        }

        for (var i = 0; i < bufLen; i++) {
            for (var j = 0; j < bufNum; j++) {
                var white = Math.random() * 2 - 1;
                buffArr[j][i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = buffArr[j][i];
                buffArr[j][i] *= 3.5; // (roughly) compensate for gain
            }
        }
        return buffer;
    }

};

//need a custom wave osc

/**
 * Sine Wave Oscillator
 *
 * [See more oscillator examples](examples/oscillators.html)
 *
 * @plugin
 * @category Oscillator
 * @function
 * @memberof cracked
 * @name cracked#sine
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440]
 * @param {Number} [params.detune=0]
 * @param {String} [params.type=sine]
 */
cracked.sine = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "sine";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("sine", userParams).osc(options).end("sine");

    return cracked;
};
/**
 * Square Wave Oscillator
 *
 * [See more oscillator examples](examples/oscillators.html)
 *
 * @plugin
 * @category Oscillator
 * @function
 * @memberof cracked
 * @name cracked#square
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440]
 * @param {Number} [params.detune=0]
 * @param {String} [params.type=sine]
 */
cracked.square = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "square";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("square", userParams).osc(options).end("square");

    return cracked;
};
/**
 * Sawtooth Wave Oscillator
 *
 * [See more oscillator examples](examples/oscillators.html)
 *
 * @plugin
 * @category Oscillator
 * @function
 * @memberof cracked
 * @name cracked#saw
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440]
 * @param {Number} [params.detune=0]
 * @param {String} [params.type=sine]
 */
cracked.saw = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "sawtooth";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("saw", userParams).osc(options).end("saw");

    return cracked;
};
/**
 * Triangle Wave Oscillator
 *
 * [See more oscillator examples](examples/oscillators.html)
 *
 * @plugin
 * @category Oscillator
 * @function
 * @memberof cracked
 * @name cracked#triangle
 * @public
 * @param {Object} [params] map of optional values
 * @param {Number} [params.frequency=440]
 * @param {Number} [params.detune=0]
 * @param {String} [params.type=sine]
 */
cracked.triangle = function (params) {

    var freq = __.isNum(params) ? params : 440;
    var userParams = __.isObj(params) ? params : {};
    var options = {};
    options.type = userParams.type || "triangle";
    options.frequency = userParams.frequency || freq;
    options.detune = userParams.detune || 0;
    options.mapping = userParams.mapping || {};

    __.begin("triangle", userParams).osc(options).end("triangle");

    return cracked;
};

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
 * Fade out convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#fadeOut
 * @public
 * @param {Number} userParam optional time to set in seconds. Defaults to 0.02
 */
cracked.fadeOut = function (userParam) {
    var num = __.isNum(userParam) ? userParam : 0.02;
    cracked.ramp(0,num,"gain");
    return cracked;
};

/**
 * Fade in convenience method
 *
 * [See more control examples](examples/control.html)
 *
 * @plugin
 * @category Setters
 * @function
 * @memberof cracked
 * @name cracked#fadeIn
 * @public
 * @param {Number} userParam optional time to set in seconds. Defaults to 0.02
 */
cracked.fadeIn = function (userParam) {
    var num = __.isNum(userParam) ? userParam : 0.02;
    cracked.ramp(1,num,"gain");
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

/**
 * monosynth
 *
 * Simple monophonic synth
 *
 * [See more synth examples](examples/synth.html)
 *
 * @plugin
 * @category Synth
 * @function
 * @memberof cracked
 * @name cracked#monosynth
 * @public
 * @param {Object} [params] map of optional values
 */
cracked.monosynth = function (params) {

    var methods = {
        init: function (options) {

            var opts = options || {};

            /*
             expected format
             {
                 lfo_type:"sawtooth",
                 lfo_intensity:0,
                 lfo_speed:5
                 osc_type:"sine",
                 osc_frequency:440,
                 osc_detune:0
                 lp_q:0,
                 lp_frequency:440
                 adsr_envelope:0.5
                 gain_volume:1
             }
             */

            //set up a basic synth: lfo, sine, lowpass, envelope
            //options:
            //lfo- type, intensity, speed
            //osc- type, frequency, detune
            //lowpass- q, frequency
            //adsr- envelope
            //gain- volume

            var lfo_type        = opts.lfo_type         || "sawtooth",
                lfo_intensity   = opts.lfo_intensity    || 0,
                lfo_speed       = opts.lfo_speed        || 5,
                osc_type        = opts.osc_type         || "sine",
                osc_frequency   = opts.osc_frequency    || 440,
                osc_detune      = opts.osc_detune       || 0,
                lp_q            = opts.lp_q             || 0,
                lp_frequency    = opts.lp_frequency     || 440,
                adsr_envelope   = opts.adsr_envelope    || 0.5,
                gain_volume     = opts.gain_volume      || 1;

            __().begin("monosynth", params).

                lfo({
                    gain:lfo_intensity,
                    frequency:lfo_speed,
                    type:lfo_type
                }).

                osc({
                    detune:osc_detune,
                    frequency:osc_frequency,
                    type:osc_type
                }).

                lowpass({
                    q: lp_q,
                    frequency:lp_frequency
                }).

                adsr({
                    envelope:adsr_envelope
                }).

                gain({
                    gain:gain_volume
                }).

                end("monosynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var vel = __.isNum(args.velocity) ? args.velocity/127 : 0.5;
            var env = args.envelope || [0.01,0.1,0.5];

            //loop thru selected nodes
            cracked.each("monosynth", function (el, index, arr) {
                //select any internal oscillator nodes the monosynth contains (using "el.search(osc)")
                //and then call frequency() passing in the pitch argument we got w noteOn.
                cracked.exec("frequency", [freq], el.search("osc"));
                //apply the velocity to the output gain
                cracked.exec("volume", [vel], el.search("gain"));
                //grab internal adsr and call trigger, pass the envelope parameter we received
                cracked.exec("adsr", ["trigger", env], el.search("adsr"));
            });
        },
        noteOff: function (params) {
            cracked.each("monosynth", function (el, index, arr) {
                params = __.ifUndef(params,0.1);
                var p = __.isNum(params) ? params : __.ifUndef(params.envelope,0.1);
                //call the adsr release
                cracked.exec("adsr", ["release",p], el.search("adsr"));
            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};


/**
 * polysynth
 *
 * Simple polyphonic synth
 *
 * [See more synth examples](examples/synth.html)
 *
 * @plugin
 * @category Synth
 * @function
 * @memberof cracked
 * @name cracked#polysynth
 * @public
 * @param {Object} [params] map of optional values
 */
cracked.polysynth = function (params) {

    var methods = {
        init: function (options) {

            var opts = options || {};

            /*
             expected format
             {
                 lfo_type:"sawtooth",
                 lfo_intensity:0,
                 lfo_speed:5
                 osc_type:"sine",
                 osc_frequency:440,
                 osc_detune:0
                 lp_q:0,
                 lp_frequency:440
                 adsr_envelope:0.5
                 gain_volume:1
             }
             */

            //set up a basic synth: lfo, sine, lowpass, envelope
            //options:
            //lfo- type, intensity, speed
            //osc- type, frequency, detune
            //lowpass- q, frequency
            //adsr- envelope
            //gain- volume

            params = params || {};

            //defaults
            params.lfo_type        = opts.lfo_type         || "sawtooth";
            params.lfo_intensity   = opts.lfo_intensity    || 0;
            params.lfo_speed       = opts.lfo_speed        || 5;
            params.osc_type        = opts.osc_type         || "sine";
            params.osc_frequency   = opts.osc_frequency    || 440;
            params.osc_detune      = opts.osc_detune       || 0;
            params.lp_q            = opts.lp_q             || 0;
            params.lp_frequency    = opts.lp_frequency     || 440;
            params.adsr_envelope   = opts.adsr_envelope    || 0.5;
            params.gain_volume     = opts.gain_volume      || 1;

            //we'll add a map so we can track active voices
            params.active_voices = {};

            //just a stub we'll attach voices to in the noteon method
            __().begin("polysynth", params).

                gain({
                    gain:params.gain_volume
                }).

                end("polysynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var note_number = __.isNum(params) ? params : args.pitch;
            var freq = __.pitch2freq(note_number);
            var vel = __.isNum(args.velocity) ? args.velocity/127 : 0.5;
            var env = args.envelope || [0.01,0.1,0.5];
            var instance_id = note_number+"_"+Date.now();

            //loop thru selected nodes, filtering on the type polysynth
            cracked.each("polysynth", function (el, index, arr) {

                //get the settings that were stored when the object was created
                var voices = el.getParams().settings.active_voices;
                var settings = el.getParams().settings;

                //if not currently active
                if(!voices[note_number]) {

                    //ignore the grid while we're creating the voice
                    __.loop("toggle_grid");

                    //create a new voice
                    __().lfo({
                            type:settings.lfo_type,
                            gain:settings.lfo_intensity,
                            frequency:settings.lfo_speed,
                            id:instance_id+"_lfo",
                            class:instance_id+"_class",
                            modulates:"frequency"
                        }).osc({
                            id:instance_id+"_osc",
                            class:instance_id+"_class",
                            frequency:freq,
                            type:settings.osc_type,
                            detune: settings.osc_detune
                        }).adsr({
                            envelope:env,
                            id:instance_id+"_adsr",
                            class:instance_id+"_class"
                        }).lowpass({
                            id:instance_id+"_lp",
                            class:instance_id+"_class",
                            frequency:settings.lp_frequency,
                            q:settings.lp_q
                        }).gain({
                            id:instance_id+"_gain",
                            class:instance_id+"_class",
                            gain:vel
                        }).connect(el);

                    //flip it back before we start it up
                    __.loop("toggle_grid");

                    //start it up
                    cracked.exec("start", [], __.find("."+instance_id+"_class"));
                    //trigger the envelope
                    cracked.exec("adsr", ["trigger", env], __.find("#"+instance_id+"_adsr"));

                    voices[note_number]=instance_id;
                }

            });
        },
        noteOff: function (params) {
            cracked.each("polysynth", function (el, index, arr) {

                //the only params should be the pitch and the (optional) envelope release time
                var note_number = __.isNum(params) ? params : params.pitch;
                var release = __.ifUndef(params.envelope,0.1);
                //get the active voices map
                var voices = el.getParams().settings.active_voices;
                //and the instance id
                var instance_id = note_number ? voices[note_number] : false;
                //if its active
                if(instance_id) {
                    //call the adsr release
                    cracked.exec("adsr", ["release", release], __.find("#"+instance_id+"_adsr"));
                    //schedule the removal of the voice after it's done playing
                    cracked.exec("remove", [((release*1000)+250)], __.find("."+instance_id+"_class"));
                    //clear the active status so it can be run again
                    delete voices[note_number];
                }

            });
        },
        update:function (params) {
            //update synth params from control
            cracked.each("polysynth", function (el, index, arr) {

                //get the active voices map
                var settings = el.getParams().settings;
                var voices = el.getParams().settings.active_voices;

                //iterate over the node's params and update with any new values
                //any new voices will created with these values
                Object.keys(params).map(function(setting,index,arr){
                    settings[setting]=params[setting];
                });

                //iterate over the voices currently playing and update their values
                Object.keys(voices).map(function(pitch,index,arr){
                    var instance_id = voices[pitch];
                    Object.keys(params).map(function(param,index,arr){
                        switch (param) {
                            case "lfo_speed":
                                cracked.exec("frequency", [params[param]], __.find("#"+instance_id+"_lfo"));
                                break;
                            case "lfo_intensity":
                                cracked.exec("volume", [params[param]], __.find("#"+instance_id+"_lfo"));
                                break;
                            case "lp_frequency":
                                cracked.exec("frequency", [params[param]], __.find("#"+instance_id+"_lp"));
                                break;
                            case "lp_q":
                                cracked.exec("q", [params[param]], __.find("#"+instance_id+"_lp"));
                                break;
                        }
                    });
                });

            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};

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

/**
 * Converts a frequency to a pitch value
 * @plugin
 * @category Utility
 * @function
 * @memberof cracked
 * @name cracked#freq2pitch
 * @public
 * @param {Number} freq
 */
cracked.freq2pitch = function (freq) {
    return Math.floor(69 + 12 * Math.log2(freq / 440));
};

})();
