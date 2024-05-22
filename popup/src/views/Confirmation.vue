<template>
  <div class="wrap pa-0">
    <div class="pt-12 mt-2 px-8">
      <p>1 / {{ approvalRequests.length }}</p>
      <p class="header text-start">Category</p>
      <p class="content text-start">{{ approvalRequests[0].category }}</p>
      <div v-if:="approvalRequests[0].category == 'sign'">
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
      <div v-if:="approvalRequests[0].category == 'connect'">
        <p class="header text-start">Origin</p>
        <p class="content text-start">{{ approvalRequests[0].data.origin }}</p>
        <p class="header text-start">Select Accounts to connect</p>
        <pre class="content text-start">{{ JSON.stringify(approvalRequests[0].data.content, null, 2) }}</pre>
        <template v-for:="{ name, address } in accounts">
          <div class="account-card">
            <input type="checkbox" :name="address" :value="address" :id="address" v-model="selectedAddresses"/>
            <label :for="address">{{ name }} : {{ shortAddress(address) }}</label>
          </div>
        </template>

        <div class="d-flex">
          <button
            class="flex-fill border border-primary border-2 rounded-pill m-2 p-4"
            @click="approveRequest(approvalRequests[0].id, selectedAddresses)">
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
  </div>
</template>

<script lang="ts">
import bg from "@/api/background"
import t from "@/utils/i18n"
import utils from "@/utils/utils";
import { defineComponent } from "vue";
import { useAccounts } from "@/stores/account";
import { mapState, mapStores } from "pinia";

export default defineComponent({
    name: 'Confirmation',
    components: {},
    computed: {
      ...mapState(useAccounts, ['approvalRequests', 'accounts']),
      ...mapStores(useAccounts),
    },
    data(): {
      refreshTimer: ReturnType<typeof setInterval> | null,
      selectedAddresses: string[]
    } {
      return {
          refreshTimer: null,
          selectedAddresses: []
      }
    },
    beforeDestroy() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
      }
    },
    async created() {
        await this.AccountStore.loadApprovalRequests();
        await this.AccountStore.loadAccounts();
        this.refreshTimer = setInterval(() => {
            this.AccountStore.loadApprovalRequests();
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
      async approveRequest(requestId: string, metadata?: unknown) {
        await bg.confirmation.approveRequest(requestId, metadata);
        await this.AccountStore.loadApprovalRequests();
      },
      async rejectRequest(requestId: string) {
        await bg.confirmation.rejectRequest(requestId);
        await this.AccountStore.loadApprovalRequests();
      }
    }
})
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

.account-card {
  display: flex;
  column-gap: 8px;
  align-items: center;
  margin-bottom: 12px;
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
