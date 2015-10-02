/**
 * Microsynth
 *
 * Simple monophonic synth
 *
 * [See more synth examples](../../examples/synth.html)
 *
 * @plugin
 * @param {Object} [params] map of optional values
 */
cracked.microsynth = function (params) {

    var methods = {
        init: function (options) {

            var opts = options || {};

            /*
                expected format
            {
                lfo_type:"sawtooth",
                lfo_intensity:0,
                lfo_speed:5
                osc_type:"sine",
                osc_frequency:440,
                osc_detune:0
                lp_q:0,
                lp_frequency:440
                adsr_envelope:0.5
                gain_volume:1
            }
             */

            //set up a basic synth: lfo, sine, lowpass, envelope
            //options:
            //lfo- type, intensity, speed
            //osc- type, frequency, detune
            //lowpass- q, frequency
            //adsr- envelope
            //gain- volume

            var lfo_type        = opts.lfo_type         || "sawtooth",
                lfo_intensity   = opts.lfo_intensity    || 0,
                lfo_speed       = opts.lfo_speed        || 5,
                osc_type        = opts.osc_type         || "sine",
                osc_frequency   = opts.osc_frequency    || 440,
                osc_detune      = opts.osc_detune       || 0,
                lp_q            = opts.lp_q             || 0,
                lp_frequency    = opts.lp_frequency     || 440,
                adsr_envelope   = opts.adsr_envelope    || 0.5,
                gain_volume     = opts.gain_volume      || 1;

            __().begin("microsynth", params).

                lfo({
                    gain:lfo_intensity,
                    frequency:lfo_speed,
                    type:lfo_type
                }).

                osc({
                    detune:osc_detune,
                    frequency:osc_frequency,
                    type:osc_type
                }).

                lowpass({
                    q: lp_q,
                    frequency:lp_frequency
                }).

                adsr({
                    envelope:adsr_envelope
                }).

                gain({
                    gain:gain_volume
                }).

                end("microsynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var vel = __.isNum(args.velocity) ? args.velocity/127 : 0.5;
            var env = args.envelope || [0.01,0.1,0.5];

            //loop thru selected nodes
            cracked.each("microsynth", function (el, index, arr) {
                //kill anything that's running
                cracked.exec("adsr", ["release",0.01], el.search("adsr"));
                //select any internal sine nodes the monosynth contains (using "el.search(sine)")
                //and then call frequency() passing in the pitch argument we got w noteOn.
                cracked.exec("frequency", [freq], el.search("osc"));
                //apply the velocity to the output gain
                cracked.exec("volume", [vel], el.search("gain"));
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