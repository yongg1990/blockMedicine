<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import TechCardIcon from './components/TechCardIcon.vue'
import Cyber3DBackground from './components/Cyber3DBackground.vue'

type Metric = { label: string; value: string }
type ChainRow = Record<string, unknown>
type NodeState = { name: string; status: string; value: number; displayValue: string }
type Contract = { title: string; value: string; description: string }
type BlockCard = { height: string; root: string; tx: string; time: string }
type FooterCard = { title: string; value: string; suffix: string; description: string }
type ApiResponse<T> = { code?: string | number; result?: T; data?: T; success?: boolean; message?: string }
type ApiResult = Record<string, unknown> | Array<Record<string, unknown>>

const now = ref(new Date())
const pulse = ref(0)
const isFullscreen = ref(false)
const trend = reactive<Array<{ label: string; verify: number; auth: number }>>([])
const metrics = reactive<Metric[]>([
  { label: '接入来源平台', value: '--' },
  { label: '上链数据类型', value: '--' },
  { label: '累计上链记录', value: '--' },
  { label: '今日上链记录', value: '--' },
  { label: '验真调用', value: '--' },
  { label: '最新区块高度', value: '--' },
  { label: '业务智能合约', value: '--' },
  { label: '区块链节点', value: '--' },
])
const sourceStats = reactive([
  { label: '今日提交', value: '--', sub: 'GAP基地管理' },
  { label: '今日上链', value: '--', sub: '饮片追溯' },
  { label: '写入中', value: '--', sub: '医疗机构' },
  { label: '异常', value: '0', sub: '检测机构' },
])
const verifyStats = reactive([
  { label: '扫码验真', value: '--' },
  { label: '报告核验', value: '--' },
  { label: '监管查询', value: '--' },
])
const nodeSummary = reactive({ count: 0, healthy: 0, consensus: '--', health: '--', height: '--', txCount: '--', audit: '--' })
const nodeStates = reactive<NodeState[]>([])
const footerCards = reactive<FooterCard[]>([
  { title: '底层链健康', value: '--', suffix: '服务可用', description: '等待接口数据。' },
  { title: '节点共识', value: '--', suffix: '节点在线', description: '等待接口数据。' },
  { title: '块高数', value: '--', suffix: '最新', description: '等待接口数据。' },
  { title: '链上数据', value: '100%', suffix: '写入率', description: '最新链上数据。' },
  { title: '审计留痕', value: '676', suffix: '条摘要', description: '策略变更、授权访问、异常处置均生成审计 HASH。' },
])
const dataTypes = reactive<Array<{ label: string; value: string; width: number; tone: string }>>([])
const subjects = reactive<string[][]>([])
const tasks = reactive<string[][]>([])
const blockCards = reactive<BlockCard[]>([
  { height: '#26114', root: '6FD3...91C0', tx: '248', time: '15:37' },
  { height: '#26115', root: '83A1...0E6B', tx: '231', time: '15:41' },
  { height: '#26116', root: 'A44C...11E2', tx: '263', time: '15:46' },
])
const contracts = reactive<Contract[]>([
  { title: '凭证核验合约', value: '8', description: '溯源企业 / 备案信息' },
  { title: '审计留痕合约', value: '12', description: '数据验证 / 数据查询' },
  { title: '履约记录合约', value: '24', description: '饮片扫码 / 饮片代煎 / 饮片处方' },
  { title: '批次存证合约', value: '15', description: '饮片加工 / 饮片赋码' },
])
const chainRows = reactive<ChainRow[]>([])

const fillScrollRows = <T,>(rows: T[], minimum: number) => rows.length
  ? Array.from({ length: Math.max(rows.length, minimum) }, (_, index) => rows[index % rows.length])
  : []
const scrollingDataTypes = computed(() => fillScrollRows(dataTypes, 7))
const scrollingSubjects = computed(() => fillScrollRows(subjects, 7))
const scrollingChainRows = computed(() => fillScrollRows(chainRows, 9))
const chainColumns = computed(() => Object.keys(chainRows[0] ?? {}))
const chainGridStyle = computed(() => ({
  gridTemplateColumns: chainColumns.value.map((column) => {
    if (column === '类型') return '80px'
    if (column === '标识') return '1.15fr'
    if (column === '摘要' || column === 'HASH摘要' || column === 'TxHash') return '1.35fr'
    return '.75fr'
  }).join(' '),
}))

const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080
const screenLayout = reactive({ scale: 1, x: 0, y: 0 })
let timer: number | undefined
let dataTimer: number | undefined
let blockTimer: number | undefined
let resizeFrame: number | undefined
let scrollFrame: number | undefined
let previousScrollTime: number | undefined
const SCROLL_SPEED_PX_PER_SECOND = 14
const scrollOffsets = new WeakMap<HTMLElement, number>()
const animatedDisplays = reactive<Record<string, string>>({})

type NumericAnimation = {
  current: number
  target: number
  raf?: number
  prefix: string
  suffix: string
  decimals: number
  grouping: boolean
}
const numericAnimations = new Map<string, NumericAnimation>()
const animationDuration = 900

const timeText = computed(() => {
  const d = now.value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})

const chartPoints = computed(() => {
  const max = 170
  const xStep = trend.length > 1 ? 400 / (trend.length - 1) : 400
  const verifyPoints = trend.map((item, index) => `${index * xStep},${75 - (item.verify / max) * 58}`).join(' ')
  const authPoints = trend.map((item, index) => `${index * xStep},${75 - (item.auth / max) * 58}`).join(' ')
  const verifyArea = trend.length ? `0,80 ${verifyPoints} ${(trend.length - 1) * xStep},80` : ''
  const authArea = trend.length ? `0,80 ${authPoints} ${(trend.length - 1) * xStep},80` : ''
  return {
    verify: verifyPoints,
    auth: authPoints,
    verifyArea,
    authArea,
  }
})

const latestTrend = computed(() => trend[trend.length - 1] ?? { verify: 0, auth: 0 })
const sourceOnline = computed(() => sourceStats.slice(0, 3).some((item) => item.value !== '--'))

const getVerifyIcon = (label: string) => {
  if (label.includes('扫码')) return 'scan'
  if (label.includes('报告') || label.includes('数据')) return 'shield'
  return 'audit'
}

const getVerifySub = (label: string) => {
  if (label.includes('扫码')) return '终端扫码防伪验真'
  if (label.includes('报告') || label.includes('数据')) return '电子质检存证核验'
  return '穿透式监管合规审计'
}

const getVerifyTone = (index: number) => {
  return ['tone-mint', 'tone-cyan', 'tone-gold'][index % 3]
}

const connectorPath = (index: number) => {
  const y = 35 + index * 80
  return `M210 ${y} L246 ${y} M360 ${y} L390 ${y} L420 235`
}

const screenStyle = computed(() => ({
  left: `${screenLayout.x}px`,
  top: `${screenLayout.y}px`,
  transform: `scale(${screenLayout.scale})`,
}))

const getViewportSize = () => {
  const viewport = window.visualViewport
  return {
    width: viewport?.width ?? window.innerWidth,
    height: viewport?.height ?? window.innerHeight,
  }
}

const updateScreenScale = () => {
  const { width, height } = getViewportSize()
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT)
  const scaledWidth = DESIGN_WIDTH * scale
  const scaledHeight = DESIGN_HEIGHT * scale
  screenLayout.scale = Number(scale.toFixed(5))
  screenLayout.x = Math.max(0, Math.round((width - scaledWidth) / 2))
  screenLayout.y = Math.max(0, Math.round((height - scaledHeight) / 2))
}

const scheduleScreenScaleUpdate = () => {
  if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame)
  resizeFrame = window.requestAnimationFrame(() => {
    resizeFrame = undefined
    updateScreenScale()
  })
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    void document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    void document.exitFullscreen()
    isFullscreen.value = false
  }
}

const shortHash = (value: unknown) => {
  const hash = String(value ?? '')
  return hash.length > 12 ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : hash
}

const numberValue = (value: unknown, fallback = 0) => {
  const normalized = typeof value === 'string' ? value.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)?.[0] : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : fallback
}

const formatNumber = (value: unknown, fallback = 0) => numberValue(value, fallback).toLocaleString('zh-CN')

const parseAnimatedNumber = (value: unknown) => {
  const raw = String(value ?? '')
  const normalized = raw.replace(/,/g, '')
  const match = normalized.match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const start = match.index ?? 0
  const numericText = match[0]
  return {
    number: Number(numericText),
    prefix: normalized.slice(0, start),
    suffix: normalized.slice(start + numericText.length),
    decimals: numericText.includes('.') ? numericText.length - numericText.indexOf('.') - 1 : 0,
    grouping: /\d,\d/.test(raw),
  }
}

const formatAnimatedNumber = (value: number, animation: NumericAnimation) => {
  const formatted = value.toLocaleString('zh-CN', {
    useGrouping: animation.grouping,
    minimumFractionDigits: animation.decimals,
    maximumFractionDigits: animation.decimals,
  })
  return animation.prefix + formatted + animation.suffix
}

const cancelNumericAnimation = (animation: NumericAnimation) => {
  if (animation.raf !== undefined) {
    window.cancelAnimationFrame(animation.raf)
    animation.raf = undefined
  }
}

const animateValue = (key: string, value: unknown) => {
  const parsed = parseAnimatedNumber(value)
  const raw = String(value ?? '')
  const existing = numericAnimations.get(key)
  if (!parsed) {
    if (existing) cancelNumericAnimation(existing)
    animatedDisplays[key] = raw
    return
  }

  const state = existing ?? {
    current: parsed.number > 20 ? 20 : 0,
    target: Number.NaN,
    prefix: parsed.prefix,
    suffix: parsed.suffix,
    decimals: parsed.decimals,
    grouping: parsed.grouping,
  }
  numericAnimations.set(key, state)
  state.prefix = parsed.prefix
  state.suffix = parsed.suffix
  state.decimals = parsed.decimals
  state.grouping = parsed.grouping
  if (existing && state.target === parsed.number) {
    if (state.raf === undefined) {
      state.current = parsed.number
      animatedDisplays[key] = formatAnimatedNumber(parsed.number, state)
    }
    return
  }

  cancelNumericAnimation(state)
  const startValue = state.current
  const startTime = performance.now()
  state.target = parsed.number
  const tick = (timestamp: number) => {
    const progress = Math.min(1, (timestamp - startTime) / animationDuration)
    const eased = 1 - Math.pow(1 - progress, 3)
    state.current = startValue + (state.target - startValue) * eased
    animatedDisplays[key] = formatAnimatedNumber(state.current, state)
    if (progress < 1) {
      state.raf = window.requestAnimationFrame(tick)
    } else {
      state.current = state.target
      state.raf = undefined
      animatedDisplays[key] = formatAnimatedNumber(state.target, state)
    }
  }
  state.raf = window.requestAnimationFrame(tick)
}

const metricDisplay = (metric: Metric) => animatedDisplays['metric:' + metric.label] ?? metric.value
const footerDisplay = (card: FooterCard) => animatedDisplays['footer:' + card.title] ?? card.value
const blockDisplay = (block: BlockCard, index: number) => animatedDisplays['block:' + index] ?? block.height
const setFooterCardValue = (card: FooterCard, value: unknown) => {
  card.value = String(value ?? '')
  animateValue('footer:' + card.title, card.value)
}

const advanceBlockCards = () => {
  blockCards.forEach((block, index) => {
    const nextHeight = numberValue(block.height) + 3
    block.height = '#' + nextHeight
    animateValue('block:' + index, block.height)
  })
}

const updateScrollTracks = (timestamp: number) => {
  const previous = previousScrollTime ?? timestamp
  const elapsedSeconds = Math.min((timestamp - previous) / 1000, 0.1)
  previousScrollTime = timestamp
  document.querySelectorAll<HTMLElement>('.scroll-track').forEach((track) => {
    const scrollDistance = track.scrollHeight / 2
    if (!scrollDistance || track.matches(':hover')) return
    const currentOffset = scrollOffsets.get(track) ?? 0
    const nextOffset = (currentOffset + SCROLL_SPEED_PX_PER_SECOND * elapsedSeconds) % scrollDistance
    scrollOffsets.set(track, nextOffset)
    track.style.transform = 'translateY(-' + nextOffset + 'px)'
  })
  scrollFrame = window.requestAnimationFrame(updateScrollTracks)
}

const setMetricValues = (nextMetrics: Metric[]) => {
  metrics.splice(0, metrics.length, ...nextMetrics)
  metrics.forEach((metric) => animateValue('metric:' + metric.label, metric.value))
}

const hasValue = (source: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(source, key) && source[key] != null
const statisticValue = (source: unknown, key: string): unknown => {
  if (Array.isArray(source)) {
    const item = source.find((entry) => {
      if (!entry || typeof entry !== 'object') return false
      const record = entry as Record<string, unknown>
      return [record.key, record.name, record.label, record['指标']].some((value) => String(value ?? '') === key)
    }) as Record<string, unknown> | undefined
    return item?.value ?? item?.['值'] ?? item?.data
  }
  if (!source || typeof source !== 'object') return undefined
  const record = source as Record<string, unknown>
  if (hasValue(record, key)) return record[key]
  for (const container of ['data', 'result', 'list', 'rows', 'records', 'items', 'content']) {
    if (container in record) {
      const value = statisticValue(record[container], key)
      if (value != null) return value
    }
  }
  return undefined
}

const updateFooterCardsFromNode = (nodeMap: ApiResult) => {
  footerCards.forEach((card) => {
    if (card.title === '链上数据' || card.title === '审计留痕') return
    const value = statisticValue(nodeMap, card.title)
    if (value != null) {
      setFooterCardValue(card, value)
    }
  })
}

const updateFooterCardsFromStatus = (statusMap: ApiResult) => {
  footerCards.forEach((card) => {
    if (card.title !== '链上数据' && card.title !== '审计留痕') return
    const value = statisticValue(statusMap, card.title)
    if (value != null) setFooterCardValue(card, value)
  })
}

const nodeValue = (item: Record<string, unknown>) => item.value ?? item['值'] ?? item['节点值'] ?? item['数量'] ?? item['节点数量'] ?? item['数值'] ?? item['指标值'] ?? item['健康度'] ?? item['在线率'] ?? item.data
const nodeName = (item: Record<string, unknown>, fallback: string) => String(item.name ?? item.nodeName ?? item['节点名称'] ?? item['节点'] ?? item.label ?? item.key ?? fallback)
const isHealthyStatus = (value: unknown) => /正常|在线|健康|healthy|online/i.test(String(value ?? ''))
const nodeStatus = (item: Record<string, unknown>) => {
  const explicitStatus = item.status ?? item['状态'] ?? item['节点状态'] ?? item['健康状态']
  if (explicitStatus != null) return String(explicitStatus)
  const rawValue = nodeValue(item)
  if (typeof rawValue === 'string' && Number.isNaN(Number(rawValue.replace(/,/g, '').replace('%', '')))) return rawValue
  return numberValue(rawValue) > 0 ? '正常' : '异常'
}

const nodeNumericValue = (item: Record<string, unknown>) => {
  const rawValue = nodeValue(item)
  if (typeof rawValue === 'string' && Number.isNaN(Number(rawValue.replace(/,/g, '').replace('%', '')))) return isHealthyStatus(rawValue) ? 100 : 0
  return numberValue(rawValue, isHealthyStatus(nodeStatus(item)) ? 100 : 0)
}

const normalizeNodeRows = (value: unknown) => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      .map((item, index) => ({
        name: nodeName(item, `节点${index + 1}`),
        status: nodeStatus(item),
        value: nodeNumericValue(item),
        displayValue: String(nodeValue(item) ?? nodeNumericValue(item)),
      }))
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([name, item]) => {
      const record = item && typeof item === 'object' ? (item as Record<string, unknown>) : { value: item }
      return {
        name: nodeName(record, name),
        status: nodeStatus(record),
        value: nodeNumericValue(record),
        displayValue: String(nodeValue(record) ?? nodeNumericValue(record)),
      }
    })
  }
  if (value != null) {
    return [{ name: '区块链节点监控', status: nodeStatus({ value }), value: nodeNumericValue({ value }), displayValue: String(value) }]
  }
  return []
}

const nodeChartMax = computed(() => Math.max(1, ...nodeStates.map((item) => item.value)))
const nodeBarHeight = (value: number) => {
  const height = nodeChartMax.value <= 100 ? value : (value / nodeChartMax.value) * 100
  return Math.max(value > 0 ? 4 : 0, Math.min(100, height))
}

const applyNodeResult = (node: ApiResult) => {
  const nodeRows = normalizeNodeRows(statisticValue(node, '区块链节点监控'))
  const nodeHeight = numberValue(statisticValue(node, '块高数'))
  const nodeCount = numberValue(statisticValue(node, '节点数'))
  nodeStates.splice(0, nodeStates.length, ...nodeRows)
  nodeSummary.count = nodeCount || nodeStates.length
  nodeSummary.healthy = nodeStates.filter((item) => isHealthyStatus(item.status)).length
  nodeSummary.consensus = String(statisticValue(node, '节点共识') ?? nodeSummary.consensus)
  nodeSummary.health = String(statisticValue(node, '底层链健康') ?? nodeSummary.health)
  nodeSummary.height = nodeHeight ? `#${nodeHeight}` : nodeSummary.height
  updateFooterCardsFromNode(node)
}

const resultRows = (result: ApiResult, key?: string) => {
  if (Array.isArray(result)) return result
  if (!result || typeof result !== 'object') return []
  const source = result as Record<string, unknown>
  if (key && key in source) return resultRows(source[key] as ApiResult, undefined)
  for (const container of ['data', 'result', 'list', 'rows', 'records', 'items', 'content']) {
    if (container in source) {
      const rows = resultRows(source[container] as ApiResult, key)
      if (rows.length) return rows
    }
  }
  return []
}

const resultMap = (result: ApiResult) => {
  if (Array.isArray(result)) return result[0] ?? {}
  if (!result || typeof result !== 'object') return {}
  const source = result as Record<string, unknown>
  for (const container of ['data', 'result']) {
    if (source[container] && typeof source[container] === 'object' && !Array.isArray(source[container])) {
      return resultMap(source[container] as ApiResult)
    }
  }
  return source
}

const updateVerifyTrend = (result: ApiResult) => {
  const rows = resultRows(result)
  if (rows.length) {
    const nextTrend = rows.map((item, index) => ({
      label: String(item['日期'] ?? item.date ?? item['时间'] ?? item.time ?? index + 1),
      verify: numberValue(item['验真'] ?? item.verify ?? item['验真调用'] ?? item['扫码验真']),
      auth: numberValue(item['授权'] ?? item.auth ?? item['授权核验'] ?? item['报告核验']),
    }))
    trend.splice(0, trend.length, ...nextTrend)
    return
  }
  const values = Object.entries(resultMap(result))
    .map(([label, value]) => ({ label, value: numberValue(value) }))
    .filter((item) => Number.isFinite(item.value))
  trend.splice(0, trend.length, ...values.map((item, index) => ({
    label: item.label,
    verify: item.value,
    auth: values[(index + 1) % Math.max(values.length, 1)]?.value ?? item.value,
  })))
}

const updateContracts = (result: ApiResult) => {
  const rows = resultRows(result, '业务智能合约')
  contracts.splice(0, contracts.length, ...rows.map((item) => ({
    title: String(item['大类'] ?? ''),
    value: formatNumber(item['数量']),
    description: String(item['小类'] ?? ''),
  })))
}

const fallbackData: Record<string, ApiResult> = {
  chain_status: {
    '上链数据类型': 15,
    '链上数据': 73,
    'stat_date': '2026-09-04',
    '累计上链记录': 73,
    '验真调用': 6,
    '今日上链记录': 0,
    '接入来源系统': 1,
    '审计留痕': 24,
    '业务智能合约': 15,
  },
  chain_node: {
    '区块链节点监控': [
      { nodeId: 'bc1dd4e9091036573519b0c91b197d341d41e245f34ae3e482ccc2697541220e5a0c2c6875cc3ef9c01b311106aa686528b089ed1b45ea711ee5ba87101ec5a9', nodeName: '节点1', status: '正常' },
      { nodeId: '8464f535a3a1de1f26bf06d05b30d9bd11e57c036746390b8a842235d41cc5f1a72bb36e466da823d9a3885f296988b389c827e94d920eb9c34390828990174f', nodeName: '节点2', status: '正常' },
      { nodeId: '9e90f812411adb519b9cda1d49e3c5803d869b002beb612706934e937b96af26984d5d5978eb936d0fbebb2a0d4fda6de120b800042adf3789c5eef819b3687d', nodeName: '节点3', status: '正常' },
    ],
    '块高数': 27651,
    '节点共识': '3/3',
    '底层链健康': '100%',
    '节点数': 3,
  },
  chain_type: [
    { '数量': 2, '类型': '饮片代煎' },
    { '数量': 1, '类型': '数据查询' },
    { '数量': 1, '类型': '数据验证' },
    { '数量': 3, '类型': '备案信息' },
    { '数量': 3, '类型': '溯源企业' },
    { '数量': 3, '类型': '饮片追溯' },
    { '数量': 1, '类型': '饮片处方' },
    { '数量': 3, '类型': '饮片流转' },
    { '数量': 3, '类型': '药材种植' },
    { '数量': 3, '类型': '饮片扫码' },
    { '数量': 4, '类型': '饮片赋码' },
    { '数量': 1, '类型': '药材流通' },
    { '数量': 3, '类型': '饮片加工' },
    { '数量': 0, '类型': '药材加工' },
  ],
  chain_ent: [
    { '数量': 7, '机构': '某中药饮片有限公司', '类型': '饮片加工 / 饮片流通' },
    { '数量': 1, '机构': '贵州同济中药饮片有限公司', '类型': '药材种植' },
  ],
  chain_newest: [
    { '标识': 'Z52000000548112020102100001008', 'TxHash': '8afd042da184eaf7c032a780110e79a4886f76c9ad7283b99892004dd2102767', 'BlockTime': '2026-07-23 16:29:43', '类型': '饮片赋码' },
    { '标识': 'GYZY202600000001', 'TxHash': '0xe2ea5145ddb4a7b5801fb1dc8eab8c6a62b20c8d276e430d6cd0be774f67f3bc', 'BlockTime': '2026-07-06 10:43:13', '类型': '饮片扫码' },
    { '标识': '25d4de26c7dd182b9884fc9aa8db5c0f', 'TxHash': '0xe2ea5145ddb4a7b5801fb1dc8eab8c6a62b20c8d276e430d6cd0be774f67f3bc', 'BlockTime': '2026-07-23 12:10:39', '类型': '溯源企业' },
    { '标识': 'FL202606220001', 'TxHash': '6c32864f5a04b06ffad71880010ed711070835e2190a5a98d85d2925e2a6396c', 'BlockTime': '2026-07-06 13:46:51', '类型': '备案信息' },
    { '标识': 'GYZY202600000001', 'TxHash': '0xe2ea5145ddb4a7b5801fb1dc8eab8c6a62b20c8d276e430d6cd0be774f67f3bc', '类型': '饮片追溯' },
    { '标识': '260701001', 'TxHash': 'ef34ad7e6fc2f9f5bc1f7f97df432b70084798bc59d5231806e0d77db3ef6d8a', 'BlockTime': '2026-07-23 15:38:18', '类型': '饮片处方' },
  ],
  chain_dongtai: [
    { '标识': 'Z52000000548112020102100001008', '摘要': '8afd042da184eaf7c032a780110e79a4886f76c9ad7283b99892004dd2102767', '类型': '饮片赋码' },
    { '标识': 'GYZY202600000001', '摘要': '8f00b93108adc97e9f487ca2875633c84c0013ccd1b613cc8a9ce6e0eafd2685', '类型': '饮片赋码' },
    { '标识': '520115202606220000000001', '摘要': '2D7A7A01A13D30B7D0A5E58E0A1C30A1D93F8A5A12E72D5F04E5AA1C4A7D819B', '类型': '饮片扫码' },
    { '标识': '25d4de26c7dd182b9884fc9aa8db5c0f', '摘要': '213bec87be3b3c66f4ff55aac2478b1cdae96c807c0205fbb74c8840562e7c8d', '类型': '溯源企业' },
    { '标识': 'FL202606220001', '摘要': '91A8D63EF0A24B4C5D14D73C31A0E5F8C96ABFB50A63A8124B8E5A391CC7F42E', '类型': '备案信息' },
    { '标识': 'GYZY202600000001', '摘要': 'ad13f74566d4aaab205416af328ca08c46a8899ae029664fbfbfcecda58b415b', '类型': '饮片追溯' },
    { '标识': '260701001', '摘要': 'ef34ad7e6fc2f9f5bc1f7f97df432b70084798bc59d5231806e0d77db3ef6d8a', '类型': '饮片处方' },
    { '标识': 'CF202606150001', '摘要': '252fc77af93279337a6a68f0b0dcd2897b326255c06ced8390c86a6cb6968d59', '类型': '饮片代煎' },
    { '标识': 'GYZY202600000001', '摘要': 'a39c807a44dd3f109ebf3ac90091c079870a0164fc8cd17a5c1015958e0db0e1', '类型': '饮片流转' },
    { '标识': 'CF202606150001', '摘要': '05ac8763b908f11370aa98e62c9dbee3c41263f8cfc8be6c956905339cc6f631', '类型': '数据验证' },
    { '标识': 'ZZ20260811001', '摘要': '2a473d8a9e5ca47102affdb0110bdaac36952ded1bfe7bcb6e8885d50d5eb283', '类型': '药材种植' },
    { '标识': 'PR2026000001', '摘要': '1', '类型': '药材加工' },
    { '标识': '11', '摘要': '91A8D63EF0A24B4C5D14D73C31A0E5F8C96ABFB50A63A8124B8E5A391CC7F42E', '类型': '药材流通' },
    { '标识': 'PB20201023026', '摘要': '0dbdb5bce23e6ac1411450375a85375d802b8df685f21ce6d964b64372f6a9e3', '类型': '饮片加工' },
    { '标识': 'PO20210316001', '摘要': '0e23c9f42721e55924d2836648d9bf614d2fbad6ab9af99d95040fdd6444b203', '类型': '饮片流通' },
  ],
  chain_verify: {
    '扫码验真': 12,
    '数据核验': 6,
    '监管查询': 6,
  },
  chain_group: [
    { '数量': 8, '小类': '溯源企业 / 备案信息', '大类': '凭证核验合约' },
    { '数量': 12, '小类': '数据验证 / 数据查询', '大类': '审计留痕合约' },
    { '数量': 24, '小类': '饮片扫码 / 饮片代煎 / 饮片处方', '大类': '履约记录合约' },
    { '数量': 15, '小类': '饮片加工 / 饮片赋码', '大类': '批次存证合约' },
  ],
}

const queryStatistic = async <T extends ApiResult>(bizCode: string): Promise<T> => {
  const requestBody = JSON.stringify({ groupCode: 'gz-screen3', bizCode, params: {} })
  const endpoints = ['/api/stat/statistic/query', 'https://smadev.simmed.cn/api/stat/statistic/query']

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      })
      if (!response.ok) continue
      const payload = (await response.json()) as ApiResponse<T> | T
      const body = payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as ApiResponse<T>)
        : undefined
      const code = body?.code
      const acceptedCodes = new Set(['0', '200', '00000', '20000', 'success', 'SUCCESS'])
      if (body?.success === false || (code != null && !acceptedCodes.has(String(code)))) {
        continue
      }
      const result = body?.result ?? body?.data ?? payload
      if (result != null) return result as T
    } catch {
      // Continue to next endpoint
    }
  }

  const fallback = fallbackData[bizCode]
  if (fallback != null) {
    return fallback as T
  }
  throw new Error(`statistic query returned empty data: ${bizCode}`)
}

const refreshDynamicPanels = async () => {
  const [dynamicResult, verifyResult, groupResult] = await Promise.allSettled([
    queryStatistic<Array<Record<string, unknown>>>('chain_dongtai'),
    queryStatistic<Record<string, unknown>>('chain_verify'),
    queryStatistic<Array<Record<string, unknown>>>('chain_group'),
  ])

  if (dynamicResult.status === 'fulfilled') {
    chainRows.splice(0, chainRows.length, ...resultRows(dynamicResult.value, '链上数据动态'))
  } else {
    console.warn('链上数据动态接口暂不可用', dynamicResult.reason)
  }

  if (verifyResult.status === 'fulfilled') {
    updateVerifyTrend(verifyResult.value)
    verifyStats.splice(0, verifyStats.length, ...Object.entries(resultMap(verifyResult.value)).map(([label, value]) => ({
      label,
      value: String(value ?? ''),
    })))
  } else {
    console.warn('验真与授权核验调用接口暂不可用', verifyResult.reason)
  }

  if (groupResult.status === 'fulfilled') {
    updateContracts(groupResult.value)
  } else {
    console.warn('业务智能合约接口暂不可用', groupResult.reason)
  }
}

const refreshData = async () => {
  void refreshDynamicPanels()
  const results = await Promise.allSettled([
    queryStatistic<Record<string, unknown>>('chain_status'),
    queryStatistic<Record<string, unknown>>('chain_node'),
    queryStatistic<Array<Record<string, unknown>>>('chain_type'),
    queryStatistic<Array<Record<string, unknown>>>('chain_ent'),
    queryStatistic<Array<Record<string, unknown>>>('chain_newest'),
  ])

  const [statusResult, nodeResult, typesResult, entitiesResult, newestResult] = results
  const statusMap = statusResult.status === 'fulfilled' ? statusResult.value : undefined
  const nodeMap = nodeResult.status === 'fulfilled' ? nodeResult.value : undefined

  if (statusMap) {
    const status = resultMap(statusMap)
    updateFooterCardsFromStatus(status)
    const statusMetrics = Object.entries(status)
      .filter(([key]) => key !== 'stat_date')
      .map(([label, value]) => ({ label, value: String(value ?? '') }))
    setMetricValues(statusMetrics)

    const todayOnChainValue = metrics.find((item) => item.label === '今日上链记录')?.value ?? '--'
    sourceStats[0].value = todayOnChainValue
    sourceStats[1].value = todayOnChainValue
    sourceStats[2].value = todayOnChainValue
    sourceStats[3].value = '0'
    const auditValue = statisticValue(status, '审计留痕')
    if (auditValue !== undefined) nodeSummary.audit = formatNumber(auditValue)
  } else {
    console.warn('区块链状态接口暂不可用', statusResult.reason)
  }

  if (nodeMap) {
    applyNodeResult(nodeMap)
    updateFooterCardsFromNode(nodeMap)
  } else {
    console.warn('区块链节点接口暂不可用', nodeResult.reason)
  }

  footerCards[1].description = `共识状态稳定，${nodeSummary.count} 个节点正常运行。`
  footerCards[2].description = `最新区块包含 ${nodeSummary.txCount} 条链上记录。`

  if (typesResult.status === 'fulfilled') {
    const typeRows = resultRows(typesResult.value, '上链数据类型')
    const maxType = Math.max(1, ...typeRows.map((item) => numberValue(item['数量'])))
    dataTypes.splice(0, dataTypes.length, ...typeRows.map((item, index) => ({
      label: String(item['类型'] ?? ''),
      value: formatNumber(item['数量']),
      width: Math.round((numberValue(item['数量']) / maxType) * 100),
      tone: ['cyan', 'mint', 'blue', 'gold'][index % 4],
    })))
  } else {
    console.warn('上链数据类型接口暂不可用', typesResult.reason)
  }

  if (entitiesResult.status === 'fulfilled') {
    const entityRows = resultRows(entitiesResult.value, '主体存证分布')
    subjects.splice(0, subjects.length, ...entityRows.map((item) => [
      String(item['机构'] ?? ''),
      String(item['类型'] ?? ''),
      formatNumber(item['数量']),
    ]))
  } else {
    console.warn('主体存证分布接口暂不可用', entitiesResult.reason)
  }

  if (newestResult.status === 'fulfilled') {
    const newestRows = resultRows(newestResult.value, '最新上链数据').slice(0, 6)
    tasks.splice(0, tasks.length, ...newestRows.map((item) => [
      String(item['类型'] ?? item.type ?? item.dataType ?? ''),
      String(item['标识'] ?? item.id ?? item.dataId ?? item.objectId ?? ''),
      shortHash(item['TxHash'] ?? item.txHash ?? item.hash ?? item.HASH),
    ]))
  } else {
    console.warn('最新上链任务接口暂不可用', newestResult.reason)
  }
}

onMounted(() => {
  updateScreenScale()
  footerCards.forEach((card) => animateValue('footer:' + card.title, card.value))
  blockCards.forEach((block, index) => animateValue('block:' + index, block.height))
  void refreshData()
  dataTimer = window.setInterval(() => void refreshData(), 30000)
  blockTimer = window.setInterval(advanceBlockCards, 3000)
  scrollFrame = window.requestAnimationFrame(updateScrollTracks)
  window.addEventListener('resize', scheduleScreenScaleUpdate)
  window.visualViewport?.addEventListener('resize', scheduleScreenScaleUpdate)
  timer = window.setInterval(() => {
    now.value = new Date(now.value.getTime() + 1000)
    pulse.value = (pulse.value + 1) % 5
  }, 1000)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearInterval(dataTimer)
  window.clearInterval(blockTimer)
  if (scrollFrame !== undefined) window.cancelAnimationFrame(scrollFrame)
  if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame)
  window.removeEventListener('resize', scheduleScreenScaleUpdate)
  window.visualViewport?.removeEventListener('resize', scheduleScreenScaleUpdate)
  numericAnimations.forEach(cancelNumericAnimation)
})
</script>

<template>
  <div class="viewport">
    <Cyber3DBackground />
    <div class="viewport-cyber-nebula" aria-hidden="true"></div>
    <div class="viewport-grid" aria-hidden="true"></div>
    <div class="viewport-scanlines" aria-hidden="true"></div>
    <div class="viewport-vignette" aria-hidden="true"></div>

    <main class="screen" :style="screenStyle">
      <!-- High-Tech Cyber Command Header -->
      <header class="topbar">
        <svg class="topbar-bg" viewBox="0 0 1920 72" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="headerLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0" />
              <stop offset="15%" stop-color="#38bdf8" stop-opacity="0.6" />
              <stop offset="35%" stop-color="#00f0ff" stop-opacity="0.95" />
              <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="65%" stop-color="#00f0ff" stop-opacity="0.95" />
              <stop offset="85%" stop-color="#38bdf8" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#00f0ff" stop-opacity="0" />
            </linearGradient>
            <linearGradient id="headerFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.16" />
              <stop offset="30%" stop-color="#0284c7" stop-opacity="0.08" />
              <stop offset="100%" stop-color="#020713" stop-opacity="0.02" />
            </linearGradient>
            <linearGradient id="centerLaserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.2" />
              <stop offset="30%" stop-color="#38f9d7" stop-opacity="1" />
              <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
              <stop offset="70%" stop-color="#38f9d7" stop-opacity="1" />
              <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.2" />
            </linearGradient>
          </defs>
          <!-- Outer Wing shapes -->
          <polygon points="0,0 600,0 650,48 750,48 780,68 1140,68 1170,48 1270,48 1320,0 1920,0 1920,38 1330,38 1280,72 640,72 590,38 0,38" fill="url(#headerFillGrad)" />
          <!-- High-glow Laser lines -->
          <path d="M0,38 L590,38 L640,72 L1280,72 L1330,38 L1920,38" fill="none" stroke="url(#headerLineGrad)" stroke-width="2.5" />
          <path d="M780,68 L1140,68" fill="none" stroke="url(#centerLaserGrad)" stroke-width="3.5" filter="drop-shadow(0 0 10px #38f9d7)" />
          <line x1="770" y1="48" x2="1150" y2="48" stroke="rgba(0, 240, 255, 0.35)" stroke-width="1" stroke-dasharray="6,4" />
        </svg>

        <div class="topbar-left">
          <div class="cyber-badge">
            <span class="radar-ping"></span>
            <span>链服务运行大屏</span>
          </div>
          <div class="cyber-badge" style="border-color: rgba(56, 249, 215, 0.25);">
            <span style="font-size: 11px; color: #78c5d1;">国密算法</span>
            <b style="color: #38f9d7; font-family: monospace;">SM2/SM3/SM4</b>
          </div>
        </div>

        <div class="topbar-center">
          <h1 class="main-title">中药区块链服务平台</h1>
          <div class="sub-title-strip">
            <span class="line-left"></span>
            <span>TCM BLOCKCHAIN SERVICE PLATFORM · HIGH-TECH TELEMETRY</span>
            <span class="line-right"></span>
          </div>
        </div>

        <div class="topbar-right">
          <div class="clock-display">
            <svg class="clock-icon" viewBox="0 0 24 24">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
            </svg>
            <span>{{ timeText }}</span>
          </div>
          <div class="status-pill">
            <span class="radar-ping"></span>
            <span>链服务运行中</span>
          </div>
          <button class="fullscreen-btn" :title="isFullscreen ? '退出全屏' : '全屏显示'" @click="toggleFullscreen">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path v-if="!isFullscreen" d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              <path v-else d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
            </svg>
          </button>
        </div>
      </header>

      <!-- Top 8 Metric Strip -->
      <section class="metric-strip" aria-label="核心运行指标">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <div class="metric-card-info">
            <span class="card-label">
              <i class="card-label-dot"></i>
              {{ metric.label }}
            </span>
            <strong class="card-value">{{ metricDisplay(metric) }}</strong>
          </div>
          <TechCardIcon :type="metric.label" size="small" />
        </article>
      </section>

      <!-- Main Content Grid (3 Columns) -->
      <section class="content-grid">
        <!-- Left Column -->
        <div class="left-column">
          <!-- 1. 来源系统接入状态 (按附件布局重构) -->
          <section class="panel source-panel">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>
                <svg class="panel-header-shield" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 2L3 7v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5z" stroke="#00f2fe" fill="rgba(0,242,254,0.18)"/>
                  <circle cx="12" cy="12" r="3" fill="#38f9d7"/>
                </svg>
                来源系统接入状态
              </h2>
              <div class="header-deco"><span></span><span></span><span></span></div>
            </div>

            <div class="source-tree-layout">
              <!-- Top Main Hub Node (贵州省中药材质量追溯平台) -->
              <div class="source-main-card">
                <div class="main-card-glow" aria-hidden="true"></div>
                <div class="main-card-content">
                  <b class="main-platform-name">贵州省中药材质量追溯平台</b>
                  <span class="main-platform-rate">接口可用率 {{ sourceOnline ? '100%' : '--' }}</span>
                </div>
                <div class="main-card-status">
                  <span class="online-pill-badge">
                    <i class="online-pulse-dot"></i>
                    {{ sourceOnline ? '在线' : '--' }}
                  </span>
                </div>
              </div>

              <!-- Circuit Tree Branching Connectors -->
              <div class="source-branch-bus" aria-hidden="true">
                <svg class="branch-tree-svg" viewBox="0 0 440 22" preserveAspectRatio="none">
                  <!-- Trunk line down from center of top card -->
                  <line class="tree-line trunk" x1="220" y1="0" x2="220" y2="12" />
                  <!-- Horizontal bus line across 4 child nodes -->
                  <line class="tree-line bus" x1="55" y1="12" x2="385" y2="12" />
                  <!-- 4 Down drops into child cards -->
                  <line class="tree-line drop" x1="55" y1="12" x2="55" y2="19" />
                  <line class="tree-line drop" x1="165" y1="12" x2="165" y2="19" />
                  <line class="tree-line drop" x1="275" y1="12" x2="275" y2="19" />
                  <line class="tree-line drop" x1="385" y1="12" x2="385" y2="19" />
                  <!-- Center dot & arrowheads -->
                  <circle class="tree-dot" cx="220" cy="12" r="2.5" />
                  <polygon class="tree-arrow" points="52,17 58,17 55,21" />
                  <polygon class="tree-arrow" points="162,17 168,17 165,21" />
                  <polygon class="tree-arrow" points="272,17 278,17 275,21" />
                  <polygon class="tree-arrow" points="382,17 388,17 385,21" />
                </svg>
              </div>

              <!-- 4 Sub-nodes Grid (GAP基地管理, 饮片追溯, 医疗机构, 检测机构 + 原有内容) -->
              <div class="source-nodes-grid">
                <div
                  v-for="(item, index) in sourceStats"
                  :key="item.label"
                  class="source-node-card"
                  :class="{ warning: item.label === '异常' && item.value !== '0' }"
                >
                  <!-- High-tech Node Icon matching the image -->
                  <div class="node-icon-wrapper">
                    <!-- 1. GAP基地管理 (Sprout) -->
                    <svg v-if="index === 0" class="node-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M12 22v-9" stroke="#38f9d7" stroke-linecap="round"/>
                      <path d="M12 13c-3-2-7-1.5-8 2 3.5 0 6.5 1.5 8 5" stroke="#38f9d7" fill="rgba(56,249,215,0.2)"/>
                      <path d="M12 9c3-3 7-2 8 2-3.5.5-6.5 2-8 6" stroke="#38f9d7" fill="rgba(56,249,215,0.2)"/>
                    </svg>
                    <!-- 2. 饮片追溯 (Certificate) -->
                    <svg v-else-if="index === 1" class="node-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                      <rect x="5" y="3" width="14" height="18" rx="2" stroke="#00f2fe" fill="rgba(0,242,254,0.16)"/>
                      <line x1="8" y1="7" x2="16" y2="7" stroke="#00f2fe" stroke-linecap="round"/>
                      <line x1="8" y1="11" x2="13" y2="11" stroke="#00f2fe" stroke-linecap="round"/>
                      <circle cx="15" cy="15" r="3" stroke="#38f9d7" fill="rgba(56,249,215,0.3)"/>
                      <path d="M14 15l1 1 2-2" stroke="#38f9d7" stroke-linecap="round"/>
                    </svg>
                    <!-- 3. 医疗机构 (Hospital Cross) -->
                    <svg v-else-if="index === 2" class="node-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M4 8h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z" stroke="#00f2fe" fill="rgba(0,242,254,0.16)"/>
                      <path d="M9 8V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3" stroke="#00f2fe"/>
                      <path d="M12 11v6M9 14h6" stroke="#38f9d7" stroke-linecap="round" stroke-width="2"/>
                    </svg>
                    <!-- 4. 检测机构 (Flask) -->
                    <svg v-else class="node-svg-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8">
                      <path d="M10 2v5L5.5 17a3 3 0 0 0 2.5 5h8a3 3 0 0 0 2.5-5L14 7V2h-4z" stroke="#00f2fe" fill="rgba(0,242,254,0.16)"/>
                      <line x1="9" y1="2" x2="15" y2="2" stroke="#00f2fe" stroke-linecap="round"/>
                      <circle cx="10" cy="15" r="1.5" fill="#38f9d7"/>
                      <circle cx="13.5" cy="17.5" r="1.5" fill="#38f9d7"/>
                    </svg>
                  </div>

                  <!-- Original Content & Titles Preserved -->
                  <div class="node-title-group">
                    <span class="node-label">{{ item.label }}</span>
                    <small class="node-sub" :title="item.sub">{{ item.sub }}</small>
                  </div>

                  <strong class="node-value">{{ item.value }}</strong>

                  <div class="node-status-badge">
                    <i class="status-dot"></i>
                    <span>{{ item.label === '异常' && item.value !== '0' ? '异常' : '在线' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. 上链数据类型分布 -->
          <section class="panel types-panel">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>上链数据类型分布</h2>
              <div class="header-deco"><span></span><span></span><span></span></div>
            </div>
            <div class="types-scroll-viewport">
              <div class="scroll-track types-scroll">
                <div v-for="copy in 2" :key="copy" class="scroll-group">
                  <div v-for="(item, index) in scrollingDataTypes" :key="`${copy}-${index}`" class="bar-row">
                    <span>{{ item.label }}</span>
                    <div class="bar-track">
                      <i :class="item.tone" :style="{ width: `${item.width}%` }"></i>
                    </div>
                    <b>{{ item.value }}</b>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. 主体存证分布 -->
          <section class="panel subjects-panel">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>主体存证分布</h2>
              <div class="header-deco"><span></span><span></span><span></span></div>
            </div>
            <div class="table-head">
              <span>业务主体</span>
              <span>主要类型</span>
              <span style="text-align: right;">记录数</span>
            </div>
            <div class="scroll-viewport">
              <div class="scroll-track subjects-scroll">
                <div v-for="copy in 2" :key="copy" class="scroll-group">
                  <div v-for="(row, index) in scrollingSubjects" :key="`${copy}-${index}`" class="table-row">
                    <span :title="row[0]">{{ row[0] }}</span>
                    <span :title="row[1]">{{ row[1] }}</span>
                    <b style="text-align: right;">{{ row[2] }}</b>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Center Column: 上链任务实时处理 & 核心反应堆 & 区块写入 -->
        <section class="panel center-panel" id="center-task-engine">
          <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div><div class="corner corner-br"></div>

          <div class="panel-header">
            <h2>上链任务实时处理</h2>
            <div class="header-deco"><span></span><span></span><span></span></div>
          </div>

          <div class="stage-tech-bar">
            <div class="tech-item"><i class="tech-live-dot"></i><span>共识算法:</span><b>BFT-Raft</b></div>
            <div class="tech-item">
              <i class="tech-live-dot tps-dot"></i>
              <span>实时TPS:</span>
              <b class="tps-val">128/s</b>
              <span class="tps-wave-bars" aria-hidden="true">
                <i class="bar-1"></i><i class="bar-2"></i><i class="bar-3"></i><i class="bar-4"></i>
              </span>
            </div>
            <div class="tech-item"><i class="tech-live-dot"></i><span>加密算法:</span><b>SM2 / SM3 国密</b></div>
            <div class="tech-item"><i class="tech-live-dot latency-dot"></i><span>通信时延:</span><b>&lt; 15ms</b></div>
          </div>

          <!-- Flow Stage Headers (Cyber Pipeline Steps) -->
          <div class="flow-labels">
            <div class="flow-label-item active-step">
              <span class="step-num">01</span>
              <span class="step-text">上链请求</span>
              <span class="flow-arrow" aria-hidden="true">»</span>
            </div>
            <div class="flow-label-item">
              <span class="step-num">02</span>
              <span class="step-text">HASH摘要 / 存证处理</span>
              <span class="flow-arrow" aria-hidden="true">»</span>
            </div>
            <div class="flow-label-item">
              <span class="step-num">03</span>
              <span class="step-text">区块写入</span>
            </div>
          </div>

          <!-- Interactive Graphic Stage -->
          <div class="flow-stage">
            <!-- Left Tasks List (Static High-Tech Modules - Cycling Removed) -->
            <div class="task-list">
              <article
                v-for="(task, index) in tasks"
                :key="task[1]"
                class="task-card-cyber"
              >
                <div class="task-card-glow" aria-hidden="true"></div>
                <div class="task-card-header">
                  <span class="task-index-chip">0{{ index + 1 }}</span>
                  <b>{{ task[0] }}</b>
                  <i class="task-pulse-beacon"></i>
                </div>
                <small :title="task[1]">{{ task[1] }}</small>
              </article>
            </div>

            <!-- Hash List -->
            <div class="hash-list">
              <div
                v-for="task in tasks"
                :key="task[2]"
                class="hash-item-chip"
                :title="task[2]"
              >
                <span class="hash-type-badge">SM3</span>
                <span class="hash-code">{{ task[2] }}</span>
              </div>
            </div>

            <!-- Animated Laser Connectors -->
            <svg class="flow-connectors" viewBox="0 0 820 470" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.35" />
                  <stop offset="60%" stop-color="#38f9d7" stop-opacity="0.85" />
                  <stop offset="100%" stop-color="#ffffff" stop-opacity="1" />
                </linearGradient>
                <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#38f9d7" stop-opacity="0.9" />
                  <stop offset="60%" stop-color="#ffd200" stop-opacity="0.95" />
                  <stop offset="100%" stop-color="#ff9800" stop-opacity="1" />
                </linearGradient>
                <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <!-- Base laser routes -->
              <path
                v-for="(task, index) in tasks"
                :key="`connector-base-${index}`"
                :d="connectorPath(index)"
                class="laser-path-bg"
              />
              <path
                v-for="(task, index) in tasks"
                :key="`connector-laser-${index}`"
                :d="connectorPath(index)"
                class="laser-path"
              />
              <!-- Bridge from processor to the latest writing block -->
              <path d="M580 235 C615 235, 610 368, 640 368" class="laser-path-bridge" />
              <!-- Animated Data Pulse Packets flowing into block 3 -->
              <circle
                class="data-pulse-orb"
                r="4.5"
              >
                <animateMotion
                  path="M580 235 C615 235, 610 368, 640 368"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            <!-- Holographic Core / Central 3D Processor -->
            <div class="processor-wrapper">
              <!-- Holographic Radar Aperture & Gyro Rings -->
              <div class="hud-gyro-stage">
                <div class="hud-radar-disc"></div>
                <div class="hud-ring-3d ring-x"></div>
                <div class="hud-ring-3d ring-y"></div>
                <div class="hud-ring-3d ring-z"></div>
                <div class="hud-crosshair-lines"></div>
                <div class="orbit-particle p1"></div>
                <div class="orbit-particle p2"></div>
                <div class="orbit-particle p3"></div>
                <div class="orbit-particle p4"></div>
              </div>
              <div class="processor-core">
                <div class="core-plasma"></div>
                <div class="core-wireframe"></div>
                <div class="core-hex-border"></div>
                <b>上链<br />处理器</b>
                <small>HASH / 区块</small>
                <div class="core-pulse-ring"></div>
              </div>
            </div>

            <!-- High-Tech 3D Blockchain Ledger / Isometric Writing Blocks -->
            <div class="block-write-visual" aria-label="区块写入状态">
              <!-- Inter-block Cryptographic Hash Chain Conduits -->
              <svg class="block-chain-conduits" viewBox="0 0 240 470" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="chainLinkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#00f2fe" stop-opacity="0.8" />
                    <stop offset="50%" stop-color="#38f9d7" stop-opacity="1" />
                    <stop offset="100%" stop-color="#ffd200" stop-opacity="0.9" />
                  </linearGradient>
                </defs>
                <!-- Vertical Link 1 -> 2 -->
                <line class="conduit-rail" x1="108" y1="112" x2="108" y2="168" />
                <line class="conduit-neon" x1="108" y1="112" x2="108" y2="168" />
                <circle class="conduit-bead bead-1" cx="108" cy="140" r="3" />
                <g transform="translate(108, 140)">
                  <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#041624" stroke="rgba(0,240,255,0.4)" stroke-width="1" />
                  <text x="0" y="3.5" font-size="8" fill="#38f9d7" text-anchor="middle" font-family="Consolas, monospace" font-weight="700">LINKED</text>
                </g>

                <!-- Vertical Link 2 -> 3 -->
                <line class="conduit-rail" x1="108" y1="264" x2="108" y2="320" />
                <line class="conduit-neon neon-gold" x1="108" y1="264" x2="108" y2="320" />
                <circle class="conduit-bead bead-2" cx="108" cy="292" r="3" />
                <g transform="translate(108, 292)">
                  <rect x="-26" y="-7" width="52" height="14" rx="3" fill="#181203" stroke="rgba(255,210,0,0.5)" stroke-width="1" />
                  <text x="0" y="3.5" font-size="8" fill="#ffd200" text-anchor="middle" font-family="Consolas, monospace" font-weight="700">PREV_HASH</text>
                </g>
              </svg>

              <!-- 3 Mathematically Aligned 3D Isometric Voxel Blocks -->
              <article
                v-for="(block, index) in blockCards"
                :key="'block-' + index"
                class="iso-block-card"
                :class="[
                  `iso-block-${index + 1}`,
                  { 'iso-writing-mode': index === blockCards.length - 1 }
                ]"
              >
                <!-- Isometric Ground Elevation Shadow -->
                <div class="iso-floor-shadow" aria-hidden="true"></div>

                <!-- 3D Top Face (Isometric Roof / 轴测顶面) -->
                <div class="iso-face-top" aria-hidden="true">
                  <div class="iso-top-grid"></div>
                  <div class="iso-top-content">
                    <span class="iso-top-pin pin-left"></span>
                    <span class="iso-top-circuit"></span>
                    <span class="iso-top-label">{{ index === blockCards.length - 1 ? 'PACKING // 写入中' : 'SEALED // 已封存' }}</span>
                    <span class="iso-top-pin pin-right"></span>
                  </div>
                </div>

                <!-- 3D Front Face (Sharp Crystal-Clear Data HUD / 轴测正面) -->
                <div class="iso-face-front">
                  <!-- Holographic Laser Scanner (Sweeping on Writing Block) -->
                  <div v-if="index === blockCards.length - 1" class="iso-scanner-sweep" aria-hidden="true">
                    <span class="scanner-beam-line"></span>
                    <span class="scanner-glow-curtain"></span>
                  </div>

                  <!-- Corner Tech Brackets -->
                  <div class="iso-corner corner-tl"></div>
                  <div class="iso-corner corner-tr"></div>
                  <div class="iso-corner corner-bl"></div>
                  <div class="iso-corner corner-br"></div>

                  <!-- Header: Block Height & Status -->
                  <div class="iso-card-head">
                    <div class="iso-height-group">
                      <span class="iso-hash-symbol">#</span>
                      <b class="iso-height-text">{{ blockDisplay(block, index).replace('#', '') }}</b>
                    </div>
                    <div
                      class="iso-status-tag"
                      :class="index === blockCards.length - 1 ? 'status-writing' : (index === 0 ? 'status-consensus' : 'status-committed')"
                    >
                      <i class="iso-status-dot"></i>
                      <span>{{ index === blockCards.length - 1 ? '正在写入' : (index === 0 ? '已入共识' : '已入链存储') }}</span>
                    </div>
                  </div>

                  <!-- Body: Merkle Root & Details -->
                  <div class="iso-card-body">
                    <div class="iso-root-chip">
                      <span class="root-chip-label">ROOT</span>
                      <span class="root-chip-val" :title="block.root">{{ block.root }}</span>
                    </div>
                    <div class="iso-meta-row">
                      <span class="meta-tx-badge">
                        <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
                          <path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h8v2H2v-2z"/>
                        </svg>
                        <b>{{ block.tx }}</b> TXs
                      </span>
                      <span class="meta-sep">/</span>
                      <span class="meta-timestamp">{{ block.time }}</span>
                      <span class="meta-engine-tag">BFT-RAFT</span>
                    </div>
                  </div>
                </div>

                <!-- 3D Right Depth Face (Isometric Depth Extrusion / 轴测侧面) -->
                <div class="iso-face-right" aria-hidden="true">
                  <div class="iso-depth-fins">
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <div class="iso-depth-leds">
                    <i class="depth-led"></i>
                    <i class="depth-led"></i>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- Lower Contracts Area -->
          <div class="contracts-section">
            <div class="contracts-title-bar">
              <div class="contracts-title-left">
                <h3>业务智能合约</h3>
                <span class="contracts-sub-tag">CHAINCODE ENGINES</span>
              </div>
              <span class="contracts-status-badge">
                <i class="status-live-beacon"></i>
                4 个智能合约引擎常驻共识中
              </span>
            </div>
            <div class="contract-grid">
              <article v-for="item in contracts" :key="item.title" class="contract-card">
                <TechCardIcon :type="item.title" size="small" />
                <div class="contract-card-right">
                  <div class="contract-card-header">
                    <span class="contract-title">{{ item.title }}</span>
                    <span class="contract-status-pill">
                      <i class="contract-status-dot"></i>
                      常驻
                    </span>
                  </div>
                  <div class="contract-card-body">
                    <div class="contract-val-box">
                      <strong class="contract-val-neon">{{ item.value }}</strong>
                      <span class="contract-unit">项</span>
                    </div>
                    <p class="contract-desc" :title="item.description">{{ item.description }}</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- Right Column -->
        <div class="right-column">
          <!-- 1. 链上数据动态 -->
          <section class="panel chain-panel">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>链上数据动态</h2>
              <div class="header-deco"><span></span><span></span><span></span></div>
            </div>
            <div class="table-head chain-table" :style="chainGridStyle">
              <span v-for="column in chainColumns" :key="column">{{ column }}</span>
            </div>
            <div class="scroll-viewport">
              <div class="scroll-track chain-scroll">
                <div v-for="copy in 2" :key="copy" class="scroll-group">
                  <div
                    v-for="(row, index) in scrollingChainRows"
                    :key="'row-' + copy + '-' + index"
                    class="table-row chain-table"
                    :style="chainGridStyle"
                  >
                    <span v-for="column in chainColumns" :key="column" :title="String(row[column] ?? '')">
                      <span v-if="column === '类型'" class="chain-tag">{{ row[column] ?? '' }}</span>
                      <template v-else>{{ row[column] ?? '' }}</template>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 2. 验真与授权核验调用 -->
          <section class="panel chart-panel" aria-label="验真与授权核验调用">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>
                <svg class="panel-header-shield" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#00f2fe" fill="rgba(0,242,254,0.18)"/>
                </svg>
                验真与授权核验调用
              </h2>
              <div class="verify-legend-group">
                <span class="v-legend-item legend-verify">
                  <i class="v-legend-dot"></i>
                  <span>扫码验真</span>
                </span>
                <span class="v-legend-item legend-auth">
                  <i class="v-legend-dot"></i>
                  <span>授权核验</span>
                </span>
              </div>
            </div>

            <!-- Enhanced Cyber Wave Telemetry Chart -->
            <div class="chart-wrap verify-chart-hud">
              <span class="chart-hud-corner corner-tl"></span>
              <span class="chart-hud-corner corner-tr"></span>
              <span class="chart-hud-corner corner-bl"></span>
              <span class="chart-hud-corner corner-br"></span>

              <!-- Left Y-Axis Scale Marks -->
              <div class="chart-y-axis" aria-hidden="true">
                <span>150</span>
                <span>100</span>
                <span>50</span>
                <span>0</span>
              </div>

              <!-- Main SVG Canvas -->
              <div class="chart-svg-box">
                <svg viewBox="0 0 400 90" preserveAspectRatio="none">
                  <defs>
                    <filter id="verifyGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <filter id="authGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.5" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                    <linearGradient id="verifyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#38f9d7" stop-opacity="0.45" />
                      <stop offset="60%" stop-color="#00f2fe" stop-opacity="0.15" />
                      <stop offset="100%" stop-color="#00f2fe" stop-opacity="0" />
                    </linearGradient>
                    <linearGradient id="authGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#ffd200" stop-opacity="0.45" />
                      <stop offset="60%" stop-color="#ff9800" stop-opacity="0.12" />
                      <stop offset="100%" stop-color="#ffd200" stop-opacity="0" />
                    </linearGradient>
                    <linearGradient id="verifyLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#00f2fe" />
                      <stop offset="100%" stop-color="#38f9d7" />
                    </linearGradient>
                    <linearGradient id="authLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stop-color="#ff9800" />
                      <stop offset="100%" stop-color="#ffd200" />
                    </linearGradient>
                  </defs>

                  <!-- Background Grid Lines -->
                  <path class="gridline" d="M0 16H400M0 38H400M0 60H400M0 80H400" />

                  <!-- Vertical Guide Ticks -->
                  <line x1="80" y1="10" x2="80" y2="80" stroke="rgba(0,240,255,0.06)" stroke-dasharray="2 3" />
                  <line x1="160" y1="10" x2="160" y2="80" stroke="rgba(0,240,255,0.06)" stroke-dasharray="2 3" />
                  <line x1="240" y1="10" x2="240" y2="80" stroke="rgba(0,240,255,0.06)" stroke-dasharray="2 3" />
                  <line x1="320" y1="10" x2="320" y2="80" stroke="rgba(0,240,255,0.06)" stroke-dasharray="2 3" />

                  <!-- Area Gradients -->
                  <polygon v-if="chartPoints.verifyArea" :points="chartPoints.verifyArea" fill="url(#verifyGrad)" />
                  <polygon v-if="chartPoints.authArea" :points="chartPoints.authArea" fill="url(#authGrad)" />

                  <!-- Glowing Neon Polylines -->
                  <polyline class="line verify" :points="chartPoints.verify" stroke="url(#verifyLineGrad)" filter="url(#verifyGlowFilter)" />
                  <polyline class="line auth" :points="chartPoints.auth" stroke="url(#authLineGrad)" filter="url(#authGlowFilter)" />

                  <!-- Real-time Active Pulse Nodes -->
                  <g :transform="`translate(400, ${75 - (latestTrend.verify / 170) * 58})`">
                    <circle r="7" fill="none" stroke="#38f9d7" stroke-width="1.2" class="v-pulse-beacon-ring" />
                    <circle r="3.5" fill="#38f9d7" stroke="#ffffff" stroke-width="1.5" />
                  </g>
                  <g :transform="`translate(400, ${75 - (latestTrend.auth / 170) * 58})`">
                    <circle r="7" fill="none" stroke="#ffd200" stroke-width="1.2" class="v-pulse-beacon-ring ring-gold" />
                    <circle r="3.5" fill="#ffd200" stroke="#ffffff" stroke-width="1.5" />
                  </g>
                </svg>

                <!-- High-tech Sweeping Holographic Laser Bar -->
                <div class="chart-laser-beam" aria-hidden="true"></div>
              </div>

              <!-- Time Horizon Reference Axis -->
              <div class="chart-x-axis" aria-hidden="true">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span class="x-live-badge">
                  <i class="x-live-dot"></i>
                  实时
                </span>
              </div>
            </div>

            <!-- Cryptographic Channels Telemetry Metrics -->
            <div class="chart-stats verify-stats-cyber">
              <article
                v-for="(item, index) in verifyStats"
                :key="item.label"
                class="verify-stat-card"
                :class="getVerifyTone(index)"
              >
                <div class="v-card-top">
                  <div class="v-icon-badge">
                    <svg v-if="getVerifyIcon(item.label) === 'scan'" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                      <rect x="7" y="7" width="10" height="10" rx="1.5" stroke-dasharray="2 2" />
                    </svg>
                    <svg v-else-if="getVerifyIcon(item.label) === 'shield'" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                    <svg v-else viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      <circle cx="11" cy="11" r="3" />
                    </svg>
                  </div>
                  <span class="v-card-label">{{ item.label }}</span>
                  <span class="v-card-status">正常</span>
                </div>

                <div class="v-card-mid">
                  <strong class="v-card-number">{{ item.value }}</strong>
                  <span class="v-card-unit">次</span>
                </div>

                <div class="v-card-bot">
                  <div class="v-spark-meter" aria-hidden="true">
                    <span class="seg active"></span>
                    <span class="seg active"></span>
                    <span class="seg active"></span>
                    <span class="seg"></span>
                  </div>
                  <span class="v-card-subtext">{{ getVerifySub(item.label) }}</span>
                </div>
              </article>
            </div>
          </section>

          <!-- 3. 区块链节点监控 -->
          <section class="panel node-panel" aria-label="区块链节点监控">
            <div class="corner corner-tl"></div><div class="corner corner-tr"></div>
            <div class="corner corner-bl"></div><div class="corner corner-br"></div>
            <div class="panel-header">
              <h2>区块链节点监控</h2>
              <div class="header-deco"><span></span><span></span><span></span></div>
            </div>

            <!-- 3D P2P Consensus Node Stage -->
            <div class="node-stage-wrapper">
              <!-- Node 3D Energy Pods (Equally Distributed) -->
              <div
                class="node-pods-grid"
                :style="{ gridTemplateColumns: `repeat(${nodeStates.length || 3}, minmax(0, 1fr))` }"
              >
                <div
                  v-for="node in nodeStates"
                  :key="node.name"
                  class="node-pod-card"
                  :class="{ 'pod-warning': !isHealthyStatus(node.status) }"
                >
                  <!-- Holographic Node Header -->
                  <div class="pod-head">
                    <span class="pod-radar-dot" :class="{ unhealthy: !isHealthyStatus(node.status) }"></span>
                    <span class="pod-title">{{ node.name }}</span>
                  </div>

                  <!-- 3D Reactor Energy Column -->
                  <div class="pod-reactor-3d">
                    <!-- Top Cap Halo -->
                    <div class="reactor-cap-top">
                      <span class="cap-ring"></span>
                    </div>

                    <!-- Reactor Column Body with Digital Scale -->
                    <div class="reactor-body">
                      <div class="scale-ticks">
                        <span></span><span></span><span></span><span></span>
                      </div>
                      <!-- Liquid Energy Core with Glow -->
                      <div
                        class="reactor-liquid"
                        :class="{ unhealthy: !isHealthyStatus(node.status) }"
                        :style="{ height: `${nodeBarHeight(node.value)}%` }"
                      >
                        <span class="liquid-surface"></span>
                        <span class="liquid-bubble"></span>
                      </div>
                    </div>

                    <!-- Base Pedestal Ground -->
                    <div class="reactor-base">
                      <div class="base-ripple"></div>
                    </div>
                  </div>

                  <!-- Value Readout & Status Tag -->
                  <div class="pod-footer">
                    <strong class="pod-val">{{ node.displayValue }}</strong>
                    <span class="pod-badge" :class="{ unhealthy: !isHealthyStatus(node.status) }">
                      {{ node.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Console Status Summary -->
            <div class="node-summary-hud">
              <div class="hud-tally">
                <i class="hud-beacon"></i>
                <span>正常节点 <b class="num-healthy">{{ nodeSummary.healthy }}</b> 个，异常节点 <b :class="nodeSummary.count > nodeSummary.healthy ? 'num-warn' : 'num-normal'">{{ Math.max(0, nodeSummary.count - nodeSummary.healthy) }}</b> 个</span>
              </div>
              <div class="hud-consensus-badge">
                <span class="orbit-mini-ring"></span>
                <span>共识: <b>{{ nodeSummary.consensus }}</b></span>
              </div>
            </div>
          </section>
        </div>
      </section>

      <!-- Bottom 5 Summary Cards Grid -->
      <footer class="footer-grid" aria-label="系统综合存证与健康概况">
        <article v-for="card in footerCards" :key="card.title" class="footer-card">
          <TechCardIcon :type="card.title" size="large" />
          <div class="footer-card-body">
            <div class="card-head">
              <span class="card-title">{{ card.title }}</span>
              <span class="card-suffix">{{ card.suffix }}</span>
            </div>
            <div class="card-val-box">
              <strong class="card-value">{{ footerDisplay(card) }}</strong>
            </div>
            <span class="card-desc" :title="card.description">{{ card.description }}</span>
          </div>
        </article>
      </footer>
    </main>
  </div>
</template>
