import { fabric } from "fabric";

console.log("Timeline has loaded.");

var canvas = new fabric.Canvas("timeline");

function sizeCanvas() {
    var width = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
    );
    var height = Math.max(
        document.documentElement.clientHeight,
        window.innerHeight || 0
    );
    canvas.setHeight(height);
    canvas.setWidth(width);
}

window.addEventListener("resize", draw, false);

function initDraw() {
    // create a rectangle object
    var rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: "red",
        width: 20,
        height: 20,
    });

    // "add" rectangle onto canvas
    canvas.add(rect);

    canvas.on("mouse:wheel", function (opt) {
        var delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 0.01) zoom = 0.01;
        canvas.setZoom(zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
    });
}

function draw() {
    canvas.renderAll();
}

sizeCanvas();
initDraw();

function showTabPane(id: string) {
    let tabPane = document.getElementById(id);
    if (tabPane !== null) {
        tabPane.classList.remove("hidden");
    }
}

function hideTabPane(id: string) {}
