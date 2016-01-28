/**
 * #Connecting#
 * Methods for the connecting nodes
 *
 */

/**
 * chainable method to connect nodes to previously instantiated
 * nodes. Takes a selector to find the nodes to connect to.
 * <code>
 *     //create and connect sine->lowpass->dac
 *     \_\_().sine().lowpass().dac();
 *     //create a sawtooth and connect to the lowpass instantiated above
 *     \_\_().saw().connect("lowpass");</code>
 *
 * @public
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

//disconnects and removes all references to selected nodes
cracked.remove = function() {
    _selectedNodes.forEach(function (node, i, array) {
        node = getNodeWithUUID(node);
        if (node) {
            node.stop();
            node.disconnect();
        }
    });
    cracked.removeModelReferences();
};

/**
 * helper for connect method
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