import { reactive, computed } from 'vue'

// 假資料課程清單
const state = reactive({
  courses: [
    {
      id: 1,
      title: '新人導向',
      description: '了解公司文化、願景與基本規範',
      category: '基礎訓練',
      required: true,
      durationMin: 60,
      tags: ['入職', '公司文化']
    },
    {
      id: 2,
      title: '資訊安全訓練',
      description: '學習密碼管理、釣魚郵件防範、社交工程意識',
      category: '基礎訓練',
      required: true,
      durationMin: 90,
      tags: ['資安', '必修']
    },
    {
      id: 3,
      title: '半導體製程基礎',
      description: '晶圓、光刻、蝕刻等核心流程入門課程',
      category: '專業技能',
      required: false,
      durationMin: 120,
      tags: ['半導體', '製程']
    },
    {
      id: 4,
      title: 'EUV 基礎安全',
      description: '極紫外光曝光機的操作安全規範',
      category: '專業技能',
      required: false,
      durationMin: 45,
      tags: ['EUV', '安全']
    },
    {
      id: 5,
      title: '職涯規劃與發展',
      description: '如何設定個人職涯目標與發展路徑',
      category: '職涯發展',
      required: false,
      durationMin: 75,
      tags: ['職涯', '發展']
    }
  ],
  // 紀錄每門課進度：0~100
  progress: JSON.parse(localStorage.getItem('training-progress') || '{}')
})

// 取得單一課程進度
function courseProgress(c) {
  return state.progress[c.id] || 0
}

// 更新進度
function updateProgress(id, value) {
  state.progress[id] = value
  localStorage.setItem('training-progress', JSON.stringify(state.progress))
}

// 計算摘要（必修平均完成度）
const summary = reactive({
  requiredAvg: computed(() => {
    const requiredCourses = state.courses.filter(c => c.required)
    if (!requiredCourses.length) return 0
    const total = requiredCourses.reduce((acc, c) => acc + courseProgress(c), 0)
    return Math.round(total / requiredCourses.length)
  })
})

export default {
  state,
  summary,
  courseProgress,
  updateProgress
}