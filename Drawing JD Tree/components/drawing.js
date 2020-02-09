const {ipcRenderer} = require('electron')

let item, numberOfCells, numberOfTuples;
let treeClusterIndexToPlanClusterIndex = {1: 1};
let planClusterIndexToTreeClusterIndex = {1: 1};
let RIGHT_ARROW = ' → ';
let CLUSTER_SEP = ', ';
let DISPLAY_SEP = ',<br />';
let listOfUsedSepIndex = [];
let listOfUsedSep = [];
let listOfJ = [];
let legendInfo = []
let nextClusterIndexToSplit_tree = []
let nextClusterIndexToSplit_plan = []
let clusterNameIndexMap_tree, clusterNameIndexMap_plan, res

// -------------- Init --------------
// get basic info about the dataset
// $.get("http://localhost:9876/api/spurioustuples/db", function (res) {
//     numberOfCells = Number(res.numCells)
//     numberOfTuples = Number(res.numTuples)
//     legendInfo = res.header
// })

ipcRenderer.send('get-item')

ipcRenderer.on('send-item', (e, item1) => {
    $.get("http://localhost:9876/api/spurioustuples/db", function (res1) {
        res = res1;
        drawInit(res)
        numberOfCells = Number(res.numCells)
        numberOfTuples = Number(res.numTuples)
        legendInfo = res.header
        item = item1
        $(function () {
            $("div.list").html("<ul></ul>");

            // init sep selection list
            item.allSepList.forEach((element, index) => {
                let shortedSepText = attrNumsToName(element)
                let clusters = item.indexNewCluster[index]
                let shortedCluList = []
                clusters.substring(1, clusters.length - 1).split('},{').forEach(cluster => {
                    shortedCluList.push('{' + attrNumsToName(cluster) + '}')
                })
                $("ul").append("<li>" + shortedSepText + RIGHT_ARROW + shortedCluList.join(' | ') +
                    "<br> <span style='color: green'>J: " + Number(item.sepJ[index]).toFixed(3) + '</span>');
            })

            let legendInfoWithIndex = legendInfo.map((element, index) => index + ': ' + element)
            legendInfoWithIndex.forEach(element => $("div#legend").append('<p>' + element + '</p>'))


            let $li = $("li")

            // click elsewhere
            $(document).on("click", function (e) {
                if (e.target === document || e.target.tagName === "BODY" || e.target.tagName === "HTML" || e.target.tagName === "DIV") {
                    let $active = $(".active")
                    $active.children('#text')
                    $active.toggleClass("active");
                }
            });

            // click on a sep in the left list
            $li.on('click', function () {
                let $active = $(".active")
                $active.children('#text')
                $active.toggleClass("active");
                $(this).children('#text')
                $(this).toggleClass("active");
            });

            // update list when double clicking on a list element
            $li.on('dblclick', function () {
                dblclickListUpdate($li.index($(this)), $(this).text().split(RIGHT_ARROW)[0].split(',').join(DISPLAY_SEP))
            });

            hoverAction()
            mergeAction()
        })
    })
})

// -------------- Drawing --------------
const generateGraphWithSepList = function (isTree) {
    treeClusterIndexToPlanClusterIndex = {1: 1}
    planClusterIndexToTreeClusterIndex = {1: 1}
    drawInit(res)
    listOfUsedSepIndex.forEach((sepIndex, countOfSep) => {
        let treeNodeIndex = nextClusterIndexToSplit_tree[countOfSep]
        let planNodeIndex = nextClusterIndexToSplit_plan[countOfSep]
        clusterNameIndexMap_tree = generateNewGraph(sepIndex, treeNodeIndex, tree_config)
        clusterNameIndexMap_plan = generateNewGraph(sepIndex, planNodeIndex, plan_config)
        for (const [name, treeIndex] of Object.entries(clusterNameIndexMap_tree)) {
            treeClusterIndexToPlanClusterIndex[treeIndex] = clusterNameIndexMap_plan[name]
            planClusterIndexToTreeClusterIndex[clusterNameIndexMap_plan[name]] = treeIndex
        }
    })
    chart.destroy()
    chart_config = isTree ? tree_config : plan_config
    chart = new Treant(chart_config)

    $('li').filter(function (index) {
        let sepText = $(this).text().split(RIGHT_ARROW)[0]
        return sepText === '' || listOfUsedSep.includes(sepText) ||
            !(tree_config.some(node => isCluster(node) && validSepHere(sepText, index, node)))
    }).hide()

    calculateData()
    hoverAction()
    mergeAction()
}

// return cluster index in chart_config if click on a candidate, otherwise -1
const askAndGetUserSelectedClusterIndex = function (candidateIndexes, _callback) {
    if (candidateIndexes.length === 1) {
        _callback(candidateIndexes[0])
        return
    }
    let nameCID = {}
    chart_config.forEach(node => {
        if ('HTMLclass' in node && node.HTMLclass.includes('candidate')) {
            let listOfNewHTMLClass = node.HTMLclass.split(' ')
            listOfNewHTMLClass.splice(listOfNewHTMLClass.indexOf('candidate'), 1)
            node.HTMLclass = listOfNewHTMLClass.join(' ')
        }
    })
    refresh()

    candidateIndexes.forEach((index) => {
        let listOfNewHTMLClass = chart_config[index].HTMLclass.split(' ')
        listOfNewHTMLClass.push('candidate')
        chart_config[index].HTMLclass = listOfNewHTMLClass.join(' ')
        nameCID[chart_config[index].text.name] = index
    })
    refresh()
    $('div.cluster.candidate').on('click', function () {
        _callback(nameCID[$(this).text()])
    })
}

const dblclickListUpdate = function (index, sepText) {
    let candidateIndexes_tree = getListOfCandidateClustersIndex(sepText, index, tree_config)
    let candidateIndexes_plan = candidateIndexes_tree.map(treeIndex => treeClusterIndexToPlanClusterIndex[treeIndex])
    let selectedClusterIndex_tree
    let selectedClusterIndex_plan

    if (isTreeConfig(chart_config)) {
        askAndGetUserSelectedClusterIndex(candidateIndexes_tree, function (selectedClusterIndex_tree) {
            listOfUsedSepIndex.push(index)
            listOfUsedSep.push(sepText)
            listOfJ.push(item.sepJ[index])
            selectedClusterIndex_plan = treeClusterIndexToPlanClusterIndex[selectedClusterIndex_tree]
            nextClusterIndexToSplit_tree.push(selectedClusterIndex_tree)
            nextClusterIndexToSplit_plan.push(selectedClusterIndex_plan)

            generateGraphWithSepList(true)
        })
    } else {
        askAndGetUserSelectedClusterIndex(candidateIndexes_plan, function (selectedClusterIndex_plan) {
            listOfUsedSepIndex.push(index)
            listOfUsedSep.push(sepText)
            listOfJ.push(item.sepJ[index])
            selectedClusterIndex_tree = planClusterIndexToTreeClusterIndex[selectedClusterIndex_plan]
            nextClusterIndexToSplit_tree.push(selectedClusterIndex_tree)
            nextClusterIndexToSplit_plan.push(selectedClusterIndex_plan)
            generateGraphWithSepList(false)
        })
    }
}

const getListOfCandidateClustersIndex = function (sepText, index, config) {
    let indexListOfCandidateClusters = []
    for (let i = 1; i < config.length; i++) {
        if (isCluster(config[i]) && validSepHere(sepText, index, config[i])) {
            indexListOfCandidateClusters.push(i)
        }
    }
    return indexListOfCandidateClusters
}

const hoverAction = function () {
    const $li = $('li')
    const $cluster = $('div.cluster')
    $cluster.on('mouseenter', function () {
        let IDs = []
        $(this).addClass('activeCluster')
        let clusterName = $(this).find('.node-name').text().split(',').join(DISPLAY_SEP)
        let nodeIndex = (() => {
            for (let i = 1; i < chart_config.length; i++) {
                if (isCluster(chart_config[i]) && chart_config[i].text.name === clusterName) {
                    return i
                }
            }
            return -1
        })()
        let node = chart_config[nodeIndex]
        $li.filter(function (index) {
            let sepText = $(this).text().split(RIGHT_ARROW)[0].split(',').join(DISPLAY_SEP)
            let hasToHide = listOfUsedSep.includes(sepText) || !validSepHere(sepText, index, node)
            if (hasToHide && $(this).is(':visible')) {
                IDs.push(index)
            }
            return hasToHide
        }).hide()

        $cluster.on('mouseleave', function () {
            IDs.forEach((index) => {
                $li.eq(index).show()
            })
            $(this).removeClass('activeCluster')
        })
    })
}

const mergeAction = function () {
    $("div.separator").on('dblclick', function () {
        $('li').show()
        let text = $(this).children('.node-name').text().split(CLUSTER_SEP).join('DISPLAY_SEP')
        let index = listOfUsedSep.indexOf(text)
        listOfUsedSepIndex.splice(index, 1)
        listOfUsedSep.splice(index, 1)
        let oldListOfUsedSepIndex = listOfUsedSepIndex
        let oldListOfUsedSep = listOfUsedSep
        listOfUsedSepIndex = []
        listOfUsedSep = []
        listOfJ.splice(index, 1)
        nextClusterIndexToSplit_tree = []
        nextClusterIndexToSplit_plan = []
        treeClusterIndexToPlanClusterIndex = {1: 1};
        planClusterIndexToTreeClusterIndex = {1: 1};
        drawInit(res)
        chart.destroy()
        chart = new Treant(chart_config)

        for (let i = 0; i < oldListOfUsedSep.length; i++) {
            dblclickListUpdate(oldListOfUsedSepIndex[i], oldListOfUsedSep[i])
        }
    })
}

const generateNewGraph = (sepIndex, nodeIndex, config) => {
    let newClustersString = item.indexNewCluster[sepIndex]
    let sepText = attrNumsToName(item.allSepList[sepIndex])
    let listOfSep = [] // names
    sepText.split(DISPLAY_SEP).sort().forEach(sepName => {
        listOfSep.push(sepName)
    })

    let listOfNewClusters = [] // names
    newClustersString.substring(1, newClustersString.length - 1).split('},{').forEach(cluster => {
        listOfNewClusters.push(attrNumsToName(cluster))
    })

    let node = config[nodeIndex]
    let parentCluName = node.text.name.split(DISPLAY_SEP)
    let originalCluName = parentCluName
    let clusterNameIndexMap = {}

    // change old cluster
    listOfNewClusters = listOfNewClusters.filter(newClu => {
        return newClu.split(DISPLAY_SEP).some(attr => parentCluName.includes(attr))
    })
    if (isTreeConfig(config)) {
        let indexOfFirstClu = (function () {
            for (let i = 0; i < listOfNewClusters.length; i++) {
                if (node.sep.every(separator =>
                    ArrayContainChecker(listOfNewClusters[i].split(DISPLAY_SEP).concat(listOfSep), separator.split(DISPLAY_SEP)))) {
                    return i
                }
            }
            return -1
        })()
        let firstClu = listOfNewClusters[indexOfFirstClu]
        let listOfFirstClu = firstClu.split(DISPLAY_SEP)
        listOfNewClusters.splice(indexOfFirstClu, 1)
        parentCluName = listOfFirstClu.filter(attr => parentCluName.includes(attr))
        if (listOfSep && !listOfSep.includes("")) {
            parentCluName = Array.from(new Set(parentCluName.concat(listOfSep)))
        }

        node.text.name = parentCluName.sort().join(DISPLAY_SEP)
        node.innerHTML = "<p class='node-name'>" + node.text.name + "</p>"
        node.sep.push(sepText)
        clusterNameIndexMap[node.text.name] = nodeIndex
    } else {
        node.text.name = sepText.split(DISPLAY_SEP).sort().join(DISPLAY_SEP)
        node.HTMLclass = 'separator'
    }

    if (typeof node.children !== typeof []) {
        node.children = []
    }

    // add sep for tree
    if (isTreeConfig(config)) {
        let sepNode = {
            innerHTML: "<p class='node-name'>" + listOfSep.join(DISPLAY_SEP) + "</p>",
            text: {name: listOfSep.join(DISPLAY_SEP)},
            children: [],
            HTMLclass: 'separator'
        }
        node.children.push(sepNode)
        config.push(sepNode)
        node = sepNode
    }

    // apply all of rest new cluster
    listOfNewClusters.forEach(element => {
        let cluNodeName = element.split(DISPLAY_SEP).filter(el => originalCluName.includes(el))
        if (cluNodeName.length > 0) {
            if (sepText !== '') {
                cluNodeName = cluNodeName.concat(listOfSep)
            }
            cluNodeName = cluNodeName.sort().join(DISPLAY_SEP)
            let cluNode = {
                innerHTML: "<p class='node-name'>" + cluNodeName + "</p>",
                text: {name: cluNodeName},
                children: [],
                HTMLclass: 'cluster',
                sep: []
            }
            node.children.push(cluNode)
            clusterNameIndexMap[cluNode.text.name] = config.length
            config.push(cluNode)
            cluNode.sep.push(sepText)
        }
    })

    return clusterNameIndexMap
}

// -------------- Filtering --------------

// Accepting DISPLAY_SEP
const validSepHere = (sepText, sepIndex, node) => {
    let newClustersString = item.indexNewCluster[sepIndex]
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let listOfSep = sepText.split(DISPLAY_SEP)
    let listOfClusterName = node.text.name.split(DISPLAY_SEP)
    let splitToMoreThanTwo = false
    let hasClusterContainingAllSep = false
    let count = 0
    if (!ArrayContainChecker(listOfClusterName, listOfSep)) {
        return false
    }
    newClusters.forEach(newCluster => {
        let listOfNewCluster = []
        newCluster.split(CLUSTER_SEP).forEach((value) => {
            listOfNewCluster.push(legendInfo[Number(value)])
        })
        if ((listOfNewCluster = listOfNewCluster.filter(el => listOfClusterName.includes(el))).length > 0) {
            count++
            if (node.sep.every(separator => {
                let listOfNewClusterAndNewSep = Array.from(new Set(listOfNewCluster.concat(listOfSep)))
                let listOfOldSep = separator.split(DISPLAY_SEP)
                return ArrayContainChecker(listOfNewClusterAndNewSep, listOfOldSep)
                    && !ArrayContainChecker(listOfOldSep, listOfNewClusterAndNewSep)
            })) {
                hasClusterContainingAllSep = true
            }
        }
    })

    if (count > 1) {
        splitToMoreThanTwo = true
    }

    return splitToMoreThanTwo && hasClusterContainingAllSep
}

// -------------- Prefix --------------
// helper for convertPrefixToWord
const insertToTrie = (remaining, node) => {
    if (remaining.length > 0) {
        let char = remaining.charAt(0)
        if (node[char] == null) {
            node[char] = {}
        }
        insertToTrie(remaining.substring(1), node[char])
    }
}

const attrNumsToName = function (oldText) {
    let shortedList = []
    oldText.split(CLUSTER_SEP).forEach(attr => {
        shortedList.push(legendInfo[attr])
    })
    return shortedList.join(DISPLAY_SEP)
}

// -------------- Update Info --------------

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
    $('p#SpuriousTuples, p#saving').css('color, red')

    let UniqueNameList = $('div.cluster').children('.node-name')
    UniqueNameList.each(function () {
        let listOfAttrNum = [];
        $(this).text().split(',').forEach(value => {
            listOfAttrNum.push(legendInfo.indexOf(value))
        })
        calculateData.listOfListOfNames.push(JSON.parse('[' + listOfAttrNum + ']'))
    })

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

                    let JMeasure = listOfJ.reduce((a, b) => a + b)
                    $('p#JMeasure').text(JMeasure.toFixed(3))

                    $('p#SpuriousTuples, p#saving').css('color, green')
                    calculateData.listOfListOfNames = []
                },
                error: function () {
                    let JMeasure = listOfJ.reduce((a, b) => a + b)
                    $('p#JMeasure').text(JMeasure.toFixed(3))
                    $('p#saving').text('Too many tuples')
                    $('p#SpuriousTuples').text('Too many tuples')

                    $('p#SpuriousTuples, p#saving').css('color, yellow')
                }
            });
        }
    })
    myAction.test()
}

// -------------- Jquery --------------
jQuery.fn.max = function (selector) {
    return Math.max.apply(null, this.map(function (index, el) {
        return selector.apply(el);
    }).get());
}

// -------------- Misc. --------------
const ArrayContainChecker = (container, toBeContained) => toBeContained.every(v => v === '' || container.includes(v))
const isTreeConfig = config => config === tree_config
const refresh = () => {
    chart.destroy();
    chart = new Treant(chart_config)
    hoverAction()
    mergeAction()
}
const isCluster = function (node) {
    return 'HTMLclass' in node && node.HTMLclass.includes('cluster')
}
