<template>
  <v-menu>
    <template v-slot:activator="{props}">
      <v-btn class="menu-down-btn" variant="text" :color="color" rounded v-bind="props">
        {{ currentSelectedText }}
        <v-icon color="white" small>mdi-menu-down</v-icon>
      </v-btn>
    </template>

    <v-list class="menu-down-list">
      <v-list-item v-for="network in networks" :key="network.id" @click="select(network.id)">
        <v-list-item-title class="d-flex align-center justify-space-between pr-0 mr-0 py-2">
          <div style="min-width: 100px;position:relative" class="mr-4">
            {{network.name}}
            <span class="" style="font-weight:600;position:absolute;left:0px;top:12px;font-size: 11px; color:#666" v-if="!network.isMainnet">Testnet</span>
          </div>
          <div class="text-right">
            <span class="mr-1 hex text-left">{{network.id}}</span>
            <v-btn icon dark size="x-small" class="ml-1" @click.prevent.stop="editNetwork(network.id)" v-if="!onlySelect"><v-icon size="x-small" color="grey">mdi-pencil-outline</v-icon></v-btn>
          </div>
        </v-list-item-title>
      </v-list-item>
      <v-list-item dark style="border-top: 1px solid #444;" class="mt-4 pt-2" v-if="!onlySelect">
        <div class="w-100 d-flex flex-wrap">
          <v-btn size="small" variant="text" color="point" class="flex-fill" @click="addNewNetwork">Add New</v-btn>
        </div>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';
import type { Network } from "../../store/modules/network";

export default defineComponent({
    name: 'NetworkSelector',
    props: {
        networks: {type: Array as PropType<Network[]>, required: true},
        network: {type: Object as PropType<Network | null>, required: true},
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
          console.log(this.network, this.networks);
            if (this.network) {
                const found = this.networks.find(network => network.id === this.network?.id);
                if (found) {
                    return found.name
                }
            }
            return '-'
        }
    },
    async created() {
      console.log("NetworkSelector created", this.$props.networks);
    },
    methods: {
        select(id: string) {
          console.log("set network");
            if (this.network?.id !== id) {
              // @ts-ignore
              this.$store.dispatch('Network/selectNetwork', id)
            }
        },
        addNewNetwork() {
            this.$emit('addNew')
        },
        editNetwork(id: string) {
            this.$emit('edit', id)
        },
    }
});
</script>

<style lang="scss">
.menu-down-list.v-list {
  background-color: "#2e2e2e" !important;
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
