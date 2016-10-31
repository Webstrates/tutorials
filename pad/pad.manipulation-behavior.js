<html><body><pre id="webstrate">'use strict';

class ManipulationBehavior extends Pad.AttachedBehavior {

    get enabled() {
        return this._enabled;
    }

    set enabled(enable) {
        this._enabled = enable;

        this.target.hammerManager.set({
            enable: enable
        });
    }

    constructor(target, options = {}) {
        super();

        this.target = target;

        this.options = Object.assign({
            eventSource: target,
            isValidEvent: (event) =&gt; {
                const valid = event.target === this.eventSource || event.target === this.target;

                // Consume event.
                if (valid) {
                    event.preventDefault();
                    event.srcEvent.preventDefault();
                    event.srcEvent.stopPropagation();
                    event.srcEvent.stopImmediatePropagation();
                }

                return valid;
            },
            onEvent: (event) =&gt; {}
        }, options);

        this.eventSource = this.options.eventSource;

        if (!target.transforms) {
            throw new Error(`target does not have transforms property`);
        }

        if (!(target.transforms instanceof Transformer.TransformStack)) {
            throw new Error(`target transforms property not of type ${Transformer.TransformStack}`);
        }

        const hammerManager = target.hammerManager = this.createHammer(this.eventSource);
        this.makeInteractive(hammerManager, target, this.eventSource);
    }

    static attach(element, options) {

        if (element.nodeType !== 1) {
            throw new Error(`element needs to be of type ${HTMLElement.name}`);
        }

        if (element.attachedBehavior &amp;&amp; element.attachedBehavior instanceof AttachedBehavior) {
            console.warn(`element has already an ${AttachedBehavior.name}`);
            element.attachedBehavior.destroy();
            delete element.attachedBehavior;
        }

        return element.attachedBehavior = new ManipulationBehavior(element, options);
    }

    static detach(element) {

        if (element.attachedBehavior) {
            const behavior = element.attachedBehavior;

            if (!(behavior instanceof AttachedBehavior)) {
                throw new Error(`attached behavior is not of type ${AttachedBehavior.name}`);
            }

            behavior.destroy();
            delete element.attachedBehavior;
        }
    }

    createHammer(eventSource) {
        const hammerManager = new Hammer.Manager(eventSource);

        hammerManager.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
        // hammerManager.add(new Hammer.Swipe()).recognizeWith(hammerManager.get('pan'));
        hammerManager.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(hammerManager.get('pan'));
        hammerManager.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([hammerManager.get('pan'), hammerManager.get('rotate')]);

        // hammerManager.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));
        // hammerManager.add(new Hammer.Tap());

        // // Prevent long press saving on mobiles.
        // eventSource.addEventListener('touchstart', event =&gt; {
        //     event.preventDefault();
        // });

        return hammerManager;
    }

    /**
     * 
     * 
     * @param {any} hammerManager
     * @param {any} target
     * @param {any} eventSource
     * 
     * @memberOf ManipulationBehavior
     */
    makeInteractive(hammerManager, target, eventSource) {

        const transforms = target.transforms;

        let prevX = 0;
        let prevY = 0;
        let prevAngle = 0;
        let angleOffset = 0;
        let prevScale = 1.0;

        const adjustCenterPoint = point =&gt; {

            ////////////////////////////////
            // BEGIN PARTIALLY WORKS
            ////////////////////////////////

            // let p = new Transformer.Point(point.x, point.y);
            // console.log('p1 %o', p.toString());
            // p = transforms.fromGlobalToLocal(p);
            // console.log('p2 %o', p.toString());
            // var pi = {
            //     x: p.x / target.offsetWidth,
            //     y: p.y / target.offsetHeight
            // }
            // console.log('client offset %o %o %o %o %o %o', target.clientWidth, target.clientHeight, target.offsetWidth, target.offsetHeight, pi.x, pi.y);

            // return pi;

            ////////////////////////////////
            // END PARTIALLY WORKS
            ////////////////////////////////

            ////////////////////////////////
            // BEGIN WORKS
            ////////////////////////////////

            return {
                x: 0.5,
                y: 0.5
            }

            ////////////////////////////////
            // END WORKS
            ////////////////////////////////
        }

        hammerManager.on("panstart panmove panend", event =&gt; {
            if (!this.options.isValidEvent(event)) return;

            // Call onEvent callback.
            this.options.onEvent(event);

            if (event.type === "panstart") {
                prevX = 0;
                prevY = 0;
                return;
            }

            if (event.type.indexOf("end") &gt; -1) {
                return;
            }

            // console.log('event %o', event);

            let deltaPoint = new Transformer.Point(event.deltaX, event.deltaY);
            deltaPoint = transforms.fromGlobalToLocalDelta(deltaPoint);
            // console.log(point);

            // console.log(`old.x ${transforms.translateTransform.x}`);

            const translateTransform = transforms.translateTransform;
            const newX = (translateTransform.x - prevX) + deltaPoint.x;
            const newY = (translateTransform.y - prevY) + deltaPoint.y;

            // console.log(`new.x ${newX}`);

            translateTransform.set(newX, newY);
            transforms.reapplyTransforms();

            prevX = deltaPoint.x;
            prevY = deltaPoint.y;
        });

        hammerManager.on("rotatestart rotatemove", event =&gt; {
            if (!this.options.isValidEvent(event)) return;

            // Call onEvent callback.
            this.options.onEvent(event);

            if (event.type === "rotatestart") {
                angleOffset = event.rotation;
                prevAngle = 0;
                return;
            }

            let centerPoint = { x: event.center.x, y: event.center.y };
            centerPoint = adjustCenterPoint(centerPoint);

            // Comment in if transform around center point
            transforms.transformOrigin.set(centerPoint.x, centerPoint.y);

            // correct angle offset
            event.rotation -= angleOffset;

            const rotateTransform = transforms.rotateTransform;
            const deltaAngle = (rotateTransform.angle - prevAngle) + event.rotation;

            prevAngle = event.rotation;

            rotateTransform.set(deltaAngle);
            transforms.reapplyTransforms();
        });

        hammerManager.on("pinchstart pinchmove", event =&gt; {
            if (!this.options.isValidEvent(event)) return;

            // Call onEvent callback.
            this.options.onEvent(event);

            if (event.type === "pinchstart") {
                prevScale = event.scale;
                return;
            }

            let centerPoint = { x: event.center.x, y: event.center.y };
            centerPoint = adjustCenterPoint(centerPoint);

            // Comment in if transform around center point
            transforms.transformOrigin.set(centerPoint.x, centerPoint.y);

            const scaleTransform = transforms.scaleTransform;
            const scaleX = (scaleTransform.x / prevScale) * event.scale;
            const scaleY = (scaleTransform.y / prevScale) * event.scale;

            prevScale = event.scale;

            scaleTransform.set(scaleX, scaleY);
            transforms.reapplyTransforms();
        });

        eventSource.addEventListener("mousewheel", event =&gt; {
            if (!event.ctrlKey &amp;&amp; !event.altKey) return;

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();

            // Call onEvent callback.
            this.options.onEvent(event);

            // transforms.transformOrigin.set(0, 0);

            let centerPoint = { x: event.clientX, y: event.clientY };
            centerPoint = adjustCenterPoint(centerPoint);
            transforms.transformOrigin.set(centerPoint.x, centerPoint.y);

            // cross-browser wheel delta
            event = window.event || event; // old IE support
            const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

            if (event.altKey) {
                const rotateTransform = transforms.rotateTransform;
                const angle = (rotateTransform.angle - (event.deltaY / 10)) % 360;
                rotateTransform.set(angle);
                transforms.reapplyTransforms();                
            }
            else if (event.ctrlKey) {
                const scaleTransform = transforms.scaleTransform;
                const scaleX = Math.max(0.01, scaleTransform.x - (event.deltaY / (1000 / scaleTransform.x)));
                const scaleY = Math.max(0.01, scaleTransform.y - (event.deltaY / (1000 / scaleTransform.y)));
                scaleTransform.set(scaleX, scaleY);
                transforms.reapplyTransforms();
            }

            // transforms.transformOrigin.set(event.clientX, event.clientY);
        }, false);
    }

    destroy() {
        this.target.hammerManager.destroy();
    }
}

window.Pad.registerBehavior(ManipulationBehavior, "ManipulationBehavior");</pre></body></html>