<template>
  <div>
    <div class="header d-flex align-center justify-space-between px-4">
      <network-selector :networks="networks" :network="network" @addNew="openDialog('import')" @edit="openDialog('edit')"></network-selector>

      <div>
        <v-btn icon dark size="x-small" @click="logout"><v-icon size="small" color="grey">mdi-lock</v-icon></v-btn>
      </div>

      <v-dialog v-model="edit.dialog"  theme="dark" scroll-strategy="reposition" dark width="320px">
        <v-card title="Edit Network">
          <template v-slot:text>
            <v-text-field readonly maxlength="16" outlined :rules="[requiredRule]" dense label="Planet ID" v-model="edit.id" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field maxlength="10" outlined :rules="[requiredRule]" dense label="Name" v-model="edit.name" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field minlength="16" maxlength="64" outlined :rules="[requiredRule]" dense label="Genesis Hash" v-model="edit.genesisHash" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field outlined :rules="[requiredRule]" dense rows="4" label="GraphQL endpoint" v-model="edit.gqlEndpoint" style="margin-bottom:-10px;"></v-text-field>
            <v-switch outlined :rules="[requiredRule]" dense label="Is Mainnet?" v-model="edit.isMainnet" style="margin-bottom:-10px;"></v-switch>
          </template>
          <v-card-actions class="justify-space-between">
            <div>
              <v-btn icon size="small" v-if="networks && networks.length > 1" @click="deleteEditingNetwork" :disabled="edit.loading"><v-icon color="grey">mdi-trash-can-outline</v-icon></v-btn>
            </div>
            <div>
              <v-btn variant="text" size="small" @click="edit.dialog = false" :disabled="edit.loading || edit.deleteLoading">{{ t('cancel') }}</v-btn>
              <v-btn size="small" color="pointyellow" @click="editNetwork" :loading="edit.loading" :disabled="edit.deleteLoading">{{ t('save') }}</v-btn>
            </div>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <v-dialog v-model="imports.dialog" theme="dark" scroll-strategy="reposition" max-width="320px">
      <v-card title="Import Network">
        <template v-slot:text>
          <div class="mt-4">
            <v-text-field maxlength="16" outlined :rules="[requiredRule]" dense label="Planet ID" v-model="imports.id" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field maxlength="10" outlined :rules="[requiredRule]" dense label="Name" v-model="imports.name" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field minlength="16" maxlength="64" outlined :rules="[requiredRule]" dense label="Genesis Hash" v-model="imports.genesisHash" style="margin-bottom:-10px;"></v-text-field>
            <v-text-field outlined :rules="[requiredRule]" dense rows="4" label="GraphQL endpoint" v-model="imports.gqlEndpoint" style="margin-bottom:-10px;"></v-text-field>
            <v-switch outlined :rules="[requiredRule]" dense label="Is Mainnet?" v-model="imports.isMainnet" style="margin-bottom:-10px;"></v-switch>
          </div>
        </template>
        <v-card-actions class="justify-space-between">
          <div></div>
          <div>
            <v-btn variant="text" size="small" @click="imports.dialog = false" :disabled="imports.loading">{{ t('cancel') }}</v-btn>
            <v-btn size="small" color="pointyellow" @click="addNewNetwork" :loading="imports.loading">{{ t('import') }}</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import bg from "@/api/background"
import NetworkSelector from "@/components/buttons/NetworkSelector.vue"
import t from "@/utils/i18n";
import { useNetwork } from "@/stores/network";
import { mapStores, mapState } from "pinia";
import Rules from "@/utils/rules";

export default {
    name: 'SignedInHeader',
    components: {
      NetworkSelector,
    },
    props: [],
    data() {
        return {
          imports: {
            id: "",
            name: "",
            genesisHash: "",
            gqlEndpoint: "",
            isMainnet: false,

            dialog: false,
            loading: false,
          },
          edit: {
            id: "",
            name: "",
            genesisHash: "",
            gqlEndpoint: "",
            isMainnet: false,

            dialog: false,
            loading: false,
            deleteLoading: false,
          }
        }
    },
    computed: {
      ...mapStores(useNetwork),
      ...mapState(useNetwork, ['networks', 'network']),
    },
    async created() {
    },
    mounted() {
    },
    methods: {
        t,
        requiredRule: Rules.required,
        openDialog(type: string) {
          if (type === "import") {
            this.imports.id = "";
            this.imports.name = "";
            this.imports.gqlEndpoint = "";
            this.imports.genesisHash = "";
            this.imports.isMainnet = false;
            this.imports.dialog = true;
            this.imports.loading = false;
          } else if (type === "edit") {
            if (!this.network) {
              throw new Error("Unexpected state. this.network doesn't work.");
            }

            this.edit.id = this.network.id;
            this.edit.name = this.network.name;
            this.edit.gqlEndpoint = this.network.gqlEndpoint;
            this.edit.genesisHash = this.network.genesisHash;
            this.edit.isMainnet = this.network.isMainnet;
            this.edit.dialog = true;
            this.edit.loading = false;
            this.edit.deleteLoading = false;
          }
        },
        async addNewNetwork() {
          this.imports.loading = true;
          try {
            await this.NetworkStore.importNetwork(this.imports);
          }
          finally {
            this.imports.loading = false;
          }
        },
        async editNetwork() {
          this.edit.loading = true;
          try {
            await this.NetworkStore.updateNetwork(this.edit);
          }
          finally {
            this.edit.loading = false;
          }
        },
        async deleteEditingNetwork() {
          this.edit.deleteLoading = true;
          try {
            await this.NetworkStore.deleteNetwork(this.edit.id);
          }
          finally {
            this.edit.deleteLoading = false;
          }
        },
        logout() {
            bg.logout()
            this.$router.replace({name: 'login'})
        }
    }
}
</script>

<style scoped lang="scss">
.header-spacer {
  height: 60px;
}
.header {
  border-bottom: 1px solid #444;
  height: 48px;
  width: 100%;

  h1 {
    font-size: 20px;
    line-height: 1.2;
    color: var(--v-pointyellow-base);
  }

}

</style>
