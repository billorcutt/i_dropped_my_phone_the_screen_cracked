/**
 * execute a callback at random intervals within a range
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#random_interval
 * @public
 * @param {Function} callback to be invoked at every interval
 * @param {Number} minTime minimum value for the random interval
 * @param {Number} maxTime maximum value for the random interval
 */
cracked.random_interval = function(callback, minTime, maxTime) {

    function set_timeout(callback, minTime, maxTime,ran) {
        var nextRan = cracked.random(minTime, maxTime);
        setTimeout(function(){
            callback(nextRan);
            set_timeout(callback, minTime, maxTime,nextRan);
        },ran);
    }

    if(typeof callback === "function" && __.isNum(minTime) && __.isNum(maxTime)) {
        set_timeout(callback, minTime, maxTime,cracked.random(minTime, maxTime));
    }

};

/**
 * create a adsr envelope with random values scaled to a length
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#random_envelope
 * @public
 * @param {Number} length in sec
 * @returns {Array}
 */
cracked.random_envelope = function(length) {

    var result = [];

    if(__.isNum(length)) {

        var tmp = __.fill_array(4,function(){
            return __.random(0,100);
        });

        var sum = tmp.reduce(function(a, b) {
            return a + b;
        });

        var factor = (length/sum);

        result = tmp.map(function(element,index){
            return element*factor;
        });
    }

    return result;
};

/**
 * fill an array with some values
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#fill_array
 * @public
 * @param {Number} size of the array to be filled
 * @param {Function} fn to provide the value, if absent then array is filled with 0's.
 * @returns {Array}
 */
cracked.fill_array = function(size,fn) {
    var tmp = [];
    if(__.isNum(size)) {
        var fun = __.isFun(fn) ? fn : function(){return 0;};
        for(var i=0;i<size;i++) {
            tmp.push(fun.apply(this,[i]));
        }
    }
    return tmp;
};

/**
 * advance thru array one step at a time.
 * start over when arriving at the end
 * @param {Array} arr to loop over
 * @param {Number} offset added to index
 * @param {Number} limit upper bound to iteration
 * @param {Function} callback invoked when the count resets
 * @function
 * @category Algorithmic
 * @memberof cracked
 * @name cracked#array_next
 * @public
 */

cracked.array_next = function(arr,offset,limit,callback) {
    offset = offset || 0;
    limit = limit || arr.length;
    var adjusted_limit = Math.min(limit,arr.length);
    var adjusted_offset = Math.min(offset,adjusted_limit-1);
    var old_index = arr.current_index = __.ifUndef(arr.current_index,-1);
    arr.current_index = (arr.current_index+1+adjusted_offset) >= adjusted_limit ? 0 : arr.current_index+1;
    if((old_index > arr.current_index) && (typeof callback === "function")) {
        callback();
    }
    return arr[arr.current_index + adjusted_offset];
};

/**
 * Returns a boolean based on percentage.
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#chance
 * @public
 * @param {Number} percentage
 * @returns {boolean}
 */
cracked.chance = function(percentage) {
    return percentage > __.random(0,100);
};

/**
 * Returns a musical scale/mode based on type
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#scales
 * @public
 * @param {String} type scale type
 */
cracked.scales = function (type) {
    return {
        "major": [0, 2, 4, 5, 7, 9, 11],
        "minor": [0, 2, 3, 5, 7, 8, 10],
        "wholetone": [0, 2, 4, 6, 8, 10],
        "overtone": [0, 2, 4, 6, 7, 9, 10],
        "lydian": [0, 2, 4, 6, 7, 9, 11],
        "mixolydian": [0, 2, 4, 5, 7, 9, 10],
        "ionian": [0, 2, 4, 5, 7, 9, 11]
    }[type];
};

/**
 * Returns a musical scale/mode based on type
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#chords
 * @public
 * @param {String} type scale type
 */
cracked.chords = function (type) {
    return {
        "major": [0, 4, 7],
        "minor": [0, 3, 7],
        "seventh": [0, 4, 7, 10],
        "ninth": [0, 4, 7, 10, 14],
        "major_seventh": [0, 4, 7, 11],
        "minor_seventh": [0, 3, 7, 10],
        "suspended": [0, 5, 7],
        "diminished": [0, 3, 6],
        "eleventh": [0, 4, 7, 10, 14, 17],
        "thirteenth": [0, 4, 7, 10, 14, 17, 21]
    }[type];
};

/**
 * Return a random series of frequencies from randomly selected octaves from a given scale
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random_scale
 * @public
 * @param {String} scale
 * @param {Number} octave_lower
 * @param {Number} octave_upper
 */
cracked.random_scale = function (scale,octave_lower,octave_upper) {
    var lower = __.ifUndef(octave_lower,3);
    var upper = __.ifUndef(octave_upper,7);
    return __.pitch2freq(__.scales(scale)[__.random(0,__.scales(scale).length-1)] + __.random(lower,upper) * 12);
};

/**
 * Return a random series of frequencies from a randomly selected octave from a given chord
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random_arpeggio
 * @public
 * @param {String} chord
 * @param {Number} octave_lower
 * @param {Number} octave_upper
 */
cracked.random_arpeggio = function (chord,octave_lower,octave_upper) {
    var lower = __.ifUndef(octave_lower,3);
    var upper = __.ifUndef(octave_upper,7);
    return __.pitch2freq(__.chords(chord)[__.random(0,__.chords(chord).length-1)] + __.random(lower,upper) * 12);
};

/**
 * Takes a reference to an array, shuffles it
 * and returns it
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#shuffle
 * @public
 * @param {Array} arr
 */
cracked.shuffle = function (arr) {
    var counter = arr.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = arr[counter];
        arr[counter] = arr[index];
        arr[index] = temp;
    }

    return arr;
};

/**
 * Returns a function that generates a unique random number between 0 & max.
 * If max is exceeded, then repeat the sequence of random numbers.
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#urnFactory
 * @public
 * @param {Number} max
 */
cracked.urnFactory = function (max) {

    var arr = [];
    while(arr.length < max){
        var r = Math.floor(Math.random() * max);
        if(arr.indexOf(r) === -1) arr.push(r);
    }

    return function() {
        return cracked.array_next(arr);
    };

};

/**
 * Returns a random number between min & max
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#random
 * @public
 * @param {Number} min
 * @param {Number} max
 */
cracked.random = function (min, max) {
    return Math.round(min + Math.random() * (max - min) );
};

/**
 * Factory to create a throttling function that returns true when called every nth times
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#throttle_factory
 * @public
 * @param {Number} num
 */
cracked.throttle_factory = function  (num) {
    var index = 0;
    var number = num;
    return function() {
        index++;
        return index % number===0;
    };
};

/**
 * Factory to create a sequencing function that returns true when called every nth times
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#sequence_factory
 * @public
 * @param {Array} arr
 * @param {Function} fn
 */
cracked.sequence_factory = function  (arr,fn) {
    var count = 0;
    var current_index = 0;
    var arr_copy = arr.slice();
    var current_value = arr_copy[current_index];
    var transition = true;
    var first_run = true;
    return function() {
        if(count===current_value) {
            if(current_index===arr_copy.length-1) {
                current_index = 0;
            } else {
                current_index++;
            }
            count = 1;
            transition=true;
            current_value = arr_copy[current_index];
        } else {
            count++;
            transition=first_run||false;
        }
        fn(transition,current_index);
        first_run=false;
    };
};

//Sequence

/*
 __.sequence("foo")
 .step(function(){console.log("this step got called at minute 1")},1)
 .step(function(){console.log("this step got called at minute 2")},2);

 __.sequence("foo").start();
 */

//this should be private
cracked.__sequence_storage = {};

/**
 * Sequence - create a series of steps that take a function to execute and a time in minutes for when to execute it
 *
 * [See more sampler examples](examples/sequence.html)
 *
 * @plugin
 * @category Algorithmic
 * @function
 * @memberof cracked
 * @name cracked#sequence
 * @public
 * @param {String} name name of sequence
 */
cracked.sequence = function(name) {

    if(!cracked.__sequence_storage[name]) {
        cracked.__sequence_storage[name]={
            steps:{}
        };
    }

    return (function(name){
        return {
            step:function(func,time){
                cracked.__sequence_storage[name].steps[time.toString()]=func;
                return this;
            },
            start:function(){
                cracked.__sequence_storage[name].startTime = Date.now();
                cracked.__sequence_storage[name].clearInterval=setInterval(function(){
                    var time_elapsed = Date.now() - cracked.__sequence_storage[name].startTime;
                    var steps = Object.keys(cracked.__sequence_storage[name].steps);
                    if(steps.length) {
                        steps.map(function(x){
                            if(Math.floor(time_elapsed/60000) >= x) {
                                cracked.__sequence_storage[name].steps[x]();
                                delete cracked.__sequence_storage[name].steps[x];
                            }
                        });
                    } else {
                        clearInterval(cracked.__sequence_storage[name].clearInterval);
                    }
                },1000);
            },
            stop:function(){
                clearInterval(cracked.__sequence_storage[name].clearInterval);
            }
        };
    })(name);
};