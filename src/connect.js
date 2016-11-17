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