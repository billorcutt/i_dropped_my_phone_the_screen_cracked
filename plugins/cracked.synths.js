cracked.microsynth = function (params) {

    var methods = {
        init: function (options) {
            //set up a basic synth: lfo, sine, lowpass, envelope
            __().begin("microsynth", params).

                lfo({gain: 0, type:"square"}).

                sine().

                lowpass({q: 0}).

                adsr().

                gain().

                end("microsynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var env = args.envelope || [0.01,0.1,0.5];

            //loop thru selected nodes
            cracked.each("microsynth", function (el, index, arr) {
                //kill anything that's running
                cracked.exec("adsr", ["release",0.01], el.search("adsr"));
                //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                //and then call frequency() passing in the pitch argument we got w noteOn.
                cracked.exec("frequency", [freq], el.search("sine"));
                //wait til the previous note is over
                setTimeout(function(){
                    //grab internal adsr and call trigger, pass the envelope parameter we received
                    cracked.exec("adsr", ["trigger", env], el.search("adsr"));
                },10);
            });
        },
        noteOff: function (params) {
            cracked.each("microsynth", function (el, index, arr) {
                params = __.ifUndef(params,0.1);
                var p = __.isNum(params) ? params : __.ifUndef(params.envelope,0.1);
                //call the adsr release
                cracked.exec("adsr", ["release",p], el.search("adsr"));
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