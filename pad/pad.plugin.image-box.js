class ImageBox extends Pad.Plugin {

    onLoad() {
        this.fileReader = new FileReader();
        const imageTool = this.createDomNode();
        this.manager.sheetDocument.body.appendChild(imageTool);
    }

    onUnload() {
        // remove image tool box
    }

    createDomNode() {
        const transient = document.createElement("transient");
        transient.setAttribute("class", "image-box-tool");

        const inputWrapper = document.createElement("label");
        inputWrapper.setAttribute("class", "input-button");

        this.input = document.createElement("input");
        this.input.setAttribute("type", "file");
        this.input.setAttribute("accept", "image/*");

        this.input.addEventListener("change", event => {
            console.log('event %o', event);
            this.uploadImage();
        });

        inputWrapper.appendChild(this.input);
        transient.appendChild(inputWrapper);

        return transient;
    }

    uploadImage() {
        console.log("upload image");

        const file = this.input.files[0];

        console.log(file);

        this.fileReader.onload = (file) => {
            this.processImage(file);
        }

        // Read in the image file as a data URL.
        this.fileReader.readAsDataURL(file);
    }

    processImage(file) {
        const base64data = file.target.result;
        const img = new Image();
        let loaded = false;

        img.addEventListener("load", () => {
            if (loaded) return;
            loaded = true;
            this.createImageWebstrate(img);
        });
        img.src = base64data;
    }

    createImageWebstrate(img) {
        const width = img.width;
        const height = img.height;

        console.log('image width=%o, height=%o', width, height);

        var boxDiv = document.createElement("div");
        boxDiv.setAttribute("class", "image-box");
        boxDiv.style.left = "0px";
        boxDiv.style.top = "0px";
        boxDiv.style.width = `${width}px`;
        boxDiv.style.height = `${height}px`;

        // var renderedText = document.createElement("div");
        // var markdown = document.createElement("div");
        // markdown.setAttribute("class", "markdown");
        // renderedText.setAttribute("class", "renderedText");
        // markdown.style.display = "none";
        // markdown.setAttribute("contentEditable", true);
        // boxDiv.appendChild(renderedText);
        // boxDiv.appendChild(markdown);

        const iframe = document.createElement("iframe");
        this.manager.sheetWindow.webstrate.on("transcluded", (webstrateId) => {
            // iframe.addEventListener("transcluded", (webstrateId) => {
            console.log('transcluded %o', webstrateId);

            if (iframe.contentWindow) {
                // console.log('stuff %o === %o', iframe.getAttribute("src"), iframe.contentWindow.location.pathname);
                const pathname = iframe.contentWindow.location.pathname;
                if (iframe.getAttribute("src") !== pathname) {
                    console.debug(`resetting iframe source to ${pathname}`);
                    iframe.src = pathname;
                //     markdown.textContent = iframe.outerHTML;
                    return;
                }
                iframe.contentDocument.body.appendChild(img);
            }
        });
        boxDiv.appendChild(iframe);

        this.manager.sheetCanvas.appendChild(boxDiv);

        // renderedText.appendChild(iframe);
        // var sizer = document.createElement("div");
        // sizer.setAttribute("class", "sizer");
        // boxDiv.appendChild(sizer);

        iframe.src = "/new?prototype=pad.canvas-image";
        iframe.style.pointerEvents = "none";

        this.input.value = "";
    }
}

Pad.registerPlugin(ImageBox, "ImageBox");
