/**
 * Low Frequency Oscillator
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.modulates=frequency]
 * @param {String} [userParams.type=saw]
 * @param {Number} [userParams.frequency=6]
 * @param {Number} [userParams.gain=1000]
 */
  cracked.lfo = function(userParams) {
    var params = userParams || {};
    params.modulates = params.modulates || "frequency";

    if (params.type === "white" || params.type === "pink" || params.type === "brown") {
      __().
      begin("lfo", params).
      noise({
        "type": (params.type || "white"),
        "channels": (params.channels || 1),
        "length": (params.length || 1)
      }).
      gain({
        "gain": __.ifUndef(params.gain, 1000)
      }).
      end("lfo");
    } else {
      __().
      begin("lfo", params).
      osc({
        "type": (params.type || "sawtooth"),
        "frequency": (params.frequency || 6)
      }).
      gain({
        "gain": __.ifUndef(params.gain, 1000)
      }).
      end("lfo");
    }
    return cracked;
  };