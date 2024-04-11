<template>
  <v-menu offset-y>
    <template v-slot:activator="{on,attrs}">
      <v-btn class="menu-down-btn" text :color="color" rounded v-bind="attrs" v-on="on">
        {{ currentSelectedText }}
        <v-icon color="white" small>mdi-menu-down</v-icon></v-btn>
    </template>

    <v-list class="menu-down-list">
      <v-list-item v-for="account in accounts" :key="account.address" @click="select(account)">
        <v-list-item-title class="d-flex align-center justify-space-between pr-0 mr-0 py-2">
          <div style="min-width: 100px;position:relative" class="mr-4">
            {{account.name}}
            <span class="" style="font-weight:600;position:absolute;left:0px;top:12px;font-size: 11px; color:#666" v-if="account.imported">imported</span>
          </div>
          <div class="text-right">
            <span class="mr-1 hex text-left">{{shortAddress(account.address)}}</span>
            <v-btn icon dark x-small class="ml-1" @click.prevent.stop="editAccount(account)" v-if="!onlySelect"><v-icon x-small color="grey">mdi-pencil-outline</v-icon></v-btn>
          </div>
        </v-list-item-title>
      </v-list-item>
      <v-list-item style="border-top: 1px solid #444;" class="mt-4 pt-2 d-flex" v-if="!onlySelect">
        <v-btn small text color="point" class="flex-fill" @click="addNewAddress">Add New</v-btn>
        <v-btn small text color="point" class="flex-fill" @click="importAddress">Import</v-btn>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import utils from "@/utils/utils";

export default {
    name: 'AccountSelector',
    props: {
        accounts: {type: Array},
        account: {type: Object},
        color: {type: String, default: 'white'},
        onlySelect: {type:Boolean, default: false}
    },
    components: {},
    mixins: [],
    data() {
        return {
            copied: false
        }
    },
    computed: {
        currentSelectedText() {
            if (this.account) {
                let found = this.accounts.find(i => this.equalsHex(i.address, this.account.address))
                if (found) {
                    return found.name
                }
            }
            return '-'
        }
    },
    async created() {

    },
    methods: {
        select(account) {
            if (!this.equalsHex(this.account && this.account.address, account.address)) {
                this.$store.dispatch('Account/selectAccount', account.address)
            }
        },
        addNewAddress() {
            this.$emit('addNew')
        },
        importAddress() {
            this.$emit('import')
        },
        editAccount(account) {
            this.$emit('edit', account)
        },
        shortAddress: utils.shortAddress,
    }
}
</script>

<style lang="scss">
.menu-down-list.v-list {
  background-color: var(--v-bg-lighten1) !important;
  .v-list-item {
    min-height: 36px;
    &:hover {
      background-color: #2a2a2a;
    }
    .v-list-item__icon {
      padding: 0px;
      margin: 6px 8px 0px -4px;
    }
    .v-list-item__title {
      color: var(--v-text-lighten2) !important;
      text-align: left;
      font-size: 14px;
    }
  }
}
</style>
<style scoped lang="scss">
.menu-down-btn.v-btn {
  padding: 4px 2px 4px 8px !important;
  min-width: 0px !important;
  min-height: 0px !important;
  height: auto !important;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;

  ::v-deep .v-ripple__container {
    display: none;
  }
  &:before {
    overflow: hidden;
    border-radius: 4px;
    background-color: var(--v-text-base) !important;
  }
}
</style>
