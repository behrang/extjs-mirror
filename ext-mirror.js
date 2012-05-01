(function () {

var Element = Ext.dom.Element,
    LEFT = "left",
    RIGHT = "right",
    positionTopRight = ['position', 'top', 'right'],
    scrollTo = Element.scrollTo,
    getXY = Element.getXY,
    getPageXY = Ext.EventManager.getPageXY,
    scrollbarPlacement;

Ext.onReady(function () {
    
    //<debug>
    if (window.location.search.indexOf('ext-mirror-off') !== -1) {
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
                right: right,
                top: top
            };
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
                } else {
                    value = dom.scrollWidth - dom.clientWidth - value;
                }
            }
            return this.callParent([side, value, animate]);
        }
        
    });
    
    // src/core/src/dom/AbstractElement.static.js
    Element.getXY = function (el) {
        var doc = document,
            AbstractElement = Ext.dom.AbstractElement,
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
    
    // src/Component.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.Component, {
            setPagePosition: function (x, y, animate) {
                var me = this,
                    p,
                    floatParentBox;

                if (Ext.isArray(x)) {
                    y = x[1];
                    x = x[0];
                }
                me.pageX = x;
                me.pageY = y;

                if (me.floating) {

                    // Floating Components which are registered with a Container have to have their x and y properties made relative
                    if (me.isContainedFloater()) {
                        floatParentBox = me.floatParent.getTargetEl().getViewRegion();
                        if (Ext.isNumber(x) && Ext.isNumber(floatParentBox.left)) {
                            x -= floatParentBox.left;
                        }
                        if (Ext.isNumber(y) && Ext.isNumber(floatParentBox.top)) {
                            y -= floatParentBox.top;
                        }
                    } else {
                        p = me.el.translatePoints(x, y);
                        x = p.right;
                        y = p.top;
                    }

                    me.setPosition(x, y, animate);
                } else {
                    p = me.el.translatePoints(x, y);
                    me.setPosition(p.right, p.top, animate);
                }

                return me;
            }
        });
    }, this, 'Ext.Component');
    
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
                ownerContext.innerCtScrollPos = pos;
            },
            
            finishedLayout: function (ownerContext) {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    scrollPos = Math.min(me.getMaxScrollPosition(), ownerContext.innerCtScrollPos);

                dom.scrollLeft = dom.scrollWidth - dom.clientWidth - scrollPos;
            },
            
            getScrollPosition: function () {
                var me = this,
                    layout = me.layout,
                    dom = layout.innerCt.dom,
                    result;

                // Until we actually scroll, the scroll[Top|Left] is stored as zero to avoid DOM hits.
                if (me.hasOwnProperty('scrollPosition')) {
                    result = me.scrollPosition;
                } else {
                    result = (dom.scrollWidth - dom.clientWidth - dom.scrollLeft) || 0;
                }
                return result;
            }
        });
    }, this, 'Ext.layout.container.boxOverflow.Scroller');
    
    // src/menu/Item.js
    Ext.ClassManager.onCreated(function () {
        var renderTpl = Ext.menu.Item.prototype.renderTpl;
        // replace margin-right with margin-left
        renderTpl[5] = renderTpl[5].replace('margin-right', 'margin-left');
    }, this, 'Ext.menu.Item');
    
    // src/panel/Panel.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.panel.Panel, {
            titleAlign: 'right'
        });
    }, this, 'Ext.panel.Panel');
    
    // src/panel/Header.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.panel.Header, {
            titleAlign: 'right'
        });
    }, this, 'Ext.panel.Header');
    
    // src/grid/column/Column.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.grid.column.Column, {
            align: 'right'
        });
    }, this, 'Ext.grid.column.Column');
    
    // src/util/Renderable.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.util.Renderable, {
            afterFirstLayout : function (width, height) {
                var me = this,
                    hasX = Ext.isDefined(me.x),
                    hasY = Ext.isDefined(me.y),
                    pos, xy;

                // For floaters, calculate x and y if they aren't defined by aligning
                // the sized element to the center of either the container or the ownerCt
                if (me.floating && (!hasX || !hasY)) {
                    if (me.floatParent) {
                        xy = me.el.getAlignToXY(me.floatParent.getTargetEl(), 'c-c');
                        pos = me.floatParent.getTargetEl().translatePoints(xy[0], xy[1]);
                    } else {
                        xy = me.el.getAlignToXY(me.container, 'c-c');
                        pos = me.container.translatePoints(xy[0], xy[1]);
                    }
                    me.x = hasX ? me.x : pos.right;
                    me.y = hasY ? me.y : pos.top;
                    hasX = hasY = true;
                }

                if (hasX || hasY) {
                    me.setPosition(me.x, me.y);
                }
                me.onBoxReady(width, height);
                if (me.hasListeners.boxready) {
                    me.fireEvent('boxready', me, width, height);
                }
            }
        });
    }, this, 'Ext.util.Renderable');
    
    // src/slider/Multi.js
    Ext.ClassManager.onCreated(function () {
        Ext.override(Ext.slider.Multi, {
            getTrackpoint : function (xy) {
                var me = this,
                    result,
                    positionProperty,
                    sliderTrack = me.innerEl,
                    trackLength;

                if (me.vertical) {
                    positionProperty = 'top';
                    trackLength = sliderTrack.getHeight();
                } else {
                    positionProperty = 'right';
                    trackLength = sliderTrack.getWidth();
                }
                result = Ext.Number.constrain(sliderTrack.translatePoints(xy)[positionProperty], 0, trackLength);
                return me.vertical ? trackLength - result : result;
            }
        });
    }, this, 'Ext.slider.Multi');
    
});

}());
