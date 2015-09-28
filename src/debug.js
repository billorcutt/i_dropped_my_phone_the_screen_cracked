// Development/Debug
/**
 * #Debug#
 */

/**
 * log selected nodes to console if any.
 * <code>
 * //create and connect sine -> lowpass -> dac
 * \_\_().sine().lowpass().dac();
 *
 * //logs the [oscillatorNode] object to the console
 * \_\_("sine").log()</code>
 *
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
 * <code>
 * //create and connect sine -> lowpass -> dac
 * \_\_().sine().lowpass().dac();
 *
 * //returns 2
 * \_\_("sine,lowpass").size();</code>
 *
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
 * debug only
 * @public
 */
cracked._dumpState = function () {
    console.log(_nodeLookup);
};

/**
 * debug method to get a node with a uuid
 * debug only
 * @param uuid
 * @returns {*}
 * @public
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
