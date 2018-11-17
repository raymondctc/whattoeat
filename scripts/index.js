let test = require("./util.js");
var _ = require('lodash');

const PARAM_DISTRICT_ID = "3018"
const PARAM_LANDMARK_ID = "67"
//https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&page=2&&sortBy=Default&where=%E6%9F%B4%E7%81%A3%E8%A7%92
const ENDPOINT = "https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&districtId={0}&landmarkId={1}&page={2}" 

module.exports = (robot) => {
    robot.hear(/lunch/i, (res) => {
        let endpoint = ENDPOINT.format(PARAM_DISTRICT_ID, PARAM_LANDMARK_ID, 1);
        loadResultPromise(robot, endpoint)
        .then(result => {
            // Loop through all pages and create promieses
            // Probably need to have a task to cache the results periodically and fetch from cache
            let promises = [];
            // Don't waste the result from first call!
            let pageOnePromise = new Promise((resolve, reject) => resolve(result));
            promises.push(pageOnePromise);
            for (var i = result.page; i < result.total_pages; i++) {
                promises.push(loadResultPromise(robot, ENDPOINT.format(PARAM_DISTRICT_ID, PARAM_LANDMARK_ID, i)));
            }
            return Promise.all(promises)
        })
        .then(allResults => {
            let mergedResults = [];
            allResults.forEach(elem => {
                mergedResults = mergedResults.concat(elem.results);
            })
            let finalResult = _.shuffle(mergedResults).slice(0, 3).map(result => result.nameUI)
            
            return res.send({text: finalResult.join(",")});
        })
        .catch(err => {
            console.log(err)
            return res.send("Sorry, something went wrong. :troll:")
        })
    })

    function loadResultPromise(robot, endpoint) {
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
            let reuslt = data.searchResult;
            return { 
                "results": reuslt.paginationResult.results,
                "total_pages": data.totalPage,
                "page": data.page
            }
        })
    }
}