import { createRouter, createMemoryHistory } from 'vue-router'
import Index from '@/views/Index.vue'
import Initiate from "@/views/Initiate.vue";
import InitiateMnemonic from "@/views/InitiateMnemonic.vue";
import Login from "@/views/Login.vue";
import ForgotPassword from "@/views/ForgotPassword.vue";
import Send from "@/views/Send.vue";
import BridgeWNCG from "@/views/BridgeWNCG.vue";
import Bridge from "@/views/Bridge.vue";

let router = createRouter({
    history: createMemoryHistory(),
    routes: [
        {
            path: '/',
            name: 'index',
            component: Index
        },
        {
            path: '/login',
            name: 'login',
            component: Login
        },
        {
            path: '/initiate',
            name: 'initiate',
            component: Initiate
        },
        {
            path: '/initiate-mnemonic/:passphrase',
            name: 'initiateMnemonic',
            component: InitiateMnemonic
        },
        {
            path: '/forgot-password',
            name: 'forgotPassword',
            component: ForgotPassword
        },
        {
            path: '/send',
            name: 'send',
            component: Send
        },
        {
            path: '/bridge',
            name: 'bridge',
            component: Bridge
        },
        {
            path: '/bridge/ncg2wncg',
            name: 'ncg2wncg',
            component: BridgeWNCG
        }

    ]
})

export default router;
