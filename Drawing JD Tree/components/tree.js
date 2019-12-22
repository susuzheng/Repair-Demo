// let config = {
//         container: "#right"
//     },
//     parent_node = {
//         text: {name: "Parent node"},
//         HTMLid: '0'
//     },
//     first_child =  {
//         parent: parent_node,
//         text: {name: "First child"},
//         HTMLid: '1'
//     },
//     second_child = {
//         parent: parent_node,
//         text: {name: "Second child"},
//         HTMLid: '2'
//     }
//
// let chart_config = [config, parent_node, first_child, second_child]
let config = {
    container: "#tree",
    // rootOrientation: 'WEST'
}, chart_config, tree_config, plan_config, names, initList;

const drawInit = (item) => {
    tree_config = [config]
    plan_config = [config]
    names = []

    let set = new Set()
    let keyArray = item.allSepList
    keyArray.forEach(element =>
        element.split(', ').forEach(element => {
            if (element !== '') {
                set.add(element)
            }
        }))
    initList = Array.from(set).sort()
    let cluNodeName = initList.join(', ')
    let parent_node = {
        innerHTML: "<p class='JMeasure'>" +
            +0 +
            "</p>" +
            "<p class='node-name'>" + cluNodeName + "</p>",
        text: {name: initList.slice()},
        HTMLclass: 'cluster',
        JMeasure: 0,
    }
    plan_config.push(parent_node)

    let parent_node1 = {
        innerHTML: "<p class='JMeasure'>" +
            +0 +
            "</p>" +
            "<p class='node-name'>" + cluNodeName + "</p>",
        text: {name: initList.slice()},
        HTMLclass: 'cluster',
        JMeasure: 0,
    }
    tree_config.push(parent_node1)

    names.push(parent_node.text.name)

    // init as plan configuration
    chart_config = tree_config
}