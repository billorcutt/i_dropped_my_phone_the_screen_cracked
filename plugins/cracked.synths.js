cracked.monosynth = function (params) {
    //do this: http://noisehack.com/how-to-build-monotron-synth-web-audio-api/

    var methods = {
        init: function (options) {
            //set up a basic synth: lfo, sine, lowpass, envelope
            __().begin("monosynth", params).

                lfo({gain: 0}).

                sine().

                lowpass({q: 0}).

                adsr().

                gain().

                end("monosynth");
        },
        noteOn: function (params) {

            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var env = args.envelope || 1;

            //loop thru selected nodes
            cracked.each("monosynth", function (el, index, arr) {
                //kill anything that's running
                cracked.exec("adsr", ["release",0.006], el.search("adsr"));
                //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                //and then call frequency() passing in the pitch argument we got w noteOn.

                //slight delay before triggering the note
                setTimeout(function(){
                    cracked.exec("frequency", [freq], el.search("sine"));
                    //grab internal adsr and call trigger, pass the envelope parameter we received
                    cracked.exec("adsr", ["trigger", env], el.search("adsr"));
                },6);

                //ditto internal lfo and ramp() the frequency
                //cracked.exec("ramp",[[100,10],[(env*0.5),(env*0.5)],"frequency",10],el.search("lfo"));
                //ditto internal lowpass
                //cracked.exec("ramp",[[freq/2,freq*3],[(env*0.1),(env*0.9)],"frequency",freq*3],el.search("lowpass"));
            });
        },
        noteOff: function (param) {
            cracked.each("monosynth", function (el, index, arr) {
                //call the adsr release
                var p = param ? param : 0.006;
                cracked.exec("adsr", ["release", p], el.search("adsr"));
            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};

cracked.cracksynth = function (params) {

    var methods = {
        init: function (options) {
            //set up a basic synth: lfo, sine, lowpass, envelope
            __().begin("cracksynth", params).

                lfo({gain: 100}).

                sine().

                lowpass({q: 20}).

                adsr().

                gain().

                end("cracksynth");
        },
        noteOn: function (params) {

            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var env = args.envelope || 1;

            //loop thru selected nodes
            cracked.each("cracksynth", function (el, index, arr) {
                //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                //and then call frequency() passing in the pitch argument we got w noteOn.
                cracked.exec("frequency", [freq], el.search("sine"));
                //grab internal adsr and call trigger, pass the envelope parameter we received
                cracked.exec("adsr", ["trigger", env], el.search("adsr"));
                //ditto internal lfo and ramp() the frequency
                cracked.exec("ramp", [
                    [100, 10],
                    [(env * 0.5), (env * 0.5)],
                    "frequency",
                    10
                ], el.search("lfo"));
                //ditto internal lowpass
                cracked.exec("ramp", [
                    [freq / 2, freq * 3],
                    [(env * 0.1), (env * 0.9)],
                    "frequency",
                        freq * 3
                ], el.search("lowpass"));
            });
        },
        noteOff: function () {
            cracked.each("cracksynth", function (el, index, arr) {
                //call the adsr release
                cracked.exec("adsr", ["release", []], el.search("adsr"));
            });
        }
    };

    if (methods[params]) {
        methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
    } else {
        methods.init(params);
    }

    return cracked;
};