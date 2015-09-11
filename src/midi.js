//midi access
cracked.midi_access = null;

//is midi supported?
cracked.midi_supported = function(){
  return typeof navigator.requestMIDIAccess === "function";
};

//receive midi. callback is called on midi received event.
// if id is omitted then listens on all inputs
cracked.midi_receive = function(callback, id){
    if(cracked.midi_access) {

    }
};

//send midi. takes a data object.
// if id is omitted then sends to all outputs
cracked.midi_send = function(data, id){
    if(cracked.midi_access) {

    }
};

//returns an object w/ current midi status
cracked.midi_status = function() {
    if(cracked.midi_access) {
        return {};
    } else {
        return null;
    }
};

//initialize midi
cracked.midi_init = function() {
    if(__.midi_supported) {
        navigator.requestMIDIAccess().then( function() {
           __.midi_access = access;
            return true;
        }, function( err ) {
            console.error( "midi_init: Initialization failed. Error code: " + err.code );
            return false;
        } );
    } else {
        console.error("Midi not supported by your browser");
        return false;
    }
};


