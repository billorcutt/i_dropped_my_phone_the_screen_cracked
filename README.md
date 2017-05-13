
I Dropped My Phone The Screen Cracked
-------------------------------------
_I Dropped My Phone The Screen Cracked_ is a [web audio](https://webaudio.github.io/web-audio-api/) library that uses method chaining and CSS-style selectors to simplify creating, configuring and connecting audio nodes in the browser. Here's hello world:

```javascript
//create and connect sine and system out. start the sine
__().sine().dac().play();
```
and a slightly more complex example:

```javascript
//create and connect a sine oscillator (frequency of 180), lowpass,
//compressor and system output (level of .5).
__().sine(180).lowpass({frequency:160,q:5,id:"lp1"}).compressor().dac(.5);

//select the sine using its type and change the detune to 10
__("sine").detune(10);

//use the id to get a reference to the lowpass
//filter and set the frequency to 600
__("#lp1").frequency(600);

//create and connect a sawtooth oscillator, waveshaper & compressor
//and connect the compressor to the existing dac we created above.
__().saw(800).waveshaper().compressor().connect("dac");

//change the ratio of both compressors to 12
__("compressor").attr("ratio",12);

//start the sine and the sawtooth
__("sine,saw").start();
```
Audio node chains can be encapsulated as units using macros

```javascript
//define a simple macro named "microsynth"
__().begin("microsynth").sine().gain().end("microsynth").dac();

//change the frequency of the sine
__("microsynth").frequency(100);

//start it up
__("microsynth").start();
```
and macros can be wrapped in simple factory functions to create plugins, making it possible
to instantiate instances, connect them to other nodes, address them individually or as a group, 
nest them within other macros, etc.
```javascript
//define a plugin called microsynth
cracked.microsynth = function(params) {
    //pass any params to begin() so they can associated with the instance
    __().begin("microsynth",params).sine().gain(0).end("microsynth");
    //return cracked so we can chain methods
    return cracked;
}

//create two instances with different ids
__().microsynth({id:"micro1"}).lowpass().dac();
__().microsynth({id:"micro2"}).lowpass().connect("dac");

//change the frequency in the first
__("#micro1").frequency(1200);
//change the frequency in the second
__("#micro2").frequency(600);

//set the gain in both and start them
__("microsynth").volume(1).start();
```
Generally, the goal of _I Dropped My Phone The Screen Cracked_ is simplicity, brevity without obscurity and making audio coding as intuitive as patching a modular, so that noise makers can focus on keeping it weird and fun.

If you're interested in knowing more, there's a one page [overview](OVERVIEW.md), full source [documentation](http://billorcutt.github.io/i_dropped_my_phone_the_screen_cracked/), a [Reddit interview](https://www.reddit.com/r/WeAreTheMusicMakers/comments/4g6bic/cracked_is_an_opensource_coding_program_for/), some [press](https://www.thewire.co.uk/news/41540/bill-orcutt-releases-open-source-audio-programme), and a useful app for Mac or Linux to [try it all out](https://github.com/billorcutt/Cracked).

Also [cat pictures](http://idroppedmyphonethescreencracked.tumblr.com).

If you'd like to contribute, you can send a comment to info@fastinversesquare.com, open an [issue](https://github.com/billorcutt/i_dropped_my_phone_the_screen_cracked/issues) for bugs or feature enhancements or best of all, submit a pull request.



