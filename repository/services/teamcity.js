const request = require('request');
const _ = require('lodash');
const constants = require('../../utility/constants');

const projectMap = {
    dy: 'ReactDebugCodePushEnabledBuild',
    dn: 'ReactDebugCodePushDisabledBuild',
    sy: 'ReactStagingCodePushEnabledBuild',
    sn: 'ReactStagingCodePushDisabledBuild',
    py: 'ReleaseUniversalApkBuild',
    pn: 'ReleaseUniversalApkBuild'
}
function dispatchWorkflow(ref, channel, build_type, codepush, userName, appV) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'POST',
            url: `${constants.teamCityHost}/app/rest/buildQueue`,
            headers: {
                'Authorization': constants.teamcityToken,
                'Content-Type': 'application/json',
            },
            json: {
                branchName: `refs/heads/${ref}`,
                buildType: {
                    id: projectMap[`${build_type}${codepush}`]
                },
                comment: {
                    text: `Triggered by slack username - ${userName}`
                }
            }
        };
        if(appV > 0) {
            _.set(options, 'json.properties', {
                property: [
                    {
                        name: 'env.BUILD_CODE',
                        value: appV
                    }
                ]
            });
        }
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            return resolve({ body, code: response.statusCode });
        });
    });
}

function getTaskStatus(taskId) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            url: `${constants.teamCityHost}/app/rest/builds/id:${taskId}`,
            headers: {
                'Authorization': constants.teamcityToken
            },
            json: true
        };
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            return resolve({ body, code: response.statusCode });
        });
    });
}

module.exports = {
    dispatchWorkflow, getTaskStatus
}
