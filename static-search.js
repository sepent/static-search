/**
 * SearchData class
 */
class SearchData {
    constructor(app) {
        this.app = app;
        this.form = $(this.app.config.elements.form);
        this.data = false;
    }

    /**
     * Get data from form
     * @return {Object}
     */
    getData() {
        // Check if is first time load data
        // Then reset data to get new data in form
        if (this.data === false) {
            this.resetData();
        }

        return this.data;
    }

    /**
     * Reset data
     * @return {Data}
     */
    resetData() {
        var list = this.form.serializeArray();
        var data = {};

        for (var index in list) {
            data[list[index].name] = list[index].value;
        }

        this.setData(data, null);

        return this;
    }

    /**
     * Set data
     * @param objectOrKey
     * @param value
     * @return {Data}
     */
    setData(objectOrKey, value) {
        if (objectOrKey instanceof Object) {
            this.data = objectOrKey;
        } else {
            this.data[objectOrKey] = value;
        }

        return this;
    }
}

/**
 * SearchLoader class
 */
class SearchLoader {
    constructor(app) {
        this.app = app;
    }

    /**
     * Load data
     * @param parameters
     * @return {*}
     */
    async load(parameters) {
        return await $.ajax({
            url: this.app.config.loader.url,
            method: this.app.config.loader.method,
            dataType: this.app.config.loader.dataType,
            data: parameters
        }).then(async function (response) {
            return {status: true, response: response};
        }).catch(function (error) {
            return {status: false, error: error};
        });
    }
}

/**
 * SearchRender class
 */
class SearchRender {
    /**
     * constructor
     * @param app
     */
    constructor(app) {
        this.app = app;
    }

    /**
     * Success
     * @param result
     */
    success(result) {
        if (this.app.config.render.methods.success != undefined) {
            this.app.config.render.methods.success(result);
        } else {
            $(this.app.config.render.success).html(result);
        }

        this.app.events.rendered('success', result);

        return this;
    }

    /**
     * Error
     * @param error
     */
    error(error) {
        if (this.app.config.render.methods.error != undefined) {
            this.app.config.render.methods.error(error);
        } else {
            if (error.responseText) {
                var errors = typeof error.responseText == 'object' ? error.responseText : JSON.parse(error.responseText);

                for (var name in errors) {
                    $('[name="' + name + '"]').addClass('is-invalid');
                    $('[data-bind="error-' + name + '"]').text(errors[name]);
                }
            }
        }

        this.app.events.rendered('error', error);

        return this;
    }

    /**
     * Run
     * @param result
     * @return {Render}
     */
    run(result) {
        $('[data-bind]').text("");
        $('[name]').removeClass('is-invalid');

        if (result.status) {
            return this.success(result.response);
        }

        return this.error(result.error);
    }
}

/**
 * StaticSearch class
 */
class StaticSearch {
    /**
     * Constructor
     * @param config
     */
    constructor(config) {
        if (config == undefined) {
            config = {};
        }

        if (config.elements == undefined) {
            config.elements = {};
        }

        if (config.methods == undefined) {
            config.methods = {};
        }

        if (config.events == undefined) {
            config.events = {};
        }

        // Set config
        this.config = {};
        this.config.elements = {
            form: this.or(config.elements.form, '.ss-form'),
            pagination: this.or(config.elements.pagination, '.ss-pagination a'),
            order: this.or(config.elements.pagination, '.ss-order span'),
            record: this.or(config.elements.record, '.ss-record a')
        };

        // Config for loader
        this.config.loader = {
            url: this.or(config.url, $(this.config.elements.form).attr('action')),
            method: this.or(config.method, $(this.config.elements.form).attr('method')),
            dataType: this.or(config.dataType, 'html')
        };

        // Config for render
        this.config.render = {
            success: this.or(config.elements.success, '.ss-success'),
            error: this.or(config.elements.error, '.ss-error'),
            methods: this.or(config.methods.render, {})
        };

        // Config event
        this.events = {
            submit: this.or(config.events.submit, function (formData) {
            }),
            loading: this.or(config.events.loading, function (loader, parameters) {
            }),
            loaded: this.or(config.events.loaded, function (result) {
            }),
            render: this.or(config.events.render, function (result) {
            }),
            rendered: this.or(config.events.rendered, function (result) {
            })
        };

        // Config init
        this.config.autoload = this.or(config.autoload, true);

        // Create object
        this.formData = new SearchData(this);
        this.loader = new SearchLoader(this);
        this.render = new SearchRender(this);
    }

    /**
     * Passing data or default data
     * @param data
     * @param defaultData
     * @return {*}
     */
    or(data, defaultData) {
        return data == undefined ? defaultData : data;
    }

    /**
     * Config event
     *
     * @param key
     * @param method
     * @return {SearchEngine}
     */
    on(key, method) {
        if (this.events[key] != undefined) {
            this.events[key] = method;
        }

        return this;
    }

    /**
     * Submit
     * @return {SearchEngine}
     */
    submit() {
        let instance = this;

        // Event when on submit
        // Get form data and call server to load data
        $(document).on('submit', this.config.elements.form, function (e) {
            e.preventDefault();
            instance.formData.resetData();

            // Event submit
            // If return false then stop
            var status = instance.events.submit(instance.formData, e);

            if (status === false) {
                return;
            }

            var parameters = instance.formData.getData();
            instance.loadContent(parameters);
        });

        return this;
    }

    /**
     * Paginate
     * @return {SearchEngine}
     */
    pagination() {
        let instance = this;

        // Event when click on pagination
        $(document).on('click', this.config.elements.pagination, function (e) {
            e.preventDefault();
            var page = $(this).attr('data-page');

            if (isNaN(page)) {
                var url = $(this).attr('href').split('?')[1];
                var params = url.split('&');
                for (var i = 0; i < params.length; i++) {
                    var name = params[i].split('=');
                    if (name[0] == 'page') {
                        page = name[1];
                        break;
                    }
                }
            }

            var parameters = instance.formData.setData('page', page).getData();
            instance.loadContent(parameters)
        });

        return this;
    }

    /**
     * Order
     * @return {SearchEngine}
     */
    order() {
        $(document).on('click', this.config.elements.order, function (e) {
            e.preventDefault();

            var field = $(this).closest('th').attr('data-sort');
            var old_data = instance.formData.getData();
            var type = $(this).attr('data-type');

            if (field == undefined) {
                return;
            }

            if (old_data.sort_column === field) {
                if (old_data.sort_type === type) {
                    return;
                }

                instance.formData.setData('sort_type', type);
            } else {
                instance.formData.setData('sort_column', field);
                instance.formData.setData('sort_type', type);
            }

            instance.formData.setData('page', 1);
            var new_data = instance.formData.getData();
            instance.loadContent(new_data);
        });

        return this;
    }

    /**
     * Load record
     * @return {SearchEngine}
     */
    record() {
        let instance = this;

        // Event for pagination
        $(document).on('click', this.config.elements.record, function (e) {
            e.preventDefault();
            var parameters = instance.formData.setData('record', $(this).attr('data-record')).getData();
            instance.loadContent(parameters);
        });

        return this;
    }

    /**
     * Load content
     * @param parameters
     * @return {Promise<*>}
     */
    async loadContent(parameters) {
        let instance = this;

        // Load data
        var status = instance.events.loading(instance.loader, parameters);

        if (status === false) {
            return false;
        }

        var result = await instance.loader.load(parameters);
        var content = {
            status: result.status
        };

        if (result.status) {
            content.response = this.or(
                instance.events.loaded(result.status, result.response),
                result.response
            );

            if (content.response === false) {
                return;
            }
        } else {
            content.error = this.or(
                instance.events.loaded(result.status, result.error),
                result.error
            );

            if (content.error === false) {
                return;
            }
        }

        status = instance.events.render(content);

        if (status === false) {
            return;
        }

        instance.render.run(content);
        return;
    }

    /**
     * Init object
     * @return {SearchEngine}
     */
    init() {
        // Init autoload
        if (this.config.autoload === true) {
            $(this.config.elements.form).submit();
        }

        return this;
    }

    /**
     * Run search engine
     * @return {SearchEngine}
     */
    run() {
        return this.submit()
            .pagination()
            .record()
            .order()
            .init();
    }
}
