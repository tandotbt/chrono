<template>
  <div>
    <div class="header d-flex align-center justify-space-between px-4">
      <h1 class="theme-font text-left">
        Chrono
      </h1>

      <div>
        <v-btn icon dark size="x-small" @click="logout"><v-icon size="small" color="grey">mdi-lock</v-icon></v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import bg from "@/api/background"
export default {
    name: 'SignedInHeader',
    components: {
    },
    props: [],
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
