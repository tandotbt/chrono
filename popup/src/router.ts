import { createRouter, createMemoryHistory } from "vue-router";
import Index from "@/views/Index.vue";
import Initiate from "@/views/Initiate.vue";
import InitiateMnemonic from "@/views/InitiateMnemonic.vue";
import Login from "@/views/Login.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import Send from "@/views/Send.vue";
import Confirmation from "@/views/Confirmation.vue";

let router = createRouter({
	history: createMemoryHistory(),
	routes: [
		{
			path: "/",
			name: "index",
			component: Index,
		},
		{
			path: "/login",
			name: "login",
			component: Login,
		},
		{
			path: "/initiate",
			name: "initiate",
			component: Initiate,
		},
		{
			path: "/initiate-mnemonic/:passphrase",
			name: "initiateMnemonic",
			component: InitiateMnemonic,
		},
		{
			path: "/forgot-password",
			name: "forgotPassword",
			component: ForgotPassword,
		},
		{
			path: "/send",
			name: "send",
			component: Send,
		},
		{
			path: "/confirmation",
			name: "confirmation",
			component: Confirmation,
		},
	],
});

export default router;
