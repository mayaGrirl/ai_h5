<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { receiveSalaryZ, receiveSalaryZAll, salaryZRecords } from '@/api/customer'
import { toast } from '@/composables/useToast'
import type { SalaryZRecordField } from '@/types/customer.type'
import dayjs from 'dayjs'
import { cn } from '@/utils'

const list = ref<SalaryZRecordField[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)
const receivingSet = ref<Set<number>>(new Set())
const receivingAll = ref(false)
const loadMoreRef = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const fetchData = async (pageNo: number) => {
  loading.value = true
  try {
    const { code, data, message } = await salaryZRecords({
      pagination: {
        page: pageNo,
        size: 20
      }
    })
    await new Promise((r) => setTimeout(r, 700))
    if (code === 200) {
      if (data.length < 20) {
        hasMore.value = false
      }
      if (pageNo === 1) {
        list.value = []
      }
      list.value = [...list.value, ...data]
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

const handleReceive = async (t: number) => {
  if (receivingSet.value.has(t)) return

  receivingSet.value = new Set(receivingSet.value).add(t)

  try {
    const { code, data, message } = await receiveSalaryZ(t)
    if (code === 200) {
      toast.success(message)
      list.value = list.value.map(item => item.id === t ? data : item)
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('领取失败')
  } finally {
    const next = new Set(receivingSet.value)
    next.delete(t)
    receivingSet.value = next
  }
}

const handleReceiveAll = async () => {
  receivingAll.value = true
  try {
    const { code, message } = await receiveSalaryZAll()
    if (code === 200) {
      toast.success(message)
      list.value = []
      page.value = 1
      hasMore.value = true
      await fetchData(1)
    } else {
      toast.error(message)
    }
  } catch (error) {
    toast.error('一键领取失败')
  } finally {
    receivingAll.value = false
  }
}

onMounted(async () => {
  await fetchData(1)

  if (loadMoreRef.value && hasMore.value) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading.value) {
          const nextPage = page.value + 1
          page.value = nextPage
          fetchData(nextPage)
        }
      },
      { threshold: 1 }
    )
    observer.observe(loadMoreRef.value)
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <div class="grid px-3">
    <button
      v-if="list.length > 0"
      @click="handleReceiveAll"
      :disabled="receivingAll"
      :class="[
        'mb-1 h-9 w-full rounded-full bg-gradient-to-r from-[#ff6a3a] to-[#ff1020] text-white font-medium transition active:scale-95',
        receivingAll ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
      ]"
    >
      {{ receivingAll ? '领取中...' : '一键领取' }}
    </button>
  </div>

  <div
    v-for="(item, index) in list"
    :key="`all-key-${index}`"
    class="grid grid-cols-[1.2fr_0.8fr] px-3 py-3 border-b text-sm items-center"
  >
    <div class="leading-tight">
      <div class="text-gray-500">
        周期: {{ dayjs.unix(item?.ctdateA || 0).format('YYYY-MM-DD') }} 至 {{ dayjs.unix(item?.ctdateB || 0).format('YYYY-MM-DD') }}
      </div>
      <div class="mt-0.5 text-gray-900">
        可领取工资 <span class="text-red-500 font-semibold ml-1">{{ item.coin }}</span>
        <img
          class="inline-block w-[13px] h-[13px]"
          src="/ranking/coin.png"
          alt="gold"
        />
      </div>
    </div>

    <div class="flex justify-end items-center gap-1 font-medium">
      <button
        v-if="item.status === 0"
        :class="cn(
          'px-2 py-1 text-xs rounded',
          receivingSet.has(item.id || 0)
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-500 text-white cursor-pointer'
        )"
        @click="handleReceive(item.id || 0)"
      >
        {{ receivingSet.has(item.id || 0) ? '领取中...' : '领取' }}
      </button>
      <div v-else class="grid justify-items-end">
        {{ item.status_label }}
        <div>({{ dayjs.unix(item?.gettime || 0).format('YYYY-MM-DD HH:mm') }})</div>
      </div>
    </div>
  </div>

  <!-- 底部哨兵 -->
  <div v-if="hasMore" ref="loadMoreRef" class="py-4 text-center text-xs text-gray-400">
    {{ loading ? '加载中...' : '上拉加载更多' }}
  </div>

  <div v-if="!hasMore" class="py-4 text-center text-xs text-gray-400">
    没有更多数据了
  </div>
</template>
