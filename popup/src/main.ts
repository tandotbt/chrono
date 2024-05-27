import { createApp } from "vue";
import App from "@/App.vue";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import "vuetify/dist/vuetify.min.css";
import _ from "underscore";
import axios from "axios";
import moment from "moment";
import router from "@/router";
import { Buffer } from "buffer";

import "@mdi/font/css/materialdesignicons.css";
import { createPinia } from "pinia";

declare global {
	interface Window {
		_: typeof _;
		axios: typeof axios;
		moment: typeof moment;
		Event: typeof Event;
		Buffer: typeof Buffer;
	}
}

// Assign values to global window variables
window._ = _;
window.axios = axios;
window.moment = moment;
window.Event = Event;
window.Buffer = Buffer;
// Vue.prototype.moment = moment
moment.locale("en-gb", {
	relativeTime: {
		future: "in %s",
		past: "%s ago",
		s: "%d secs",
		ss: "%d secs",
		m: "%d min",
		mm: "%d mins",
		h: "%d hr",
		hh: "%d hrs",
		d: "%d day",
		dd: "%d days",
		M: "%d month",
		MM: "%d months",
		y: "%d year",
		yy: "%d years",
	},
});
moment.locale("en-gb");

// Vue.prototype.rules = require('./utils/rules')
// Vue.mixin(mixin)

const pinia = createPinia();
const vuetify = createVuetify({
	icons: {
		defaultSet: "mdi",
		aliases,
		sets: {
			mdi,
		},
	},
	theme: {
		themes: {
			light: {
				dark: true,
				colors: {
					bg: "#191919",
					"bg-lighten1": "#2e2e2e",
					error: "#ff7f3c",
					inputbg: "#1d1e1f",
					text: "#6e6e73",
					"text-lighten1": "#9999a0",
					"text-lighten2": "#b7b7bb",
					primary: "#2A8BA9",
					point: "#f6a14c",
					pointred: "#ff4142",
					"piontred-lighten1": "#ff3a40",
					pointblue: "#3E2A8C",
					"pointblue-darken1": "#2c1e65",
					"pointblue-darken2": "#1b123f",
					pointyellow: "#f0b90b",
					"pointyellow-lighten1": "#eec23f",
					pointlink: "#1d9bf0",
					"pointlink-lighten1": "#8ed1ff",
				},
			},
		},
	},
	components,
	directives,
});
createApp(App).use(router).use(pinia).use(vuetify).mount("#app");
