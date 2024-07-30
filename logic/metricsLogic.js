const redis = require('../repository/data/redis');
const momentTz = require('moment-timezone');
const _ = require('lodash');

function handleDistinctUsersSet(value) {
    return new Promise(async (resolve, reject) => {
        await redis.addToSet('buildBanao_DistinctUsers', value).then((val) => {
            if(val !== 0) {
                handleBuildsFlow('distinctUsers', 1, false);
            }
        });
        return resolve();
    });
}

function handleBuildsFlow(key, incr, isDayTrue) {
    return new Promise(async (resolve, reject) => {
        await redis.hashKeyIncr(`buildBanaoOverallMetrics`, `${key}`, incr);
        if(isDayTrue) {
            const today = _.split(momentTz().tz('Asia/Kolkata').format(), 'T')[0];
            const tommorrowStartUnix = momentTz().tz('Asia/Kolkata').add(1, 'days').startOf('day').unix();
            await redis.hashKeyIncr(`buildBanao_${today}_Metrics`, `${key}`, 1).then(() => {
                redis.expireAtKey(`buildBanao_${today}_Metrics`, tommorrowStartUnix);
            });
        }
        return resolve();
    });
}

function getMetricsMeta() {
    let metricJson = {};
    return new Promise(async (resolve, reject) => {
        try {
            const today = _.split(momentTz().tz('Asia/Kolkata').format(), 'T')[0];
            const tasks = [ redis.getWholeHash(`buildBanaoOverallMetrics`), redis.getWholeHash(`buildBanao_${today}_Metrics`) ];
            let metrics = await Promise.all(tasks);
            metricJson = {
                buildsRequested: {
                    overall: _.get(metrics, '[0].buildsRequested', 0),
                    today: _.get(metrics, '[1].buildsRequested', 0)
                },
                buildsDelivered: {
                    overall: _.get(metrics, '[0].buildsDelivered', 0),
                    today: _.get(metrics, '[1].buildsDelivered', 0)
                },
                distinctUsers: _.get(metrics, '[0].distinctUsers', 0),
                computeTimeSaved: _.get(metrics, '[0].computeTimeSaved', 0)
            };
            return resolve(metricJson)
        }
        catch(err) {
            return reject(err);
        }
    });
}

module.exports = {
    handleBuildsFlow, handleDistinctUsersSet, getMetricsMeta
}