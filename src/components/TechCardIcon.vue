<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type: string
    size?: 'small' | 'large'
  }>(),
  {
    size: 'small',
  }
)

const iconKey = computed(() => {
  const t = props.type.trim()
  if (t.includes('来源') || t.includes('平台')) return 'platform'
  if (t.includes('数据类型') || t.includes('类型')) return 'dataType'
  if (t.includes('累计') || (t.includes('记录') && !t.includes('履约'))) return 'totalRecords'
  if (t.includes('今日')) return 'today'
  if (t.includes('验真') || t.includes('核验') || t.includes('凭证')) return 'verify'
  if (t.includes('高度') || t.includes('块高')) return 'height'
  if (t.includes('协同')) return 'consensus'
  if (t.includes('审计') || t.includes('留痕')) return 'audit'
  if (t.includes('履约') || t.includes('合约')) return 'contract'
  if (t.includes('节点共识') || t.includes('共识')) return 'consensus'
  if (t.includes('节点')) return 'nodes'
  if (t.includes('健康')) return 'health'
  if (t.includes('链上数据')) return 'chainData'
  return 'default'
})
</script>

<template>
  <div class="tech-icon-container" :class="[size, `icon-${iconKey}`]">
    <!-- Outer Holographic Ring with 3D glow -->
    <div class="icon-halo" aria-hidden="true"></div>

    <!-- 1. 接入来源平台 / 云端网关 -->
    <svg v-if="iconKey === 'platform'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="pGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#4facfe" />
        </linearGradient>
      </defs>
      <!-- Base platform diamond -->
      <polygon points="24,6 42,16 24,26 6,16" fill="url(#pGrad1)" fill-opacity="0.25" stroke="#00f2fe" stroke-width="1.5" />
      <polygon points="24,14 38,22 24,30 10,22" fill="url(#pGrad1)" fill-opacity="0.4" stroke="#38f9d7" stroke-width="1.2" />
      <polygon points="24,22 34,28 24,34 14,28" fill="#00f2fe" fill-opacity="0.6" stroke="#ffffff" stroke-width="1" />
      <!-- Vertical data pillars -->
      <line x1="24" y1="2" x2="24" y2="44" stroke="#00f2fe" stroke-width="1.5" stroke-dasharray="2 2" />
      <circle cx="24" cy="4" r="2.5" fill="#38f9d7" filter="drop-shadow(0 0 4px #38f9d7)" />
      <circle cx="24" cy="42" r="2" fill="#00f2fe" />
      <!-- Link satellites -->
      <circle cx="8" cy="24" r="2" fill="#00f2fe" />
      <circle cx="40" cy="24" r="2" fill="#00f2fe" />
      <line x1="8" y1="24" x2="16" y2="24" stroke="#00f2fe" stroke-width="1" />
      <line x1="32" y1="24" x2="40" y2="24" stroke="#00f2fe" stroke-width="1" />
    </svg>

    <!-- 2. 上链数据类型 / 3D多维数据魔方 -->
    <svg v-else-if="iconKey === 'dataType'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="cubeTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38f9d7" />
          <stop offset="100%" stop-color="#00f2fe" />
        </linearGradient>
        <linearGradient id="cubeLeft" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#00c6ff" />
          <stop offset="100%" stop-color="#0072ff" />
        </linearGradient>
      </defs>
      <!-- Isometric 3D Cube -->
      <polygon points="24,8 40,17 24,26 8,17" fill="url(#cubeTop)" fill-opacity="0.75" stroke="#38f9d7" stroke-width="1.5" />
      <polygon points="8,17 24,26 24,42 8,33" fill="url(#cubeLeft)" fill-opacity="0.6" stroke="#00c6ff" stroke-width="1.5" />
      <polygon points="40,17 24,26 24,42 40,33" fill="#053246" fill-opacity="0.85" stroke="#00f2fe" stroke-width="1.5" />
      <!-- Internal Matrix Grid -->
      <line x1="16" y1="12.5" x2="32" y2="21.5" stroke="#ffffff" stroke-width="0.75" stroke-opacity="0.6" />
      <line x1="32" y1="12.5" x2="16" y2="21.5" stroke="#ffffff" stroke-width="0.75" stroke-opacity="0.6" />
      <circle cx="24" cy="17" r="1.5" fill="#ffffff" filter="drop-shadow(0 0 3px #ffffff)" />
      <!-- Mini floating sub-cube -->
      <polygon points="38,6 44,9.5 38,13 32,9.5" fill="#ffd200" fill-opacity="0.9" stroke="#fff" stroke-width="0.8" />
    </svg>

    <!-- 3. 累计上链记录 / 区块链总账本数据库 -->
    <svg v-else-if="iconKey === 'totalRecords'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0052d4" />
          <stop offset="50%" stop-color="#4364f7" />
          <stop offset="100%" stop-color="#6fb1fc" />
        </linearGradient>
      </defs>
      <!-- Cylindrical 3D database tiers -->
      <g>
        <ellipse cx="24" cy="14" rx="16" ry="5" fill="#00f2fe" fill-opacity="0.3" stroke="#00f2fe" stroke-width="1.5" />
        <path d="M8,14 v8 c0,2.76 7.16,5 16,5 s16,-2.24 16,-5 v-8" fill="#063347" fill-opacity="0.6" stroke="#00f2fe" stroke-width="1.5" />
        <path d="M8,22 v8 c0,2.76 7.16,5 16,5 s16,-2.24 16,-5 v-8" fill="#063347" fill-opacity="0.6" stroke="#00f2fe" stroke-width="1.5" />
        <path d="M8,30 v8 c0,2.76 7.16,5 16,5 s16,-2.24 16,-5 v-8" fill="#063347" fill-opacity="0.8" stroke="#38f9d7" stroke-width="1.5" />
      </g>
      <!-- Horizontal data light tracks -->
      <line x1="12" y1="19" x2="20" y2="19" stroke="#38f9d7" stroke-width="1.5" stroke-linecap="round" />
      <line x1="12" y1="27" x2="24" y2="27" stroke="#38f9d7" stroke-width="1.5" stroke-linecap="round" />
      <line x1="12" y1="35" x2="28" y2="35" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <circle cx="34" cy="19" r="1.5" fill="#38f9d7" />
      <circle cx="34" cy="27" r="1.5" fill="#38f9d7" />
      <circle cx="34" cy="35" r="1.5" fill="#ffd200" />
    </svg>

    <!-- 4. 今日上链记录 / 实时极速脉冲与闪电 -->
    <svg v-else-if="iconKey === 'today'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="speedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd200" />
          <stop offset="100%" stop-color="#ff7b00" />
        </linearGradient>
      </defs>
      <!-- Circular speedometer dial -->
      <path d="M10,34 A16,16 0 1,1 38,34" stroke="rgba(255,210,0,0.3)" stroke-width="3" stroke-linecap="round" />
      <path d="M10,34 A16,16 0 1,1 34,16" stroke="url(#speedGrad)" stroke-width="3" stroke-linecap="round" filter="drop-shadow(0 0 6px rgba(255,210,0,0.6))" />
      <!-- Center lightning bolt -->
      <polygon points="26,10 16,24 23,24 21,38 32,22 25,22" fill="url(#speedGrad)" stroke="#ffffff" stroke-width="1" filter="drop-shadow(0 0 5px #ffd200)" />
      <circle cx="24" cy="24" r="2" fill="#ffffff" />
    </svg>

    <!-- 5. 验真调用 / 国密密码盾徽与验真激光 -->
    <svg v-else-if="iconKey === 'verify'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38f9d7" />
          <stop offset="100%" stop-color="#43e97b" />
        </linearGradient>
      </defs>
      <!-- 3D Security Shield -->
      <path d="M24,6 L38,12 C38,26 24,38 24,42 C24,38 10,26 10,12 Z" fill="#042c36" fill-opacity="0.8" stroke="url(#shieldGrad)" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(56,249,215,0.4))" />
      <path d="M24,11 L34,15 C34,24 24,33 24,36 C24,33 14,24 14,15 Z" fill="url(#shieldGrad)" fill-opacity="0.25" stroke="#38f9d7" stroke-width="1" />
      <!-- Glowing Checkmark / Cipher Key -->
      <path d="M19,22 L23,26 L30,17" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 4px #ffffff)" />
    </svg>

    <!-- 6. 最新区块高度 / 块高天梯叠层 -->
    <svg v-else-if="iconKey === 'height'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="heightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffd200" />
          <stop offset="100%" stop-color="#00f2fe" />
        </linearGradient>
      </defs>
      <!-- Stacking 3D Isometric blocks tower -->
      <!-- Bottom block -->
      <polygon points="24,28 38,34 24,40 10,34" fill="#083849" stroke="#00f2fe" stroke-width="1.2" />
      <polygon points="10,34 24,40 24,44 10,38" fill="#041f2a" stroke="#00f2fe" stroke-width="1" />
      <polygon points="38,34 24,40 24,44 38,38" fill="#02141c" stroke="#00f2fe" stroke-width="1" />
      <!-- Middle block -->
      <polygon points="24,18 38,24 24,30 10,24" fill="#094a61" stroke="#38f9d7" stroke-width="1.2" />
      <polygon points="10,24 24,30 24,34 10,28" fill="#052c3b" stroke="#38f9d7" stroke-width="1" />
      <polygon points="38,24 24,30 24,34 38,28" fill="#031e28" stroke="#38f9d7" stroke-width="1" />
      <!-- Top latest block (Golden) -->
      <polygon points="24,8 38,14 24,20 10,14" fill="#ffd200" fill-opacity="0.8" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 0 6px #ffd200)" />
      <polygon points="10,14 24,20 24,24 10,18" fill="#d49b00" stroke="#ffd200" stroke-width="1" />
      <polygon points="38,14 24,20 24,24 38,18" fill="#8c6600" stroke="#ffd200" stroke-width="1" />
      <!-- Vertical Laser Ray -->
      <line x1="24" y1="2" x2="24" y2="8" stroke="#ffffff" stroke-width="2" stroke-linecap="round" filter="drop-shadow(0 0 5px #ffffff)" />
    </svg>

    <!-- 7. 业务智能合约 / 全息芯片与合约代码 -->
    <svg v-else-if="iconKey === 'contract'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#38f9d7" />
        </linearGradient>
      </defs>
      <!-- Square Microchip Body -->
      <rect x="12" y="12" width="24" height="24" rx="3" fill="#052b36" stroke="url(#chipGrad)" stroke-width="1.8" filter="drop-shadow(0 0 6px rgba(0,242,254,0.4))" />
      <rect x="17" y="17" width="14" height="14" rx="2" fill="url(#chipGrad)" fill-opacity="0.3" stroke="#38f9d7" stroke-width="1" />
      <!-- Chip Pins -->
      <line x1="6" y1="18" x2="12" y2="18" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="6" y1="24" x2="12" y2="24" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="6" y1="30" x2="12" y2="30" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="36" y1="18" x2="42" y2="18" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="36" y1="24" x2="42" y2="24" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="36" y1="30" x2="42" y2="30" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="18" y1="6" x2="18" y2="12" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="24" y1="6" x2="24" y2="12" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="30" y1="6" x2="30" y2="12" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="18" y1="36" x2="18" y2="42" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="24" y1="36" x2="24" y2="42" stroke="#00f2fe" stroke-width="1.5" />
      <line x1="30" y1="36" x2="30" y2="42" stroke="#00f2fe" stroke-width="1.5" />
      <!-- Inner Code Glyph -->
      <path d="M21 21 L19 24 L21 27" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
      <path d="M27 21 L29 24 L27 27" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    </svg>

    <!-- 8. 区块链节点 / P2P分布式星网 -->
    <svg v-else-if="iconKey === 'nodes'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38f9d7" />
          <stop offset="100%" stop-color="#00c6ff" />
        </linearGradient>
      </defs>
      <!-- Central Hub -->
      <circle cx="24" cy="24" r="5" fill="url(#nodeGrad)" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 0 8px #38f9d7)" />
      <!-- Orbital Nodes -->
      <g>
        <circle cx="24" cy="8" r="3.5" fill="#00f2fe" stroke="#ffffff" stroke-width="1" />
        <circle cx="38" cy="32" r="3.5" fill="#00f2fe" stroke="#ffffff" stroke-width="1" />
        <circle cx="10" cy="32" r="3.5" fill="#00f2fe" stroke="#ffffff" stroke-width="1" />
      </g>
      <!-- Interconnecting Laser Links -->
      <line x1="24" y1="24" x2="24" y2="8" stroke="#38f9d7" stroke-width="1.5" stroke-dasharray="2 2" />
      <line x1="24" y1="24" x2="38" y2="32" stroke="#38f9d7" stroke-width="1.5" stroke-dasharray="2 2" />
      <line x1="24" y1="24" x2="10" y2="32" stroke="#38f9d7" stroke-width="1.5" stroke-dasharray="2 2" />
      <polygon points="24,8 38,32 10,32" stroke="rgba(0,242,254,0.4)" stroke-width="1" fill="rgba(0,242,254,0.06)" />
    </svg>

    <!-- 9. 底层链健康 / 全息生命反应堆与心电脉冲 -->
    <svg v-else-if="iconKey === 'health'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="healthGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38f9d7" />
          <stop offset="100%" stop-color="#4facfe" />
        </linearGradient>
      </defs>
      <!-- Outer Hexagon ring -->
      <polygon points="24,4 42,14 42,34 24,44 6,34 6,14" fill="#042633" fill-opacity="0.85" stroke="url(#healthGrad)" stroke-width="1.8" filter="drop-shadow(0 0 8px rgba(56,249,215,0.4))" />
      <polygon points="24,8 38,16 38,32 24,40 10,32 10,16" fill="url(#healthGrad)" fill-opacity="0.15" stroke="rgba(56,249,215,0.4)" stroke-width="1" />
      <!-- ECG Heartbeat Pulse Line -->
      <path d="M11,24 L17,24 L20,16 L24,32 L28,20 L31,24 L37,24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 5px #38f9d7)" />
      <circle cx="24" cy="32" r="2" fill="#38f9d7" />
    </svg>

    <!-- 10. 节点共识 / 3D轨道共识星轮 -->
    <svg v-else-if="iconKey === 'consensus'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="consGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#38f9d7" />
        </linearGradient>
      </defs>
      <!-- 3D Inclined Orbital Rings -->
      <ellipse cx="24" cy="24" rx="18" ry="8" stroke="url(#consGrad)" stroke-width="1.5" transform="rotate(-30 24 24)" filter="drop-shadow(0 0 6px rgba(0,242,254,0.5))" />
      <ellipse cx="24" cy="24" rx="18" ry="8" stroke="url(#consGrad)" stroke-width="1.5" transform="rotate(30 24 24)" />
      <!-- Central Quantum Core -->
      <circle cx="24" cy="24" r="5.5" fill="#ffffff" filter="drop-shadow(0 0 8px #00f2fe)" />
      <!-- Satellites on Orbit -->
      <circle cx="10" cy="18" r="2.5" fill="#38f9d7" filter="drop-shadow(0 0 4px #38f9d7)" />
      <circle cx="38" cy="30" r="2.5" fill="#00f2fe" />
      <circle cx="34" cy="12" r="2" fill="#ffd200" />
    </svg>

    <!-- 11. 链上数据 / 100% 存证金钻保险库 -->
    <svg v-else-if="iconKey === 'chainData'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="diaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38f9d7" />
          <stop offset="50%" stop-color="#00f2fe" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <!-- 3D Sparkling Crystal Facets -->
      <polygon points="24,6 38,16 24,42 10,16" fill="#063242" stroke="url(#diaGrad)" stroke-width="1.8" filter="drop-shadow(0 0 8px rgba(56,249,215,0.5))" />
      <polygon points="10,16 24,6 38,16" fill="url(#diaGrad)" fill-opacity="0.4" stroke="#ffffff" stroke-width="1" />
      <polygon points="24,6 18,16 24,42" fill="url(#diaGrad)" fill-opacity="0.6" stroke="#38f9d7" stroke-width="1" />
      <polygon points="24,6 30,16 24,42" fill="url(#diaGrad)" fill-opacity="0.8" stroke="#ffffff" stroke-width="1" />
      <!-- Security lock symbol badge -->
      <circle cx="24" cy="22" r="4.5" fill="#031b24" stroke="#ffd200" stroke-width="1.2" />
      <path d="M22,22 h4 v4 h-4 Z" fill="#ffd200" />
      <path d="M23,22 v-2 a1,1 0 0,1 2,0 v2" stroke="#ffd200" stroke-width="1" fill="none" />
    </svg>

    <!-- 12. 审计留痕 / 防篡改数字印章与指纹链 -->
    <svg v-else-if="iconKey === 'audit'" class="tech-svg" viewBox="0 0 48 48" fill="none">
      <defs>
        <linearGradient id="auditGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c471ed" />
          <stop offset="50%" stop-color="#f64f59" />
          <stop offset="100%" stop-color="#ffd200" />
        </linearGradient>
      </defs>
      <!-- Outer Hex/Octagon Stamp -->
      <circle cx="24" cy="24" r="18" stroke="url(#auditGrad)" stroke-width="1.8" stroke-dasharray="4 2" filter="drop-shadow(0 0 6px rgba(196,113,237,0.5))" />
      <circle cx="24" cy="24" r="14" fill="#200d33" fill-opacity="0.75" stroke="#c471ed" stroke-width="1" />
      <!-- Concentric Hash Fingerprint arcs -->
      <path d="M19,26 A6,6 0 0,1 29,26" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" />
      <path d="M17,29 A9,9 0 0,1 31,29" stroke="#38f9d7" stroke-width="1.5" stroke-linecap="round" />
      <path d="M21,23 A3,3 0 0,1 27,23" stroke="#ffd200" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
    </svg>

    <!-- Fallback Default -->
    <svg v-else class="tech-svg" viewBox="0 0 48 48" fill="none">
      <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" stroke="#00f2fe" stroke-width="1.5" fill="rgba(0,242,254,0.15)" />
      <circle cx="24" cy="24" r="6" fill="#38f9d7" />
    </svg>
  </div>
</template>

<style scoped>
.tech-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 4px;
  background: radial-gradient(circle, rgba(0, 242, 254, 0.14) 0%, rgba(3, 20, 29, 0.6) 80%);
  border: 1px solid rgba(0, 242, 254, 0.35);
  box-shadow: inset 0 0 12px rgba(0, 242, 254, 0.15), 0 2px 8px rgba(0, 0, 0, 0.4);
  transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  transform-style: preserve-3d;
}

/* Small size for Top 8 Metrics Cards */
.tech-icon-container.small {
  width: 36px;
  height: 36px;
}

.tech-icon-container.small .tech-svg {
  width: 26px;
  height: 26px;
}

/* Large size for Bottom 5 Footer Cards */
.tech-icon-container.large {
  width: 50px;
  height: 50px;
  border-radius: 6px;
}

.tech-icon-container.large .tech-svg {
  width: 36px;
  height: 36px;
}

/* Ambient Halo */
.icon-halo {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 1px dashed rgba(0, 242, 254, 0.3);
  pointer-events: none;
  animation: halo-spin 18s linear infinite;
  opacity: 0.7;
}

@keyframes halo-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tone Customizations */
.icon-today {
  border-color: rgba(255, 210, 0, 0.45);
  background: radial-gradient(circle, rgba(255, 210, 0, 0.18) 0%, rgba(30, 22, 4, 0.7) 80%);
}
.icon-today .icon-halo {
  border-color: rgba(255, 210, 0, 0.4);
}

.icon-audit {
  border-color: rgba(196, 113, 237, 0.45);
  background: radial-gradient(circle, rgba(196, 113, 237, 0.18) 0%, rgba(28, 8, 38, 0.7) 80%);
}
.icon-audit .icon-halo {
  border-color: rgba(196, 113, 237, 0.4);
}

.icon-health,
.icon-verify,
.icon-chainData {
  border-color: rgba(56, 249, 215, 0.45);
  background: radial-gradient(circle, rgba(56, 249, 215, 0.18) 0%, rgba(2, 28, 32, 0.7) 80%);
}

.tech-icon-container:hover {
  transform: scale(1.1) translateZ(10px) rotate(4deg);
  border-color: #00f2fe;
  box-shadow: inset 0 0 16px rgba(0, 242, 254, 0.3), 0 0 14px rgba(0, 242, 254, 0.5);
}
</style>
