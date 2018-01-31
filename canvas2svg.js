var _load_filesaver = function (_callback) {
    if (typeof (saveAs) === "function") {
        if (typeof (_callback) === "function") {
			_callback();
		}
    } else {
        $.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/FileSaver.min.js", function () {
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
        $.getScript("https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/canvas-getsvg.js", function () {
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

            var cs = new CanvasSVG.Deferred();
            var canvas = document.getElementById(_id);

            cs.wrapCanvas(canvas);
            $(canvas).click();
            var svg_object = cs.getSVG();
            var svg_text = svg_object.outerHTML;

            var svg = new Blob([svg_text], {type: 'text/plain'});
            saveAs(svg, _id + ".svg");

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

            var svg_text = _svg_item.outerHTML;

            var svg = new Blob([svg_text], {type: 'text/plain'});
            saveAs(svg, _id + ".svg");

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

var _main = function () {
	
	if (_need_reload === true) {
		if (window.confirm("Please reload webpage to save canvas again. Do you want to reload now?")) {
			location.reload();
		}
		return;
	}
	
    _load_filesaver(function () {
        _load_canvassvg(function () {
            _convert_canvas_to_svg(function () {
				_save_svg(function () {
					_need_reload = true;
				});
			});
        });
    });
};

// Load the script
var script = document.createElement("SCRIPT");
script.src = 'https://pulipulichen.github.io/canvas2svg-bookmarklet/lib/jquery-latest.min.js';
script.type = 'text/javascript';
script.onload = function () {
    jQuery.noConflict();
    $ = window.jQuery;
    _main();
};
document.getElementsByTagName("head")[0].appendChild(script);
