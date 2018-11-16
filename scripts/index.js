const PARAM_DISTRICT_ID = "3018"
const PARAM_LANDMARK_ID = "67"
//https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&page=2&&sortBy=Default&where=%E6%9F%B4%E7%81%A3%E8%A7%92
const ENDPOINT = "https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&districtId={0}&landmarkId={1}&page={2}" 


module.exports = (robot) => {
    robot.hear(/lunch/i, (res) => {
        new Promise((resolve, reject) => 
            robot.http(ENDPOINT.format(PARAM_DISTRICT_ID, PARAM_LANDMARK_ID, 1))
            .header('Content-Type', 'application/json')
            .get()((err, response, body) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(body);
                }
            })
        )
        .then(body => robot.reply(JSON.parse(body)))
        .then(json => {
            robot.reply(json);
            console.log(json);
            return { 
                "results": json.searchResult.paginationResult.results, 
                "total_pages": json.searchResult.totalPage,
                "page": json.searchResult.page
            }
        })
        .then(result => robot.send(result))
        .catch(err => {
            console.log(err)
            return robot.send("Sorry, something went wrong. :troll:")
        })
    })
}