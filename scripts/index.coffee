PARAM_DISTRICT_ID = "3018"
PARAM_LANDMARK_ID = "67"
ENDPOINT = "https://www.openrice.com/api/pois?uiLang=zh&uiCity=hongkong&districtId={0}&landmarkId={1}&page={2}" 

module.exports = (robot) ->
    robot.hear /badger/i, (res) ->
        return new Promise(resolve, reject) -> 
            robot.http(ENDPOINT.format(PARAM_DISTRICT_ID, PARAM_LANDMARK_ID, 1))
                .header('Content-Type', 'application/json')
                .get() (err, response, body) -> 
                    err ? reject(err) : resolve(body)
                .then (body) ->
                    return res.send JSON.stringify(body)
                .catch (err) ->
                    return res.send "Sorry, something went wrong. :facepalm:"
