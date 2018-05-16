function jqueryDraggablePolygon(polygon, callback) {
    var points = polygon.points;
    var svgRoot = $(polygon).closest("svg");

    $('.handle').remove();
    function drag(i) { // close over variables for drag call back
        var point = points.getItem(i);

        var handle = document.createElement("div");
        handle.className = "handle";
        document.body.appendChild(handle);

        var base = svgRoot.position();
        // center handles over polygon
        var cs = window.getComputedStyle(handle, null);
        base.left -= (parseInt(cs.width) + parseInt(cs.borderLeftWidth) + parseInt(cs.borderRightWidth))/2;
        base.top -= (parseInt(cs.height) + parseInt(cs.borderTopWidth) + parseInt(cs.borderBottomWidth))/2;

        handle.style.left = base.left + point.x + "px";
        handle.style.top = base.top + point.y + "px";

        $(handle).draggable({
            drag: function (event) {
                setTimeout(function () { // jQuery apparently calls this *before* setting position, so defer
                    point.x = parseInt(handle.style.left) - base.left;
                    point.y = parseInt(handle.style.top) - base.top;
                    callback(point);
                },0);
            }
        });
    }

    for (var i = 0; i < points.numberOfItems; i++) {
        drag(i);
    }
}