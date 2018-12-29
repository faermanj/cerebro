"use strict";

require("@babel/polyfill");

var _rxjs = require("rxjs");

var _operators = require("rxjs/operators");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var fs = require('fs');

var os = require('os');

var path = require('path');

var username = os.userInfo().username;
var countries = ["ES", "PT", "MX", "BR", "DE", "JP", "IT", "GB", "NO", "SE"];
var CommandLakeName = process.env.CommandLakeName;
var MeetupApiKey = process.env.MeetupApiKey;

var meetup = require('meetup-api')({
  key: MeetupApiKey
});

var AWS = require('aws-sdk');

var s3 = new AWS.S3();

function getTimestamp(nau) {
  var now = new Date();
  var year = now.getFullYear();
  var saneMonth = now.getMonth() + 1;
  var day = now.getDate();
  var hour = now.getHours();
  var min = now.getMinutes();
  var secs = now.getSeconds();
  var millis = now.getMilliseconds(); //const timestamp = `${year}/${saneMonth}/${day}/${hour}/${min}/${secs}/${millis}`

  var timestamp = "".concat(year, "/").concat(saneMonth, "/").concat(day);
  return timestamp;
}

function toJSON(data) {
  return JSON.stringify(data);
}

var crypto = require('crypto');

function md5(data) {
  return crypto.createHash('md5').update(data).digest("hex");
}

function emmit(data, meta) {
  var timestamp = getTimestamp();
  var crawler = meta["crawler"] || "";
  var textdata = toJSON(data) || "";
  var objectName = md5(textdata);
  var homedir = os.homedir();
  var ext = meta["ext"] || "";
  var key = "".concat(timestamp, "/").concat(crawler, "/").concat(objectName);
  var data_filename = path.join(homedir, ".cerebro", key + "." + ext);
  var meta_filename = path.join(homedir, ".cerebro", key + ".meta");
  var textmeta = toJSON(meta);
  data_file_dir = path.dirname(data_filename);
  mkdir(data_file_dir);
  fs.writeFile(data_filename, textdata, 'utf8', function (err) {
    if (err) throw err;
    console.log("Emmited [" + data_filename + "]");
  });
  fs.writeFile(meta_filename, textmeta, 'utf8', function (err) {
    if (err) throw err;
    console.log("Emmited [" + meta_filename + "]");
  });
}

function mkdir(dir) {
  if (!fs.existsSync(dir)) {
    mkdir(path.join(dir, ".."));
    fs.mkdirSync(dir);
  }
}

var crawl_cities_old = function crawl_cities_old(event, context, callback) {
  var getCities = function getCities(countryCode) {
    return new Promise(function (resolve, reject) {
      meetup.getCities({
        country: countryCode
      }, function (err, resp) {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          var data = {
            "country": countryCode,
            "dataformat": "application/json",
            "crawler": "meetup/getCities",
            "keyname": resp.country,
            "ext": "json",
            "user": username,
            "response": res
          };
          emmit(data);
          resolve(data);
        }
      });
    });
  };

  var cities_p = countries.map(getCities);
  Promise.all(cities_p).catch(function (err) {
    callback(err);
  });
  callback();
};

var crawl_cities =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(event, context, callback) {
    var toCountries, countriesO, subscription;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            console.log("Crawling meetup countries");

            toCountries = function toCountries(cc) {
              return "CC: " + cc;
            };

            countriesO = (0, _rxjs.from)(countries).pipe((0, _operators.map)(toCountries));
            subscription = countriesO.subscribe(function (x) {
              return console.log(x);
            });
            console.log("DONE");

          case 5:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, this);
  }));

  return function crawl_cities(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.crawl_cities = crawl_cities;
crawl_cities({}, {}, function () {});