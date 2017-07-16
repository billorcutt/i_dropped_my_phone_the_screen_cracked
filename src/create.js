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
                applyParam(node, creationParam, creationParams.settings[creationParam], creationParams.mapping);
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
                    /*if(offset && duration) {
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
    this.ramp = function (target, time, paramToRamp, nodeParam, initial) {
        var currNode = nodeParam || nativeNode;
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
                __.isFun(currNode[paramToRamp].linearRampToValueAtTime)
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
                        currNode[paramToRamp].linearRampToValueAtTime(target[i], (now + prevTime + time[i]));
                    }
                } else {
                    //if we're looping and the user seems to be trying to sync to the loop, we'll clamp it
                    if(!_ignoreGrid && __.sec2ms(time) === _loopInterval) {
                        time = Math.min(time,(_loopTimeToNextStep - _context.currentTime));
                    }
                    //and yes, this is some bullshit code to fix a bug i dont understand...
                    logToConsole(" target " + target + " time " + (_context.currentTime + prevTime + time) + " current time " + (_context.currentTime));
                    currNode[paramToRamp].linearRampToValueAtTime(target, (now + time));
                }
            }
        }
    };

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
                nodes.from.connect(nodes.to);
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
                nodes.from.connect(nodes.to);
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