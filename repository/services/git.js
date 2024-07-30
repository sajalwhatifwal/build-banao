const request = require('request');
const constants = require('../../utility/constants');
function listBranches(pageNumber) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `https://api.github.com/repos/${constants.githubOrg}/${constants.githubRepo}/branches?per_page=99&page=${pageNumber}`,
            method: 'GET',
            headers: {
                ['Accept']: 'application/vnd.github.v3+json',
                ['Authorization']: constants.githubToken,
                ['User-Agent']: 'PostmanRuntime/7.26.10'
            }
        };
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            if (response.statusCode !== 200){
                return reject(`Git Service responded with status code ${response.statusCode}.`);
            }
            return resolve(body);
        });
    });
}

function dispatchWorkflow(ref, channel, build_type, codepush, common_channel) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `https://api.github.com/repos/${constants.githubOrg}/${constants.githubRepo}/actions/workflows/slack_build_generation.yml/dispatches`,
            method: 'POST',
            headers: {
                ['Accept']: 'application/vnd.github.v3+json',
                ['Authorization']: constants.githubToken,
                ['User-Agent']: 'PostmanRuntime/7.26.10'
            },
            json: {
                ref,
                inputs: {
                    token: constants.slackBotToken,
                    channel,
                    build_type,
                    codepush,
                    common_channel
                }
            }
        };
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            return resolve( {body, code: response.statusCode} );
        });
    });
}

function getTaskStatus(taskId) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `https://api.github.com/repos/${constants.githubOrg}/${constants.githubRepo}/actions/runs/${taskId}/jobs`,
            method: 'GET',
            headers: {
                ['Accept']: 'application/vnd.github.v3+json',
                ['Authorization']: constants.githubToken,
                ['User-Agent']: 'PostmanRuntime/7.26.10'
            },
            json: true
        };
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            return resolve(body);
        });
    });
}

function getLatestCommitInBranch(branchName) {
    return new Promise((resolve, reject) => {
        const options = {
            url: `https://api.github.com/repos/${constants.githubOrg}/${constants.githubRepo}/commits/${branchName}`,
            method: 'GET',
            headers: {
                ['Accept']: 'application/vnd.github.v3+json',
                ['Authorization']: constants.githubToken,
                ['User-Agent']: 'PostmanRuntime/7.26.10'
            },
            json: true
        };
        request(options, (err, response, body) => {
            if (err) {
                return reject(err);
            }
            return resolve(body);
        });
    });
}
module.exports = {
    listBranches, dispatchWorkflow, getTaskStatus, getLatestCommitInBranch
}