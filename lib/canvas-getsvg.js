
// XXX TODO
//---missing---
//  - images
//  - clip
//  - gradients
//  - patterns
//  - fillStyle and strokeStyle as paint servers
//  - arcTo
//  - maxWidth on text
//  - shadowColor
//  - dynamic filter w/h
//  - composite copy or lighter
//  - video
//  - other canvases
//  - lots of tests
//  - add a stringification method
//  - add wrapper around toDataURL("image/svg+xml")
//  - Google Code
//  - lots of shortcuts in data verification taken compared to spec
//---tests---
//  - text
//  - shadows
//  - more complex paths
//  - clips
//---ideas---
//  - gradients and patterns, need to wrap the objects, need to have creator
//    methods different from the basic ones, and need to have different get/set
//    for fillStyle and strokeStyle
//  - for ImageData, it might be needed at some point to create an invisible canvas
//    element, put the image data there, and getDataURL from it
//  - take a bunch of complex canvas scripts and try them out
//  - wire in Processing.js

CanvasSVG = {};
CanvasSVG.Base = function () {};
CanvasSVG.Base.prototype = {
    ns:     'http://www.w3.org/2000/svg',
    id:     0,

    // --- core
    wrapCanvas: function (c) {
        if (c.canvasSVGWrapper) return;
        var obj = this;
        this.el = c;
        c._getContext = c.getContext;
        c.getContext = function (dim) { return obj.getContext(dim); };
        c.canvasSVGWrapper = true;
        this.canvas = c; // shouldn't be needed, but seems to be
    },
    
    getContext: function (dim) {
        if (dim == "2d" || dim == "2D") {
            this.context = this.el._getContext(dim);
            return this;
        }
        return this.el._getContext(dim);
    },
    
    // get canvas () {
    //     return this.el;
    // },
    
    // --- SVG basics
    makeElement:    function (ln, attr, txt, parent) {
        var el = document.createElementNS(this.ns, ln);
        if (attr) {
            for (var k in attr) {
                el.setAttributeNS(null, k, attr[k]);
            }
        }
        if (txt) el.textContent = txt;
        if (parent) parent.appendChild(el);
        return el;
    },
    
    addElement:     function (ln, attr, txt) {
        this.svg.appendChild(this.makeElement(ln, attr, txt));
    },
    
    // --- specific element command handlers
    processCommon:  function (type, attr, cur, trans) {
        attr.opacity = cur.globalAlpha;
        if (type == 'fill') this.setFill(attr, cur);
        else                this.setStroke(attr, cur);
        this.processTransforms(attr, trans);
        this.processFilters(attr, cur);
    },
    
    setFill:    function (attr, cur) {
        // XXX note that fillStyle can be a paint server too
        // WebKit refuses rgba() in SVG
        if (/^rgba\(/.test(cur.fillStyle)) {
            // XXX might not be the real grammar, check
            var re = /^\s*rgba\s*\(([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\)\s*$/i;
            var res = re.exec(cur.fillStyle);
            attr.fill = "rgb(" + res[1] + "," + res[2] + "," + res[3] + ")";
            attr['fill-opacity'] = res[4];
        }
        else {
            attr.fill = cur.fillStyle;
        }
        attr.stroke = 'none';
    },

    setStroke:    function (attr, cur) {
        // XXX note that strokeStyle can be a paint server too
        attr.fill = 'none';
        // WebKit refuses rgba() in SVG
        if (/^rgba\(/.test(cur.strokeStyle)) {
            // XXX might not be the real grammar, check
            var re = /^\s*rgba\s*\(([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\s*,\s*([^,\s]+)\)\s*$/i;
            var res = re.exec(cur.strokeStyle);
            attr.stroke = "rgb(" + res[1] + "," + res[2] + "," + res[3] + ")";
            attr['stroke-opacity'] = res[4];
        }
        else {
            attr.stroke = cur.strokeStyle;
        }
        attr.stroke = cur.strokeStyle;
        attr['stroke-width'] = cur.lineWidth;
        attr['stroke-linecap'] = cur.lineCap;
        attr['stroke-linejoin'] = cur.lineJoin;
        attr['stroke-miterlimit'] = cur.miterLimit;
    },
    
    addRect:    function (type, cur, prm, trans) {
        var attr = { x: prm[0], y: prm[1], width: prm[2], height: prm[3] };
        this.processCommon(type, attr, cur, trans);
        this.addElement('rect', attr);
    },
    
    addPath:    function (type, cur, path, trans) {
        var attr = { d: this.buildPath(path) };
        this.processCommon(type, attr, cur, trans);
        this.addElement('path', attr);
    },
    
    addText:    function (type, cur, prm, trans) {
        var textAnchor = 'start';
        if (cur.textAlign === 'center') {
          textAnchor = 'middle';
        } else if (cur.textAlign === 'right') {
          textAnchor = 'end';
        }
        // XXX we don't support prm[3] maxWidth
        var attr = {
            x:                      prm[1],
            y:                      prm[2],
            style:                  "font: " + cur.font, // there isn't a font attribute
            'text-anchor':          textAnchor,
            'alignment-baseline':   cur.textBaseline,
        };
        this.processCommon(type, attr, cur, trans);
        this.addElement('text', attr, prm[0]);
    },
    
    buildPath:  function (path) {
        var cmds = [];
        for (var i = 0; i < path.length; i++) {
            var subP = Array.prototype.slice.call(path[i]);
            var cmd = [subP.shift()];
            if (cmd[0] == 'A') {
                cmd.push(subP.shift() + "," + subP.shift(),
                         subP.shift(),
                         subP.shift() + "," + subP.shift(),
                         subP.shift() + "," + subP.shift()
                        );
            }
            else {
                while (subP.length) {
                    cmd.push(subP.shift() + "," + subP.shift());
                }
            }
            cmds.push(cmd.join(" "));
        }
        return cmds.join(" ");
    },

    processTransforms: function (attr, trans) {
        if (trans.length) {
            attr.transform = trans.join(" ");
        }
    },
    
    processFilters: function (attr, cur) {
        if (cur.shadowOffsetX != 0 || cur.shadowOffsetY != 0 || cur.globalCompositeOperation != 'source-over') {
            var id = this.newID("fe");
            // XXX w/h may be wrong
            var filter = this.makeElement('filter', { id: id, width: "150%", height: "150%" }, null, this.svg);
            var feb;
            if (cur.shadowOffsetX != 0 || cur.shadowOffsetY != 0) {
                // XXX shadowColor not currently supported
                this.makeElement('feOffset', {
                                            "in":     "SourceGraphic",
                                            result: "offsetOut",
                                            dx:     cur.shadowOffsetX,
                                            dy:     cur.shadowOffsetY,
                }, null, filter);
                // this.makeElement('feFlood', {
                //                             result:             "floodOut",
                //                             'floor-color':      cur.shadowColor,
                //                             'floor-opacity':    1,
                // }, null, filter); // need a composite here
                this.makeElement('feGaussianBlur', {
                                            "in":                 "offsetOut", // change this when fixed
                                            result:             "blurOut",
                                            stdDeviation:       cur.shadowBlur,
                }, null, filter);
                feb = this.makeElement('feBlend', {
                                            "in":                 "SourceGraphic",
                                            in2:                "blurOut",
                                            mode:               "normal",
                }, null, filter);
            }
            // XXX we don't support copy or lighter
            if (cur.globalCompositeOperation != 'source-over') {
                var gco = cur.globalCompositeOperation;
                if (gco != "copy" && gco != "lighter") {
                    var attr = {};
                    if (gco.indexOf("source-") == 0 || gco == "xor") {
                        attr["in"] = "SourceGraphic";
                        attr.in2 = "BackgroundImage";
                    }
                    else if (gco.indexOf("destination-") == 0) {
                        attr["in"] = "BackgroundImage";
                        attr.in2 = "SourceGraphic";
                    }

                    if (/-in$/.test(gco)) attr.operator = "in";
                    else if (/-out$/.test(gco)) attr.operator = "out";
                    else if (/-atop$/.test(gco)) attr.operator = "atop";
                    else if (/-over$/.test(gco)) attr.operator = "over";
                    else if (gco == "xor") attr.operator = "xor";

                    this.svg.setAttributeNS(null, 'enable-background', 'accumulate');
                    var fcomp = this.makeElement('feComposite', attr, null, filter);

                    if (feb) {
                        feb.setAttributeNS(null, "result", "blendOut");
                        fcomp.setAttributeNS(null, "in", "blendOut");
                    }
                }
            }
            attr.filter = "url(#" + id + ")";
        }
    },
    // not 100% sure of my filters...
    //<feFlood flood-color="red" flood-opacity='0.3' result='pict2'/>
    // <filter id = "i1" width = "150%" height = "150%">
    //     <feOffset result = "offOut" in = "SourceGraphic" dx = "30" dy = "30"/>
    //     <feColorMatrix result = "matrixOut" in = "offOut" type = "matrix" values = "0.2 0 0 0 0 0 0.2 0 0 0 0 0 0.2 0 0 0 0 0 1 0"/>
    //     <feGaussianBlur result = "blurOut" in = "matrixOut" stdDeviation = "10"/>
    //     <feBlend in = "SourceGraphic" in2 = "blurOut" mode = "normal"/>
    // </filter>
    
    doClearRect:    function (prm) {
        // if all is cleared, optimise it away
        if (prm[0] == 0 && prm[1] == 0 && prm[2] == this.el.width && prm[3] == this.el.height) {
            this.svg.textContent = "";
            return;
        }

        // we use a clipPath for this -- the z and the fill-rule may be wrong
        var x = prm[0], y = prm[1], w = prm[2], h = prm[3];
        var cW = this.el.width, cH = this.el.height;
        var id = this.newID("cp");
        var cp = this.makeElement('clipPath', { id: id });
        var d = "M 0,0 L " + cW + ",0 L" + cW + "," + cH + " L 0," + cH + " z " +
                "M " + x + "," + y + " L " + (x+w) + "," + y  + " L " + (x+w) + "," + (y+h) +
                 " L " + x + "," + (y+h) + " z";
        var path = this.makeElement('path', { d: d, 'fill-rule': 'evenodd' });
        cp.appendChild(path);
        
        var g = this.makeElement('g', { 'clip-path': "url(#" + id + ")"});
        while (this.svg.childNodes.length) g.appendChild(this.svg.firstChild);
        this.svg.appendChild(cp);
        this.svg.appendChild(g);
    },
    
    // --- utils
    simpleClone:    function (obj) {
        var ret = {};
        for (var k in obj) ret[k] = obj[k];
        return ret;
    },
    
    newID:       function (pfx) {
        this.id++;
        return pfx + this.id;
    },
    
    // the braaaaaaaaiiiins
    handleCommands: function (cmd, prm) {
        switch (cmd) {
            // properties
            case 'fillStyle':
            case 'strokeStyle':
            case 'globalAlpha':
            case 'globalCompositeOperation':
            case 'lineWidth':
            case 'lineCap':
            case 'lineJoin':
            case 'miterLimit':
            case 'shadowOffsetX':
            case 'shadowOffsetY':
            case 'shadowBlur':
            case 'shadowColor':
            case 'font':
            case 'textAlign':
            case 'textBaseline':
                this.cur[cmd] = prm;
                break;
            // methods
            case 'save':
                this.stack.push(this.cur, this.trans);
                this.cur = this.simpleClone(this.defs);
                this.trans = [];
                break;
            case 'restore':
                this.trans = this.stack.pop();
                this.cur = this.stack.pop();
                break;
            case 'fillRect':
                this.addRect('fill', this.cur, prm, this.trans);
                break;
            case 'strokeRect':
                this.addRect('stroke', this.cur, prm, this.trans);
                break;
            case 'scale':
                this.trans.push("scale(" + prm[0] + ", " + prm[1] + ")");
                break;
            case 'rotate':
                var rot = prm[0] * 180 / Math.PI;
                this.trans.push("rotate(" + rot + ")");
                break;
            case 'translate':
                this.trans.push("translate(" + prm[0] + ", " + prm[1] + ")");
                break;
            case 'setTransform':
                this.trans = [];
            case 'transform':
                this.trans.push("matrix(" + prm[0] + ", " + prm[1] + ", " + prm[2] + ", " + prm[3] + ", " + prm[4] + ", " + prm[5] + ")");
                break;
            case 'createLinearGradient':
                // we need a way to map from a gradient object to this: IDs
                // XXX
                break;
            case 'createRadialGradient':
                // XXX
                break;
            case 'createPattern':
                // XXX
                break;
            case 'clearRect':
                this.doClearRect(prm);
                break;
            case 'beginPath':
                this.path = [];
                break;
            case 'closePath':
                this.path.push(['z']);
                break;
            case 'moveTo':
                this.path.push(['M', prm[0], prm[1]]);
                break;
            case 'lineTo':
                this.path.push(['L', prm[0], prm[1]]);
                break;
            case 'quadraticCurveTo':
                this.path.push(['Q', prm[0], prm[1], prm[2], prm[3]]);
                break;
            case 'bezierCurveTo':
                this.path.push(['S', prm[0], prm[1], prm[2], prm[3]]);
                break;
            case 'arcTo':
                // XXX not implemented yet
                break;
            case 'rect':
                var x = prm[0], y = prm[1], w = prm[2], h = prm[3];
                this.path.push(
                        ['M', x, y],
                        ['L', x + w, y],
                        ['L', x + w, y + h],
                        ['L', x, y + h],
                        ['z']
                );
                break;
            case 'arc':
                this.pushArcAsA(prm[0], prm[1], prm[2], prm[3], prm[4], prm[5]);
                break;
            case 'fill':
                this.addPath('fill', this.cur, this.path, this.trans);
                break;
            case 'stroke':
                this.addPath('stroke', this.cur, this.path, this.trans);
                break;
            case 'clip':
                // XXX
                break;
            case 'fillText':
                this.addText('fill', this.cur, prm, this.trans);
                break;
            case 'strokeText':
                this.addText('stroke', this.cur, prm, this.trans);
                break;
            case 'drawImage':
                // XXX
                break;
            case 'createImageData':
                // XXX
                break;
            case 'getImageData':
                // XXX
                break;
            case 'putImageData':
                // XXX
                break;
            case 'isPointInPath':
            case 'measureText':
                // noops
                break;
            default:
                console.error('Unknown command:', cmd);
        };
    },
    
    // this is very heavily "inspired" by explorercanvas, thanks!
    pushArcAsA: function (x, y, rad, sAng, eAng, ckw) {
        if (sAng == eAng) return;

        while (sAng < 0) {
          sAng += Math.PI * 2;
        }
        while (eAng < 0) {
          eAng += Math.PI * 2;
        }
        sAng %= Math.PI * 2;
        eAng %= Math.PI * 2;
        var delta = eAng - sAng;
        if (delta < 0) {
            delta += Math.PI * 2;
        }

        var endX = x + rad * Math.cos(eAng);
        var endY = y + rad * Math.sin(eAng);
        
        if (sAng === eAng) {
            this.pushArcAsA(x, y, rad, sAng, sAng + Math.PI, ckw);
            this.pushArcAsA(x, y, rad, sAng + Math.PI, sAng + 2*Math.PI, ckw);
            this.path.push(['M', endX, endY]);
            return;
        }

        var startX = x + rad * Math.cos(sAng);
        var startY = y + rad * Math.sin(sAng);
        var rot = delta * 180 / Math.PI; // sign, abs?
        var sweep = ckw ? 0 : 1;
        var largeArc = rot >= 180 == Boolean(ckw) ? 0 : 1;
    
        if (this.path.length != 0) this.path.push(['L', startX, startY]);
        else this.path.push(['M', startX, startY]);

        this.path.push(['A', rad, rad, rot, largeArc, sweep, endX, endY]);
    }
};


/// Deferred ////////////////////////////////////////////////////////////////////////////////////
CanvasSVG.Deferred = function () {
    this.state = [];
};
for (var k in CanvasSVG.Base.prototype) CanvasSVG.Deferred.prototype[k] = CanvasSVG.Base.prototype[k];
CanvasSVG.Deferred.prototype.getSVG = function () {
    this.defs = {
        fillStyle:                  "#000",
        strokeStyle:                "#000",
        globalAlpha:                1.0,
        globalCompositeOperation:   "source-over",
        lineWidth:                  1,
        lineCap:                    "butt",
        lineJoin:                   "miter",
        miterLimit:                 10,
        shadowOffsetX:              0,
        shadowOffsetY:              0,
        shadowBlur:                 0,
        shadowColor:                "rgba(0,0,0,0)",
        font:                       "10px sans-serif",
        textAlign:                  "start",
        textBaseline:               "alphabetic",
    };
    this.cur = this.simpleClone(this.defs);
    this.stack = [];
    this.path = [];
    this.trans = [];
    
    // create an <svg> elements that has the same properties as the <canvas> element
    this.svg = this.makeElement('svg', {
                                        width:      this.el.width + 'px',
                                        height:     this.el.height + 'px',
                                        viewPort:   "0 0 " + this.el.width + " " + this.el.height
                                        });
    
    // walk the state and add stuff
    // don't try to be smart, just produce what the canvas calls produce
    for (var i = 0; i < this.state.length; i++) {
        var cmd = this.state[i].type;
        var prm = this.state[i].value;
        this.handleCommands(cmd, prm);
    }
    return this.svg;
};
CanvasSVG.Deferred.prototype.pushState = function (type, val) {
    this.state.push({ type: type, value: val });
};


/// Live ////////////////////////////////////////////////////////////////////////////////////////
CanvasSVG.Live = function () {
    this.stack = [];
    this.cur = this.simpleClone(this.defs);
    this.stack = [];
    this.path = [];
    this.trans = [];
};
for (var k in CanvasSVG.Base.prototype) CanvasSVG.Live.prototype[k] = CanvasSVG.Base.prototype[k];
CanvasSVG.Live.prototype.defs = {
    fillStyle:                  "#000",
    strokeStyle:                "#000",
    globalAlpha:                1.0,
    globalCompositeOperation:   "source-over",
    lineWidth:                  1,
    lineCap:                    "butt",
    lineJoin:                   "miter",
    miterLimit:                 10,
    shadowOffsetX:              0,
    shadowOffsetY:              0,
    shadowBlur:                 0,
    shadowColor:                "rgba(0,0,0,0)",
    font:                       "10px sans-serif",
    textAlign:                  "start",
    textBaseline:               "alphabetic",
};
CanvasSVG.Live.prototype.setParent = function (parent) {
    // create an <svg> elements that has the same properties as the <canvas> element
    this.svg = this.makeElement('svg', {
                                        width:      this.el.width + 'px',
                                        height:     this.el.height + 'px',
                                        viewPort:   "0 0 " + this.el.width + " " + this.el.height
                                        });
    parent.appendChild(this.svg);
};
CanvasSVG.Live.prototype.runCommand = function (cmd, prm) {
    this.handleCommands(cmd, prm);
};

/// Property Mapping /////////////////////////////////////////////////////////////////////////////////

// properties
[
    'fillStyle',    'strokeStyle',    'globalAlpha',    'globalCompositeOperation',
    'lineWidth',    'lineCap',        'lineJoin',       'miterLimit',
    'shadowOffsetX','shadowOffsetY',  'shadowBlur',     'shadowColor',
    'font',         'textAlign',      'textBaseline',
].forEach(function (s) {
    var sName = s;
    CanvasSVG.Deferred.prototype.__defineGetter__(sName, function () { return this.context[sName]; });
    CanvasSVG.Deferred.prototype.__defineSetter__(sName, function (val) {
        this.pushState(sName, val);
        this.context[sName] = val;
        return val;
    });
    CanvasSVG.Live.prototype.__defineGetter__(sName, function () { return this.context[sName]; });
    CanvasSVG.Live.prototype.__defineSetter__(sName, function (val) {
        this.cur[sName] = val;
        this.context[sName] = val;
        return val;
    });
});

// methods
[
    'fillRect',     'strokeRect',       'save',         'restore',
    'scale',        'rotate',           'translate',    'setTransform', 'transform',
    'createLinearGradient',             'createRadialGradient',
    'createPattern','clearRect',        'beginPath',    'closePath',
    'moveTo',       'lineTo',           'quadraticCurveTo',                 
    'bezierCurveTo','arcTo',            'rect',         'arc',
    'fill',         'stroke',           'clip',         'isPointInPath',
    'fillText',     'strokeText',       'measureText',  'drawImage',        
    'createImageData',                  'getImageData', 'putImageData',
].forEach(function (s) {
    var sName = s;
    CanvasSVG.Deferred.prototype[sName] = function () {
        this.pushState(sName, Array.prototype.slice.call(arguments));
        return this.context[sName].apply(this.context, arguments);
    };
    CanvasSVG.Live.prototype[sName] = function () {
        this.runCommand(sName, Array.prototype.slice.call(arguments));
        return this.context[sName].apply(this.context, arguments);
    };
});



