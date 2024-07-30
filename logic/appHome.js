const axios = require('axios');
const momentTz = require('moment-timezone');
const qs = require('qs');
const git = require('../repository/services/git.js');
const teamcity = require('../repository/services/teamcity');
const _ = require('lodash');
const apiUrl = 'https://slack.com/api';
const redis = require('../repository/data/redis.js');
const metricsLogic = require('./metricsLogic.js');
const constants = require('../utility/constants');

const displayHome = async(user, channelId) => {
  try {
    const metrics = await metricsLogic.getMetricsMeta();
    let timeInMinutes = metrics.computeTimeSaved;
    let timeInHours = _.floor(timeInMinutes / 60);
    timeInMinutes = timeInMinutes % 60;
    let timeInDays = _.floor(timeInHours / 24);
    timeInHours = timeInHours % 24;
    const computeTimeString = `_~ ${timeInDays ? timeInDays === 1 ? timeInDays + ' day' : timeInDays + ' days' : ''}, ${timeInHours ? timeInHours === 1 ? timeInHours + ' hr' : timeInHours + ' hrs' : ''}, ${timeInMinutes ? timeInMinutes === 1 ? timeInMinutes + ' min' : timeInMinutes + ' mins' : ''}_`;
    const homeMeta = {
      "type": "home",
      "blocks": [
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Build your builds! :android-bot: ",
            "emoji": true
          }
        },
        {
          "type": "divider"
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `:wave::skin-tone-3:  Welcome to Build Banao! \nThis app will help you to build apks for *${constants.githubRepo}* repository, right from slack. And yes from :iphone: *MOBILE* too :cool-doge:\nWe use the Git/Teamcity workflow to generate a build OR the Build cache to retrieve a build. `
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "style": "danger",
              "text": {
                "type": "plain_text",
                "text": "Generate Build",
                "emoji": true
              },
              "value": channelId,
              "action_id": "generateBuild"
            }
          ]
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "style": "primary",
              "text": {
                "type": "plain_text",
                "text": "Know Build status",
                "emoji": true
              },
              "value": "knowBuild",
              "action_id": "knowBuild"
            }
          ]
        },
        {
          "type": "divider"
        },
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Metrics :chart_with_upwards_trend:",
            "emoji": true
          }
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "• :computer: *Compute time saved for the org*  "
            },
            {
              "type": "mrkdwn",
              "text": computeTimeString
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "• :hammer: *Build requested _(Today/Overall)_* "
            },
            {
              "type": "mrkdwn",
              "text": `_${metrics.buildsRequested.today}/${metrics.buildsRequested.overall}_`
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "• :truck: *Builds delivered _(Today/Overall)_*"
            },
            {
              "type": "mrkdwn",
              "text": `_${metrics.buildsDelivered.today}/${metrics.buildsDelivered.overall}_`
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "• :bust_in_silhouette: *Unique users on the app so far* "
            },
            {
              "type": "mrkdwn",
              "text": `_${metrics.distinctUsers}_`
            }
          ]
        },
        {
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "• :zap: *Efficiency so far*"
            },
            {
              "type": "mrkdwn",
              "text": `_${_.toInteger((metrics.buildsDelivered.overall * 100)/metrics.buildsRequested.overall)}%_`
            }
          ]
        },
        {
          "type": "divider"
        },
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "How to generate a build :thinking_face:",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "• Click on the *Generate Build* button present above and select all the required parameters to let us provide you the build. For every *Generate Build* process, we either provide you with a `taskId` (prior to sending the generated build) corresponding to your scheduled task OR the exact `build matching your requirements` from the build cache directly."
          }
        },
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "Build naming conventions :placard:",
            "emoji": true
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "• When it comes to naming our builds, we follow the basic `Branch name`-`Build type`-`RN Codepush state`-`App version` convention on every build, where `Branch name`, `RN Codepush state` and `App version` are self-explanatory. However `build type` has always been in talks; please consider the relation below to understand it better -\n> *Debug Apk* (Production) - `debug`\n> *Debug Apk* (staging) - `staging`\n> *Release Apk* - `release`\nWe hope this helps!"
          }
        },
        {
          "type": "header",
          "text": {
            "type": "plain_text",
            "text": "For more information about the idea and resources, please head to the 'About' section of the App.\nThank you! :mad_parrot:",
            "emoji": true
          }
        }
      ]
    };
    const prevArgs = {
      token: constants.slackBotToken,
      user_id: user,
      view: JSON.stringify(homeMeta)
    };
    axios.post(`${apiUrl}/views.publish`, qs.stringify(prevArgs));
  }
  catch(err) {
    console.log(err);
  }
  return;
};



/* Open a modal */

const openModal = async(trigger_id, channelId) => {
  const branches = await redis.getKey('buildBanaoBranches');
  const meta = JSON.parse(branches).branchList;
  let viewMeta = _.cloneDeep(constants.modalObj);
  _.set(viewMeta, 'blocks[0].element.options', meta[0]);
  _.set(viewMeta, 'blocks[0].label.text', "Select your branch (Page 1)");
  _.set(viewMeta, 'blocks[1].element.options[0].value', `d_${channelId}`);
  _.set(viewMeta, 'blocks[1].element.options[1].value', `s_${channelId}`);
  _.set(viewMeta, 'blocks[1].element.options[2].value', `p_${channelId}`);
  const initial_option = _.get(viewMeta, 'blocks[1].element.options[0]', null);
  _.set(viewMeta, 'blocks[1].element.initial_option', initial_option);
  if(!_.isNil(meta[1])) {
    let nextSetMeta = _.cloneDeep(constants.nextSetObjects);
    _.set(nextSetMeta, '[0].elements[0].value', `1_${channelId}`);
    viewMeta.blocks.splice(1, 0, ...nextSetMeta);
  }
  const args = {
    token: constants.slackBotToken,
    trigger_id,
    view: JSON.stringify(viewMeta)
  };
  try {
    axios.post(`${apiUrl}/views.open`, qs.stringify(args));
  }
  catch(err) {
    console.log(err);
  }
  return;
};

const updateModal = async(view_id, hash, linkParam) => {
  let [ branchIndex, channelId ] = _.split(linkParam, '_');
  branchIndex = _.toInteger(branchIndex);
  console.log(branchIndex);
  const branches = await redis.getKey('buildBanaoBranches');
  const meta = JSON.parse(branches).branchList;
  console.log(meta);
  console.log(meta[branchIndex], '\n\n\n\n');
  let updateMeta = _.cloneDeep(constants.modalObj);
  _.set(updateMeta, 'blocks[0].element.options', meta[branchIndex]);
  _.set(updateMeta, 'blocks[0].label.text', `Select your branch (Page ${++branchIndex})`);
  _.set(updateMeta, 'blocks[1].element.options[0].value', `d_${channelId}`);
  _.set(updateMeta, 'blocks[1].element.options[1].value', `s_${channelId}`);
  _.set(updateMeta, 'blocks[1].element.options[2].value', `p_${channelId}`);
  const initial_option = _.get(updateMeta, 'blocks[1].element.options[0]', null);
  _.set(updateMeta, 'blocks[1].element.initial_option', initial_option);
  if(!_.isNil(meta[branchIndex])) {
    let nextSetMeta = _.cloneDeep(constants.nextSetObjects);
    _.set(nextSetMeta, '[0].elements[0].value', `${branchIndex}_${channelId}`);
    updateMeta.blocks.splice(1, 0, ...nextSetMeta);
  }
  console.dir(updateMeta, {depth: null});
  const args = {
    token: constants.slackBotToken,
    view_id,
    hash,
    view: JSON.stringify(updateMeta)
  };
  try {
    axios.post(`${apiUrl}/views.update`, qs.stringify(args));
  }
  catch(err) {
    console.log(err);
  }
  return;
};

const knowBuildModal = async(trigger_id) => {
  const args = {
    token: constants.slackBotToken,
    trigger_id,
    view: JSON.stringify(constants.knowBuildMeta)
  };
  try {
    axios.post(`${apiUrl}/views.open`, qs.stringify(args));
  }
  catch(err) {
    console.log(err);
  }
  return;
}

const githubTaskStatus = async (trigger_id, taskId) => {
  const taskMeta = await git.getTaskStatus(taskId);
  if(taskMeta.message === 'Not Found') {
    generateErrorStatusModal(trigger_id, taskId);
  }
  else {
    let statusMeta = _.cloneDeep(constants.statusModal);
    const concernedJob = taskMeta.jobs[0];
    const concernedJobSteps = concernedJob.steps;
    let steps = [], textString, minutesDiff, startTime, endTime, finalState;
    for(let step of concernedJobSteps) {
      if(!step.conclusion) {
        startTime = momentTz().tz("Asia/Kolkata");
        endTime = momentTz().tz("Asia/Kolkata");
        finalState = step.status;
        if(step.status === 'in_progress') {
          startTime = momentTz(step.started_at).tz("Asia/Kolkata");
        }
      }
      else {
        startTime = momentTz(step.started_at).tz("Asia/Kolkata");
        endTime = momentTz(step.completed_at).tz("Asia/Kolkata");
        finalState = step.conclusion;
      }
      minutesDiff = endTime.diff(startTime, 'seconds');
      minutesDiff = minutesDiff > 60 ? `${_.toInteger(minutesDiff / 60)} minutes`: `${minutesDiff} seconds`;
      if(_.split(minutesDiff, ' ')[0] == 1) {
        minutesDiff = minutesDiff.slice(0, -1);
      }
      textString = `${constants.statusMap[finalState].emoji}  *${step.name}* (${minutesDiff})`;
      if(finalState === 'skipped') {
        textString = `${constants.statusMap[finalState].emoji}  ~${step.name}~`;
      }
      if(finalState === 'queued') {
        textString = `${constants.statusMap[finalState].emoji}  ${step.name}`
      }
      if(finalState === 'in_progress') {
        textString = `${constants.statusMap[finalState].emoji}  _${step.name}_ ~${minutesDiff}`
      }
      steps.push({
        type: 'context',
        elements: [
          {
            type: "mrkdwn",
            text: textString
          }
        ]
      });
    }
    const jobStartTime = concernedJob.started_at;
    const jobStatus = concernedJob.conclusion || concernedJob.status;
    const jobString = "*TaskId* - `" + `${taskId}` + "` • " + `*${constants.statusMap[jobStatus].text}* ${constants.statusMap[jobStatus].emoji} • *Started on* ${momentTz(_.split(jobStartTime, '.')[0]).tz("Asia/Kolkata").format("MMM DD hh:mm A")} `;
    _.set(statusMeta, 'blocks[4].elements[0].text', jobString);
    _.set(statusMeta, 'title.text', `${constants.statusMap[jobStatus].text} ${constants.statusMap[jobStatus].emoji}`);
    statusMeta.blocks.push(...steps);
    let buttonLinkMeta = _.cloneDeep(constants.buttonLinkModal);
    _.set(buttonLinkMeta, 'accessory.text.text', taskId);
    _.set(buttonLinkMeta, 'accessory.url', concernedJob.html_url);
    statusMeta.blocks.push(buttonLinkMeta);
    const args = {
      token: constants.slackBotToken,
      trigger_id,
      view: JSON.stringify(statusMeta)
    };
    try {
      axios.post(`${apiUrl}/views.open`, qs.stringify(args));
    }
    catch(err) {
      console.log(err);
    }
  }
  return;
}

const teamcityTaskStatus = async (trigger_id, taskId) => {
  let taskMeta = await teamcity.getTaskStatus(taskId);
  if(taskMeta.code !== 200) {
    generateErrorStatusModal(trigger_id, taskId);
  }
  else {
    taskMeta = taskMeta.body;
    let percentageCompleted = -1, elapsedTime = -1, estimatedTime = -1, headerStatus;
    let { status, state, revisions, buildType, branchName, statusText, comment, startDate, finishDate, properties } = taskMeta;
    startDate = momentTz(startDate).tz("Asia/Kolkata");
    const runningInfo = taskMeta['running-info'] || {};
    if(status === 'SUCCESS' && state === 'finished') {
      headerStatus = 'success';
      percentageCompleted = 100;
      finishDate = momentTz(finishDate).tz("Asia/Kolkata");
      elapsedTime = finishDate.diff(startDate, 'seconds');
      estimatedTime = elapsedTime;
      currentStatus = 'Done and dusted!\nYour build will reach you; if not has already!'
    }
    else if(status === 'UNKNOWN' || status === 'FAILURE') {
      headerStatus = 'failure';
      percentageCompleted = -1;
      elapsedTime = -1;
      estimatedTime = -1;
      currentStatus = statusText;
    }
    else if (status === 'SUCCESS' && state === 'running') {
      headerStatus = 'in_progress';
      percentageCompleted = _.get(runningInfo, 'percentageComplete', -1);
      if(percentageCompleted === 100) {
        percentageCompleted = 99;
      }
      elapsedTime = _.get(runningInfo, 'elapsedSeconds', -1);
      givenEstimatedTime = _.get(runningInfo, 'estimatedTotalSeconds', -1);
      estimatedTime = givenEstimatedTime < elapsedTime ? _.toInteger(elapsedTime * 100 / percentageCompleted) : givenEstimatedTime;
      currentStatus = _.get(runningInfo, 'currentStageText', 'Running!');
    }
    let min, sec;
    if(estimatedTime !== -1) {
      min = _.toInteger(estimatedTime / 60);
      sec = _.toInteger(estimatedTime % 60);
      estimatedTime = estimatedTime > 60 ? `${min} ${min === 1 ? 'minute' : 'minutes'} ${sec} seconds`: `${estimatedTime} seconds`;
      if(_.split(estimatedTime, ' ')[0] == 1) {
        estimatedTime = estimatedTime.slice(0, -1);
      }
    }
    if(elapsedTime !== -1) {
      min = _.toInteger(elapsedTime / 60);
      sec = _.toInteger(elapsedTime % 60);
      elapsedTime = elapsedTime > 60 ? `${min} ${min === 1 ? 'minute' : 'minutes'} ${sec} seconds`: `${elapsedTime} seconds`;
      if(_.split(elapsedTime, ' ')[0] == 1) {
        elapsedTime = elapsedTime.slice(0, -1);
      }
    }
    let buildCodeObj = _.find(properties.property, (obj) => {
      return obj.name === 'env.BUILD_CODE';
    }) || {};
    const proposedBranchName = _.replace(branchName, 'refs/heads/', '');
    let teamcityStatusMeta = _.cloneDeep(constants.teamcityStatusModal);
    _.set(teamcityStatusMeta, 'title.text', `${constants.statusMap[headerStatus].text} ${constants.statusMap[headerStatus].emoji}`);
    let taskString = '';
    _.forEachRight(_.toArray(taskId), (value) => {
      taskString = `${constants.numberEmoji[value]}` + taskString;
    });
    _.set(teamcityStatusMeta, 'blocks[0].text.text', `Task Id - ${taskString}`);
    const buildTypeMeta = constants.buildTypes[buildType.id];
    let statusString = `*Branch* - <https://github.com/${constants.githubOrg}/${constants.githubRepo}/tree/${proposedBranchName}|` + proposedBranchName + '>\n*Build type* - `' + buildTypeMeta.type + '` *Codepush* - `' + buildTypeMeta.codepush + '`\n*CommitId* - `' + revisions.revision[0].version + '`\n*Triggered by* <@' + _.split(comment.text, ' - ')[1] +'> *on* ' + momentTz(startDate).tz("Asia/Kolkata").format("MMM DD hh:mm A");
    if(_.toInteger(buildCodeObj.value) > 0) {
      statusString = `*Branch* - <https://github.com/${constants.githubOrg}/${constants.githubRepo}/tree/${proposedBranchName}|` + proposedBranchName + '>\n*Build type* - `' + buildTypeMeta.type + '` *Codepush* - `' + buildTypeMeta.codepush + '`\n*Custom App version* - `' + _.toInteger(buildCodeObj.value) + '`\n*CommitId* - `' + revisions.revision[0].version + '`\n*Triggered by* <@' + _.split(comment.text, ' - ')[1] +'> *on* ' + momentTz(startDate).tz("Asia/Kolkata").format("MMM DD hh:mm A");
    }
    _.set(teamcityStatusMeta, 'blocks[1].elements[0].text', statusString);
    if(elapsedTime !== -1) {
      teamcityStatusMeta.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '*Elapsed time* :stopwatch: - `' + elapsedTime + '`'
          }
        ]
      });
    }
    if(estimatedTime !== -1) {
      teamcityStatusMeta.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '*Estimated time* :stopwatch: - `' + estimatedTime + '`'
          }
        ]
      });
    }
    if(percentageCompleted !== -1) {
      let percentString = '', c;
      const percentMultiplier = _.floor(percentageCompleted/4);
      const nonPercentageMultiplier = 25 - percentMultiplier;
      for(c = 1 ; c <= percentMultiplier ; c ++) {
        percentString += ':large_green_square:';
      }
      for(c = 1 ; c <= nonPercentageMultiplier ; c ++) {
        percentString += ':white_square:';
      }
      percentString += ` ${percentageCompleted}%`;
      teamcityStatusMeta.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '*Percentage completed*  :percent: -'
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: percentString
          }
        ]
      });
    }
    teamcityStatusMeta.blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '*Current status* :thinking_face: -'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '```' + currentStatus + '```'
        }
      ]
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Click this button for a detailed summary* :arrow_right:'
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: taskId
        },
        value: 'teamcityStatus',
        url: `http://172.16.0.117:8111/buildConfiguration/${buildType.id}/${taskId}`,
        action_id: 'teamcityStatus'
      }
    });
    const args = {
      token: constants.slackBotToken,
      trigger_id,
      view: JSON.stringify(teamcityStatusMeta)
    };
    try {
      axios.post(`${apiUrl}/views.open`, qs.stringify(args));
    }
    catch(err) {
      console.log(err);
    }
  }
  return;
}

const sendMessage = async(channelId, text) => {
  const msgArgs = {
    token: constants.slackBotToken,
    channel: channelId,
    text
  };
  try {
    axios.post(`${apiUrl}/chat.postMessage`, qs.stringify(msgArgs));
  }
  catch(err) {
    console.log(err);
  }
  return;
}

const enterBuild = async(options) => {
  const { messageText, messageTs, channelId } = options;
  const words = _.split(messageText, ' ');
  const firstWord = words[0];
  if(_.includes(['Reference', 'Cached'], firstWord)) {
    if(firstWord === 'Reference') {
      metricsLogic.handleBuildsFlow('buildsDelivered', 1, true);
    }
    const hashKey = _.split(_.last(words), '*')[1];
    const msgArgs = {
      token: constants.slackBotToken
    };
    try {
      axios.post(`${apiUrl}/chat.getPermalink?channel=${channelId}&message_ts=${messageTs}`, qs.stringify(msgArgs)).then((permalinkMeta) => {
        const messageLink = permalinkMeta.data.permalink;
        redis.setHashKey('buildBanaoApkRepository', hashKey, messageLink);
      });
    }
    catch(err) {
      console.log(err);
    }
  }
  return;
}

const generateErrorStatusModal = async(trigger_id, taskId) => {
  let errorModal = {
    "type": "modal",
    "title": {
      "type": "plain_text",
      "text": "Uh Oh!",
      "emoji": true
    },
    "close": {
      "type": "plain_text",
      "text": "Close",
      "emoji": true
    },
    "blocks": [
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": "Sadly, no task with *TaskId* - `" + `${taskId}` + "` exists!"
          }
        ]
      },
      {
        "type": "image",
        "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUK2Rlg80FB-d9IqnxIPRI2bBN7RRRkw5OpQ&s",
        "alt_text": "Disappointed!"
      }
    ]
  };
  const args = {
    token: constants.slackBotToken,
    trigger_id,
    view: JSON.stringify(errorModal)
  };
  try {
    axios.post(`${apiUrl}/views.open`, qs.stringify(args));
  }
  catch(err) {
    console.log(err);
  }
  return;
}



module.exports = { displayHome, openModal, updateModal, sendMessage, knowBuildModal, githubTaskStatus, enterBuild, teamcityTaskStatus };