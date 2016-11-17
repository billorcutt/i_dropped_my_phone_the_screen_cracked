/**
 * monosynth
 *
 * Simple monophonic synth
 *
 * [See more synth examples](examples/synth.html)
 *
 * @plugin
 * @category Synth
 * @function
 * @memberof cracked
 * @name cracked#monosynth
 * @public
 * @param {Object} [params] map of optional values
 */
cracked.monosynth = function (params) {

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

            __().begin("monosynth", params).

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

                end("monosynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var freq = __.isNum(params) ? __.pitch2freq(params) : __.pitch2freq(args.pitch);
            var vel = __.isNum(args.velocity) ? args.velocity/127 : 0.5;
            var env = args.envelope || [0.01,0.1,0.5];

            //loop thru selected nodes
            cracked.each("monosynth", function (el, index, arr) {
                //select any internal oscillator nodes the monosynth contains (using "el.search(osc)")
                //and then call frequency() passing in the pitch argument we got w noteOn.
                cracked.exec("frequency", [freq], el.search("osc"));
                //apply the velocity to the output gain
                cracked.exec("volume", [vel], el.search("gain"));
                //grab internal adsr and call trigger, pass the envelope parameter we received
                cracked.exec("adsr", ["trigger", env], el.search("adsr"));
            });
        },
        noteOff: function (params) {
            cracked.each("monosynth", function (el, index, arr) {
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


/**
 * polysynth
 *
 * Simple polyphonic synth
 *
 * [See more synth examples](examples/synth.html)
 *
 * @plugin
 * @category Synth
 * @function
 * @memberof cracked
 * @name cracked#polysynth
 * @public
 * @param {Object} [params] map of optional values
 */
cracked.polysynth = function (params) {

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

            params = params || {};

            //defaults
            params.lfo_type        = opts.lfo_type         || "sawtooth";
            params.lfo_intensity   = opts.lfo_intensity    || 0;
            params.lfo_speed       = opts.lfo_speed        || 5;
            params.osc_type        = opts.osc_type         || "sine";
            params.osc_frequency   = opts.osc_frequency    || 440;
            params.osc_detune      = opts.osc_detune       || 0;
            params.lp_q            = opts.lp_q             || 0;
            params.lp_frequency    = opts.lp_frequency     || 440;
            params.adsr_envelope   = opts.adsr_envelope    || 0.5;
            params.gain_volume     = opts.gain_volume      || 1;

            //we'll add a map so we can track active voices
            params.active_voices = {};

            //just a stub we'll attach voices to in the noteon method
            __().begin("polysynth", params).

                gain({
                    gain:params.gain_volume
                }).

                end("polysynth");
        },
        noteOn: function (params) {
            //process incoming arguments for this note
            var args = params || {};
            var note_number = __.isNum(params) ? params : args.pitch;
            var freq = __.pitch2freq(note_number);
            var vel = __.isNum(args.velocity) ? args.velocity/127 : 0.5;
            var env = args.envelope || [0.01,0.1,0.5];
            var instance_id = note_number+"_"+Date.now();

            //loop thru selected nodes, filtering on the type polysynth
            cracked.each("polysynth", function (el, index, arr) {

                //get the settings that were stored when the object was created
                var voices = el.getParams().settings.active_voices;
                var settings = el.getParams().settings;

                //if not currently active
                if(!voices[note_number]) {

                    //ignore the grid while we're creating the voice
                    __.loop("toggle_grid");

                    //create a new voice
                    __().lfo({
                            type:settings.lfo_type,
                            gain:settings.lfo_intensity,
                            frequency:settings.lfo_speed,
                            id:instance_id+"_lfo",
                            class:instance_id+"_class",
                            modulates:"frequency"
                        }).osc({
                            id:instance_id+"_osc",
                            class:instance_id+"_class",
                            frequency:freq,
                            type:settings.osc_type,
                            detune: settings.osc_detune
                        }).adsr({
                            envelope:env,
                            id:instance_id+"_adsr",
                            class:instance_id+"_class"
                        }).lowpass({
                            id:instance_id+"_lp",
                            class:instance_id+"_class",
                            frequency:settings.lp_frequency,
                            q:settings.lp_q
                        }).gain({
                            id:instance_id+"_gain",
                            class:instance_id+"_class",
                            gain:vel
                        }).connect(el);

                    //flip it back before we start it up
                    __.loop("toggle_grid");

                    //start it up
                    cracked.exec("start", [], __.find("."+instance_id+"_class"));
                    //trigger the envelope
                    cracked.exec("adsr", ["trigger", env], __.find("#"+instance_id+"_adsr"));

                    voices[note_number]=instance_id;
                }

            });
        },
        noteOff: function (params) {
            cracked.each("polysynth", function (el, index, arr) {

                //the only params should be the pitch and the (optional) envelope release time
                var note_number = __.isNum(params) ? params : params.pitch;
                var release = __.ifUndef(params.envelope,0.1);
                //get the active voices map
                var voices = el.getParams().settings.active_voices;
                //and the instance id
                var instance_id = note_number ? voices[note_number] : false;
                //if its active
                if(instance_id) {
                    //call the adsr release
                    cracked.exec("adsr", ["release", release], __.find("#"+instance_id+"_adsr"));
                    //schedule the removal of the voice after it's done playing
                    cracked.exec("remove", [((release*1000)+250)], __.find("."+instance_id+"_class"));
                    //clear the active status so it can be run again
                    delete voices[note_number];
                }

            });
        },
        update:function (params) {
            //update synth params from control
            cracked.each("polysynth", function (el, index, arr) {

                //get the active voices map
                var settings = el.getParams().settings;
                var voices = el.getParams().settings.active_voices;

                //iterate over the node's params and update with any new values
                //any new voices will created with these values
                Object.keys(params).map(function(setting,index,arr){
                    settings[setting]=params[setting];
                });

                //iterate over the voices currently playing and update their values
                Object.keys(voices).map(function(pitch,index,arr){
                    var instance_id = voices[pitch];
                    Object.keys(params).map(function(param,index,arr){
                        switch (param) {
                            case "lfo_speed":
                                cracked.exec("frequency", [params[param]], __.find("#"+instance_id+"_lfo"));
                                break;
                            case "lfo_intensity":
                                cracked.exec("volume", [params[param]], __.find("#"+instance_id+"_lfo"));
                                break;
                            case "lp_frequency":
                                cracked.exec("frequency", [params[param]], __.find("#"+instance_id+"_lp"));
                                break;
                            case "lp_q":
                                cracked.exec("q", [params[param]], __.find("#"+instance_id+"_lp"));
                                break;
                        }
                    });
                });

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