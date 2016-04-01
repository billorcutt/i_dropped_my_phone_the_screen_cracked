'use strict';

var _nodeStore = {},
    _nodeLookup = {},
    _previousNode = null,
    _selectedNodes = [],
    _currentSelector = "",
    _currentMacro = [],
    _debugEnabled = false,
    _context = window.AudioContext ? new AudioContext() : new webkitAudioContext();