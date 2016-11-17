	//page js for examples pages
	$(
        //play button support
		function() {
            //behind the scenes we're sticking the code
            //in the editor into a macro to sandbox it
            //and prevent interaction with the
            //other examples on the page. Not needed in
            //a "normal" use case
			$(".play").click(function() {
                if(__.isSupported()) {

                    var $element = $(this),
                        id = $element.data("id");
                    if ($element.text() === "START") {
                        var editor = window[id];
                        __().begin(id);
                        eval(editor.getValue());
                        __().end(id);
                        __(id).start();
                        $element.text("STOP");
                    } else {
                        __(id).stop();
                        __(id).loop("stop");
                        __(id).remove();
                        __(id).loop("reset");
                        $element.text("START");
                    }

                } else {
                    $("<div class='msg'>Sorry, your browser doesn't appear to support web audio. <a href='http://browsehappy.com'>Upgrade?</a><div id='close'>x</div></div>").appendTo("body");
                    $("#close").click(function(){
                        $("#close").unbind();
                        $(".msg").remove();
                    });
                    window.scrollTo(0,0);
                }
			});

            //set up editors
            $(".editor").each(function(i,el){
                //assume the editors are id'ed
                //numerically top to bottom
                var id = "editor" + (i + 1);
                var editor = ace.edit(id);
                editor.setTheme("ace/theme/idle_fingers");
                editor.getSession().setMode("ace/mode/javascript");
                editor.setFontSize(14);
                window[id] = editor;
            });

			//listen for sliders
			$("input[type='range']").bind("input", function(evt) {
				if (evt && evt.target) {
					var param = $(evt.target).data("modifies");
					var node = $(evt.target).data("selector");
					var editor = $(evt.target).prevAll("div.editor:first").attr("id");
					var value = {};
					value[param] = evt.target.value;
					__(editor + " " + node).attr(value);
				}
			});

            $("#examples_select").change(function(){
                var index = this.selectedIndex;
                var editor = window["editor1"];
                var $button = $(".play");
                if($button.text()==="STOP") {
                    $button.click();
                }
                editor.setValue($("#example"+index).text(),-1);
            });
		});