/**
 * SearchData class
 */
function SearchData(form) {
	this.form = $(form);
	this.data = false;

    /**
     * Get data from form
     * @return {Object}
     */
    this.getData = function() {
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
    this.resetData = function() {
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
    this.setData = function(objectOrKey, value) {
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
function SearchLoader(config) {
    this.config = config;

    /**
     * Load data
     * @param parameters
     * @return {*}
     */
    this.load = function(parameters, callback) {
        $.ajax({
            url: this.config.url,
            method: this.config.method,
            dataType: this.config.dataType,
            data: parameters
        }).then(async function (response) {
			callback({status: true, response});
        }).catch(function (error) {
			callback({status: false, error});
        });
    }
}

/**
 * SearchRender class
 */
function SearchRender(config) {
    this.config = config;
	
    /**
     * Success
     * @param result
     */
    this.success = function(result) {
        if (this.config.methods['success'] != undefined) {
            this.config.methods['success'](result);
        } else {
            $(this.config.success).html(result);
        }

        return this;
    }

    /**
     * Error
     * @param error
     */
    this.error = function(error) {
        if (this.config.methods['error'] != undefined) {
            this.config.methods['error'](error);
        } else {
            console.log(error);

            if (error.responseText) {
                var errors = typeof error.responseText == 'object' ? error.responseText : JSON.parse(error.responseText);

                for (var name in errors) {
                    $('[name="'+name+'"]').addClass('is-invalid');
                    $('[data-bind="error-'+name+'"]').text(errors[name]);
                }
            }
        }

        return this;
    }

    /**
     * Run
     * @param result
     * @return {Render}
     */
    this.run = function(result) {
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
function StaticSearch(config) {
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
		form: this.or(config.elements.form, '.search-engine-form'),
		pagination: this.or(config.elements.pagination, '.search-engine-pagination a'),
		record: this.or(config.elements.record, '.search-engine-record a')
	};

	// Config for loader
	this.config.loader = {
		url: this.or(config.url, $(this.config.elements.form).attr('action')),
		method: this.or(config.method, $(this.config.elements.form).attr('method')),
		dataType: this.or(config.dataType, 'html')
	};

	// Config for render
	this.config.render = {
		success: this.or(config.elements.success, '.search-engine-success'),
		error: this.or(config.elements.error, '.search-engine-error'),
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
		})
	};

	// Config init
	this.config.autoload = this.or(config.autoload, true);

	// Create object
	this.formData = new SearchData(this.config.elements.form);
	this.loader = new SearchLoader(this.config.loader);
	this.render = new SearchRender(this.config.render);

    /**
     * Passing data or default data
     * @param data
     * @param defaultData
     * @return {*}
     */
    this.or = function(data, defaultData) {
        return data == undefined ? defaultData : data;
    }

    /**
     * Config event
     *
     * @param key
     * @param method
     * @return {SearchEngine}
     */
    this.on = function(key, method) {
        if (this.events[key] != undefined) {
            this.events[key] = method;
        }

        return this;
    }

    /**
     * Submit
     * @return {SearchEngine}
     */
    this.submit = function() {
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
    this.pagination = function() {
        let instance = this;

        // Event for pagination
        $(document).on('click', this.config.elements.pagination, function (e) {
            e.preventDefault();
            var parameters = instance.formData.setData('page', $(this).attr('data-page')).getData();
            instance.loadContent(parameters);
        });

        return this;
    }

    /**
     * Load record
     * @return {SearchEngine}
     */
    this.record = function() {
        var instance = this;

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
    this.loadContent = function(parameters) {
        var instance = this;

        // Load data
        var status = instance.events.loading(instance.loader, parameters);

        if (status === false) {
            return false;
        }

        instance.loader.load(parameters, function(result){
			var content = {
				status: result.status
			};

			if (result.status) {
				content.response = instance.or(
					instance.events.loaded(result.status, result.response),
					result.response
				);

				if (content.response === false) {
					return;
				}
			} else {
				content.error = instance.or(
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
		});
		
        return;
    }

    /**
     * Init object
     * @return {SearchEngine}
     */
    this.init = function() {
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
    this.run = function(){
        return this.submit()
            .pagination()
            .record()
            .init();
    }
}