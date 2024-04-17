<template>
  <div class="wrap pa-0 d-flex flex-column justify-space-between">
    <div>
      <signed-in-header></signed-in-header>
      <div class="text-left px-2 d-flex justify-space-between align-center" style="background-color: #2a2a2a">
        <v-btn icon dark size="large" @click="$router.replace({'name':'index'})"><v-icon color="grey">mdi-arrow-left</v-icon></v-btn>
        <strong style="font-weight:600">BRIDGE</strong>
        <v-btn icon dark size="large" disabled></v-btn>
      </div>
      <div class="pa-4 mt-2">
        <v-card dark outlined color="#333">
          <v-card-title>NCG <v-icon size="small" class="mx-2">mdi-arrow-right</v-icon> WNCG(ERC-20)</v-card-title>
          <v-card-text>
            <ul class="text-left">
              <li>{{t('bridgeWNCGDesc1')}}</li>
              <li>{{t('bridgeWNCGDesc2')}}</li>
              <li>{{t('bridgeWNCGDesc3')}}</li>
              <li>{{t('bridgeWNCGDesc4')}}</li>
              <li>{{t('bridgeWNCGDesc5')}}</li>
            </ul>
          </v-card-text>
          <v-card-actions>
            <v-btn color="pointyellow" class="point-btn flex-fill" @click="$router.replace({name: 'ncg2wncg'})">{{t('doBridge')}}</v-btn>
          </v-card-actions>
        </v-card>
        <v-row>
          <v-col class="text-left py-1">
            <div class="pl-2 mt-1">

            </div>
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script>

import SignedInHeader from "@/components/SignedInHeader.vue";
import t from "@/utils/i18n"

export default {
    name: 'Bridge',
    components: {
        SignedInHeader
    },
    computed: {
    },
    data() {
        return {
        }
    },
    async created() {
    },
    methods: {
      t,
    }
}
</script>

<style scoped lang="scss">

</style>
