
  #Selecting#
  Cracked implements a subset of [CSS selectors](http://www.sitepoint.com/web-foundations/css-selectors/) to get references and make connections between nodes
  in the graph. You can refer to a node by its type:
  <code>
      \_\_("compressor") //selects all the compressors in the graph
  </code>
  or by using an assigned id or class:
  <code>
      //create and connect some nodes
      \_\_().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();
  </code> <code>
      \_\_("#foo") //selects the sine
      \_\_(".bar") //selects the lowpass & the waveshaper
  </code>
  Selectors can be grouped with a comma and the final match is the combination of both
  <code>
      //create and connect some nodes
      \_\_().sine({id:"foo"}).lowpass({class:"bar"}).waveshaper({class:"bar"}).dac();
  </code><code>
      \_\_("#foo,.bar,dac") //selects the sine, lowpass, waveshaper & dac nodes
  </code>
 

 #Connecting#
 By default, at the time they are created, nodes will attempt to connect
 to the node immediately prior to them in the graph. It doesn't matter if
 the methods are chained together or not:
 <code>
 //create & connect sine->lowpass->dac
 \_\_.sine();
 \_\_.lowpass();
 \_\_.dac();

 //same as
 \_\_.sine().lowpass().dac();
 </code>

 If there are no previous nodes, then a new node will look for selected nodes to
 connect to.
 <code>
 //create and connect sine->lowpass->dac
 \_\_().sine().lowpass().dac();

 //create a new delay and connect to the previously instantiated sine.
 \_\_("sine").delay();
 </code>

 The connect method below makes it possible to connect outputs to the inputs of
 previous instantiated nodes.
 <code>
 //same as above, but connect the new delay's output the existing dac
 \_\_().sine().lowpass().dac();

 //create a new delay and connect to the previously instantiated sine.
 \_\_("sine").delay().connect("dac");
 </code>

 As noted above, if cracked() is invoked without arguments, it resets the
 selection/connection state, removing any record of previous nodes and
 effectively marking the start of a new connection chain. Since a new node
 will try to connect to any previous node, calling \_\_() tells a node that
 there is no previous node to connect to.
 <code>
 //create & connect sine->lowpass->dac
 \_\_.sine();
 \_\_.lowpass();
 \_\_.dac();

 //Create but don't connect
 \_\_().sine();
 \_\_().lowpass();
 \_\_().dac();
 </code>

 ##Connecting Modulators##
 If a node was created with a "modulates" parameter, then it will attempt to
 connect to the following node as a modulator using the value of "modulates"
 as the type of audio param to connect to.
 <code>
 //create & connect sine->lowpass->dac
 \_\_.sine().lowpass().dac();

 //the gain node will connect to the sine's frequency audio param
 \_\_.saw(5).gain(gain:100,modulates:"frequency").connect("sine");

 //the gain node will connect to the lowpass's q audio param
 \_\_.saw(5).gain(gain:100,modulates:"q").connect("lowpass");

 </code>


  #Macros &amp; Plugins#
  Macros allow any chain of audio nodes to be encapsulated as a single unit.
  The begin(&lt;macro-name&gt;) & end(&lt;macro-name&gt;) methods marking the beginning and
  end of a macro chain. Once defined, a macro effectively becomes a unit and
  can be selected by type/id/class like any other node. Parameter change requests
  will be mapped to any audio params nodes within the macro that match the
  request. For example:
  <code>
  //define a simple macro named "microsynth"
  \_\_().begin("microsynth").sine().gain(0).dac().end("microsynth");
 
  //change the frequency of the sine
  \_\_("microsynth").frequency(100);
 
  //start it up
  \_\_("microsynth").start();
 
  //set the level
  \_\_("microsynth").volume(.5);
 </code>
  If we wrap the a macro in a function, it becomes a plugin and now it's possible
  to instantiate as many microsyths as we need, connect them to other nodes,
  address them individually or as a group, nest them within other macros, etc.
  <code>
  cracked.microsynth = function(params) {
  //pass any params to begin() so they can associated with the instance
   \_\_().begin("microsynth",params).sine().gain(0).end("microsynth");
   //return cracked so we can chain methods
   return cracked;
  }
 
  //create two instances with different ids
  \_\_().microsynth({id:"micro1"}).lowpass().dac();
  \_\_().microsynth({id:"micro2"}).lowpass().connect("dac");
 
  //change the frequency in the first
  \_\_("#micro1").frequency(1200);
  //change the frequency in the second
  \_\_("#micro2").frequency(600);
 
  //set the gain in both and start them
  \_\_("microsynth").volume(1).start();
  </code>
