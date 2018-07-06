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