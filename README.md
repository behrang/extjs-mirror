ExtJS Mirror
============

RTL support for Sencha Ext JS Framework

[http://behrang.github.com/extjs-mirror/](http://behrang.github.com/extjs-mirror/)

### What is extjs-mirror
ExtJS Mirror adds RTL feature to [ExtJS framework](http://www.sencha.com/products/extjs/).

Some languages like Persian, Hebrew and Arabic are [RTL (Right-To-Left)](http://en.wikipedia.org/wiki/Right-to-left). ExtJS does not support RTL. To support RTL, every component should layout itself from right to left.

This project, provides this feature by overriding some basic functionality in ExtJS. Here, positioning of elements are overridden so that instead of positioning elements from "Top Left", positioning is converted to "Top Right" (hence the name MIRROR).

There are more problems to solve. Some browsers like Firefox and IE, place scrollbars on left in RTL pages and some like Chrome, place scrollbars on right in either LTR or RTL. So scrollbar position have to be considered. Also, some browsers use negative values in RTL context to scroll DOM elements, while others use positive values.

### Usage
Develop your application for LTR. Then add `ext-mirror.js` and `resources` folder to your project. After that you have to include `ext-mirror.js` on your page either by putting a script tag on your page (just put it somewhere after `ext.js` or `ext-debug.js`) or adding `ext-mirror.js` to your dependencies and using Sencha SDK to build your single script file. You have to also put a `link` to `resources/css/ext-mirror.css` on your page.

    <link href="resources/css/ext-mirror.css" type="text/css" rel="stylesheet" charset="utf-8">
    <script src="ext-mirror.js" type="text/javascript" charset="utf-8"></script>

This way you can create a single internationalized app and use localization to have both RTL and LTR apps.

### Examples
* Feed Viewer ([mirrored](http://behrang.github.com/extjs-mirror/examples/feed-viewer.html)) ([normal](http://behrang.github.com/extjs-mirror/examples/feed-viewer.html?ext-mirror-off))
* Desktop ([mirrored](http://behrang.github.com/extjs-mirror/examples/desktop.html)) ([normal](http://behrang.github.com/extjs-mirror/examples/desktop.html?ext-mirror-off))
* Portal ([mirrored](http://behrang.github.com/extjs-mirror/examples/portal.html)) ([normal](http://behrang.github.com/extjs-mirror/examples/portal.html?ext-mirror-off))

### License
As ExtJS, this project is licensed under [GPL v3](http://www.gnu.org/licenses/gpl.html).