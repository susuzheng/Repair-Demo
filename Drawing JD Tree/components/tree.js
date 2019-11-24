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
let config = {container: "#right"}, chart_config = [config]

const drawInit = (attrNum) => {
    let oneToN = '0'
    for (let i = 1; i <attrNum; i++) {
        oneToN += ',' + i
    }
    let parent_node = {
        text: {name: oneToN},
        HTMLclass: 'cluster'
    }
    chart_config.push(parent_node)


}