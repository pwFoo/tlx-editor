(function() {
	"use strict";
	const formChild = (element) => {
		if(!element) return false;
		if(element.parentElement instanceof HTMLFormElement) return true;
		return formChild(element.parentElement);
	}
	class tlxEditor extends HTMLElement {
		static get attributes() {
			return {
				
			}
		}
		 static create(config,el=document.createElement("tlx-chart")) {
			 Object.setPrototypeOf(el,tlxEditor.prototype);
			 for(let key in tlxEditor.attributes) {
				 tlx.setAttribute(el,key,tlxEditor.attributes[key]);
			 }
			 Object.assign(el,config);
			 return el;
		 }
		linkState(property) {
			const node = this,
				f = super.linkState(property);
			return function(event) {
				if(this.validate(event)) f(event);
			}
		}
		render(attributes) {
			// if already inside a form, then fields do not need to be wrapped in forms
			const isform = formChild(this);
			if(!attributes) { // if attributes not passed, then get them from the parent custom tag
				attributes = {};
				for(let attribute of [].slice.call(this.attributes)) {
					attributes[attribute.name] = tlx.getAttribute(this,attribute.name);
				}
			}
			// resolve options, which is a special addition that supports validation on input fields, e.g. typing in a specific value
			!attributes.options || (this.options = attributes.options = tlx.resolve(attributes.options,this));
			// resolve value which is needed for radiogroup handling
			!attributes.value || (this.value = tlx.resolve(attributes.value,this));
			const type = attributes.type;
			let vnode;
			if(type==="select-one") vnode = tlx`<span><label style="padding-right:.5em"></label> <select>${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			else if(type==="select-multiple") vnode = tlx`<span><label style="padding-right:.5em"></label> <select style="vertical-align:top" multiple>${attributes.options.map(value => (tlx`<option>${value}</option>`))}</select></span>`;
			else if(type==="radiogroup") {
				// generate a random name to tie radios together
				// almost impossible for something else to get the same name
				// 1 chance in 2^53 assuming 2 radiogroups are created in the same millisecond
				const name = Date.now()+(String(Math.random()).substring(2)); 
				vnode = tlx`<span><label style="padding-right:.5em"></label> <span>${attributes.options.map(value => (tlx`<span><input type="radio" name="${name}" value="${value}">${value}</input></span>`))}</span></span>`;
			} else if(type==="textarea") {
				vnode = tlx`<span><label style="padding-right:.5em"></label> <textarea style="vertical-align:top;" ${this.options ? "required" : ""}></textarea></span>`;
			} else if(type==="rating") {
				const stars = [],
					max = (attributes.max || 5)+1,
					value = this.value || 0;
				for(let i=1;i<max;i++) {
					if(i<=value) {
						stars.push("&#9733;");
					} else {
						stars.push("&#9734;");
					}
				}
				const me = this;
				function onClick(event) {
					me.value = tlx.fromJSON(event.target.value);
					me.onchange(event);
					return false;
				};
				vnode = tlx`<span><label style="padding-right:.5em"></label> <span>${stars.map((star,i) => tlx`<a href="javascript:false" style="text-decoration:none;color:inherit" value="${i+1}" onclick="${onClick}">${star}</href>`)}</span></span>`;
			} else {
				vnode = tlx`<span><label style="padding-right:.5em"></label> <input type="${type}" ${this.options ? "required" : ""}></span>`;
			}
			// add all the passed attributes except label to the input element
			for(let name in attributes) {
				const value = attributes[name];
				if(name==="label") {
					const label = vnode.getElementsByTagName("label")[0];
					label.children.push(value);
				} else if(name!=="type"){
					const input = vnode.children.filter(child => ["select","span","textarea","input"].includes(child.nodeName))[0]; 
					typeof(input.attributes[name])!=="undefined" || (input.attributes[name] = value);
					if(input.nodeName==="span") { // radiogroup or rating
						for(let child of input.children[0]) {
							child.children[1]!=this.value || (child.children[0].attributes.checked = true);
						}
					}
				}
			}
			// splice in a form if not already a form
			if(!isform) {
				const form = new tlx.VNode({nodeName:"form",attributes:{}});
				form.children = vnode.children;
				vnode.children = [form];
			}
			return vnode;
		}
		validate(event) {
			const target = event.target,
				value = tlx.fromJSON(target.value),
				title = target.getAttribute("title"),
				options = this.options;
			// set a CSS invalid style in case one has not been provided
			target.style.invalid || (target.style.invalid = "{border: 2px solid red;}");
			target.orginalTitle!=null || (target.orginalTitle = title || "");
			if(options) {
				const choices = [].slice.call(options);
				if(!choices.some(option => option===value || tlx.fromJSON(option.value)===value)) {
					target.setCustomValidity("Must be one of: " + JSON.stringify(options));
				} else {
					target.setCustomValidity("");
				}
			}
			if(target.validationMessage) {
				// us the title attribute as the error message in case the filed is not in a form
				// browsers will not display their standard error floats when field are not in forms
				target.setAttribute("title",target.validationMessage);
				return;
			}
			target.setAttribute("title",target.orginalTitle);
			return true;
		}
	}
	//document.registerTlxComponent("tlx-editor",tlxEditor);
	customElements.define("tlx-editor",tlxEditor);
	
	if(typeof(module)!=="undefined") module.exports = tlxEditor;
	if(typeof(window)!=="undefined") window.tlxEditor = tlxEditor;
})();