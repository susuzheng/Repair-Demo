const {ipcRenderer} = require('electron')
const {exec} = require('child_process')
let net = require('net')

let upload = document.getElementById('upload')

upload.addEventListener('click', e => {
    ipcRenderer.send('open-dialog')
})

ipcRenderer.on('set-filepath-success', (e, file) => {
    let item;
    if ((item = checkValidity(file)).validity) {
        // exec('cd ../SpuriousTuplesWebApp && bash runTestServer.sh', (err) => {
        //     if (err) {
        //         //some err occurred
        //         console.error(err)
        //     }
        // });
        ipcRenderer.send('open-drawing', item)
    } else {
        alert('Not valid separator file. Please select again.')
        upload.click()
    }
})

const checkValidity = (filePath) => {
    let re = /^(\d+?),{{(\w+?(,\s\w+)*)?}\|({\w+?(,\s\w+)*}(,{\w+?(,\s\w+)*})*)},([01](\.\d+)?)/
    let allSepList = []
    let sepCluster = []
    let sepJ = []
    let attrNum = 0;
    require('fs').readFileSync(filePath).toString().split('\n').forEach(line => {
        let temp, sep;
        // line = line.replace(/ /g, '')
        if ((temp = re.exec(line)) === null) {
            return {validity: false};
        }

        attrNum = temp[1]
        sep = typeof temp[2] === 'undefined' ? '' : temp[2]
        allSepList.push(sep)
        sepCluster.push(temp[4])
        sepJ.push(temp[8])
    })

//1) combine the arrays:
    let list = [];
    for (let j = 0; j < allSepList.length; j++) {
        list.push({'sep': allSepList[j], 'cluster': [sepCluster[j], sepJ[j]]});
    }

//2) sort:
    list.sort(function (a, b) {
        return ((a.sep < b.sep) ? -1 : ((a.sep === b.sep) ? 0 : 1));
    });

//3) separate them back out:
    for (let k = 0; k < list.length; k++) {
        allSepList[k] = list[k].sep;
        sepCluster[k] = list[k].cluster[0];
        sepJ[k] = list[k].cluster[1];
    }
    return {validity: true, allSepList, sepCluster, sepJ, attrNum}
}