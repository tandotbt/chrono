<template>
  <div class="wrap pa-0">
    <signed-in-header></signed-in-header>
    <account-manager></account-manager>

    <div class="pt-12 mt-2 px-8">
      <div><img src="@/assets/ncg_grey.png" width="64"/></div>
      <div v-if="account && account.activated != true">
        <v-chip small label color="#555" class="mt-2" text-color="white">Inactive Account</v-chip>
      </div>
      <div class="mt-2">
        <v-progress-circular indeterminate color="#555" width="3" size="30" v-if="balanceLoading"></v-progress-circular>
        <div v-else class="d-flex ncg justify-center">
          <span class="ncg-amount">{{balance}}</span><span class="symbol">NCG</span>
        </div>
      </div>
      <div class="mt-4">
        <v-btn dark large color="secondary" class="mx-1 action-btn" :disabled="balanceLoading" @click="$router.replace({name: 'bridge'})">
          <div>
            {{t('bridge')}}
            <div style="font-size: 10px;color:#888;letter-spacing: 0px">WNCG</div>
          </div>
        </v-btn>
        <v-btn dark large
               color="pointyellow"
               class="mx-1 action-btn point-btn"
               @click="$router.replace({name:'send'})"
               :disabled="balanceLoading">{{t('transfer')}}</v-btn>
      </div>
    </div>

    <div class="mt-12 px-4">
      <h3 class="text-left">{{t('transactions')}}</h3>
      <v-card dark color="#2a2a2a" class="my-3 tx-card" v-if="accountTxs && accountTxs.length == 0">
        <v-card-text class="py-12" style="font-size: 13px;color:#888;">
          No Transactions
        </v-card-text>
      </v-card>
      <v-card dark color="#333" class="my-3 tx-card" v-for="tx in accountTxs" :key="tx.id">
        <v-card-text class="pt-2">
          <div class="d-flex justify-space-between align-baseline">
            <div>
              <span class="status mr-2">
                <v-progress-circular size="12" width="1" color="point" indeterminate v-if="tx.status == 'STAGING'" style="margin-right:-4px;"></v-progress-circular>
                <v-badge v-else dot :color="tx.status == 'FAILURE' ? 'red': (tx.status == 'SUCCESS' ?'success':'point')"></v-badge>
                <span class="ml-3" :class="tx.status">{{tx.status}}</span>
              </span>
              <span class="tx-type">
                <span v-if="tx.action === 'bridgeWNCG'">Bridge WNCG</span>
                <span v-else>{{ tx.type == 'transfer_asset5' ? 'Transfer Asset' : tx.type}}</span>
              </span>
            </div>
            <div style="margin-right: -16px;" class="d-flex align-center">
              <v-btn text small color="grey" :href="'https://9cscan.com/tx/' + tx.id" target="_blank">9cscan<v-icon color="grey" x-small class="ml-1" style="margin-top:3px">mdi-open-in-new</v-icon></v-btn>
            </div>
          </div>
          <div class="text-left d-flex align-center mt-1 mb-2" v-if="tx.type=='transfer_asset5'">
            <v-chip label x-small class="tx-sender">
              {{ shortAddress(tx.data.sender) }}
              <copy-btn :text="tx.data.sender" icon x-small style="margin-right:-8px;"><v-icon x-small color="#999">mdi-content-copy</v-icon></copy-btn>
            </v-chip>
            <v-icon x-small color="grey" class="mx-1">mdi-arrow-right</v-icon>
            <v-chip label x-small class="tx-receiver">
              {{ shortAddress(tx.data.receiver) }}
              <copy-btn :text="tx.data.receiver" icon x-small style="margin-right:-8px;"><v-icon x-small color="#999">mdi-content-copy</v-icon></copy-btn>
            </v-chip>
          </div>
          <div class="text-left">
            <span class="tx-amount">{{ tx.data.amount }} NCG</span>
          </div>
          <div class="text-left">
            <span class="tx-time">{{timeFormat(moment(tx.timestamp))}}</span>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script>
import SignedInHeader from "@/components/SignedInHeader.vue";
import AccountManager from "@/components/AccountManager.vue";
import {mapGetters} from "vuex";
import t from "@/utils/i18n"
import utils from "@/utils/utils";
import CopyBtn from "@/components/buttons/CopyBtn.vue";

export default {
    name: 'Index',
    components: {
        CopyBtn,
        AccountManager,
        SignedInHeader,
    },
    computed: {
        ...mapGetters('Account', ['account', 'accountTxs', 'balance', 'balanceLoading'])
    },
    data() {
        return {
            refreshTimer: 0
        }
    },
    beforeDestroy() {
        clearInterval(this.refreshTimer)
    },
    async created() {
        this.refreshTimer = setInterval(() => {
            this.$store.dispatch('Account/refreshBalance')
            this.$store.dispatch('Account/refreshStagingTxStatus')
        }, 10000)
        setTimeout(() => {
            this.$store.dispatch('Account/refreshStagingTxStatus')
        }, 1000)
    },
    methods: {
      t,
      shortAddress: utils.shortAddress,
    }
}
</script>

<style scoped lang="scss">
.ncg {
  font-family: "Roboto mono";
  font-weight: 400;
  font-size: 20px;
  letter-spacing: -0.3px;

  .ncg-amount {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  span.symbol {
    margin-left: 8px;
    color: #999;
  }
}

.action-btn {
  width: 100px;
}


.tx-card {
  .status {
    color: var(--v-pointyellow-base);
    .FAILURE {
      color: #f66565 !important;
    }
    .SUCCESS {
      color: #54d354;
    }
    font-size: 12px;
  }
  .tx-type {
    font-size: 12px;
  }
  .tx-amount {
    font-family: "Roboto mono", Helvetica, Arial, sans-serif;
    font-size: 15px;
    color: white;
  }
  .tx-sender, .tx-receiver {
    color: #ddd;
    font-family: "Roboto mono", Helvetica, Arial, sans-serif;
  }
  .tx-time {
    font-size: 12px;
  }
  .tx-id {
    font-size: 12px;
  }
}
</style>
