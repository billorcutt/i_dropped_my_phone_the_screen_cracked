/**
 * #Midi#
 */

/**
 * vars for midi
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
 * <pre><code>if(__.midi_supported()) {
 *      //do midi stuff here
 *      //cuz you can
 * }</code></pre>
 * @public
 * @category Midi
 * @memberof cracked
 * @function
 * @name cracked#midi_supported
 * @returns {boolean}
 */
cracked.midi_supported = function(){
    return typeof navigator.requestMIDIAccess === "function";
};

/**
 * Initialize midi. Callback is invoked when ready.
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //...call this function
 * });</code></pre>
 * @param {Function} callback
 * @memberof cracked
 * @name cracked#midi_init
 * @public
 * @category Midi
 * @function
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
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      __.midi_receive(function(midiEvent){
 *          //handle incoming raw midi events here...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @memberof cracked
 * @name cracked#midi_receive
 * @public
 * @category Midi
 * @function
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
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi noteon events
 *      __.midi_noteon(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi note ons...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_noteon
 * @function
 */
cracked.midi_noteon = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteon = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for note offs
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi noteoff events
 *      __.midi_noteoff(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi note offs...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_noteoff
 * @function
 */
cracked.midi_noteoff = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.noteoff = callback;
        cracked.midi_receive();
    }
};

/**
 * Midi input. Shorthand binding for midi control messages
 * <pre><code>//when midi is ready...
 * __.midi_init(function(){
 *      //get midi control events
 *      __.midi_control(function(noteData){
 *          //note data = [status,pitch,velocity]
 *          //handle midi control events...
 *      });
 * });</code></pre>
 * @param {Function} callback
 * @public
 * @category Midi
 * @memberof cracked
 * @name cracked#midi_control
 * @function
 */
cracked.midi_control = function(callback) {
    if(__.isFun(callback)) {
        _midi_callbacks.control = callback;
        cracked.midi_receive();
    }
};

