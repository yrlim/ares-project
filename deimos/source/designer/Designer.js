enyo.kind({
	name: "Designer",
	events: {
		onSelect: "",
		onChange: ""
	},
	components: [
		{name: "selectionOutline", kind: "DesignerOutline", style: "border: 5px dotted rgba(255, 146, 38, 0.7); position: absolute; z-index: 1000"},
		{name: "containerOutline", kind: "DesignerOutline", style: "border: 5px solid rgba(24, 24, 255, 0.3); position: absolute; z-index: 1000"},
		{kind: "FittableRows", classes: "deimos_panel_center  enyo-fit", components: [
			{name: "sandbox", fit: true, kind: "Sandbox", onSelected: "doSelect"}
		]}
	],
	style: "outline: none; position: relative;",
	attributes: {
		tabindex: 0
	},
	handlers: {
		onkeyup: "keyup",
		ondragstart: "dragStart",
		ondragover: "dragOver",
		ondrop: "drop"
	},
	getComponents: function() {
		return this.$.sandbox.getTree();
	},
	keyup: function(inSender, inEvent) {
		var ESC = 27;
		if (inEvent.keyCode == ESC) {
			this.selectContainer();
		}
	},
	hideSelection: function() {
		this.$.selectionOutline.outlineControl(null);
		this.$.containerOutline.outlineControl(null);
	},
	selectContainer: function() {
		if (this.selection) {
			this.trySelect(this.selection.container);
		}
	},
	getSelectedContainer: function() {
		var s = this.selection;
		// Remove container adjustment for now; makes designer much more usable
		//if (s && !s.isContainer) {
		//	s = s.container;
		//}
		return s;
	},
	select: function(inControl) {
		this.selection = inControl;
		var b = this.$.sandbox.getControlBounds(inControl);
		this.$.selectionOutline.outlineControl(b);
		this.$.containerOutline.outlineControl(b);
	},
	refresh: function() {
		this.select(this.selection);
		this.$.sandbox.resized();
	},
	load: function(inDocument) {
		this.proxyUnknownKinds(inDocument);
		this.hideSelection();
		this.$.sandbox.load(inDocument);
		this.render();
		this.resized();
	},
	save: function() {
		this.unProxyUnknownKinds(this.$.sandbox);
		var tree = this.$.sandbox.getTree();
		return tree;
	},
	deleteAction: function() {
		if (this.selection) {
			this.selection.destroy();
			this.refresh();
			this.doChange();
		}
	},
	dragStart: function(inSender, inEvent) {
		inEvent.dragInfo = this.selection;
	},
	dragOver: function(inSender, inEvent) {
		if (inEvent.dragInfo) {
			this.trySelect(inEvent.dispatchTarget);
		}
	},
	drop: function(inSender, inEvent) {
		var i = inEvent.dragInfo;
		if (i) {
			enyo.asyncMethod(this, "_drop", i);
			return true;
		}
	},
	_drop: function(inInfo) {
		if (inInfo instanceof enyo.Component) {
			this.dropComponentAction(inInfo);
		} else {
			this.createComponentAction(inInfo);
		}
		this.doChange();
	},
	dropComponentAction: function(inComponent) {
		var c = this.getSelectedContainer();
		if (c && !c.isDescendantOf(inComponent)) { // don't allow dropping onto yourself, or your children
			var props = this.$.serializer._serializeComponent(inComponent, this.$.model);
			this.log(props);
			enyo.asyncMethod(this, function() {
				inComponent.destroy();
				this.createComponentAction(props);
			});
			return true;
		}
		return false;
	},
	createComponentAction: function(inProps) {
		var c = this.getSelectedContainer();
		if ( ! c) {
			// There is no object already created
			c = this.$.sandbox.children[0];
		}

		// The selection objects are moved around in the DOM and the nodes can lose sync with the enyo node
		// cache. Hiding the selection causes the selection nodes to be normalized, preventing any weirdness
		// when rendering new Controls.
		this.hideSelection();
		//
		// create the components
		var b = c.createComponent(inProps, {owner: this.$.model});
		//
		// FIXME: hack name insertion
		if (inProps.content == "$name") {
			b.setContent(b.name);
		}
		// FIXME: hack control insertion
		var p = this.selection && this.selection.parent;
		if (p && p == b.parent) {
			var i = p.children.indexOf(this.selection);
			if (i >= 0) {
				this.moveControl(b, i + 1);
			}
		}
		this.$.sandbox.render();
		this.$.sandbox.resized();
		//
		//this.modify();
		this.select(b);
	},
	moveControl: function(inControl, inIndex) {
		var move = function(inControl, inIndex, inList) {
			enyo.remove(inControl, inList);
			inList.splice(inIndex, 0, inControl);
		};
		// assumes that inControl.container.controls and inControl.parent.children are the same
		// which is not true in general
		move(inControl, inIndex, inControl.parent.children);
		move(inControl, inIndex, inControl.container.controls);
		this.$.sandbox.resized();
	},
	nudgeControl: function(inControl, inDelta) {
		if (inControl) {
			var c = inControl.container;
			var i = c.indexOfControl(inControl);
			this.moveControl(inControl, i + inDelta);
			var p = inControl.parent;
			p.render();
			//this.modify();
			this.select(inControl);
			this.doChange();
		}
	},
	upAction: function(inSender) {
		this.nudgeControl(this.selection, -1);
	},
	downAction: function(inSender) {
		this.nudgeControl(this.selection, 1);
	},
	proxyArray: function(block) {
	    var i;
	    for (i=0; i < block.length; i++) {
	        block[i]=this.proxyUnknownKinds(block[i]);
	    }
        return block;
	},
	proxyUnknownKinds: function(component) {
		var name = component.kind;
		if (!enyo.constructorForKind(name)) {
			component.kind = "Ares.Proxy";
			component.realKind = name;
			component.content = name;
			if (component.name) {
				component.hadName=true;
			}
		}
		var children = component.components;
		if (children) {
			var i;
			for (i=0; i< children.length; i++) {
				children[i] = this.proxyUnknownKinds(children[i]);
			}
		}
		return component;
	},
	unProxyArray: function(block) {
	    var i;
	    for (i=0; i < block.length; i++) {
	        block[i]=this.unProxyUnknownKinds(block[i]);
	    }
        return block;
	},
	unProxyUnknownKinds: function(component) {
		if (component.realKind) {
			component.kindName = component.realKind;
			component.kind = component.realKind;
			delete component.realKind;
			if (!component.hadName) {
				delete component.name;
			}
		}
		delete component.hadName;
		var children = component.children;
		if (children) {
			var i;
			for (i=0; i< children.length; i++) {
				children[i] = this.unProxyUnknownKinds(children[i]);
			}
		}
		return component;
	},
	isRootControl: function(control) {
		return (control === this.$.sandbox.children[0]);
	}
});

enyo.kind({
	name: "DesignerOutline",
	style: "pointer-events: none; position: absolute;",
	showing: false,
	create: function() {
		this.inherited(arguments);
	},
	outlineControl: function(bounds) {
		if (bounds) {
			this.setBounds({left: bounds.left, top: bounds.top, width: bounds.width - 10, height: bounds.height - 10});
			this.show();
		} else {
			this.hide();
		}
	}
});

enyo.kind({
    name: "Ares.Proxy",
	published: {
		realKind: "",
		hadName: false
	},
	create: function() {
		this.inherited(arguments);
	},
	//* @protected
	// override this, and save imported properties
	importProps: function(inProps) {
		var ignoreProp = {container: true, owner: true, published: true};
		this.inherited(arguments);
		if (inProps) {
			for (var n in inProps) {
				if (!ignoreProp[n]) {
					this.published[n] = inProps[n];
				}
			}
		}
	}
});
