/**
 * Attack Decay Sustain Release envelope
 *
 * [See more adsr examples](../../examples/envelopes.html)
 *
 * @plugin
 * @param {Array}  [userParams] 4 values: attack,decay,sustain,release
 * @param {Array} [userParams] 5 values: attack,decay,sustain,hold, release
 * @param {String} [userParams] "slow" or "fast"
 * @param {Number} [userParams=0.5] length of the total envelope
 */
cracked.adsr = function(userParams) {
	var methods = {
		init: function(options) {

            options = options || {};

            options = __.isNum(options) ||
                      __.isArr(options) ||
                      __.isStr(options) ? {envelope:options} : options;

			__.begin("adsr", options).gain({

				gain: 0

			}).end("adsr");

		},
		trigger: function(params) {
            cracked.each(function(el,i,arr) {
                //adsr nodes only
                if(el.getType()==="adsr") {
                    var p = makeEnv(params,el.getParams().settings.envelope);
                    //options = attack,decay,sustain,hold,release
                    el.ramp(
                        [1, p[2], p[2], 0],
                        [p[0], p[1], p[3], p[4]],
                        "gain",
                        null,
                        0
                    );
                }
            });
		},
        release: function() {
            cracked.each(function(el,i,arr) {
                if(el.getType()==="adsr") {
                    //hard code 100 ms release for now
                    el.ramp(0,0.1,"gain");
                }
            });
        }
	};

	if (methods[userParams]) {
		methods[userParams].apply(this, Array.prototype.slice.call(arguments, 1));
	} else {
		methods.init(userParams);
	}

    function makeEnv(userParams,nodeParams) {

        //user params take precedence over the ones stored in the node
        var args = userParams || nodeParams;

        //trigger arguments :
        //an array of 5 values [attack,decay,sustain,hold,release]
        //or 4 values [attack,decay,sustain,release] ()
        //or a one number specifying the total length of the envelope
        //or a string (either "fast" or "slow") to specify the length
        //tbd - add a proper default

        var p = [0, 0, 0, 0, 0],
            segment,
            options = args || 0.5;

        if (__.isArr(options)) {
            if (options.length === 5) {
                p = options;
            } else if (options.length === 4) {
                var sum = options[0] + options[1] + options[3];
                p = [options[0], options[1], options[2], (sum / 3), options[3]];
            }
        } else if (__.isNum(options)) {
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        } else if (__.isStr(options)) {
            if (options === "slow") {
                options = 1;
            } else if (options === "fast") {
                options = 0.25;
            } else {
                options = 0.5;
            }
            segment = options / 4;
            p = [segment, segment, 0.5, segment, segment];
        }
        return p;
    }

	return cracked;
};