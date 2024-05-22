<template>
  <span>
    <v-btn :color="color" :icon="icon" :style="'color:'+textColor" @click="copyText" variant="flat" :class="contentClass" :size="legacySize || size" :rounded="rounded">
      <v-tooltip top v-model="copied" transition="slide-y-transition" content-class="copy-tooltip" location="top" nudge-left="-13" nudge-top="10">
        <template v-slot:activator="{ props }"><span v-bind="props"></span></template>
        <span><v-icon color="white" size="small" class="mr-1">mdi-check</v-icon><strong>Copied</strong></span>
      </v-tooltip>
      <slot></slot></v-btn>
  </span>
</template>

<script lang="ts">
export default {
    name: 'CopyBtn',
    props: {
        color: {
            type: String,
            default: '#343434'
        },
        textMode: {
            type: Boolean,
            default: false
        },
        rounded: {
            type: Boolean,
            default: true
        },
        textColor: {
            type: String,
            default: '#C4C4C4'
        },
        size: {
            type: String,
            default: null,
        },
        depressed: {
            type: Boolean,
            default: false
        },
        xSmall: {
            type: Boolean,
            default: false
        },
        small: {
            type: Boolean,
            default: false
        },
        large: {
            type: Boolean,
            default: false
        },
        icon: {
            type: Boolean,
            default: false
        },
        text: {
            type: String,
            default: ''
        },
        contentClass: {
            type: String,
            default: ''
        }
    },
    components: {},
    mixins: [],
    data() {
        return {
            copied: false
        }
    },
    computed: {
        legacySize() {
            if (this.$props.xSmall) {
                return "x-small";
            }

            if (this.$props.small) {
                return "small";
            }

            if (this.$props.large) {
                return "large";
            }

            return null;
        }
    },
    async created() {
    },
    methods: {
        copyText() {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(this.text)
                this.copied = true
                this.$emit('copied', this.text)
                setTimeout(() => {this.copied = false}, 800)
            }
        }
    }
}
</script>

<style lang="scss">
.v-tooltip__content.copy-tooltip {
  background-color: #343434 !important;
  opacity: 1 !important;
  color: white;
  border-radius: 12px !important;
  padding: 8px 20px;
  font-size: 14px;
  text-align: left;
}
</style>
<style scoped lang="scss">
.v-btn {
  font-weight: bold;
  font-family: 'Noto Sans KR';

  &.v-size--small {
    padding-top: 0px;
    padding-bottom: 2px;
  }
}
</style>
