<template>
  <q-page class="flex flex-center">
    <div class="q-pa-md example-row-equal-width">
      <div class="row">
        <div class="col">
              <div class="text-h6">讓3%？讓6%？模擬民調就知道</div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <div class="text-h8" v-for="pollExample in pollExamples" :key="pollExample.name">
            {{ pollExample.name }}, q：{{ pollExample.q }}%, p：{{ pollExample.p }}%, 抽樣數：{{ pollExample.n }}
            <q-btn outline size="sm" color="primary" label="套用" class="q-ma-md" @click="q = pollExample.q; p = pollExample.p; n = pollExample.n" />
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <q-input outlined v-model="q" label="民調 q 候選人（%百分比）" type="number" />
          <q-input outlined v-model="p" label="民調 p 候選人（%百分比）" type="number" />
        </div>
        <div class="col">
          <q-input outlined v-model="n" label="抽樣數" type="number" />
          <q-input outlined v-model="m" label="模擬次數" type="number" />
        </div>
      </div>
      <div class="row">
        <div class="col">
          <q-card class="q-pa-md">
            <q-card-section>
              <div class="text-h8">p std（標準差）：{{ pStd.toFixed(4) }}</div>
              <div class="text-h8">q std（標準差）：{{ qStd.toFixed(4) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <div class="text-h6">結論：{{this.q > this.p ? 'q 勝 p' : 'p 勝 q'}}，{{ diffPercentage >= 0.95 ? '且超過誤差範圍' : '旦在誤差範圍內'}}</div>
          <div class="text-h7">此為模擬數值，可能每次模擬結果皆不同</div>
        </div>
      </div>
      <div class="row">
        <div class="col">
          <LineChartGenerator
            :chart-data="qChartData"
            :width="chartWidth"
            />
        </div>
      </div>
      <div class="row">
        <div class="col">
          <LineChartGenerator
            :chart-data="pChartData"
            :width="chartWidth"
            />
        </div>
      </div>
      <div class="row">
        <div class="col">
          <div class="text-h7">模擬 q > p 佔比：{{ (diffPercentage * 100).toFixed(2) }}%（大於 95% 代表超過誤差範圍）</div>
          <LineChartGenerator
            :chart-data="diffChartData"
            :width="chartWidth"
            />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
} from 'chart.js'
import { Line as LineChartGenerator } from 'vue-chartjs/legacy'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement
);

export default {
  name: 'PageIndex',
  components: {
    LineChartGenerator,
  },
  data () {
    return {
      interval: 0.001,
      q: 34.5,
      p: 30.2,
      // 抽樣數
      n: 1068,
      // 模擬次數
      m: 10000,
      // 民調範例
      pollExamples: [
        {
          name: '民調A',
          q: 48.30,
          p: 46.10,
          n: 2046,
        },
        {
          name: '民調B',
          q: 41.00,
          p: 42.00,
          n: 1149,
        },
        {
          name: '民調C',
          q: 46.60,
          p: 46.50,
          n: 1112,
        },
        {
          name: '民調D',
          q: 46.01,
          p: 40.82,
          n: 1112,
        },
        {
          name: '民調E',
          q: 44.00,
          p: 39.70,
          n: 1082,
        },
        {
          name: '民調F',
          q: 38.80,
          p: 38.20,
          n: 1484,
        }
      ],
      chartWidth: this.$q.screen.width > 600 ? 600 : this.$q.screen.width - 100,
    }
  },
  computed: {
    // 計算 p 標準差
    pStd () {
      return Math.sqrt((this.p * 0.01) * (1 - (this.p * 0.01)) / this.n)
    },
    // 計算 q 標準差
    qStd () {
      return Math.sqrt(this.q * 0.01 * (1 - (this.q * 0.01)) / this.n)
    },
    // 模擬數值
    simulateData () {
      const simulateData = []
      for (let i = 0; i < this.m; i++) {
        const p = this.generateRandomNormalDistribution(this.p * 0.01, this.pStd)
        const q = this.generateRandomNormalDistribution(this.q * 0.01, this.qStd)
        simulateData.push({
          q: q,
          p: p,
          diff: (q - p),
        })
      }
      return simulateData
    },
    qChartData () {
      const sum = this.simulateData.reduce((acc, cur) => acc + cur.q, 0)
      const avg = sum / this.m
      const std = Math.sqrt(
        this.simulateData.reduce((acc, cur) => acc + Math.pow(cur.q - avg, 2), 0) / this.m
      )

      const maxDiff = avg + std * 4
      const minDiff = avg - std * 4
      const interval = this.interval

      const labels = Array.from(
          { length: Math.round((maxDiff - minDiff) / interval) }, 
          (_, i) => Math.round((minDiff + (i * interval)) / interval) * interval
        )

      // 計算每個區間的數量
      const count = {}
      for (let i = 0; i < this.m; i++) {
        const label = Math.round(this.simulateData[i].q / interval) * interval
        if (count[label] === undefined) {
          count[label] = 1
        } else {
          count[label] += 1
        }
      }

      return {
        labels: labels.map((diff) => `${Math.round(diff * 10000) / 100}%`),
        datasets: [{
          label: 'q 實際民調模擬情況',
          data: labels.map((label) => count[label] || 0),
          borderColor: 'red',
        }],
      }
    },
    pChartData () {
      const sum = this.simulateData.reduce((acc, cur) => acc + cur.p, 0)
      const avg = sum / this.m
      const std = Math.sqrt(
        this.simulateData.reduce((acc, cur) => acc + Math.pow(cur.p - avg, 2), 0) / this.m
      )

      const maxDiff = avg + std * 4
      const minDiff = avg - std * 4
      const interval = this.interval

      const labels = Array.from(
          { length: Math.round((maxDiff - minDiff) / interval) }, 
          (_, i) => Math.round((minDiff + (i * interval)) / interval) * interval
        )

      // 計算每個區間的數量
      const count = {}
      for (let i = 0; i < this.m; i++) {
        const label = Math.round(this.simulateData[i].p / interval) * interval
        if (count[label] === undefined) {
          count[label] = 1
        } else {
          count[label] += 1
        }
      }

      return {
        labels: labels.map((diff) => `${Math.round(diff * 10000) / 100}%`),
        datasets: [{
          label: 'p 實際民調模擬情況',
          data: labels.map((label) => count[label] || 0),
          borderColor: 'blue',
        }],
      }
    },
    diffChartData () {
      const sum = this.simulateData.reduce((acc, cur) => acc + cur.diff, 0)
      const avg = sum / this.m
      const std = Math.sqrt(
        this.simulateData.reduce((acc, cur) => acc + Math.pow(cur.diff - avg, 2), 0) / this.m
      )

      const maxDiff = avg + std * 4
      const minDiff = avg - std * 4
      const interval = this.interval

      const labels = Array.from(
          { length: Math.round((maxDiff - minDiff) / interval) }, 
          (_, i) => Math.round((minDiff + (i * interval)) / interval) * interval
        )

      // 計算每個區間的數量
      const count = {}
      for (let i = 0; i < this.m; i++) {
        const label = Math.round(this.simulateData[i].diff / interval) * interval
        if (count[label] === undefined) {
          count[label] = 1
        } else {
          count[label] += 1
        }
      }

      return {
        labels: labels.map((diff) => `${Math.round(diff * 10000) / 100}%`),
        datasets: [
          {
            label: 'q > p',
            data: labels.map((label) => label >= 0 ? count[label] || 0 : null),
            borderColor: 'red',
          },
          {
            label: 'q < p',
            data: labels.map((label) => label < 0 ? count[label] || 0 : null),
            borderColor: 'blue',
          },
        ],
      }
    },
    // q > p 佔比
    diffPercentage () {
      const sum = 
        this.q > this.p
          ? this.simulateData.filter((data) => data.q > data.p).length
          : this.simulateData.filter((data) => data.q < data.p).length
      const avg = sum / this.m
      return avg
    },
  },
  // 函數
  methods: {
    generateRandomNormalDistribution(mean, stdDev) {
      let u = 0; let v = 0
      while (u === 0) u = Math.random() // 防止 u 為 0
      while (v === 0) v = Math.random() // 防止 v 為 0
      const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
      return mean + stdDev * z
    },
  },
}
</script>

<style lang="sass">
.example-row-equal-width
  .row > div
    padding: 10px 15px
  .row + .row
    margin-top: 1rem
</style>