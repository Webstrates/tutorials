<html>
    <head>
    </head>
    <body>
<pre id="webstrate">/**
 * The MarkdownNote plugin adds a functionality to the Pad and allows
 * adding notes to the canvas. A doubletap on the canvas will create a
 * new note at the tap location. Another doubletap on the note will switch
 * the note to a markdown editor view. The note can be edited in this view.
 * The markdown will be transformed into html markup when the focus of the note
 * is lost.
 * 
 * @class MarkdownNote
 * @extends {Pad.Plugin}
 */
class MarkdownNote extends Pad.Plugin {

    /**
     * Creates an instance of MarkdownNote.
     * 
     * @memberOf MarkdownNote
     */
    constructor() {
        // Do not forget to call super(), otherwise the plugin will not work.
        super();
    }

    /**
     * Called on plugin load. The pad manager instance is accessible through
     * this.manager. The manager instance provides access to the sheet canvas,
     * the sheet's document and window.
     * 
     * @memberOf MarkdownNote
     */
    onLoad() {

        // Get the padsheet canvas (HTMLDivElement).
        const canvas = this.manager.sheetCanvas;

        // Get the padsheet document (HTMLDocument)
        const documentBody = this.manager.sheetDocument.body;

        // Make all markdown note elements already existing on the
        // canvas interactive. This for example is the case on a browser
        // reload.
        const children = canvas.children;
        const elements = Array.from(children);
        elements.forEach(element =&gt; {
            if (element.classList.contains('markdown-note')) {
                this.makeMarkdownNoteInteractive(element);
            }
        });

        // This callback will be called whenever a new markdown note was
        // added (locally or remote) to the canvas. Make each note that was
        // added to the canvas interactive.
        canvas.webstrate.on("nodeAdded", (element, local) =&gt; {
            if (element.classList.contains('markdown-note')) {
                this.makeMarkdownNoteInteractive(element);
            }
        });

        // Create a HammerManager (hammer.js) to listen to doubletap events on
        // the document body. The doubletap events will later be used to add new
        // markdown notes whenever the user doubletaps on the canvas.
        this.hammerManager = new Hammer.Manager(documentBody);
        this.hammerManager.add(new Hammer.Tap({ event: 'doubletap', taps: 2 }));

        // Add callback function whenever a doubletap event happens on the document
        // body.
        this.hammerManager.on("doubletap", event =&gt; {

            // When the event target is a markdown note or any of its children, then
            // switch to markdown note edit mode.
            if (event.target.closest('.markdown-note')) {
                const element = event.target.closest('.markdown-note');
                this.switchEditMode(element, true);
                return;
            }

            // Ignore if event target is not document body or the canvas element. Only
            // create new markdown notes when doubletap occured on the canvas or the
            // document body.
            if (event.target !== documentBody &amp;&amp; event.target !== canvas) {
                return;
            }

            // The next part will work with the canvas transform to add the markdown note
            // at the doubletap x/y position, to rotate it so the note is always in a '0'
            // angle to the current viewport, and the note has always the same size and
            // dependent on the current zoom factor.
            const canvasTransforms = canvas.transforms;

            // Convert the global doubletap point to the canvas local coordinates.
            let point = new Transformer.Point(event.center.x, event.center.y);
            point = canvasTransforms.fromGlobalToLocal(point)

            const x = point.x;
            const y = point.y;

            // Adjust rotation of the note.
            const angle = -canvasTransforms.rotateTransform.angle % 360;

            // Adjust scaling of the note.
            const scaleX = 1 / canvasTransforms.scaleTransform.x;
            const scaleY = 1 / canvasTransforms.scaleTransform.y;

            // Create a new note. This function will also add the note to the canvas.
            const note = this.createMarkdownNote();

            // Bind our Transformer API to the note element. The Transformer API allows
            // setting translation, rotation, and scaling independent of the current transform
            // of the canvas.
            // ATTENTION: The `debug` flag adds the origin point X/Y and the transform origin indicator
            // to the note element. Remove this in production!
            Transformer.bindElement(note, null, /*debug*/ true)
                .then(transformer =&gt; {

                    // Finally set previously determined translate, rotate, and scale factors.
                    transformer.transformOrigin.set(0.5, 0.5);
                    transformer.translateTransform.set(x, y);
                    transformer.rotateTransform.set(angle);
                    transformer.scaleTransform.set(scaleX, scaleY);

                    // Wait for the next animation frame to reapply the new transforms.
                    window.requestAnimationFrame(() =&gt; {
                        transformer.reapplyTransforms();
                    });
                });
        });
    }

    /**
     * Called on plugin unload. The pad manager instance is accessible through
     * this.manager.
     * 
     * @memberOf MarkdownNote
     */
    onUnload() {

        // Destroy HammerManager if exists.
        if (this.hammerManager) {
            this.hammerManager.destroy();
        }
    }

    /**
     * Make the markdown note interactive. Add a transient element, which will contain
     * the transformed markdown into html. It is important to notice that only the markdown
     * is synchronized by webstrate. The transformed html is added to a transient element
     * and only available locally.
     * 
     * @param {any} element The html element with the .markdown-note class.
     * 
     * @memberOf MarkdownNote
     */
    makeMarkdownNoteInteractive(element) {

        // Create transient element to add transient functionality. Thereby only relevant
        // data is synchronized by Webstrates.
        const transient = document.createElement("transient");

        // Get element containing the actual markdown.
        const input = element.querySelector('.markdown-input');

        // Make the markdown input element editable (if not already).
        input.setAttribute("contenteditable", true);

        // Switch markdown note from edit mode to non-edit mode on blur.
        input.addEventListener("blur", event =&gt; {
            this.switchEditMode(element, false);
        });

        // Add a transient div holding the marked html content. Also transform the initial
        // markdown to html and set it as new innerHTML. Then append the element containing
        // the marked html to the transient element. 
        const html = document.createElement("div");
        html.setAttribute("class", "marked-html");
        html.innerHTML = marked(input.innerText);
        transient.appendChild(html);
        element.appendChild(transient);

        // WORKAROUND: In order to listen to changes in the markup, reapply them, and replace
        // the content of the element holding the html, we use the attributeChanged event on the
        // actual markdown note element. The editmode attribute will be triggered every time a user
        // switches the note's editmode, which will be synchronized by Webstrates.
        element.webstrate.on("attributeChanged", function(attributeName, oldValue, newValue, local) {
            if (attributeName === "editmode") {
                html.innerHTML = marked(input.innerText);
            }
        });

    }

    /**
     * Switch the editmode of a note.
     * 
     * @param {any} element The actual markdown note element.
     * @param {any} editable True if editable, false otherwise.
     * 
     * @memberOf MarkdownNote
     */
    switchEditMode(element, editable) {
        element.setAttribute("editmode", `${editable}`);
        if (editable) {
            const input = element.querySelector('.markdown-input');
            input.focus();
        }
    }

    /**
     * Create a new markdown note. The function also appends the new note to the canvas element and
     * sets all required css class on the element.
     * 
     * @returns The new markdown note element.
     * 
     * @memberOf MarkdownNote
     */
    createMarkdownNote() {
        const note = document.createElement("div");
        note.setAttribute("class", "markdown-note");
        note.setAttribute("editmode", "false");

        const markdownInput = document.createElement("div");
        markdownInput.setAttribute("class", "markdown-input");
        note.appendChild(markdownInput);

        this.manager.sheetCanvas.appendChild(note);

        return note;
    }
}

// Finally register the MarkdownNote pad plugin. This step is not necessary if the MarkdownNote
// class is accessible in global scope. We will use the MarkdownNote class in a next step and add
// this new functionality to the Pad.
Pad.registerPlugin(MarkdownNote, "MarkdownNote");</pre>

    </body>
</html>