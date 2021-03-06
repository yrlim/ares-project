/* global ares, Phonegap */

/**
 * Kind that define a generic row widget
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.Row",
	kind: "FittableColumns",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		label: "",
		name: "",
		value: "",
		jsonSection: "",
		platform: ""
	},
	components: [
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.CheckBoxRow",
	kind: "Phonegap.ProjectProperties.Row",
	debug: false,
	published: {
		activated: false
	},
	components: [
		{
			kind: "onyx.Checkbox",
			name: "ConfigurationCheckBox",
			classes: "ares-project-properties-drawer-row-check-box-label",
			onchange: "updateConfigurationValue"
		},
		{name: "label", content: this.label}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.name);
	},

	/**
	 * @private
	 */
	valueChanged: function () {
		this.$.ConfigurationCheckBox.setChecked(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());

		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});

/**
 * Define a row containing an Input widget.
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.InputRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		value: "",
		inputTip: ""
	},
	components: [
		{name: "label", classes: "ares-project-properties-drawer-row-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium",
			components: [{
					kind: "onyx.Input",
					name: "ConfigurationInput",
					onchange: "updateConfigurationValue"
				}
			]
		}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputTipChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/** @private */
	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
	},

	/** @private */
	inputTipChanged: function () {
		this.$.ConfigurationInput.setAttribute("title", this.inputTip);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.BuildOption",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	published: {
		pan: ""
	},
	debug: false,
	components: [
		{
			kind: "onyx.Checkbox",
			name: "ConfigurationCheckBox",
			classes: "ares-project-properties-drawer-row-check-box-label",
			onchange: "updateConfigurationValue"
		},
		{name: "label", content: this.label}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	valueChanged: function () {
		this.$.ConfigurationCheckBox.setChecked(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		this.displayConfigXmlPanel();
		return true;
	},
	displayConfigXmlPanel: function(){

		if (this.name === "autoGenerateXML"){
			this.trace("auto-generate config.xml is enabled: ", this.getValue());

			if (this.pan) {
				if(this.getValue()) {
					this.pan.setClassAttribute("ares-project-properties-targetsRows-display");
				} else {
					this.pan.setClassAttribute("ares-project-properties-targetsRows-hide");
				}
			}
		}

	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]);
		this.displayConfigXmlPanel();
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name] = this.getValue();
	}
});



enyo.kind({
	name: "Phonegap.ProjectProperties.AccessRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	components: [
		{name: "label", classes: "ares-project-properties-drawer-row-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium",
			components: [{
					kind: "onyx.Input",
					name: "ConfigurationInput",
					onchange: "updateConfigurationValue"
				}
			]
		}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
	},

	/**
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	valueChanged: function () {
		this.$.ConfigurationInput.setValue(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inSender.getValue());
		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config.access.origin);
		this.valueChanged();
	},
	/** @public */
	getProjectConfig: function (config) {
		config.access.origin = this.getValue();
	}
});

/**
 * This Kind define a row containing a Picker widget and attached to a drawer in {Phonegap.ProjectProperties}
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.PickerRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		contentValue: ""
	},
	components: [
		{name: "label",	classes: "ares-project-properties-drawer-row-label"},
		{
			kind: "onyx.PickerDecorator",
			components: [
				{kind: "onyx.PickerButton", classes: "ares-project-properties-picker"},
				{kind: "onyx.Picker", name: "ConfigurationPicker", onSelect: "updateConfigurationValue"}
			]
		}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.contentValueChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * Set the content of the row's picker when the row is created.
	 * @ private
	 */
	contentValueChanged: function () {
		enyo.forEach(this.contentValue, function (inValue) {
			var itemState = inValue === this.value ? true : false;
			this.$.ConfigurationPicker.createComponent({content: inValue, active: itemState});
		}, this);
	},

	/**
	 * This function change the displayed value of the picker to the parameter "inContent".
	 * The parameter must be contained in an existing picker's item.
	 * @param  {String} inContent A String value originated from the attribut of "project.json
	 *                            "associated to the picker widget.
	 * @private
	 */
	activatePickerItemByContent: function(inContent){
		for (var key in this.$.ConfigurationPicker.$) {
		    if(this.$.ConfigurationPicker.$[key].kind === "onyx.MenuItem"){
			this.$.ConfigurationPicker.$[key].active = false;
				if(this.$.ConfigurationPicker.$[key].content === inContent){
					this.$.ConfigurationPicker.setSelected(this.$.ConfigurationPicker.$[key]);
				}
		    }
		  }
	},

	/**
	 * @private
	 */
	valueChanged: function(){
		this.activatePickerItemByContent(this.value);
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateConfigurationValue: function (inSender, inValue) {
		this.setValue(inValue.content);

		return true;
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.name]);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
});


enyo.kind({
	name: "Phonegap.ProjectProperties.SDKVersionRow",
	kind: "Phonegap.ProjectProperties.PickerRow",

	/** 
	 * Show in a tool tip the Android versions associated to each SDK versions
	 *  
	 * @private
	 */
	updateToolTip: function() {
		for (var key in this.$.ConfigurationPicker.$) {
		    if(this.$.ConfigurationPicker.$[key].kind === "onyx.MenuItem"){
			this.$.ConfigurationPicker.$[key].setAttribute("title", Phonegap.UIConfiguration.androidSdkVersionsToolTip[this.$.ConfigurationPicker.$[key].content]);
		    }
		  }
	},

	/** @public */
	setProjectConfig: function (config) {
		this.updateToolTip();
		this.setValue(config[this.jsonSection][this.name]);
	},

	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.name] = this.getValue();
	}
	
});

/**
 * Define a row to let the user add the path to an Android icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.AndroidImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	published: {
		density: "",

		inputTip: "",
		activated: false,
		status: false,
		buttonTip: ""
	},
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	components: [{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium",
			components: [
				{
					kind: "onyx.Input",
					name: "AndroidImgPath",
					classes: "enyo-unselectable"
				}
			]
		},
		{kind: "onyx.IconButton", name:"AndroidImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"},
		{
			kind: "onyx.PickerDecorator",
			classes: "ares-project-properties-picker-small",
			components: [
				{kind: "onyx.PickerButton"},
				{
					kind: "onyx.Picker",
					name: "AndroidDensity",
					onSelect: "updateAndroidIconDensity",
					components: [
						{content: "ldpi"},
						{content: "mdpi", active: true},
						{content: "hdpi"},
						{content: "xdpi"}
					]
				}
			]
		}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputTipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttonTipChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @ private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	densityChanged: function () {
		this.activatePickerItemByContent(this.density);
	},

	/**
	 * @private
	 */
	activatePickerItemByContent: function(inContent){
		for (var key in this.$.AndroidDensity.controls) {
		    if(this.$.AndroidDensity.controls[key].kind === "onyx.MenuItem"){
			this.$.AndroidDensity.controls[key].active = false;
				if(this.$.AndroidDensity.controls[key].content === inContent){
					this.$.AndroidDensity.setSelected(this.$.AndroidDensity.controls[key]);
				}
		    }
		  }
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateAndroidIconDensity: function (inSender, inValue) {
		this.setDensity(inValue.content);

		return true;
	},

	/** @private */
	valueChanged: function () {
		this.$.AndroidImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputTipChanged: function () {
		this.$.AndroidImgPath.setAttribute("title", this.inputTip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.AndroidImgButton.show();
			this.statusChanged();
		} else {
			this.$.AndroidImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.AndroidImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.AndroidImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttonTipChanged: function () {
		this.$.AndroidImgButton.setAttribute("title", this.buttonTip);
	},

	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name]["android"].src);
		this.setDensity(config[this.name]["android"].density);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name][this.platform].src = this.getValue();
		config[this.name][this.platform].density = this.getDensity();
	}
});

/**
 * Define a row to let the user add the path to an  icon or a splash screen image into the file "config.xml".
 */
enyo.kind({
	name: "Phonegap.ProjectProperties.ImgRow",
	kind: "Phonegap.ProjectProperties.Row",
	classes: "ares-project-properties-drawer-row",
	debug: false,
	events: {
		onInputButtonTap: "",
		onPathChecked: ""
	},
	published: {
		height: "",
		width: "",

		inputTip: "",
		activated: false,
		status: false,
		buttonTip: ""
	},
	components: [
		{
			name: "label",
			classes: "ares-project-properties-drawer-row-label"
		},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-medium",
			components: [{
					kind: "onyx.Input",
					name: "ImgPath",
					classes: "enyo-unselectable"
				}
			]
		},
		{kind: "onyx.IconButton", name:"ImgButton", src: "$project-view/assets/images/file-32x32.png", ontap: "pathInputTap"},
		{content: "Length", classes: "ares-project-properties-drawer-row-attribut-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "ImgHeight",
					onchange: "updateIconHeightValue"
				}
			]
		},
		{content: "Width", classes: "ares-project-properties-drawer-row-attribut-label"},
		{
			kind: "onyx.InputDecorator",
			classes: "ares-project-properties-input-small",
			components: [{
					kind: "onyx.Input",
					name: "ImgWidth",
					onchange: "updateIconWidhtValue"
				}
			]
		}
	],

	/**
	 * @private
	 */
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();

		this.valueChanged();
		this.inputTipChanged();
		this.activatedChanged();
		this.statusChanged();
		this.buttonTipChanged();

		this.heightChanged();
		this.widthChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/**
	 * @private
	 */
	heightChanged: function(){
		this.$.ImgHeight.setValue(this.height || "");
	},

	/**
	 * @private
	 */
	widthChanged: function(){
		this.$.ImgWidth.setValue(this.width  || "");
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateIconHeightValue: function (inSender, inValue) {
		this.setHeight(inSender.getValue());

		return true;
	},

	/**
	 * @param  {Object} inSender the event sender
	 * @param  {Object} inValue  the event value
	 *
	 * @private
	 */
	updateIconWidhtValue: function (inSender, inValue) {
		this.setWidth(inSender.getValue());

		return true;
	},

	/** @private */
	valueChanged: function () {
		this.$.ImgPath.setValue(this.value);
		this.setStatus(true);
	},
	/** @private */
	inputTipChanged: function () {
		this.$.ImgPath.setAttribute("title", this.inputTip);
	},
	/** @private */
	activatedChanged: function () {
		if (this.activated) {
			this.$.ImgButton.show();
			this.statusChanged();
		} else {
			this.$.ImgButton.hide();
		}
	},
	/** @private */
	statusChanged: function () {
		if (this.status) {
			this.$.ImgButton.setSrc("$project-view/assets/images/file-32x32.png");
		} else {
			this.$.ImgButton.setSrc("$project-view/assets/images/file_broken-32x32.png");
		}
	},
	/** @private */
	buttonTipChanged: function () {
		this.$.ImgButton.setAttribute("title", this.buttonTip);
	},

	/** @private */
	pathInputTap: function (inSender, inEvent) {
		var header = "";
		if (this.name === 'icon') {
			header = $L("Select an icon file");
		} else if (this.name === 'splashScreen') {
			header = $L("Select a splashscreen file");
		}
		this.doInputButtonTap({header: header});
		return true;
	},
	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.name][this.platform].src);
		this.setHeight(config[this.name][this.platform].height);
		this.setWidth(config[this.name][this.platform].width);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.name][this.platform].src = this.getValue();
		config[this.name][this.platform].height = this.getHeight();
		config[this.name][this.platform].width = this.getWidth();
	}
});

enyo.kind({
	name: "Phonegap.ProjectProperties.KeySelector",
	debug: false,
	kind: "Phonegap.ProjectProperties.Row",
	published: {
		keys: undefined,
		activeKeyId: undefined,
		provider: undefined
	},
	components: [	
		{name: "label",	classes: "ares-project-properties-drawer-row-label"},
		{name: "loadingSingingKeys", content: "Loading signing keys ..."} ,
		{name: "noSigningKeys", content: "No signing keys for this platform", showing: false},
		{
			name: "signingKeysContainer",
			showing: false,			
			kind: "FittableRows",
			components: [
				{
					name: "keyPicker", kind: "onyx.PickerDecorator", onSelect: "selectKey",
					components: [
						{kind: "onyx.PickerButton",	content: "Choose...", classes: "ares-project-properties-picker"}, 
						{kind: "onyx.Picker", name: "keys"}
					]
				},
				

				// android, ios & blackberry: key password
				{	
					kind: "onyx.InputDecorator", classes: "ares-project-properties-margin-right", showing: false, name: "passwdFrm",
					components: [						
						{name: "keyPasswd",	kind: "onyx.Input",	classes: "ares-project-properties-password", type: "password", placeholder: "Password"}
					]
				},
			
				// android-only: keystore password
				{
					kind: "onyx.InputDecorator", name: "keystorePasswdFrm", showing: false, classes: "ares-project-properties-margin-right",
					components: [
						{name: "keystorePasswd", kind: "onyx.Input", classes: "ares-project-properties-password", type: "password", placeholder: "Keystore password"}
					]
				},
				{ kind: "onyx.Button", content: "Save",	ontap: "savePassword", showing: false, classes: "ares-project-properties-margin-right", name: "saveButton"}				
			]
		}
	],
	create: function () {
		ares.setupTraceLogger(this);
		this.inherited(arguments);
		this.labelChanged();
		this.setProvider(Phonegap.ProjectProperties.getProvider());
		
		this.activeKeyIdChanged();
	},

	/**
	 * Set the content of the row's label when the row is created
	 * @private
	 */
	labelChanged: function () {
		this.$.label.setContent(this.label);
	},

	/** @public */
	setProjectConfig: function (config) {
		this.setValue(config[this.jsonSection][this.platform] && config[this.jsonSection][this.platform].keyId);
	},
	/** @public */
	getProjectConfig: function (config) {
		config[this.jsonSection][this.platform].keyId = this.getValue();
	},

	/**
	 * @private
	 */
	keysChanged: function () {		
		// Sanity
		this.keys = this.keys || [];

		//Clear the content of the Signing keys picker.
		this.clearPickerContent();		

		var createPickerItem = function(item,state) {
			
			//check if the picker item wasn't already created.
			if(this.$.keys.$[item.id] === undefined){
				this.$.keys.createComponent({
					name: item.id,
					content: item.title,
					active: state					
				});	
			}			
		};

		this.$.loadingSingingKeys.hide();		

		if(this.keys.length !== 0){

			this.$.signingKeysContainer.show();
			this.$.noSigningKeys.hide();

			// Fill
			enyo.forEach(this.keys, function (key) {
				if(key.id === this.getValue()) {
					createPickerItem.call(this, key, true);
				} else {
					createPickerItem.call(this, key, false);
				}				
			}, this);

		} else {
			this.$.signingKeysContainer.hide();
			this.$.noSigningKeys.show();
		}
	},
	/**
	 * @private
	 */
	activeKeyIdChanged: function (old) {
		var key = this.getKey(this.activeKeyId);		
		
		if (key) {
			// One of the configured keys
			if (this.platform === 'ios' || this.platform === 'blackberry') {
				// property named '.password' is defined by Phonegap
				this.$.keyPasswd.setValue(key.password || "");
			} else if (this.platform === 'android') {
				// properties named '.key_pw'and 'keystore_pw' are defined by Phonegap
				this.$.keyPasswd.setValue(key.key_pw || "");
				this.$.keystorePasswd.setValue(key.keystore_pw || "");
				this.$.keystorePasswdFrm.show();
			}
		}
	},
	/**
	 * @protected
	 */
	getKey: function (keyId) {
		if (keyId) {
			return enyo.filter(this.keys, function (key) {
				return key.id === keyId;
			}, this)[0];
		} else {
			return undefined;
		}
	},
	/**
	 * @private
	 */
	selectKey: function (inSender, inValue) {
		this.trace("sender:", inSender, "value:", inValue);
		enyo.forEach(this.keys, function (key) {
			if (key.title === inValue.content) {
				this.setActiveKeyId(key.id);
				this.trace("selected key:", key);
			}
		}, this);
		this.$.passwdFrm.show();		
		this.$.saveButton.show();
	},
	/**
	 * @private
	 */
	clearPickerContent: function(){
		
		for (var key in this.$.keyPicker.$) {
					
			if (this.$.keyPicker.$[key].kind === "onyx.MenuItem"){							
				this.$.keyPicker.$[key].destroy();
			}		
		}
		this.$.keyPicker.render();
	},
	/**
	 * Return a signing key object from the displayed (showing === true) widgets
	 * @private
	 */
	getShowingKey: function () {
		var key = this.getKey(this.activeKeyId);
		if (!key) {
			return undefined;
		} else if (this.platform === 'ios' || this.platform === 'blackberry') {
			// property name '.password' is defined by Phonegap
			key.password = this.$.keyPasswd.getValue();
		} else if (this.platform === 'android') {
			// properties names '.key_pw'and 'keystore_pw' are defined by Phonegap
			key.key_pw = this.$.keyPasswd.getValue();
			key.keystore_pw = this.$.keystorePasswd.getValue();
		}
		return key;
	},
	/**
	 * @private
	 */
	savePassword: function (inSender, inValue) {
		this.trace("sender:", inSender, "value:", inValue);		
		var key = this.getShowingKey();		
		this.trace("platform:", this.platform, "key:", key);		
		this.provider.setKey(this.platform, key);
	}
});
