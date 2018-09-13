function jqueryDraggablePolygon(polygon, callback) {
    var points = polygon.points;
    var svgRoot = $(polygon).closest("svg");

    $('.handle').remove();
    function drag(i) { // close over variables for drag call back
        var point = points.getItem(i);

        var handle = document.createElement("div");
        handle.className = "handle";
        $("#preview-container").append(handle);

        // center handles over polygon
        var cs = window.getComputedStyle(handle, null),
            dx = 4; //(parseInt(cs.width) + parseInt(cs.borderLeftWidth) + parseInt(cs.borderRightWidth))/2, ?? 
            dy = (parseInt(cs.height) + parseInt(cs.borderTopWidth) + parseInt(cs.borderBottomWidth))/2;

        handle.style.left = point.x - dx + "px";
        handle.style.top = point.y - dy  + "px";

        $(handle).draggable({
            drag: function (event) {
                setTimeout(function () { // jQuery apparently calls this *before* setting position, so defer
                    point.x = parseInt(handle.style.left) + dx;
                    point.y = parseInt(handle.style.top) + dy;
                    callback(point);
                },0);
            }
        });
    }

    for (var i = 0; i < points.numberOfItems; i++) {
        drag(i);
    }
}