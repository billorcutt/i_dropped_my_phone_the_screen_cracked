/**
 * #Sequencing#
 */

/**
 * global vars for loop
 * @type {boolean}
 * @private
 */

var _isLoopRunning = false,
    _ignoreGrid = true,
    _loopStepSize = 16,
    _loopInterval = 100,
    _loopID = 0,
    _loopCB = function () {
    },
    _loopData = [],
    _loopIndex = -1,
    _loopListeners = [],
    _loopTimeToNextStep = 0;

/**
 * main method for loop
 *
 * <code>
 * //configure the loop: 8 steps, 100ms between steps
 * \_\_.loop({steps:8,interval:100});
 *
 * //start
 * \_\_.loop("start");
 * //stop
 * \_\_.loop("stop");
 * //reset the loop params
 * \_\_.loop("reset");
 *
 * </code>
 *
 * [See sequencing examples](../../examples/sequencing.html)
 *
 * @public
 * @param {String} [arg] stop/start/reset commands
 * @param {Object} [config] configuration object
 * @param {Number} [config.interval=100] step length in ms
 * @param {Number} [config.steps=16] number of steps
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
        } else if (arguments[0] && __.isObj(arguments[0])) {
            //configure loop with options
            //set data & callback
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
 * Starts the loop
 * @private
 */
function startLoop() {
    if (!_isLoopRunning) {
        _loopTimeToNextStep = _context.currentTime + (_loopInterval / 1000);
        _loopID = setInterval(checkup, (_loopInterval / 1.75));
        _isLoopRunning = true;
        _ignoreGrid = false;
    }
}

/**
 * Stops the loop
 * @private
 */
function stopLoop() {
    if (_isLoopRunning) {
        clearInterval(_loopID);
        _isLoopRunning = false;
        _loopTimeToNextStep = 0;
        _ignoreGrid = true;
    }
}

/**
 * Resets the loop to defaults
 * @private
 */
function resetLoop() {
    _loopStepSize = 16;
    _loopInterval = 100;
    _ignoreGrid = true;
    _loopID = 0;
    _loopCB = function () {
    };
    _loopData = [];
    _loopListeners = [];
    _loopIndex = -1;
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
    if (opts) {
        _loopStepSize = opts.steps || 16;
        _loopInterval = opts.interval || 100;
    }
    if (__.isFun(fn)) {
        _loopCB = fn;
    }
    if (__.isArr(data) && data.length === _loopStepSize) {
        _loopData = data;
    } else {
        _loopData = [];
    }
}

/**
 * called by setInterval - sets the time to next step
 * @private
 */
function checkup() {
    var now = _context.currentTime,
        timeAtPreviousStep = _loopTimeToNextStep - _loopInterval / 1000;
    if (now < _loopTimeToNextStep && now > timeAtPreviousStep) {
        loopStep();
        _loopTimeToNextStep += (_loopInterval / 1000);
    }
}

/**
 * call on every step
 * @private
 */
function loopStep() {
    _loopIndex = (_loopIndex < (_loopStepSize - 1)) ? _loopIndex + 1 : 0;
    if (__.isFun(_loopCB)) {
        _loopCB(_loopIndex, cracked.ifUndef(_loopData[_loopIndex], null), _loopData);
    }
    for (var i = 0; i < _loopListeners.length; i++) {
        var listener = _loopListeners[i];
        var tmp = _selectedNodes;
        _selectedNodes = listener.selection;
        listener.callback(_loopIndex, cracked.ifUndef(listener.data[_loopIndex], null), listener.data);
        _selectedNodes = tmp;
    }
}

/**
 * Listener - binds a set of audio nodes and a callback to loop step events
 * @public
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
            selection: _selectedNodes.slice(0),
            selector: _currentSelector
        });
    }
    return cracked;
};

/**
 * Remove any steps listeners registered on these nodes
 * @public
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