(function( $ ) {
    $.fn.kpcBackend = function( options ) {
        var settings = $.extend({
            // These are the defaults.
            base_url: 'http://localhost',
            snapshot_url: '/snapshot/set',
            warp_url: '/morph/set',
            warped_snapshot_url: '/snapshot/warped/set',
            config_save_url: '/config/set',
            config_load_url: '/config/load',
            config_reset_url: '/config/reset'
        }, this.data(), options);

        // Validate settings
        if (!settings.base_url) {
            console.error('No base URL given.');
            return this;
        }
        var that = this.addClass('row'),
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

        var createModal = function(id, title, text, callback) {
            $('#' + id).remove();
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
                ' data-dismiss="modal">Zurück</button>';
            if (callback) {
                html += '<button type="button" class="btn btn-primary">Ja</button>';
            }
            html += '</div>';
            html += '</div><!-- /.modal-content -->';
            html += '</div><!-- /.modal-dialog -->';
            html += '</div><!-- /.modal -->';
            $(html).appendTo($("body"));
            if (callback) {
                $('#' + id + ' .btn-primary').click(function (e) {
                    e.preventDefault();
                    callback();
                    return false;
                });
            }
            $('#' + id).modal();
        };

        var createErrorModal = function() {
            $('.modal').modal('hide');
            createModal('error', 'Fehler',
                'Leider konnte die gewünschte Aktion nicht durchgeführt werden. ' +
                'Bitte kontaktieren Sie unseren Support.');
        };

        return {

            takeSnapshot: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.snapshot_url,
                    method: 'POST',
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        // Set SVG background image
                        snapshot_image = data;
                        callback(data);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            setWarp: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.warp_url,
                    method: 'POST',
                    dataType: 'json',
                    data: JSON.stringify(warp_data.corners),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            takeWarpedSnapshot: function () {
                $.ajax({
                    url: settings.base_url + settings.warped_snapshot_url,
                    method: 'GET',
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        // Set SVG background image
                        warped_image = data;
                        that.css('background-image', data.url);
                        that.css('background-size', 'contain');
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            loadConfig: function () {
                $.ajax({
                    url: settings.base_url + settings.config_load_url,
                    method: 'GET',
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        // Update local config
                        warp_data = data.warp;
                        camera_data = data.camera;
                        signal_data = data.signal;
                        guide_data = data.guide;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            saveConfig: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.config_save_url,
                    method: 'POST',
                    dataType: 'json',
                    data: JSON.stringify({
                        warp: warp_data,
                        camera: camera_data,
                        signal: signal_data,
                        guide: guide_data
                    }),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });

            },

            resetConfig: function () {
                $.ajax({
                    url: settings.base_url + settings.config_reset_url,
                    method: 'GET',
                    dataType: 'json',
                    success: function (data, textStatus, jqXHR) {
                        // Update local configuration
                        warp_data = data.warp;
                        camera_data = data.camera;
                        signal_data = data.signal;
                        guide_data = data.guide;
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            }
        };
    };
}( jQuery ));