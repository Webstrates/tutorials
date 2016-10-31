<html><body><pre id="webstrate">'use strict';

class CanvasObjectInteraction extends Pad.Plugin {

    onLoad() {
        const children = this.manager.sheetCanvas.children;
        const elements = Array.from(children);
        elements.forEach(element =&gt; this.makeInteractive(element));

        this.manager.sheetCanvas.webstrate.on("nodeAdded", (element, local) =&gt; {
            // console.debug("%o was added %s", element, local ? "locally" : "remotely");
            window.requestAnimationFrame(() =&gt; {
                this.makeInteractive(element, local);
            });
        });

        this.manager.sheetCanvas.webstrate.on("nodeRemoved", (element, local) =&gt; {
            // console.debug("%o was removed %s", element, local ? "locally" : "remotely");
            this.removeInteractivity(element);
        });
    }

    onUnload() {
        const children = this.manager.sheetCanvas.children;
        const elements = Array.from(children);
        elements.forEach(element =&gt; this.removeInteractivity(element));
    }

    makeInteractive(element, local) {

        if (element === this.manager.sheetDrawingCanvas) {
            return;
        }

        // Add delete action to each element on the canvas.
        const deleteAction = document.createElement("transient");
        deleteAction.setAttribute("class", "delete-action");
        // transient.appendChild(deleteAction);
        deleteAction.addEventListener("click", () =&gt; {
            element.parentElement.removeChild(element);
        });
        element.appendChild(deleteAction);

        // console.log(`make element %o interactive`, element);

        element.style.position = "absolute";
        element.style.transformOrigin = "0 0 0";

        const canvas = this.manager.sheetCanvas;

        const attachedBehaviorToTransformer = (transformer) =&gt; {
            transformer.transformOrigin.set(0.5, 0.5);

            Pad.Behaviors.ManipulationBehavior.attach(element, {
                isValidEvent: (event) =&gt; {
                    const valid = event.target === element || element.contains(event.target);

                    // Consume event.
                    if (valid) {
                        event.preventDefault();
                        event.srcEvent.preventDefault();
                        event.srcEvent.stopPropagation();
                        event.srcEvent.stopImmediatePropagation();
                    }

                    return valid;
                },
                onEvent: (event) =&gt; {
                    if (canvas.attachedBehavior) {
                        canvas.attachedBehavior.enabled = event.type === "panend" || event.type === "mousewheel";
                    }
                }
            });
        }

        // Only bind a new transformer if element does not alreay have one.
        Transformer.bindElement(element, null, /*debug*/ true)
            .then(transformer =&gt; {
                attachedBehaviorToTransformer(transformer)
                transformer.reapplyTransforms(local);
            });
    }

    removeInteractivity(element) {
        Pad.Behaviors.ManipulationBehavior.detach(element);
    }
}

Pad.registerPlugin(CanvasObjectInteraction, "CanvasObjectInteraction");</pre></body></html>