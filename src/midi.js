//midi access
cracked._midi_access = null;
cracked._midi_inputs = null;
cracked._midi_outputs = null;

//is midi supported?
cracked.midi_supported = function(){
  return typeof navigator.requestMIDIAccess === "function";
};

//receive midi. callback is called on midi received event.
// if id is omitted then listens on all inputs
cracked.midi_receive = function(callback, id){
    if((__._midi_access || __.midi_init()) && __.isFun(callback)) {
        var inputs = __._midi_inputs.values();
        // loop over all available inputs and listen for any MIDI input
        for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
            // each time there is a midi message call the onMIDIMessage function
            input.value.onmidimessage = callback;
        }
    } else {
        console.error("midi_receive: midi not available");
    }
};

//send midi. takes a data object.
// if id is omitted then sends to all outputs
cracked.midi_send = function(data, id){
    if(__._midi_access || __.midi_init()) {
        console.log("do midi stuff here");
    } else {
        console.error("midi_send: midi not available");
    }
};

//returns an object w/ current midi status
cracked.midi_status = function() {
    if(__._midi_access || __.midi_init()) {
        return {};
    } else {
        console.error("midi_status: midi not available");
        return null;
    }
};

//initialize midi
cracked.midi_init = function(access) {
    if(__.midi_supported && !__._midi_access) {
        navigator.requestMIDIAccess().then( function() {
            __._midi_access = access;
            __._midi_inputs = access.inputs; // inputs = MIDIInputMaps, you can retrieve the inputs with iterators
            __._midi_outputs = access.outputs; // outputs = MIDIOutputMaps, you can retrieve the outputs with iterators
            return true;
        }, function( err ) {
            console.error( "midi_init: Initialization failed. Error code: " + err.code );
            return false;
        } );
    } else {
        console.error("midi_init: Failed. Midi not supported by your browser");
        return false;
    }
};


