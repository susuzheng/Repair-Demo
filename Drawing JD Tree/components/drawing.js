const {ipcRenderer} = require('electron')

let item, numberOfCells, numberOfTuples
// first contains second
const prefixToWord = {};
const wordToPrefix = {};
const sepNodeMap = {};
const sepParentMap = {};
const RIGHT_ARROW = ' → ';
const CLUSTER_SEP = ',';
const listOfUsedSepIndex = [];
const listOfUsedSep = [];

// get basic info about the dataset
$.get("http://localhost:9876/api/spurioustuples/db", function (res) {
    numberOfCells = Number(res.numCells)
    numberOfTuples = Number(res.numTuples)

})

ipcRenderer.send('get-item')

ipcRenderer.on('send-item', (e, item1) => {
    item = item1
    drawInit(item)
    getPrefixToWord()
    getWordToPrefix()
    $(function () {
        $("div.list").html("<ul></ul>");

        // init sep selection list
        item.allSepList.forEach((element, index) => {
            let shortedSepText = toggleWordToPrefix(element, wordToPrefix)
            let clusters = item.sepCluster[index]
            let shortedCluList = []
            clusters.substring(1, clusters.length - 1).split('},{').forEach(cluster => {
                shortedCluList.push('{' + toggleWordToPrefix(cluster, wordToPrefix) + '}')
            })
            $("ul").append("<li>" + shortedSepText + RIGHT_ARROW + shortedCluList.join(' | '));
        })

        let $li = $("li")

        // click elsewhere
        $(document).on("click", function (e) {
            if (e.target === document || e.target.tagName === "BODY" || e.target.tagName === "HTML" || e.target.tagName === "DIV") {
                let $active = $(".active")
                $active.changeWordToPrefix()
                $active.toggleClass("active");
            }
        });

        // click on a sep in the left list
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

const generateNewGraph = (oldJD, index, config) => {
    let newClustersString = item.sepCluster[index]
    let listOfOldJD = oldJD.split(', ').sort()
    let listOfNewClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let indexInConfig = getIndexInConfig(config, oldJD)

    if (indexInConfig > -1 || oldJD === '') {
        let node = config[oldJD === '' ? 1 : indexInConfig]
        let oldNode = node
        let listOfNodeName = node.text.name
        let currJ = node.JMeasure
        let originalCluName = node.text.name

        // change old cluster
        listOfNewClusters = listOfNewClusters.filter(newClu => {
            return newClu.split(', ').some(attr => originalCluName.includes(attr))
        })
        if (isTreeConfig(config)) {
            let indexOfFirstClu = (function () {
                for (let i = 0; i < listOfNewClusters.length; i++) {
                    if (node.sep.every(separator => ArrayContainChecker(listOfNewClusters[i].split(', '), separator.split(', ')))) {
                        return i
                    }
                }
                return -1
            })()
            let firstClu = listOfNewClusters[indexOfFirstClu].split(', ')
            listOfNewClusters.splice(indexOfFirstClu, 1)
            node.text.name = firstClu.filter(attr => originalCluName.includes(attr))
            if (oldJD !== '') {
                node.text.name = Array.from(new Set(node.text.name.concat(listOfOldJD)))
            }
            node.text.name = node.text.name.sort((a, b) => (Number(a) - Number(b)))
            node.sep.push(oldJD)
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
                text: {name: listOfOldJD.join(CLUSTER_SEP)},
                children: [],
                HTMLclass: 'separator'
            }
            node.children.push(sepNode)
            config.push(sepNode)
            node = sepNode
            sepParentMap[node.text.name] = oldNode
        }

        // let newNodeJMeasure = 0
        listOfNewClusters.forEach(element => {
            let cluNodeName = element.split(', ').filter(el => listOfNodeName.includes(el))
            if (cluNodeName.length > 0) {
                if (oldJD !== '') {
                    cluNodeName = cluNodeName.concat(listOfOldJD)
                }
                cluNodeName.sort((a, b) => Number(a) - Number(b)).join(CLUSTER_SEP)
                let JMeasure =
                    (Number(item.sepJ[index]) + Number(currJ)).toFixed(4)
                // newNodeJMeasure += Number(item.sepJ[oldJD]) + Number(currJ)

                let cluNode = {
                    innerHTML: "<p class='JMeasure'>" +
                        +JMeasure +
                        "</p>" +
                        "<p class='node-name'>" + cluNodeName + "</p>",
                    text: {name: cluNodeName},
                    JMeasure: JMeasure,
                    children: [],
                    HTMLclass: 'cluster',
                    sep: []
                }
                node.children.push(cluNode)
                config.push(cluNode)
                cluNode.sep.push(oldJD)
            }
        })
        oldNode.JMeasure = (Number(item.sepJ[index]) + Number(currJ)).toFixed(4)
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
const notValidSepHere = (oldJD, index) => {
    let newClustersString = item.sepCluster[index]
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let nodeNameList = names.filter(name =>
        ArrayContainChecker(name, oldJD.split(', '))
    )
    let boo = false
    let containsAllSep = false
    // list of all candidate names
    nodeNameList.forEach(name => {
        let nameAttrList = name
        let count = 0
        newClusters.forEach(element => {
            if (element.split(', ').filter(el => nameAttrList.includes(el)).length > 0) {
                count++
            }
            if (tree_config[getIndexInConfig(tree_config, nameAttrList.join(', '))].sep.every(separator => {
                return ArrayContainChecker(element.split(', '), separator.split(', '))
            })) {
                containsAllSep = true
            }
        })

        if (count <= 1) {
            boo = true
        }
    })

    return boo || !containsAllSep
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
    return names.some(name => ArrayContainChecker(name, JD))
}

const filterListForCluster = (JD, cluster) => {
    JD = JD.split(', ')
    let clusterArray = cluster.split(CLUSTER_SEP)
    return ArrayContainChecker(clusterArray, JD)
}

const getIndexInConfig = (config, oldJD) => {
    let cluList = oldJD.split(', ')
    for (let i = 1; i < config.length; i++) {
        if (config[i].HTMLclass === 'cluster' && config[i].text.name !== '' && ArrayContainChecker(config[i].text.name, cluList)) {
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

jQuery.fn.max = function (selector) {
    return Math.max.apply(null, this.map(function (index, el) {
        return selector.apply(el);
    }).get());
}

const dblclickListUpdate = function ($li, $this) {
    listOfUsedSepIndex.push($li.index($this))
    listOfUsedSep.push($this.text().split(RIGHT_ARROW)[0])

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
        if (names.length > 1) {
            $li.filter((index) => {
                let curr = $li.eq(index)
                let boo = !filterListForCluster(curr.attr('class') === 'active' ?
                    curr.text().split(RIGHT_ARROW)[0] :
                    toggleWordToPrefix(curr.text().split(RIGHT_ARROW)[0], prefixToWord), $(this).find('.node-name').text())
                if (boo && curr.is(':visible')) IDs.push(index)
                return boo
            }).hide()
        }

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
        let index = listOfUsedSep.indexOf(text)
        listOfUsedSepIndex.splice(index, 1)
        listOfUsedSep.splice(index, 1)
        generateGraphWithSepList(isTreeConfig(chart_config))

        hoverAction()
        mergeAction()
    })
}

const generateGraphWithSepList = function (isTree) {
    drawInit(item)
    listOfUsedSepIndex.forEach((index) => {
        generateNewGraph(item.allSepList[index], index, tree_config)
        generateNewGraph(item.allSepList[index], index, plan_config)
    })
    chart.destroy()
    chart_config = isTree ? tree_config : plan_config
    chart = new Treant(chart_config)
    calculateData()
}

const calculateData = function () {
    if (typeof calculateData.listOfListOfNames === 'undefined') {
        calculateData.listOfListOfNames = []
    }
    if (calculateData.listOfListOfNames.length !== 0) {
        calculateData.ajax.abort();
        $.ajax({
            url: "http://localhost:9876/api/spurioustuples/cancel",
            type: 'POST',
            dataType: 'json',
            data: JSON.stringify(calculateData.listOfListOfNames),
            cache: false,
            headers: {
                'Content-Type': 'application/json'
            }
        })
        calculateData.listOfListOfNames = []
    }
    $('p#SpuriousTuples, p#saving, p#JMeasure').css('color', 'red')
    names = []

    let UniqueNameList = $('div.cluster').children('.node-name')
    UniqueNameList.each(function () {
        calculateData.listOfListOfNames.push(JSON.parse('[' + $(this).text() + ']'))
        names.push($(this).text().split(CLUSTER_SEP))
    })

    // filter the whole list
    let $li = $('li')
    if (names.length > 1) {
        $li.filter((index) => {
            let temp = $li.eq(index).text().split(RIGHT_ARROW)[0]
            temp = toggleWordToPrefix(temp, prefixToWord)
            return !filterList(temp) || notValidSepHere(temp, index)
        }).hide()
    }

    let myAction = {};
    let url = "http://localhost:9876/api/spurioustuples/decom"
    $.extend(myAction, {
        test: function () {
            calculateData.ajax = $.ajax({
                url: url,
                type: 'POST',
                dataType: 'json',
                data: JSON.stringify(calculateData.listOfListOfNames),
                cache: false,
                headers: {
                    'Content-Type': 'application/json'
                },
                success: function (res) {
                    let SpurPercentage = ((Number(res.spuriousTuples) / numberOfTuples) * 100)
                        .toFixed(2)
                    $('p#SpuriousTuples').text(SpurPercentage + '%')

                    let savingPercentage = ((1 - Number(res.totalCellsInDecomposition) / numberOfCells) * 100)
                        .toFixed(2)
                    $('p#saving').text(savingPercentage + '%')

                    let JMeasure = 0
                    $('div.cluster').children('.JMeasure').each(function () {
                        JMeasure = Math.max(JMeasure, Number($(this).text()))
                    })
                    $('p#JMeasure').text(JMeasure.toFixed(3))

                    $('p#SpuriousTuples, p#saving, p#JMeasure').css('color', 'green')
                    calculateData.listOfListOfNames = []
                },
                error: function (e) {
                    console.log(e)
                    let JMeasure = 0
                    $('div.cluster').children('.JMeasure').each(function () {
                        JMeasure = Math.max(JMeasure, Number($(this).text()))
                    })
                    $('p#JMeasure').text(JMeasure.toFixed(3))
                    $('p#saving').text('Too many tuples')
                    $('p#SpuriousTuples').text('Too many tuples')

                    $('p#SpuriousTuples, p#saving, p#JMeasure').css('color', 'yellow')
                }
            });
        }
    })
    myAction.test()
}