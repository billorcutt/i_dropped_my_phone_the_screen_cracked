#Creating
A node is created by calling it's method. Node methods are factories: there's no new operator and methods don't return node instances (those are stored internally); they return the global namespace "cracked" object, which makes them chainable to other node methods and selectors in order to create chains of connected nodes.

```javascript
//create and connect sine->compressor->waveshaper->gain->dac
__().sine().compressor().wavehshaper().gain().dac();
```

#  Selecting
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

 //create a new delay and connect to the previously instantiated sine.
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
 __.saw(5).gain(gain:100,modulates:"frequency").connect("sine");

 //create and connect saw and gain nodes
 //the gain node will connect to the lowpass's q audio param
 __.saw(5).gain(gain:100,modulates:"q").connect("lowpass");

  ```
# Configuring and Controlling #
Nodes are configurable at creation by passing an options JSON object that sets
several values at once. Many node methods will also accept a single parameter 
to set one key value. (sine() for example takes either an options object that can
set frequency, detune, class or id, or it can take a single number to set just
frequency).

There are a variety of methods for interacting with nodes. attr() is the generic way
to set one or more properties on an audio node. ramp() provides a general method for
changing values over time

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
