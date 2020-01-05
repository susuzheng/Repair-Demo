let config = {
    container: "#tree",
    // rootOrientation: 'WEST'
}, chart_config, tree_config, plan_config, initList;

const drawInit = (item) => {
    tree_config = [config]
    plan_config = [config]

    initList = [...Array(Number(item.attrNum)).keys()].map(x => x.toString())
    let cluNodeName = initList.join(', ')
    let parent_node = {
        // innerHTML: "<p class='node-name'>" + cluNodeName + "</p>",
        text: {name: cluNodeName},
        HTMLclass: 'cluster',
        sep: [],
        children: []
    }
    plan_config.push(parent_node)

    let parent_node1 = {
        // innerHTML: "<p class='node-name'>" + cluNodeName + "</p>",
        text: {name: cluNodeName},
        HTMLclass: 'cluster',
        sep: [],
        children: []
    }
    tree_config.push(parent_node1)

    // init as plan configuration
    chart_config = tree_config

}