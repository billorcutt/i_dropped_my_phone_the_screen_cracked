  //test
  cracked.foo = function(userParams) {
    __.begin("foo", userParams).lowpass().gain().compressor().end("foo");
    return cracked;
  };

  //test
  cracked.bar = function(userParams) {
    __().begin("bar", userParams).buffer({
      path: "../data/various/gun-cock.wav",
      loop: true
    }).gain().end("bar");
    return cracked;
  };

  //test
  cracked.dalek = function(userParams) {
    __().begin("dalek", userParams).buffer({
      path: "../data/various/ringmod_good-dalek.wav",
      loop: true
    }).gain().end("dalek");
    return cracked;
  };

  //test macro inside of macro inside of macro
  cracked.junk = function(userParams) {
    __.begin("junk", userParams).foo().end("junk");
    return cracked;
  };

  //test using connect in a macro
  cracked.komb = function(userParams) {
    __.begin("komb", userParams).gain({
      id: "input"
    }).delay({
      time: 0.025
    }).gain({
      id: "output"
    });
    __("#output").gain({
      gain: 0.85,
      id: "feedback"
    }).connect("#input").end("komb");
    return cracked;
  };