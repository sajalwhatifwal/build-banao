const git = require('../repository/services/git');
const redis = require('../repository/data/redis');
async function runner() {
    let branchList = [];
    return new Promise(async (resolve, reject) => {
        const fetchList = async (pageNumber) => {
            return new Promise(async (resolve, reject) => {
                const branches = await git.listBranches(pageNumber);
                return resolve(branches);
            });
        }
        const result = await Promise.all([fetchList(1), fetchList(2), fetchList(3), fetchList(4), fetchList(5), fetchList(6), fetchList(7), fetchList(8), fetchList(9), fetchList(10)]);
        for(let res of result) {
            let branchSublist = [], mainFlag = true;
            const branchSet = JSON.parse(res);
            for(let branchObj of branchSet) {
                branchSublist.push({
                    "text": {
                      "type": "plain_text",
                      "text": branchObj.name,
                      "emoji": true
                    },
                    "value": branchObj.name
                });
                if(branchObj.name === 'main') {
                    mainFlag = false;
                }
            }
            if(branchSet.length > 0) {
                if(mainFlag) {
                    branchSublist.push({
                        "text": {
                            "type": "plain_text",
                            "text": 'main',
                            "emoji": true
                        },
                        "value": 'main'
                    });
                }
                branchList.push(branchSublist);
            }
        }
        redis.setKey('buildBanaoBranches', JSON.stringify({ branchList }));
        return resolve();
    });
}

module.exports = runner;
