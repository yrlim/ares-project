/*jshint node: true, strict: false, globalstrict: false */

var fs = require("fs"),
    path = require("path"),
    express = require("express"),
    util  = require("util"),
    child_process = require("child_process"),
    createDomain = require('domain').create,
    log = require('npmlog'),
    temp = require("temp"),
    http = require("http"),
    async = require("async"),
    mkdirp = require("mkdirp"),
    rimraf = require("rimraf"),
    archiver = require('archiver'),
    CombinedStream = require('combined-stream'),
    base64stream = require('base64stream'),
    HttpError = require("./httpError");

module.exports = BdBase;

/**
 * Base object for Ares build services
 * 
 * @param {Object} config
 * @property config {String} port requested IP port (0 for dynamic allocation, the default)
 * @property config {String} pathname location after the service origin, defaults to '/'
 * @property config {String} basename child class name (for tracing)
 * @property config {String} level tracing level (default to 'http')
 * @property config {Boolean} performCleanup clean temporary files & folders (default to true)
 * 
 * @param {Function} next
 * @param next {Error} err
 * @param next {Object} service
 * @property service {String} protocol is 'http' or 'https'
 * @property service {String} host IP address to 
 * @property service {String} port bound port (useful in case of dynamic allocation)
 * @property service {String} origin consolidated string of protocol, host & port
 * @property service {String} pathname to locat the service behind the origin
 * 
 * @public
 */
function BdBase(config, next) {

	config.port = config.port || 0;
	config.timeout = config.timeout || (2*60*1000);
	config.pathname = config.pathname || '/';
	config.level = config.level || 'http';
	if (config.performCleanup === undefined) {
		config.performCleanup = true;
	}

	this.config = config;
	log.info('BdBase()', "config:", this.config);

	// express 3.x: app is not a server
	this.app = express();
	this.server = http.createServer(this.app);
	this.server.setTimeout(config.timeout);

	/*
	 * Middleware -- applied to every verbs
	 */
	if (this.config.level !== 'error' && this.config.level !== 'warn') {
		this.app.use(express.logger('dev'));
	}

	/*
	 * Error Handling - Wrap exceptions in delayed handlers
	 */
	this.app.use(function _useDomain(req, res, next) {
		log.silly("BdBase#_useDomain()");
		var domain = createDomain();

		domain.on('error', function(err) {
			setImmediate(next, err);
			domain.dispose();
		});

		domain.enter();
		setImmediate(next);
	});

	// CORS -- Cross-Origin Resources Sharing
	this.app.use(function _useCors(req, res, next) {
		log.silly("BdBase#_useCors()");
		res.header('Access-Control-Allow-Origin', "*"); // XXX be safer than '*'
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control');
		if ('OPTIONS' == req.method) {
			res.status(200).end();
		}
		else {
			setImmediate(next);
		}
	});

	// Authentication
	this.app.use(function(req, res, next) {
		if (req.connection.remoteAddress !== "127.0.0.1") {
			setImmediate(next, new Error("Access denied from IP address "+req.connection.remoteAddress));
		} else {
			setImmediate(next);
		}
	});

	this.use();

	// Built-in express form parser: handles:
	// - 'application/json' => req.body
	// - 'application/x-www-form-urlencoded' => req.body
	// - 'multipart/form-data' => req.body.<field>[], req.body.file[]
	this.uploadDir = temp.path({prefix: 'com.enyojs.ares.services.' + this.config.basename}) + '.d';
	fs.mkdirSync(this.uploadDir);
	this.app.use(express.bodyParser({keepExtensions: true, uploadDir: this.uploadDir}));

	/*
	 * verbs
	 */
	this.app.post('/config', (function(req, res /*, next*/) {
		this.configure(req.body && req.body.config, function(/*err*/) {
			res.status(200).end();
		});
	}).bind(this));

	this.app.post(this.makeExpressRoute('/op/archive'), this.archive.bind(this));
	this.app.post(this.makeExpressRoute('/op/build'), this.build.bind(this));

	this.route();

	/*
	 * error handling: express-3.x: middleware with arity === 4 is
	 * detected as the global error handler
	 */
	this.app.use(this.errorHandler.bind(this));

	// Send back the service location information (origin,
	// protocol, host, port, pathname) to the creator, when port
	// is bound
	this.server.listen(config.port, "127.0.0.1", null /*backlog*/, (function() {
		var tcpAddr = this.server.address();
		setImmediate(next, null, {
			protocol: 'http',
			host: tcpAddr.address,
			port: tcpAddr.port,
			origin: "http://" + tcpAddr.address + ":"+ tcpAddr.port,
			pathname: config.pathname
		});
	}).bind(this));
}

/**
 * Make sane Express matching paths
 * @protected
 */
BdBase.prototype.makeExpressRoute = function(path) {
	return (this.config.pathname + path)
		.replace(/\/+/g, "/") // compact "//" into "/"
		.replace(/(\.\.)+/g, ""); // remove ".."
};

/**
 * @protected
 */
BdBase.prototype.configure = function(config, next) {
	log.silly("BdBase#configure()", "old config:", this.config);
	log.silly("BdBase#configure()", "inc config:", config);
	util._extend(this.config, config);
	log.verbose("BdBase#configure()", "new config:", this.config);
	setImmediate(next);
};

/**
 * Additionnal middlewares: 'this.app.use(xxx)'
 * @protected
 */
BdBase.prototype.use = function(/*config, next*/) {
	log.verbose('BdBase#use()', "skipping..."); 
};

/**
 * Additionnal routes/verbs: 'this.app.get()', 'this.app.port()'
 * @protected
 */
BdBase.prototype.route = function(/*config, next*/) {
	log.verbose('BdBase#route()', "skipping..."); 
};

/**
 * @protected
 */
BdBase.prototype.setCookie = function(res, key, value) {
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + 10 /*days*/);
	var cookieOptions = {
		domain: '127.0.0.1:' + this.config.port,
		path: this.config.pathname,
		httpOnly: true,
		expires: exdate
		//maxAge: 1000*3600 // 1 hour
	};
	res.cookie(key, value, cookieOptions);
	log.info('BdBase#setCookie()', "Set-Cookie: " + key + ":", value || "");
};

/**
 * Global error handler (arity === 4)
 * @protected
 */
BdBase.prototype.errorHandler = function(err, req, res, next){
	log.error("BdBase#errorHandler()", err.stack);
	res.status(err.statusCode || 500);
	res.contentType('txt'); // direct usage of 'text/plain' does not work
	res.send(err.toString());
	this.cleanup(req, res, next);
};

/**
 * @protected
 */
BdBase.prototype.answerOk = function(req, res /*, next*/) {
	log.verbose("BdBase#answerOk()", '200 OK');
	res.status(200).send();
};

/**
 * @protected
 */
BdBase.prototype.prepare = function(req, res, next) {
	var appTempDir = temp.path({prefix: 'com.palm.ares.hermes.' + this.config.basename + '.'}) + '.d';
	req.appDir = {
		root: appTempDir,
		source: path.join(appTempDir, 'source'),
		minify: path.join(appTempDir, 'minify')
	};
	
	log.verbose("BdBase#prepare()", "setting-up " + req.appDir.root);
	async.series([
		function(done) { mkdirp(req.appDir.root, done); },
		function(done) { fs.mkdir(req.appDir.source, done); },
		function(done) { fs.mkdir(req.appDir.minify, done); }
	], next);
};

/**
 * @protected
 */
BdBase.prototype.store = function(req, res, next) {
	if (!req.is('multipart/form-data')) {
		setImmediate(next, new HttpError("Not a multipart request", 415 /*Unsupported Media Type*/));
		return;
	}
	
	if (!req.files.file) {
		setImmediate(next, new HttpError("No file found in the multipart request", 400 /*Bad Request*/));
		return;
	}
	
	async.forEachSeries(req.files.file, function(file, cb) {
		var dir = path.join(req.appDir.source, path.dirname(file.name));
		log.silly("BdBase#store()", "mkdir -p ", dir);
		mkdirp(dir, function(err) {
			log.silly("BdBase#store()", "mv ", file.path, " ", file.name);
			if (err) {
				cb(err);
			} else {
				if (file.type.match(/x-encoding=base64/)) {
					fs.readFile(file.path, function(err, data) {
						if (err) {
							log.info("BdBase#store()", "transcoding: error" + file.path, err);
							cb(err);
							return;
						}
						try {
							var fpath = file.path;
							delete file.path;
							fs.unlink(fpath, function(/*err*/) { /* Nothing to do */ });
							
							var filedata = new Buffer(data.toString('ascii'), 'base64');			// TODO: This works but I don't like it
							fs.writeFile(path.join(req.appDir.source, file.name), filedata, function(err) {
								log.silly("BdBase#store()", "from base64(): Stored: ", file.name);
								cb(err);
							});
						} catch(transcodeError) {
							log.warn("BdBase#store()", "transcoding error: " + file.path, transcodeError);
							cb(transcodeError);
						}
					}.bind(this));
				} else {
					fs.rename(file.path, path.join(req.appDir.source, file.name), function(err) {
						log.silly("BdBase#store()", "Stored: ", file.name);
						cb(err);
					});
				}
			}
		});
	}, next);
};

/**
 * Bdbase#minify method takes 2 request query parameters:
 * 
 * - "debug" is one of ["true", "false"] (default: "false").  When true, the code is not minified.
 * - "excludes" is an Array of relative path to be removed from the archive uploaded to PGB. "excludes"
 *   is ignored when "debug" is "false".
 * 
 * @protected
 */
BdBase.prototype.minify = function(req, res, next) {
	// 'this' context not available in nested functions?
	var minifyScript = this.config.minifyScript;

	if (req.query["debug"] === "true") {
		_noMinify();
		return;
	}

	var appManifest = path.join(req.appDir.source, 'package.js');
	fs.stat(appManifest, function(err) {
		if (err) {
			// No top-level package.js: this is not a
			// Bootplate-based Enyo application & we have
			// no clue on wether it is even an Enyo
			// application, so we cannot `deploy` it
			// easily.
			log.info("BdBase#minify()", "no '" + appManifest + "': not an Enyo Bootplate-based application");
			_noMinify();
		} else {
			_minify();
		}
	});

	function _noMinify() {
		log.info("BdBase#minify#_noMinify()", "Skipping minification");

		var excludes;
		try {
			excludes = JSON.parse(req.query["excludes"]);
			excludes = Array.isArray(excludes) && excludes;
		} catch(e) {}
		excludes = excludes || ["target", "build"];

		req.appDir.zipRoot = req.appDir.source;
		var index = path.join(req.appDir.zipRoot, "index.html"),
		    debug = path.join(req.appDir.zipRoot, "debug.html");
		async.waterfall([
			async.forEach.bind(this, excludes, function(exclude, next) {
				var absExclude = path.join(req.appDir.zipRoot, exclude);
				log.verbose("BdBase#minify#_noMinify()", "rm -rf", absExclude);
				rimraf(absExclude, next);
			}),
			fs.stat.bind(this, debug),
			function(stat, next) {
				log.verbose("BdBase#minify#_noMinify()", "mv debug.html index.html");
				fs.unlink(index, next);
			},
			fs.rename.bind(this, debug, index)
		], function(err) {
			if (err) {
				log.verbose("BdBase#ignoring err:", err.toString());
			}
			setImmediate(next);
		});
	}

	function _minify() {
		req.appDir.zipRoot = req.appDir.minify;
		
		// Execute the deploy.js script that comes with Enyo.
		// 
		// TODO: scalable processing is better acheived using
		// VM <http://nodejs.org/api/vm.html> rather than
		// child-processes
		// <http://nodejs.org/api/child_process.html>.
		var params = [ '--verbose',
			       '--source', req.appDir.source,
			       '--out', req.appDir.minify,
			       '--less'];
		log.info("BdBase#minify#_minify()", "Running: '", minifyScript, params.join(' '), "'");
		var child = child_process.fork(minifyScript, params, {
			silent: false
		});
		child.on('message', function(msg) {
			log.verbose("BdBase#minify()", msg);
			if (msg.error) {
				log.error("BdBase#minify()", "child-process error: ", msg.error);
				child.errMsg = msg.error;
			} else {
				log.warn("BdBase#minify()", "unexpected child-process message msg=", msg);
			}
		});
		child.on('exit', function(code /*, signal*/) {
			if (code !== 0) {
				setImmediate(next, new HttpError(child.errMsg || ("child-process failed: '"+ child.toString() + "'")));
			} else {
				log.info("BdBase#minify(): completed");
				setImmediate(next);
			}
		});
	}
};

/**
 * @protected
 */
BdBase.prototype.build = function(req, res, next) {
	log.verbose("BdBase#build()");
	setImmediate(next, new HttpError("Not implemented", 500));
	/*
	// Example
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.package.bind(this, req, res),
		this.returnFormData.bind(this, [], res),
		this.cleanup.bind(this, req, res)
	], function (err, results) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanup)
			setImmediate(next, err);
		}
		// we do not invoke error-less next() here
		// because that would try to return 200 with
		// an empty body, while we have already sent
		// back the response.
	});
	 */
};

/**
 * @protected
 */
BdBase.prototype.archive = function(req, res, next) {
	log.verbose("BdBase#archive()");
	async.series([
		this.prepare.bind(this, req, res),
		this.store.bind(this, req, res),
		this.minify.bind(this, req, res),
		this.zip.bind(this, req, res),
		this.returnZip.bind(this, req, res),
		this.cleanup.bind(this, req, res)
	], function (err /*, results*/) {
		if (err) {
			// run express's next() : the errorHandler (which calls cleanup)
			setImmediate(next, err);
		}
		// we do not invoke error-less next() here
		// because that would try to return 200 with
		// an empty body, while we have already sent
		// back the response.
	});
};

/**
 * @protected
 */
BdBase.prototype.zip = function(req, res, next) {
	log.info("BdBase#zip()", "Zipping '" + req.appDir.zipRoot + "'");
	req.zip = {};
	req.zip.path = path.join(req.appDir.root, "app.zip");
	req.zip.stream = archiver.createZip({level: 1});
	req.zip.stream.pipe(fs.createWriteStream(req.zip.path));
	_walk.bind(this)(req.appDir.zipRoot, "" /*prefix*/, function(err) {
		if (err) {
			setImmediate(next, err);
			return;
		}
		try {
			req.zip.stream.finalize(function(written){
				log.verbose("BdBase#zip()", "finished:", req.zip.path, "(" + written + " bytes)");
				setImmediate(next);
			});
		} catch(e) {
			setImmediate(next, e);
		}
	});
	
	function _walk(absParent, relParent, cb) {
		// TODO that _thing_ probably needs a bit of
		// refactoring by someone that feels easy with
		// node-async _arcanes_.
		log.silly("BdBase#zip._walk()", "Parsing: ", relParent);
		async.waterfall([
			function(cb2) {
				log.silly("BdBase#zip._walk()", "readdir: ", absParent);
				fs.readdir(absParent, cb2);
			},
			function(nodes, cb2) {
				log.silly("BdBase#zip._walk()", "nodes.forEach");
				async.forEachSeries(nodes, function(name, cb3) {
					var absPath = path.join(absParent, name),
					    relPath = path.join(relParent, name);
					log.silly("BdBase#zip._walk()", "stat: ", absPath);
					fs.stat(absPath, function(err, stat) {
						if (err) {
							cb3(err);
							return;
						}
						if (stat.isDirectory()) {
							_walk(absPath, relPath, cb3);
						} else {
							log.silly("BdBase#zip._walk()", "Adding: ", relPath);
							try {
								req.zip.stream.addFile(fs.createReadStream(absPath), { name: relPath }, function(err) {
									log.verbose("BdBase#zip._walk()", "Added: ", relPath, "(err=", err, ")");
									cb3(err);
								});
							} catch(e) {
								cb3(e);
							}
						}
					});
				}, cb2);
			}
		], cb);
	}
};

/**
 * @protected
 */
BdBase.prototype.returnZip = function(req, res, next) {
	res.status(200).sendfile(req.zip.path);
	delete req.zip;
	setImmediate(next);
};

/**
 * @protected
 */
BdBase.prototype.returnBody = function(req, res, next) {
	if (res.contentType) {
		// Otherwise count on express to detect the
		// content-type
		res.header('content-type', res.contentType);
	}
	res.status(200).send(res.body);
	delete res.body;
	delete res.contentType;
	setImmediate(next);
};

/**
 * @param {Array} parts
 * @item parts {Object} part
 * @property part {String} [filename] name to put in the FormData 
 * @property part {ReadableStream} [stream] input stream to use for the bits
 * @property part {Buffer} [buffer] input buffer to use for the bits
 * @protected
 */
BdBase.prototype.returnFormData = function(parts, res, next) {
	if (!Array.isArray(parts) || parts.length < 1) {
		setImmediate(next, new Error("Invalid parameters: cannot return a multipart/form-data of nothing"));
		return;
	}
	log.verbose("BdBase#returnFormData()", parts.length, "parts:");
	
	// Build the multipart/formdata
	var FORM_DATA_LINE_BREAK = '\r\n',
	    combinedStream = CombinedStream.create(),
	    boundary = _generateBoundary();

	parts.forEach(function(part) {
		// Adding part header
		combinedStream.append(_getPartHeader(part.filename));
		// Adding data
		if (part.stream) {
			var encodedStream = new base64stream.BufferedStreamToBase64();
			part.stream.pipe(encodedStream);
			combinedStream.append(encodedStream);
			part.stream.resume();
			log.verbose("BdBase#returnFormData()", "start streaming part:", part.filename);
		} else if (part.buffer) {
			combinedStream.append(function(nextDataChunk) {
				nextDataChunk(part.buffer.toString('base64'));
			});
		} else {
			combinedStream.append(function(nextDataChunk) {
				nextDataChunk('INVALID CONTENT');
			});
		}
	});
	
	// Adding part footer
	combinedStream.append(function(nextDataChunk) {
		nextDataChunk(_getPartFooter());
	});
	
	// Adding last footer
	combinedStream.append(function(nextDataChunk) {
		nextDataChunk(_getLastPartFooter());
	});
	
	// Send the files back as a multipart/form-data
	res.status(200);
	res.header('Content-Type', _getContentTypeHeader());
	combinedStream.pipe(res);
	combinedStream.on('end', next); //FIXME: this event is never emitted
	
	function _generateBoundary() {
		// This generates a 50 character boundary similar to those used by Firefox.
		// They are optimized for boyer-moore parsing.
		var boundary = '--------------------------';
		for (var i = 0; i < 24; i++) {
			boundary += Math.floor(Math.random() * 10).toString(16);
		}

		return boundary;
	}

	function _getContentTypeHeader() {
		return 'multipart/form-data; boundary=' + boundary;
	}

	function _getPartHeader(filename) {
		var header = '--' + boundary + FORM_DATA_LINE_BREAK;
		header += 'Content-Disposition: form-data; name="file"';

		header += '; filename="' + filename + '"' + FORM_DATA_LINE_BREAK;
		header += 'Content-Type: application/octet-stream; x-encoding=base64';

		header += FORM_DATA_LINE_BREAK + FORM_DATA_LINE_BREAK;
		return header;
	}

	function _getPartFooter() {
		return FORM_DATA_LINE_BREAK;
	}

	function _getLastPartFooter() {
		return '--' + boundary + '--';
	}
};

/**
 * @protected
 */
BdBase.prototype.cleanup = function(req, res, next) {
	var dir = req.appDir && req.appDir.root;
	if (this.config.performCleanup && dir) {
		log.verbose("BdBase#cleanup()", "rm -rf " + dir);
		rimraf(req.appDir.root, function(err) {
			log.verbose("BdBase#cleanup()", "removed " + dir);
			delete req.appDir;
			setImmediate(next, err);
		});
	} else {
		log.verbose("BdBase#cleanup()", "skipping removal of " + dir);
		setImmediate(next);
	}
};

/**
 * Terminates express server & clean-up the plate
 * @protected
 */
BdBase.prototype.quit = function(cb) {
	this.app.close();
	rimraf(this.uploadDir, cb);
	log.info('BdBase#quit()',  "exiting");
};

/**
 * @protected
 */
BdBase.prototype.onExit = function() {
	rimraf(this.uploadDir, function(/*err*/) {
		// Nothing to do
	});
};
