<template>
  <div class="wrap d-flex  flex-column justify-space-between">
    <div class="pb-12">
      <initiate-header :description="t('chronoUnlockDesc')"></initiate-header>
      <v-form ref="form" class="mt-12">
        <v-text-field dark outlined
                      v-model="password"
                      class="point-input"
                      :label="t('passwordInput')"
                      color="pointyellow"
                      :placeholder="t('passwordInputDesc')"
                      :append-icon="showPass ? 'mdi-eye' : 'mdi-eye-off-outline'"
                      :type="showPass ? 'text' : 'password'"
                      :error-messages="loginError"
                      validate-on-blur
                      @click:append="showPass = !showPass"
                      tabindex="1"
                      id="password-input"
                      @keydown.enter.prevent="login"
        ></v-text-field>
      </v-form>
    </div>
    <div class="pb-4">
      <div class="d-flex">
        <v-btn dark x-large
            @click="login"
            class="flex-fill point-btn login-btn"
            color="pointyellow"
            :disabled="!password"
            tabindex="3"
        >{{ t('unlock') }}</v-btn>
      </div>
      <v-btn text size="small" color="#777" class="mt-1" @click="$router.replace({name:'forgotPassword'})">{{t('forgotPassword')}}</v-btn>
    </div>
  </div>
</template>

<script lang="ts">
import { mapGetters } from "vuex";
import { keccak_256 } from "@noble/hashes/sha3"
import InitiateHeader from "@/components/InitiateHeader.vue";
import t from "@/utils/i18n";
import { defineComponent } from "vue";


export default defineComponent({
    name: 'Login',
    components: {
        InitiateHeader
    },
    data() {
        return {
            password: '',
            showPass: false,
            loginError: null
        }
    },
    computed: {
      ...mapGetters("Account", ["approvalRequests"]),
    },
    async created() {
    },
    mounted() {
      let $input = document.querySelector('#password-input')
      $input && $input.focus()
    },
    methods: {
        async login() {
            this.loginError = null
            try {
                if (this.password) {
                    let passphrase = Buffer.from(keccak_256(this.password)).toString('hex')
                    if (await this.$store.dispatch('Account/isValidPassphrase', passphrase)) {
                        await this.$store.dispatch('Account/setPassphrase', passphrase)
                        await this.$store.dispatch('Account/loadAccounts')
                        await this.$store.dispatch('Network/loadNetworks')
                        await this.$store.dispatch('Account/loadApprovalRequests')
                        console.log("this.approvalRequests.length", this.approvalRequests.length);
                        if (this.approvalRequests.length > 0) {
                          this.$router.replace({name: "confirmation"}).catch(() => {})
                        } else {
                          this.$router.replace({name: 'index'}).catch(() => {})
                        }
                    } else {
                        throw Error
                    }
                } else {
                    throw Error
                }
            } catch(e) {
                this.loginError = 'invalid password'
            }
        },
        t,
    }
})
</script>

<style scoped lang="scss">
.logo {
  height: 30px;

  img {
    mix-blend-mode: multiply !important;
  }
}
h1 {
  font-size: 42px;
  line-height: 1.2;
  span {
    display: block;
    font-size: 14px;
    color: #ddd;
  }
}


</style>
