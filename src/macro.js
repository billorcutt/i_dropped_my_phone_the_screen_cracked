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