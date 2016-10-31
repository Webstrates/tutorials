<html><body><pre id="webstrate">'use strict';

class CanvasInteraction extends Pad.Plugin {

    /**
     * Called on plugin load. The pad manager instance is accessible through
     * this.manager.
     * 
     * @memberOf PadManagerPlugin
     */
    onLoad() {
        const canvas = this.manager.sheetCanvas;

        // Bind Transformer API to element.
        Transformer.bindElement(canvas, matrix =&gt; {
                const cssTransform = matrix.toCss();

                this.manager.sheetStyle.innerHTML = `
#canvas {
    -webkit-transform: ${cssTransform};
    -moz-transform: ${cssTransform};
    -ms-transform: ${cssTransform};
    -o-transform: ${cssTransform};
    transform: ${cssTransform};
}
`;

                return false;
            }, /*debug*/true)
            .then(transformer =&gt; {

                transformer.transformOrigin.set(0.5, 0.5);
                transformer.reapplyTransforms();

                // Set transform on canvas element.
                canvas.transforms = transformer;

                // Make canvas and sheet interactive.
                Pad.Behaviors.ManipulationBehavior.attach(canvas, {
                    eventSource: this.manager.sheetDocument.body
                });
            });
    }

    /**
     * Called on plugin unload. The pad manager instance is accessible through
     * this.manager.
     * 
     * @memberOf PadManagerPlugin
     */
    onUnload() {
        Pad.Behaviors.ManipulationBehavior.detach(this.manager.sheetCanvas);
    }
}

window.Pad.registerPlugin(CanvasInteraction, "CanvasInteraction");</pre></body></html>