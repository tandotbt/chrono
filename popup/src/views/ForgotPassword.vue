<template>
  <div class="wrap d-flex  flex-column justify-space-between">
    <div class="pb-12">
      <initiate-header :description="t('forgotPasswordDescription')"></initiate-header>
    </div>
    <div class="pb-4">
      <div class="d-flex">
        <v-btn dark x-large
               class="flex-fill point-btn"
               color="pointyellow"
               tabindex="3"
               @click="$router.replace({name:'initiate', query: {mode:'recover'}})"
        >{{t('recoverAccount')}}</v-btn>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import InitiateHeader from "@/components/InitiateHeader.vue";
import t from "@/utils/i18n";
import { defineComponent } from "vue";


export default defineComponent({
    name: 'ForgotPassword',
    components: {
        InitiateHeader
    },
    data() {
        return {
        }
    },
    computed: {
    },
    async created() {
    },
    mounted() {
    },
    methods: {
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
