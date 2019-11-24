const {ipcRenderer} = require('electron')

let item
// first contains second
let ArrayContainChecker = (currList, cluList) => cluList.every(v => currList.includes(v))


ipcRenderer.send('get-item')

ipcRenderer.on('send-item', (e, item1) => {
    item = item1
    drawInit(item.attrNum)
    // drawList(item)
    let list = Object.keys(item.sepCluster).sort()
    $(function () {
        let $divList = $("div.list")
        $divList.html("<ul></ul>");
        for (let i in list) {
            $("ul").append("<li>" + list[i]);
        }
        let $li = $("li")
        let $cluster = $('div.cluster')

        $(document).on("click", function (e) {
            if (e.target === document || e.target.tagName === "BODY" || e.target.tagName === "HTML" || e.target.tagName === "DIV") {
                $(".active").toggleClass("active");
            }
        });


        $li.on('click', function () {
            $(".active").toggleClass("active");
            $(this).toggleClass("active");
        });

        // update
        $li.on('dblclick', function () {
            let text = $(this).text()
            generateNewGraph(text)
            let allClusterList = []
            console.log(chart_config)
            for (let i = 1; i < chart_config.length; i++) {
                allClusterList.push(chart_config[i].text.name)
            }
            $li.filter((index) => {
                // newClusters.filter(value => {
                //     console.log(node.text.name.split(','))
                //     console.log(value.split(','))
                //     return ArrayContainChecker(node.text.name.split(','), value.split(','))
                // })
                let temp = $li.eq(index).text()
                return !filterList(temp) || allClusterList.includes(temp)
            }).hide()
            $divList = $("div.list")
            $li = $("li")
            $cluster= $('div.cluster')

            // hover
            $cluster.on('mouseenter', function () {
                let IDs = []
                console.log($(this).text())
                $(this).addClass('activeCluster')
                $li.filter((index) => {
                    let boo = !filterListForCluster($li.eq(index).text(), $(this).text())
                    if (boo && $li.eq(index).is(':visible')) IDs.push(index)
                    return boo
                }).hide()

                $cluster.on('mouseleave', () => {
                    IDs.forEach((value) => {
                        $li.eq(value).show()
                    })
                    $(this).removeClass('activeCluster')
                })
            })
        })
    });
})

const generateNewGraph = (oldJD) => {
    let newClusters = item.sepCluster[oldJD]
    // console.log(newClusters)
    newClusters = newClusters.substring(1, newClusters.length - 1).split('},{') //array
    let indexInConfig = getIndexInConfig(chart_config, oldJD)
    if (indexInConfig > -1) {
        let node = chart_config[indexInConfig]
        node.text.name = oldJD
        delete node.HTMLclass
        if (typeof node.children !== typeof []) {
            node.children = []
        }


        let notToIncludeList = new Set()
        // init notToIncludeList
        for (let i = 1; i < chart_config.length; i++) {
            let temp = chart_config[i].text.name.split(',')
            for (let j = 0; j < temp.length; j++) {
                notToIncludeList.add(temp[j])
            }
        }
        newClusters.forEach(element => {
            element = element.split(',').filter( ( el ) => !notToIncludeList.has( el )).join(',');
            if (element.length > 0) {
                let temp = {
                    text: {name: element},
                    HTMLclass: 'cluster'
                }
                chart_config.push(temp)
                node.children.push(temp)
            }
        })
        chart.destroy()
        chart = new Treant(chart_config)
        // console.log(chart_config)
        // console.log(chart)
    } else {
        console.log(oldJD)
        console.log('cannot find in config')
    }

}

// check if any cluster contain the certain JD
const filterList = (JD) => {
    JD = JD.split(',')
    for (let i = 1; i < chart_config.length; i++) {
        let clusterArray = chart_config[i].text.name.split(',')
        if (chart_config[i].HTMLclass === 'cluster' && ArrayContainChecker(clusterArray, JD)) {
            return true;
        }
    }
    return false;
}

const filterListForCluster = (JD, cluster) => {
    JD = JD.split(',')
    let clusterArray = cluster.split(',')
    return ArrayContainChecker(clusterArray, JD)
}

const getIndexInConfig = (config, oldJD) => {
    let cluList = oldJD.split(',')
    for (let i = 1; i < config.length; i++) {
        if (chart_config[i].HTMLclass === 'cluster' && ArrayContainChecker(config[i].text.name.split(','), cluList)) {
            return i
        }
    }
    return -1
}