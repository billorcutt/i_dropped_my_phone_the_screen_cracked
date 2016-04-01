/**
 * #Midi#
 */

/**
 * global vars for midi
 * @type {Object}
 * @private
 */
var _midi_access = null,
    _midi_inputs = null,
    _midi_outputs = null,
    _midi_callbacks = {noteon:function(){},noteoff:function(){},control:function(){}},
    _midi_noteons = {};

/**
 * Is midi supported?
 * @public
 * @returns {boolean}
 */
cracked.midi_supported = function(){
    return typeof navigator.requestMIDIAccess === "function";
};

/**
 * Initialize midi. Callback is invoked when ready.
 * @param {Function} callback
 * @public
 */
cracked.midi_init = function(callback) {
    if(_midi_access) {
        //midi already initialized
        callback.apply(cracked,[true]);
    } else if(__.midi_supported()) {
        navigator.requestMIDIAccess().then( function(access) {
            _midi_access = access;
            _midi_inputs = access.inputs; // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
            _midi_outputs = access.outputs; // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators
            callback.apply(cracked,[true]);
        }, function( err ) {
            console.error( "midi_init: Initialization failed. Error code: " + err.code );
            callback.apply(cracked,[false]);
        } );
    } else {
        console.error("midi_init: Failed. Midi not supported by your browser");
        callback.apply(cracked,[false]);
    }
};

/**
 * Midi input. Bind handler for the onMIDIMessage event.
 * @param {Function} callback
 * @public
 */
cracked.midi_receive = function(callback){
    if(_midi_access) {
        var fun = __.isFun(callback) ? callback : function(){};
        var inputs = _midi_inputs.values();
        // loop over all available inputs and listen for any MIDI input
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            // each time there is a midi message call the onMIDIMessage function
            input.value.onmidimessage = function(ev){
                if(ev.data) {

                    //data
                    var status=ev.data[0],
                        pitch=ev.data[1],
                        velocity=ev.data[2],
                        note_data = [status,pitch,velocity];

                    //general midi receive
                    fun(ev);

                    //note on/off/control methods
                    switch(status) {
                        case 144:
                            if(velocity > 0) {
                                if(!_midi_noteons[pitch]) {
                                    _midi_noteons[pitch]=pitch;
                                    _midi_callbacks.noteon(note_data);
                                }
                            } else {
                                _midi_callbacks.noteoff(note_data);
                                delete _midi_noteons[pitch];
                            }
                            break;
                        case 128:
                            _midi_callbacks.noteoff(note_data);
                            delete _midi_noteons[pitch];
                            break;
                        case 176:
                            _midi_callbacks.control(note_data);
                            break;
                    }
                }
            };
        }
    } else {
        console.error("midi_receive: midi not available");
    }
};

/**
 * Midi input. Shorthand binding for note ons
 * @param {Function} callback
 * @public
 */
cracked.midi_noteon = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteon = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for note offs
 * @param {Function} callback
 * @public
 */
cracked.midi_noteoff = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteoff = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for midi control messages
 * @param {Function} callback
 * @public
 */
cracked.midi_control = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.control = callback;
        cracked.midi_receive();
    }
};

