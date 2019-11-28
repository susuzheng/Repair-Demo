const {ipcRenderer} = require('electron')

let item
// first contains second
let ArrayContainChecker = (currList, cluList) => cluList.every(v => currList.includes(v))
const prefixToWord = {};
const wordToPrefix = {};


ipcRenderer.send('get-item')

ipcRenderer.on('send-item', (e, item1) => {
    item = item1
    drawInit(item)
    // drawList(item)
    getPrefixToWord()
    getWordToPrefix()
    $(function () {
        let list = Object.keys(item.sepCluster).sort()
        let $divList = $("div.list")
        $divList.html("<ul></ul>");

        // init sep selection list
        list.forEach(element => {
            let shortedList = []
            element.split(', ').forEach(attr => {
                shortedList.push(wordToPrefix[attr])
            })
            $("ul").append("<li>" + shortedList.join(', '));
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

        // update when double clicking
        $li.on('dblclick', function () {
            let text = $(this).text()
            generateNewGraph(text, tree_config)
            generateNewGraph(text, plan_config)
            chart.destroy()
            chart = new Treant(chart_config)
            $li.filter((index) => {
                let temp = $li.eq(index).text()
                temp = toggleWordToPrefix(temp, prefixToWord)
                return !filterList(temp) || notValidSepHere(temp)
            }).hide()
            $divList = $("div.list")

            // hover
            hoverAction()
        });
    })
})

const generateNewGraph = (oldJD, config) => {
    let newClustersString = item.sepCluster[oldJD]
    let oldJDList = oldJD.split(', ').sort()
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let indexInConfig = getIndexInConfig(config, oldJD)
    if (indexInConfig > -1) {
        let node = config[indexInConfig]
        let nodeNameList = node.text.name.split(',\n')

        // change old cluster
        let originalCluName = node.text.name
        if (config === tree_config) {
            let firstClu = newClusters.shift()
            node.text.name = originalCluName.split(',\n')
                .filter(attr => firstClu.includes(attr)).concat(oldJDList).sort().join(',\n')
            names[names.indexOf(originalCluName)] = node.text.name
        } else {
            node.text.name = oldJD.split(', ').sort().join(',\n')
            delete node.HTMLclass
        }

        if (typeof node.children !== typeof []) {
            node.children = []
        }

        if (config === tree_config) {
            // add sep
            let sepNode = {
                text: {name: oldJDList.join(',\n')},
                children: []
            }
            node.children.push(sepNode)
            config.push(sepNode)
            names.splice(names.indexOf(originalCluName))
            oldJDList.forEach(attr => seps.push(attr))
            node = sepNode
        }

        newClusters.forEach(element => {
            let cluNodeName = element.split(', ').filter(el => nodeNameList.includes(el))
            if (cluNodeName.length > 0) {
                cluNodeName = cluNodeName.concat(oldJDList).sort().join(',\n')
                let cluNode = {
                    text: {name: cluNodeName},
                    children: [],
                    HTMLclass: 'cluster'
                }
                node.children.push(cluNode)
                config.push(cluNode)
                names.push(cluNodeName)
            }
        })
    } else {
        console.log(oldJD)
        console.log('cannot find in config')
    }
}

// const generateNewPlanGraph = (oldJD) => {
//     let newClusters = item.sepCluster[oldJD]
//     newClusters = newClusters.substring(1, newClusters.length - 1).split('},{') //array
//     let indexInConfig = getIndexInConfig(plan_config, oldJD)
//     if (indexInConfig > -1) {
//         let node = plan_config[indexInConfig]
//         let nodeNameList = node.text.name.split(',\n')
//
//         // change old cluster to separator
//         node.text.name = oldJD.split(', ').sort().join(',\n')
//         delete node.HTMLclass
//         if (typeof node.children !== typeof []) {
//             node.children = []
//         }
//
//         newClusters.forEach(element => {
//             element = element.split(', ').filter((el) => nodeNameList.includes(el));
//             if (element.length > 0) {
//                 let temp = {
//                     text: {name: element.concat(oldJD.split(', ')).sort().join(',\n')},
//                     HTMLclass: 'cluster'
//                 }
//                 plan_config.push(temp)
//                 node.children.push(temp)
//                 plan_names.push(temp.text.name)
//             }
//         })
//     } else {
//         console.log(oldJD)
//         console.log('cannot find in config')
//     }
//
// }

// check if the given oldJD can separate sth. out
const notValidSepHere = (oldJD) => {
    let newClustersString = item.sepCluster[oldJD]
    let newClusters = newClustersString.substring(1, newClustersString.length - 1).split('},{') //array
    let nodeNameList = names.filter(name =>
        ArrayContainChecker(name.split(',\n'), oldJD.split(', '))
    )
    let boo = false
    nodeNameList.forEach(name => {
        let nameList = name.split(',\n')
        let count = 0
        newClusters.forEach(element => {
            if (element.split(', ').filter(el => nameList.includes(el)).length > 0) {
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
    return names.some(name => ArrayContainChecker(name.split(',\n'), JD))
}

const filterListForCluster = (JD, cluster) => {
    JD = JD.split(', ')
    let clusterArray = cluster.split(',\n')
    return ArrayContainChecker(clusterArray, JD)
}

const getIndexInConfig = (config, oldJD) => {
    let cluList = oldJD.split(', ')
    for (let i = 1; i < config.length; i++) {
        if (config[i].HTMLclass === 'cluster' && ArrayContainChecker(config[i].text.name.split(',\n'), cluList)) {
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

// jquery functions
jQuery.fn.changeWordToPrefix = function () {
    let o = $(this[0])
    o.text(function (i, oldText) {
        return toggleWordToPrefix(oldText, wordToPrefix)
    });
    return this
}

jQuery.fn.changePrefixToWord = function () {
    let o = $(this[0])
    o.text(function (i, oldText) {
        return toggleWordToPrefix(oldText, prefixToWord)
    });
    return this
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
                curr.text() : toggleWordToPrefix(curr.text(), prefixToWord), $(this).text())
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