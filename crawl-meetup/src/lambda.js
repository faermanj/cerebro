const CommandLakeName = process.env.CommandLakeName;
const MeetupApiKey = process.env.MeetupApiKey;

var meetup = require('meetup-api')({
    key: MeetupApiKey
});
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

const countries = ["ES", "PT", "MX", "BR", "DE", "JP", "IT", "GB", "NO", "SE"];

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

function emmit(data) {
    const timestamp = getTimestamp();
    data["timestamp"] = timestamp;
    const crawler = data["crawler"] || ""
    const dataString = toJSON(data["response"]);
    const objectName = md5(dataString);
    const key = `${crawler}/${timestamp}/${objectName}.json`
    const metadata = data["metadata"];
    var params = {
        Bucket: CommandLakeName,
        Key: key,
        Body: dataString,
        Metadata: metadata,
        ContentType: "application/json"
    };
    s3.upload(params, function (err, data) {
        if (err) throw err;
        console.log("uploaded " + key);
    });
}

const crawl_cities = (event, context, callback) => {
    let getCities = (countryCode) => new Promise((resolve, reject) => {
        meetup.getCities({
            country: countryCode
        }, (err, resp) => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                const data = {
                    "crawler": "meetup/getCities",
                    "metadata": {
                        "country": countryCode,
                    },
                    "response": resp
                };
                emmit(data)
                resolve(data);
            }
        })
    });

    let cities_p = countries.map(getCities)
    Promise.all(cities_p).catch((err) => { callback(err) });
    callback();
}

exports.crawl_meetup = crawl_cities;

crawl_cities({}, {}, function () { });