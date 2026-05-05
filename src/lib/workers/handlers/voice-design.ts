import type { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import { parseModelKeyStrict } from '@/lib/model-config-contract'
import {
  BAILIAN_VOICE_DESIGN_MODEL_ID,
  createVoiceDesign,
  validatePreviewText,
  validateVoicePrompt,
  type VoiceDesignInput,
} from '@/lib/providers/bailian/voice-design'
import { getModelsByType, getProviderConfig, getProviderKey } from '@/lib/api-config'
import { reportTaskProgress } from '@/lib/workers/shared'
import { assertTaskActive } from '@/lib/workers/utils'
import { TASK_TYPE, type TaskJobData } from '@/lib/task/types'

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`)
  }
  return value.trim()
}

function readLanguage(value: unknown): 'zh' | 'en' {
  return value === 'en' ? 'en' : 'zh'
}

function readBailianModelId(value: unknown): string {
  if (typeof value !== 'string') return ''
  const raw = value.trim()
  if (!raw) return ''

  const parsed = parseModelKeyStrict(raw)
  if (!parsed) return raw
  return parsed.provider === 'bailian' ? parsed.modelId : ''
}

async function resolveVoiceDesignModelConfig(job: Job<TaskJobData>): Promise<{
  modelId: string
  targetModelId: string
}> {
  const [preference, project, enabledAudioModels] = await Promise.all([
    prisma.userPreference.findUnique({
      where: { userId: job.data.userId },
      select: {
        audioModel: true,
        voiceDesignModel: true,
      },
    }),
    job.data.projectId && job.data.projectId !== 'global-asset-hub'
      ? prisma.novelPromotionProject.findUnique({
        where: { projectId: job.data.projectId },
        select: { audioModel: true },
      })
      : Promise.resolve(null),
    getModelsByType(job.data.userId, 'audio'),
  ])

  const configuredVoiceDesignModel = readBailianModelId(preference?.voiceDesignModel)
  const projectAudioModel = readBailianModelId(project?.audioModel)
  const configuredAudioModel = readBailianModelId(preference?.audioModel)

  const enabledBailianAudioModel = enabledAudioModels
    .find((model) => {
      if (getProviderKey(model.provider).toLowerCase() !== 'bailian') return false
      return model.modelId !== BAILIAN_VOICE_DESIGN_MODEL_ID
    })
    ?.modelId

  const targetModelId = [projectAudioModel, configuredAudioModel, enabledBailianAudioModel]
    .find((modelId) => !!modelId && modelId !== BAILIAN_VOICE_DESIGN_MODEL_ID)

  if (!targetModelId) {
    throw new Error('BAILIAN_TARGET_MODEL_REQUIRED: 请先在 API 配置中启用并选择一个百炼语音模型')
  }

  return {
    modelId: configuredVoiceDesignModel || BAILIAN_VOICE_DESIGN_MODEL_ID,
    targetModelId,
  }
}

export async function handleVoiceDesignTask(job: Job<TaskJobData>) {
  const payload = (job.data.payload || {}) as Record<string, unknown>
  const voicePrompt = readRequiredString(payload.voicePrompt, 'voicePrompt')
  const previewText = readRequiredString(payload.previewText, 'previewText')
  const preferredName = typeof payload.preferredName === 'string' && payload.preferredName.trim()
    ? payload.preferredName.trim()
    : 'custom_voice'
  const language = readLanguage(payload.language)

  const promptValidation = validateVoicePrompt(voicePrompt)
  if (!promptValidation.valid) {
    throw new Error(promptValidation.error || 'invalid voicePrompt')
  }
  const textValidation = validatePreviewText(previewText)
  if (!textValidation.valid) {
    throw new Error(textValidation.error || 'invalid previewText')
  }

  await reportTaskProgress(job, 25, {
    stage: 'voice_design_submit',
    stageLabel: '提交声音设计任务',
    displayMode: 'detail',
  })
  await assertTaskActive(job, 'voice_design_submit')

  const { apiKey } = await getProviderConfig(job.data.userId, 'bailian')
  const { modelId, targetModelId } = await resolveVoiceDesignModelConfig(job)
  const input: VoiceDesignInput = {
    voicePrompt,
    previewText,
    preferredName,
    language,
    modelId,
    targetModelId,
  }
  const designed = await createVoiceDesign(input, apiKey)
  if (!designed.success) {
    throw new Error(designed.error || '声音设计失败')
  }

  await reportTaskProgress(job, 96, {
    stage: 'voice_design_done',
    stageLabel: '声音设计完成',
    displayMode: 'detail',
  })

  return {
    success: true,
    voiceId: designed.voiceId,
    targetModel: designed.targetModel,
    audioBase64: designed.audioBase64,
    sampleRate: designed.sampleRate,
    responseFormat: designed.responseFormat,
    usageCount: designed.usageCount,
    requestId: designed.requestId,
    taskType: job.data.type === TASK_TYPE.ASSET_HUB_VOICE_DESIGN ? TASK_TYPE.ASSET_HUB_VOICE_DESIGN : TASK_TYPE.VOICE_DESIGN,
  }
}
