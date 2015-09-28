/**
 * #Model#
 */

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
    if (__.isObj(params)) {
        for (var x in params) {
            if (x === "id") {
                setter(_nodeLookup, (prefix + "#" + params[x]), node.getUUID());
            } else if (x === "class") {
                var classArr = params[x].split(",");
                classArr.forEach(function () {
                    setter(_nodeLookup, (prefix + "." + params[x]), node.getUUID());
                });
            }
        }
    }
    setter(_nodeLookup, "*", node.getUUID()); //everything
    setter(_nodeLookup, prefix + node.getType(), node.getUUID());
}

/**
 * remove references to selected nodes tbd - need to do this for
 * real works ok right now for top level macros
 * @private
 */
cracked.remove = function () {
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
 * @param {*} uuid
 * @private
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
 * @private
 * @returns {Array}
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