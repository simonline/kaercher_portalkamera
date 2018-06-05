(function( $ ) {
    $.kpcBackend = function( options ) {
        var settings = $.extend({
            // These are the defaults.
            base_url: 'http://portalcam.config',
            socket_url: 'ws://portalcam.config:8080/',
            maintenance_url: '/maintenance/set',
            snapshot_url: '/snapshot/get',
            warp_url: '/warp/set',
            config_get_url: '/config/get',
            config_set_url: '/config/set',
            config_reset_url: '/config/reset',
            begin_update_url: '/update/begin',
            verify_update_url: '/update/verify',
        }, options);

        // Validate settings
        if (!settings.base_url) {
            console.error('No base URL given.');
            return;
        }

        var createModal = function(id, title, text, submit_callback, submit_label, abort_label) {
            $('#' + id).modal('hide');
            submit_label = submit_label || 'Ok';
            abort_label = abort_label || 'Zurück';
            html = '<div id="' + id + '" class="modal fade" tabindex="-1" role="dialog">';
            html += '<div class="modal-dialog" role="document">';
            html += '<div class="modal-content">';
            html += '<div class="modal-header">';
            html += '<h5 class="modal-title">' + title + '</h5>';
            html += '<button type="button" class="close" data-dismiss="modal" aria-label="Close">';
            html += '<span aria-hidden="true">&times;</span></button>';
            html += '</div>';
            html += '<div class="modal-body">';
            html += '<p>' + text + '</p>';
            html += '</div>';
            html += '<div class="modal-footer">';
            html += '<button type="button" class="btn btn-secondary"' +
                ' data-dismiss="modal">' + abort_label + '</button>';
            if (submit_callback) {
                html += '<button type="button" class="btn btn-primary">' + submit_label + '</button>';
            }
            html += '</div>';
            html += '</div><!-- /.modal-content -->';
            html += '</div><!-- /.modal-dialog -->';
            html += '</div><!-- /.modal -->';
            $(html).appendTo($("body"));
            if (submit_callback) {
                $('#' + id + ' .btn-primary').click(function (e) {
                    e.preventDefault();
                    submit_callback();
                    return false;
                });
            }
            $('#' + id).modal();
        };

        var createErrorModal = function(error) {
            $('.modal').modal('hide');
            error = error || 'Leider konnte die gewünschte Aktion nicht durchgeführt werden. ' +
                'Bitte kontaktieren Sie unseren Support.';
            createModal('error', 'Fehler', error);
        };

        return {

            setMaintenanceMode: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.maintenance_url,
                    method: 'POST',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            takeSnapshot: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.snapshot_url,
                    method: 'GET',
                    dataType: 'json',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            setWarp: function (corners, callback) {
                $.ajax({
                    url: settings.base_url + settings.warp_url,
                    method: 'POST',
                    dataType: 'json',
                    data: JSON.stringify(corners),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            getConfig: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.config_get_url,
                    method: 'GET',
                    dataType: 'json',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            setConfig: function (config, callback) {
                $.ajax({
                    url: settings.base_url + settings.config_set_url,
                    method: 'POST',
                    data: JSON.stringify(config),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });

            },

            resetConfig: function () {
                $.ajax({
                    url: settings.base_url + settings.config_reset_url,
                    method: 'POST',
                    dataType: 'json',
                    success: function () {
                        createModal('reset', 'Auf Werkseinstellungen zurückgesetzt',
                            'Die Portalkamera wurde erfolgreich auf Werkseinstellungen ' +
                            'zurückgesetzt.');
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            beginUpdate: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.begin_update_url,
                    method: 'POST',
                    data: JSON.stringify({
                        timestamp: Math.round(new Date() / 1000)
                    }),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            sendUpdateFile: function (file, callback) {
                if ("WebSocket" in window) {
                    ws = new WebSocket(settings.socket_url);
                    ws.onopen = function () {
                        ws.binaryType = "arraybuffer";
                        var reader = new FileReader();
                        var rawData = new ArrayBuffer();
                        //reader.loadend = function() {
                        //};
                        reader.onload = function(e) {
                            rawData = e.target.result;
                            ws.send(rawData);
                            callback();
                        };
                        reader.onerror = function () {
                            createErrorModal();
                        };
                        reader.readAsArrayBuffer(file);
                    };
                    ws.onclose = function () {
                        console.log("Connection is closed.");
                    };
                } else {
                    backend.error("WebSocket wird von Ihrem Browser nicht unterstützt.");
                }
            },

            verifyUpdate: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.verify_update_url,
                    method: 'POST',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            error: function (error) {
                createErrorModal(error);
            },

            createModal: function (id, title, text, submit_callback, submit_label, abort_label) {
                createModal(id, title, text, submit_callback, submit_label, abort_label);
            }
        };
    };
}( jQuery ));