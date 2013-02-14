enyo.kind({
	name: "Sandbox",
	classes: "deimos_panel_center sandbox",
	events: {
		onDesignRendered: "",
		onSelected: ""
	},
	components: [
		{name: "model", kind: "Component"},
		{kind: "Serializer"},
	],
	previewDomEvent: function(e) {
		if (e.dispatchTarget.isDescendantOf(this)) {
			//TODO: Make this more-sophisticated by using the dispatchTarget to determine what to filter
			//TODO: In particular, filter "drag" events for slider knobs (but not other controls)
			if (e.type == "down" || e.type=="tap" || e.type=="click") {
				this.trySelect(e.dispatchTarget instanceof enyo.Control ? e.dispatchTarget : null);
				if (e.preventDefault) {
					e.preventDefault();
				}
				return true;
			} else {
				//TODO: remove this when we've figured out how to do this a bit better
				//console.log("ignoring "+e.type+" for "+e.dispatchTarget.name);
			}
		}
	},
	rendered: function() {
		this.inherited(arguments);
		this.doDesignRendered();
	},
	trySelect: function(inControl) {
		var c = inControl;
		while (c && (c.owner != this.$.model)) {
			c = c.parent;
		}
		this.select(c);
		this.doSelected({component: c});
	},
	// load a components block into the sandbox
	load: function(inDocument) {
		this.destroyClientControls();
		this.createComponents([inDocument], {owner: this.$.model});
		this.doSelected(this.children[0]);
	},
	// return a components block
	getTree: function() {
		if (this.children && this.children.length > 0) {
		  return this.$.serializer._serializeComponent(this.children[0], this.$.model);
		}
		return {};
	},
	
});
