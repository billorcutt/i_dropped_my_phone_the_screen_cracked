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
    _context.destination.channelCount = _maxChannelCount;
    _context.destination.channelCountMode = "explicit";
    _context.destination.channelInterpretation = "discrete";