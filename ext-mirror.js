(function () {

var Element = Ext.dom.Element,
    AbstractElement = Ext.dom.AbstractElement,
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    scrollTo = Element.scrollTo,
    getXY = Element.getXY,
    getPageXY = Ext.EventManager.getPageXY,
    scrollbarPlacement,
    borders = {l: 'border-right-width', r: 'border-left-width', t: 'border-top-width', b: 'border-bottom-width'},
    paddings = {l: 'padding-right', r: 'padding-left', t: 'padding-top', b: 'padding-bottom'},
    margins = {l: 'margin-right', r: 'margin-left', t: 'margin-top', b: 'margin-bottom'},
    paddingsTLRB = [paddings.l, paddings.r, paddings.t, paddings.b],
    bordersTLRB = [borders.l,  borders.r,  borders.t,  borders.b],
    positionTopRight = ['position', 'top', 'right'];

Ext.onReady(function () {
    
    //<debug>
    if (window.location.search.indexOf('ext-mirror-off') !== -1) {
        var styleSheet,
            len = document.styleSheets.length,
            i = 0;
        for(; i < len; i += 1) {
            styleSheet = document.styleSheets.item(i);
            if (styleSheet.href && styleSheet.href.indexOf('ext-mirror.css') > -1) {
                styleSheet.disabled = true;
            }
        }
        return;
    }
    //</debug>
    Ext.getBody().addCls('x-mirror');
    
    // src/dom/Element.position.js
    Ext.override(Element, {
        
        setLeft: function (left) {
            this.setStyle(RIGHT, this.addUnits(left));
            return this;
        },
        
        setRight: function (right) {
            this.setStyle(LEFT, this.addUnits(right));
            return this;
        },
        
        getLeft: function (local) {
            return !local ? this.getX() : parseFloat(this.getStyle(RIGHT)) || 0;
        },
        
        translatePoints: function (x, y) {
            var me = this,
                styles = me.getStyle(positionTopRight),
                relative = styles.position == 'relative',
                right = parseFloat(styles.right),
                top = parseFloat(styles.top),
                xy = me.getXY();

            var offsetRight;
            if (me.dom.getBoundingClientRect) {
                offsetRight = me.dom.getBoundingClientRect().right;
            } else {
                offsetRight = me.dom.offsetLeft + me.dom.offsetWidth;
            }
            
            if (Ext.isArray(x)) {
                 y = x[1];
                 x = x[0];
            }
            if (isNaN(right)) {
                right = relative ? 0 : Element.getDocumentWidth() - offsetRight;
            }
            if (isNaN(top)) {
                top = relative ? 0 : me.dom.offsetTop;
            }
            right = (typeof x == 'number') ? x - xy[0] + right : undefined;
            top = (typeof y == 'number') ? y - xy[1] + top : undefined;
            return {
                left: right,
                top: top
            };
        },
        
        getBox: function (contentBox, local) {
            var me = this,
                xy,
                left,
                top,
                paddingWidth,
                bordersWidth,
                l, r, t, b, w, h, bx;

            if (!local) {
                xy = me.getXY();
            } else {
                xy = me.getStyle([RIGHT, TOP]);
                xy = [ parseFloat(xy.right) || 0, parseFloat(xy.top) || 0];
            }
            w = me.getWidth();
            h = me.getHeight();
            if (!contentBox) {
                bx = {
                    x: xy[0],
                    y: xy[1],
                    0: xy[0],
                    1: xy[1],
                    width: w,
                    height: h
                };
            } else {
                paddingWidth = me.getStyle(paddingsTLRB);
                bordersWidth = me.getStyle(bordersTLRB);

                l = (parseFloat(bordersWidth[borders.l]) || 0) + (parseFloat(paddingWidth[paddings.l]) || 0);
                r = (parseFloat(bordersWidth[borders.r]) || 0) + (parseFloat(paddingWidth[paddings.r]) || 0);
                t = (parseFloat(bordersWidth[borders.t]) || 0) + (parseFloat(paddingWidth[paddings.t]) || 0);
                b = (parseFloat(bordersWidth[borders.b]) || 0) + (parseFloat(paddingWidth[paddings.b]) || 0);

                bx = {
                    x: xy[0] + l,
                    y: xy[1] + t,
                    0: xy[0] + l,
                    1: xy[1] + t,
                    width: w - (l + r),
                    height: h - (t + b)
                };
            }
            bx.left = bx.x + bx.width;
            bx.bottom = bx.y + bx.height;

            return bx;
        },
        
        setLeftTop: function (left, top) {
            var style = this.dom.style;

            style.right = Element.addUnits(left);
            style.top = Element.addUnits(top);

            return this;
        }
        
    });
    
    // src/dom/Element.scroll.js
    Ext.override(Element, {
        
        getScroll: function () {
            var me = this,
                ret = me.callParent(),
                dom = me.dom;
            if (dom === document.body || dom === document.documentElement) {
                ret.left = -ret.left;
            }
            return ret;
        },
        
        scrollTo: function (side, value, animate) {
            var top = /top/i.test(side),
                me = this,
                dom = me.dom;
            if (!top) {
                if (dom === document.body || dom === document.documentElement) {
                    value = -value;
                } else if (!Ext.isIE) {
                    value = dom.scrollWidth - dom.clientWidth - value;
                }
            }
            return this.callParent([side, value, animate]);
        }
        
    });
    
    // src/core/src/dom/AbstractElement.static.js
    Element.getXY = AbstractElement.getXY = function (el) {
        var doc = document,
            flyInstance,
            fly = function (el) {
                if (!flyInstance) {
                    flyInstance = new AbstractElement.Fly();
                }
                flyInstance.attach(el);
                return flyInstance;
            };
        
        var bd = (doc.body || doc.documentElement),
            rightBorder = 0,
            topBorder = 0,
            ret = [0,0],
            round = Math.round,
            b,
            scroll;

        el = Ext.getDom(el);

        if(el != doc && el != bd){
            // IE has the potential to throw when getBoundingClientRect called
            // on element not attached to dom
            if (Ext.isIE) {
                try {
                    b = el.getBoundingClientRect();
                    // In some versions of IE, the html element will have a 1px border that gets included, so subtract it off
                    topBorder = bd.clientTop;
                    rightBorder = bd.clientLeft;
                } catch (ex) {
                    b = { right: 0, top: 0 };
                }
            } else {
                b = el.getBoundingClientRect();
            }

            scroll = fly(document).getScroll();
            ret = [round(bd.clientWidth - b.right + scroll.left - rightBorder), round(b.top + scroll.top - topBorder)];
        }
        return ret;
    };
    Element.setXY = AbstractElement.setXY = function (el, xy) {
        (el = Ext.fly(el, '_setXY')).position();

        var pts = el.translatePoints(xy),
            style = el.dom.style,
            pos;
        
        if (pts.left) {
            pts.right = pts.left;
            delete pts.left;
        }

        for (pos in pts) {
            if (!isNaN(pts[pos])) {
                style[pos] = pts[pos] + "px";
            }
        }
    };
    
    // src/core/src/dom/AbstractElement.position.js
    Ext.override(Ext.dom.AbstractElement, {
        setXY: function (pos) {
            var me = this,
                pts,
                style,
                pt;

            if (arguments.length > 1) {
                pos = [pos, arguments[1]];
            }

            // me.position();
            pts = me.translatePoints(pos);
            style = me.dom.style;
            
            if (pts.left) {
                pts.right = pts.left;
                delete pts.left;
            }

            for (pt in pts) {
                if (!pts.hasOwnProperty(pt)) {
                    continue;
                }
                if (!isNaN(pts[pt])) {
                    style[pt] = pts[pt] + "px";
                }
            }
            return me;
        }
    });
    
    // src/core/src/dom/AbstractElement.style.js
    Ext.override(Ext.dom.AbstractElement, {
        
        getBorderWidth: function (side) {
            return this.addStyles(side, borders);//
        },
        
        getPadding: function (side) {
            return this.addStyles(side, paddings);//
        },
        
        margins: margins
        
    });
    Element.margins = AbstractElement.margins = margins;
    
    // src/core/src/EventManager.js
    Ext.EventManager.getPageXY = function (event) {
            var me = this,
                bd = (document.body || document.documentElement),
                ret;
            ret = getPageXY(event);
            ret[0] = bd.clientWidth - ret[0] - 1;
            return ret;
    };
    
    // like src/core/src/Ext-more.js@getScrollbarSize
    Ext.getScrollbarPlacement = function (force) {
        // Also Chrome and Webkit are buggy in recent versions and calculate clientLeft property wrong.
        // As browsers are moving toward placing vertical scrollbar in RTL context on left, we simply return 'left'.
        /*
        if (force || !scrollbarPlacement) {
            var db = document.body,
                div = document.createElement('div');

            div.style.width = div.style.height = '100px';
            div.style.overflow = 'scroll';
            div.style.position = 'absolute';

            db.appendChild(div); // now we can measure the div...

            scrollbarPlacement = (div.clientLeft > 0) ? 'left' : 'right';

            db.removeChild(div);
        }

        return scrollbarPlacement;
        */
        return 'left';
    };
    
    if (Ext.getScrollbarPlacement() === 'left') {
        Ext.getBody().addCls('x-mirror-scrollbar-left');
    } else {
        Ext.getBody().addCls('x-mirror-scrollbar-right');
        Ext.ClassManager.onCreated(function () {
            Ext.override(Ext.grid.ColumnLayout, {
                calculate: function (ownerContext) {
                    var me = this,
                        childItems = ownerContext.childItems,
                        childContext,
                        names = me.getNames(),
                        scrollbarWidth = Ext.getScrollbarSize().width,
                        i = 0,
                        len = childItems.length;
                    me.callParent(arguments);
                    for (;i < len; i += 1){
                        childContext = childItems[i];
                        childContext.setProp(names.x, childContext.props[names.x] + scrollbarWidth);
                    }
                }
            });
        }, this, 'Ext.grid.ColumnLayout');
    }
        
    // src/Shadow.js
    Ext.ClassManager.onCreated(function () {
        Ext.Function.interceptAfter(Ext.Shadow.prototype, 'realign', function () {
            if (!this.el) {
                return;
            }
            var s = this.el.dom.style;
            s.right = s.left;
            s.left = 'auto';
        });
    }, this, 'Ext.Shadow');

    // src/layout/container/Box.js
    Ext.ClassManager.onCreated(function () {
        var renderTpl = Ext.layout.container.Box.prototype.renderTpl;
        // replace left with right
        renderTpl[7] = renderTpl[7].replace('left', 'right');
    }, this, 'Ext.layout.container.Box');

    // src/layout/container/boxOverflow/Scroller.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.layout.container.boxOverflow.Scroller, {

            beginLayout: function (ownerContext) {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    pos = dom.scrollWidth - dom.clientWidth - dom.scrollLeft;

                this.callParent(arguments);
                ownerContext.innerCtScrollPos = Ext.isIE ? dom.scrollLeft : pos;
            },

            finishedLayout: function (ownerContext) {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    scrollPos = Math.min(me.getMaxScrollPosition(), ownerContext.innerCtScrollPos),
                    pos = dom.scrollWidth - dom.clientWidth - scrollPos;

                dom.scrollLeft = Ext.isIE ? scrollPos : pos;
            },

            getScrollPosition: function () {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    result;

                // Until we actually scroll, the scroll[Top|Left] is stored as zero to avoid DOM hits.
                if (me.hasOwnProperty('scrollPosition')) {
                    result = me.scrollPosition;
                } else if (Ext.isIE) {
                    result = dom.scrollLeft || 0;
                } else {
                    result = (dom.scrollWidth - dom.clientWidth - dom.scrollLeft) || 0;
                }
                return result;
            }
        });
    }, this, 'Ext.layout.container.boxOverflow.Scroller');
    
    // src/resizer/ResizeTracker.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.resizer.ResizeTracker, {
            updateDimensions: function (e, atEnd) {
                var me = this,
                    region = me.activeResizeHandle.region,
                    offset = me.getOffset(me.constrainTo ? 'dragTarget' : null),
                    box = me.startBox,
                    ratio,
                    widthAdjust = 0,
                    heightAdjust = 0,
                    snappedWidth,
                    snappedHeight,
                    adjustX = 0,
                    adjustY = 0,
                    dragRatio,
                    horizDir = offset[0] < 0 ? 'right' : 'left',
                    vertDir = offset[1] < 0 ? 'down' : 'up',
                    oppositeCorner,
                    axis, // 1 = x, 2 = y, 3 = x and y.
                    newBox,
                    newHeight, newWidth;

                switch (region) {
                    case 'south':
                        heightAdjust = offset[1];
                        axis = 2;
                        break;
                    case 'north':
                        heightAdjust = -offset[1];
                        adjustY = -heightAdjust;
                        axis = 2;
                        break;
                    case 'west':
                        widthAdjust = offset[0];
                        axis = 1;
                        break;
                    case 'east':
                        widthAdjust = -offset[0];
                        adjustX = -widthAdjust;
                        axis = 1;
                        break;
                    case 'northwest':
                        heightAdjust = -offset[1];
                        adjustY = -heightAdjust;
                        widthAdjust = offset[0];
                        oppositeCorner = [box.x, box.y + box.height];
                        axis = 3;
                        break;
                    case 'southwest':
                        heightAdjust = offset[1];
                        widthAdjust = offset[0];
                        oppositeCorner = [box.x, box.y];
                        axis = 3;
                        break;
                    case 'southeast':
                        widthAdjust = -offset[0];
                        adjustX = -widthAdjust;
                        heightAdjust = offset[1];
                        oppositeCorner = [box.x + box.width, box.y];
                        axis = 3;
                        break;
                    case 'northeast':
                        heightAdjust = -offset[1];
                        adjustY = -heightAdjust;
                        widthAdjust = -offset[0];
                        adjustX = -widthAdjust;
                        oppositeCorner = [box.x + box.width, box.y + box.height];
                        axis = 3;
                        break;
                }

                newBox = {
                    width: box.width + widthAdjust,
                    height: box.height + heightAdjust,
                    x: box.x + adjustX,
                    y: box.y + adjustY
                };

                // Snap value between stops according to configured increments
                snappedWidth = Ext.Number.snap(newBox.width, me.widthIncrement);
                snappedHeight = Ext.Number.snap(newBox.height, me.heightIncrement);
                if (snappedWidth != newBox.width || snappedHeight != newBox.height){
                    switch (region) {
                        case 'northwest':
                            newBox.y -= snappedHeight - newBox.height;
                            break;
                        case 'north':
                            newBox.y -= snappedHeight - newBox.height;
                            break;
                        case 'southeast':
                            newBox.x -= snappedWidth - newBox.width;
                            break;
                        case 'east':
                            newBox.x -= snappedWidth - newBox.width;
                            break;
                        case 'northeast':
                            newBox.x -= snappedWidth - newBox.width;
                            newBox.y -= snappedHeight - newBox.height;
                    }
                    newBox.width = snappedWidth;
                    newBox.height = snappedHeight;
                }

                // out of bounds
                if (newBox.width < me.minWidth || newBox.width > me.maxWidth) {
                    newBox.width = Ext.Number.constrain(newBox.width, me.minWidth, me.maxWidth);

                    // Re-adjust the X position if we were dragging the west side
                    if (adjustX) {
                        newBox.x = box.x + (box.width - newBox.width);
                    }
                } else {
                    me.lastX = newBox.x;
                }
                if (newBox.height < me.minHeight || newBox.height > me.maxHeight) {
                    newBox.height = Ext.Number.constrain(newBox.height, me.minHeight, me.maxHeight);

                    // Re-adjust the Y position if we were dragging the north side
                    if (adjustY) {
                        newBox.y = box.y + (box.height - newBox.height);
                    }
                } else {
                    me.lastY = newBox.y;
                }

                // If this is configured to preserve the aspect ratio, or they are dragging using the shift key
                if (me.preserveRatio || e.shiftKey) {
                    ratio = me.startBox.width / me.startBox.height;

                    // Calculate aspect ratio constrained values.
                    newHeight = Math.min(Math.max(me.minHeight, newBox.width / ratio), me.maxHeight);
                    newWidth = Math.min(Math.max(me.minWidth, newBox.height * ratio), me.maxWidth);

                    // X axis: width-only change, height must obey
                    if (axis == 1) {
                        newBox.height = newHeight;
                    }

                    // Y axis: height-only change, width must obey
                    else if (axis == 2) {
                        newBox.width = newWidth;
                    }

                    // Corner drag.
                    else {
                        // Drag ratio is the ratio of the mouse point from the opposite corner.
                        // Basically what edge we are dragging, a horizontal edge or a vertical edge.
                        dragRatio = Math.abs(oppositeCorner[0] - this.lastXY[0]) / Math.abs(oppositeCorner[1] - this.lastXY[1]);

                        // If drag ratio > aspect ratio then width is dominant and height must obey
                        if (dragRatio > ratio) {
                            newBox.height = newHeight;
                        } else {
                            newBox.width = newWidth;
                        }

                        // Handle dragging start coordinates
                        if (region == 'northwest') {
                            newBox.y = box.y - (newBox.height - box.height);
                        } else if (region == 'northeast') {
                            newBox.y = box.y - (newBox.height - box.height);
                            newBox.x = box.x - (newBox.width - box.width);
                        } else if (region == 'southeast') {
                            newBox.x = box.x - (newBox.width - box.width);
                        }
                    }
                }

                if (heightAdjust === 0) {
                    vertDir = 'none';
                }
                if (widthAdjust === 0) {
                    horizDir = 'none';
                }
                me.resize(newBox, {
                    horizontal: horizDir,
                    vertical: vertDir
                }, atEnd);
            }
        });
    }, this, 'Ext.resizer.ResizeTracker');

    // src/menu/Item.js
    Ext.ClassManager.onCreated(function () {
        var renderTpl = Ext.menu.Item.prototype.renderTpl;
        // replace margin-right with margin-left
        renderTpl[5] = renderTpl[5].replace('margin-right', 'margin-left');
    }, this, 'Ext.menu.Item');
    
    // src/view/TableChunker.js
    Ext.ClassManager.onCreated(function () {
        var metaRowTpl = Ext.view.TableChunker.metaRowTpl;
        metaRowTpl[3] = metaRowTpl[3].replace('{align}', '{[values.align === "left" ? "right" : values.align === "right" ? "left" : values.align]}');
    }, this, 'Ext.view.TableChunker');
    
    // src/panel/Header.js
    Ext.ClassManager.onCreated(function () {
        Ext.Function.interceptAfter(Ext.panel.Header.prototype, 'initComponent', function () {
            var me = this;
            me.titleCmp.style = "text-align:" + (me.titleAlign === "right" ? "left" : me.titleAlign === "left" ? "right" : me.titleAlign);
        });
    }, this, 'Ext.panel.Header');
    
    // src/layout/container/HBox.js
    Ext.ClassManager.onCreated(function () {
        Ext.layout.container.HBox.prototype.names.left = 'right';
        Ext.layout.container.HBox.prototype.names.right = 'left';
    }, this, 'Ext.layout.container.HBox');
    
    // src/layout/container/VBox.js
    Ext.ClassManager.onCreated(function () {
        Ext.layout.container.VBox.prototype.names.top = 'right';
        Ext.layout.container.VBox.prototype.names.bottom = 'left';
    }, this, 'Ext.layout.container.VBox');
    
    // src/form/field/HtmlEditor.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.form.field.HtmlEditor, {
            getDocMarkup: function () {
                var me = this,
                    h = me.iframeEl.getHeight() - me.iframePad * 2;
                return Ext.String.format('<html><head><style type="text/css">body{direction:rtl;border:0;margin:0;padding:{0}px;height:{1}px;box-sizing: border-box; -moz-box-sizing: border-box; -webkit-box-sizing: border-box;cursor:text}</style></head><body></body></html>', me.iframePad, h);
            }
        });
    }, this, 'Ext.form.field.HtmlEditor');

});

}());
