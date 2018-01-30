var _load_filesaver = function (_callback) {
    if (typeof (saveAs) === "function") {
        return _callback();
    } else {
        $.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/FileSaver.min.js", function () {
            _callback();
        });
    }
};

var _load_canvassvg = function (_callback) {
    if (typeof (CanvasSVG) !== "function") {
        return _callback();
    } else {
        $.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/canvas-getsvg.js", function () {
            _callback();
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

            var cs = new CanvasSVG.Deferred();
            var canvas = document.getElementById(_id);
            cs.wrapCanvas(canvas);
            var ctx = canvas.getContext('2d');

            var svg = new Blob([cs.getSVG().outerHTML], {type: 'text/plain'});
            saveAs(svg, _id + ".svg");

            next(_i);
        } else {
            if (typeof (_callback) === "function") {
                _callback();
            }
        }
    };

    _loop(0);
};

_load_filesaver(function () {
    _load_canvassvg(function () {
       var canvas2svg_is_ready = false;



var _load_filesaver = function (_callback) {
    if (typeof(saveAs) === "function") {
		return _callback();
	}
	else {
		$.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/FileSaver.min.js", function () {
			_callback();
		});
	}
};

var _load_canvassvg = function (_callback) {
    if (typeof(CanvasSVG) !== "function") {
		return _callback();
	}
	else {
		$.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/canvas-getsvg.js", function () {
			_callback();
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
			
			if (typeof(_canvas.attr("id")) === "undefined") {
				_canvas.attr("id", "canvas_" + _i);
			}
			var _id = _canvas.attr("id");
			
			var cs = new CanvasSVG.Deferred();
			var canvas = document.getElementById(_id);
			cs.wrapCanvas(canvas);
			var ctx = canvas.getContext('2d');
			
			var svg = new Blob([cs.getSVG().outerHTML], {type: 'text/plain'});
			saveAs(svg, _id + ".svg");
			
			next(_i);
		}
		else {
			if (typeof(_callback) === "function") {
				_callback();
			}
		}
	};
	
	_loop(0);
};

var _main = function () {
	_load_filesaver(function () {
		_load_canvassvg(function () {
			_convert_canvas_to_svg();
		});
	});	
};

// Anonymous "self-invoking" function

    // Load the script
    var script = document.createElement("SCRIPT");
    script.src = 'https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/jquery-latest.min.js';
    script.type = 'text/javascript';
    script.onload = function() {
        jQuery.noConflict();
        $ = window.jQuery;
        _main();
    };
    document.getElementsByTagName("head")[0].appendChild(script);

//((function(e,s){e.src=s;e.onload=function(){jQuery.noConflict();$=jQuery;_main()};document.head.appendChild(e);})(document.createElement('script'),'https://code.jquery.com/jquery-latest.min.js'))