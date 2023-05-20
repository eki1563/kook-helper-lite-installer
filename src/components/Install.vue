<script setup lang="ts">
import { computed, ref } from 'vue'
import { NSpin, NButton, NSteps, NStep, StepsProps, useDialog } from 'naive-ui'

const { checkRunning, checkPath, backup, extract, modify, pack, rollback, quit } = window.installStep
const processing = computed(() => currentStep.value > 0 && currentStatus.value === 'process')
const currentStep = ref(0)
const currentStepText = ref('')
const currentStatus = ref<StepsProps['status']>('wait')
const dialog = useDialog()

async function install() {
  try {
    currentStep.value = 1
    currentStatus.value = 'process'
    currentStepText.value = '检查 KOOK 安装路径。。。'
    const version = await checkPath()
    steps[currentStep.value - 1].description = `发现 KOOK，版本 ${ version }`
    currentStepText.value = '检查 KOOK 是否正在运行。。。'
    await checkRunning()
    currentStep.value = 2
    currentStepText.value = '备份原文件。。。'
    await backup()
    currentStep.value = 3
    currentStepText.value = '解包。。。'
    await extract()
    currentStepText.value = '安装。。。'
    await modify()
    currentStep.value = 4
    currentStepText.value = '保存。。。'
    await pack()
    currentStatus.value = 'finish'
    dialog.success({
      title: '安装成功',
      content: '如需删除，可以重新安装 KOOK。',
      positiveText: '知道了',
      onPositiveClick: () => {
        quit()
      },
      onClose: () => {
        quit()
      },
    })
  } catch (e: any) {
    console.error(e)
    currentStatus.value = 'error'
    currentStepText.value = `${ e.message }。`
    if (currentStep.value >= 4) {
      currentStepText.value = `${ e.message }。正在回滚。。。`
      await rollback()
      currentStepText.value = `${ e.message }。回滚完成。`
    }
  }
}

const steps = [
  {
    title: '环境',
    description: '检查 KOOK 安装路径，是否正在运行。',
  },
  {
    title: '备份',
    description: '保存至同级目录中，以 .bak 后缀结尾。',
  },
  {
    title: '安装',
    description: '添加小助手加载地址。',
  },
  {
    title: '保存',
    description: '马上就好。',
  },
]
</script>

<template>
  <div id="install">
    <header>这里应该要有一个 LOGO</header>
    <section>
      <div class="operation">
        <n-button type="primary" @click="install">开始安装</n-button>
      </div>
      <div class="progress" :style="[currentStatus === 'error' ? 'color: red;' : '']">
        <n-spin v-show="processing" size="small" style="margin-right: 16px;"></n-spin>
        {{ currentStepText }}
      </div>
      <div class="step">
        <n-steps :current="(currentStep as number)" :status="currentStatus!">
          <n-step v-for="i in steps"
                  :title="i.title"
                  :description="i.description"
          />
        </n-steps>
      </div>
    </section>
  </div>
</template>

<style scoped lang="less">
#install {
  width: 100%;
  height: 100%;
  padding: 32px;
  header {
    padding-top: 15%;
    text-align: center;
  }
  section {
    margin-top: 40px;
    .operation {
      text-align: center;
    }
    .progress {
      min-height: 28px;
      margin-top: 40px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .step {
      margin-top: 40px;
      font-size: 12px;
    }
  }
}
</style>
