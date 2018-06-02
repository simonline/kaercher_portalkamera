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
        Math.round((parseFloat(matrix[5]) - (parseFloat(matrix[3]) < 0 ? container.height() * zoom : 0) + (zoom-1) * container.height()/2) * ratio)
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

function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function initAll() {
    // ALL STEPS
    // Bind download config
    $('a.save-config').click(function (e) {
        e.preventDefault();
        backend.getConfig(function (data) {
            downloadURI('data:application/json,' + JSON.stringify(data), 'config.json');
        });
    });
    // Bind reset
    $('a.reset-config').click(function (e) {
        e.preventDefault();
        backend.resetConfig();
    });
}

function initStart() {
    // STEP 0
    // Bind maintenance mode and snapshot on submit
    $('form#start').submit(function (e) {
        e.preventDefault();
        loadingButton($('button[type=submit]'));
        backend.setMaintenanceMode(function (mdata) {
            backend.takeSnapshot(function (sdata) {
                // Go to next step, setting image parameter
                location = $('form').attr('action') + '?snapshot=' + JSON.stringify(sdata.url);
            });
        });
    });
    // Bind upload software update
    $('a.update-software').click(function (e) {
        e.preventDefault();
        $('#upload-update').trigger('click');
    });
    $('#upload-update').change(function (e) {
        var file = this.files[0];
        if (file) {
            showLoadingModal('Update wird übertragen, bitte warten.');
            backend.beginUpdate(function () {
                backend.sendUpdateFile(file, function () {
                    backend.verifyUpdate(function () {
                        showLoadingModal('Update erfolgreich.', 'Ok');
                    });
                });
            });
        }
    });

    // Bind upload config
    $('a.load-config').click(function (e) {
        e.preventDefault();
        $('#upload-config').trigger('click');
    });
    $('#upload-config').change(function (e) {
        var file = this.files[0];
        if (file) {
            loadingButton($('a.load-config'));
            var reader = new FileReader();
            reader.readAsText(file, "UTF-8");
            reader.onload = function (re) {
                var config = JSON.parse(re.target.result);
                backend.setConfig(config, function (data) {
                    // Go to next step
                    location = $('form').attr('action');
                });
            };
            reader.onerror = function (ee) {
                backend.error();
            };
        }
    });
}

function initConfig1() {
    // STEP 1
    // Get current config
    showLoadingModal();
    backend.getConfig(function (data) {
        warp_data = data.warp;
        camera_data = data.camera;
        signal_data = data.signal;
        guide_data = data.guide;
        refreshSVG();

        // Get snapshot URL from param
        snapshot_image.url = JSON.parse(getParameterByName('snapshot'));
        container.css('background-image', 'url(' + snapshot_image.url +')');
        container.css('background-size', '342px 614px');
        // Draggable camera polygon
        $('#camera.draggable').each(function () {
            jqueryDraggablePolygon(this, updateCameraPolygonData);
            updateCameraPolygonData();
        });
        hideLoadingModal();
    });
    // Bind set warp on submit
    if (container.data('warp')) {
        $('form').submit(function (e) {
            e.preventDefault();
            // Go to next step, setting warp parameter
            location = $('form').attr('action') + '?warp=' + JSON.stringify(warp_data.corners);
        });
    }
}

function initConfig2() {
    // STEP 2
    // Get current config
    showLoadingModal();
    backend.getConfig(function (data) {
        warp_data = data.warp;
        camera_data = data.camera;
        signal_data = data.signal;
        guide_data = data.guide;
        refreshSVG();

        // Get warped image
        updateWarpData();
        backend.setWarp(warp_data.corners, function (data) {
            warped_image = data;
            container.find('image#camera')
                     .attr('xlink:href', data.url);
            hideLoadingModal();
        });
    });
    // Bind set config on submit
    if (container.data('config')) {
        $('form').submit(function (e) {
            e.preventDefault();
            backend.setConfig({
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
    // Pan/Zoom camera
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
    // Draggable guide polygon
    $('#guide.draggable').each(function () {
        jqueryDraggablePolygon(this, updateGuideData);
        updateGuideData();
    });
    // Pan traffic light
    if ($('#signal.pan').length) {
        initPanZoom('#signal.pan', '.pan', {
            eventNamespace: '.pan',
            disableZoom: true,
            $reset: $('.pan-control .reset')
        });
        $('#signal.pan').on('panzoomend', updateSignalData);
        updateSignalData();
    }
    // Color picker for guide line
    if ($('#guide.colorpicker').length) {
        $("#guide-colorpicker").spectrum({
            color: "#ffed00",
            showButtons: false,
            preferredFormat: "hex",
            move: updateGuideColorData,
            change: updateGuideColorData
        });
        updateGuideColorData();
    }
    // Flip snapshot
    $('#camera-flip').change(function () {
        camera_data.flip = $(this).is(':checked');
        var camera = $('image#camera'),
            matrix = camera.panzoom('getMatrix');
        if ($(this).is(':checked')) {
            matrix[0] = 1;
            matrix[3] = -1;
            matrix[4] = 0;
            camera.panzoom('setMatrix', matrix);
            camera.panzoom('pan', camera.width(), camera.height());
        } else {
            matrix[0] = 1;
            matrix[3] = 1;
            camera.panzoom('setMatrix', matrix);
            camera.panzoom('pan', 0, 0);
        }
    });
}

function loadingButton (button) {
    $(button).html('<i class="fa fa-spinner"></i> Laden ...');
}

function showLoadingModal (text, abort_label) {
    text = text || 'Aktuelle Konfiguration wird geladen, bitte warten.';
    abort_label = abort_label || 'Abbrechen';
    backend.createModal('loading', 'Laden', text, null, '', abort_label);
}

function hideLoadingModal () {
    $('#loading').modal('hide');
}

$(document).ready(function () {

    container = $('svg.kpc-backend');
    backend = $.kpcBackend();
    ratio = 1920.0 / container.height();
    ratio_inverse = container.height() / 1920.0;

    initAll();
    if ($('form#start').length) {
        initStart();
    }
    if ($('form#config-1').length) {
        initConfig1();
    }
    if ($('form#config-2').length) {
        initConfig2();
    }

});
