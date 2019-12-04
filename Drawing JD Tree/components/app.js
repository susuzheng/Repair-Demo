const {ipcRenderer} = require('electron')

let upload = document.getElementById('upload')

upload.addEventListener('click', e => {
    ipcRenderer.send('open-dialog')
})

ipcRenderer.on('set-filepath-success', (e, file) => {
    let item;
    if ((item = checkValidity(file)).validity) {
        console.log('aaa')
        ipcRenderer.send('open-drawing', item)
    } else {
        alert('Not valid separator file. Please select again.')
        upload.click()
    }
})

const checkValidity = (filePath) => {
    let re = /^(\d+?),{{(\w+?(,\s\w+)*)}\|({\w+?(,\s\w+)*}(,{\w+?(,\s\w+)*})*)},([01](\.\d+)?)/
    let sepCluster = {}
    let sepJ = {}
    let attrNum = 0;
    require('fs').readFileSync(filePath).toString().split('\n').forEach( line => {
        let temp;
        // line = line.replace(/ /g, '')
        if ((temp = re.exec(line)) === null) {
            return {validity: false};
        }

        attrNum = temp[1]
        sepCluster[temp[2]] = temp[4]
        sepJ[temp[2]] = temp[8]
    })
    return {validity: true, sepCluster, sepJ, attrNum}
}