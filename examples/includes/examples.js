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
			});

            //set up editors
            $(".editor").each(function(i,el){
                //assume the editors are id'ed
                //numerically top to bottom
                var id = "editor" + (i + 1);
                var editor = ace.edit(id);
                editor.setTheme("ace/theme/textmate");
                editor.getSession().setMode("ace/mode/javascript");
                editor.setFontSize(18);
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

		});