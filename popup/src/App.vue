<template>
  <v-app id="app">
    <router-view id="router"/>
  </v-app>
</template>

<script lang="ts">
import bg from "@/api/background"
import { defineComponent } from "vue";
import { useAccounts } from "./stores/account";
import { mapState, mapStores } from "pinia";
import { useNetwork } from "./stores/network";
export default defineComponent({
    name: 'App',
    components: {
    },
    data() {
        return {
        }
    },
    computed: {
      ...mapStores(useAccounts, useNetwork),
      ...mapState(useAccounts, ["approvalRequests"]),
    },
    async created() {
        let hasWallet = await bg.hasWallet()
        if (hasWallet) {
            await bg.checkTTL()
            let signedIn = await bg.isSignedIn()
            if (signedIn) {
                await this.AccountStore.loadAccounts();
                await this.NetworkStore.loadNetworks();
                await this.AccountStore.loadApprovalRequests();
                this.init()
                if (this.approvalRequests!.length > 0) {
                  this.$router.replace({name: "confirmation"}).catch(() => {})
                } else {
                  this.$router.replace({name: 'index'}).catch(() => {})
                }
            } else {
                this.$router.replace({name: 'login'}).catch(() => {})
            }
        } else {
            this.$router.replace({name: 'initiate'}).catch(() => {})
        }
    },
    methods: {
        async init() {
            console.log('init')
            await bg.graphql('updateNetwork', 'mainnet')
            setInterval(() => {
                bg.graphql('updateNetwork', 'mainnet')
            }, 1000 * 60)
        }
    }
})
</script>

<style lang="scss">
@import url('./assets/font.css');
html {
  overflow-y: scroll;
  overflow-x: hidden;
}
::-webkit-scrollbar {
  width: 1px;  /* Remove scrollbar space */
  background: var(--v-bg-lighten1);  /* Optional: just make scrollbar invisible */
}
/* Optional: show position indicator in red */
::-webkit-scrollbar-thumb {
  background: #555;
}
.v-overlay.v-overlay--active.theme--dark {
  .v-overlay__scrim {
    background-color: #555;

    &:after {
      opacity: 0.6;
      content: " ";
      position: fixed;
      left: 0px;
      width: 100%;
      height: 100%;
      background-color: #555;
    }
  }
}

#app {
  font-family: Pretendard;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  background-color: var(--v-bg-lighten1);
  color: #fff;
  text-underline-offset: 2px;
  font-size: 14px;
  a:not(.v-btn) {
    color: var(--v-pointlink-base);
    transition-property: opacity;
    transition-duration: 0.3s;
    font-weight: 500;
    text-decoration: none;
    &:hover {
       text-decoration: underline;
       opacity: 0.83;
     }
    &:link {
      background-color: transparent !important;
    }
    &.v-btn--active:before {
     background-color: transparent !important;
    }
    &.v-btn:hover {
     text-decoration: none;
    }
  }
}
.theme-font {
  font-family: "Frank Ruhl Libre", Pretendard;
}
.hex {
  font-family: "Roboto mono", Helvetica,Arial,sans-serif;
  letter-spacing: -0.5px;
  word-break: break-all;
}

.wrap {
  width: 360px;
  min-height: 600px;
  position: relative;
  padding: 16px 30px;
  background-color: var(--v-bg-base);
}
.description {
  color: #ccc;
}

.point-btn {
  &.theme--dark.v-btn.v-btn--disabled.v-btn--has-bg {
    opacity: 0.6;
    background-color: var(--v-pointyellow-lighten1) !important;
    color: #efefef !important;
  }
}

.v-btn {
  text-transform: none !important;
  letter-spacing: 0px !important;
}

.v-input {
  &:hover {
    fieldset {
      color: currentColor !important;
      border-color: currentColor !important;
    }
  }
}
.point-input:not(.error--text) {
  .v-input__slot {
    .v-icon {
      color: var(--v-pointyellow-lighten1) !important;
    }
    fieldset {
      border: 1px solid var(--v-pointyellow-lighten1) !important;
    }
    .v-label {
      color: var(--v-pointyellow-lighten1);
    }
  }

  &.v-input--is-focused {
    .v-input__slot {
      fieldset {
        border: 1px solid var(--v-pointyellow-base) !important;
      }
    }
  }
}

.fixed-bottom {
  position: fixed;
  bottom: 30px;
  width: 100%;
}
</style>
