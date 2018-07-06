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
    window.parent.document.removeEventListener("mousemove", callback, false);
    window.parent.document.addEventListener("mousemove", callback, false);
};