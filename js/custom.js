var container,
    backend,
    ratio,
    ratio_inverse,
    snapshot_image = {
        url: '',
        size: []
    },
    warp_data = {
        corners: [] // [x0,y0,x1,y1,x2,y2,x3,y3]
    },
    warped_image = {
        url: '',
        size: []
    },
    camera_data = {
        zoom: 0,
        translation: [],
        flip: false
    },
    signal_data = {
        bounds: [] // [x0,y0,w,h]
    },
    guide_data = {
        color: '', // hex
        position: [] // [x0,y0,x1,y1]
    };

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function initPanZoom(selector, prefix, options) {
    var $elem = $(selector);
    $elem.panzoom(options);
    $(prefix + '-control .pan-up').click(function () {
        $elem.panzoom('pan', 0, -1, { relative: true });
    });
    $(prefix + '-control .pan-down').click(function () {
        $elem.panzoom('pan', 0, 1, { relative: true });
    });
    $(prefix + '-control .pan-left').click(function () {
        $elem.panzoom('pan', -1, 0, { relative: true });
    });
    $(prefix + '-control .pan-right').click(function () {
        $elem.panzoom('pan', 1, 0, { relative: true });
    });
}

function updateWarpData() {
    warp_data.corners = JSON.parse(getParameterByName('warp'));
}

function updateCameraPolygonData() {
    var points = container.find('polygon#camera').attr('points').split(/[, ]/);
    warp_data.corners = points.map(function (i) {
        return Math.round(parseFloat(i) * ratio);
    });
}

function updateCameraImageData() {
    var container = $('image#camera');
    var matrix = container.panzoom('getMatrix');
    var zoom = parseFloat(matrix[0]);
    camera_data.zoom = zoom;
    camera_data.translation = [
        Math.round((parseFloat(matrix[4]) + (zoom-1) * container.width()/2) * ratio),
        Math.round((parseFloat(matrix[5]) + (zoom-1) * container.height()/2) * ratio)
    ];
}

function updateSignalData() {
    var matrix = $('#signal').panzoom('getMatrix'),
        x = parseFloat($('#signal').attr('x')) + parseFloat(matrix[4]),
        y = parseFloat($('#signal').attr('y')) + parseFloat(matrix[5]);
    signal_data.bounds = [
        Math.round(x * ratio),
        Math.round(y * ratio),
        Math.round($('#signal').width() * ratio),
        Math.round($('#signal').height() * ratio),
    ];
}

function updateGuideData() {
    var points = container.find('polygon#guide').attr('points').split(' ');
    guide_data.position = points.map(function (i) {
        return Math.round(parseFloat(i) * ratio);
    });
}

function updateGuideColorData() {
    var color = $('#guide-colorpicker').spectrum('get');
    $('#guide').css('stroke', color.toHexString());
    guide_data.color = color.toHexString().substr(1).toUpperCase();
}

function refreshSVG() {
    // Step 1: Draggable camera polygon
    $('#camera.draggable').each(function () {
        // Update points
        for (var i = 0; i < this.points.numberOfItems; i++) {
            this.points[i].x = warp_data.corners[i * 2] * ratio_inverse;
            this.points[i].y = warp_data.corners[i * 2 + 1] * ratio_inverse;
        }
        // Recreate handles
        jqueryDraggablePolygon(this, updateCameraPolygonData);
    });

    // Step 2: Warp
    if (container.data('warped')) {
        backend.setWarp(warp_data.corners, function (data) {
            warped_image = data;
            container.find('image#camera').attr('xlink:href', data.url);
        });
    }

    // Step 2: Pan/Zoom camera
    if ($('#camera.panzoom').length) {
        var camera_tx = camera_data.translation[0],
            camera_ty = camera_data.translation[1];
        $('#camera.panzoom').panzoom('pan', camera_tx, camera_ty);
        $('.zoom-range').val(camera_data.zoom);
    }

    // Step 2: Draggable guide polygon
    $('#guide.draggable').each(function () {
        // Update points
        for (var i = 0; i < this.points.numberOfItems; i++) {
            this.points[i].x = guide_data.position[i * 2] * ratio_inverse;
            this.points[i].y = guide_data.position[i * 2 + 1] * ratio_inverse;
        }
        // Recreate handles
        jqueryDraggablePolygon(this, updateGuideData());
    });

    // Step 2: Pan traffic light
    if ($('#signal.pan').length) {
        var signal_tx = signal_data.bounds[0] * ratio_inverse,
            signal_ty = signal_data.bounds[1] * ratio_inverse;
        $('#signal.pan').panzoom('pan', signal_tx, signal_ty);
    }

    // Step 2: Color picker for guide line
    if ($('#guide.colorpicker').length) {
        $("#guide-colorpicker").spectrum('set', guide_data.color).change();
    }
}

$(document).ready(function () {

    container = $('svg.kpc-backend');
    ratio = 1920.0 / container.height();
    ratio_inverse = container.height() / 1920.0;

    // Init backend
    if (container.length) {
        backend = container.kpcBackend();
        // Take snapshot
        if (container.data('snapshot')) {
            backend.takeSnapshot(function (data) {
                snapshot_image = data;
                container.css('background-image', 'url(' + 'http://10.0.0.36:9080/' + data.url +')'); // FIXME: base URL needed for testing
                container.css('background-size', data.size[0] + 'px ' + data.size[1] + 'px');
            });
        }
        // Bind set warp on submit
        if (container.data('warp')) {
            $('form').submit(function (e) {
                e.preventDefault();
                // Go to next step, setting warp parameter
                location = $('form').attr('action') + '?warp=' + JSON.stringify(warp_data.corners);
            });
        }
        // Step 2: Warp
        if (container.data('warped')) {
            updateWarpData();
            backend.setWarp(warp_data.corners, function (data) {
                warped_image = data;
                container.find('image#camera').attr('xlink:href', data.url);
            });
        }
        // Bind set config on submit
        if (container.data('config')) {
            $('form').submit(function (e) {
                e.preventDefault();
                backend.saveConfig({
                    warp: warp_data,
                    camera: camera_data,
                    signal: signal_data,
                    guide: guide_data
                }, function (data) {
                    // Go to next step
                    location = $('form').attr('action');
                });
            });
        }
        // Bind configuration links
        $('a.save-config').click(function (e) {
            e.preventDefault();
            backend.saveConfig({
                warp: warp_data,
                camera: camera_data,
                signal: signal_data,
                guide: guide_data
            }, function () {});
        });
        $('a.load-config').click(function (e) {
            e.preventDefault();
            backend.loadConfig(function (data) {
                warp_data = data.warp;
                camera_data = data.camera;
                signal_data = data.signal;
                guide_data = data.guide;
                refreshSVG();
            });
        });
        $('a.reset-config').click(function (e) {
            e.preventDefault();
            backend.resetConfig(function (data) {
                warp_data = data.warp;
                camera_data = data.camera;
                signal_data = data.signal;
                guide_data = data.guide;
                refreshSVG();
            });
        });
    }

    // Step 1: Draggable camera polygon
    $('#camera.draggable').each(function () {
        jqueryDraggablePolygon(this, updateCameraPolygonData);
        updateCameraPolygonData();
    });

    // Step 2: Pan/Zoom camera
    if ($('#camera.panzoom').length) {
        initPanZoom('#camera.panzoom', '.panzoom', {
            eventNamespace: '.panzoom',
            $zoomIn: $('.panzoom-control .zoom-in'),
            $zoomOut: $('.panzoom-control .zoom-out'),
            $zoomRange: $('.panzoom-control .zoom-range'),
            $reset: $('.panzoom-control .reset')
        });
        $('#camera.panzoom').on('panzoomend', updateCameraImageData);
        updateCameraImageData();
    }

    // Step 2: Draggable guide polygon
    $('#guide.draggable').each(function () {
        jqueryDraggablePolygon(this, updateGuideData);
        updateGuideData();
    });

    // Step 2: Pan traffic light
    if ($('#signal.pan').length) {
        initPanZoom('#signal.pan', '.pan', {
            eventNamespace: '.pan',
            disableZoom: true,
            $reset: $('.pan-control .reset')
        });
        $('#signal.pan').on('panzoomend', updateSignalData);
        updateSignalData();
    }

    // Step 2: Color picker for guide line
    if ($('#guide.colorpicker').length) {
        $("#guide-colorpicker").spectrum({
            color: "#2b2b2b",
            showButtons: false,
            change: updateGuideColorData
        });
        updateGuideColorData();
    }

});
