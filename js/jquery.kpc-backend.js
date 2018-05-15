(function( $ ) {
    $.fn.kpcBackend = function( options ) {
        var settings = $.extend({
            // These are the defaults.
            base_url: 'http://localhost',
            snapshot_url: '/snapshot/set',
            warp_url: '/morph/set',
            config_save_url: '/config/set',
            config_load_url: '/config/load',
            config_reset_url: '/config/reset'
        }, this.data(), options);

        // Validate settings
        if (!settings.base_url) {
            console.error('No base URL given.');
            return this;
        }
        var that = this.addClass('row');

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

            loadConfig: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.config_load_url,
                    method: 'GET',
                    dataType: 'json',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            },

            saveConfig: function (config, callback) {
                $.ajax({
                    url: settings.base_url + settings.config_save_url,
                    method: 'POST',
                    dataType: 'json',
                    data: JSON.stringify(config),
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });

            },

            resetConfig: function (callback) {
                $.ajax({
                    url: settings.base_url + settings.config_reset_url,
                    method: 'GET',
                    dataType: 'json',
                    success: callback,
                    error: function (jqXHR, textStatus, errorThrown) {
                        createErrorModal();
                    }
                });
            }
        };
    };
}( jQuery ));