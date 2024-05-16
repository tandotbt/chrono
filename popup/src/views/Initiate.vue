<template>
  <div class="wrap d-flex  flex-column justify-space-between">
    <initiate-header :description="t('initPasswordDesc')"></initiate-header>
    <div class="pb-12">
      <v-form ref="form">
        <v-text-field dark outlined
                      class="point-input"
                      color="pointyellow"
                      v-model="pass1"
                      :label="t('passwordInput')"
                      :placeholder="t('passwordInputDesc')"
                      :append-icon="showPass1 ? 'mdi-eye' : 'mdi-eye-off-outline'"
                      :type="showPass1 ? 'text' : 'password'"
                      :rules="rulePassword"
                      validate-on-blur
                      @click:append="showPass1 = !showPass1"
                      tabindex="1"
                      id="password-input"
        ></v-text-field>

        <v-text-field dark outlined
                      class="point-input mt-1"
                      color="pointyellow"
                      v-model="pass2"
                      :label="t('passwordConfirm')"
                      :placeholder="t('passwordConfirmDesc')"
                      :append-icon="showPass2 ? 'mdi-eye' : 'mdi-eye-off-outline'"
                      :type="showPass2 ? 'text' : 'password'"
                      @click:append="showPass2 = !showPass2"
                      :rules="ruleConfirmPassword"
                      validate-on-blur
                      tabindex="2"
                      @keydown.enter="initiate"
        ></v-text-field>
      </v-form>
    </div>
    <div class="pb-4">
      <div class="d-flex">
        <v-btn dark x-large
            @click="initiate"
            class="flex-fill point-btn"
            color="pointyellow"
            :disabled="!isValidPassword"
            tabindex="3"
        >{{t('create')}}</v-btn>
      </div>
      <p class="text-left description mt-3" style="font-size:11px;">{{t('agreeTermsDesc')}}</p>
    </div>
  </div>
</template>

<script>
import rules from "@/utils/rules"
import t from "@/utils/i18n"
import { keccak_256 } from "@noble/hashes/sha3"
import _ from "underscore"
import InitiateHeader from "@/components/InitiateHeader.vue";

export default {
    name: 'Initiate',
    components: {
        InitiateHeader
    },
    data() {
        return {
            pass1: '',
            pass2: '',
            showPass1: false,
            showPass2: false,
        }
    },
    computed: {
        rulePassword() {
            return [rules.required, rules.min8Len]
        },
        ruleConfirmPassword() {
            return [rules.required, rules.min8Len, () => {
                return this.pass1 === this.pass2 || t('Not equals')
            }]
        },
        passedRules() {
            return _.all(this.rulePassword, r => r(this.pass1) === true && r(this.pass2) === true)
        },
        equalsPassword() {
            return this.pass1 === this.pass2
        },
        isValidPassword() {
            return this.passedRules && this.equalsPassword
        }
    },
    async created() {
    },
    mounted() {
      let $input = document.querySelector('#password-input')
      $input && $input.focus()
    },
    methods: {
        t,
        async initiate() {
            if ((await this.$refs['form'].validate()).valid && this.isValidPassword) {
                let passphrase = Buffer.from(keccak_256(this.pass1)).toString('hex')
                this.$router.replace({
                  name: 'initiateMnemonic',
                  params: {
                    passphrase: passphrase,
                    "toto": 1,
                  }
                }).catch(() => {});
            }
        }
    }
}
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
