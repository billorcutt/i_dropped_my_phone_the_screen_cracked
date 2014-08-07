I Dropped My Phone The Screen Cracked
-------------------------------------
I Dropped My Phone The Screen Cracked is a [web audio](http://www.w3.org/TR/webaudio/) library that uses method chaining and CSS-style selectors to simplify creating, configuring and connecting audio nodes in the browser. Here's hello world:

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

If you'd like to see more, there's a one page [quickstart](QUICKSTART.md), full code [documentation](http://www.tumblr.com) and a playground to [try it all out](http://www.tumblr.com). Also [cat pictures](http://idroppedmyphonethescreencracked.tumblr.com).



