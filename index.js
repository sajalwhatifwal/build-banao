
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const git = require('./repository/services/git');
const redis = require('./repository/data/redis');
const metricsLogic = require('./logic/metricsLogic');
const buildProvider = require('./logic/buildProvider');
const images = [
  "https://programmerhumor.io/wp-content/uploads/2024/06/programmerhumor-io-java-memes-programming-memes-c929e24934ba87c.jpg",
  "https://programmerhumor.io/wp-content/uploads/2024/05/programmerhumor-io-java-memes-programming-memes-4c0a7b927ea48da.jpg"
]
const signature = require('./utility/verifySignature');
const appHome = require('./logic/appHome');
const runner = require('./logic/gitBranchList');

const app = express();

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf && buf.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};

app.use(bodyParser.urlencoded({verify: rawBodyBuffer, extended: true }));
app.use(bodyParser.json({ verify: rawBodyBuffer }));

app.post('/slack/events', async(req, res) => {
  switch (req.body.type) {
    
    case 'url_verification': {
      res.send({ challenge: req.body.challenge });
      break;
    }
    
    case 'event_callback': {
      if (!signature.isVerified(req)) {
        res.sendStatus(404);
        return;
      }
      
      const {type, user} = req.body.event;
      if(type === 'app_home_opened') {
        runner();
        if(req.body.event.tab === 'home') {
          appHome.displayHome(user, req.body.event.channel);
        }
      }
      if(type === 'message') {
        const meta = req.body.event;
        const messageText = meta.text;
        const messageTs = meta.ts;
        const channelId = meta.channel;
        appHome.enterBuild({ messageText, messageTs, channelId });
      }
      res.sendStatus(200);
      break;
    }
    default: {
      res.sendStatus(404);
    }
  }
  return;
});

app.post('/slack/actions', async(req, res) => {
  if (!signature.isVerified(req)) {
    return res.sendStatus(404);
  }
  const reqPayload = JSON.parse(req.body.payload);
  if(reqPayload.type === 'block_actions') {
    res.sendStatus(200);
    const lll = JSON.parse(req.body.payload);
    if(lll.actions[0].action_id === 'generateBuild') {
      appHome.openModal(lll.trigger_id, lll.actions[0].value);
      metricsLogic.handleDistinctUsersSet(lll.user.id);
    }
    if(lll.actions[0].action_id === 'nextSet') {
      appHome.updateModal(lll.view.id, lll.view.hash, lll.actions[0].value);
    }
    if(lll.actions[0].action_id === 'knowBuild') {
      appHome.knowBuildModal(lll.trigger_id);
      metricsLogic.handleDistinctUsersSet(lll.user.id);
    }
  }
  else if (reqPayload.type === 'view_submission') {
    let bn, bt, cp, channel, taskId, appV;
    try {
      if(reqPayload.view.title.text === 'Generate Build') {
        let rando = Math.floor(Math.random() * 15);
        let resultModal = {
          "type": "modal",
          "title": {
            "type": "plain_text",
            "text": "Voila! :boom:",
            "emoji": true
          },
          "blocks": [
            {
              "type": "image",
              "image_url": images[rando],
              "alt_text": "Jaadu"
            },
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "Your request for build creation is *successfully submitted* :tada:"
              }
            },
            {
              "type": "section",
              "text":
                {
                  "type": "mrkdwn",
                  "text": "Your build will _reach_ you! Meanwhile, grab a :coffee: and :catjam:"
                }
            }
          ]
        };
        res.status(200).json({
          response_action: "update",
          view: resultModal
        });
        for(let actionKey in JSON.parse(req.body.payload).view.state.values) {
          let val = JSON.parse(req.body.payload).view.state.values[actionKey];
          if(_.has(val, 'branchName')) {
            bn = val.branchName.selected_option.value;
          }
          if(_.has(val, 'buildType')) {
            [bt, channel] = _.split(val.buildType.selected_option.value, '_');
          }
          if(_.has(val, 'codepush')) {
            cp = val.codepush.selected_option.value;
          }
          if(_.has(val, 'appVersion')) {
            appV = val.appVersion.value;
          }
        }
        git.getLatestCommitInBranch(bn).then((commit) => {
          const commitId = commit.sha;
          const finder = new RegExp('/', 'g');
          const alteredBn = _.replace(bn, finder, '-');
          if(bt === 'p' && cp === 'n') {
            cp = 'y';
          }
          let hashKey = `${alteredBn}${commitId}${bt}${cp}`;
          appV = _.toInteger(appV);
          if(appV > 0) {
            hashKey = `${hashKey}${appV}`;
          }
          redis.getHashKey('buildBanaoApkRepository', hashKey).then((messageLink) => {
            if(_.isNil(messageLink)) {
              const options = {
                bn, channel, bt, cp, commonChannelId: 'C021X168MMZ', userName: reqPayload.user.username, hashKey, appV
              }
              buildProvider.processDispatch(options);
            }
            else {
              metricsLogic.handleBuildsFlow('buildsRequested', 1, true);
              const messageLinkText = `Hey! :wave::skin-tone-3: Guess what, I found the exact same build that matches your requirements :mad_parrot:\n*Attaching the link to the same message here*. Hope it saved you some time! Have a nice day :pray::skin-tone-3:\n${messageLink}`;
              metricsLogic.handleBuildsFlow('buildsDelivered', 1, true);
              metricsLogic.handleBuildsFlow('computeTimeSaved', _.shuffle([20, 21, 22, 23, 24, 25])[0], false);
              appHome.sendMessage(channel, messageLinkText);
            }
          });
        });
        runner();
      }
      else {
        for(let actionKey in JSON.parse(req.body.payload).view.state.values) {
          let val = JSON.parse(req.body.payload).view.state.values[actionKey];
          if(_.has(val, 'taskId')) {
            taskId = val.taskId.value;
          }
        }
        if(taskId) {
          res.status(200).json({
            response_action: "clear"
          });
          buildProvider.generateTaskStatus({ tId: reqPayload.trigger_id, taskId });
        }
      }
    }
    catch(err) {
      console.log(err);
    }
  }
  return;
});



/* Running Express server */
const server = app.listen(5000, () => {
  console.log('Express web server is running on port %d in %s mode', server.address().port, app.settings.env);
});


app.get('/', async(req, res) => {
  res.send('There is no web UI for this code sample. To view the source code, click "View Source"');
});