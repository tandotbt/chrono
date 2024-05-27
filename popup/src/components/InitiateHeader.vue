<template>
  <div>
    <h1 class="theme-font text-left">
      Chrono
      <span>Wallet for Nine Chronicles</span>
    </h1>
    <p class="text-left mt-4 description">{{description}}</p>
  </div>
</template>

<script lang="ts">
export default {
	name: "InitiateHeader",
	components: {},
	props: ["description"],
	data() {
		return {};
	},
	computed: {},
	async created() {},
	mounted() {},
	methods: {},
};
</script>

<style scoped lang="scss">
h1 {
  font-size: 42px;
  line-height: 1.2;
  margin-top: 16px;
  padding-bottom: 24px;
  border-bottom: 1px solid #666;
  span {
    display: block;
    font-size: 14px;
    color: #ddd;
  }
}


</style>
