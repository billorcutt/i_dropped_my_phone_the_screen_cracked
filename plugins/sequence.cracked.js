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
 * @category Miscellaneous
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