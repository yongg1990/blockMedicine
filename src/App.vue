<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

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
  { label: '今日提交', value: '--' },
  { label: '今日上链', value: '--' },
  { label: '写入中', value: '--' },
  { label: '异常', value: '0' },
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
const contracts = reactive<Contract[]>([])
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
    if (column === '类型') return '82px'
    if (column === '标识') return '1.15fr'
    if (column === '摘要' || column === 'HASH摘要') return '1.35fr'
    return '.72fr'
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
const SCROLL_SPEED_PX_PER_SECOND = 6
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

const timeText = computed(() => now.value.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }).replace(/\//g, '-'))
const chartPoints = computed(() => {
  const max = 170
  const xStep = trend.length > 1 ? 220 / (trend.length - 1) : 220
  return {
    verify: trend.map((item, index) => `${index * xStep},${90 - (item.verify / max) * 70}`).join(' '),
    auth: trend.map((item, index) => `${index * xStep},${90 - (item.auth / max) * 70}`).join(' '),
  }
})
const latestTrend = computed(() => trend[trend.length - 1] ?? { verify: 0, auth: 0 })
const sourceOnline = computed(() => sourceStats.slice(0, 3).some((item) => item.value !== '--'))
const connectorPath = (index: number) => {
  const y = 29 + index * 56.4
  return `M210 ${y}H266M371 ${y}H385L397 161`
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
    // The backend field name is the card title; do not maintain a second mapping.
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
      const record = item && typeof item === 'object' ? item as Record<string, unknown> : { value: item }
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
const refreshNodePanel = async () => {
  try {
    const node = await queryStatistic<Record<string, unknown>>('chain_node')
    applyNodeResult(node)
  } catch (error) {
    console.warn('区块链节点接口暂不可用', error)
  }
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
const queryStatistic = async <T extends ApiResult>(bizCode: string) => {
  // Dev server uses the Vite /api proxy; only packaged production assets use the deployment prefix.
  const apiPrefix = import.meta.env.DEV ? '' : '/blockMedicine'
  const response = await fetch(`${apiPrefix}/api/stat/statistic/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupCode: 'gz-screen3', bizCode, params: {} }),
  })
  if (!response.ok) throw new Error(`statistic query failed: ${response.status}`)
  const payload = (await response.json()) as ApiResponse<T> | T
  const body = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as ApiResponse<T>
    : undefined
  const code = body?.code
  const acceptedCodes = new Set(['0', '200', '00000', '20000', 'success', 'SUCCESS'])
  if (body?.success === false || (code != null && !acceptedCodes.has(String(code)))) {
    throw new Error(`statistic query rejected: ${bizCode}`)
  }
  const result = body?.result ?? body?.data ?? payload
  if (result == null) throw new Error(`statistic query returned empty data: ${bizCode}`)
  return result as T
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
    // The source system summary follows the headline "今日上链记录" metric.
    // Keep all active counters aligned with that backend value; exceptions are a fixed zero state.
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
  } else {
    console.warn('区块链节点接口暂不可用', nodeResult.reason)
  }

  // Bottom cards are driven only by the chain_node response.
  if (nodeMap) updateFooterCardsFromNode(nodeMap)
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

  /*
   * Each statistic is applied independently above. Keeping this refresh loop
   * alive lets a transient failure recover on the next scheduled request.
   */
  return
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
    <main class="screen" :style="screenStyle">
      <header class="topbar">
        <div class="brand-dot"></div><span>链服务运行大屏</span>
        <h1>中药区块链服务平台</h1>
        <div class="top-status"><span class="brand-dot"></span>{{ timeText }} <i></i> 链服务运行中</div>
      </header>

      <section class="metric-strip">
        <article v-for="metric in metrics" :key="metric.label" class="metric-card">
          <span>{{ metric.label }}</span><strong>{{ metricDisplay(metric) }}</strong>
        </article>
      </section>

      <section class="content-grid">
        <div class="left-column">
          <section class="panel source-panel">
            <h2>来源系统接入状态</h2>
            <div class="source-head"><div><b>省中药材质量追溯平台</b><small>API网关 / 前置节点 / 批量任务接入</small></div><div class="online"><strong>{{ sourceOnline ? '在线' : '--' }}</strong><small>接口可用率 {{ sourceOnline ? '100%' : '--' }}</small></div></div>
            <div class="mini-grid"><div v-for="item in sourceStats" :key="item.label"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></div>
          </section>
          <section class="panel types-panel">
            <h2>上链数据类型分布</h2>
            <div class="types-scroll-viewport">
              <div class="scroll-track types-scroll">
                <div v-for="copy in 2" :key="copy" class="scroll-group">
                  <div v-for="(item, index) in scrollingDataTypes" :key="`${copy}-${index}`" class="bar-row"><span>{{ item.label }}</span><div class="bar-track"><i :class="item.tone" :style="{ width: `${item.width}%` }"></i></div><b>{{ item.value }}</b></div>
                </div>
              </div>
            </div>
          </section>
          <section class="panel subjects-panel">
            <h2>主体存证分布</h2>
            <div class="table-head"><span>业务主体</span><span>主要类型</span><span>记录数</span></div>
            <div class="scroll-viewport">
              <div class="scroll-track subjects-scroll">
                <div v-for="copy in 2" :key="copy" class="scroll-group">
                  <div v-for="(row, index) in scrollingSubjects" :key="`${copy}-${index}`" class="table-row"><span>{{ row[0] }}</span><span>{{ row[1] }}</span><b>{{ row[2] }}</b></div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section class="panel center-panel">
          <h2>上链任务实时处理</h2>
          <div class="flow-labels"><span>上链请求</span><span>HASH摘要 / 存证处理</span><span>区块写入</span></div>
          <div class="flow-stage">
            <div class="task-list"><article v-for="task in tasks" :key="task[1]"><b>{{ task[0] }}</b><small>{{ task[1] }}</small></article></div>
            <div class="hash-list"><span v-for="task in tasks" :key="task[2]">{{ task[2] }}</span></div>
            <svg class="flow-connectors" viewBox="0 0 820 350" preserveAspectRatio="none" aria-hidden="true">
              <path v-for="(_, index) in tasks" :key="`connector-${index}`" :d="connectorPath(index)"/>
            </svg>
            <div class="processor"><div><b>上链<br/>处理器</b><small>HASH / 区块</small></div></div>
            <div class="block-write-visual" aria-label="区块写入状态">
              <svg class="write-links" viewBox="0 0 244 292" preserveAspectRatio="none" aria-hidden="true">
                <line class="write-link-cyan" x1="108" y1="80" x2="144" y2="142"/>
                <line class="write-link-cyan" x1="160" y1="170" x2="196" y2="232"/>
              </svg>
              <article v-for="(block, index) in blockCards" :key="'block-' + index" class="write-block" :class="[`block-${index + 1}`, { active: index === pulse % 3, latest: index === blockCards.length - 1 }]">
                <b>{{ blockDisplay(block, index) }}</b>
                <small>root:<span>{{ block.root }}</span></small>
                <small>tx {{ block.tx }}<span> / {{ block.time }}</span></small>
              </article>
            </div>
          </div>
          <div class="contracts"><h3>业务智能合约</h3><div class="contract-grid"><article v-for="item in contracts" :key="item.title"><b>{{ item.title }}</b><strong>{{ item.value }}</strong><small>{{ item.description }}</small></article></div></div>
        </section>

        <div class="right-column">
          <section class="panel chain-panel"><h2>链上数据动态</h2><div class="chain-table table-head" :style="chainGridStyle"><span v-for="column in chainColumns" :key="column">{{ column }}</span></div><div class="scroll-viewport"><div class="scroll-track chain-scroll"><div v-for="copy in 2" :key="copy" class="scroll-group"><div v-for="(row, index) in scrollingChainRows" :key="'row-' + copy + '-' + index" class="chain-table table-row" :style="chainGridStyle"><span v-for="column in chainColumns" :key="column">{{ row[column] ?? '' }}</span></div></div></div></div></section>
          <section class="panel chart-panel"><h2>验真与授权核验调用</h2><div class="chart-wrap"><svg viewBox="0 0 220 110" preserveAspectRatio="none"><path class="gridline" d="M0 90H220M0 55H220M0 20H220"/><polyline class="line verify" :points="chartPoints.verify"/><polyline class="line auth" :points="chartPoints.auth"/><circle cx="220" :cy="90 - (latestTrend.verify / 170) * 70" r="3" class="dot verify-dot"/><circle cx="220" :cy="90 - (latestTrend.auth / 170) * 70" r="3" class="dot auth-dot"/></svg></div><div class="chart-stats"><div v-for="item in verifyStats" :key="item.label"><span>{{ item.label }}</span><b>{{ item.value }}</b></div></div></section>
          <section class="panel node-panel"><h2>区块链节点监控</h2><div class="node-chart"><div v-for="node in nodeStates" :key="node.name" class="node-bar-item"><strong>{{ node.displayValue }}</strong><div class="node-bar-track"><i :class="{ unhealthy: !isHealthyStatus(node.status) }" :style="{ height: `${nodeBarHeight(node.value)}%` }"></i></div><span>{{ node.name }}</span><b :class="{ unhealthy: !isHealthyStatus(node.status) }">{{ node.status }}</b></div></div><p>正常节点 {{ nodeSummary.healthy }} 个，异常节点 {{ Math.max(0, nodeSummary.count - nodeSummary.healthy) }} 个。</p></section>
        </div>
      </section>

      <footer class="footer-grid"><article v-for="card in footerCards" :key="card.title"><b>{{ card.title }}</b><strong>{{ footerDisplay(card) }} <small>{{ card.suffix }}</small></strong><span>{{ card.description }}</span></article></footer>
    </main>
  </div>
</template>
