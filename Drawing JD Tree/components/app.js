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

const portInUse = function (port) {
    let server = net.createServer(function (socket) {
        socket.write('Echo server\r\n');
        socket.pipe(socket);
    });

    server.listen(port, '127.0.0.1');
    server.on('error', function (e) {
        return true;
    });
    server.on('listening', function (e) {
        server.close();
        return false;
    });
};