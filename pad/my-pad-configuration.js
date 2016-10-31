<html>
<head>
    </head>
    <body>
        <pre id="webstrate">'use strict';

const pad = new Pad.Manager();
pad.addPlugin(new Pad.Plugins.CanvasObjectInteraction());
pad.addPlugin(new Pad.Plugins.CanvasInteraction());
pad.addPlugin(new Pad.Plugins.CanvasDrawing());
pad.addPlugin(new Pad.Plugins.ImageBox());

// Add MarkdownNote Plugin. It will be accessible through Pad.Plugins since we register the
// plugin in the previous step.
pad.addPlugin(new Pad.Plugins.MarkdownNote());
</pre>
    </body>
</html>