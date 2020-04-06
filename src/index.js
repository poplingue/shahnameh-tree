import go from 'gojs';

class Game {

    ContinuousForceDirectedLayout() {
        go.ForceDirectedLayout.call(this);
        this._isObserving = false;
    }

    constructor() {
        this.myDiagram = null;

        go.Diagram.inherit(this.ContinuousForceDirectedLayout, go.ForceDirectedLayout);

        this.ContinuousForceDirectedLayout.prototype.isFixed = function (v) {
            return v.node.isSelected;
        };

        // optimization: reuse the ForceDirectedNetwork rather than re-create it each time
        this.ContinuousForceDirectedLayout.prototype.doLayout = function (coll) {
            if (!this._isObserving) {
                this._isObserving = true;
                // cacheing the network means we need to recreate it if nodes or links have been added or removed or relinked,
                // so we need to track structural model changes to discard the saved network.
                let lay = this;
                this.diagram.addModelChangedListener(function (e) {
                    // modelChanges include a few cases that we don't actually care about, such as
                    // "nodeCategory" or "linkToPortId", but we'll go ahead and recreate the network anyway.
                    // Also clear the network when replacing the model.
                    if (e.modelChange !== "" ||
                        (e.change === go.ChangedEvent.Transaction && e.propertyName === "StartingFirstTransaction")) {
                        lay.network = null;
                    }
                });
            }
            let net = this.network;
            if (net === null) {  // the first time, just create the network as normal
                this.network = net = this.makeNetwork(coll);
            } else {  // but on reuse we need to update the LayoutVertex.bounds for selected nodes
                this.diagram.nodes.each(function (n) {
                    let v = net.findVertex(n);
                    if (v !== null) v.bounds = n.actualBounds;
                });
            }
            // now perform the normal layout
            go.ForceDirectedLayout.prototype.doLayout.call(this, coll);
            // doLayout normally discards the LayoutNetwork by setting Layout.network to null;
            // here we remember it for next time
            this.network = net;
        };

        this.init();
    }

    init() {
        if (window.goSamples) goSamples();  // init for these samples -- you don't need to call this
        let $ = go.GraphObject.make;  // for conciseness in defining templates

        this.myDiagram = $(go.Diagram, "shahnameh-genealogy",  // must name or refer to the DIV HTML element
            {
                initialAutoScale: go.Diagram.Uniform,  // an initial automatic zoom-to-fit
                contentAlignment: go.Spot.Center,  // align document to the center of the viewport
                layout:
                    $(this.ContinuousForceDirectedLayout,  // automatically spread nodes apart while dragging
                        {defaultSpringLength: 30, defaultElectricalCharge: 100}),
                // do an extra layout at the end of a move
                "SelectionMoved": function (e) {
                    e.diagram.layout.invalidateLayout();
                }
            });

        // dragging a node invalidates the Diagram.layout, causing a layout during the drag
        this.myDiagram.toolManager.draggingTool.doMouseMove = function () {
            go.DraggingTool.prototype.doMouseMove.call(this);
            if (this.isActive) {
                this.diagram.layout.invalidateLayout();
            }
        };

        // define each Node's appearance
        this.myDiagram.nodeTemplate =
            $(go.Node, "Auto",  // the whole node panel
                // define the node's outer shape, which will surround the TextBlock
                $(go.Shape, "Circle",
                    {
                        fill: "CornflowerBlue",
                        stroke: "black",
                        spot1: new go.Spot(0, 0, 5, 5),
                        spot2: new go.Spot(1, 1, -5, -5)
                    }),
                $(go.TextBlock,
                    {
                        font: "bold 10pt helvetica, bold arial, sans-serif",
                        textAlign: "center",
                        maxSize: new go.Size(100, NaN)
                    },
                    new go.Binding("text", "text"))
            );
        // the rest of this app is the same as samples/conceptMap.html

        // replace the default Link template in the linkTemplateMap
        this.myDiagram.linkTemplate =
            $(go.Link,  // the whole link panel
                $(go.Shape,  // the link shape
                    {stroke: "black"}),
                $(go.Shape,  // the arrowhead
                    {toArrow: "standard", stroke: null}),
                $(go.Panel, "Auto",
                    $(go.Shape,  // the label background, which becomes transparent around the edges
                        {
                            fill: $(go.Brush, "Radial", {
                                0: "rgb(240, 240, 240)",
                                0.3: "rgb(240, 240, 240)",
                                1: "rgba(240, 240, 240, 0)"
                            }),
                            stroke: null
                        }),
                    $(go.TextBlock,  // the label text
                        {
                            textAlign: "center",
                            font: "10pt helvetica, arial, sans-serif",
                            stroke: "#555555",
                            margin: 4
                        },
                        new go.Binding("text", "text"))
                )
            );

        // create the model for the concept map
        let nodeDataArray = [
            {key: 1, text: "Zahhâk"},
            {key: 2, text: "Mehr-Âb Roi de Kâbol"},
        ];
        let linkDataArray = [
            {from: 2, to: 1, text: "descendant"},
        ];
        this.myDiagram.model = new go.GraphLinksModel(nodeDataArray, linkDataArray);
    }

    reload() {
        //myDiagram.layout.network = null;
        let text = myDiagram.model.toJson();
        this.myDiagram.model = go.Model.fromJson(text);
        //myDiagram.layout =
        //  go.GraphObject.make(this.ContinuousForceDirectedLayout,  // automatically spread nodes apart while dragging
        //    { defaultSpringLength: 30, defaultElectricalCharge: 100 });
    }

}

new Game();
