const buildProviders = {
    GITHUB: 'GITHUB',
    TEAMCITY: 'TEAMCITY'
};

const numberEmoji = {
    0: ':zero:',
    1: ':one:',
    2: ':two:',
    3: ':three:',
    4: ':four:',
    5: ':five:',
    6: ':six:',
    7: ':seven:',
    8: ':eight:',
    9: ':nine:'
}

const buildTypes = {
    ReactDebugCodePushEnabledBuild: {
        type: 'Debug prod',
        codepush: 'Enabled'
    },
    ReactDebugCodePushDisabledBuild: {
        type: 'Debug prod',
        codepush: 'Disabled'
    },
    ReactStagingCodePushEnabledBuild: {
        type: 'Debug staging',
        codepush: 'Enabled'
    },
    ReactStagingCodePushDisabledBuild: {
        type: 'Debug staging',
        codepush: 'Disabled'
    },
    ReleaseBuild: {
        type: 'Release',
        codepush: 'Enabled'
    },
    ReleaseUniversalApkBuild: {
        type: 'Release',
        codepush: 'Enabled'
    }
};

const statusMap = {
    success: {
        emoji: ':approved:',
        text: 'Success'
    },
    skipped: {
        emoji: ':kangaroo:',
        text: 'Skipped'
    },
    failure: {
        emoji: ':bangbang:',
        text: 'Failed'
    },
    cancelled: {
        emoji: ':x:',
        text: 'Cancelled'
    },
    in_progress: {
        emoji: ':ip:',
        text: 'In progress'
    },
    queued: {
        emoji: ':q:',
        text: 'Queued'
    }
};

const buttonLinkModal = {
    type: "section",
    text: {
        type: "mrkdwn",
        text: "*Click this button for a detailed summary* :arrow_right:"
    },
    accessory: {
        type: "button",
        text: {
            type: "plain_text",
            emoji: true
        },
        value: "githubRunLink",
        action_id: "githubRunLink"
    }
};

const statusModal = {
    type: "modal",
    title: {
        type: "plain_text",
        emoji: true
    },
    blocks: [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*Please refer here for statuses* -"
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: ":approved: *Done* | :busts_in_silhouette: *Queued* | :hourglass_flowing_sand: *In progress* | :x: *Cancelled* | :kangaroo: *Skipped* | :bangbang: * Failed*"
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: "*Process Insight* -"
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn"
                }
            ]
        },
    ]
};

const teamcityStatusModal = {
    title: {
        type: "plain_text",
        emoji: true
    },
    type: "modal",
    blocks: [
        {
            type: "header",
            text: {
                type: "plain_text",
                emoji: true
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn"
                }
            ]
        },
        {
            type: "header",
            text: {
                type: "plain_text",
                text: "Build process metrics :bar_chart:",
                emoji: true
            }
        }
    ]
};

const nextSetObjects = [
    {
        type: "actions",
        elements: [
            {
                type: "button",
                style: "danger",
                text: {
                    type: "plain_text",
                    text: "Get next set of branches",
                    emoji: true
                },
                action_id: "nextSet"
            }
        ]
    },
    {
        type: "divider"
    }
];

const modalObj = {
    type: "modal",
    title: {
        type: "plain_text",
        text: "Generate Build",
        emoji: true
    },
    submit: {
        type: "plain_text",
        text: "Build Banao",
        emoji: true
    },
    close: {
        type: "plain_text",
        text: "Close",
        emoji: true
    },
    blocks: [
        {
            type: "input",
            element: {
                type: "static_select",
                placeholder: {
                    type: "plain_text",
                    text: "Select your branch",
                    emoji: true
                },
                initial_option: {
                    text: {
                        type: "plain_text",
                        text: "main",
                        emoji: true
                    },
                    value: "main"
                },
                action_id: "branchName"
            },
            label: {
                type: "plain_text",
                emoji: true
            }
        },
        {
            type: "input",
            element: {
                type: "radio_buttons",
                options: [
                    {
                        text: {
                            type: "mrkdwn",
                            text: "*Debug Apk* (Production)\n_(Leaks canary Enabled)_"
                        }
                    },
                    {
                        text: {
                            type: "mrkdwn",
                            text: "*Debug Apk* (Staging)\n_(Leaks canary Disabled)_"
                        }
                    },
                    {
                        text: {
                            type: "mrkdwn",
                            text: "*Release Apk*"
                        }
                    }
                ],
                action_id: "buildType"
            },
            label: {
                type: "plain_text",
                text: "Build Type",
                emoji: true
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: ":tada: Debug apks have *chuck* and *screenshot* enabled!"
                }
            ]
        },
        {
            type: "divider"
        },
        {
            type: "input",
            element: {
                type: "radio_buttons",
                initial_option: {
                    text: {
                        type: "plain_text",
                        text: "Enable",
                        emoji: true
                    },
                    value: "y"
                },
                options: [
                    {
                        text: {
                            type: "plain_text",
                            text: "Enable",
                            emoji: true
                        },
                        value: "y"
                    },
                    {
                        text: {
                            type: "plain_text",
                            text: "Disable",
                            emoji: true
                        },
                        value: "n"
                    }
                ],
                action_id: "codepush"
            },
            label: {
                type: "plain_text",
                text: "Codepush (Not applicable for Release apks)",
                emoji: true
            }
        },
        {
            type: "divider"
        },
        {
            type: "input",
            optional: true,
            element: {
                type: "plain_text_input",
                action_id: "appVersion",
                placeholder: {
                    type: "plain_text",
                    text: "Integer number greater than 0"
                }
            },
            label: {
                type: "plain_text",
                text: "Custom App version",
                emoji: true
            }
        },
        {
            type: "context",
            elements: [
                {
                    type: "mrkdwn",
                    text: ":warning: Please do not enter a custom app version unless mandatorily required for your use case. Thank you!"
                }
            ]
        }
    ]
};

const knowBuildMeta = {
    type: "modal",
    title: {
        type: "plain_text",
        text: "Build Status :wrench:",
        emoji: true
    },
    submit: {
        type: "plain_text",
        text: "Get Status",
        emoji: true
    },
    close: {
        type: "plain_text",
        text: "Cancel",
        emoji: true
    },
    blocks: [
        {
            type: "input",
            element: {
                type: "plain_text_input",
                action_id: "taskId"
            },
            label: {
                type: "plain_text",
                text: "Enter TaskId :memo:",
                emoji: true
            }
        }
    ]
};

const slackBotToken = process.env.SLACK_BOT_TOKEN;

const githubToken = process.env.GITHUB_TOKEN;

const teamcityToken = process.env.TEAMCITY_TOKEN;

const githubOrg = process.env.GIT_ORG;

const githubRepo = process.env.GIT_REPO;

const teamCityHost = process.env.TEAMCITY_HOST;

const redis = {
    host: process.env.REDIS_HOST,
    post: process.env.REDIS_POST,
    pasword: process.env.REDIS_PASS
}

module.exports = {
    buildProviders,
    numberEmoji,
    buildTypes,
    statusMap,
    buttonLinkModal,
    statusModal,
    teamcityStatusModal,
    nextSetObjects,
    modalObj,
    knowBuildMeta,
    slackBotToken,
    githubToken,
    teamcityToken,
    githubOrg,
    githubRepo,
    redis
}
