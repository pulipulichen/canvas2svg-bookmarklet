var _repo_baseurl = "https://pulipulichen.github.io/canvas2svg-bookmarklet";

var _load_filesaver = function (_callback) {
    if (typeof (saveAs) === "function") {
        if (typeof (_callback) === "function") {
			_callback();
		}
    } else {
        $.getScript(_repo_baseurl + "/lib/FileSaver.min.js", function () {
            if (typeof (_callback) === "function") {
                _callback();
            }
        });
    }
};

var _load_canvassvg = function (_callback) {
    if (typeof (CanvasSVG) !== "undefined") {
        if (typeof (_callback) === "function") {
			_callback();
		}
    } else {
        $.getScript(_repo_baseurl + "/lib/canvas-getsvg.js", function () {
            if (typeof (_callback) === "function") {
                _callback();
            }
        });
    }
};

var _load_canvas2svg = function (_callback) {
    if (typeof (C2S) !== "undefined") {
        if (typeof (_callback) === "function") {
			_callback();
		}
    } else {
        $.getScript(_repo_baseurl + "/lib/canvas2svg.js", function () {
            if (typeof (_callback) === "function") {
                _callback();
            }
        });
    }
};

var _convert_canvas_to_svg = function (_callback) {

    var _canvas_coll = $('canvas:visible');

    var _next = function (_i) {
        _i++;
        setTimeout(function () {
            _loop(_i);
        }, 500);
    };

    var _loop = function (_i) {
        if (_i < _canvas_coll.length) {
            var _canvas = _canvas_coll.eq(_i);

            if (typeof (_canvas.attr("id")) === "undefined") {
                _canvas.attr("id", "canvas_" + _i);
            }
            var _id = _canvas.attr("id");
            //console.log(_id);
			
			if (_debug === true) {
				_next(_i);
				return;
			}

            
            var canvas = document.getElementById(_id);
			var cs = new CanvasSVG.Deferred();
            cs.wrapCanvas(canvas);
            $(canvas).click();
            var svg_object = cs.getSVG();
            var svg_text = svg_object.outerHTML;
			//console.log(svg_text);
			
			if (svg_text.replace(/>\s+</g,'><').split("><").length === 2) {
				$(canvas).click();
				svg_object = cs.getSVG();
				svg_text = svg_object.outerHTML;
			}
			
			if (svg_text.replace(/>\s+</g,'><').split("><").length > 2) {
				var svg = new Blob([svg_text], {type: 'text/plain'});
				saveAs(svg, _id + ".svg");
			}

            _next(_i);

        } else {
            if (typeof (_callback) === "function") {
                _callback();
            }
        }
    };

    _loop(0);
};

var _save_svg = function (_callback) {

    var _svg_coll = $('svg:visible');

    var _next = function (_i) {
        _i++;
        setTimeout(function () {
            _loop(_i);
        }, 500);
    };

    var _loop = function (_i) {
        if (_i < _svg_coll.length) {
            var _svg_item = _svg_coll.eq(_i);

            if (typeof (_svg_item.attr("id")) === "undefined") {
                _svg_item.attr("id", "svg_" + _i);
            }
            var _id = _svg_item.attr("id");
            //console.log(_id);
			
			if (_debug === true) {
				_next(_i);
				return;
			}

			var _svg_object = document.getElementById(_id);
            var svg_text = _svg_object.outerHTML;
			//console.log(svg_text);
			if (svg_text.replace(/>\s+</g,'><').split("><").length > 2) {
				var svg = new Blob([svg_text], {type: 'text/plain'});
				saveAs(svg, _id + ".svg");
			}

            _next(_i);

        } else {
            if (typeof (_callback) === "function") {
                _callback();
            }
			
        }
    };

    _loop(0);
};

// -------------------------

if (typeof(_need_reload) === "undefined") {
	_need_reload = false;
}
var _debug = false;

var _main = function () {
	
	if (_need_reload === true) {
		if (window.confirm("Please reload webpage to save canvas again. Do you want to reload now?")) {
			location.reload();
		}
		return;
	}
	
    _load_filesaver(function () {
		_load_canvas2svg(function() {
			_load_canvassvg(function () {
				_convert_canvas_to_svg(function () {
					_save_svg(function () {
						_need_reload = true;
						
						if (_debug === true) {
							_test_proc();
						}
					});
				});
			});

		});
    });
};

cloneCanvas = function (newCanvas, oldCanvas) {

    //create a new canvas
    //var newCanvas = document.createElement('canvas');
    context = newCanvas.getContext('2d');
	oldContext = oldCanvas.getContext('2d');

    //set dimensions
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;

    //apply the old canvas to the new one
    context.drawImage(oldCanvas, 0, 0);
	context.scale(1,1);
	//imageData = oldContext.getImageData(0, 0, oldContext.canvas.width, oldContext.canvas.height);
	//context.putImageData(imageData, 0, 0);

    //return the new canvas
    return newCanvas;
};

var _test_proc = function () {
	oldCanvas = document.getElementById("canvas");
	/*
	//console.log(oldCanvas.toDataURL());
	$('<canvas id="temp_canvas"></canvas>').prependTo("body");
	newCanvas = document.getElementById("temp_canvas");
	cs = new CanvasSVG.Deferred();
	//cs.wrapCanvas(newCanvas);
	cs.wrapCanvas(oldCanvas);
	oldContext = oldCanvas.getContext('2d');
	oldContext.scale(2,2);
	setTimeout(function () {
		//cloneCanvas(newCanvas, oldCanvas);
		// 
		setTimeout(function () {
			console.log(cs.getSVG());
		}, 0);

	},0);
	*/
	var myMockContext = new C2S(600,400); //pass in your desired SVG document width/height

	var draw = function(ctx) {
		//do your normal drawing
		ctx.drawImage(oldCanvas,0,0);
		//etc...
	}

	draw(myMockContext);
	myMockContext.getSerializedSvg(); //returns the serialized SVG document
	console.log(myMockContext.getSvg()); //inline svg
};

// Load the script
var script = document.createElement("SCRIPT");
script.src = _repo_baseurl + "/lib/jquery-latest.min.js";
script.type = 'text/javascript';
script.onload = function () {
    jQuery.noConflict();
    $ = window.jQuery;
    _main();
};
document.getElementsByTagName("head")[0].appendChild(script);
