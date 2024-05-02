<template>
  <div class="wrap pa-0">
    <div class="pt-12 mt-2 px-8">
      <p>1 / {{ approvalRequests.length }}</p>
      <p class="header text-start">Signer</p>
      <p class="content text-start">{{ approvalRequests[0].data.signer }}</p>
      <p class="header text-start">Action</p>
      <pre class="content text-start">{{ JSON.stringify(approvalRequests[0].data.content, null, 2) }}</pre>
      <div class="d-flex">
        <button
          class="flex-fill border border-primary border-2 rounded-pill m-2 p-4"
          @click="approveRequest(approvalRequests[0].id)">
          Approve
        </button>
        <button
          class="flex-fill border border-danger border-2 rounded-pill m-2 p-4"
          @click="rejectRequest(approvalRequests[0].id)">
          Reject
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import bg from "@/api/background"
import {mapGetters} from "vuex";
import t from "@/utils/i18n"
import utils from "@/utils/utils";

export default {
    name: 'Confirmation',
    components: {},
    computed: {
      ...mapGetters('Account', ['approvalRequests'])
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
            this.$store.dispatch('Account/loadApprovalRequests')
        }, 1000)
    },
    async updated() {
      if (this.approvalRequests.length === 0) {
        window.close();
      }
    },
    methods: {
      t,
      shortAddress: utils.shortAddress,
      async approveRequest(requestId) {
        await bg.wallet.approveRequest(requestId);
        await this.$store.dispatch('Account/loadApprovalRequests')
      },
      async rejectRequest(requestId) {
        await bg.wallet.rejectRequest(requestId);
        await this.$store.dispatch('Account/loadApprovalRequests')
      }
    }
}
</script>

<style scoped lang="scss">
.header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}

.content {
  font-size: 12px;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  margin-bottom: 16px;
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
