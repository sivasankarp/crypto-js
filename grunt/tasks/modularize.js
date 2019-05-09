/*jshint node: true*/

var _ = require("lodash"),

	fmd = require("fmd");

module.exports = function (grunt) {

    grunt.registerMultiTask('modularize', function () {
        var options = this.options(),

            done = this.async(),

            modules = {},

            config = {
    			target: this.target + '/',
    			factories: ["commonjs", "amd", "global"],
    			trim_whitespace: true,
    			new_line: "unix",
    			indent: "\t"
    		};

        _.each(options, function (conf, name) {
            var sources = [],

				opts = {
					depends: {}
				},

				deps = [];

			if (conf.exports) {
				opts.exports = conf.exports;
			}

			if (conf.global) {
				opts.global = conf.global;
			}

            _.each(this.filesSrc, function (source) {
    			if (grunt.file.exists(source + name + ".js")) {
    				sources.push(source + name + ".js");
    			}
            }, this);

            if (conf.pack) {
    			deps = _.chain(conf.components)
    			    .map(function (depName) {
        			    return options[depName].components;
    			    })
    			    .flatten()
    			    .uniq()
    			    .without(name)
    			    .sort(function (a, b) {
            			return options[a].components.indexOf(b) === -1 ? -1 : 1;
        			})
        			.value();

                _.each(this.filesSrc, function (source) {
                    _.each(deps, function (depName) {
            			if (grunt.file.exists(source + depName + ".js")) {
            				sources.push(source + depName + ".js");
            			}
        			});
                }, this);
            } else {
    			_.each(_.without(conf.components, name), function (value, i) {
    				opts.depends['./' + value] = value === "core" ? "CryptoJS" : null;
    			});
			}

			sources = _.uniq(sources);

			modules[name] = [sources, opts];
		}, this);

		fmd(config)
			.define(modules)
			.build(function (createdFiles) {

                done();
            });

    });

};
