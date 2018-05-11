function draggablePolygon(polygon) {
    var points = polygon.points;
    var svgRoot = $(polygon).closest("svg");

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
                },0);
            }
        });
    }

    for (var i = 0; i < points.numberOfItems; i++) {
        drag(i);
    }
}

function initPanZoom(selector, options) {
    var $elem = $(selector);
    $elem.panzoom(options);
    $(selector + '-control .pan-up').click(function () {
        $elem.panzoom('pan', 0, -1, { relative: true });
    });
    $(selector + '-control .pan-down').click(function () {
        $elem.panzoom('pan', 0, 1, { relative: true });
    });
    $(selector + '-control .pan-left').click(function () {
        $elem.panzoom('pan', -1, 0, { relative: true });
    });
    $(selector + '-control .pan-right').click(function () {
        $elem.panzoom('pan', 1, 0, { relative: true });
    });
}

$(document).ready(function () {

    // Step 1: Draggable polygon
    // Step 2: Draggable line
    $('.draggable').each(function () {
        draggablePolygon(this);
    });

    // Step 2: Pan/Zoom video
    if ($('.panzoom').length) {
        initPanZoom('.panzoom', {
            eventNamespace: '.panzoom',
            $zoomIn: $('.panzoom-control .zoom-in'),
            $zoomOut: $('.panzoom-control .zoom-out'),
            $zoomRange: $('.panzoom-control .zoom-range'),
            $reset: $('.panzoom-control .reset')
        });
    }

    // Step 2: Pan traffic light
    if ($('.pan').length) {
        initPanZoom('.pan', {
            eventNamespace: '.pan',
            disableZoom: true,
            $reset: $('.pan-control .reset')
        });
    }

    // Step 2: Color picker for line
    if ($('#line.colorpicker').length) {
        $("#line-colorpicker").spectrum({
            color: "green",
            showButtons: false,
            change: function(color) {
                $('#line').css('stroke', color.toHexString());
            }
        });
    }

});
