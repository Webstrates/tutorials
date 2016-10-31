<html><body><pre id="webstrate">'use strict';

function midPointBtw(pa, pb) {
    return {
        x: pa.x + (pb.x - pa.x) / 2,
        y: pa.y + (pb.y - pa.y) / 2
    };
}

class CanvasDrawing extends Pad.Plugin {

    /**
     * Called on plugin load. The pad manager instance is accessible through
     * this.manager.
     * 
     * @see Pad.Plugin#onLoad
     * {@link Pad.Plugin#onLoad}
     * 
     * @memberOf CanvasDrawing
     */
    onLoad() {

        const createToolPalette = () =&gt; {
            const toolPalette = document.createElement("transient");
            toolPalette.setAttribute("class", "drawing-tool-palette");

            const colors = [
                "black",
                "red",
                "green",
                "blue",
                "yellow"
            ];

            const colorsElement = document.createElement("ul");
            colorsElement.setAttribute("class", "colors");
            toolPalette.appendChild(colorsElement);

            let activeColor;
            colors.forEach((color, index) =&gt; {
                const colorElement = document.createElement("li");
                colorElement.setAttribute("class", "color");
                colorElement.style.background = color;
                colorsElement.appendChild(colorElement);

                colorElement.addEventListener("touchstart", event =&gt; {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    // alert(`set pen color ${color}`);

                    if (activeColor) {
                        activeColor.removeAttribute("active");
                    }

                    colorElement.setAttribute("active", "true");
                    activeColor = colorElement;
                    
                    this.penColor = color;
                });

                if (index === 0) {
                    this.penColor = color;
                    colorElement.setAttribute("active", "true");
                    activeColor = colorElement;
                }
            });

            this.manager.sheetDocument.body.appendChild(toolPalette);
        }
        createToolPalette();

        const adjustPoint = pen =&gt; {
            const transforms = this.manager.sheetCanvas.transforms;
            let penPoint = new Transformer.Point(pen.x, pen.y);
            penPoint = transforms.fromGlobalToLocal(penPoint);
            penPoint.force = pen.force;

            return penPoint;
        }

        const ns = "http://www.w3.org/2000/svg";
        let path = null;
        let points = [];
        let timeout;

        this.manager.sheetWindow.addEventListener("touchstart", event =&gt; {
            if (event.touches.length !== 1) return;

            let touch = event.touches[0];

            // console.log(`force %o`, touch);

            if (touch.force === 0) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            if (timeout) {
                clearTimeout(timeout);
            }

            // Replace with AttachedBehavior.enable
            this.manager.sheetCanvas.hammerManager.set({
                enable: false
            });

            path = document.createElementNS(ns, "path");
            points.length = 0;

            const pen = adjustPoint({ x: touch.clientX, y: touch.clientY, force: touch.force });
            // pen.color = "black";
            pen.color = this.penColor ? this.penColor : "black";

            this.onPenDown(pen, points, path);
        }, true);

        this.manager.sheetWindow.addEventListener("touchmove", event =&gt; {
            if (event.touches.length !== 1) return;

            let touch = event.touches[0];

            if (touch.force === 0) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            const pen = adjustPoint({ x: touch.clientX, y: touch.clientY, force: touch.force });

            this.onPenMove(pen, points, path);
        }, true);

        this.manager.sheetWindow.addEventListener("touchend", event =&gt; {
            // this.manager.sheetCanvas.style.transformOrigin = prevTransformOrigin;

            timeout = setTimeout(() =&gt; {
                this.manager.sheetCanvas.hammerManager.set({
                    enable: true
                });
            }, 50);
        }, true);
    }

    /**
     * Called on plugin unload. The pad manager instance is accessible through
     * this.manager.
     * 
     * @see Pad.Plugin#onUnload
     * {@link Pad.Plugin#onUnload}
     * 
     * @memberOf CanvasDrawing
     */
    onUnload() {

    }

    onPenDown(pen, points, path) {
        const { x, y, force } = pen;

        const point = { x, y, force };
        points.push(point);

        path.setAttribute("d", this.generatePath(points));
        path.setAttribute("fill", pen.color);

        this.manager.sheetCanvas.querySelector("svg").appendChild(path);
    }

    onPenMove(pen, points, path) {
        const { x, y, force } = pen;

        const point = { x, y, force };
        points.push(point);

        const pathString = path.getAttribute("d");
        path.setAttribute("d", this.generatePath(points));
    }

    generatePath(points) {

        const transforms = this.manager.sheetCanvas.transforms;
        const scaleTransform = transforms.scaleTransform;
        let zoom = scaleTransform.x;

        // console.log(`zoom ${zoom}`);

        var strokeWidth = 3;
        var newPoints = [];
        newPoints.push(points[0]);

        for (var j = 1; j &lt; points.length - 1; j++) {
            var p1 = points[j - 1];
            var p = points[j];
            var p2 = points[j + 1];
            var c = { x: p2.x - p1.x, y: p2.y - p1.y };
            var n = { x: -c.y, y: c.x };
            var len = Math.sqrt(n.x * n.x + n.y * n.y);
            if (len == 0) continue;
            var u = { x: n.x / len, y: n.y / len };

            newPoints.push({ x: p.x + u.x * p.force * strokeWidth / zoom, y: p.y + u.y * p.force * strokeWidth / zoom });
        }
        newPoints.push(points[points.length - 1]);

        for (var j = points.length - 2; j &gt; 0; j--) {
            var p1 = points[j + 1];
            var p = points[j];
            var p2 = points[j - 1];
            var c = { x: p2.x - p1.x, y: p2.y - p1.y };
            var n = { x: -c.y, y: c.x };
            var len = Math.sqrt(n.x * n.x + n.y * n.y);
            if (len == 0) continue;
            var u = { x: n.x / len, y: n.y / len };

            newPoints.push({ x: p.x + u.x * p.force * strokeWidth / zoom, y: p.y + u.y * p.force * strokeWidth / zoom });
        }
        var p1 = newPoints[0];
        var p2 = newPoints[1];
        var pathString = "M" + p1.x + " " + p1.y;
        for (var j = 1; j &lt; newPoints.length; j++) {
            var midPoint = midPointBtw(p1, p2);
            if (isNaN(p1.x) || isNaN(p1.y) || isNaN(midPoint.x) || isNaN(midPoint.y)) {
                console.log("NaN");
            }
            pathString = pathString += " Q " + p1.x + " " + p1.y + " " + midPoint.x + " " + midPoint.y;
            p1 = newPoints[j];
            p2 = newPoints[j + 1];
        }

        return pathString;
    }
}

window.Pad.registerPlugin(CanvasDrawing, "CanvasDrawing");

// var path = null;
// var points = [];
// var strokeWidth = 3;

// var showingColors = false;
// document.addEventListener("touchstart", function(e) {
//     if (e.target.tagName == "INPUT") return;
//     if (e.target.classList.contains("color")) return;
//     if (e.touches.length != 1) return;
//     var touch = e.touches[0];
//     if (touch.force == 0) return;
//     // Show color selectors on first touch with the pen
//     if (!showingColors) {
//         var rule = ".color {display: inline-block !important;}";
//         sheet.insertRule(rule, document.styleSheets[0].rules.length);
//         showingColors = true;
//         return;
//     }
//     var ns = "http://www.w3.org/2000/svg";
//     path = document.createElementNS(ns, "path");
//     console.log(touch.clientX, offsetX);
//     var x = (touch.clientX - offsetX) / zoom;
//     var y = (touch.clientY - offsetY) / zoom;
//     var point = { x: x, y: y, force: touch.force };
//     points = [point];
//     path.setAttribute("d", generatePath(points));
//     path.setAttribute("fill", document.querySelector(color).style.backgroundColor);
//     document.querySelector("svg").appendChild(path);
//     e.preventDefault();
// });

// document.addEventListener("touchmove", function(e) {
//     if (e.target.tagName == "INPUT") return;
//     if (e.target.classList.contains("color")) return;
//     if (e.touches.length != 1) return;
//     var touch = e.touches[0];
//     if (touch.force == 0) return;
//     var x = (touch.clientX - offsetX) / zoom;
//     var y = (touch.clientY - offsetY) / zoom;
//     var point = { x: x, y: y, force: touch.force };
//     points.push(point);
//     var pathString = path.getAttribute("d");
//     path.setAttribute("d", generatePath(points));
// });</pre></body></html>