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
    },
    chart_config = [], tree_config = [config], plan_config = [config],
    names = [], seps = [], initList;

const drawInit = (item) => {
    let set = new Set()
    let keyArray = Object.keys(item.sepCluster)
    keyArray.forEach(element =>
        element.split(', ').forEach(element => set.add(element))
    )
    initList = Array.from(set)
    let parent_node = {
        text: {name: initList.join(',\n')},
        HTMLclass: 'cluster'
    }
    plan_config.push(parent_node)
    tree_config.push(JSON.parse(JSON.stringify(parent_node)))
    names.push(parent_node.text.name)

    // init as plan configuration
    chart_config = tree_config
}