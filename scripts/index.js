let test = require("./util.js");
var _ = require('lodash');

const PARAM_DISTRICT_ID = "3018" //荃灣
const PARAM_LANDMARK_ID = "67" //荃灣廣場
//https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&page=2&&sortBy=Default&where=%E6%9F%B4%E7%81%A3%E8%A7%92
const ENDPOINT_LANDMARK = "https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&districtId={0}&landmarkId={1}&page={2}"; 
const ENDPOINT_WHERE = "https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&sortBy=Default&where={0}&page={1}";

const DEFAULT_PLACES = [
    "柴灣角",
    "荃灣廣場",
    "海壩街",
    "大壩街",
    "享和街"
]

module.exports = (robot) => {
    robot.respond(/suggest (.*)/i, (res) => {
        let where = res.match[1];

        return loadAllPages(robot, function(page) { 
            let endpoint = ENDPOINT_WHERE.format(where, page);
            if (where === "荃灣廣場") {
                return ENDPOINT_LANDMARK.format(PARAM_DISTRICT_ID, PARAM_LANDMARK_ID, page);
            }
            return endpoint;
        })
        .then(result => res.send(formatSlackMessage("Here are today's suggestions", result)))
        .catch(err => {
            console.log(err)
            return res.send("Sorry, something went wrong. :troll:")
        })
    });

    robot.hear(/where/i, (res) => {
        res.send(formatSlackMessage("Default places", DEFAULT_PLACES));
    })

    /**
     * 
     * @param {any} robot Hubot
     * @param {Function} endpointCreator An endpoint creation function
     */
    function loadAllPages(robot, endpointCreator) {
        return loadResultPromise(robot, endpointCreator(1))
            .then(result => {
                // Loop through all pages and create promieses
                // Probably need to have a task to cache the results periodically and fetch from cache
                let promises = [];
                // Don't waste the result from first call!
                let pageOnePromise = new Promise((resolve, reject) => resolve(result));
                promises.push(pageOnePromise);
                for (var i = result.page + 1; i <= result.total_pages; i++) {
                    promises.push(loadResultPromise(robot, endpointCreator(i)));
                }
                return Promise.all(promises);
            })
            .then(allResults => {
                let mergedResults = [];
                allResults.forEach(elem => {
                    mergedResults = mergedResults.concat(elem.results);
                })
                let finalResult = _.shuffle(mergedResults)
                .slice(0, 3)
                .map(result => result.name + " " + result.shortenUrl)
                return finalResult;
            })
    }

    /**
     * 
     * @param {array} results search results
     */
    function formatSlackMessage(preText, results) {
        let formatted = {
            "attachments": [
                {
                    "pretext": preText,
                    "text": results.join("\n")
                }
            ]
        }
        return formatted;
    }

    /**
     * 
     * @param {any} robot Hubot
     * @param {string} endpoint Endpoint string
     */
    function loadResultPromise(robot, endpoint) {
        console.log("url=" + endpoint);
        return new Promise((resolve, reject) => 
            robot.http(endpoint)
            .header('Content-Type', 'application/json')
            .get()((err, response, body) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(body);
                }
            })
        )
        .then(body => JSON.parse(body))
        .then(data => {
            let result = data.searchResult;
            return { 
                "results": result.paginationResult.results,
                "total_pages": data.totalPage,
                "page": data.page
            }
        })
    }
}