# Namespace #
Cracked has two global identifiers that all public methods are namespaced under: "cracked" &amp; "__".
```javascript
//create a sine
__.sine();

//same as above
cracked.sine();
```
# Creating #
A node is created by calling it's method. Node methods are factories: there's no new operator and methods don't return node instances (those are stored internally); they return the global namespace "cracked" object, which makes them chainable to other node and selector methods. Chaining nodes methods together creates and connects audio nodes.

```javascript
//create and connect sine->compressor->waveshaper->gain->dac
__().sine().compressor().waveshaper().gain().dac();
```
# Configuring #
Nodes are configurable at creation by passing an options JSON object that sets
several values at once. 
```javascript
//create, connect and configure
__().sine({frequency:800,detune:5,id:"sine1"}).delay({delay:0.5,feedback:0.75}).dac();
```
Many node methods will also accept a single parameter to set one key value. 
```javascript
//create, connect & configure - sine (frequency 800), delay (delay time 0.5) and system out (gain 0.5)
__().sine(800).delay(0.5).dac(0.75);
```

#  Selecting #
Cracked implements a form of rudimentary pattern matching, based on [CSS selectors](http://www.sitepoint.com/web-foundations/css-selectors/) to get references and make connections between nodes in the graph. You can refer to a node by its type:
```javascript
__("compressor") //selects all the compressors in the graph
```
or by using an assigned id or class:
  ```javascript
//create and connect some nodes
__().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();

__("#foo") //selects the sine
__(".bar") //selects the lowpass & the waveshaper
  ```
  Selectors can be grouped with a comma and the final match is the combination of both
  ```javascript
//create and connect some nodes
__().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();

__("#foo,.bar,dac") //selects the sine, lowpass, waveshaper & dac nodes
  ```
 
# Connecting #
 By default, at the time they are created, nodes will attempt to connect
 to the node immediately prior to them in the graph. It doesn't matter if
 the methods are chained together or not:
 
  ```javascript
//create & connect sine->lowpass->dac
__.sine();
__.lowpass();
__.dac();

//same as
__.sine().lowpass().dac();
  ```

 If there are no previous nodes, then a new node will look for selected nodes to
 connect to.
  ```javascript
//create and connect sine->lowpass->dac
__().sine().lowpass().dac();

//create a new delay and connect to the previously instantiated sine.
__("sine").delay();
  ```

 The connect method below makes it possible to connect outputs to the inputs of
 previous instantiated nodes.
  ```javascript
 //same as above, but connect the new delay's output the existing dac
 __().sine().lowpass().dac();

 //create a new delay and connect to the previously instantiated sine & dac
 __("sine").delay().connect("dac");
  ```

 If __() is invoked without arguments, it resets the
 selection/connection state, removing any record of previous nodes and
 effectively marking the start of a new connection chain. Since a new node
 will try to connect to any previous node, calling __() tells a node that
 there is no previous node to connect to.
  ```javascript
 //create & connect sine->lowpass->dac
 __.sine();
 __.lowpass();
 __.dac();

 //Create but don't connect
 __().sine();
 __().lowpass();
 __().dac();
  ```
## Connecting Modulators ##
 If a node has a "modulates" parameter, then it will attempt to
 connect to the next node as a modulator using the value of "modulates"
 as the type of audio param to connect to.
  ```javascript
 //create & connect sine->lowpass->dac
 __.sine().lowpass().dac();

 //create and connect saw and gain nodes
 //the gain will connect to the sine's frequency audio param
 __().saw(5).gain({gain:100,modulates:"frequency"}).connect("sine");

 //create and connect saw and gain nodes
 //the gain node will connect to the lowpass's q audio param
 __().saw(5).gain({gain:100,modulates:"q"}).connect("lowpass");

  ```
# Controlling #

There are two primary methods to set values on nodes: attr() sets one or more properties on an audio node and ramp() provides a general method for setting values over time.
```javascript
//create and connect sine->delay->dac
__().sine().delay().dac();

//set the delay's delay time to 2
__("delay").attr({delay:2});

//change the frequency to 800 over 5 seconds
__("sine").ramp(800, 5,"frequency");
``` 
There are also convenience methods for setting a single value
```javascript
//create and connect sine->delay->dac
__().sine().delay().dac();

//set the delay's delay time to 2
__("delay").time(2);
//set the sine's frequency to 800
__("sine").frequency(800);
``` 
Starting and stopping source nodes is done using start() & stop() methods.
```javascript
//create and connect sine->delay->dac
__().sine().delay().dac();

//start
__("sine").start();
//stop
__("sine").stop();

//short hand way to call start on all nodes __(*).start() 
__.play(); 
``` 
# Sequencing #
Sequencing in cracked uses the loop() method to schedule events. It's configured with a number of steps and an interval size in milliseconds. Loop emits events while running and it's possible to bind nodes to the step event and execute a callback on a set of selected nodes for each step.
```javascript
//set up a sound and start it playing
__().sine().dac().play();

//configure the loop: 8 steps, 100ms between steps
__.loop({steps:8,interval:100});

//bind to the step event. the callback is passed
//the current array element, index and a reference to the array
__("sine").bind("step",function(data,index,array){

  //use the incoming data to set the frequency
  __.frequency(data*100);
  
  //callback iterates over the data array
},[1,2,3,4,5,6,7,8]);

//start the sequencer
__.loop("start");

```


# Macros &amp; Plugins #
  Macros allow any chain of audio nodes to be encapsulated as a single unit.
  The begin() & end() methods mark the beginning and end of a macro chain. 
  Once defined, a macro effectively becomes a unit and can be selected by 
  type/id/class like any other node. Parameter change requests will be mapped 
  to any audio params nodes within the macro that match the request. For example:
  ```javascript
  //define a simple macro named "microsynth"
  __().begin("microsynth").sine().gain(0).dac().end("microsynth");
 
  //change the frequency of the sine
  __("microsynth").frequency(100);
 
  //start it up
  __("microsynth").start();
 
  //set the level
  __("microsynth").volume(.5);
  ```
  If we wrap the a macro in a function, it becomes a plugin and now it's possible
  to instantiate as many microsyths as we need, connect them to other nodes,
  address them individually or as a group, nest them within other macros, etc.
  ```javascript
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
# Usage #
Use the cracked library by including the cracked.js or cracked.min.js file from the dist directory in your page.

```html
<script src="path_to_cracked.js"></script>
```
