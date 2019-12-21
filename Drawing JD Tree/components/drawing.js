const {ipcRenderer} = require('electron')

let item, lr, numberOfCells
// first contains second
const prefixToWord = {};
const wordToPrefix = {};
const sepNodeMap = {};
const sepParentMap = {};
const RIGHT_ARROW = ' → ';
const CLUSTER_SEP = ', ';
const listOfAllSeps = [];

$.get("http://localhost:9876/api/spurioustuples/db", function (res) {
    numberOfCells = Number(res.numCells)
})

ipcRenderer.send('get-item')

ipcRenderer.on('send-item', (e, item1, lr1) => {
    item = item1
    lr = lr1
    drawInit(item)
    getPrefixToWord()
    getWordToPrefix()
    $(function () {
        let list = Object.keys(item.sepCluster).sort()
        $("div.list").html("<ul></ul>");

        // init sep selection list
        list.forEach(element => {
            let shortedSepText = toggleWordToPrefix(element, wordToPrefix)
            let clusters = item.sepCluster[element]
            let shortedCluList = []
            clusters.substring(1, clusters.length - 1).split('},{').forEach(cluster => {
                shortedCluList.push('{' + toggleWordToPrefix(cluster, wordToPrefix) + '}')
            })
            $("ul").append("<li>" + shortedSepText + RIGHT_ARROW + shortedCluList.join(' | '));
        })

        let $li = $("li")

        $(document).on("click", function (e) {
            if (e.target === document || e.target.tagName === "BODY" || e.target.tagName === "HTML" || e.target.tagName === "DIV") {
                let $active = $(".active")
                $active.changeWordToPrefix()
                $active.toggleClass("active");
            }
        });


        $li.on('click', function () {
            let $active = $(".active")
            $active.changeWordToPrefix()
            $active.toggleClass("active");
            $(this).changePrefixToWord()
            $(this).toggleClass("active");
        });

        // update list when double clicking on a list element
        $li.on('dblclick', function () {
            dblclickListUpdate($li, $(this))
        });

        hoverAction()
        mergeAction()
    })
})

const generateNewGraph = (oldJD, config) => {
    let newClustersString = item.sepCluster[oldJD]
    let oldJDList = oldJD.split(', ').sort()
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let indexInConfig = getIndexInConfig(config, oldJD)
    if (indexInConfig > -1) {
        let node = config[indexInConfig]
        let oldNode = node
        let nodeNameList = node.text.name.split(CLUSTER_SEP)
        let currJ = node.JMeasure
        // change old cluster
        let originalCluName = node.text.name

        newClusters.filter(clu => ArrayContainChecker(nodeNameList, clu.split(', ')))
        if (isTreeConfig(config)) {
            let firstClu = newClusters.shift()
            node.text.name = originalCluName.split(CLUSTER_SEP)
                .filter(attr => firstClu.includes(attr)).concat(oldJDList).sort().join(CLUSTER_SEP)
            names[names.indexOf(originalCluName)] = node.text.name
        } else {
            node.text.name = oldJD.split(', ').sort().join(CLUSTER_SEP)
            node.HTMLclass = 'separator'
            sepNodeMap[node.text.name] = node
        }

        if (typeof node.children !== typeof []) {
            node.children = []
        }

        if (isTreeConfig(config)) {
            // add sep
            let sepNode = {
                text: {name: oldJDList.join(CLUSTER_SEP)},
                children: [],
                HTMLclass: 'separator'
            }
            node.children.push(sepNode)
            config.push(sepNode)
            names.splice(names.indexOf(originalCluName))
            node = sepNode
            sepParentMap[node.text.name] = oldNode
        }

        let newNodeJMeasure = 0
        newClusters.forEach(element => {
            let cluNodeName = element.split(', ').filter(el => nodeNameList.includes(el))
            if (cluNodeName.length > 0) {
                cluNodeName = cluNodeName.concat(oldJDList).sort().join(CLUSTER_SEP)
                let JMeasure =
                    (Number(item.sepJ[oldJD]) + Number(currJ)).toFixed(4)
                newNodeJMeasure += Number(item.sepJ[oldJD]) + Number(currJ)

                let cluNode = {
                    innerHTML: "<p class='JMeasure'>" +
                        +JMeasure +
                        "</p>" +
                        "<p class='node-name'>" + cluNodeName + "</p>",
                    text: {name: cluNodeName},
                    JMeasure: JMeasure,
                    children: [],
                    HTMLclass: 'cluster'
                }
                node.children.push(cluNode)
                config.push(cluNode)
                names.push(cluNodeName)
            }
        })
        oldNode.JMeasure = newNodeJMeasure.toFixed(4)
        if (oldNode.innerHTML !== undefined) {
            let oldInnerHTML = oldNode.innerHTML.split('</p>')
            oldInnerHTML[0] = "<p class='JMeasure'>" + oldNode.JMeasure
            oldInnerHTML[1] = "<p class='node-name'>" + oldNode.text.name
            oldNode.innerHTML = oldInnerHTML.join("</p>")
        }
    } else {
        console.log(oldJD)
        console.log('cannot find in config')
    }
}


// -------------- Helpers --------------

// check if the given oldJD can separate sth. out
const notValidSepHere = (oldJD) => {
    let newClustersString = item.sepCluster[oldJD]
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let nodeNameList = names.filter(name =>
        ArrayContainChecker(name.split(CLUSTER_SEP), oldJD.split(', '))
    )
    let boo = false
    // list of all candidate names
    nodeNameList.forEach(name => {
        let nameAttrList = name.split(CLUSTER_SEP)
        // let existedSepAttrSet = new Set()
        let count = 0
        // let node = getClusterByName(name)
        // node.children.forEach(sep => {
        //     sep.text.name.split(', ').forEach(attr => existedSepAttrSet.add(attr))
        // })

        newClusters.forEach(element => {
            if (element.split(', ').filter(el => nameAttrList.includes(el)).length > 0) {
                count++
            }
        })
        if (count <= 1) {
            boo = true
        }
    })

    return boo
}

// convert a list to an object mapping distinguishable prefixes to words
// must be called after DrawInit()
const getPrefixToWord = () => {
    let root = {}
    initList.forEach(element => {
        insertToTrie(element, root)
    })
    initList.forEach(element => {
        prefixToWord[getPrefixFromTrie(element, root)] = element
    })
}

// helper for getPrefixToWord
const getPrefixFromTrie = (str, node) => {
    node = node[str.charAt(0)]
    let i = 1, mark = 1
    while (i < str.length) {
        if (Object.keys(node).length > 1) {
            mark = i + 1
        }
        node = node[str.charAt(i++)]
    }
    return str.substring(0, mark)
}

// helper for getPrefixToWord
const insertToTrie = (remaining, node) => {
    if (remaining.length > 0) {
        let char = remaining.charAt(0)
        if (node[char] == null) {
            node[char] = {}
        }
        insertToTrie(remaining.substring(1), node[char])
    }
}

// call after getPrefixToWord()
const getWordToPrefix = () => {
    for (let [key, value] of Object.entries(prefixToWord)) {
        wordToPrefix[value] = key
    }
}

// check if any cluster contain the certain JD
const filterList = (JD) => {
    JD = JD.split(', ')
    return names.some(name => ArrayContainChecker(name.split(CLUSTER_SEP), JD))
}

const filterListForCluster = (JD, cluster) => {
    JD = JD.split(', ')
    let clusterArray = cluster.split(CLUSTER_SEP)
    return ArrayContainChecker(clusterArray, JD)
}

const getIndexInConfig = (config, oldJD) => {
    let cluList = oldJD.split(', ')
    for (let i = 1; i < config.length; i++) {
        if (config[i].HTMLclass === 'cluster' && ArrayContainChecker(config[i].text.name.split(CLUSTER_SEP), cluList)) {
            return i
        }
    }
    return -1
}

const toggleWordToPrefix = function (oldText, dict) {
    let shortedList = []
    oldText.split(', ').forEach(attr => {
        shortedList.push(dict[attr])
    })
    return shortedList.join(', ')
}

const ArrayContainChecker = (currList, cluList) => cluList.every(v => currList.includes(v))

const isTreeConfig = config => config === tree_config

// jquery functions
jQuery.fn.changeWordToPrefix = function () {
    let o = $(this[0])
    o.text((i, oldText) => jQueryChangeWordPrefixHelper(i, oldText, wordToPrefix));
    return this
}

jQuery.fn.changePrefixToWord = function () {
    let o = $(this[0])
    o.text((i, oldText) => jQueryChangeWordPrefixHelper(i, oldText, prefixToWord));
    return this
}

const dblclickListUpdate = function ($li, $this) {
    $('p#SpuriousTuples, p#saving').css('color', 'red')
    let text = $this.text().split(RIGHT_ARROW)[0]
    listOfAllSeps.push(text)
    generateGraphWithSepList(isTreeConfig(chart_config))

    // hover
    hoverAction()
    mergeAction()
}

const jQueryChangeWordPrefixHelper = function (i, oldText, dict) {
    let oldList = oldText.split(RIGHT_ARROW)
    let oldShortedCluList = []
    oldList[1].substring(1, oldList[1].length - 1).split('} | {').forEach(cluster => {
        oldShortedCluList.push('{' + toggleWordToPrefix(cluster, dict) + '}')
    })
    return toggleWordToPrefix(oldList[0], dict) + RIGHT_ARROW + oldShortedCluList.join(' | ')
}

const hoverAction = function () {
    const $li = $('li')
    const $cluster = $('div.cluster')
    $cluster.on('mouseenter', function () {
        let IDs = []
        $(this).addClass('activeCluster')
        $li.filter((index) => {
            let curr = $li.eq(index)
            let boo = !filterListForCluster(curr.attr('class') === 'active' ?
                curr.text().split(RIGHT_ARROW)[0] :
                toggleWordToPrefix(curr.text().split(RIGHT_ARROW)[0], prefixToWord), $(this).find('.node-name').text())
            if (boo && curr.is(':visible')) IDs.push(index)
            return boo
        }).hide()

        $cluster.on('mouseleave', () => {
            IDs.forEach((value) => {
                $li.eq(value).show()
            })
            $(this).removeClass('activeCluster')
        })
    })
}

const mergeAction = function () {
    $("div.separator").on('dblclick', function () {
        $('li').show()
        let text = $(this).children('.node-name').text()
        console.log(listOfAllSeps)
        let index = listOfAllSeps.indexOf(text)
        listOfAllSeps.splice(index, 1)
        console.log(listOfAllSeps)
        generateGraphWithSepList(isTreeConfig(chart_config))

        hoverAction()
        mergeAction()
    })
}

const generateGraphWithSepList = function (isTree) {
    drawInit(item)
    listOfAllSeps.forEach(text => {
        generateNewGraph(text, tree_config)
        generateNewGraph(text, plan_config)

        let $li = $('li')
        // filter the whole list
        $li.filter((index) => {
            let temp = $li.eq(index).text().split(RIGHT_ARROW)[0]
            temp = toggleWordToPrefix(temp, prefixToWord)
            return !filterList(temp) || notValidSepHere(temp)
        }).hide()
    })
    chart.destroy()
    chart_config = isTree ? tree_config : plan_config
    chart = new Treant(chart_config)
    calculateData()
}

const calculateData = function () {
    let listOfListOfNames = []

    let UniqueNameList = $('div.cluster').children('.node-name')
    UniqueNameList.each(function () {
        listOfListOfNames.push(JSON.parse('[' + $(this).text() + ']'))
    })
    console.log(listOfListOfNames)
    let myAction = {};
    let url = "http://localhost:9876/api/spurioustuples/decom"
    $.extend(myAction, {
        test: function () {
            $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(listOfListOfNames),
                cache: false,
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function (res) {
                    // if (res.status === 'PENDING' || res.status === 'RUNNING') {
                    //     setTimeout(myAction.test, 50)
                    //     console.log('PENDING')
                    // } else if (res.status === 'FINISHED') {
                        console.log(res)
                        $('p#SpuriousTuples').text(res.spuriousTuples)
                        let savingPercentage = ((1 - Number(res.totalCellsInDecomposition) / numberOfCells) * 100)
                            .toFixed(1)
                        $('p#saving').text(savingPercentage + '%')
                        $('p#SpuriousTuples, p#saving').css('color', 'green')
                    // } else {
                    //     console.log(res.status)
                    // }
                },
                error: function (e) {
                    console.log(e)
                }
            });
        }
    })
    myAction.test()
}

const getClusterByName = function (text) {
    for (let i = 1; i < tree_config.length; i++) {
        if (tree_config[i].text.name === text) {
            return tree_config[i]
        }
    }
    return null
}