
// 函數來生成符合常態分佈的隨機數
function generateRandomNormalDistribution(mean, stdDev) {
  let u = 0; let v = 0
  while (u === 0) u = Math.random() // 防止 u 為 0
  while (v === 0) v = Math.random() // 防止 v 為 0
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return mean + stdDev * z
}

// 取樣次數
const sampleCount = 1000000

// 民調 p, q
const p = 0.3355
const q = 0.3

// 民調誤差範圍
const pollError = 0.03

// 可信度
const confidence = 0.95

function main() {
  /* let winCount = 0
  for (let i = 0; i < sampleCount; i++) {
    const pSample = generateRandomNormalDistribution(p, pollError / 1.96)
    const qSample = generateRandomNormalDistribution(q, pollError / 1.96)
    if (pSample > qSample) {
      winCount += 1
    }
  }

  const winProbability = winCount / sampleCount
  console.log(`p 實際贏的可能性: ${Math.round(winProbability * 10000) / 100}% 是否大於可信度: ${winProbability > confidence}`)
 */
  // 圖標 x 間隔單位
  const interval = 0.001


  // 產出 chart.js 格式
  // x 是差距，y 是數量
  const data = {}
  for (let i = 0; i < sampleCount; i++) {
    const pSample = generateRandomNormalDistribution(p, pollError / 1.96)
    const qSample = generateRandomNormalDistribution(q, pollError / 1.96)
    const diff = pSample - qSample
    const diffIndex = Math.round(diff / interval) * interval
    if (!data[diffIndex]) {
      data[diffIndex] = 0
    }
    data[diffIndex] += 1
  }
  console.log(data)

  // 找出平均
  const sum = Object.entries(data).reduce((acc, [diff, count]) => acc + (Number(diff) * count), 0)
  const avg = sum / sampleCount

  const maxDiff = avg + 0.1
  const minDiff = avg - 0.1

  const chartjsOutput = {
    type: 'line',
    data: {
      labels: Array.from({ length: Math.round((maxDiff - minDiff) / interval) }, (_, i) => Math.round((minDiff + (i * interval)) / interval) * interval)
          .map((diff) => `${Math.round(diff * 10000) / 100}%`),
      datasets: [{
        label: 'q > p',
        data: Array.from({ length: Math.round((maxDiff - minDiff) / interval) })
            .map((_, i) => (minDiff + (i * interval)) < 0 ? data[Math.round((minDiff + (i * interval)) / interval) * interval] || 0 : null),
      }, {
        label: 'p > q',
        data: Array.from({ length: Math.round((maxDiff - minDiff) / interval) })
            .map((_, i) => (minDiff + (i * interval)) > + 0 ? data[Math.round((minDiff + (i * interval)) / interval) * interval] || 0 : null),
      }],
    },
  }

  console.log(JSON.stringify(chartjsOutput))
}

main()
