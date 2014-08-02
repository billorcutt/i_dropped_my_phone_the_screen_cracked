/**
 * noise parametrized noise node
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {String} [userParams.type=white]
 */
  cracked.noise = function(params) {
  	var userParams = params || {};
  	if (userParams.type === "brown") {
  		__.begin("noise", userParams).brown(userParams).end("noise");
  	} else if (userParams.type === "pink") {
  		__.begin("noise", userParams).pink(userParams).end("noise");
  	} else {
  		__.begin("noise", userParams).white(userParams).end("noise");
  	}
  	return cracked;
  };

/**
 * Pink Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.pink = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("pink", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("pink");

  	return cracked;

  	function buildBuffer(audioContext) {

  		var rand,
  			buf = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
  		for (var i = 0; i < buf.length; i++) {
  			rand = Math.random() * 2 - 1;
  			for (var j = 0; j < buf.numberOfChannels; j++) {
  				buf.getChannelData(j)[i] = buf.numberOfChannels === 2 ? Math.random() * 2 - 1 : rand;
  			}
  		}

  		pinkify(buf);

  		function pinkify(buf) {
  			var buffer = buf,
  				b = [0, 0, 0, 0, 0, 0, 0],
  				channelData, white, i, j, pink = [];
  			for (i = 0; i < buffer.numberOfChannels; i++) {
  				pink[i] = new Float32Array(buffer.length);
  				channelData = buffer.getChannelData(i);
  				for (j = 0; j < buffer.length; j++) {
  					white = channelData[j];
  					b[0] = 0.99886 * b[0] + white * 0.0555179;
  					b[1] = 0.99332 * b[1] + white * 0.0750759;
  					b[2] = 0.96900 * b[2] + white * 0.1538520;
  					b[3] = 0.86650 * b[3] + white * 0.3104856;
  					b[4] = 0.55000 * b[4] + white * 0.5329522;
  					b[5] = -0.7616 * b[5] - white * 0.0168980;
  					pink[i][j] = b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362;
  					pink[i][j] *= 0.11;
  					b[6] = white * 0.115926;
  				}
  				b = [0, 0, 0, 0, 0, 0, 0];
  			}

  			for (i = 0; i < buffer.numberOfChannels; i++) {
  				for (j = 0; j < buffer.length; j++) {
  					buffer.getChannelData(i)[j] = pink[i][j];
  				}
  			}

  		}

  		return buf;
  	}
  };
/**
 * White Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.white = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("white", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("white");

  	return cracked;

  	function buildBuffer(audioContext) {
  		var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate);
  		var buflen = buffer.length;
  		var bufNum = buffer.numberOfChannels;
  		for (var i = 0; i < buflen; i++) {
  			for (var j = 0; j < bufNum; j++) {
  				buffer.getChannelData(j)[i] = (Math.random() * 2 - 1) * 0.44;
  			}
  		}
  		return buffer;
  	}
  };

/**
 * Brown Noise - http://noisehack.com/generate-noise-web-audio-api/
 * @plugin
 * @param {Object} [userParams] map of optional values
 * @param {Number} [userParams.channels=1]
 * @param {Number} [userParams.length=1]
 */
  cracked.brown = function(params) {

  	var userParams = params || {};
  	var channels = userParams.channels || 1;
  	var length = userParams.length || 1;

  	__().begin("brown", userParams).buffer({
  		fn: buildBuffer,
  		loop: true
  	}).end("brown");

  	return cracked;

  	function buildBuffer(audioContext) {
  		var buffer = audioContext.createBuffer(channels, (length * audioContext.sampleRate), audioContext.sampleRate),
  			lastOut = 0.0;
  		for (var i = 0; i < buffer.length; i++) {
  			for (var j = 0; j < buffer.numberOfChannels; j++) {
  				var white = Math.random() * 2 - 1;
  				buffer.getChannelData(j)[i] = (lastOut + (0.02 * white)) / 1.02;
  				lastOut = buffer.getChannelData(j)[i];
  				buffer.getChannelData(j)[i] *= 3.5; // (roughly) compensate for gain
  			}
  		}
  		return buffer;
  	}

  };