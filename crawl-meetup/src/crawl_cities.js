import "@babel/polyfill";

const fs = require('fs');
const os = require('os');
const path = require('path');

import { from } from 'rxjs';
import { map } from 'rxjs/operators';


const username = os.userInfo().username;

const countries = ["ES", "PT", "MX", "BR", "DE", "JP", "IT", "GB", "NO", "SE"];


const CommandLakeName = process.env.CommandLakeName;
const MeetupApiKey = process.env.MeetupApiKey;

var meetup = require('meetup-api')({
    key: MeetupApiKey
});

var AWS = require('aws-sdk');
var s3 = new AWS.S3();


function getTimestamp(nau) {
    const now = new Date();
    const year = now.getFullYear();
    const saneMonth = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const min = now.getMinutes();
    const secs = now.getSeconds();
    const millis = now.getMilliseconds();
    //const timestamp = `${year}/${saneMonth}/${day}/${hour}/${min}/${secs}/${millis}`
    const timestamp = `${year}/${saneMonth}/${day}`
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
    const timestamp = getTimestamp();
    const crawler = meta["crawler"] || "";
    const textdata = toJSON(data) || "";
    const objectName = md5(textdata);
    const homedir = os.homedir();
    const ext = meta["ext"] || "";
    const key = `${timestamp}/${crawler}/${objectName}`;
    const data_filename = path.join(homedir, ".cerebro", key + "." + ext);
    const meta_filename = path.join(homedir, ".cerebro", key + ".meta");
    const textmeta = toJSON(meta);

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


const crawl_cities_old = (event, context, callback) => {
    let getCities = (countryCode) => new Promise((resolve, reject) => {
        meetup.getCities({
            country: countryCode
        }, (err, resp) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const data = {
                    "country": countryCode,
                    "dataformat": "application/json",
                    "crawler": "meetup/getCities",
                    "keyname": resp.country,
                    "ext": "json",
                    "user": username,
                    "response": res
                }
                emmit(data);
                resolve(data);
            }
        })
    });

    let cities_p = countries.map(getCities)
    Promise.all(cities_p).catch((err) => { callback(err) });
    callback();
}

const crawl_cities = async (event, context, callback) => {
    console.log("Crawling meetup countries")
    const toCountries = cc => "CC: " + cc
    let countriesO = from(countries).pipe(map(toCountries));

    const subscription = countriesO.subscribe(x => console.log(x));
    console.log("DONE")
}

exports.crawl_cities = crawl_cities;

crawl_cities({}, {}, function () { });