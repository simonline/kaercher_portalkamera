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

    var container = $('svg.kpc-backend'),
        backend;

    // Init backend
    if (container.length) {
        backend = container.kpcBackend();
        // Take snapshot
        if (container.data('snapshot')) {
            backend.takeSnapshot(function (data) {
                container.css('background-image', data.url);
                container.css('background-size', data.size[0] + 'px ' + data.size[1] + 'px');
            });
        }
        // Bind set warp on submit
        if (container.data('warp')) {
            $('form').submit(function (e) {
                e.preventDefault();
                backend.setWarp(function (data, textStatus, jqXHR) {
                    // Go to next step
                    location = $('form').attr('action');
                });
            });
        }
        // Take warped snapshot
        if (container.data('warped')) {
            backend.takeWarpedSnapshot();
        }
        // Bind set config on submit
        if (container.data('config')) {
            $('form').submit(function (e) {
                e.preventDefault();
                backend.saveConfig(function (data, textStatus, jqXHR) {
                    // Go to next step
                    location = $('form').attr('action');
                });
            });
        }
        // Bind configuration links
        $('a.save-config').click(function (e) {
            e.preventDefault();
            backend.saveConfig(function () {
            });
        });
        $('a.load-config').click(function (e) {
            e.preventDefault();
            backend.loadConfig();
        });
        $('a.reset-config').click(function (e) {
            e.preventDefault();
            backend.resetConfig();
        });
    }

    // Step 1: Draggable polygon
    // Step 2: Draggable line
    $('.draggable').each(function () {
        jqueryDraggablePolygon(this);
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
            color: "#2b2b2b",
            showButtons: false,
            change: function(color) {
                $('#line').css('stroke', color.toHexString());
            }
        });
    }

});
