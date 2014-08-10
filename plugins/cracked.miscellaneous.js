 /**
 * System out - destination with a master volume
 * @plugin
 * @param {Number} [params=1] system out gain
 */
cracked.dac = function(params) {
  var gain = __.isNum(params) ? params : 1;
  var userParams = __.isObj(params) ? params : {};
  var options = {};
  options.mapping = userParams.mapping || {};
  __.begin("dac", userParams).gain(gain).destination().end("dac");
  return cracked;
};
 /**
  * Sampler - sound file player
  *
  * [See more sampler examples](../../examples/sampler.html)
  *
  * @plugin
  * @param {Object} [userParams] map of optional values
  * @param {Number} [userParams.speed=1]
  * @param {Number} [userParams.start=1]
  * @param {Number} [userParams.end=1]
  * @param {Boolean} [userParams.loop=false]
  */
cracked.sampler = function(params) {
  //sampler only plays sound files not data from functions
  if (params && params.path) {
    __.begin("sampler", params).buffer(params).end("sampler");
  }
  return cracked;
};