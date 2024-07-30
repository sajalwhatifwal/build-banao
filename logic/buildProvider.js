const constants = require('../utility/constants');
const git = require('../repository/services/git');
const teamcity = require('../repository/services/teamcity');
const redis = require('../repository/data/redis');
const metricsLogic = require('./metricsLogic');
const appHome = require('./appHome');
const _ = require('lodash');

async function processDispatch(options) {
    const buildProvider = process.env.BUILD_PROVIDER === constants.buildProviders.GITHUB ? _githubDispatch : _teamcityDispatch;
    buildProvider(options);
}

async function generateTaskStatus(options) {
    const buildProvider = process.env.BUILD_PROVIDER === constants.buildProviders.GITHUB ? appHome.githubTaskStatus : appHome.teamcityTaskStatus;
    buildProvider(options.tId, options.taskId);
}

async function _githubDispatch(options) {
    const { bn, channel, bt, cp, commonChannelId, userName, hashKey} = options;
    git.dispatchWorkflow(bn, channel, bt, cp, commonChannelId).then((meta) => {
        if(_.get(meta, 'code', null) == 204) {
            metricsLogic.handleBuildsFlow('buildsRequested', 1, true);
        }
        else if(_.get(meta, 'body.message', null) === "Workflow does not have 'workflow_dispatch' trigger") {
            const workflowErrorText = ":sadblob: Uh Oh! It looks like your *branch* - `" + `${bn}` + "` does not have the expected yml file. Please take a *back-merge* from the `main` branch and push to remote. Thank you! :raised_hands::skin-tone-3:";
            appHome.sendMessage(channel, workflowErrorText);
        }
    });
}

async function _teamcityDispatch(options) {
    const { bn, channel, bt, cp, userName, hashKey, appV} = options;
    teamcity.dispatchWorkflow(bn, channel, bt, cp, userName, appV).then((meta) => {
        if(_.get(meta, 'code', null) == 200) {
            const taskId = _.get(meta, 'body.id', null);
            redis.addToSet('TeamCityBuildsInProcess', JSON.stringify({
                taskId, channel, timestamp: Date.now() + 3 * 60 * 1000
            }));
            appHome.sendMessage(channel, 'Your build for branch - *' + bn + '* has started. This is your taskId - `' + taskId +'`');
            metricsLogic.handleBuildsFlow('buildsRequested', 1, true);
        }
        else {
            const workflowErrorText = ":sadblob: Uh Oh! It looks like the build could not be processed. Please try again!\nThank you! :raised_hands::skin-tone-3";
            appHome.sendMessage(channel, workflowErrorText);
        }
    });
}

module.exports = {
    processDispatch, generateTaskStatus
}